/* core.js v3 — POORA file: camera + menu + photo + hand-watchdog (2D nahi) */
(()=>{
const $=s=>document.querySelector(s);
const vid=$('#vid'),start=$('#start'),stat=$('#stat');
const go=()=>navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false})
 .then(st=>{vid.srcObject=st;start.style.display='none';FX.toast('🎥 camera on')})
 .catch(e=>{stat.textContent='❌ camera error: '+e.message});
$('#btn').onclick=go;
document.querySelectorAll('#menu input').forEach(i=>{FX.S.opt[i.dataset.o]=i.checked;
 i.onchange=()=>{FX.S.opt[i.dataset.o]=i.checked}});
$('#bClear').onclick=()=>{window.SCENE3D.exec({op:'clear'});FX.toast('🧹 sab 3D objects saaf')};
$('#bSave').onclick=()=>{const c=document.createElement('canvas');
 c.width=vid.videoWidth||1280;c.height=vid.videoHeight||720;
 const x=c.getContext('2d');x.drawImage(vid,0,0,c.width,c.height);
 x.drawImage(document.getElementById('cv3'),0,0,c.width,c.height);
 x.drawImage(document.getElementById('cv'),0,0,c.width,c.height);
 c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='m-edgespace-'+Date.now()+'.png';a.click();FX.toast('📸 photo save')})};
let handSeen=false,wT=0;
(function loop(t){FX.renderFrame(t||0);
 const{H}=FX.getHands();if(H&&H.length)handSeen=true;
 wT+=16;if(wT>6000){wT=0;if(!handSeen)FX.toast('🖐 hand model load nahi — site data clear karo, Chrome kholo, haath dikhao')}
 requestAnimationFrame(loop)})();
window.__CORE_OK=true;
})();
