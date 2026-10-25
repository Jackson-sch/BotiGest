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
});
