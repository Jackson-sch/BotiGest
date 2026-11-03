#!/usr/bin/env node

/**
 * Script de Automatización de Copias de Seguridad para Botica
 * Uso manual o programado:
 *   npx tsx scripts/backup-database.ts
 *   npx tsx scripts/backup-database.ts --tipo dump
 */

import { createDatabaseBackup, listDatabaseBackups } from '../lib/backup/backup-service';

async function main() {
  console.log('====================================================');
  console.log('🛡️ BOTIGEST - PROCESO DE COPIA DE SEGURIDAD PROGRAMADA');
  console.log('Hora local:', new Date().toLocaleString('es-PE'));
  console.log('====================================================');

  const args = process.argv.slice(2);
  const tipoIndex = args.indexOf('--tipo');
  const tipo = tipoIndex !== -1 && args[tipoIndex + 1] === 'dump' ? 'dump' : 'sql';

  console.log(`Iniciando generación de respaldo (Formato: .${tipo})...`);

  const res = await createDatabaseBackup(tipo);

  if (!res.success) {
    console.error('❌ Error al generar la copia de seguridad:', res.error);
    process.exit(1);
  }

  console.log(`✅ ¡Copia de seguridad generada con éxito!`);
  console.log(`📁 Archivo: ${res.filename}`);
  console.log(`📦 Tamaño: ${(Number(res.sizeBytes || 0) / 1024).toFixed(2)} KB`);

  const backups = await listDatabaseBackups();
  console.log(`📊 Total de respaldos almacenados en disco: ${backups.length}`);
  console.log('====================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error en backup script:', err);
  process.exit(1);
});
