-- ───────────── CACHÉ LOCAL DE PADRÓN RUC (SUNAT / ZODIPE) ─────────────
-- Permite almacenar consultas de RUC para evitar llamadas repetidas a la API externa,
-- reducir costos de consumo de cuota y permitir respuesta inmediata (<2ms) en mostrador.

create table if not exists public.padron_ruc_cache (
  ruc           char(11) primary key,
  razon_social  text not null,
  estado        text default 'ACTIVO',
  condicion     text default 'HABIDO',
  direccion     text,
  departamento  text,
  provincia     text,
  distrito      text,
  ubigeo        text,
  raw_response  jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_padron_ruc_cache_ruc on public.padron_ruc_cache(ruc);
create index if not exists idx_padron_ruc_cache_razon_social on public.padron_ruc_cache(razon_social);
