'use client';

import * as React from 'react';
import { BalancesCards } from './balances-cards';
import { LibroTable } from './libro-table';
import { ModalFirmaQf } from './modal-firma-qf';
import { LibroControladosPrint } from './libro-controlados-print';
import type { BalanceSustanciaControlada, RegistroLibroControlado } from '../types';

interface ControladosClientViewProps {
  initialBalances: BalanceSustanciaControlada[];
  initialAsientos: RegistroLibroControlado[];
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
  directorTecnico,
  cqfp,
  establecimientoNombre,
  ruc,
  direccion,
  autorizacionDigemid,
}: ControladosClientViewProps) {
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
  );
}
