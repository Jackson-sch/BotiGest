'use client';

import * as React from 'react';
import {
  Building2,
  Store,
  Plus,
  Receipt,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SucursalItem } from '../types';

interface CajasSedesViewProps {
  sucursales: SucursalItem[];
  onNuevaCaja: () => void;
}

export function CajasSedesView({ sucursales, onNuevaCaja }: CajasSedesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Sedes y Terminales de Facturación
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribución física de boticas y configuración de series fiscales SUNAT
          </p>
        </div>
        <Button
          onClick={onNuevaCaja}
          className="h-9 px-4 text-xs font-semibold rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva Caja Física
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sucursales.map((suc) => (
          <Card
            key={suc.id}
            className="p-5 border-border/50 bg-sidebar/50 backdrop-blur-xl rounded-3xl space-y-4"
          >
            {/* Header Sede */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#0071e3]/15 border border-[#0071e3]/30 flex items-center justify-center text-[#2997ff]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    {suc.nombre}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">
                      {suc.codigo}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {suc.direccion}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  suc.activo
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {suc.activo ? 'Operativa' : 'Inactiva'}
              </span>
            </div>

            {/* Datos Regulatorios */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-muted/20 border border-border/30 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[10px]">Establecimiento SUNAT</span>
                <span className="font-mono font-semibold text-foreground">
                  {suc.codigo_establecimiento_sunat}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Aut. Sanitaria DIGEMID</span>
                <span className="font-mono font-semibold text-foreground">
                  {suc.autorizacion_digemid || 'En trámite'}
                </span>
              </div>
            </div>

            {/* Cajas de la Sucursal */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Terminales de Cobro ({suc.cajas.length})
              </span>

              {suc.cajas.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic">
                  No hay cajas físicas registradas en esta sede.
                </p>
              ) : (
                <div className="space-y-2">
                  {suc.cajas.map((caja) => (
                    <div
                      key={caja.id}
                      className="p-3 rounded-2xl bg-background/60 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium text-xs text-foreground">
                          {caja.nombre}
                        </span>
                      </div>

                      {/* Series asociadas */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {caja.series.map((ser) => (
                          <div
                            key={ser.id}
                            className="px-2 py-0.5 rounded-lg bg-muted/50 border border-border/40 text-[10px] font-mono flex items-center gap-1"
                          >
                            <span className="text-muted-foreground uppercase">{ser.tipo}:</span>
                            <span className="font-bold text-foreground">{ser.serie}</span>
                            <span className="text-[9px] text-muted-foreground">
                              (#{ser.ultimo_numero})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
