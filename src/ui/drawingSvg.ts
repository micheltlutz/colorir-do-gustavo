// Monta o SVG de um desenho (na galeria e na tela de pintura).

import type { Drawing } from '../paint/drawings.ts';
import { colorOf, type Fills } from '../paint/state.ts';

const NS = 'http://www.w3.org/2000/svg';

export interface DrawingView {
  svg: SVGSVGElement;
  regions: Map<string, SVGElement>;
  /** Camada para os respingos de tinta. */
  splashes: SVGGElement;
}

export function renderDrawing(drawing: Drawing, fills: Fills): DrawingView {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 400 400');
  svg.setAttribute('class', 'drawing');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', drawing.label);

  const group = document.createElementNS(NS, 'g');
  group.setAttribute('class', 'regions');
  const regions = new Map<string, SVGElement>();
  for (const r of drawing.regions) {
    const el = document.createElementNS(NS, r.shape.tag);
    for (const [k, v] of Object.entries(r.shape.attrs)) el.setAttribute(k, String(v));
    el.setAttribute('class', r.background ? 'region background' : 'region');
    el.dataset.region = r.id;
    el.setAttribute('fill', colorOf(fills, r.id));
    group.appendChild(el);
    regions.set(r.id, el);
  }

  const ink = document.createElementNS(NS, 'g');
  ink.setAttribute('class', 'ink');
  ink.innerHTML = drawing.ink ?? '';

  const splashes = document.createElementNS(NS, 'g');
  splashes.setAttribute('class', 'splashes');

  svg.append(group, ink, splashes);
  return { svg, regions, splashes };
}

/** Atualiza as cores de um desenho já montado. */
export function applyFills(view: DrawingView, fills: Fills): void {
  for (const [id, el] of view.regions) el.setAttribute('fill', colorOf(fills, id));
}
