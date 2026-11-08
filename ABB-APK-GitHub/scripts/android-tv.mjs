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

// Registra a tela nativa do reprodutor.
if (!manifest.includes('AbbPlayerActivity')) {
  manifest = manifest.replace(
    '</application>',
    `    <activity
            android:name=".AbbPlayerActivity"
            android:exported="false"
            android:configChanges="keyboard|keyboardHidden|orientation|screenSize" />
    </application>`
  );
}

writeFileSync(manifestPath, manifest);

// Recursos gráficos.
mkdirSync('android/app/src/main/res/drawable', { recursive: true });

const resources = [
  ['abb-icon.png', 'abb_icon.png'],
  ['abb-tv-cover.png', 'abb_tv_cover.png']
];

for (const [from, to] of resources) {
  copyFileSync(
    `www/${from}`,
    `android/app/src/main/res/drawable/${to}`
  );
}

// Diretório das classes Java.
mkdirSync(javaDir, { recursive: true });

// Comunicação entre a página HTML e o Android.
writeFileSync(`${javaDir}/MainActivity.java`, `
package ${packageName};

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        webView.addJavascriptInterface(
            new AbbPlayerBridge(this),
            "AbbPlayer"
        );
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
import android.os.Bundle;
import android.net.Uri;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.media3.common.MediaItem;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

public class AbbPlayerActivity extends Activity {
    private ExoPlayer player;
    private PlayerView playerView;

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

        playerView = new PlayerView(this);
        playerView.setLayoutParams(
            new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        );

        playerView.setKeepScreenOn(true);
        setContentView(playerView);

        player = new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                Toast.makeText(
                    AbbPlayerActivity.this,
                    "Falha na reprodução: " + error.errorCodeName,
                    Toast.LENGTH_LONG
                ).show();
            }
        });

        MediaItem item = MediaItem.fromUri(Uri.parse(url));
        player.setMediaItem(item);
        player.prepare();
        player.play();
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
  writeFileSync(gradlePath, gradle);
}

console.log('ABB: player nativo Media3 preparado.');
