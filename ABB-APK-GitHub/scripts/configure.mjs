import { writeFileSync } from 'node:fs';

const config = {
  appId: 'com.abb.iptv',
  appName: 'ABB',
  webDir: 'www',
  android: {
    allowMixedContent: false
  }
};

writeFileSync(
  'capacitor.config.json',
  JSON.stringify(config, null, 2) + '\n'
);

console.log('ABB configurado para funcionar com conteúdo local.');
