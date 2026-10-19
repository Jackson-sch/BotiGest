'use server';

import { pool } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { guardarProductoSchema, type GuardarProductoInput } from './schemas';
import { revalidatePath } from 'next/cache';

export async function guardarProductoAction(rawInput: GuardarProductoInput): Promise<{ success: boolean; error?: string; productoId?: string }> {
  const validation = guardarProductoSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: 'Debe iniciar sesión para administrar productos.' };
  }

  if (!['director_tecnico', 'administrador', 'propietario', 'almacenero'].includes(user.rol)) {
    return {
      success: false,
      error: 'Su rol no tiene autorización para dar de alta o modificar fármacos en el catálogo.',
    };
  }

  const input = validation.data;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Obtener tenantId
    const tRes = await client.query(`select id from public.tenants where activo = true limit 1`);
    const tenantId = tRes.rows[0]?.id;
    if (!tenantId) throw new Error('Tenant activo no encontrado.');

    let productoId = input.id;

    if (productoId) {
      // 1. ACTUALIZAR PRODUCTO EXISTENTE
      await client.query(
        `update public.productos
         set 
           codigo_interno = $1,
           nombre_comercial = $2,
           nombre_generico = $3,
           concentracion = $4,
           forma_farmaceutica_id = $5,
           laboratorio_id = $6,
           categoria_id = $7,
           registro_sanitario = $8,
           condicion_venta = $9,
           es_controlado = $10,
           es_generico = $11,
           requiere_cadena_frio = $12,
           unidad_base = $13,
           tipo_afectacion_igv = $14,
           costo_ultimo = $15,
           activo = $16,
           updated_at = now()
         where id = $17 and tenant_id = $18`,
        [
          input.codigo_interno,
          input.nombre_comercial,
          input.nombre_generico || null,
          input.concentracion || null,
          input.forma_farmaceutica_id || null,
          input.laboratorio_id || null,
          input.categoria_id || null,
          input.registro_sanitario || null,
          input.condicion_venta,
          input.es_controlado,
          input.es_generico,
          input.requiere_cadena_frio,
          input.unidad_base,
          input.tipo_afectacion_igv,
          input.costo_ultimo,
          input.activo,
          productoId,
          tenantId,
        ]
      );
    } else {
      // 2. CREAR NUEVO PRODUCTO
      const insRes = await client.query(
        `insert into public.productos (
           tenant_id, codigo_interno, nombre_comercial, nombre_generico,
           concentracion, forma_farmaceutica_id, laboratorio_id, categoria_id,
           registro_sanitario, condicion_venta, es_controlado, es_generico,
           requiere_cadena_frio, unidad_base, tipo_afectacion_igv, costo_ultimo,
           costo_promedio, activo, created_at, updated_at
         ) values (
           $1, $2, $3, $4,
           $5, $6, $7, $8,
           $9, $10, $11, $12,
           $13, $14, $15, $16,
           $16, $17, now(), now()
         ) returning id`,
        [
          tenantId,
          input.codigo_interno,
          input.nombre_comercial,
          input.nombre_generico || null,
          input.concentracion || null,
          input.forma_farmaceutica_id || null,
          input.laboratorio_id || null,
          input.categoria_id || null,
          input.registro_sanitario || null,
          input.condicion_venta,
          input.es_controlado,
          input.es_generico,
          input.requiere_cadena_frio,
          input.unidad_base,
          input.tipo_afectacion_igv,
          input.costo_ultimo,
          input.activo,
        ]
      );
      productoId = insRes.rows[0].id;
    }

    // 3. GESTIONAR PRESENTACIONES
    // Para simplificar y mantener consistencia, eliminamos presentaciones huérfanas o actualizamos
    const currentPresIds = input.presentaciones.map((p) => p.id).filter(Boolean) as string[];
    
    if (productoId && currentPresIds.length > 0) {
      await client.query(
        `delete from public.producto_presentaciones
         where producto_id = $1 and id != all($2::uuid[])`,
        [productoId, currentPresIds]
      );
    } else if (productoId && currentPresIds.length === 0 && input.id) {
      await client.query(
        `delete from public.producto_presentaciones where producto_id = $1`,
        [productoId]
      );
    }

    for (const pres of input.presentaciones) {
      if (pres.id) {
        await client.query(
          `update public.producto_presentaciones
           set 
             nombre = $1,
             factor_base = $2,
             codigo_barras = $3,
             precio_venta = $4,
             es_default = $5,
             activo = $6,
             updated_at = now()
           where id = $7 and producto_id = $8`,
          [
            pres.nombre,
            pres.factor_base,
            pres.codigo_barras || null,
            pres.precio_venta,
            pres.es_default,
            pres.activo ?? true,
            pres.id,
            productoId,
          ]
        );
      } else {
        await client.query(
          `insert into public.producto_presentaciones (
             tenant_id, producto_id, nombre, factor_base,
             codigo_barras, precio_venta, es_default, activo, created_at, updated_at
           ) values (
             $1, $2, $3, $4,
             $5, $6, $7, $8, now(), now()
           )`,
          [
            tenantId,
            productoId,
            pres.nombre,
            pres.factor_base,
            pres.codigo_barras || null,
            pres.precio_venta,
            pres.es_default,
            pres.activo ?? true,
          ]
        );
      }
    }

    await client.query('COMMIT');

    revalidatePath('/productos');
    revalidatePath('/pos');
    revalidatePath('/inventario');

    return { success: true, productoId };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en guardarProductoAction:', err);
    return { success: false, error: err.message || 'Error al guardar el producto.' };
  } finally {
    client.release();
  }
}

export async function toggleEstadoProductoAction(id: string, activo: boolean): Promise<{ success: boolean; error?: string }> {
  const user = await getSessionUser();
  if (!user || !['director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return { success: false, error: 'No autorizado para cambiar el estado del fármaco.' };
  }

  const client = await pool.connect();
  try {
    await client.query(
      `update public.productos set activo = $1, updated_at = now() where id = $2`,
      [activo, id]
    );

    revalidatePath('/productos');
    revalidatePath('/pos');
    revalidatePath('/inventario');

    return { success: true };
  } catch (err: any) {
    console.error('Error en toggleEstadoProductoAction:', err);
    return { success: false, error: err.message || 'Error al cambiar estado del producto.' };
  } finally {
    client.release();
  }
}

export async function crearFormaFarmaceuticaAction(
  nombre: string,
  abreviatura?: string
): Promise<{ success: boolean; forma?: { id: number; nombre: string; abreviatura: string | null }; error?: string }> {
  const user = await getSessionUser();
  if (!user || !['director_tecnico', 'administrador', 'propietario'].includes(user.rol)) {
    return { success: false, error: 'No autorizado para agregar formas farmacéuticas.' };
  }

  const nombreLimpio = nombre?.trim();
  if (!nombreLimpio) {
    return { success: false, error: 'El nombre de la forma farmacéutica es obligatorio.' };
  }

  try {
    const res = await pool.query(
      `insert into public.formas_farmaceuticas (nombre, abreviatura)
       values ($1, $2)
       on conflict (nombre) do update set abreviatura = coalesce(excluded.abreviatura, public.formas_farmaceuticas.abreviatura)
       returning id, nombre, abreviatura;`,
      [nombreLimpio, abreviatura?.trim().toUpperCase() || null]
    );

    revalidatePath('/productos/nuevo');
    return { success: true, forma: res.rows[0] };
  } catch (err: any) {
    console.error('Error al crear forma farmacéutica:', err);
    return { success: false, error: err.message || 'Error al registrar forma farmacéutica.' };
  }
}

export interface ResultadoImportacion {
  success: boolean;
  totalProcesados: number;
  nuevos: number;
  actualizados: number;
  presentacionesRegistradas: number;
  errores: Array<{ fila: number; error: string }>;
  error?: string;
}

export async function importarProductosExcelAction(
  filas: import('@/lib/excel-export').FilaProductoImportar[]
): Promise<ResultadoImportacion> {
  const user = await getSessionUser();
  if (!user) {
    return {
      success: false,
      totalProcesados: 0,
      nuevos: 0,
      actualizados: 0,
      presentacionesRegistradas: 0,
      errores: [],
      error: 'Debe iniciar sesión para importar productos.',
    };
  }

  if (!['director_tecnico', 'administrador', 'propietario', 'almacenero'].includes(user.rol)) {
    return {
      success: false,
      totalProcesados: 0,
      nuevos: 0,
      actualizados: 0,
      presentacionesRegistradas: 0,
      errores: [],
      error: 'Su rol no tiene autorización para importar fármacos al catálogo.',
    };
  }

  if (!filas || filas.length === 0) {
    return {
      success: false,
      totalProcesados: 0,
      nuevos: 0,
      actualizados: 0,
      presentacionesRegistradas: 0,
      errores: [],
      error: 'No hay filas para procesar en el archivo.',
    };
  }

  const client = await pool.connect();
  const errores: Array<{ fila: number; error: string }> = [];
  let nuevos = 0;
  let actualizados = 0;
  let presentacionesRegistradas = 0;

  try {
    await client.query('BEGIN');

    // 1. Obtener tenant activo
    const tRes = await client.query(`select id from public.tenants where activo = true limit 1`);
    const tenantId = tRes.rows[0]?.id;
    if (!tenantId) throw new Error('Tenant activo no encontrado.');

    // 2. Pre-cargar caches para resolución ágil en memoria
    const labMap = new Map<string, string>();
    const labsRes = await client.query(
      `select id, lower(nombre) as nombre_lower from public.laboratorios where tenant_id = $1`,
      [tenantId]
    );
    for (const r of labsRes.rows) {
      labMap.set(r.nombre_lower, r.id);
    }

    const catMap = new Map<string, string>();
    const catRes = await client.query(
      `select id, lower(nombre) as nombre_lower from public.categorias where tenant_id = $1`,
      [tenantId]
    );
    for (const r of catRes.rows) {
      catMap.set(r.nombre_lower, r.id);
    }

    const formaMap = new Map<string, number>();
    const formasRes = await client.query(
      `select id, lower(nombre) as nombre_lower, lower(coalesce(abreviatura, '')) as abrev_lower from public.formas_farmaceuticas`
    );
    for (const r of formasRes.rows) {
      formaMap.set(r.nombre_lower, r.id);
      if (r.abrev_lower) formaMap.set(r.abrev_lower, r.id);
    }

    // Helper para resolver o crear Laboratorio
    const resolveLaboratorio = async (nombre?: string | null): Promise<string | null> => {
      const limpio = nombre?.trim();
      if (!limpio) return null;
      const key = limpio.toLowerCase();
      if (labMap.has(key)) return labMap.get(key)!;

      const ins = await client.query(
        `insert into public.laboratorios (tenant_id, nombre, activo)
         values ($1, $2, true)
         on conflict (tenant_id, nombre) do update set activo = true
         returning id;`,
        [tenantId, limpio]
      );
      const newId = ins.rows[0].id;
      labMap.set(key, newId);
      return newId;
    };

    // Helper para resolver o crear Categoría
    const resolveCategoria = async (nombre?: string | null): Promise<string | null> => {
      const limpio = nombre?.trim();
      if (!limpio) return null;
      const key = limpio.toLowerCase();
      if (catMap.has(key)) return catMap.get(key)!;

      const ins = await client.query(
        `insert into public.categorias (tenant_id, nombre)
         values ($1, $2)
         on conflict (tenant_id, nombre) do update set nombre = excluded.nombre
         returning id;`,
        [tenantId, limpio]
      );
      const newId = ins.rows[0].id;
      catMap.set(key, newId);
      return newId;
    };

    // Helper para resolver Forma Farmacéutica
    const resolveForma = async (nombre?: string | null): Promise<number | null> => {
      const limpio = nombre?.trim();
      if (!limpio) return null;
      const key = limpio.toLowerCase();
      if (formaMap.has(key)) return formaMap.get(key)!;

      // Búsqueda aproximada por coincidencia parcial
      for (const [fName, fId] of formaMap.entries()) {
        if (fName.includes(key) || key.includes(fName)) {
          return fId;
        }
      }

      // Si no existe, crear la forma farmacéutica
      const ins = await client.query(
        `insert into public.formas_farmaceuticas (nombre)
         values ($1)
         on conflict (nombre) do update set nombre = excluded.nombre
         returning id;`,
        [limpio]
      );
      const newId = ins.rows[0].id;
      formaMap.set(key, newId);
      return newId;
    };

    // Pre-cargar contador para generar códigos internos automáticos si faltan
    const countRes = await client.query(
      `select count(*) as cnt from public.productos where tenant_id = $1`,
      [tenantId]
    );
    let nextCodeSeq = parseInt(countRes.rows[0]?.cnt || '0', 10) + 1;

    // Procesar cada fila del Excel
    for (const item of filas) {
      if (!item.nombre_comercial?.trim()) {
        errores.push({ fila: item.fila, error: 'Falta el nombre comercial del medicamento.' });
        continue;
      }

      try {
        const labId = await resolveLaboratorio(item.laboratorio);
        const catId = await resolveCategoria(item.categoria);
        const formaId = await resolveForma(item.forma_farmaceutica);

        let codigo = item.codigo_interno?.trim();
        if (!codigo) {
          // Buscar si ya existe por nombre comercial y concentración
          const existByName = await client.query(
            `select codigo_interno from public.productos
             where tenant_id = $1 and lower(nombre_comercial) = lower($2)
               and coalesce(lower(concentracion), '') = coalesce(lower($3), '')
             limit 1`,
            [tenantId, item.nombre_comercial.trim(), item.concentracion?.trim() || '']
          );
          if (existByName.rows.length > 0) {
            codigo = existByName.rows[0].codigo_interno;
          } else {
            codigo = `MED-${String(nextCodeSeq).padStart(4, '0')}`;
            nextCodeSeq++;
          }
        }

        const esControlado =
          item.condicion_venta === 'psicotropico' || item.condicion_venta === 'estupefaciente';
        const costo = Number(item.costo_compra) || 0;

        // Upsert Producto
        const prodRes = await client.query(
          `insert into public.productos (
            tenant_id,
            codigo_interno,
            nombre_comercial,
            nombre_generico,
            concentracion,
            forma_farmaceutica_id,
            laboratorio_id,
            categoria_id,
            tipo_producto,
            registro_sanitario,
            condicion_venta,
            es_controlado,
            es_generico,
            requiere_cadena_frio,
            unidad_base,
            tipo_afectacion_igv,
            costo_ultimo,
            costo_promedio,
            activo,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, 'medicamento',
            $9, $10, $11, false, false, $12, 'gravado',
            $13, $13, true, now(), now()
          )
          on conflict (tenant_id, codigo_interno) do update set
            nombre_comercial = excluded.nombre_comercial,
            nombre_generico = coalesce(excluded.nombre_generico, public.productos.nombre_generico),
            concentracion = coalesce(excluded.concentracion, public.productos.concentracion),
            forma_farmaceutica_id = coalesce(excluded.forma_farmaceutica_id, public.productos.forma_farmaceutica_id),
            laboratorio_id = coalesce(excluded.laboratorio_id, public.productos.laboratorio_id),
            categoria_id = coalesce(excluded.categoria_id, public.productos.categoria_id),
            registro_sanitario = coalesce(excluded.registro_sanitario, public.productos.registro_sanitario),
            condicion_venta = excluded.condicion_venta,
            es_controlado = excluded.es_controlado,
            unidad_base = coalesce(excluded.unidad_base, public.productos.unidad_base),
            costo_ultimo = case when excluded.costo_ultimo > 0 then excluded.costo_ultimo else public.productos.costo_ultimo end,
            costo_promedio = case when excluded.costo_promedio > 0 then excluded.costo_promedio else public.productos.costo_promedio end,
            activo = true,
            updated_at = now()
          returning id, (xmax = 0) as is_new;`,
          [
            tenantId,
            codigo,
            item.nombre_comercial.trim(),
            item.nombre_generico?.trim() || null,
            item.concentracion?.trim() || null,
            formaId,
            labId,
            catId,
            item.registro_sanitario?.trim() || null,
            item.condicion_venta || 'sin_receta',
            esControlado,
            item.unidad_base?.trim().toUpperCase() || 'UNIDAD',
            costo,
          ]
        );

        const prodId = prodRes.rows[0].id;
        const isNew = prodRes.rows[0].is_new;
        if (isNew) {
          nuevos++;
        } else {
          actualizados++;
        }

        // Upsert Presentación
        const presNombre = item.presentacion_nombre?.trim() || 'Unidad';
        const factor = Math.max(1, Math.floor(Number(item.presentacion_factor) || 1));
        const precio = Math.max(0, Number(item.precio_venta) || 0);
        const barras = item.codigo_barras?.trim() || null;
        const esDefault = factor === 1 || presNombre.toLowerCase().includes('caja');

        await client.query(
          `insert into public.producto_presentaciones (
            tenant_id,
            producto_id,
            nombre,
            factor_base,
            codigo_barras,
            precio_venta,
            es_default,
            activo,
            created_at,
            updated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, true, now(), now()
          )
          on conflict (producto_id, nombre) do update set
            factor_base = excluded.factor_base,
            codigo_barras = coalesce(excluded.codigo_barras, public.producto_presentaciones.codigo_barras),
            precio_venta = case when excluded.precio_venta > 0 then excluded.precio_venta else public.producto_presentaciones.precio_venta end,
            activo = true,
            updated_at = now();`,
          [
            tenantId,
            prodId,
            presNombre,
            factor,
            barras,
            precio,
            esDefault,
          ]
        );
        presentacionesRegistradas++;
      } catch (rowErr: any) {
        errores.push({
          fila: item.fila,
          error: rowErr.message || 'Error al procesar fila.',
        });
      }
    }

    await client.query('COMMIT');

    revalidatePath('/productos');
    revalidatePath('/pos');
    revalidatePath('/inventario');

    return {
      success: true,
      totalProcesados: filas.length,
      nuevos,
      actualizados,
      presentacionesRegistradas,
      errores,
    };
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Error en importarProductosExcelAction:', err);
    return {
      success: false,
      totalProcesados: 0,
      nuevos: 0,
      actualizados: 0,
      presentacionesRegistradas: 0,
      errores,
      error: err.message || 'Error general al importar el catálogo desde Excel.',
    };
  } finally {
    client.release();
  }
}


