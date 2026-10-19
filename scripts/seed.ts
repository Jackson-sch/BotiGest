import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env.development.local
const envLocalPath = path.resolve(process.cwd(), '.env.development.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'root'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5433'}/${process.env.POSTGRES_DB || 'botica_db'}`;

async function runSeed() {
  console.log('\n🌿 ====================================================');
  console.log('   BotiGest · Inicializador de Base de Datos & Seed');
  console.log('====================================================\n');
  console.log(`🔌 Conectando a PostgreSQL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Conexión establecida exitosamente.\n');

    // 1. Aplicar esquema DDL inicial
    const schemaFile = path.resolve(process.cwd(), 'supabase', 'migrations', '0001_initial_schema.sql');
    if (fs.existsSync(schemaFile)) {
      console.log('📦 Aplicando esquema inicial (tablas, enums y extensiones)...');
      const schemaSql = fs.readFileSync(schemaFile, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Esquema DDL aplicado correctamente.\n');
    }

    // 2. Aplicar datos semilla
    const seedFile = path.resolve(process.cwd(), 'supabase', 'seed.sql');
    if (fs.existsSync(seedFile)) {
      console.log('🌱 Poblando datos semilla (Tenant, Lotes FEFO, Catálogo, Usuarios)...');
      const seedSql = fs.readFileSync(seedFile, 'utf-8');
      await client.query(seedSql);
      console.log('✅ Datos semilla insertados correctamente.\n');
    }

    console.log('🎉 ¡Base de datos poblada exitosamente!');
    console.log('----------------------------------------------------');
    console.log('  • Tenant: Botica San Martín S.A.C. (RUC 20123456789)');
    console.log('  • Sucursal: Sede Principal (Av. Grau 450)');
    console.log('  • Usuarios: Administrador, QF Director Técnico, Cajero, Almacén');
    console.log('  • Medicamentos: OTC, Con Receta, Psicotrópicos y Estupefacientes');
    console.log('  • Lotes FEFO: Normales, alertas (<60d) y críticos (<30d)');
    console.log('----------------------------------------------------\n');
  } catch (error: any) {
    console.error('\n❌ Error al ejecutar el seed en PostgreSQL:');
    console.error(error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️ Asegúrate de que el servidor PostgreSQL esté corriendo en el puerto indicado (ej. 5433).');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSeed();
