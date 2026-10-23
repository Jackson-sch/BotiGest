import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import {
  ACTIVE_SUCURSAL_COOKIE,
  obtenerSucursales,
  obtenerSucursalActivaId,
} from '@/lib/sucursales';

export async function GET() {
  const user = await getCurrentUser();
  const sucursales = await obtenerSucursales(user?.tenantId);
  const activeSucursalId = await obtenerSucursalActivaId();

  const canSwitchBranch =
    user?.rol === 'administrador' ||
    user?.rol === 'propietario' ||
    user?.rol === 'director_tecnico';

  return NextResponse.json({
    sucursales,
    activeSucursalId,
    canSwitchBranch,
    userRole: user?.rol,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  // Validar permisos para cambiar de sucursal
  if (user && (user.rol === 'cajero' || user.rol === 'almacenero')) {
    return NextResponse.json(
      { error: 'Su rol operativo está restringido a su sede física asignada.' },
      { status: 403 }
    );
  }

  try {
    const { sucursalId } = await req.json();

    if (!sucursalId) {
      return NextResponse.json({ error: 'sucursalId es requerido' }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_SUCURSAL_COOKIE, sucursalId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return NextResponse.json({ success: true, activeSucursalId: sucursalId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al cambiar sucursal' }, { status: 500 });
  }
}
