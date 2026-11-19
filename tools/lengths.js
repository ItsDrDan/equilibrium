const fs=require('fs'),path=require('path');const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);global.state={labSys:null};
(0,eval)(scripts.slice(0,4).join('\n;\n').replace('const GEN={','var GEN={')+';globalThis.GEN=GEN;globalThis.RIDE_Q=RIDE_Q;globalThis.LAB_Q=LAB_Q;globalThis.IDEAS=IDEAS;globalThis.mc=mc;globalThis.APPS=APPS');
const strip=s=>s.replace(/<[^>]+>/g,'').length;
for(const m of ['ride','lab','shift','ideas']){let L=0,n=0;for(let i=0;i<4000;i++){const q=GEN[m]();if(q.options.length<3)continue;n++;const a=strip(q.answer);if(q.options.every(o=>o===q.answer||strip(o)<a))L++}console.log(m,'answer is longest',(L/n*100).toFixed(0)+'%')}
// list fixed items where answer is longest
for(const [name,list] of [['RIDE',RIDE_Q.map(f=>f())],['LAB',LAB_Q.map(x=>x.f())],['IDEAS',IDEAS.map(x=>({choices:x.c,prompt:x.p}))],['APPS',APPS.map(x=>({choices:x.c}))]])list.forEach((it,i)=>{const r=it.choices.find(c=>c[1])[0],mx=Math.max(...it.choices.filter(c=>!c[1]).map(c=>strip(c[0])));if(strip(r)>mx)console.log(name,i,strip(r),'vs',mx,'|',r)});
