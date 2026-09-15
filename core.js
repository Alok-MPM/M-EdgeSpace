/* core.js v2 — slim shell: camera + menu + photo (2D REMOVED) */
(()=>{
const $=s=>document.querySelector(s);
const vid=$('#vid'),start=$('#start'),stat=$('#stat');
const go=()=>navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false})
 .then(st=>{vid.srcObject=st;start.style.display='none';FX.toast('🎥 camera on')})
 .catch(e=>{stat.textContent='❌ camera error: '+e.message});
$('#btn').onclick=go;
$('#mbtn').onclick=()=>$('#menu').classList.toggle('on');
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
(function loop(t){FX.renderFrame(t||0);requestAnimationFrame(loop)})();
})();
