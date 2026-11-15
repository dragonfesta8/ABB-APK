// Testa os links de uma lista M3U e gera uma cópia só com os que respondem.
// Uso:  node scripts/verificar-links.mjs www/data/CanaisBR01.m3u8 [outra.m3u8 ...]
//       --tipo=canais|todos   (padrão: canais — só TV ao vivo; "todos" testa tudo, pode demorar horas)
//       --tempo=8000          (milissegundos de espera por link)
//       --paralelo=20         (quantos links testar ao mesmo tempo)
//       --saida=limpo         (pasta onde salvar as listas limpas e o relatório)
// Rode na SUA rede: alguns servidores bloqueiam os IPs de nuvem (ex.: GitHub Actions) e a lista sairia "toda morta".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => (args.find(a => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=')[1];
const arquivos = args.filter(a => !a.startsWith('--'));
const tipo = opt('tipo', 'canais'), tempo = +opt('tempo', 8000), paralelo = +opt('paralelo', 20), saida = opt('saida', 'limpo');
if (!arquivos.length) { console.error('Informe pelo menos um arquivo .m3u/.m3u8'); process.exit(1); }

const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
// Mesma regra do app: o que não é série, filme ou aviso é canal de TV.
function ehCanal(grupo) {
  const G = norm(grupo).replace(/^[^A-Z0-9]+/, '');
  if (/^(Z ?- ?)?(CANAIS|RADIOS)/.test(G)) return true;
  return !/AREA DO CLIENTE|PEDIDOS|SERIE|SERIAD|NOVELA|DESENHO|ANIME|FILME|COLETANEA|LANCAMENTO|CINEMA/.test(G);
}

function ler(texto) {
  const cab = [], itens = []; let buf = [];
  for (const raw of texto.split(/\r?\n/)) {
    const l = raw.trim(); if (!l) continue;
    if (l[0] === '#') { (itens.length || buf.length || l.startsWith('#EXTINF') ? buf : cab).push(l); continue; }
    const g = (/group-title="([^"]*)"/i.exec(buf.join('\n')) || [])[1] || '';
    itens.push({ linhas: buf, url: l, grupo: g, nome: (buf.find(x => x.startsWith('#EXTINF')) || '').split(',').pop() }); buf = [];
  }
  return { cab, itens };
}

async function testar(url) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), tempo);
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-2047', 'User-Agent': 'Mozilla/5.0' }, signal: ctl.signal, redirect: 'follow' });
    if (r.status !== 200 && r.status !== 206) return `HTTP ${r.status}`;
    if ((r.headers.get('content-type') || '').includes('text/html')) return 'devolveu página HTML';
    const { value } = await r.body.getReader().read();   // precisa chegar pelo menos 1 byte de vídeo
    ctl.abort();
    return value && value.length ? null : 'sem dados';
  } catch (e) { return ctl.signal.aborted && e.name === 'AbortError' && !String(e.cause || '').length ? 'tempo esgotado' : (e.cause?.code || e.cause?.message || e.message); }
  finally { clearTimeout(t); }
}

mkdirSync(saida, { recursive: true });
const relatorio = ['arquivo;grupo;nome;motivo;url'];
for (const arq of arquivos) {
  const { cab, itens } = ler(readFileSync(arq, 'utf8'));
  const alvo = itens.filter(i => tipo === 'todos' || ehCanal(i.grupo));
  console.log(`\n${basename(arq)}: ${itens.length} itens, testando ${alvo.length} (${tipo})…`);
  const ruins = new Map(); let feitos = 0, i = 0;
  await Promise.all(Array.from({ length: paralelo }, async () => {
    while (i < alvo.length) {
      const it = alvo[i++]; const m = await testar(it.url);
      if (m) { ruins.set(it, m); relatorio.push([basename(arq), it.grupo, it.nome, m, it.url].map(x => String(x).replace(/;/g, ',')).join(';')); }
      if (++feitos % 50 === 0 || feitos === alvo.length) process.stdout.write(`\r  ${feitos}/${alvo.length}  fora do ar: ${ruins.size}   `);
    }
  }));
  const bons = itens.filter(x => !ruins.has(x));
  writeFileSync(join(saida, basename(arq)), [...cab, ...bons.flatMap(x => [...x.linhas, x.url])].join('\n') + '\n');
  console.log(`\n  mantidos: ${bons.length} | removidos: ${ruins.size}`);
}
writeFileSync(join(saida, 'relatorio-links.csv'), relatorio.join('\n') + '\n');
console.log(`\nPronto. Listas limpas e relatório em ./${saida}/`);
