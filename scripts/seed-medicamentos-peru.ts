import { query } from '../lib/db';

async function seedMedicamentosPeru() {
  console.log('🚀 Iniciando carga de Catálogo Farmacéutico Peruano...');

  // 1. Obtener tenant activo
  const tenantRows = await query<{ id: string }>('select id from public.tenants where activo = true limit 1;');
  if (tenantRows.length === 0) {
    throw new Error('No se encontró un tenant activo.');
  }
  const tenantId = tenantRows[0].id;

  // 2. Insertar Laboratorios Principales en Perú
  const laboratoriosList = [
    'Medifarma S.A.',
    'Laboratorios Portugal S.R.L.',
    'Farmindustria S.A.',
    'Genfar S.A.',
    'IQFarma S.A.',
    'Laboratorios Bagó del Perú S.A.',
    'Roemmers S.A.',
    'GlaxoSmithKline (GSK)',
    'Pfizer Perú S.A.',
    'Bayer S.A.',
    'Sanofi Aventis del Perú',
    'AC Farma S.A.',
    'Teva Perú S.A.',
    'Laboratorios Hersil S.A.',
    'Tecnofarma S.A.',
    'Abbott Laboratorios S.A.',
    'Merck Peruana S.A.',
    'Induquímica S.A.',
    'Novartis del Perú',
    'Grünenthal Peruana S.A.',
    'Unión Química Farmacéutica',
    'Laboratorios Trifarma'
  ];

  const labMap = new Map<string, string>();
  for (const labName of laboratoriosList) {
    const res = await query<{ id: string }>(
      `insert into public.laboratorios (tenant_id, nombre, activo)
       values ($1, $2, true)
       on conflict (tenant_id, nombre) do update set activo = true
       returning id;`,
      [tenantId, labName]
    );
    labMap.set(labName, res[0].id);
  }

  // 3. Insertar Categorías Terapéuticas
  const categoriasList = [
    'Analgésicos y Antiinflamatorios',
    'Antibióticos y Antimicrobianos',
    'Antigripales, Tos y Respiratorios',
    'Gastroenterología y Antiácidos',
    'Antialérgicos y Antihistamínicos',
    'Cardiovascular e Hipertensión',
    'Endocrinología y Diabetes',
    'Vitaminas, Minerales y Suplementos',
    'Dermatología y Antisépticos',
    'Psicotrópicos y Estupefacientes',
    'Salud Femenina y Anticonceptivos',
    'Oftalmología y Óticos'
  ];

  const catMap = new Map<string, string>();
  for (const catName of categoriasList) {
    const res = await query<{ id: string }>(
      `insert into public.categorias (tenant_id, nombre)
       values ($1, $2)
       on conflict (tenant_id, nombre) do update set nombre = excluded.nombre
       returning id;`,
      [tenantId, catName]
    );
    catMap.set(catName, res[0].id);
  }

  // 4. Mapear Formas Farmacéuticas existentes
  const formasRows = await query<{ id: number; nombre: string }>('select id, nombre from public.formas_farmaceuticas;');
  const formaMap = new Map<string, number>();
  for (const f of formasRows) {
    formaMap.set(f.nombre, f.id);
  }

  const getFormaId = (pref: string): number => {
    for (const [nombre, id] of formaMap.entries()) {
      if (nombre.toLowerCase().includes(pref.toLowerCase())) return id;
    }
    return formasRows[0]?.id || 1;
  };

  const idTableta = getFormaId('Tableta');
  const idCapsula = getFormaId('Cápsula');
  const idJarabe = getFormaId('Jarabe');
  const idSusp = getFormaId('Suspensión Oral');
  const idIny = getFormaId('Inyectable');
  const idCrema = getFormaId('Crema');
  const idGel = getFormaId('Gel');
  const idUng = getFormaId('Ungüento');
  const idGotasOft = getFormaId('Gotas Oftálmicas');
  const idGotasOral = getFormaId('Gotas Orales');
  const idInhalador = getFormaId('Inhalador');
  const idPolvo = getFormaId('Polvo');
  const idEferv = getFormaId('Efervescente');
  const idLocion = getFormaId('Loción');

  // 5. Catálogo Amplio de Medicamentos Peruanos
  const medicamentosData = [
    // --- ANALGÉSICOS Y ANTIINFLAMATORIOS ---
    {
      codigo: 'MED-010',
      nombre: 'Panadol 500 mg',
      dci: 'Paracetamol',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'GlaxoSmithKline (GSK)',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EN-01234',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.25,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000101', precio: 50.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000102', precio: 6.00, esDefault: false },
        { nombre: 'Unidad (Pastilla)', factor: 1, barras: '', precio: 0.70, esDefault: false }
      ]
    },
    {
      codigo: 'MED-011',
      nombre: 'Panadol Forte 500 mg / 65 mg',
      dci: 'Paracetamol + Cafeína',
      concentracion: '500 mg / 65 mg',
      formaId: idTableta,
      lab: 'GlaxoSmithKline (GSK)',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EN-02341',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.35,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000118', precio: 65.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000119', precio: 7.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.90, esDefault: false }
      ]
    },
    {
      codigo: 'MED-012',
      nombre: 'Paracetamol 500 mg DCI Genérico',
      dci: 'Paracetamol',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-03120',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.04,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000125', precio: 12.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000126', precio: 1.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-013',
      nombre: 'Paracetamol 120 mg/5 ml Jarabe Pediátrico',
      dci: 'Paracetamol',
      concentracion: '120 mg / 5 ml',
      formaId: idJarabe,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-04421',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 2.10,
      presentaciones: [
        { nombre: 'Frasco x 60 ml', factor: 1, barras: '7750123000132', precio: 4.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-014',
      nombre: 'Ibuprofeno 400 mg DCI',
      dci: 'Ibuprofeno',
      concentracion: '400 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-05620',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.06,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000149', precio: 18.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000140', precio: 2.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },
    {
      codigo: 'MED-015',
      nombre: 'Ibuprofeno 600 mg DCI',
      dci: 'Ibuprofeno',
      concentracion: '600 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-06129',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.10,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000156', precio: 25.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 3.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.40, esDefault: false }
      ]
    },
    {
      codigo: 'MED-016',
      nombre: 'Apronax 550 mg (Naproxeno Sódico)',
      dci: 'Naproxeno Sódico',
      concentracion: '550 mg',
      formaId: idTableta,
      lab: 'Bayer S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EE-03411',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 1.20,
      presentaciones: [
        { nombre: 'Caja x60', factor: 60, barras: '7750123000163', precio: 120.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000164', precio: 22.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 2.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-017',
      nombre: 'Naproxeno 550 mg DCI',
      dci: 'Naproxeno Sódico',
      concentracion: '550 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-08112',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.18,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000170', precio: 35.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 4.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-018',
      nombre: 'Ketorolaco 10 mg Sublingual',
      dci: 'Ketorolaco Trometamol',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EN-09141',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.35,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123000187', precio: 24.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 9.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-019',
      nombre: 'Ketorolaco 30 mg/ml Inyectable',
      dci: 'Ketorolaco Trometamol',
      concentracion: '30 mg / ml',
      formaId: idIny,
      lab: 'Medifarma S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EN-08819',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'AMPOLLA',
      costo: 1.10,
      presentaciones: [
        { nombre: 'Caja x5 Ampollas', factor: 5, barras: '7750123000194', precio: 12.50, esDefault: true },
        { nombre: 'Ampolla x 1 ml', factor: 1, barras: '', precio: 3.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-020',
      nombre: 'Diclofenaco Sódico 50 mg',
      dci: 'Diclofenaco Sódico',
      concentracion: '50 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-01145',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.05,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000200', precio: 15.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.25, esDefault: false }
      ]
    },
    {
      codigo: 'MED-021',
      nombre: 'Diclofenaco 75 mg/3 ml Inyectable',
      dci: 'Diclofenaco Sódico',
      concentracion: '75 mg / 3 ml',
      formaId: idIny,
      lab: 'Genfar S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-03319',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'AMPOLLA',
      costo: 0.80,
      presentaciones: [
        { nombre: 'Caja x5 Ampollas', factor: 5, barras: '7750123000217', precio: 9.00, esDefault: true },
        { nombre: 'Ampolla x 3 ml', factor: 1, barras: '', precio: 2.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-022',
      nombre: 'Meloxicam 15 mg DCI',
      dci: 'Meloxicam',
      concentracion: '15 mg',
      formaId: idTableta,
      lab: 'IQFarma S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-09941',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.15,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000224', precio: 30.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 4.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-023',
      nombre: 'Celecoxib 200 mg DCI',
      dci: 'Celecoxib',
      concentracion: '200 mg',
      formaId: idCapsula,
      lab: 'Genfar S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EG-07812',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'CAPSULA',
      costo: 0.40,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123000231', precio: 28.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 10.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-024',
      nombre: 'Tramadol Clorhidrato 50 mg',
      dci: 'Tramadol',
      concentracion: '50 mg',
      formaId: idCapsula,
      lab: 'Medifarma S.A.',
      cat: 'Analgésicos y Antiinflamatorios',
      regSan: 'EN-05519',
      condicion: 'con_receta',
      esControlado: true,
      esGenerico: true,
      unidad: 'CAPSULA',
      costo: 0.50,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123000248', precio: 35.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 13.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.50, esDefault: false }
      ]
    },

    // --- ANTIBIÓTICOS Y ANTIMICROBIANOS ---
    {
      codigo: 'MED-030',
      nombre: 'Amoxicilina 500 mg DCI',
      dci: 'Amoxicilina',
      concentracion: '500 mg',
      formaId: idCapsula,
      lab: 'Genfar S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-03418',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'CAPSULA',
      costo: 0.15,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000309', precio: 32.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000301', precio: 4.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-031',
      nombre: 'Amoxicilina 250 mg/5 ml Suspensión Oral',
      dci: 'Amoxicilina',
      concentracion: '250 mg / 5 ml',
      formaId: idPolvo,
      lab: 'Medifarma S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-01129',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 3.50,
      presentaciones: [
        { nombre: 'Frasco x 60 ml', factor: 1, barras: '7750123000316', precio: 8.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-032',
      nombre: 'Amoxicilina + Ác. Clavulánico 500/125 mg',
      dci: 'Amoxicilina + Clavulanato',
      concentracion: '500 mg / 125 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EN-09812',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 1.20,
      presentaciones: [
        { nombre: 'Caja x14', factor: 14, barras: '7750123000323', precio: 32.00, esDefault: true },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 2.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-033',
      nombre: 'Amoxicilina + Ác. Clavulánico 875/125 mg Forte',
      dci: 'Amoxicilina + Clavulanato',
      concentracion: '875 mg / 125 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EN-07619',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 1.80,
      presentaciones: [
        { nombre: 'Caja x14', factor: 14, barras: '7750123000330', precio: 45.00, esDefault: true },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 3.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-034',
      nombre: 'Azitromicina 500 mg DCI',
      dci: 'Azitromicina',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-04419',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 1.10,
      presentaciones: [
        { nombre: 'Caja x3', factor: 3, barras: '7750123000347', precio: 7.50, esDefault: true },
        { nombre: 'Caja x30', factor: 30, barras: '', precio: 60.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 3.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-035',
      nombre: 'Ciprofloxacino 500 mg DCI',
      dci: 'Ciprofloxacino',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-06612',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.18,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000354', precio: 35.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 4.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.60, esDefault: false }
      ]
    },
    {
      codigo: 'MED-036',
      nombre: 'Cefalexina 500 mg DCI',
      dci: 'Cefalexina',
      concentracion: '500 mg',
      formaId: idCapsula,
      lab: 'Genfar S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-08191',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'CAPSULA',
      costo: 0.28,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000361', precio: 48.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 6.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.80, esDefault: false }
      ]
    },
    {
      codigo: 'MED-037',
      nombre: 'Ceftriaxona 1 g Inyectable IM/IV',
      dci: 'Ceftriaxona Sódica',
      concentracion: '1 g',
      formaId: idIny,
      lab: 'Medifarma S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-03328',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 3.80,
      presentaciones: [
        { nombre: 'Vial + Disolvente 1 g', factor: 1, barras: '7750123000378', precio: 9.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-038',
      nombre: 'Claritromicina 500 mg DCI',
      dci: 'Claritromicina',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'AC Farma S.A.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-04910',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.85,
      presentaciones: [
        { nombre: 'Caja x14', factor: 14, barras: '7750123000385', precio: 24.00, esDefault: true },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 2.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-039',
      nombre: 'Sulfametoxazol + Trimetoprima 800/160 mg (Bactrim Forte)',
      dci: 'Cotrimoxazol Forte',
      concentracion: '800 mg / 160 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-01198',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.22,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000392', precio: 38.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 5.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.60, esDefault: false }
      ]
    },
    {
      codigo: 'MED-040',
      nombre: 'Metronidazol 500 mg DCI',
      dci: 'Metronidazol',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Antibióticos y Antimicrobianos',
      regSan: 'EG-02219',
      condicion: 'receta_retenida',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.08,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000408', precio: 18.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },

    // --- ANTIGRIPALES, TOS Y RESPIRATORIOS ---
    {
      codigo: 'MED-050',
      nombre: 'Nastizol Compuesto',
      dci: 'Paracetamol + Pseudoefedrina + Clorfenamina',
      concentracion: '500 mg / 60 mg / 4 mg',
      formaId: idTableta,
      lab: 'Laboratorios Bagó del Perú S.A.',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EE-04192',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.90,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000507', precio: 145.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000508', precio: 16.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.80, esDefault: false }
      ]
    },
    {
      codigo: 'MED-051',
      nombre: 'Antalgina 500 mg (Metamizol)',
      dci: 'Metamizol Sódico',
      concentracion: '500 mg',
      formaId: idTableta,
      lab: 'Sanofi Aventis del Perú',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EE-01182',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.45,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000514', precio: 75.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 9.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-052',
      nombre: 'Ambroxol 30 mg/5 ml Jarabe Adulto',
      dci: 'Ambroxol Clorhidrato',
      concentracion: '30 mg / 5 ml',
      formaId: idJarabe,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EG-03310',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 2.50,
      presentaciones: [
        { nombre: 'Frasco x 120 ml', factor: 1, barras: '7750123000521', precio: 6.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-053',
      nombre: 'Dextrometorfano 15 mg/5 ml Jarabe',
      dci: 'Dextrometorfano Bromhidrato',
      concentracion: '15 mg / 5 ml',
      formaId: idJarabe,
      lab: 'Medifarma S.A.',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EG-05510',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 2.80,
      presentaciones: [
        { nombre: 'Frasco x 120 ml', factor: 1, barras: '7750123000538', precio: 7.00, esDefault: true }
      ]
    },
    {
      codigo: 'MED-054',
      nombre: 'Ventolin 100 mcg (Salbutamol Inhalador)',
      dci: 'Salbutamol Sulfato',
      concentracion: '100 mcg / dosis',
      formaId: idInhalador,
      lab: 'GlaxoSmithKline (GSK)',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EE-02291',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'FRASCO',
      costo: 18.50,
      presentaciones: [
        { nombre: 'Inhalador x 200 dosis', factor: 1, barras: '7750123000545', precio: 28.00, esDefault: true }
      ]
    },
    {
      codigo: 'MED-055',
      nombre: 'Salbutamol 100 mcg Inhalador DCI',
      dci: 'Salbutamol Sulfato',
      concentracion: '100 mcg / dosis',
      formaId: idInhalador,
      lab: 'Genfar S.A.',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EG-04192',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'FRASCO',
      costo: 6.50,
      presentaciones: [
        { nombre: 'Inhalador x 200 dosis', factor: 1, barras: '7750123000552', precio: 12.00, esDefault: true }
      ]
    },
    {
      codigo: 'MED-056',
      nombre: 'Fluimucil 600 mg (N-Acetilcisteína)',
      dci: 'Acetilcisteína',
      concentracion: '600 mg',
      formaId: idEferv,
      lab: 'Zambon / Medifarma',
      cat: 'Antigripales, Tos y Respiratorios',
      regSan: 'EE-08819',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'SOBRE',
      costo: 2.20,
      presentaciones: [
        { nombre: 'Caja x20 Sobres', factor: 20, barras: '7750123000569', precio: 68.00, esDefault: true },
        { nombre: 'Sobre Individual', factor: 1, barras: '', precio: 4.00, esDefault: false }
      ]
    },

    // --- GASTROENTEROLOGÍA Y ANTIÁCIDOS ---
    {
      codigo: 'MED-060',
      nombre: 'Omeprazol 20 mg DCI',
      dci: 'Omeprazol',
      concentracion: '20 mg',
      formaId: idCapsula,
      lab: 'Genfar S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EG-03381',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'CAPSULA',
      costo: 0.08,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000606', precio: 18.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '7750123000607', precio: 2.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },
    {
      codigo: 'MED-061',
      nombre: 'Esomeprazol 40 mg DCI',
      dci: 'Esomeprazol Magnésico',
      concentracion: '40 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EG-09192',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.60,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123000613', precio: 35.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 13.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-062',
      nombre: 'Gaseovet 80 mg (Simeticona Masticable)',
      dci: 'Simeticona',
      concentracion: '80 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EE-02281',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.35,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000620', precio: 65.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 7.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.90, esDefault: false }
      ]
    },
    {
      codigo: 'MED-063',
      nombre: 'Gaseovet Gotas Pediátricas 40 mg/ml',
      dci: 'Simeticona',
      concentracion: '40 mg / ml',
      formaId: idGotasOral,
      lab: 'Medifarma S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EE-01992',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'FRASCO',
      costo: 7.50,
      presentaciones: [
        { nombre: 'Frasco Gotero x 15 ml', factor: 1, barras: '7750123000637', precio: 14.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-064',
      nombre: 'Mylanta Suspensión Antiácida',
      dci: 'Hidróxido de Aluminio + Magnesio + Simeticona',
      concentracion: '400 mg / 400 mg / 30 mg por 5 ml',
      formaId: idSusp,
      lab: 'Laboratorios Bagó del Perú S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EE-04812',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'FRASCO',
      costo: 10.20,
      presentaciones: [
        { nombre: 'Frasco x 360 ml', factor: 1, barras: '7750123000644', precio: 22.00, esDefault: true }
      ]
    },
    {
      codigo: 'MED-065',
      nombre: 'Donafan 2 mg (Loperamida)',
      dci: 'Loperamida Clorhidrato',
      concentracion: '2 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EG-03399',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.12,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000651', precio: 25.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 3.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.40, esDefault: false }
      ]
    },
    {
      codigo: 'MED-066',
      nombre: 'Sales de Rehidratación Oral (SRO)',
      dci: 'Sales de Rehidratación Fórmula OMS',
      concentracion: 'Fórmula OMS 20.5 g',
      formaId: idPolvo,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EG-02291',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'SOBRE',
      costo: 0.70,
      presentaciones: [
        { nombre: 'Caja x50 Sobres', factor: 50, barras: '7750123000668', precio: 55.00, esDefault: true },
        { nombre: 'Sobre para 1 Litro', factor: 1, barras: '', precio: 1.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-067',
      nombre: 'Metoclopramida 10 mg DCI',
      dci: 'Metoclopramida Clorhidrato',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Gastroenterología y Antiácidos',
      regSan: 'EG-05518',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.05,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000675', precio: 15.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.25, esDefault: false }
      ]
    },

    // --- ANTIALÉRGICOS Y ANTIHISTAMÍNICOS ---
    {
      codigo: 'MED-070',
      nombre: 'Clorfenamina Maleato 4 mg DCI',
      dci: 'Clorfenamina Maleato',
      concentracion: '4 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EG-01182',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.03,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000705', precio: 10.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 1.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-071',
      nombre: 'Cetirizina 10 mg DCI',
      dci: 'Cetirizina Diclorhidrato',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EG-06619',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.06,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000712', precio: 18.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },
    {
      codigo: 'MED-072',
      nombre: 'Loratadina 10 mg DCI',
      dci: 'Loratadina',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EG-03318',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.08,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000729', precio: 20.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 3.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.35, esDefault: false }
      ]
    },
    {
      codigo: 'MED-073',
      nombre: 'Desloratadina 5 mg DCI',
      dci: 'Desloratadina',
      concentracion: '5 mg',
      formaId: idTableta,
      lab: 'Laboratorios Bagó del Perú S.A.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EN-07719',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.30,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123000736', precio: 25.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 9.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-074',
      nombre: 'Dexametasona 4 mg/2 ml Inyectable',
      dci: 'Dexametasona Fosfato',
      concentracion: '4 mg / 2 ml',
      formaId: idIny,
      lab: 'Genfar S.A.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EG-02298',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'AMPOLLA',
      costo: 0.70,
      presentaciones: [
        { nombre: 'Caja x5 Ampollas', factor: 5, barras: '7750123000743', precio: 8.00, esDefault: true },
        { nombre: 'Ampolla x 2 ml', factor: 1, barras: '', precio: 2.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-075',
      nombre: 'Prednisona 20 mg DCI',
      dci: 'Prednisona',
      concentracion: '20 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Antialérgicos y Antihistamínicos',
      regSan: 'EG-05521',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.12,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000750', precio: 25.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 3.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.40, esDefault: false }
      ]
    },

    // --- CARDIOVASCULAR E HIPERTENSIÓN ---
    {
      codigo: 'MED-080',
      nombre: 'Losartán Potásico 50 mg DCI',
      dci: 'Losartán Potásico',
      concentracion: '50 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Cardiovascular e Hipertensión',
      regSan: 'EG-06611',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.08,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000804', precio: 20.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },
    {
      codigo: 'MED-081',
      nombre: 'Enalapril Maleato 10 mg DCI',
      dci: 'Enalapril Maleato',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Cardiovascular e Hipertensión',
      regSan: 'EG-01140',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.04,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000811', precio: 12.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 1.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-082',
      nombre: 'Amlodipino 5 mg DCI',
      dci: 'Amlodipino Besilato',
      concentracion: '5 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Cardiovascular e Hipertensión',
      regSan: 'EG-07718',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.06,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000828', precio: 15.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.25, esDefault: false }
      ]
    },
    {
      codigo: 'MED-083',
      nombre: 'Atorvastatina 20 mg DCI',
      dci: 'Atorvastatina Cálcica',
      concentracion: '20 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Cardiovascular e Hipertensión',
      regSan: 'EG-08819',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.15,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000835', precio: 30.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 4.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-084',
      nombre: 'Aspirina 100 mg Cardio',
      dci: 'Ácido Acetilsalicílico',
      concentracion: '100 mg',
      formaId: idTableta,
      lab: 'Bayer S.A.',
      cat: 'Cardiovascular e Hipertensión',
      regSan: 'EE-01290',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.30,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000842', precio: 55.00, esDefault: true },
        { nombre: 'Blíster x14', factor: 14, barras: '', precio: 8.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.70, esDefault: false }
      ]
    },

    // --- ENDOCRINOLOGÍA Y DIABETES ---
    {
      codigo: 'MED-090',
      nombre: 'Metformina 850 mg DCI',
      dci: 'Metformina Clorhidrato',
      concentracion: '850 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Endocrinología y Diabetes',
      regSan: 'EG-04412',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.08,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000903', precio: 20.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 2.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.30, esDefault: false }
      ]
    },
    {
      codigo: 'MED-091',
      nombre: 'Glibenclamida 5 mg DCI',
      dci: 'Glibenclamida',
      concentracion: '5 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Endocrinología y Diabetes',
      regSan: 'EG-03311',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.05,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123000910', precio: 14.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 1.80, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-092',
      nombre: 'Eutirox 100 mcg (Levotiroxina)',
      dci: 'Levotiroxina Sódica',
      concentracion: '100 mcg',
      formaId: idTableta,
      lab: 'Merck Peruana S.A.',
      cat: 'Endocrinología y Diabetes',
      regSan: 'EE-02298',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.55,
      presentaciones: [
        { nombre: 'Caja x50', factor: 50, barras: '7750123000927', precio: 45.00, esDefault: true },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.10, esDefault: false }
      ]
    },

    // --- VITAMINAS Y SUPLEMENTOS ---
    {
      codigo: 'MED-100',
      nombre: 'Redoxon 1 g Efervescente (Vitamina C)',
      dci: 'Ácido Ascórbico',
      concentracion: '1000 mg',
      formaId: idEferv,
      lab: 'Bayer S.A.',
      cat: 'Vitaminas, Minerales y Suplementos',
      regSan: 'EE-03381',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TUBO',
      costo: 12.00,
      presentaciones: [
        { nombre: 'Tubo x 10 Comprimidos', factor: 1, barras: '7750123001009', precio: 19.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-101',
      nombre: 'Neurobión 5000 Inyectable (Complejo B)',
      dci: 'Vitamina B1 + B6 + B12',
      concentracion: '100 mg / 100 mg / 5000 mcg',
      formaId: idIny,
      lab: 'Merck Peruana S.A.',
      cat: 'Vitaminas, Minerales y Suplementos',
      regSan: 'EE-01192',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'AMPOLLA',
      costo: 8.50,
      presentaciones: [
        { nombre: 'Caja x3 Ampollas + Jeringas', factor: 3, barras: '7750123001016', precio: 42.00, esDefault: true },
        { nombre: 'Ampolla Doble Cámara', factor: 1, barras: '', precio: 15.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-102',
      nombre: 'Sulfato Ferroso 300 mg DCI',
      dci: 'Sulfato Ferroso Heptahidratado',
      concentracion: '300 mg (equiv. 60 mg Fe)',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Vitaminas, Minerales y Suplementos',
      regSan: 'EG-02210',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.04,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123001023', precio: 12.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 1.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },
    {
      codigo: 'MED-103',
      nombre: 'Ácido Fólico 0.5 mg DCI',
      dci: 'Ácido Fólico',
      concentracion: '0.5 mg',
      formaId: idTableta,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Vitaminas, Minerales y Suplementos',
      regSan: 'EG-03319',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.03,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123001030', precio: 10.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 1.50, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.20, esDefault: false }
      ]
    },

    // --- DERMATOLOGÍA Y ANTISÉPTICOS ---
    {
      codigo: 'MED-110',
      nombre: 'Clotrimazol 1% Crema Dérmica',
      dci: 'Clotrimazol',
      concentracion: '1 g / 100 g (1%)',
      formaId: idCrema,
      lab: 'Genfar S.A.',
      cat: 'Dermatología y Antisépticos',
      regSan: 'EG-04418',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TUBO',
      costo: 1.80,
      presentaciones: [
        { nombre: 'Tubo x 20 g', factor: 1, barras: '7750123001108', precio: 4.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-111',
      nombre: 'Mupirocina 2% Ungüento (Bactroban)',
      dci: 'Mupirocina',
      concentracion: '2%',
      formaId: idUng,
      lab: 'GlaxoSmithKline (GSK)',
      cat: 'Dermatología y Antisépticos',
      regSan: 'EE-08812',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'TUBO',
      costo: 14.00,
      presentaciones: [
        { nombre: 'Tubo x 15 g', factor: 1, barras: '7750123001115', precio: 28.00, esDefault: true }
      ]
    },
    {
      codigo: 'MED-112',
      nombre: 'Betametasona + Clotrimazol + Gentamicina Crema Triple',
      dci: 'Betametasona + Clotrimazol + Gentamicina',
      concentracion: '0.05% / 1% / 0.1%',
      formaId: idCrema,
      lab: 'Medifarma S.A.',
      cat: 'Dermatología y Antisépticos',
      regSan: 'EN-09921',
      condicion: 'con_receta',
      esControlado: false,
      esGenerico: true,
      unidad: 'TUBO',
      costo: 3.20,
      presentaciones: [
        { nombre: 'Tubo x 20 g', factor: 1, barras: '7750123001122', precio: 8.50, esDefault: true }
      ]
    },
    {
      codigo: 'MED-113',
      nombre: 'Alcohol en Gel 70% con Aloe',
      dci: 'Alcohol Etílico 70°',
      concentracion: '70%',
      formaId: idGel,
      lab: 'Laboratorios Portugal S.R.L.',
      cat: 'Dermatología y Antisépticos',
      regSan: 'NSOC-44120',
      condicion: 'sin_receta',
      esControlado: false,
      esGenerico: false,
      unidad: 'FRASCO',
      costo: 4.50,
      presentaciones: [
        { nombre: 'Frasco con Dosificador x 500 ml', factor: 1, barras: '7750123001139', precio: 9.90, esDefault: true }
      ]
    },

    // --- PSICOTRÓPICOS Y ESTUPEFACIENTES (DIGEMID CONTROLADOS) ---
    {
      codigo: 'MED-120',
      nombre: 'Clonazepam 2 mg (Rivotril)',
      dci: 'Clonazepam',
      concentracion: '2 mg',
      formaId: idTableta,
      lab: 'Farmindustria S.A.',
      cat: 'Psicotrópicos y Estupefacientes',
      regSan: 'EN-01298',
      condicion: 'psicotropico',
      esControlado: true,
      esGenerico: false,
      unidad: 'TABLETA',
      costo: 0.60,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123001207', precio: 45.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 16.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.80, esDefault: false }
      ]
    },
    {
      codigo: 'MED-121',
      nombre: 'Alprazolam 0.5 mg DCI',
      dci: 'Alprazolam',
      concentracion: '0.5 mg',
      formaId: idTableta,
      lab: 'Genfar S.A.',
      cat: 'Psicotrópicos y Estupefacientes',
      regSan: 'EG-03312',
      condicion: 'psicotropico',
      esControlado: true,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.25,
      presentaciones: [
        { nombre: 'Caja x30', factor: 30, barras: '7750123001214', precio: 22.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 8.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 1.00, esDefault: false }
      ]
    },
    {
      codigo: 'MED-122',
      nombre: 'Diazepam 10 mg DCI',
      dci: 'Diazepam',
      concentracion: '10 mg',
      formaId: idTableta,
      lab: 'Medifarma S.A.',
      cat: 'Psicotrópicos y Estupefacientes',
      regSan: 'EG-04429',
      condicion: 'psicotropico',
      esControlado: true,
      esGenerico: true,
      unidad: 'TABLETA',
      costo: 0.15,
      presentaciones: [
        { nombre: 'Caja x100', factor: 100, barras: '7750123001221', precio: 30.00, esDefault: true },
        { nombre: 'Blíster x10', factor: 10, barras: '', precio: 4.00, esDefault: false },
        { nombre: 'Unidad', factor: 1, barras: '', precio: 0.50, esDefault: false }
      ]
    },
    {
      codigo: 'MED-123',
      nombre: 'Morfina Clorhidrato 10 mg/ml Inyectable',
      dci: 'Morfina Clorhidrato',
      concentracion: '10 mg / ml',
      formaId: idIny,
      lab: 'Medifarma S.A.',
      cat: 'Psicotrópicos y Estupefacientes',
      regSan: 'EE-09910',
      condicion: 'estupefaciente',
      esControlado: true,
      esGenerico: true,
      unidad: 'AMPOLLA',
      costo: 3.50,
      presentaciones: [
        { nombre: 'Caja x5 Ampollas', factor: 5, barras: '7750123001238', precio: 32.00, esDefault: true },
        { nombre: 'Ampolla x 1 ml', factor: 1, barras: '', precio: 7.00, esDefault: false }
      ]
    }
  ];

  let insertados = 0;
  for (const m of medicamentosData) {
    const labId = labMap.get(m.lab) || null;
    const catId = catMap.get(m.cat) || null;

    // Insertar o actualizar producto
    const prodRes = await query<{ id: string }>(
      `insert into public.productos (
        tenant_id,
        codigo_interno,
        nombre_comercial,
        nombre_generico,
        concentracion,
        forma_farmaceutica_id,
        laboratorio_id,
        categoria_id,
        tipo_producto,
        registro_sanitario,
        condicion_venta,
        es_controlado,
        es_generico,
        requiere_cadena_frio,
        unidad_base,
        tipo_afectacion_igv,
        costo_ultimo,
        costo_promedio,
        activo
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, 'medicamento',
        $9, $10, $11, $12, false, $13, 'gravado',
        $14, $14, true
      )
      on conflict (tenant_id, codigo_interno) do update set
        nombre_comercial = excluded.nombre_comercial,
        nombre_generico = excluded.nombre_generico,
        concentracion = excluded.concentracion,
        forma_farmaceutica_id = excluded.forma_farmaceutica_id,
        laboratorio_id = excluded.laboratorio_id,
        categoria_id = excluded.categoria_id,
        registro_sanitario = excluded.registro_sanitario,
        condicion_venta = excluded.condicion_venta,
        es_controlado = excluded.es_controlado,
        es_generico = excluded.es_generico,
        costo_ultimo = excluded.costo_ultimo,
        costo_promedio = excluded.costo_promedio,
        activo = true
      returning id;`,
      [
        tenantId,
        m.codigo,
        m.nombre,
        m.dci,
        m.concentracion,
        m.formaId,
        labId,
        catId,
        m.regSan,
        m.condicion,
        m.esControlado,
        m.esGenerico,
        m.unidad,
        m.costo
      ]
    );

    const prodId = prodRes[0].id;

    // Insertar presentaciones comerciales
    for (const p of m.presentaciones) {
      await query(
        `insert into public.producto_presentaciones (
          tenant_id,
          producto_id,
          nombre,
          factor_base,
          codigo_barras,
          precio_venta,
          es_default,
          activo
        ) values (
          $1, $2, $3, $4, $5, $6, $7, true
        )
        on conflict (producto_id, nombre) do update set
          factor_base = excluded.factor_base,
          codigo_barras = coalesce(excluded.codigo_barras, public.producto_presentaciones.codigo_barras),
          precio_venta = excluded.precio_venta,
          es_default = excluded.es_default,
          activo = true;`,
        [
          tenantId,
          prodId,
          p.nombre,
          p.factor,
          p.barras || null,
          p.precio,
          p.esDefault
        ]
      );
    }

    insertados++;
  }

  const totalProds = await query<{ count: string }>('select count(*) as count from public.productos;');
  const totalPres = await query<{ count: string }>('select count(*) as count from public.producto_presentaciones;');

  console.log('✅ ¡Catálogo farmacéutico peruano poblado con éxito!');
  console.log(`📦 Productos insertados/actualizados: ${insertados}`);
  console.log(`📊 Total de medicamentos en catálogo: ${totalProds[0].count}`);
  console.log(`🏷️ Total de presentaciones comerciales activas: ${totalPres[0].count}`);
  process.exit(0);
}

seedMedicamentosPeru().catch((err) => {
  console.error('❌ Error al poblar catálogo:', err);
  process.exit(1);
});
