-- Migration 0002: Transferencias entre sucursales y Registro BPA de Temperatura/Humedad

create table if not exists public.transferencias (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  sucursal_origen_id  uuid not null references public.sucursales(id),
  sucursal_destino_id uuid not null references public.sucursales(id),
  numero_guia         text,
  estado              estado_transferencia not null default 'borrador',
  solicitado_por      uuid references public.perfiles(id),
  despachado_por      uuid references public.perfiles(id),
  recibido_por        uuid references public.perfiles(id),
  motivo              text,
  observaciones       text,
  fecha_solicitud     timestamptz not null default now(),
  fecha_despacho      timestamptz,
  fecha_recepcion     timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.transferencia_items (
  id                   uuid primary key default gen_random_uuid(),
  transferencia_id     uuid not null references public.transferencias(id) on delete cascade,
  producto_id          uuid not null references public.productos(id),
  lote_id              uuid not null references public.lotes(id),
  cantidad_solicitada  integer not null check (cantidad_solicitada > 0),
  cantidad_despachada  integer not null default 0 check (cantidad_despachada >= 0),
  cantidad_recibida    integer not null default 0 check (cantidad_recibida >= 0)
);

create table if not exists public.registros_temperatura_humedad (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  sucursal_id    uuid not null references public.sucursales(id) on delete cascade,
  zona           text not null default 'ambiente' check (zona in ('ambiente', 'cadena_frio')),
  turno          text not null check (turno in ('mañana', 'tarde')),
  fecha          date not null default current_date,
  hora           time not null default current_time,
  temperatura    numeric(4,1) not null,
  humedad        numeric(4,1),
  usuario_id     uuid references public.perfiles(id),
  conformidad    boolean not null default true,
  observacion    text,
  created_at     timestamptz not null default now(),
  unique (sucursal_id, zona, fecha, turno)
);
