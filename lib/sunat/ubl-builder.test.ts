import { describe, it, expect } from 'vitest';
import { buildUbl21Xml } from '@/lib/sunat/ubl-builder';

describe('Módulo Tributario SUNAT - UBL 2.1', () => {
  it('debe generar la estructura XML válida con namespaces estándar', () => {
    const { xml, hash } = buildUbl21Xml({
      tipoComprobante: '03',
      serie: 'B001',
      numero: 1450,
      fechaEmision: '2026-10-24',
      horaEmision: '10:30:00',
      moneda: 'PEN',
      emisor: {
        ruc: '20601234567',
        razonSocial: 'BOTICA SAN MARTIN S.A.C.',
        direccion: 'Av. Principal 123',
        ubigeo: '150101',
        departamento: 'LIMA',
        provincia: 'LIMA',
        distrito: 'LIMA',
        codigoEstablecimiento: '0000',
      },
      cliente: {
        tipoDoc: '1',
        numeroDoc: '72345678',
        razonSocialONombre: 'CARLOS GOMEZ',
      },
      items: [
        {
          id: '1',
          codigo: 'AMX-500',
          descripcion: 'AMOXICILINA 500MG CAPSULA',
          unidadMedida: 'NIU',
          cantidad: 20,
          valorUnitario: 1.00,
          precioUnitario: 1.18,
          subtotal: 20.00,
          igv: 3.60,
          total: 23.60,
          tipoAfectacion: '10',
          lote: 'L-9988',
          fechaVencimiento: '2028-06-30',
        },
      ],
      subtotalGravado: 20.00,
      subtotalExonerado: 0,
      subtotalInafecto: 0,
      totalIgv: 3.60,
      totalDescuento: 0,
      totalVenta: 23.60,
    });

    expect(xml).toContain('<cbc:UBLVersionID>2.1</cbc:UBLVersionID>');
    expect(xml).toContain('<cbc:ID>B001-00001450</cbc:ID>');
    expect(xml).toContain('AMOXICILINA 500MG CAPSULA');
    expect(xml).toContain('<cbc:LotNumberID>L-9988</cbc:LotNumberID>');
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(10);
  });
});
