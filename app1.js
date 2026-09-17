/* app1.js v4 — wireframe mesh hologram hand (tubes + palm grid + forearm) */
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
/* ---- wireframe helpers ---- */
function ring(cx,cy,ang,r,sq){ctx.beginPath();ctx.ellipse(cx,cy,r,Math.max(1,r*sq),ang,0,7);ctx.stroke()}
function tube(A,B,rA,rB,sq){sq=sq||.38;
 const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,ang=Math.atan2(ny,nx);
 const M={x:(A.x+B.x)/2,y:(A.y+B.y)/2},rM=(rA+rB)/2;
 ring(A.x,A.y,ang,rA,sq);ring(M.x,M.y,ang,rM,sq);ring(B.x,B.y,ang,rB,sq);
 for(let k=0;k<8;k++){const th=k/8*2*Math.PI,ca=Math.cos(th),sa=Math.sin(th)*sq;
  const pA={x:A.x+nx*rA*ca+ux*rA*sa,y:A.y+ny*rA*ca+uy*rA*sa};
  const pM={x:M.x+nx*rM*ca+ux*rM*sa,y:M.y+ny*rM*ca+uy*rM*sa};
  const pB={x:B.x+nx*rB*ca+ux*rB*sa,y:B.y+ny*rB*ca+uy*rB*sa};
  ctx.beginPath();ctx.moveTo(pA.x,pA.y);ctx.lineTo(pM.x,pM.y);ctx.lineTo(pB.x,pB.y);ctx.stroke()}}
function topAt(u,E){const n=E.length-1,f=u*n,i=Math.min(n-1,Math.floor(f)),w=f-i;
 return{x:E[i].x+(E[i+1].x-E[i].x)*w,y:E[i].y+(E[i+1].y-E[i].y)*w}}
function holoHand(p,t){
 const L=D(p[0],p[9])||1,Wd=D(p[5],p[17])||1;
 const fl=.72+.28*Math.sin(t/90+p[0].x%7);
 let ax=1e9,ay=1e9,bx=-1e9,by=-1e9;
 p.forEach(q=>{ax=Math.min(ax,q.x);ay=Math.min(ay,q.y);bx=Math.max(bx,q.x);by=Math.max(by,q.y)});
 ctx.save();ctx.globalAlpha=fl;ctx.lineWidth=1;
 ctx.strokeStyle='rgba(160,228,255,.9)';ctx.shadowColor='#0af';ctx.shadowBlur=9;
 /* wrist + forearm tube */
 const dxw=(p[0].x-p[9].x)/L,dyw=(p[0].y-p[9].y)/L;
 const W1={x:p[0].x+dxw*L*.16,y:p[0].y+dyw*L*.16};
 const W2={x:p[0].x+dxw*L*.52,y:p[0].y+dyw*L*.52};
 tube(p[0],W1,Wd*.30,Wd*.27);tube(W1,W2,Wd*.27,Wd*.34);
 /* palm curved mesh */
 const Lx={x:p[5].x+(p[5].x-p[9].x)*.5,y:p[5].y+(p[5].y-p[9].y)*.5};
 const Rx={x:p[17].x+(p[17].x-p[13].x)*.5,y:p[17].y+(p[17].y-p[13].y)*.5};
 const E=[Lx,p[5],p[9],p[13],p[17],Rx];
 const rows=6,cols=8,grid=[];
 for(let r=0;r<rows;r++){const tt=r/(rows-1),row=[];
  for(let c=0;c<cols;c++){const u=c/(cols-1);
   const top=topAt(u,E);
   const bxx=p[0].x+(top.x-p[0].x)*.20,byy=p[0].y+(top.y-p[0].y)*.20;
   let x=bxx+(top.x-bxx)*tt,y=byy+(top.y-byy)*tt;
   const mid=(cols-1)/2;
   x+=((c-mid)/mid)*(Wd*.10)*Math.sin(Math.PI*tt);
   y-=(Wd*.05)*Math.sin(Math.PI*tt)*Math.sin(Math.PI*u);
   row.push({x,y})}
  grid.push(row)}
 grid.forEach(row=>{ctx.beginPath();row.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke()});
 for(let c=0;c<cols;c++){ctx.beginPath();
  for(let r=0;r<rows;r++){const q=grid[r][c];r?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)}ctx.stroke()}
 /* finger tubes */
 const F=[[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
 F.forEach((f,fi)=>{const th=fi===0?Wd*.115:Wd*.095;
  for(let k=0;k<3;k++){const A=p[f[k]],B=p[f[k+1]];
   tube(A,B,th*(1-k*.24),th*(1-(k+1)*.24))}
  const T=p[f[3]],Pv=p[f[2]];
  const ang=Math.atan2(T.y-Pv.y,T.x-Pv.x);
  ring(T.x,T.y,ang,th*.28,.5)});
 /* scanlines */
 ctx.shadowBlur=0;ctx.globalAlpha=fl*.28;ctx.strokeStyle='#9ef';ctx.lineWidth=.6;
 for(let y=ay-10;y<by+10;y+=4){ctx.beginPath();ctx.moveTo(ax-10,y);ctx.lineTo(bx+10,y);ctx.stroke()}
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
