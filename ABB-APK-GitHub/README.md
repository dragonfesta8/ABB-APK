# ABB — projeto do APK

O APK **embute** a pasta `www/` (funciona sem site publicado) e usa o player nativo do Android. Precisa de internet para reproduzir os vídeos.

## Estrutura

```
ABB-APK-GitHub/
├── www/                    App (HTML/CSS/JS)
│   ├── index.html
│   ├── css/style.css       Visual
│   ├── js/
│   │   ├── core.js         Estado salvo, helpers, botão Voltar
│   │   ├── playlist.js     Leitura das listas M3U
│   │   ├── ui.js           Cartões, páginas, detalhes, player
│   │   ├── nav.js          Barra superior e controle remoto
│   │   └── main.js         Inicialização
│   ├── data/               Listas leves .m3u8 (CanaisBR01, CanaisBR02, MeusAnimes)
│   └── img/                Ícone e banner da Android TV
├── scripts/
│   ├── configure.mjs       Gera capacitor.config.json
│   └── android-tv.mjs      Ajusta manifesto, player nativo e recursos de TV
├── tests/                  Testes (`bun run test`)
└── package.json
```

## Gerar o APK (GitHub Actions)

1. Envie o conteúdo para um repositório (incluindo `.github/workflows/gerar-apk.yml`).
2. Em **Actions → Gerar APK ABB Android TV → Run workflow**.
3. Baixe o artefato **ABB-AndroidTV-APK** (`app-debug.apk`).

## Uso local

Requer Node, Bun, Java 21 e Android SDK 35:

```sh
bun install
bun scripts/configure.mjs
bunx cap add android && bunx cap sync android
bun scripts/android-tv.mjs
cd android && ./gradlew assembleDebug
```

## TV Box e tela cheia

O `scripts/android-tv.mjs` prepara o projeto Android para TV Box:
- Tela cheia imersiva (sem barra de status nem de navegação) no app e no player. Deslizar a borda mostra as barras por um instante.
- Sempre em paisagem; a tela fica ligada enquanto o app está aberto.
- Entrada no menu da Android TV (Leanback) e banner próprio.
- O foco do controle remoto é entregue à página, e o player aceita o botão central para pausar.
- Se a tela ficar preta, atualize o "Android System WebView" do aparelho.

## Android antigo (7.1) e WebView

O app instala a partir do Android 6, mas a parte visual roda no "Android System WebView" do aparelho, que precisa ser **Chrome 60 ou mais novo**. Em Configurações, o rodapé mostra a versão do WebView em uso. O código evita recursos novos demais (sem `??`, `?.`, `aspect-ratio`, `gap` em flex etc.) e tem alternativa para o `focus({preventScroll})`, que só existe a partir do Chrome 64.

## Versão leve para TV Box fraca

As listas dentro do APK (`www/data/`) são uma versão **leve**: sem conteúdo adulto, sem títulos repetidos e com no máximo 250 filmes por categoria (52.689 → 8.327 itens; 13,5 MB → 2,1 MB). As listas completas ficam em `backup-completo/` (não vão no APK).

Para mudar o limite e gerar de novo: `node scripts/gerar-lista-leve.mjs --max=400` (lê `backup-completo/`, escreve `www/data/`).

## TV ao vivo (desligada por enquanto)

A aba **TV ao vivo** mostra "Em desenvolvimento" e nenhum canal é carregado (`TV_ATIVA=false` em `www/js/core.js`).
Os canais que existiam nas listas foram movidos para `backup-canais/`, que **não vai dentro do APK**.
Para reativar: ponha `TV_ATIVA=true`, copie o conteúdo de `backup-canais/` de volta para os arquivos de `www/data/` (ou use uma lista por URL) e gere o APK.

## Atualizar listas sem gerar APK

Em **Configurações → Lista extra**, cole o link "Raw" de uma lista no GitHub. O app a lê ao abrir, ao voltar para o app (depois de 10 min) e a cada 30 min com o app aberto, e avisa "Lista atualizada" quando há novidade. A última lista fica salva no aparelho para quando não houver internet. Para o app já vir configurado, preencha `LISTA_PADRAO` em `www/js/core.js` antes de gerar o APK.

## Listas e configurações

- Por padrão o app lê `www/data/*.m3u8`. Para usar outra lista, o usuário informa a URL em **Configurações → Sua lista M3U**.
- **Pluto TV Brasil** (canais grátis ao vivo): ligue em Configurações. Os canais entram em TV ao vivo, em categorias "Pluto TV · …", somados às outras listas. A lista usada é mantida pela comunidade (`PLUTO` em `www/js/core.js`); se o endereço mudar, é só trocar ali. Pode exigir IP do Brasil.
- Favoritos, Minha lista, histórico e configurações ficam salvos no aparelho (`localStorage`).
- Conteúdo adulto fica oculto por padrão.
- Use apenas listas e conteúdos que você tem autorização para distribuir. Evite embutir no APK listas que contenham endereços ou credenciais de terceiros.

## Verificar links que não funcionam

`scripts/verificar-links.mjs` testa cada canal e gera uma lista **limpa**, sem os links fora do ar (HTTP de erro, página HTML no lugar do vídeo, sem resposta).

```sh
node scripts/verificar-links.mjs www/data/CanaisBR01.m3u8 www/data/CanaisBR02.m3u8
```

- Gera `limpo/CanaisBR01.m3u8`, `limpo/CanaisBR02.m3u8` e `limpo/relatorio-links.csv` (o motivo de cada remoção). Os originais não são alterados.
- Por padrão testa só **TV ao vivo** (`--tipo=canais`). Filmes e séries são milhares de links; use `--tipo=todos` só se tiver paciência.
- **Rode na sua rede** (computador ou Termux). Pelo GitHub Actions (workflow "Verificar links") o servidor pode bloquear o IP da nuvem e marcar tudo como fora do ar.
- Um canal pode estar fora do ar só naquele momento. Rode mais de uma vez, em horários diferentes, antes de trocar as listas do app.

## Limitações

- APK de teste (assinatura de desenvolvimento); não é para a Play Store.
- Séries são agrupadas por nome e temporada (padrões "S01E02" e "NOME 01"). Não há retomada de posição dentro do episódio, só do último episódio assistido.
- Reprodução, codecs e controle remoto dependem do aparelho e do WebView.
