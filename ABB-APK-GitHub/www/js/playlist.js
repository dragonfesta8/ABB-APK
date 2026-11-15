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
   const grupo=(/group-title="([^"]*)"/i.exec(l)||[])[1]||'Outros';
   const logo=(/tvg-logo="(https?:[^"]*)"/i.exec(l)||[])[1]||'';

   let inicio=l.lastIndexOf('",');
   inicio=inicio<0?l.indexOf(','):inicio+1;

   const G=norm(grupo).replace(/^[^A-Z0-9]+/,'');
   let tipo=null;

   if(/AREA DO CLIENTE|PEDIDOS/.test(G)){
    tipo=null;
   }
   else if(/FILME|COLETANEA|LANCAMENTO|CINEMA/.test(G)){
    tipo='filme';
   }
   else if(/SERIE|SERIAD|NOVELA|DESENHO|ANIME/.test(G)){
    tipo='serie';
   }
   else if(/^(Z ?- ?)?(CANAIS|RADIOS)/.test(G)){
    tipo='canal';
   }

   let categoria=grupo
    .replace(/[^A-Za-zÀ-ÿ0-9+&\/|=:. -]+/g,' ')
    .replace(/^[\s|=:\/-]+|[\s|=:\/-]+$/g,'')
    .split(/\s*[|=:]\s*|\s+\/\s+/)
    .pop()
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\S/g,x=>x.toUpperCase())||'Outros';

   if(fonte&&tipo){
    tipo='canal';
    categoria=fonte+' · '+categoria;
   }

   if(!TV_ATIVA&&tipo==='canal')tipo=null;

   m=tipo?{
    n:l.slice(inicio+1).trim()||'Sem nome',
    c:categoria,
    t:tipo,
    l:logo,
    a:/ADULT/.test(G)
   }:null;
  }
  else if(m&&l&&l[0]!='#'){
   m.u=l;

   if(m.t==='serie'){
    addEp(m);
   }else{
    pl(D[m.t],m.c).push(m);
    ALL.push(m);
   }

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
   throw new Error('Nenhuma lista foi carregada');
  }

  await montar(listas);

  assinaturaAtual=assinaturaCatalogo();
  ultAtu=Date.now();
  HERO=null;

  if(!ALL.length){
   rc(
    $('#app'),
    el('p','em','Nenhum conteúdo foi encontrado nas listas.')
   );
   return;
  }

  go('home',1);

 }catch(e){
  console.error('Falha ao montar catálogo',e);

  rc(
   $('#app'),
   el('p','em','Não foi possível carregar o catálogo. Verifique a conexão e tente novamente.')
  );

  toast('Erro ao carregar o catálogo');
 }
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
