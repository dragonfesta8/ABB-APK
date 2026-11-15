// Gera uma versão LEVE das listas para TV Box fraca: tira conteúdo adulto e títulos repetidos
// e limita quantos filmes cada categoria pode ter. As listas completas ficam em backup-completo/.
// Uso:  node scripts/gerar-lista-leve.mjs [--max=250] [--entrada=backup-completo] [--saida=www/data]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => (args.find(a => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=')[1];
const max = +opt('max', 250), entrada = opt('entrada', 'backup-completo'), saida = opt('saida', 'www/data');

const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
// Mesma regra de classificação do app (www/js/playlist.js)
function tipo(grupo) {
  const G = norm(grupo).replace(/^[^A-Z0-9]+/, '');
  if (/^(Z ?- ?)?(CANAIS|RADIOS)/.test(G)) return 'canal';
  if (/AREA DO CLIENTE|PEDIDOS/.test(G)) return null;
  if (/SERIE|SERIAD|NOVELA|DESENHO|ANIME/.test(G)) return 'serie';
  if (/FILME|COLETANEA|LANCAMENTO|CINEMA/.test(G)) return 'filme';
  return 'canal';
}
function ler(texto) {
  const cab = [], itens = []; let buf = [];
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trim(); if (!l) continue;
    if (l[0] === '#') { (itens.length || buf.length || l.startsWith('#EXTINF') ? buf : cab).push(l); continue; }
    const g = (/group-title="([^"]*)"/i.exec(buf.join('\n')) || [])[1] || '';
    const nome = (buf.find(x => x.startsWith('#EXTINF')) || '').split('",').pop().split(',').pop().trim();
    itens.push({ linhas: buf, url: l, grupo: g, nome }); buf = [];
  }
  return { cab, itens };
}

mkdirSync(saida, { recursive: true });
const vistos = new Set(), porCategoria = new Map();
const total = { antes: 0, depois: 0, adultos: 0, repetidos: 0, excesso: 0, aviso: 0 };
for (const arq of readdirSync(entrada).filter(f => /\.m3u8?$/i.test(f)).sort()) {
  const { cab, itens } = ler(readFileSync(join(entrada, arq), 'utf8'));
  const bons = [];
  for (const it of itens) {
    total.antes++;
    const t = tipo(it.grupo);
    if (t === null) { total.aviso++; continue; }
    if (/ADULT/.test(norm(it.grupo))) { total.adultos++; continue; }
    const chave = t + '|' + norm(it.nome).replace(/\s+/g, ' ');
    if (vistos.has(chave)) { total.repetidos++; continue; }
    if (t === 'filme') {                       // limite só para filmes (séries e animes são poucos)
      const cat = norm(it.grupo).replace(/[^A-Z0-9]+/g, ' ').trim();
      const n = porCategoria.get(cat) || 0;
      if (n >= max) { total.excesso++; continue; }
      porCategoria.set(cat, n + 1);
    }
    vistos.add(chave); bons.push(it);
  }
  const arqSaida = join(saida, arq);
  writeFileSync(arqSaida, [...cab, ...bons.flatMap(x => [...x.linhas, x.url])].join('\n') + '\n');
  total.depois += bons.length;
  console.log(`${arq}: ${itens.length} → ${bons.length} itens (${(statSync(join(entrada, arq)).size / 1e6).toFixed(1)} MB → ${(statSync(arqSaida).size / 1e6).toFixed(1)} MB)`);
}
console.log(`\nRemovidos: ${total.adultos} adultos, ${total.repetidos} repetidos, ${total.excesso} acima do limite de ${max} filmes por categoria, ${total.aviso} avisos.`);
console.log(`Total: ${total.antes} → ${total.depois} itens.`);
