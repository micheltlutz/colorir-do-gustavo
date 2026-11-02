// As duas telas: a galeria de desenhos e a tela de pintura.

import { sfx } from '../audio/sfx.ts';
import { DRAWINGS, type Drawing } from '../paint/drawings.ts';
import { BRIGHT_COLORS, DEFAULT_SWATCH, PALETTE, type Swatch } from '../paint/palette.ts';
import { clearAll, initialState, isComplete, paint, undo, type PaintState } from '../paint/state.ts';
import { store } from '../storage.ts';
import { clearConfetti, confetti } from './confetti.ts';
import { applyFills, renderDrawing, type DrawingView } from './drawingSvg.ts';
import { ICONS, iconButton } from './icons.ts';

export interface Nav {
  gallery(): void;
  paint(drawingId: string): void;
}

/** Tempo que o botão de confirmar "apagar tudo" fica esperando. */
const CONFIRM_MS = 4000;

function makeScreen(className: string): HTMLElement {
  const el = document.createElement('section');
  el.className = `screen ${className}`;
  el.hidden = true;
  return el;
}

function onTap<T extends HTMLElement>(button: T, action: () => void, sound = true): T {
  button.addEventListener('click', () => {
    if (sound) sfx.pop();
    action();
  });
  return button;
}

/** "Colorir do Gustavo" com cada letra de uma cor. */
function rainbowTitle(text: string): string {
  let k = 0;
  return [...text]
    .map((ch) => (ch === ' ' ? ' ' : `<span style="color:${BRIGHT_COLORS[k++ % BRIGHT_COLORS.length]}">${ch}</span>`))
    .join('');
}

export class GalleryScreen {
  readonly el = makeScreen('gallery');
  private readonly soundBtn: HTMLButtonElement;
  private readonly cards = new Map<string, { card: HTMLButtonElement; view: DrawingView }>();

  constructor(nav: Nav) {
    this.el.innerHTML = `
      <header class="gallery-top">
        <h1 class="title">${rainbowTitle('Colorir do Gustavo')}</h1>
      </header>
      <div class="gallery-body"><div class="gallery-grid"></div></div>`;
    this.soundBtn = onTap(iconButton('soundOn', 'Som'), () => {
      store.sound = !store.sound;
      this.renderSound();
    });
    this.el.querySelector('.gallery-top')!.append(this.soundBtn);

    // Aberto pela página "Jogos do Gustavo": botão para voltar para lá.
    if (location.hash === '#jogos') {
      this.el
        .querySelector('.gallery-top')!
        .prepend(onTap(iconButton('back', 'Todos os jogos'), () => location.assign('/jogos-do-gustavo/')));
    }

    const grid = this.el.querySelector('.gallery-grid')!;
    for (const d of DRAWINGS) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.setAttribute('aria-label', d.label);
      const view = renderDrawing(d, store.fillsOf(d.id));
      card.append(view.svg);
      const sticker = document.createElement('span');
      sticker.className = 'sticker';
      sticker.innerHTML = ICONS.star;
      card.append(sticker);
      onTap(card, () => nav.paint(d.id));
      grid.append(card);
      this.cards.set(d.id, { card, view });
    }
  }

  show(): void {
    for (const [id, { card, view }] of this.cards) {
      applyFills(view, store.fillsOf(id));
      card.classList.toggle('done', store.isDone(id));
    }
    this.renderSound();
  }

  private renderSound(): void {
    this.soundBtn.innerHTML = store.sound ? ICONS.soundOn : ICONS.soundOff;
    this.soundBtn.classList.toggle('off', !store.sound);
  }
}

export class PaintScreen {
  readonly el = makeScreen('paint');
  private readonly canvas: HTMLElement;
  private readonly star: HTMLElement;
  private readonly undoBtn: HTMLButtonElement;
  private readonly trashBtn: HTMLButtonElement;
  private readonly confirmBtn: HTMLButtonElement;
  private readonly swatches: HTMLButtonElement[] = [];
  private drawing: Drawing = DRAWINGS[0];
  private view: DrawingView | null = null;
  private state: PaintState = initialState();
  private swatch: Swatch = DEFAULT_SWATCH;
  private confirmTimer = 0;

  constructor(nav: Nav) {
    this.el.innerHTML = `
      <div class="tools"></div>
      <div class="canvas-wrap"><div class="canvas"><div class="done-star" hidden>${ICONS.star}</div></div></div>
      <div class="palette"></div>`;
    this.canvas = this.el.querySelector('.canvas')!;
    this.star = this.el.querySelector('.done-star')!;

    this.undoBtn = onTap(iconButton('undo', 'Desfazer'), () => this.undo(), false);
    this.trashBtn = onTap(iconButton('trash', 'Apagar tudo', 'trash'), () => this.askClear());
    this.confirmBtn = onTap(iconButton('check', 'Sim, apagar tudo', 'confirm'), () => this.clear(), false);
    this.confirmBtn.hidden = true;
    this.el
      .querySelector('.tools')!
      .append(onTap(iconButton('grid', 'Desenhos'), () => nav.gallery()), this.undoBtn, this.trashBtn, this.confirmBtn);

    const palette = this.el.querySelector('.palette')!;
    for (const s of PALETTE) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.setProperty('--swatch', s.color);
      b.setAttribute('aria-label', s.label);
      b.addEventListener('click', () => this.pick(s));
      palette.append(b);
      this.swatches.push(b);
    }

    // Pinta no toque (pointerdown), para a resposta ser imediata. Vários dedos podem pintar.
    this.canvas.addEventListener('pointerdown', (e) => this.onCanvasDown(e));
  }

  open(drawingId: string): void {
    this.drawing = DRAWINGS.find((d) => d.id === drawingId) ?? DRAWINGS[0];
    this.state = initialState(store.fillsOf(this.drawing.id));
    this.view?.svg.remove();
    this.view = renderDrawing(this.drawing, this.state.fills);
    this.canvas.prepend(this.view.svg);
    this.star.hidden = !store.isDone(this.drawing.id);
    clearConfetti(this.el);
    this.cancelClear();
    this.pick(this.swatch, false);
    this.updateButtons();
  }

  close(): void {
    this.cancelClear();
    clearConfetti(this.el);
  }

  private pick(s: Swatch, sound = true): void {
    this.swatch = s;
    this.el.style.setProperty('--current', s.color);
    this.swatches.forEach((b, i) => b.classList.toggle('selected', PALETTE[i] === s));
    if (sound) sfx.note(s.note);
  }

  private onCanvasDown(e: PointerEvent): void {
    const target = (e.target as Element).closest<SVGElement>('[data-region]');
    if (!target || !this.view) return;
    e.preventDefault();
    this.cancelClear();
    const id = target.dataset.region!;
    const wasComplete = isComplete(this.drawing, this.state.fills);
    const next = paint(this.state, id, this.swatch.color);
    this.splashAt(e);
    if (next === this.state) {
      sfx.splash(this.swatch.note * 0.5);
      return;
    }
    this.state = next;
    applyFills(this.view, this.state.fills);
    sfx.splash(this.swatch.note);
    store.saveFills(this.drawing.id, this.state.fills);
    this.updateButtons();
    if (!wasComplete && isComplete(this.drawing, this.state.fills)) this.celebrate();
  }

  /** Respingo de tinta onde o dedo tocou. */
  private splashAt(e: PointerEvent): void {
    const view = this.view!;
    const ctm = view.svg.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(p.x));
    dot.setAttribute('cy', String(p.y));
    dot.setAttribute('r', '28');
    dot.setAttribute('fill', this.swatch.color);
    view.splashes.append(dot);
    dot
      .animate(
        [
          { transform: 'scale(0.2)', opacity: 0.8 },
          { transform: 'scale(1.8)', opacity: 0 },
        ],
        { duration: 450, easing: 'ease-out' },
      )
      .finished.catch(() => {})
      .then(() => dot.remove());
  }

  private undo(): void {
    if (!this.view || this.state.history.length === 0) return;
    this.cancelClear();
    this.state = undo(this.state);
    applyFills(this.view, this.state.fills);
    store.saveFills(this.drawing.id, this.state.fills);
    sfx.undo();
    this.updateButtons();
  }

  /** "Apagar tudo" pede confirmação: aparece um botão de ✓ por alguns segundos. */
  private askClear(): void {
    if (Object.keys(this.state.fills).length === 0) return;
    this.confirmBtn.hidden = false;
    this.trashBtn.classList.add('asking');
    clearTimeout(this.confirmTimer);
    this.confirmTimer = window.setTimeout(() => this.cancelClear(), CONFIRM_MS);
  }

  private cancelClear(): void {
    clearTimeout(this.confirmTimer);
    this.confirmBtn.hidden = true;
    this.trashBtn.classList.remove('asking');
  }

  private clear(): void {
    this.cancelClear();
    if (!this.view) return;
    this.state = clearAll(this.state);
    applyFills(this.view, this.state.fills);
    store.saveFills(this.drawing.id, this.state.fills);
    sfx.wipe();
    this.updateButtons();
  }

  private updateButtons(): void {
    this.undoBtn.disabled = this.state.history.length === 0;
    this.trashBtn.disabled = Object.keys(this.state.fills).length === 0;
  }

  /** Desenho todo pintado: estrela, confete e música. */
  private celebrate(): void {
    store.markDone(this.drawing.id);
    this.star.hidden = false;
    this.star.animate(
      [
        { transform: 'scale(0) rotate(-40deg)' },
        { transform: 'scale(1.3) rotate(10deg)', offset: 0.7 },
        { transform: 'scale(1) rotate(0deg)' },
      ],
      { duration: 600, easing: 'ease-out' },
    );
    confetti(this.el);
    sfx.win();
  }
}
