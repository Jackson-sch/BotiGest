# Plan completo — Sistema de Gestión para Boticas (Perú)

> Nombre tentativo: **BotiGest** · Stack: Next.js + TypeScript + Supabase · Modelo: SaaS multi-tenant / multi-sucursal
> Documento de planificación: alcance, normativa, arquitectura, base de datos (SQL), RLS, funciones críticas, estructura del proyecto, flujos, integración SUNAT y roadmap.

---

## Tabla de contenido

1. [Visión y alcance](#1-visión-y-alcance)
2. [Contexto regulatorio peruano](#2-contexto-regulatorio-peruano)
3. [Stack y decisiones de arquitectura](#3-stack-y-decisiones-de-arquitectura)
4. [Roles y permisos](#4-roles-y-permisos)
5. [Módulos funcionales](#5-módulos-funcionales)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Seguridad: Auth, claims y RLS](#7-seguridad-auth-claims-y-rls)
8. [Funciones críticas (RPC / triggers)](#8-funciones-críticas-rpc--triggers)
9. [Estructura del proyecto Next.js](#9-estructura-del-proyecto-nextjs)
10. [Flujos clave](#10-flujos-clave)
11. [Facturación electrónica (API central SUNAT)](#11-facturación-electrónica-api-central-sunat)
12. [Modo offline (PWA)](#12-modo-offline-pwa)
13. [Reportes y alertas](#13-reportes-y-alertas)
14. [Hardware e impresión](#14-hardware-e-impresión)
15. [Seguridad, auditoría y datos personales](#15-seguridad-auditoría-y-datos-personales)
16. [Roadmap por fases](#16-roadmap-por-fases)
17. [Riesgos y decisiones pendientes](#17-riesgos-y-decisiones-pendientes)

---

## 1. Visión y alcance

Sistema web para boticas y farmacias pequeñas/medianas del Perú (1 local, o cadenas de varias sucursales) que cubre:

- **Punto de venta rápido** (lector de código de barras, venta por unidad/blíster/caja, atajos de teclado).
- **Inventario por lote y fecha de vencimiento** con salida **FEFO** (First Expired, First Out).
- **Cumplimiento sanitario**: control de venta con receta, libro de estupefacientes/psicotrópicos, trazabilidad por lote, cadena de frío.
- **Compras, proveedores y transferencias** entre sucursales.
- **Facturación electrónica SUNAT** (boleta, factura, notas) consumiendo la API central de facturación.
- **Caja, turnos, arqueos**, pagos mixtos (efectivo, tarjeta, Yape, Plin, transferencia).
- **Reportes** de ventas, márgenes, rotación, vencimientos y quiebres de stock.
- **Multi-tenant**: cada botica/cadena (tenant) aislada por RLS; modelo SaaS por suscripción.

### Fuera de alcance (v1)

- Contabilidad completa (solo exportables PLE / registros de ventas y compras).
- Integración con seguros/EPS en línea (v1 solo convenios con descuento manual).
- App móvil nativa (v1 es PWA).
- Marketplace / e-commerce (fase posterior).

---

## 2. Contexto regulatorio peruano

> ⚠️ Esta sección es una guía de diseño, **no asesoría legal**. Validar cada punto con el **Químico Farmacéutico (Director Técnico)** de la botica y con un contador antes de producción.

| Tema | Norma / entidad de referencia | Impacto en el sistema |
|---|---|---|
| Productos farmacéuticos, dispositivos médicos y productos sanitarios | Ley 29459 y sus reglamentos (DIGEMID) | Catálogo con **registro sanitario**, condición de venta, lote y vencimiento |
| Estupefacientes y psicotrópicos | Reglamento de sustancias sujetas a fiscalización sanitaria (DS 023-2001-SA y normas vinculadas) | **Libro de control** inmutable, receta especial, saldo permanente por producto |
| Buenas Prácticas de Dispensación (BPD) y Almacenamiento (BPA) | DIGEMID | Alertas de vencimiento, cuarentena, cadena de frío, trazabilidad por lote |
| Director Técnico | Establecimiento requiere QF responsable | Rol `director_tecnico`, validación de libro de controlados, colegiatura (CQFP) |
| Genéricos / DCI | Obligación de informar alternativas | Búsqueda por **principio activo (DCI)** y sugerencia de alternativas más económicas |
| Receta médica | Antibióticos y otros requieren receta; algunos con retención | `condicion_venta` por producto; registro de receta (CMP del médico, paciente, imagen) |
| Reporte de precios | Observatorio Peruano de Productos Farmacéuticos (DIGEMID) | Exportable de precios por producto para reporte periódico |
| Comprobantes electrónicos | SUNAT | Boleta/factura/NC/ND; boleta ≥ S/ 700 exige identificar al cliente |
| IGV | SUNAT | Afectación por producto (gravado / exonerado / inafecto) — algunos medicamentos tienen tratamiento especial: **parametrizable** |
| Protección de datos personales | Ley 29733 (ANPD) | Datos de salud son sensibles: consentimiento, acceso restringido, bucket privado para recetas |

---

## 3. Stack y decisiones de arquitectura

| Capa | Tecnología | Nota |
|---|---|---|
| Frontend / Backend | **Next.js (App Router)** + TypeScript `strict` | Server Components + Server Actions; tipado completo |
| Base de datos | **Supabase Postgres** | Migraciones con Supabase CLI; tipos generados (`supabase gen types typescript`) |
| Auth | **Supabase Auth + Custom Access Token Hook** | Claims `tenant_id`, `user_role`, `sucursal_ids` en el JWT → RLS nativa (misma decisión que el POS de supermercado) |
| Storage | Supabase Storage (bucket **privado**) | Imágenes de recetas, logos, documentos; URLs firmadas |
| UI | Tailwind + **shadcn/ui** | Tablas con TanStack Table |
| Estado servidor | TanStack Query | Caché de catálogo y stock |
| Estado POS | Zustand | Carrito, atajos, cliente activo |
| Formularios | React Hook Form + **Zod** | Esquemas compartidos cliente/servidor |
| Offline | PWA (Serwist) + **Dexie** (IndexedDB) | Cola de ventas con `offline_id` idempotente |
| Jobs | `pg_cron` + Edge Functions | Outbox de facturación, alertas de vencimiento |
| Facturación | **API central SUNAT** (proyecto aparte) | La botica solo envía el payload y recibe estado vía webhook |
| Pagos SaaS | Culqi / Niubiz / Mercado Pago (a definir) | Suscripciones de los tenants |
| Observabilidad | Sentry + logs de Supabase | |
| Testing | Vitest, Playwright, **pgTAP** (RLS) | |
| Deploy | Vercel + Supabase | |

### Principios de diseño

1. **Multi-tenant por columna** (`tenant_id` en toda tabla de negocio) + **RLS** como única barrera de aislamiento.
2. **Stock en unidad base** (tableta, ml, unidad). Las presentaciones (blíster, caja) son factores de conversión → permite **fraccionamiento**.
3. **El kardex (`movimientos_stock`) es la fuente de verdad**; `stock_lotes` es un saldo mantenido por trigger. Ambos solo se modifican vía funciones `SECURITY DEFINER`.
4. **Toda venta es una transacción atómica** en una RPC (`registrar_venta`): correlativo, FEFO, kardex, pagos, receta, outbox.
5. **Precios y costos desde el servidor**, nunca confiar en el precio enviado por el cliente.
6. **Tablas regulatorias append-only** (kardex, libro de controlados, auditoría).
7. **Idempotencia** (`offline_id`) para reintentos y modo offline.

---

## 4. Roles y permisos

| Rol | Descripción | Alcance |
|---|---|---|
| `propietario` | Dueño del tenant | Todo, todas las sucursales, suscripción |
| `administrador` | Gerente / administrador | Todo salvo suscripción |
| `director_tecnico` | Químico Farmacéutico | Catálogo, controlados, anulaciones, validación de libro, ajustes |
| `cajero` | Vendedor/cajero | POS, caja propia, clientes; descuento limitado |
| `almacenero` | Inventario | Compras, recepción, ajustes, transferencias |
| `contador` | Contabilidad (solo lectura) | Ventas, compras, exportables |

Matriz resumida:

| Acción | prop. | admin | dir. téc. | cajero | almac. | contador |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Vender (POS) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Descuento > límite | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Anular venta | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear/editar productos | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Recibir compras | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Ajustes / mermas | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver libro de controlados | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Validar libro de controlados | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Reportes financieros | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Módulos funcionales

### 5.1 Catálogo
- Productos con DCI, concentración, forma farmacéutica, laboratorio, registro sanitario, condición de venta, afectación IGV, cadena de frío.
- Presentaciones (Unidad / Blíster x10 / Caja x100) con factor de conversión, código de barras y precio propio.
- Principios activos (catálogo global) y relación N:M con productos (combinaciones).
- Búsqueda por nombre comercial, genérico, principio activo y código de barras (trigram + unaccent).
- **Alternativas**: mismo principio activo + concentración + forma, ordenadas por precio.
- Importación masiva por Excel/CSV.

### 5.2 Inventario
- Stock por **sucursal + lote**, con estados (`disponible`, `cuarentena`, `bloqueado`, `vencido`).
- Kardex valorizado (costo promedio ponderado).
- Ajustes (conteo físico), mermas, bajas por vencimiento, devoluciones a proveedor.
- Stock mínimo/máximo por sucursal y **sugerido de compra**.
- Transferencias entre sucursales (salida → tránsito → recepción).
- Alertas: por vencer (90/60/30 días), vencidos, stock bajo, quiebres.

### 5.3 Compras
- Proveedores, orden de compra, recepción con captura de **lote y vencimiento**.
- Actualización automática de costo promedio y último costo.
- Registro de compras (exportable PLE).

### 5.4 Punto de venta
- Búsqueda/escaneo, venta por presentación, descuentos, pagos mixtos, cliente rápido (DNI/RUC).
- Validación de receta según condición de venta del producto.
- Venta en espera (parquear carrito), devoluciones, anulación con autorización.
- Boleta, factura, nota de venta interna.
- Sugerencia de alternativa genérica más barata.

### 5.5 Caja
- Apertura/cierre de turno, ingresos/egresos, arqueo, diferencia, resumen por método de pago.

### 5.6 Cumplimiento sanitario
- **Libro de controlados** automático (trigger sobre kardex) con saldo, receta asociada y validación del QF.
- Registro de recetas (médico CMP, paciente, imagen, diagnóstico CIE-10 opcional).
- Cadena de frío: marca de producto + registro de temperatura (fase 3).
- Trazabilidad lote → ventas (recall de lote).

### 5.7 Clientes y fidelización
- Clientes (DNI/RUC/CE), consentimiento de datos, historial, puntos, convenios con descuento.

### 5.8 Administración / SaaS
- Tenants, sucursales, usuarios, series por caja, configuración (IGV, límites, formatos), planes y suscripción.

---

## 6. Modelo de datos

### 6.1 Diagrama lógico (resumen)

```
tenants ─┬─ sucursales ─┬─ cajas ── turnos_caja ── movimientos_caja
         │              ├─ usuario_sucursal ── perfiles (auth.users)
         │              └─ producto_sucursal
         ├─ laboratorios, categorias
         ├─ productos ─┬─ producto_presentaciones
         │             ├─ producto_principios_activos ── principios_activos (global)
         │             └─ lotes ── stock_lotes (por sucursal)
         │                    └── movimientos_stock (kardex) ──▶ libro_controlados
         ├─ proveedores ── compras ── compra_items
         ├─ transferencias ── transferencia_items
         ├─ clientes, medicos, convenios
         ├─ ventas ─┬─ venta_items ── venta_item_lotes
         │          ├─ venta_pagos
         │          ├─ recetas
         │          └─ comprobantes_electronicos ◀── outbox_facturacion
         ├─ series_comprobante
         └─ audit_log
```

### 6.2 Convenciones

- PK `uuid` (`gen_random_uuid()`), excepto tablas de alto volumen append-only (`bigint identity`).
- `tenant_id uuid not null` en todas las tablas de negocio.
- Montos `numeric(14,2)`; costos `numeric(14,6)`; cantidades `integer` en **unidad base**.
- Nombres en español, `snake_case`.
- `created_at` / `updated_at` con trigger.

### 6.3 Migración 0001 — extensiones, enums y utilidades

```sql
-- supabase/migrations/0001_base.sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- ───────────── ENUMS ─────────────
create type rol_usuario as enum (
  'propietario','administrador','director_tecnico','cajero','almacenero','contador'
);

create type condicion_venta as enum (
  'sin_receta',        -- OTC
  'con_receta',        -- receta médica simple
  'receta_retenida',   -- la botica retiene la receta (p. ej. antibióticos según política)
  'psicotropico',      -- fiscalizado
  'estupefaciente'     -- fiscalizado, receta especial
);

create type tipo_afectacion_igv as enum ('gravado','exonerado','inafecto');
create type tipo_documento_identidad as enum ('dni','ruc','ce','pasaporte','sin_documento');
create type tipo_comprobante as enum ('boleta','factura','nota_credito','nota_debito','nota_venta');
create type estado_venta as enum ('completada','anulada');
create type estado_sunat as enum ('pendiente','enviado','aceptado','rechazado','anulado','error');
create type metodo_pago as enum ('efectivo','tarjeta','yape','plin','transferencia','credito','convenio');
create type estado_compra as enum ('borrador','recibida','anulada');
create type estado_transferencia as enum ('borrador','en_transito','recibida','anulada');
create type estado_turno as enum ('abierto','cerrado');

create type tipo_movimiento as enum (
  'compra','venta','devolucion_cliente','devolucion_proveedor',
  'ajuste_positivo','ajuste_negativo','merma','vencimiento',
  'transferencia_salida','transferencia_entrada','stock_inicial'
);

-- ───────────── UTILIDADES ─────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Claims del JWT (inyectados por el Custom Access Token Hook)
create or replace function public.current_tenant_id()
returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'tenant_id', '')::uuid
$$;

create or replace function public.current_user_role()
returns text language sql stable as $$
  select auth.jwt() ->> 'user_role'
$$;

create or replace function public.current_sucursal_ids()
returns uuid[] language sql stable as $$
  select coalesce(
    (select array_agg(x::uuid) from jsonb_array_elements_text(auth.jwt() -> 'sucursal_ids') as x),
    '{}'::uuid[]
  )
$$;

create or replace function public.tiene_rol(variadic roles text[])
returns boolean language sql stable as $$
  select (auth.jwt() ->> 'user_role') = any(roles)
$$;
```

### 6.4 Migración 0002 — tenants, sucursales, usuarios, cajas

```sql
-- supabase/migrations/0002_tenancy.sql
create table public.tenants (
  id               uuid primary key default gen_random_uuid(),
  ruc              char(11) not null unique,
  razon_social     text not null,
  nombre_comercial text not null,
  plan             text not null default 'basico' check (plan in ('basico','pro','cadena')),
  activo           boolean not null default true,
  -- ej: {"max_descuento_cajero_pct": 10, "igv_pct": 18}
  configuracion    jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.sucursales (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  codigo                text not null,
  nombre                text not null,
  direccion             text not null,
  ubigeo                char(6),
  telefono              text,
  codigo_establecimiento_sunat char(4) not null default '0000',
  autorizacion_digemid  text,          -- N° de autorización/ resolución del establecimiento
  director_tecnico_id   uuid,          -- FK a perfiles (se agrega abajo)
  es_almacen            boolean not null default false,
  activo                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, codigo)
);

create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  nombres     text not null,
  apellidos   text not null,
  dni         char(8),
  cqfp        text,                    -- colegiatura (solo director técnico)
  rol         rol_usuario not null,
  pin_hash    text,                    -- PIN para autorizaciones rápidas (hash)
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (rol <> 'director_tecnico' or cqfp is not null)
);
create index on public.perfiles (tenant_id);

alter table public.sucursales
  add constraint sucursales_director_fk
  foreign key (director_tecnico_id) references public.perfiles(id) on delete set null;

create table public.usuario_sucursal (
  perfil_id    uuid not null references public.perfiles(id) on delete cascade,
  sucursal_id  uuid not null references public.sucursales(id) on delete cascade,
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  primary key (perfil_id, sucursal_id)
);
create index on public.usuario_sucursal (sucursal_id);

create table public.cajas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  sucursal_id  uuid not null references public.sucursales(id) on delete cascade,
  nombre       text not null,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (sucursal_id, nombre)
);

-- Una serie por caja y tipo de comprobante → sin contención y compatible con modo offline
create table public.series_comprobante (
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

create table public.turnos_caja (
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
-- Solo un turno abierto por caja
create unique index ux_turno_abierto_por_caja on public.turnos_caja (caja_id) where estado = 'abierto';

create table public.movimientos_caja (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  turno_id    uuid not null references public.turnos_caja(id) on delete cascade,
  tipo        text not null check (tipo in ('ingreso','egreso')),
  concepto    text not null,
  monto       numeric(14,2) not null check (monto > 0),
  usuario_id  uuid not null references public.perfiles(id),
  created_at  timestamptz not null default now()
);
create index on public.movimientos_caja (turno_id);
```

### 6.5 Migración 0003 — catálogo

```sql
-- supabase/migrations/0003_catalogo.sql

-- Catálogos GLOBALES (solo lectura para usuarios; se administran con service role)
create table public.formas_farmaceuticas (
  id           smallint generated always as identity primary key,
  nombre       text not null unique,
  abreviatura  text
);

create table public.principios_activos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null unique,       -- DCI
  codigo_atc     text,
  es_antibiotico boolean not null default false,
  created_at     timestamptz not null default now()
);
create index on public.principios_activos using gin (nombre gin_trgm_ops);

-- Catálogos por tenant
create table public.laboratorios (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nombre     text not null,
  activo     boolean not null default true,
  unique (tenant_id, nombre)
);

create table public.categorias (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  nombre     text not null,
  padre_id   uuid references public.categorias(id) on delete set null,
  unique (tenant_id, nombre)
);

create table public.productos (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  codigo_interno        text not null,
  nombre_comercial      text not null,
  nombre_generico       text,                       -- DCI en texto (búsqueda rápida)
  concentracion         text,                       -- '500 mg', '120 mg/5 ml'
  forma_farmaceutica_id smallint references public.formas_farmaceuticas(id),
  laboratorio_id        uuid references public.laboratorios(id),
  categoria_id          uuid references public.categorias(id),
  tipo_producto         text not null default 'medicamento'
                        check (tipo_producto in ('medicamento','dispositivo_medico','producto_sanitario','cosmetico','suplemento','otro')),
  registro_sanitario    text,
  condicion_venta       condicion_venta not null default 'sin_receta',
  es_controlado         boolean not null default false,
  es_generico           boolean not null default false,
  requiere_cadena_frio  boolean not null default false,
  unidad_base           text not null default 'UNIDAD',  -- TABLETA, ML, CAPSULA...
  unidad_medida_sunat   char(3) not null default 'NIU',
  tipo_afectacion_igv   tipo_afectacion_igv not null default 'gravado',
  costo_ultimo          numeric(14,6) not null default 0,   -- sin IGV, por unidad base
  costo_promedio        numeric(14,6) not null default 0,   -- sin IGV, por unidad base
  activo                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (tenant_id, codigo_interno),
  check (es_controlado = (condicion_venta in ('psicotropico','estupefaciente')))
);
create index ix_productos_nombre_trgm  on public.productos using gin (nombre_comercial gin_trgm_ops);
create index ix_productos_generico_trgm on public.productos using gin (nombre_generico gin_trgm_ops);
create index on public.productos (tenant_id, activo);
create index on public.productos (laboratorio_id);

create table public.producto_principios_activos (
  producto_id         uuid not null references public.productos(id) on delete cascade,
  principio_activo_id uuid not null references public.principios_activos(id),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  concentracion       text,
  primary key (producto_id, principio_activo_id)
);
create index on public.producto_principios_activos (principio_activo_id);

-- Presentaciones = factores de conversión sobre la unidad base (fraccionamiento)
create table public.producto_presentaciones (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  producto_id   uuid not null references public.productos(id) on delete cascade,
  nombre        text not null,                        -- 'Unidad', 'Blíster x10', 'Caja x100'
  factor_base   integer not null check (factor_base > 0),
  codigo_barras text,
  precio_venta  numeric(12,2) not null check (precio_venta >= 0),  -- con IGV
  es_default    boolean not null default false,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (producto_id, nombre)
);
create unique index ux_presentacion_barras  on public.producto_presentaciones (tenant_id, codigo_barras) where codigo_barras is not null;
create unique index ux_presentacion_default on public.producto_presentaciones (producto_id) where es_default;

-- Parámetros por sucursal
create table public.producto_sucursal (
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  sucursal_id   uuid not null references public.sucursales(id) on delete cascade,
  producto_id   uuid not null references public.productos(id) on delete cascade,
  stock_minimo  integer not null default 0 check (stock_minimo >= 0),   -- unidad base
  stock_maximo  integer check (stock_maximo is null or stock_maximo >= stock_minimo),
  ubicacion     text,                                                    -- 'Estante A-3'
  primary key (sucursal_id, producto_id)
);

insert into public.formas_farmaceuticas (nombre, abreviatura) values
  ('Tableta','TAB'),('Tableta recubierta','TAB REC'),('Cápsula','CAP'),('Jarabe','JBE'),
  ('Suspensión','SUSP'),('Solución oral','SOL'),('Solución inyectable','INY'),('Crema','CREM'),
  ('Ungüento','UNG'),('Gel','GEL'),('Gotas oftálmicas','GOT OFT'),('Gotas óticas','GOT OT'),
  ('Supositorio','SUP'),('Óvulo','OVU'),('Parche','PCH'),('Inhalador','INH'),
  ('Polvo para suspensión','POL SUSP'),('Sobre','SOB'),('Spray','SPR'),('Otro','OTR');
```

### 6.6 Migración 0004 — inventario (lotes, stock, kardex)

```sql
-- supabase/migrations/0004_inventario.sql
create table public.lotes (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  producto_id        uuid not null references public.productos(id) on delete cascade,
  numero_lote        text not null,
  fecha_vencimiento  date not null,
  fecha_fabricacion  date,
  created_at         timestamptz not null default now(),
  unique (producto_id, numero_lote, fecha_vencimiento)
);
create index on public.lotes (producto_id, fecha_vencimiento);

-- Saldo por sucursal y lote (se mantiene SOLO por trigger sobre movimientos_stock)
create table public.stock_lotes (
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  sucursal_id    uuid not null references public.sucursales(id) on delete cascade,
  lote_id        uuid not null references public.lotes(id) on delete cascade,
  producto_id    uuid not null references public.productos(id) on delete cascade,
  cantidad_base  integer not null default 0 check (cantidad_base >= 0),
  estado         text not null default 'disponible'
                 check (estado in ('disponible','cuarentena','bloqueado','vencido')),
  updated_at     timestamptz not null default now(),
  primary key (sucursal_id, lote_id)
);
create index on public.stock_lotes (sucursal_id, producto_id);
create index on public.stock_lotes (tenant_id, lote_id);

-- Kardex: append-only
create table public.movimientos_stock (
  id                    bigint generated always as identity primary key,
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  sucursal_id           uuid not null references public.sucursales(id),
  lote_id               uuid not null references public.lotes(id),
  producto_id           uuid not null references public.productos(id),
  tipo                  tipo_movimiento not null,
  cantidad_base         integer not null check (cantidad_base <> 0),   -- con signo
  costo_unitario_base   numeric(14,6),
  saldo_lote_posterior  integer,
  referencia_tipo       text,                                            -- 'venta','compra','transferencia','ajuste'
  referencia_id         uuid,
  observacion           text,
  usuario_id            uuid references public.perfiles(id),
  created_at            timestamptz not null default now()
);
create index on public.movimientos_stock (sucursal_id, producto_id, created_at desc);
create index on public.movimientos_stock (referencia_tipo, referencia_id);
create index on public.movimientos_stock (lote_id);

-- Trigger: aplica el movimiento al saldo del lote
create or replace function public.trg_aplicar_movimiento_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_saldo integer;
begin
  insert into public.stock_lotes (tenant_id, sucursal_id, lote_id, producto_id, cantidad_base)
  values (new.tenant_id, new.sucursal_id, new.lote_id, new.producto_id, new.cantidad_base)
  on conflict (sucursal_id, lote_id)
  do update set cantidad_base = public.stock_lotes.cantidad_base + excluded.cantidad_base,
                updated_at    = now()
  returning cantidad_base into v_saldo;

  new.saldo_lote_posterior := v_saldo;
  return new;
end $$;

create trigger tg_movimientos_stock_aplicar
before insert on public.movimientos_stock
for each row execute function public.trg_aplicar_movimiento_stock();

-- Vistas (security_invoker = respetan RLS del usuario)
create view public.v_stock_producto_sucursal with (security_invoker = true) as
select sl.tenant_id, sl.sucursal_id, sl.producto_id,
       sum(sl.cantidad_base) filter (where sl.estado = 'disponible' and l.fecha_vencimiento > current_date) as disponible_base,
       sum(sl.cantidad_base) as total_base
from public.stock_lotes sl
join public.lotes l on l.id = sl.lote_id
group by sl.tenant_id, sl.sucursal_id, sl.producto_id;

create view public.v_lotes_por_vencer with (security_invoker = true) as
select sl.tenant_id, sl.sucursal_id, sl.producto_id, p.nombre_comercial,
       l.id as lote_id, l.numero_lote, l.fecha_vencimiento,
       (l.fecha_vencimiento - current_date) as dias_para_vencer,
       sl.cantidad_base, sl.estado
from public.stock_lotes sl
join public.lotes l     on l.id = sl.lote_id
join public.productos p on p.id = sl.producto_id
where sl.cantidad_base > 0
  and l.fecha_vencimiento <= current_date + interval '90 days';

create view public.v_stock_bajo with (security_invoker = true) as
select ps.tenant_id, ps.sucursal_id, ps.producto_id, p.nombre_comercial,
       ps.stock_minimo, coalesce(v.disponible_base, 0) as disponible_base
from public.producto_sucursal ps
join public.productos p on p.id = ps.producto_id
left join public.v_stock_producto_sucursal v
       on v.sucursal_id = ps.sucursal_id and v.producto_id = ps.producto_id
where coalesce(v.disponible_base, 0) <= ps.stock_minimo
  and p.activo;
```

### 6.7 Migración 0005 — compras y transferencias

```sql
-- supabase/migrations/0005_compras_transferencias.sql
create table public.proveedores (
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

create table public.compras (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  sucursal_id        uuid not null references public.sucursales(id),
  proveedor_id       uuid not null references public.proveedores(id),
  tipo_documento     text not null default 'factura' check (tipo_documento in ('factura','boleta','guia_remision','otro')),
  serie_numero       text not null,                      -- documento del proveedor
  fecha_emision      date not null,
  fecha_recepcion    date,
  moneda             char(3) not null default 'PEN',
  subtotal           numeric(14,2) not null default 0,   -- sin IGV
  igv                numeric(14,2) not null default 0,
  total              numeric(14,2) not null default 0,
  estado             estado_compra not null default 'borrador',
  observacion        text,
  usuario_id         uuid not null references public.perfiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (tenant_id, proveedor_id, serie_numero)
);
create index on public.compras (tenant_id, sucursal_id, fecha_emision desc);

create table public.compra_items (
  id                           uuid primary key default gen_random_uuid(),
  tenant_id                    uuid not null references public.tenants(id) on delete cascade,
  compra_id                    uuid not null references public.compras(id) on delete cascade,
  producto_id                  uuid not null references public.productos(id),
  presentacion_id              uuid not null references public.producto_presentaciones(id),
  numero_lote                  text not null,
  fecha_vencimiento            date not null,
  cantidad                     integer not null check (cantidad > 0),         -- en presentación
  factor_base                  integer not null check (factor_base > 0),
  cantidad_base                integer generated always as (cantidad * factor_base) stored,
  costo_unitario_presentacion  numeric(14,4) not null check (costo_unitario_presentacion >= 0), -- sin IGV
  costo_unitario_base          numeric(14,6) generated always as (round(costo_unitario_presentacion / factor_base, 6)) stored,
  lote_id                      uuid references public.lotes(id)               -- se asigna al recibir
);
create index on public.compra_items (compra_id);

create table public.transferencias (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  sucursal_origen   uuid not null references public.sucursales(id),
  sucursal_destino  uuid not null references public.sucursales(id),
  estado            estado_transferencia not null default 'borrador',
  observacion       text,
  creada_por        uuid not null references public.perfiles(id),
  recibida_por      uuid references public.perfiles(id),
  created_at        timestamptz not null default now(),
  enviada_at        timestamptz,
  recibida_at       timestamptz,
  check (sucursal_origen <> sucursal_destino)
);

create table public.transferencia_items (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  transferencia_id uuid not null references public.transferencias(id) on delete cascade,
  lote_id          uuid not null references public.lotes(id),
  producto_id      uuid not null references public.productos(id),
  cantidad_base    integer not null check (cantidad_base > 0)
);
create index on public.transferencia_items (transferencia_id);
```

### 6.8 Migración 0006 — clientes, médicos, convenios, ventas, recetas

```sql
-- supabase/migrations/0006_ventas.sql
create table public.clientes (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  tipo_documento      tipo_documento_identidad not null,
  numero_documento    text not null,
  nombres             text not null,                  -- o razón social
  direccion           text,
  telefono            text,
  email               text,
  fecha_nacimiento    date,
  puntos              integer not null default 0 check (puntos >= 0),
  consentimiento_datos boolean not null default false,   -- Ley 29733
  consentimiento_at   timestamptz,
  activo              boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (tenant_id, tipo_documento, numero_documento)
);
create index on public.clientes using gin (nombres gin_trgm_ops);

create table public.medicos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  cmp            text not null,                        -- Colegio Médico del Perú
  nombres        text not null,
  especialidad   text,
  establecimiento text,
  created_at     timestamptz not null default now(),
  unique (tenant_id, cmp)
);

create table public.convenios (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  nombre                text not null,
  ruc                   char(11),
  descuento_porcentaje  numeric(5,2) not null check (descuento_porcentaje between 0 and 100),
  activo                boolean not null default true,
  unique (tenant_id, nombre)
);

create table public.ventas (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  sucursal_id         uuid not null references public.sucursales(id),
  caja_id             uuid not null references public.cajas(id),
  turno_id            uuid not null references public.turnos_caja(id),
  offline_id          uuid,                                        -- idempotencia
  cliente_id          uuid references public.clientes(id),
  convenio_id         uuid references public.convenios(id),
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
  redondeo            numeric(14,2) not null default 0,
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
create unique index ux_ventas_offline on public.ventas (tenant_id, offline_id) where offline_id is not null;
create index on public.ventas (tenant_id, sucursal_id, fecha_emision desc);
create index on public.ventas (cliente_id);
create index on public.ventas (turno_id);

create table public.venta_items (
  id                    uuid primary key default gen_random_uuid(),
  tenant_id             uuid not null references public.tenants(id) on delete cascade,
  venta_id              uuid not null references public.ventas(id) on delete cascade,
  producto_id           uuid not null references public.productos(id),
  presentacion_id       uuid not null references public.producto_presentaciones(id),
  descripcion           text not null,                         -- snapshot al momento de la venta
  cantidad              integer not null check (cantidad > 0),
  factor_base           integer not null check (factor_base > 0),
  cantidad_base         integer generated always as (cantidad * factor_base) stored,
  precio_unitario       numeric(12,4) not null,                -- con IGV
  descuento             numeric(12,2) not null default 0,
  tipo_afectacion_igv   tipo_afectacion_igv not null,
  valor_venta           numeric(14,2) not null,                -- sin IGV
  igv                   numeric(14,2) not null,
  total                 numeric(14,2) not null,
  costo_unitario_base   numeric(14,6) not null default 0       -- snapshot para margen
);
create index on public.venta_items (venta_id);
create index on public.venta_items (producto_id);

-- Trazabilidad: de qué lote(s) salió cada ítem
create table public.venta_item_lotes (
  venta_item_id  uuid not null references public.venta_items(id) on delete cascade,
  lote_id        uuid not null references public.lotes(id),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  cantidad_base  integer not null check (cantidad_base > 0),
  primary key (venta_item_id, lote_id)
);
create index on public.venta_item_lotes (lote_id);

create table public.venta_pagos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  venta_id       uuid not null references public.ventas(id) on delete cascade,
  metodo         metodo_pago not null,
  monto          numeric(14,2) not null check (monto > 0),
  referencia     text                                       -- N° operación / voucher
);
create index on public.venta_pagos (venta_id);

create table public.recetas (
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
  imagen_path         text,                                 -- Supabase Storage (bucket privado)
  observacion         text,
  registrado_por      uuid not null references public.perfiles(id),
  created_at          timestamptz not null default now(),
  check (medico_id is not null or (medico_nombre is not null and medico_cmp is not null))
);
create index on public.recetas (venta_id);
```

### 6.9 Migración 0007 — cumplimiento, facturación y auditoría

```sql
-- supabase/migrations/0007_cumplimiento_facturacion_auditoria.sql

-- Libro de estupefacientes / psicotrópicos (append-only, alimentado por trigger)
create table public.libro_controlados (
  id                bigint generated always as identity primary key,
  tenant_id         uuid not null references public.tenants(id) on delete cascade,
  sucursal_id       uuid not null references public.sucursales(id),
  producto_id       uuid not null references public.productos(id),
  lote_id           uuid not null references public.lotes(id),
  tipo_movimiento   tipo_movimiento not null,
  cantidad_base     integer not null,                      -- con signo
  saldo_posterior   integer not null,                      -- saldo del producto en la sucursal
  referencia_tipo   text,
  referencia_id     uuid,
  receta_id         uuid references public.recetas(id),
  registrado_por    uuid references public.perfiles(id),
  validado_por      uuid references public.perfiles(id),   -- QF que firma/valida
  validado_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index on public.libro_controlados (sucursal_id, producto_id, created_at);

create or replace function public.trg_libro_controlados()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_ctrl  boolean;
  v_saldo integer;
begin
  select es_controlado into v_ctrl from public.productos where id = new.producto_id;
  if v_ctrl then
    select coalesce(sum(cantidad_base), 0) into v_saldo
      from public.stock_lotes
     where sucursal_id = new.sucursal_id and producto_id = new.producto_id;

    insert into public.libro_controlados
      (tenant_id, sucursal_id, producto_id, lote_id, tipo_movimiento, cantidad_base,
       saldo_posterior, referencia_tipo, referencia_id, registrado_por)
    values
      (new.tenant_id, new.sucursal_id, new.producto_id, new.lote_id, new.tipo, new.cantidad_base,
       v_saldo, new.referencia_tipo, new.referencia_id, new.usuario_id);
  end if;
  return null;
end $$;

create trigger tg_movimientos_stock_libro
after insert on public.movimientos_stock
for each row execute function public.trg_libro_controlados();

-- Facturación electrónica
create table public.comprobantes_electronicos (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  venta_id       uuid not null unique references public.ventas(id) on delete cascade,
  external_id    text,                    -- id en la API central de facturación
  estado         estado_sunat not null default 'pendiente',
  hash           text,
  codigo_sunat   text,
  mensaje_sunat  text,
  pdf_url        text,
  xml_url        text,
  cdr_url        text,
  enviado_at     timestamptz,
  respondido_at  timestamptz,
  updated_at     timestamptz not null default now()
);

-- Outbox: garantiza envío at-least-once a la API de facturación
create table public.outbox_facturacion (
  id               bigint generated always as identity primary key,
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  venta_id         uuid not null references public.ventas(id) on delete cascade,
  payload          jsonb not null,
  estado           text not null default 'pendiente' check (estado in ('pendiente','procesando','enviado','fallido')),
  intentos         integer not null default 0,
  ultimo_error     text,
  proximo_intento  timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index on public.outbox_facturacion (estado, proximo_intento);

-- Auditoría
create table public.audit_log (
  id          bigint generated always as identity primary key,
  tenant_id   uuid,
  usuario_id  uuid,
  accion      text not null,           -- INSERT / UPDATE / DELETE / ANULAR / LOGIN ...
  tabla       text not null,
  registro_id text,
  antes       jsonb,
  despues     jsonb,
  created_at  timestamptz not null default now()
);
create index on public.audit_log (tenant_id, tabla, created_at desc);

create or replace function public.trg_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log (tenant_id, usuario_id, accion, tabla, registro_id, antes, despues)
  values (
    coalesce((case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end ->> 'tenant_id')::uuid, public.current_tenant_id()),
    auth.uid(),
    tg_op,
    tg_table_name,
    case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return null;
end $$;

-- Auditar tablas sensibles
do $$
declare t text;
begin
  foreach t in array array['productos','producto_presentaciones','ventas','perfiles','convenios','proveedores'] loop
    execute format('create trigger tg_audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.trg_audit()', t);
  end loop;
end $$;

-- updated_at automático
do $$
declare t text;
begin
  foreach t in array array['tenants','sucursales','perfiles','productos','producto_presentaciones',
                           'compras','clientes','ventas','comprobantes_electronicos'] loop
    execute format('create trigger tg_updated_%1$s before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
```

---

## 7. Seguridad: Auth, claims y RLS

### 7.1 Custom Access Token Hook

```sql
-- supabase/migrations/0008_auth_hook.sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_claims     jsonb := event -> 'claims';
  v_user       uuid  := (event ->> 'user_id')::uuid;
  v_perfil     record;
  v_sucursales jsonb;
begin
  select p.tenant_id, p.rol, p.activo
    into v_perfil
    from public.perfiles p
   where p.id = v_user;

  if found and v_perfil.activo then
    select coalesce(jsonb_agg(us.sucursal_id), '[]'::jsonb)
      into v_sucursales
      from public.usuario_sucursal us
     where us.perfil_id = v_user;

    v_claims := jsonb_set(v_claims, '{tenant_id}',    to_jsonb(v_perfil.tenant_id));
    v_claims := jsonb_set(v_claims, '{user_role}',    to_jsonb(v_perfil.rol::text));
    v_claims := jsonb_set(v_claims, '{sucursal_ids}', v_sucursales);
  end if;

  return jsonb_set(event, '{claims}', v_claims);
end $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant select on public.perfiles, public.usuario_sucursal to supabase_auth_admin;

-- El hook lee estas tablas con RLS activa → política explícita
create policy "auth_admin_lee_perfiles" on public.perfiles
  as permissive for select to supabase_auth_admin using (true);
create policy "auth_admin_lee_usuario_sucursal" on public.usuario_sucursal
  as permissive for select to supabase_auth_admin using (true);
```

> Activar el hook en **Authentication → Hooks → Custom Access Token** apuntando a `public.custom_access_token_hook`.
> Si cambia el rol/sucursales de un usuario, forzar refresh de sesión (o cerrar sesión) para regenerar el JWT.

### 7.2 Políticas RLS

```sql
-- supabase/migrations/0009_rls.sql

-- 1) Activar RLS + política de lectura por tenant en todas las tablas con tenant_id
do $$
declare t text;
begin
  foreach t in array array[
    'sucursales','perfiles','usuario_sucursal','cajas','series_comprobante','turnos_caja','movimientos_caja',
    'laboratorios','categorias','productos','producto_principios_activos','producto_presentaciones','producto_sucursal',
    'lotes','stock_lotes','movimientos_stock','proveedores','compras','compra_items',
    'transferencias','transferencia_items','clientes','medicos','convenios',
    'ventas','venta_items','venta_item_lotes','venta_pagos','recetas',
    'libro_controlados','comprobantes_electronicos','outbox_facturacion','audit_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (tenant_id = (select public.current_tenant_id()))',
      t || '_tenant_select', t);
  end loop;
end $$;

alter table public.tenants enable row level security;
create policy tenants_select on public.tenants for select to authenticated
  using (id = (select public.current_tenant_id()));
create policy tenants_update on public.tenants for update to authenticated
  using (id = (select public.current_tenant_id()) and public.tiene_rol('propietario'))
  with check (id = (select public.current_tenant_id()));

-- Catálogos globales: lectura para cualquier autenticado
alter table public.formas_farmaceuticas enable row level security;
alter table public.principios_activos   enable row level security;
create policy formas_select      on public.formas_farmaceuticas for select to authenticated using (true);
create policy principios_select  on public.principios_activos   for select to authenticated using (true);

-- 2) Escrituras por rol (catálogo / maestros)
do $$
declare t text;
begin
  foreach t in array array['laboratorios','categorias','productos','producto_principios_activos',
                           'producto_presentaciones','producto_sucursal','proveedores','medicos'] loop
    execute format($f$
      create policy %I on public.%I for all to authenticated
      using (tenant_id = (select public.current_tenant_id())
             and public.tiene_rol('propietario','administrador','director_tecnico','almacenero'))
      with check (tenant_id = (select public.current_tenant_id())
             and public.tiene_rol('propietario','administrador','director_tecnico','almacenero'))
    $f$, t || '_write', t);
  end loop;
end $$;

-- Clientes: también los cajeros pueden crear/editar
create policy clientes_write on public.clientes for all to authenticated
  using (tenant_id = (select public.current_tenant_id())
         and public.tiene_rol('propietario','administrador','director_tecnico','cajero'))
  with check (tenant_id = (select public.current_tenant_id())
         and public.tiene_rol('propietario','administrador','director_tecnico','cajero'));

-- Administración de estructura
do $$
declare t text;
begin
  foreach t in array array['sucursales','cajas','series_comprobante','convenios','usuario_sucursal'] loop
    execute format($f$
      create policy %I on public.%I for all to authenticated
      using (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('propietario','administrador'))
      with check (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('propietario','administrador'))
    $f$, t || '_write', t);
  end loop;
end $$;

create policy perfiles_write on public.perfiles for all to authenticated
  using (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('propietario','administrador'))
  with check (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('propietario','administrador'));

-- 3) Restricción por sucursal en datos operativos (lectura)
--    Propietario/administrador/contador ven todas; el resto, solo sus sucursales.
drop policy ventas_tenant_select on public.ventas;
create policy ventas_select on public.ventas for select to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (sucursal_id = any ((select public.current_sucursal_ids()))
         or public.tiene_rol('propietario','administrador','contador'))
  );

drop policy stock_lotes_tenant_select on public.stock_lotes;
create policy stock_lotes_select on public.stock_lotes for select to authenticated
  using (
    tenant_id = (select public.current_tenant_id())
    and (sucursal_id = any ((select public.current_sucursal_ids()))
         or public.tiene_rol('propietario','administrador','contador'))
  );

-- Libro de controlados: solo dirección técnica y administración
drop policy libro_controlados_tenant_select on public.libro_controlados;
create policy libro_controlados_select on public.libro_controlados for select to authenticated
  using (tenant_id = (select public.current_tenant_id())
         and public.tiene_rol('propietario','administrador','director_tecnico'));

-- El QF valida (única modificación permitida)
create policy libro_controlados_validar on public.libro_controlados for update to authenticated
  using (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('director_tecnico'))
  with check (tenant_id = (select public.current_tenant_id()) and public.tiene_rol('director_tecnico'));

-- 4) Tablas transaccionales: SIN políticas de escritura directa.
--    ventas, venta_*, movimientos_stock, stock_lotes, compras*, transferencias*, recetas,
--    turnos_caja, outbox, comprobantes se modifican solo vía RPC SECURITY DEFINER.
revoke insert, update, delete on
  public.ventas, public.venta_items, public.venta_item_lotes, public.venta_pagos,
  public.movimientos_stock, public.stock_lotes, public.recetas,
  public.outbox_facturacion, public.comprobantes_electronicos, public.audit_log
from authenticated, anon;

-- Append-only: ni siquiera UPDATE salvo validación en libro
revoke delete on public.libro_controlados from authenticated, anon;
revoke insert on public.libro_controlados from authenticated, anon;
revoke update on public.libro_controlados from authenticated, anon;
grant update (validado_por, validado_at) on public.libro_controlados to authenticated;

-- Funciones de negocio: solo usuarios autenticados
revoke execute on all functions in schema public from anon;
```

> **Tests obligatorios con pgTAP**: un usuario del tenant A nunca ve filas del tenant B; un cajero de la sucursal 1 no ve ventas de la sucursal 2; nadie puede hacer `UPDATE`/`DELETE` sobre kardex ni libro.

---

## 8. Funciones críticas (RPC / triggers)

### 8.1 `registrar_venta` — venta atómica con FEFO

Payload esperado:

```json
{
  "offline_id": "6f1e9a0e-6a7c-4a8e-9f5e-0e7a1d2c3b4a",
  "sucursal_id": "uuid",
  "caja_id": "uuid",
  "cliente_id": null,
  "convenio_id": null,
  "tipo_comprobante": "boleta",
  "items": [
    { "presentacion_id": "uuid", "cantidad": 2, "descuento": 0 }
  ],
  "pagos": [ { "metodo": "efectivo", "monto": 20.00 } ],
  "receta": {
    "medico_id": null,
    "medico_nombre": "Juan Pérez",
    "medico_cmp": "12345",
    "paciente_nombre": "María López",
    "paciente_documento": "44556677",
    "numero_receta": "R-0001",
    "fecha_emision": "2026-10-13",
    "retenida": false,
    "imagen_path": null
  }
}
```

```sql
-- supabase/migrations/0010_rpc_registrar_venta.sql
create or replace function public.registrar_venta(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  c_igv          constant numeric := 0.18;
  v_tenant       uuid    := public.current_tenant_id();
  v_user         uuid    := auth.uid();
  v_sucursal     uuid    := (p ->> 'sucursal_id')::uuid;
  v_tipo         tipo_comprobante := (p ->> 'tipo_comprobante')::tipo_comprobante;
  v_caja         public.cajas%rowtype;
  v_turno        uuid;
  v_serie        char(4);
  v_numero       integer;
  v_venta        uuid;
  v_existente    uuid;
  v_cliente      public.clientes%rowtype;
  v_item         jsonb;
  v_pres         record;
  v_item_id      uuid;
  v_lote         record;
  v_cant         integer;
  v_requerido    integer;
  v_tomar        integer;
  v_precio       numeric;
  v_desc         numeric;
  v_total_item   numeric;
  v_valor        numeric;
  v_igv_item     numeric;
  v_max_desc_pct numeric;
  v_sub_grav     numeric := 0;
  v_sub_exo      numeric := 0;
  v_sub_ina      numeric := 0;
  v_igv_total    numeric := 0;
  v_desc_total   numeric := 0;
  v_total        numeric := 0;
  v_pagado       numeric := 0;
  v_req_receta   boolean := false;
  v_pago         jsonb;
  v_receta_id    uuid;
begin
  -- Autorización
  if v_tenant is null or v_user is null then
    raise exception 'No autenticado' using errcode = '28000';
  end if;
  if not public.tiene_rol('propietario','administrador','director_tecnico','cajero') then
    raise exception 'Rol sin permiso para vender' using errcode = '42501';
  end if;
  if not (v_sucursal = any (public.current_sucursal_ids()) or public.tiene_rol('propietario','administrador')) then
    raise exception 'Sucursal no autorizada' using errcode = '42501';
  end if;
  if v_tipo not in ('boleta','factura','nota_venta') then
    raise exception 'Tipo de comprobante inválido para venta: %', v_tipo;
  end if;

  -- Idempotencia (reintentos / sincronización offline)
  if p ? 'offline_id' and p ->> 'offline_id' is not null then
    select id into v_existente from public.ventas
     where tenant_id = v_tenant and offline_id = (p ->> 'offline_id')::uuid;
    if found then
      return v_existente;
    end if;
  end if;

  -- Caja y turno
  select * into v_caja from public.cajas
   where id = (p ->> 'caja_id')::uuid and tenant_id = v_tenant and sucursal_id = v_sucursal and activo;
  if not found then raise exception 'Caja inválida'; end if;

  select id into v_turno from public.turnos_caja
   where caja_id = v_caja.id and estado = 'abierto';
  if v_turno is null then raise exception 'No hay turno de caja abierto'; end if;

  -- Cliente
  if p ->> 'cliente_id' is not null then
    select * into v_cliente from public.clientes
     where id = (p ->> 'cliente_id')::uuid and tenant_id = v_tenant;
    if not found then raise exception 'Cliente no encontrado'; end if;
  end if;
  if v_tipo = 'factura' and (v_cliente.id is null or v_cliente.tipo_documento <> 'ruc') then
    raise exception 'La factura requiere un cliente con RUC';
  end if;

  -- Límite de descuento del cajero (configurable por tenant)
  select coalesce((configuracion ->> 'max_descuento_cajero_pct')::numeric, 10)
    into v_max_desc_pct from public.tenants where id = v_tenant;

  -- Correlativo atómico por caja/serie
  update public.series_comprobante
     set ultimo_numero = ultimo_numero + 1
   where tenant_id = v_tenant and caja_id = v_caja.id and tipo = v_tipo
  returning serie, ultimo_numero into v_serie, v_numero;
  if not found then
    raise exception 'Serie no configurada para % en esta caja', v_tipo;
  end if;

  -- Cabecera (totales se actualizan al final)
  insert into public.ventas (tenant_id, sucursal_id, caja_id, turno_id, offline_id, cliente_id, convenio_id,
                             vendedor_id, tipo_comprobante, serie, numero)
  values (v_tenant, v_sucursal, v_caja.id, v_turno,
          nullif(p ->> 'offline_id','')::uuid, v_cliente.id, nullif(p ->> 'convenio_id','')::uuid,
          v_user, v_tipo, v_serie, v_numero)
  returning id into v_venta;

  -- Ítems
  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    select pp.id as presentacion_id, pp.producto_id, pp.factor_base, pp.nombre as presentacion,
           pp.precio_venta, pr.nombre_comercial, pr.concentracion, pr.tipo_afectacion_igv,
           pr.condicion_venta, pr.costo_promedio
      into v_pres
      from public.producto_presentaciones pp
      join public.productos pr on pr.id = pp.producto_id
     where pp.id = (v_item ->> 'presentacion_id')::uuid
       and pp.tenant_id = v_tenant and pp.activo and pr.activo;
    if not found then raise exception 'Presentación inválida o inactiva'; end if;

    if v_pres.condicion_venta <> 'sin_receta' then v_req_receta := true; end if;

    v_cant  := (v_item ->> 'cantidad')::integer;
    v_desc  := coalesce((v_item ->> 'descuento')::numeric, 0);
    v_precio := v_pres.precio_venta;                       -- precio SIEMPRE desde el catálogo
    if v_cant <= 0 then raise exception 'Cantidad inválida'; end if;
    if v_desc < 0 or v_desc > round(v_cant * v_precio, 2) then raise exception 'Descuento inválido'; end if;
    if public.tiene_rol('cajero') and v_desc > round(v_cant * v_precio * v_max_desc_pct / 100, 2) then
      raise exception 'Descuento supera el límite permitido (% %%) para cajero', v_max_desc_pct;
    end if;

    v_total_item := round(v_cant * v_precio - v_desc, 2);
    if v_pres.tipo_afectacion_igv = 'gravado' then
      v_valor    := round(v_total_item / (1 + c_igv), 2);
      v_igv_item := v_total_item - v_valor;
      v_sub_grav := v_sub_grav + v_valor;
    elsif v_pres.tipo_afectacion_igv = 'exonerado' then
      v_valor := v_total_item; v_igv_item := 0; v_sub_exo := v_sub_exo + v_valor;
    else
      v_valor := v_total_item; v_igv_item := 0; v_sub_ina := v_sub_ina + v_valor;
    end if;
    v_igv_total  := v_igv_total + v_igv_item;
    v_desc_total := v_desc_total + v_desc;
    v_total      := v_total + v_total_item;

    insert into public.venta_items (tenant_id, venta_id, producto_id, presentacion_id, descripcion, cantidad,
                                    factor_base, precio_unitario, descuento, tipo_afectacion_igv,
                                    valor_venta, igv, total, costo_unitario_base)
    values (v_tenant, v_venta, v_pres.producto_id, v_pres.presentacion_id,
            trim(v_pres.nombre_comercial || ' ' || coalesce(v_pres.concentracion, '') || ' — ' || v_pres.presentacion),
            v_cant, v_pres.factor_base, v_precio, v_desc, v_pres.tipo_afectacion_igv,
            v_valor, v_igv_item, v_total_item, v_pres.costo_promedio)
    returning id into v_item_id;

    -- FEFO: lotes disponibles, no vencidos, el más próximo a vencer primero
    v_requerido := v_cant * v_pres.factor_base;
    for v_lote in
      select sl.lote_id, sl.cantidad_base
        from public.stock_lotes sl
        join public.lotes l on l.id = sl.lote_id
       where sl.sucursal_id = v_sucursal
         and sl.producto_id = v_pres.producto_id
         and sl.estado = 'disponible'
         and sl.cantidad_base > 0
         and l.fecha_vencimiento > current_date
       order by l.fecha_vencimiento asc, l.created_at asc
       for update of sl
    loop
      exit when v_requerido = 0;
      v_tomar := least(v_lote.cantidad_base, v_requerido);

      insert into public.venta_item_lotes (venta_item_id, lote_id, tenant_id, cantidad_base)
      values (v_item_id, v_lote.lote_id, v_tenant, v_tomar);

      insert into public.movimientos_stock (tenant_id, sucursal_id, lote_id, producto_id, tipo, cantidad_base,
                                            costo_unitario_base, referencia_tipo, referencia_id, usuario_id)
      values (v_tenant, v_sucursal, v_lote.lote_id, v_pres.producto_id, 'venta', -v_tomar,
              v_pres.costo_promedio, 'venta', v_venta, v_user);

      v_requerido := v_requerido - v_tomar;
    end loop;

    if v_requerido > 0 then
      raise exception 'Stock insuficiente de % (faltan % unidades base)', v_pres.nombre_comercial, v_requerido
        using errcode = 'P0001';
    end if;
  end loop;

  -- Reglas SUNAT / sanitarias
  if v_tipo = 'boleta' and v_total >= 700 and v_cliente.id is null then
    raise exception 'Las boletas desde S/ 700.00 requieren identificar al cliente';
  end if;
  if v_req_receta and (p -> 'receta') is null then
    raise exception 'La venta incluye productos que requieren receta';
  end if;

  -- Pagos
  for v_pago in select * from jsonb_array_elements(p -> 'pagos') loop
    insert into public.venta_pagos (tenant_id, venta_id, metodo, monto, referencia)
    values (v_tenant, v_venta, (v_pago ->> 'metodo')::metodo_pago, (v_pago ->> 'monto')::numeric,
            v_pago ->> 'referencia');
    v_pagado := v_pagado + (v_pago ->> 'monto')::numeric;
  end loop;
  if v_pagado < v_total then
    raise exception 'Pago insuficiente: total % y pagado %', v_total, v_pagado;
  end if;

  -- Receta
  if (p -> 'receta') is not null then
    insert into public.recetas (tenant_id, venta_id, medico_id, medico_nombre, medico_cmp, paciente_nombre,
                                paciente_documento, numero_receta, fecha_emision, diagnostico_cie10,
                                retenida, imagen_path, registrado_por)
    values (v_tenant, v_venta,
            nullif(p -> 'receta' ->> 'medico_id','')::uuid,
            p -> 'receta' ->> 'medico_nombre', p -> 'receta' ->> 'medico_cmp',
            p -> 'receta' ->> 'paciente_nombre', p -> 'receta' ->> 'paciente_documento',
            p -> 'receta' ->> 'numero_receta', (p -> 'receta' ->> 'fecha_emision')::date,
            p -> 'receta' ->> 'diagnostico_cie10',
            coalesce((p -> 'receta' ->> 'retenida')::boolean, false),
            p -> 'receta' ->> 'imagen_path', v_user)
    returning id into v_receta_id;

    update public.libro_controlados
       set receta_id = v_receta_id
     where referencia_tipo = 'venta' and referencia_id = v_venta;
  end if;

  -- Totales
  update public.ventas
     set subtotal_gravado = v_sub_grav, subtotal_exonerado = v_sub_exo, subtotal_inafecto = v_sub_ina,
         igv = v_igv_total, descuento_total = v_desc_total, total = v_total,
         requiere_receta = v_req_receta
   where id = v_venta;

  -- Outbox de facturación (boleta/factura)
  if v_tipo in ('boleta','factura') then
    insert into public.comprobantes_electronicos (tenant_id, venta_id) values (v_tenant, v_venta);
    insert into public.outbox_facturacion (tenant_id, venta_id, payload)
    values (v_tenant, v_venta, jsonb_build_object('venta_id', v_venta, 'tipo', v_tipo, 'serie', v_serie, 'numero', v_numero));
  end if;

  return v_venta;
end $$;

revoke all on function public.registrar_venta(jsonb) from public, anon;
grant execute on function public.registrar_venta(jsonb) to authenticated;
```

### 8.2 `recibir_compra` — lotes, costo promedio y kardex

```sql
create or replace function public.recibir_compra(p_compra_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tenant uuid := public.current_tenant_id();
  v_c      public.compras%rowtype;
  v_i      record;
  v_lote   uuid;
  v_stock  integer;
begin
  if not public.tiene_rol('propietario','administrador','almacenero') then
    raise exception 'Rol sin permiso para recibir compras' using errcode = '42501';
  end if;

  select * into v_c from public.compras
   where id = p_compra_id and tenant_id = v_tenant for update;
  if not found then raise exception 'Compra no encontrada'; end if;
  if v_c.estado <> 'borrador' then raise exception 'La compra ya fue procesada'; end if;
  if not (v_c.sucursal_id = any (public.current_sucursal_ids()) or public.tiene_rol('propietario','administrador')) then
    raise exception 'Sucursal no autorizada' using errcode = '42501';
  end if;

  for v_i in select * from public.compra_items where compra_id = p_compra_id loop
    if v_i.fecha_vencimiento <= current_date then
      raise exception 'No se puede recibir un lote vencido (lote %)', v_i.numero_lote;
    end if;

    insert into public.lotes (tenant_id, producto_id, numero_lote, fecha_vencimiento)
    values (v_tenant, v_i.producto_id, v_i.numero_lote, v_i.fecha_vencimiento)
    on conflict (producto_id, numero_lote, fecha_vencimiento)
    do update set numero_lote = excluded.numero_lote
    returning id into v_lote;

    update public.compra_items set lote_id = v_lote where id = v_i.id;

    -- Costo promedio ponderado (sobre stock total del tenant, sin IGV)
    select coalesce(sum(cantidad_base), 0) into v_stock
      from public.stock_lotes
     where tenant_id = v_tenant and producto_id = v_i.producto_id;

    update public.productos
       set costo_promedio = case
             when v_stock + v_i.cantidad_base > 0
             then round(((costo_promedio * v_stock) + (v_i.costo_unitario_base * v_i.cantidad_base))
                        / (v_stock + v_i.cantidad_base), 6)
             else v_i.costo_unitario_base end,
           costo_ultimo = v_i.costo_unitario_base
     where id = v_i.producto_id;

    insert into public.movimientos_stock (tenant_id, sucursal_id, lote_id, producto_id, tipo, cantidad_base,
                                          costo_unitario_base, referencia_tipo, referencia_id, usuario_id)
    values (v_tenant, v_c.sucursal_id, v_lote, v_i.producto_id, 'compra', v_i.cantidad_base,
            v_i.costo_unitario_base, 'compra', p_compra_id, auth.uid());
  end loop;

  update public.compras
     set estado = 'recibida', fecha_recepcion = current_date
   where id = p_compra_id;
end $$;

revoke all on function public.recibir_compra(uuid) from public, anon;
grant execute on function public.recibir_compra(uuid) to authenticated;
```

### 8.3 Otras funciones a implementar (mismo patrón `SECURITY DEFINER` + validación de rol/sucursal)

| Función | Qué hace |
|---|---|
| `anular_venta(p_venta_id, p_motivo)` | Solo `director_tecnico` / admin. Revierte stock usando `venta_item_lotes` (`devolucion_cliente`), marca la venta `anulada`, encola nota de crédito o comunicación de baja. |
| `abrir_turno(p_caja_id, p_monto)` / `cerrar_turno(p_turno_id, p_monto_declarado)` | Calcula monto del sistema (apertura + efectivo de ventas + ingresos − egresos), diferencia y cierra. |
| `ajustar_stock(p_sucursal, p_lote, p_cantidad, p_tipo, p_motivo)` | Ajustes, mermas y bajas por vencimiento (siempre con motivo; controlados exigen validación QF). |
| `enviar_transferencia(id)` / `recibir_transferencia(id)` | Salida del origen → entrada en destino, con estados y trazabilidad por lote. |
| `marcar_vencidos()` | `pg_cron` diario: cambia `stock_lotes.estado = 'vencido'` donde `fecha_vencimiento <= current_date`. |
| `buscar_productos(p_q, p_sucursal)` | Búsqueda con `unaccent` + trigram, devuelve stock disponible, precio y alternativas. |
| `alternativas_producto(p_producto_id, p_sucursal)` | Mismo principio activo + concentración + forma, ordenadas por precio. |

---

## 9. Estructura del proyecto Next.js

```
botigest/
├─ supabase/
│  ├─ migrations/                 # 0001_base.sql … 0010_rpc_registrar_venta.sql
│  ├─ functions/
│  │  ├─ procesar-outbox/         # Edge Function: envía a la API de facturación
│  │  └─ alertas-vencimiento/     # Edge Function: correos/WhatsApp de alertas
│  ├─ tests/                      # pgTAP (RLS y reglas de negocio)
│  ├─ seed.sql
│  └─ config.toml
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx            # sidebar + selector de sucursal
│  │  │  ├─ dashboard/
│  │  │  ├─ pos/                  # pantalla de venta (full screen)
│  │  │  ├─ ventas/               # historial, detalle, anulación
│  │  │  ├─ caja/                 # turnos, arqueo, movimientos
│  │  │  ├─ inventario/
│  │  │  │  ├─ productos/
│  │  │  │  ├─ lotes/
│  │  │  │  ├─ kardex/
│  │  │  │  ├─ ajustes/
│  │  │  │  ├─ transferencias/
│  │  │  │  └─ vencimientos/
│  │  │  ├─ compras/
│  │  │  ├─ proveedores/
│  │  │  ├─ clientes/
│  │  │  ├─ controlados/          # libro, validación QF, recetas
│  │  │  ├─ reportes/
│  │  │  └─ configuracion/
│  │  │     ├─ sucursales/ · usuarios/ · cajas-series/ · convenios/ · facturacion/ · general/
│  │  └─ api/
│  │     ├─ webhooks/facturacion/route.ts   # callback de la API SUNAT
│  │     └─ health/route.ts
│  ├─ features/
│  │  └─ <modulo>/                # productos, ventas, inventario, compras, caja, controlados, clientes…
│  │     ├─ actions.ts            # Server Actions (validan con Zod, llaman RPC)
│  │     ├─ queries.ts            # lecturas tipadas
│  │     ├─ schemas.ts            # Zod
│  │     ├─ types.ts
│  │     ├─ hooks/
│  │     └─ components/
│  ├─ components/
│  │  ├─ ui/                      # shadcn/ui
│  │  └─ shared/                  # DataTable, SearchCombobox, MoneyInput, DatePicker…
│  ├─ lib/
│  │  ├─ supabase/{client,server,middleware,admin}.ts
│  │  ├─ facturacion/client.ts    # cliente tipado de la API central
│  │  ├─ offline/{db,sync,queue}.ts
│  │  ├─ permissions.ts           # matriz rol → acciones (UI), espejo de RLS
│  │  ├─ money.ts                 # redondeos, IGV
│  │  ├─ print/{ticket,etiqueta}.ts
│  │  └─ utils.ts
│  ├─ types/database.ts           # generado por supabase gen types
│  └─ middleware.ts               # refresco de sesión + protección de rutas
├─ e2e/                           # Playwright
├─ .env.example
└─ package.json
```

### Convenciones

- **TypeScript `strict`**, sin `any`; tipos de BD generados y re-exportados por feature.
- Toda mutación pasa por **Server Action → Zod → RPC**; el cliente nunca escribe directo en tablas transaccionales.
- `permissions.ts` oculta/deshabilita UI por rol, pero **la autoridad real es RLS + RPC**.
- Errores de negocio con códigos (`P0001` stock, `42501` permisos) mapeados a mensajes en UI.

---

## 10. Flujos clave

### 10.1 Venta en POS

```
Escanear / buscar → agregar presentación → (si Rx: pedir receta) → cliente (opcional; obligatorio factura o boleta ≥ S/700)
→ pagos (mixtos) → registrar_venta() [FEFO + kardex + correlativo + outbox]
→ imprimir ticket → (async) outbox → API SUNAT → webhook actualiza estado
```

- Si el stock es insuficiente: mensaje por producto y sugerencia de otra presentación/alternativa.
- Si el producto es controlado: exige receta con CMP y paciente; se genera asiento en `libro_controlados`.

### 10.2 Compra y recepción

```
Orden de compra (borrador) → registrar factura del proveedor + ítems con lote y vencimiento
→ recibir_compra() → crea lotes, actualiza costo promedio, kardex 'compra' → etiquetas/ubicación
```

### 10.3 Vencimientos

```
pg_cron diario → marcar_vencidos() → v_lotes_por_vencer
→ alertas (90/60/30 días) → acciones: promoción, devolución a proveedor, baja (merma 'vencimiento' con acta)
```

### 10.4 Anulación

```
Autorización (QF/admin) + motivo → anular_venta() → devuelve stock a los mismos lotes
→ NC / comunicación de baja SUNAT según plazo y tipo
```

### 10.5 Cierre de caja

```
cerrar_turno() → totales por método de pago → conteo físico → diferencia → reporte PDF → bloqueo del turno
```

---

## 11. Facturación electrónica (API central SUNAT)

La botica **no** firma XML ni habla con SUNAT. Consume la API centralizada (proyecto independiente que ya tienes planeado) que centraliza certificados digitales, usuario SOL y envío.

### Contrato propuesto

`POST {FACTURACION_API}/v1/comprobantes`  (Bearer + `Idempotency-Key = venta.id`)

```json
{
  "emisor_ruc": "20123456789",
  "tipo": "boleta",
  "serie": "B001",
  "numero": 154,
  "fecha_emision": "2026-10-13T10:15:00-05:00",
  "moneda": "PEN",
  "cliente": { "tipo_documento": "dni", "numero_documento": "44556677", "nombre": "María López" },
  "items": [
    {
      "descripcion": "Paracetamol 500 mg — Caja x100",
      "cantidad": 1,
      "unidad": "NIU",
      "valor_unitario": 21.19,
      "precio_unitario": 25.00,
      "tipo_afectacion_igv": "gravado",
      "igv": 3.81,
      "total": 25.00
    }
  ],
  "totales": { "gravado": 21.19, "exonerado": 0, "inafecto": 0, "igv": 3.81, "total": 25.00 },
  "callback_url": "https://app.botigest.pe/api/webhooks/facturacion"
}
```

Respuesta: `202 { "external_id": "…", "estado": "pendiente" }`.
Webhook de vuelta: `{ external_id, venta_ref, estado, hash, codigo_sunat, mensaje, pdf_url, xml_url, cdr_url }` firmado con HMAC (`X-Signature`).

### Worker del outbox

- Edge Function programada con `pg_cron` (cada minuto) toma `outbox_facturacion` en `pendiente` con `proximo_intento <= now()` usando `FOR UPDATE SKIP LOCKED`.
- Reintentos con backoff exponencial (1, 2, 4, 8… min, máximo 10 intentos → `fallido` + alerta).
- Estado visible en el POS y en el historial de ventas (badge: pendiente / aceptado / rechazado).
- Los rechazos de SUNAT generan una tarea para corregir y reenviar.

> En la fase 1 se puede emitir **nota de venta interna** si la API de facturación aún no está lista; el outbox se activa sin cambiar el modelo.

---

## 12. Modo offline (PWA)

Conexión inestable es común en boticas de provincia; el POS debe seguir vendiendo.

- **Service Worker** (Serwist) cachea app shell y assets.
- **Dexie (IndexedDB)** guarda: catálogo (productos + presentaciones + códigos), snapshot de stock disponible por lote de la sucursal, clientes frecuentes y la **cola de ventas pendientes**.
- Cada venta offline genera `offline_id` (UUID) y se numera con la **serie de la caja** (por eso las series son por caja: sin colisiones entre terminales).
- Sincronización: al recuperar conexión, la cola llama `registrar_venta` (idempotente por `offline_id`) en orden.
- Conflictos: si el stock real ya no alcanza al sincronizar, la venta queda en estado **"requiere revisión"** (flujo de excepción, nunca se pierde).
- Limitaciones offline: no consultar stock de otras sucursales, no anular ventas, no validar contra la API de facturación (el envío se hace al sincronizar).
- La emisión de comprobantes en contingencia debe validarse con el contador (reglas SUNAT de emisión sin conexión).

---

## 13. Reportes y alertas

### Reportes

| Reporte | Filtros |
|---|---|
| Ventas por día / hora / sucursal / caja / vendedor | rango, sucursal |
| Ventas por método de pago | rango |
| Margen por producto / categoría / laboratorio | rango |
| ABC de productos (Pareto) y rotación | rango |
| Productos por vencer / vencidos / valorizado en riesgo | días |
| Stock bajo y **sugerido de compra** | sucursal |
| Kardex valorizado (por producto, lote, rango) | |
| **Libro de controlados** (PDF imprimible, con firma QF) | rango, producto |
| Recetas atendidas (por médico / paciente / producto) | rango |
| Trazabilidad de lote (a quién se vendió) — *recall* | lote |
| Registro de ventas y compras (**PLE**) | período |
| Precios para Observatorio DIGEMID | fecha |
| Cierre de caja | turno |
| Comisiones por vendedor | rango |

### Alertas (in-app + correo / WhatsApp)

- Lotes a 90 / 60 / 30 días de vencer; lotes vencidos aún con stock.
- Stock bajo el mínimo.
- Ventas rechazadas por SUNAT / outbox fallido.
- Diferencias de caja por encima de un umbral.
- Libro de controlados pendiente de validación del QF.

---

## 14. Hardware e impresión

| Elemento | Opción recomendada |
|---|---|
| Lector de código de barras | USB tipo *keyboard wedge* (sin drivers; el POS captura el input con foco permanente) |
| Impresora de tickets | Térmica 80 mm (ESC/POS). Impresión vía `window.print()` con CSS 80 mm; opcional QZ Tray / WebUSB para impresión directa y apertura de gaveta |
| Cajón de dinero | Conectado a la impresora (pulso ESC/POS) |
| Etiquetas | Impresora de etiquetas para ubicación/lote (fase 2) |
| Balanza | No aplica (v1) |
| Equipo | PC básica o tablet con navegador moderno; PWA instalable |

Atajos de teclado en POS (ejemplo): `F2` buscar · `F4` cliente · `F6` descuento · `F8` pagar · `F9` retener venta · `Esc` cancelar.

---

## 15. Seguridad, auditoría y datos personales

- **Aislamiento**: RLS en el 100 % de las tablas; pruebas pgTAP en CI bloquean el merge si se rompe.
- **Escrituras críticas** únicamente vía RPC `SECURITY DEFINER` con `search_path` fijo y validación de rol/sucursal.
- **Append-only** en kardex, libro de controlados y auditoría (sin `UPDATE`/`DELETE` para `authenticated`).
- **Auditoría** de cambios de precios, productos, usuarios, anulaciones y accesos.
- **Datos de salud (Ley 29733)**: consentimiento del cliente, acceso de recetas solo para roles autorizados, bucket privado con URLs firmadas de corta duración, política de retención definida con asesoría legal, registro del banco de datos ante la ANPD.
- **Secretos**: `SUPABASE_SERVICE_ROLE_KEY` y credenciales de la API de facturación solo en servidor; nunca en el cliente.
- **Backups**: PITR de Supabase + exportación periódica; prueba de restauración trimestral.
- **Autenticación**: contraseñas robustas, MFA opcional para propietario/QF, bloqueo por intentos, cierre de sesión por inactividad en POS.
- **Rate limiting** en endpoints públicos (webhook con HMAC y verificación de timestamp).

---

## 16. Roadmap por fases

> Estimaciones orientativas para 1 desarrollador full-stack con jornada completa.

### Fase 0 — Fundaciones (1 semana)
- Repo, CI, Supabase (proyectos dev/prod), migraciones 0001–0004, Auth Hook, RLS base, tipos generados, layout, login, selector de sucursal.
- Seed: formas farmacéuticas, principios activos básicos, tenant demo.

### Fase 1 — MVP vendible (6–8 semanas)
- Catálogo (productos, presentaciones, DCI, importación Excel).
- Compras y recepción con lote/vencimiento; kardex; stock por lote.
- **POS** con FEFO, pagos mixtos, caja y turnos, nota de venta + boleta/factura vía API (o diferida).
- Usuarios y roles, sucursales, series por caja.
- Reportes básicos (ventas, stock, vencimientos) y cierre de caja.
- Pruebas pgTAP de RLS y e2e del flujo de venta.

### Fase 2 — Cumplimiento y operación multi-sucursal (4–6 semanas)
- Recetas + **libro de controlados** + validación del QF.
- Transferencias entre sucursales, ajustes/mermas con motivo, conteo físico.
- Alertas de vencimiento y stock bajo; sugerido de compra.
- Anulaciones y notas de crédito; devoluciones a proveedor.
- Reportes PLE, trazabilidad de lote, exportables DIGEMID.

### Fase 3 — Experiencia y escalabilidad (4–6 semanas)
- **Modo offline (PWA)**.
- Clientes, puntos, convenios, promociones (2x1, % por categoría, por vencer).
- Cadena de frío (registro de temperatura), etiquetas.
- Facturación SaaS (planes, suscripciones, límites por plan) y onboarding de tenants.
- Notificaciones por WhatsApp/correo.

### Fase 4 — Crecimiento
- BI/dashboards avanzados, predicción de demanda y reposición automática.
- Integración con distribuidores (pedidos electrónicos), delivery, e-commerce.
- Integración con aseguradoras/EPS y recetas electrónicas (si el ecosistema lo permite).
- App móvil de conteo/recepción con cámara.

---

## 17. Riesgos y decisiones pendientes

### Riesgos

| Riesgo | Mitigación |
|---|---|
| Errores normativos (controlados, recetas, IGV) | Validación con QF y contador desde la fase 0; reglas parametrizables por tenant |
| Datos de catálogo incompletos (miles de SKUs) | Importación masiva, catálogo base compartido de DCI, plantillas por laboratorio |
| Concurrencia de stock en ventas simultáneas | `FOR UPDATE` en lotes dentro de la RPC; tests de concurrencia |
| Dependencia de la API de facturación | Outbox con reintentos; nota de venta como fallback |
| Conexión inestable | PWA offline + series por caja |
| Resistencia al cambio del personal | UX tipo teclado/atajos, capacitación y modo de migración con stock inicial por Excel |
| Crecimiento de tablas (kardex, ventas) | Índices correctos; particionado mensual cuando superen ~5–10 M de filas |

### Decisiones pendientes (para cerrar antes de la fase 1)

1. **Modelo comercial**: ¿una sola botica, cadena, o SaaS para múltiples clientes desde el día 1?
2. **Facturación**: ¿la API central SUNAT estará lista en fase 1 o se arranca con nota de venta?
3. **Precios por sucursal**: ¿precio único por tenant o por sucursal? (hoy: único; extensible con `precios_sucursal`).
4. **Catálogo inicial**: ¿importar un catálogo base de productos (por ejemplo desde datos abiertos de DIGEMID) o partir de cero por cliente?
5. **Redondeo de efectivo** y reglas de contingencia: confirmar con el contador.
6. **Política de receta**: qué productos se marcan `con_receta` vs `receta_retenida` (definir con el QF).
7. **Hardware objetivo**: impresora térmica concreta y método de impresión (navegador vs QZ Tray).
8. **Pasarela de suscripción** (Culqi, Niubiz, Mercado Pago) si va como SaaS.
9. **Nombre/marca**, dominio y subdominios por tenant (`botica-x.botigest.pe`).

---

### Próximo paso sugerido

Generar las **migraciones reales** (0001–0010) en `supabase/migrations`, el **seed** inicial (tenant demo + productos de ejemplo) y el **scaffold de Next.js** con Auth Hook, layout y la pantalla de POS como primer vertical.
