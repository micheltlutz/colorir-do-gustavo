import { describe, expect, it } from 'vitest';
import { DRAWINGS } from '../src/paint/drawings.ts';
import { PALETTE } from '../src/paint/palette.ts';
import { BLANK } from '../src/paint/state.ts';

describe('desenhos', () => {
  it('são 34, com nomes únicos', () => {
    expect(DRAWINGS).toHaveLength(34);
    const ids = DRAWINGS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(DRAWINGS.map((d) => [d.id, d] as const))('%s tem regiões válidas', (_, d) => {
    const ids = d.regions.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(d.regions.length).toBeGreaterThanOrEqual(8);
    expect(d.regions.length).toBeLessThanOrEqual(30);
    // O fundo vem primeiro (fica atrás de tudo) e só ele não tem contorno.
    expect(d.regions[0].background).toBe(true);
    expect(d.regions.filter((r) => r.background)).toHaveLength(1);
    for (const r of d.regions) {
      for (const v of Object.values(r.shape.attrs)) {
        if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
        else expect(v).toMatch(/^[MLQTCZHVAa0-9 .\-]+$/);
      }
    }
  });
});

describe('paleta', () => {
  it('tem 12 cores com 3 tons cada, sem repetir', () => {
    expect(PALETTE).toHaveLength(36);
    expect(new Set(PALETTE.map((s) => s.color)).size).toBe(36);
    expect(PALETTE.map((s) => s.color)).toContain(BLANK);
    for (const s of PALETTE) {
      expect(s.color).toMatch(/^#[0-9A-F]{6}$/);
      expect(s.note).toBeGreaterThan(150);
      expect(s.note).toBeLessThan(1300);
    }
  });
});
