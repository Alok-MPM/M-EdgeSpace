/* app1.js v5 — solid wireframe hologram hand: occlusion + connected + rounded + fast */
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
  const pts=raw.map((q,i)=>({x:smooth[hi][i].x+(q.x-smooth[hi][i].x)*.72,y:smooth[hi][i].y+(q.y-smooth[hi][i].y)*.72}));
  smooth[hi]=pts.map(q=>({...q}));return pts})}
function skeleton(p){ctx.strokeStyle='rgba(0,255,238,.45)';ctx.lineWidth=1;ctx.beginPath();
 CONN.forEach(([a,b])=>{ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y)});ctx.stroke();
 ctx.fillStyle='#fff';p.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill()})}
/* --- tube geometry --- */
function tubeG(A,B,rA,rB){const dx=B.x-A.x,dy=B.y-A.y,L2=Math.hypot(dx,dy)||1;
 return{A,B,rA,rB,ux:dx/L2,uy:dy/L2,nx:-dy/L2,ny:dx/L2,ang:Math.atan2(dy,dx)}}
function wp(g,tt,th){const r=g.rA+(g.rB-g.rA)*tt,ca=Math.cos(th),sa=Math.sin(th)*.4;
 return{x:g.A.x+(g.B.x-A2(g).x)*0+ (g.B.x-g.A.x)*tt+g.nx*r*ca+g.ux*r*sa,
        y:g.A.y+(g.B.y-g.A.y)*tt+g.ny*r*ca+g.uy*r*sa}}
function A2(g){return g.A}
function wire(g,th){const a=wp(g,0,th),m=wp(g,.5,th),b=wp(g,1,th);
 ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(m.x,m.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function sil(g){const q=[wp(g,0,0),wp(g,1,0),wp(g,1,Math.PI),wp(g,0,Math.PI)];
 ctx.moveTo(q[0].x,q[0].y);ctx.lineTo(q[1].x,q[1].y);ctx.lineTo(q[2].x,q[2].y);ctx.lineTo(q[3].x,q[3].y);ctx.closePath()}
function silStroke(g){const q=[wp(g,0,0),wp(g,1,0),wp(g,1,Math.PI),wp(g,0,Math.PI)];
 ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);ctx.lineTo(q[1].x,q[1].y);ctx.lineTo(q[2].x,q[2].y);ctx.lineTo(q[3].x,q[3].y);ctx.closePath();ctx.stroke()}
function ringAt(P,ang,r){ctx.beginPath();ctx.ellipse(P.x,P.y,r,Math.max(1,r*.4),ang,0,7);ctx.stroke()}
const BACK=[Math.PI*1.2,Math.PI*1.5,Math.PI*1.8],FRONT=[Math.PI*.2,Math.PI*.5,Math.PI*.8];
function holoHand(p,t){
 const L=D(p[0],p[9])||1,Wd=D(p[5],p[17])||1;
 const fl=.85+.15*Math.sin(t/110+p[0].x%7);
 ctx.save();ctx.globalAlpha=fl;ctx.lineJoin='round';
 /* palm grid (wrist se knuckles tak, connected) */
 const axx=(p[9].x-p[0].x)/L,axy=(p[9].y-p[0].y)/L,n0x=-axy,n0y=axx;
 const E=[p[5],p[9],p[13],p[17]];
 const topAt=u=>{const f=u*3,i=Math.max(0,Math.min(2,Math.floor(f))),w=f-i;
  return{x:E[i].x+(E[i+1].x-E[i].x)*w,y:E[i].y+(E[i+1].y-E[i].y)*w}};
 const US=[-0.12,0,1/3,2/3,1,1.12],rows=5,grid=[];
 for(let r=0;r<rows;r++){const tt=r/(rows-1),row=[];
  for(let c=0;c<US.length;c++){
   const lat=(US[c]-0.5)*2*Wd*.30;
   const bot={x:p[0].x+n0x*lat,y:p[0].y+n0y*lat};
   const top=topAt(US[c]);
   let x=bot.x+(top.x-bot.x)*tt,y=bot.y+(top.y-bot.y)*tt;
   const b=(US[c]-0.5)*Wd*.14*Math.sin(Math.PI*tt);
   x+=n0x*b;y+=n0y*b;row.push({x,y})}
  grid.push(row)}
 /* tubes: fingers + thumb-connector + wrist/forearm */
 const tubes=[],rings=[];
 const F=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
 F.forEach((f,fi)=>{const th=fi===0?Wd*.115:Wd*.095;
  for(let k=0;k<3;k++){const g=tubeG(p[f[k]],p[f[k+1]],th*(1-k*.16),th*(1-(k+1)*.16));
   tubes.push(g);rings.push([p[f[k]],g.ang,g.rA])}
  const gl=tubes[tubes.length-1];rings.push([p[f[3]],gl.ang,gl.rB]);
  rings.push(['tip',p[f[3]],gl.rB])});
 tubes.push(tubeG(grid[1][0],p[1],Wd*.10,Wd*.115));
 const dxw=(p[0].x-p[9].x)/L,dyw=(p[0].y-p[9].y)/L;
 const W1={x:p[0].x+dxw*L*.16,y:p[0].y+dyw*L*.16};
 const W2={x:p[0].x+dxw*L*.52,y:p[0].y+dyw*L*.52};
 tubes.push(tubeG(p[0],W1,Wd*.30,Wd*.27));rings.push([p[0],Math.atan2(dyw,dxw),Wd*.30]);
 tubes.push(tubeG(W1,W2,Wd*.27,Wd*.34));rings.push([W1,Math.atan2(dyw,dxw),Wd*.27]);
 /* PASS 1: back wires (dhundhle) */
 ctx.strokeStyle='rgba(110,190,255,.20)';ctx.lineWidth=1;
 tubes.forEach(g=>BACK.forEach(th=>wire(g,th)));
 /* PASS 2: solid silhouette fill (occlusion) */
 ctx.beginPath();tubes.forEach(sil);
 ctx.moveTo(grid[0][0].x,grid[0][0].y);
 for(let r=1;r<rows;r++)ctx.lineTo(grid[r][0].x,grid[r][0].y);
 for(let c=1;c<US.length;c++)ctx.lineTo(grid[rows-1][c].x,grid[rows-1][c].y);
 for(let r=rows-2;r>=0;r--)ctx.lineTo(grid[r][US.length-1].x,grid[r][US.length-1].y);
 ctx.closePath();ctx.fillStyle='rgba(6,14,28,.86)';ctx.fill();
 /* PASS 3: joint rings */
 ctx.strokeStyle='rgba(150,225,255,.5)';ctx.lineWidth=1;
 rings.forEach(r=>{if(r[0]==='tip'){ctx.beginPath();ctx.arc(r[1].x,r[1].y,r[2]*.95,0,7);ctx.stroke()}
  else ringAt(r[0],r[1],r[2])});
 /* PASS 4: palm surface mesh */
 ctx.strokeStyle='rgba(175,232,255,.7)';
 for(let r=0;r<rows;r++){ctx.beginPath();grid[r].forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke()}
 for(let c=0;c<US.length;c++){ctx.beginPath();for(let r=0;r<rows;r++){const q=grid[r][c];r?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}ctx.stroke()}
 /* PASS 5: front wires (bright double-stroke) */
 ctx.strokeStyle='rgba(0,170,255,.28)';ctx.lineWidth=3;
 tubes.forEach(g=>FRONT.forEach(th=>wire(g,th)));
 ctx.strokeStyle='rgba(215,246,255,.95)';ctx.lineWidth=1.2;
 tubes.forEach(g=>FRONT.forEach(th=>wire(g,th)));
 /* PASS 6: rim silhouette */
 ctx.strokeStyle='rgba(140,220,255,.75)';ctx.lineWidth=1.2;
 tubes.forEach(silStroke);
 ctx.beginPath();ctx.moveTo(grid[0][0].x,grid[0][0].y);
 for(let r=1;r<rows;r++)ctx.lineTo(grid[r][0].x,grid[r][0].y);
 for(let c=1;c<US.length;c++)ctx.lineTo(grid[rows-1][c].x,grid[rows-1][c].y);
 for(let r=rows-2;r>=0;r--)ctx.lineTo(grid[r][US.length-1].x,grid[r][US.length-1].y);
 ctx.closePath();ctx.stroke();
 ctx.restore()}
function renderFrame(H,G,t,headE){ctx.clearRect(0,0,cv.width,cv.height);
 lastH=H||[];lastG=G||[];lastHead=headE||null;
 const mode=(window.MES&&MES.S.handMode)||'skeleton';
 lastH.forEach(p=>{if(mode==='skeleton')skeleton(p);
  else if(mode==='hologram')holoHand(p,t);
  else{skeleton(p);holoHand(p,t)}});
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
let HL=null,FL=null,flTried=false,lastH=null,lastF=null,fNew=false,eng='none',tick=0,lastHandT=0;
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
  FX.toast('🎥 camera + hand engine ON ('+eng+') — eco mode');
  detectLoop();
 }catch(e){const m=e.name==='NotAllowedError'?'camera permission allow karo (site settings)':e.message;
  stat.textContent='❌ '+m;FX.toast('❌ '+m)}};
$('#camBtn').onclick=go;
async function detectLoop(){while(true){
 if(document.hidden){await new Promise(r=>setTimeout(r,500));continue}
 const t=performance.now();
 const idle=t-lastHandT>10000;
 if(vid.readyState>=2&&HL&&!idle){
  try{lastH=HL.detectForVideo(vid,t);
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
