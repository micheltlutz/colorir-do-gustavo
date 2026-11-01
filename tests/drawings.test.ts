import { describe, expect, it } from 'vitest';
import { DRAWINGS } from '../src/paint/drawings.ts';

describe('desenhos', () => {
  it('são 12, com nomes únicos', () => {
    expect(DRAWINGS).toHaveLength(12);
    const ids = DRAWINGS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DRAWINGS.map((d) => [d.id, d] as const))('%s tem regiões válidas', (_, d) => {
    const ids = d.regions.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(d.regions.length).toBeGreaterThanOrEqual(8);
    expect(d.regions.length).toBeLessThanOrEqual(20);
    // O fundo vem primeiro (fica atrás de tudo) e só ele não tem contorno.
    expect(d.regions[0].background).toBe(true);
    expect(d.regions.filter((r) => r.background)).toHaveLength(1);
    for (const r of d.regions) {
      for (const v of Object.values(r.shape.attrs)) {
        if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
        else expect(v).toMatch(/^[MLQTZHVAa0-9 .\-]+$/);
      }
    }
  });
});
