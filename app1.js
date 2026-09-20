/* app1.js v12 — canvas-feed detection (har device pe), auto CPU fallback, pause-fix */
const FX=(()=>{
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),wrap=document.getElementById('wrap'),toastEl=document.getElementById('toast');
const S={opt:{skeleton:true,holo:false,perf:false,head:true}};
let smooth=[],smoothW=[],toastT=0,vidEl=null,lastH=[],lastG=[],lastHead=null;
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
const FING=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
const SUB=[0,1,2,5,6,9,10,13,14,17,18];
const FILL='rgba(8,20,40,.55)',BACK='rgba(110,190,255,.18)',RING='rgba(150,225,255,.5)',
 FGLOW='rgba(0,170,255,.25)',FRONT='rgba(215,246,255,.95)',RIM='rgba(140,220,255,.75)',WMID='rgba(175,232,255,.7)';
const BACKA=[Math.PI*1.2,Math.PI*1.5,Math.PI*1.8],FRONTA=[Math.PI*.2,Math.PI*.5,Math.PI*.8];
function gesture(p){const f=FING.map(x=>D(p[x[3]],p[0])>D(p[x[1]],p[0])*1.12);const n=f.filter(Boolean).length;
 if(D(p[4],p[8])<D(p[0],p[9])*.5&&n<=1)return'PINCH';
 if(f[0]&&f[1]&&!f[2]&&!f[3])return'PEACE';
 if(n>=4)return'PALM';if(n===0)return'FIST';return'POINT'}
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');toastT=performance.now()+2200}
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
  let spd=0;for(let i=0;i<raw.length;i+=3)spd+=Math.hypot(raw[i].x-smooth[hi][i].x,raw[i].y-smooth[hi][i].y);
  spd/=7;
  const a=Math.max(.32,Math.min(.85,.32+spd*.05));
  const pts=raw.map((q,i)=>({x:smooth[hi][i].x+(q.x-smooth[hi][i].x)*a,y:smooth[hi][i].y+(q.y-smooth[hi][i].y)*a}));
  smooth[hi]=pts.map(q=>({...q}));return pts})}
function setWorld(LW){if(!LW||LW.length!==smoothW.length)smoothW=[];
 (LW||[]).forEach((w,hi)=>{if(!smoothW[hi])smoothW[hi]=w.map(q=>({...q}));
  smoothW[hi]=w.map((q,i)=>({x:smoothW[hi][i].x+(q.x-smoothW[hi][i].x)*.5,
   y:smoothW[hi][i].y+(q.y-smoothW[hi][i].y)*.5,z:smoothW[hi][i].z+(q.z-smoothW[hi][i].z)*.5}))})}
function inv3(m){const[a,b,c,d,e,f,g,h,i]=m;
 const A=e*i-f*h,B=-(d*i-f*g),C2=d*h-e*g,det=a*A+b*B+c*C2;
 if(!isFinite(det)||Math.abs(det)<1e-12)return null;
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
 const eps=(A[0]+A[4]+A[8])/3*1e-3+1e-9;
 A[0]+=eps;A[4]+=eps;A[8]+=eps;
 const Ai=inv3(A);if(!Ai)return null;
 const r1=[B[0]*Ai[0]+B[1]*Ai[3]+B[2]*Ai[6],B[0]*Ai[1]+B[1]*Ai[4]+B[2]*Ai[7],B[0]*Ai[2]+B[1]*Ai[5]+B[2]*Ai[8]];
 const r2=[B[3]*Ai[0]+B[4]*Ai[3]+B[5]*Ai[6],B[3]*Ai[1]+B[4]*Ai[4]+B[5]*Ai[7],B[3]*Ai[2]+B[4]*Ai[5]+B[5]*Ai[8]];
 let r3=[r1[1]*r2[2]-r1[2]*r2[1],r1[2]*r2[0]-r1[0]*r2[2],r1[0]*r2[1]-r1[1]*r2[0]];
 const L=Math.hypot(r3[0],r3[1],r3[2]);if(L<1e-6)return null;
 r3=[r3[0]/L,r3[1]/L,r3[2]/L];
 const out=[];
 for(let i=0;i<21;i++)out.push(-((w[i].x-wx)*r3[0]+(w[i].y-wy)*r3[1]+(w[i].z-wz)*r3[2]));
 return out}
function skeleton(p){ctx.strokeStyle='rgba(0,255,238,.6)';ctx.lineWidth=1.4;ctx.beginPath();
 CONN.forEach(([a,b])=>{ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y)});ctx.stroke();
 ctx.fillStyle='#eaffff';p.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.4,0,7);ctx.fill()})}
function tubeG(A,B,rA,rB){const dx=B.x-A.x,dy=B.y-A.y,L2=Math.hypot(dx,dy)||1;
 return{A,B,rA,rB,ux:dx/L2,uy:dy/L2,nx:-dy/L2,ny:dx/L2,ang:Math.atan2(dy,dx)}}
function wp(g,tt,th){const r=g.rA+(g.rB-g.rA)*tt,ca=Math.cos(th),sa=Math.sin(th)*.4;
 return{x:g.A.x+(g.B.x-g.A.x)*tt+g.nx*r*ca+g.ux*r*sa,
        y:g.A.y+(g.B.y-g.A.y)*tt+g.ny*r*ca+g.uy*r*sa}}
function wire(g,th){const a=wp(g,0,th),m=wp(g,.5,th),b=wp(g,1,th);
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(m.x,m.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function sil(g){const q=[wp(g,0,0),wp(g,1,0),wp(g,1,Math.PI),wp(g,0,Math.PI)];
 ctx.moveTo(q[0].x,q[0].y);ctx.lineTo(q[1].x,q[1].y);ctx.lineTo(q[2].x,q[2].y);ctx.lineTo(q[3].x,q[3].y);ctx.closePath()}
function silStroke(g){ctx.beginPath();sil(g);ctx.stroke()}
function ringAt(P,ang,r){ctx.beginPath();ctx.ellipse(P.x,P.y,r,Math.max(1,r*.4),ang,0,7);ctx.stroke()}
function tubeDraw(g,tip,rTip){
 ctx.strokeStyle=BACK;ctx.lineWidth=1;BACKA.forEach(th=>wire(g,th));
 ctx.beginPath();sil(g);ctx.fillStyle=FILL;ctx.fill();
 ctx.strokeStyle=RING;ctx.lineWidth=1;ringAt(g.A,g.ang,g.rA);ringAt(g.B,g.ang,g.rB);
 if(tip){ctx.beginPath();ctx.arc(tip.x,tip.y,Math.max(2,rTip*.95),0,7);ctx.stroke()}
 ctx.strokeStyle=FGLOW;ctx.lineWidth=3;FRONTA.forEach(th=>wire(g,th));
 ctx.strokeStyle=FRONT;ctx.lineWidth=1.2;FRONTA.forEach(th=>wire(g,th));
 ctx.strokeStyle=RIM;ctx.lineWidth=1.2;silStroke(g)}
function holoHand2D(p,t,w){
 const L=D(p[0],p[9])||1,Wd=D(p[5],p[17])||1;
 const dps=w?fitAll(p,w):null;
 const ring=[0,1,5,9,13,17];
 const palmD=dps?ring.reduce((s,i)=>s+dps[i],0)/6:0;
 const C={x:0,y:0};ring.forEach(i=>{C.x+=p[i].x;C.y+=p[i].y});C.x/=6;C.y/=6;
 const parts=[];
 parts.push({d:palmD,draw:()=>{
  ctx.beginPath();
  for(let k=0;k<6;k++){const a=p[ring[k]],b=p[ring[(k+1)%6]];
   ctx.moveTo(C.x,C.y);ctx.lineTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.closePath()}
  ctx.fillStyle=FILL;ctx.fill();
  ctx.strokeStyle=WMID;ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(p[ring[0]].x,p[ring[0]].y);
  for(let k=1;k<6;k++)ctx.lineTo(p[ring[k]].x,p[ring[k]].y);ctx.closePath();ctx.stroke();
  ctx.beginPath();ring.forEach((i,k)=>{const q={x:C.x+(p[i].x-C.x)*.55,y:C.y+(p[i].y-C.y)*.55};
   k?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.closePath();ctx.stroke();
  ctx.strokeStyle=RIM;ctx.lineWidth=1.2;
  ctx.beginPath();ctx.moveTo(p[ring[0]].x,p[ring[0]].y);
  for(let k=1;k<6;k++)ctx.lineTo(p[ring[k]].x,p[ring[k]].y);ctx.closePath();ctx.stroke()}});
 const dxw=(p[0].x-p[9].x)/L,dyw=(p[0].y-p[9].y)/L;
 const W1={x:p[0].x+dxw*L*.14,y:p[0].y+dyw*L*.14};
 const W2={x:p[0].x+dxw*L*.44,y:p[0].y+dyw*L*.44};
 const d0=dps?dps[0]:0;
 parts.push({d:d0-.004,draw:()=>tubeDraw(tubeG(p[0],W1,Wd*.24,Wd*.22))});
 parts.push({d:d0+.010,draw:()=>tubeDraw(tubeG(W1,W2,Wd*.22,Wd*.26))});
 const F=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
 F.forEach((f,fi)=>{const th=(fi===0?.085:.068)*Wd;
  let rest=0;for(let k=0;k<3;k++)rest+=w?Math.hypot(w[f[k+1]].x-w[f[k]].x,w[f[k+1]].y-w[f[k]].y,w[f[k+1]].z-w[f[k]].z):D(p[f[k]],p[f[k+1]]);
  const tipDist=w?Math.hypot(w[f[3]].x-w[f[0]].x,w[f[3]].y-w[f[0]].y,w[f[3]].z-w[f[0]].z):D(p[f[3]],p[f[0]]);
  const folded=tipDist<rest*.62;
  for(let k=0;k<3;k++){const g=tubeG(p[f[k]],p[f[k+1]],th*(1-k*.15),th*(1-(k+1)*.15));
   const dm=dps?(dps[f[k]]+dps[f[k+1]])/2:0;
   const hidden=folded&&dps&&dm>palmD+.008;
   if(!hidden)parts.push({d:dm,draw:()=>tubeDraw(g,k===2?p[f[3]]:null,th*(1-(k+1)*.15))})}});
 parts.sort((a,b)=>b.d-a.d);
 ctx.save();ctx.globalAlpha=.95;ctx.lineJoin='round';
 parts.forEach(pt=>pt.draw());
 ctx.restore()}
function renderFrame(H,G,t,headE){ctx.clearRect(0,0,cv.width,cv.height);
 lastH=H||[];lastG=G||[];lastHead=headE||null;
 const mode=(window.MES&&MES.S.handMode)||'skeleton';
 lastH.forEach((p,hi)=>{const w=smoothW[hi];const ww=(w&&w.length===21)?w:null;
  if(mode==='skeleton')skeleton(p);
  else if(mode==='hologram')holoHand2D(p,t,ww);
  else{skeleton(p);holoHand2D(p,t,ww)}});
 if(S.opt.holo){ctx.save();ctx.globalAlpha=.12;ctx.fillStyle='#0ff';
  for(let y=0;y<cv.height;y+=4)ctx.fillRect(0,y,cv.width,1);ctx.restore()}
 if(t>toastT)toastEl.classList.remove('on')}
function resize(){cv.width=innerWidth;cv.height=innerHeight}
addEventListener('resize',resize);resize();
return{S,gesture,headEvt,smoothHands,setWorld,renderFrame,toast,setVid:v=>{vidEl=v},
 getHands:()=>({H:lastH,G:lastG}),getHead:()=>lastHead};
})();
(()=>{
const $=s=>document.querySelector(s);
const vid=$('#vid'),home=$('#home'),stat=$('#stat'),hud=$('#hud');
const TV='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MH='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const MF='https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
let HL=null,FL=null,flTried=false,lastH=null,lastW=null,lastF=null,fNew=false,eng='none',tick=0,lastHandT=0;
let detErr='',detFail=0,fps=60,prevT=0,emptyN=0,cpuTried=false;
const dcan=document.createElement('canvas');dcan.width=640;dcan.height=480;
const dctx=dcan.getContext('2d',{willReadFrequently:false});
addEventListener('touchstart',()=>{vid.play().catch(()=>{})},{once:true});
async function vision(){const v=await import(TV);return{v,fs:await v.FilesetResolver.forVisionTasks(TV+'/wasm')}}
async function mkH(d){const{v,fs}=await vision();return v.HandLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MH,delegate:d},runningMode:'VIDEO',numHands:2})}
async function mkF(d){const{v,fs}=await vision();return v.FaceLandmarker.createFromOptions(fs,{baseOptions:{modelAssetPath:MF,delegate:d},runningMode:'VIDEO',numFaces:1})}
async function loadHL(){try{HL=await mkH('GPU');eng='GPU';detFail=0;detErr='';return true}
 catch(e){try{HL=await mkH('CPU');eng='CPU';detFail=0;detErr='';return true}
  catch(e2){detErr=(e2.message||'net/model?').slice(0,50);return false}}}
const go=async()=>{try{
  stat.textContent='📷 camera...';
  const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  vid.srcObject=st;await vid.play();FX.setVid(vid);
  home.style.display='none';
  stat.textContent='🧠 hand model load...';
  let ok=await loadHL(),tries=0;
  while(!ok){tries++;FX.toast('🧠 model load fail #'+tries+' — 4s me retry ['+detErr+']');
   await new Promise(r=>setTimeout(r,4000));ok=await loadHL()}
  FX.toast('🧠 hand model ON ('+eng+') — canvas-feed detect');
  if(window.PROJ)window.PROJ.startSession();
  if(window.MES&&MES.S.focus&&window.SCENE3D)SCENE3D.setFocus(true);
  detectLoop();
 }catch(e){const m=e.name==='NotAllowedError'?'camera permission allow karo (site settings)':e.message;
  stat.textContent='❌ '+m;FX.toast('❌ '+m)}};
$('#camBtn').onclick=go;
async function detectLoop(){while(true){
 if(document.hidden){await new Promise(r=>setTimeout(r,500));continue}
 const t=performance.now();
 const idle=t-lastHandT>6000;
 if(vid.readyState>=2&&HL&&!idle){
  if(vid.paused)vid.play().catch(()=>{});
  try{dctx.drawImage(vid,0,0,640,480);
   lastH=HL.detectForVideo(dcan,t);lastW=lastH.worldLandmarks||null;detFail=0;
   if(lastH.landmarks&&lastH.landmarks.length){lastHandT=t;emptyN=0}
   else{emptyN++;
    if(emptyN>150&&!cpuTried&&eng==='GPU'){cpuTried=true;FX.toast('🧠 GPU khali result de raha — CPU pe switch');
     try{HL=await mkH('CPU');eng='CPU';emptyN=0}catch(e2){detErr=(e2.message||'').slice(0,50)}}}
  }catch(e){detFail++;detErr=(e.message||'').slice(0,50);
   if(detFail>20){detFail=0;const nx=eng==='GPU'?'CPU':'GPU';
    FX.toast('🧠 detect crash — engine '+eng+'→'+nx);
    (async()=>{try{HL=await mkH(nx);eng=nx;detErr=''}catch(e2){HL=null;detErr=(e2.message||'').slice(0,50)}})()}}
  if(FX.S.opt.head){tick++;if(tick%8===0){try{
   if(!FL&&!flTried){flTried=true;try{FL=await mkF('GPU')}catch(e){try{FL=await mkF('CPU')}catch(e2){}}}
   if(FL){dctx.drawImage(vid,0,0,640,480);lastF=FL.detectForVideo(dcan,t);fNew=true}}catch(e){}}}
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
(function loop(t){const dt=t-prevT||16;prevT=t;fps=fps*.9+(1000/dt)*.1;
 FX.setWorld(lastW);
 const H=FX.smoothHands(lastH&&lastH.landmarks);const G=H.map(FX.gesture);
 let headE=null;if(fNew){headE=FX.headEvt(lastF&&lastF.faceLandmarks&&lastF.faceLandmarks[0],t||0);fNew=false}
 FX.renderFrame(H,G,t||0,headE);
 if(H.length)handSeen=true;
 wT+=16;if(wT>8000){wT=0;
  if(!HL)FX.toast('🧠 model load nahi hua — retry ['+detErr+']');
  else if(!handSeen)FX.toast('ontouchstart'in window?'🖐 haath camera me dikhao — phone seedha (portrait) rakho':'🖐 haath camera me dikhao (20-30 cm)')}
 if(hud)hud.textContent='FPS '+(fps|0)+' • HANDS '+H.length+' • ENG '+eng+
  (emptyN>30?' • EMPTY '+emptyN:'')+(detErr?' ❌'+detErr:' ✔');
 requestAnimationFrame(loop)})();
window.APP1_OK=true;
})();
