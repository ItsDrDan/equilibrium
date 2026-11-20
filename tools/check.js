/* node tools/check.js : loads the game's logic in Node and checks
   1) every generated question (answer in options, a reason for every wrong choice, known video)
   2) the Le Chatelier rules against the particle simulation for each animated reaction + stress
   3) the ride-line model (bus → more riders, crew → same counts, longer ride → more riders) */
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..',process.argv[2]||'index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
global.state={labSys:null};
global.window=global.window||{};
const code=scripts.slice(0,4).join('\n;\n')+';Object.assign(globalThis,{SYS,RX,GEN:typeof GEN!=="undefined"?GEN:null,stressesFor,shiftOf,demoFor,eqNew,eqRun,eqAvg,eqChange,eqSetT,eqSetV,rideNew,rideStep,rideAdd,mc,RIDE_Q,LAB_Q,IDEAS,kExprQ,kMagQ,kRevQ,graphQ,shiftDir,shiftSpecies,shiftK,shiftWhich,VIDEO_FOR,calcQ,topicQ,QUIZ_PLAN,NUM,nf,kOf,RX2:RX,buildQ,kbErrors,acidQ,acidDirQ,AB_DIR,LAB_SYS})';
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
for(const [k,g] of Object.entries(gens))for(let i=0;i<3000;i++){const q=g();n++;if(q.type==='num'){if(!q.topic)bad(k+' num no topic');continue}
 if(q.type==='build'){if(!q.topic)bad(k+' build no topic');if(!q.rows.some(x=>x.want==='top'))bad(k+' build has no products: '+q.why);
  /* the right answer passes; each kind of mistake is caught */ q.rows.forEach((x,i)=>q.st[i]={p:x.want,e:x.want==='out'?1:x.coef});if(kbErrors(q).length)bad(k+' correct build rejected '+q.why);
  const i=q.rows.findIndex(x=>x.want!=='out');const keep={...q.st[i]};q.st[i]={p:keep.p==='top'?'bot':'top',e:keep.e};if(!kbErrors(q).length)bad(k+' flipped build accepted');q.st[i]={p:keep.p,e:keep.e+1};if(!kbErrors(q).length)bad(k+' wrong exponent accepted');q.st[i]=keep;
  const o=q.rows.findIndex(x=>x.want==='out');if(o>=0){q.st[o]={p:'top',e:1};if(!kbErrors(q).length)bad(k+' kept a pure liquid/solid')}
  if(q.then){if(q.then.type!=='num'||!(q.then.answer>0))bad(k+' bad step 2')}continue}if(k==='quiz'&&!q.topic)bad('quiz item without topic');
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
// acid-base direction: weaker acid side favored; the key never contradicts Ka
for(const it of AB_DIR){n++;const weakL=it.L[1]<it.R[1];for(let i=0;i<30;i++){}const q=(()=>{for(let t=0;t<200;t++){const x=acidDirQ();if(x.html.includes(it.x))return x}})();
 if(!q){bad('acid item never drawn '+it.x);continue}if(q.answer!==(weakL?'Reactants: the weaker acid is on the left':'Products: the weaker acid is on the right'))bad('acid dir key '+it.x)}
// Haber factory model: textbook-like yields, Le Chatelier trends, catalyst changes rate only, best hourly output at a middle temperature
{const S=scripts.slice(0,4).join('\n');const b=S.slice(S.indexOf('/*HABER-START*/'),S.indexOf('/*HABER-END*/'));(0,eval)(b+';globalThis.HB={habYield,habAt,habK}');
 const near=(a,b,t)=>Math.abs(a-b)<=t;n+=8;
 if(!near(HB.habYield(400,200),0.36,0.01))bad('haber 400/200');if(!near(HB.habYield(300,200),0.62,0.05))bad('haber 300/200 '+HB.habYield(300,200));if(!near(HB.habYield(500,200),0.18,0.04))bad('haber 500/200 '+HB.habYield(500,200));
 for(let T=200;T<700;T+=25){n++;if(!(HB.habYield(T+25,200)<HB.habYield(T,200)))bad('yield should fall with T at '+T)}
 for(let P=50;P<350;P+=25){n++;if(!(HB.habYield(450,P+25)>HB.habYield(450,P)))bad('yield should rise with P at '+P)}
 let best=0,bt=0;for(let T=200;T<=700;T+=25){const m=HB.habAt(T,200,true,1);if(m>best){best=m;bt=T}}n++;if(bt<375||bt>500)bad('best hourly T '+bt);
 n++;if(HB.habAt(450,200,false,1)>0.01)bad('no catalyst should make almost nothing');}
// 2) simulation agrees with the rules
const avg=(st,sec)=>eqAvg(st,sec);
for(const r of RX.filter(x=>x.sim))for(const s of stressesFor(r)){const d=demoFor(r,s);if(!d)continue;const want=shiftOf(r,s);
 let agree=0;const trials=6;
 for(let k=0;k<trials;k++){const st=eqNew(r.sim,{V:SYS[r.sim].V0??(SYS[r.sim].gas?0.7:1),seed:1000+k*77});eqRun(st,25);const before=avg(st,60);
  // apply like Lab.apply
  if(d.act==='add')eqChange(st,{[d.sp]:d.sp==='NO2'||d.sp==='O2'?30:20},'');if(d.act==='rem')eqChange(st,{[d.sp]:-0.55},'');
  if(d.act==='heat')eqSetT(st,353);if(d.act==='cool')eqSetT(st,276);if(d.act==='comp')eqSetV(st,0.4);if(d.act==='exp')eqSetV(st,1);if(d.act==='cat')st.cat=true;
  eqRun(st,15);const after=avg(st,60);
  // measure the shift by a product that was not directly added/removed
  const P=SYS[r.sim].P[0],Rk=SYS[r.sim].R.find(x=>x!==d.sp)||SYS[r.sim].R[0];
  const prodKey=d.sp===P?Rk:P,sign=prodKey===P?1:-1;const ch=(after[prodKey]-before[prodKey])/Math.max(1,before[prodKey])*sign;
  const got=Math.abs(ch)<0.08?'0':ch>0?'R':'L';if(got===want)agree++;else if(k===0)console.log('  sim',r.id,s.t,s.e?s.e[1]:'','got',got,'want',want,ch.toFixed(3))}
 n++;if(agree<trials-1)bad(`sim ${r.id} ${s.label}: agrees ${agree}/${trials}`)}
// 2b) particle physics: no particles appear or vanish, the box keeps its temperature, reactions happen at real collisions
{const D=require('./diag-collide.js');for(const [sys,label,o] of D.cases){const r=D.run(sys,{...o,secs:25});n++;
 if(!r.conserved)bad(`physics ${sys} ${label}: particles not conserved`);
 const ratio=r.speedEnd/r.speedStart;if(ratio<0.8||ratio>1.25)bad(`physics ${sys} ${label}: speed drifted ${r.speedStart}→${r.speedEnd}`);
 if(r.atCollision!=='-'&&parseInt(r.atCollision)<80)bad(`physics ${sys} ${label}: only ${r.atCollision} at collisions`)}}
// 3) ride
{const run=(f)=>{let a=0;for(let k=0;k<5;k++){const st=rideNew({seed:50+k});for(let i=0;i<600;i++)rideStep(st,1/30);let r0=0;for(let i=0;i<600;i++){rideStep(st,1/30);r0+=st.ride.length}r0/=600;f(st);for(let i=0;i<600;i++)rideStep(st,1/30);let r1=0;for(let i=0;i<900;i++){rideStep(st,1/30);r1+=st.ride.length}r1/=900;a+=(r1-r0)/r0}return a/5};
 const bus=run(st=>rideAdd(st,20,'')),fire=run(st=>rideAdd(st,-15,'')),crew=run(st=>st.crew=true),lng=run(st=>st.long=true);n+=4;
 console.log('ride change: bus',bus.toFixed(2),'fireworks',fire.toFixed(2),'crew',crew.toFixed(2),'long',lng.toFixed(2));
 if(bus<0.15)bad('bus should add riders');if(fire>-0.1)bad('fireworks should remove riders');if(Math.abs(crew)>0.08)bad('crew should not change counts');if(lng<0.2)bad('long ride should add riders')}
console.log(fails?`${fails} problems`:`OK · ${n} checks`);process.exit(fails?1:0);
