import { describe, expect, it } from 'vitest';
import { DRAWINGS } from '../src/paint/drawings.ts';
import { BLANK, clearAll, colorOf, initialState, isComplete, paint, undo } from '../src/paint/state.ts';

const RED = '#E53935';
const BLUE = '#1E88E5';

describe('pintar e desfazer', () => {
  it('pinta uma região e desfaz', () => {
    let s = initialState();
    s = paint(s, 'sol', RED);
    expect(colorOf(s.fills, 'sol')).toBe(RED);
    s = paint(s, 'sol', BLUE);
    expect(colorOf(s.fills, 'sol')).toBe(BLUE);
    s = undo(s);
    expect(colorOf(s.fills, 'sol')).toBe(RED);
    s = undo(s);
    expect(colorOf(s.fills, 'sol')).toBe(BLANK);
    expect(undo(s)).toBe(s); // nada mais para desfazer
  });

  it('pintar com a mesma cor não entra no histórico', () => {
    const s = paint(initialState(), 'sol', RED);
    expect(paint(s, 'sol', RED)).toBe(s);
  });

  it('branco funciona como borracha', () => {
    let s = paint(initialState(), 'sol', RED);
    s = paint(s, 'sol', BLANK);
    expect(s.fills).toEqual({});
    expect(colorOf(undo(s).fills, 'sol')).toBe(RED);
  });

  it('apagar tudo também dá para desfazer', () => {
    let s = paint(paint(initialState(), 'sol', RED), 'ceu', BLUE);
    s = clearAll(s);
    expect(s.fills).toEqual({});
    s = undo(s);
    expect(s.fills).toEqual({ sol: RED, ceu: BLUE });
    expect(clearAll(initialState())).toEqual(initialState());
  });

  it('não altera o estado anterior', () => {
    const a = initialState();
    const b = paint(a, 'sol', RED);
    expect(a.fills).toEqual({});
    expect(b).not.toBe(a);
  });
});

describe('desenho completo', () => {
  it('só quando todas as regiões têm cor', () => {
    const d = DRAWINGS[0];
    let s = initialState();
    for (const r of d.regions.slice(0, -1)) s = paint(s, r.id, RED);
    expect(isComplete(d, s.fills)).toBe(false);
    s = paint(s, d.regions.at(-1)!.id, BLUE);
    expect(isComplete(d, s.fills)).toBe(true);
  });
});
