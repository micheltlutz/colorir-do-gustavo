// Estado de um desenho: a cor de cada região e o histórico para desfazer.
// Código puro (sem DOM), testado em tests/state.test.ts.

import type { Drawing } from './drawings.ts';

/** Região sem cor (o branco também funciona como borracha). */
export const BLANK = '#FFFFFF';

export type Fills = Readonly<Record<string, string>>;

type Step = { region: string; prev: string | undefined } | { cleared: Fills };

export interface PaintState {
  fills: Fills;
  history: readonly Step[];
}

const MAX_HISTORY = 100;

export function initialState(fills: Fills = {}): PaintState {
  return { fills, history: [] };
}

export function colorOf(fills: Fills, region: string): string {
  return fills[region] ?? BLANK;
}

/** Pinta uma região. Pintar com a mesma cor não muda nada. */
export function paint(state: PaintState, region: string, color: string): PaintState {
  if (colorOf(state.fills, region) === color) return state;
  const fills: Record<string, string> = { ...state.fills };
  if (color === BLANK) delete fills[region];
  else fills[region] = color;
  const history = [...state.history, { region, prev: state.fills[region] }].slice(-MAX_HISTORY);
  return { fills, history };
}

/** Desfaz a última pintura (ou o "apagar tudo"). */
export function undo(state: PaintState): PaintState {
  const last = state.history.at(-1);
  if (!last) return state;
  const history = state.history.slice(0, -1);
  if ('cleared' in last) return { fills: last.cleared, history };
  const fills: Record<string, string> = { ...state.fills };
  if (last.prev === undefined) delete fills[last.region];
  else fills[last.region] = last.prev;
  return { fills, history };
}

/** Apaga o desenho todo (dá para desfazer). */
export function clearAll(state: PaintState): PaintState {
  if (Object.keys(state.fills).length === 0) return state;
  return { fills: {}, history: [...state.history, { cleared: state.fills }].slice(-MAX_HISTORY) };
}

/** Todas as regiões têm alguma cor. */
export function isComplete(drawing: Drawing, fills: Fills): boolean {
  return drawing.regions.every((r) => colorOf(fills, r.id) !== BLANK);
}
