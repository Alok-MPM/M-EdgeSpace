/* voiceai.js v4 — voice + chips + text + mic-meter + lang fallback */
(()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const box=document.getElementById('cmd'),vbtn=document.getElementById('vbtn');
let rec=null,on=false,retry=0,errs=0,li=0;const LANGS=['hi-IN','en-IN','en-US'];
let actx=null,analyser=null,micStream=null,mRaf=0;
const say=t=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='hi-IN';u.rate=1.05;speechSynthesis.speak(u)}catch(e){}};
const IDEAS=()=>JSON.parse(localStorage.getItem('mes-ideas')||'[]');
async function meterOn(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});
 actx=new(window.AudioContext||window.webkitAudioContext)();
 const src=actx.createMediaStreamSource(micStream);analyser=actx.createAnalyser();analyser.fftSize=256;src.connect(analyser);
 const buf=new Uint8Array(analyser.frequencyBinCount);
 const tickM=()=>{mRaf=requestAnimationFrame(tickM);analyser.getByteFrequencyData(buf);
  let s=0;for(let i=0;i<buf.length;i++)s+=buf[i];
  const m=document.getElementById('meter');if(m)m.style.width=Math.min(100,s/buf.length*4)+'%'};tickM()}
 catch(e){FX.toast('🎚 mic-level nahi mila')}}
function meterOff(){cancelAnimationFrame(mRaf);if(micStream)micStream.getTracks().forEach(t=>t.stop());
 micStream=null;const m=document.getElementById('meter');if(m)m.style.width='0%'}
function parse(s){s=s.toLowerCase();
 const dg=(s.match(/(\d+)\s*(degree|digri)/)||[])[1],D=dg?+dg:45;
 if(/(copy karo|copy karna)/.test(s))return{op:'copy'};
 if(/(paste karo|chipkao)/.test(s))return{op:'paste'};
 if(/(export karo|download karo)/.test(s))return{op:'export'};
 if(/(sphere|gola|ball)/.test(s)&&/(banao|banado|morph)/.test(s))return{op:'morph',type:'sphere'};
 if(/(rectangle|rect|lamba box)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'rect'};
 if(/(sheet|chaadar|patla sheet)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'sheet'};
 if(/(tall|khada)/.test(s)&&/(banao|banado)/.test(s))return{op:'morph',type:'tall'};
 if(/(cube|box|dabba)/.test(s)&&/(banao|wapas)/.test(s))return{op:'morph',type:'cube'};
 if(/(cube|box|dabba)/.test(s)&&/(lao|add|naya|spawn)/.test(s))return{op:'add',type:'cube'};
 if(/(sphere|gola|ball)/.test(s)&&/(lao|add|naya)/.test(s))return{op:'add',type:'sphere'};
 if(/(cylinder|belan|pipe)/.test(s)&&/(lao|add|naya)/.test(s))return{op:'add',type:'cyl'};
 if(/(torus|ring|challa|donut)/.test(s)&&/(lao|add|naya)/.test(s))return{op:'add',type:'torus'};
 if(/(flip|palat)/.test(s))return{op:'rot',axis:'x',deg:180};
 if(/(ghumao|rotate|turn)/.test(s))return{op:'rot',deg:/left|baye|neeche|tilt/.test(s)?-D:D,
  axis:/upar|top|neeche|down/.test(s)?'x':/tilt|tedha/.test(s)?'z':'y'};
 if(/(lamba karo|stretch)/.test(s))return{op:'stretch',axis:'x',f:1.3};
 if(/(patla karo)/.test(s))return{op:'stretch',axis:'y',f:.6};
 if(/(mota karo|thick)/.test(s))return{op:'stretch',axis:'y',f:1.4};
 if(/(bada|big|scale up)/.test(s))return{op:'scale',f:1.25};
 if(/(chhota|small|scale down)/.test(s))return{op:'scale',f:.8};
 if(/(sab saaf|clear all|sab hatao)/.test(s))return{op:'clear'};
 if(/(hatao|delete|remove|mita)/.test(s))return{op:'del'};
 if(/(duplicate|copy banao)/.test(s))return{op:'dup'};
 if(/(laal|red)/.test(s))return{op:'color',color:'#ff3355'};
 if(/(neela|blue)/.test(s))return{op:'color',color:'#33aaff'};
 if(/(hara|green)/.test(s))return{op:'color',color:'#33ff88'};
 if(/(pila|yellow)/.test(s))return{op:'color',color:'#ffee33'};
 if(/(camera zoom in|paas aao)/.test(s))return{op:'zoom',d:-1.5};
 if(/(camera zoom out|door hato)/.test(s))return{op:'zoom',d:1.5};
 if(/(select|chuno|pakdo)/.test(s))return{op:'sel'};
 if(/idea (note|likho|store)/.test(s)){const a=IDEAS();a.push(s.replace(/.*idea (note|likho|store)[: ]*/,''));
  localStorage.setItem('mes-ideas',JSON.stringify(a));return{op:'idea'}}
 if(/(kitne idea|ideas kitne)/.test(s))return{op:'ideas'};
 if(/(madad|help)/.test(s))return{op:'help'};return null}
function run(txt){const c=parse(txt);
 if(!c){FX.toast('🤖 samjha nahi — "help" bolo');return}
 if(c.op==='copy'){window.PROJ.copy();return}
 if(c.op==='paste'){window.PROJ.paste();return}
 if(c.op==='export'){window.PROJ.export();return}
 if(c.op==='help'){say('Cube lao, sphere banao, sheet banao, ghumao, copy paste, idea note karo');
  FX.toast('🤖 "cube lao" "sphere banao" "sheet banao" "ghumao 45 degree" "copy karo" "paste karo" "idea note karo ..."');return}
 if(c.op==='idea'){say('Idea note kar liya. Total '+IDEAS().length);FX.toast('📜 idea saved ('+IDEAS().length+')');return}
 if(c.op==='ideas'){say(IDEAS().length+' idea safe hai');FX.toast('📜 '+IDEAS().length+' ideas stored');return}
 window.SCENE3D.exec(c);
 const msg={add:'Naya model ready',morph:'Morph: '+(c.type||''),rot:'Ghumaa diya',scale:'Size set',
  stretch:'Stretch ho gaya',del:'Hata diya',clear:'Sab 3D saaf',dup:'Copy bana di',color:'Rang badla',
  zoom:'Camera set',sel:'Select kiya'}[c.op]||'Ho gaya';
 say(msg);FX.toast('🤖 '+msg)}
if(SR){rec=new SR();rec.lang=LANGS[0];rec.continuous=true;rec.interimResults=false;
 rec.onresult=e=>{retry=0;errs=0;const t=e.results[e.results.length-1][0].transcript;FX.toast('🎙 '+t);run(t)};
 rec.onerror=e=>{if(e.error==='no-speech')return;
  if(e.error==='network'&&retry<2){retry++;FX.toast('🎙 net err — dobara...');
   setTimeout(()=>{if(on)try{rec.start()}catch(x){}},1200);return}
  errs++;if(errs>4&&li<LANGS.length-1){li++;rec.lang=LANGS[li];errs=0;FX.toast('🌐 '+rec.lang+' try kar rahe');return}
  retry=0;FX.toast('🎙 '+e.error+' — chips/text box use karo')};
 rec.onend=()=>{if(on)try{rec.start()}catch(e){}}}
vbtn.onclick=()=>{if(!rec){FX.toast('❌ browser voice nahi — chips/text use karo');return}
 on=!on;vbtn.style.background=on?'#0f6a':'#0009';
 if(on){try{rec.start()}catch(e){}meterOn();FX.toast('🎙 agent ON — bolo "cube lao"');say('Haan bhai, bolo')}
 else{rec.stop();meterOff();FX.toast('🔇 agent OFF')}};
document.querySelectorAll('#chips button').forEach(b=>b.onclick=()=>{FX.toast('⚡ '+b.dataset.c);run(b.dataset.c)});
box.addEventListener('keydown',e=>{if(e.key==='Enter'&&box.value.trim()){FX.toast('⌨ '+box.value);run(box.value);box.value=''}});
window.VAI={run,say};
})();
