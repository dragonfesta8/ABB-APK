/* Inicialização: a tela de abertura fica no mínimo 2 s e some quando o catálogo carrega */
const t0=Date.now();
applyLeve();nav();
const fim=()=>setTimeout(()=>{const s=$('#splash');s.classList.add('off');setTimeout(()=>s.remove(),700);focusFirst()},Math.max(0,2000-(Date.now()-t0)));
boot().then(fim,fim);
/* Procura novidades ao voltar para o app (depois de 10 min) e a cada 30 min com o app aberto */
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-ultAtu>600000)atualizar()});
setInterval(atualizar,1800000);
