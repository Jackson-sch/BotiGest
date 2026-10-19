'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import type { BalanceSustanciaControlada, RegistroLibroControlado } from '../types';

interface LibroControladosPrintProps {
  asientos: RegistroLibroControlado[];
  balances: BalanceSustanciaControlada[];
  directorTecnico?: string;
  cqfp?: string;
  establecimientoNombre?: string;
  ruc?: string;
  direccion?: string;
  autorizacionDigemid?: string;
}

export function LibroControladosPrint({
  asientos,
  balances,
  directorTecnico = 'Q.F. Alejandro Morales Reyes',
  cqfp = 'CQFP 18452',
  establecimientoNombre = 'Botica San Martín',
  ruc = '20601234567',
  direccion = 'Jr. Lima 123, San Martín de Porres, Lima',
  autorizacionDigemid = 'BOT-2026-00452',
}: LibroControladosPrintProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  const totalEntradas = asientos.reduce(
    (acc, a) => acc + (a.cantidad_base > 0 ? a.cantidad_base : 0),
    0
  );
  const totalSalidas = asientos.reduce(
    (acc, a) => acc + (a.cantidad_base < 0 ? Math.abs(a.cantidad_base) : 0),
    0
  );

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
      id="print-controlados-root"
      className="text-black bg-white font-sans text-[10px] leading-tight p-2"
    >
      {/* 1. Encabezado Oficial Farmacéutico */}
      <div className="border-b-2 border-black pb-2 mb-2">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-sm font-extrabold tracking-wide uppercase text-black">
              {establecimientoNombre}
            </h1>
            <p className="text-[9.5px] text-gray-800">
              RUC: <strong>{ruc}</strong> · Autorización Sanitaria DIGEMID: <strong>{autorizacionDigemid}</strong>
            </p>
            <p className="text-[9px] text-gray-700">{direccion}</p>
          </div>

          <div className="text-right">
            <h2 className="text-xs font-bold uppercase tracking-wider text-purple-950">
              Libro Oficial de Control de Estupefacientes y Psicotrópicos
            </h2>
            <p className="text-[9px] font-semibold text-gray-800">
              Conforme a la Ley N° 29459 y D.S. N° 023-2001-SA · Registro Oficial Inmutable
            </p>
            <p className="text-[9px] text-gray-700 mt-0.5">
              Director Técnico: <strong>{directorTecnico}</strong> · Colegiatura: <strong>{cqfp}</strong>
            </p>
            <p className="text-[8.5px] text-gray-600">
              Fecha de Emisión: {fechaHoy} {horaHoy}
            </p>
          </div>
        </div>

        {/* 2. Resumen Compacto de Balances Permanentes */}
        {balances && balances.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-gray-400 flex flex-wrap gap-3 items-center text-[9.5px]">
            <span className="font-bold text-black uppercase text-[9px]">Saldos Físicos Actuales:</span>
            {balances.map((b) => (
              <div
                key={b.producto_id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-gray-400 rounded bg-gray-50"
              >
                <span className="font-medium text-gray-900">{b.nombre_comercial} {b.concentracion}:</span>
                <span className="font-bold text-black font-mono">
                  {b.saldo_actual_base} {b.unidad_base}
                </span>
                <span className="text-[8.5px] text-gray-600 uppercase">
                  ({b.condicion === 'estupefaciente' ? 'Estupefaciente' : 'Psicotrópico'})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Tabla Oficial Inmutable de Asientos */}
      <table className="w-full border-collapse border border-black text-[9px]">
        <thead>
          <tr className="bg-gray-100 border-b border-black text-center font-bold">
            <th className="border border-black p-1 w-7">N°</th>
            <th className="border border-black p-1 w-20">Fecha/Hora</th>
            <th className="border border-black p-1 text-left">Medicamento & Concentración</th>
            <th className="border border-black p-1 w-14">Tipo</th>
            <th className="border border-black p-1 w-16">Lote</th>
            <th className="border border-black p-1 w-14">Vcto.</th>
            <th className="border border-black p-1 w-14">Operación</th>
            <th className="border border-black p-1 w-16">N° Receta</th>
            <th className="border border-black p-1 text-left">Médico Prescriptor</th>
            <th className="border border-black p-1 w-11">CMP</th>
            <th className="border border-black p-1 text-left">Paciente</th>
            <th className="border border-black p-1 w-12 text-right">Entrada</th>
            <th className="border border-black p-1 w-12 text-right">Salida</th>
            <th className="border border-black p-1 w-12 text-right">Saldo</th>
            <th className="border border-black p-1 w-20">Validación QF</th>
          </tr>
        </thead>
        <tbody>
          {asientos.map((asiento, idx) => {
            const esEntrada = Number(asiento.cantidad_base) > 0;
            const entrada = esEntrada ? Number(asiento.cantidad_base) : null;
            const salida = esEntrada ? null : Math.abs(Number(asiento.cantidad_base));

            return (
              <tr
                key={asiento.id}
                className={`border-b border-gray-400 ${idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}
                style={{ pageBreakInside: 'avoid' }}
              >
                <td className="border border-black p-1 text-center font-mono font-bold">
                  {asiento.id}
                </td>
                <td className="border border-black p-1 text-center font-mono text-[8.5px]">
                  {asiento.fecha}
                </td>
                <td className="border border-black p-1 font-semibold text-left">
                  {asiento.producto_nombre}
                  {asiento.concentracion &&
                  !asiento.producto_nombre.toLowerCase().includes(asiento.concentracion.toLowerCase())
                    ? ` · ${asiento.concentracion}`
                    : ''}
                </td>
                <td className="border border-black p-1 text-center uppercase text-[8px]">
                  {asiento.condicion === 'estupefaciente' ? 'Estup.' : 'Psicotr.'}
                </td>
                <td className="border border-black p-1 text-center font-mono text-[8.5px]">
                  {asiento.numero_lote}
                </td>
                <td className="border border-black p-1 text-center font-mono text-[8.5px]">
                  {asiento.fecha_vencimiento}
                </td>
                <td className="border border-black p-1 text-center uppercase text-[8px] font-medium">
                  {asiento.tipo_movimiento}
                </td>
                <td className="border border-black p-1 text-center font-mono font-medium">
                  {asiento.receta?.numero_receta || (esEntrada ? 'GUÍA ING.' : '-')}
                </td>
                <td className="border border-black p-1 text-left truncate max-w-[110px]">
                  {asiento.receta?.medico_nombre || '-'}
                </td>
                <td className="border border-black p-1 text-center font-mono text-[8.5px]">
                  {asiento.receta?.medico_cmp || '-'}
                </td>
                <td className="border border-black p-1 text-left truncate max-w-[110px]">
                  {asiento.receta?.paciente_nombre || '-'}
                </td>
                <td className="border border-black p-1 text-right font-mono font-bold text-green-900">
                  {entrada ? `+${entrada}` : '-'}
                </td>
                <td className="border border-black p-1 text-right font-mono font-bold text-red-900">
                  {salida ? `-${salida}` : '-'}
                </td>
                <td className="border border-black p-1 text-right font-mono font-extrabold text-black bg-gray-100">
                  {asiento.saldo_posterior}
                </td>
                <td className="border border-black p-1 text-center text-[8px] font-semibold">
                  {asiento.validado_por ? (
                    <span className="text-green-900 font-mono">
                      {asiento.cqfp_validador || 'FIRMADO QF'}
                    </span>
                  ) : (
                    <span className="text-amber-900 font-mono italic">PENDIENTE</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 border-t-2 border-black font-bold">
            <td colSpan={11} className="border border-black p-1 text-right uppercase text-[8.5px]">
              Totales de Operaciones Registradas ({asientos.length} asientos):
            </td>
            <td className="border border-black p-1 text-right font-mono font-bold text-green-900">
              +{totalEntradas}
            </td>
            <td className="border border-black p-1 text-right font-mono font-bold text-red-900">
              -{totalSalidas}
            </td>
            <td colSpan={2} className="border border-black p-1 text-center text-[8px] italic text-gray-700">
              Libro Foliado Oficial
            </td>
          </tr>
        </tfoot>
      </table>

      {/* 4. Bloque Reglamentario de Firmas (DIRIS / DIGEMID) */}
      <div
        className="mt-14 pt-4 flex justify-around items-end text-center"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="w-80 flex flex-col items-center">
          {/* Espacio amplio reservado para estampar sello y firma física del QF */}
          <div className="h-24 w-full flex items-center justify-center" />
          <div className="border-b-2 border-black mb-2 w-full" />
          <p className="font-bold text-[10.5px] uppercase text-black tracking-wide">{directorTecnico}</p>
          <p className="text-[9px] text-gray-800 font-semibold">DIRECTOR TÉCNICO · {cqfp}</p>
          <p className="text-[8px] text-gray-600 italic">Sello y Firma del Químico Farmacéutico</p>
        </div>

        <div className="w-80 flex flex-col items-center">
          {/* Espacio amplio reservado para estampar sello oficial del Inspector Sanitario */}
          <div className="h-24 w-full flex items-center justify-center" />
          <div className="border-b-2 border-black mb-2 w-full" />
          <p className="font-bold text-[10.5px] uppercase text-black tracking-wide">INSPECCIÓN SANITARIA DIRIS / DIGEMID</p>
          <p className="text-[9px] text-gray-800 font-semibold">Acta de Inspección de Productos Fiscalizados</p>
          <p className="text-[8px] text-gray-600 italic">Firma, Post-Firma y Sello Oficial del Inspector</p>
        </div>
      </div>

      <div className="mt-8 pt-2 border-t border-gray-300 text-[7.5px] text-gray-500 text-center flex justify-between items-center">
        <span>Sistema de Gestión Farmacéutica BotiGest · Cumplimiento Ley N° 29459 y D.S. N° 023-2001-SA</span>
        <span>Asientos registrados con integridad y firma criptográfica en PostgreSQL</span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
