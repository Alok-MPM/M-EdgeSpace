/* HOLO HAND FX — fx.js */
const FX=(()=>{
const cv=document.getElementById('cv'),ctx=cv.getContext('2d'),wrap=document.getElementById('wrap');
const toastEl=document.getElementById('toast');
const DESIGNS=['AUTO','GLASS','HOLO','STATIC','NEON','PORTAL','SPARK','SLAB'];
const S={opt:{skeleton:true,glitch:true,holo:false,spin:true,perf:false,head:true},
 objs:[],sel:null,design:'AUTO',grab:null};
let oid=0,smooth=[],prevPinch=[false,false],pendSel=null,pendT=0,toastT=0,vidEl=null,noisePat=null,liveAuto=[];
const D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const cent=p=>({x:p.reduce((s,q)=>s+q.x,0)/p.length,y:p.reduce((s,q)=>s+q.y,0)/p.length});
function poly(p){ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath()}
function extQ(p,k){const c=cent(p);return p.map(q=>({x:c.x+(q.x-c.x)*k,y:c.y+(q.y-c.y)*k}))}
function bb(p){let a=1e9,b=1e9,c=-1e9,d=-1e9;p.forEach(q=>{a=Math.min(a,q.x);b=Math.min(b,q.y);
 c=Math.max(c,q.x);d=Math.max(d,q.y)});return{x:a,y:b,w:c-a,h:d-b}}
const FING=[[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]];
const CONN=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function gesture(p){const f=FING.map(x=>D(p[x[3]],p[0])>D(p[x[1]],p[0])*1.12);const n=f.filter(Boolean).length;
 if(D(p[4],p[8])<D(p[0],p[9])*.5&&n<=1)return'PINCH';
 if(f[0]&&f[1]&&!f[2]&&!f[3])return'PEACE';
 if(n>=4)return'PALM';if(n===0)return'FIST';return'POINT'}
function toast(m){toastEl.textContent=m;toastEl.classList.add('on');toastT=performance.now()+1600}
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
function drawVid(f){const vw=vidEl.videoWidth||640,vh=vidEl.videoHeight||480;
 const s=Math.max(cv.width/vw,cv.height/vh);
 ctx.save();ctx.translate(cv.width,0);ctx.scale(-1,1);
 if(f&&!S.opt.perf)ctx.filter=f;
 ctx.drawImage(vidEl,(cv.width-vw*s)/2,(cv.height-vh*s)/2,vw*s,vh*s);
 ctx.filter='none';ctx.restore()}
function skeleton(p){ctx.strokeStyle='rgba(0,255,238,.45)';ctx.lineWidth=1;ctx.beginPath();
 CONN.forEach(([a,b])=>{ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y)});ctx.stroke();
 ctx.fillStyle='#fff';p.forEach(q=>{ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill()})}
function glass(q){ctx.save();poly(q);ctx.clip();
 const c=cent(q);ctx.translate(c.x+6,c.y-4);ctx.scale(1.22,1.22);ctx.translate(-c.x,-c.y);
 drawVid('saturate(1.8) contrast(1.12)');
 const g=ctx.createLinearGradient(q[0].x,q[0].y,q[2].x,q[2].y);
 g.addColorStop(0,'rgba(255,0,255,.15)');g.addColorStop(.5,'rgba(0,255,255,.13)');
 g.addColorStop(1,'rgba(255,255,0,.13)');ctx.fillStyle=g;poly(q);ctx.fill();
 ctx.restore();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;poly(q);ctx.stroke()}
function staticQ(q){if(!noisePat){const nz=document.createElement('canvas');nz.width=nz.height=140;
 const nc=nz.getContext('2d'),im=nc.createImageData(140,140);
 for(let i=0;i<im.data.length;i+=4){const v=170+Math.random()*85;
  im.data[i]=v*.5;im.data[i+1]=v;im.data[i+2]=v*.5;im.data[i+3]=255}
 nc.putImageData(im,0,0);noisePat=ctx.createPattern(nz,'repeat')}
 ctx.save();poly(q);ctx.clip();ctx.fillStyle=noisePat;
 ctx.translate((Math.random()*140)|0,(Math.random()*140)|0);
 ctx.fillRect(-300,-300,cv.width+600,cv.height+600);ctx.setTransform(1,0,0,1,0,0);
 ctx.fillStyle='rgba(90,255,120,.3)';ctx.fillRect(0,0,cv.width,cv.height);ctx.restore();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;poly(q);ctx.stroke()}
function neon(q,hue){ctx.save();ctx.shadowColor=`hsl(${hue} 95% 60%)`;ctx.shadowBlur=26;
 poly(q);ctx.fillStyle=`hsla(${hue},95%,60%,.8)`;ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore()}
function portal(c,r){ctx.save();ctx.beginPath();ctx.arc(c.x,c.y,r,0,7);ctx.clip();
 drawVid('invert(1) hue-rotate(90deg) saturate(2)');ctx.restore();
 ctx.strokeStyle='#0ff';ctx.lineWidth=3;ctx.shadowColor='#0ff';ctx.shadowBlur=16;
 ctx.beginPath();ctx.arc(c.x,c.y,r,0,7);ctx.stroke();ctx.shadowBlur=0}
function spark(c,r,hue){ctx.save();ctx.shadowColor=`hsl(${hue} 95% 70%)`;ctx.shadowBlur=22;
 ctx.beginPath();ctx.moveTo(c.x,c.y-r);ctx.lineTo(c.x+r*.4,c.y);ctx.lineTo(c.x,c.y+r);
 ctx.lineTo(c.x-r*.4,c.y);ctx.closePath();ctx.fillStyle=`hsla(${hue},95%,72%,.9)`;ctx.fill();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore()}
const V3=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const ED=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
function holo(c,s,t){const a=S.opt.spin?t/900:.4,b=t/1400;
 const P=V3.map(v=>{const X=v[0]*Math.cos(a)-v[2]*Math.sin(a),Z=v[0]*Math.sin(a)+v[2]*Math.cos(a);
  const Y=v[1]*Math.cos(b)-Z*Math.sin(b),Z2=v[1]*Math.sin(b)+Z*Math.cos(b),k=2.6/(2.6+Z2);
  return{x:c.x+X*s*k,y:c.y+Y*s*k}});
 ctx.save();ctx.strokeStyle=`hsla(${(t/6)%360},95%,65%,.9)`;ctx.shadowColor='#0ff';
 ctx.shadowBlur=12;ctx.lineWidth=1.5;ctx.beginPath();
 ED.forEach(([i,j])=>{ctx.moveTo(P[i].x,P[i].y);ctx.lineTo(P[j].x,P[j].y)});ctx.stroke();
 ctx.globalAlpha=.22+.14*Math.sin(t/90);ctx.fillStyle='#0ff';
 for(let y=c.y-s;y<c.y+s;y+=4)ctx.fillRect(c.x-s,y,2*s,1);ctx.restore()}
function slab(q,t){const e=extQ(q,1.15);
 let n={x:-(e[1].y-e[0].y),y:e[1].x-e[0].x};const L=Math.hypot(n.x,n.y)||1;
 n={x:n.x/L*D(e[0],e[1])*.16,y:n.y/L*D(e[0],e[1])*.16};if(n.y>0)n={x:-n.x,y:-n.y};
 const ad=(p,v)=>({x:p.x+v.x,y:p.y+v.y});
 ctx.fillStyle='#9a9a9a';poly([e[0],e[1],ad(e[1],n),ad(e[0],n)]);ctx.fill();
 ctx.fillStyle='#787878';poly([e[1],ad(e[1],n),ad(e[2],n),e[2]]);ctx.fill();
 ctx.save();poly(e);ctx.clip();
 if(!S.opt.perf)ctx.filter=`invert(1) hue-rotate(${(t/8)%360|0}deg) saturate(2.6)`;
 const u={x:e[1].x-e[0].x,y:e[1].y-e[0].y},v={x:e[3].x-e[0].x,y:e[3].y-e[0].y};
 ctx.transform(u.x,u.y,v.x,v.y,e[0].x,e[0].y);
 ctx.translate(1,0);ctx.scale(-1,1);ctx.drawImage(vidEl,0,0,1,1);ctx.restore();
 ctx.strokeStyle='#fff';ctx.lineWidth=2;poly(e);ctx.stroke();
 poly([e[0],e[1],ad(e[1],n),ad(e[0],n)]);ctx.stroke();
 poly([e[1],ad(e[1],n),ad(e[2],n),e[2]]);ctx.stroke()}
const UQ=[{x:-1,y:-.6},{x:1,y:-.6},{x:1,y:.6},{x:-1,y:.6}];
function qOf(o){return UQ.map(p=>{const a=o.rot||0;
 return{x:o.c.x+(p.x*Math.cos(a)-p.y*Math.sin(a))*o.size,
        y:o.c.y+(p.x*Math.sin(a)+p.y*Math.cos(a))*o.size*.6}})}
function drawObj(o,t){const q=qOf(o),c=o.c,r=o.size;
 if(o.type==='GLASS')glass(q);else if(o.type==='STATIC')staticQ(q);
 else if(o.type==='NEON')neon(q,o.hue);else if(o.type==='PORTAL')portal(c,r);
 else if(o.type==='SPARK')spark(c,r,o.hue);else if(o.type==='HOLO')holo(c,r,t);
 else if(o.type==='SLAB')slab(q,t);
 if(S.sel===o.id){const b=bb(q);ctx.strokeStyle='#ff0';ctx.lineWidth=2;ctx.setLineDash([6,6]);
  ctx.strokeRect(b.x-8,b.y-8,b.w+16,b.h+16);ctx.setLineDash([])}}
function smoothHands(LM){if(!LM||LM.length!==smooth.length)smooth=[];
 return(LM||[]).map((lm,hi)=>{const raw=lm.map((q,i)=>{const vw=vidEl.videoWidth||640,
  vh=vidEl.videoHeight||480,s=Math.max(cv.width/vw,cv.height/vh);
  return{x:cv.width-((cv.width-vw*s)/2+q.x*vw*s),y:(cv.height-vh*s)/2+q.y*vh*s}});
  if(!smooth[hi])smooth[hi]=raw.map(q=>({...q}));
  const pts=raw.map((q,i)=>({x:smooth[hi][i].x+(q.x-smooth[hi][i].x)*.55,
                             y:smooth[hi][i].y+(q.y-smooth[hi][i].y)*.55}));
  smooth[hi]=pts.map(q=>({...q}));return pts})}
const palm=p=>cent([p[0],p[5],p[9],p[13],p[17]]);
function renderFrame(H,G,t,headE){
 ctx.clearRect(0,0,cv.width,cv.height);
 liveAuto=[];
 const hasPeace=G.includes('PEACE');
 if(H.length===2&&!hasPeace&&(S.design==='AUTO'||S.design==='SLAB'||S.design==='STATIC')){
  const q=[H[0][8],H[1][8],H[1][4],H[0][4]];
  const ty=(S.design==='SLAB'||(S.design==='AUTO'&&G[0]==='PALM'&&G[1]==='PALM'))?'SLAB':'STATIC';
  if(ty==='SLAB')slab(q,t);else staticQ(extQ(q,1.15));
  liveAuto.push({type:ty,q})}
 H.forEach((p,i)=>{const g=G[i];
  if(S.design==='AUTO'){
   if(g==='PEACE')  {const q=extQ([p[8],p[12],p[0]],1.25);glass(q);liveAuto.push({type:'GLASS',q})}
   if(g==='PALM'&&H.length===1){const c=palm(p);holo({x:c.x,y:c.y-D(p[0],p[9])*1.4},D(p[0],p[9])*1.1,t);
    liveAuto.push({type:'HOLO',q:UQ.map(u=>({x:c.x+u.x*D(p[0],p[9])*1.1,y:c.y-D(p[0],p[9])*1.4+u.y*D(p[0],p[9])*.66}))})}}
  if(g==='PINCH'&&!prevPinch[i]&&!S.sel&&S.design!=='AUTO'){
   const c=palm(p),sz=D(p[0],p[9])*1.5;
   S.objs.push({id:++oid,type:S.design,c:{x:p[8].x,y:p[8].y},size:sz,hue:(t/4)%360,
    hand:i,off:{x:p[8].x-c.x,y:p[8].y-c.y},pinned:false,rot:0});
   if(S.objs.length>14)S.objs.shift();
   toast('✨ '+S.design+' spawn — 🙂nod=screen pin, shake=hatao')}
  prevPinch[i]=g==='PINCH'});
 S.objs.forEach(o=>{if(o.hand!=null&&H[o.hand]){const c=palm(H[o.hand]);
  o.c={x:c.x+o.off.x,y:c.y+o.off.y}}else if(o.hand!=null&&!H[o.hand]){o.hand=null;o.pinned=true}});
 if(G.includes('POINT')){const tip=H[G.indexOf('POINT')][8];
  const hit=S.objs.filter(o=>o.pinned).find(o=>{const b=bb(qOf(o));
   return tip.x>b.x-10&&tip.x<b.x+b.w+10&&tip.y>b.y-10&&tip.y<b.y+b.h+10});
  if(hit){if(pendSel===hit.id&&t-pendT>600){S.sel=hit.id;S.grab=null;toast('🎯 select — palm=move, pinch=size')}
   else if(pendSel!==hit.id){pendSel=hit.id;pendT=t}}
  else pendSel=null}
 else pendSel=null;
 const selObj=S.objs.find(o=>o.id===S.sel);
 if(selObj){const hi=H.findIndex((p,i)=>G[i]==='PALM'),hj=H.findIndex((p,i)=>G[i]==='PINCH');
  if(hi>=0){const c=palm(H[hi]);if(!S.grab)S.grab={ox:c.x-selObj.c.x,oy:c.y-selObj.c.y,pd:0};
   selObj.c={x:c.x-S.grab.ox,y:c.y-S.grab.oy}}
  if(hj>=0){const pd=D(H[hj][4],H[hj][8]);
   if(S.grab&&S.grab.pd)selObj.size=Math.max(30,S.grab.size*(pd/S.grab.pd));
   S.grab={...(S.grab||{}),pd:pd||S.grab?.pd,size:selObj.size}}
  if(G.includes('FIST')){S.objs=S.objs.filter(o=>o.id!==S.sel);S.sel=null;S.grab=null;toast('🗑 delete')}}
 if(headE&&S.opt.head){
  if(headE==='NOD'){if(S.sel){S.sel=null;S.grab=null;toast('✅ select chhoda')}
   else{let n=0;S.objs.forEach(o=>{if(o.hand!=null){o.hand=null;o.pinned=true;n++}});
    liveAuto.forEach(l=>{S.objs.push({id:++oid,type:l.type,c:cent(l.q),size:D(l.q[0],l.q[1])/2,
     hue:(t/4)%360,hand:null,pinned:true,rot:0});n++});
    toast(n?'📌 '+n+' design screen par PIN!':'🙂 nod — koi live design nahi')}}
  else if(headE==='SHAKE'){if(S.sel){S.objs=S.objs.filter(o=>o.id!==S.sel);S.sel=null;S.grab=null;toast('🗑 hataya')}
   else{const b=S.objs.length;S.objs=S.objs.filter(o=>o.pinned&&o.hand==null&&false||o.pinned);
    S.objs=S.objs.filter(o=>o.hand==null);toast('🙅 shake — live designs hate')}}}
 S.objs.forEach(o=>drawObj(o,t));
 if(S.opt.skeleton)H.forEach(skeleton);
 if(S.opt.holo){ctx.save();ctx.globalAlpha=.14+.06*Math.sin(t/70);ctx.fillStyle='#0ff';
  for(let y=0;y<cv.height;y+=3)ctx.fillRect(0,y,cv.width,1);
  ctx.globalAlpha=.08;ctx.fillStyle='#0ff';ctx.fillRect(0,0,cv.width,cv.height);ctx.restore()}
 const gl=S.opt.glitch&&G.includes('FIST')&&!S.sel;
 wrap.style.filter=gl?'invert(1) hue-rotate(75deg) saturate(1.8) brightness(1.15)':'';
 if(gl){ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=noisePat||'#0f0';
  ctx.fillRect(0,0,cv.width,cv.height);ctx.restore()}
 if(t>toastT)toastEl.classList.remove('on');
 return{obj:S.objs.length,sel:S.sel}}
return{S,DESIGNS,gesture,headEvt,smoothHands,renderFrame,toast,
 setVid:v=>{vidEl=v},get cv(){return cv}};
})();
