import ExcelJS from 'exceljs';

/**
 * Paleta de colores corporativos para BotiGest
 */
const COLORS = {
  headerFill: '1E293B', // Slate 800
  headerText: 'FFFFFF',
  border: 'E2E8F0', // Slate 200
  accentBlue: '0071E3',
  zebraRow: 'F8FAFC', // Slate 50
  totalRowFill: 'F1F5F9', // Slate 100
};

/**
 * Descarga en el navegador un Workbook de ExcelJS como archivo .xlsx
 */
export async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Aplica estilos estándar de cabecera a una fila de Worksheet
 */
function applyHeaderStyles(row: ExcelJS.Row): void {
  row.height = 26;
  row.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerFill },
    };
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: true,
      color: { argb: COLORS.headerText },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'medium', color: { argb: '94A3B8' } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    };
  });
}

/**
 * Aplica bordes y alineación básica a las filas de datos
 */
function applyDataRowStyles(row: ExcelJS.Row, isEven: boolean): void {
  row.height = 20;
  row.eachCell((cell) => {
    if (isEven) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.zebraRow },
      };
    }
    cell.font = { name: 'Segoe UI', size: 9 };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'thin', color: { argb: COLORS.border } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    };
    if (!cell.alignment) {
      cell.alignment = { vertical: 'middle' };
    } else {
      cell.alignment.vertical = 'middle';
    }
  });
}

/**
 * Ajusta automáticamente el ancho de cada columna según su contenido
 */
function autoFitColumns(worksheet: ExcelJS.Worksheet, minWidth = 12): void {
  worksheet.columns.forEach((column) => {
    let maxLength = minWidth;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const val = cell.value ? cell.value.toString() : '';
      if (val.length > maxLength) {
        maxLength = Math.min(val.length + 3, 50); // máx 50 caracteres
      }
    });
    column.width = maxLength;
  });
}

// ─────────────────────────────────────────────────────────────
// 1. EXPORTACIÓN: CATÁLOGO MAESTRO DE MEDICAMENTOS
// ─────────────────────────────────────────────────────────────

export interface ProductoExcelItem {
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico?: string | null;
  concentracion?: string | null;
  forma_farmaceutica_nombre?: string | null;
  laboratorio_nombre?: string | null;
  categoria_nombre?: string | null;
  registro_sanitario?: string | null;
  condicion_venta: string;
  es_controlado: boolean;
  es_generico: boolean;
  requiere_cadena_frio: boolean;
  unidad_base: string;
  total_stock?: number;
  presentaciones?: Array<{
    nombre: string;
    factor_base: number;
    precio_venta: number;
    codigo_barras?: string | null;
  }>;
}

export async function exportProductosToExcel(productos: ProductoExcelItem[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Sistema Farmacéutico';
  wb.created = new Date();

  const ws = wb.addWorksheet('Catálogo de Fármacos', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  // Título Institucional
  ws.mergeCells('A1:L1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'CATÁLOGO MAESTRO DE MEDICAMENTOS · BOTIGEST';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.accentBlue } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:L2');
  const subCell = ws.getCell('A2');
  subCell.value = `Reporte generado el ${new Date().toLocaleDateString('es-PE')} · Total fármacos: ${productos.length}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  // Cabecera en Fila 4
  const headerRow = ws.getRow(4);
  headerRow.values = [
    'Código',
    'Nombre Comercial',
    'Principio Activo (DCI)',
    'Concentración',
    'Forma Farmacéutica',
    'Laboratorio',
    'Categoría',
    'Reg. Sanitario',
    'Condición de Venta',
    'Cadena de Frío',
    'Stock Físico',
    'Presentaciones & Precios',
  ];
  applyHeaderStyles(headerRow);

  // Filas de Datos
  productos.forEach((prod, idx) => {
    const row = ws.addRow([
      prod.codigo_interno,
      prod.nombre_comercial,
      prod.nombre_generico || '-',
      prod.concentracion || '-',
      prod.forma_farmaceutica_nombre || '-',
      prod.laboratorio_nombre || '-',
      prod.categoria_nombre || '-',
      prod.registro_sanitario || '-',
      prod.condicion_venta.replace('_', ' ').toUpperCase(),
      prod.requiere_cadena_frio ? 'SÍ (2°-8°C)' : 'NO',
      prod.total_stock ?? 0,
      prod.presentaciones && prod.presentaciones.length > 0
        ? prod.presentaciones
            .map((p) => `${p.nombre}: S/ ${Number(p.precio_venta).toFixed(2)}`)
            .join(' | ')
        : '-',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    // Alineaciones específicas
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }; // Código
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' }; // Frío
    row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' }; // Stock
    row.getCell(11).numFmt = '#,##0';
  });

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `Catalogo_Farmacos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// 2. EXPORTACIÓN: INVENTARIO & LOTES FEFO
// ─────────────────────────────────────────────────────────────

export interface LoteExcelItem {
  codigo_interno: string;
  producto_nombre?: string;
  nombre_comercial?: string;
  numero_lote: string;
  fecha_vencimiento: string;
  dias_por_vencer?: number;
  dias_para_vencer?: number;
  cantidad_base: number;
  unidad_base: string;
  costo_unitario?: number;
  costo_promedio?: number;
  ubicacion?: string;
  estado_sanitario?: string;
  estado?: string;
}

export async function exportInventarioLotesToExcel(lotes: LoteExcelItem[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Sistema Farmacéutico';

  const ws = wb.addWorksheet('Control de Lotes FEFO', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.mergeCells('A1:I1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'CONTROL SANITARIO DE LOTES Y VENCIMIENTOS FEFO';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: '059669' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:I2');
  const subCell = ws.getCell('A2');
  subCell.value = `Generado el ${new Date().toLocaleDateString('es-PE')} · Trazabilidad de lotes registrados: ${lotes.length}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  const headerRow = ws.getRow(4);
  headerRow.values = [
    'Código Fármaco',
    'Medicamento / Insumo',
    'N° Lote',
    'Vencimiento',
    'Días Restantes',
    'Estado Sanitario',
    'Stock Actual',
    'Unidad',
    'Ubicación / Anaquel',
  ];
  applyHeaderStyles(headerRow);

  lotes.forEach((lote, idx) => {
    const dias = lote.dias_para_vencer ?? lote.dias_por_vencer ?? 0;
    const nombre = lote.nombre_comercial || lote.producto_nombre || 'Fármaco';
    let estadoTexto = lote.estado?.toUpperCase() || 'ÓPTIMO';
    if (dias < 0) estadoTexto = 'VENCIDO';
    else if (dias <= 30) estadoTexto = 'CRÍTICO (<30d)';
    else if (dias <= 60) estadoTexto = 'POR VENCER (<60d)';

    const row = ws.addRow([
      lote.codigo_interno,
      nombre,
      lote.numero_lote,
      lote.fecha_vencimiento,
      dias,
      estadoTexto,
      lote.cantidad_base,
      lote.unidad_base,
      lote.ubicacion || 'Mostrador Principal',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    // Destacar en color si está vencido o crítico
    const estadoCell = row.getCell(6);
    if (dias < 0) {
      estadoCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'DC2626' } };
    } else if (dias <= 30) {
      estadoCell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'EA580C' } };
    }

    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).numFmt = '#,##0';
  });

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `Lotes_FEFO_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// 3. EXPORTACIÓN: VENTAS & COMPROBANTES SUNAT
// ─────────────────────────────────────────────────────────────

export interface VentaExcelItem {
  fecha_emision: string;
  tipo_comprobante: string;
  serie: string;
  numero: number;
  cliente_documento?: string | null;
  cliente_nombre?: string | null;
  metodo_pago?: string | null;
  total_gravado?: number;
  total_igv?: number;
  igv?: number;
  total: number;
  estado_sunat?: string;
}

export async function exportVentasToExcel(ventas: VentaExcelItem[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Sistema Farmacéutico';

  const ws = wb.addWorksheet('Registro de Ventas', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.mergeCells('A1:J1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'REGISTRO DE VENTAS Y FACTURACIÓN ELECTRÓNICA SUNAT';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: COLORS.accentBlue } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 28;

  ws.mergeCells('A2:J2');
  const subCell = ws.getCell('A2');
  subCell.value = `Exportado el ${new Date().toLocaleDateString('es-PE')} · Cantidad de comprobantes: ${ventas.length}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  const headerRow = ws.getRow(4);
  headerRow.values = [
    'Fecha',
    'Tipo',
    'Serie-Número',
    'Doc. Cliente',
    'Cliente / Razón Social',
    'Método Pago',
    'Subtotal Gravado (S/)',
    'IGV 18% (S/)',
    'Total (S/)',
    'Estado SUNAT',
  ];
  applyHeaderStyles(headerRow);

  let sumGravado = 0;
  let sumIgv = 0;
  let sumTotal = 0;

  ventas.forEach((v, idx) => {
    const tot = Number(v.total) || 0;
    const igv = Number(v.total_igv ?? v.igv ?? 0);
    const grav = Number(v.total_gravado ?? (tot - igv));

    sumGravado += grav;
    sumIgv += igv;
    sumTotal += tot;

    const row = ws.addRow([
      v.fecha_emision,
      v.tipo_comprobante.toUpperCase(),
      `${v.serie}-${String(v.numero).padStart(6, '0')}`,
      v.cliente_documento || 'Varios',
      v.cliente_nombre || 'Clientes Varios',
      v.metodo_pago ? v.metodo_pago.toUpperCase() : 'EFECTIVO',
      grav,
      igv,
      tot,
      (v.estado_sunat || 'ACEPTADO').toUpperCase(),
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(7).numFmt = '"S/" #,##0.00';
    row.getCell(8).numFmt = '"S/" #,##0.00';
    row.getCell(9).numFmt = '"S/" #,##0.00';
  });

  // Fila de Totales
  const totalRow = ws.addRow([
    'TOTAL GENERAL',
    '',
    '',
    '',
    '',
    '',
    sumGravado,
    sumIgv,
    sumTotal,
    '',
  ]);
  totalRow.height = 24;
  totalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalRowFill } };
    cell.font = { name: 'Segoe UI', size: 10, bold: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '64748B' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
    };
  });
  totalRow.getCell(7).numFmt = '"S/" #,##0.00';
  totalRow.getCell(8).numFmt = '"S/" #,##0.00';
  totalRow.getCell(9).numFmt = '"S/" #,##0.00';

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `Registro_Ventas_SUNAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// 4. EXPORTACIÓN: BALANCE TRIMESTRAL DE CONTROLADOS (D.S. 023-2001-SA)
// ─────────────────────────────────────────────────────────────

export interface BalanceExcelItem {
  nombre_comercial: string;
  nombre_generico?: string | null;
  concentracion?: string | null;
  unidad_base: string;
  saldo_inicial: number;
  entradas_compras: number;
  salidas_recetas: number;
  bajas_mermas: number;
  saldo_final: number;
}

export async function exportBalancePsicotropicosToExcel(
  items: BalanceExcelItem[],
  trimestre = 1,
  anio = 2026,
  directorTecnico = 'Q.F. Responsable'
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest DIGEMID Report';

  const ws = wb.addWorksheet('Balance Psicotrópicos', {
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  // Encabezado Oficial DIGEMID
  ws.mergeCells('A1:I1');
  const title = ws.getCell('A1');
  title.value = `BALANCE TRIMESTRAL DE ESTUPEFACIENTES Y PSICOTRÓPICOS · TRIMESTRE ${trimestre}-${anio}`;
  title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: '7E22CE' } };
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 26;

  ws.mergeCells('A2:I2');
  const sub = ws.getCell('A2');
  sub.value = `Conforme al D.S. N° 023-2001-SA y Ley de Productos Farmacéuticos N° 29459 · Custodia: ${directorTecnico}`;
  sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  const headerRow = ws.getRow(5);
  headerRow.values = [
    'Medicamento / Especialidad',
    'DCI (Denominación Común)',
    'Concentración',
    'Unidad Mínima',
    'Saldo Inicial',
    'Ingresos (Compras Droguería)',
    'Salidas (Receta Médica)',
    'Mermas / Destrucción',
    'Saldo Final de Cierre',
  ];
  applyHeaderStyles(headerRow);

  items.forEach((it, idx) => {
    const row = ws.addRow([
      it.nombre_comercial,
      it.nombre_generico || '-',
      it.concentracion || '-',
      it.unidad_base,
      Number(it.saldo_inicial) || 0,
      Number(it.entradas_compras) || 0,
      Number(it.salidas_recetas) || 0,
      Number(it.bajas_mermas) || 0,
      Number(it.saldo_final) || 0,
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(5).numFmt = '#,##0';
    row.getCell(6).numFmt = '#,##0';
    row.getCell(7).numFmt = '#,##0';
    row.getCell(8).numFmt = '#,##0';
    row.getCell(9).numFmt = '#,##0';
    row.getCell(9).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '7E22CE' } };
  });

  // Espacio para firma del Químico Farmacéutico
  const startFirma = ws.rowCount + 3;
  ws.getCell(`C${startFirma}`).value = '____________________________________';
  ws.getCell(`C${startFirma + 1}`).value = `${directorTecnico}`;
  ws.getCell(`C${startFirma + 2}`).value = 'DIRECTOR TÉCNICO · QUÍMICO FARMACÉUTICO';
  ws.getCell(`C${startFirma}`).alignment = { horizontal: 'center' };
  ws.getCell(`C${startFirma + 1}`).alignment = { horizontal: 'center' };
  ws.getCell(`C${startFirma + 2}`).alignment = { horizontal: 'center' };
  ws.getCell(`C${startFirma + 2}`).font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: '64748B' } };

  autoFitColumns(ws, 14);
  await downloadWorkbook(wb, `Balance_Psicotropicos_T${trimestre}_${anio}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// 5. EXPORTACIÓN: SIRE RVIE SUNAT (REGISTRO DE VENTAS)
// ─────────────────────────────────────────────────────────────

export interface SireExcelItem {
  fecha_emision: string;
  tipo_comprobante: string;
  serie: string;
  numero: number;
  cliente_documento?: string | null;
  cliente_nombre?: string | null;
  subtotal: number;
  igv: number;
  total: number;
  estado_sunat?: string;
}

export async function exportSireSunatToExcel(ventas: SireExcelItem[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest SIRE SUNAT';

  const ws = wb.addWorksheet('SIRE RVIE SUNAT', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.mergeCells('A1:J1');
  const title = ws.getCell('A1');
  title.value = 'LIBRO ELECTRÓNICO DE VENTAS E INGRESOS (SIRE RVIE - SUNAT)';
  title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: '0071E3' } };
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 26;

  ws.mergeCells('A2:J2');
  const sub = ws.getCell('A2');
  sub.value = `Estructura compatible para conciliación contable SIRE · Generado el ${new Date().toLocaleDateString('es-PE')}`;
  sub.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  const headerRow = ws.getRow(4);
  headerRow.values = [
    'Periodo',
    'Fecha Emisión',
    'Tipo Comprobante (Tabla 10)',
    'Serie',
    'Número',
    'Tipo Doc Identidad',
    'Número Doc Identidad',
    'Apellidos y Nombres / Razón Social',
    'Base Imponible Gravada',
    'Impuesto General a las Ventas (IGV)',
    'Importe Total del Comprobante',
  ];
  applyHeaderStyles(headerRow);

  ventas.forEach((v, idx) => {
    const isRuc = v.cliente_documento && v.cliente_documento.length === 11;
    const tipoDoc = isRuc ? '6 (RUC)' : v.cliente_documento ? '1 (DNI)' : '0 (Sin Doc)';
    const codTipo = v.tipo_comprobante === 'factura' ? '01' : v.tipo_comprobante === 'boleta' ? '03' : '00';
    const periodo = v.fecha_emision.slice(0, 7).replace('-', '');

    const row = ws.addRow([
      periodo,
      v.fecha_emision,
      `${codTipo} - ${v.tipo_comprobante.toUpperCase()}`,
      v.serie,
      v.numero,
      tipoDoc,
      v.cliente_documento || '-',
      v.cliente_nombre || 'CLIENTES VARIOS',
      Number(v.subtotal) || 0,
      Number(v.igv) || 0,
      Number(v.total) || 0,
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(9).numFmt = '"S/" #,##0.00';
    row.getCell(10).numFmt = '"S/" #,##0.00';
    row.getCell(11).numFmt = '"S/" #,##0.00';
  });

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `SIRE_RVIE_SUNAT_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exporta el directorio de Proveedores y Droguerías a formato Excel profesional
 */
export async function exportProveedoresToExcel(proveedores: any[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Farmacia';
  wb.created = new Date();

  const ws = wb.addWorksheet('Proveedores & Droguerías', {
    views: [{ showGridLines: true }],
  });

  const headerRow = ws.addRow([
    'RUC',
    'Razón Social / Droguería',
    'Contacto / Asesor Comercial',
    'Teléfono / WhatsApp',
    'Correo Electrónico',
    'Dirección Fiscal / Almacén',
    'Total Compras',
    'Monto Comprado Acumulado (S/.)',
    'Estado',
    'Fecha de Registro',
  ]);
  applyHeaderStyles(headerRow);

  proveedores.forEach((p, idx) => {
    const row = ws.addRow([
      p.ruc,
      p.razon_social,
      p.contacto || 'Sin contacto',
      p.telefono || 'Sin teléfono',
      p.email || 'Sin correo',
      p.direccion || 'Sin dirección',
      Number(p.total_compras || 0),
      Number(p.total_monto_compras || 0),
      p.activo ? 'ACTIVO' : 'INACTIVO',
      p.created_at || '-',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(8).numFmt = '"S/" #,##0.00';
  });

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `Proveedores_Droguerias_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─────────────────────────────────────────────────────────────
// 7. EXPORTACIÓN: LIBRO OFICIAL DE CONTROLADOS (DIGEMID)
// ─────────────────────────────────────────────────────────────

export interface AsientoControladoExcelItem {
  id: number;
  fecha: string;
  producto_nombre: string;
  concentracion: string;
  condicion: string;
  numero_lote: string;
  fecha_vencimiento: string;
  tipo_movimiento: string;
  cantidad_base: number;
  saldo_posterior: number;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  receta?: {
    medico_cmp: string;
    medico_nombre: string;
    paciente_nombre: string;
    numero_receta: string;
    retenida: boolean;
  } | null;
  validado_por?: string | null;
  validado_at?: string | null;
  cqfp_validador?: string | null;
}

/**
 * Exporta el Libro Oficial de Control de Estupefacientes y Psicotrópicos en formato Excel profesional
 * conforme al D.S. N° 023-2001-SA y Ley N° 29459 para fiscalización DIRIS / DIGEMID.
 */
export async function exportLibroControladosToExcel(
  asientos: AsientoControladoExcelItem[],
  directorTecnico = 'Q.F. Alejandro Morales Reyes',
  cqfp = 'CQFP 18452',
  establecimiento = 'Botica San Martín'
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Sistema Farmacéutico';
  wb.created = new Date();

  const ws = wb.addWorksheet('Libro Oficial Controlados', {
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  // Título Oficial
  ws.mergeCells('A1:P1');
  const title = ws.getCell('A1');
  title.value = 'LIBRO OFICIAL DE CONTROL DE ESTUPEFACIENTES Y PSICOTRÓPICOS';
  title.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: '581C87' } };
  title.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 26;

  // Ley y Normativa
  ws.mergeCells('A2:P2');
  const sub1 = ws.getCell('A2');
  sub1.value = 'Conforme a la Ley General de Salud N° 26842, Ley N° 29459 y D.S. N° 023-2001-SA · Registro Oficial Inmutable para Inspección DIGEMID';
  sub1.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  // Metadatos del Establecimiento y Director Técnico
  ws.mergeCells('A3:P3');
  const sub2 = ws.getCell('A3');
  sub2.value = `Establecimiento: ${establecimiento}  |  Director Técnico: ${directorTecnico} (${cqfp})  |  Fecha de Emisión: ${new Date().toLocaleString('es-PE')}`;
  sub2.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '334155' } };
  ws.getRow(3).height = 20;

  ws.getRow(4).height = 8; // Espaciador visual

  // Encabezados de Columna
  const headerRow = ws.getRow(5);
  headerRow.values = [
    'N° Asiento',
    'Fecha / Hora',
    'Fármaco / Medicamento',
    'Concentración',
    'Tipo Fiscalizado',
    'N° Lote',
    'F. Vencimiento',
    'Operación',
    'N° Receta Retenida',
    'Médico Prescriptor',
    'CMP',
    'Paciente',
    'Entradas (+)',
    'Salidas (-)',
    'Saldo Resultante',
    'Firma Sanitaria (QF)',
  ];
  applyHeaderStyles(headerRow);

  let totalEntradas = 0;
  let totalSalidas = 0;

  asientos.forEach((asiento, idx) => {
    const esEntrada = Number(asiento.cantidad_base) > 0;
    const entrada = esEntrada ? Number(asiento.cantidad_base) : 0;
    const salida = esEntrada ? 0 : Math.abs(Number(asiento.cantidad_base));
    totalEntradas += entrada;
    totalSalidas += salida;

    const row = ws.addRow([
      asiento.id,
      asiento.fecha,
      asiento.producto_nombre,
      asiento.concentracion || '-',
      asiento.condicion === 'estupefaciente' ? 'ESTUPEFACIENTE' : 'PSICOTRÓPICO',
      asiento.numero_lote,
      asiento.fecha_vencimiento,
      asiento.tipo_movimiento ? String(asiento.tipo_movimiento).toUpperCase() : 'VENTA',
      asiento.receta?.numero_receta || (esEntrada ? 'GUÍA INGRESO' : '-'),
      asiento.receta?.medico_nombre || '-',
      asiento.receta?.medico_cmp || '-',
      asiento.receta?.paciente_nombre || '-',
      entrada > 0 ? entrada : '-',
      salida > 0 ? salida : '-',
      Number(asiento.saldo_posterior),
      asiento.validado_por ? (asiento.cqfp_validador || 'FIRMADO QF') : 'PENDIENTE DE FIRMA',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(15).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(16).alignment = { horizontal: 'center', vertical: 'middle' };

    if (entrada > 0) {
      row.getCell(13).numFmt = '#,##0';
      row.getCell(13).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '16A34A' } };
    }
    if (salida > 0) {
      row.getCell(14).numFmt = '#,##0';
      row.getCell(14).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'DC2626' } };
    }
    row.getCell(15).numFmt = '#,##0';
    row.getCell(15).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '581C87' } };

    if (asiento.validado_por) {
      row.getCell(16).font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: '15803D' } };
    } else {
      row.getCell(16).font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'B45309' } };
    }
  });

  // Fila de Totales
  const totalRow = ws.addRow([
    '',
    '',
    `TOTAL ASIENTOS: ${asientos.length}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTALES:',
    totalEntradas,
    totalSalidas,
    '',
    '',
  ]);
  totalRow.height = 22;
  totalRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.totalRowFill },
    };
    cell.font = { name: 'Segoe UI', size: 9, bold: true };
    cell.border = {
      top: { style: 'medium', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '475569' } },
    };
  });
  totalRow.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(13).numFmt = '#,##0';
  totalRow.getCell(14).numFmt = '#,##0';

  // Espacio de Firma del Químico Farmacéutico
  const startFirma = ws.rowCount + 3;
  ws.mergeCells(`D${startFirma}:H${startFirma}`);
  ws.getCell(`D${startFirma}`).value = '_________________________________________';
  ws.getCell(`D${startFirma}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${startFirma + 1}:H${startFirma + 1}`);
  ws.getCell(`D${startFirma + 1}`).value = `${directorTecnico}`;
  ws.getCell(`D${startFirma + 1}`).font = { name: 'Segoe UI', size: 10, bold: true };
  ws.getCell(`D${startFirma + 1}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${startFirma + 2}:H${startFirma + 2}`);
  ws.getCell(`D${startFirma + 2}`).value = `DIRECTOR TÉCNICO · REGISTRO ${cqfp}`;
  ws.getCell(`D${startFirma + 2}`).font = { name: 'Segoe UI', size: 9, color: { argb: '475569' } };
  ws.getCell(`D${startFirma + 2}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${startFirma + 3}:H${startFirma + 3}`);
  ws.getCell(`D${startFirma + 3}`).value = 'Sello y Firma para Auditoría Sanitaria DIRIS / DIGEMID';
  ws.getCell(`D${startFirma + 3}`).font = { name: 'Segoe UI', size: 8, italic: true, color: { argb: '94A3B8' } };
  ws.getCell(`D${startFirma + 3}`).alignment = { horizontal: 'center' };

  autoFitColumns(ws, 13);
  await downloadWorkbook(wb, `Libro_Oficial_Controlados_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exporta los asientos del Libro de Controlados a formato CSV estándar
 */
export function exportLibroControladosToCSV(
  asientos: AsientoControladoExcelItem[],
  filename = `Libro_Controlados_${new Date().toISOString().slice(0, 10)}.csv`
): void {
  const headers = [
    'N° Asiento',
    'Fecha',
    'Medicamento',
    'Concentracion',
    'Tipo Sustancia',
    'Lote',
    'Vencimiento',
    'Operacion',
    'Receta Nro',
    'Medico Prescriptor',
    'CMP',
    'Paciente',
    'Entradas',
    'Salidas',
    'Saldo',
    'Estado Firma QF',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = asientos.map((a) => {
    const esEntrada = Number(a.cantidad_base) > 0;
    return [
      a.id,
      escapeCSV(a.fecha),
      escapeCSV(a.producto_nombre),
      escapeCSV(a.concentracion),
      escapeCSV(a.condicion),
      escapeCSV(a.numero_lote),
      escapeCSV(a.fecha_vencimiento),
      escapeCSV(a.tipo_movimiento),
      escapeCSV(a.receta?.numero_receta || (esEntrada ? 'GUIA INGRESO' : '-')),
      escapeCSV(a.receta?.medico_nombre || '-'),
      escapeCSV(a.receta?.medico_cmp || '-'),
      escapeCSV(a.receta?.paciente_nombre || '-'),
      esEntrada ? Number(a.cantidad_base) : 0,
      esEntrada ? 0 : Math.abs(Number(a.cantidad_base)),
      Number(a.saldo_posterior),
      escapeCSV(a.validado_por ? (a.cqfp_validador || 'FIRMADO') : 'PENDIENTE'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface ClienteExcelData {
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  tiene_credito: boolean;
  limite_credito: number;
  dias_credito: number;
  saldo_deudor: number;
  puntos: number;
  alergias?: string | null;
  condicion_medica?: string | null;
  activo: boolean;
}

export interface ClienteMovimientoCCExcelData {
  created_at: string;
  tipo_movimiento: string;
  comprobante_referencia?: string | null;
  metodo_pago?: string | null;
  monto: number;
  saldo_anterior: number;
  saldo_posterior: number;
  registrado_por_nombre?: string | null;
  observaciones?: string | null;
}

/**
 * Exporta el catálogo de Clientes y Cuentas Corrientes a Excel
 */
export async function exportClientesToExcel(clientes: ClienteExcelData[]): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Pharmacy Software';
  wb.created = new Date();

  const ws = wb.addWorksheet('Cartera de Clientes', {
    views: [{ showGridLines: true }],
  });

  // Título
  ws.mergeCells('A1:N1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'DIRECTORIO DE CLIENTES Y CUENTAS CORRIENTES - BOTIGEST';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 34;

  // Subtítulo con fecha
  ws.mergeCells('A2:N2');
  const subCell = ws.getCell('A2');
  subCell.value = `Reporte emitido el ${new Date().toLocaleString('es-PE')} · Total Clientes: ${clientes.length}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  // Cabeceras de columnas
  const headers = [
    'Tipo Doc.',
    'N° Documento',
    'Razón Social / Nombres',
    'Teléfono',
    'Correo Electrónico',
    'Dirección Fiscal/Domicilio',
    'Tiene Crédito',
    'Límite Crédito (S/)',
    'Días Crédito',
    'Saldo Deudor (S/)',
    'Disponible (S/)',
    'Puntos',
    'Alertas Clínicas / Alergias',
    'Estado',
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyles(headerRow);

  // Filas de datos
  clientes.forEach((c, idx) => {
    const disponible = c.tiene_credito ? Math.max(0, c.limite_credito - c.saldo_deudor) : 0;
    const row = ws.addRow([
      c.tipo_documento.toUpperCase(),
      c.numero_documento,
      c.nombres,
      c.telefono || '-',
      c.email || '-',
      c.direccion || '-',
      c.tiene_credito ? 'SÍ' : 'NO',
      c.limite_credito,
      c.dias_credito,
      c.saldo_deudor,
      disponible,
      c.puntos,
      c.alergias || c.condicion_medica || '-',
      c.activo ? 'ACTIVO' : 'INACTIVO',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    // Formatos numéricos
    row.getCell(8).numFmt = '"S/ "#,##0.00';
    row.getCell(10).numFmt = '"S/ "#,##0.00';
    row.getCell(11).numFmt = '"S/ "#,##0.00';

    if (c.saldo_deudor > 0) {
      row.getCell(10).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'DC2626' } };
    }
  });

  // Fila resumen de totales
  const totalRowIndex = ws.rowCount + 1;
  const totalRow = ws.addRow([
    'TOTALES GENERALES',
    '',
    '',
    '',
    '',
    '',
    '',
    { formula: `SUM(H4:H${totalRowIndex - 1})` },
    '',
    { formula: `SUM(J4:J${totalRowIndex - 1})` },
    { formula: `SUM(K4:K${totalRowIndex - 1})` },
    { formula: `SUM(L4:L${totalRowIndex - 1})` },
    '',
    '',
  ]);

  totalRow.height = 24;
  totalRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalRowFill } };
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: '0F172A' } };
    cell.border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: '0F172A' } },
    };
  });
  totalRow.getCell(8).numFmt = '"S/ "#,##0.00';
  totalRow.getCell(10).numFmt = '"S/ "#,##0.00';
  totalRow.getCell(11).numFmt = '"S/ "#,##0.00';

  autoFitColumns(ws, 12);
  await downloadWorkbook(wb, `Cartera_Clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exporta el Estado de Cuenta Corriente individual de un Cliente a Excel
 */
export async function exportEstadoCuentaToExcel(
  cliente: ClienteExcelData,
  movimientos: ClienteMovimientoCCExcelData[]
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Pharmacy Software';
  wb.created = new Date();

  const ws = wb.addWorksheet('Estado de Cuenta', {
    views: [{ showGridLines: true }],
  });

  // Título
  ws.mergeCells('A1:H1');
  const titleCell = ws.getCell('A1');
  titleCell.value = 'ESTADO DE CUENTA CORRIENTE - BOTIGEST';
  titleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerFill } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 32;

  // Ficha del Cliente
  ws.addRow([]);
  ws.addRow(['CLIENTE:', cliente.nombres, '', 'TIPO/DOC:', `${cliente.tipo_documento.toUpperCase()} ${cliente.numero_documento}`]);
  ws.addRow(['DIRECCIÓN:', cliente.direccion || 'Sin dirección registrada', '', 'TELÉFONO:', cliente.telefono || '-']);
  ws.addRow([
    'LÍNEA CRÉDITO:',
    `S/ ${Number(cliente.limite_credito).toFixed(2)}`,
    '',
    'SALDO DEUDOR:',
    `S/ ${Number(cliente.saldo_deudor).toFixed(2)}`,
    '',
    'DISPONIBLE:',
    `S/ ${(Math.max(0, Number(cliente.limite_credito) - Number(cliente.saldo_deudor))).toFixed(2)}`,
  ]);

  // Estilizar bloque del cliente
  for (let r = 3; r <= 5; r++) {
    const row = ws.getRow(r);
    row.height = 20;
    row.getCell(1).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
    row.getCell(4).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
    row.getCell(7).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
  }

  ws.addRow([]); // Espacio

  // Cabeceras de movimientos
  const headers = [
    'Fecha / Hora',
    'Tipo Movimiento',
    'N° Referencia / Comp.',
    'Medio de Pago',
    'Cargo (+ Deuda)',
    'Abono (- Deuda)',
    'Saldo Posterior',
    'Cajero / Notas',
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyles(headerRow);

  // Filas de movimientos
  movimientos.forEach((m, idx) => {
    const esCargo = m.tipo_movimiento === 'cargo';
    const row = ws.addRow([
      new Date(m.created_at).toLocaleString('es-PE'),
      m.tipo_movimiento.toUpperCase(),
      m.comprobante_referencia || '-',
      m.metodo_pago ? m.metodo_pago.toUpperCase() : '-',
      esCargo ? m.monto : 0,
      !esCargo ? m.monto : 0,
      m.saldo_posterior,
      `${m.registrado_por_nombre || ''} ${m.observaciones ? `(${m.observaciones})` : ''}`.trim() || '-',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    // Formatos de moneda
    row.getCell(5).numFmt = '"S/ "#,##0.00';
    row.getCell(6).numFmt = '"S/ "#,##0.00';
    row.getCell(7).numFmt = '"S/ "#,##0.00';

    if (esCargo) {
      row.getCell(5).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'DC2626' } };
    } else {
      row.getCell(6).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '16A34A' } };
    }
  });

  autoFitColumns(ws, 14);
  const safeDoc = cliente.numero_documento.replace(/[^a-zA-Z0-9]/g, '_');
  await downloadWorkbook(wb, `Estado_Cuenta_${safeDoc}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface FilaProductoImportar {
  fila: number;
  codigo_interno: string;
  nombre_comercial: string;
  nombre_generico: string;
  concentracion: string;
  forma_farmaceutica: string;
  laboratorio: string;
  categoria: string;
  registro_sanitario: string;
  condicion_venta: 'sin_receta' | 'con_receta' | 'receta_retenida' | 'psicotropico' | 'estupefaciente';
  unidad_base: string;
  presentacion_nombre: string;
  presentacion_factor: number;
  codigo_barras: string;
  precio_venta: number;
  costo_compra: number;
  valido: boolean;
  error?: string;
}

/**
 * Genera y descarga la Plantilla Oficial de Excel para Importación Masiva de Productos
 */
export async function downloadPlantillaImportacionProductos(): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Pharmacy Software';
  wb.created = new Date();

  // Hoja 1: Medicamentos
  const ws = wb.addWorksheet('Medicamentos', {
    views: [{ showGridLines: true }],
  });

  const headers = [
    'Codigo Interno',
    'Nombre Comercial *',
    'Nombre Generico (DCI)',
    'Concentracion',
    'Forma Farmaceutica',
    'Laboratorio / Fabricante',
    'Categoria Terapeutica',
    'Registro Sanitario DIGEMID',
    'Condicion de Venta',
    'Unidad Minima Almacen',
    'Presentacion Nombre *',
    'Presentacion Factor *',
    'Codigo de Barras (EAN-13)',
    'Precio Venta (S/) *',
    'Costo Compra (S/)',
  ];

  const headerRow = ws.addRow(headers);
  applyHeaderStyles(headerRow);

  // Filas de ejemplo instructivas
  const ejemplos = [
    [
      'MED-001',
      'Panadol Forte 500 mg / 65 mg',
      'Paracetamol + Cafeína',
      '500 mg / 65 mg',
      'Tableta / Comprimido',
      'GlaxoSmithKline (GSK)',
      'Analgésicos y Antiinflamatorios',
      'EN-01234',
      'sin_receta',
      'TABLETA',
      'Caja x100',
      100,
      '7750123456789',
      65.00,
      35.00,
    ],
    [
      'MED-002',
      'Amoxicilina + Ác. Clavulánico 500/125 mg',
      'Amoxicilina + Clavulanato',
      '500 mg / 125 mg',
      'Tableta / Comprimido',
      'Medifarma S.A.',
      'Antibióticos y Antimicrobianos',
      'EN-09812',
      'receta_retenida',
      'TABLETA',
      'Caja x14',
      14,
      '7750123456796',
      32.00,
      18.00,
    ],
    [
      'MED-003',
      'Ambroxol 30 mg/5 ml Jarabe',
      'Ambroxol Clorhidrato',
      '30 mg / 5 ml',
      'Jarabe',
      'Laboratorios Portugal S.R.L.',
      'Antigripales, Tos y Respiratorios',
      'EG-03310',
      'sin_receta',
      'FRASCO',
      'Frasco x 120 ml',
      1,
      '7750123456802',
      6.50,
      2.80,
    ],
  ];

  ejemplos.forEach((row, idx) => {
    const r = ws.addRow(row);
    applyDataRowStyles(r, idx % 2 === 1);
    r.getCell(14).numFmt = '"S/ "#,##0.00';
    r.getCell(15).numFmt = '"S/ "#,##0.00';
  });

  autoFitColumns(ws, 16);

  // Hoja 2: Guía y Valores Válidos
  const wsGuia = wb.addWorksheet('Instrucciones y Valores Válidos', {
    views: [{ showGridLines: true }],
  });

  wsGuia.addRow(['GUÍA PARA LLENAR LA PLANTILLA DE PRODUCTOS']).font = { bold: true, size: 12 };
  wsGuia.addRow([]);
  wsGuia.addRow(['Columna', '¿Es Obligatorio?', 'Valores Aceptados / Ejemplos', 'Descripción']);
  applyHeaderStyles(wsGuia.getRow(3));

  const explicaciones = [
    ['Codigo Interno', 'Opcional', 'MED-001, PRD-102 (Si se deja vacío, BotiGest genera uno automático)', 'Identificador interno único del producto'],
    ['Nombre Comercial', 'OBLIGATORIO', 'Panadol, Amoxicilina Genfar, Apronax 550mg', 'Nombre comercial de la marca o genérico'],
    ['Nombre Generico (DCI)', 'Recomendado', 'Paracetamol, Amoxicilina, Ibuprofeno', 'Denominación Común Internacional normada por DIGEMID'],
    ['Concentracion', 'Opcional', '500 mg, 100 mg/5 ml, 20 g', 'Potencia o concentración del fármaco'],
    ['Forma Farmaceutica', 'Recomendado', 'Tableta / Comprimido, Cápsula, Jarabe, Suspensión Oral, Solución Inyectable, Crema Dérmica, etc.', 'Forma farmacéutica física'],
    ['Laboratorio / Fabricante', 'Recomendado', 'Medifarma, Portugal, Genfar, Bagó, Farmindustria, etc.', 'Titular del registro o laboratorio fabricante'],
    ['Categoria Terapeutica', 'Recomendado', 'Analgésicos, Antibióticos, Antigripales, Gastroenterología, etc.', 'Familia terapéutica para organización'],
    ['Registro Sanitario', 'Recomendado', 'EN-01234, EG-04561, EE-09123', 'Código de Registro Sanitario DIGEMID'],
    ['Condicion de Venta', 'Opcional', 'sin_receta, con_receta, receta_retenida, psicotropico, estupefaciente', 'Por defecto es sin_receta (Venta Libre)'],
    ['Unidad Minima Almacen', 'Opcional', 'TABLETA, CAPSULA, FRASCO, AMPOLLA, TUBO, SOBRE, UNIDAD', 'Unidad más pequeña para control de Kardex y fraccionamiento'],
    ['Presentacion Nombre', 'OBLIGATORIO', 'Caja x100, Caja x30, Blíster x10, Frasco x 120 ml, Unidad', 'Nombre de venta en caja'],
    ['Presentacion Factor', 'OBLIGATORIO', '100, 30, 10, 1 (Número entero mayor a 0)', 'Cuántas pastillas/unidades mínimas contiene esta presentación'],
    ['Codigo de Barras', 'Opcional', '7750123456789 (EAN-13 o cualquier código numérico)', 'Código que lee el escáner USB de código de barras'],
    ['Precio Venta (S/)', 'OBLIGATORIO', '65.00, 12.50, 1.00', 'Precio de venta al público en soles'],
    ['Costo Compra (S/)', 'Opcional', '35.00, 6.00, 0.50', 'Costo de compra referencial sin/con IGV'],
  ];

  explicaciones.forEach((row, idx) => {
    const r = wsGuia.addRow(row);
    applyDataRowStyles(r, idx % 2 === 1);
  });

  autoFitColumns(wsGuia, 20);

  await downloadWorkbook(wb, 'Plantilla_Importacion_Medicamentos_BotiGest.xlsx');
}

/**
 * Lee y analiza un archivo Excel (.xlsx) de productos para previsualización e importación
 */
export async function parseProductosExcel(file: File): Promise<FilaProductoImportar[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet(1); // Primera hoja
  if (!ws) {
    throw new Error('El archivo Excel no contiene ninguna hoja con datos.');
  }

  const filas: FilaProductoImportar[] = [];

  ws.eachRow((row, rowNumber) => {
    // Ignorar cabecera
    if (rowNumber === 1) return;

    const getVal = (col: number): string => {
      const cell = row.getCell(col);
      if (!cell || cell.value === null || cell.value === undefined) return '';
      if (typeof cell.value === 'object' && 'text' in (cell.value as any)) {
        return String((cell.value as any).text).trim();
      }
      return String(cell.value).trim();
    };

    const getNum = (col: number, def = 0): number => {
      const cell = row.getCell(col);
      if (!cell || cell.value === null || cell.value === undefined) return def;
      const num = parseFloat(String(cell.value).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? def : num;
    };

    const nombreComercial = getVal(2);
    // Ignorar filas totalmente vacías
    if (!nombreComercial) return;

    const presentacionNombre = getVal(11) || 'Unidad';
    const presentacionFactor = Math.max(1, Math.floor(getNum(12, 1)));
    const precioVenta = getNum(14, 0);

    let condicionVenta: FilaProductoImportar['condicion_venta'] = 'sin_receta';
    const condRaw = getVal(9).toLowerCase();
    if (condRaw.includes('retenida')) condicionVenta = 'receta_retenida';
    else if (condRaw.includes('con_receta') || condRaw.includes('simple')) condicionVenta = 'con_receta';
    else if (condRaw.includes('psicotrop')) condicionVenta = 'psicotropico';
    else if (condRaw.includes('estupef')) condicionVenta = 'estupefaciente';

    let error: string | undefined;
    if (!nombreComercial) {
      error = 'Falta el nombre comercial del medicamento.';
    } else if (precioVenta < 0) {
      error = 'El precio de venta no puede ser negativo.';
    }

    filas.push({
      fila: rowNumber,
      codigo_interno: getVal(1),
      nombre_comercial: nombreComercial,
      nombre_generico: getVal(3),
      concentracion: getVal(4),
      forma_farmaceutica: getVal(5),
      laboratorio: getVal(6),
      categoria: getVal(7),
      registro_sanitario: getVal(8),
      condicion_venta: condicionVenta,
      unidad_base: getVal(10).toUpperCase() || 'UNIDAD',
      presentacion_nombre: presentacionNombre,
      presentacion_factor: presentacionFactor,
      codigo_barras: getVal(13),
      precio_venta: precioVenta,
      costo_compra: getNum(15, 0),
      valido: !error,
      error,
    });
  });

  return filas;
}

// ─────────────────────────────────────────────────────────────
// 12. EXPORTACIÓN: KARDEX VALORIZADO Y LIBRO PLE SUNAT 13.1
// ─────────────────────────────────────────────────────────────

export interface KardexExcelItem {
  id: number;
  fecha: string;
  tipo: string;
  producto_codigo?: string;
  producto_nombre: string;
  unidad_base?: string;
  numero_lote: string;
  fecha_vencimiento?: string;
  cantidad_base: number;
  costo_unitario: number;
  saldo_lote_posterior: number;
  referencia_tipo: string | null;
  referencia_id: string | null;
  usuario_nombre: string;
  observacion?: string | null;
  tenant_ruc?: string;
  tenant_razon_social?: string;
}

const SUNAT_TIPO_OPERACION_MAP: Record<string, { codigo: string; nombre: string }> = {
  compra: { codigo: '02', nombre: '02 - COMPRA' },
  venta: { codigo: '01', nombre: '01 - VENTA' },
  devolucion_proveedor: { codigo: '11', nombre: '11 - DEVOLUCIÓN A PROVEEDOR' },
  merma: { codigo: '18', nombre: '18 - MERMA / DESMEDRO' },
  vencimiento: { codigo: '18', nombre: '18 - VENCIMIENTO / MERMA' },
  ajuste_positivo: { codigo: '16', nombre: '16 - SALDO INICIAL / AJUSTE (+)' },
  ajuste_negativo: { codigo: '99', nombre: '99 - OTROS AJUSTES (-)' },
};

export async function exportKardexValorizadoToExcel(
  movimientos: KardexExcelItem[],
  customInfo?: { ruc?: string; razonSocial?: string }
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'BotiGest Sistema Farmacéutico';
  wb.created = new Date();

  const ws = wb.addWorksheet('Kardex Valorizado 13.1', {
    views: [{ state: 'frozen', ySplit: 5 }],
  });

  const ruc = customInfo?.ruc || movimientos[0]?.tenant_ruc || '20123456789';
  const razonSocial =
    customInfo?.razonSocial || movimientos[0]?.tenant_razon_social || 'BOTICA SAN MARTIN S.A.C.';

  // Título Institucional
  ws.mergeCells('A1:T1');
  const titleCell = ws.getCell('A1');
  titleCell.value =
    'REGISTRO DE INVENTARIO PERMANENTE VALORIZADO - DETALLE DEL INVENTARIO VALORIZADO (KARDEX)';
  titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: COLORS.accentBlue } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 26;

  ws.mergeCells('A2:T2');
  const subCell = ws.getCell('A2');
  subCell.value = `RUC: ${ruc} | Razón Social: ${razonSocial} | Método: Promedio Ponderado / FEFO | Generado: ${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE')}`;
  subCell.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: '64748B' } };
  ws.getRow(2).height = 18;

  ws.mergeCells('A3:T3');
  const subCell2 = ws.getCell('A3');
  subCell2.value = `Formato oficial SUNAT Libro 13.1 · Total de movimientos: ${movimientos.length} asientos registrados`;
  subCell2.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: '475569' } };
  ws.getRow(3).height = 18;

  // Cabecera Fila 5
  const headerRow = ws.getRow(5);
  headerRow.values = [
    'N° Asiento',
    'Fecha & Hora',
    'Operación (SUNAT T12)',
    'Doc. Referencia',
    'Código Fármaco',
    'Medicamento / Principio Activo',
    'Lote',
    'Vencimiento',
    'Unidad Medida',
    'ENTRADA: Cantidad',
    'ENTRADA: Costo Unit.',
    'ENTRADA: Costo Total',
    'SALIDA: Cantidad',
    'SALIDA: Costo Unit.',
    'SALIDA: Costo Total',
    'SALDO: Cantidad',
    'SALDO: Costo Unit.',
    'SALDO: Costo Total',
    'Responsable Q.F.',
    'Observaciones',
  ];
  applyHeaderStyles(headerRow);

  let totalEntradasCant = 0;
  let totalEntradasValor = 0;
  let totalSalidasCant = 0;
  let totalSalidasValor = 0;

  movimientos.forEach((m, idx) => {
    const esEntrada = m.cantidad_base > 0;
    const entradaCant = esEntrada ? m.cantidad_base : 0;
    const entradaCostoU = esEntrada ? m.costo_unitario : 0;
    const entradaTotal = entradaCant * entradaCostoU;

    const salidaCant = !esEntrada ? Math.abs(m.cantidad_base) : 0;
    const salidaCostoU = !esEntrada ? m.costo_unitario : 0;
    const salidaTotal = salidaCant * salidaCostoU;

    const saldoCant = m.saldo_lote_posterior;
    const saldoCostoU = m.costo_unitario;
    const saldoTotal = saldoCant * saldoCostoU;

    totalEntradasCant += entradaCant;
    totalEntradasValor += entradaTotal;
    totalSalidasCant += salidaCant;
    totalSalidasValor += salidaTotal;

    const operacionInfo = SUNAT_TIPO_OPERACION_MAP[m.tipo]?.nombre || m.tipo.toUpperCase();
    const docRef = m.referencia_tipo
      ? `${m.referencia_tipo.toUpperCase()}${m.referencia_id ? ` #${m.referencia_id}` : ''}`
      : '-';

    const row = ws.addRow([
      m.id,
      m.fecha,
      operacionInfo,
      docRef,
      m.producto_codigo || `MED-${m.id}`,
      m.producto_nombre,
      m.numero_lote,
      m.fecha_vencimiento || '-',
      m.unidad_base || 'UNIDAD',
      entradaCant,
      entradaCostoU,
      entradaTotal,
      salidaCant,
      salidaCostoU,
      salidaTotal,
      saldoCant,
      saldoCostoU,
      saldoTotal,
      m.usuario_nombre,
      m.observacion || '-',
    ]);

    applyDataRowStyles(row, idx % 2 === 1);

    // Alineaciones
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };

    // Numéricos
    row.getCell(10).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(11).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(13).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(14).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(15).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(16).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(17).alignment = { horizontal: 'right', vertical: 'middle' };
    row.getCell(18).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(10).numFmt = '#,##0';
    row.getCell(11).numFmt = '"S/ "#,##0.00';
    row.getCell(12).numFmt = '"S/ "#,##0.00';
    row.getCell(13).numFmt = '#,##0';
    row.getCell(14).numFmt = '"S/ "#,##0.00';
    row.getCell(15).numFmt = '"S/ "#,##0.00';
    row.getCell(16).numFmt = '#,##0';
    row.getCell(17).numFmt = '"S/ "#,##0.00';
    row.getCell(18).numFmt = '"S/ "#,##0.00';
  });

  // Fila de Totales
  const totalRow = ws.addRow([
    '',
    '',
    '',
    '',
    '',
    'TOTALES GENERALES',
    '',
    '',
    '',
    totalEntradasCant,
    '',
    totalEntradasValor,
    totalSalidasCant,
    '',
    totalSalidasValor,
    '',
    '',
    '',
    '',
    '',
  ]);
  totalRow.height = 24;
  totalRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E2E8F0' },
    };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'double', color: { argb: '000000' } },
    };
  });
  totalRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  totalRow.getCell(10).numFmt = '#,##0';
  totalRow.getCell(12).numFmt = '"S/ "#,##0.00';
  totalRow.getCell(13).numFmt = '#,##0';
  totalRow.getCell(15).numFmt = '"S/ "#,##0.00';

  autoFitColumns(ws, 12);
  await downloadWorkbook(
    wb,
    `Kardex_Valorizado_SUNAT_13.1_${ruc}_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/**
 * Genera y descarga el archivo plano oficial PLE SUNAT Libro 13.1
 * (Registro de Inventario Permanente Valorizado - Formato 13.1)
 */
export function exportPleKardex131ToTXT(
  movimientos: KardexExcelItem[],
  customInfo?: { ruc?: string; periodo?: string }
): void {
  const ruc = customInfo?.ruc || movimientos[0]?.tenant_ruc || '20123456789';

  // Periodo AAAAMM
  let periodo = customInfo?.periodo;
  if (!periodo) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    periodo = `${now.getFullYear()}${mm}`;
  }

  // Nombre normado SUNAT: LE + RUC (11) + AÑO (4) + MES (2) + 00 + 130100 + 00 + 1 + 1 + 1 + 1 .TXT
  const filename = `LE${ruc}${periodo}00130100001111.TXT`;

  const lines: string[] = [];

  movimientos.forEach((m, idx) => {
    const esEntrada = m.cantidad_base > 0;
    const entradaCant = esEntrada ? m.cantidad_base : 0;
    const entradaCostoU = esEntrada ? m.costo_unitario : 0;
    const entradaTotal = entradaCant * entradaCostoU;

    const salidaCant = !esEntrada ? Math.abs(m.cantidad_base) : 0;
    const salidaCostoU = !esEntrada ? m.costo_unitario : 0;
    const salidaTotal = salidaCant * salidaCostoU;

    const saldoCant = m.saldo_lote_posterior;
    const saldoCostoU = m.costo_unitario;
    const saldoTotal = saldoCant * saldoCostoU;

    // Fecha en formato DD/MM/AAAA
    let fechaEmision = m.fecha;
    if (fechaEmision.includes(' ')) {
      fechaEmision = fechaEmision.split(' ')[0];
    }

    const codOperacion = SUNAT_TIPO_OPERACION_MAP[m.tipo]?.codigo || '99';
    const tipoDoc = m.tipo === 'compra' ? '01' : m.tipo === 'venta' ? '03' : '00';
    const numDoc = m.referencia_id || String(m.id);
    const codProd = (m.producto_codigo || `MED-${m.id}`).replace(/\|/g, '-');
    const descProd = m.producto_nombre.replace(/\|/g, ' ');
    const cuo = `K${m.id}`;
    const correlativo = `M${String(idx + 1).padStart(7, '0')}`;

    // Estructura oficial 24 campos SUNAT PLE 13.1
    const fields = [
      `${periodo}00`, // 1. Periodo
      cuo, // 2. Código Único Operación (CUO)
      correlativo, // 3. Correlativo del Asiento
      '0000', // 4. Código Establecimiento anexo
      '9', // 5. Código de Catálogo (9 = Propio)
      '01', // 6. Tipo de Existencia (01 = Mercadería)
      codProd, // 7. Código Propio de la Existencia
      '', // 8. Código SUNAT
      fechaEmision, // 9. Fecha de la operación
      tipoDoc, // 10. Tipo Documento (Tabla 10)
      '0001', // 11. Serie del comprobante
      numDoc, // 12. Número del comprobante
      codOperacion, // 13. Tipo de Operación (Tabla 12)
      descProd, // 14. Descripción de la Existencia
      'NIU', // 15. Unidad de Medida (Tabla 6 SUNAT)
      '1', // 16. Método de Valuación (1 = Promedio Ponderado)
      entradaCant.toFixed(2), // 17. Entrada Cantidad
      entradaCostoU.toFixed(4), // 18. Entrada Costo Unitario
      entradaTotal.toFixed(2), // 19. Entrada Costo Total
      salidaCant.toFixed(2), // 20. Salida Cantidad
      salidaCostoU.toFixed(4), // 21. Salida Costo Unitario
      salidaTotal.toFixed(2), // 22. Salida Costo Total
      saldoCant.toFixed(2), // 23. Saldo Cantidad
      saldoCostoU.toFixed(4), // 24. Saldo Costo Unitario
      saldoTotal.toFixed(2), // 25. Saldo Costo Total
      '1', // 26. Estado de la Operación (1 = En el periodo)
    ];

    lines.push(fields.join('|') + '|');
  });

  const content = lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

