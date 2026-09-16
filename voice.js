/* voice.js v2.1 — visible errors + manual test + simpler whisper */
(()=>{
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const vbtn=document.getElementById('vbtn'),sel=document.getElementById('voiceSel');
let rec=null,on=false,retry=0,errs=0,li=0,actx=null,analyser=null,micStream=null,mRaf=0;
let loud=0,lastRes=0,warned=false,sttDead=false;
let whisper=null,whLoading=false,mediaRec=null;
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
 u.lang=v?v.lang:'hi-IN';u.pitch=.95;u.rate=1.0;speechSynthesis.speak(u)}catch(e){FX.toast('❌ TTS fail: '+e.message)}}
window.MES.say=say;
async function loadWhisper(){if(whisper||whLoading)return;whLoading=true;
 try{FX.toast('🧠 whisper-tiny load ho raha hai (~10MB, pehli baar)...');
  const T=await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
  whisper=await T.pipeline('automatic-speech-recognition','Xenova/whisper-tiny',{quantized:true});
  FX.toast('🧠 whisper READY — ab boliye');whLoading=false;startChunks();
 }catch(e){FX.toast('❌ whisper load FAIL: '+(e.message||e));whLoading=false;sttDead=true}}
async function startChunks(){if(!on||!whisper)return;
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true});
  mediaRec=new MediaRecorder(st);const chunks=[];
  mediaRec.ondataavailable=e=>chunks.push(e.data);
  mediaRec.onstop=async()=>{st.getTracks().forEach(t=>t.stop());
   if(!chunks.length||!on)return;
   try{const blob=new Blob(chunks,{type:'audio/webm'});
    const ab=await blob.arrayBuffer();
    const ac=new AudioContext();let au=await ac.decodeAudioData(ab);
    let ch=au.getChannelData(0);
    if(au.sampleRate!==16000){const off=new OfflineAudioContext(1,Math.ceil(ch.length*16000/au.sampleRate),16000);
     const src=off.createBufferSource();src.buffer=au;src.connect(off.destination);src.start();
     au=await off.startRendering();ch=au.getChannelData(0)}
    FX.toast('🧠 transcribing...');
    const out=await whisper(ch,{language:'english',task:'transcribe'});
    const t=((out&&out.text)||'').trim();
    if(t&&t.length>2){FX.toast('🧠 '+t);const unk=handle(t,'voice');
     if(unk)say('Samajha nahi sir, dobara boliye?')}
    else FX.toast('🧠 kuch nahi suna');
   }catch(e){FX.toast('❌ whisper transcribe fail: '+e.message)}
   if(on)setTimeout(startChunks,3000)};
  mediaRec.start();setTimeout(()=>{if(mediaRec&&mediaRec.state==='recording')mediaRec.stop()},4000);
 }catch(e){FX.toast('❌ mic record fail: '+e.message)}}
function markDead(){if(sttDead)return;sttDead=true;
 FX.toast('🎙 browser STT mara hai — offline whisper try kar raha hoon');loadWhisper()}
async function meterOn(){try{micStream=await navigator.mediaDevices.getUserMedia({audio:true});
 actx=new(window.AudioContext||window.webkitAudioContext)();
 const src=actx.createMediaStreamSource(micStream);analyser=actx.createAnalyser();analyser.fftSize=256;src.connect(analyser);
 const buf=new Uint8Array(analyser.frequencyBinCount);
 const tickM=()=>{mRaf=requestAnimationFrame(tickM);analyser.getByteFrequencyData(buf);
  let s=0;for(let i=0;i<buf.length;i++)s+=buf[i];
  const lv=Math.min(100,s/buf.length*4);
  const m=document.getElementById('meter');if(m)m.style.width=lv+'%';
  if(lv>10)loud+=1/60;else loud=Math.max(0,loud-.2);
  if(on&&loud>2&&performance.now()-lastRes>3000&&!warned){warned=true;
   FX.toast('🎙 mic sun raha hai par browser text nahi bana raha');markDead()}
 };tickM()}catch(e){FX.toast('❌ mic access nahi mila: '+e.message)}}
function meterOff(){cancelAnimationFrame(mRaf);if(micStream)micStream.getTracks().forEach(t=>t.stop());
 micStream=null;loud=0;const m=document.getElementById('meter');if(m)m.style.width='0%'}
function handle(text,src){const r=window.MES.route(text);
 if(src==='chat')window.MES.ui.log(text,'u');else window.MES.ui.log('🎙 '+text,'u');
 if(r.ok){say(r.msg);window.MES.ui.log('⚡ '+r.msg,'a');window.MES.ui.toast('⚡ '+r.msg)}
 else if(r.ask){say(r.ask);window.MES.ui.log('🤔 '+r.ask,'a');window.MES.ui.toast('🤔 '+r.ask)}
 else return r;
 return null}
window.MES.handle=handle;
if(SR){rec=new SR();rec.lang=LANGS[0];rec.continuous=true;rec.interimResults=false;
 rec.onresult=e=>{retry=0;errs=0;lastRes=performance.now();warned=false;
  const t=e.results[e.results.length-1][0].transcript;
  const unk=handle(t,'voice');
  if(unk){window.MES.ui.log('🎙 '+t+' (samjha nahi)','s');say('Samajha nahi sir, dobara boliye?')}};
 rec.onerror=e=>{if(e.error==='no-speech')return;
  if(e.error==='network'){retry++;if(retry>=2){markDead();return}
   setTimeout(()=>{if(on)try{rec.start()}catch(x){}},1000);return}
  errs++;if(errs>3){markDead();return}
  if(errs>2&&li<LANGS.length-1){li++;rec.lang=LANGS[li];errs=0}};
 rec.onend=()=>{if(on&&!sttDead)try{rec.start()}catch(e){}}}
vbtn.onclick=()=>{if(!rec&&!sttDead){markDead()}
 on=!on;vbtn.style.background=on?'#0f6a':'#0009';
 if(on){if(!sttDead){try{rec.start()}catch(e){FX.toast('❌ rec.start fail: '+e.message)}}
  else{if(whisper)startChunks();else loadWhisper()}
  meterOn();window.MES.ui.toast('🎙 MIC ON — boliye');say('Haan sir, boliye')}
 else{if(rec)try{rec.stop()}catch(e){}
  if(mediaRec&&mediaRec.state==='recording')mediaRec.stop();
  meterOff();window.MES.ui.toast('🔇 MIC OFF');say('Theek hai sir')}};
window.testVoice=()=>{if(sttDead&&whisper)startChunks();else markDead()};
})();
