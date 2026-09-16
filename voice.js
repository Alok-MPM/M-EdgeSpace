/* voice.js — Step 1: toggle mic, premium voice filter, cinematic TTS, confirm/ask */
(()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const vbtn=document.getElementById('vbtn'),sel=document.getElementById('voiceSel');
let rec=null,on=false,retry=0,errs=0,li=0,actx=null,analyser=null,micStream=null,mRaf=0;
const LANGS=['hi-IN','en-IN','en-US'];
let voiceURI=localStorage.getItem('mes-voice')||null;
function loadVoices(){const vs=speechSynthesis.getVoices();if(!vs.length)return;
 const score=v=>(v.name.startsWith('Google')?100:0)+(v.lang.startsWith('en-GB')?20:v.lang.startsWith('en')?10:v.lang.startsWith('hi')?15:0);
 vs.sort((a,b)=>score(b)-score(a));
 sel.innerHTML='';vs.forEach(v=>{const o=document.createElement('option');o.value=v.voiceURI;
  o.textContent=v.name+' ('+v.lang+')';sel.appendChild(o)});
 if(!voiceURI||!vs.find(v=>v.voiceURI===voiceURI))voiceURI=vs[0].voiceURI;
 sel.value=voiceURI}
loadVoices();speechSynthesis.onvoiceschanged=loadVoices;
sel.onchange=()=>{voiceURI=sel.value;localStorage.setItem('mes-voice',voiceURI);say('Ye awaaz hai sir')};
function say(t){try{const u=new SpeechSynthesisUtterance(t);
 const v=speechSynthesis.getVoices().find(v=>v.voiceURI===voiceURI);if(v)u.voice=v;
 u.lang=v?v.lang:'hi-IN';u.pitch=.95;u.rate=1.0;speechSynthesis.speak(u)}catch(e){}}
window.MES.say=say;
async function meterOn(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});
 actx=new(window.AudioContext||window.webkitAudioContext)();
 const src=actx.createMediaStreamSource(micStream);analyser=actx.createAnalyser();analyser.fftSize=256;src.connect(analyser);
 const buf=new Uint8Array(analyser.frequencyBinCount);
 const tickM=()=>{mRaf=requestAnimationFrame(tickM);analyser.getByteFrequencyData(buf);
  let s=0;for(let i=0;i<buf.length;i++)s+=buf[i];
  const m=document.getElementById('meter');if(m)m.style.width=Math.min(100,s/buf.length*4)+'%'};tickM()}catch(e){}}
function meterOff(){cancelAnimationFrame(mRaf);if(micStream)micStream.getTracks().forEach(t=>t.stop());
 micStream=null;const m=document.getElementById('meter');if(m)m.style.width='0%'}
function handle(text,src){const r=window.MES.route(text);
 if(src==='chat')window.MES.ui.log(text,'u');else window.MES.ui.log('🎙 '+text,'u');
 if(r.ok){say(r.msg);window.MES.ui.log('⚡ '+r.msg,'a');window.MES.ui.toast('⚡ '+r.msg)}
 else if(r.ask){say(r.ask);window.MES.ui.log('🤔 '+r.ask,'a');window.MES.ui.toast('🤔 '+r.ask)}
 else return r;
 return null}
window.MES.handle=handle;
if(SR){rec=new SR();rec.lang=LANGS[0];rec.continuous=true;rec.interimResults=false;
 rec.onresult=e=>{retry=0;errs=0;const t=e.results[e.results.length-1][0].transcript;
  const unk=handle(t,'voice');
  if(unk){window.MES.ui.log('🎙 '+t+' (samjha nahi)','s');say('Samajha nahi sir, dobara boliye?')}};
 rec.onerror=e=>{if(e.error==='no-speech')return;
  if(e.error==='network'&&retry<2){retry++;setTimeout(()=>{if(on)try{rec.start()}catch(x){}},1200);return}
  errs++;if(errs>4&&li<LANGS.length-1){li++;rec.lang=LANGS[li];errs=0;window.MES.ui.toast('🌐 '+rec.lang);return}
  window.MES.ui.toast('🎙 '+e.error+' — Chrome best hai voice ke liye')};
 rec.onend=()=>{if(on)try{rec.start()}catch(e){}}}
vbtn.onclick=()=>{if(!rec){window.MES.ui.toast('❌ browser voice nahi — chat box use karo');return}
 on=!on;vbtn.style.background=on?'#0f6a':'#0009';
 if(on){try{rec.start()}catch(e){}meterOn();window.MES.ui.toast('🎙 MIC ON — boliye, main sun raha hoon');say('Haan sir, boliye')}
 else{rec.stop();meterOff();window.MES.ui.toast('🔇 MIC OFF');say('Theek hai sir')}};
})();
