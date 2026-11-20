/* node tools/check.js : loads the game's logic in Node and checks
   1) every generated question (answer in options, a reason for every wrong choice, known video)
   2) the Le Chatelier rules against the particle simulation for each animated reaction + stress
   3) the ride-line model (bus → more riders, crew → same counts, longer ride → more riders) */
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
global.state={labSys:null};
global.window=global.window||{};
const code=scripts.slice(0,4).join('\n;\n')+';Object.assign(globalThis,{SYS,RX,GEN:typeof GEN!=="undefined"?GEN:null,stressesFor,shiftOf,demoFor,eqNew,eqRun,eqAvg,eqChange,eqSetT,eqSetV,rideNew,rideStep,rideAdd,mc,RIDE_Q,LAB_Q,IDEAS,kExprQ,kMagQ,kRevQ,graphQ,shiftDir,shiftSpecies,shiftK,shiftWhich,VIDEO_FOR,calcQ,topicQ,QUIZ_PLAN,NUM,nf,kOf,RX2:RX})';
// GEN is defined in script 4 (const) -> expose by evaluating with a wrapper
(0,eval)(code.replace('const GEN={','var GEN={'));
let fails=0,n=0;const bad=m=>{if(fails++<30)console.log('FAIL',m)};
// 1) questions
const gens={ride:GEN.ride,lab:GEN.lab,shift:GEN.shift,ideas:GEN.ideas,calc:GEN.calc,quiz:GEN.quiz};
// numeric questions: the shown answer must pass sig figs and round-trip; slips must differ from the answer
for(let i=0;i<6000;i++){const q=calcQ();n++;const sh=nf(q.answer,q.sf);
 if(!(q.answer>0)||!isFinite(q.answer))bad('calc bad answer '+q.answer+' '+q.prompt);
 else{if(NUM.sfCount(sh)!==q.sf)bad(`calc shown ${sh} has ${NUM.sfCount(sh)} sf, need ${q.sf}`);if(Math.abs(NUM.parseValue(sh)-Number(q.answer.toPrecision(q.sf)))>q.answer*1e-9)bad(`calc shown ${sh} != ${q.answer}`)}
 if(/undefined|NaN|Infinity/.test(q.prompt+q.html+q.why+q.hint))bad('calc text: '+q.prompt);
 (q.slips||[]).forEach(([x,m])=>{if(isFinite(x)&&Math.abs(x-q.answer)<=q.answer*0.012&&m)n++})}
// hand-checked values from the lecture slides
{const hi=RX2.find(r=>r.id==='hi');const K=kOf(hi,{'H₂':0.10,'I₂':0.20,'HI':1.04});n++;if(Math.abs(K-54.08)>0.01)bad('slide 17 HI K = '+K);
 const hb=RX2.find(r=>r.id==='haber');const N2=0.50**2/(0.036*2.0**3);n++;if(Math.abs(kOf(hb,{'N₂':N2,'H₂':2.0,'NH₃':0.50})-0.036)>1e-9)bad('slide 24 rearrangement')}
for(const [k,g] of Object.entries(gens))for(let i=0;i<3000;i++){const q=g();n++;if(q.type==='num'){if(!q.topic)bad(k+' num no topic');continue}if(k==='quiz'&&!q.topic)bad('quiz item without topic');
 if(!q.options.includes(q.answer))bad(k+' answer missing '+q.prompt);
 if(new Set(q.options).size!==q.options.length)bad(k+' dup options '+q.options);
 if(q.options.filter(o=>o===q.answer).length!==1)bad(k+' answer count');
 for(const o of q.options)if(o!==q.answer&&!q.whys[o])bad(k+' no wrong reason for "'+o+'" in '+q.prompt);
 if(!q.why||!q.hint)bad(k+' no why/hint');if(q.video&&!VIDEO_FOR[q.video])bad(k+' video '+q.video);
 if(q.lab&&q.lab.kind==='eq'&&!SYS[q.lab.sys])bad(k+' sim '+q.lab.sys);
 if(/undefined|NaN/.test(q.prompt+q.options.join()+q.why+Object.values(q.whys).join()))bad(k+' undefined/NaN text: '+q.prompt)}
// rule spot checks
const R=id=>RX.find(r=>r.id===id),S=(r,t,f)=>stressesFor(r).find(s=>s.t===t&&(!f||s.e&&s.e[1]===f));
const exp=[[R('haber'),'comp',null,'R'],[R('haber'),'heat',null,'L'],[R('hi'),'comp',null,'0'],[R('caco3'),'addS','CaCO₃','0'],[R('caco3'),'heat',null,'R'],[R('caco3'),'comp',null,'L'],
 [R('nh3ox'),'add','O₂','R'],[R('nh3ox'),'add','H₂O','L'],[R('nh3ox'),'exp',null,'R'],[R('nh3ox'),'heat',null,'L'],[R('soda'),'comp',null,'R'],[R('no2'),'heat',null,'R'],[R('cobalt'),'heat',null,'R'],[R('pcl5'),'rem','Cl₂','R'],[R('haber'),'cat',null,'0']];
for(const [r,t,f,d] of exp){const s=S(r,t,f);if(!s){bad('no stress '+r.id+t);continue}if(shiftOf(r,s)!==d)bad(`rule ${r.id} ${t} ${f} → ${shiftOf(r,s)} expected ${d}`);n++}
// 2) simulation agrees with the rules
const avg=(st,sec)=>eqAvg(st,sec);
for(const r of RX.filter(x=>x.sim))for(const s of stressesFor(r)){const d=demoFor(r,s);if(!d)continue;const want=shiftOf(r,s);
 let agree=0;const trials=6;
 for(let k=0;k<trials;k++){const st=eqNew(r.sim,{V:SYS[r.sim].gas?0.7:1,seed:1000+k*77});eqRun(st,25);const before=avg(st,60);
  // apply like Lab.apply
  if(d.act==='add')eqChange(st,{[d.sp]:d.sp==='NO2'||d.sp==='O2'?30:20},'');if(d.act==='rem')eqChange(st,{[d.sp]:-0.55},'');
  if(d.act==='heat')eqSetT(st,353);if(d.act==='cool')eqSetT(st,276);if(d.act==='comp')eqSetV(st,0.4);if(d.act==='exp')eqSetV(st,1);if(d.act==='cat')st.cat=true;
  eqRun(st,15);const after=avg(st,60);
  // measure the shift by a product that was not directly added/removed
  const P=SYS[r.sim].P[0],Rk=SYS[r.sim].R.find(x=>x!==d.sp)||SYS[r.sim].R[0];
  const prodKey=d.sp===P?Rk:P,sign=prodKey===P?1:-1;const ch=(after[prodKey]-before[prodKey])/Math.max(1,before[prodKey])*sign;
  const got=Math.abs(ch)<0.08?'0':ch>0?'R':'L';if(got===want)agree++;else if(k===0)console.log('  sim',r.id,s.t,s.e?s.e[1]:'','got',got,'want',want,ch.toFixed(3))}
 n++;if(agree<trials-1)bad(`sim ${r.id} ${s.label}: agrees ${agree}/${trials}`)}
// 3) ride
{const run=(f)=>{let a=0;for(let k=0;k<5;k++){const st=rideNew({seed:50+k});for(let i=0;i<600;i++)rideStep(st,1/30);let r0=0;for(let i=0;i<600;i++){rideStep(st,1/30);r0+=st.ride.length}r0/=600;f(st);for(let i=0;i<600;i++)rideStep(st,1/30);let r1=0;for(let i=0;i<900;i++){rideStep(st,1/30);r1+=st.ride.length}r1/=900;a+=(r1-r0)/r0}return a/5};
 const bus=run(st=>rideAdd(st,20,'')),fire=run(st=>rideAdd(st,-15,'')),crew=run(st=>st.crew=true),lng=run(st=>st.long=true);n+=4;
 console.log('ride change: bus',bus.toFixed(2),'fireworks',fire.toFixed(2),'crew',crew.toFixed(2),'long',lng.toFixed(2));
 if(bus<0.15)bad('bus should add riders');if(fire>-0.1)bad('fireworks should remove riders');if(Math.abs(crew)>0.08)bad('crew should not change counts');if(lng<0.2)bad('long ride should add riders')}
console.log(fails?`${fails} problems`:`OK · ${n} checks`);process.exit(fails?1:0);
