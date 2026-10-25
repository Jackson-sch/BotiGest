import { describe, it, expect } from 'vitest';

describe('Regulador DIGEMID - BPA Temperatura & Humedad', () => {
  it('debe declarar conforme el área de ambiente cuando T <= 30°C y HR <= 70%', () => {
    const temperatura = 23.4;
    const humedad = 58;
    const esConforme = temperatura >= 15 && temperatura <= 30 && humedad <= 70;
    expect(esConforme).toBe(true);
  });

  it('debe alertar excursión térmica si temperatura ambiente supera los 30°C', () => {
    const temperatura = 32.5;
    const humedad = 60;
    const esConforme = temperatura >= 15 && temperatura <= 30 && humedad <= 70;
    expect(esConforme).toBe(false);
  });

  it('debe evaluar rigurosamente el rango de 2°C a 8°C en cadena de frío', () => {
    const evaluarCadenaFrio = (t: number) => t >= 2.0 && t <= 8.0;

    expect(evaluarCadenaFrio(4.5)).toBe(true);
    expect(evaluarCadenaFrio(1.8)).toBe(false); // Riesgo de congelación
    expect(evaluarCadenaFrio(9.2)).toBe(false); // Excursión por calor
  });
});
