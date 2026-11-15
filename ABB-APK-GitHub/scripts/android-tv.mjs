import {
  writeFileSync,
  copyFileSync,
  mkdirSync,
  readFileSync
} from 'node:fs';

const packageName = 'com.abb.iptv';
const javaDir = 'android/app/src/main/java/com/abb/iptv';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = readFileSync(manifestPath, 'utf8');

// Permissões e recursos para Android TV.
if (!manifest.includes('android.permission.INTERNET')) {
  manifest = manifest.replace(
    '<application',
    '<uses-permission android:name="android.permission.INTERNET" />\n    <application'
  );
}

if (!manifest.includes('android.software.leanback')) {
  manifest = manifest.replace(
    '<application',
    `<uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.faketouch" android:required="false" />
    <application`
  );
}

if (!manifest.includes('android.intent.category.LEANBACK_LAUNCHER')) {
  manifest = manifest.replace(
    '<category android:name="android.intent.category.LAUNCHER" />',
    `<category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`
  );
}

manifest = manifest
  .replace(
    'android:icon="@mipmap/ic_launcher"',
    'android:icon="@drawable/abb_icon"'
  )
  .replace(
    'android:roundIcon="@mipmap/ic_launcher_round"',
    'android:roundIcon="@drawable/abb_icon"'
  );

if (!manifest.includes('android:banner=')) {
  manifest = manifest.replace(
    '<application',
    '<application android:banner="@drawable/abb_tv_cover"'
  );
}

if (!manifest.includes('android:usesCleartextTraffic=')) {
  manifest = manifest.replace(
    '<application',
    '<application android:usesCleartextTraffic="true"'
  );
}

// Tela principal sempre em paisagem (TV Box e celular deitado).
if (!manifest.includes('screenOrientation="sensorLandscape"')) {
  manifest = manifest.replace(/<activity(?=\s)/, '<activity android:screenOrientation="sensorLandscape"');
}

// Registra a tela nativa do reprodutor.
if (!manifest.includes('AbbPlayerActivity')) {
  manifest = manifest.replace(
    '</application>',
    `    <activity
            android:name=".AbbPlayerActivity"
            android:exported="false"
            android:theme="@style/AppTheme.NoActionBar"
            android:screenOrientation="sensorLandscape"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize" />
    </application>`
  );
}

writeFileSync(manifestPath, manifest);

// Tema em tela cheia desde a abertura.
const stylesPath = 'android/app/src/main/res/values/styles.xml';
try {
  let st = readFileSync(stylesPath, 'utf8');
  if (!st.includes('windowFullscreen')) {
    const item = '\n        <item name="android:windowFullscreen">true</item>';
    st = st
      .replace(/(<style name="AppTheme\.NoActionBar"[^>]*>)/, '$1' + item)
      .replace(/(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)/, '$1' + item);
    writeFileSync(stylesPath, st);
  }
} catch (e) {
  console.warn('styles.xml não ajustado:', e.message);
}

// Recursos gráficos.
mkdirSync('android/app/src/main/res/drawable', { recursive: true });

const resources = [
  ['abb-icon.png', 'abb_icon.png'],
  ['abb-tv-cover.png', 'abb_tv_cover.png']
];

for (const [from, to] of resources) {
  copyFileSync(
    `www/img/${from}`,
    `android/app/src/main/res/drawable/${to}`
  );
}

// Diretório das classes Java.
mkdirSync(javaDir, { recursive: true });

// Comunicação entre a página HTML e o Android.
writeFileSync(`${javaDir}/MainActivity.java`, `
package ${packageName};

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Esconde barra de status e de navegação (tela cheia imersiva).
    private void telaCheia() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(
            getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        telaCheia();

        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(
            new AbbPlayerBridge(this),
            "AbbPlayer"
        );

        // Garante que as setas do controle remoto cheguem na página.
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
    }

    @Override
    public void onResume() {
        super.onResume();
        telaCheia();
        getBridge().getWebView().requestFocus();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) telaCheia();
    }
}
`);

// Ponte JavaScript para abrir o player.
writeFileSync(`${javaDir}/AbbPlayerBridge.java`, `
package ${packageName};

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class AbbPlayerBridge {
    private final Activity activity;

    public AbbPlayerBridge(Activity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void play(String url, String title) {
        if (url == null || url.trim().isEmpty()) return;

        Uri uri = Uri.parse(url);
        String scheme = uri.getScheme();

        if (!"http".equalsIgnoreCase(scheme) &&
            !"https".equalsIgnoreCase(scheme)) {
            activity.runOnUiThread(() -> Toast.makeText(
                activity, "Endereço não suportado: " + scheme, Toast.LENGTH_LONG).show());
            return;
        }

        activity.runOnUiThread(() -> {
            Intent intent = new Intent(
                activity,
                AbbPlayerActivity.class
            );
            intent.putExtra("url", url);
            intent.putExtra("title", title);
            activity.startActivity(intent);
        });
    }
}
`);

// Tela nativa com Media3.
writeFileSync(`${javaDir}/AbbPlayerActivity.java`, `
package ${packageName};

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.HttpDataSource;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.ui.PlayerView;

public class AbbPlayerActivity extends Activity {
    private ExoPlayer player;
    private PlayerView playerView;
    private TextView aviso;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String url = getIntent().getStringExtra("url");
        String title = getIntent().getStringExtra("title");

        if (url == null || url.isEmpty()) {
            finish();
            return;
        }

        setTitle(title != null ? title : "ABB IPTV");

        FrameLayout raiz = new FrameLayout(this);
        raiz.setBackgroundColor(Color.BLACK);

        playerView = new PlayerView(this);
        playerView.setShowBuffering(PlayerView.SHOW_BUFFERING_ALWAYS);
        playerView.setControllerAutoShow(true);
        playerView.setKeepScreenOn(true);
        raiz.addView(playerView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT));

        // Mensagem na tela: "Carregando" e, se falhar, o motivo do erro.
        aviso = new TextView(this);
        aviso.setTextColor(Color.WHITE);
        aviso.setTextSize(20);
        aviso.setGravity(Gravity.CENTER);
        aviso.setPadding(80, 40, 80, 40);
        aviso.setText("Carregando...\\n" + (title != null ? title : ""));
        raiz.addView(aviso, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(raiz);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        telaCheia();
        playerView.requestFocus();

        // Muitos servidores de IPTV recusam o "ExoPlayer" e exigem seguir redirecionamentos.
        DefaultHttpDataSource.Factory http = new DefaultHttpDataSource.Factory()
            .setUserAgent("VLC/3.0.20 LibVLC/3.0.20")
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15000)
            .setReadTimeoutMs(20000);

        player = new ExoPlayer.Builder(this)
            .setMediaSourceFactory(new DefaultMediaSourceFactory(this).setDataSourceFactory(http))
            .build();
        playerView.setPlayer(player);

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int state) {
                if (state == Player.STATE_BUFFERING) {
                    aviso.setText("Conectando ao servidor...\\n" + (title != null ? title : ""));
                    aviso.setVisibility(View.VISIBLE);
                } else if (state == Player.STATE_READY) {
                    aviso.setVisibility(View.GONE);
                }
            }

            @Override
            public void onPlayerError(PlaybackException error) {
                String cod = error.getErrorCodeName();
                int codHttp = 0;
                Throwable causa = error;
                while (causa != null) {
                    if (causa instanceof HttpDataSource.InvalidResponseCodeException) {
                        codHttp = ((HttpDataSource.InvalidResponseCodeException) causa).responseCode;
                        break;
                    }
                    causa = causa.getCause();
                }

                String dica;
                if (codHttp == 401 || codHttp == 403) {
                    dica = "Acesso negado pelo servidor. O link pode exigir autorização.";
                } else if (codHttp == 404) {
                    dica = "Esse link não existe mais no servidor.";
                } else if (codHttp > 0 || cod.contains("NETWORK") || cod.contains("TIMEOUT")) {
                    dica = "Falha de rede ou servidor indisponível. Confira a conexão.";
                } else {
                    dica = "Formato, codec ou link não suportado por esta TV Box.";
                }

                String host = Uri.parse(url).getHost();
                aviso.setText("Não foi possível reproduzir\\n\\n" + dica
                    + "\\n(" + cod + (codHttp > 0 ? ", HTTP " + codHttp : "") + ")"
                    + "\\nServidor: " + (host != null ? host : "desconhecido")
                    + "\\n\\nPressione VOLTAR");
                aviso.setVisibility(View.VISIBLE);
            }
        });

        MediaItem.Builder itemBuilder = new MediaItem.Builder().setUri(Uri.parse(url));
        String lowerUrl = url.toLowerCase();
        if (lowerUrl.contains(".m3u8")) {
            itemBuilder.setMimeType(MimeTypes.APPLICATION_M3U8);
        }
        player.setMediaItem(itemBuilder.build());
        player.prepare();
        player.play();
    }

    private void telaCheia() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(
            getWindow(), getWindow().getDecorView());
        c.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) telaCheia();
    }

    @Override
    protected void onDestroy() {
        if (playerView != null) {
            playerView.setPlayer(null);
        }

        if (player != null) {
            player.release();
            player = null;
        }

        super.onDestroy();
    }
}
`);

// Dependências do Media3.
const gradlePath = 'android/app/build.gradle';
let gradle = readFileSync(gradlePath, 'utf8');

if (!gradle.includes('media3-exoplayer')) {
  gradle += `

dependencies {
    implementation "androidx.media3:media3-exoplayer:1.8.1"
    implementation "androidx.media3:media3-ui:1.8.1"
}
`;
}
if (!gradle.includes('media3-exoplayer-hls')) {
  gradle += `

dependencies {
    // Necessário para reproduzir links HLS terminados em .m3u8.
    implementation "androidx.media3:media3-exoplayer-hls:1.8.1"
}
`;
}
writeFileSync(gradlePath, gradle);

console.log('ABB: player nativo Media3 preparado.');
