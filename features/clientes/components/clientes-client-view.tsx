'use client';

import * as React from 'react';
import {
  Users,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Receipt,
  Plus,
  Coins,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientesTable } from './clientes-table';
import { ClienteFormModal } from './cliente-form-modal';
import { EstadoCuentaModal } from './estado-cuenta-modal';
import { ModalAbono } from './modal-abono';
import { formatMoney } from '@/lib/utils';
import type { Cliente, ClientesMetricas } from '../types';

interface ClientesClientViewProps {
  initialClientes: Cliente[];
  metricas: ClientesMetricas;
}

export function ClientesClientView({
  initialClientes,
  metricas,
}: ClientesClientViewProps) {
  // Estado de modales
  const [formOpen, setFormOpen] = React.useState(false);
  const [clienteAEditar, setClienteAEditar] = React.useState<Cliente | null>(null);

  const [estadoCuentaOpen, setEstadoCuentaOpen] = React.useState(false);
  const [clienteEstadoCuenta, setClienteEstadoCuenta] = React.useState<Cliente | null>(null);

  const [abonoOpen, setAbonoOpen] = React.useState(false);
  const [clienteAbono, setClienteAbono] = React.useState<Cliente | null>(null);

  // Acciones de apertura
  const handleNuevoCliente = () => {
    setClienteAEditar(null);
    setFormOpen(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setClienteAEditar(cliente);
    setFormOpen(true);
  };

  const handleVerEstadoCuenta = (cliente: Cliente) => {
    setClienteEstadoCuenta(cliente);
    setEstadoCuentaOpen(true);
  };

  const handleRegistrarAbono = (cliente: Cliente) => {
    setClienteAbono(cliente);
    setAbonoOpen(true);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-primary" />
            Clientes & Cuentas Corrientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Control integral de clientes frecuentes, líneas de crédito, cobranza y perfil clínico farmacéutico.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={handleNuevoCliente}
            className="h-10 px-4 text-sm font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Cartera y Cobranzas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Clientes */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Clientes
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {metricas.totalClientes}
            </span>
            <span className="text-xs text-muted-foreground">registrados</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Protección de datos Ley 29733
          </div>
        </div>

        {/* KPI 2: Clientes con Crédito Activo */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cuentas Corrientes
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {metricas.clientesConCredito}
            </span>
            <span className="text-xs text-muted-foreground">con línea activa</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {((metricas.clientesConCredito / (metricas.totalClientes || 1)) * 100).toFixed(0)}% de la cartera
          </div>
        </div>

        {/* KPI 3: Cartera Deudora (Deuda en la calle) */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Cartera Deudora
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              {formatMoney(metricas.totalDeudaEnCalle)}
            </span>
          </div>
          <div className="mt-2 text-xs text-rose-600/80 dark:text-rose-400/80">
            {metricas.clientesDeudoresActivos} cliente{metricas.clientesDeudoresActivos === 1 ? '' : 's'} con saldo pendiente
          </div>
        </div>

        {/* KPI 4: Abonos Recaudados del Mes */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Cobranzas del Mes
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {formatMoney(metricas.totalAbonosMes)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            Ingresos ingresados a caja chica
          </div>
        </div>
      </div>

      {/* Tabla Principal */}
      <ClientesTable
          clientes={initialClientes}
          onNuevo={handleNuevoCliente}
          onEditar={handleEditarCliente}
          onVerEstadoCuenta={handleVerEstadoCuenta}
          onAbonar={handleRegistrarAbono}
        />

      {/* Modal 1: Formulario Crear / Editar Cliente */}
      <ClienteFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        cliente={clienteAEditar}
      />

      {/* Modal 2: Estado de Cuenta Corriente e Historial */}
      <EstadoCuentaModal
        open={estadoCuentaOpen}
        onOpenChange={setEstadoCuentaOpen}
        cliente={clienteEstadoCuenta}
        onRegistrarAbono={handleRegistrarAbono}
      />

      {/* Modal 3: Registro de Abonos */}
      <ModalAbono
        open={abonoOpen}
        onOpenChange={setAbonoOpen}
        cliente={clienteAbono}
        onSuccess={() => {
          // El Server Action ya revalida /clientes
        }}
      />
    </div>
  );
}
