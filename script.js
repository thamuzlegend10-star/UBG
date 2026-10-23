'use strict';
/* ================= CONFIG + DATA ================= */
const KEY='tdba-save-v1',PFX='tdba-room-',ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',REST=.5,ROUND_T=90,WINR=2,RING=280,SNAP_MS=33,IN_MS=20,GREG=26,GREG_HOLD=7,GDLY=.8;
const MU='1d676475c53bd584694643e3',MC='HRo8LpXR0azCwMul';
const ICE=[{urls:'stun:stun.relay.metered.ca:80'},{urls:'stun:stun.l.google.com:19302'},...['turn:global.relay.metered.ca:80','turn:global.relay.metered.ca:80?transport=tcp','turn:global.relay.metered.ca:443','turns:global.relay.metered.ca:443?transport=tcp','turn:standard.relay.metered.ca:80','turn:standard.relay.metered.ca:443?transport=tcp'].map(u=>({urls:u,username:MU,credential:MC})),...((typeof window!=='undefined'&&window.TURN_SERVERS)||[])];
const cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,rnd=Math.random,r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
const adiff=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const STY=['basic','slugger','ghost','counter','ippo','hitman'];
const ST={
basic:{n:'Basic',col:'#d9d9d4',hp:100,spd:150,jab:7,hv:16,rng:48,def:.55,stam:160,gb:100,cost:.85,reg:28,cdS:6,sc:14,su:1,dd:60,desc:'Balanced all-rounder with a reliable jab and cross.',pas:'Fundamentals: actions cost 15% less stamina; recovery stays steady.',sig:'Final Combination',str:'No bad matchups',wk:'No standout strength'},
slugger:{n:'Slugger',col:'#d4694a',hp:105,spd:122,jab:8,hv:27,rng:46,def:.6,stam:160,gb:110,cost:1.3,reg:21,cdS:8,sc:28,su:1.2,dd:56,desc:'Heavy hitter. Slow startup, enormous power.',pas:'Heavy Hands: heavy punches hit harder and stagger longer.',sig:'Meteor Hook',str:'Huge damage and knockback',wk:'Slow, stamina hungry, misses are punished'},
ghost:{n:'Ghost',col:'#8fb6d9',hp:92,spd:182,jab:5.5,hv:12,rng:46,def:.4,stam:128,gb:80,cost:.9,reg:26,cdS:5,sc:18,su:.9,dd:88,desc:'Evasive fighter with long dodges and fast legs.',pas:'Elusive: a perfect dodge grants a short speed bonus and resets dodge cooldown.',sig:'Phantom Barrage',str:'Mobility, dodge distance',wk:'Low damage, small stamina pool'},
counter:{n:'Counter',col:'#b78fd9',hp:100,spd:150,jab:7,hv:16,rng:48,def:.75,stam:160,gb:140,cost:1,reg:25,cdS:7,sc:12,su:1.05,dd:60,desc:'Defensive specialist who wins by timing.',pas:'Read the Opponent: a dodge or block opens a counter window (+50% damage).',sig:'Mirror Break',str:'Best guard, huge counters',wk:'Weak when forced to attack; bad timing is punished'},
ippo:{n:'Ippo',col:'#e0a24b',hp:100,spd:165,jab:6,hv:15,rng:38,def:.5,stam:165,gb:95,cost:1.2,reg:23,cdS:9,sc:35,su:.9,dd:60,desc:'Close-range pressure fighter built on fast combinations.',pas:'Fighting Spirit: clean hits build a pressure meter (up to +33% damage). Taking damage drains it.',sig:'Dempsey Rush',str:'Pressure, quick combos',wk:'Short range, burns stamina'},
hitman:{n:'Hitman',col:'#7fc1a0',hp:100,spd:148,jab:7,hv:15,rng:64,def:.4,stam:160,gb:80,cost:1,reg:25,cdS:8,sc:15,su:.95,dd:60,desc:'Long-range precision boxer who controls space.',pas:'Precision: hits near maximum range deal +20% damage.',sig:'Kill Shot',str:'Range, spacing',wk:'Weak guard, struggles up close'}};
const DIFF={easy:{rt:.55,err:.5,agg:.35,blk:.25,dg:.15},normal:{rt:.35,err:.3,agg:.55,blk:.45,dg:.3},hard:{rt:.2,err:.15,agg:.75,blk:.65,dg:.5},expert:{rt:.1,err:.05,agg:.9,blk:.8,dg:.7}};
const PREF={basic:50,slugger:56,ghost:70,counter:62,ippo:34,hitman:90};
const Z={mx:0,my:0,a:0,g:0,sp:0,jab:0,hv:0,dg:0,sg:0};

/* ================= CINEMATIC DATA (shared by sim + renderer) ================= */
const INTRO_T=3.3,INTRO_END=.7;
/* d: cutscene length, h: [time, damage] hits, kb: victim launch distance, al: attacker advance, bn: rope bounce-back */
const CSD={
 basic:{d:2.6,kb:150,al:26,bn:0,h:[[.55,5],[.8,6],[1.05,7],[1.65,16]]},
 slugger:{d:2.9,kb:270,al:30,bn:24,h:[[1.3,46]]},
 ghost:{d:2.6,kb:150,al:30,bn:0,h:[[.55,4],[.75,4],[.95,4],[1.15,4],[1.35,5],[1.95,12]]},
 counter:{d:2.4,kb:200,al:30,bn:0,h:[[.85,12],[1.1,10],[1.45,16]]},
 ippo:{d:3.1,kb:220,al:34,bn:0,h:Array.from({length:12},(_,i)=>[.45+i*.14,2.5]).concat([[2.4,12]])},
 hitman:{d:2.5,kb:170,al:34,bn:0,h:[[1.42,28],[1.85,8]]}};
function csEnd(cs){const C=CSD[cs.s],ux=Math.cos(cs.a),uy=Math.sin(cs.a),lim=RING-22;
 let ox=cs.vx+ux*C.kb,oy=cs.vy+uy*C.kb;const vx0=cl(ox,-lim,lim),vy0=cl(oy,-lim,lim),rope=vx0!==ox||vy0!==oy;
 let vx=vx0,vy=vy0;if(rope){vx-=ux*C.bn;vy-=uy*C.bn}
 let ax=cl(cs.ax+ux*C.al,-lim,lim),ay=cl(cs.ay+uy*C.al,-lim,lim);const dd=Math.hypot(vx-ax,vy-ay);if(dd<38){ax=cl(vx-ux*40,-lim,lim);ay=cl(vy-uy*40,-lim,lim)}
 return{ax,ay,vx,vy,vx0,vy0,rope}}

/* ================= SIMULATION (host-authoritative, no DOM) ================= */
class Sim{
constructor(pl,o={}){this.o=o;this.q=0;this.eq=0;this.evl=[];this.hs=0;this.rd=1;this.ph=o.train?'fight':'intro';this.it=0;this.itT=pl.length*INTRO_T+INTRO_END;this.cs=null;this.tm=3;this.rt=o.train?999:ROUND_T;this.rlog=null;this.fin=false;this.win=null;
 this.F=pl.map((p,i)=>({id:p.id,name:p.name,style:p.style,S:ST[p.style],ai:p.ai||null,dummy:!!p.dummy,in:Object.assign({},Z),sj:0,sh:0,sd:0,ss:0,rw:0,gone:false,hn:1,vx:0,vy:0,seat:i,aiS:{tt:0,tp:0,p:null,sd:1,mx:0,my:0,err:0,gu:0},stats:{dmg:0,hit:0,thr:0,ko:0}}));this.reset(true)}
reset(first){this.cs=null;const n=this.F.length;this.F.forEach(f=>{const S=f.S,a=Math.PI+f.seat*TAU/n;f.x=Math.cos(a)*140;f.y=Math.sin(a)*140;f.face=a+Math.PI;f.hp=f.gone?0:S.hp;f.st=first?S.stam:Math.min(S.stam,f.st+S.stam*REST);
 Object.assign(f,{kx:0,ky:0,state:'idle',t:0,atk:null,inv:0,da:9,cdS:0,cdD:0,combo:0,ct:0,stun:0,gt:0,gb:S.gb,gd:0,gk:false,guard:false,boost:0,cw:0,la:9,buf:null,pm:first?0:f.pm*.5,rz:0,dd:.2,dv:[0,0],sigd:false});f.in.a=f.face})}
skipIntro(){if(this.ph==='intro')this.it=this.itT}
setStyle(f,s){f.style=s;f.S=ST[s];f.hp=f.S.hp;f.st=f.S.stam;f.gb=f.S.gb;f.gd=0;f.gk=false;f.cdS=0;f.pm=0}
faceTo(f){let bd=1e9,t=null;for(const o of this.F)if(o!==f&&!o.gone&&o.hp>0){const d=Math.hypot(o.x-f.x,o.y-f.y);if(d<bd){bd=d;t=o}}return t?Math.atan2(t.y-f.y,t.x-f.x):f.face}
ev(o){o.e=++this.eq;this.evl.push(o);if(this.evl.length>40)this.evl.shift()}
txt(f,m){this.ev({t:'txt',m,x:r1(f.x),y:r1(f.y),id:f.id})}
step(dt){
 if(this.hs>0){this.hs-=dt;return}
 if(this.ph==='intro'){this.it+=dt;this.F.forEach(f=>this.upd(f,dt));if(this.it>=this.itT){this.ph='fight';this.ev({t:'bell'});this.ev({t:'fgt'})}return}
 if(this.cs){this.stepCS(dt);return}
 if(this.wt){this.wt.t-=dt;if(this.wt.t<=0||this.ph!=='fight'){this.ev({t:'wte'});this.wt=null;this.wtcd=2}}
 if(this.wtcd>0)this.wtcd-=dt;
 if(this.ph==='count'){this.tm-=dt;this.F.forEach(f=>this.upd(f,dt));if(this.tm<=0){this.ph='fight';this.ev({t:'bell'})}}
 else if(this.ph==='fight'){if(!this.o.train)this.rt-=dt;this.F.forEach(f=>{const k=this.wt&&f.id!==this.wt.who?.18:1;if(f.ai&&!f.dummy&&!f.gone)this.think(f,dt*k);this.upd(f,dt*k)});this.collide();this.check(dt)}
 else if(this.ph==='rend'){this.tm-=dt;this.F.forEach(f=>this.upd(f,dt));this.collide();if(this.tm<=0)this.next()}}
collide(){const R=RING-22,F=this.F;for(let i=0;i<F.length;i++){const a=F[i];if(a.gone)continue;
 for(let j=i+1;j<F.length;j++){const b=F[j];if(b.gone)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01;if(d<32){const p=(32-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p}}}
 F.forEach(f=>{if(f.x>R||f.x<-R){f.x=cl(f.x,-R,R);f.kx=0}if(f.y>R||f.y<-R){f.y=cl(f.y,-R,R);f.ky=0}})}
upd(f,dt){
 if(f.gone)return;const S=f.S,i=this.ph==='fight'?f.in:Z;
 f.la+=dt;f.da+=dt;f.inv=Math.max(0,f.inv-dt);f.cdS=Math.max(0,f.cdS-dt);f.cdD=Math.max(0,f.cdD-dt);f.cw=Math.max(0,f.cw-dt);f.boost=Math.max(0,f.boost-dt);f.ct-=dt;if(f.ct<=0)f.combo=0;
 const kd=Math.exp(-8*dt);f.kx*=kd;f.ky*=kd;let vx=0,vy=0;
 const jp=i.jab>f.sj,hp=i.hv>f.sh,dp=i.dg>f.sd,sp=i.sg>f.ss;f.sj=i.jab;f.sh=i.hv;f.sd=i.dg;f.ss=i.sg;if(this.ph!=='fight'){f.sj=f.in.jab;f.sh=f.in.hv;f.sd=f.in.dg;f.ss=f.in.sg}
 if(this.o.inf){f.st=S.stam;f.gb=S.gb;f.gk=false}
 if(f.gd>0)f.gd-=dt;else if(f.gb<S.gb)f.gb=Math.min(S.gb,f.gb+(f.guard?GREG_HOLD:GREG)*dt);
 if(f.gk&&f.gb>=S.gb*.3)f.gk=false;
 if(f.state==='stun'){f.t+=dt;f.guard=false;if(f.t>=f.stun)f.state='idle'}
 else if(f.state==='dodge'){f.t+=dt;vx=f.dv[0];vy=f.dv[1];if(f.t>=f.dd){const ws=f.sigd;f.state='idle';f.sigd=false;if(ws&&this.ph==='fight')this.ghostStrike(f)}}
 else if(f.state==='atk'){const a=f.atk,w=a.sw[a.i],ad=w.adv&&a.ph<2?w.adv:0;vx=Math.cos(a.aim)*ad+i.mx*S.spd*.25;vy=Math.sin(a.aim)*ad+i.my*S.spd*.25;if((jp||hp)&&a.ph===2)f.buf=jp?'jab':'hv';this.stepAtk(f,a,w,dt,i)}
 if(f.state==='idle'){
  f.guard=!!i.g&&!f.gk&&f.gb>0;
  if(f.state==='idle'){
   let want=sp?'sig':dp?'dodge':hp?'hv':jp?'jab':f.buf;f.buf=null;
   const l=Math.hypot(i.mx,i.my),dx=l>1?i.mx/l:i.mx,dy=l>1?i.my/l:i.my,run=!!i.sp&&f.st>0&&l>.1&&!f.guard;
   const spd=S.spd*(run?1.45:1)*(f.st<=0?.6:1)*(f.boost>0?1.25:1)*(f.guard?.55:1);vx=dx*spd;vy=dy*spd;
   if(run)f.st-=12*dt;else f.st+=S.reg*(f.la>.9&&!f.guard?1:.35)*dt;f.st=cl(f.st,0,S.stam);
   f.face+=adiff(this.ph==='fight'?i.a:this.faceTo(f),f.face)*Math.min(1,14*dt);
   if(want)this.act(f,want,i,dx,dy,l)}}
 if(f.state==='down'||f.state==='stun'&&f.hp<=0){vx=vy=0}
 f.x+=(vx+f.kx)*dt;f.y+=(vy+f.ky)*dt;f.vx=vx;f.vy=vy}
dash(f,dx,dy,l,dist,dur,inv,sig){let ux=dx,uy=dy;if(l<.1){ux=Math.cos(f.face+Math.PI);uy=Math.sin(f.face+Math.PI)}else{const m=Math.hypot(ux,uy);ux/=m;uy/=m}
 f.state='dodge';f.t=0;f.dd=dur;f.inv=inv;f.da=0;f.sigd=sig;f.guard=false;f.dv=[ux*dist/dur,uy*dist/dur];this.ev({t:'wh',x:r1(f.x),y:r1(f.y)})}
act(f,w,i,dx,dy,l){const S=f.S,c=S.cost*(f.style==='basic'?.85/.85:1);
 if(w==='sig'){if(f.cdS>0||f.st<S.sc*.5)return;f.st=Math.max(0,f.st-S.sc);f.cdS=S.cdS;this.ev({t:'sg',s:f.style,id:f.id,x:r1(f.x),y:r1(f.y),a:r2(i.a)});
  if(f.style==='ghost'){this.dash(f,dx,dy,l,125,.24,.34,true);this.txt(f,'PHANTOM STEP');return}
  this.begin(f,this.sigSw(f),i.a);f.atk.sig=1;this.txt(f,S.sig.toUpperCase());return}
 if(w==='dodge'){if(f.cdD>0||f.st<8)return;f.st-=14*(f.style==='ghost'?.65:1);this.dash(f,dx,dy,l,S.dd,.2,f.style==='ghost'?.22:.18,false);f.cdD=f.style==='ghost'?.45:.7;return}
 const hv=w==='hv';if(f.st<2)return;f.st=Math.max(0,f.st-(hv?15:6)*c);
 const sw=hv?{k:'hv',su:.3*S.su,ac:.12,rc:.36,dmg:S.hv,kb:f.style==='slugger'?230:150,rng:S.rng*1.12,arc:.8,miss:.25}:{k:'jab',su:.09*S.su,ac:.1,rc:.17,dmg:S.jab,kb:70,rng:S.rng,arc:.85,miss:0};
 this.begin(f,[sw],i.a)}
ghostStrike(f){let bd=1e9,t=null;for(const o of this.F)if(o!==f&&!o.gone&&o.hp>0){const d=Math.hypot(o.x-f.x,o.y-f.y);if(d<bd){bd=d;t=o}}
 const aim=t?Math.atan2(t.y-f.y,t.x-f.x):f.face;this.begin(f,[{k:'gs',su:.03,ac:.08,rc:.28,dmg:15,kb:230,rng:f.S.rng*1.2,arc:1,adv:520,miss:.2}],aim);f.atk.sig=1}
sigSw(f){const S=f.S,s=f.style;
 if(s==='basic')return[{k:'jab',su:.07,ac:.09,rc:.1,dmg:S.jab*1.1,kb:60,rng:S.rng,arc:.85,miss:0},{k:'hv',su:.1,ac:.1,rc:.3,dmg:S.jab*1.9,kb:120,rng:S.rng*1.05,arc:.85,miss:.1}];
 if(s==='slugger')return[{k:'hook',su:.5,ac:.15,rc:.55,dmg:36,kb:320,rng:S.rng*1.15,arc:1.15,miss:.5}];
 if(s==='counter')return[{k:'stance',su:0,ac:.65,rc:.55,dmg:0,kb:0,rng:0,arc:0,miss:0}];
 if(s==='ippo'){const a=[];for(let n=0;n<5;n++)a.push({k:'rush',su:n?.05:.3,ac:.07,rc:.06,dmg:S.jab*(n===4?2.2:1),kb:n===4?170:40,rng:S.rng*1.05,arc:1,adv:150,miss:.3});return a}
 return[0,1,2,3].map(n=>({k:'poke',su:n?.04:.1,ac:.1,rc:n===3?.25:.03,dmg:n===3?4.2:2.9,kb:n===3?140:35,rng:100,arc:.3,miss:0}))}
begin(f,sw,aim){f.state='atk';f.guard=false;f.hn=-f.hn;f.atk={sw,i:0,ph:0,t:0,aim,set:new Set(),hit:false,hand:f.hn,rcx:0};f.face=aim;f.la=0}
stepAtk(f,a,w,dt,i){a.t+=dt;f.la=0;
 if(a.ph===0&&a.t>=w.su){a.ph=1;a.t=0;a.set=new Set();if(w.dmg>0){f.stats.thr++;this.ev({t:'ws',x:r1(f.x),y:r1(f.y)})}if(a.sig)this.ev({t:'sgs',s:f.style,id:f.id,x:r1(f.x),y:r1(f.y),a:r2(a.aim),k:w.k,n:a.i,r:r1(w.rng)})}
 if(a.ph===1){this.strike(f,a,w);if(f.atk!==a)return;if(a.t>=w.ac){a.ph=2;a.t=0;a.rcx=a.hit?0:(w.miss||0)}}
 else if(a.ph===2&&a.t>=w.rc+a.rcx){if(a.i<a.sw.length-1){a.i++;a.ph=0;a.t=0;a.hit=false;a.hand=-a.hand;a.aim=i.a;f.face=a.aim}else{f.atk=null;f.state='idle'}}}
strike(f,a,w){if(w.dmg<=0)return;
 for(const v of this.F){if(v===f||v.gone||v.hp<=0||a.set.has(v.id))continue;const dx=v.x-f.x,dy=v.y-f.y,d=Math.hypot(dx,dy);
  if(d>w.rng+16||Math.abs(adiff(Math.atan2(dy,dx),a.aim))>w.arc)continue;a.set.add(v.id);this.land(f,v,a,w,d,dx,dy)}}
land(f,v,a,w,d,dx,dy){const V=v.S,back=Math.atan2(-dy,-dx),pw=!!(this.wt&&this.wt.who===f.id&&!this.wt.hit);
 if(v.inv>0&&!pw){if(v.state==='dodge'&&v.da<.2&&!v.sigd){v.st=Math.min(V.stam,v.st+20);if(v.style==='ghost'){v.boost=2;v.cdD=0}if(v.style==='counter')v.cw=1.2;this.txt(v,'PERFECT DODGE');this.ev({t:'dg',x:r1(v.x),y:r1(v.y)});if(!this.wt&&!(this.wtcd>0)&&this.ph==='fight'){this.wt={who:v.id,t:2.2,hit:false};this.ev({t:'wt',id:v.id,s:v.style,x:r1(v.x),y:r1(v.y)})}}return}
 const va=v.atk;if(!pw&&va&&va.ph===1&&va.sw[va.i].k==='stance'){this.txt(v,'COUNTER STRIKE');v.atk={sw:[{k:'cs',su:.04,ac:.12,rc:.3,dmg:30,kb:260,rng:V.rng*1.4,arc:1.5,miss:0}],i:0,ph:0,t:0,aim:back,set:new Set(),hit:false,hand:1,rcx:0,sig:1};v.face=back;v.inv=.3;this.ev({t:'ctr',x:r1(v.x),y:r1(v.y)});return}
 const front=Math.abs(adiff(back,v.face))<1.15,gd=!pw&&(v.guard||(va&&va.ph<2&&va.sw[va.i].k==='poke'))&&front;
 if(a.sig&&!gd&&!pw&&w.dmg>0&&!this.cs&&this.ph==='fight'&&CSD[f.style]){this.startCS(f,v,Math.atan2(dy,dx));return}
 let dm=w.dmg*(f.st<=0?.6:1);if(pw){dm*=1.5;this.wt.hit=true;this.wt.t=Math.min(this.wt.t,.45);this.txt(f,'PERFECT STRIKE')}
 if(f.style==='hitman'&&d>w.rng*.8)dm*=1.2;if(f.style==='ippo')dm*=1+f.pm/300;
 if(f.cw>0&&f.style==='counter'&&w.k!=='cs'){dm*=1.5;f.cw=0;this.txt(f,'COUNTER HIT')}
 if(f.ct>0&&f.combo>1)dm*=Math.max(.45,1-.12*(f.combo-1));
 let kb=w.kb;
 if(gd){dm*=1-V.def*.75;v.gb=Math.max(0,v.gb-(dm*1.1+3));v.gd=GDLY;kb*=.35;this.ev({t:'blk',x:r1(v.x),y:r1(v.y)});if(v.style==='counter')v.cw=1;
  if(v.gb<=0&&v.guard){v.gb=0;v.gk=true;v.guard=false;v.state='stun';v.stun=1;v.t=0;v.atk=null;this.txt(v,'GUARD BREAK')}}
 else{v.state='stun';v.t=0;v.atk=null;v.guard=false;v.stun=(w.k==='hv'||w.k==='hook'||w.k==='cs')?(f.style==='slugger'?.6:.4):.2;if(w.k==='poke')v.stun=.3}
 v.hp-=dm;v.kx=Math.cos(Math.atan2(dy,dx))*kb;v.ky=Math.sin(Math.atan2(dy,dx))*kb;
 f.stats.dmg+=dm;a.hit=true;if(!gd){f.stats.hit++;f.combo++;f.ct=1.3;if(f.style==='ippo')f.pm=Math.min(100,f.pm+14);v.combo=0}
 v.pm=Math.max(0,v.pm-dm*2.5);this.hs=gd?.02:(w.kb>200?.09:.05);if(pw)this.hs=.16;
 const he={t:'hit',x:r1(v.x),y:r1(v.y),v:Math.round(dm),b:gd?1:0,hv:kb>140?1:0};if(pw)he.pw=1;if(a.sig){he.sg=1;he.s=f.style;he.n=a.i;he.a=r2(Math.atan2(dy,dx))}this.ev(he);
 if(v.hp<=0){v.hp=0;v.state='down';v.atk=null;v.guard=false;f.stats.ko++;this.ev({t:'ko',x:r1(v.x),y:r1(v.y)})}}
startCS(f,v,ang){const C=CSD[f.style];if(this.wt){this.ev({t:'wte'});this.wt=null}
 let m=f.st<=0?.6:1;if(f.style==='ippo')m*=1+f.pm/300;
 const cs={w:f.id,v:v.id,s:f.style,t:0,d:C.d,a:r2(ang),ax:r1(f.x),ay:r1(f.y),vx:r1(v.x),vy:r1(v.y),h:C.h.map(h=>[h[0],r1(h[1]*m)]),n:0};
 [f,v].forEach(q=>{q.state='cs';q.atk=null;q.guard=false;q.kx=q.ky=0;q.stun=0;q.buf=null;q.combo=0});f.stats.hit++;v.hp=Math.max(v.hp,.01);this.cs=cs;this.ev({t:'csb',s:f.style,id:f.id,x:cs.vx,y:cs.vy})}
stepCS(dt){const c=this.cs,A=this.F.find(f=>f.id===c.w),V=this.F.find(f=>f.id===c.v);c.t+=dt;
 while(c.n<c.h.length&&c.t>=c.h[c.n][0]){const dm=c.h[c.n][1];V.hp=Math.max(0,V.hp-dm);A.stats.dmg+=dm;c.n++}
 if(c.t>=c.d)this.endCS(c,A,V)}
endCS(c,A,V){const e=csEnd(c);A.x=e.ax;A.y=e.ay;V.x=e.vx;V.y=e.vy;A.kx=A.ky=V.kx=V.ky=0;A.face=c.a;V.face=c.a+Math.PI;A.state='idle';A.atk=null;A.inv=.2;A.la=0;if(A.style==='ippo')A.pm=Math.min(100,A.pm+20);V.pm=Math.max(0,V.pm-30);V.t=0;
 if(V.hp<=0){V.hp=0;V.state='down';A.stats.ko++;this.ev({t:'ko',x:r1(V.x),y:r1(V.y)})}else{V.state='stun';V.stun=.8}
 this.cs=null}
check(dt){const al=this.F.filter(f=>!f.gone&&f.hp>0);
 if(this.o.train){this.F.forEach(f=>{if(f.hp<=0){f.rz+=dt;if(f.rz>1.4){f.rz=0;f.hp=f.S.hp;f.state='idle'}}});return}
 if(this.F.length>1&&al.length<=1)return this.endRound(al[0]||null,'KNOCKOUT');
 if(this.rt<=0){const s=al.slice().sort((a,b)=>b.hp-a.hp||b.stats.dmg-a.stats.dmg);this.endRound(s[0]&&(s.length<2||s[0].hp!==s[1].hp||s[0].stats.dmg!==s[1].stats.dmg)?s[0]:null,'DECISION')}}
endRound(w,why){this.ph='rend';this.tm=3.2;if(w)w.rw++;this.rlog={w:w?w.id:null,n:w?w.name:'DRAW',why,rd:this.rd};this.fin=!!(w&&w.rw>=WINR)||this.rd>=5;this.ev({t:'rend'});this.F.forEach(f=>{f.guard=false})}
next(){if(this.fin){this.ph='mend';const s=this.F.slice().sort((a,b)=>b.rw-a.rw||b.stats.dmg-a.stats.dmg);this.win=s[0].id;return}
 this.rd++;this.rt=ROUND_T;this.tm=3;this.ph='count';this.reset(false)}
think(f,dt){const I=f.in,A=f.aiS,D=DIFF[f.ai]||DIFF.normal,S=f.S;let tg=null,bd=1e9;
 for(const o of this.F)if(o!==f&&!o.gone&&o.hp>0){const d=Math.hypot(o.x-f.x,o.y-f.y);if(d<bd){bd=d;tg=o}}
 if(!tg){I.mx=I.my=0;I.g=0;return}
 A.tp-=dt;if(A.tp<=0){A.tp=D.rt*(.7+rnd()*.6);const w=tg.atk&&tg.atk.sw[tg.atk.i];A.p={id:tg.id,x:tg.x,y:tg.y,ph:tg.atk?tg.atk.ph:-1,k:w?w.k:'',face:tg.face,st:tg.state,rng:tg.S.rng}}
 const p=A.p&&A.p.id===tg.id?A.p:{id:tg.id,x:tg.x,y:tg.y,ph:-1,k:'',face:tg.face,st:'idle',rng:tg.S.rng};
 const dx=p.x-f.x,dy=p.y-f.y,d=Math.hypot(dx,dy),ang=Math.atan2(dy,dx),tx=Math.cos(ang),ty=Math.sin(ang);
 A.tt-=dt;A.gu-=dt;
 if(A.tt<=0){A.tt=(.14+rnd()*.2)*(1.5-D.agg*.6);A.err=(rnd()-.5)*D.err*1.4;if(rnd()<.25)A.sd=-A.sd||1;
  const pr=PREF[f.style],low=f.hp<28||f.st<12,pd=Math.hypot(f.x-p.x,f.y-p.y);
  const thr=p.ph>=0&&p.ph<2&&pd<p.rng+34&&Math.abs(adiff(Math.atan2(f.y-p.y,f.x-p.x),p.face))<1&&p.k!=='stance';
  const open=p.st==='stun'||p.ph===2;
  let mx,my;
  if(low&&d<160){mx=-tx;my=-ty}else if(d>pr+12){mx=tx;my=ty}else if(d<pr-14&&f.style!=='ippo'){mx=-tx*.8;my=-ty*.8}else{mx=-ty*A.sd*.7;my=tx*A.sd*.7}
  if(f.style==='ghost'){mx+=-ty*A.sd*.5;my+=tx*A.sd*.5}
  A.mx=mx;A.my=my;I.sp=d>pr+90&&f.st>40?1:0;
  if(thr){if(f.style==='counter'&&f.cdS<=0&&rnd()<.5)I.sg++;
   else if(rnd()<D.dg&&f.cdD<=0&&f.st>10){A.mx=-ty*A.sd-tx*.4;A.my=tx*A.sd-ty*.4;I.mx=A.mx;I.my=A.my;I.dg++}
   else if(rnd()<D.blk)A.gu=.35+rnd()*.3}
  else if(d<S.rng+8&&!low&&rnd()<D.agg*(f.style==='slugger'?.55:1)*(open?1.7:1)){const hv=f.style==='slugger'?(open||rnd()<.35):(open?rnd()<.6:rnd()<.18);hv?I.hv++:I.jab++}
  const sc=f.cdS<=0&&f.st>S.sc&&rnd()<.25+.45*D.agg;
  if(sc){const s=f.style;if((s==='basic'&&d<60)||(s==='slugger'&&d<S.rng*1.1&&(open||rnd()<.3))||(s==='ghost'&&d>100)||(s==='ippo'&&d<72)||(s==='hitman'&&d>60&&d<105)){if(s==='ghost'){A.mx=tx;A.my=ty;I.mx=tx;I.my=ty}I.sg++}}}
 I.mx=A.mx;I.my=A.my;I.g=A.gu>0?1:0;I.a=ang+A.err}
view(f){const a=f.atk,w=a&&a.sw[a.i],dur=w?(a.ph===0?w.su:a.ph===1?w.ac:w.rc+a.rcx):1;
 return{id:f.id,name:f.name,style:f.style,x:r1(f.x),y:r1(f.y),f:r2(f.face),hp:r1(f.hp),st:r1(f.st),gb:r1(f.gb),gk:f.gk?1:0,sg:a&&a.sig?1:0,sd:f.sigd&&f.state==='dodge'?1:0,ai:a?a.i:0,s:f.state,k:w?w.k:'',p:a?a.ph:-1,pp:a?r2(cl(a.t/(dur||.01),0,1)):0,h:a?a.hand:1,rg:w?r1(w.rng):0,g:f.guard?1:0,iv:f.inv>0?1:0,cs:r2(f.cdS),cb:f.combo,pm:r1(f.pm),rw:f.rw,gone:f.gone?1:0,bo:f.boost>0?1:0}}
snap(){return{t:'game_snapshot',q:++this.q,ph:this.ph,tm:r2(this.tm),rt:r1(this.rt),rd:this.rd,F:this.F.map(f=>this.view(f)),ev:this.evl.slice(-14),wt:this.wt?{w:this.wt.who,t:r2(this.wt.t),h:this.wt.hit?1:0}:0,rl:this.rlog,win:this.win,it:this.ph==='intro'?r2(this.it):0,itT:r2(this.itT),cs:this.cs?{w:this.cs.w,v:this.cs.v,s:this.cs.s,t:r2(this.cs.t),d:this.cs.d,a:this.cs.a,ax:this.cs.ax,ay:this.cs.ay,vx:this.cs.vx,vy:this.cs.vy,h:this.cs.h}:0}}
res(){return{win:this.win,F:this.F.map(f=>({id:f.id,name:f.name,style:f.style,rw:f.rw,dmg:r1(f.stats.dmg),hit:f.stats.hit,thr:f.stats.thr,ko:f.stats.ko}))}}}
//#END_SIM

/* ================= PERSISTENCE ================= */
const DEF={name:'Fighter',lvl:1,xp:0,coins:0,w:0,l:0,ko:0,dmg:0,m:0,thr:0,hit:0,style:'basic',unl:STY.slice(),daily:'',set:{mv:.7,sv:.9,shk:1,fx:1,df:'normal'}};
let SV=load();
function load(){const d=JSON.parse(JSON.stringify(DEF));try{const o=JSON.parse(localStorage.getItem(KEY));if(!o||typeof o!=='object')return d;
 for(const k in d){if(k==='set'){if(o.set&&typeof o.set==='object')for(const s in d.set)if(typeof o.set[s]===typeof d.set[s])d.set[s]=o.set[s]}else if(k==='unl'){if(Array.isArray(o.unl))d.unl=STY.filter(s=>o.unl.includes(s)||s==='basic')}else if(typeof o[k]===typeof d[k]&&(typeof o[k]!=='number'||isFinite(o[k])))d[k]=o[k]}
 if(!ST[d.style]||!d.unl.includes(d.style))d.style='basic';if(!DIFF[d.set.df])d.set.df='normal';d.name=cleanN(d.name)||'Fighter'}catch(e){}return d}
function save(){try{localStorage.setItem(KEY,JSON.stringify(SV))}catch(e){}}
const cleanN=v=>String(v||'').replace(/[<>&"'`\\]/g,'').replace(/\s+/g,' ').trim().slice(0,12);
const need=l=>100+(l-1)*60;

/* ================= AUDIO (synthesized) ================= */
const AU={c:null,init(){try{if(!this.c)this.c=new(window.AudioContext||window.webkitAudioContext)();if(this.c.state==='suspended')this.c.resume()}catch(e){}},
 t(f,d,ty='sine',v=.25,f2){if(!this.c)return;const c=this.c,o=c.createOscillator(),g=c.createGain(),n=c.currentTime,vol=v*SV.set.mv*SV.set.sv;o.type=ty;o.frequency.setValueAtTime(f,n);if(f2)o.frequency.exponentialRampToValueAtTime(f2,n+d);g.gain.setValueAtTime(vol,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g).connect(c.destination);o.start(n);o.stop(n+d)},
 nz(d,v=.2){if(!this.c)return;const c=this.c;let b=(this.nb||(this.nb={}))[d];if(!b){b=this.nb[d]=c.createBuffer(1,c.sampleRate*d,c.sampleRate);const a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length)}const s=c.createBufferSource(),g=c.createGain();g.gain.value=v*SV.set.mv*SV.set.sv;s.buffer=b;s.connect(g).connect(c.destination);s.start()},
 p(n){switch(n){case'hit':this.nz(.12,.5);this.t(120,.12,'square',.2,50);break;case'hv':this.nz(.2,.7);this.t(80,.25,'sawtooth',.3,30);break;case'blk':this.t(300,.08,'triangle',.3,180);break;case'wh':this.nz(.14,.1);break;case'bell':this.t(880,.9,'sine',.3);this.t(1320,.7,'sine',.15);break;case'ko':this.t(200,.6,'sawtooth',.3,40);break;case'ui':this.t(520,.05,'square',.08);break;case'wt':this.nz(.4,.5);this.t(320,.8,'sine',.25,60);break;case'wte':this.t(90,.3,'sine',.2,420);break;case'sg':this.t(180,.4,'sawtooth',.18,820);this.nz(.3,.25);break;case'sgh':this.nz(.3,.9);this.t(70,.4,'sine',.5,28);break}}};

/* ================= UI ================= */
const $=s=>document.querySelector(s),UI=$('#ui'),cv=$('#cv'),cx=cv.getContext('2d',{alpha:false,desynchronized:true}),TOUCH=matchMedia('(pointer:coarse)').matches;
const EM={basic:'<circle cx="12" cy="12" r="8"/>',slugger:'<rect x="5" y="5" width="14" height="14"/>',ghost:'<path d="M12 4 20 20H4z"/>',counter:'<path d="M12 3 21 12 12 21 3 12z"/>',ippo:'<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z"/>',hitman:'<circle cx="12" cy="12" r="7"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>'};
const emb=(s,z=24)=>`<svg class="em" width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${EM[s]}</svg>`;
let scr='';
function show(name,html){scr=name;UI.innerHTML=html;UI.classList.remove('lob');UI.classList.add('on');UI.scrollTop=0;$('#tc').classList.remove('on');$('#trn').classList.remove('on');specUI()}
function hide(){scr='';UI.classList.remove('on');UI.innerHTML='';specUI()}
let tt=0;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)}
function ask(msg,yes){const d=$('#dlg');d.innerHTML=`<div class="card"><p>${msg}</p><div class="row"><button class="gd" id="dy">Confirm</button><button class="gh" id="dn">Cancel</button></div></div>`;d.classList.add('on');$('#dy').onclick=()=>{d.classList.remove('on');yes()};$('#dn').onclick=()=>d.classList.remove('on')}
const rate=s=>{const S=ST[s];return[['Power',cl(Math.round(S.hv/5.4),1,5)],['Speed',cl(Math.round(S.spd/36.5),1,5)],['Range',cl(Math.round(S.rng/13),1,5)],['Defense',cl(Math.round(S.def*7),1,5)],['Stamina',cl(Math.round(S.stam/(S.cost*36)),1,5)]]};
const rbars=s=>`<div class="rt">${rate(s).map(r=>`<span>${r[0]}</span><div class="bar"><i style="width:${r[1]*20}%"></i></div>`).join('')}</div>`;
const today=()=>new Date().toDateString();
const IC={play:'<path d="M7 5l12 7-12 7z" fill="currentColor"/>',online:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',styles:'<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z"/>',train:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',stats:'<path d="M5 20V11M12 20V4M19 20v-6"/>',sets:'<path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.5"/><circle cx="9.5" cy="17" r="2.5"/>',fs:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',gift:'<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C9 7 8 3.5 10.3 3.5S12 7 12 7zm0 0c3 0 4-3.5 1.7-3.5S12 7 12 7z"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
function lobby(){G.stop();const xp=SV.xp/need(SV.lvl)*100,can=SV.daily!==today();
 show('lobby',`<div class="w lb"><div class="lb-g"><div class="lb-l"><div class="lb-t"><small class="mu">2D ONLINE BOXING</small><h1>TOP-DOWN <b>BOXING</b> ARENA</h1></div>
 <div class="card lb-pf"><div class="lb-pr"><span class="lb-av">${emb(SV.style,26)}</span><input type="text" id="nm" maxlength="12" value="${SV.name}" aria-label="Username" title="Your username"><span class="tag">Lv ${SV.lvl}</span></div>
 <div class="bar"><i style="width:${xp}%"></i></div><div class="row sp lb-st"><small>${SV.xp} / ${need(SV.lvl)} XP</small><span class="lb-ch">Coins <b style="color:var(--gd)">${SV.coins}</b></span><span class="lb-ch">${SV.w}W - ${SV.l}L</span><span class="lb-ch lb-sn">${emb(SV.style,16)} ${ST[SV.style].n}</span></div></div>
 <div class="lb-bt"><button class="gd lb-play" data-a="play" title="Offline match vs AI">${ic('play')}<span>Play</span></button><button class="lb-on" data-a="online" title="Host or join a room">${ic('online')}<span>Online play</span></button><button class="gh" data-a="styles">${ic('styles')}<span>Style selection</span></button><button class="gh" data-a="train">${ic('train')}<span>Training</span></button><button class="gh" data-a="stats">${ic('stats')}<span>Stats</span></button><button class="gh" data-a="sets">${ic('sets')}<span>Settings</span></button><button class="gh lb-fs" data-a="fs" title="Toggle fullscreen (F)" aria-label="Toggle fullscreen">${ic('fs')}<span>Toggle fullscreen</span></button></div></div>
 <div class="lb-r"><div class="card lb-pw"><canvas class="pv" id="pv0" width="240" height="240"></canvas><span class="lb-bd">${emb(SV.style,16)} ${ST[SV.style].n}</span><button class="gh lb-dy${can?' can':''}" data-a="daily" ${can?'':'disabled'}>${ic('gift')}<span>${can?'Claim 150 coins':'Claimed'}</span></button></div>
 <div class="card lb-ct"><b>Controls</b>${ctrlRef()}</div></div></div></div>`);
 UI.classList.add('lob');
 $('#nm').onchange=e=>{SV.name=cleanN(e.target.value)||'Fighter';e.target.value=SV.name;save()}}
const ctrlRef=()=>`<table><tr><td><kbd>W A S D</kbd></td><td>Move</td></tr><tr><td><kbd>Mouse</kbd></td><td>Aim</td></tr><tr><td><kbd>LMB</kbd> / <kbd>RMB</kbd></td><td>Jab / Heavy</td></tr><tr><td><kbd>Space</kbd> <kbd>Shift</kbd></td><td>Dodge / Sprint</td></tr><tr><td><kbd>Q</kbd> <kbd>E</kbd> <kbd>Esc</kbd></td><td>Guard / Signature / Pause</td></tr></table>`;
function styles(back='lobby',pick){const R=pick||(s=>{SV.style=s;save()});window.pickS=R;
 show('styles',`<div class="w"><div class="row sp"><h2>Fighting styles</h2><button class="gh" data-a="${back}">Back</button></div><div class="grid g3">${STY.map(s=>{const S=ST[s],eq=SV.style===s;return`<div class="card ${eq?'eq':''}"><canvas class="pv" data-pv="${s}" width="240" height="240"></canvas><div class="row" style="margin:10px 0 2px">${emb(s)}<h2 style="margin:0">${S.n}</h2></div><small>${S.desc}</small>${rbars(s)}
 <small><b style="color:var(--tx)">Passive</b> ${S.pas}<br><b style="color:var(--tx)">Signature</b> ${S.sig}<br>+ ${S.str}<br>- ${S.wk}</small>
 <details><summary>Exact stats</summary>HP <b>${S.hp}</b> · Speed <b>${S.spd}</b> · Jab <b>${S.jab}</b> · Heavy <b>${S.hv}</b> · Range <b>${S.rng}</b><br>Guard reduction <b>${Math.round(S.def*75)}%</b> · Guard bar <b>${S.gb}</b> (costs no stamina) · Stamina <b>${S.stam}</b> · Cost x<b>${S.cost}</b> · Regen <b>${S.reg}/s</b><br>Signature cost <b>${S.sc}</b> · Cooldown <b>${S.cdS}s</b></details>
 <button class="${eq?'gh':'gd'}" style="margin-top:10px;width:100%" data-a="pick" data-s="${s}" ${eq?'disabled':''}>${eq?'Equipped':'Equip'}</button></div>`}).join('')}</div></div>`)}
function stats(){const acc=SV.thr?Math.round(SV.hit/SV.thr*100):0;
 show('stats',`<div class="w s"><h2>Stats</h2><div class="card"><table>${[['Matches',SV.m],['Wins',SV.w],['Losses',SV.l],['Knockouts',SV.ko],['Accuracy',acc+'%'],['Damage dealt',Math.round(SV.dmg)],['Level',SV.lvl],['Coins',SV.coins]].map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}</table></div><button class="gh" data-a="lobby" style="margin-top:12px;width:100%">Back</button></div>`)}
function sets(from='lobby'){const s=SV.set;
 show('sets',`<div class="w s"><h2>Settings</h2><div class="card grid"><label>Master volume<input type="range" min="0" max="1" step=".05" value="${s.mv}" data-r="mv"></label><label>Effects volume<input type="range" min="0" max="1" step=".05" value="${s.sv}" data-r="sv"></label>
 <label class="row sp">Screen shake<input type="checkbox" data-c="shk" ${s.shk?'checked':''}></label><label class="row sp">Reduced visual effects<input type="checkbox" data-c="fx" ${s.fx?'':'checked'}></label>
 <label class="row sp">AI difficulty<select data-d>${Object.keys(DIFF).map(k=>`<option ${s.df===k?'selected':''}>${k}</option>`).join('')}</select></label></div>
 <div class="card" style="margin:12px 0">${ctrlRef()}</div><div class="row"><button class="gh" data-a="${from}">Back</button><button class="gh" data-a="reset">Reset saved data</button></div></div>`);
 UI.querySelectorAll('[data-r]').forEach(e=>e.oninput=()=>{s[e.dataset.r]=+e.value;save()});UI.querySelector('[data-c=shk]').onchange=e=>{s.shk=e.target.checked?1:0;save()};UI.querySelector('[data-c=fx]').onchange=e=>{s.fx=e.target.checked?0:1;save()};UI.querySelector('[data-d]').onchange=e=>{s.df=e.target.value;save()}}
const act={
 play(){G.start('ai')},train(){G.start('train')},styles(){styles('lobby')},stats,sets(){sets('lobby')},lobby,online(){Net.menu()},
 pick(b){window.pickS(b.dataset.s);AU.p('ui');styles(window.pickBack||'lobby',window.pickS)},
 daily(){if(SV.daily===today())return;SV.daily=today();SV.coins+=150;save();toast('+150 coins');lobby()},
 reset(){ask('Erase all saved progress and settings?',()=>{SV=JSON.parse(JSON.stringify(DEF));save();toast('Data reset');lobby()})},
 resume(){G.pause(false)},leave(){ask(G.mode==='ai'||G.mode==='train'?'Leave the match? Progress for this match is lost.':'Leave the room?',()=>{if(G.mode==='host'||G.mode==='client')Net.stop();lobby()})},
 rematch(){G.rematch()},toRoom(){Net.toRoom()},hostRoom(b){Net.hostRoom(b)},joinRoom(b){Net.joinRoom(b)},offline(){G.start('ai')},copy(){try{navigator.clipboard.writeText(Net.code);toast('Code copied')}catch(e){toast('Code: '+Net.code)}},
 startM(){Net.startMatch()},leaveRoom(){Net.stop();Net.menu()},rs(b){Net.setStyle(b.dataset.s)},hsets(){sets('pausemenu')},pausemenu(){G.pauseUI()}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled&&act[b.dataset.a]){AU.init();AU.p('ui');act[b.dataset.a](b)}});

/* ================= FX + RENDER ================= */
const FX={sp:[],tx:[],nf:[],sh:0,ring:[],wv:[],sl:[],bm:[],cr:[],tr:[],gt:[],fl:0,flc:'#ffffff',vg:0,vgc:'#ffffff',wk:0,wtMin:0,wtId:null};let VW={s:1,ox:0,oy:0,cx:0,cy:0,W:0,H:0,rot:0,sa:{t:0,r:0,b:0,l:0}},TICK=0;const CAM={x:0,y:0,z:0};
let CE=0,RF=null,QL=TOUCH?1:2,WTID=null;const PERF={show:false,e:16.7};
const SAP=document.createElement('div');SAP.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';document.body.appendChild(SAP);
function resize(){const q=getComputedStyle(SAP);VW.sa={t:parseFloat(q.paddingTop)||0,r:parseFloat(q.paddingRight)||0,b:parseFloat(q.paddingBottom)||0,l:parseFloat(q.paddingLeft)||0};const d=Math.min(devicePixelRatio||1,TOUCH?1.5:2)*[.7,.85,1][QL];cv.width=innerWidth*d;cv.height=innerHeight*d;VW.W=innerWidth;VW.H=innerHeight;cx.setTransform(d,0,0,d,0,0)}let RSZ=0;addEventListener('resize',()=>{resize();RSZ=performance.now()+300});resize();
function fxEv(e){const lite=!SV.set.fx;switch(e.t){
 case'hit':if(FX.sp.length>200)FX.sp.splice(0,60);if(!lite)for(let i=0;i<(e.hv?12:7);i++){const a=rnd()*TAU,v=60+rnd()*160;FX.sp.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.3,c:e.b?'#aaa':'#ffd36a'})}
  CE=Math.min(3,CE+(e.b?.08:e.hv?.7:.25));FX.tx.push({x:e.x,y:e.y-14,v:e.v,l:.8,c:e.b?'#9aa':'#fff'});if(SV.set.shk)FX.sh=Math.max(FX.sh,e.hv?9:3);AU.p(e.b?'blk':e.hv?'hv':'hit');if(e.sg)sgHit(e);if(e.pw)pwHit(e);break;
 case'wt':wtStart(e);break;case'wte':AU.p('wte');break;case'sg':sgCast(e);break;case'sgs':sgStrike(e);break;case'ctr':sgCtr(e);break;
 case'blk':AU.p('blk');break;case'dg':FX.ring.push({x:e.x,y:e.y,l:.4});AU.p('wh');break;case'wh':AU.p('wh');break;
 case'txt':FX.nf.push({m:e.m,l:1.1,c:SIGC[e.m]});if(FX.nf.length>3)FX.nf.shift();break;case'bell':AU.p('bell');CE=Math.max(CE,1.6);break;case'fgt':FX.bn={m:'FIGHT!',l:1.3,ml:1.3};shake(10);CE=3;if(SV.set.fx){FX.fl=.18;FX.flc='#ecc977'}break;case'rend':AU.p('bell');CE=Math.max(CE,1.6);break;case'ko':AU.p('ko');CE=3;if(SV.set.shk)FX.sh=14;break}}
/* ===== SIGNATURE VFX ===== */
const SC={basic:{c:'#f2f2ec',c2:'#9fc4ff'},slugger:{c:'#ff7a3d',c2:'#ffd27a'},ghost:{c:'#8fd0ff',c2:'#e6f6ff'},counter:{c:'#c28bff',c2:'#ffffff'},ippo:{c:'#ffb13b',c2:'#fff0a8'},hitman:{c:'#62f0a4',c2:'#d9ffe9'}};
const PCOL=['#4aa3ff','#ff5a5a','#5fd08a','#e0c040'];
const SIGC={};STY.forEach(k=>{SIGC[ST[k].sig.toUpperCase()]=SC[k].c});
const shake=n=>{if(SV.set.shk)FX.sh=Math.max(FX.sh,n)};
const QM=[.3,.6,1],QC=[220,380,600],cmp=a=>{let j=0;for(let i=0;i<a.length;i++)if(a[i].l>0)a[j++]=a[i];a.length=j};
const GL={},VGC={};
function glowImg(c){return GL[c]||(GL[c]=(()=>{const k=document.createElement('canvas');k.width=k.height=64;const g=k.getContext('2d'),r=g.createRadialGradient(32,32,1,32,32,32);r.addColorStop(0,c+'dd');r.addColorStop(1,c+'00');g.fillStyle=r;g.fillRect(0,0,64,64);return k})())}
function vgImg(c){return VGC[c]||(VGC[c]=(()=>{const k=document.createElement('canvas');k.width=96;k.height=54;const g=k.getContext('2d'),r=g.createRadialGradient(48,27,15,48,27,56);r.addColorStop(0,c+'00');r.addColorStop(1,c+'99');g.fillStyle=r;g.fillRect(0,0,96,54);return k})())}
const SCRIM=(()=>{const k=document.createElement('canvas');k.width=1;k.height=64;const g=k.getContext('2d'),r=g.createLinearGradient(0,0,0,64);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,1,64);return k})();
function pf(x,y,n,o){n=Math.round(n*(SV.set.fx?QM[QL]:.1));if(FX.sp.length>QC[QL])FX.sp.splice(0,QC[QL]/4|0);const cs=Array.isArray(o.c)?o.c:[o.c||'#fff'];
 for(let i=0;i<n;i++){const a=o.a==null?rnd()*TAU:o.a+(rnd()-.5)*(o.sp||0),v=(o.v0||0)+rnd()*((o.v1||o.v0||0)-(o.v0||0)),l=(o.l||.4)*(.7+rnd()*.6),j=o.jx||0;
  FX.sp.push({x:x+(rnd()-.5)*j,y:y+(rnd()-.5)*j,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l,ml:l,c:cs[rnd()*cs.length|0],s:(o.s||3)*(.7+rnd()*.6),sh:o.sh,d:o.d,gy:o.gy,ad:o.ad})}}
const wv=(x,y,r0,r1,c,w,l,sh,rot)=>{if(FX.wv.length<60)FX.wv.push({x,y,r0,r1,c,w,l,ml:l,sh,rot})};
const sl=(x,y,a,r,arc,c,c2,w,l)=>{if(FX.sl.length<20)FX.sl.push({x,y,a,r,arc,c,c2,w,l,ml:l})};
const bm=(x,y,a,len,c,c2,w,l)=>FX.bm.push({x,y,a,len,c,c2,w,l,ml:l});
function crack(x,y){FX.cr.push({x,y,l:1.3,ml:1.3,ln:Array.from({length:8},(_,i)=>{const a=i*TAU/8+rnd()*.5,L=30+rnd()*55,pts=[[0,0]];let px=0,py=0;for(let j=0;j<3;j++){const aa=a+(rnd()-.5)*.8;px+=Math.cos(aa)*L/3;py+=Math.sin(aa)*L/3;pts.push([px,py])}return pts})});if(FX.cr.length>6)FX.cr.shift()}
function sgCast(e){const C=SC[e.s]||SC.basic,pv=G.pv[e.id];AU.p('sg');if(SV.set.fx){FX.vg=1;FX.vgc=C.c}
 wv(e.x,e.y,8,e.s==='slugger'?84:62,C.c,5,.5,e.s==='counter'||e.s==='ghost'?'d':'o');wv(e.x,e.y,4,40,C.c2,2,.35,'o');
 switch(e.s){
  case'ghost':if(pv)pv.org=[e.x,e.y];pf(e.x,e.y,22,{v0:30,v1:150,l:.7,s:5,c:[C.c,C.c2],sh:'c',d:3,ad:1,gy:-20});pf(e.x,e.y,10,{a:e.a+Math.PI,sp:.8,v0:150,v1:320,l:.3,s:7,sh:'l',c:C.c2,ad:1});break;
  case'slugger':pf(e.x,e.y,18,{v0:40,v1:130,l:.6,s:4,c:[C.c,C.c2],sh:'c',d:2,gy:-70,ad:1});break;
  case'counter':pf(e.x,e.y,12,{v0:60,v1:170,l:.5,s:5,c:[C.c,C.c2],sh:'d',d:3,ad:1});break;
  case'ippo':pf(e.x,e.y,20,{a:e.a+Math.PI,sp:1.4,v0:80,v1:230,l:.5,s:4,c:[C.c,C.c2],sh:'c',d:2,gy:-50,ad:1});break;
  case'hitman':wv(e.x,e.y,56,10,C.c,2,.4,'x');pf(e.x,e.y,10,{a:e.a,sp:.5,v0:100,v1:240,l:.3,s:6,sh:'l',c:[C.c,C.c2],ad:1});break;
  default:pf(e.x,e.y,12,{a:e.a,sp:1.2,v0:120,v1:260,l:.3,s:6,sh:'l',c:C.c,ad:1})}}
function sgStrike(e){const C=SC[e.s]||SC.basic,ca=Math.cos(e.a),sa=Math.sin(e.a),tx=e.x+ca*e.r,ty=e.y+sa*e.r;
 switch(e.s){
  case'basic':sl(e.x,e.y,e.a+(e.n?.15:-.15),e.r*.95,.55,e.n?C.c2:C.c,'#fff',e.n?9:6,.22);wv(tx,ty,4,e.n?46:30,e.n?C.c2:C.c,3,.28,'s');pf(tx,ty,e.n?12:7,{a:e.a,sp:1.1,v0:120,v1:300,l:.25,s:6,sh:'l',c:[C.c,C.c2],ad:1});shake(e.n?5:2);break;
  case'slugger':sl(e.x,e.y,e.a,e.r,1.15,C.c,C.c2,16,.38);wv(e.x,e.y,10,90,C.c,8,.4,'o');pf(tx,ty,26,{a:e.a,sp:1.8,v0:80,v1:340,l:.6,s:5,sh:'c',c:[C.c,C.c2,'#ff3b1f'],d:2.5,gy:-40,ad:1});shake(7);break;
  case'counter':if(e.k==='stance'){wv(e.x,e.y,20,72,C.c,4,.5,'d',Math.PI/4);wv(e.x,e.y,30,52,C.c2,2,.5,'d')}else{sl(e.x,e.y,e.a,e.r,1.5,C.c,'#fff',14,.35);pf(tx,ty,18,{a:e.a,sp:2,v0:100,v1:360,l:.5,s:6,sh:'d',c:[C.c,C.c2],d:2.5,ad:1});shake(8)}break;
  case'ippo':sl(e.x,e.y,e.a+(e.n%2?.2:-.2),e.r,.5,C.c,C.c2,6,.16);pf(tx,ty,5,{a:e.a,sp:1,v0:150,v1:340,l:.22,s:5,sh:'l',c:[C.c,C.c2],ad:1});pf(tx,ty,3,{v0:30,v1:100,l:.4,s:4,sh:'c',c:C.c,gy:-80,d:2,ad:1});
   if(e.n===4){wv(e.x,e.y,10,110,C.c,9,.5,'o');wv(tx,ty,8,74,C.c2,4,.4,'s');pf(tx,ty,32,{a:e.a,sp:2.2,v0:100,v1:400,l:.6,s:5,sh:'c',c:[C.c,C.c2,'#ff5a1f'],d:2.5,gy:-50,ad:1});sl(e.x,e.y,e.a,e.r*1.1,.9,C.c,C.c2,14,.3);shake(9);if(SV.set.fx){FX.fl=.09;FX.flc=C.c2}}break;
  case'hitman':{const L=e.n===3;bm(e.x,e.y,e.a+(e.n%2?.08:-.08),e.r,C.c,C.c2,L?12:6,L?.26:.16);if(L)wv(tx,ty,26,6,C.c,2.5,.35,'x');pf(tx,ty,L?10:4,{a:e.a,sp:.6,v0:80,v1:260,l:.3,s:6,sh:'l',c:[C.c,C.c2],ad:1});break}
  case'ghost':bm(e.x,e.y,e.a,e.r*1.35,C.c,C.c2,9,.16);sl(e.x,e.y,e.a-.25,e.r,.6,C.c2,'#ffffff',7,.18);wv(tx,ty,4,44,C.c2,3,.28,'s');
   for(let i=1;i<=5;i++){const l=.14+i*.05;FX.tr.push({x:e.x-ca*i*16,y:e.y-sa*i*16,f:e.a,c:i%2?C.c:'#6d7fd6',l,ml:l,a:.55});FX.tr.push({x:e.x-ca*i*16-ca*3,y:e.y-sa*i*16-sa*3,f:e.a,c:'#0b1226',ink:1,l,ml:l,a:.6})}while(FX.tr.length>60)FX.tr.shift();
   pf(tx,ty,14,{a:e.a,sp:1,v0:120,v1:380,l:.3,s:6,sh:'l',c:[C.c,C.c2],ad:1});shake(4);break}}
function sgHit(e){const C=SC[e.s]||SC.basic,m=e.b?.5:1,a=e.a||0,x=e.x,y=e.y;
 switch(e.s){
  case'basic':wv(x,y,6,52*m,C.c,4,.3,'s');wv(x,y,4,34*m,C.c2,2,.25,'o');pf(x,y,14*m,{a:a,sp:2,v0:80,v1:280,l:.3,s:6,sh:'l',c:[C.c,C.c2],ad:1});break;
  case'slugger':wv(x,y,8,118*m,C.c,10,.5,'o');wv(x,y,4,70*m,C.c2,5,.4,'o');if(!e.b){crack(x,y);AU.p('sgh')}pf(x,y,28*m,{v0:60,v1:360,l:.7,s:5,c:[C.c,C.c2,'#3a3a42'],d:2.2,ad:0});pf(x,y,18*m,{a:a,sp:1.4,v0:100,v1:320,l:.6,s:5,sh:'c',c:[C.c,C.c2],d:2.5,gy:-40,ad:1});shake(16*m);if(SV.set.fx&&!e.b){FX.fl=.08;FX.flc=C.c}break;
  case'counter':wv(x,y,6,86*m,C.c,6,.45,'s');wv(x,y,8,62*m,C.c2,3,.4,'d',Math.PI/4);pf(x,y,20*m,{v0:80,v1:330,l:.55,s:7,sh:'d',c:[C.c,C.c2],d:2.5,ad:1});if(!e.b)AU.p('sgh');break;
  case'ippo':wv(x,y,5,(e.n===4?96:46)*m,C.c,e.n===4?8:3,.3,'s');pf(x,y,(e.n===4?26:8)*m,{v0:60,v1:e.n===4?360:220,l:.4,s:5,sh:'c',c:[C.c,C.c2],d:2.5,gy:-60,ad:1});if(e.n===4&&!e.b){wv(x,y,8,120,C.c2,5,.5,'o');AU.p('sgh')}break;
  case'hitman':{const L=e.n===3?1:.55;wv(x,y,48*L,8,C.c,3,.3,'x');wv(x,y,6,44*m*L,C.c2,2,.28,'o');pf(x,y,12*m*L,{a:a,sp:.9,v0:100,v1:320,l:.3,s:6,sh:'l',c:[C.c,C.c2],ad:1});break}
  case'ghost':wv(x,y,6,64*m,C.c2,4,.3,'x');wv(x,y,4,48*m,C.c,3,.3,'s');sl(x-Math.cos(a)*34,y-Math.sin(a)*34,a,34,.55,C.c2,'#ffffff',6,.2);pf(x,y,16*m,{a:a,sp:1.2,v0:100,v1:380,l:.35,s:6,sh:'l',c:[C.c,C.c2,'#6d7fd6'],d:2,ad:1});shake(8*m);if(!e.b)AU.p('sgh');break}}
function wtStart(e){const C=SC[e.s]||SC.basic;FX.wtMin=1;FX.wtId=e.id;AU.p('wt');shake(4);wv(e.x,e.y,6,95,C.c,6,.7,'o');wv(e.x,e.y,4,62,'#ffffff',3,.6,'d');pf(e.x,e.y,22,{v0:30,v1:170,l:.9,s:5,c:[C.c,'#ffffff'],sh:'c',d:2.5,ad:1});if(SV.set.fx){FX.fl=.2;FX.flc='#cfe0ff'}}
function pwHit(e){wv(e.x,e.y,6,135,'#ffffff',8,.5,'o');wv(e.x,e.y,4,95,'#ecc977',5,.45,'s');pf(e.x,e.y,30,{v0:80,v1:430,l:.6,s:6,sh:'l',c:['#ffffff','#ecc977'],d:2,ad:1});shake(18);if(SV.set.fx){FX.fl=.24;FX.flc='#ffffff'}AU.p('sgh')}
function sgCtr(e){const C=SC.counter;if(SV.set.fx){FX.fl=.24;FX.flc='#efe0ff'}shake(6);wv(e.x,e.y,6,130,C.c,6,.5,'s');wv(e.x,e.y,10,90,C.c2,3,.45,'d',Math.PI/4);pf(e.x,e.y,18,{v0:90,v1:360,l:.6,s:7,sh:'d',c:[C.c,C.c2],d:2.5,ad:1})}
function sigGlove(f,g,p){if(!SV.set.fx)return;const s=f.style,C=SC[s],ca=Math.cos(f.f),sa=Math.sin(f.f),x=f.x+g[0]*ca-g[1]*sa,y=f.y+g[0]*sa+g[1]*ca;
 if(p===1){FX.gt.push({x,y,l:.3,ml:.3,c:C.c,c2:C.c2,w:s==='slugger'?18:s==='ippo'?8:s==='hitman'?7:10,k:f.id+':'+f.ai+f.k});if(FX.gt.length>160)FX.gt.splice(0,40);
  if(s==='slugger'||s==='ippo')pf(x,y,s==='ippo'?2:1,{v0:20,v1:90,l:.45,s:4,sh:'c',c:[C.c,C.c2],d:2,gy:-70,ad:1});
  else if(s==='counter')pf(x,y,1,{v0:40,v1:140,l:.3,s:5,sh:'d',c:[C.c,C.c2],d:3,ad:1});
  else if(s==='ghost')pf(x,y,1,{v0:10,v1:60,l:.5,s:5,sh:'c',c:[C.c,C.c2],d:2.5,gy:-20,ad:1});
  else if(s==='hitman')pf(x,y,1,{a:f.f+Math.PI,sp:.4,v0:40,v1:120,l:.25,s:5,sh:'l',c:C.c2,ad:1})}
 else if(p===0&&s==='slugger'&&f.k==='hook'){cx.save();cx.globalCompositeOperation='lighter';const rr=16+f.pp*16;cx.drawImage(glowImg(C.c2),g[0]-rr,g[1]-rr,rr*2,rr*2);cx.restore()}}
function diam(r){cx.beginPath();cx.moveTo(0,-r);cx.lineTo(r*.75,0);cx.lineTo(0,r);cx.lineTo(-r*.75,0);cx.closePath()}
function sigFx(f,dt,pass){if(f.gone)return;const s=f.style,C=SC[s],pv=G.pv[f.id];if(!pv)return;const fx=SV.set.fx;
 if(pass===0){
  if(WTID===f.id&&fx&&QL>0){pv.tw=(pv.tw||0)-dt;if(pv.tw<=0){pv.tw=.05;FX.tr.push({x:f.x,y:f.y,f:f.f,c:C.c,l:.4,ml:.4,a:.5});if(FX.tr.length>40)FX.tr.shift()}}
  if(pv.psd&&!f.sd){wv(f.x,f.y,6,66,C.c,5,.45,'d');wv(f.x,f.y,3,38,C.c2,2,.35,'o');pf(f.x,f.y,18,{v0:40,v1:170,l:.6,s:5,c:[C.c,C.c2],sh:'c',d:3,ad:1,gy:-20})}pv.psd=f.sd;
  const ai=fx&&QL>0&&(f.sd||(f.sg&&(s==='ippo'||s==='basic'||s==='ghost')));
  if(ai){pv.tt=(pv.tt||0)-dt;if(pv.tt<=0){const gh=s==='ghost';pv.tt=gh?.03:.045;FX.tr.push({x:f.x,y:f.y,f:f.f,c:C.c,l:gh?.45:.26,ml:gh?.45:.26,a:gh?.6:.38});if(FX.tr.length>40)FX.tr.shift()}}
  if(f.sd){if(pv.org){cx.save();cx.globalCompositeOperation='lighter';cx.lineCap='round';const g=cx.createLinearGradient(pv.org[0],pv.org[1],f.x,f.y);g.addColorStop(0,C.c+'00');g.addColorStop(1,C.c+'cc');cx.strokeStyle=g;cx.lineWidth=12;cx.beginPath();cx.moveTo(pv.org[0],pv.org[1]);cx.lineTo(f.x,f.y);cx.stroke();cx.strokeStyle=C.c2+'aa';cx.lineWidth=2;cx.stroke();cx.restore()}
   pf(f.x,f.y,2,{v0:10,v1:50,l:.6,s:6,sh:'c',c:[C.c,C.c2],ad:1,d:2,gy:-15,jx:22})}
  if(f.sg&&(s==='ippo'||s==='basic'||s==='ghost')&&rnd()<.6)pf(f.x,f.y,1,{a:f.f+Math.PI,sp:.7,v0:120,v1:260,l:.22,s:7,sh:'l',c:C.c,ad:1,jx:26});
  if(f.sg&&s==='slugger'&&f.k==='hook'&&f.p===0){const pp=f.pp||0,r=26+pp*32+Math.sin(TICK*30)*2;cx.save();cx.globalCompositeOperation='lighter';
   cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(f.x+3,f.y+6,24+pp*18,18+pp*14,0,0,TAU);cx.fill();
   cx.globalAlpha=.75;cx.drawImage(glowImg(C.c),f.x-r-10,f.y-r-10,2*r+20,2*r+20);cx.globalAlpha=1;
   cx.strokeStyle=C.c2;cx.lineWidth=2;for(let i=0;i<3;i++){const t=(TICK*1.8+i/3)%1;cx.globalAlpha=.6*t;cx.beginPath();cx.arc(f.x,f.y,12+68*(1-t),0,TAU);cx.stroke()}cx.restore();
   if(fx&&rnd()<dt*80){const a=rnd()*TAU;FX.sp.push({x:f.x+Math.cos(a)*64,y:f.y+Math.sin(a)*64,vx:-Math.cos(a)*120,vy:-Math.sin(a)*120,l:.5,ml:.5,c:rnd()<.5?C.c:C.c2,s:3.5,sh:'c',ad:1})}}
 }else{
  if(f.sg&&s==='counter'&&f.k==='stance'){const fa=f.p===2?1-f.pp:1,pul=1+Math.sin(TICK*12)*.06;cx.save();cx.translate(f.x,f.y);cx.globalCompositeOperation='lighter';
   cx.globalAlpha=fa*.5;cx.drawImage(glowImg(C.c),-44,-44,88,88);cx.globalAlpha=fa;
   for(let j=0;j<2;j++){cx.save();cx.rotate(TICK*(j?-1.4:1.1));cx.globalAlpha=(.85-j*.25)*fa;cx.strokeStyle=j?C.c2:C.c;cx.lineWidth=2.6-j*.7;diam((32+j*11)*pul);cx.stroke();cx.restore()}
   cx.fillStyle=C.c2;for(let i=0;i<4;i++){const a=TICK*3+i*TAU/4;cx.save();cx.translate(Math.cos(a)*40,Math.sin(a)*40);cx.rotate(a);cx.globalAlpha=.8*fa;diam(5);cx.fill();cx.restore()}cx.restore()}
  if(f.sg&&s==='hitman'&&f.k==='poke'&&f.p<2){const L=f.rg||100,ca=Math.cos(f.f),sa=Math.sin(f.f),ex=f.x+ca*L,ey=f.y+sa*L;cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle=C.c;cx.lineCap='round';
   cx.globalAlpha=.5+.25*Math.sin(TICK*40);cx.lineWidth=1.5;cx.setLineDash([6,5]);cx.beginPath();cx.moveTo(f.x+ca*20,f.y+sa*20);cx.lineTo(ex,ey);cx.stroke();cx.setLineDash([]);
   cx.globalAlpha=.9;cx.lineWidth=2;cx.beginPath();cx.arc(f.x,f.y,28,f.f-1,f.f+1);cx.stroke();
   cx.translate(ex,ey);cx.rotate(TICK*2);cx.globalAlpha=.9;cx.beginPath();cx.arc(0,0,9,0,TAU);for(let i=0;i<4;i++){const a=i*Math.PI/2;cx.moveTo(Math.cos(a)*5,Math.sin(a)*5);cx.lineTo(Math.cos(a)*15,Math.sin(a)*15)}cx.stroke();cx.restore()}}}
function fxGround(S,dt){cx.save();
 FX.cr.forEach(c=>{c.l-=dt;const k=Math.max(0,c.l/c.ml);cx.save();cx.translate(c.x,c.y);cx.lineCap='round';cx.lineJoin='round';c.ln.forEach(pts=>{cx.beginPath();pts.forEach((q,i)=>i?cx.lineTo(q[0],q[1]):cx.moveTo(q[0],q[1]));cx.globalAlpha=Math.min(1,k*1.5)*.8;cx.strokeStyle='#050506';cx.lineWidth=4;cx.stroke();cx.globalAlpha=Math.max(0,k*2-1);cx.strokeStyle='#ff7a3d';cx.lineWidth=1.6;cx.stroke()});cx.restore()});
 cx.globalCompositeOperation='lighter';
 FX.tr.forEach(t=>{t.l-=dt;const k=Math.max(0,t.l/t.ml);cx.globalCompositeOperation=t.ink?'source-over':'lighter';cx.save();cx.translate(t.x,t.y);cx.rotate(t.f);cx.globalAlpha=k*t.a;cx.fillStyle=t.c;cx.beginPath();cx.ellipse(-1,0,9,16,0,0,TAU);cx.fill();cx.beginPath();cx.arc(3,0,7.5,0,TAU);cx.fill();cx.beginPath();cx.arc(15,-10,6,0,TAU);cx.fill();cx.beginPath();cx.arc(15,10,6,0,TAU);cx.fill();cx.restore()});
 S.F.forEach(f=>sigFx(f,dt,0));cx.restore();
 cmp(FX.cr);cmp(FX.tr)}
function fxAir(S,dt){cx.save();S.F.forEach(f=>sigFx(f,dt,1));cx.globalCompositeOperation='lighter';cx.lineCap='round';cx.lineJoin='round';
 FX.sl.forEach(q=>{q.l-=dt;const k=1-Math.max(0,q.l)/q.ml,hd=q.a-q.arc+2*q.arc*Math.min(1,k*3.2),tl=q.a-q.arc+2*q.arc*Math.max(0,(k-.12)*1.25);if(hd<=tl)return;cx.save();cx.translate(q.x,q.y);
  [[q.w*2.6,q.c,.22],[q.w,q.c,.7],[q.w*.38,q.c2,1]].forEach(z=>{cx.globalAlpha=z[2]*(1-k);cx.strokeStyle=z[1];cx.lineWidth=z[0];cx.beginPath();cx.arc(0,0,q.r,tl,hd);cx.stroke()});cx.restore()});
 FX.bm.forEach(b=>{b.l-=dt;const k=Math.max(0,b.l/b.ml),ex=b.x+Math.cos(b.a)*b.len,ey=b.y+Math.sin(b.a)*b.len;cx.globalAlpha=k;cx.strokeStyle=b.c;cx.lineWidth=b.w*k*2.2;cx.beginPath();cx.moveTo(b.x,b.y);cx.lineTo(ex,ey);cx.stroke();cx.strokeStyle=b.c2;cx.lineWidth=Math.max(1,b.w*k*.6);cx.beginPath();cx.moveTo(b.x,b.y);cx.lineTo(ex,ey);cx.stroke()});
 const last={};FX.gt.forEach(p=>{p.l-=dt;const q=last[p.k];last[p.k]=p;if(!q||q.l<=0||p.l<=0||Math.hypot(p.x-q.x,p.y-q.y)>90)return;const k=p.l/p.ml;cx.globalAlpha=k;cx.strokeStyle=p.c;cx.lineWidth=p.w*k;cx.beginPath();cx.moveTo(q.x,q.y);cx.lineTo(p.x,p.y);cx.stroke();cx.globalAlpha=k*.9;cx.strokeStyle=p.c2;cx.lineWidth=Math.max(1,p.w*k*.35);cx.stroke()});
 FX.wv.forEach(v=>{v.l-=dt;const k=1-Math.max(0,v.l)/v.ml,e=1-Math.pow(1-k,3),r=v.r0+(v.r1-v.r0)*e;cx.save();cx.translate(v.x,v.y);cx.rotate(v.rot||0);cx.globalAlpha=Math.max(0,1-k);cx.strokeStyle=v.c;cx.lineWidth=v.w*(1-k*.7)+.5;cx.beginPath();
  if(v.sh==='d'){cx.moveTo(0,-r);cx.lineTo(r,0);cx.lineTo(0,r);cx.lineTo(-r,0);cx.closePath()}
  else if(v.sh==='x'){for(let i=0;i<4;i++){const a=i*Math.PI/2;cx.moveTo(Math.cos(a)*r*.35,Math.sin(a)*r*.35);cx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}cx.moveTo(r*.6,0);cx.arc(0,0,r*.6,0,TAU)}
  else if(v.sh==='s'){for(let i=0;i<8;i++){const a=i*TAU/8;cx.moveTo(Math.cos(a)*r*.4,Math.sin(a)*r*.4);cx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}}
  else cx.arc(0,0,r,0,TAU);cx.stroke();cx.restore()});
 let cop='lighter';FX.sp.forEach(p=>{p.l-=dt;if(p.d){const k=Math.exp(-p.d*dt);p.vx*=k;p.vy*=k}if(p.gy)p.vy+=p.gy*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const k=p.ml?p.l/p.ml:1,al=Math.max(0,Math.min(1,p.ml?k:p.l*3));if(al<=0)return;
  cx.globalAlpha=al;{const op=p.ad?'lighter':'source-over';if(op!==cop){cop=op;cx.globalCompositeOperation=op}}cx.fillStyle=cx.strokeStyle=p.c;const z=p.s||3;
  if(p.sh==='c'){cx.beginPath();cx.arc(p.x,p.y,z*(k*.6+.4),0,TAU);cx.fill()}
  else if(p.sh==='l'){const sp=Math.hypot(p.vx,p.vy)||1;cx.lineWidth=Math.max(1,z*.4);cx.beginPath();cx.moveTo(p.x,p.y);cx.lineTo(p.x-p.vx/sp*z*3,p.y-p.vy/sp*z*3);cx.stroke()}
  else if(p.sh==='d'){cx.save();cx.translate(p.x,p.y);diam(z);cx.fill();cx.restore()}
  else cx.fillRect(p.x-z/2,p.y-z/2,z,z)});
 cx.restore();
 cmp(FX.sp);cmp(FX.sl);cmp(FX.bm);cmp(FX.gt);cmp(FX.wv)}
function drawPerf(){const lag=G.mode==='client'&&Net.rtt>180;if(!PERF.show&&!lag)return;const W=VW.W,H=VW.H;cx.font='600 11px ui-monospace,Consolas,monospace';cx.textAlign='center';cx.textBaseline='bottom';cx.fillStyle=lag?'#e0766a':'#8d8c86';cx.globalAlpha=.85;
 cx.fillText(PERF.show?Math.round(1000/Math.max(1,PERF.e))+' fps'+(G.mode==='client'&&Net.rtt!=null?' · '+Net.rtt+' ms':'')+' · Q'+QL:'HIGH PING '+Net.rtt+' ms',W/2,H-4);cx.globalAlpha=1}
function fxScreen(dt){const W=VW.W,H=VW.H;
 if(FX.wk>.01){const k=FX.wk;if(QL>0){cx.globalAlpha=k*.75;cx.drawImage(vgImg('#000000'),0,0,W,H)}cx.globalAlpha=k*.16;cx.fillStyle='#3a5a9a';cx.fillRect(0,0,W,H);cx.globalAlpha=1;cx.fillStyle='#000';const bh=H*.075*k;cx.fillRect(0,0,W,bh);cx.fillRect(0,H-bh,W,bh)}
 if(SV.set.fx){if(FX.vg>0&&QL>0){cx.globalAlpha=Math.min(1,FX.vg)*.55;cx.drawImage(vgImg(FX.vgc),0,0,W,H);cx.globalAlpha=1}
  if(FX.fl>0){cx.globalAlpha=Math.min(.2,FX.fl*1.2);cx.fillStyle=FX.flc;cx.fillRect(0,0,W,H);cx.globalAlpha=1}}
 FX.vg=Math.max(0,FX.vg-dt*1.8);FX.fl=Math.max(0,FX.fl-dt*5)}
function drawTags(S,me,pass){S.F.forEach((f,i)=>{if(f.gone)return;const pc=PCOL[i%4],mine=f.id===me,dn=f.s==='down';
 if(pass===0){cx.save();cx.translate(f.x,f.y);cx.lineWidth=mine?3.5:2.5;cx.strokeStyle=pc;cx.globalAlpha=dn?.35:.95;cx.beginPath();cx.arc(0,0,28,0,TAU);cx.stroke();
  cx.globalAlpha=(dn?.35:1)*(mine?.22:.1);cx.fillStyle=pc;cx.fill();
  if(mine){const z=Math.sin(TICK*5);cx.globalAlpha=.45+.3*z;cx.lineWidth=2;cx.beginPath();cx.arc(0,0,33+z*1.5,0,TAU);cx.stroke()}cx.restore()}
 else{cx.save();cx.translate(f.x,f.y);cx.rotate(VW.rot);cx.translate(0,-36);cx.scale(1/VW.s,1/VW.s);cx.translate(0,-14);cx.textAlign='center';cx.textBaseline='middle';cx.font='700 12px system-ui,sans-serif';const nm=(f.name||'').toUpperCase().slice(0,10),w=cx.measureText(nm).width+14;cx.globalAlpha=dn?.5:1;
  cx.fillStyle='rgba(13,13,15,.82)';cx.fillRect(-w/2,-8,w,16);cx.fillStyle=pc;cx.fillRect(-w/2,-8,3,16);cx.fillStyle='#ecebe6';cx.fillText(nm,1.5,.5);
  if(mine){cx.fillStyle=pc;cx.beginPath();cx.moveTo(-5,-16);cx.lineTo(5,-16);cx.lineTo(0,-10);cx.closePath();cx.fill();cx.font='700 10px system-ui,sans-serif';cx.fillText('YOU',0,-24)}cx.restore()}})}
const RC={c:null,h:RING+196};
/* ----- crowd: static bleachers + shirts are cached, heads/hands animate each frame ----- */
const CROWD={p:null,hair:['#17120e','#2c2016','#4a3320','#1f1f26','#6b5230','#7a2f24'],skin:['#8c6a52','#b08968','#6b4a38','#c49a77','#9b7258','#d2ab88'],shirt:['#2b3a52','#4a2a2e','#2c4538','#51472a','#3a2f4f','#444448','#5b3b25','#233f4a']};
const NSIDE=[[0,1],[0,-1],[1,0],[-1,0]];
function buildCrowd(){CROWD.k=RC.k||1;let sd=1337;const r=()=>(sd=(sd*1664525+1013904223)>>>0)/4294967296,R=RING,P=[],pick=a=>a[(r()*a.length)|0];
 CROWD.rows=TOUCH?3:4;for(let row=0;row<CROWD.rows;row++){const d=R+98+row*24,step=TOUCH?18:16;
  const put=(x,y,nx,ny)=>{if(ny<0&&y>0&&Math.abs(x)<112&&row===0)return;const hc=(r()*6)|0,sc=(r()*6)|0,sd2=NSIDE.findIndex(n=>n[0]===nx&&n[1]===ny);P.push({x:x+(r()-.5)*3,y:y+(r()-.5)*3,nx,ny,ph:r()*TAU,sp:.8+r()*.5,hc,sc,si:(hc*6+sc)*4+sd2,sh:pick(CROWD.shirt),hd:r()<.3,row})};
  for(let x=-d;x<=d;x+=step){put(x,-d,0,1);put(x,d,0,-1)}
  for(let y=-d+step;y<d;y+=step){put(-d,y,1,0);put(d,y,-1,0)}}
 CROWD.p=P;const SPR=[];for(let hc=0;hc<6;hc++)for(let sc=0;sc<6;sc++)for(let sd2=0;sd2<4;sd2++){const k=2,c=document.createElement('canvas');c.width=c.height=16*k;const g=c.getContext('2d');g.scale(k,k);g.translate(8,8);g.fillStyle=CROWD.hair[hc];g.beginPath();g.arc(0,0,5.6,0,TAU);g.fill();g.fillStyle=CROWD.skin[sc];g.beginPath();g.arc(NSIDE[sd2][0]*1.6,NSIDE[sd2][1]*1.6,3.9,0,TAU);g.fill();SPR[(hc*6+sc)*4+sd2]=c}
 /* each row/side is cut into 3 long strips, pre-rendered in a calm and a cheering variant: the whole crowd is ~40 blits instead of ~850 heads */
 const CH=[],groups={};P.forEach(q=>{(groups[q.row+':'+q.nx+':'+q.ny]||(groups[q.row+':'+q.nx+':'+q.ny]=[])).push(q)});
 Object.values(groups).forEach(G3=>{const hz=G3[0].ny!==0;G3.sort((a,b)=>hz?a.x-b.x:a.y-b.y);const per=Math.ceil(G3.length/3);for(let i=0;i<G3.length;i+=per){const m=G3.slice(i,i+per),pad=18;let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;m.forEach(q=>{x0=Math.min(x0,q.x);y0=Math.min(y0,q.y);x1=Math.max(x1,q.x);y1=Math.max(y1,q.y)});x0-=pad;y0-=pad;x1+=pad;y1+=pad;
  const k=cl(CROWD.k*.8,.7,1.7),w=x1-x0,h=y1-y0,mk=cheer=>{const c=document.createElement('canvas');c.width=Math.ceil(w*k);c.height=Math.ceil(h*k);const g=c.getContext('2d');g.scale(k,k);
   m.forEach(q=>{if(cheer&&q.hd){g.fillStyle='#c9a07c';g.beginPath();[-1,1].forEach(s2=>{const hx=q.x-x0+q.nx*9-q.ny*s2*7,hy=q.y-y0+q.ny*9+q.nx*s2*7;g.moveTo(hx+2.6,hy);g.arc(hx,hy,2.6,0,TAU)});g.fill()}g.drawImage(SPR[q.si],q.x-x0-8+(cheer?q.nx*2:0),q.y-y0-8+(cheer?q.ny*2:0),16,16)});return c};
  CH.push({x:x0,y:y0,w,h,nx:m[0].nx,ny:m[0].ny,ph:m[0].ph,sp:m[0].sp,a:mk(false),b:mk(true)})}});
 CROWD.ch=CH}
function drawCrowd(t,live,x0,y0,x1,y1){const C=CROWD.ch;if(!C)return;const e=live?Math.min(1,CE/2):0,amp=live?1.1+CE*2.4:0,spd=2.6+e*5,ch=e>.3;
 for(let i=0;i<C.length;i++){const q=C[i];if(q.x+q.w<x0||q.x>x1||q.y+q.h<y0||q.y>y1)continue;const b=(amp?(Math.sin(t*spd*q.sp+q.ph)*.5+.5)*amp:0)+(ch?e*2.5:0);cx.drawImage(ch?q.b:q.a,q.x+q.nx*b,q.y+q.ny*b,q.w,q.h)}}
function cacheK(){const d=cv.width/Math.max(1,VW.W),m=Math.min(VW.W-(TOUCH?VW.W*.26:0),VW.H-110)/(2*RING+120)*1.25*d;return cl(m*1.05,.7,2.2)}
function buildRing(){const k=RC.k=cacheK(),sz=Math.round(RC.h*2*k),c=document.createElement('canvas');c.width=c.height=sz;const g=c.getContext('2d');g.scale(sz/(RC.h*2),sz/(RC.h*2));g.translate(RC.h,RC.h);if(!CROWD.p)buildCrowd();drawRing(g);RC.c=c}
function drawRing(c){const R=RING,H=RC.h;c.fillStyle='#0b0b0d';c.fillRect(-H,-H,2*H,2*H);
 for(let row=0;row<CROWD.rows;row++){const d=R+98+row*24;c.lineWidth=24;c.strokeStyle=row%2?'#1a1a1f':'#15151a';c.strokeRect(-d,-d,2*d,2*d);c.lineWidth=1.5;c.strokeStyle='#ffffff0c';c.strokeRect(-d-12,-d-12,2*d+24,2*d+24)}
 CROWD.p.forEach(q=>{c.save();c.translate(q.x-q.nx*6.5,q.y-q.ny*6.5);c.rotate(Math.atan2(q.ny,q.nx));c.fillStyle=q.sh;c.beginPath();c.ellipse(0,0,5.2,9,0,0,TAU);c.fill();c.restore()});
 const gr=c.createRadialGradient(0,0,R+70,0,0,H*1.3);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.5)');c.fillStyle=gr;c.fillRect(-H,-H,2*H,2*H);
 c.fillStyle='#141417';c.fillRect(-R-92,-R-92,2*R+184,2*R+184);c.fillStyle='#121214';c.fillRect(-R-46,-R-46,2*R+92,2*R+92);
 c.lineWidth=10;c.strokeStyle='#1c1c22';c.strokeRect(-R-43,-R-43,2*R+86,2*R+86);c.lineWidth=1.5;c.strokeStyle='#c9a24b66';c.strokeRect(-R-38,-R-38,2*R+76,2*R+76);c.strokeStyle='#ffffff10';c.strokeRect(-R-48,-R-48,2*R+96,2*R+96);
 c.fillStyle='#c9a24b2e';for(let i=-R;i<=R;i+=56){c.fillRect(i-14,-R-46,28,3);c.fillRect(i-14,R+43,28,3);c.fillRect(-R-46,i-14,3,28);c.fillRect(R+43,i-14,3,28)}
 // judges' table (bottom side) with three seated judges
 c.fillStyle='#000';c.globalAlpha=.35;c.fillRect(-84,R+53,176,24);c.globalAlpha=1;c.fillStyle='#3b2c1d';c.fillRect(-88,R+50,176,22);c.strokeStyle='#c9a24b';c.lineWidth=1.5;c.strokeRect(-88,R+50,176,22);
 c.fillStyle='#f0eee6';[-52,0,52].forEach(x=>{c.fillRect(x-9,R+54,18,12);c.fillStyle='#8d8c86';c.fillRect(x-6,R+57,12,1.2);c.fillRect(x-6,R+60,9,1.2);c.fillStyle='#f0eee6'});
 c.fillStyle='#c9a24b';c.font='700 7px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText('JUDGES',0,R+69.5);
 [-52,0,52].forEach((x,i)=>{const y=R+84;c.fillStyle=['#202838','#2e2230','#1f3029'][i];c.beginPath();c.ellipse(x,y+4,10.5,6,0,0,TAU);c.fill();c.fillStyle=CROWD.skin[[3,0,4][i]];c.strokeStyle='#111';c.lineWidth=1;c.beginPath();c.arc(x,y-1,6,0,TAU);c.fill();c.stroke();c.fillStyle=CROWD.hair[[1,0,4][i]];c.beginPath();c.arc(x,y+.8,6,.05,Math.PI-.05);c.fill()});
 c.fillStyle='#24242a';c.fillRect(-R,-R,2*R,2*R);c.strokeStyle='#ffffff08';c.lineWidth=1;for(let i=-R;i<=R;i+=14){c.beginPath();c.moveTo(i,-R);c.lineTo(i,R);c.moveTo(-R,i);c.lineTo(R,i);c.stroke()}
 c.strokeStyle='#c9a24b66';c.lineWidth=3;c.beginPath();c.arc(0,0,86,0,TAU);c.stroke();c.lineWidth=1;c.beginPath();c.arc(0,0,72,0,TAU);c.stroke();c.fillStyle='#c9a24b55';c.font='700 34px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText('TDBA',0,2);
 ['#e8e6df','#b64a3c','#e8e6df'].forEach((col,i)=>{c.strokeStyle=col;c.globalAlpha=.8;c.lineWidth=3;const o=R+4+i*7;c.strokeRect(-o,-o,2*o,2*o)});c.globalAlpha=1;
 [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(p=>{c.fillStyle='#1b1b1f';c.strokeStyle='#c9a24b';c.lineWidth=3;c.beginPath();c.arc(p[0]*(R+18),p[1]*(R+18),13,0,TAU);c.fill();c.stroke()})}
/* ----- referee: walks around the fighters, counts over a downed boxer ----- */
const angd=(a,b)=>((a-b+Math.PI)%TAU+TAU)%TAU-Math.PI;
function updRef(S,dt){if(!S.F.length)return;const live=S.F.filter(f=>!f.gone&&f.hp>0),A=live.length?live:S.F.filter(f=>!f.gone),dn=S.F.find(f=>!f.gone&&f.s==='down');
 if(!RF)RF={x:0,y:RING*.6,f:-Math.PI/2,sp:0,cnt:0,sd:1};
 let mx=0,my=0,ax=1,ay=0;if(A.length){mx=A.reduce((q,f)=>q+f.x,0)/A.length;my=A.reduce((q,f)=>q+f.y,0)/A.length}
 if(A.length>1){ax=A[1].x-A[0].x;ay=A[1].y-A[0].y;const L=Math.hypot(ax,ay)||1;ax/=L;ay/=L}
 const px=-ay,py=ax;if(((RF.x-mx)*px+(RF.y-my)*py)*RF.sd<-30)RF.sd=-RF.sd;
 const sep=A.length>1?Math.hypot(A[1].x-A[0].x,A[1].y-A[0].y):0,off=Math.max(78,sep*.5+62);let tx,ty;
 if(dn){tx=dn.x+px*RF.sd*52;ty=dn.y+py*RF.sd*52}else{tx=mx+px*RF.sd*off;ty=my+py*RF.sd*off}
 const lim=RING-26;tx=cl(tx,-lim,lim);ty=cl(ty,-lim,lim);
 const dx=tx-RF.x,dy=ty-RF.y,dist=Math.hypot(dx,dy),v=Math.min(230,dist*3.2);if(dist>1){RF.x+=dx/dist*v*dt;RF.y+=dy/dist*v*dt}
 S.F.forEach(f=>{if(f.gone)return;const ex=RF.x-f.x,ey=RF.y-f.y,d=Math.hypot(ex,ey);if(d<44&&d>.01){RF.x+=ex/d*(44-d);RF.y+=ey/d*(44-d)}});
 RF.x=cl(RF.x,-RING-10,RING+10);RF.y=cl(RF.y,-RING-10,RING+10);RF.sp+=(v-RF.sp)*Math.min(1,10*dt);RF.cnt=dn?1:0;
 const lk=dn||{x:mx,y:my};RF.f+=angd(Math.atan2(lk.y-RF.y,lk.x-RF.x),RF.f)*Math.min(1,9*dt)}
function drawRef(c,t){const r=RF;if(!r)return;const sp=r.sp,wp=t*(7+sp*.05),aw=r.cnt?Math.sin(t*5.5):0;
 c.save();c.translate(r.x,r.y);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(4,6,16,12,0,0,TAU);c.fill();c.rotate(r.f);
 c.fillStyle='#0c0c0e';[-1,1].forEach(s=>{c.beginPath();c.ellipse(-2+Math.sin(wp)*s*(sp>8?7:0),s*6,6.5,3.6,0,0,TAU);c.fill()});
 const hands=[[10+Math.sin(wp)*(sp>8?2:0),-11],[r.cnt?15+aw*4:10,r.cnt?9+aw*8:11]];
 hands.forEach((h,i)=>{const sy=i?9:-9;c.lineCap='round';c.strokeStyle='#f2f1ec';c.lineWidth=5.5;c.beginPath();c.moveTo(0,sy);c.lineTo(h[0]*.55,sy+(h[1]-sy)*.55);c.stroke();c.strokeStyle='#d9b08c';c.lineWidth=4;c.beginPath();c.moveTo(h[0]*.55,sy+(h[1]-sy)*.55);c.lineTo(h[0],h[1]);c.stroke();c.fillStyle='#d9b08c';c.beginPath();c.arc(h[0],h[1],2.8,0,TAU);c.fill()});
 c.save();c.beginPath();c.ellipse(-1,0,8,13.5,0,0,TAU);c.fillStyle='#f2f1ec';c.fill();c.clip();c.fillStyle='#111';[-9,-4.5,0,4.5,9].forEach(y=>c.fillRect(-10,y-.9,20,1.8));c.restore();
 c.strokeStyle='#111';c.lineWidth=1.5;c.beginPath();c.ellipse(-1,0,8,13.5,0,0,TAU);c.stroke();
 c.fillStyle='#d9b08c';c.beginPath();c.arc(2,0,6.3,0,TAU);c.fill();c.stroke();c.fillStyle='#17120e';c.beginPath();c.arc(.5,0,6.3,Math.PI*.5,Math.PI*1.5);c.fill();c.fillStyle='#111';c.beginPath();c.moveTo(7.6,-3);c.lineTo(7.6,3);c.lineTo(5.6,0);c.closePath();c.fill();
 c.restore()}
const TWS={};
function drawF(c,f,t,mv){const S=ST[f.style],down=f.s==='down',L=mv||0,wp=t*(8+L*.03),po=f.po||null,lf=po&&po.lift||0;
 c.save();c.translate(f.x,f.y);c.fillStyle='rgba(0,0,0,'+(.4-.18*lf)+')';c.beginPath();c.ellipse(4+lf*12,6+lf*12,19*(1-.2*lf),14*(1-.2*lf),0,0,TAU);c.fill();
 if(f.s==='dodge'||f.iv){c.globalAlpha=.5}if(po&&po.al!=null)c.globalAlpha*=po.al;
 let sx=0,sy=0;if(f.s==='stun'){sy=Math.sin(t*60)*2}
 c.translate(sx,sy);c.rotate(f.f);if(po&&(po.sc||lf)){const k=(po.sc||1)*(1+lf*.3);c.scale(k,k)}
 if(f.s==='stun'||down)c.rotate(down?.0:Math.sin(t*40)*.06);
 if(f.s==='dodge'){c.fillStyle=S.col+'33';c.beginPath();c.ellipse(-16,0,12,16,0,0,TAU);c.fill();c.beginPath();c.ellipse(-32,0,10,14,0,0,TAU);c.fill()}
 const br=1+Math.sin(t*3+f.x)*.03,ex=f.st<=0?3:0;
 const twT=(()=>{if(down||!(f.p>=0)||f.k==='stance')return 0;const i=f.k==='poke'?((f.ai||0)%2?1:0):f.h>0?1:0,e=f.p===0?-.25*f.pp:f.p===1?Math.min(1,-.25+1.5*f.pp):1-f.pp,hk=f.k==='hv'||f.k==='hook'||f.k==='cs';return -(i?1:-1)*(hk?.75:f.k==='poke'?.34:.5)*e})(),
  to=TWS[f.id||f.style]||(TWS[f.id||f.style]={v:0,t}),tdt=Math.min(.05,Math.max(0,t-to.t));to.t=t;to.v+=(twT-to.v)*(1-Math.exp(-tdt*(Math.abs(twT)>Math.abs(to.v)?45:14)));
 const tws=to.v,tw=down?0:tws*1.15+Math.sin(t*3+f.x)*.04+(L>10?Math.sin(wp)*.09:0)+(po&&po.tw||0);
 c.fillStyle='#111';[-1,1].forEach(s=>{c.beginPath();c.ellipse(-3+Math.sin(wp)*s*(L>10?8:0),s*8,7,4,0,0,TAU);c.fill()});
 if(f.s==='stance'||f.k==='stance'){c.strokeStyle=S.col;c.globalAlpha=.7;c.lineWidth=2;c.beginPath();c.arc(0,0,24+Math.sin(t*14)*2,0,TAU);c.stroke();c.globalAlpha=1}
 if(po&&po.rb>0)robe(c,S,po);
 c.fillStyle='#303036';c.strokeStyle=S.col;c.lineWidth=2;c.beginPath();c.ellipse(-2-ex,0,8.5*br,11.5,0,0,TAU);c.fill();c.stroke();
 c.save();c.rotate(tw);
 c.fillStyle='#303036';c.beginPath();c.ellipse(-.5-ex,0,6.5*br,16.5,0,0,TAU);c.fill();c.stroke();
 // arms+gloves
 const rest=(s)=>f.g?[17,s*5]:[15+Math.sin(t*3+s)*.8,s*10];let gp=[rest(-1),rest(1)],trail=null;
 if(f.p>=0){const hs=f.h,i=f.k==='poke'?((f.ai||0)%2?1:0):hs>0?1:0,e=f.p===0?-.25*f.pp:f.p===1?Math.min(1,-.25+1.5*f.pp):1-f.pp,reach=Math.max(20,f.rg*.9),hook=f.k==='hv'||f.k==='hook'||f.k==='cs';
  if(f.k==='stance')gp=[[8,-14],[8,14]];else{const sw=hook?-hs*Math.sin(cl(f.p===1?f.pp:f.p===2?1:0,0,1)*Math.PI)*20:0;gp[i]=[14+e*reach,hs*9+sw];
  if(f.k==='poke'){const fl=i?1:-1,ph=f.p===1?f.pp:f.p===2?1:0;gp=[[12,-9],[12,9]];gp[i]=[14+e*reach,fl*9-fl*Math.sin(ph*Math.PI)*12]}
  if(f.p===1)trail={a:gp[i],al:1-f.pp};if(f.sg&&f.id)sigGlove(f,gp[i],f.p)}}
 if(po&&po.gp)gp=po.gp;
 gp.forEach((g,k)=>{const sh=k?12:-12;c.strokeStyle='#c9a98a';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(0,sh);c.lineTo(g[0]-4,g[1]);c.stroke()});
 if(trail){c.strokeStyle='rgba(255,255,255,'+(trail.al*.55)+')';c.lineWidth=f.k==='poke'?4:9;c.beginPath();c.moveTo(10,trail.a[1]*.4);c.lineTo(trail.a[0],trail.a[1]);c.stroke()}
 gp.forEach(g=>{c.fillStyle=S.col;c.strokeStyle='#111';c.lineWidth=2;c.beginPath();c.arc(g[0],g[1],f.g?7.5:6.5,0,TAU);c.fill();c.stroke()});
 c.restore();c.fillStyle='#d9b08c';c.strokeStyle='#111';c.beginPath();c.arc(3-ex,0,7.5,0,TAU);c.fill();c.stroke();c.fillStyle='#2a1c14';c.beginPath();c.arc(1-ex,0,7.5,Math.PI*.55,Math.PI*1.45);c.fill();
 if(po&&po.hood>0){c.globalAlpha*=po.hood;c.fillStyle=S.col;c.strokeStyle='#e8c46a';c.lineWidth=1.5;c.beginPath();c.arc(-1-ex,0,10.5,0,TAU);c.fill();c.stroke();c.fillStyle='#00000066';c.beginPath();c.arc(1-ex,0,6,0,TAU);c.fill();c.globalAlpha/=po.hood}
 if(f.g){const gf=S.gb&&f.gb!=null?cl(f.gb/S.gb,0,1):1;c.globalAlpha=.4+.5*gf;c.strokeStyle=gf>.25?'#9cc4ec':'#e0766a';c.lineWidth=4;c.lineCap='round';c.beginPath();c.arc(0,0,24,-1,1);c.stroke()}
 if(po&&po.fl>0){c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,po.fl)*.75;c.fillStyle=po.fc||'#ffffff';c.beginPath();c.ellipse(0,0,19,19,0,0,TAU);c.fill();c.globalCompositeOperation='source-over'}
 c.restore()
}
function robe(c,S,po){const o=po.ro||0;c.save();c.globalAlpha*=Math.min(1,po.rb*1.3);c.translate(-9-o*38,0);c.rotate(o*.6);c.fillStyle=S.col;c.strokeStyle='#e8c46a';c.lineWidth=2;c.beginPath();c.ellipse(0,0,15-o*4,23,0,0,TAU);c.fill();c.stroke();c.fillStyle='#00000055';c.beginPath();c.ellipse(-3,0,9,16,0,0,TAU);c.fill();c.fillStyle='#e8c46a';c.fillRect(-2,-23,2.5,46);c.restore()}
/* ================= CINEMATICS: ring entrance + signature cutscenes ================= */
const kES=x=>x<=0?0:x>=1?1:x*x*(3-2*x),kEO=x=>x<=0?0:x>=1?1:1-Math.pow(1-x,3),kEI=x=>x<=0?0:x>=1?1:x*x*x,kSG=(t,a,b)=>(t-a)/(b-a),kCK=x=>x<0?0:x>1?1:x,kLP=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k];
const CIN={on:false,key:'',cl:-1},ENT={last:-1},POSE_T=1.4,STL=[[17,-7],[17,7]];
/* --- entrance: each fighter walks in from the crowd (seat 0 left, then seat 1), drops the robe, hits a pose --- */
function introFrame(S){const it=S.it||0,n=S.F.length,F=[],pos=[];let cur=null;
 S.F.forEach((f,i)=>{const u=it-i*INTRO_T;pos[i]=null;if(u<0)return;
  const a=Math.PI+i*TAU/n,fin=[f.x,f.y],ds=RING+150,st=[Math.cos(a)*ds,Math.sin(a)*ds],x=kSG(u,0,1.75),P=kLP(st,fin,kEO(x)),dist=Math.hypot(st[0]-fin[0],st[1]-fin[1]),pp=kCK(kSG(u,1.75,1.75+POSE_T)),walk=u<1.75,T=TICK;
  const o=S.F[(i+1)%n],rival=it-((i+1)%n)*INTRO_T>0,fa=u>1.75&&rival?Math.atan2(o.y-f.y,o.x-f.x):a+Math.PI,nx=-Math.sin(fa),ny=Math.cos(fa);
  const rt=kES(kSG(u,1.78,2.12)),po={rb:u<1.78?1:1-rt,ro:u<1.78?0:rt,hood:u<1.8?1:Math.max(0,1-kSG(u,1.8,2))};
  let gp=[[17,-7+Math.sin(T*4)*.8],[17,7]],tw=0,lat=0;
  if(walk){const sw=Math.sin(T*9);gp=[[22+sw*9,-8],[22-sw*9,8]];tw=Math.sin(T*4.5)*.12}
  else switch(f.style){
   case'basic':{const jb=c=>Math.sin(kCK(kSG(pp,c,c+.12))*Math.PI);gp=[[14+jb(.2)*44+jb(.62)*50,-8+jb(.62)*4],[14+jb(.4)*44,8]];tw=-(jb(.2)-jb(.4)+jb(.62))*.4;break}
   case'slugger':{const fx=kES(kSG(pp,.05,.4)),sm=kEI(kSG(pp,.5,.56)),sh=Math.sin(T*42)*(.7+fx);gp=[[6+sm*24,-30*fx*(1-sm)-5*sm+sh],[6+sm*24,30*fx*(1-sm)+5*sm-sh]];po.sc=1+.1*fx;break}
   case'ghost':{tw=Math.sin(T*7)*.45;lat=Math.sin(T*5)*10;const bk=pp>.5&&pp<.95;gp=[[15,-12],bk?[34+Math.sin(T*14)*6,10]:[15+Math.sin(T*7)*6,12]];break}
   case'counter':{const cr=pp<.5;tw=cr?0:-.2;gp=cr?[[12,10],[12,-10]]:[[36+Math.sin(T*10)*4,-2],[12,8]];break}
   case'ippo':{const sw=Math.sin(T*13);tw=sw*.75;lat=sw*10;gp=[[21,-6+sw*5],[21,6-sw*5]];break}
   case'hitman':{const e=kES(kSG(pp,.05,.3)),rc=pp>.7?Math.max(0,1-(pp-.7)*4):1;gp=[[17,-9],[17+e*(33-4*(1-rc)),0]];tw=-.15*e;break}}
  po.gp=gp;po.tw=tw;const q={x:P[0]+nx*lat,y:P[1]+ny*lat,u,pp};pos[i]=q;
  F.push(Object.assign({},f,{x:q.x,y:q.y,f:fa,s:'idle',p:-1,k:'',g:0,iv:0,po,nb:1,mvo:walk?3*(1-x)*(1-x)*dist/1.75:0}));
  if(u<INTRO_T+.3)cur={x:q.x,y:q.y,i}});
 return{F,pos,cur,src:S.F}}
function entFx(S,IF,dt){const it=S.it||0;if(it<ENT.last)ENT.last=-1;const X=t=>ENT.last<t&&it>=t;
 IF.src.forEach((f,i)=>{const q=IF.pos[i];if(!q)return;const C=SC[f.style],b=i*INTRO_T,pb=t=>b+1.75+t*POSE_T,x=q.x,y=q.y;
  if(X(b+.02)){CE=Math.max(CE,2);AU.p('wh')}
  if(q.u<1.75&&rnd()<dt*16)pf(x,y,1,{v0:20,v1:90,l:.5,s:3,c:[C.c,C.c2],gy:-30,ad:1});
  if(X(b+1.78)){AU.p('sg');wv(x,y,8,92,C.c,5,.5,'o');pf(x,y,26,{v0:60,v1:240,l:.7,s:5,c:[C.c,C.c2,'#e8c46a'],d:2,gy:-30,ad:1});shake(5);CE=Math.min(3,CE+.8)}
  switch(f.style){
   case'basic':[.2,.4,.62].forEach(c=>{if(X(pb(c))){AU.p('hit');pf(x,y,8,{a:Math.atan2(-y,-x),sp:1.4,v0:80,v1:240,l:.3,s:5,sh:'l',c:[C.c,C.c2],ad:1})}});break;
   case'slugger':if(X(pb(.55))){AU.p('sgh');shake(15);wv(x,y,8,118,C.c,8,.5,'o');wv(x,y,4,72,C.c2,4,.4,'o');pf(x,y,26,{v0:80,v1:340,l:.6,s:5,sh:'c',c:[C.c,C.c2,'#ff3b1f'],d:2.2,gy:-40,ad:1});CE=3}break;
   case'ghost':if(X(pb(.5))){AU.p('wh');for(let k=1;k<=5;k++)FX.tr.push({x:x-k*10,y,f:0,c:'#8fd0ff',l:.5,ml:.5,a:.5});pf(x,y,18,{v0:30,v1:160,l:.7,s:5,c:[C.c,C.c2],sh:'c',d:3,ad:1,gy:-20})}break;
   case'counter':if(X(pb(.5))){AU.p('sg');wv(x,y,10,86,C.c,4,.5,'d',Math.PI/4);wv(x,y,6,56,C.c2,2,.5,'d')}break;
   case'ippo':[.3,.6,.85].forEach(c=>{if(X(pb(c))){AU.p('hit');wv(x,y,6,60,C.c,4,.3,'s');pf(x,y,14,{v0:60,v1:260,l:.45,s:5,sh:'c',c:[C.c,C.c2,'#ff5a1f'],d:2.5,gy:-60,ad:1})}});break;
   case'hitman':if(X(pb(.3))){AU.p('sg');bm(x,y,Math.atan2(-y,-x),170,C.c,C.c2,6,.25);wv(x,y,50,8,C.c,2,.4,'x')}break}});
 ENT.last=it}
function introWorld(S,IF){const it=S.it||0,T=S.itT||1,env=kES(kSG(it,0,.5))*(1-kES(kSG(it,T-.6,T))),RH=RC.h;cx.save();cx.globalAlpha=.5*env;cx.fillStyle='#04040a';cx.fillRect(-RH,-RH,2*RH,2*RH);cx.globalCompositeOperation='lighter';cx.globalAlpha=.5*env;const c=IF.cur||{x:0,y:0};cx.drawImage(glowImg('#ffeeb0'),c.x-200,c.y-200,400,400);cx.restore()}
function cinBars(env){const bh=Math.round(VW.H*.1*env);if(bh>0){cx.fillStyle='#000';cx.fillRect(0,0,VW.W,bh);cx.fillRect(0,VW.H-bh,VW.W,bh)}return bh}
function introCards(S,IF){const W=VW.W,H=VW.H,it=S.it||0,T=S.itT||1,sa=VW.sa,env=kEO(it/.5)*kEO((T-it)/.5),bh=cinBars(env);
 IF.src.forEach((f,i)=>{const u=it-i*INTRO_T;if(u<.7||u>3.25)return;const k=kES(kSG(u,.7,1.1))*(1-kES(kSG(u,3,3.25))),D=ST[f.style],C=D.col,w=Math.min(W*.6,460),h=Math.max(58,Math.min(86,H*.2)),right=i%2===1,y=H-bh-h-12,x0=right?W-sa.r-12-w:sa.l+12,x=x0+(1-k)*(w+40)*(right?1:-1);
  cx.save();cx.globalAlpha=k;cx.translate(x,y);const g=cx.createLinearGradient(0,0,w,0);g.addColorStop(right?1:0,'rgba(8,8,12,.92)');g.addColorStop(right?0:1,'rgba(8,8,12,.55)');cx.fillStyle=g;cx.fillRect(0,0,w,h);cx.fillStyle=C;cx.fillRect(right?w-5:0,0,5,h);
  cx.textAlign=right?'right':'left';const tx=right?w-18:18;cx.textBaseline='middle';
  cx.font=`italic 700 ${Math.round(h*.4)}px Georgia,serif`;cx.fillStyle='#fff';cx.fillText(f.name.toUpperCase().slice(0,14),tx,h*.32);
  cx.font=`700 ${Math.max(10,Math.round(h*.19))}px system-ui,sans-serif`;cx.fillStyle=C;cx.fillText(D.n.toUpperCase()+' STYLE',tx,h*.62);
  cx.font=`600 ${Math.max(9,Math.round(h*.16))}px system-ui,sans-serif`;cx.fillStyle='#8d8c86';cx.fillText('SIGNATURE · '+D.sig.toUpperCase(),tx,h*.84);cx.restore()});
 if(G.mode==='ai'&&env>.5){cx.globalAlpha=.55+.3*Math.sin(TICK*4);cx.font='600 11px system-ui,sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle='#ecebe6';cx.fillText(TOUCH?'TAP TO SKIP':'CLICK OR SPACE TO SKIP',W/2,H-bh/2);cx.globalAlpha=1}}
/* --- signature cutscenes: both fighters are placed by a scripted timeline (positions match the sim's end state) --- */
function csFrame(cs){const t=cs.t,d=cs.d,u=[Math.cos(cs.a),Math.sin(cs.a)],n=[-u[1],u[0]],E=csEnd(cs),AS=[cs.ax,cs.ay],VS=[cs.vx,cs.vy],AE=[E.ax,E.ay],VE=[E.vx,E.vy],VE0=[E.vx0,E.vy0],D=Math.hypot(VS[0]-AS[0],VS[1]-AS[1]);
 const U=(o,a,b)=>[o[0]+u[0]*a+n[0]*(b||0),o[1]+u[1]*a+n[1]*(b||0)];
 let ap=AS,vp=VS,af=cs.a,vf=cs.a+Math.PI,sp=0;const Ap={gp:[[17,-7],[17,7]]},Vp={gp:[[6,-16],[6,16]]},ex=[],pulse=cs.h.reduce((m,h)=>t>=h[0]?Math.max(m,Math.max(0,1-(t-h[0])/.16)):m,0),face=()=>Math.atan2(vp[1]-ap[1],vp[0]-ap[0]);
 switch(cs.s){
  case'basic':{const ca=D-38,lp=kSG(t,1.6,2.35);ap=U(AS,ca*kEO(kSG(t,0,.35))+22*kEO(kSG(t,1.6,1.8)));ap=kLP(ap,AE,kES(kSG(t,2,2.55)));vp=kLP(VS,VE,kEO(lp));Vp.lift=Math.sin(kCK(lp)*Math.PI);af=face();
   const j=[kSG(t,.42,.62),kSG(t,.68,.88),kSG(t,.92,1.14)],w=kSG(t,1.2,1.6),up=kSG(t,1.6,1.95);let gp=[[17,-7],[17,7]],tw=0;
   j.forEach((p,i)=>{if(p>0&&p<1){const e=Math.sin(p*Math.PI),r=i===1?1:0;gp[r]=[14+e*(i===2?54:46),r?8:(i===2?-4:-8)];tw=(r?-1:1)*.45*e}});
   if(w>0&&up<=0){gp=[[8,-15],[8,15]];Ap.sc=1-.1*kES(w)}
   if(up>0&&up<1){gp=[[12+kEO(up)*46,2],[18,10]];tw=-.5*Math.sin(up*Math.PI);Ap.sc=.9+.2*Math.sin(up*Math.PI)}
   Ap.gp=gp;Ap.tw=tw;sp=t>.4&&t<1.2?.5:0;break}
  case'slugger':{const wd=kSG(t,.15,1.15),sw=kSG(t,1.15,1.35);ap=U(AS,-16*kES(wd)+(D-24)*kEI(sw));ap=kLP(ap,AE,kES(kSG(t,1.6,2.4)));
   af=cs.a+(-1.4*Math.PI*kES(wd)+1.75*Math.PI*kEI(sw))*(1-kES(kSG(t,1.35,1.9)));let gp=STL;if(t<1.15){const k=kES(wd);gp=[[17-15*k,-7-19*k],[17-15*k,7+19*k]]}else if(t<1.65)gp=[[36,-16],[12,12]];
   Ap.gp=gp;Ap.sc=1+.12*kES(wd)*(1-kES(kSG(t,1.35,1.7)));Ap.tw=-.3*kES(wd);
   vp=kLP(VS,VE0,kEO(kSG(t,1.3,1.85)));vp=kLP(vp,VE,kES(kSG(t,1.85,2.2)));vf=cs.a+Math.PI+6*Math.PI*kEO(kSG(t,1.3,2));Vp.lift=.35*Math.sin(kCK(kSG(t,1.3,2))*Math.PI);sp=sw>0&&sw<1?1:0;break}
  case'ghost':{const R=54,base=cs.a+Math.PI,C0=a=>[VS[0]+Math.cos(a)*R,VS[1]+Math.sin(a)*R],orb=i=>base+i*Math.PI/2+(t-.3)*5,cf=U(VS,-40),conv=kEO(kSG(t,1.75,1.95));
   ap=kLP(AS,C0(base),kEO(kSG(t,0,.3)));ap=kLP(ap,cf,conv);ap=kLP(ap,AE,kES(kSG(t,2.1,2.6)));
   Ap.al=t<.15?1:t<.3?1-kES(kSG(t,.15,.3)):t<1.85?0:kES(kSG(t,1.85,1.95));af=t>=1.85?cs.a:Math.atan2(VS[1]-ap[1],VS[0]-ap[0]);
   if(t>=.3&&t<1.97){const fade=t>1.85?1-kSG(t,1.85,1.97):1;for(let i=0;i<4;i++){const pos=kLP(C0(orb(i)),cf,conv),fa=conv>0?cs.a:Math.atan2(VS[1]-pos[1],VS[0]-pos[0]);let e=0;cs.h.forEach((h,k)=>{if(k<5&&k%4===i)e=Math.max(e,Math.sin(kCK(kSG(t,h[0]-.12,h[0]+.06))*Math.PI))});
    ex.push({x:pos[0],y:pos[1],f:fa,s:'idle',p:-1,k:'',g:0,style:'ghost',hp:1,st:50,po:{al:.62*fade*kES(kSG(t,.3,.45)),fl:.4,fc:'#8fd0ff',gp:[[17+e*40,-7],[17,7]],tw:-.4*e}})}}
   Ap.gp=t>=1.85&&t<2.3?[[14+Math.sin(kCK(kSG(t,1.88,2.05))*Math.PI)*46,-4],[17,7]]:STL;
   vp=kLP(VS,VE,kEO(kSG(t,1.95,2.55)));Vp.lift=.2*Math.sin(kCK(kSG(t,1.95,2.55))*Math.PI);vf=cs.a+Math.PI+2*Math.PI*kEO(kSG(t,1.95,2.55));sp=t>.3&&t<1.8?.4:0;break}
  case'counter':{const F0=U(VS,14,46);ap=kLP(AS,F0,kEO(kSG(t,0,.25)));ap=kLP(ap,U(F0,16,-12),kEO(kSG(t,1.4,1.5)));ap=kLP(ap,AE,kES(kSG(t,1.9,2.4)));
   vp=kLP(VS,VE,kEO(kSG(t,1.45,2.2)));vf=cs.a+Math.PI+4*Math.PI*kEO(kSG(t,1.45,2.2));Vp.lift=.25*Math.sin(kCK(kSG(t,1.45,2.2))*Math.PI);af=face();
   if(t<.7)ex.push({x:AS[0],y:AS[1],f:cs.a,s:'idle',p:-1,k:'',g:0,style:'counter',hp:1,st:50,po:{al:.55*(1-kES(kSG(t,.05,.7))),fl:.5,fc:'#c28bff',gp:STL}});
   let gp=STL,tw=0;if(t<.78){gp=[[10,-12],[10,12]];Ap.sc=.97}else if(t<.98){const e=Math.sin(kCK(kSG(t,.78,.98))*Math.PI);gp=[[14+e*46,-6],[12,10]];tw=.5*e}else if(t<1.2){const e=Math.sin(kCK(kSG(t,.98,1.2))*Math.PI);gp=[[12,-8],[14+e*46,6]];tw=-.5*e}else if(t>=1.3&&t<1.7){gp=[[14+kEO(kSG(t,1.35,1.5))*60,0],[12,10]];tw=-.6}
   Ap.gp=gp;Ap.tw=tw;sp=.2;break}
  case'ippo':{const ca=D-36,we=kES(kSG(t,.3,.45))*(1-kES(kSG(t,1.95,2.1))),push=36*kEO(kSG(t,.45,2)),back=-24*kES(kSG(t,2.05,2.35)),lun=48*kEI(kSG(t,2.35,2.45));
   ap=U(AS,ca*kEO(kSG(t,0,.3))+push+we*Math.sin(t*28)*5+back+lun,we*Math.sin(t*14)*16);ap=kLP(ap,AE,kES(kSG(t,2.6,3.1)));af=cs.a;
   vp=kLP(U(VS,push),VE,kEO(kSG(t,2.4,3)));vf=cs.a+Math.PI+4*Math.PI*kEO(kSG(t,2.4,3));Vp.lift=.3*Math.sin(kCK(kSG(t,2.4,3))*Math.PI);
   let gp=[[21,-6],[21,6]],tw=Math.sin(t*14)*.3*we;
   if(t>=.45&&t<2){const ri=Math.floor((t-.45)/.14),rp=((t-.45)%.14)/.14,r=ri%2,e=Math.sin(rp*Math.PI);gp[r]=[14+e*44,r?7:-7];tw+=(r?-1:1)*.55*e}
   else if(t>=2.05&&t<2.35){gp=[[-2,-15],[-6,15]];Ap.sc=.92}else if(t>=2.35&&t<2.7){gp=[[14+kEO(kSG(t,2.35,2.45))*58,-3],[12,10]];tw=-.7}
   Ap.gp=gp;Ap.tw=tw;sp=t>.45&&t<2?1:0;break}
  case'hitman':{ap=U(AS,-56*kEO(kSG(t,0,.4))+(56+D-36)*kEI(kSG(t,1.3,1.42)));ap=kLP(ap,AE,kES(kSG(t,1.7,2.3)));af=cs.a;
   vp=kLP(VS,VE,kEO(kSG(t,1.42,2.4)));vf=cs.a+Math.PI+2*Math.PI*kEO(kSG(t,1.42,2.4));Vp.lift=.15*Math.sin(kCK(kSG(t,1.42,2.4))*Math.PI);
   let gp=[[17,-9],[17+kES(kSG(t,.4,.6))*37,0]];if(t>=1.3&&t<1.55)gp=[[17,-9],[64,0]];else if(t>=1.78&&t<1.98)gp=[[14+Math.sin(kCK(kSG(t,1.78,1.95))*Math.PI)*46,-5],[17,8]];else if(t>=1.55)gp=STL;
   Ap.gp=gp;Ap.tw=-.15;sp=t>1.3&&t<1.5?1:0;break}}
 Vp.fl=pulse;Vp.tw=pulse*Math.sin(t*55)*.5;vp=[vp[0]+u[0]*pulse*3.5,vp[1]+u[1]*pulse*3.5];if(t>=d){ap=AE;vp=VE}
 const o={};o[cs.w]={x:ap[0],y:ap[1],f:af,po:Ap,s:'idle',p:-1,k:'',g:0};o[cs.v]={x:vp[0],y:vp[1],f:vf,po:Vp,s:'stun',p:-1,k:'',g:0};
 return{F:o,ex,pulse,sp,ap,vp,mid:[(ap[0]+vp[0])/2,(ap[1]+vp[1])/2],E,u}}
function csFx(cs,CF,dt){const C=SC[cs.s],t=cs.t,key=cs.w+cs.s+cs.ax+cs.ay;if(key!==CIN.key||t<CIN.cl){CIN.key=key;CIN.cl=-1}
 const X=x=>CIN.cl<x&&t>=x,A=CF.ap,V=CF.vp,last=cs.h.length-1;
 if(CIN.cl<0){AU.p('wt');shake(7);wv(V[0],V[1],8,100,C.c,6,.5,'o');wv(V[0],V[1],5,66,'#ffffff',3,.45,'d');if(SV.set.fx){FX.fl=.22;FX.flc=C.c2}CE=Math.max(CE,1.8)}
 cs.h.forEach((h,i)=>{if(!X(h[0]))return;const L=i===last,m=L?1.7:cs.s==='ippo'?.5:1;
  FX.tx.push({x:V[0],y:V[1]-16,v:cs.s==='ippo'&&!L?'×'+(i+1):Math.round(h[1]),l:L?1.2:.7,c:L?'#ffd36a':'#fff'});
  pf(V[0],V[1],Math.round((L?32:9)*m),{a:cs.a,sp:2.2,v0:80,v1:L?430:260,l:.4,s:5,sh:'l',c:[C.c,C.c2],ad:1});
  wv(V[0],V[1],6,L?130:cs.s==='ippo'?36:52,C.c,L?10:3,L?.5:.22,L?'o':'s');
  shake(L?(cs.s==='slugger'?26:20):cs.s==='ippo'?3:6);AU.p(L?'sgh':i%2?'hv':'hit');
  if(L){if(SV.set.fx){FX.fl=.16;FX.flc=C.c2}CE=3;wv(V[0],V[1],8,86,C.c2,5,.4,'s');if(cs.s==='slugger'||cs.s==='ippo'||cs.s==='basic')crack(V[0],V[1])}
  if(cs.s==='ghost'&&i<5&&CF.ex.length){const c=CF.ex[i%4],ang=Math.atan2(V[1]-c.y,V[0]-c.x);sl(c.x,c.y,ang,60,.7,C.c2,'#ffffff',8,.2)}
  if(cs.s==='counter')wv(V[0],V[1],6,L?96:60,C.c2,3,.4,'d',Math.PI/4)});
 switch(cs.s){
  case'basic':if(X(1.6)){AU.p('wh');wv(A[0],A[1],10,70,C.c2,4,.3,'o')}if(X(2.35)){AU.p('hv');shake(12);crack(V[0],V[1]);wv(V[0],V[1],6,100,C.c,6,.4,'o');pf(V[0],V[1],20,{v0:60,v1:260,l:.6,s:5,sh:'c',c:[C.c,C.c2],d:2.2,gy:-30,ad:1})}break;
  case'slugger':if(t>.15&&t<1.15){shake(kES(kSG(t,.15,1.15))*5);if(rnd()<dt*45)pf(A[0],A[1],2,{v0:60,v1:170,l:.5,s:4,c:[C.c,C.c2,'#ff3b1f'],gy:-60,d:2,ad:1})}
   if(X(1.15)){AU.p('sg');wv(A[0],A[1],10,110,C.c,8,.4,'o')}if(X(1.85)&&CF.E.rope){AU.p('sgh');shake(20);wv(CF.E.vx0,CF.E.vy0,6,100,C.c2,6,.45,'o');pf(CF.E.vx0,CF.E.vy0,26,{v0:80,v1:340,l:.6,s:5,sh:'l',c:[C.c,C.c2,'#ffffff'],ad:1});CE=3}break;
  case'ghost':if(X(.3)){AU.p('wh');pf(A[0],A[1],24,{v0:30,v1:170,l:.7,s:5,c:[C.c,C.c2],sh:'c',d:3,ad:1,gy:-20})}if(X(1.85)){AU.p('sg');wv(A[0],A[1],8,90,C.c2,5,.4,'s');if(SV.set.fx){FX.fl=.14;FX.flc=C.c}}break;
  case'counter':if(X(.25)){AU.p('sg');wv(V[0],V[1],10,92,C.c,4,.5,'d',Math.PI/4);wv(V[0],V[1],6,60,C.c2,2,.5,'d')}if(X(.8)){crack(V[0],V[1]);wv(V[0],V[1],8,70,C.c,5,.4,'d',Math.PI/4);AU.p('wt')}break;
  case'ippo':if(X(2.05)){AU.p('sg');wv(A[0],A[1],10,90,C.c,6,.3,'o')}if(t>2.05&&t<2.4&&rnd()<dt*40)pf(A[0],A[1],2,{v0:60,v1:180,l:.5,s:4,c:[C.c,C.c2,'#ff5a1f'],gy:-70,d:2,ad:1});break;
  case'hitman':if(X(1.3)){AU.p('sg');bm(A[0],A[1],cs.a,D2(A,V)+10,C.c,C.c2,10,.3)}if(X(1.42)){wv(V[0],V[1],44,6,C.c,3,.4,'x');wv(V[0],V[1],6,120,C.c2,4,.4,'s')}break}
 CIN.cl=t}
const D2=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1]);
function csWorld(cs,CF){const t=cs.t,C=SC[cs.s],env=kES(kSG(t,0,.25))*(1-kES(kSG(t,cs.d-.35,cs.d))),RH=RC.h;
 cx.save();cx.globalAlpha=.62*env;cx.fillStyle='#05050a';cx.fillRect(-RH,-RH,2*RH,2*RH);cx.globalCompositeOperation='lighter';cx.globalAlpha=.5*env;cx.drawImage(glowImg(C.c),CF.mid[0]-190,CF.mid[1]-190,380,380);cx.globalAlpha=.55*env;cx.drawImage(glowImg(C.c),CF.ap[0]-70,CF.ap[1]-70,140,140);cx.restore()}
function csWorld2(cs,CF){const t=cs.t,C=SC[cs.s],V=CF.vp,A=CF.ap;
 if(cs.s==='hitman'&&t>.15&&t<1.45){const k=kES(kSG(t,.15,1.3)),r=72-54*k;cx.save();cx.strokeStyle=C.c;cx.globalAlpha=.55;cx.lineWidth=1.5;cx.beginPath();cx.moveTo(A[0],A[1]);cx.lineTo(V[0],V[1]);cx.stroke();cx.globalAlpha=.95;cx.lineWidth=2.4;cx.translate(V[0],V[1]);cx.rotate(t*2.6);cx.beginPath();cx.arc(0,0,r,0,TAU);cx.stroke();for(let i=0;i<4;i++){cx.rotate(Math.PI/2);cx.beginPath();cx.moveTo(r-8,0);cx.lineTo(r+12,0);cx.stroke()}cx.restore()}}
function csScreen(cs,CF){const W=VW.W,H=VW.H,t=cs.t,C=SC[cs.s],env=kEO(t/.25)*kEO((cs.d-t)/.3);cinBars(env);
 if(CF.sp>0&&SV.set.fx){cx.save();cx.strokeStyle=C.c;cx.lineWidth=2;cx.globalAlpha=.22*CF.sp;cx.beginPath();const cx0=W/2,cy0=VW.oy;for(let i=0;i<22;i++){const a=rnd()*TAU,r0=Math.max(W,H)*(.32+rnd()*.12),r1=r0+Math.max(W,H)*(.25+rnd()*.2);cx.moveTo(cx0+Math.cos(a)*r0,cy0+Math.sin(a)*r0);cx.lineTo(cx0+Math.cos(a)*r1,cy0+Math.sin(a)*r1)}cx.stroke();cx.restore()}}
function csTitle(cs){const W=VW.W,H=VW.H,t=cs.t,C=SC[cs.s],k=kES(kSG(t,.05,.3))*(1-kES(kSG(t,1.05,1.4)));if(k<=0)return;const A=ST[cs.s],hh=Math.min(H*.2,96),y=H*.3,sz=Math.min(W*.085,58);
 cx.save();cx.globalAlpha=k;const g=cx.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.25,'rgba(6,6,10,.85)');g.addColorStop(.75,'rgba(6,6,10,.85)');g.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=g;cx.fillRect(0,y-hh/2,W,hh);
 cx.fillStyle=C.c;cx.fillRect(W*.12,y-hh/2,W*.76,2);cx.fillRect(W*.12,y+hh/2-2,W*.76,2);
 cx.translate(W/2+(1-k)*-80,y);cx.transform(1,0,-.18,1,0,0);cx.textAlign='center';cx.textBaseline='middle';cx.font=`italic 700 ${Math.round(sz)}px Georgia,serif`;cx.lineWidth=5;cx.strokeStyle='#000';cx.strokeText(A.sig.toUpperCase(),0,-4);cx.fillStyle=C.c2;cx.fillText(A.sig.toUpperCase(),0,-4);
 cx.font=`700 ${Math.max(10,Math.round(sz*.26))}px system-ui,sans-serif`;cx.fillStyle=C.c;cx.fillText(A.n.toUpperCase()+' · SIGNATURE MOVE',0,sz*.62);cx.restore()}
function ctext(t,x,y,sz,col,al='center'){cx.font=`700 ${sz}px Georgia,serif`;cx.textAlign=al;cx.textBaseline='middle';cx.fillStyle=col;cx.fillText(t,x,y)}
const HG=26;
function hudM(){const u=cl(VW.W/760,.8,1.1)*(VW.H<420?.92:1),sa=VW.sa,mt=Math.max(6,sa.t+4),nameC=mt+8*u,hpY=mt+18*u,hpH=14*u,stY=hpY+hpH+4,stH=8*u,gdY=stY+stH+3,gdH=8*u;
 return{u,gap:Math.round(96*u),ml:Math.max(8,sa.l+8),mr:Math.max(8,sa.r+8)+(TOUCH?48:0),mt,nameC,hpY,hpH,stY,stH,gdY,gdH,bot:gdY+gdH}}
function drawHUD(S,me){const M=hudM(),u=M.u,W=VW.W,n=S.F.length,mid=W/2,gap=M.gap,sp=8;cx.drawImage(SCRIM,0,0,W,M.bot+34);
 const ord=S.F.slice().sort((a,b)=>(b.id===me)-(a.id===me)),k=Math.ceil(n/2),L=ord.slice(0,k),R=ord.slice(k),big=Math.max(L.length,R.length,1);
 const aw=Math.min(mid-gap/2-M.ml,W-M.mr-mid-gap/2),pw=Math.min(360,(aw-(big-1)*sp)/big);let meX=null;
 const bar=(x,w,y,h,v,col,lab,hl)=>{cx.fillStyle='#1e1e23';cx.fillRect(x+HG,y,w-HG,h);cx.fillStyle=col;cx.fillRect(x+HG,y,(w-HG)*cl(v,0,1),h);cx.strokeStyle=hl?'#9cc4ec':'#2e2e35';cx.lineWidth=hl?2:1;cx.strokeRect(x+HG+.5,y+.5,w-HG-1,h-1);
  cx.font=`700 ${Math.max(9,9.5*u)}px system-ui,sans-serif`;cx.textAlign='left';cx.textBaseline='middle';cx.fillStyle='#8d8c86';cx.fillText(lab,x,y+h/2+.5)};
 const panel=(f,x)=>{const D=ST[f.style],isMe=f.id===me,w=pw;cx.globalAlpha=f.gone?.35:1;
  cx.font=`700 ${Math.max(11,12*u)}px system-ui,sans-serif`;cx.textBaseline='middle';cx.textAlign='left';cx.fillStyle=isMe?'#c9a24b':'#ecebe6';
  const nm=f.name.toUpperCase().slice(0,12);cx.save();cx.fillStyle=PCOL[S.F.indexOf(f)%4];cx.beginPath();cx.arc(x+5,M.nameC,4.5*u+.5,0,TAU);cx.fill();cx.restore();cx.fillText(nm,x+14,M.nameC);const nw=cx.measureText(nm).width+14;
  for(let r=0;r<WINR;r++){cx.fillStyle=r<f.rw?'#c9a24b':'#2e2e35';cx.beginPath();cx.arc(x+nw+11+r*11*u,M.nameC,3.6*u+.5,0,TAU);cx.fill()}
  cx.font=`600 ${Math.max(10,10.5*u)}px system-ui,sans-serif`;cx.textAlign='right';cx.fillStyle='#8d8c86';cx.fillText(D.n.toUpperCase(),x+w,M.nameC);
  bar(x,w,M.hpY,M.hpH,f.hp/D.hp,f.hp/D.hp>.3?'#c9a24b':'#b64a3c','HP');
  bar(x,w,M.stY,M.stH,f.st/D.stam,f.st<=0?'#b64a3c':f.st/D.stam<.25?'#d9a441':'#6fae7a','STA');
  const gb=f.gb==null?1:f.gb/D.gb,blink=f.gk&&Math.floor(TICK*6)%2;
  bar(x,w,M.gdY,M.gdH,gb,f.gk?(blink?'#e0766a':'#8a3a30'):'#6fa8dc','GRD',f.g);
  if(f.gk){cx.font=`700 ${Math.max(8,8.5*u)}px system-ui,sans-serif`;cx.textAlign='center';cx.fillStyle='#fff';cx.fillText('GUARD BROKEN',x+HG+(w-HG)/2,M.gdY+M.gdH/2+.5)}
  cx.globalAlpha=1};
 L.forEach((f,i)=>{const x=mid-gap/2-(L.length-i)*pw-(L.length-1-i)*sp;if(i===0&&f.id===me)meX=x;panel(f,x)});
 R.forEach((f,j)=>panel(f,mid+gap/2+j*(pw+sp)));
 const tr=S.ph==='fight'||S.ph==='rend';
 if(tr&&S.rt>900)ctext('TRAINING',mid,M.mt+20*u,12*u+2,'#ecebe6');else ctext(tr?Math.ceil(Math.max(0,S.rt))+'':' ',mid,M.mt+20*u,26*u,S.rt<10&&tr?'#e0766a':'#ecebe6');
 ctext('ROUND '+S.rd,mid,M.mt+44*u,Math.max(9,10*u),'#8d8c86');
 const m=S.F.find(f=>f.id===me);
 if(m){if(m.cb>1)ctext('x'+m.cb+' COMBO',mid,M.bot+11,Math.max(13,15*u),'#c9a24b');
  if(meX!=null){const D=ST[m.style],rdy=m.cs<=0,bx=meX+HG,y=M.bot+7;cx.font=`600 ${Math.max(10,10.5*u)}px system-ui,sans-serif`;cx.textAlign='left';cx.textBaseline='middle';const sc=SC[m.style].c;cx.fillStyle=rdy?sc:'#8d8c86';cx.fillText(D.sig.toUpperCase()+(rdy?' · READY':''),bx,y);
   cx.fillStyle='#1e1e23';cx.fillRect(bx,y+8,120,4);cx.fillStyle=rdy?sc:'#c9a24b';cx.fillRect(bx,y+8,120*(1-cl(m.cs/D.cdS,0,1)),4);
   if(m.style==='ippo'){cx.fillStyle='#8d8c86';cx.fillText('SPIRIT '+Math.round(m.pm),bx+130,y+8)}}}}
function render(S,dt,me){const W=VW.W,H=VW.H;FX.wtMin=Math.max(0,FX.wtMin-dt);FX.wk+=(((S.wt||FX.wtMin>0)?1:0)-FX.wk)*(1-Math.exp(-7*dt));WTID=S.wt?S.wt.w:FX.wtMin>0?FX.wtId:null;const fdt=dt*(1-.65*FX.wk);cx.fillStyle='#0d0d0f';cx.fillRect(0,0,W,H);
 let CF=null,IF=null;const S0=S;
 if(S.cs){CF=csFrame(S.cs);const m=CF.F;S=Object.assign({},S,{F:S.F.map(f=>m[f.id]?Object.assign({},f,m[f.id]):f)})}
 else if(S.ph==='intro'){IF=introFrame(S);S=Object.assign({},S,{F:IF.F})}
 if(!!IF!==CIN.on){CIN.on=!!IF;document.body.classList.toggle('cine',CIN.on)}
 const top=hudM().bot+24,px=TOUCH?Math.round(W*.13):0,full=Math.min((W-2*px)/(2*RING+120),(H-top-8)/(2*RING+120)),al=S.F.filter(f=>!f.gone&&f.hp>0);let sc=full,tx=0,ty=0;
 {const mf=al.find(f=>f.id===me);let tg=null;
  if(mf){let bd=1e9;al.forEach(o=>{if(o!==mf){const d=Math.hypot(o.x-mf.x,o.y-mf.y);if(d<bd){bd=d;tg=Math.atan2(o.y-mf.y,o.x-mf.x)}}})}
  else if(al.length>1)tg=Math.atan2(al[1].y-al[0].y,al[1].x-al[0].x);
  
  const h=0,ch=Math.cos(h),sh=Math.sin(h);
  if(al.length){tx=al.reduce((q,f)=>q+f.x,0)/al.length*.6;ty=al.reduce((q,f)=>q+f.y,0)/al.length*.6;let ex=0,ey=0;al.forEach(f=>{const dx=f.x-tx,dy=f.y-ty;ex=Math.max(ex,Math.abs(dx*ch+dy*sh));ey=Math.max(ey,Math.abs(-dx*sh+dy*ch))});
   const pd=TOUCH?90:110,z=Math.min((W-2*px)/(2*ex+pd*1.6),(H-top-8)/(2*ey+pd));sc=cl(z,full*.9,full*(TOUCH?1.9:1.5))}}
 if(CF){tx=CF.mid[0];ty=CF.mid[1];sc=full*(TOUCH?2.4:2)*(1+.1*CF.pulse)}else if(IF){const c=IF.cur;tx=c?c.x:0;ty=c?c.y:0;sc=full*(c?(TOUCH?2.1:1.8):1.15)}
 sc*=1+.1*FX.wk;if(!CAM.z){CAM.x=tx;CAM.y=ty;CAM.z=sc}else{const fast=CF||IF,k=1-Math.exp(-(fast?9:4)*dt);CAM.x+=(tx-CAM.x)*k;CAM.y+=(ty-CAM.y)*k;CAM.z+=(sc-CAM.z)*(1-Math.exp(-(fast?7:1.5)*dt))}
 if(CF)csFx(S.cs,CF,dt);else CIN.key='';if(IF)entFx(S0,IF,dt);else ENT.last=-1;
 if(RC.hud!==top){RC.hud=top;document.documentElement.style.setProperty('--hud',top+'px')}sc=CAM.z;VW.s=sc;VW.ox=W/2;VW.oy=top+(H-top)/2;VW.cx=CAM.x;VW.cy=CAM.y;VW.rot=0;
 FX.sh*=Math.exp(-9*dt);const shx=(rnd()-.5)*FX.sh,shy=(rnd()-.5)*FX.sh;
 cx.save();cx.translate(VW.ox+shx,VW.oy+shy);cx.scale(sc,sc);cx.rotate(-VW.rot);cx.translate(-VW.cx,-VW.cy);if(RSZ&&performance.now()>RSZ){RSZ=0;const nk=cacheK();if(RC.c&&(nk>RC.k*1.3||nk<RC.k*.65)){RC.c=null;CROWD.p=null}}if(!RC.c)buildRing();{const RH=RC.h,K=RC.c.width/(2*RH),hw=Math.hypot(W,H)/2/sc+44,x0=Math.max(-RH,VW.cx-hw),x1=Math.min(RH,VW.cx+hw),y0=Math.max(-RH,VW.cy-hw),y1=Math.min(RH,VW.cy+hw);cx.drawImage(RC.c,(x0+RH)*K,(y0+RH)*K,(x1-x0)*K,(y1-y0)*K,x0,y0,x1-x0,y1-y0);CE*=Math.exp(-.9*dt);drawCrowd(TICK,SV.set.fx,x0-12,y0-12,x1+12,y1+12)}
 FX.ring.forEach(r=>{r.l-=dt;cx.strokeStyle='rgba(143,182,217,'+Math.max(0,r.l*2)+')';cx.lineWidth=3;cx.beginPath();cx.arc(r.x,r.y,(.4-r.l)*140,0,TAU);cx.stroke()});FX.ring=FX.ring.filter(r=>r.l>0);
 fxGround(S,fdt);if(IF){RF=RF||{x:0,y:-120,f:Math.PI/2,sp:0,cnt:0,sd:1};RF.x=0;RF.y=-120;RF.f=Math.PI/2;RF.sp=0;RF.cnt=0}else updRef(S,CF?0:fdt);drawRef(cx,TICK);
 if(CF)csWorld(S.cs,CF);else if(IF)introWorld(S0,IF);
 if(!IF)drawTags(S,me,0);S.F.slice().sort((a,b)=>a.y-b.y).forEach(f=>{if(f.gone)return;const pv=G.pv[f.id]||{mv:0};if(f.s==='down'){cx.globalAlpha=.7}drawF(cx,f,TICK,f.mvo!=null?f.mvo:pv.mv);cx.globalAlpha=1;if(f.nb)return;
  cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(f.x-18,f.y+24,36,4);cx.fillStyle='#c9a24b';cx.fillRect(f.x-18,f.y+24,36*cl(f.hp/ST[f.style].hp,0,1),4);
  const sg=ST[f.style];if(f.gb!=null&&(f.g||f.gk||f.gb<sg.gb-.5)){cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(f.x-18,f.y+30,36,3);cx.fillStyle=f.gk?'#b64a3c':'#6fa8dc';cx.fillRect(f.x-18,f.y+30,36*cl(f.gb/sg.gb,0,1),3)}});
 if(CF){CF.ex.forEach(f=>drawF(cx,f,TICK,0));cx.globalAlpha=1;csWorld2(S.cs,CF)}
 if(!IF)drawTags(S,me,1);fxAir(S,fdt);
 FX.tx.forEach(p=>{p.l-=dt;p.x+=Math.sin(VW.rot)*30*dt;p.y-=Math.cos(VW.rot)*30*dt;cx.globalAlpha=Math.min(1,p.l*2.5);cx.save();cx.translate(p.x,p.y);cx.rotate(VW.rot);ctext(p.v+'',0,0,18,p.c);cx.restore()});cx.globalAlpha=1;FX.tx=FX.tx.filter(p=>p.l>0);
 cx.restore();fxScreen(dt);if(CF)csScreen(S.cs,CF);if(!IF)drawHUD(S,me);drawPerf();
 FX.nf.forEach((n,i)=>{n.l-=dt;cx.globalAlpha=Math.min(1,n.l*2);ctext(n.m,VW.W/2,VW.oy-(H-top)*.3+i*26,n.c?22:18,n.c||'#c9a24b')});cx.globalAlpha=1;FX.nf=FX.nf.filter(n=>n.l>0);
 if(CF)csTitle(S.cs);else if(IF)introCards(S0,IF);
 if(FX.bn){const b=FX.bn;b.l-=dt;if(b.l<=0)FX.bn=null;else{const k=1-b.l/b.ml,sc2=1+.9*Math.max(0,1-k*7);cx.save();cx.translate(W/2,VW.oy);cx.scale(sc2,sc2);cx.globalAlpha=cl(b.l*3,0,1);cx.shadowColor='#000';cx.shadowBlur=22;ctext(b.m,0,0,Math.round(Math.min(W*.17,120)),'#ecc977');cx.restore()}}
 if(S.ph==='count')ctext(S.tm>.4?Math.ceil(S.tm)+'':'FIGHT',W/2,VW.oy,72,'#ecebe6');
 if(S.ph==='rend'&&S.rl){ctext(S.rl.w?S.rl.n.toUpperCase()+' WINS THE ROUND':'DRAW',W/2,VW.oy-20,34,'#c9a24b');ctext(S.rl.why,W/2,VW.oy+18,16,'#8d8c86')}}
/* style previews on menus */
let PL=0;function prevLoop(t){requestAnimationFrame(prevLoop);if(!UI.classList.contains('on')||document.hidden||t-PL<40)return;PL=t;const ts=t/1000;
 UI.querySelectorAll('canvas.pv').forEach(c=>{const s=c.dataset.pv||SV.style,g=c.getContext('2d'),w=c.width,h=c.height;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(h/120,0,0,h/120,w/2,h/2);
  const k=Math.floor(ts/2.2)%3,pp=(ts%2.2)/2.2,atk=pp<.5&&k>0;drawF(g,{x:0,y:0,f:-Math.PI/2,style:s,s:'idle',st:50,hp:1,k:atk?(k===1?'jab':'hv'):'',p:atk?(pp<.12?0:pp<.3?1:2):-1,pp:atk?(pp<.12?pp/.12:pp<.3?(pp-.12)/.18:(pp-.3)/.2):0,h:1,rg:ST[s].rng,g:0,iv:0},ts,0)})}
requestAnimationFrame(prevLoop);

/* ================= GAME CONTROLLER ================= */
const K={},IN=Object.assign({},Z),mouse={x:0,y:0,on:false},joy={on:false,x:0,y:0,id:-1},TB={};
const G={mode:null,sim:null,S:null,run:false,paused:false,me:'p0',last:0,acc:0,pv:{},lastE:0,snapT:0,inT:0,inQ:0,ended:false,roster:null,rewarded:false,hid:0,disp:{},
 pause(p){if(!this.run)return;this.paused=p;if(p){this.pauseUI()}else hide();this.touchUI();this.release();if(!p&&this.mode==='train')this.trainUI()},
 release(){for(const k in K)K[k]=0;joy.on=false;joy.x=joy.y=0;IN.mx=IN.my=0;IN.g=0;IN.sp=0;$('#knob').style.transform='';document.querySelectorAll('.tb.on').forEach(e=>e.classList.remove('on'))},
 touchUI(){$('#tc').classList.toggle('on',TOUCH&&this.run&&!this.paused&&!this.spec&&scr==='')},
 pauseUI(){const on=this.mode==='ai'||this.mode==='train';show('pause',`<div class="w s"><h2>Paused</h2><p class="mu">${on?'Combat and timers are frozen.':'Online match continues while this menu is open.'}</p><div class="grid"><button class="gd" data-a="resume">Resume</button><button class="gh" data-a="hsets">Settings and controls</button><button class="gh" data-a="fs">Toggle fullscreen</button><button class="gh" data-a="leave">Return to lobby</button></div></div>`)},
 start(mode,roster){this.stop();AU.init();this.mode=mode;this.spec=mode==='client'&&String(Net.me)[0]==='v';this.ended=false;this.rewarded=false;this.paused=false;this.lastE=0;this.pv={};this.disp={};
  const df=SV.set.df;let pl;
  if(mode==='ai'){const os=STY[rnd()*STY.length|0];this.me='p0';pl=[{id:'p0',name:SV.name,style:SV.style},{id:'ai1',name:'CPU '+ST[os].n,style:os,ai:df}]}
  else if(mode==='train'){this.me='p0';pl=[{id:'p0',name:SV.name,style:SV.style},{id:'d1',name:'Dummy',style:'basic',dummy:true}]}
  else{pl=roster;this.me=Net.me}
  this.roster=pl;
  if(mode!=='client'){this.sim=new Sim(pl,{train:mode==='train'})}else{this.sim=null;this.S=null}
  IN.jab=IN.hv=IN.dg=IN.sg=0;CAM.z=0;CAM.h=null;this.sentE=0;this.run=true;hide();this.touchUI();this.last=performance.now();this.acc=0;this.snapT=0;this.inT=0;this.inQ=0;this.release();if(mode==='train')this.trainUI();
  cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(t=>this.frame(t));clearInterval(this.hid);this.hid=setInterval(()=>{if(document.hidden&&this.run)this.tick(.05)},50)},
 stop(){RF=null;CE=0;FX.bn=null;CIN.key='';CIN.on=false;ENT.last=-1;document.body.classList.remove('cine');this.run=false;cancelAnimationFrame(this.raf);clearInterval(this.hid);this.sim=null;this.S=null;this.sb=[];this.hb=0;this.lk='';this.slowT=0;this.pg=0;this.release();$('#trn').classList.remove('on');$('#tc').classList.remove('on');cx.clearRect(0,0,VW.W,VW.H);specUI()},
 trainUI(){const f=this.sim.F[0],d=this.sim.F[1],e=$('#trn');e.classList.add('on');
  e.innerHTML=`<button class="gh" id="t1">Spar: ${d.dummy?'off':'on'}</button><button class="gh" id="t2">Inf stamina: ${this.sim.o.inf?'on':'off'}</button><button class="gh" id="t3">Reset</button><button class="gh" id="t4">Style: ${ST[f.style].n}</button><button class="gd" id="t5">Lobby</button>`;
  $('#t1').onclick=()=>{d.dummy=!d.dummy;d.ai=d.dummy?null:SV.set.df;d.in=Object.assign({},Z);d.sj=d.sh=d.sd=d.ss=0;this.trainUI()};
  $('#t2').onclick=()=>{this.sim.o.inf=!this.sim.o.inf;this.trainUI()};
  $('#t3').onclick=()=>{this.sim.reset(true);this.sim.F.forEach(x=>x.in=Object.assign({},Z));this.sim.F.forEach(x=>x.sj=x.sh=x.sd=x.ss=0)};
  $('#t4').onclick=()=>{const u=SV.unl,s=u[(u.indexOf(f.style)+1)%u.length];this.sim.setStyle(f,s);this.trainUI()};
  $('#t5').onclick=()=>lobby()},
 rematch(){if(this.mode==='client')return;if(this.mode==='host')Net.startMatch(true);else this.start('ai')},
 localIn(){if(this.paused||scr!==''||!this.run)return Z;
  let mx=(K.KeyD?1:0)-(K.KeyA?1:0),my=(K.KeyS?1:0)-(K.KeyW?1:0);const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}if(joy.on){mx=joy.x;my=joy.y}{const c=Math.cos(VW.rot),sn=Math.sin(VW.rot),ox=mx;mx=ox*c-my*sn;my=ox*sn+my*c}
  const L=this.mode==='client'?(this.S&&this.S.F):(this.sim&&this.sim.F);const m=L&&L.find(f=>f.id===this.me);let a=IN.a;
  if(m){if(TOUCH||!mouse.on){let bd=1e9,t=null;L.forEach(o=>{if(o.id!==m.id&&!o.gone&&o.hp>0){const d=Math.hypot(o.x-m.x,o.y-m.y);if(d<bd){bd=d;t=o}}});if(t)a=Math.atan2(t.y-m.y,t.x-m.x)}
   else{const sx=(mouse.x-VW.ox)/VW.s,sy=(mouse.y-VW.oy)/VW.s,c=Math.cos(VW.rot),sn=Math.sin(VW.rot);a=Math.atan2(sx*sn+sy*c+VW.cy-m.y,sx*c-sy*sn+VW.cx-m.x)}}
  IN.mx=mx;IN.my=my;IN.a=a;IN.g=K.KeyQ||TB.g?1:0;IN.sp=K.ShiftLeft||K.ShiftRight?1:0;return IN},
 frame(now){if(!this.run)return;this.raf=requestAnimationFrame(t=>this.frame(t));const raw=now-this.last,dt=Math.min(.05,raw/1000);this.last=now;
  if(raw>0&&raw<500){PERF.e+=(raw-PERF.e)*.05;if(!this.paused&&PERF.e>24){this.slowT+=raw;if(this.slowT>2500&&QL>0){QL--;this.slowT=0;PERF.e=16.7;resize()}}else this.slowT=Math.max(0,this.slowT-raw*.5)}
  this.tick(dt)},
 tick(dt){TICK+=dt;let S;const I=this.localIn();
  if(this.mode==='client'){this.inT+=dt*1000;if(this.inT>=IN_MS){this.hb+=this.inT;this.inT=0;if(!this.spec){const k=[r2(I.mx),r2(I.my),r2(I.a),I.g,I.sp,I.jab,I.hv,I.dg,I.sg].join();if(k!==this.lk||this.hb>=120){this.lk=k;this.hb=0;Net.sendIn(I)}}}
   this.pg+=dt;if(this.pg>2){this.pg=0;if(Net.hc&&Net.hc.open)Net.hc.send({t:'ping',n:performance.now()})}
   S=this.interp();if(!S)return render({F:[],ph:'count',tm:3,rd:1,rt:90},dt,this.me),void 0}
  else{const sim=this.sim,m=sim.F.find(f=>f.id===this.me);
   if(m&&!(m.ai))Object.assign(m.in,I);
   if(!this.paused||this.mode==='host'){this.acc+=dt;let n=0;while(this.acc>=1/60&&n++<6){sim.step(1/60);this.acc-=1/60}if(n>=6)this.acc=0}
   S=sim.snap();
   if(this.mode==='host'){this.snapT+=dt*1000;if(this.snapT>=SNAP_MS){this.snapT=0;const ne=S.ev.filter(e=>e.e>this.sentE);if(ne.length)this.sentE=ne[ne.length-1].e;Net.bcast(Object.assign({},S,{ev:ne}),(this.snapN=(this.snapN||0)+1)&1)}}
   if(S.ph==='mend'&&!this.ended){this.ended=true;this.end(sim.res())}}
  S.ev.forEach(e=>{if(e.e>this.lastE){this.lastE=e.e;fxEv(e)}});
  
  S.F.forEach(f=>{const p=this.pv[f.id]||(this.pv[f.id]={x:f.x,y:f.y,mv:0});p.mv+=(Math.hypot(f.x-p.x,f.y-p.y)/Math.max(dt,.001)-p.mv)*Math.min(1,10*dt);p.x=f.x;p.y=f.y});
  render(S,dt,this.me)},
 smooth(S,dt){const k=1-Math.exp(-20*dt);return Object.assign({},S,{F:S.F.map(f=>{const d=this.disp[f.id]||(this.disp[f.id]={x:f.x,y:f.y,f:f.f});if(Math.hypot(f.x-d.x,f.y-d.y)>120){d.x=f.x;d.y=f.y}d.x+=(f.x-d.x)*k;d.y+=(f.y-d.y)*k;d.f+=adiff(f.f,d.f)*k;return Object.assign({},f,{x:d.x,y:d.y,f:d.f})})})},
 interp(){const B=this.sb;if(!B.length)return null;const rt=performance.now()-(this.spec?140:60);let i=0;while(i+1<B.length&&B[i+1].t<=rt)i++;
  for(let j=0;j<=i;j++)B[j].S.ev.forEach(e=>{if(e.e>this.lastE){this.lastE=e.e;fxEv(e)}});
  const a=B[i],b=B[i+1];if(i>0)B.splice(0,i);let u=0;if(b&&rt>a.t)u=Math.min(1,(rt-a.t)/Math.max(1,b.t-a.t));
  const F=a.S.F.map(fa=>{const fb=u>0&&b.S.F.find(x=>x.id===fa.id);if(!fb)return fa;const dx=fb.x-fa.x,dy=fb.y-fa.y;if(dx*dx+dy*dy>14400)return u>.5?fb:fa;const o=Object.assign({},fa);o.x=fa.x+dx*u;o.y=fa.y+dy*u;o.f=fa.f+adiff(fb.f,fa.f)*u;o.hp=fa.hp+(fb.hp-fa.hp)*u;return o});
  const o=Object.assign({},a.S,{F,ev:[]}),el=Math.min(.1,Math.max(0,rt-a.t)/1000);
  if(o.cs){const nt=b&&b.S.cs&&b.S.cs.w===o.cs.w?b.S.cs.t:null;o.cs=Object.assign({},o.cs,{t:Math.min(o.cs.d,nt!=null?o.cs.t+(nt-o.cs.t)*u:o.cs.t+el)})}
  if(o.ph==='intro'){const ni=b&&b.S.ph==='intro'?b.S.it:null;o.it=Math.min(o.itT,ni!=null?o.it+(ni-o.it)*u:o.it+el)}
  return o},
 onSnap(S){if(this.mode!=='client')return;if(this.S&&S.q<=this.S.q)return;this.S=S;this.sb.push({t:performance.now(),S});if(this.sb.length>16)this.sb.shift()},
 end(res){this.release();this.touchUI();const me=res.F.find(f=>f.id===this.me),won=res.win===this.me,on=this.mode==='host'||this.mode==='client';let gain='';
  if(this.mode==='ai'&&me&&!this.rewarded){this.rewarded=true;const xp=40+(won?80:0)+Math.round(me.dmg*.6),co=won?120:35;SV.m++;won?SV.w++:SV.l++;SV.ko+=me.ko;SV.dmg+=me.dmg;SV.thr+=me.thr;SV.hit+=me.hit;SV.xp+=xp;SV.coins+=co;let lv=0;while(SV.xp>=need(SV.lvl)){SV.xp-=need(SV.lvl);SV.lvl++;lv++}save();gain=`<p><b style="color:var(--gd)">+${xp} XP · +${co} coins</b>${lv?` · LEVEL UP: ${SV.lvl}`:''}</p>`}
  else if(on)gain='<p class="mu">Online matches do not change your local record or rewards.</p>';
  const w=res.F.find(f=>f.id===res.win);
  setTimeout(()=>{if(!this.run)return;this.run=false;$('#tc').classList.remove('on');show('results',`<div class="w s"><small class="mu">MATCH OVER</small><h1>${won?'VICTORY':'<b>'+(w?w.name.toUpperCase():'')+'</b> WINS'}</h1><div class="card"><table><tr><th>Fighter</th><th>Rds</th><th>Dmg</th><th>Acc</th><th>KO</th></tr>${res.F.map(f=>`<tr><td>${f.name}</td><td>${f.rw}</td><td>${f.dmg}</td><td>${f.thr?Math.round(f.hit/f.thr*100):0}%</td><td>${f.ko}</td></tr>`).join('')}</table></div>${gain}
  <div class="grid" style="margin-top:12px">${this.mode==='client'?'<p class="mu">Waiting for the host to start a rematch.</p><button class="gh" data-a="leaveRoom">Return to lobby</button>':`<button class="gd" data-a="rematch">Rematch</button>${this.mode==='host'?'<button class="gh" data-a="toRoom">Back to room</button>':''}<button class="gh" data-a="${this.mode==='host'?'leaveRoom':'lobby'}">Return to lobby</button>`}</div></div>`)},1400)}};
function btnDown(k){if(!G.run||G.paused||scr!=='')return;if(k==='g'){TB.g=1;return}if(k==='ps'){G.pause(true);return}IN[k]++}
/* input listeners */
addEventListener('keydown',e=>{AU.init();if(e.code==='F3'){e.preventDefault();PERF.show=!PERF.show;return}if(e.code==='Escape'){if(G.run&&!G.paused&&scr==='')G.pause(true);else if(G.run&&G.paused&&scr==='pause')G.pause(false);return}
 if(G.run&&G.spec&&!G.paused&&scr===''&&/^Digit[1-6]$/.test(e.code)){if(!e.repeat)Net.sendEmote(+e.code[5]-1);return}
 if(G.run&&!G.paused&&scr===''&&G.mode==='ai'&&G.sim&&G.sim.ph==='intro'&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();G.sim.skipIntro();return}
 if(!G.run||G.paused||scr!=='')return;if(['Space','ShiftLeft'].includes(e.code)||e.code.startsWith('Arrow'))e.preventDefault();if(e.repeat)return;K[e.code]=1;if(e.code==='Space')IN.dg++;if(e.code==='KeyE')IN.sg++});
addEventListener('keyup',e=>{K[e.code]=0});addEventListener('blur',()=>G.release());document.addEventListener('visibilitychange',()=>{if(document.hidden)G.release()});
addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true}});
cv.addEventListener('pointerdown',e=>{if(G.run&&!G.paused&&G.mode==='ai'&&G.sim&&G.sim.ph==='intro'){G.sim.skipIntro();return}if(e.pointerType!=='mouse')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;if(!G.run||G.paused||scr!=='')return;if(e.button===0)IN.jab++;else if(e.button===2)IN.hv++});
document.querySelectorAll('.tb').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');btnDown(k)});const up=()=>{b.classList.remove('on');if(k==='g')TB.g=0};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
const jz=$('#joy');jz.addEventListener('pointerdown',e=>{e.preventDefault();joy.on=true;joy.id=e.pointerId;jz.setPointerCapture(e.pointerId);jm(e)});jz.addEventListener('pointermove',e=>{if(joy.on&&e.pointerId===joy.id)jm(e)});
const ju=e=>{if(e.pointerId===joy.id){joy.on=false;joy.x=joy.y=0;$('#knob').style.transform=''}};jz.addEventListener('pointerup',ju);jz.addEventListener('pointercancel',ju);
function jm(e){const r=jz.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy),R=r.width*.34,m=Math.min(l,R),nx=l?dx/l:0,ny=l?dy/l:0;joy.x=l>R*.16?nx*m/R:0;joy.y=l>R*.16?ny*m/R:0;$('#knob').style.transform=`translate(${nx*m}px,${ny*m}px)`}

/* ================= NETWORKING (PeerJS, host-authoritative; pattern adapted from fps-main) ================= */
const MSG=['hello','welcome','lobby_state','style_select','start_match','ready','player_input','game_snapshot','match_end','leave','ping','pong','error','emote','emote_ev'];
const Net={peer:null,conns:[],host:false,code:'',me:'p0',players:[],inMatch:false,fill:false,hc:null,joinT:0,readyT:0,seq:0,lastIn:{},mid:0,
 num(v,a,b){v=+v;return isFinite(v)?cl(v,a,b):0},
 stop(){clearTimeout(this.joinT);clearTimeout(this.readyT);try{this.conns.forEach(c=>c.close())}catch(e){}try{if(this.hc)this.hc.close()}catch(e){}try{if(this.peer)this.peer.destroy()}catch(e){}this.conns=[];this.hc=null;this.peer=null;this.players=[];this.inMatch=false;this.host=false;this.lastIn={};if(G.mode==='host'||G.mode==='client')G.stop()},
 st(m,ok){const e=$('#nst');if(e){e.textContent=m;e.className='msg'+(ok?' ok':'')}},
 menu(){G.stop();show('online',`<div class="w s"><h2>Online play</h2><div class="card grid"><input type="text" id="on" maxlength="12" value="${SV.name}" placeholder="Your name" aria-label="Player name">
 <button class="gd" data-a="hostRoom" id="bh" title="Create a room and share the code">Host room</button><div class="row"><input type="text" id="oc" maxlength="4" placeholder="CODE" style="flex:1;text-transform:uppercase" autocapitalize="characters" aria-label="Room code"><button data-a="joinRoom" id="bj">Join room</button></div>
 <button class="gh" data-a="offline">Practice offline</button><p class="msg" id="nst"></p><small>Peer-to-peer through the public PeerJS broker. Some networks need a TURN relay and cannot connect.</small></div><button class="gh" data-a="lobby" style="margin-top:12px;width:100%">Back</button></div>`)},
 name(){const n=cleanN($('#on')&&$('#on').value);if(n){SV.name=n;save()}return n},
 hostRoom(b){const n=this.name();if(!n)return this.st('Enter your name first.');if(typeof Peer==='undefined')return this.st('Online play needs internet (PeerJS failed to load). Use offline practice.');
  this.stop();b.classList.add('ld');let tries=0;const open=()=>{const code=Array.from({length:4},()=>ABC[rnd()*ABC.length|0]).join(''),p=this.peer=new Peer(PFX+code,{config:{iceServers:ICE}});
   p.on('open',()=>{this.code=code;this.host=true;this.me='p0';this.players=[{id:'p0',name:n,style:SV.style,host:1}];this.room()});
   p.on('error',e=>{if(e.type==='unavailable-id'&&tries++<6){try{p.destroy()}catch(x){}open()}else{b.classList.remove('ld');this.stop();this.menu();this.st('Connection problem: '+e.type)}});
   p.on('connection',c=>this.onConn(c))};open();this.joinT=setTimeout(()=>{if(!this.host){b.classList.remove('ld');this.st('Could not reach the PeerJS broker. Try another network.')}},12000)},
 onConn(c){const t=setTimeout(()=>{if(!c.pid)c.close()},8000);
  c.on('open',()=>{if(this.players.length>=8){c.send({t:'error',m:'Room is full.'});setTimeout(()=>c.close(),300)}});
  c.on('data',d=>this.hmsg(c,d));c.on('close',()=>{clearTimeout(t);this.drop(c)});c.on('error',()=>this.drop(c))},
 valid(d){return d&&typeof d==='object'&&MSG.includes(d.t)},
 hmsg(c,d){if(!this.valid(d))return;
  switch(d.t){
  case'hello':if(c.pid||this.players.length>=8)return;{const id=(!this.inMatch&&!this.players.some(p=>p.id==='p1'))?'p1':['v1','v2','v3','v4','v5','v6'].find(i=>!this.players.some(p=>p.id===i));if(!id)return;let n=cleanN(d.n)||'Player',k=2;while(this.players.some(p=>p.name.toLowerCase()===n.toLowerCase()))n=n.slice(0,10)+k++;
   c.pid=id;this.conns.push(c);this.players.push({id,name:n,style:ST[d.s]?d.s:'basic'});c.send({t:'welcome',id,code:this.code});if(this.inMatch&&G.roster){c.ready=1;c.send({t:'start_match',mid:this.mid,roster:G.roster.map(p=>({id:p.id,name:p.name,style:p.style}))})}else this.lobbyBc()}break;
  case'style_select':if(c.pid&&c.pid[0]==='p'&&!this.inMatch&&ST[d.s]){const p=this.players.find(x=>x.id===c.pid);if(p){p.style=d.s;this.lobbyBc()}}break;
  case'ready':c.ready=1;break;
  case'emote':{if(!c.pid||c.pid[0]!=='v'||!G.run)return;const now=Date.now();if(now-(c.le||0)<900)return;const e=d.e|0;if(e<0||e>=EMO.length)return;c.le=now;const q=this.players.find(x=>x.id===c.pid),m={t:'emote_ev',n:q?q.name:'Spectator',e};this.bcast(m);showEmote(m.n,e)}break;
  case'player_input':{if(!c.pid||!G.sim||G.mode!=='host')return;const q=d.q|0;if(q<=(this.lastIn[c.pid]||0))return;this.lastIn[c.pid]=q;const f=G.sim.F.find(x=>x.id===c.pid);if(!f||f.ai)return;
   const i=f.in;i.mx=this.num(d.mx,-1,1);i.my=this.num(d.my,-1,1);i.a=this.num(d.a,-7,7);i.g=d.g?1:0;i.sp=d.sp?1:0;
   ['jab','hv','dg','sg'].forEach(k=>{const v=d[k]|0;if(v>=0&&v<1e9&&v>=i[k])i[k]=Math.min(v,i[k]+3)})}break;
  case'leave':this.drop(c);try{c.close()}catch(e){}break;
  case'ping':c.send({t:'pong',n:d.n});break}},
 drop(c){if(!this.conns.includes(c))return;this.conns=this.conns.filter(x=>x!==c);const p=this.players.find(x=>x.id===c.pid);this.players=this.players.filter(x=>x.id!==c.pid);
  if(this.inMatch&&G.sim){const f=G.sim.F.find(x=>x.id===c.pid);if(f){f.gone=true;f.hp=0;f.state='idle';G.sim.txt(f,f.name+' LEFT');if(G.sim.F.filter(x=>!x.gone).length<2&&G.sim.ph==='fight'){G.sim.endRound(G.sim.F.find(x=>!x.gone)||null,'OPPONENT LEFT');G.sim.fin=true}}}
  if(p)toast(p.name+' left');if(!this.inMatch){this.promote();this.lobbyBc()}},
 promote(){if(this.inMatch||this.players.some(p=>p.id==='p1'))return;const sp=this.players.find(p=>p.id[0]==='v');if(!sp)return;const c=this.conns.find(x=>x.pid===sp.id);if(!c)return;c.pid='p1';sp.id='p1';try{c.send({t:'welcome',id:'p1',code:this.code})}catch(e){}},
 lobbyBc(){const m={t:'lobby_state',code:this.code,players:this.players,fill:this.fill};this.conns.forEach(c=>c.open&&c.send(m));if(!this.inMatch&&G.mode!=='host'&&G.mode!=='client'||scr==='room'||scr==='results')this.room()},
 bcast(m,odd){this.conns.forEach(c=>{if(!c.open||!c.pid)return;if(odd&&c.pid[0]==='v'&&!m.ev.length&&!m.wt&&!m.cs&&m.ph!=='intro')return;if(m.t==='game_snapshot'&&!m.ev.length&&c.dataChannel&&c.dataChannel.bufferedAmount>65536)return;c.send(m)})},
 joinRoom(b){const n=this.name(),v=($('#oc').value||'').trim().toUpperCase();if(!n)return this.st('Enter your name first.');if(v.length!==4)return this.st('Enter the 4-character room code.');if(typeof Peer==='undefined')return this.st('Online play needs internet (PeerJS failed to load).');
  this.stop();b.classList.add('ld');this.code=v;this.st('Contacting server...',1);let opened=false;
  this.joinT=setTimeout(()=>{b.classList.remove('ld');this.st(opened?'Room found but no direct link. Ask the host to keep the room open, or try another network.':'Cannot reach the matchmaking server.');this.stop()},12000);
  const p=this.peer=new Peer({config:{iceServers:ICE}});
  p.on('error',e=>{clearTimeout(this.joinT);b.classList.remove('ld');const m=e.type==='peer-unavailable'?'Room not found.':'Connection problem: '+e.type;this.stop();this.menu();this.st(m)});
  p.on('open',()=>{opened=true;this.st('Finding room...',1);const c=this.hc=p.connect(PFX+v,{reliable:true,serialization:'json'});
   c.on('open',()=>{clearTimeout(this.joinT);this.me='?';c.send({t:'hello',n,s:SV.style})});c.on('data',d=>this.cmsg(d));
   c.on('close',()=>{if(this.hc!==c)return;const was=G.run||scr==='room'||scr==='results';this.stop();this.menu();this.st(was?'The host closed the room or disconnected.':'Connection closed.')});c.on('error',()=>{})})},
 cmsg(d){if(!this.valid(d))return;
  switch(d.t){
  case'welcome':if(typeof d.id==='string'&&/^(p1|v[1-6])$/.test(d.id)){this.me=d.id;this.code=String(d.code||this.code).slice(0,4)}break;
  case'lobby_state':if(!Array.isArray(d.players)||this.me==='?')return;this.players=d.players.slice(0,8).filter(p=>p&&typeof p.id==='string'&&ST[p.style]).map(p=>({id:p.id,name:cleanN(p.name),style:p.style,host:p.host?1:0}));this.fill=!!d.fill;if(!G.run||G.mode!=='client'){G.stop();this.room()}break;
  case'start_match':if(!Array.isArray(d.roster))return;{const r=d.roster.slice(0,2).filter(p=>p&&typeof p.id==='string'&&ST[p.style]).map(p=>({id:p.id,name:cleanN(p.name),style:p.style}));if(r.length<2)return;this.mid=d.mid|0;G.start('client',r);G.me=this.me;this.hc.send({t:'ready',mid:this.mid})}break;
  case'game_snapshot':if(G.mode==='client'&&Array.isArray(d.F))G.onSnap(d);break;
  case'match_end':break;
  case'emote_ev':if(typeof d.e==='number')showEmote(cleanN(d.n),d.e|0);break;
  case'error':{const m=String(d.m||'Error').slice(0,80);this.stop();this.menu();this.st(m)}break;
  case'pong':if(typeof d.n==='number')this.rtt=Math.max(0,Math.round(performance.now()-d.n));break}},
 sendIn(I){if(!this.hc||!this.hc.open)return;this.hc.send({t:'player_input',q:++this.seq,mx:r2(I.mx),my:r2(I.my),a:r2(I.a),g:I.g,sp:I.sp,jab:I.jab,hv:I.hv,dg:I.dg,sg:I.sg})},
 sendEmote(i){if(!this.hc||!this.hc.open)return;const t=Date.now();if(t-(this.le||0)<900)return;this.le=t;this.hc.send({t:'emote',e:i|0})},
 setStyle(s){if(!ST[s])return;SV.style=s;save();if(this.host){const p=this.players.find(x=>x.id==='p0');p.style=s;this.lobbyBc()}else if(this.hc&&this.hc.open){this.hc.send({t:'style_select',s});const p=this.players.find(x=>x.id===this.me);if(p)p.style=s;this.room()}},
room(){const me=this.players.find(p=>p.id===this.me)||{style:SV.style},fi=this.players.filter(p=>p.id[0]==='p'),sp=this.players.filter(p=>p.id[0]==='v'),spec=String(this.me)[0]==='v',can=this.host&&(fi.length>=2||this.fill);
  show('room',`<div class="w s"><small class="mu">ROOM CODE</small><div class="code">${this.code}</div><div class="row" style="justify-content:center"><button class="gh" data-a="copy">Copy code</button></div>
  <div class="card" style="margin:14px 0"><div class="row sp"><b>Fighters</b><small>${fi.length}/2 · ${this.host?'You are host':spec?'You are spectating':'Connected'}</small></div><table>${[0,1].map(i=>{const p=fi[i];return p?`<tr><td>${emb(p.style,18)}</td><td>${p.name}${p.id===this.me?' (you)':''}</td><td>${ST[p.style].n}</td><td>${p.host?'<span class="tag">Host</span>':''}</td></tr>`:`<tr><td></td><td class="mu" colspan="3">Waiting for opponent</td></tr>`}).join('')}</table>
  <div class="row sp" style="margin-top:12px"><b>Spectators</b><small>${sp.length}/6 · emotes only</small></div>${sp.length?`<small>${sp.map(p=>p.name+(p.id===this.me?' (you)':'')).join(' · ')}</small>`:'<small class="mu">Extra players who join watch and send emotes.</small>'}</div>
  ${spec?'':`<div class="row" style="margin-bottom:12px">${STY.map(s=>`<button class="${me.style===s?'gd':'gh'}" data-a="rs" data-s="${s}" title="${ST[s].n}" style="padding:8px 10px">${emb(s,18)}</button>`).join('')}</div>`}
  ${this.host?`<label class="row" style="margin-bottom:12px"><input type="checkbox" id="fl" ${this.fill?'checked':''}> Fill empty slot with AI</label><button class="gd" data-a="startM" style="width:100%" ${can?'':'disabled'}>Start match</button>`:'<p class="mu">Waiting for the host to start...</p>'}
  <p class="msg" id="nst"></p><button class="gh" data-a="leaveRoom" style="width:100%">Leave room</button></div>`);
  const fl=$('#fl');if(fl)fl.onchange=()=>{this.fill=fl.checked;this.lobbyBc()}},
  toRoom(){if(!this.host)return;G.stop();this.inMatch=false;this.promote();this.lobbyBc();this.room()},
 startMatch(re){if(!this.host)return;const hum=this.players.filter(p=>p.id[0]==='p'),ro=hum.map(p=>({id:p.id,name:p.name,style:p.style}));
  if(this.fill){const df=SV.set.df;let k=1;while(ro.length<2){const s=STY[rnd()*6|0];ro.push({id:'ai'+k,name:'CPU '+ST[s].n,style:s,ai:df});k++}}
  if(ro.length<2)return this.st('Need at least two fighters.');
  this.inMatch=true;G.stop();this.mid++;this.lastIn={};this.conns.forEach(c=>c.ready=0);
  this.bcast({t:'start_match',mid:this.mid,roster:ro.map(p=>({id:p.id,name:p.name,style:p.style}))});
  show('wait','<div class="w s"><h2>Starting...</h2><p class="mu">Waiting for all players to be ready.</p></div>');
  const t0=Date.now(),chk=()=>{if(!this.inMatch)return;const all=this.conns.every(c=>c.ready);if(all||Date.now()-t0>3500){G.start('host',ro);G.me='p0'}else this.readyT=setTimeout(chk,100)};chk()}};
addEventListener('beforeunload',()=>{try{if(Net.hc&&Net.hc.open)Net.hc.send({t:'leave'})}catch(e){}});

/* ================= FULLSCREEN + LANDSCAPE ================= */
const de=document.documentElement,fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement,fsOK=()=>!!(de.requestFullscreen||de.webkitRequestFullscreen);
function goFs(){if(fsEl()||!fsOK())return;try{const r=(de.requestFullscreen||de.webkitRequestFullscreen).call(de);const lk=()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};if(r&&r.then)r.then(lk).catch(()=>{});else lk()}catch(e){}}
function toggleFs(){if(fsEl()){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}}else goFs()}
const rotChk=()=>{const r=$('#rot');if(r)r.classList.toggle('on',TOUCH&&innerHeight>innerWidth)};
addEventListener('resize',rotChk);addEventListener('orientationchange',()=>setTimeout(rotChk,150));rotChk();
const autoFs=()=>{if(!fsEl())goFs()};document.addEventListener('pointerdown',autoFs,{once:true});document.addEventListener('keydown',autoFs,{once:true});
document.addEventListener('fullscreenchange',()=>{setTimeout(resize,100);if(!fsEl())document.addEventListener('pointerdown',autoFs,{once:true})});
addEventListener('keydown',e=>{if(e.code==='KeyF'&&!(e.target&&e.target.tagName==='INPUT')&&fsOK())toggleFs()});
act.fs=toggleFs;
const EMO=['👏','🔥','😮','😂','💪','❤️'];
(()=>{const eb=document.createElement('div');eb.id='eb';eb.innerHTML='<small>Spectating</small>'+EMO.map((m,i)=>`<button class="eo" data-e="${i}" aria-label="Emote ${i+1}">${m}</button>`).join('')+'<button class="gh eo" id="eleave">Leave</button>';document.body.appendChild(eb);
 const em=document.createElement('div');em.id='emo';document.body.appendChild(em);
 eb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='eleave')return act.leave();if(b.dataset.e!=null)Net.sendEmote(+b.dataset.e)})})();
function showEmote(n,e){const box=$('#emo');if(!box||!(e>=0&&e<EMO.length))return;const d=document.createElement('div');d.className='emj';d.innerHTML='<span></span><small></small>';d.firstChild.textContent=EMO[e];d.lastChild.textContent=cleanN(n)||'Spectator';box.prepend(d);while(box.children.length>6)box.lastChild.remove();setTimeout(()=>d.remove(),2400)}
function specUI(){const e=$('#eb');if(e)e.classList.toggle('on',!!(G.run&&G.spec&&!G.paused&&scr===''))}
lobby();
