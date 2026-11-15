/* ---- barra superior ---- */
function nav(){
 const n=$('#nav');rc(n,el('div','logo','ABB'));
 [['home','Início'],['canal','TV ao vivo'],['filme','Filmes'],['serie','Séries'],['lista','Minha lista']].forEach(([t,x])=>{const b=btn(x,()=>go(t),'tab');b.dataset.t=t;n.append(b)});
 const sp=el('div','sp'),s=btn('🔍',()=>go('busca'),'ic');s.dataset.t='busca';
 const a=btn((S.cfg.nome||'A')[0].toUpperCase(),()=>go('config'),'av');a.dataset.t='config';a.title='Configurações';
 n.append(sp,s,a)}
function go(t,quiet){
 if(!quiet&&tab=='home'&&t!='home')push(()=>go('home',1));
 tab=t;render();scrollTo(0,0);if(t!='busca')focusFirst()}
const focusFirst=()=>{const e=$('#app button,#app input');e&&foco(e)};
addEventListener('scroll',()=>$('#nav').classList.toggle('s',scrollY>20),{passive:true});

/* ---- navegação por setas (controle remoto) ---- */
function mv(k){
 const a=document.activeElement,md=$('#md').classList.contains('on');
 const list=[...document.querySelectorAll(md?'#md button':'#nav button,#app button,#app input')].filter(e=>e.offsetParent);
 if(!a||a==document.body){list[0]&&list[0].focus();return}
 const r=a.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,H=k=='ArrowLeft'||k=='ArrowRight';
 let best,bd=1e9;
 for(const e of list){if(e==a)continue;const q=e.getBoundingClientRect(),dx=q.left+q.width/2-cx,dy=q.top+q.height/2-cy;
  const p=k=='ArrowRight'?dx:k=='ArrowLeft'?-dx:k=='ArrowDown'?dy:-dy,o=H?Math.abs(dy):Math.abs(dx);
  if(p<4||(H&&o>Math.max(r.height,q.height)*.6))continue;
  const d=p+o*2;if(d<bd){bd=d;best=e}}
 if(best){foco(best);reveal(best,!H);chkMore(best)}}
/* Rolagem estilo Netflix: a fileira anda de lado sozinha e a tela alinha a linha em foco */
function reveal(e,v){
 if($('#md').classList.contains('on')){e.scrollIntoView({block:'nearest'});return}
 const sc=e.closest('.sc'),b=e.getBoundingClientRect(),y=b.top-innerHeight*.3,fora=b.top<90||b.bottom>innerHeight-30;
 if(sc){const a=sc.getBoundingClientRect(),pad=a.width*.05;
  if(b.left<a.left+pad)sc.scrollLeft-=a.left+pad-b.left;else if(b.right>a.right-pad)sc.scrollLeft+=b.right-(a.right-pad)}
 if(e.closest('#nav'))scrollTo(0,0);
 else if(e.closest('.hero'))scrollTo(0,0);
 else if(v&&(sc||e.closest('.gr'))||fora)scrollBy(0,y)}
/* Carrega mais itens sozinho quando o foco chega perto do fim da lista */
function chkMore(e){
 if(!curMore)return;const g=e.closest('.gr');
 if(g){if(g.children.length-[].indexOf.call(g.children,e)<=18)curMore();return}
 const r=e.closest('.row');if(r){const rs=document.querySelectorAll('#app .row');if(rs.length-[].indexOf.call(rs,r)<=2)curMore()}}
addEventListener('keydown',e=>{
 const k=e.key,inp=e.target.tagName=='INPUT';
 if(k=='Escape'||k=='GoBack'||k=='BrowserBack'||(k=='Backspace'&&!inp)){if(back())e.preventDefault();return}
 if(!k.startsWith('Arrow')||(inp&&(k=='ArrowLeft'||k=='ArrowRight')))return;
 e.preventDefault();mv(k)});
