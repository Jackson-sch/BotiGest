'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Banknote,
  Coins,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  Calculator,
  RotateCcw,
  Printer,
  ChevronRight,
  ShieldCheck,
  User,
  Clock,
  Store,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatMoney, appleSprings } from '@/lib/utils';
import { cerrarTurnoAction, verificarArqueoAction } from '../actions';
import { ModalAutorizacionDescuadre } from './modal-autorizacion-descuadre';
import type { TurnoCajaResumen } from '../types';
import { toast } from 'sonner';

interface ArqueoCajaPageViewProps {
  turno: TurnoCajaResumen;
  userName?: string;
}

interface DenominacionItem {
  valor: number;
  label: string;
  tipo: 'billete' | 'moneda';
  colorBadge: string;
}

const BILLETES: DenominacionItem[] = [
  { valor: 200, label: 'S/ 200', tipo: 'billete', colorBadge: 'bg-[#d97706]/15 text-[#b45309] dark:text-[#f59e0b] border-[#d97706]/30' },
  { valor: 100, label: 'S/ 100', tipo: 'billete', colorBadge: 'bg-[#0071e3]/15 text-[#0071e3] dark:text-[#2997ff] border-[#0071e3]/30' },
  { valor: 50, label: 'S/ 50', tipo: 'billete', colorBadge: 'bg-[#ff3b30]/15 text-[#ff3b30] border-[#ff3b30]/30' },
  { valor: 20, label: 'S/ 20', tipo: 'billete', colorBadge: 'bg-[#ff9500]/15 text-[#d97706] border-[#ff9500]/30' },
  { valor: 10, label: 'S/ 10', tipo: 'billete', colorBadge: 'bg-[#34c759]/15 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/30' },
];

const MONEDAS: DenominacionItem[] = [
  { valor: 5, label: 'S/ 5.00', tipo: 'moneda', colorBadge: 'bg-[#8e8e93]/15 text-foreground border-[#8e8e93]/30' },
  { valor: 2, label: 'S/ 2.00', tipo: 'moneda', colorBadge: 'bg-[#8e8e93]/15 text-foreground border-[#8e8e93]/30' },
  { valor: 1, label: 'S/ 1.00', tipo: 'moneda', colorBadge: 'bg-[#8e8e93]/15 text-foreground border-[#8e8e93]/30' },
  { valor: 0.5, label: 'S/ 0.50', tipo: 'moneda', colorBadge: 'bg-[#a2845e]/15 text-[#a2845e] border-[#a2845e]/30' },
  { valor: 0.2, label: 'S/ 0.20', tipo: 'moneda', colorBadge: 'bg-[#a2845e]/15 text-[#a2845e] border-[#a2845e]/30' },
  { valor: 0.1, label: 'S/ 0.10', tipo: 'moneda', colorBadge: 'bg-[#a2845e]/15 text-[#a2845e] border-[#a2845e]/30' },
];

export function ArqueoCajaPageView({ turno, userName }: ArqueoCajaPageViewProps) {
  const [cantidades, setCantidades] = React.useState<Record<number, number>>({});
  const [observacion, setObservacion] = React.useState<string>('');
  const [declararVacio, setDeclararVacio] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isModalDescuadreOpen, setIsModalDescuadreOpen] = React.useState<boolean>(false);
  const [descuadreInfo, setDescuadreInfo] = React.useState<{
    diferencia: number;
    montoDeclarado: number;
    montoSistema: number;
  } | null>(null);

  const [cierreCompletado, setCierreCompletado] = React.useState<{
    declarado: number;
    sistema: number;
    diferencia: number;
    fecha: string;
  } | null>(null);

  const handleSetCantidad = (valor: number, qty: number) => {
    setCantidades((prev) => ({
      ...prev,
      [valor]: Math.max(0, qty),
    }));
  };

  const handleAdjustCantidad = (valor: number, delta: number) => {
    setCantidades((prev) => {
      const current = prev[valor] || 0;
      return {
        ...prev,
        [valor]: Math.max(0, current + delta),
      };
    });
  };

  const handleReset = () => {
    toast('¿Restablecer todo el conteo físico a cero?', {
      action: {
        label: 'Restablecer',
        onClick: () => {
          setCantidades({});
          setDeclararVacio(false);
          toast.info('Conteo físico restablecido a cero');
        },
      },
    });
  };

  // Cálculos de importes
  const totalBilletes = BILLETES.reduce((acc, curr) => {
    return acc + curr.valor * (cantidades[curr.valor] || 0);
  }, 0);

  const totalMonedas = MONEDAS.reduce((acc, curr) => {
    return acc + curr.valor * (cantidades[curr.valor] || 0);
  }, 0);

  const totalPiezasBilletes = BILLETES.reduce((acc, curr) => acc + (cantidades[curr.valor] || 0), 0);
  const totalPiezasMonedas = MONEDAS.reduce((acc, curr) => acc + (cantidades[curr.valor] || 0), 0);
  const totalPiezas = totalPiezasBilletes + totalPiezasMonedas;

  const totalContado = Number((totalBilletes + totalMonedas).toFixed(2));

  // Cierre directo cuando la caja cuadra exacto (diferencia <= S/ 0.10)
  const ejecutarCierreDirecto = async () => {
    setIsLoading(true);
    try {
      const res = await cerrarTurnoAction({
        turno_id: turno.id,
        monto_declarado: totalContado,
        total_piezas: totalPiezas,
        declarar_gaveta_vacia: declararVacio,
        observacion: observacion || undefined,
      });

      if (res.success) {
        setCierreCompletado({
          declarado: res.montoDeclarado ?? totalContado,
          sistema: res.montoSistema ?? (totalContado - (res.diferencia || 0)),
          diferencia: res.diferencia ?? 0,
          fecha: new Date().toLocaleString('es-PE'),
        });
        toast.success('¡Caja Cuadrada Exacta! Turno cerrado exitosamente.');
      } else if (res.requiereAutorizacion) {
        setDescuadreInfo({
          diferencia: res.diferencia ?? 0,
          montoDeclarado: res.montoDeclarado ?? totalContado,
          montoSistema: res.montoSistema ?? 0,
        });
        setIsModalDescuadreOpen(true);
      } else {
        toast.error(res.error || 'No se pudo cerrar el turno');
      }
    } catch {
      toast.error('Error al procesar el arqueo de caja');
    } finally {
      setIsLoading(false);
    }
  };

  // Verificación previa antes de cerrar
  const handleIniciarCierre = async () => {
    if (totalPiezas === 0 && !declararVacio) {
      toast.error('Debe ingresar el conteo físico de monedas y billetes antes de cerrar la caja.');
      return;
    }

    setIsLoading(true);
    try {
      const check = await verificarArqueoAction(turno.id, totalContado);
      if (!check.success) {
        toast.error(check.error || 'Error al verificar arqueo');
        return;
      }

      if (check.cuadraExacto) {
        // Cuadra exacto: proceder con cierre
        await ejecutarCierreDirecto();
      } else {
        // Descuadre: exigir autorización de supervisor
        setDescuadreInfo({
          diferencia: check.diferencia ?? 0,
          montoDeclarado: check.montoDeclarado ?? totalContado,
          montoSistema: check.montoSistema ?? 0,
        });
        setIsModalDescuadreOpen(true);
        toast.warning(
          `La caja presenta un descuadre (${check.diferencia! < 0 ? 'Faltante: -S/' : 'Sobrante: +S/'}${Math.abs(check.diferencia!).toFixed(2)}). Se requiere autorización de Supervisor.`
        );
      }
    } catch {
      toast.error('Error al verificar balance de arqueo');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmación con credenciales y motivo del supervisor
  const handleConfirmarAutorizacionDescuadre = async (data: {
    supervisor_dni: string;
    supervisor_pin: string;
    motivo_descuadre: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await cerrarTurnoAction({
        turno_id: turno.id,
        monto_declarado: totalContado,
        total_piezas: totalPiezas,
        declarar_gaveta_vacia: declararVacio,
        observacion: observacion || undefined,
        autorizacion: data,
      });

      if (res.success) {
        setIsModalDescuadreOpen(false);
        setCierreCompletado({
          declarado: res.montoDeclarado ?? totalContado,
          sistema: res.montoSistema ?? (totalContado - (res.diferencia || 0)),
          diferencia: res.diferencia ?? 0,
          fecha: new Date().toLocaleString('es-PE'),
        });
        toast.success('Descuadre autorizado y turno cerrado con registro de auditoría.');
      } else {
        toast.error(res.error || 'No se pudo autorizar el descuadre');
      }
    } catch {
      toast.error('Error al procesar la autorización de supervisor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 space-y-6">
      {/* Barra Superior de Navegación (Oculta al imprimir) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border print:hidden">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="rounded-xl gap-2 text-xs apple-press-feedback">
            <Link href="/caja">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a Caja</span>
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-border hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-apple-display text-foreground">
                Arqueo Ciego & Cierre de Turno
              </h1>
              <Badge variant="outline" className="text-xs bg-[#af52de]/10 text-[#af52de] border-[#af52de]/20">
                Auditoría Inmediata
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conteo físico de efectivo y monedas sin sesgo de ventas según protocolo interno.
            </p>
          </div>
        </div>

        {/* Datos Rápidos del Turno */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-border">
            <Store className="h-3.5 w-3.5 text-foreground" />
            <span className="font-medium text-foreground">{turno.caja_nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-border">
            <User className="h-3.5 w-3.5 text-foreground" />
            <span className="font-medium text-foreground">{turno.cajero_nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-border">
            <Clock className="h-3.5 w-3.5 text-foreground" />
            <span>Abierto {turno.apertura_at}</span>
          </div>
        </div>
      </div>

      {cierreCompletado ? (
        <>
          {/* VISTA DE ÉXITO INTERACTIVA EN PANTALLA (OCULTA AL IMPRIMIR) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={appleSprings.sheet}
            className="max-w-2xl mx-auto space-y-6 pt-4 print:hidden"
          >
            <Card className="p-8 apple-glass border border-border rounded-3xl text-center space-y-6 shadow-xl">
              <div className="inline-flex h-20 w-20 rounded-full bg-[#34c759]/15 text-[#34c759] items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-apple-title text-foreground">
                  Turno de Caja Cerrado Satisfactoriamente
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Acta de Arqueo generada el {cierreCompletado.fecha} para {turno.caja_nombre}
                </p>
              </div>

              {/* Conciliación de Cierre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border text-left">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">Contado Físico</span>
                  <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                    {formatMoney(cierreCompletado.declarado)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">Declarado en gaveta</span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-muted-foreground uppercase font-medium">Saldo Sistema</span>
                  <p className="text-xl font-bold font-mono text-foreground mt-0.5">
                    {formatMoney(cierreCompletado.sistema)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">Ventas + Apertura + Movs</span>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    cierreCompletado.diferencia === 0
                      ? 'bg-[#34c759]/10 border-[#34c759]/30 text-[#248a3d] dark:text-[#30d158]'
                      : cierreCompletado.diferencia > 0
                      ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3]'
                      : 'bg-[#ff3b30]/10 border-[#ff3b30]/30 text-[#ff3b30]'
                  }`}
                >
                  <span className="text-[11px] uppercase font-semibold">
                    {cierreCompletado.diferencia === 0
                      ? 'Cuadre Exacto'
                      : cierreCompletado.diferencia > 0
                      ? 'Sobrante en Caja'
                      : 'Faltante en Caja'}
                  </span>
                  <p className="text-xl font-bold font-mono mt-0.5">
                    {cierreCompletado.diferencia > 0 ? '+' : ''}
                    {formatMoney(cierreCompletado.diferencia)}
                  </p>
                  <span className="text-[10px] opacity-80">
                    {cierreCompletado.diferencia === 0
                      ? 'Sin diferencias registradas'
                      : 'Diferencia a liquidar'}
                  </span>
                </div>
              </div>

              {/* Acciones Finales */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="rounded-xl gap-2 h-11 px-5 apple-press-feedback"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir Acta de Arqueo</span>
                </Button>
                <Button asChild className="rounded-xl gap-2 h-11 px-6 bg-[#0071e3] hover:bg-[#0077ed] text-white apple-press-feedback">
                  <Link href="/caja">
                    <span>Ir al Panel de Caja</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* =========================================================================
              ACTA OFICIAL DE ARQUEO IMPRESA (FORMATO A4 NÍTIDO EN BLANCO Y NEGRO)
              ========================================================================= */}
          <div id="acta-arqueo-print" className="hidden print:block text-black bg-white font-sans text-xs space-y-5 leading-normal">
            {/* Membrete Oficial de la Botica */}
            <div className="border-b-2 border-black pb-3 flex justify-between items-start">
              <div className="space-y-0.5">
                <h1 className="text-base font-extrabold uppercase tracking-wide">
                  BOTICA SAN MARTÍN S.A.C.
                </h1>
                <p className="text-[11px]">R.U.C. 20123456789 · AUTORIZACIÓN SANITARIA DIRIS-LS-04521</p>
                <p className="text-[10px] text-gray-700">Dirección: Av. Miguel Grau 450 - Lima · Teléfono: (01) 456-7890</p>
              </div>
              <div className="text-right border border-black p-2 rounded text-[11px]">
                <p className="font-bold">DOCUMENTO CONTABLE INTERNO</p>
                <p className="text-[10px]">CÓDIGO: ARQ-TURNO-{turno.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-[10px]">EMISIÓN: {cierreCompletado.fecha}</p>
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center py-1 bg-gray-100 border border-black font-bold uppercase tracking-wider text-sm">
              ACTA DE ARQUEO FÍSICO DE CAJA Y CIERRE DE TURNO
            </div>

            {/* Metadatos Generales del Turno */}
            <div className="grid grid-cols-2 gap-4 border border-black p-3 text-[11px]">
              <div className="space-y-1">
                <p><strong>Terminal / Caja:</strong> {turno.caja_nombre}</p>
                <p><strong>Cajero Responsable:</strong> {userName || turno.cajero_nombre}</p>
                <p><strong>Fecha y Hora de Apertura:</strong> {turno.apertura_at}</p>
              </div>
              <div className="space-y-1 text-right sm:text-left">
                <p><strong>Fecha y Hora de Cierre:</strong> {cierreCompletado.fecha}</p>
                <p><strong>Modalidad de Arqueo:</strong> Arqueo Ciego Oficial (Doble Conteo)</p>
                <p>
                  <strong>Estado Final:</strong>{' '}
                  <span className="font-bold">
                    {cierreCompletado.diferencia === 0
                      ? 'CONFORME (CUADRE EXACTO)'
                      : cierreCompletado.diferencia > 0
                      ? 'SOBRANTE'
                      : 'FALTANTE (CON AUTORIZACIÓN)'}
                  </span>
                </p>
              </div>
            </div>

            {/* Resumen de Liquidación Contable */}
            <div className="space-y-1">
              <h2 className="font-bold text-xs uppercase tracking-wide border-b border-black pb-0.5">
                1. Liquidación y Conciliación Económica
              </h2>
              <table className="w-full border border-black text-left text-[11px]">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="p-1.5 font-medium">Saldo Inicial de Apertura en Gaveta:</td>
                    <td className="p-1.5 font-mono text-right font-bold">{formatMoney(turno.monto_apertura || 0)}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="p-1.5 font-medium">Saldo Teórico Esperado por Sistema (Ventas + Entradas - Salidas):</td>
                    <td className="p-1.5 font-mono text-right font-bold">{formatMoney(cierreCompletado.sistema)}</td>
                  </tr>
                  <tr className="border-b border-black bg-gray-50">
                    <td className="p-1.5 font-bold">Total Efectivo Físico Contado y Verificado (Gaveta):</td>
                    <td className="p-1.5 font-mono text-right font-extrabold text-xs">{formatMoney(cierreCompletado.declarado)}</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="p-1.5 font-bold">
                      Diferencia Neta (Físico vs Sistema):
                    </td>
                    <td className="p-1.5 font-mono text-right font-bold">
                      {cierreCompletado.diferencia > 0 ? '+' : ''}
                      {formatMoney(cierreCompletado.diferencia)}
                      {cierreCompletado.diferencia === 0
                        ? ' (Cuadre Exacto)'
                        : cierreCompletado.diferencia > 0
                        ? ' (Sobrante en Efectivo)'
                        : ' (Faltante en Efectivo)'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detalle Desglosado del Conteo Físico */}
            <div className="space-y-1 page-break-avoid">
              <h2 className="font-bold text-xs uppercase tracking-wide border-b border-black pb-0.5">
                2. Detalle del Conteo Físico por Denominación
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Billetes */}
                <table className="border border-black text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold">
                      <th className="p-1 text-left">Billetes (PEN)</th>
                      <th className="p-1 text-center">Cant.</th>
                      <th className="p-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BILLETES.map((b) => {
                      const qty = cantidades[b.valor] || 0;
                      return (
                        <tr key={b.valor} className="border-b border-gray-300">
                          <td className="p-1">{b.label}</td>
                          <td className="p-1 text-center font-mono">{qty}</td>
                          <td className="p-1 text-right font-mono font-medium">{formatMoney(b.valor * qty)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-gray-50">
                      <td className="p-1">Total Billetes</td>
                      <td className="p-1 text-center font-mono">{totalPiezasBilletes}</td>
                      <td className="p-1 text-right font-mono">{formatMoney(totalBilletes)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Monedas */}
                <table className="border border-black text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold">
                      <th className="p-1 text-left">Monedas (PEN)</th>
                      <th className="p-1 text-center">Cant.</th>
                      <th className="p-1 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MONEDAS.map((m) => {
                      const qty = cantidades[m.valor] || 0;
                      return (
                        <tr key={m.valor} className="border-b border-gray-300">
                          <td className="p-1">{m.label}</td>
                          <td className="p-1 text-center font-mono">{qty}</td>
                          <td className="p-1 text-right font-mono font-medium">{formatMoney(m.valor * qty)}</td>
                        </tr>
                      );
                    })}
                    <tr className="font-bold bg-gray-50">
                      <td className="p-1">Total Monedas</td>
                      <td className="p-1 text-center font-mono">{totalPiezasMonedas}</td>
                      <td className="p-1 text-right font-mono">{formatMoney(totalMonedas)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observaciones o Justificación */}
            <div className="border border-black p-2.5 text-[10px] space-y-0.5 page-break-avoid">
              <p className="font-bold uppercase">Observaciones y Justificación de Cierre:</p>
              <p className="italic text-gray-800">
                {observacion.trim() || 'Sin observaciones registradas por el personal de caja. Conteo realizado bajo conformidad de auditoría interna.'}
              </p>
            </div>

            {/* Firmas de Conformidad */}
            <div className="pt-10 grid grid-cols-2 gap-12 page-break-avoid">
              <div className="text-center space-y-1">
                <div className="border-t border-black pt-1">
                  <p className="font-bold text-[11px]">{userName || turno.cajero_nombre}</p>
                  <p className="text-[10px]">Cajero(a) Responsable de Turno</p>
                  <p className="text-[9px] text-gray-600">DNI: _______________________</p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <div className="border-t border-black pt-1">
                  <p className="font-bold text-[11px]">Supervisor / Director Técnico</p>
                  <p className="text-[10px]">Administración y Auditoría de Farmacia</p>
                  <p className="text-[9px] text-gray-600">DNI / Sello / CQFP: _______________________</p>
                </div>
              </div>
            </div>

            {/* Pie de Página */}
            <div className="pt-4 border-t border-gray-300 flex justify-between text-[8px] text-gray-500">
              <span>BotiGest ERP Farmacéutico · Módulo de Arqueo y Control de Efectivo</span>
              <span>Página 1 de 1 · Impreso el {new Date().toLocaleString('es-PE')}</span>
            </div>
          </div>
        </>
      ) : (
        /* ÁREA DE TRABAJO PRINCIPAL: 2 COLUMNAS SIN SCROLL FORZADO (OCULTA AL IMPRIMIR) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:hidden">
          {/* COLUMNA IZQUIERDA (8 COLUMNAS): TABLA DE BILLETES Y MONEDAS */}
          <div className="lg:col-span-8 space-y-6">
            {/* Sección Billetes Peruanos */}
            <Card className="p-5 apple-glass border border-border rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                      Billetes Peruanos en Moneda Nacional (PEN)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Ingresa la cantidad física de billetes por cada denominación.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {totalPiezasBilletes} uds · {formatMoney(totalBilletes)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {BILLETES.map((item) => {
                  const qty = cantidades[item.valor] || 0;
                  const subtotal = item.valor * qty;
                  return (
                    <div
                      key={item.valor}
                      className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border flex flex-col justify-between gap-3 hover:border-black/20 dark:hover:border-white/20 transition-all duration-150"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-bold border ${item.colorBadge}`}>
                          {item.label}
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {formatMoney(subtotal)}
                        </span>
                      </div>

                      {/* Controles de Conteo */}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleAdjustCantidad(item.valor, -1)}
                          disabled={qty <= 0}
                          className="h-8 w-8 rounded-xl shrink-0"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>

                        <Input
                          type="number"
                          min={0}
                          value={qty === 0 ? '' : qty}
                          placeholder="0"
                          onChange={(e) => handleSetCantidad(item.valor, parseInt(e.target.value, 10) || 0)}
                          className="h-8 text-center font-mono font-bold text-sm rounded-xl px-1"
                        />

                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleAdjustCantidad(item.valor, 1)}
                          className="h-8 w-8 rounded-xl shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Atajos Rápidos */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50 text-[10px] text-muted-foreground font-mono">
                        <button
                          type="button"
                          onClick={() => handleAdjustCantidad(item.valor, 5)}
                          className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCantidad(item.valor, 10)}
                          className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustCantidad(item.valor, 20)}
                          className="px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Sección Monedas Peruanas */}
            <Card className="p-5 apple-glass border border-border rounded-3xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-[#af52de]/10 text-[#af52de] flex items-center justify-center">
                    <Coins className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                      Monedas en Circulación (Céntimos y Soles)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Conteo de monedas en gaveta para cuadre exacto de sencillo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {totalPiezasMonedas} uds · {formatMoney(totalMonedas)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {MONEDAS.map((item) => {
                  const qty = cantidades[item.valor] || 0;
                  const subtotal = item.valor * qty;
                  return (
                    <div
                      key={item.valor}
                      className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-border flex flex-col justify-between gap-2 text-center hover:border-black/20 dark:hover:border-white/20 transition-all duration-150"
                    >
                      <span className={`text-[11px] py-0.5 rounded-lg font-bold border ${item.colorBadge}`}>
                        {item.label}
                      </span>

                      <Input
                        type="number"
                        min={0}
                        value={qty === 0 ? '' : qty}
                        placeholder="0"
                        onChange={(e) => handleSetCantidad(item.valor, parseInt(e.target.value, 10) || 0)}
                        className="h-8 text-center font-mono font-bold text-sm rounded-xl px-1"
                      />

                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAdjustCantidad(item.valor, -1)}
                          disabled={qty <= 0}
                          className="h-6 w-6 rounded-lg p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAdjustCantidad(item.valor, 1)}
                          className="h-6 w-6 rounded-lg p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <span className="font-mono text-[11px] font-semibold text-foreground pt-1 border-t border-border/50">
                        {formatMoney(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* COLUMNA DERECHA (4 COLUMNAS): RESUMEN TOTAL, AUDITORÍA & BOTÓN DE ACCIÓN */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <Card className="p-6 apple-glass-sheet rounded-3xl border border-border shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-[#af52de]" />
                  <h3 className="font-semibold text-sm tracking-apple-title text-foreground">
                    Declaración de Conteo Físico
                  </h3>
                </div>
                {totalPiezas > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-[#ff3b30] rounded-lg"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    <span>Reiniciar</span>
                  </Button>
                )}
              </div>

              {/* Importe Total Contado */}
              <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-border text-center space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Total Declarado en Efectivo
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0071e3] dark:text-[#2997ff]">
                  {formatMoney(totalContado)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground font-mono">
                  <span>{totalPiezas} piezas contadas</span>
                </div>
              </div>

              {/* Desglose Billetes vs Monedas */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
                  <span className="text-muted-foreground">Billetes ({totalPiezasBilletes} uds)</span>
                  <span className="font-mono font-semibold text-foreground">{formatMoney(totalBilletes)}</span>
                </div>
                <div className="flex justify-between py-1.5 px-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03]">
                  <span className="text-muted-foreground">Monedas ({totalPiezasMonedas} uds)</span>
                  <span className="font-mono font-semibold text-foreground">{formatMoney(totalMonedas)}</span>
                </div>
              </div>

              {/* Aviso Regulatorio de Arqueo Ciego */}
              <div className="p-3.5 rounded-2xl bg-[#af52de]/10 border border-[#af52de]/20 text-[11px] text-[#af52de] dark:text-[#d8b4fe] space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <EyeOff className="h-4 w-4 shrink-0" />
                  <span>Protocolo de Arqueo Ciego</span>
                </div>
                <p className="text-[10px] opacity-90 leading-relaxed">
                  El sistema oculta el saldo teórico esperado durante el conteo. Al confirmar el cierre, si la caja cuadra se cerrará de inmediato; si presenta descuadre, se requerirá autorización de un Supervisor o Director Técnico.
                </p>
              </div>

              {/* Protección contra Estado Vacío / Sin Conteo Físico */}
              {totalPiezas === 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Sin conteo físico registrado</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Para cerrar el turno debe ingresar la cantidad de monedas y billetes presentes en gaveta. Si la gaveta físicamente no contiene dinero en efectivo, confirme abajo:
                  </p>
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-[11px] text-foreground font-medium select-none">
                    <input
                      type="checkbox"
                      checked={declararVacio}
                      onChange={(e) => setDeclararVacio(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>
                      Declaro bajo responsabilidad que la gaveta física está vacía y contiene exactamente S/ 0.00 en efectivo.
                    </span>
                  </label>
                </div>
              )}

              {/* Campo de Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Observaciones de Cierre (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Ej. Conteo realizado conforme, sencillo verificado..."
                  className="w-full text-xs rounded-xl p-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-border focus:outline-none focus:ring-1 focus:ring-ring resize-none text-foreground"
                />
              </div>

              {/* Botón de Confirmación Definitivo */}
              <Button
                size="lg"
                onClick={handleIniciarCierre}
                disabled={isLoading || (totalPiezas === 0 && !declararVacio)}
                className="w-full rounded-2xl h-12 text-sm font-semibold bg-[#af52de] hover:bg-[#9333ea] text-white shadow-md apple-press-feedback gap-2 disabled:opacity-50"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {isLoading
                    ? 'Conciliando y Verificando...'
                    : totalPiezas === 0 && !declararVacio
                    ? 'Ingrese conteo para cerrar'
                    : 'Confirmar Arqueo & Cerrar Turno'}
                </span>
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Autorización de Descuadre de Supervisor */}
      {descuadreInfo && (
        <ModalAutorizacionDescuadre
          isOpen={isModalDescuadreOpen}
          onClose={() => setIsModalDescuadreOpen(false)}
          diferencia={descuadreInfo.diferencia}
          montoDeclarado={descuadreInfo.montoDeclarado}
          montoSistema={descuadreInfo.montoSistema}
          onConfirmar={handleConfirmarAutorizacionDescuadre}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
