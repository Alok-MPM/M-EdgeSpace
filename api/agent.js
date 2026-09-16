/* api/agent.js v3 — real error dikhata hai + model list + env override */
const SYS=`Tum M-EdgeSpace 3D studio ka andar ka agent ho. User Hinglish bolta hai.
Hamesha sirf JSON do: {"reply":"<chhota Hinglish jawab>","cmds":[...]}
cmds (max 8) sirf is list se:
{"op":"add","type":"cube|sphere|cyl|torus"}
{"op":"morph","type":"cube|rect|sheet|tall|sphere|cyl|torus"}
{"op":"rot","axis":"x|y|z","deg":number}
{"op":"scale","f":0.2..5}
{"op":"stretch","axis":"x|y|z","f":0.1..6}
{"op":"move","x":-3..3,"y":-2..2,"z":-3..3}
{"op":"color","color":"#rrggbb"}
{"op":"del"} {"op":"clear"} {"op":"dup"} {"op":"sel"} {"op":"zoom","d":-2..2}
cmds selected/last object pe lagti hain.
Design examples: "water bottle banao" → [{"op":"add","type":"cyl"},{"op":"stretch","axis":"y","f":1.8},{"op":"scale","f":0.7}]
"cube ki side badhao" → [{"op":"stretch","axis":"x","f":1.3}]
"ghuma ke upar rakho" → [{"op":"rot","axis":"y","deg":45},{"op":"move","y":1}]
Naya design = add+move+morph+color+stretch ka sequence khud socho.
Design ki baat na ho to cmds:[] aur friendly Hinglish reply do.`;
const DEFAULT_MODELS=[
 'meta-llama/llama-3.3-70b-instruct:free',
 'meta-llama/llama-3.2-3b-instruct:free',
 'mistralai/mistral-7b-instruct:free',
 'qwen/qwen-2.5-7b-instruct:free'];
const MODELS=()=>process.env.OPENROUTER_MODEL?
 [process.env.OPENROUTER_MODEL,...DEFAULT_MODELS]:DEFAULT_MODELS;
export default async function handler(req,res){
 if(req.method==='GET')return res.status(200).json({ok:true,key:!!process.env.OPENROUTER_API_KEY,models:MODELS()});
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const key=process.env.OPENROUTER_API_KEY;
 if(!key)return res.status(500).json({error:'OPENROUTER_API_KEY set nahi hai'});
 const {text}=req.body||{};
 let lastErr='koi model try nahi hua';
 for(const model of MODELS()){
  try{
   const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json',
     'HTTP-Referer':'https://m-edge-space.vercel.app','X-Title':'M-EdgeSpace'},
    body:JSON.stringify({model,messages:[{role:'system',content:SYS},{role:'user',content:(text||'')}],
     temperature:0.4,max_tokens:300})});
   if(!r.ok){lastErr=model+' → HTTP '+r.status+' '+((await r.text())||'').slice(0,120);continue}
   const j=await r.json();
   const content=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'';
   const m=content.match(/\{[\s\S]*\}/);
   let out;try{out=JSON.parse(m?m[0]:content)}catch(e){out={reply:content,cmds:[]}}
   return res.status(200).json(out);
  }catch(e){lastErr=model+' → '+(e.message||'fetch fail')}
 }
 return res.status(500).json({error:'OpenRouter fail: '+lastErr});
}
