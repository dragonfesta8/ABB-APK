/* ---- leitura das listas M3U ---- */
const SER={};
function addEp(m){
 let n=m.n,s=null,e=null,p=null,x;
 if(x=/^(.*?)[\s._-]*(?:S\s?(\d{1,2})\s?E\s?(\d{1,3})|T\s?(\d{1,2})\s?E\s?(\d{1,3}))/i.exec(n)){n=x[1];s=+(x[2]||x[4]);e=+(x[3]||x[5])}
 else if(!/^anime/i.test(m.c)&&(x=/^(.*\D)\s+(\d{1,3})$/.exec(n))){n=x[1];p=+x[2]}
 n=n.replace(/[\s:._-]+$/,'')||m.n;
 const k=m.c+'|'+n;let g=SER[k];
 if(!g){g=SER[k]={n,c:m.c,t:'serie',l:m.l,a:m.a,u:'s:'+k,g:k,eps:[]};pl(D.serie,m.c).push(g);ALL.push(g)}
 if(!g.eps.some(y=>y.u==m.u))g.eps.push({n:m.n,u:m.u,s,e,p});
 if(!g.l&&m.l)g.l=m.l}
function parse(txt,fonte){let m=null;
 for(const raw of txt.split(/\r?\n/)){const l=raw.trim();
  if(l.startsWith('#EXTINF')){
   const g=(/group-title="([^"]*)"/i.exec(l)||[])[1]||'Outros',lg=(/tvg-logo="(https?:[^"]*)"/i.exec(l)||[])[1]||'';
   let i=l.lastIndexOf('",');i=i<0?l.indexOf(','):i+1;
   const G=norm(g).replace(/^[^A-Z0-9]+/,'');let t='canal';
   if(/^(Z ?- ?)?(CANAIS|RADIOS)/.test(G))t='canal';
   else if(/AREA DO CLIENTE|PEDIDOS/.test(G))t=null;
   else if(/SERIE|SERIAD|NOVELA|DESENHO|ANIME/.test(G))t='serie';
   else if(/FILME|COLETANEA|LANCAMENTO|CINEMA/.test(G))t='filme';
   let c=g.replace(/[^A-Za-zÀ-ÿ0-9+&\/|=:. -]+/g,' ').replace(/^[\s|=:\/-]+|[\s|=:\/-]+$/g,'').split(/\s*[|=:]\s*|\s+\/\s+/).pop().trim().toLowerCase().replace(/(^|\s)\S/g,x=>x.toUpperCase())||'Outros';
   if(fonte&&t){t='canal';c=fonte+' · '+c}   // fontes extras (Pluto TV) são sempre canais ao vivo
   if(!TV_ATIVA&&t=='canal')t=null;
   m=t&&{n:l.slice(i+1).trim()||'Sem nome',c,t,l:lg,a:/ADULT/.test(G)};
  }else if(m&&l&&l[0]!='#'){m.u=l;if(m.t=='serie')addEp(m);else{pl(D[m.t],m.c).push(m);ALL.push(m)}m=null}
 }}
/* Baixa as listas (sem mexer na tela). A lista extra fica guardada no aparelho para quando não houver internet. */
let FALHAS=[];
async function baixar(quieto){
 FALHAS=[];
 const extra=S.cfg.url||LISTA_PADRAO;
 const fontes=(S.cfg.soUrl&&extra?[]:ARQ.map(f=>['./data/'+f])).concat(extra?[[extra,null,1]]:[]).concat(S.cfg.pluto&&TV_ATIVA?[[PLUTO,'Pluto TV']]:[]);
 const out=[];
 for(const [u,n,guarda] of fontes){
  try{const r=await (u.startsWith('./')?(window.CapacitorWebFetch||window.fetch):window.fetch).call(window,u);if(!r.ok)throw new Error('HTTP '+r.status);const t=await r.text();out.push([t,n]);
   if(guarda&&t.length<2500000){try{localStorage.setItem('abb2lista',JSON.stringify({u,t}))}catch(e){}}}
  catch(e){
   let c=null;if(guarda){try{c=JSON.parse(localStorage.getItem('abb2lista')||'null')}catch(x){}}
   if(c&&c.u==u){out.push([c.t,n]);if(!quieto)toast('Sem conexão: usando a última lista salva')}
   else{FALHAS.push((n||u)+' ('+(e&&e.message||'erro')+')');if(!quieto)toast('Não foi possível ler '+(n||u))}}}
 return out}
function montar(l){D={canal:{},filme:{},serie:{}};ALL=[];for(const k in SER)delete SER[k];l.forEach(x=>parse(x[0],x[1]))}
let ultAtu=Date.now();
async function boot(){
 rc($('#app'),el('p','ld','Carregando catálogo…'));
 montar(await baixar());ultAtu=Date.now();
 HERO=null;go('home',1);
}
/* Atualização automática, sem mexer no que você está fazendo */
async function atualizar(){
 if(document.hidden)return;
 const l=await baixar(1);if(!l.length)return;
 const antes=ALL.length;montar(l);ultAtu=Date.now();
 if(ALL.length!=antes){toast('Lista atualizada');HERO=null;if(tab=='home'&&!L.length&&!$('#md').classList.contains('on'))render()}}
