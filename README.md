# Free Fire Visual Panel

Pagina visual responsiva feita em HTML, CSS e JavaScript para publicar no GitHub Pages.

Este projeto e somente uma interface demonstrativa. Ele nao contem cheat, aimbot, overlay, modificacao de jogo ou captura de credenciais.

A tela de login valida a key em um endpoint Supabase antes de exibir o painel visual. O `device_id` e gerado uma vez no navegador, salvo em `localStorage` e reutilizado nas proximas validacoes.

## Arquivos

- `index.html`: estrutura da pagina.
- `styles.css`: visual neon responsivo.
- `script.js`: formatacao da key, criacao de `device_id`, chamada do endpoint e exibicao do painel visual.

## Publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie estes arquivos para a branch principal.
3. No GitHub, abra `Settings` > `Pages`.
4. Em `Build and deployment`, selecione `Deploy from a branch`.
5. Escolha a branch `main` e a pasta `/root`.
6. Salve e aguarde o link do GitHub Pages.
