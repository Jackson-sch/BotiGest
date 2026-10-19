'use client';

import * as React from 'react';
import { Boxes, AlertTriangle, FileText } from 'lucide-react';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { LotesTable } from './lotes-table';
import { AlertasFefo } from './alertas-fefo';
import { KardexView } from './kardex-view';
import { ModalAjusteStock } from './modal-ajuste-stock';
import { ModalLanzarOferta } from './modal-lanzar-oferta';
import { ModalDevolucion } from './modal-devolucion';
import { ModalBajaSanitaria } from './modal-baja-sanitaria';
import type { LoteConStock, MovimientoKardex, AlertaVencimientoItem } from '../types';

const INVENTARIO_TABS = ['lotes', 'alertas', 'kardex'] as const;
type TabType = (typeof INVENTARIO_TABS)[number];

interface InventarioTabsProps {
  lotes: LoteConStock[];
  alertas: AlertaVencimientoItem[];
  movimientos: MovimientoKardex[];
}

export function InventarioTabs({ lotes, alertas, movimientos }: InventarioTabsProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'tab',
    parseAsStringLiteral(INVENTARIO_TABS).withDefault('lotes')
  );
  const [selectedLoteForAjuste, setSelectedLoteForAjuste] = React.useState<LoteConStock | null>(null);
  const [selectedLoteForOferta, setSelectedLoteForOferta] = React.useState<AlertaVencimientoItem | null>(null);
  const [selectedLoteForDevolucion, setSelectedLoteForDevolucion] = React.useState<AlertaVencimientoItem | null>(null);
  const [selectedLoteForBaja, setSelectedLoteForBaja] = React.useState<AlertaVencimientoItem | null>(null);

  const tabs = [
    { id: 'lotes' as const, label: 'Lotes & Control FEFO', icon: Boxes, badge: `${lotes.length}` },
    { id: 'alertas' as const, label: 'Alertas de Vencimiento', icon: AlertTriangle, badge: `${alertas.length}`, badgeColor: 'bg-[#ff9f0a]/15 text-[#b25e00] dark:text-[#ffd60a]' },
    { id: 'kardex' as const, label: 'Kardex Valorizado', icon: FileText, badge: `${movimientos.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Navegación por pestañas translúcida estilo Apple */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    tab.badgeColor || 'bg-black/[0.05] dark:bg-white/[0.1] text-muted-foreground'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      {activeTab === 'lotes' && (
        <LotesTable
          lotes={lotes}
          onSelectAjuste={(lote) => setSelectedLoteForAjuste(lote)}
        />
      )}

      {activeTab === 'alertas' && (
        <AlertasFefo
          alertas={alertas}
          onAccionLote={(alerta, accion) => {
            if (accion === 'promocion') {
              setSelectedLoteForOferta(alerta);
            } else if (accion === 'devolucion') {
              setSelectedLoteForDevolucion(alerta);
            } else if (accion === 'baja') {
              setSelectedLoteForBaja(alerta);
            }
          }}
        />
      )}

      {activeTab === 'kardex' && (
        <KardexView movimientos={movimientos} />
      )}

      {/* Modal de Ajuste de Stock */}
      <ModalAjusteStock
        lote={selectedLoteForAjuste}
        isOpen={!!selectedLoteForAjuste}
        onClose={() => setSelectedLoteForAjuste(null)}
        onSuccess={() => setSelectedLoteForAjuste(null)}
      />

      {/* Modal de Lanzar Oferta FEFO */}
      <ModalLanzarOferta
        alerta={selectedLoteForOferta}
        isOpen={!!selectedLoteForOferta}
        onClose={() => setSelectedLoteForOferta(null)}
        onSuccess={() => setSelectedLoteForOferta(null)}
      />

      {/* Modal de Devolución a Droguería */}
      <ModalDevolucion
        alerta={selectedLoteForDevolucion}
        isOpen={!!selectedLoteForDevolucion}
        onClose={() => setSelectedLoteForDevolucion(null)}
        onSuccess={() => setSelectedLoteForDevolucion(null)}
      />

      {/* Modal de Baja y Destrucción Sanitaria */}
      <ModalBajaSanitaria
        alerta={selectedLoteForBaja}
        isOpen={!!selectedLoteForBaja}
        onClose={() => setSelectedLoteForBaja(null)}
        onSuccess={() => setSelectedLoteForBaja(null)}
      />
    </div>
  );
}
