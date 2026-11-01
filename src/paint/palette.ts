// Cores da paleta. Cada uma toca uma nota (escala de dó maior) ao ser escolhida.

import { BLANK } from './state.ts';

export interface Swatch {
  color: string;
  /** Nome lido pelo VoiceOver. */
  label: string;
  /** Frequência da nota, em Hz. */
  note: number;
}

export const PALETTE: Swatch[] = [
  { color: '#E53935', label: 'Vermelho', note: 261.63 },
  { color: '#FB8C00', label: 'Laranja', note: 293.66 },
  { color: '#FDD835', label: 'Amarelo', note: 329.63 },
  { color: '#7CB342', label: 'Verde-claro', note: 349.23 },
  { color: '#2E7D32', label: 'Verde', note: 392.0 },
  { color: '#4FC3F7', label: 'Azul-claro', note: 440.0 },
  { color: '#1E88E5', label: 'Azul', note: 493.88 },
  { color: '#8E24AA', label: 'Roxo', note: 523.25 },
  { color: '#F06292', label: 'Rosa', note: 587.33 },
  { color: '#FFCC80', label: 'Bege', note: 659.25 },
  { color: '#8D6E63', label: 'Marrom', note: 698.46 },
  { color: '#9E9E9E', label: 'Cinza', note: 783.99 },
  { color: '#263238', label: 'Preto', note: 880.0 },
  { color: BLANK, label: 'Branco (borracha)', note: 987.77 },
];
