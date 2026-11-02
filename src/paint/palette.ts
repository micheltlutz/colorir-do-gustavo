// Cores da paleta: cada cor vem em três tons (claro, médio e escuro).
// Cada tom toca uma nota da escala pentatônica de dó (qualquer sequência soa bem):
// cada cor sobe um degrau e o tom claro fica um degrau acima do médio.

import { BLANK } from './state.ts';

export interface Swatch {
  color: string;
  /** Nome lido pelo VoiceOver. */
  label: string;
  /** Frequência da nota, em Hz. */
  note: number;
}

interface Hue {
  name: string;
  /** Claro, médio e escuro. */
  tones: [string, string, string];
  /** Nomes próprios dos tons (para as cores neutras). */
  labels?: [string, string, string];
}

const HUES: Hue[] = [
  { name: 'Vermelho', tones: ['#FF8A80', '#E53935', '#B71C1C'] },
  { name: 'Laranja', tones: ['#FFB74D', '#FB8C00', '#E65100'] },
  { name: 'Amarelo', tones: ['#FFF59D', '#FDD835', '#F9A825'] },
  { name: 'Verde-claro', tones: ['#C5E1A5', '#7CB342', '#558B2F'] },
  { name: 'Verde', tones: ['#81C784', '#43A047', '#1B5E20'] },
  { name: 'Azul-claro', tones: ['#B3E5FC', '#4FC3F7', '#0288D1'] },
  { name: 'Azul', tones: ['#90CAF9', '#1E88E5', '#0D47A1'] },
  { name: 'Roxo', tones: ['#CE93D8', '#8E24AA', '#4A148C'] },
  { name: 'Rosa', tones: ['#F8BBD0', '#F06292', '#C2185B'] },
  { name: 'Bege', tones: ['#FFE0B2', '#FFCC80', '#C68642'] },
  { name: 'Marrom', tones: ['#BCAAA4', '#8D6E63', '#5D4037'] },
  { name: 'Cinza', tones: [BLANK, '#9E9E9E', '#263238'], labels: ['Branco (borracha)', 'Cinza', 'Preto'] },
];

const PENTATONIC = [0, 2, 4, 7, 9];
/** Nota número n da escala pentatônica, começando no dó grave (C3). */
const pentatonic = (n: number) => 130.81 * 2 ** ((PENTATONIC[n % 5] + 12 * Math.floor(n / 5)) / 12);

const TONE_NAMES = ['claro', '', 'escuro'];

/** Em ordem: cor por cor, e em cada cor claro, médio, escuro. */
export const PALETTE: Swatch[] = HUES.flatMap((hue, i) =>
  hue.tones.map((color, k) => ({
    color,
    label: hue.labels?.[k] ?? `${hue.name} ${TONE_NAMES[k]}`.trim(),
    note: pentatonic(i + 3 + (2 - k)),
  })),
);

/** Quantas cores (fileiras de tons) a paleta tem. */
export const HUE_COUNT = HUES.length;

/** Cor escolhida ao abrir o jogo: vermelho médio. */
export const DEFAULT_SWATCH = PALETTE[1];

/** Tons médios das cores vivas, para o título colorido. */
export const BRIGHT_COLORS = HUES.slice(0, 9).map((h) => h.tones[1]);
