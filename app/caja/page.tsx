import * as React from 'react';
import { Suspense } from 'react';
import {
  obtenerTurnoActivo,
  obtenerHistorialTurnos,
  obtenerMovimientosDelTurno,
  obtenerCajasDisponibles,
} from '@/features/caja';
import { CajaClientView } from '@/features/caja/components';
import { CajaSkeleton } from '@/components/shared/module-skeletons';

import { connection } from 'next/server';

async function CajaContent() {
  await connection();
  const [turnoActivo, historialTurnos, cajasDisponibles] = await Promise.all([
    obtenerTurnoActivo(),
    obtenerHistorialTurnos(),
    obtenerCajasDisponibles(),
  ]);

  const movimientosActivos = turnoActivo
    ? await obtenerMovimientosDelTurno(turnoActivo.id)
    : [];

  return (
    <CajaClientView
      initialTurnoActivo={turnoActivo}
      historialTurnos={historialTurnos}
      movimientosActivos={movimientosActivos}
      cajasDisponibles={cajasDisponibles}
    />
  );
}

export default function CajaPage() {
  return (
    <Suspense fallback={<CajaSkeleton />}>
      <CajaContent />
    </Suspense>
  );
}
