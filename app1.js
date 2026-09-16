/* app1.js — gestures/skeleton/head + camera/hand-engine/menu/photo */
const FX=(()=>{
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),wrap=document.getElementById('wrap'),toastEl=document.getElementById('toast');
const S={opt:{skeleton:true,holo:false,perf:false,head:true}};
let smooth=[],toastT=0,vidEl=null,lastH=[],lastG=[],lastHead=null;
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const FING=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
function gesture(p){const f=FING.map(x=>D(p[x[3]],p[0])>D(p[x[1]],p[0])*1.12);const n=f.filter(Boolean).length;
 if(D(p[4],p[8])<D(p[0],p[9])*.5&&n<=1)return'PINCH';
 if(f[0]&&f[1]&&!f[2]&&!f[3])return'PEACE';
 if(n>=4)return'PALM';if(n===0)return'FIST';return'POINT'}
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');toastT=performance.now()+1800}
const HP={h:[],cool:0};
function headEvt(fl,t){if(!fl)return null;
 const le=fl[33],re=fl[263],no=fl[1],ch=fl[152],fo=fl[10];
 const fw=Math.abs(le.x-re.x)+1e-4,fh=Math.abs(ch.y-fo.y)+1e-4;
 HP.h.push({t,yaw:(no.x-(le.x+re.x)/2)/fw,pit:(no.y-(le.y+re.y)/2)/fh});
 while(HP.h.length&&t-HP.h[0].t>1400)HP.h.shift();
 if(HP.h.length<6||t<HP.cool)return null;
 const my=HP.h.reduce((s,q)=>s+q.yaw,0)/HP.h.length,mp=HP.h.reduce((s,q)=>s+q.pit,0)/HP.h.length;
 const flips=(k,m,th)=>{let s=0,prev=0;for(const q of HP.h){const d=q[k]-m;
  const sg=d>th?1:d<-th?-1:0;if(sg){if(prev&&sg!==prev)s++;prev=sg}}return s};
 const fY=flips('yaw',my,.07),fP=flips('pit',mp,.045);
 HP.cool=t+1600;const r=fY>=2?'SHAKE':fP>=2?'NOD':null;if(r)HP.h=[];return r}
function smoothHands(LM){if(!LM||LM.length!==smooth.length)smooth=[];
 return(LM||[]).map((lm,hi)=>{const vw=vidEl?vidEl.videoWidth:640,vh=vidEl?vidEl.videoHeight:480;
  const s=Math.max(cv.width/vw,cv.height/vh);
  const raw=lm.map(q=>({x:cv.width-((cv.width-vw*s)/2+q.x*vw*s),y:(cv.height-vh*s)/2+q.y*vh*s}));
  if(!smooth[hi])smooth[hi]=raw.map(q=>({...q}));
  const pts=raw.map((q,i)=>({x:smooth[hi][i].x+(q.x-smooth[hi][i].x)*.55,y:smooth[hi][i].y+(q.y-smooth[hi][i].y)*.55}));
  smooth[hi]=pts.map(q=>({...q}));return pts})}
function skeleton(p){ctx.strokeStyle='rgba(0,255,238,.45)';ctx.lineWidth=1;ctx.beginPath();
 CONN.forEach(([a,b])=>{ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y)});ctx.stroke();
 ctx.fillStyle='#fff';p.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill()})}
function renderFrame(H,G,t,headE){ctx.clearRect(0,0,cv.width,cv.height);
 lastH=H||[];lastG=G||[];lastHead=headE||null;
 if(S.opt.skeleton)lastH.forEach(skeleton);
 if(S.opt.holo){ctx.save();ctx.globalAlpha=.14+.06*Math.sin(t/70);ctx.fillStyle='#0ff';
  for(let y=0;y<cv.height;y+=3)ctx.fillRect(0,y,cv.width,1);
  ctx.globalAlpha=.08;ctx.fillRect(0,0,cv.width,cv.height);ctx.restore()}
 if(t>toastT)toastEl.classList.remove('on')}
function resize(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener('resize',resize);resize();
return{S,gesture,headEvt,smoothHands,renderFrame,toast,setVid:v=>{vidEl=v},
 getHands:()=>({H:lastH,G:lastG}),getHead:()=>lastHead};
})();
(()=>{
const $=s=>document.querySelector(s);
const vid=$('#vid'),home=$('#home'),stat=$('#stat');
const TV='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MH='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MF='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let HL=null,FL=null,flTried=false,lastH=null,lastF=null,fNew=false,eng='none',tick=0;
async function vision(){const v=await import(TV);return{v,fs:await v.FilesetResolver.forVisionTasks(TV+'/wasm')}}
async function mkH(d){const{v,fs}=await vision();return v.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MH,delegate:d},runningMode:'VIDEO',numHands:2})}
async function mkF(d){const{v,fs}=await vision();return v.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MF,delegate:d},runningMode:'VIDEO',numFaces:1})}
const go=async()=>{try{
  stat.textContent='📷 camera...';
  const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  vid.srcObject=st;await vid.play();FX.setVid(vid);
  stat.textContent='🧠 hand model load...';
  try{HL=await mkH('GPU');eng='GPU'}catch(e){HL=await mkH('CPU');eng='CPU'}
  home.style.display='none';
  if(window.PROJ)window.PROJ.startSession();
  FX.toast('🎥 camera + hand engine ON ('+eng+') — 📁 = projects');
  detectLoop();
 }catch(e){const m=e.name==='NotAllowedError'?'camera permission allow karo (site settings)':e.message;
  stat.textContent='❌ '+m;FX.toast('❌ '+m)}};
$('#camBtn').onclick=go;
async function detectLoop(){while(true){const t=performance.now();
 if(vid.readyState>=2&&HL){try{lastH=HL.detectForVideo(vid,t)}catch(e){}
  if(FX.S.opt.head){tick++;if(tick%4===0){try{
   if(!FL&&!flTried){flTried=true;try{FL=await mkF('GPU')}catch(e){try{FL=await mkF('CPU')}catch(e2){}}}
   if(FL){lastF=FL.detectForVideo(vid,t);fNew=true}}catch(e){}}}
 }
 await new Promise(r=>setTimeout(r,20))}}
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
(function loop(t){const H=FX.smoothHands(lastH&&lastH.landmarks);const G=H.map(FX.gesture);
 let headE=null;if(fNew){headE=FX.headEvt(lastF&&lastF.faceLandmarks&&lastF.faceLandmarks[0],t||0);fNew=false}
 FX.renderFrame(H,G,t||0,headE);
 if(H.length)handSeen=true;
 wT+=16;if(wT>7000){wT=0;
  if(!HL)FX.toast('🧠 hand model load nahi — net check / reload');
  else if(!handSeen)FX.toast('🖐 haath camera me dikhao (20-30 cm)')}
 requestAnimationFrame(loop)})();
window.APP1_OK=true;
})();
