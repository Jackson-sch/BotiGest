import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getSessionUser } from '@/lib/auth';
import { getSafeBackupFilePath } from '@/lib/backup/backup-service';

interface RouteProps {
  params: Promise<{ filename: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!['propietario', 'administrador'].includes(user.rol)) {
    return NextResponse.json(
      { error: 'Solo el Propietario o Administrador pueden descargar copias de seguridad de la base de datos.' },
      { status: 403 }
    );
  }

  const { filename } = await params;
  const filePath = getSafeBackupFilePath(filename);

  if (!filePath || !fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'Archivo de copia de seguridad no encontrado' },
      { status: 404 }
    );
  }

  const fileBuffer = fs.readFileSync(filePath);
  const contentType = filename.endsWith('.sql') ? 'application/sql' : 'application/octet-stream';

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'no-store, no-cache',
    },
  });
}
