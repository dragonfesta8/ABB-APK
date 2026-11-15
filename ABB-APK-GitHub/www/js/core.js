const $=s=>document.querySelector(s),KEY='abb2',ARQ=['CanaisBR01.m3u8','CanaisBR02.m3u8','MeusAnimes.m3u8'];
let S={fav:[],list:[],hist:[],ult:{},cfg:{}},D,ALL,tab='home',HERO=null;
try{S=Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
S.cfg=Object.assign({nome:'',adulto:false,url:'',soUrl:false,pluto:false},S.cfg);
// Para o APK já abrir lendo a sua lista do GitHub (link "Raw"), cole o endereço aqui. Vazio = só o que for digitado em Configurações.
const LISTA_PADRAO='';
// TV ao vivo desligada por enquanto: a aba mostra "Em desenvolvimento" e nenhum canal é carregado.
// Para reativar: troque para true e devolva os arquivos de backup-canais/ para www/data/.
const TV_ATIVA=false;
const vs=a=>TV_ATIVA?a:a.filter(i=>i.t!='canal');   // esconde canais que já estavam salvos em Minha lista/Favoritos/Histórico
const PLUTO='https://i.mjh.nz/PlutoTV/br.m3u8'; // lista da comunidade com os canais gratuitos da Pluto TV Brasil
const isLeve=()=>S.cfg.leve==null?!('ontouchstart' in window):S.cfg.leve;
const applyLeve=()=>document.body.classList.toggle('leve',isLeve());
const rc=(n,...c)=>{n.textContent='';c.forEach(x=>x&&n.append(x));return n};
const pl=(o,k)=>o[k]||(o[k]=[]);
let curMore=null,dirty=false;
/* Foco sem pular a tela (o "preventScroll" só existe a partir do Chrome 64; antes disso restauramos a rolagem na mão) */
let PS=false;try{document.createElement('i').focus({get preventScroll(){PS=true;return true}})}catch(e){}
function foco(e){if(PS){e.focus({preventScroll:true});return}const x=scrollX,y=scrollY,sc=e.closest&&e.closest('.sc'),l=sc?sc.scrollLeft:0;e.focus();scrollTo(x,y);if(sc)sc.scrollLeft=l}
const chromeV=+((/Chrome\/(\d+)/.exec(navigator.userAgent)||[])[1]||0);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
const has=(k,i)=>S[k].some(x=>x.u==i.u);
const vis=i=>S.cfg.adulto||!i.a;
const hue=s=>Math.abs([...s].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%360;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const btn=(x,f,c='btn')=>{const b=el('button',c,x);b.onclick=f;return b};
let tm2;const toast=m=>{const t=$('#tt');t.textContent=m;t.style.display='block';clearTimeout(tm2);tm2=setTimeout(()=>t.style.display='none',2200)};

/* ---- histórico do botão Voltar (celular e TV) ---- */
const L=[];
const push=f=>{L.push(f);history.pushState(1,'')};
addEventListener('popstate',()=>{const f=L.pop();f&&f()});
const back=()=>L.length?(history.back(),1):0;
