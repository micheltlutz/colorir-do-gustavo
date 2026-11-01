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
];
