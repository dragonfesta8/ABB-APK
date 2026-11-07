export function validateAppUrl(value) {
 let url;
 try { url = new URL(value); } catch { throw new Error('Informe o endereço HTTPS publicado do ABB.'); }
 if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use HTTPS sem credenciais no endereço.');
 const host = url.hostname.toLowerCase();
 if (['localhost','127.0.0.1','::1','[::1]'].includes(host) || host.endsWith('.localhost') || host.startsWith('id-preview') || host.startsWith('preview--') || host.endsWith('.lovableproject.com') || host.endsWith('.lovableproject-dev.com')) throw new Error('Use o site publicado, não a prévia ou endereço local.');
 if (url.search || url.hash) throw new Error('Use o endereço publicado sem parâmetros.');
 return url.href;
}
