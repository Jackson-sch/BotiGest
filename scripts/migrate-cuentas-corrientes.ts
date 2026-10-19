import { query } from '../lib/db';

async function migrate() {
  console.log('Aplicando migracion para Clientes y Cuentas Corrientes...');
  
  await query(`
    alter table public.clientes
      add column if not exists tiene_credito boolean not null default false,
      add column if not exists limite_credito numeric(12,2) not null default 0.00,
      add column if not exists dias_credito integer not null default 30,
      add column if not exists saldo_deudor numeric(12,2) not null default 0.00,
      add column if not exists alergias text,
      add column if not exists condicion_medica text,
      add column if not exists notas text;

    create table if not exists public.cuentas_corrientes_movimientos (
      id                      uuid primary key default gen_random_uuid(),
      tenant_id               uuid not null references public.tenants(id) on delete cascade,
      sucursal_id             uuid references public.sucursales(id),
      cliente_id             uuid not null references public.clientes(id) on delete cascade,
      tipo_movimiento         text not null check (tipo_movimiento in ('cargo', 'abono', 'ajuste')),
      monto                   numeric(12,2) not null check (monto > 0),
      saldo_anterior          numeric(12,2) not null default 0.00,
      saldo_posterior         numeric(12,2) not null default 0.00,
      venta_id                uuid references public.ventas(id) on delete set null,
      comprobante_referencia  text,
      metodo_pago             text default 'efectivo',
      turno_caja_id           uuid references public.turnos_caja(id) on delete set null,
      registrado_por          uuid references public.perfiles(id) on delete set null,
      registrado_por_nombre   text,
      observaciones           text,
      created_at              timestamptz not null default now()
    );

    create index if not exists idx_cc_cliente on public.cuentas_corrientes_movimientos(cliente_id, created_at desc);
    create index if not exists idx_cc_tenant on public.cuentas_corrientes_movimientos(tenant_id);
  `);

  // Actualizar clientes existentes con líneas de crédito de ejemplo
  await query(`
    update public.clientes
    set tiene_credito = true, limite_credito = 1500.00, dias_credito = 30, saldo_deudor = 450.00
    where numero_documento = '20601234567'; -- Clínica Santa Isabel S.A.C.

    update public.clientes
    set tiene_credito = true, limite_credito = 300.00, dias_credito = 15, saldo_deudor = 85.50,
        alergias = 'Alérgica a Penicilina', condicion_medica = 'Hipertensión controlada'
    where numero_documento = '44556677'; -- María López Sandoval
  `);

  // Insertar movimientos históricos de cuenta corriente de prueba si no existen
  const rows = await query(`select count(*) as count from public.cuentas_corrientes_movimientos;`);
  if (parseInt(rows[0].count, 10) === 0) {
    const clientes = await query(`select id, numero_documento, tenant_id from public.clientes;`);
    const clinica = clientes.find((c: any) => c.numero_documento === '20601234567');
    const maria = clientes.find((c: any) => c.numero_documento === '44556677');

    if (clinica) {
      await query(`
        insert into public.cuentas_corrientes_movimientos 
          (tenant_id, cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, comprobante_referencia, metodo_pago, observaciones, created_at)
        values
          ($1, $2, 'cargo', 800.00, 0.00, 800.00, 'F001-000085', 'credito', 'Compra de sueros e insumos hospitalarios a crédito 30d', now() - interval '10 days'),
          ($1, $2, 'abono', 350.00, 800.00, 450.00, 'ABONO-0001', 'transferencia', 'Abono transferencia BCP Op. #892184', now() - interval '3 days');
      `, [clinica.tenant_id, clinica.id]);
    }

    if (maria) {
      await query(`
        insert into public.cuentas_corrientes_movimientos 
          (tenant_id, cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_posterior, comprobante_referencia, metodo_pago, observaciones, created_at)
        values
          ($1, $2, 'cargo', 85.50, 0.00, 85.50, 'B001-000142', 'credito', 'Medicamentos antihipertensivos a crédito de vecina', now() - interval '5 days');
      `, [maria.tenant_id, maria.id]);
    }
  }

  console.log('Migracion para Clientes y Cuentas Corrientes ejecutada con exito!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Error en migracion:', err);
  process.exit(1);
});
