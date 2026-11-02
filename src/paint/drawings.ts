// Os desenhos para colorir. Todos usam uma área de 400x400.
//
// Cada desenho é uma lista de regiões pintáveis, da que fica atrás para a que
// fica na frente (uma região pode cobrir parte de outra). Detalhes que não se
// pintam (olhos, maçanetas, linhas) ficam em `ink`, desenhados por cima.

export type Tag = 'rect' | 'circle' | 'ellipse' | 'path';

export interface Shape {
  tag: Tag;
  attrs: Record<string, number | string>;
}

export interface Region {
  id: string;
  shape: Shape;
  /** Fundo que ocupa a área toda: sem contorno. */
  background?: boolean;
}

export interface Drawing {
  id: string;
  /** Nome lido pelo VoiceOver (a tela não mostra texto). */
  label: string;
  regions: Region[];
  /** Traços por cima de tudo, que não se pintam (classe "ink-fill" = bolinha preenchida). */
  ink?: string;
}

const rect = (x: number, y: number, width: number, height: number, rx = 0): Shape => ({
  tag: 'rect',
  attrs: { x, y, width, height, rx },
});
const circle = (cx: number, cy: number, r: number): Shape => ({ tag: 'circle', attrs: { cx, cy, r } });
const ellipse = (cx: number, cy: number, rx: number, ry: number): Shape => ({ tag: 'ellipse', attrs: { cx, cy, rx, ry } });
const path = (d: string): Shape => ({ tag: 'path', attrs: { d } });

/** Várias bolinhas que se pintam juntas (uma região só). */
const dots = (list: [number, number, number][]): Shape =>
  path(list.map(([cx, cy, r]) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`).join(' '));

const region = (id: string, shape: Shape): Region => ({ id, shape });
const background = (id: string): Region => ({ id, shape: rect(0, 0, 400, 400), background: true });

/** Pétalas em volta de um miolo. */
const petals = (cx: number, cy: number): Shape =>
  dots([
    [cx, cy - 17, 13],
    [cx + 17, cy, 13],
    [cx, cy + 17, 13],
    [cx - 17, cy, 13],
  ]);

type Pt = readonly [number, number];
const r1 = (n: number) => Math.round(n * 10) / 10;
const xy = (x: number, y: number) => `${r1(x)} ${r1(y)}`;

/** Nuvem fofinha. (x, y) é o canto de baixo à esquerda; no tamanho 1 ela mede 130 x 63. */
const CLOUD: Pt[] = [
  [0, -8], [0, -33], [25, -30], [35, -56], [65, -48], [85, -63], [105, -43],
  [130, -43], [128, -20], [130, 0], [105, 0], [20, 0], [0, 0], [0, -8],
];
function cloud(x: number, y: number, s = 1): Shape {
  const p = CLOUD.map(([dx, dy]) => xy(x + dx * s, y + dy * s));
  return path(
    `M${p[0]} Q${p[1]} ${p[2]} Q${p[3]} ${p[4]} Q${p[5]} ${p[6]} Q${p[7]} ${p[8]} Q${p[9]} ${p[10]} L${p[11]} Q${p[12]} ${p[13]} Z`,
  );
}

/**
 * Faixa que segue uma curva (de p0 a p3) e afina de w0 para w1, com as pontas
 * redondas. Serve para rabos, tentáculos e braços.
 */
function tube(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number): Shape {
  const N = 24;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    const at = (k: 0 | 1) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k];
    const d = (k: 0 | 1) => 3 * u * u * (p1[k] - p0[k]) + 6 * u * t * (p2[k] - p1[k]) + 3 * t * t * (p3[k] - p2[k]);
    const len = Math.hypot(d(0), d(1)) || 1;
    const half = (w0 + (w1 - w0) * t) / 2;
    const nx = (-d(1) / len) * half;
    const ny = (d(0) / len) * half;
    left.push(xy(at(0) + nx, at(1) + ny));
    right.push(xy(at(0) - nx, at(1) - ny));
  }
  right.reverse();
  const a0 = r1(w0 / 2);
  const a1 = r1(w1 / 2);
  return path(`M${left.join(' L')} A${a1} ${a1} 0 0 0 ${right.join(' L')} A${a0} ${a0} 0 0 0 ${left[0]} Z`);
}

/** Barra reta com as pontas redondas. */
const bar = (x1: number, y1: number, x2: number, y2: number, w: number): Shape =>
  tube([x1, y1], [x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3], [x1 + ((x2 - x1) * 2) / 3, y1 + ((y2 - y1) * 2) / 3], [x2, y2], w, w);

/** Estrela de n pontas. */
function star(cx: number, cy: number, outer: number, inner: number, n = 5): Shape {
  const pts: string[] = [];
  for (let i = 0; i < 2 * n; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? inner : outer;
    pts.push(xy(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return path(`M${pts.join(' L')} Z`);
}

/** Faixa de arco-íris: meia-coroa entre os raios r e R, com o centro em (cx, cy). */
const arcBand = (cx: number, cy: number, R: number, r: number): Shape =>
  path(`M${cx - R} ${cy} A${R} ${R} 0 0 1 ${cx + R} ${cy} L${cx + r} ${cy} A${r} ${r} 0 0 0 ${cx - r} ${cy} Z`);

/** Gomo do balão entre as linhas a e b (de -1, à esquerda, até 1, à direita). */
function gore(a: number, b: number): Shape {
  const x = (t: number, k: number) => r1(200 + k * t);
  return path(
    `M200 28 C${x(a, 140)} 28 ${x(a, 140)} 215 ${x(a, 35)} 245 L${x(b, 35)} 245 ` +
      `C${x(b, 140)} 215 ${x(b, 140)} 28 200 28 Z`,
  );
}

/** Cobertura de bolo: começa no topo (com cantos redondos) e escorre em gotas até `band`. */
function frosting(x1: number, x2: number, top: number, band: number, depth: number, n: number): Shape {
  const rad = 14;
  let d = `M${x1} ${band} V${top + rad} Q${x1} ${top} ${x1 + rad} ${top} H${x2 - rad} Q${x2} ${top} ${x2} ${top + rad} V${band}`;
  const w = (x2 - x1) / n;
  for (let i = 0; i < n; i++) {
    const xa = x2 - i * w;
    const deep = i % 2 === 0 ? depth : depth * 0.55;
    d += ` Q${xy(xa - w / 2, band + deep * 2)} ${xy(xa - w, band)}`;
  }
  return path(`${d} Z`);
}

/** Osso deitado, com o centro em (cx, cy). */
function bone(cx: number, cy: number, len: number, h: number): Shape {
  const knob = (s: 1 | -1) => {
    const x = (dx: number) => cx + s * (len + dx);
    const y = (dy: number) => cy + s * dy;
    return (
      `L${xy(x(0), y(-h))} Q${xy(x(2), y(-h - 18))} ${xy(x(14), y(-h - 14))} ` +
      `Q${xy(x(26), y(-h - 8))} ${xy(x(16), y(0))} Q${xy(x(26), y(h + 8))} ${xy(x(14), y(h + 14))} ` +
      `Q${xy(x(2), y(h + 18))} ${xy(x(0), y(h))}`
    );
  };
  return path(`M${xy(cx - len, cy - h)} ${knob(1)} ${knob(-1)} Z`);
}

/** Muralha com ameias em cima (n pedaços, um sim um não, começando e terminando em cima). */
function battlement(x1: number, x2: number, top: number, depth: number, bottom: number, n: number): Shape {
  const w = (x2 - x1) / n;
  let d = `M${x1} ${bottom} V${top}`;
  for (let i = 0; i < n; i++) {
    const x = r1(x1 + (i + 1) * w);
    const up = i % 2 === 0;
    d += ` H${x}`;
    if (i < n - 1) d += ` V${up ? top + depth : top}`;
  }
  return path(`${d} V${bottom} Z`);
}

/** Bandeirinha de festa pendurada no varal (que vai de (-10, 18) até (410, 18), caindo até 70 no meio). */
function bunting(cx: number): Shape {
  const y = (x: number) => {
    const t = (x + 10) / 420;
    return 18 + 104 * t * (1 - t);
  };
  return path(`M${xy(cx - 28, y(cx - 28))} L${xy(cx + 28, y(cx + 28))} L${xy(cx, y(cx) + 48)} Z`);
}

/** Chama de vela com a base em (cx, base). */
const flame = (cx: number, base: number) =>
  `M${cx} ${base} Q${cx - 14} ${base - 12} ${cx - 6} ${base - 24} Q${cx - 2} ${base - 30} ${cx} ${base - 36} ` +
  `Q${cx + 2} ${base - 30} ${cx + 6} ${base - 24} Q${cx + 14} ${base - 12} ${cx} ${base} Z`;

/** Juba do leão: 12 bolotas em volta da cabeça. */
const MANE: [number, number, number][] = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  return [r1(230 + 70 * Math.cos(a)), r1(160 + 70 * Math.sin(a)), 28];
});

const BALLOON_LINES = [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1];
const RAINBOW = [192, 170, 148, 126, 104, 82, 60];

/** Pedaço de anel (para-lamas), entre os ângulos a0 e a1 em graus (0 = direita, 90 = baixo). */
function ringArc(cx: number, cy: number, R: number, r: number, a0: number, a1: number): Shape {
  const at = (rad: number, deg: number) =>
    xy(cx + rad * Math.cos((deg * Math.PI) / 180), cy + rad * Math.sin((deg * Math.PI) / 180));
  const large = a1 - a0 > 180 ? 1 : 0;
  return path(`M${at(R, a0)} A${R} ${R} 0 ${large} 1 ${at(R, a1)} L${at(r, a1)} A${r} ${r} 0 ${large} 0 ${at(r, a0)} Z`);
}

/**
 * Faixa do tambor da betoneira: o tambor é uma elipse (semieixos a e b) com o
 * centro em (cx, cy), inclinada `deg` graus. A faixa vai de s0 a s1 ao longo do eixo.
 */
function drumBand(cx: number, cy: number, a: number, b: number, deg: number, s0: number, s1: number): Shape {
  const th = (deg * Math.PI) / 180;
  const [ux, uy] = [Math.cos(th), Math.sin(th)];
  const [nx, ny] = [-uy, ux];
  const f0 = Math.acos(s0 / a);
  const f1 = Math.acos(s1 / a);
  const top: string[] = [];
  const bottom: string[] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const f = f0 + ((f1 - f0) * i) / N;
    const s = a * Math.cos(f);
    const r = b * Math.sin(f);
    top.push(xy(cx + ux * s - nx * r, cy + uy * s - ny * r));
    bottom.push(xy(cx + ux * s + nx * r, cy + uy * s + ny * r));
  }
  return path(`M${top.join(' L')} L${bottom.reverse().join(' L')} Z`);
}

/** Degraus de uma escada reta (traços por cima), entre as frações t0 e t1 do comprimento. */
function rungs(x1: number, y1: number, x2: number, y2: number, half: number, t0: number, t1: number, n: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const [dx, dy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [nx, ny] = [-dy * half, dx * half];
  const lines: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * i) / (n - 1);
    const [px, py] = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
    lines.push(`M${xy(px + nx, py + ny)} L${xy(px - nx, py - ny)}`);
  }
  return `<path d="${lines.join(' ')}"/>`;
}

/** Janelas de prédio (só o contorno, não se pintam). */
function windowGrid(x: number, y: number, cols: number, rows: number, w: number, h: number, gx: number, gy: number): string {
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out += `<rect x="${x + c * (w + gx)}" y="${y + r * (h + gy)}" width="${w}" height="${h}" rx="3"/>`;
    }
  }
  return out;
}

/** Faixas do tambor da betoneira, de trás (esquerda) para a frente. */
const DRUM_CUTS = [-125, -80, -30, 20, 70, 125];

export const DRAWINGS: Drawing[] = [
  {
    id: 'carro',
    label: 'Carro',
    regions: [
      background('ceu'),
      region('sol', circle(335, 70, 34)),
      region('estrada', rect(-10, 315, 420, 100)),
      region('cabine', path('M110 190 Q126 112 192 106 L248 106 Q292 110 312 190 Z')),
      region('corpo', rect(45, 180, 310, 95, 42)),
      region('janela-tras', path('M138 185 Q150 132 192 128 L202 128 L202 185 Z')),
      region('janela-frente', path('M220 128 L246 128 Q276 132 290 185 L220 185 Z')),
      region('farol', circle(343, 213, 12)),
      region('lanterna', rect(45, 200, 14, 26, 5)),
      region('roda-tras', circle(122, 276, 40)),
      region('calota-tras', circle(122, 276, 16)),
      region('roda-frente', circle(282, 276, 40)),
      region('calota-frente', circle(282, 276, 16)),
    ],
    ink: `<path d="M211 190 V258"/><path d="M226 212 H246"/>
      <path d="M20 365 H70 M130 365 H180 M240 365 H290 M350 365 H390"/>`,
  },
  {
    id: 'caminhao',
    label: 'Caminhão',
    regions: [
      background('ceu'),
      region('sol', circle(70, 65, 32)),
      region('estrada', rect(-10, 315, 420, 100)),
      region('bau', rect(25, 110, 235, 160, 10)),
      region('cabine', path('M262 140 L322 140 L372 200 L372 270 L262 270 Z')),
      region('janela', path('M278 156 L314 156 L350 200 L278 200 Z')),
      region('parachoque', rect(355, 248, 30, 24, 6)),
      region('farol', circle(364, 222, 9)),
      region('roda-1', circle(80, 280, 34)),
      region('calota-1', circle(80, 280, 13)),
      region('roda-2', circle(170, 280, 34)),
      region('calota-2', circle(170, 280, 13)),
      region('roda-3', circle(318, 280, 34)),
      region('calota-3', circle(318, 280, 13)),
    ],
    ink: `<path d="M85 128 V238 M145 128 V238 M205 128 V238"/><path d="M296 216 H318"/>`,
  },
  {
    id: 'trator',
    label: 'Trator',
    regions: [
      background('ceu'),
      region('sol', circle(330, 60, 30)),
      region('campo', rect(-10, 310, 420, 100)),
      region('escapamento', rect(300, 105, 16, 70, 4)),
      region('capo', rect(150, 170, 205, 85, 14)),
      region('cabine', rect(55, 85, 120, 170, 12)),
      region('janela', rect(75, 103, 80, 62, 8)),
      region('farol', circle(343, 194, 10)),
      region('roda-grande', circle(115, 250, 72)),
      region('calota-grande', circle(115, 250, 28)),
      region('roda-pequena', circle(312, 272, 42)),
      region('calota-pequena', circle(312, 272, 16)),
    ],
    ink: `<path d="M200 190 H300 M200 210 H300"/>`,
  },
  {
    id: 'onibus',
    label: 'Ônibus',
    regions: [
      background('ceu'),
      region('sol', circle(60, 60, 30)),
      region('estrada', rect(-10, 315, 420, 100)),
      region('corpo', rect(25, 105, 350, 180, 26)),
      region('faixa', rect(25, 215, 350, 26)),
      region('janela-1', rect(45, 128, 56, 62, 8)),
      region('janela-2', rect(113, 128, 56, 62, 8)),
      region('janela-3', rect(181, 128, 56, 62, 8)),
      region('janela-4', rect(249, 128, 56, 62, 8)),
      region('parabrisa', rect(318, 128, 42, 80, 10)),
      region('farol', circle(356, 262, 10)),
      region('roda-tras', circle(100, 285, 33)),
      region('calota-tras', circle(100, 285, 13)),
      region('roda-frente', circle(300, 285, 33)),
      region('calota-frente', circle(300, 285, 13)),
    ],
  },
  {
    id: 'aviao',
    label: 'Avião',
    regions: [
      background('ceu'),
      region(
        'nuvem-1',
        path('M60 120 Q60 95 85 98 Q95 72 125 80 Q145 65 165 85 Q190 85 188 108 Q190 128 165 128 L80 128 Q60 128 60 120 Z'),
      ),
      region(
        'nuvem-2',
        path(
          'M250 330 Q250 305 275 308 Q285 282 315 290 Q335 275 355 295 Q380 295 378 318 Q380 338 355 338 L270 338 Q250 338 250 330 Z',
        ),
      ),
      region('asa-longe', path('M200 182 L238 182 L222 128 L200 128 Z')),
      region('cauda', path('M62 182 L45 100 L98 100 L140 182 Z')),
      region('corpo', path('M40 210 Q40 178 90 178 L300 178 Q372 183 384 210 Q372 237 300 240 L90 240 Q40 240 40 210 Z')),
      region('asa', path('M175 212 L245 212 L195 318 L150 318 Z')),
      region(
        'janelas',
        dots([
          [150, 200, 10],
          [185, 200, 10],
          [220, 200, 10],
          [255, 200, 10],
        ]),
      ),
      region('cabine', path('M318 190 Q352 192 366 206 L318 206 Z')),
    ],
  },
  {
    id: 'foguete',
    label: 'Foguete',
    regions: [
      background('espaco'),
      region(
        'estrelas',
        dots([
          [60, 50, 7],
          [340, 90, 8],
          [90, 300, 6],
          [330, 330, 7],
          [40, 200, 5],
          [365, 220, 6],
          [280, 30, 5],
        ]),
      ),
      region('planeta', circle(80, 120, 36)),
      region('chama-fora', path('M162 250 Q200 378 238 250 Z')),
      region('chama-dentro', path('M180 250 Q200 328 220 250 Z')),
      region('aleta-esquerda', path('M150 195 L98 285 L152 262 Z')),
      region('aleta-direita', path('M250 195 L302 285 L248 262 Z')),
      region('corpo', path('M200 38 Q262 100 256 255 L144 255 Q138 100 200 38 Z')),
      region('bico', path('M200 38 Q234 70 247 112 L153 112 Q166 70 200 38 Z')),
      region('aleta-meio', rect(192, 212, 16, 62, 6)),
      region('janela-aro', circle(200, 168, 32)),
      region('janela-vidro', circle(200, 168, 20)),
    ],
  },
  {
    id: 'barco',
    label: 'Barco',
    regions: [
      background('ceu'),
      region('sol', circle(70, 70, 32)),
      region('vela-pequena', path('M216 90 L216 192 L150 192 Z')),
      region('vela-grande', path('M232 68 L232 192 L330 192 Z')),
      region('mastro', rect(216, 50, 14, 162, 4)),
      region('bandeira', path('M228 28 L264 40 L228 52 Z')),
      region('cabine', rect(150, 200, 120, 52, 8)),
      region(
        'janelas',
        dots([
          [180, 226, 10],
          [210, 226, 10],
          [240, 226, 10],
        ]),
      ),
      region('casco', path('M60 250 L340 250 L300 312 L100 312 Z')),
      region('mar', path('M-10 285 Q30 265 70 285 T150 285 T230 285 T310 285 T390 285 T470 285 L470 410 L-10 410 Z')),
    ],
  },
  {
    id: 'trem',
    label: 'Trem',
    regions: [
      background('ceu'),
      region(
        'fumaca',
        dots([
          [262, 92, 18],
          [290, 62, 24],
          [328, 36, 28],
        ]),
      ),
      region('chao', rect(-10, 300, 420, 110)),
      region('chamine', path('M240 172 L234 118 L276 118 L270 172 Z')),
      region('caldeira', rect(150, 165, 155, 88, 22)),
      region('cabine', rect(58, 118, 104, 135, 8)),
      region('teto', rect(48, 104, 124, 20, 8)),
      region('janela', rect(78, 136, 64, 50, 8)),
      region('limpa-trilhos', path('M300 255 L350 255 L300 212 Z')),
      region('farol', circle(312, 190, 11)),
      region('roda-1', circle(95, 270, 30)),
      region('calota-1', circle(95, 270, 12)),
      region('roda-2', circle(185, 270, 30)),
      region('calota-2', circle(185, 270, 12)),
      region('roda-3', circle(265, 270, 30)),
      region('calota-3', circle(265, 270, 12)),
    ],
    ink: `<path d="M-10 312 H410" stroke-width="7"/><path d="M30 312 V340 M110 312 V340 M190 312 V340 M270 312 V340 M350 312 V340"/>`,
  },
  {
    id: 'peixe',
    label: 'Peixe',
    regions: [
      background('agua'),
      region('areia', path('M-10 345 Q100 322 200 345 T410 345 L410 410 L-10 410 Z')),
      region('alga-1', path('M60 350 Q40 300 62 260 Q80 220 60 180 Q92 220 82 262 Q70 300 86 350 Z')),
      region('alga-2', path('M330 350 Q350 300 330 270 Q312 240 334 205 Q352 245 352 270 Q366 300 354 350 Z')),
      region(
        'bolhas',
        dots([
          [300, 92, 10],
          [322, 60, 14],
          [300, 26, 8],
        ]),
      ),
      region('rabo', path('M100 200 L35 135 L52 200 L35 265 Z')),
      region('barbatana-cima', path('M160 132 Q205 70 258 135 Z')),
      region('barbatana-baixo', path('M185 268 Q212 318 245 266 Z')),
      region('corpo', ellipse(205, 200, 125, 82)),
      region('listra-1', path('M160 130 Q142 200 160 272 L188 279 Q170 200 188 123 Z')),
      region('listra-2', path('M218 120 Q200 200 218 281 L246 278 Q228 200 246 123 Z')),
      region('olho', circle(282, 182, 19)),
    ],
    ink: `<circle class="ink-fill" cx="287" cy="182" r="8"/><path d="M298 228 Q310 236 322 226"/>`,
  },
  {
    id: 'dinossauro',
    label: 'Dinossauro',
    regions: [
      background('ceu'),
      region('sol', circle(70, 65, 30)),
      region('chao', rect(-10, 320, 420, 100)),
      region('tronco', rect(350, 230, 20, 95, 4)),
      region('copa', circle(360, 205, 38)),
      region('rabo', path('M130 235 Q70 250 22 305 Q95 285 150 272 Z')),
      region('pescoco', path('M270 215 L292 92 L328 96 L318 232 Z')),
      region('cabeca', ellipse(322, 88, 40, 26)),
      region('perna-tras', rect(140, 270, 36, 58, 10)),
      region('perna-frente', rect(250, 270, 36, 58, 10)),
      region('corpo', ellipse(215, 245, 108, 62)),
      region(
        'manchas',
        dots([
          [180, 228, 14],
          [222, 210, 11],
          [242, 252, 13],
          [190, 270, 9],
        ]),
      ),
    ],
    ink: `<circle class="ink-fill" cx="334" cy="80" r="5"/><path d="M330 99 Q344 105 356 96"/>`,
  },
  {
    id: 'casa',
    label: 'Casa',
    regions: [
      background('ceu'),
      region('sol', circle(335, 62, 32)),
      region(
        'nuvem',
        path('M45 100 Q45 78 68 80 Q76 58 102 64 Q120 50 138 68 Q160 68 158 88 Q160 106 138 106 L62 106 Q45 106 45 100 Z'),
      ),
      region('grama', rect(-10, 315, 420, 100)),
      region('caminho', path('M175 320 L215 320 L238 410 L152 410 Z')),
      region('tronco', rect(340, 235, 22, 85, 4)),
      region('copa', circle(351, 212, 40)),
      region('chamine', rect(250, 95, 32, 70, 3)),
      region('parede', rect(85, 170, 220, 150)),
      region('telhado', path('M65 178 L195 78 L325 178 Z')),
      region('porta', rect(170, 240, 50, 80, 6)),
      region('janela-1', rect(103, 200, 48, 44, 4)),
      region('janela-2', rect(240, 200, 48, 44, 4)),
    ],
    ink: `<path d="M127 200 V244 M103 222 H151 M264 200 V244 M240 222 H288"/><circle class="ink-fill" cx="210" cy="282" r="4"/>`,
  },
  {
    id: 'borboleta',
    label: 'Borboleta',
    regions: [
      background('ceu'),
      region('grama', rect(-10, 330, 420, 80)),
      region('flor-1', petals(70, 285)),
      region('miolo-1', circle(70, 285, 10)),
      region('flor-2', petals(330, 285)),
      region('miolo-2', circle(330, 285, 10)),
      region('asa-cima-esquerda', path('M195 190 Q120 82 72 128 Q48 190 195 205 Z')),
      region('asa-cima-direita', path('M205 190 Q280 82 328 128 Q352 190 205 205 Z')),
      region('asa-baixo-esquerda', path('M195 212 Q105 218 112 278 Q150 305 198 228 Z')),
      region('asa-baixo-direita', path('M205 212 Q295 218 288 278 Q250 305 202 228 Z')),
      region('pinta-1', circle(128, 150, 18)),
      region('pinta-2', circle(272, 150, 18)),
      region('pinta-3', circle(150, 256, 12)),
      region('pinta-4', circle(250, 256, 12)),
      region('corpo', ellipse(200, 212, 13, 58)),
      region('cabeca', circle(200, 146, 17)),
    ],
    ink: `<path d="M194 132 Q182 100 168 92 M206 132 Q218 100 232 92"/>
      <circle class="ink-fill" cx="168" cy="92" r="6"/><circle class="ink-fill" cx="232" cy="92" r="6"/>
      <circle class="ink-fill" cx="194" cy="143" r="3"/><circle class="ink-fill" cx="206" cy="143" r="3"/>
      <path d="M70 316 V338 M330 316 V338"/>`,
  },

  // ---------- desenhos com mais partes ----------

  {
    id: 'bombeiros',
    label: 'Caminhão de bombeiros',
    regions: [
      background('ceu'),
      region('sol', circle(345, 58, 30)),
      region('nuvem', cloud(30, 100, 0.9)),
      region('estrada', rect(-10, 318, 420, 100)),
      region('suporte', rect(188, 136, 42, 42, 4)),
      region('corpo', rect(30, 172, 240, 102, 10)),
      region('escada', rect(45, 114, 205, 26, 8)),
      region('sirene', path('M284 140 Q284 112 304 112 Q324 112 324 140 Z')),
      region('cabine', path('M268 138 L320 138 Q332 138 340 148 L380 205 L380 274 L268 274 Z')),
      region('janela', path('M284 154 L316 154 L352 205 L284 205 Z')),
      region('porta-1', rect(46, 188, 62, 54, 6)),
      region('porta-2', rect(120, 188, 62, 54, 6)),
      region('mangueira', circle(228, 214, 30)),
      region('mangueira-miolo', circle(228, 214, 11)),
      region('faixa', rect(30, 248, 240, 18)),
      region('parachoque', rect(364, 252, 26, 24, 6)),
      region('farol', circle(368, 224, 10)),
      region('roda-1', circle(88, 282, 34)),
      region('calota-1', circle(88, 282, 13)),
      region('roda-2', circle(205, 282, 34)),
      region('calota-2', circle(205, 282, 13)),
      region('roda-3', circle(325, 282, 34)),
      region('calota-3', circle(325, 282, 13)),
    ],
    ink: `<path d="M75 119 V135 M105 119 V135 M135 119 V135 M165 119 V135 M195 119 V135 M225 119 V135"/>
      <path d="M290 222 H312"/><path d="M20 368 H70 M130 368 H180 M240 368 H290 M350 368 H390"/>`,
  },
  {
    id: 'helicoptero',
    label: 'Helicóptero',
    regions: [
      background('ceu'),
      region('sol', circle(55, 55, 28)),
      region('nuvem-1', cloud(270, 80, 0.8)),
      region('nuvem-2', cloud(14, 280, 0.7)),
      region('colina', path('M-10 300 Q110 255 230 290 T410 280 L410 410 L-10 410 Z')),
      region('heliponto', ellipse(235, 345, 150, 36)),
      region('cauda', path('M165 186 L42 166 Q28 166 28 180 Q28 194 42 196 L165 228 Z')),
      region('aleta', path('M40 178 L26 124 Q26 114 36 116 L68 170 Z')),
      region('rotor-cauda', circle(40, 182, 18)),
      region('mastro', rect(218, 104, 34, 52, 6)),
      region('corpo', ellipse(240, 208, 100, 60)),
      region('janela', path('M268 160 Q326 164 336 206 L268 206 Z')),
      region('porta', rect(182, 172, 64, 82, 12)),
      region('janela-porta', rect(192, 182, 44, 32, 8)),
      region('esqui', rect(140, 298, 210, 16, 8)),
      region('helice', rect(85, 90, 300, 22, 11)),
      region('cubo', circle(235, 101, 15)),
    ],
    ink: `<path d="M200 264 L190 298 M290 264 L302 298" stroke-width="7"/>
      <path d="M40 168 V196 M26 182 H54"/>
      <path d="M215 328 V364 M255 328 V364 M215 346 H255"/>
      <path d="M120 60 Q130 50 140 60 Q150 50 160 60 M170 80 Q178 72 186 80 Q194 72 202 80"/>`,
  },
  {
    id: 'escavadeira',
    label: 'Escavadeira',
    regions: [
      background('ceu'),
      region('sol', circle(340, 58, 30)),
      region('nuvem', cloud(30, 100, 0.85)),
      region('chao', rect(-10, 322, 420, 100)),
      region('monte', path('M250 326 Q300 236 410 250 L410 330 Z')),
      region(
        'pedras',
        dots([
          [300, 305, 12],
          [385, 290, 12],
          [345, 312, 10],
        ]),
      ),
      region('escapamento', rect(176, 158, 20, 52, 4)),
      region('contrapeso', rect(26, 208, 44, 56, 14)),
      region('corpo', rect(50, 204, 175, 64, 10)),
      region('faixa', rect(50, 238, 175, 18)),
      region('cabine', rect(68, 128, 88, 82, 10)),
      region('janela', rect(84, 142, 56, 46, 6)),
      region('luz', path('M100 130 Q100 106 112 106 Q124 106 124 130 Z')),
      region('esteira', rect(36, 270, 210, 54, 27)),
      region(
        'rodinhas',
        dots([
          [66, 297, 15],
          [114, 297, 15],
          [162, 297, 15],
          [212, 297, 15],
        ]),
      ),
      region('braco', bar(200, 222, 292, 118, 32)),
      region('haste', bar(292, 118, 338, 222, 26)),
      region('pa', path('M316 216 L368 214 Q378 262 342 286 L320 272 Z')),
    ],
    ink: `<circle class="ink-fill" cx="292" cy="118" r="7"/><circle class="ink-fill" cx="338" cy="222" r="6"/>
      <circle class="ink-fill" cx="200" cy="222" r="6"/>`,
  },
  {
    id: 'submarino',
    label: 'Submarino',
    regions: [
      background('agua'),
      region('areia', path('M-10 352 Q90 330 190 350 T410 346 L410 410 L-10 410 Z')),
      region('alga-1', path('M14 362 Q0 330 16 306 Q30 284 18 262 Q44 286 38 308 Q30 332 42 362 Z')),
      region('alga-2', path('M350 362 Q370 318 352 288 Q336 258 356 226 Q374 262 374 288 Q388 318 376 362 Z')),
      region('pedra', ellipse(118, 360, 42, 22)),
      region('estrela', star(262, 368, 28, 13)),
      region(
        'bolhas',
        dots([
          [24, 135, 9],
          [42, 108, 12],
          [24, 80, 8],
        ]),
      ),
      region('agua-viva', path('M296 104 Q296 56 338 56 Q380 56 380 104 Q359 96 338 104 Q317 96 296 104 Z')),
      region('peixe-1-rabo', path('M140 88 L166 70 L166 106 Z')),
      region('peixe-1', ellipse(112, 88, 32, 20)),
      region('peixe-2-rabo', path('M300 302 L326 284 L326 320 Z')),
      region('peixe-2', ellipse(272, 302, 32, 20)),
      region('periscopio', path('M206 118 V66 Q206 58 214 58 H252 V82 H228 V118 Z')),
      region('torre', rect(168, 112, 76, 50, 12)),
      region('leme', path('M92 188 L50 154 Q42 152 42 162 L42 258 Q42 268 50 266 L92 232 Z')),
      region('helice', ellipse(40, 210, 14, 32)),
      region('corpo', ellipse(205, 210, 128, 62)),
      region('janela-1', circle(150, 206, 20)),
      region('janela-2', circle(205, 206, 20)),
      region('janela-3', circle(260, 206, 20)),
    ],
    ink: `<path d="M308 108 Q302 122 310 134 M328 108 Q322 126 330 142 M348 108 Q342 126 350 142 M368 108 Q362 122 370 134"/>
      <circle class="ink-fill" cx="98" cy="84" r="5"/><circle class="ink-fill" cx="258" cy="298" r="5"/>`,
  },
  {
    id: 'balao',
    label: 'Balão',
    regions: [
      background('ceu'),
      region('sol', circle(58, 60, 30)),
      region('nuvem-1', cloud(292, 98, 0.75)),
      region('nuvem-2', cloud(8, 214, 0.7)),
      region('balao-pequeno', circle(350, 178, 22)),
      region('montanha-1', path('M-10 345 L90 238 L190 345 Z')),
      region('montanha-2', path('M150 345 L292 222 L420 345 Z')),
      region('grama', path('M-10 338 Q100 318 200 338 T410 334 L410 410 L-10 410 Z')),
      region('flor-1', petals(56, 372)),
      region('miolo-1', circle(56, 372, 10)),
      region('flor-2', petals(344, 374)),
      region('miolo-2', circle(344, 374, 10)),
      ...BALLOON_LINES.slice(0, -1).map((a, i) => region(`gomo-${i + 1}`, gore(a, BALLOON_LINES[i + 1]))),
      region('cinta', rect(160, 243, 80, 18, 6)),
      region('cesto', rect(170, 284, 60, 42, 8)),
    ],
    ink: `<path d="M170 261 L180 284 M230 261 L220 284 M200 261 V284"/><path d="M172 304 H228"/>
      <path d="M340 198 L345 210 M360 198 L355 210"/><rect class="ink-fill" x="342" y="208" width="16" height="12" rx="3"/>
      <path d="M118 120 Q128 110 138 120 Q148 110 158 120 M50 140 Q58 132 66 140 Q74 132 82 140"/>`,
  },
  {
    id: 'arco-iris',
    label: 'Arco-íris',
    regions: [
      background('ceu'),
      region('sol', circle(350, 52, 30)),
      region('nuvem-1', cloud(30, 78, 0.6)),
      ...RAINBOW.slice(0, -1).map((R, i) => region(`arco-${i + 1}`, arcBand(200, 300, R, RAINBOW[i + 1]))),
      region('grama', path('M-10 332 Q100 312 200 332 T410 328 L410 410 L-10 410 Z')),
      region('nuvem-2', cloud(-8, 322, 1.2)),
      region('nuvem-3', cloud(252, 322, 1.2)),
      region('flor-1', petals(70, 370)),
      region('miolo-1', circle(70, 370, 10)),
      region('flor-2', petals(200, 368)),
      region('miolo-2', circle(200, 368, 10)),
      region('flor-3', petals(330, 370)),
      region('miolo-3', circle(330, 370, 10)),
    ],
    ink: `<path d="M150 50 Q160 40 170 50 Q180 40 190 50 M220 72 Q228 64 236 72 Q244 64 252 72"/>`,
  },
  {
    id: 'castelo',
    label: 'Castelo',
    regions: [
      background('ceu'),
      region('sol', circle(282, 42, 24)),
      region('nuvem', cloud(6, 50, 0.5)),
      region('grama', rect(-10, 328, 420, 100)),
      region('caminho', path('M176 330 L224 330 L252 410 L148 410 Z')),
      region('bandeira-meio', path('M202 12 Q219 6 236 14 L236 38 Q219 30 202 38 Z')),
      region('torre-meio', rect(158, 120, 84, 110)),
      region('telhado-meio', path('M148 122 L200 46 L252 122 Z')),
      region('janela-meio', circle(200, 166, 18)),
      region('muro', battlement(106, 294, 200, 20, 330, 9)),
      region('porta', path('M172 330 V280 Q172 248 200 248 Q228 248 228 280 V330 Z')),
      region('bandeira-1', path('M75 52 Q92 46 109 54 L109 78 Q92 70 75 78 Z')),
      region('bandeira-2', path('M329 52 Q346 46 363 54 L363 78 Q346 70 329 78 Z')),
      region('torre-1', rect(40, 170, 66, 160)),
      region('torre-2', rect(294, 170, 66, 160)),
      region('telhado-1', path('M30 172 L73 96 L116 172 Z')),
      region('telhado-2', path('M284 172 L327 96 L370 172 Z')),
      region('janela-1', path('M60 236 V213 Q60 200 73 200 Q86 200 86 213 V236 Z')),
      region('janela-2', path('M60 298 V275 Q60 262 73 262 Q86 262 86 275 V298 Z')),
      region('janela-3', path('M314 236 V213 Q314 200 327 200 Q340 200 340 213 V236 Z')),
      region('janela-4', path('M314 298 V275 Q314 262 327 262 Q340 262 340 275 V298 Z')),
      region('arbusto-1', cloud(-8, 334, 0.62)),
      region('arbusto-2', cloud(327, 334, 0.62)),
    ],
    ink: `<path d="M73 96 V50 M327 96 V50 M200 46 V8"/><path d="M200 248 V330"/>`,
  },
  {
    id: 'cachorro',
    label: 'Cachorro',
    regions: [
      background('ceu'),
      region('sol', circle(60, 56, 30)),
      region('nuvem', cloud(150, 70, 0.7)),
      region('grama', rect(-10, 318, 420, 100)),
      region('casinha', rect(258, 190, 118, 130, 4)),
      region('telhado', path('M242 198 L317 128 L392 198 Z')),
      region('porta', path('M290 320 V268 Q290 242 317 242 Q344 242 344 268 V320 Z')),
      region('rabo', tube([206, 292], [248, 296], [266, 262], [260, 222], 24, 16)),
      region('corpo', ellipse(150, 270, 74, 62)),
      region('peito', ellipse(150, 282, 40, 44)),
      region('pata-1', ellipse(116, 328, 28, 17)),
      region('pata-2', ellipse(184, 328, 28, 17)),
      region('cabeca', ellipse(150, 140, 62, 54)),
      region('orelha-1', path('M100 108 Q62 106 60 160 Q60 198 88 198 Q106 192 108 150 Z')),
      region('orelha-2', path('M200 108 Q238 106 240 160 Q240 198 212 198 Q194 192 192 150 Z')),
      region('focinho', ellipse(150, 166, 34, 24)),
      region('coleira', rect(106, 196, 88, 24, 12)),
      region('medalha', circle(150, 232, 13)),
      region('bola', circle(46, 326, 24)),
      region('osso', bone(330, 358, 30, 10)),
    ],
    ink: `<circle class="ink-fill" cx="128" cy="128" r="7"/><circle class="ink-fill" cx="172" cy="128" r="7"/>
      <ellipse class="ink-fill" cx="150" cy="155" rx="12" ry="8"/><path d="M150 162 V172 M138 174 Q150 182 162 174"/>
      <path d="M26 314 Q46 330 68 314"/><path d="M106 338 V345 M126 338 V345 M174 338 V345 M194 338 V345"/>`,
  },
  {
    id: 'leao',
    label: 'Leão',
    regions: [
      background('ceu'),
      region('sol', circle(350, 52, 28)),
      region('nuvem', cloud(150, 56, 0.55)),
      region('chao', rect(-10, 316, 420, 100)),
      region('tronco', path('M60 318 L64 206 L40 166 L52 160 L70 192 L90 158 L102 164 L82 208 L84 318 Z')),
      region('copa', path('M8 156 Q16 112 70 116 Q124 106 134 148 Q104 166 72 158 Q32 168 8 156 Z')),
      region('arbusto', cloud(92, 322, 0.6)),
      region('rabo', tube([290, 300], [345, 312], [352, 280], [350, 252], 18, 12)),
      region('tufo', circle(350, 240, 16)),
      region('corpo', ellipse(235, 274, 72, 56)),
      region('peito', ellipse(232, 288, 36, 34)),
      region('pata-1', ellipse(198, 326, 25, 15)),
      region('pata-2', ellipse(268, 326, 25, 15)),
      region('juba-fora', dots(MANE)),
      region('juba-dentro', circle(230, 160, 74)),
      region('orelha-1', circle(186, 112, 18)),
      region('orelha-2', circle(274, 112, 18)),
      region('cabeca', circle(230, 166, 56)),
      region(
        'focinho',
        dots([
          [214, 190, 18],
          [246, 190, 18],
        ]),
      ),
    ],
    ink: `<circle class="ink-fill" cx="210" cy="152" r="6"/><circle class="ink-fill" cx="250" cy="152" r="6"/>
      <path class="ink-fill" d="M218 172 Q230 166 242 172 Q238 184 230 185 Q222 184 218 172 Z"/>
      <path d="M222 206 Q230 212 238 206"/>
      <circle class="ink-fill" cx="206" cy="192" r="2.5"/><circle class="ink-fill" cx="214" cy="200" r="2.5"/>
      <circle class="ink-fill" cx="254" cy="192" r="2.5"/><circle class="ink-fill" cx="246" cy="200" r="2.5"/>`,
  },
  {
    id: 'polvo',
    label: 'Polvo',
    regions: [
      background('agua'),
      region(
        'bolhas',
        dots([
          [40, 120, 10],
          [58, 90, 13],
          [42, 58, 9],
        ]),
      ),
      region('peixe-rabo', path('M352 84 L378 66 L378 102 Z')),
      region('peixe', ellipse(326, 84, 30, 19)),
      region('areia', path('M-10 348 Q100 328 200 348 T410 344 L410 410 L-10 410 Z')),
      region('alga', path('M370 352 Q352 304 372 266 Q388 228 372 190 Q402 228 394 268 Q382 306 396 352 Z')),
      region('pedra', ellipse(66, 352, 46, 24)),
      region('concha', path('M140 388 L112 360 Q108 342 124 344 Q130 332 140 336 Q150 332 156 344 Q172 342 168 360 Z')),
      region('estrela', star(300, 372, 26, 12)),
      region('tentaculo-1', tube([150, 200], [100, 240], [40, 250], [58, 300], 34, 16)),
      region('tentaculo-6', tube([250, 200], [300, 240], [360, 250], [342, 300], 34, 16)),
      region('tentaculo-2', tube([168, 208], [150, 262], [104, 296], [128, 330], 34, 16)),
      region('tentaculo-5', tube([232, 208], [250, 262], [296, 296], [272, 330], 34, 16)),
      region('tentaculo-3', tube([188, 212], [190, 270], [164, 318], [186, 344], 34, 16)),
      region('tentaculo-4', tube([212, 212], [210, 270], [236, 318], [214, 344], 34, 16)),
      region('cabeca', ellipse(200, 140, 90, 82)),
      region('olho-1', circle(168, 140, 22)),
      region('olho-2', circle(232, 140, 22)),
      region(
        'bochechas',
        dots([
          [140, 182, 13],
          [260, 182, 13],
        ]),
      ),
    ],
    ink: `<circle class="ink-fill" cx="172" cy="144" r="9"/><circle class="ink-fill" cx="236" cy="144" r="9"/>
      <path d="M184 190 Q200 204 216 190"/><circle class="ink-fill" cx="312" cy="80" r="4"/>
      <path d="M140 340 V380 M126 350 L136 380 M154 350 L144 380"/>`,
  },
  {
    id: 'robo',
    label: 'Robô',
    regions: [
      background('ceu'),
      region('sol', circle(345, 58, 30)),
      region('nuvem', cloud(24, 90, 0.75)),
      region('chao', rect(-10, 350, 420, 70)),
      region('antena', circle(200, 34, 15)),
      region('perna-1', rect(148, 306, 36, 44)),
      region('perna-2', rect(216, 306, 36, 44)),
      region('pe-1', rect(130, 340, 64, 28, 12)),
      region('pe-2', rect(206, 340, 64, 28, 12)),
      region('braco-1', bar(124, 222, 82, 290, 28)),
      region('mao-1', circle(76, 300, 21)),
      region('braco-2', bar(276, 222, 324, 160, 28)),
      region('mao-2', circle(332, 148, 21)),
      region('pescoco', rect(178, 164, 44, 36, 6)),
      region('orelha-1', rect(112, 96, 32, 52, 10)),
      region('orelha-2', rect(256, 96, 32, 52, 10)),
      region('cabeca', rect(134, 70, 132, 100, 22)),
      region('olho-1', circle(172, 110, 20)),
      region('olho-2', circle(228, 110, 20)),
      region('boca', rect(162, 138, 76, 24, 8)),
      region('corpo', rect(118, 196, 164, 116, 18)),
      region('painel', rect(138, 214, 76, 56, 8)),
      region('botao-1', circle(250, 230, 14)),
      region('botao-2', circle(250, 266, 14)),
      region(
        'luzes',
        dots([
          [160, 292, 11],
          [200, 292, 11],
          [240, 292, 11],
        ]),
      ),
    ],
    ink: `<path d="M200 49 V70" stroke-width="7"/>
      <circle class="ink-fill" cx="176" cy="112" r="8"/><circle class="ink-fill" cx="232" cy="112" r="8"/>
      <path d="M181 138 V162 M200 138 V162 M219 138 V162"/>
      <path d="M176 258 Q152 242 162 230 Q171 222 176 234 Q181 222 190 230 Q200 242 176 258 Z"/>`,
  },
  {
    id: 'bolo',
    label: 'Bolo de aniversário',
    regions: [
      background('parede'),
      region('bandeirinha-1', bunting(40)),
      region('bandeirinha-2', bunting(118)),
      region('bandeirinha-3', bunting(282)),
      region('bandeirinha-4', bunting(360)),
      region('balao-1', ellipse(48, 178, 30, 38)),
      region('balao-2', ellipse(352, 178, 30, 38)),
      region('mesa', rect(-10, 336, 420, 100)),
      region('prato', ellipse(200, 338, 148, 22)),
      region('bolo-baixo', rect(78, 246, 244, 92, 14)),
      region('cobertura-baixo', frosting(78, 322, 246, 268, 12, 8)),
      region(
        'confeitos',
        dots([
          [108, 312, 11],
          [154, 316, 11],
          [200, 312, 11],
          [246, 316, 11],
          [292, 312, 11],
        ]),
      ),
      region('bolo-cima', rect(112, 172, 176, 78, 14)),
      region('cobertura-cima', frosting(112, 288, 172, 194, 11, 6)),
      region('vela-1', rect(140, 122, 22, 52, 5)),
      region('vela-2', rect(189, 122, 22, 52, 5)),
      region('vela-3', rect(238, 122, 22, 52, 5)),
      region('chamas', path(`${flame(151, 116)} ${flame(200, 116)} ${flame(249, 116)}`)),
      region('presente', rect(8, 300, 62, 52, 6)),
      region(
        'laco',
        dots([
          [26, 292, 13],
          [52, 292, 13],
        ]),
      ),
      region('chapeu', path('M328 354 L356 284 L384 354 Z')),
      region('pompom', circle(356, 280, 12)),
    ],
    ink: `<path d="M-10 18 Q200 122 410 18"/><path d="M48 216 Q40 250 50 290 M352 216 Q362 240 354 262"/>
      <path d="M39 300 V352"/>`,
  },

  // ---------- veículos pedidos pelo Gustavo ----------

  {
    id: 'bombeiros-escada',
    label: 'Caminhão de bombeiro salvando o gatinho',
    regions: [
      background('ceu'),
      region('sol', circle(345, 52, 28)),
      region('nuvem', cloud(220, 70, 0.7)),
      region('estrada', rect(-10, 318, 420, 100)),
      region('tronco', rect(64, 180, 30, 140, 4)),
      region('copa', circle(80, 140, 62)),
      region('gato', ellipse(68, 70, 24, 16)),
      region(
        'gato-cabeca',
        path('M86 56 Q86 46 91 41 L91 27 L102 37 Q106 36 110 37 L120 27 L120 41 Q125 46 125 56 Q125 71 105.5 71 Q86 71 86 56 Z'),
      ),
      region('escada', bar(252, 192, 156, 100, 26)),
      region('cesto', path('M124 86 L166 86 L161 116 L129 116 Z')),
      region('corpo', rect(150, 200, 160, 78, 10)),
      region('base', rect(224, 182, 60, 24, 6)),
      region('porta-1', rect(166, 214, 54, 38, 6)),
      region('porta-2', rect(234, 214, 54, 38, 6)),
      region('sirene', path('M318 164 Q318 140 336 140 Q354 140 354 164 Z')),
      region('cabine', path('M308 162 L350 162 Q362 162 368 172 L392 214 L392 278 L308 278 Z')),
      region('janela', path('M322 176 L348 176 L374 214 L322 214 Z')),
      region('farol', circle(378, 238, 10)),
      region('parachoque', rect(374, 256, 24, 22, 6)),
      region('roda-1', circle(200, 286, 32)),
      region('calota-1', circle(200, 286, 12)),
      region('roda-2', circle(340, 286, 32)),
      region('calota-2', circle(340, 286, 12)),
    ],
    ink: `${rungs(252, 192, 156, 100, 8, 0.28, 0.8, 6)}
      <circle class="ink-fill" cx="99" cy="54" r="3.5"/><circle class="ink-fill" cx="112" cy="54" r="3.5"/>
      <path d="M102 62 Q105.5 66 109 62"/><path d="M46 72 Q30 66 36 50"/>
      <path d="M326 232 H346"/><path d="M20 368 H70 M130 368 H180 M240 368 H290 M350 368 H390"/>`,
  },
  {
    id: 'patrola',
    label: 'Patrola',
    regions: [
      background('ceu'),
      region('sol', circle(60, 56, 28)),
      region('nuvem', cloud(250, 90, 0.75)),
      region('chao', rect(-10, 318, 420, 100)),
      region('escapamento', rect(38, 148, 20, 52, 4)),
      region('motor', rect(20, 192, 96, 74, 10)),
      region('grade', rect(32, 206, 44, 40, 6)),
      region('cabine', rect(104, 112, 84, 150, 10)),
      region('janela', rect(118, 126, 56, 56, 6)),
      region('luz', path('M134 114 Q134 92 146 92 Q158 92 158 114 Z')),
      region('chassi', path('M176 180 L340 180 Q362 180 362 202 L362 270 L336 270 L336 214 L176 214 Z')),
      region('parachoque', rect(352, 162, 38, 60, 8)),
      region('farol', circle(371, 182, 10)),
      region('lamina', path('M206 302 Q196 274 214 250 L300 250 Q284 276 296 302 Z')),
      region('roda-1', circle(56, 288, 30)),
      region('calota-1', circle(56, 288, 11)),
      region('roda-2', circle(124, 288, 30)),
      region('calota-2', circle(124, 288, 11)),
      region('roda-3', circle(349, 288, 30)),
      region('calota-3', circle(349, 288, 11)),
    ],
    ink: `<path d="M226 214 L232 250 M280 214 L274 250"/><path d="M40 214 H68 M40 226 H68 M40 238 H68"/>
      <path d="M20 368 H70 M130 368 H180 M240 368 H290 M350 368 H390"/>`,
  },
  {
    id: 'policia',
    label: 'Carro de polícia',
    regions: [
      background('ceu'),
      region('sol', circle(362, 40, 24)),
      region('nuvem', cloud(212, 100, 0.55)),
      region('predio-1', rect(10, 100, 86, 230)),
      region('predio-2', rect(104, 60, 96, 270)),
      region('predio-3', rect(208, 124, 84, 206)),
      region('predio-4', rect(300, 88, 90, 242)),
      region('estrada', rect(-10, 318, 420, 100)),
      region('cabine', path('M112 196 Q128 136 196 132 L250 132 Q290 136 308 196 Z')),
      region('janela-1', path('M136 192 Q148 152 194 150 L204 150 L204 192 Z')),
      region('janela-2', path('M220 150 L248 150 Q278 154 290 192 L220 192 Z')),
      region('luz-1', path('M180 116 Q180 92 200 92 L212 92 L212 116 Z')),
      region('luz-2', path('M212 116 L212 92 L224 92 Q244 92 244 116 Z')),
      region('base', rect(172, 114, 80, 20, 6)),
      region('corpo', rect(40, 188, 320, 86, 36)),
      region('faixa', rect(40, 224, 320, 20)),
      region('estrela', star(212, 234, 24, 11)),
      region('farol', circle(344, 210, 11)),
      region('roda-1', circle(110, 278, 36)),
      region('calota-1', circle(110, 278, 15)),
      region('roda-2', circle(290, 278, 36)),
      region('calota-2', circle(290, 278, 15)),
    ],
    ink: `${windowGrid(22, 116, 2, 2, 24, 24, 12, 12)}${windowGrid(118, 72, 2, 2, 24, 22, 14, 10)}
      ${windowGrid(316, 104, 2, 2, 24, 24, 12, 12)}
      <path d="M20 368 H70 M130 368 H180 M240 368 H290 M350 368 H390"/>`,
  },
  {
    id: 'betoneira',
    label: 'Betoneira',
    regions: [
      background('ceu'),
      region('sol', circle(345, 60, 28)),
      region('nuvem', cloud(160, 82, 0.65)),
      region('estrada', rect(-10, 316, 420, 100)),
      region('calha', bar(56, 160, 18, 214, 22)),
      region('funil', path('M22 92 L82 92 L64 132 L42 132 Z')),
      region('suporte', rect(66, 170, 32, 72, 4)),
      region('chassi', rect(30, 234, 278, 32, 6)),
      ...DRUM_CUTS.slice(0, -1).map((s, i) => region(`tambor-${i + 1}`, drumBand(175, 168, 125, 64, 14, s, DRUM_CUTS[i + 1]))),
      region('cabine', path('M300 150 L346 150 Q358 150 364 160 L390 210 L390 278 L300 278 Z')),
      region('janela', path('M314 164 L344 164 L370 210 L314 210 Z')),
      region('farol', circle(378, 234, 10)),
      region('parachoque', rect(372, 256, 24, 22, 6)),
      region('roda-1', circle(80, 284, 32)),
      region('calota-1', circle(80, 284, 12)),
      region('roda-2', circle(160, 284, 32)),
      region('calota-2', circle(160, 284, 12)),
      region('roda-3', circle(330, 284, 32)),
      region('calota-3', circle(330, 284, 12)),
    ],
    ink: `<path d="M318 226 H340"/><path d="M20 366 H70 M130 366 H180 M240 366 H290 M350 366 H390"/>`,
  },
  {
    id: 'ambulancia',
    label: 'Ambulância',
    regions: [
      background('ceu'),
      region('sol', circle(60, 56, 28)),
      region('nuvem-1', cloud(250, 76, 0.7)),
      region('nuvem-2', cloud(120, 64, 0.5)),
      region('estrada', rect(-10, 316, 420, 100)),
      region('luz-1', path('M40 122 Q40 98 60 98 Q80 98 80 122 Z')),
      region('luz-2', path('M222 122 Q222 98 242 98 Q262 98 262 122 Z')),
      region('corpo', rect(24, 120, 252, 160, 14)),
      region('cabine', path('M272 152 L330 152 Q342 152 350 162 L386 212 L386 280 L272 280 Z')),
      region('janela-cabine', path('M286 166 L326 166 L362 214 L286 214 Z')),
      region('janela-tras', rect(40, 140, 56, 44, 8)),
      region('cruz', path('M158 140 H186 V164 H210 V192 H186 V216 H158 V192 H134 V164 H158 Z')),
      region('faixa', rect(24, 234, 362, 20)),
      region('lanterna', rect(24, 196, 16, 26, 5)),
      region('farol', circle(372, 226, 11)),
      region('parachoque', rect(372, 254, 24, 24, 6)),
      region('roda-1', circle(92, 282, 34)),
      region('calota-1', circle(92, 282, 14)),
      region('roda-2', circle(322, 282, 34)),
      region('calota-2', circle(322, 282, 14)),
    ],
    ink: `<path d="M298 224 H318"/><path d="M20 366 H70 M130 366 H180 M240 366 H290 M350 366 H390"/>`,
  },
  {
    id: 'moto',
    label: 'Moto',
    regions: [
      background('ceu'),
      region('sol', circle(340, 60, 30)),
      region('nuvem', cloud(30, 90, 0.8)),
      region('colina', path('M-10 270 Q100 220 210 260 T410 250 L410 330 L-10 330 Z')),
      region('estrada', rect(-10, 320, 420, 100)),
      region('roda-1', circle(100, 268, 52)),
      region('aro-1', circle(100, 268, 28)),
      region('roda-2', circle(306, 268, 52)),
      region('aro-2', circle(306, 268, 28)),
      region('para-lama-1', ringArc(100, 268, 76, 56, 190, 300)),
      region('para-lama-2', ringArc(306, 268, 76, 56, 220, 320)),
      region('quadro', bar(100, 268, 180, 240, 20)),
      region('motor', rect(162, 196, 92, 64, 12)),
      region('escapamento', bar(244, 262, 138, 290, 18)),
      region('banco', path('M86 186 Q86 168 112 168 L194 170 Q204 182 196 194 L100 198 Q86 198 86 186 Z')),
      region('lanterna', circle(78, 190, 11)),
      region('tanque', path('M184 178 Q196 146 248 150 Q276 154 272 182 Q240 196 190 194 Z')),
      region('garfo', bar(306, 268, 276, 160, 22)),
      region('guidao', bar(270, 150, 236, 120, 18)),
      region('farol', path('M290 148 Q326 148 326 174 Q326 200 290 200 Z')),
    ],
    ink: `<path d="M20 370 H70 M130 370 H180 M240 370 H290 M350 370 H390"/>
      <circle class="ink-fill" cx="100" cy="268" r="6"/><circle class="ink-fill" cx="306" cy="268" r="6"/>`,
  },
  {
    id: 'guindaste',
    label: 'Guindaste',
    regions: [
      background('ceu'),
      region('sol', circle(50, 50, 28)),
      region('nuvem', cloud(150, 92, 0.7)),
      region('chao', rect(-10, 318, 420, 100)),
      region('patolas', path('M92 262 H118 V306 H128 V322 H82 V306 H92 Z M252 262 H278 V306 H288 V322 H242 V306 H252 Z')),
      region('corpo', rect(68, 226, 220, 46, 8)),
      region('cabine', path('M74 194 L38 194 Q28 194 24 204 L10 236 L10 272 L74 272 Z')),
      region('janela', path('M62 206 L40 206 L26 236 L62 236 Z')),
      region('farol', circle(22, 254, 10)),
      region('lanca-1', bar(226, 204, 296, 140, 30)),
      region('lanca-2', bar(288, 146, 352, 86, 22)),
      region('base', rect(150, 204, 104, 24, 6)),
      region('cabine-guindaste', rect(158, 150, 60, 56, 8)),
      region('janela-guindaste', rect(170, 162, 36, 28, 5)),
      region('gancho', rect(340, 164, 24, 28, 5)),
      region('caixa', rect(306, 214, 90, 56, 6)),
      region('roda-1', circle(48, 288, 30)),
      region('calota-1', circle(48, 288, 11)),
      region('roda-2', circle(190, 288, 30)),
      region('calota-2', circle(190, 288, 11)),
    ],
    ink: `<path d="M352 86 V164"/><path d="M352 192 V200 M352 200 L314 214 M352 200 L388 214"/>
      <path d="M336 214 V270 M366 214 V270"/>`,
  },
  {
    id: 'trator-carreta',
    label: 'Trator com carreta',
    regions: [
      background('ceu'),
      region('sol', circle(60, 54, 28)),
      region('nuvem-1', cloud(150, 84, 0.7)),
      region('nuvem-2', cloud(300, 70, 0.6)),
      region('campo', rect(-10, 312, 420, 100)),
      region('abobora-1', ellipse(56, 186, 30, 24)),
      region('abobora-3', ellipse(172, 188, 28, 22)),
      region('abobora-2', ellipse(116, 178, 32, 26)),
      region('cacamba', rect(18, 200, 196, 64, 8)),
      region('roda-carreta', circle(112, 282, 30)),
      region('calota-carreta', circle(112, 282, 12)),
      region('escapamento', rect(342, 144, 20, 58, 4)),
      region('capo', rect(296, 196, 90, 58, 12)),
      region('cabine', rect(236, 128, 74, 118, 10)),
      region('janela', rect(250, 142, 46, 52, 6)),
      region('teto', rect(228, 116, 90, 20, 6)),
      region('farol', circle(372, 218, 10)),
      region('roda-grande', circle(272, 268, 48)),
      region('calota-grande', circle(272, 268, 20)),
      region('roda-pequena', circle(364, 286, 28)),
      region('calota-pequena', circle(364, 286, 10)),
    ],
    ink: `<path d="M56 162 Q58 152 66 150 M116 152 Q118 142 126 140 M172 166 Q174 156 182 154"/>
      <path d="M214 250 H236" stroke-width="8"/><path d="M316 214 H366 M316 232 H366"/>`,
  },
  {
    id: 'caminhonete',
    label: 'Caminhonete com caçamba',
    regions: [
      background('ceu'),
      region('sol', circle(50, 50, 26)),
      region('nuvem', cloud(170, 80, 0.7)),
      region('tronco', rect(348, 120, 22, 90, 4)),
      region('copa', circle(359, 110, 36)),
      region('estrada', rect(-10, 316, 420, 100)),
      region('caixa-1', rect(38, 138, 58, 54, 4)),
      region('caixa-2', rect(100, 150, 52, 42, 4)),
      region('cabine', path('M166 200 L178 140 Q181 128 194 128 L262 128 Q276 128 284 138 L318 200 Z')),
      region('janela-1', path('M190 194 L198 148 Q199 144 204 144 L228 144 L228 194 Z')),
      region('janela-2', path('M242 144 L264 144 Q270 144 274 150 L298 194 L242 194 Z')),
      region('corpo', path('M160 196 L304 196 L364 204 Q378 206 378 220 L378 262 Q378 274 366 274 L160 274 Z')),
      region('cacamba', rect(24, 186, 150, 88, 10)),
      region('farol', circle(366, 222, 10)),
      region('lanterna', rect(24, 200, 16, 26, 5)),
      region('parachoque', rect(370, 254, 24, 22, 6)),
      region('roda-1', circle(88, 280, 36)),
      region('calota-1', circle(88, 280, 15)),
      region('roda-2', circle(300, 280, 36)),
      region('calota-2', circle(300, 280, 15)),
    ],
    ink: `<path d="M38 156 H96 M67 138 V156"/><path d="M234 200 V262 M246 212 H266"/>
      <path d="M20 366 H70 M130 366 H180 M240 366 H290 M350 366 H390"/>`,
  },
  {
    id: 'lixo',
    label: 'Caminhão de lixo',
    regions: [
      background('ceu'),
      region('sol', circle(345, 52, 28)),
      region('nuvem-1', cloud(30, 86, 0.75)),
      region('nuvem-2', cloud(180, 70, 0.55)),
      region('estrada', rect(-10, 316, 420, 100)),
      region('lixeira', rect(10, 246, 44, 70, 6)),
      region('tampa', rect(6, 232, 52, 18, 6)),
      region('cacamba', rect(108, 130, 186, 140, 14)),
      region('traseira', path('M112 134 L80 150 Q70 156 70 170 L70 264 Q70 272 78 272 L112 272 Z')),
      region('boca', path('M76 214 L106 214 L106 252 L76 252 Z')),
      region('faixa', rect(108, 228, 186, 18)),
      region('triangulo', path('M201 150 L237 208 L165 208 Z')),
      region('luz', path('M308 168 Q308 146 324 146 Q340 146 340 168 Z')),
      region('cabine', path('M290 166 L336 166 Q348 166 354 176 L390 222 L390 272 L290 272 Z')),
      region('janela', path('M304 180 L334 180 L366 222 L304 222 Z')),
      region('farol', circle(378, 240, 10)),
      region('parachoque', rect(376, 254, 22, 22, 6)),
      region('roda-1', circle(144, 284, 32)),
      region('calota-1', circle(144, 284, 12)),
      region('roda-2', circle(334, 284, 32)),
      region('calota-2', circle(334, 284, 12)),
    ],
    ink: `<path d="M201 170 L221 202 L181 202 Z"/><path d="M22 260 V300 M42 260 V300"/>
      <path d="M20 366 H70 M130 366 H180 M240 366 H290 M350 366 H390"/>`,
  },
];
