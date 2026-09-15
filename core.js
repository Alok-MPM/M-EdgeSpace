/* HOLO HAND FX — core.js */
(()=>{
const $=id=>document.getElementById(id);
const vid=$('vid'),cv=$('cv'),hud=$('hud'),stat=$('stat'),dock=$('dock'),menu=$('menu');
const TV='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MH='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MF='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let HL=null,FL=null,flTry=false,running=false,lastH=null,lastF=null,fNew=false;
let fps=60,prevT=0,tick=0,eng='none',detErr='';
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
function resize(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener('resize',resize);resize();
async function vision(){const v=await import(TV);
 return{v,fs:await v.FilesetResolver.forVisionTasks(TV+'/wasm')}}
async function mkH(d){const{v,fs}=await vision();
 return v.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MH,delegate:d},
  runningMode:'VIDEO',numHands:2})}
async function mkF(d){const{v,fs}=await vision();
 return v.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MF,delegate:d},
  runningMode:'VIDEO',numFaces:1})}
$('btn').onclick=async()=>{
 if(!window.isSecureContext||!navigator.mediaDevices){
  stat.textContent='❌ Insecure context! https (Vercel) ya http://localhost se kholo';return}
 stat.textContent='📷 Camera...';
 try{
  const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',
   width:{ideal:640},height:{ideal:480}},audio:false});
  vid.srcObject=st;await vid.play();FX.setVid(vid);
  stat.textContent='🧠 Hand model (GPU)...';
  try{HL=await mkH('GPU');eng='GPU'}catch(e){HL=await mkH('CPU');eng='CPU'}
  $('start').style.display='none';running=true;prevT=performance.now();
  detectLoop();requestAnimationFrame(render);
 }catch(e){stat.textContent='❌ '+(e.name==='NotAllowedError'?'Camera permission deny hui — site settings me allow karo':e.message)}};
async function detectLoop(){while(running){
 const t=performance.now();
 if(vid.readyState>=2){
  try{lastH=HL.detectForVideo(vid,t);detErr=''}
  catch(e){detErr=(e.message||'').slice(0,40);
   try{HL=await mkH(eng==='GPU'?'CPU':'GPU');eng=eng==='GPU'?'CPU':'GPU'}catch(e2){}}
  if(FX.S.opt.head){tick++;
   if(tick%4===0){try{
    if(!FL&&!flTry){flTry=true;try{FL=await mkF('GPU')}catch(e){FL=await mkF('CPU')}}
    if(FL){lastF=FL.detectForVideo(vid,t);fNew=true}
   }catch(e){}}}
 }
 await new Promise(r=>setTimeout(r,20));
}}
function render(){requestAnimationFrame(render);
 if(!running)return;
 const t=performance.now(),dt=t-prevT;prevT=t;
 if(dt>0)fps=fps*.9+(1000/dt)*.1;
 const H=FX.smoothHands(lastH&&lastH.landmarks);
 const G=H.map(FX.gesture);
 let headE=null;if(fNew){headE=FX.headEvt(lastF&&lastF.faceLandmarks&&lastF.faceLandmarks[0],t);fNew=false}
 const info=FX.renderFrame(H,G,t,headE);
 hud.textContent=`FPS ${fps|0} • HANDS ${H.length} • OBJ ${info.obj} • ${FX.S.design}`+
  (FX.S.sel?` • SEL#${FX.S.sel}`:'')+`\nENG[${eng}] ${detErr?'❌'+detErr:'✔'} • OFFLINE-READY • head:${FX.S.opt.head?'on':'off'}`;}
FX.DESIGNS.forEach(d=>{const b=document.createElement('button');b.textContent=d;
 if(d===FX.S.design)b.classList.add('on');
 b.onclick=()=>{FX.S.design=d;[...dock.children].forEach(x=>x.classList.toggle('on',x===b));
  FX.toast('🎨 design: '+d)};dock.appendChild(b)});
$('mbtn').onclick=()=>menu.classList.toggle('open');
menu.querySelectorAll('input').forEach(i=>i.onchange=()=>{FX.S.opt[i.dataset.o]=i.checked;
 if(i.dataset.o==='head'&&!i.checked)FL=null,flTry=false;
 FX.toast((i.checked?'✅ ':'⛔ ')+i.dataset.o)});
$('bClear').onclick=()=>{FX.S.objs=[];FX.S.sel=null;FX.toast('🧹 sab saaf')};
$('bSave').onclick=()=>{const c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;
 const x=c.getContext('2d');x.translate(c.width,0);x.scale(-1,1);
 x.drawImage(vid,0,0,c.width,c.height);x.setTransform(1,0,0,1,0,0);x.drawImage(cv,0,0);
 const a=document.createElement('a');a.download='holo-'+Date.now()+'.png';
 a.href=c.toDataURL('image/png');a.click();FX.toast('📸 save ho gayi')};
})();
