'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { Cliente, ClienteMovimientoCC } from '../types';

interface EstadoCuentaPrintProps {
  cliente: Cliente;
  movimientos: ClienteMovimientoCC[];
  farmaciaNombre?: string;
  ruc?: string;
  direccion?: string;
  telefono?: string;
}

export function EstadoCuentaPrint({
  cliente,
  movimientos,
  farmaciaNombre = 'Botica San Martín',
  ruc = '20601234567',
  direccion = 'Av. Principal 450, Piura - Perú',
  telefono = '(073) 345-678 / 987-654-321',
}: EstadoCuentaPrintProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  const totalCargos = movimientos.reduce(
    (acc, m) => acc + (m.tipo_movimiento === 'cargo' ? Number(m.monto) : 0),
    0
  );
  const totalAbonos = movimientos.reduce(
    (acc, m) => acc + (m.tipo_movimiento === 'abono' ? Number(m.monto) : 0),
    0
  );

  const disponible = cliente.tiene_credito
    ? Math.max(0, cliente.limite_credito - cliente.saldo_deudor)
    : 0;

  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaHoy = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = (
    <div
      id="print-estado-cuenta-root"
      className="text-black bg-white font-sans text-[11px] leading-tight p-6 max-w-4xl mx-auto"
    >
      {/* 1. Encabezado de la Botica */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-lg font-black tracking-wide uppercase text-black">
              {farmaciaNombre}
            </h1>
            <p className="text-[10px] text-gray-800 font-medium">
              RUC: <strong>{ruc}</strong> · Tel: {telefono}
            </p>
            <p className="text-[10px] text-gray-700">{direccion}</p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded">
              ESTADO DE CUENTA CORRIENTE
            </span>
            <p className="text-[10px] text-gray-800 mt-1">
              Fecha de Emisión: <strong>{fechaHoy} {horaHoy}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Información del Cliente y Resumen de Crédito */}
      <div className="grid grid-cols-2 gap-4 border border-gray-300 rounded p-3 bg-gray-50 mb-4">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
            Datos del Cliente
          </h2>
          <p className="text-xs font-bold text-black">{cliente.nombres}</p>
          <p className="text-[10px] text-gray-800">
            {cliente.tipo_documento.toUpperCase()}: <strong>{cliente.numero_documento}</strong>
          </p>
          <p className="text-[10px] text-gray-700">
            Dirección: {cliente.direccion || 'Sin dirección registrada'}
          </p>
          <p className="text-[10px] text-gray-700">Tel: {cliente.telefono || 'Sin teléfono'}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="border border-gray-200 bg-white p-2 rounded">
            <span className="block text-[9px] text-gray-500 uppercase font-semibold">Línea Autorizada</span>
            <span className="text-xs font-bold font-mono">S/ {cliente.limite_credito.toFixed(2)}</span>
          </div>
          <div className="border border-gray-200 bg-white p-2 rounded">
            <span className="block text-[9px] text-gray-500 uppercase font-semibold">Plazo Otorgado</span>
            <span className="text-xs font-bold">{cliente.dias_credito} días</span>
          </div>
          <div className="border border-red-300 bg-red-50 p-2 rounded">
            <span className="block text-[9px] text-red-600 uppercase font-semibold">Saldo Deudor</span>
            <span className="text-xs font-bold font-mono text-red-700">S/ {cliente.saldo_deudor.toFixed(2)}</span>
          </div>
          <div className="border border-green-300 bg-green-50 p-2 rounded">
            <span className="block text-[9px] text-green-700 uppercase font-semibold">Disponible</span>
            <span className="text-xs font-bold font-mono text-green-700">S/ {disponible.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Alerta de alergias si existe */}
      {(cliente.alergias || cliente.condicion_medica) && (
        <div className="mb-4 p-2 bg-amber-50 border border-amber-300 rounded text-[10px] text-amber-900">
          <strong>Advertencia Clínica / Alergias:</strong> {cliente.alergias || cliente.condicion_medica}
        </div>
      )}

      {/* 3. Tabla de Movimientos */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-2 text-gray-800">
          Historial Cronológico de Cargos y Abonos
        </h3>
        <table className="w-full border-collapse border border-black text-[9.5px]">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-black">
              <th className="border border-black p-1 text-center w-28">Fecha / Hora</th>
              <th className="border border-black p-1 text-center w-20">Tipo</th>
              <th className="border border-black p-1 text-left">Referencia / Comprobante</th>
              <th className="border border-black p-1 text-center w-20">Medio Pago</th>
              <th className="border border-black p-1 text-right w-20">Cargo (+)</th>
              <th className="border border-black p-1 text-right w-20">Abono (-)</th>
              <th className="border border-black p-1 text-right w-24">Saldo Restante</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-black p-3 text-center text-gray-500 italic">
                  No hay movimientos registrados en la cuenta corriente.
                </td>
              </tr>
            ) : (
              movimientos.map((m) => {
                const esCargo = m.tipo_movimiento === 'cargo';
                return (
                  <tr key={m.id} className="border-b border-gray-300">
                    <td className="border border-black p-1 text-center font-mono text-[9px]">
                      {new Date(m.created_at).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="border border-black p-1 text-center font-bold uppercase text-[8.5px]">
                      <span
                        className={
                          esCargo
                            ? 'text-red-700 font-semibold'
                            : 'text-green-700 font-semibold'
                        }
                      >
                        {m.tipo_movimiento}
                      </span>
                    </td>
                    <td className="border border-black p-1">
                      <div className="font-semibold text-black">
                        {m.comprobante_referencia || '-'}
                      </div>
                      {m.observaciones && (
                        <div className="text-[8px] text-gray-600">{m.observaciones}</div>
                      )}
                    </td>
                    <td className="border border-black p-1 text-center uppercase text-[8.5px] text-gray-700">
                      {m.metodo_pago || '-'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono">
                      {esCargo ? `S/ ${Number(m.monto).toFixed(2)}` : '-'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono text-green-800">
                      {!esCargo ? `S/ ${Number(m.monto).toFixed(2)}` : '-'}
                    </td>
                    <td className="border border-black p-1 text-right font-mono font-bold">
                      S/ {Number(m.saldo_posterior).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 border-t-2 border-black font-bold">
              <td colSpan={4} className="border border-black p-1 text-right uppercase">
                Totales de Movimientos ({movimientos.length}):
              </td>
              <td className="border border-black p-1 text-right font-mono text-red-900">
                S/ {totalCargos.toFixed(2)}
              </td>
              <td className="border border-black p-1 text-right font-mono text-green-900">
                S/ {totalAbonos.toFixed(2)}
              </td>
              <td className="border border-black p-1 text-right font-mono text-black font-extrabold">
                S/ {cliente.saldo_deudor.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 4. Bloque de Firmas y Conformidad */}
      <div
        className="mt-14 pt-4 flex justify-around items-end text-center"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="w-64 flex flex-col items-center">
          <div className="h-16 w-full flex items-center justify-center" />
          <div className="border-b border-black mb-1.5 w-full" />
          <p className="font-bold text-[10px] uppercase text-black">ÁREA DE COBRANZAS / CAJA</p>
          <p className="text-[9px] text-gray-700">{farmaciaNombre}</p>
          <p className="text-[8px] text-gray-500 italic">Sello y Firma Autorizada</p>
        </div>

        <div className="w-64 flex flex-col items-center">
          <div className="h-16 w-full flex items-center justify-center" />
          <div className="border-b border-black mb-1.5 w-full" />
          <p className="font-bold text-[10px] uppercase text-black">{cliente.nombres}</p>
          <p className="text-[9px] text-gray-700">
            {cliente.tipo_documento.toUpperCase()}: {cliente.numero_documento}
          </p>
          <p className="text-[8px] text-gray-500 italic">Firma del Cliente Titular</p>
        </div>
      </div>

      <div className="mt-8 pt-2 border-t border-gray-300 text-[8px] text-gray-500 text-center flex justify-between items-center">
        <span>BotiGest · Sistema de Gestión Farmacéutica y Cuentas Corrientes</span>
        <span>Documento oficial de control de crédito e historial de cobros</span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
