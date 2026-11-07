# ABB — APK pelo GitHub

Pacote separado para gerar um APK Android que abre o ABB publicado usando Capacitor. Não altera o site nem o transforma em código nativo. O APK precisa de internet. Este ZIP NÃO contém um APK pronto.

## Você precisa

- Conta GitHub e GitHub Actions habilitado, com cota disponível. Repositórios privados podem consumir minutos pagos.
- ABB publicado em HTTPS, acessível sem entrar no Lovable. O ABB ainda não estava publicado na preparação deste pacote: primeiro clique em **Publish** no Lovable e copie o endereço publicado. Não use `id-preview--...`.
- TV Box Android 6 ou superior com internet; recomenda-se Android System WebView atualizado. TVs com outros sistemas não instalam APK Android.
- Sua própria lista IPTV autorizada. Não são incluídos canais pagos ou assinaturas.

## 1 — Enviar o pacote

1. Extraia o ZIP, não envie o ZIP fechado.
2. Crie um repositório GitHub separado daquele do site, preferencialmente privado.
3. Envie todo o conteúdo para a raiz, incluindo **`.github/workflows/gerar-apk.yml`**, `.gitignore` e `bun.lock`.
4. Confirme que `package.json` aparece na raiz, sem pasta extra acima dele.

**Atenção no celular:** a pasta `.github` pode estar oculta. Se ela não for enviada, use **Add file → Create new file** no GitHub, digite `.github/workflows/gerar-apk.yml` como nome e cole o conteúdo do arquivo. Sem esse arquivo, não aparece a geração em Actions.

Não substitua o código do site por este pacote: os dois têm arquivos `package.json` diferentes. Este pacote apenas abre o site hospedado.

## 2 — Gerar e baixar

1. Abra **Actions** no repositório e habilite os workflows, se solicitado.
2. Escolha **Gerar APK ABB → Run workflow**.
3. Cole o endereço HTTPS publicado do ABB no campo, sem parâmetros.
4. Confirme **Run workflow** e aguarde o resultado verde.
5. Abra a execução concluída e, em **Artifacts**, baixe **ABB-APK** (disponível por 14 dias).
6. Extraia o download; dentro dele estará **`ABB-debug.apk`**.

O GitHub instala Node 22, Bun 1.4.4, Java 21 e Android SDK 35; gera o projeto Android a partir das dependências fixadas, sincroniza os arquivos e compila com o Gradle wrapper gerado. Não precisa de Android Studio no seu computador. Nenhuma senha ou chave privada é necessária para esta versão de teste.

## 3 — Instalar na TV Box

1. Copie o APK por USB ou outro meio de confiança.
2. Autorize a instalação de aplicativos desconhecidos para o gerenciador de arquivos usado.
3. Abra o APK, confirme a instalação e abra **ABB**.
4. Dentro do ABB, configure sua lista em **Configurações**.

Inclui ícone ABB e entrada de Android TV; onde ele aparece depende do launcher. Favoritos e configurações pertencem a esse APK no dispositivo, não são importados do navegador. Mudanças publicadas no mesmo endereço do site aparecem no APK sem recompilar.

## Limitações e segurança

- **APK de teste, não para Play Store.** Ele é assinado automaticamente com chave de desenvolvimento. A chave pode mudar em outra execução do GitHub: se a atualização falhar por assinatura diferente, desinstalar a versão antiga permite instalar a nova, mas APAGA seus favoritos e configurações. Atualizações de produção exigem uma chave permanente guardada com segurança. Nunca envie chaves privadas ao repositório.
- **Precisa de internet e do site publicado disponível.** Não funciona como versão offline. GitHub Pages não hospeda o servidor TanStack Start do site. Não use somente a pasta `dist` do site para criar esse APK.
- **Teste no aparelho.** Reprodução, codecs, tela cheia, controle remoto e botão Voltar dependem da TV Box e WebView. A entrada Android TV não garante que todos os controles estejam adaptados. Não foram testados em aparelho físico.
- **Listas e vídeos:** prefira HTTPS. CORS, DRM, codecs não suportados, HTTP inseguro e bloqueios do provedor podem impedir reprodução/carregamento; o pacote não contorna esses bloqueios. Use apenas conteúdo autorizado.
- **Site público:** abra o endereço numa janela anônima antes de gerar. O workflow verifica o erro HTTP, mas não confirma ausência de uma tela de login.
- **Validação realizada:** passaram os testes de endereço e a geração/sincronização do projeto Android; foram conferidos manifesto, ícones e wrapper Gradle. A compilação completa do APK no GitHub e a instalação física NÃO foram executadas nesta preparação.
- **Erro em Actions:** abra a execução vermelha e a etapa com erro; confira a URL, a pasta `.github` e a cota de minutos. Envie a mensagem de erro para análise, nunca credenciais.

## Uso local opcional

Com Node 22, Bun 1.4.4, Java 21 e Android SDK 35:

```sh
bun install --frozen-lockfile
bun run test
ABB_APP_URL=https://seu-site-publicado.example bun run prepare:apk
bunx cap add android
bunx cap sync android
bun run configure:tv
cd android
./gradlew assembleDebug
```

Troque o endereço ilustrativo pelo endereço verdadeiro. O script valida HTTPS e recusa endereço de prévia antes de gerar a configuração. A pasta Android é temporária e não precisa ser enviada ao GitHub.
