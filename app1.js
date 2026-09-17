/* app1.js v7 — stable smoothed 3D hand data + skeleton only (3D hand = studio3d rig) */
const FX=(()=>{
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),wrap=document.getElementById('wrap'),toastEl=document.getElementById('toast');
const S={opt:{skeleton:true,holo:false,perf:false,head:true}};
let smooth=[],smoothW=[],smoothD=[],hand3D=[null,null],toastT=0,vidEl=null,lastH=[],lastG=[],lastHead=null,lastW=null;
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const FING=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
const SUB=[0,1,2,5,6,9,10,13,14,17,18];
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
  const pts=raw.map((q,i)=>({x:smooth[hi][i].x+(q.x-smooth[hi][i].x)*.72,y:smooth[hi][i].y+(q.y-smooth[hi][i].y)*.72}));
  smooth[hi]=pts.map(q=>({...q}));return pts})}
function setWorld(LW){if(!LW||LW.length!==smoothW.length)smoothW=[];
 (LW||[]).map((w,hi)=>{if(!smoothW[hi])smoothW[hi]=w.map(q=>({...q}));
  smoothW[hi]=w.map((q,i)=>({x:smoothW[hi][i].x+(q.x-smoothW[hi][i].x)*.7,
   y:smoothW[hi][i].y+(q.y-smoothW[hi][i].y)*.7,z:smoothW[hi][i].z+(q.z-smoothW[hi][i].z)*.7}))})}
function inv3(m){const[a,b,c,d,e,f,g,h,i]=m;
 const A=e*i-f*h,B=-(d*i-f*g),C2=d*h-e*g,det=a*A+b*B+c*C2;
 if(!isFinite(det)||Math.abs(det)<1e-9)return null;
 return[A/det,B/det,C2/det,-(b*i-c*h)/det,(a*i-c*g)/det,-(a*h-b*g)/det,
  (b*f-c*e)/det,-(a*f-c*d)/det,(a*e-b*d)/det]}
function fitAll(p,w){const n=SUB.length;
 let cx=0,cy=0,wx=0,wy=0,wz=0;
 for(let i=0;i<n;i++){const P=p[SUB[i]],W=w[SUB[i]];cx+=P.x;cy+=P.y;wx+=W.x;wy+=W.y;wz+=W.z}
 cx/=n;cy/=n;wx/=n;wy/=n;wz/=n;
 const A=[0,0,0,0,0,0,0,0,0],B=[0,0,0,0,0,0];
 for(let i=0;i<n;i++){const W=w[SUB[i]],P=p[SUB[i]];
  const X=W.x-wx,Y=W.y-wy,Z=W.z-wz,sx=P.x-cx,sy=P.y-cy;
  A[0]+=X*X;A[1]+=X*Y;A[2]+=X*Z;A[4]+=Y*Y;A[5]+=Y*Z;A[8]+=Z*Z;
  B[0]+=sx*X;B[1]+=sx*Y;B[2]+=sx*Z;B[3]+=sy*X;B[4]+=sy*Y;B[5]+=sy*Z}
 A[3]=A[1];A[6]=A[2];A[7]=A[5];
 const Ai=inv3(A);if(!Ai)return null;
 const r1=[B[0]*Ai[0]+B[1]*Ai[3]+B[2]*Ai[6],B[0]*Ai[1]+B[1]*Ai[4]+B[2]*Ai[7],B[0]*Ai[2]+B[1]*Ai[5]+B[2]*Ai[8]];
 const r2=[B[3]*Ai[0]+B[4]*Ai[3]+B[5]*Ai[6],B[3]*Ai[1]+B[4]*Ai[4]+B[5]*Ai[7],B[3]*Ai[2]+B[4]*Ai[5]+B[5]*Ai[8]];
 let r3=[r1[1]*r2[2]-r1[2]*r2[1],r1[2]*r2[0]-r1[0]*r2[2],r1[0]*r2[1]-r1[1]*r2[0]];
 const L=Math.hypot(r3[0],r3[1],r3[2]);if(L<1e-6)return null;
 r3=[r3[0]/L,r3[1]/L,r3[2]/L];
 const out=[];
 for(let i=0;i<21;i++)out.push(-((w[i].x-wx)*r3[0]+(w[i].y-wy)*r3[1]+(w[i].z-wz)*r3[2]));
 return out}
function skeleton(p){ctx.strokeStyle='rgba(0,255,238,.45)';ctx.lineWidth=1;ctx.beginPath();
 CONN.forEach(([a,b])=>{ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y)});ctx.stroke();
 ctx.fillStyle='#fff';p.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill()})}
function renderFrame(H,G,t,headE){ctx.clearRect(0,0,cv.width,cv.height);
 lastH=H||[];lastG=G||[];lastHead=headE||null;
 const mode=(window.MES&&MES.S.handMode)||'skeleton';
 lastH.forEach((p,hi)=>{
  const w=smoothW[hi];
  if(w&&w.length===21){const dRaw=fitAll(p,w);
   if(dRaw){if(!smoothD[hi]||smoothD[hi].length!==21)smoothD[hi]=dRaw.slice();
    smoothD[hi]=dRaw.map((v,i)=>Math.max(-.12,Math.min(.12,smoothD[hi][i]+(v-smoothD[hi][i])*.5)));
    hand3D[hi]=p.map((q,i)=>({x:q.x,y:q.y,d:smoothD[hi][i]}))}else hand3D[hi]=null;
  }else hand3D[hi]=null;
  if(mode!=='hologram')skeleton(p)});
 if(S.opt.holo){ctx.save();ctx.globalAlpha=.12;ctx.fillStyle='#0ff';
  for(let y=0;y<cv.height;y+=4)ctx.fillRect(0,y,cv.width,1);ctx.restore()}
 if(t>toastT)toastEl.classList.remove('on')}
function resize(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener('resize',resize);resize();
return{S,gesture,headEvt,smoothHands,setWorld,renderFrame,toast,setVid:v=>{vidEl=v},
 getHand3D:i=>hand3D[i]||null,
 getHands:()=>({H:lastH,G:lastG}),getHead:()=>lastHead};
})();
(()=>{
const $=s=>document.querySelector(s);
const vid=$('#vid'),home=$('#home'),stat=$('#stat');
const TV='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MH='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MF='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let HL=null,FL=null,flTried=false,lastH=null,lastW=null,lastF=null,fNew=false,eng='none',tick=0,lastHandT=0;
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
  if(window.MES&&MES.S.focus&&window.SCENE3D)SCENE3D.setFocus(true);
  FX.toast('🎥 camera + TRUE-3D hand engine ON ('+eng+')');
  detectLoop();
 }catch(e){const m=e.name==='NotAllowedError'?'camera permission allow karo (site settings)':e.message;
  stat.textContent='❌ '+m;FX.toast('❌ '+m)}};
$('#camBtn').onclick=go;
async function detectLoop(){while(true){
 if(document.hidden){await new Promise(r=>setTimeout(r,500));continue}
 const t=performance.now();
 const idle=t-lastHandT>10000;
 if(vid.readyState>=2&&HL&&!idle){
  try{lastH=HL.detectForVideo(vid,t);lastW=lastH.worldLandmarks||null;
   if(lastH.landmarks&&lastH.landmarks.length)lastHandT=t}catch(e){}
  if(FX.S.opt.head){tick++;if(tick%8===0){try{
   if(!FL&&!flTried){flTried=true;try{FL=await mkF('GPU')}catch(e){try{FL=await mkF('CPU')}catch(e2){}}}
   if(FL){lastF=FL.detectForVideo(vid,t);fNew=true}}catch(e){}}}
 }
 await new Promise(r=>setTimeout(r,idle?100:33))}}
document.querySelectorAll('#menu input').forEach(i=>{FX.S.opt[i.dataset.o]=i.checked;
 i.onchange=()=>{FX.S.opt[i.dataset.o]=i.checked}});
$('#bClear').onclick=()=>{window.SCENE3D.exec({op:'clear'});FX.toast('🧹 sab 3D objects saaf')};
$('#bSave').onclick=()=>{const c=document.createElement('canvas');
 c.width=vid.videoWidth||1280;c.height=vid.videoHeight||720;
 const x=c.getContext('2d');
 if(!MES.S.focus)x.drawImage(vid,0,0,c.width,c.height);
 else{x.fillStyle='#04060a';x.fillRect(0,0,c.width,c.height)}
 x.drawImage(document.getElementById('cv3'),0,0,c.width,c.height);
 x.drawImage(document.getElementById('cv'),0,0,c.width,c.height);
 c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);
  a.download='m-edgespace-'+Date.now()+'.png';a.click();FX.toast('📸 photo save')})};
let handSeen=false,wT=0;
(function loop(t){FX.setWorld(lastW);
 const H=FX.smoothHands(lastH&&lastH.landmarks);const G=H.map(FX.gesture);
 let headE=null;if(fNew){headE=FX.headEvt(lastF&&lastF.faceLandmarks&&lastF.faceLandmarks[0],t||0);fNew=false}
 FX.renderFrame(H,G,t||0,headE);
 if(H.length)handSeen=true;
 wT+=16;if(wT>7000){wT=0;
  if(!HL)FX.toast('🧠 hand model load nahi — net check / reload');
  else if(!handSeen)FX.toast('🖐 haath camera me dikhao (20-30 cm)')}
 requestAnimationFrame(loop)})();
window.APP1_OK=true;
})();
