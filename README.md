# Colorir do Gustavo

Jogo de colorir para crianças pequenas, **sem propagandas, sem compras e sem coleta de dados**.
Escolha uma cor e toque numa parte do desenho para pintar.

**Jogar:** https://micheltlutz.github.io/colorir-do-gustavo/

## Instalar no iPad

1. Abra o link acima no **Safari**.
2. Toque em **Compartilhar** (quadrado com seta) → **Adicionar à Tela de Início**.
3. Abra o jogo pelo ícone **uma vez com internet**. Depois disso ele funciona offline.

Bom saber:
- Os desenhos pintados ficam salvos no app do ícone. Apagar o ícone apaga os desenhos.
- **Acesso Guiado** (Ajustes → Acessibilidade → Acesso Guiado; depois clique três vezes no botão lateral) mantém a criança dentro do jogo.
- Atualizações chegam sozinhas quando o jogo é aberto com internet (são aplicadas na galeria, nunca no meio de um desenho).

## Como se joga

- **Galeria:** 24 desenhos. Os 12 primeiros são mais simples (carro, caminhão, trator, ônibus, avião, foguete, barco, trem, peixe, dinossauro, casa e borboleta); os outros 12 têm mais partes para pintar (caminhão de bombeiros, helicóptero, escavadeira, submarino, balão, arco-íris, castelo, cachorro, leão, polvo, robô e bolo de aniversário). Os pintados aparecem coloridos; os completos ganham uma estrela.
- **Pintar:** escolha uma cor na paleta e toque numa parte do desenho. São 12 cores, cada uma em 3 tons (claro, médio e escuro), e cada tom toca uma nota. A borda da folha mostra a cor escolhida. O branco funciona como borracha.
- **Botões:** voltar à galeria, desfazer e apagar tudo (pede confirmação com um ✓ e também pode ser desfeito).
- Pintar todas as partes de um desenho vira festa: confete, música e estrela.

## Desenvolvimento

Requer Node 24 ou mais novo.

```sh
npm install
npm run dev -- --host   # abre na rede local (teste no iPad pela Wi-Fi)
npm test                # lógica de pintura e validação dos desenhos
npm run build           # versão final em dist/
npm run icons           # gera os ícones PNG a partir de public/icon.svg
```

Estrutura:
- `src/paint/drawings.ts`: os desenhos (formas SVG pintáveis, de trás para frente, mais os traços que não se pintam).
- `src/paint/state.ts`: pintar, desfazer, apagar e "desenho completo" (código puro, testado).
- `src/paint/palette.ts`: as cores (3 tons de cada) e a nota de cada uma.
- `src/ui/`: galeria, tela de pintura, ícones e confete.
- `src/audio/sfx.ts`: sons sintetizados (sem arquivos de áudio).

Cada push na branch `main` roda os testes e publica no GitHub Pages.
