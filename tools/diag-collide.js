/* node tools/diag-collide.js : how reactions happen in the Particle Lab.
   For every reaction event: did it happen at a real collision (touching particles) or as a catch-up event?
   For catch-up events: how far apart were the particles that "reacted"? Also: does the average speed drift
   (the box heating up or cooling down on its own), and do particles stay overlapped? */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'engine-src.js'),'utf8');
eval(src+';globalThis.E={SYS,eqNew,eqRun,eqStep,eqChange,eqSetT,eqSetV,eqEvent,eqTransform,eqCollide}');
const S=E.SYS;
function run(sys,{T=298,secs=40,stress=null,V}={}){
 const st=E.eqNew(sys,{V:V??S[sys].V0??(S[sys].gas?0.7:1),seed:4242,T});const st0={...st.n};
 // wrap transform to measure the distance between the reacting particles
 const log=[];const origT=global.eqTransform||null;
 const rec={coll:0,fall:0,dists:[],farMoves:0};
 const step=()=>{const before=st.viaColl||0,ev0=st.evF+st.evR;E.eqStep(st,1/60);const nColl=(st.viaColl||0)-before,nAll=st.evF+st.evR-ev0;rec.coll+=nColl;rec.fall+=nAll-nColl};
 for(let i=0;i<60*10;i++)step();                       // settle
 if(stress)stress(st);const st1={...st.n};
 rec.coll=0;rec.fall=0;
 let sp0=0,spN=0,ov=0,ovN=0;const speeds=[];
 for(let i=0;i<60*secs;i++){step();if(i%30===0){let s=0;for(const p of st.parts)s+=Math.hypot(p.vx,p.vy);speeds.push(s/st.parts.length);
   let o=0;for(let a=0;a<st.parts.length;a++)for(let b=a+1;b<st.parts.length;b++){const A=st.parts[a],B=st.parts[b],R=(S[sys].sp[A.s].r+S[sys].sp[B.s].r)*0.6;if((A.x-B.x)**2+(A.y-B.y)**2<R*R)o++}ov+=o;ovN++}}
 const tot=rec.coll+rec.fall;
 const base=stress?st1:st0;const conserved=extentOK(sys,base,st.n);
 return {conserved,atCollision:tot?Math.round(rec.coll/tot*100)+'%':'-',reactionsPerS:(tot/secs).toFixed(1),speedStart:speeds[0].toFixed(0),speedEnd:speeds[speeds.length-1].toFixed(0),deepOverlapsPerFrame:(ov/ovN).toFixed(1),n:JSON.stringify(st.n)};
}
/* conservation: every species must agree on how far the reaction has run (extent ξ), so no atoms appear or vanish */
function extentOK(sys,n0,n){const sy=S[sys],nu={};sy.R.forEach(r=>nu[r]=(nu[r]||0)+1);sy.P.forEach(p=>nu[p]=(nu[p]||0)-1);
 const xs=Object.keys(nu).map(k=>(n0[k]-n[k])/nu[k]);return xs.every(x=>Math.abs(x-xs[0])<1e-9)}
const cases=[];
for(const sys of Object.keys(S)){cases.push([sys,'25 °C',{}]);if(S[sys].heat){cases.push([sys,'90 °C',{T:363}]);cases.push([sys,'2 °C',{T:275}])}
 const st0=S[sys].stress[0];cases.push([sys,'after '+st0[1],{stress:st=>E.eqChange(st,st0[2],'')}])}
module.exports={run,cases};
if(require.main===module)for(const [sys,label,o] of cases){const r=run(sys,o);console.log(sys.padEnd(7),label.padEnd(28),JSON.stringify(r))}
