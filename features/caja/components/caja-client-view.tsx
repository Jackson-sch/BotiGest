'use client';

import * as React from 'react';
import {
  KeyRound,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Store,
  DollarSign,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import type { TurnoCajaResumen, MovimientoCaja } from '../types';
import {
  AperturaTurnoModal,
  MovimientoEfectivoModal,
  ArqueoCiegoModal,
} from './index';

interface CajaClientViewProps {
  initialTurnoActivo: TurnoCajaResumen | null;
  historialTurnos: TurnoCajaResumen[];
  movimientosActivos: MovimientoCaja[];
  cajasDisponibles: Array<{ id: string; nombre: string }>;
}

export function CajaClientView({
  initialTurnoActivo,
  historialTurnos,
  movimientosActivos,
  cajasDisponibles,
}: CajaClientViewProps) {
  const [turnoActivo, setTurnoActivo] = React.useState<TurnoCajaResumen | null>(initialTurnoActivo);
  const [movimientos, setMovimientos] = React.useState<MovimientoCaja[]>(movimientosActivos);
  const [historial, setHistorial] = React.useState<TurnoCajaResumen[]>(historialTurnos);

  const [isAperturaOpen, setIsAperturaOpen] = React.useState(false);
  const [isMovimientoOpen, setIsMovimientoOpen] = React.useState(false);
  const [isArqueoOpen, setIsArqueoOpen] = React.useState(false);

  const totalIngresos = movimientos
    .filter((m) => m.tipo === 'ingreso')
    .reduce((acc, curr) => acc + curr.monto, 0);

  const totalEgresos = movimientos
    .filter((m) => m.tipo === 'egreso')
    .reduce((acc, curr) => acc + curr.monto, 0);

  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-apple-display text-foreground">
              Caja, Turnos & Arqueo Ciego
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground tracking-apple-body mt-1">
              Control estricto de gaveta, movimientos menores y conciliación ciega sin sesgo de ventas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {turnoActivo ? (
              <>
                <Button
                  onClick={() => setIsMovimientoOpen(true)}
                  variant="outline"
                  className="rounded-xl gap-2 font-medium apple-press-feedback"
                >
                  <ArrowDownRight className="h-4 w-4 text-[#ff9f0a]" />
                  <span>Ingreso / Egreso</span>
                </Button>
                <Button
                  asChild
                  className="rounded-xl gap-2 font-medium bg-[#af52de] hover:bg-[#9333ea] text-white apple-press-feedback"
                >
                  <Link href="/caja/arqueo">
                    <Lock className="h-4 w-4" />
                    <span>Arqueo Ciego & Cerrar</span>
                  </Link>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsAperturaOpen(true)}
                className="rounded-xl gap-2 font-medium bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback"
              >
                <KeyRound className="h-4 w-4" />
                <span>Abrir Turno de Caja</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Estado del Turno</span>
              <div
                className={`text-xl font-bold font-mono ${
                  turnoActivo
                    ? 'text-[#34c759] dark:text-[#30d158]'
                    : 'text-muted-foreground'
                }`}
              >
                {turnoActivo ? 'ABIERTO' : 'CERRADO'}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {turnoActivo ? `${turnoActivo.caja_nombre}` : 'Sin turno activo'}
              </span>
            </div>
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                turnoActivo
                  ? 'bg-[#34c759]/10 text-[#34c759]'
                  : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
              }`}
            >
              <Store className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Saldo Inicial de Apertura</span>
              <div className="text-xl font-bold font-mono text-[#0071e3] dark:text-[#2997ff]">
                {formatMoney(turnoActivo?.monto_apertura || 0)}
              </div>
              <span className="text-[11px] text-muted-foreground">Sencillo registrado</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Ingresos de Efectivo</span>
              <div className="text-xl font-bold font-mono text-[#34c759]">
                +{formatMoney(totalIngresos)}
              </div>
              <span className="text-[11px] text-muted-foreground">Sencillo de bóveda</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-[#34c759]/10 text-[#34c759] flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </Card>

          <Card className="p-4 flex items-center justify-between apple-glass">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Egresos de Efectivo</span>
              <div className="text-xl font-bold font-mono text-red-500">
                -{formatMoney(totalEgresos)}
              </div>
              <span className="text-[11px] text-muted-foreground">Gastos menores / remesas</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </Card>
        </div>

        {/* Panel del Turno Activo */}
        {turnoActivo && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-1 space-y-4 apple-glass">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-[#0071e3]" />
                <h3 className="text-base font-semibold tracking-apple-title text-foreground">
                  Información del Turno
                </h3>
              </div>

              <div className="space-y-3 divide-y divide-border text-xs">
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Caja:</span>
                  <span className="font-semibold text-foreground">{turnoActivo.caja_nombre}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Cajero responsable:</span>
                  <span className="font-semibold text-foreground">{turnoActivo.cajero_nombre}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Hora de apertura:</span>
                  <span className="font-mono font-medium text-foreground">{turnoActivo.apertura_at}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-muted-foreground">Sucursal:</span>
                  <span className="font-medium text-foreground">{turnoActivo.sucursal_nombre}</span>
                </div>
                {turnoActivo.observacion && (
                  <div className="pt-2">
                    <span className="text-muted-foreground block mb-1">Nota:</span>
                    <span className="text-xs italic text-foreground">{turnoActivo.observacion}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2 space-y-4 apple-glass">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-[#34c759]" />
                  <h3 className="text-base font-semibold tracking-apple-title text-foreground">
                    Movimientos de Efectivo en Turno
                  </h3>
                </div>
                <Button
                  onClick={() => setIsMovimientoOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="rounded-xl text-xs gap-1.5"
                >
                  <ArrowDownRight className="h-3.5 w-3.5 text-[#ff9f0a]" />
                  <span>Nuevo Movimiento</span>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-border text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Hora</th>
                      <th className="px-4 py-2.5">Tipo</th>
                      <th className="px-4 py-2.5">Concepto</th>
                      <th className="px-4 py-2.5">Responsable</th>
                      <th className="px-4 py-2.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3 font-mono text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {m.created_at}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              m.tipo === 'ingreso'
                                ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158]'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{m.concepto}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.usuario_nombre}</td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold ${
                            m.tipo === 'ingreso' ? 'text-[#34c759]' : 'text-red-500'
                          }`}
                        >
                          {m.tipo === 'ingreso' ? '+' : '-'}
                          {formatMoney(m.monto)}
                        </td>
                      </tr>
                    ))}
                    {movimientos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                          No se han registrado movimientos extraordinarios de efectivo en este turno.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Historial de Turnos Anteriores */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold tracking-apple-title text-foreground">
              Historial de Turnos de Caja
            </h2>
          </div>

          <Card className="overflow-hidden p-0 apple-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-border text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Caja & Cajero</th>
                    <th className="px-5 py-3">Apertura</th>
                    <th className="px-5 py-3">Cierre</th>
                    <th className="px-5 py-3 text-right">Monto Inicial</th>
                    <th className="px-5 py-3 text-right">Saldo Sistema</th>
                    <th className="px-5 py-3 text-right">Declarado</th>
                    <th className="px-5 py-3 text-right">Diferencia</th>
                    <th className="px-5 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {historial.map((t) => {
                    const dif = t.diferencia;
                    const esExacto = dif !== null && dif !== undefined && Math.abs(dif) < 0.05;
                    const esSobrante = dif !== null && dif !== undefined && dif > 0.05;
                    const esFaltante = dif !== null && dif !== undefined && dif < -0.05;

                    return (
                      <tr key={t.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          <div>
                            <span className="font-semibold">{t.caja_nombre}</span>
                            <span className="text-[11px] text-muted-foreground block">
                              {t.cajero_nombre}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-muted-foreground">
                          {t.apertura_at}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-muted-foreground">
                          {t.cierre_at || 'En curso'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-medium">
                          {formatMoney(t.monto_apertura)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-muted-foreground">
                          {t.monto_cierre_sistema !== null && t.monto_cierre_sistema !== undefined
                            ? formatMoney(t.monto_cierre_sistema)
                            : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-foreground">
                          {t.monto_cierre_declarado !== null && t.monto_cierre_declarado !== undefined
                            ? formatMoney(t.monto_cierre_declarado)
                            : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold">
                          {dif !== null && dif !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 ${
                                esExacto
                                  ? 'text-[#34c759]'
                                  : esSobrante
                                  ? 'text-[#0071e3]'
                                  : 'text-red-500'
                              }`}
                            >
                              {esExacto ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              )}
                              {dif > 0 ? `+${formatMoney(dif)}` : formatMoney(dif)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              t.estado === 'abierto'
                                ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158]'
                                : 'bg-black/5 dark:bg-white/5 text-muted-foreground'
                            }`}
                          >
                            {t.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Modales */}
        <AperturaTurnoModal
          isOpen={isAperturaOpen}
          onClose={() => setIsAperturaOpen(false)}
          cajas={cajasDisponibles}
          onSuccess={() => window.location.reload()}
        />

        {turnoActivo && (
          <>
            <MovimientoEfectivoModal
              isOpen={isMovimientoOpen}
              onClose={() => setIsMovimientoOpen(false)}
              turnoId={turnoActivo.id}
              onSuccess={() => window.location.reload()}
            />

            <ArqueoCiegoModal
              isOpen={isArqueoOpen}
              onClose={() => {
                setIsArqueoOpen(false);
                window.location.reload();
              }}
              turnoId={turnoActivo.id}
              onSuccess={() => {}}
            />
          </>
        )}
      </main>
  );
}
