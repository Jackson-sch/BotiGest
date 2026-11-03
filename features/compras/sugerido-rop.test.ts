import { describe, it, expect } from 'vitest';

describe('Logística & Compras - Punto de Reorden (ROP)', () => {
  it('debe calcular el ROP considerando Lead Time de 7 días y Buffer de seguridad de 5 días', () => {
    const calcularRop = (consumoDiario: number, leadTimeDias = 7, bufferDias = 5) => {
      return Math.ceil(consumoDiario * (leadTimeDias + bufferDias));
    };

    // Si vendemos 10 tabletas por día -> ROP = 10 * 12 = 120 unidades
    const rop = calcularRop(10);
    expect(rop).toBe(120);

    // Si tenemos 40 en stock -> se deben comprar 80 unidades
    const stockActual = 40;
    const cantidadSugerida = Math.max(0, rop - stockActual);
    expect(cantidadSugerida).toBe(80);
  });

  it('no debe sugerir compra si el stock actual excede el ROP', () => {
    const rop = 60;
    const stockActual = 95;
    const cantidadSugerida = Math.max(0, rop - stockActual);
    expect(cantidadSugerida).toBe(0);
  });

  it('debe agrupar y detectar múltiples laboratorios en una selección de compra', () => {
    const items = [
      { id: '1', nombre: 'Paracetamol 500mg', laboratorio: 'Laboratorios Portugal' },
      { id: '2', nombre: 'Ibuprofeno 400mg', laboratorio: 'Laboratorios Portugal' },
      { id: '3', nombre: 'Amoxicilina 500mg', laboratorio: 'Medifarma S.A.' },
      { id: '4', nombre: 'Cetirizina 10mg', laboratorio: 'Bagó del Perú' },
    ];

    const map = new Map<string, number>();
    items.forEach((it) => {
      const lab = it.laboratorio || 'Sin Laboratorio';
      map.set(lab, (map.get(lab) || 0) + 1);
    });

    const resumenLabs = Array.from(map.entries()).map(([nombre, count]) => ({ nombre, count }));

    expect(resumenLabs).toHaveLength(3);
    expect(resumenLabs.find((l) => l.nombre === 'Laboratorios Portugal')?.count).toBe(2);
    expect(resumenLabs.find((l) => l.nombre === 'Medifarma S.A.')?.count).toBe(1);
    expect(resumenLabs.find((l) => l.nombre === 'Bagó del Perú')?.count).toBe(1);

    // Filtrar solo los de Laboratorios Portugal
    const portugalOnly = items.filter((it) => it.laboratorio === 'Laboratorios Portugal');
    expect(portugalOnly).toHaveLength(2);
  });

  describe('Anulación de Facturas de Compra & Kardex', () => {
    it('debe permitir anulación directa si la compra está en borrador sin alterar stock', () => {
      const compra = {
        id: 'compra-1',
        estado: 'borrador',
        items: [{ producto_id: 'p1', cantidad: 50 }],
      };

      const puedeAnularSinReversion = compra.estado === 'borrador';
      expect(puedeAnularSinReversion).toBe(true);
    });

    it('debe impedir anular compra recibida si el stock disponible es menor a lo ingresado (unidades vendidas)', () => {
      const validarReversionStock = (ingresado: number, disponibleActual: number) => {
        if (disponibleActual < ingresado) {
          return {
            puedeAnular: false,
            error: `Stock insuficiente para revertir (disponible: ${disponibleActual}, ingresado: ${ingresado})`,
          };
        }
        return { puedeAnular: true };
      };

      // Se ingresaron 100 cajas, pero quedan 40 (se vendieron 60)
      const res = validarReversionStock(100, 40);
      expect(res.puedeAnular).toBe(false);
      expect(res.error).toContain('Stock insuficiente');

      // Se ingresaron 50 cajas y quedan 50 intactas
      const resValido = validarReversionStock(50, 50);
      expect(resValido.puedeAnular).toBe(true);
    });
  });
});
