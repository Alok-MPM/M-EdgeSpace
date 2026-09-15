const C='holo-v1';
self.addEventListener('install',e=>e.waitUntil(
 caches.open(C).then(c=>c.addAll(['./','./index.html','./style.css','./fx.js','./core.js','./sw.js']))));
self.addEventListener('activate',e=>e.waitUntil(clients.claim()));
self.addEventListener('fetch',e=>{const r=e.request;
 if(r.method!=='GET'||!r.url.startsWith('http'))return;
 e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{
  if(res.ok){const cl=res.clone();caches.open(C).then(c=>c.put(r,cl))}
  return res}).catch(()=>caches.match('./index.html'))))});
