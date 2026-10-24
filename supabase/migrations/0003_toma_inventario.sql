-- Migration 0003: Toma de Inventario Físico y Auditoría de Stock

create table if not exists public.inventario_tomas (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  sucursal_id     uuid not null references public.sucursales(id) on delete cascade,
  codigo          text not null,
  estado          text not null default 'en_progreso' check (estado in ('en_progreso', 'aplicado', 'anulado')),
  responsable_id  uuid references public.perfiles(id),
  observaciones   text,
  fecha_inicio    timestamptz not null default now(),
  fecha_cierre    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.inventario_toma_items (
  id              uuid primary key default gen_random_uuid(),
  toma_id         uuid not null references public.inventario_tomas(id) on delete cascade,
  producto_id     uuid not null references public.productos(id),
  lote_id         uuid not null references public.lotes(id),
  stock_sistema   integer not null default 0,
  stock_fisico    integer not null default 0,
  diferencia      integer not null default 0,
  costo_promedio  numeric(14,4) not null default 0,
  justificacion   text
);
