const C='holo-v11';
self.addEventListener('install',e=>{self.skipWaiting();
 e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./app1.js','./mes.js','./app2.js','./studio3d.js','./sw.js'])))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const k of await caches.keys())if(k!==C)await caches.delete(k);
 await clients.claim()})()));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
 const url=new URL(r.url);
 if(url.origin===location.origin){
  e.respondWith(fetch(r).then(res=>{const cl=res.clone();
   caches.open(C).then(c=>c.put(r,cl));return res})
   .catch(()=>caches.match(r).then(h=>h||caches.match('./index.html'))));
 }else{
  e.respondWith(caches.match(r).then(h=>h||fetch(r).then(res=>{
   const cl=res.clone();caches.open(C).then(c=>c.put(r,cl));return res})));
 }});
