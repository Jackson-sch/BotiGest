'use client';

import * as React from 'react';
import {
  ShieldCheck,
  Award,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { OppfExportCard } from './oppf-export-card';
import { BalanceTrimestralCard } from './balance-trimestral-card';
import { SireSunatCard } from './sire-sunat-card';
import { MetricasGerencialesView } from './metricas-gerenciales-view';
import type {
  OppfItem,
  BalanceTrimestralItem,
  SireVentaItem,
  MetricasGerenciales,
} from '../types';

interface ReportesTabsProps {
  oppfItems: OppfItem[];
  balanceControlados: BalanceTrimestralItem[];
  sireVentas: SireVentaItem[];
  metricas: MetricasGerenciales;
}

export function ReportesTabs({
  oppfItems,
  balanceControlados,
  sireVentas,
  metricas,
}: ReportesTabsProps) {
  const [activeTab, setActiveTab] = React.useState<'oppf' | 'balance' | 'sire' | 'gerencial'>('oppf');

  return (
    <div className="space-y-6 w-full">
      {/* Tab Navigation (Oculta al imprimir) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.06] w-full sm:w-fit overflow-x-auto print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('oppf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'oppf'
              ? 'bg-white dark:bg-white/10 text-purple-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-purple-400" />
          <span>DIGEMID OPPF (Precios)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-purple-500/10 text-purple-300">
            {oppfItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('balance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'balance'
              ? 'bg-white dark:bg-white/10 text-amber-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Award className="h-4 w-4 text-amber-400" />
          <span>Balance Psicotrópicos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/10 text-amber-300">
            {balanceControlados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sire')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'sire'
              ? 'bg-white dark:bg-white/10 text-[#0071e3] dark:text-[#2997ff] font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Receipt className="h-4 w-4 text-[#2997ff]" />
          <span>SUNAT SIRE (RVIE)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-[#0071e3]/10 text-[#2997ff]">
            {sireVentas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gerencial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 apple-press-feedback whitespace-nowrap ${
            activeTab === 'gerencial'
              ? 'bg-white dark:bg-white/10 text-emerald-400 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Rentabilidad & Rotación</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'oppf' && <OppfExportCard items={oppfItems} />}
      {activeTab === 'balance' && <BalanceTrimestralCard items={balanceControlados} />}
      {activeTab === 'sire' && <SireSunatCard ventas={sireVentas} />}
      {activeTab === 'gerencial' && <MetricasGerencialesView metricas={metricas} />}
    </div>
  );
}
