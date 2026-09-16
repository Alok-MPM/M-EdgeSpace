/* api/agent.js — Vercel server function: OpenRouter Llama (key server pe safe) */
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
cmds selected/last object pe lagti hain. Naya design banane ke liye add+move+morph+color ka sequence do.
Design ki baat na ho to cmds:[] aur friendly Hinglish reply do.`;
const MODELS=['meta-llama/llama-3.2-3b-instruct:free','meta-llama/llama-3.3-70b-instruct:free'];
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'POST only'});
 const key=process.env.OPENROUTER_API_KEY;
 if(!key)return res.status(500).json({error:'OPENROUTER_API_KEY set nahi hai (Vercel Settings)'});
 const {text}=req.body||{};
 for(const model of MODELS){
  try{
   const r=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',
    headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json',
     'HTTP-Referer':'https://m-edge-space.vercel.app','X-Title':'M-EdgeSpace'},
    body:JSON.stringify({model,messages:[{role:'system',content:SYS},{role:'user',content:(text||'')}],
     temperature:0.4,max_tokens:300})});
   if(!r.ok)continue;
   const j=await r.json();
   const content=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||'';
   const m=content.match(/\{[\s\S]*\}/);
   let out;try{out=JSON.parse(m?m[0]:content)}catch(e){out={reply:content,cmds:[]}}
   return res.status(200).json(out);
  }catch(e){}
 }
 return res.status(500).json({error:'agent unreachable'});
}
