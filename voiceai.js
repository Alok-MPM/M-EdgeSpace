/* voiceai.js — light-mode Stark agent: free, offline rules, bolta hai */
(()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const box=document.getElementById('cmd');let rec=null,on=false;
const say=t=>{try{const u=new SpeechSynthesisUtterance(t);u.lang='hi-IN';u.rate=1.05;speechSynthesis.speak(u)}catch(e){}};
const IDEAS=()=>JSON.parse(localStorage.getItem('mes-ideas')||'[]');
function parse(s){s=s.toLowerCase();
 const dg=(s.match(/(\d+)\s*(degree|digri)/)||[])[1],D=dg?+dg:45;
 if(/(cube|box|dabba)/.test(s)&&/(lao|add|naya|banao|spawn)/.test(s))return{op:'add',type:'cube'};
 if(/(sphere|gola|ball)/.test(s)&&/(lao|add|naya|banao)/.test(s))return{op:'add',type:'sphere'};
 if(/(cylinder|belan|pipe)/.test(s)&&/(lao|add|banao)/.test(s))return{op:'add',type:'cyl'};
 if(/(torus|ring|challa|donut)/.test(s)&&/(lao|add|banao)/.test(s))return{op:'add',type:'torus'};
 if(/(ghumao|rotate|turn)/.test(s))return{op:'rot',deg:/left|baye|upar|tilt/.test(s)?-D:D,
  axis:/upar|top/.test(s)?'x':/tilt|tedha/.test(s)?'z':'y'};
 if(/(bada|big|scale up)/.test(s))return{op:'scale',f:1.25};
 if(/(chhota|small|scale down)/.test(s))return{op:'scale',f:.8};
 if(/(sab saaf|clear all|sab hatao)/.test(s))return{op:'clear'};
 if(/(hatao|delete|remove|mita)/.test(s))return{op:'del'};
 if(/(duplicate|copy|doosra aisa)/.test(s))return{op:'dup'};
 if(/(laal|red)/.test(s))return{op:'color',color:'#ff3355'};
 if(/(neela|blue)/.test(s))return{op:'color',color:'#33aaff'};
 if(/(hara|green)/.test(s))return{op:'color',color:'#33ff88'};
 if(/(camera zoom in|paas aao)/.test(s))return{op:'zoom',d:-1.5};
 if(/(camera zoom out|door hato)/.test(s))return{op:'zoom',d:1.5};
 if(/(select|chuno|pakdo)/.test(s))return{op:'sel'};
 if(/idea (note|likho|store)/.test(s)){const a=IDEAS();
  a.push(s.replace(/.*idea (note|likho|store)[: ]*/,''));localStorage.setItem('mes-ideas',JSON.stringify(a));
  return{op:'idea'}}
 if(/(kitne idea|ideas kitne)/.test(s))return{op:'ideas'};
 if(/(madad|help)/.test(s))return{op:'help'};return null}
function run(txt){const c=parse(txt);
 if(!c){FX.toast('🤖 samjha nahi — "help" bolo');return}
 if(c.op==='help'){say('Cube lao, ghumao, bada karo, hatao, rang badlo, idea note karo — sab bolke hota hai');
  FX.toast('🤖 try: "cube lao" / "ghumao 45 degree" / "bada karo" / "laal karo" / "idea note karo ..."');return}
 if(c.op==='idea'){say('Idea note kar liya bhai. Total '+IDEAS().length);FX.toast('📜 idea saved ('+IDEAS().length+')');return}
 if(c.op==='ideas'){say('Tumhare '+IDEAS().length+' idea safe hai');FX.toast('📜 '+IDEAS().length+' ideas stored');return}
 window.SCENE3D.exec(c);
 const msg={add:'Ho gaya, naya model ready',rot:'Ghumaa diya',scale:'Size set',del:'Hata diya',
  clear:'Sab saaf',dup:'Copy bana di',color:'Rang badal diya',zoom:'Camera set',sel:'Select kiya'}[c.op]||'Ho gaya';
 say(msg);FX.toast('🤖 '+msg)}
if(SR){rec=new SR();rec.lang='hi-IN';rec.continuous=true;rec.interimResults=false;
 rec.onresult=e=>{const t=e.results[e.results.length-1][0].transcript;FX.toast('🎙 '+t);run(t)};
 rec.onerror=e=>{if(e.error!=='no-speech')FX.toast('🎙 err:'+e.error)};
 rec.onend=()=>{if(on)try{rec.start()}catch(e){}}}
document.getElementById('vbtn').onclick=()=>{if(!rec){FX.toast('❌ browser voice support nahi');return}
 on=!on;if(on){rec.start();FX.toast('🎙 agent sun raha hai');say('Haan bhai, bolo')}else{rec.stop();FX.toast('🔇 mic off')}};
box.addEventListener('keydown',e=>{if(e.key==='Enter'&&box.value.trim()){run(box.value);box.value=''}});
window.VAI={run,say};
})();
