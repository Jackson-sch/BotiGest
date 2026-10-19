-- =====================================================================
-- BotiGest · Seed Data para Base de Datos de Botica (Perú)
-- Diseñado para pruebas en desarrollo local (Postgres 5433 / botica_db)
-- =====================================================================

-- Desactivar temporalmente triggers de auditoría si existieran
set session_replication_role = 'replica';

-- 1. TENANT DEMO (Botica San Martín)
insert into public.tenants (id, ruc, razon_social, nombre_comercial, plan, activo, configuracion)
values (
  'a0000000-0000-0000-0000-000000000001',
  '20123456789',
  'BOTICA SAN MARTIN S.A.C.',
  'Botica San Martín',
  'pro',
  true,
  '{"max_descuento_cajero_pct": 10, "igv_pct": 18}'::jsonb
) on conflict (id) do update set nombre_comercial = excluded.nombre_comercial;

-- 2. SUCURSALES
insert into public.sucursales (id, tenant_id, codigo, nombre, direccion, ubigeo, telefono, codigo_establecimiento_sunat, autorizacion_digemid, es_almacen, activo)
values 
(
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'SUC-01',
  'Sede Principal - Av. Grau',
  'Av. Miguel Grau N° 450, Piura',
  '200101',
  '073-324567',
  '0000',
  'AUT-DIRIS-2024-9981',
  false,
  true
),
(
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'SUC-02',
  'Sucursal 02 - Los Algarrobos',
  'Av. Los Algarrobos Mz. C Lote 12',
  '200101',
  '073-301122',
  '0001',
  'AUT-DIRIS-2025-1102',
  false,
  true
) on conflict (id) do nothing;

-- 3. PERFILES DE USUARIOS (Roles según normativa farmacéutica)
insert into public.perfiles (id, tenant_id, nombres, apellidos, dni, cqfp, rol, pin_hash, activo)
values
(
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Administrador',
  'General',
  '40112233',
  null,
  'administrador',
  '1234',
  true
),
(
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Alejandro',
  'Morales Reyes',
  '45667788',
  'CQFP 18452',
  'director_tecnico',
  '1845',
  true
),
(
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Carlos',
  'Rodríguez Vera',
  '70889900',
  null,
  'cajero',
  '0000',
  true
),
(
  'c0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'María',
  'García Torres',
  '48223344',
  null,
  'almacenero',
  '1111',
  true
) on conflict (id) do nothing;

-- Asignar Director Técnico a la sucursal 1
update public.sucursales
   set director_tecnico_id = 'c0000000-0000-0000-0000-000000000002'
 where id = 'b0000000-0000-0000-0000-000000000001';

-- Asignar usuarios a sucursal
insert into public.usuario_sucursal (perfil_id, sucursal_id, tenant_id)
values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- 4. CAJAS Y SERIES SUNAT (Series independientes por caja)
insert into public.cajas (id, tenant_id, sucursal_id, nombre, activo)
values 
(
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Caja 01 - Principal',
  true
),
(
  'd0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'Caja 02 - Rápida',
  true
) on conflict (id) do nothing;

insert into public.series_comprobante (tenant_id, sucursal_id, caja_id, tipo, serie, ultimo_numero)
values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'boleta', 'B001', 154),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'factura', 'F001', 82),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'nota_venta', 'NV01', 410)
on conflict do nothing;

-- 5. TURNO DE CAJA ABIERTO
insert into public.turnos_caja (id, tenant_id, sucursal_id, caja_id, usuario_id, estado, monto_apertura)
values (
  'e0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'd0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000003',
  'abierto',
  150.00
) on conflict (id) do nothing;

-- 6. PRINCIPIOS ACTIVOS GLOBALES (DCI)
insert into public.principios_activos (id, nombre, codigo_atc, es_antibiotico)
values
  ('10000000-0000-0000-0000-000000000001', 'Paracetamol', 'N02BE01', false),
  ('10000000-0000-0000-0000-000000000002', 'Amoxicilina', 'J01CA04', true),
  ('10000000-0000-0000-0000-000000000003', 'Ácido Clavulánico', 'J01CR02', true),
  ('10000000-0000-0000-0000-000000000004', 'Ibuprofeno', 'M01AE01', false),
  ('10000000-0000-0000-0000-000000000005', 'Clonazepam', 'N03AE01', false),
  ('10000000-0000-0000-0000-000000000006', 'Azitromicina', 'J01FA10', true),
  ('10000000-0000-0000-0000-000000000007', 'Morfina', 'N02AA01', false),
  ('10000000-0000-0000-0000-000000000008', 'Insulina NPH', 'A10AC01', false)
on conflict (nombre) do nothing;

-- 7. LABORATORIOS & CATEGORÍAS
insert into public.laboratorios (id, tenant_id, nombre, activo)
values
  ('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'GlaxoSmithKline (GSK)', true),
  ('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Laboratorios Portugal', true),
  ('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Medifarma S.A.', true),
  ('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'AC Farma', true),
  ('20000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Roche', true),
  ('20000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Genfar', true)
on conflict do nothing;

insert into public.categorias (id, tenant_id, nombre)
values
  ('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Analgésicos y Antipiréticos'),
  ('30000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Antibióticos y Antimicrobianos'),
  ('30000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Psicotrópicos Fiscalizados'),
  ('30000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Estupefacientes Fiscalizados')
on conflict do nothing;

-- 8. PRODUCTOS FARMACÉUTICOS
insert into public.productos (
  id, tenant_id, codigo_interno, nombre_comercial, nombre_generico, concentracion,
  laboratorio_id, categoria_id, tipo_producto, registro_sanitario, condicion_venta,
  es_controlado, es_generico, requiere_cadena_frio, unidad_base, tipo_afectacion_igv,
  costo_ultimo, costo_promedio, activo
)
values
(
  '40000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'MED-001',
  'Panadol Forte 500 mg',
  'Paracetamol',
  '500 mg',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'medicamento',
  'EN-01234',
  'sin_receta',
  false,
  false,
  false,
  'TABLETA',
  'gravado',
  0.65,
  0.65,
  true
),
(
  '40000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'MED-002',
  'Paracetamol 500 mg DCI',
  'Paracetamol',
  '500 mg',
  '20000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000001',
  'medicamento',
  'EG-04561',
  'sin_receta',
  false,
  true,
  false,
  'TABLETA',
  'gravado',
  0.12,
  0.12,
  true
),
(
  '40000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'MED-003',
  'Amoxicilina + Ác. Clavulánico 500/125 mg',
  'Amoxicilina + Clavulanato',
  '500 mg / 125 mg',
  '20000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000002',
  'medicamento',
  'EN-08871',
  'con_receta',
  false,
  false,
  false,
  'TABLETA',
  'gravado',
  1.85,
  1.85,
  true
),
(
  '40000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000001',
  'MED-004',
  'Clonazepam 2 mg',
  'Clonazepam',
  '2 mg',
  '20000000-0000-0000-0000-000000000005',
  '30000000-0000-0000-0000-000000000003',
  'medicamento',
  'PS-00912',
  'psicotropico',
  true,
  false,
  false,
  'TABLETA',
  'gravado',
  1.10,
  1.10,
  true
),
(
  '40000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000001',
  'MED-005',
  'Morfina Sulfato 10 mg/ml',
  'Morfina',
  '10 mg/ml x 1 ml',
  '20000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000004',
  'medicamento',
  'EST-00104',
  'estupefaciente',
  true,
  false,
  false,
  'AMPOLLA',
  'gravado',
  8.50,
  8.50,
  true
) on conflict (id) do nothing;

-- 9. PRESENTACIONES (Fraccionamiento: Unidad / Blíster / Caja)
insert into public.producto_presentaciones (
  id, tenant_id, producto_id, nombre, factor_base, codigo_barras, precio_venta, es_default, activo
)
values
  -- Panadol
  ('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Unidad', 1, '77512345601', 1.00, false, true),
  ('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Blíster x10', 10, '77512345610', 9.50, true, true),
  ('50000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Caja x100', 100, '77512345600', 85.00, false, true),
  -- Paracetamol DCI
  ('50000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Unidad', 1, '77598765401', 0.20, false, true),
  ('50000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Blíster x10', 10, '77598765410', 1.80, true, true),
  ('50000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'Caja x100', 100, '77598765400', 15.00, false, true),
  -- Amoxicilina
  ('50000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'Caja x14', 14, '77544332214', 36.00, true, true),
  -- Clonazepam
  ('50000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'Caja x30', 30, '77577889930', 48.00, true, true),
  -- Morfina
  ('50000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'Ampolla', 1, '77599001101', 15.00, true, true)
on conflict do nothing;

-- 10. LOTES & VENCIMIENTOS (Semáforo FEFO)
insert into public.lotes (id, tenant_id, producto_id, numero_lote, fecha_vencimiento)
values
  -- Panadol (lote próximo a vencer vs lote lejano)
  ('60000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'L-2024-88', current_date + interval '32 days'),
  ('60000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'L-2025-02', current_date + interval '540 days'),
  -- Paracetamol
  ('60000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000002', 'L-POR-99', current_date + interval '52 days'),
  -- Amoxicilina (Crítico: vence en 14 días)
  ('60000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 'L-MED-44', current_date + interval '14 days'),
  -- Clonazepam (Psicotrópico)
  ('60000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', 'L-PS-901', current_date + interval '480 days'),
  -- Morfina (Estupefaciente)
  ('60000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'L-EST-04', current_date + interval '360 days')
on conflict do nothing;

-- Stock por Sucursal y Lote
insert into public.stock_lotes (tenant_id, sucursal_id, lote_id, producto_id, cantidad_base, estado)
values
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 120, 'disponible'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 200, 'disponible'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 850, 'disponible'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000003', 35, 'disponible'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 45, 'disponible'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000005', 12, 'disponible')
on conflict (sucursal_id, lote_id) do update set cantidad_base = excluded.cantidad_base;

-- 11. PROVEEDORES / DROGUERÍAS
insert into public.proveedores (id, tenant_id, ruc, razon_social, contacto, telefono, direccion, activo)
values
  ('70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '20100070970', 'Droguería Suiza S.A.C.', 'Juan Ramos', '01-4458900', 'Av. Argentina 2450, Lima', true),
  ('70000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '20100119227', 'Medifarma Distribución', 'Clara Huamán', '01-3156000', 'Jr. Ecuador 787, Lima', true),
  ('70000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', '20100030145', 'Quifatex S.A.C.', 'Carlos Peña', '01-6112200', 'Carretera Central Km 3.5, Lima', true)
on conflict do nothing;

-- 12. CLIENTES FRECUENTES
insert into public.clientes (id, tenant_id, tipo_documento, numero_documento, nombres, direccion, telefono, consentimiento_datos, activo)
values
  ('80000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'dni', '44556677', 'María López Sandoval', 'Calle Los Pinos 142', '969123456', true, true),
  ('80000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'ruc', '20601234567', 'Clínica Santa Isabel S.A.C.', 'Av. Sánchez Cerro 890', '073-305544', true, true)
on conflict do nothing;

-- 13. MÉDICOS PARA RECETAS
insert into public.medicos (id, tenant_id, cmp, nombres, especialidad, establecimiento)
values
  ('90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '45892', 'Dra. Patricia Silva Ruiz', 'Medicina General', 'Hospital Cayetano Heredia'),
  ('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', '33104', 'Dr. Fernando Castro Vidal', 'Pediatría', 'Clínica Santa Isabel')
on conflict do nothing;

-- 14. TURNOS DE CAJA & MOVIMIENTOS
insert into public.turnos_caja (
  id, tenant_id, sucursal_id, caja_id, usuario_id, estado,
  apertura_at, monto_apertura, observacion
)
values (
  'd0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000003',
  'abierto',
  now() - interval '4 hours',
  150.00,
  'Turno Mañana - Apertura normal'
)
on conflict do nothing;

insert into public.movimientos_caja (
  id, tenant_id, turno_id, tipo, concepto, monto, usuario_id, created_at
)
values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'ingreso', 'Sencillo inicial adicional de bóveda', 50.00, 'f0000000-0000-0000-0000-000000000003', now() - interval '3 hours'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'egreso', 'Compra de bolsas térmicas para cadena de frío', 25.00, 'f0000000-0000-0000-0000-000000000003', now() - interval '2 hours')
on conflict do nothing;

-- 15. COMPRAS & RECEPCIÓN
insert into public.compras (
  id, tenant_id, sucursal_id, proveedor_id, tipo_documento, serie_numero,
  fecha_emision, fecha_recepcion, subtotal, igv, total, estado, observacion
)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',
    'factura',
    'F001-002490',
    current_date - interval '2 days',
    current_date - interval '1 day',
    550.00,
    99.00,
    649.00,
    'recibida',
    'Ingreso conforme a almacén con guía remisión adjunta'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000002',
    'factura',
    'F012-008123',
    current_date,
    null,
    1250.00,
    225.00,
    1475.00,
    'borrador',
    'Pendiente de verificación física de cajas en recepción'
  )
on conflict do nothing;

insert into public.compra_items (
  id, compra_id, producto_id, presentacion_id, numero_lote, fecha_vencimiento,
  cantidad, factor_base, costo_unitario_presentacion, lote_id
)
values
  (
    'a2000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'L-2025-02',
    current_date + interval '540 days',
    2,
    100,
    65.00,
    '60000000-0000-0000-0000-000000000002'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000006',
    'L-POR-99',
    current_date + interval '52 days',
    5,
    100,
    12.00,
    '60000000-0000-0000-0000-000000000003'
  ),
  (
    'a2000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000007',
    'L-MED-2026-09',
    current_date + interval '720 days',
    50,
    14,
    25.00,
    null
  )
on conflict do nothing;

-- 16. VENTAS SUNAT, RECETAS Y COMPROBANTES
insert into public.ventas (
  id, tenant_id, sucursal_id, caja_id, turno_id, cliente_id, vendedor_id,
  tipo_comprobante, serie, numero, fecha_emision, subtotal_gravado,
  subtotal_exonerado, subtotal_inafecto, igv, descuento_total, total,
  estado, requiere_receta
)
values
  (
    'b1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000003',
    'boleta',
    'B001',
    154,
    now() - interval '2 hours',
    32.63,
    0,
    0,
    5.87,
    0,
    38.50,
    'completada',
    false
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000003',
    'factura',
    'F001',
    82,
    now() - interval '1 hour',
    203.39,
    0,
    0,
    36.61,
    0,
    240.00,
    'completada',
    true
  ),
  (
    'b1000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    null,
    'f0000000-0000-0000-0000-000000000003',
    'boleta',
    'B001',
    153,
    now() - interval '30 minutes',
    3.05,
    0,
    0,
    0.55,
    0,
    3.60,
    'completada',
    false
  )
on conflict do nothing;

insert into public.venta_items (
  id, tenant_id, venta_id, producto_id, presentacion_id, descripcion,
  cantidad, factor_base, precio_unitario, descuento, tipo_afectacion_igv,
  valor_venta, igv, total, costo_unitario_base
)
values
  (
    'b2000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000002',
    'Panadol Forte 500 mg (Blíster x10)',
    4,
    10,
    9.50,
    0,
    'gravado',
    32.63,
    5.87,
    38.50,
    0.65
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000007',
    'Amoxicilina + Clavulánico 500/125 mg (Caja x 14)',
    5,
    14,
    48.00,
    0,
    'gravado',
    203.39,
    36.61,
    240.00,
    1.85
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000005',
    'Paracetamol 500 mg DCI (Blíster x10)',
    2,
    10,
    1.80,
    0,
    'gravado',
    3.05,
    0.55,
    3.60,
    0.12
  )
on conflict do nothing;

insert into public.recetas (
  id, tenant_id, venta_id, medico_id, medico_nombre, medico_cmp,
  paciente_nombre, paciente_documento, numero_receta, fecha_emision,
  diagnostico_cie10, retenida
)
values (
  'b3000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  '90000000-0000-0000-0000-000000000002',
  'Dr. Fernando Castro Vidal',
  '33104',
  'Elena Torres Paredes',
  '72109843',
  'R-9021',
  current_date,
  'J02.9 Faringitis aguda',
  true
)
on conflict do nothing;

insert into public.comprobantes_electronicos (
  id, tenant_id, venta_id, estado, hash, codigo_sunat, mensaje_sunat
)
values
  ('b4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'aceptado', 'Bv39x9Kla0294Xmc9281Xms09281', '0', 'La Boleta B001-000154 ha sido aceptada.'),
  ('b4000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'aceptado', 'Mm918Xksp2810Xma98231', '0', 'La Factura F001-000082 ha sido aceptada.'),
  ('b4000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'aceptado', 'Yw092mSlp10931Xna87321', '0', 'La Boleta B001-000153 ha sido aceptada.')
on conflict do nothing;

-- 17. LIBRO DE CONTROLADOS (DIGEMID)
insert into public.libro_controlados (
  tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento,
  cantidad_base, saldo_posterior, referencia_tipo, registrado_por, validado_por, validado_at
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000004',
    '60000000-0000-0000-0000-000000000005',
    'compra',
    45,
    45,
    'Factura Droguería F-0912',
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000002',
    now() - interval '5 days'
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000005',
    '60000000-0000-0000-0000-000000000006',
    'compra',
    12,
    12,
    'Guía Remisión Oficial GR-4401',
    'f0000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000002',
    now() - interval '3 days'
  );

-- Reactivar triggers de auditoría
set session_replication_role = 'origin';

-- =====================================================================
-- Seed finalizado con éxito
-- =====================================================================
