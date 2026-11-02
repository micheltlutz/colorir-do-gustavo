import './styles.css';
import { initAudio } from './audio/sfx.ts';
import { applyPendingUpdate, setupPWA } from './pwa.ts';
import { GalleryScreen, PaintScreen, type Nav } from './ui/screens.ts';

type ScreenName = 'gallery' | 'paint';

/** Bloqueia zoom, menu de toque longo, seleção e rolagem do Safari. */
function blockBrowserGestures(): void {
  const prevent = (e: Event) => e.preventDefault();
  for (const type of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick', 'contextmenu', 'selectstart']) {
    document.addEventListener(type, prevent, { passive: false });
  }
  // Só a galeria rola; no resto, arrastar o dedo não mexe a página.
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!(e.target as Element).closest?.('.gallery-body')) e.preventDefault();
    },
    { passive: false },
  );
  // Sem um listener de touchstart, o iOS não mostra o efeito de botão apertado (:active).
  document.addEventListener('touchstart', () => {}, { passive: true });
}

blockBrowserGestures();
initAudio();

let current: ScreenName = 'gallery';

const nav: Nav = {
  gallery: () => show('gallery'),
  paint: (id) => {
    show('paint');
    painter.open(id);
  },
};

const gallery = new GalleryScreen(nav);
const painter = new PaintScreen(nav);
document.getElementById('app')!.append(gallery.el, painter.el);

function show(name: ScreenName): void {
  if (current === 'paint' && name !== 'paint') painter.close();
  current = name;
  gallery.el.hidden = name !== 'gallery';
  painter.el.hidden = name !== 'paint';
  if (name === 'gallery') {
    gallery.show();
    // Atualizações só na galeria, nunca no meio de um desenho.
    applyPendingUpdate();
  }
}

show('gallery');
setupPWA(() => current === 'gallery');
