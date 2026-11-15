/* ---- componentes ---- */
function card(it){
 const b=el('button','card'+(it.t=='canal'?' w':''));b.style.setProperty('--g',`hsl(${hue(it.n)} 35% 22%)`);
 if(it.l){const i=new Image();i.loading='lazy';i.referrerPolicy='no-referrer';i.src=it.l;i.onerror=()=>i.remove();b.append(i)}
 b.append(el('span','',it.n));if(has('fav',it))b.append(el('i','','♥'));
 b.onclick=()=>openM(it);return b}
function row(t,items){
 items=items.filter(vis);if(!items.length)return null;
 const s=el('section','row'),sc=el('div','sc');s.append(el('h2','',t),sc);
 items.slice(0,20).forEach(i=>sc.append(card(i)));
 if(items.length>20)sc.append(btn('Ver todos ('+items.length+') ›',()=>grid(t,items),'card more'));
 return s}
function grid(t,items){
 push(()=>{render();const r=[...document.querySelectorAll('#app .row')].find(x=>x.firstChild.textContent==t),b=r&&r.querySelector('.more');if(b){b.focus({preventScroll:true});reveal(b,1)}});
 const A=$('#app');rc(A);
 const h=el('div','pt');h.append(btn('‹',back,'ic'),el('span','',t));
 const g=el('div','gr');let n=0;
 const more=btn('Mostrar mais',()=>{const f=document.activeElement==more;items.slice(n,n+60).forEach(i=>g.append(card(i)));n+=60;if(n>=items.length){more.remove();if(f)g.lastElementChild.focus({preventScroll:true})}});
 curMore=()=>{if(more.isConnected)more.onclick()};
 A.append(h,g,more);more.onclick();const c=g.firstChild;c?c.focus({preventScroll:true}):focusFirst()}
function hero(A){
 if(!HERO){const p=[];for(const c in D.filme)if(/lan.amentos|2026|cinema|nacionais/i.test(c))p.push(...D.filme[c].filter(i=>i.l&&vis(i)));
  HERO=p.length?p[Math.random()*p.length|0]:ALL.find(i=>i.l&&vis(i))}
 const it=HERO;if(!it)return;
 const s=el('section','hero'),bg=el('div','bg'),d=el('div');
 bg.style.backgroundImage='url('+JSON.stringify(it.l)+')';
 const im=new Image();im.src=it.l;im.referrerPolicy='no-referrer';im.onerror=()=>im.remove();
 d.append(el('small','','EM DESTAQUE · '+it.c.toUpperCase()),el('h1','',it.n),btn('▶ Assistir',()=>play(it)),btn('ⓘ Mais informações',()=>openM(it),'btn g'));
 s.append(bg,im,d);A.append(s)}

/* ---- páginas ---- */
const NOMES={canal:'TV ao vivo',filme:'Filmes',serie:'Séries'};
function render(){
 const A=$('#app'),add=e=>e&&A.append(e);rc(A);curMore=null;
 document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t==tab));
 if(tab=='canal'&&!TV_ATIVA){const d=el('div','dev');d.append(el('div','ic2','🚧'),el('h1','','TV ao vivo'),el('p','','Em desenvolvimento'),el('small','','Estamos preparando os canais. Volte em breve!'),btn('Ir para o início',()=>go('home'),'btn g'));A.append(d);return}
 if(tab=='config')return cfgPage(A);
 if(tab=='busca')return searchPage(A);
 if(tab=='home'){hero(A);add(row('Continuar assistindo',vs(S.hist)));add(row('Minha lista',vs(S.list)));add(row('Favoritos',vs(S.fav)));
  [['canal',3],['filme',4],['serie',3]].forEach(([t,k])=>Object.entries(D[t]).filter(([c,v])=>v.some(vis)).slice(0,k).forEach(([c,v])=>add(row(NOMES[t]+' · '+c,v))));return}
 if(tab=='lista'){
  [['Minha lista','list'],['Favoritos','fav']].forEach(([t,k])=>{A.append(el('h1','pt',t));
   const g=el('div','gr');vs(S[k]).filter(vis).forEach(i=>g.append(card(i)));
   A.append(vs(S[k]).length?g:el('p','em','Nada por aqui ainda. Abra um título e toque em “Minha lista” ou “Favoritar”.'))});return}
 const cats=Object.entries(D[tab]).filter(([c,v])=>v.some(vis));let n=0;
 A.append(el('h1','pt',NOMES[tab]));
 const mb=btn('Mostrar mais categorias',()=>{cats.slice(n,n+10).forEach(([c,v])=>{const r=row(c,v);r&&A.insertBefore(r,mb)});n+=10;if(n>=cats.length)mb.remove()});
 A.append(mb);curMore=()=>{if(mb.isConnected)mb.onclick()};mb.onclick();
 if(!cats.length)A.append(el('p','em','Nenhum conteúdo encontrado. Verifique as listas em Configurações.'))}
function searchPage(A){
 const w=el('div','cfg'),q=el('input'),r=el('div','gr');
 q.placeholder='Buscar títulos, canais, séries…';q.autocomplete='off';r.style.padding='0';r.style.marginTop='18px';w.append(q,r);A.append(w);
 let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{const v=norm(q.value.trim());rc(r);if(v.length<2)return;
  let n=0;for(const i of ALL){if(vis(i)&&(i.k||(i.k=norm(i.n))).includes(v)){r.append(card(i));if(++n>=60)break}}
  if(!n)r.append(el('p','em','Nenhum resultado.'))},250)};q.focus()}
function cfgPage(A){
 const w=el('div','cfg');w.append(el('h1','','Configurações'));
 const it=(...x)=>{const d=el('div','it');d.append(...x);w.append(d);return d};
 const lab=(x,i)=>{const l=el('label','',x);l.append(i);return l};
 const nome=el('input');nome.value=S.cfg.nome;nome.maxLength=24;nome.onchange=()=>{S.cfg.nome=nome.value.trim();save();nav()};
 it(lab('Nome do perfil',nome));
 const ad=btn('',()=>{if(!S.cfg.adulto&&!confirm('Mostrar conteúdo adulto? Use apenas se você tem 18 anos ou mais.'))return;S.cfg.adulto=!S.cfg.adulto;save();HERO=null;ad.textContent=S.cfg.adulto?'Ligado':'Desligado'});
 ad.textContent=S.cfg.adulto?'Ligado':'Desligado';it(el('span','','Mostrar conteúdo adulto'),ad);
 const lv=btn('',()=>{S.cfg.leve=!isLeve();save();applyLeve();lv.textContent=isLeve()?'Ligado':'Desligado'});
 lv.textContent=isLeve()?'Ligado':'Desligado';it(el('span','','Modo leve (recomendado para TV Box)'),lv);
 const pt=btn('',()=>{S.cfg.pluto=!S.cfg.pluto;save();pt.textContent=S.cfg.pluto?'Ligado':'Desligado';toast('Recarregando listas…');boot().then(()=>go('config',1))});
 pt.textContent=S.cfg.pluto?'Ligado':'Desligado';if(TV_ATIVA)it(el('span','','Pluto TV Brasil (canais grátis ao vivo)'),pt);
 const url=el('input');url.value=S.cfg.url;url.placeholder='https://raw.githubusercontent.com/...';
 it(lab('Lista extra (URL do GitHub, link "Raw"). É somada às listas do app e atualiza sozinha: ao abrir, ao voltar para o app e a cada 30 min',url));
 const so=btn('',()=>{S.cfg.soUrl=!S.cfg.soUrl;save();so.textContent=S.cfg.soUrl?'Ligado':'Desligado'});
 so.textContent=S.cfg.soUrl?'Ligado':'Desligado';it(el('span','','Usar só a lista extra (ignorar as listas do app)'),so);
 it(el('span','',ALL.length.toLocaleString('pt-BR')+' itens carregados'),btn('Salvar e recarregar',()=>{S.cfg.url=url.value.trim();save();go('home',1);boot()},'btn g'));
 [['Limpar histórico','hist'],['Limpar Minha lista','list'],['Limpar favoritos','fav']].forEach(([t,k])=>
  it(el('span','',t.replace('Limpar ','')+' ('+S[k].length+')'),btn('Limpar',()=>{S[k]=[];save();toast('Limpo');render()},'btn g')));
 it(el('span','','ABB · versão 2.1 (diagnóstico de vídeo)'));A.append(w)}

/* ---- detalhes, listas e player ---- */
const num=x=>x.e!=null?x.e:x.p!=null?x.p:0;
const stub=i=>i.eps?Object.assign({},i,{eps:undefined}):i;
const tg=(k,i)=>{const a=S[k],x=a.findIndex(y=>y.u==i.u);x<0?a.unshift(stub(i)):a.splice(x,1);save();dirty=true;return x<0};
const eplbl=x=>x.e!=null?'Episódio '+x.e:x.p!=null?'Parte '+x.p:x.n;
function openM(it){
 const G=it.g?SER[it.g]:null;if(it.g&&!G){toast('Série não encontrada na lista atual');return}
 it=G||it;
 const ret=document.activeElement;
 const M=$('#md'),b=el('div','mb'),t=el('div','mt'),d=el('div');
 if(it.l)t.style.backgroundImage='url('+JSON.stringify(it.l)+')';
 const L1=()=>has('list',it)?'✓ Na minha lista':'＋ Minha lista',L2=()=>has('fav',it)?'♥ Favoritado':'♡ Favoritar';
 const bl=btn(L1(),()=>{toast(tg('list',it)?'Adicionado à Minha lista':'Removido da Minha lista');bl.textContent=L1()},'btn g'),
       bf=btn(L2(),()=>{toast(tg('fav',it)?'Adicionado aos favoritos':'Removido dos favoritos');bf.textContent=L2()},'btn g');
 const eps=G?[...G.eps].sort((a,b)=>(a.s||0)-(b.s||0)||num(a)-num(b)):[];
 const ult=G&&eps.find(x=>x.u==S.ult[G.g]),first=ult||eps[0];
 const fecha=()=>{L[L.length-1]=()=>{};M.classList.remove('on');ret&&ret.isConnected&&ret.focus({preventScroll:true})};
 d.append(el('h2','',it.n),btn(ult?'▶ Continuar':'▶ Assistir',()=>{fecha();G?playEp(G,first):play(it)}),bl,bf);t.append(d);
 const i=el('div','mi');
 i.append(el('p','',NOMES[it.t]+' · '+it.c+(G?' · '+eps.length+(eps.length>1?' episódios':' episódio'):'')));
 if(G&&eps.length>1){
  const ss=[...new Set(eps.map(x=>x.s))],bx=el('div'),ls=el('div');
  const show=s=>{rc(ls);eps.filter(x=>x.s==s).forEach(x=>ls.append(btn((x.u==S.ult[G.g]?'▶ ':'')+eplbl(x),()=>{fecha();playEp(G,x)},'ep')))};
  if(ss.length>1){const sb=el('div','ss');ss.forEach(s=>sb.append(btn(s==null?'Episódios':'Temporada '+s,()=>show(s),'btn g')));bx.append(sb)}
  bx.append(ls);i.append(bx);show(ult?ult.s:ss[0])}
 i.append(btn('Fechar',back,'btn g'));
 b.append(t,i);rc(M,b);M.classList.add('on');push(()=>{M.classList.remove('on');const lab=ret&&ret.textContent;if(dirty){dirty=false;render();const c=[...document.querySelectorAll('#app .card')].find(x=>x.textContent==lab);c?c.focus({preventScroll:true}):focusFirst()}else if(ret&&ret.isConnected)ret.focus({preventScroll:true})});
 d.querySelector('button').focus()}
function play(it,url=it.u,title=it.n){
 S.hist=[stub(it),...S.hist.filter(x=>x.u!=it.u)].slice(0,30);save();
 if(window.AbbPlayer&&AbbPlayer.play){try{toast('Abrindo…');AbbPlayer.play(url,title)}catch(e){toast('Falha ao abrir o player: '+e.message)}return}
 toast('Player nativo indisponível; usando o do navegador');
 const v=$('#pl');v.src=url;v.style.display='block';v.play().catch(()=>toast('Formato não suportado neste navegador'));
 push(()=>{v.pause();v.removeAttribute('src');v.load();v.style.display='none'})}
function playEp(G,x){S.ult[G.g]=x.u;play(G,x.u,G.n+' · '+eplbl(x))}
