-- =====================================================================
-- BotiGest · Esquema Inicial de Base de Datos (PostgreSQL 15+)
-- Cumplimiento DIGEMID (Ley 29459), SUNAT y Multi-tenancy con RLS
-- =====================================================================

create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists "uuid-ossp";

-- ───────────── ENUMS ─────────────
do $$ begin
  create type rol_usuario as enum (
    'propietario','administrador','director_tecnico','cajero','almacenero','contador'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type condicion_venta as enum (
    'sin_receta',        -- OTC / Venta libre
    'con_receta',        -- Receta médica simple
    'receta_retenida',   -- Antibióticos o productos con retención de receta
    'psicotropico',      -- Lista IV B / Fiscalizado
    'estupefaciente'     -- Lista II / Fiscalizado con receta especial
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_afectacion_igv as enum ('gravado','exonerado','inafecto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_documento_identidad as enum ('dni','ruc','ce','pasaporte','sin_documento');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_comprobante as enum ('boleta','factura','nota_credito','nota_debito','nota_venta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_venta as enum ('completada','anulada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_sunat as enum ('pendiente','enviado','aceptado','rechazado','anulado','error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_pago as enum ('efectivo','tarjeta','yape','plin','transferencia','credito','convenio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_compra as enum ('borrador','recibida','anulada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_transferencia as enum ('borrador','en_transito','recibida','anulada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_turno as enum ('abierto','cerrado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum (
    'compra','venta','devolucion_cliente','devolucion_proveedor',
    'ajuste_positivo','ajuste_negativo','merma','vencimiento',
    'transferencia_salida','transferencia_entrada','stock_inicial'
  );
exception when duplicate_object then null; end $$;

-- ───────────── TENANCY & ESTRUCTURA ─────────────
create table if not exists public.tenants (
  id               uuid primary key default gen_random_uuid(),
  ruc              char(11) not null unique,
  razon_social     text not null,
  nombre_comercial text not null,
  plan             text not null default 'basico' check (plan in ('basico','pro','cadena')),
  activo           boolean not null default true,
  configuracion    jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.perfiles (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nombres     text not null,
  apellidos   text not null,
  dni         char(8),
  cqfp        text,
  rol         rol_usuario not null,
  pin_hash    text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sucursales (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  codigo                text not null,
  nombre                text not null,
  direccion             text not null,
  ubigeo                char(6),
  telefono              text,
  codigo_establecimiento_sunat char(4) not null default '0000',
  autorizacion_digemid  text,
  director_tecnico_id   uuid references public.perfiles(id) on delete set null,
  es_almacen            boolean not null default false,
  activo                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, codigo)
);

create table if not exists public.usuario_sucursal (
  perfil_id    uuid not null references public.perfiles(id) on delete cascade,
  sucursal_id  uuid not null references public.sucursales(id) on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  primary key (perfil_id, sucursal_id)
);

create table if not exists public.cajas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  sucursal_id  uuid not null references public.sucursales(id) on delete cascade,
  nombre       text not null,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (sucursal_id, nombre)
);

create table if not exists public.series_comprobante (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  sucursal_id   uuid not null references public.sucursales(id) on delete cascade,
  caja_id       uuid not null references public.cajas(id) on delete cascade,
  tipo          tipo_comprobante not null,
  serie         char(4) not null,
  ultimo_numero integer not null default 0 check (ultimo_numero >= 0),
  unique (tenant_id, tipo, serie),
  unique (caja_id, tipo)
);

create table if not exists public.turnos_caja (
  id                      uuid primary key default gen_random_uuid(),
  tenant_id               uuid not null references public.tenants(id) on delete cascade,
  sucursal_id             uuid not null references public.sucursales(id),
  caja_id                 uuid not null references public.cajas(id),
  usuario_id              uuid not null references public.perfiles(id),
  estado                  estado_turno not null default 'abierto',
  apertura_at             timestamptz not null default now(),
  monto_apertura          numeric(14,2) not null default 0,
  cierre_at               timestamptz,
  monto_cierre_declarado  numeric(14,2),
  monto_cierre_sistema    numeric(14,2),
  diferencia              numeric(14,2),
  observacion             text
);

create table if not exists public.movimientos_caja (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  turno_id     uuid not null references public.turnos_caja(id) on delete cascade,
  tipo         text not null check (tipo in ('ingreso', 'egreso')),
  concepto     text not null,
  monto        numeric(14,2) not null check (monto > 0),
  usuario_id   uuid not null references public.perfiles(id),
  created_at   timestamptz not null default now()
);

-- ───────────── CATÁLOGO ─────────────
create table if not exists public.formas_farmaceuticas (
  id           smallint generated always as identity primary key,
  nombre       text not null unique,
  abreviatura  text
);

create table if not exists public.principios_activos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null unique,
  codigo_atc     text,
  es_antibiotico boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.laboratorios (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nombre     text not null,
  activo     boolean not null default true,
  unique (tenant_id, nombre)
);

create table if not exists public.categorias (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nombre     text not null,
  padre_id   uuid references public.categorias(id) on delete set null,
  unique (tenant_id, nombre)
);

create table if not exists public.productos (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  codigo_interno        text not null,
  nombre_comercial      text not null,
  nombre_generico       text,
  concentracion         text,
  forma_farmaceutica_id smallint references public.formas_farmaceuticas(id),
  laboratorio_id        uuid references public.laboratorios(id),
  categoria_id          uuid references public.categorias(id),
  tipo_producto         text not null default 'medicamento',
  registro_sanitario    text,
  condicion_venta       condicion_venta not null default 'sin_receta',
  es_controlado         boolean not null default false,
  es_generico           boolean not null default false,
  requiere_cadena_frio  boolean not null default false,
  unidad_base           text not null default 'UNIDAD',
  unidad_medida_sunat   char(3) not null default 'NIU',
  tipo_afectacion_igv   tipo_afectacion_igv not null default 'gravado',
  costo_ultimo          numeric(14,6) not null default 0,
  costo_promedio        numeric(14,6) not null default 0,
  activo                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, codigo_interno)
);

create table if not exists public.producto_presentaciones (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  producto_id   uuid not null references public.productos(id) on delete cascade,
  nombre        text not null,
  factor_base   integer not null check (factor_base > 0),
  codigo_barras text,
  precio_venta  numeric(12,2) not null check (precio_venta >= 0),
  es_default    boolean not null default false,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (producto_id, nombre)
);

-- ───────────── INVENTARIO, LOTES & KARDEX ─────────────
create table if not exists public.lotes (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  producto_id        uuid not null references public.productos(id) on delete cascade,
  numero_lote        text not null,
  fecha_vencimiento  date not null,
  fecha_fabricacion  date,
  created_at         timestamptz not null default now(),
  unique (producto_id, numero_lote, fecha_vencimiento)
);

create table if not exists public.stock_lotes (
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  sucursal_id    uuid not null references public.sucursales(id) on delete cascade,
  lote_id        uuid not null references public.lotes(id) on delete cascade,
  producto_id    uuid not null references public.productos(id) on delete cascade,
  cantidad_base  integer not null default 0 check (cantidad_base >= 0),
  estado         text not null default 'disponible' check (estado in ('disponible','cuarentena','bloqueado','vencido')),
  updated_at     timestamptz not null default now(),
  primary key (sucursal_id, lote_id)
);

create table if not exists public.movimientos_stock (
  id                    bigint generated always as identity primary key,
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  sucursal_id           uuid not null references public.sucursales(id),
  lote_id               uuid not null references public.lotes(id),
  producto_id           uuid not null references public.productos(id),
  tipo                  tipo_movimiento not null,
  cantidad_base         integer not null check (cantidad_base <> 0),
  costo_unitario_base   numeric(14,6),
  saldo_lote_posterior  integer,
  referencia_tipo       text,
  referencia_id         uuid,
  observacion           text,
  usuario_id            uuid references public.perfiles(id),
  created_at            timestamptz not null default now()
);

-- ───────────── PROVEEDORES & COMPRAS ─────────────
create table if not exists public.proveedores (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  ruc           char(11) not null,
  razon_social  text not null,
  contacto      text,
  telefono      text,
  email         text,
  direccion     text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (tenant_id, ruc)
);

create table if not exists public.compras (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  sucursal_id        uuid not null references public.sucursales(id),
  proveedor_id       uuid not null references public.proveedores(id),
  tipo_documento     text not null default 'factura',
  serie_numero       text not null,
  fecha_emision      date not null,
  fecha_recepcion    date,
  moneda             char(3) not null default 'PEN',
  subtotal           numeric(14,2) not null default 0,
  igv                numeric(14,2) not null default 0,
  total              numeric(14,2) not null default 0,
  estado             estado_compra not null default 'borrador',
  observacion        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, proveedor_id, serie_numero)
);

create table if not exists public.compra_items (
  id                           uuid primary key default gen_random_uuid(),
  compra_id                    uuid not null references public.compras(id) on delete cascade,
  producto_id                  uuid not null references public.productos(id),
  presentacion_id              uuid not null references public.producto_presentaciones(id),
  numero_lote                  text not null,
  fecha_vencimiento            date not null,
  cantidad                     integer not null check (cantidad > 0),
  factor_base                  integer not null check (factor_base > 0),
  costo_unitario_presentacion  numeric(14,4) not null check (costo_unitario_presentacion >= 0),
  lote_id                      uuid references public.lotes(id)
);

-- ───────────── CLIENTES, MÉDICOS & VENTAS ─────────────
create table if not exists public.clientes (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  tipo_documento      tipo_documento_identidad not null,
  numero_documento    text not null,
  nombres             text not null,
  direccion           text,
  telefono            text,
  email               text,
  puntos              integer not null default 0,
  consentimiento_datos boolean not null default false,
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, tipo_documento, numero_documento)
);

create table if not exists public.medicos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  cmp            text not null,
  nombres        text not null,
  especialidad   text,
  establecimiento text,
  created_at     timestamptz not null default now(),
  unique (tenant_id, cmp)
);

create table if not exists public.ventas (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  sucursal_id         uuid not null references public.sucursales(id),
  caja_id             uuid not null references public.cajas(id),
  turno_id            uuid not null references public.turnos_caja(id),
  offline_id          uuid,
  cliente_id          uuid references public.clientes(id),
  vendedor_id         uuid not null references public.perfiles(id),
  tipo_comprobante    tipo_comprobante not null,
  serie               char(4) not null,
  numero              integer not null,
  fecha_emision       timestamptz not null default now(),
  moneda              char(3) not null default 'PEN',
  subtotal_gravado    numeric(14,2) not null default 0,
  subtotal_exonerado  numeric(14,2) not null default 0,
  subtotal_inafecto   numeric(14,2) not null default 0,
  igv                 numeric(14,2) not null default 0,
  descuento_total     numeric(14,2) not null default 0,
  total               numeric(14,2) not null default 0,
  estado              estado_venta not null default 'completada',
  requiere_receta     boolean not null default false,
  motivo_anulacion    text,
  anulada_por         uuid references public.perfiles(id),
  anulada_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, tipo_comprobante, serie, numero)
);

create table if not exists public.venta_items (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  venta_id              uuid not null references public.ventas(id) on delete cascade,
  producto_id           uuid not null references public.productos(id),
  presentacion_id       uuid not null references public.producto_presentaciones(id),
  descripcion           text not null,
  cantidad              integer not null check (cantidad > 0),
  factor_base           integer not null check (factor_base > 0),
  precio_unitario       numeric(12,4) not null,
  descuento             numeric(12,2) not null default 0,
  tipo_afectacion_igv   tipo_afectacion_igv not null,
  valor_venta           numeric(14,2) not null,
  igv                   numeric(14,2) not null,
  total                 numeric(14,2) not null,
  costo_unitario_base   numeric(14,6) not null default 0
);

create table if not exists public.recetas (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  venta_id            uuid not null references public.ventas(id) on delete cascade,
  medico_id           uuid references public.medicos(id),
  medico_nombre       text,
  medico_cmp          text,
  paciente_nombre     text not null,
  paciente_documento  text,
  numero_receta       text,
  fecha_emision       date not null,
  diagnostico_cie10   text,
  retenida            boolean not null default false,
  created_at          timestamptz not null default now()
);

create table if not exists public.libro_controlados (
  id                bigint generated always as identity primary key,
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  sucursal_id       uuid not null references public.sucursales(id),
  producto_id       uuid not null references public.productos(id),
  lote_id           uuid not null references public.lotes(id),
  tipo_movimiento   tipo_movimiento not null,
  cantidad_base     integer not null,
  saldo_posterior   integer not null,
  referencia_tipo   text,
  referencia_id     uuid,
  receta_id         uuid references public.recetas(id),
  registrado_por    uuid references public.perfiles(id),
  validado_por      uuid references public.perfiles(id),
  validado_at       timestamptz,
  created_at        timestamptz not null default now()
);

create table if not exists public.comprobantes_electronicos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  venta_id       uuid not null unique references public.ventas(id) on delete cascade,
  estado         estado_sunat not null default 'pendiente',
  hash           text,
  codigo_sunat   text,
  mensaje_sunat  text,
  updated_at     timestamptz not null default now()
);

create table if not exists public.outbox_facturacion (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  venta_id         uuid not null references public.ventas(id) on delete cascade,
  payload          jsonb not null,
  estado           text not null default 'pendiente',
  intentos         integer not null default 0,
  proximo_intento  timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
