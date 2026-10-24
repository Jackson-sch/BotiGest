import { NextResponse } from 'next/server';
import { obtenerDetalleTomaInventario } from '@/features/inventario/queries-toma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await obtenerDetalleTomaInventario(id);
    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
