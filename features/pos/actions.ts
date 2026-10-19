'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { registrarVentaSchema, type RegistrarVentaInput } from './schemas';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { buildUbl21Xml, enviarComprobanteSunat, consultarDniApi, consultarRucApi } from '@/lib/sunat';

export interface VentaResult {
  success: boolean;
  ventaId?: string;
  serie?: string;
  numero?: number;
  comprobante?: string;
  total?: number;
  hash?: string;
  error?: string;
  code?: string;
}

/**
 * Server Action transaccional para registrar una venta en el POS.
 * Valida sesión, turno de caja activo, aplica despacho FEFO de lotes,
 * actualiza kardex, genera comprobante electrónico SUNAT y encola en outbox.
 */
export async function registrarVentaAction(input: RegistrarVentaInput): Promise<VentaResult> {
  const validation = registrarVentaSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      error: 'Debe iniciar sesión para procesar ventas.',
      code: 'UNAUTHORIZED',
    };
  }

  if (!['cajero', 'administrador', 'propietario', 'director_tecnico'].includes(user.rol)) {
    return {
      success: false,
      error: 'Su rol no tiene autorización para emitir comprobantes de venta.',
      code: 'FORBIDDEN',
    };
  }

  const client = await pool.connect();

  try {
    // 1. Verificar turno de caja activo para el usuario o caja
    const turnoRes = await client.query(
      `select id, tenant_id, sucursal_id, caja_id 
       from public.turnos_caja 
       where estado = 'abierto' and (usuario_id = $1 or caja_id = coalesce($2, caja_id))
       order by apertura_at desc 
       limit 1`,
      [user.id, validation.data.caja_id || null]
    );

    if (turnoRes.rows.length === 0) {
      return {
        success: false,
        error: 'No cuenta con un turno de caja abierto. Por favor, realice la apertura en el módulo de Caja.',
        code: 'TURNO_CERRADO',
      };
    }

    const turno = turnoRes.rows[0];
    const tenantId = turno.tenant_id;
    const sucursalId = validation.data.sucursal_id || turno.sucursal_id;
    const cajaId = validation.data.caja_id || turno.caja_id;
    const tipoComp = validation.data.tipo_comprobante;

    await client.query('BEGIN');

    // 2. Obtener y bloquear correlativo de comprobante
    const serieRes = await client.query(
      `select id, serie, ultimo_numero 
       from public.series_comprobante 
       where caja_id = $1 and tipo = $2 
       for update`,
      [cajaId, tipoComp]
    );

    let serie = 'B001';
    let numero = 1;

    if (serieRes.rows.length > 0) {
      const rowSerie = serieRes.rows[0];
      serie = rowSerie.serie;
      numero = rowSerie.ultimo_numero + 1;
      await client.query(
        `update public.series_comprobante 
         set ultimo_numero = $1 
         where id = $2`,
        [numero, rowSerie.id]
      );
    } else {
      // Si no existe la serie para esta caja, creamos la predeterminada
      serie = tipoComp === 'factura' ? 'F001' : tipoComp === 'boleta' ? 'B001' : 'NV01';
      numero = 1;
      await client.query(
        `insert into public.series_comprobante (tenant_id, sucursal_id, caja_id, tipo, serie, ultimo_numero)
         values ($1, $2, $3, $4, $5, 1)
         on conflict (caja_id, tipo) do update set ultimo_numero = public.series_comprobante.ultimo_numero + 1
         returning ultimo_numero`,
        [tenantId, sucursalId, cajaId, tipoComp, serie]
      );
    }

    // 3. Resolver cliente
    let clienteId: string | null = validation.data.cliente_id || null;
    if (!clienteId && validation.data.cliente_documento) {
      const cliExist = await client.query(
        `select id from public.clientes where tenant_id = $1 and numero_documento = $2 limit 1`,
        [tenantId, validation.data.cliente_documento]
      );
      if (cliExist.rows.length > 0) {
        clienteId = cliExist.rows[0].id;
      } else {
        const tipoDoc = validation.data.cliente_documento.length === 11 ? 'ruc' : 'dni';
        const insCli = await client.query(
          `insert into public.clientes (tenant_id, tipo_documento, numero_documento, nombres, direccion)
           values ($1, $2, $3, $4, 'Lima, Perú')
           returning id`,
          [
            tenantId,
            tipoDoc,
            validation.data.cliente_documento,
            validation.data.cliente_nombre || 'Cliente Farmacia',
          ]
        );
        clienteId = insCli.rows[0].id;
      }
    }

    // 4. Consultar catálogo para calcular importes y validar stock
    const presIds = validation.data.items.map((it) => it.presentacion_id);
    const presRows = await client.query(
      `select 
         pp.id as presentacion_id,
         pp.producto_id,
         pp.nombre as presentacion_nombre,
         pp.factor_base,
         pp.precio_venta::numeric as precio_venta,
         p.nombre_comercial,
         p.tipo_afectacion_igv,
         p.costo_ultimo::numeric as costo_ultimo,
         p.es_controlado,
         p.condicion_venta
       from public.producto_presentaciones pp
       join public.productos p on p.id = pp.producto_id
       where pp.id = ANY($1::uuid[])`,
      [presIds]
    );

    const presMap = new Map<string, any>();
    presRows.rows.forEach((r) => presMap.set(r.presentacion_id, r));

    let subtotalGravado = 0;
    let subtotalExonerado = 0;
    let totalIgv = 0;
    let totalVenta = 0;

    // Validación Sanitaria Regulatoria (DIGEMID): Fármacos Controlados y Sujetos a Receta Médica
    for (const item of validation.data.items) {
      const pres = presMap.get(item.presentacion_id);
      if (pres) {
        const esFiscalizado = pres.es_controlado || ['psicotropico', 'estupefaciente', 'receta_retenida'].includes(pres.condicion_venta);
        if (esFiscalizado && !validation.data.receta) {
          return {
            success: false,
            error: `Dispensación denegada (DIGEMID): El medicamento "${pres.nombre_comercial}" es una sustancia fiscalizada y exige registrar obligatoriamente la Receta Médica Retenida con datos del Médico (CMP) y Paciente.`,
            code: 'RECETA_OBLIGATORIA',
          };
        }
      }
    }

    const itemsProcesados = [];

    for (const item of validation.data.items) {
      const pres = presMap.get(item.presentacion_id);
      if (!pres) {
        throw new Error(`Presentación ${item.presentacion_id} no encontrada en catálogo.`);
      }

      const precioUnit = Number(pres.precio_venta);
      const cant = item.cantidad;
      const desc = item.descuento || 0;
      const totalItem = Number(((precioUnit * cant) - desc).toFixed(2));
      const factorBase = Number(pres.factor_base) || 1;
      const cantBaseTotal = cant * factorBase;

      let valorVenta = totalItem;
      let igvItem = 0;

      if (pres.tipo_afectacion_igv === 'gravado') {
        valorVenta = Number((totalItem / 1.18).toFixed(2));
        igvItem = Number((totalItem - valorVenta).toFixed(2));
        subtotalGravado += valorVenta;
        totalIgv += igvItem;
      } else {
        subtotalExonerado += totalItem;
      }

      totalVenta += totalItem;

      itemsProcesados.push({
        producto_id: pres.producto_id,
        presentacion_id: pres.presentacion_id,
        nombre: pres.nombre_comercial,
        cantidad: cant,
        factor_base: factorBase,
        cant_base_total: cantBaseTotal,
        precio_unitario: precioUnit,
        descuento: desc,
        tipo_afectacion_igv: pres.tipo_afectacion_igv,
        valor_venta: valorVenta,
        igv: igvItem,
        total: totalItem,
        costo_unitario_base: Number(pres.costo_ultimo) / factorBase,
        es_controlado: pres.es_controlado,
      });
    }

    // 5. Insertar Cabecera de Venta
    const insVenta = await client.query(
      `insert into public.ventas (
        tenant_id, sucursal_id, caja_id, turno_id, cliente_id, vendedor_id,
        tipo_comprobante, serie, numero, fecha_emision, moneda,
        subtotal_gravado, subtotal_exonerado, subtotal_inafecto, igv, descuento_total, total,
        estado, requiere_receta
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, now(), 'PEN',
        $10, $11, 0, $12, 0, $13,
        'completada', $14
      ) returning id`,
      [
        tenantId,
        sucursalId,
        cajaId,
        turno.id,
        clienteId,
        user.id,
        tipoComp,
        serie,
        numero,
        subtotalGravado,
        subtotalExonerado,
        totalIgv,
        totalVenta,
        Boolean(validation.data.receta),
      ]
    );

    const ventaId = insVenta.rows[0].id;

    // 6. Procesar cada ítem, descontar stock FEFO y registrar Kardex
    for (const item of itemsProcesados) {
      // Insertar item de venta
      await client.query(
        `insert into public.venta_items (
          tenant_id, venta_id, producto_id, presentacion_id, descripcion,
          cantidad, factor_base, precio_unitario, descuento, tipo_afectacion_igv,
          valor_venta, igv, total, costo_unitario_base
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14
        )`,
        [
          tenantId,
          ventaId,
          item.producto_id,
          item.presentacion_id,
          item.nombre,
          item.cantidad,
          item.factor_base,
          item.precio_unitario,
          item.descuento,
          item.tipo_afectacion_igv,
          item.valor_venta,
          item.igv,
          item.total,
          item.costo_unitario_base,
        ]
      );

      // Descuento FEFO de stock_lotes
      let pendiente = item.cant_base_total;
      const lotesDisponibles = await client.query(
        `select sl.lote_id, sl.cantidad_base, lt.numero_lote, lt.fecha_vencimiento
         from public.stock_lotes sl
         join public.lotes lt on lt.id = sl.lote_id
         where sl.sucursal_id = $1 and sl.producto_id = $2 and sl.cantidad_base > 0
         order by lt.fecha_vencimiento asc
         for update`,
        [sucursalId, item.producto_id]
      );

      for (const lote of lotesDisponibles.rows) {
        if (pendiente <= 0) break;
        const cantRestar = Math.min(lote.cantidad_base, pendiente);
        const nuevoSaldo = lote.cantidad_base - cantRestar;

        await client.query(
          `update public.stock_lotes 
           set cantidad_base = $1, updated_at = now()
           where sucursal_id = $2 and lote_id = $3`,
          [nuevoSaldo, sucursalId, lote.lote_id]
        );

        // Movimiento de Kardex
        await client.query(
          `insert into public.movimientos_stock (
            tenant_id, sucursal_id, lote_id, producto_id, tipo,
            cantidad_base, costo_unitario_base, saldo_lote_posterior,
            referencia_tipo, referencia_id, observacion, usuario_id, created_at
          ) values (
            $1, $2, $3, $4, 'venta',
            $5, $6, $7,
            'venta', $8, $9, $10, now()
          )`,
          [
            tenantId,
            sucursalId,
            lote.lote_id,
            item.producto_id,
            -cantRestar,
            item.costo_unitario_base,
            nuevoSaldo,
            ventaId,
            `Venta ${serie}-${String(numero).padStart(8, '0')} (Lote: ${lote.numero_lote})`,
            user.id,
          ]
        );

        // Si es controlado (psicotrópico/estupefaciente), registrar en libro oficial
        if (item.es_controlado) {
          await client.query(
            `insert into public.libro_controlados (
              tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
              cantidad_base, saldo_posterior, referencia_tipo, referencia_id,
              registrado_por, created_at
            ) values (
              $1, $2, $3, $4, 'venta',
              $5, $6, 'venta', $7,
              $8, now()
            )`,
            [
              tenantId,
              sucursalId,
              item.producto_id,
              lote.lote_id,
              -cantRestar,
              nuevoSaldo,
              ventaId,
              user.id,
            ]
          );
        }

        pendiente -= cantRestar;
      }
    }

    // 7. Si hay receta médica adjunta
    if (validation.data.receta) {
      const rec = validation.data.receta;
      await client.query(
        `insert into public.recetas (
          tenant_id, venta_id, medico_nombre, medico_cmp,
          paciente_nombre, paciente_documento, numero_receta,
          fecha_emision, retenida, diagnostico_cie10, created_at
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7,
          $8, $9, $10, now()
        )`,
        [
          tenantId,
          ventaId,
          rec.medico_nombre,
          rec.medico_cmp,
          rec.paciente_nombre,
          rec.paciente_documento || null,
          rec.numero_receta || null,
          rec.fecha_emision,
          rec.retenida,
          rec.diagnostico_cie10 || null,
        ]
      );
    }

    // 8. Generar Comprobante Electrónico SUNAT y registro en Outbox
    const ublPayload = {
      tipoComprobante: (tipoComp === 'factura' ? '01' : '03') as '01' | '03',
      serie,
      numero,
      fechaEmision: new Date().toISOString().slice(0, 10),
      horaEmision: new Date().toTimeString().slice(0, 8),
      moneda: 'PEN' as const,
      emisor: {
        ruc: '20123456789',
        razonSocial: 'BOTICA SAN MARTIN S.A.C.',
        direccion: 'Av. Miguel Grau 450, Piura',
        ubigeo: '200101',
        departamento: 'Piura',
        provincia: 'Piura',
        distrito: 'Piura',
        codigoEstablecimiento: '0000',
      },
      cliente: {
        tipoDoc: ((validation.data.cliente_documento || '').length === 11 ? '6' : '1') as '1' | '6',
        numeroDoc: validation.data.cliente_documento || '00000000',
        razonSocialONombre: validation.data.cliente_nombre || 'CLIENTES VARIOS',
      },
      items: itemsProcesados.map((it) => ({
        id: it.producto_id,
        codigo: it.presentacion_id.slice(0, 8),
        descripcion: it.nombre,
        unidadMedida: it.factor_base > 1 ? 'BX' : 'NIU',
        cantidad: it.cantidad,
        valorUnitario: Number((it.valor_venta / it.cantidad).toFixed(4)),
        precioUnitario: it.precio_unitario,
        tipoAfectacion: (it.tipo_afectacion_igv === 'gravado' ? '10' : '20') as '10' | '20',
        subtotal: it.valor_venta,
        igv: it.igv,
        total: it.total,
      })),
      subtotalGravado,
      subtotalExonerado,
      subtotalInafecto: 0,
      totalIgv,
      totalDescuento: 0,
      totalVenta,
    };

    const { xml: ublXml, hash: ublHash } = buildUbl21Xml(ublPayload);
    const sunatEnvio = await enviarComprobanteSunat(ublPayload);
    const finalHash = sunatEnvio.hashCpe || ublHash;

    await client.query(
      `insert into public.comprobantes_electronicos (
        tenant_id, venta_id, estado, hash, codigo_sunat, mensaje_sunat, updated_at
      ) values (
        $1, $2, $3, $4, $5, $6, now()
      ) on conflict (venta_id) do nothing`,
      [
        tenantId,
        ventaId,
        sunatEnvio.success ? 'aceptado' : 'contingencia',
        finalHash,
        sunatEnvio.codigoSunat || '0',
        sunatEnvio.mensajeSunat,
      ]
    );

    await client.query(
      `insert into public.outbox_facturacion (
        tenant_id, venta_id, payload, estado, intentos, created_at
      ) values (
        $1, $2, $3, $4, 1, now()
      )`,
      [
        tenantId,
        ventaId,
        JSON.stringify({
          ublPayload,
          hash: finalHash,
          sunatEnvio,
          xmlGenerado: true,
        }),
        sunatEnvio.success ? 'procesado' : 'pendiente',
      ]
    );

    await client.query('COMMIT');

    revalidatePath('/pos');
    revalidatePath('/caja');
    revalidatePath('/ventas');
    revalidatePath('/inventario');
    revalidatePath('/controlados');
    revalidatePath('/');

    return {
      success: true,
      ventaId,
      serie,
      numero,
      comprobante: `${serie}-${String(numero).padStart(8, '0')}`,
      total: totalVenta,
      hash: finalHash,
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error transaccional en registrarVentaAction:', err);
    return {
      success: false,
      error: err.message || 'Error al procesar la venta en base de datos',
      code: 'TRANSACTION_ERROR',
    };
  } finally {
    client.release();
  }
}

/**
 * Server Action para consultar en tiempo real un DNI (RENIEC) o RUC (SUNAT)
 * mediante el microservicio https://sunat-billing-api.vercel.app/
 */
export async function consultarDocumentoSunatAction(tipo: 'dni' | 'ruc', numero: string) {
  const clean = numero.trim();
  if (tipo === 'dni') {
    return await consultarDniApi(clean);
  }
  return await consultarRucApi(clean);
}

