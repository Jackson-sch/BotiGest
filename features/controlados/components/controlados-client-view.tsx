'use client';

import * as React from 'react';
import { BalancesCards } from './balances-cards';
import { LibroTable } from './libro-table';
import { ModalFirmaQf } from './modal-firma-qf';
import { LibroControladosPrint } from './libro-controlados-print';
import { RegistroBpaView } from './registro-bpa-view';
import { ShieldCheck, Thermometer } from 'lucide-react';
import type { BalanceSustanciaControlada, RegistroLibroControlado } from '../types';
import type { RegistroTemperaturaHumedad } from '../queries-temperatura';

interface ControladosClientViewProps {
  initialBalances: BalanceSustanciaControlada[];
  initialAsientos: RegistroLibroControlado[];
  registrosTemperatura?: RegistroTemperaturaHumedad[];
  activeSucursalId?: string;
  directorTecnico?: string;
  cqfp?: string;
  establecimientoNombre?: string;
  ruc?: string;
  direccion?: string;
  autorizacionDigemid?: string;
}

export function ControladosClientView({
  initialBalances,
  initialAsientos,
  registrosTemperatura = [],
  activeSucursalId = '',
  directorTecnico,
  cqfp,
  establecimientoNombre,
  ruc,
  direccion,
  autorizacionDigemid,
}: ControladosClientViewProps) {
  const [subTab, setSubTab] = React.useState<'libro' | 'temperatura'>('libro');
  const [asientos, setAsientos] = React.useState<RegistroLibroControlado[]>(initialAsientos);
  const [selectedAsiento, setSelectedAsiento] = React.useState<RegistroLibroControlado | null>(null);

  React.useEffect(() => {
    setAsientos(initialAsientos);
  }, [initialAsientos]);

  const handleFirmarSuccess = (asientoId: number) => {
    setAsientos((prev) =>
      prev.map((a) =>
        a.id === asientoId
          ? {
              ...a,
              validado_por: 'director-tecnico',
              validado_at: new Date().toLocaleString('es-PE'),
              cqfp_validador: 'CQFP 18452 (Validado)',
            }
          : a
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas Reguladoras DIGEMID */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setSubTab('libro')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
            subTab === 'libro'
              ? 'bg-white dark:bg-white/10 text-[#af52de] dark:text-[#bf5af2] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Libro de Controlados</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
            {asientos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('temperatura')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
            subTab === 'temperatura'
              ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Thermometer className="h-4 w-4" />
          <span>Control Temperatura / Humedad (BPA)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground">
            {registrosTemperatura.length}
          </span>
        </button>
      </div>

      {subTab === 'libro' ? (
        <>
          {/* Saldos Permanentes de Sustancias Fiscalizadas */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-apple-title text-foreground">
                Balances Físicos Permanentes
              </h2>
              <span className="text-xs text-muted-foreground">
                Saldo ininterrumpido exigido en inspección DIRIS/DIGEMID
              </span>
            </div>

            <BalancesCards balances={initialBalances} />
          </section>

          {/* Asientos Inmutables del Libro */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-apple-title text-foreground">
                Asientos de Entradas y Salidas
              </h2>
              <span className="text-xs text-muted-foreground">
                Toda salida por venta vincula obligatoriamente la receta médica
              </span>
            </div>

            <LibroTable
              asientos={asientos}
              onFirmarAsiento={(asiento) => setSelectedAsiento(asiento)}
              directorTecnico={directorTecnico}
              cqfp={cqfp}
            />
          </section>

          {/* Modal para la Firma del Químico Farmacéutico */}
          <ModalFirmaQf
            asiento={selectedAsiento}
            isOpen={!!selectedAsiento}
            onClose={() => setSelectedAsiento(null)}
            onSuccess={handleFirmarSuccess}
          />

          {/* Documento Oficial de Impresión (aislado en A4 Landscape) */}
          <LibroControladosPrint
            asientos={asientos}
            balances={initialBalances}
            directorTecnico={directorTecnico}
            cqfp={cqfp}
            establecimientoNombre={establecimientoNombre}
            ruc={ruc}
            direccion={direccion}
            autorizacionDigemid={autorizacionDigemid}
          />
        </>
      ) : (
        <RegistroBpaView 
          registros={registrosTemperatura} 
          activeSucursalId={activeSucursalId} 
        />
      )}
    </div>
  );
}
