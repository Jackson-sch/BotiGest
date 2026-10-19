import { query } from '../lib/db';

async function seedFormas() {
  const formas = [
    { nombre: 'Tableta / Comprimido', abreviatura: 'TAB' },
    { nombre: 'Cápsula', abreviatura: 'CAP' },
    { nombre: 'Jarabe', abreviatura: 'JBE' },
    { nombre: 'Suspensión Oral', abreviatura: 'SUSP' },
    { nombre: 'Solución Inyectable / Ampolla', abreviatura: 'INY' },
    { nombre: 'Crema Dérmica', abreviatura: 'CRM' },
    { nombre: 'Gel Tópico', abreviatura: 'GEL' },
    { nombre: 'Ungüento / Pomada', abreviatura: 'UNG' },
    { nombre: 'Gotas Oftálmicas (Colirio)', abreviatura: 'GTS OFT' },
    { nombre: 'Gotas Óticas', abreviatura: 'GTS OT' },
    { nombre: 'Gotas Orales (Solución Pediátrica)', abreviatura: 'GTS ORAL' },
    { nombre: 'Óvulo Vaginal', abreviatura: 'OVU' },
    { nombre: 'Supositorio', abreviatura: 'SUP' },
    { nombre: 'Inhalador en Aerosol (MDI)', abreviatura: 'INH' },
    { nombre: 'Polvo para Suspensión Oral', abreviatura: 'POLV SUSP' },
    { nombre: 'Polvo para Solución Inyectable', abreviatura: 'POLV INY' },
    { nombre: 'Loción Tópica', abreviatura: 'LOC' },
    { nombre: 'Solución Tópica / Antiséptico', abreviatura: 'SOL TOP' },
    { nombre: 'Parche Transdérmico', abreviatura: 'PARC' },
    { nombre: 'Comprimido Efervescente', abreviatura: 'EFER' },
    { nombre: 'Emulsión Oral', abreviatura: 'EMUL' },
    { nombre: 'Elíxir', abreviatura: 'ELIX' },
  ];

  for (const f of formas) {
    await query(
      `insert into public.formas_farmaceuticas (nombre, abreviatura) 
       values ($1, $2) 
       on conflict (nombre) do nothing;`,
      [f.nombre, f.abreviatura]
    );
  }

  const res = await query('select count(*) as total from public.formas_farmaceuticas;');
  console.log('✅ Formas farmacéuticas insertadas correctamente. Total:', res[0].total);
  process.exit(0);
}

seedFormas().catch((err) => {
  console.error('Error seeding formas:', err);
  process.exit(1);
});
