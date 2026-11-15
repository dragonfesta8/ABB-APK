/* ---- leitura das listas M3U ---- */
const SER={};
const PAUSA_PARSE=()=>new Promise(resolve=>setTimeout(resolve,0));

function addEp(m){
 let n=m.n,s=null,e=null,p=null,x;
 if(x=/^(.*?)[\s._-]*(?:S\s?(\d{1,2})\s?E\s?(\d{1,3})|T\s?(\d{1,2})\s?E\s?(\d{1,3}))/i.exec(n)){n=x[1];s=+(x[2]||x[4]);e=+(x[3]||x[5])}
 else if(!/^anime/i.test(m.c)&&(x=/^(.*\D)\s+(\d{1,3})$/.exec(n))){n=x[1];p=+x[2]}
 n=n.replace(/[\s:._-]+$/,'')||m.n;
 const k=m.c+'|'+n;let g=SER[k];
 if(!g){g=SER[k]={n,c:m.c,t:'serie',l:m.l,a:m.a,u:'s:'+k,g:k,eps:[]};pl(D.serie,m.c).push(g);ALL.push(g)}
 if(!g.eps.some(y=>y.u==m.u))g.eps.push({n:m.n,u:m.u,s,e,p});
 if(!g.l&&m.l)g.l=m.l;
}

async function parse(txt,fonte){
 let m=null,cont=0;
 const linhas=txt.split(/\r?\n/);
 for(let ix=0;ix<linhas.length;ix++){
  const l=linhas[ix].trim();
  if(l.startsWith('#EXTINF')){
   const g=(/group-title="([^"]*)"/i.exec(l)||[])[1]||'Outros';
   const lg=(/tvg-logo="(https?:[^"]*)"/i.exec(l)||[])[1]||'';
   let i=l.lastIndexOf('",');i=i<0?l.indexOf(','):i+1;
   const G=norm(g).replace(/^[^A-Z0-9]+/,'');let t='canal';
   if(/AREA DO CLIENTE|PEDIDOS/.test(G))t=null;
else if(/FILME|COLETANEA|LANCAMENTO|CINEMA|DRAMA|DOCUMENTARIO|FANTASIA|ACAO|COMEDIA|TERROR|ROMANCE|SUSPENSE/.test(G))t='filme';
else if(/SERIE|SERIAD|NOVELA|DESENHO|ANIME/.test(G))t='serie';
else if(/^(Z ?- ?)?(CANAIS|RADIOS)/.test(G))t='canal';
else t=null;
   if(fonte&&t){t='canal';c=fonte+' · '+c}
   if(!TV_ATIVA&&t=='canal')t=null;
   m=t&&{n:l.slice(i+1).trim()||'Sem nome',c,t,l:lg,a:/ADULT/.test(G)};
  }else if(m&&l&&l[0]!='#'){
   m.u=l;
   if(m.t=='serie')addEp(m);
   else{pl(D[m.t],m.c).push(m);ALL.push(m)}
   m=null;
   if(++cont%700===0)await PAUSA_PARSE();
  }
 }
}

/* Baixa as listas em paralelo e preserva a última cópia da lista remota. */
async function baixar(quieto){
 const extra=S.cfg.url||LISTA_PADRAO;
 const fontes=(S.cfg.soUrl&&extra?[]:ARQ.map(f=>[
  f.startsWith('http') ? f : './data/'+f
])).concat(extra?[[extra,null,1]]:[]).concat(S.cfg.pluto&&TV_ATIVA?[[PLUTO,'Pluto TV']]:[]);
 const resultados=await Promise.all(fontes.map(async([u,n,guarda])=>{
  try{
   const r=await fetch(u,{cache:guarda?'no-store':'default'});
   if(!r.ok)throw new Error('HTTP '+r.status);
   const t=await r.text();
   if(guarda&&t.length<2500000){try{localStorage.setItem('abb2lista',JSON.stringify({u,t}))}catch(e){}}
   return [t,n];
  }catch(e){
   let c=null;
   if(guarda){try{c=JSON.parse(localStorage.getItem('abb2lista')||'null')}catch(x){}}
   if(c&&c.u==u){if(!quieto)toast('Sem conexão: usando a última lista salva');return [c.t,n]}
   if(!quieto)toast('Não foi possível ler '+(n||u));
   return null;
  }
 }));
 return resultados.filter(Boolean);
}

async function montar(l){
 D={canal:{},filme:{},serie:{}};ALL=[];
 for(const k in SER)delete SER[k];
 for(const x of l)await parse(x[0],x[1]);
}

let ultAtu=Date.now(),assinaturaAtual='';
function assinaturaCatalogo(){
 let h=2166136261;
 for(const i of ALL){
  const s=i.u+'|'+i.n;
  for(let j=0;j<s.length;j++)h=Math.imul(h^s.charCodeAt(j),16777619);
 }
 return ALL.length+':'+(h>>>0);
}
async function boot(){
 rc($('#app'),el('p','ld','Carregando catálogo…'));

 try{
  const listas=await baixar();

  if(!listas.length){
   throw new Error('Nenhuma lista foi baixada');
  }

  await montar(listas);

  assinaturaAtual=assinaturaCatalogo();
  ultAtu=Date.now();
  HERO=null;

  console.log('ABB DIAGNÓSTICO');
  console.log('Listas baixadas:',listas.length);
  console.log('Total:',ALL.length);
  console.log('Filmes:',Object.values(D.filme).reduce((n,a)=>n+a.length,0));
  console.log('Séries:',Object.values(D.serie).reduce((n,a)=>n+a.length,0));

  if(!ALL.length){
   rc(
    $('#app'),
    el('div','dev',
     '⚠ Nenhum conteúdo foi processado. '+
     listas.length+' lista(s) foram baixadas, mas 0 itens foram encontrados.'
    )
   );
   toast('Listas baixadas, mas nenhum item foi processado');
   return;
  }

  toast(ALL.length.toLocaleString('pt-BR')+' itens carregados');
  go('home',1);

 }catch(e){
  console.error('Falha ao montar catálogo',e);

  rc(
   $('#app'),
   el('div','dev',
    '⚠ Erro ao carregar catálogo: '+e.message
   )
  );

  toast('Erro ao carregar: '+e.message);
 }
}

/* Atualização automática sem interromper a navegação atual. */
let atualizando=false;
async function atualizar(){
 if(document.hidden||atualizando)return;
 atualizando=true;
 try{
  const l=await baixar(1);if(!l.length)return;
  await montar(l);
  const nova=assinaturaCatalogo(),mudou=nova!==assinaturaAtual;
  assinaturaAtual=nova;ultAtu=Date.now();
  if(mudou){
   toast('Lista atualizada');HERO=null;
   if(tab=='home'&&!L.length&&!$('#md').classList.contains('on'))render();
  }
 }catch(e){console.error('Falha ao atualizar listas',e)}
 finally{atualizando=false}
}
