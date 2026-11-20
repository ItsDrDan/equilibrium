/* Click every build-K question exactly right (real clicks, in every mode it appears in) and confirm it is marked correct.
   Also: click it right, but in a different click order (exponent first, then placement; Leave out after changing an exponent). */
const {chromium}=require('/private/tmp/claude-501/-Users-dan--claude-spares-spare-6vrmJJ/66519caf-7477-45b2-aeec-b1d3103c4b3e/scratchpad/pw/node_modules/playwright');
const URL=process.argv[2]||'http://localhost:8677/';  /* usage: node tools/check-build-clicks.js <url of the game> (needs Playwright) */
(async()=>{const b=await chromium.launch({channel:'chrome'});const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(URL);await p.waitForTimeout(1200);
 const ids=await p.evaluate(()=>RX.map(r=>r.id));let bad=0,n=0;
 for(const mode of ['ideas','quiz','calc'])for(const id of ids)for(const order of ['normal','expFirst']){
  const ok=await p.evaluate(({mode,id})=>{state.mode=mode;state.done=false;state.q=null;if(mode==='quiz'){state.quiz=null}const r=RX.find(x=>x.id===id);let q=buildQ(r,{topic:mode==='quiz'?'kexpr':undefined});
   if(mode==='calc'){const c=calcQ('kc',r);if(c&&c.type==='num'){q.then=c}}
   const old=GEN[mode];GEN[mode]=()=>q;next();GEN[mode]=old;return true},{mode,id});
  const rows=await p.evaluate(()=>state.q.rows.map(x=>({want:x.want,coef:x.coef,f:x.f})));
  for(let i=0;i<rows.length;i++){const x=rows[i];const sel=`.kbrow[data-row="${i}"]`;
   const ups=x.want==='out'?0:x.coef-1;
   if(order==='expFirst'){for(let k=0;k<ups;k++)await p.click(`${sel} [data-ex="1"]`);await p.click(`${sel} [data-p="${x.want}"]`)}
   else{await p.click(`${sel} [data-p="${x.want}"]`);for(let k=0;k<ups;k++)await p.click(`${sel} [data-ex="1"]`)}}
  await p.click('#checkBtn');n++;
  const res=await p.evaluate(()=>({fb:$('fb').textContent.slice(0,60),cls:$('fb').className,quizOk:state.quiz&&state.quiz.res.length?state.quiz.res[state.quiz.res.length-1].ok:null,st:JSON.stringify(state.q.st||'')}));
  const good=/good/.test(res.cls)&&!/Not this time|Not quite|Almost/.test(res.fb)&&(mode!=='quiz'||res.quizOk===true);
  if(!good){bad++;if(bad<15)console.log('WRONG',mode,id,order,JSON.stringify(rows),'|',res.fb,'| quizOk',res.quizOk,res.st)}}
 console.log(`${n} correct builds clicked, ${bad} marked wrong`,errs.length?errs:'');await b.close()})();
