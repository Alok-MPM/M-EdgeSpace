/* M-EdgeSpace — studio3d.js : 3D studio + gesture control */
import*as THREE from'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const cv3=document.getElementById('cv3');
const renderer=new THREE.WebGLRenderer({canvas:cv3,alpha:true,antialias:false,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(55,1,.1,100);cam.position.set(0,0,6);
scene.add(new THREE.AmbientLight(0xffffff,.7));
const dl=new THREE.DirectionalLight(0x88eeff,.9);dl.position.set(2,3,4);scene.add(dl);
const grid=new THREE.GridHelper(20,20,0x00ffcc,0x0a3a3a);grid.position.y=-2;scene.add(grid);
let objs=[],sel=null,oid=0,helper=null;
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),PL=new THREE.Plane(new THREE.Vector3(0,0,1),0);
function resize(){renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
const mat=h=>new THREE.MeshStandardMaterial({color:new THREE.Color(`hsl(${h},80%,55%)`),metalness:.3,roughness:.4,transparent:true,opacity:.92});
function geo(t){return t==='sphere'?new THREE.SphereGeometry(.7,20,14):t==='cyl'?new THREE.CylinderGeometry(.5,.5,1.2,18):t==='torus'?new THREE.TorusGeometry(.6,.22,12,24):new THREE.BoxGeometry(1,1,1)}
function save(){localStorage.setItem('mes-scene',JSON.stringify(objs.map(m=>({t:m.userData.t,p:m.position.toArray(),r:[m.rotation.x,m.rotation.y,m.rotation.z],s:m.scale.toArray(),h:m.userData.hue}))))}
function addObj(t='cube',pos=null,hue=Math.random()*360){
 const m=new THREE.Mesh(geo(t),mat(hue));m.position.copy(pos||new THREE.Vector3((Math.random()-.5)*3,(Math.random()-.5)*1.5,0));
 m.userData={id:++oid,hue,t};scene.add(m);objs.push(m);save();return m}
function load(){try{const d=JSON.parse(localStorage.getItem('mes-scene')||'[]');
 d.forEach(o=>{const m=addObj(o.t,new THREE.Vector3(...o.p),o.h);m.rotation.set(...o.r);m.scale.set(...o.s)})}catch(e){}}
function select(m){sel=m;if(helper){scene.remove(helper);helper=null}
 if(m){helper=new THREE.BoxHelper(m,0xffff00);scene.add(helper)}}
function pick(pt){ndc.set(pt.x/innerWidth*2-1,-(pt.y/innerHeight*2-1));ray.setFromCamera(ndc,cam);
 return(ray.intersectObjects(objs)[0]||{}).object||null}
function planePt(pt,z){ndc.set(pt.x/innerWidth*2-1,-(pt.y/innerHeight*2-1));ray.setFromCamera(ndc,cam);
 PL.constant=-z;const v=new THREE.Vector3();return ray.ray.intersectPlane(PL,v)?v:null}
const palm=p=>({x:(p[0].x+p[5].x+p[9].x+p[13].x+p[17].x)/5,y:(p[0].y+p[5].y+p[9].y+p[13].y+p[17].y)/5});
const d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function exec(c){const S=sel;switch(c.op){
 case'add':{const m=addObj(c.type||'cube');select(m);return m.userData.id}
 case'del':if(S){scene.remove(S);objs=objs.filter(o=>o!==S);select(null);save()}return;
 case'clear':objs.forEach(m=>scene.remove(m));objs=[];select(null);save();return;
 case'move':if(S){S.position.x+=c.x||0;S.position.y+=c.y||0;S.position.z+=c.z||0;save()}return;
 case'rot':if(S){S.rotation[c.axis||'y']+=(c.deg||45)*Math.PI/180;save()}return;
 case'scale':if(S){S.scale.multiplyScalar(THREE.MathUtils.clamp(c.f||1.2,.2,6));save()}return;
 case'sel':select(objs[objs.length-1]||null);return;
 case'color':if(S)S.material.color.set(c.color);return;
 case'zoom':cam.position.z=THREE.MathUtils.clamp(cam.position.z+(c.d||-1),2,12);return;
 case'dup':if(S){const c2=S.clone();c2.material=S.material.clone();c2.position.x+=1.2;
  c2.userData={id:++oid,hue:S.userData.hue,t:S.userData.t};scene.add(c2);objs.push(c2);save()}return;
 case'list':return objs.length}}
window.SCENE3D={exec,addObj,select,get count(){return objs.length}};
let prevPinch=0,holdT=0,lastTwist=null,prevDist=0;const GST={};
const stable=(i,g)=>{const s=GST[i]||(GST[i]={g:'',n:0});s.g===g?s.n++:(s.g=g,s.n=1);return s.n>=3};
function loop(){requestAnimationFrame(loop);renderer.render(scene,cam);
 const{H,G}=FX.getHands();if(!H||!H.length){prevPinch=0;return}
 const tip=G[0]==='POINT'?H[0][8]:null;
 if(tip&&stable(0,'POINT')){const hit=pick(tip);
  if(hit){holdT+=16;if(holdT>600&&sel!==hit){select(hit);FX.toast('🎯 3D select — palm=move, pinch=size, 2-hath=rotate/zoom')}}
  else holdT=0}else holdT=0;
 if(sel&&G.includes('PALM')){const hi=G.indexOf('PALM');
  const pl=planePt(palm(H[hi]),sel.position.z);if(pl)sel.position.lerp(pl,.35)}
 if(G.includes('PINCH')){const hi=G.indexOf('PINCH'),pd=d2(H[hi][4],H[hi][8]),hit=pick(H[hi][8]);
  if(sel&&hit===sel&&prevPinch)sel.scale.multiplyScalar(THREE.MathUtils.clamp(pd/prevPinch,.9,1.1));
  else if(!hit&&prevPinch===0){const pl=planePt(H[hi][8],0);if(pl){addObj('cube',pl);FX.toast('🧊 cube spawn — haath hatao, ye rahega')}}
  prevPinch=pd}else{if(prevPinch&&sel)save();prevPinch=0}
 if(H.length===2&&sel){const a=palm(H[0]),b=palm(H[1]);
  const ang=Math.atan2(b.y-a.y,b.x-a.x),dd=d2(a,b);
  if(lastTwist!==null)sel.rotation.z+=(ang-lastTwist)*.6;
  if(prevDist)cam.position.z=THREE.MathUtils.clamp(cam.position.z-(dd-prevDist)*.02,2,12);
  lastTwist=ang;prevDist=dd}else{lastTwist=null;prevDist=0}
 if(G.includes('FIST')&&stable(G.indexOf('FIST'),'FIST')&&sel){select(null);FX.toast('👌 deselect')}
 const hd=FX.getHead();
 if(hd==='SHAKE'&&sel){scene.remove(sel);objs=objs.filter(o=>o!==sel);select(null);save();FX.toast('🗑 3D delete')}
 if(hd==='NOD'&&sel){save();FX.toast('💾 3D save/pin')}
 if(helper)helper.update()}
load();if(!objs.length)addObj('cube',new THREE.Vector3(0,0,0));
loop();
