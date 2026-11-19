/*EQ-ENGINE-START*/
/* Particle equilibrium engine (no DOM). Rates come from mass action on the particle counts:
   forward rate = kf·(reactant counts)/V^(n−1), reverse rate = kr·(product counts)/V^(m−1).
   The amounts (st.x) follow those rate equations smoothly, and individual particles react forward and back
   at exactly those rates (accumulators), so the balance reads cleanly while the flashes show it is dynamic.
   Temperature changes kf and kr through Arrhenius factors whose difference is the sign of ΔH,
   so heating favors the endothermic direction; a catalyst multiplies BOTH by the same factor. */
const EQ_T0=298,EQ_R=8.314;
const SYS={
 no2:{title:'N₂O₄ ⇌ NO₂ (sealed flask)',gas:true,heat:true,dH:57,
  eq:[[1,'N2O4','g']],eqP:[[2,'NO2','g']],
  sp:{N2O4:{l:'N₂O₄',c:'#f3ead2',e:'#9c8456',r:9},NO2:{l:'NO₂',c:'#b5562a',e:'#6f3015',r:7}},
  R:['N2O4'],P:['NO2','NO2'],kf:0.16,kr:0.0042,Ef:26000,Er:-18000,
  units:{N2O4:1,NO2:0.5},total:60,                       // 60 N₂O₄-equivalents
  tint:{sp:'NO2',rgb:[160,72,28],k:0.0085,max:0.62},tintName:'brown color',
  look:'brown NO₂ gas; N₂O₄ is nearly colorless',
  stress:[['addR','➕ N₂O₄',{N2O4:15}],['addP','➕ NO₂',{NO2:30}],['remP','➖ NO₂',{NO2:-0.5}]]},
 hi:{title:'H₂ + I₂ ⇌ 2 HI',gas:true,heat:true,dH:-9,
  eq:[[1,'H2','g'],[1,'I2','g']],eqP:[[2,'HI','g']],
  sp:{H2:{l:'H₂',c:'#ffffff',e:'#7d8a94',r:5.5},I2:{l:'I₂',c:'#6b3fa0',e:'#3e1f63',r:9},HI:{l:'HI',c:'#d8c8ec',e:'#7a62a0',r:7}},
  R:['H2','I2'],P:['HI','HI'],kf:0.0105,kr:0.00175,Ef:22000,Er:47000,
  units:{H2:1,I2:1,HI:1},total:null,start:{H2:40,I2:40,HI:0},
  tint:{sp:'I2',rgb:[110,50,160],k:0.012,max:0.6},tintName:'purple color',
  look:'violet I₂ vapor; H₂ and HI are colorless',
  stress:[['addR','➕ H₂',{H2:20}],['addR2','➕ I₂',{I2:20}],['addP','➕ HI',{HI:30}]]},
 fescn:{title:'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺ (blood-red)',gas:false,heat:true,dH:-1,
  eq:[[1,'Fe','aq'],[1,'SCN','aq']],eqP:[[1,'FeSCN','aq']],
  sp:{Fe:{l:'Fe³⁺',c:'#f0c64a',e:'#a7801a',r:7.5},SCN:{l:'SCN⁻',c:'#cfd7dd',e:'#6f7b84',r:6},FeSCN:{l:'FeSCN²⁺',c:'#b3122a',e:'#6b0716',r:9.5}},
  R:['Fe','SCN'],P:['FeSCN'],kf:0.0036,kr:0.075,Ef:20000,Er:50000,
  units:{Fe:1,SCN:1,FeSCN:1},start:{Fe:45,SCN:45,FeSCN:0},
  tint:{sp:'FeSCN',rgb:[178,18,40],k:0.016,max:0.7},tintName:'red color',
  look:'blood-red FeSCN²⁺; Fe³⁺ is pale yellow, SCN⁻ colorless',
  stress:[['addR','➕ Fe³⁺',{Fe:20}],['addR2','➕ SCN⁻',{SCN:20}],['remR','➖ Fe³⁺',{Fe:-0.6}]]},
 hb:{title:'Hb + O₂ ⇌ HbO₂ (your blood)',gas:false,heat:false,dH:null,
  eq:[[1,'Hb','aq'],[1,'O2','g']],eqP:[[1,'HbO2','aq']],
  sp:{Hb:{l:'Hb',c:'#7b2f4a',e:'#45142a',r:10},O2:{l:'O₂',c:'#9fd3f2',e:'#3f86b5',r:5.5},HbO2:{l:'HbO₂',c:'#ef4a3c',e:'#9c1d14',r:11}},
  R:['Hb','O2'],P:['HbO2'],kf:0.0042,kr:0.1,Ef:30000,Er:30000,
  units:{Hb:1,O2:1,HbO2:1},start:{Hb:35,O2:60,HbO2:0},
  tint:{sp:'HbO2',rgb:[220,40,40],k:0.014,max:0.62},tintName:'bright red color',
  look:'oxygen-rich blood is bright red; low-oxygen blood is darker',
  stress:[['remR2','⛰️ Climb high (less O₂)',{O2:-0.55}],['addR2','😷 Oxygen mask (+O₂)',{O2:30}],['addR','🩸 Body makes more Hb',{Hb:15}]]}
};
function eqCount(st,list){/* mass-action factor for one side, e.g. ['NO2','NO2'] → x² */
 let f=1;list.forEach(s=>f*=Math.max(0,st.x[s]||0));return f}
function eqK(st){/* rate constants with temperature + catalyst */
 const S=SYS[st.sys],a=E=>Math.exp(-E/EQ_R*(1/st.T-1/EQ_T0)),c=st.cat?3:1;
 return {kf:S.kf*a(S.Ef)*c,kr:S.kr*a(S.Er)*c}}
function eqRates(st){const S=SYS[st.sys],k=eqK(st);
 return {f:k.kf*eqCount(st,S.R)/Math.pow(st.V,S.R.length-1),r:k.kr*eqCount(st,S.P)/Math.pow(st.V,S.P.length-1)}}
/* K in "particles per box" units; Q is the same ratio from the current counts */
function eqKval(st){const k=eqK(st);return k.kf/k.kr}
function eqQ(st,n=st.x){const S=SYS[st.sys];let num=1,den=1;S.P.forEach(s=>num*=(n[s]||0)/st.V);S.R.forEach(s=>den*=(n[s]||0)/st.V);return den>0?num/den:Infinity}
function eqRand(st){st.seed=(st.seed*1664525+1013904223)>>>0;return st.seed/4294967296}
function eqPoisson(st,l){if(l<=0)return 0;let L=Math.exp(-l),k=0,p=1;do{k++;p*=eqRand(st)}while(p>L&&k<50);return k-1}
function eqNew(sys,o={}){const S=SYS[sys];
 const st={sys,T:o.T||EQ_T0,V:o.V||1,cat:!!o.cat,t:0,n:{},parts:[],W0:o.W0||600,H:o.H||330,seed:o.seed||((Math.random()*4294967296)>>>0),
  ema:{f:0,r:0},hist:[],marks:[],flashes:[],evF:0,evR:0,accF:0,accR:0,x:{}};
 Object.keys(S.sp).forEach(s=>st.n[s]=0);
 const start=o.start||S.start||{[S.R[0]]:S.total};
 for(const s in start)for(let i=0;i<start[s];i++)eqSpawn(st,s);
 Object.keys(S.sp).forEach(s=>st.x[s]=st.n[s]);const r=eqRates(st);st.ema={f:r.f,r:r.r};return st}
function eqW(st){return st.W0*st.V}
function eqSpawn(st,s,x,y){const S=SYS[st.sys],sp=S.sp[s],W=eqW(st),m=sp.r+2;
 const a=eqRand(st)*Math.PI*2,v=(38+eqRand(st)*34)*(9/sp.r)**0.5;
 const p={s,x:x??m+eqRand(st)*(W-2*m),y:y??m+eqRand(st)*(st.H-2*m),vx:Math.cos(a)*v,vy:Math.sin(a)*v,born:st.t};
 st.parts.push(p);st.n[s]=(st.n[s]||0)+1;return p}
function eqKill(st,p){const i=st.parts.indexOf(p);if(i>=0){st.parts.splice(i,1);st.n[p.s]--}}
function eqPickPartner(st,p,s){let best=null,bd=1e18;for(const q of st.parts){if(q===p||q.s!==s)continue;const d=(q.x-p.x)**2+(q.y-p.y)**2;if(d<bd){bd=d;best=q}}return best}
/* one reaction event: reactant particles become product particles in the same place */
function eqEvent(st,from,to,dir){const pool=st.parts.filter(p=>p.s===from[0]);if(!pool.length)return false;
 const a=pool[Math.floor(eqRand(st)*pool.length)],used=[a];
 for(let i=1;i<from.length;i++){const b=eqPickPartner(st,used[0],from[i]);if(!b||used.includes(b))return false;used.push(b)}
 const cx=used.reduce((s,p)=>s+p.x,0)/used.length,cy=used.reduce((s,p)=>s+p.y,0)/used.length;
 used.forEach(p=>eqKill(st,p));
 to.forEach((s,i)=>{let x=cx,y=cy;if(to.length>used.length){const ang=eqRand(st)*Math.PI*2;x+=Math.cos(ang)*9*(i?1:-1);y+=Math.sin(ang)*9*(i?1:-1)}
  else if(to.length===used.length){x=used[i].x;y=used[i].y}eqClamp(st,eqSpawn(st,s,x,y))});
 st.flashes.push({x:cx,y:cy,t:st.t,dir});return true}
function eqClamp(st,p){const r=SYS[st.sys].sp[p.s].r,W=eqW(st);if(p.x<r){p.x=r;p.vx=Math.abs(p.vx)}if(p.x>W-r){p.x=W-r;p.vx=-Math.abs(p.vx)}if(p.y<r){p.y=r;p.vy=Math.abs(p.vy)}if(p.y>st.H-r){p.y=st.H-r;p.vy=-Math.abs(p.vy)}}
function eqStep(st,dt){const S=SYS[st.sys],sub=6,h=dt/sub;
 for(let j=0;j<sub;j++){const r=eqRates(st),net=(r.f-r.r)*h;
  S.R.forEach(s=>st.x[s]=Math.max(0,st.x[s]-net));S.P.forEach(s=>st.x[s]=Math.max(0,st.x[s]+net));st.accF+=r.f*h;st.accR+=r.r*h}
 /* particles follow: one event per whole unit of each rate; keep particle counts within one step of x */
 let guard=0;while((st.accF>=1||st.accR>=1)&&guard++<200){
  if(st.accF>=1&&(st.accF>=st.accR||st.accR<1)){st.accF--;if(eqEvent(st,S.R,S.P,1))st.evF++}
  else{st.accR--;if(eqEvent(st,S.P,S.R,-1))st.evR++}}
 for(const s of new Set(S.P)){const lag=st.n[s]-st.x[s];
  if(lag<-1.5){if(eqEvent(st,S.R,S.P,1))st.evF++}else if(lag>1.5){if(eqEvent(st,S.P,S.R,-1))st.evR++}}
 const sp=Math.sqrt(st.T/EQ_T0);
 for(const p of st.parts){p.x+=p.vx*dt*sp/(p.sp0||1);p.y+=p.vy*dt*sp/(p.sp0||1);eqClamp(st,p)}
 const r2=eqRates(st);st.ema.f=r2.f;st.ema.r=r2.r;
 st.t+=dt;st.flashes=st.flashes.filter(f=>st.t-f.t<0.45)}
/* stresses: add/remove particles, temperature, volume, catalyst. Each leaves a mark on the graph. */
function eqChange(st,delta,label){for(const s in delta){let d=delta[s];
  if(d>0){for(let i=0;i<d;i++)eqSpawn(st,s);st.x[s]+=d}
  else{const k=d>-1?Math.round((st.n[s]||0)*-d):-d;let gone=0;for(let i=0;i<k;i++){const pool=st.parts.filter(p=>p.s===s);if(!pool.length)break;eqKill(st,pool[Math.floor(eqRand(st)*pool.length)]);gone++}st.x[s]=Math.max(0,st.x[s]-gone)}}
 st.marks.push({t:st.t,label})}
function eqSetT(st,T){st.T=T}
function eqSetV(st,V){st.V=V;st.parts.forEach(p=>eqClamp(st,p))}
function eqRun(st,sec,dt=1/30){const n=Math.round(sec/dt);for(let i=0;i<n;i++)eqStep(st,dt)}
/* average counts over a window (to read a noisy dynamic equilibrium) */
function eqAvg(st,sec,dt=1/30){const S=SYS[st.sys],sum={};Object.keys(S.sp).forEach(s=>sum[s]=0);const n=Math.round(sec/dt);
 for(let i=0;i<n;i++){eqStep(st,dt);for(const s in sum)sum[s]+=st.n[s]}for(const s in sum)sum[s]/=n;return sum}
/* the same physics for the ride line: queue ⇌ ride (A ⇌ B), first-in first-out so a guest can be followed */
const RIDE={kb:0.1,ku:0.2,crew:2.5,long:0.5};
function rideNew(o={}){const st={t:0,queue:[],ride:[],guests:[],crew:false,long:false,xq:0,xr:0,accF:0,accR:0,seed:o.seed||((Math.random()*4294967296)>>>0),ema:{f:0,r:0},hist:[],marks:[],evF:0,evR:0,boardLog:[],unloadLog:[]};
 const n=o.n||60;for(let i=0;i<n;i++){const g={id:i,gold:i===7,x:40,y:40};st.guests.push(g);st.queue.push(g)}st.xq=n;return st}
function rideK(st){const c=st.crew?RIDE.crew:1;return {kb:RIDE.kb*c,ku:RIDE.ku*c*(st.long?RIDE.long:1)}}
function rideRates(st){const k=rideK(st);return {f:k.kb*st.xq,r:k.ku*st.xr}}
function rideStep(st,dt){const r=rideRates(st),net=(r.f-r.r)*dt;st.xq-=net;st.xr+=net;st.accF+=r.f*dt;st.accR+=r.r*dt;
 let nb=Math.floor(st.accF),nu=Math.floor(st.accR);st.accF-=nb;st.accR-=nu;
 const lag=st.ride.length+nb-nu-st.xr;if(lag<-1.5)nb++;else if(lag>1.5)nu++;
 for(let i=0;i<nb&&st.queue.length;i++){const g=st.queue.shift();g.ang=0;g.on=st.t;g.justOn=true;st.ride.push(g);st.evF++;st.boardLog.push(st.t)}
 for(let i=0;i<nu&&st.ride.length;i++){const g=st.ride.shift();st.queue.push(g);g.back=st.t;g.justBack=true;st.evR++;st.unloadLog.push(st.t)}
 const r2=rideRates(st);st.ema.f=r2.f;st.ema.r=r2.r;st.t+=dt;
 const cut=st.t-10;while(st.boardLog.length&&st.boardLog[0]<cut)st.boardLog.shift();while(st.unloadLog.length&&st.unloadLog[0]<cut)st.unloadLog.shift()}
function rideAdd(st,n,label){if(n>0){for(let i=0;i<n;i++){const g={id:st.guests.length,x:-20,y:300,arrive:st.t};st.guests.push(g);st.queue.push(g)}st.xq+=n}
 else{const before=st.queue.length;for(let i=0;i<-n&&st.queue.length>1;i++){const idx=st.queue.length-1-Math.floor(eqRand(st)*Math.min(st.queue.length-1,25));const g=st.queue[idx];if(g.gold){continue}st.queue.splice(idx,1);g.gone=st.t;st.guests.splice(st.guests.indexOf(g),1)}st.xq=Math.max(0,st.xq-(before-st.queue.length))}
 st.marks.push({t:st.t,label})}
/*EQ-ENGINE-END*/
