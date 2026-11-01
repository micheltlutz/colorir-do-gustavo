// Desenhos e preferências salvos no próprio iPad. Se o armazenamento falhar
// (modo privado, por exemplo), o jogo continua funcionando, só não lembra.

import type { Fills } from './paint/state.ts';

const KEY = 'colorir-do-gustavo:v1';

interface SaveData {
  fills: Record<string, Record<string, string>>;
  done: string[];
  sound: boolean;
}

function read(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<SaveData>;
      return {
        fills: data.fills && typeof data.fills === 'object' ? data.fills : {},
        done: Array.isArray(data.done) ? data.done.filter((d) => typeof d === 'string') : [],
        sound: data.sound !== false,
      };
    }
  } catch {
    // ignora: começa do zero
  }
  return { fills: {}, done: [], sound: true };
}

const state = read();

function write(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // sem armazenamento disponível
  }
}

export const store = {
  fillsOf: (drawing: string): Fills => state.fills[drawing] ?? {},
  saveFills(drawing: string, fills: Fills): void {
    state.fills[drawing] = { ...fills };
    write();
  },
  isDone: (drawing: string) => state.done.includes(drawing),
  markDone(drawing: string): void {
    if (!state.done.includes(drawing)) {
      state.done.push(drawing);
      write();
    }
  },
  get sound(): boolean {
    return state.sound;
  },
  set sound(on: boolean) {
    state.sound = on;
    write();
  },
};
