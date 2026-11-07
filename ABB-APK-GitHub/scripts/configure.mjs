import { writeFileSync } from 'node:fs';
import { validateAppUrl } from './url.mjs';
const url = validateAppUrl(process.env.ABB_APP_URL);
writeFileSync('capacitor.config.json', JSON.stringify({appId:'com.abb.iptv',appName:'ABB',webDir:'www',server:{url,cleartext:false},android:{allowMixedContent:false}},null,2)+'\n');
console.log('Configuração ABB criada.');
