import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync
} from 'node:fs';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';

let manifest = readFileSync(manifestPath, 'utf8');

// Recursos para Android TV e TV Box.
if (!manifest.includes('android.software.leanback')) {
  manifest = manifest.replace(
    '<application',
    `<uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.hardware.faketouch" android:required="false" />
    <application`
  );
}

// Faz o aplicativo aparecer tanto em Android TV quanto em TV Box.
if (!manifest.includes('android.intent.category.LEANBACK_LAUNCHER')) {
  manifest = manifest.replace(
    '<category android:name="android.intent.category.LAUNCHER" />',
    `<category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />`
  );
}

// Configura o ícone do aplicativo.
manifest = manifest
  .replace(
    'android:icon="@mipmap/ic_launcher"',
    'android:icon="@drawable/abb_icon"'
  )
  .replace(
    'android:roundIcon="@mipmap/ic_launcher_round"',
    'android:roundIcon="@drawable/abb_icon"'
  );

// Adiciona o banner usado no launcher da TV.
if (!manifest.includes('android:banner=')) {
  manifest = manifest.replace(
    '<application',
    '<application android:banner="@drawable/abb_tv_cover"'
  );
}

writeFileSync(manifestPath, manifest);

// Cria a pasta de recursos gráficos.
mkdirSync(
  'android/app/src/main/res/drawable',
  { recursive: true }
);

// Copia o ícone e o banner para o projeto Android.
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

console.log('Android TV e TV Box configurados com sucesso.');
