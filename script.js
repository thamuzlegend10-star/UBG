'use strict';
/* ================= CONFIG + DATA ================= */
const KEY='tdba-save-v1',PFX='tdba-room-',ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',REST=.5,ROUND_T=90,WINR=2,RING=280,SNAP_MS=66,IN_MS=33;
const ICE=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun.relay.metered.ca:80'}].concat((typeof window!=='undefined'&&window.TURN_SERVERS)||[]);
const cl=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,rnd=Math.random,r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
const adiff=(a,b)=>{let d=(a-b)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d};
const STY=['basic','slugger','ghost','counter','ippo','hitman'];
const ST={
basic:{n:'Basic',col:'#d9d9d4',hp:100,spd:150,jab:7,hv:16,rng:48,def:.55,stam:100,cost:.85,reg:16,cdS:6,sc:14,su:1,dd:85,desc:'Balanced all-rounder with a reliable jab and cross.',pas:'Fundamentals: actions cost 15% less stamina; recovery stays steady.',sig:'Straight Combination',str:'No bad matchups',wk:'No standout strength'},
slugger:{n:'Slugger',col:'#d4694a',hp:105,spd:122,jab:8,hv:27,rng:46,def:.6,stam:100,cost:1.3,reg:12,cdS:8,sc:28,su:1.2,dd:80,desc:'Heavy hitter. Slow startup, enormous power.',pas:'Heavy Hands: heavy punches hit harder and stagger longer.',sig:'Power Hook',str:'Huge damage and knockback',wk:'Slow, stamina hungry, misses are punished'},
ghost:{n:'Ghost',col:'#8fb6d9',hp:92,spd:182,jab:5.5,hv:12,rng:46,def:.4,stam:80,cost:.9,reg:15,cdS:5,sc:18,su:.9,dd:125,desc:'Evasive fighter with long dodges and fast legs.',pas:'Elusive: a perfect dodge grants a short speed bonus and resets dodge cooldown.',sig:'Phantom Step',str:'Mobility, dodge distance',wk:'Low damage, small stamina pool'},
counter:{n:'Counter',col:'#b78fd9',hp:100,spd:150,jab:7,hv:16,rng:48,def:.75,stam:100,cost:1,reg:14,cdS:7,sc:12,su:1.05,dd:85,desc:'Defensive specialist who wins by timing.',pas:'Read the Opponent: a dodge or block opens a counter window (+50% damage).',sig:'Counter Strike',str:'Best guard, huge counters',wk:'Weak when forced to attack; bad timing is punished'},
ippo:{n:'Ippo',col:'#e0a24b',hp:100,spd:165,jab:6,hv:15,rng:38,def:.5,stam:100,cost:1.2,reg:13,cdS:9,sc:35,su:.9,dd:85,desc:'Close-range pressure fighter built on fast combinations.',pas:'Fighting Spirit: clean hits build a pressure meter (up to +33% damage). Taking damage drains it.',sig:'Dempsey-Style Rush',str:'Pressure, quick combos',wk:'Short range, burns stamina'},
hitman:{n:'Hitman',col:'#7fc1a0',hp:100,spd:148,jab:7,hv:15,rng:64,def:.4,stam:100,cost:1,reg:14,cdS:8,sc:15,su:.95,dd:85,desc:'Long-range precision boxer who controls space.',pas:'Precision: hits near maximum range deal +20% damage.',sig:'Long Guard',str:'Range, spacing',wk:'Weak guard, struggles up close'}};
const DIFF={easy:{rt:.55,err:.5,agg:.35,blk:.25,dg:.15},normal:{rt:.35,err:.3,agg:.55,blk:.45,dg:.3},hard:{rt:.2,err:.15,agg:.75,blk:.65,dg:.5},expert:{rt:.1,err:.05,agg:.9,blk:.8,dg:.7}};
const PREF={basic:50,slugger:56,ghost:70,counter:62,ippo:34,hitman:90};
const Z={mx:0,my:0,a:0,g:0,sp:0,jab:0,hv:0,dg:0,sg:0};

/* ================= SIMULATION (host-authoritative, no DOM) ================= */
class Sim{
constructor(pl,o={}){this.o=o;this.q=0;this.eq=0;this.evl=[];this.hs=0;this.rd=1;this.ph=o.train?'fight':'count';this.tm=3;this.rt=o.train?999:ROUND_T;this.rlog=null;this.fin=false;this.win=null;
 this.F=pl.map((p,i)=>({id:p.id,name:p.name,style:p.style,S:ST[p.style],ai:p.ai||null,dummy:!!p.dummy,in:Object.assign({},Z),sj:0,sh:0,sd:0,ss:0,rw:0,gone:false,hn:1,vx:0,vy:0,seat:i,aiS:{tt:0,tp:0,p:null,sd:1,mx:0,my:0,err:0,gu:0},stats:{dmg:0,hit:0,thr:0,ko:0}}));this.reset(true)}
reset(first){const n=this.F.length;this.F.forEach(f=>{const S=f.S,a=Math.PI+f.seat*TAU/n;f.x=Math.cos(a)*140;f.y=Math.sin(a)*140;f.face=a+Math.PI;f.hp=f.gone?0:S.hp;f.st=first?S.stam:Math.min(S.stam,f.st+S.stam*REST);
 Object.assign(f,{kx:0,ky:0,state:'idle',t:0,atk:null,inv:0,da:9,cdS:0,cdD:0,combo:0,ct:0,stun:0,gt:0,guard:false,boost:0,cw:0,la:9,buf:null,pm:first?0:f.pm*.5,rz:0,dd:.2,dv:[0,0],sigd:false})})}
setStyle(f,s){f.style=s;f.S=ST[s];f.hp=f.S.hp;f.st=f.S.stam;f.cdS=0;f.pm=0}
ev(o){o.e=++this.eq;this.evl.push(o);if(this.evl.length>40)this.evl.shift()}
txt(f,m){this.ev({t:'txt',m,x:r1(f.x),y:r1(f.y),id:f.id})}
step(dt){
 if(this.hs>0){this.hs-=dt;return}
 if(this.ph==='count'){this.tm-=dt;this.F.forEach(f=>this.upd(f,dt));if(this.tm<=0){this.ph='fight';this.ev({t:'bell'})}}
 else if(this.ph==='fight'){if(!this.o.train)this.rt-=dt;this.F.forEach(f=>{if(f.ai&&!f.dummy&&!f.gone)this.think(f,dt);this.upd(f,dt)});this.collide();this.check(dt)}
 else if(this.ph==='rend'){this.tm-=dt;this.F.forEach(f=>this.upd(f,dt));this.collide();if(this.tm<=0)this.next()}}
collide(){const R=RING-22,F=this.F;for(let i=0;i<F.length;i++){const a=F[i];if(a.gone)continue;
 for(let j=i+1;j<F.length;j++){const b=F[j];if(b.gone)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01;if(d<32){const p=(32-d)/2,nx=dx/d,ny=dy/d;a.x-=nx*p;a.y-=ny*p;b.x+=nx*p;b.y+=ny*p}}}
 F.forEach(f=>{if(f.x>R||f.x<-R){f.x=cl(f.x,-R,R);f.kx=0}if(f.y>R||f.y<-R){f.y=cl(f.y,-R,R);f.ky=0}})}
upd(f,dt){
 if(f.gone)return;const S=f.S,i=this.ph==='fight'?f.in:Z;
 f.la+=dt;f.da+=dt;f.inv=Math.max(0,f.inv-dt);f.cdS=Math.max(0,f.cdS-dt);f.cdD=Math.max(0,f.cdD-dt);f.cw=Math.max(0,f.cw-dt);f.boost=Math.max(0,f.boost-dt);f.ct-=dt;if(f.ct<=0)f.combo=0;
 const kd=Math.exp(-8*dt);f.kx*=kd;f.ky*=kd;let vx=0,vy=0;
 const jp=i.jab>f.sj,hp=i.hv>f.sh,dp=i.dg>f.sd,sp=i.sg>f.ss;f.sj=i.jab;f.sh=i.hv;f.sd=i.dg;f.ss=i.sg;if(this.ph!=='fight'){f.sj=f.in.jab;f.sh=f.in.hv;f.sd=f.in.dg;f.ss=f.in.sg}
 if(this.o.inf)f.st=S.stam;
 if(f.state==='stun'){f.t+=dt;f.guard=false;if(f.t>=f.stun)f.state='idle'}
 else if(f.state==='dodge'){f.t+=dt;vx=f.dv[0];vy=f.dv[1];if(f.t>=f.dd){f.state='idle';f.sigd=false}}
 else if(f.state==='atk'){const a=f.atk,w=a.sw[a.i],ad=w.adv&&a.ph<2?w.adv:0;vx=Math.cos(a.aim)*ad+i.mx*S.spd*.25;vy=Math.sin(a.aim)*ad+i.my*S.spd*.25;if((jp||hp)&&a.ph===2)f.buf=jp?'jab':'hv';this.stepAtk(f,a,w,dt,i)}
 if(f.state==='idle'){
  f.guard=!!i.g&&f.st>0;
  if(f.guard){f.gt+=dt;f.st-=(5+f.gt*3)*dt;if(f.st<=0){f.st=0;f.guard=false;f.state='stun';f.stun=.9;f.t=0;this.txt(f,'GUARD BREAK')}}else f.gt=0;
  if(f.state==='idle'){
   let want=sp?'sig':dp?'dodge':hp?'hv':jp?'jab':f.buf;f.buf=null;
   const l=Math.hypot(i.mx,i.my),dx=l>1?i.mx/l:i.mx,dy=l>1?i.my/l:i.my,run=!!i.sp&&f.st>0&&l>.1&&!f.guard;
   const spd=S.spd*(run?1.45:1)*(f.st<=0?.6:1)*(f.boost>0?1.25:1)*(f.guard?.55:1);vx=dx*spd;vy=dy*spd;
   if(run)f.st-=12*dt;else if(!f.guard)f.st+=S.reg*(f.la>.9?1:.35)*dt;f.st=cl(f.st,0,S.stam);
   f.face+=adiff(i.a,f.face)*Math.min(1,14*dt);
   if(want)this.act(f,want,i,dx,dy,l)}}
 if(f.state==='down'||f.state==='stun'&&f.hp<=0){vx=vy=0}
 f.x+=(vx+f.kx)*dt;f.y+=(vy+f.ky)*dt;f.vx=vx;f.vy=vy}
dash(f,dx,dy,l,dist,dur,inv,sig){let ux=dx,uy=dy;if(l<.1){ux=Math.cos(f.face+Math.PI);uy=Math.sin(f.face+Math.PI)}else{const m=Math.hypot(ux,uy);ux/=m;uy/=m}
 f.state='dodge';f.t=0;f.dd=dur;f.inv=inv;f.da=0;f.sigd=sig;f.guard=false;f.dv=[ux*dist/dur,uy*dist/dur];this.ev({t:'wh',x:r1(f.x),y:r1(f.y)})}
act(f,w,i,dx,dy,l){const S=f.S,c=S.cost*(f.style==='basic'?.85/.85:1);
 if(w==='sig'){if(f.cdS>0||f.st<S.sc*.5)return;f.st=Math.max(0,f.st-S.sc);f.cdS=S.cdS;
  if(f.style==='ghost'){this.dash(f,dx,dy,l,170,.24,.34,true);this.txt(f,'PHANTOM STEP');return}
  this.begin(f,this.sigSw(f),i.a);this.txt(f,S.sig.toUpperCase());return}
 if(w==='dodge'){if(f.cdD>0||f.st<8)return;f.st-=14*(f.style==='ghost'?.65:1);this.dash(f,dx,dy,l,S.dd,.2,f.style==='ghost'?.22:.18,false);f.cdD=f.style==='ghost'?.45:.7;return}
 const hv=w==='hv';if(f.st<2)return;f.st=Math.max(0,f.st-(hv?15:6)*c);
 const sw=hv?{k:'hv',su:.3*S.su,ac:.12,rc:.36,dmg:S.hv,kb:f.style==='slugger'?230:150,rng:S.rng*1.12,arc:.8,miss:.25}:{k:'jab',su:.09*S.su,ac:.1,rc:.17,dmg:S.jab,kb:70,rng:S.rng,arc:.85,miss:0};
 this.begin(f,[sw],i.a)}
sigSw(f){const S=f.S,s=f.style;
 if(s==='basic')return[{k:'jab',su:.07,ac:.09,rc:.1,dmg:S.jab*1.1,kb:60,rng:S.rng,arc:.85,miss:0},{k:'hv',su:.1,ac:.1,rc:.3,dmg:S.jab*1.9,kb:120,rng:S.rng*1.05,arc:.85,miss:.1}];
 if(s==='slugger')return[{k:'hook',su:.5,ac:.15,rc:.55,dmg:36,kb:320,rng:S.rng*1.15,arc:1.15,miss:.5}];
 if(s==='counter')return[{k:'stance',su:0,ac:.65,rc:.55,dmg:0,kb:0,rng:0,arc:0,miss:0}];
 if(s==='ippo'){const a=[];for(let n=0;n<5;n++)a.push({k:'rush',su:n?.05:.3,ac:.07,rc:.06,dmg:S.jab*(n===4?2.2:1),kb:n===4?170:40,rng:S.rng*1.05,arc:1,adv:150,miss:.3});return a}
 return[{k:'poke',su:.1,ac:.55,rc:.25,dmg:4,kb:100,rng:100,arc:.3,miss:0}]}
begin(f,sw,aim){f.state='atk';f.guard=false;f.hn=-f.hn;f.atk={sw,i:0,ph:0,t:0,aim,set:new Set(),hit:false,hand:f.hn,rcx:0};f.face=aim;f.la=0}
stepAtk(f,a,w,dt,i){a.t+=dt;f.la=0;
 if(a.ph===0&&a.t>=w.su){a.ph=1;a.t=0;a.set=new Set();if(w.dmg>0){f.stats.thr++;this.ev({t:'ws',x:r1(f.x),y:r1(f.y)})}}
 if(a.ph===1){this.strike(f,a,w);if(f.atk!==a)return;if(a.t>=w.ac){a.ph=2;a.t=0;a.rcx=a.hit?0:(w.miss||0)}}
 else if(a.ph===2&&a.t>=w.rc+a.rcx){if(a.i<a.sw.length-1){a.i++;a.ph=0;a.t=0;a.hit=false;a.hand=-a.hand;a.aim=i.a;f.face=a.aim}else{f.atk=null;f.state='idle'}}}
strike(f,a,w){if(w.dmg<=0)return;
 for(const v of this.F){if(v===f||v.gone||v.hp<=0||a.set.has(v.id))continue;const dx=v.x-f.x,dy=v.y-f.y,d=Math.hypot(dx,dy);
  if(d>w.rng+16||Math.abs(adiff(Math.atan2(dy,dx),a.aim))>w.arc)continue;a.set.add(v.id);this.land(f,v,a,w,d,dx,dy)}}
land(f,v,a,w,d,dx,dy){const V=v.S,back=Math.atan2(-dy,-dx);
 if(v.inv>0){if(v.state==='dodge'&&v.da<.16&&!v.sigd){v.st=Math.min(V.stam,v.st+14);if(v.style==='ghost'){v.boost=2;v.cdD=0}if(v.style==='counter')v.cw=1.2;this.txt(v,'PERFECT DODGE');this.ev({t:'dg',x:r1(v.x),y:r1(v.y)})}return}
 const va=v.atk;if(va&&va.ph===1&&va.sw[va.i].k==='stance'){this.txt(v,'COUNTER STRIKE');v.atk={sw:[{k:'cs',su:.04,ac:.12,rc:.3,dmg:30,kb:260,rng:V.rng*1.4,arc:1.5,miss:0}],i:0,ph:0,t:0,aim:back,set:new Set(),hit:false,hand:1,rcx:0};v.face=back;v.inv=.3;return}
 const front=Math.abs(adiff(back,v.face))<1.15,gd=(v.guard||(va&&va.ph<2&&va.sw[va.i].k==='poke'))&&front;
 let dm=w.dmg*(f.st<=0?.6:1);
 if(f.style==='hitman'&&d>w.rng*.8)dm*=1.2;if(f.style==='ippo')dm*=1+f.pm/300;
 if(f.cw>0&&f.style==='counter'&&w.k!=='cs'){dm*=1.5;f.cw=0;this.txt(f,'COUNTER HIT')}
 if(f.ct>0&&f.combo>1)dm*=Math.max(.45,1-.12*(f.combo-1));
 let kb=w.kb;
 if(gd){dm*=1-V.def*.75;v.st-=dm*1.1+3;kb*=.35;this.ev({t:'blk',x:r1(v.x),y:r1(v.y)});if(v.style==='counter')v.cw=1;
  if(v.st<=0&&v.guard){v.st=0;v.guard=false;v.state='stun';v.stun=1;v.t=0;v.atk=null;this.txt(v,'GUARD BREAK')}}
 else{v.state='stun';v.t=0;v.atk=null;v.guard=false;v.stun=(w.k==='hv'||w.k==='hook'||w.k==='cs')?(f.style==='slugger'?.6:.4):.2;if(w.k==='poke')v.stun=.3}
 v.hp-=dm;v.kx=Math.cos(Math.atan2(dy,dx))*kb;v.ky=Math.sin(Math.atan2(dy,dx))*kb;
 f.stats.dmg+=dm;a.hit=true;if(!gd){f.stats.hit++;f.combo++;f.ct=1.3;if(f.style==='ippo')f.pm=Math.min(100,f.pm+14);v.combo=0}
 v.pm=Math.max(0,v.pm-dm*2.5);this.hs=gd?.02:(w.kb>200?.09:.05);
 this.ev({t:'hit',x:r1(v.x),y:r1(v.y),v:Math.round(dm),b:gd?1:0,hv:kb>140?1:0});
 if(v.hp<=0){v.hp=0;v.state='down';v.atk=null;v.guard=false;f.stats.ko++;this.ev({t:'ko',x:r1(v.x),y:r1(v.y)})}}
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
 return{id:f.id,name:f.name,style:f.style,x:r1(f.x),y:r1(f.y),f:r2(f.face),hp:r1(f.hp),st:r1(f.st),s:f.state,k:w?w.k:'',p:a?a.ph:-1,pp:a?r2(cl(a.t/(dur||.01),0,1)):0,h:a?a.hand:1,rg:w?r1(w.rng):0,g:f.guard?1:0,iv:f.inv>0?1:0,cs:r2(f.cdS),cb:f.combo,pm:r1(f.pm),rw:f.rw,gone:f.gone?1:0,bo:f.boost>0?1:0}}
snap(){return{t:'game_snapshot',q:++this.q,ph:this.ph,tm:r2(this.tm),rt:r1(this.rt),rd:this.rd,F:this.F.map(f=>this.view(f)),ev:this.evl.slice(-14),rl:this.rlog,win:this.win}}
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
 nz(d,v=.2){if(!this.c)return;const c=this.c,b=c.createBuffer(1,c.sampleRate*d,c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);const s=c.createBufferSource(),g=c.createGain();g.gain.value=v*SV.set.mv*SV.set.sv;s.buffer=b;s.connect(g).connect(c.destination);s.start()},
 p(n){switch(n){case'hit':this.nz(.12,.5);this.t(120,.12,'square',.2,50);break;case'hv':this.nz(.2,.7);this.t(80,.25,'sawtooth',.3,30);break;case'blk':this.t(300,.08,'triangle',.3,180);break;case'wh':this.nz(.14,.1);break;case'bell':this.t(880,.9,'sine',.3);this.t(1320,.7,'sine',.15);break;case'ko':this.t(200,.6,'sawtooth',.3,40);break;case'ui':this.t(520,.05,'square',.08);break}}};

/* ================= UI ================= */
const $=s=>document.querySelector(s),UI=$('#ui'),cv=$('#cv'),cx=cv.getContext('2d'),TOUCH=matchMedia('(pointer:coarse)').matches;
const EM={basic:'<circle cx="12" cy="12" r="8"/>',slugger:'<rect x="5" y="5" width="14" height="14"/>',ghost:'<path d="M12 4 20 20H4z"/>',counter:'<path d="M12 3 21 12 12 21 3 12z"/>',ippo:'<path d="M12 3l2.5 6.5L21 10l-5 4.5L17.5 21 12 17.5 6.5 21 8 14.5 3 10l6.5-.5z"/>',hitman:'<circle cx="12" cy="12" r="7"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/>'};
const emb=(s,z=24)=>`<svg class="em" width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round">${EM[s]}</svg>`;
let scr='';
function show(name,html){scr=name;UI.innerHTML=html;UI.classList.add('on');UI.scrollTop=0;$('#tc').classList.remove('on');$('#trn').classList.remove('on')}
function hide(){scr='';UI.classList.remove('on');UI.innerHTML=''}
let tt=0;function toast(m){const e=$('#toast');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2200)}
function ask(msg,yes){const d=$('#dlg');d.innerHTML=`<div class="card"><p>${msg}</p><div class="row"><button class="gd" id="dy">Confirm</button><button class="gh" id="dn">Cancel</button></div></div>`;d.classList.add('on');$('#dy').onclick=()=>{d.classList.remove('on');yes()};$('#dn').onclick=()=>d.classList.remove('on')}
const rate=s=>{const S=ST[s];return[['Power',cl(Math.round(S.hv/5.4),1,5)],['Speed',cl(Math.round(S.spd/36.5),1,5)],['Range',cl(Math.round(S.rng/13),1,5)],['Defense',cl(Math.round(S.def*7),1,5)],['Stamina',cl(Math.round(S.stam/(S.cost*21)),1,5)]]};
const rbars=s=>`<div class="rt">${rate(s).map(r=>`<span>${r[0]}</span><div class="bar"><i style="width:${r[1]*20}%"></i></div>`).join('')}</div>`;
const today=()=>new Date().toDateString();
function lobby(){G.stop();const xp=SV.xp/need(SV.lvl)*100;
 show('lobby',`<div class="w"><div class="grid g2 m" style="align-items:start"><div><small class="mu">2D ONLINE BOXING</small><h1>TOP-DOWN <b>BOXING</b> ARENA</h1>
 <div class="card" style="margin:16px 0"><div class="row sp"><input type="text" id="nm" maxlength="12" value="${SV.name}" style="max-width:170px" aria-label="Username" title="Your username"><span class="tag">Lv ${SV.lvl}</span></div>
 <div class="bar" style="margin:12px 0 4px"><i style="width:${xp}%"></i></div><small>${SV.xp} / ${need(SV.lvl)} XP</small>
 <div class="row sp" style="margin-top:10px"><span>Coins <b style="color:var(--gd)">${SV.coins}</b></span><span>${SV.w}W - ${SV.l}L</span><span>${emb(SV.style,18)} ${ST[SV.style].n}</span></div></div>
 <div class="grid g2"><button class="gd" data-a="play" title="Offline match vs AI">Play</button><button data-a="online" title="Host or join a room">Online play</button><button class="gh" data-a="styles">Style selection</button><button class="gh" data-a="train">Training</button><button class="gh" data-a="stats">Stats</button><button class="gh" data-a="sets">Settings</button></div></div>
 <div><div class="card"><canvas class="pv" id="pv0" width="240" height="240" style="height:200px"></canvas><div class="row sp" style="margin-top:10px"><b>Daily reward</b><button class="gh" data-a="daily" ${SV.daily===today()?'disabled':''}>${SV.daily===today()?'Claimed':'Claim 150 coins'}</button></div></div>
 <div class="card" style="margin-top:12px"><b>Controls</b>${ctrlRef()}</div></div></div></div>`);
 $('#nm').onchange=e=>{SV.name=cleanN(e.target.value)||'Fighter';e.target.value=SV.name;save()}}
const ctrlRef=()=>`<table><tr><td><kbd>W A S D</kbd></td><td>Move</td></tr><tr><td><kbd>Mouse</kbd></td><td>Aim</td></tr><tr><td><kbd>LMB</kbd> / <kbd>RMB</kbd></td><td>Jab / Heavy</td></tr><tr><td><kbd>Space</kbd> <kbd>Shift</kbd></td><td>Dodge / Sprint</td></tr><tr><td><kbd>Q</kbd> <kbd>E</kbd> <kbd>Esc</kbd></td><td>Guard / Signature / Pause</td></tr></table>`;
function styles(back='lobby',pick){const R=pick||(s=>{SV.style=s;save()});window.pickS=R;
 show('styles',`<div class="w"><div class="row sp"><h2>Fighting styles</h2><button class="gh" data-a="${back}">Back</button></div><div class="grid g3">${STY.map(s=>{const S=ST[s],eq=SV.style===s;return`<div class="card ${eq?'eq':''}"><canvas class="pv" data-pv="${s}" width="240" height="240"></canvas><div class="row" style="margin:10px 0 2px">${emb(s)}<h2 style="margin:0">${S.n}</h2></div><small>${S.desc}</small>${rbars(s)}
 <small><b style="color:var(--tx)">Passive</b> ${S.pas}<br><b style="color:var(--tx)">Signature</b> ${S.sig}<br>+ ${S.str}<br>- ${S.wk}</small>
 <details><summary>Exact stats</summary>HP <b>${S.hp}</b> · Speed <b>${S.spd}</b> · Jab <b>${S.jab}</b> · Heavy <b>${S.hv}</b> · Range <b>${S.rng}</b><br>Guard reduction <b>${Math.round(S.def*75)}%</b> · Stamina <b>${S.stam}</b> · Cost x<b>${S.cost}</b> · Regen <b>${S.reg}/s</b><br>Signature cost <b>${S.sc}</b> · Cooldown <b>${S.cdS}s</b></details>
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
const FX={sp:[],tx:[],nf:[],sh:0,ring:[]};let VW={s:1,ox:0,oy:0,W:0,H:0},TICK=0;
function resize(){const d=Math.min(devicePixelRatio||1,2);cv.width=innerWidth*d;cv.height=innerHeight*d;VW.W=innerWidth;VW.H=innerHeight;cx.setTransform(d,0,0,d,0,0)}addEventListener('resize',resize);resize();
function fxEv(e){const lite=!SV.set.fx;switch(e.t){
 case'hit':if(!lite)for(let i=0;i<(e.hv?12:7);i++){const a=rnd()*TAU,v=60+rnd()*160;FX.sp.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.3,c:e.b?'#aaa':'#ffd36a'})}
  FX.tx.push({x:e.x,y:e.y-14,v:e.v,l:.8,c:e.b?'#9aa':'#fff'});if(SV.set.shk)FX.sh=Math.max(FX.sh,e.hv?9:3);AU.p(e.b?'blk':e.hv?'hv':'hit');break;
 case'blk':AU.p('blk');break;case'dg':FX.ring.push({x:e.x,y:e.y,l:.4});AU.p('wh');break;case'wh':AU.p('wh');break;
 case'txt':FX.nf.push({m:e.m,l:1.1});if(FX.nf.length>3)FX.nf.shift();break;case'bell':AU.p('bell');break;case'rend':AU.p('bell');break;case'ko':AU.p('ko');if(SV.set.shk)FX.sh=14;break}}
function drawRing(c){const R=RING;c.fillStyle='#121214';c.fillRect(-R-34,-R-34,2*R+68,2*R+68);
 c.fillStyle='#24242a';c.fillRect(-R,-R,2*R,2*R);c.strokeStyle='#ffffff08';c.lineWidth=1;for(let i=-R;i<=R;i+=14){c.beginPath();c.moveTo(i,-R);c.lineTo(i,R);c.moveTo(-R,i);c.lineTo(R,i);c.stroke()}
 c.strokeStyle='#c9a24b66';c.lineWidth=3;c.beginPath();c.arc(0,0,86,0,TAU);c.stroke();c.lineWidth=1;c.beginPath();c.arc(0,0,72,0,TAU);c.stroke();c.fillStyle='#c9a24b55';c.font='700 34px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText('TDBA',0,2);
 ['#e8e6df','#b64a3c','#e8e6df'].forEach((col,i)=>{c.strokeStyle=col;c.globalAlpha=.8;c.lineWidth=3;const o=R+4+i*7;c.strokeRect(-o,-o,2*o,2*o)});c.globalAlpha=1;
 [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(p=>{c.fillStyle='#1b1b1f';c.strokeStyle='#c9a24b';c.lineWidth=3;c.beginPath();c.arc(p[0]*(R+18),p[1]*(R+18),13,0,TAU);c.fill();c.stroke()})}
function drawF(c,f,t,mv){const S=ST[f.style],down=f.s==='down',L=mv||0,wp=t*(8+L*.03);
 c.save();c.translate(f.x,f.y);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.ellipse(4,6,19,14,0,0,TAU);c.fill();
 if(f.s==='dodge'||f.iv){c.globalAlpha=.5}
 let sx=0,sy=0;if(f.s==='stun'){sy=Math.sin(t*60)*2}
 c.translate(sx,sy);c.rotate(f.f);
 if(f.s==='stun'||down)c.rotate(down?.0:Math.sin(t*40)*.06);
 if(f.s==='dodge'){c.fillStyle=S.col+'33';c.beginPath();c.ellipse(-16,0,12,16,0,0,TAU);c.fill();c.beginPath();c.ellipse(-32,0,10,14,0,0,TAU);c.fill()}
 const br=1+Math.sin(t*3+f.x)*.03,ex=f.st<=0?3:0;
 c.fillStyle='#111';[-1,1].forEach(s=>{c.beginPath();c.ellipse(-3+Math.sin(wp)*s*(L>10?8:0),s*8,7,4,0,0,TAU);c.fill()});
 if(f.s==='stance'||f.k==='stance'){c.strokeStyle=S.col;c.globalAlpha=.7;c.lineWidth=2;c.beginPath();c.arc(0,0,24+Math.sin(t*14)*2,0,TAU);c.stroke();c.globalAlpha=1}
 c.fillStyle='#303036';c.strokeStyle=S.col;c.lineWidth=2;c.beginPath();c.ellipse(-1-ex,0,9*br,16,0,0,TAU);c.fill();c.stroke();
 // arms+gloves
 const rest=(s)=>f.g?[17,s*5]:[15+Math.sin(t*3+s)*.8,s*10];let gp=[rest(-1),rest(1)],trail=null;
 if(f.p>=0){const hs=f.h,i=hs>0?1:0,e=f.p===0?-.25*f.pp:f.p===1?Math.min(1,-.25+1.5*f.pp):1-f.pp,reach=Math.max(20,f.rg*.9),hook=f.k==='hv'||f.k==='hook'||f.k==='cs';
  if(f.k==='stance')gp=[[8,-14],[8,14]];else{const sw=hook?-hs*Math.sin(cl(f.p===1?f.pp:f.p===2?1:0,0,1)*Math.PI)*20:0;gp[i]=[14+e*reach,hs*9+sw];
  if(f.k==='poke'){gp[1]=[14+Math.min(1,e+.2)*reach,9];gp[0]=[12,-9]}
  if(f.p===1)trail={a:gp[i],al:1-f.pp}}}
 gp.forEach((g,k)=>{const sh=k?12:-12;c.strokeStyle='#c9a98a';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(0,sh);c.lineTo(g[0]-4,g[1]);c.stroke()});
 if(trail){c.strokeStyle='rgba(255,255,255,'+(trail.al*.55)+')';c.lineWidth=9;c.beginPath();c.moveTo(10,trail.a[1]*.4);c.lineTo(trail.a[0],trail.a[1]);c.stroke()}
 gp.forEach(g=>{c.fillStyle=S.col;c.strokeStyle='#111';c.lineWidth=2;c.beginPath();c.arc(g[0],g[1],f.g?7.5:6.5,0,TAU);c.fill();c.stroke()});
 c.fillStyle='#d9b08c';c.strokeStyle='#111';c.beginPath();c.arc(3-ex,0,7.5,0,TAU);c.fill();c.stroke();c.fillStyle='#2a1c14';c.beginPath();c.arc(1-ex,0,7.5,Math.PI*.55,Math.PI*1.45);c.fill();
 c.restore()
}
function ctext(t,x,y,sz,col,al='center'){cx.font=`700 ${sz}px Georgia,serif`;cx.textAlign=al;cx.textBaseline='middle';cx.fillStyle=col;cx.fillText(t,x,y)}
function drawHUD(S,me){const W=VW.W,u=Math.min(1,W/820),n=S.F.length,pw=W/n;
 S.F.forEach((f,i)=>{const x=i*pw+8,w=pw-16,mh=ST[f.style].hp,ms=ST[f.style].stam;cx.globalAlpha=f.gone?.35:1;
  cx.font=`700 ${12*u+2}px system-ui,sans-serif`;cx.textBaseline='middle';cx.textAlign='left';cx.fillStyle=f.id===me?'#c9a24b':'#ecebe6';cx.fillText((f.name+' ').toUpperCase().slice(0,14),x,12+4*u);cx.fillStyle='#8d8c86';cx.textAlign='right';cx.fillText(ST[f.style].n.toUpperCase(),x+w,12+4*u);
  cx.fillStyle='#1e1e23';cx.fillRect(x,28+4*u,w,12*u+2);cx.fillStyle=f.hp/mh>.3?'#c9a24b':'#b64a3c';cx.fillRect(x,28+4*u,w*cl(f.hp/mh,0,1),12*u+2);
  cx.fillStyle='#1e1e23';cx.fillRect(x,46+8*u,w,6);cx.fillStyle=f.st>0?'#e8e6df':'#b64a3c';cx.fillRect(x,46+8*u,w*cl(f.st/ms,0,1),6);
  for(let r=0;r<WINR;r++){cx.fillStyle=r<f.rw?'#c9a24b':'#2e2e35';cx.fillRect(x+r*14,62+8*u,10,5)}cx.globalAlpha=1});
 const y2=84+8*u,m=S.F.find(f=>f.id===me);
 ctext(S.ph==='fight'||S.ph==='rend'?(S.rt>900?'TRAINING':Math.ceil(Math.max(0,S.rt))+''):' ',W/2,y2,22*u+6,'#ecebe6');ctext('ROUND '+S.rd,W/2,y2+16,10+2*u,'#8d8c86');
 if(m){const cd=ST[m.style].cdS,rdy=m.cs<=0;cx.font='600 11px system-ui';cx.textAlign='left';cx.fillStyle=rdy?'#c9a24b':'#8d8c86';cx.fillText(ST[m.style].sig.toUpperCase()+(rdy?' READY':''),10,y2-6);cx.fillStyle='#1e1e23';cx.fillRect(10,y2+2,110,5);cx.fillStyle='#c9a24b';cx.fillRect(10,y2+2,110*(1-cl(m.cs/cd,0,1)),5);
  if(m.style==='ippo'){cx.fillStyle='#8d8c86';cx.fillText('SPIRIT '+Math.round(m.pm),10,y2+18)}
  if(m.cb>1)ctext('x'+m.cb+' COMBO',W-70,y2,18,'#c9a24b')}}
function render(S,dt,me){const W=VW.W,H=VW.H;cx.fillStyle='#0d0d0f';cx.fillRect(0,0,W,H);
 const top=118,sc=Math.min(W/(2*RING+120),(H-top-8)/(2*RING+120));VW.s=sc;VW.ox=W/2;VW.oy=top+(H-top)/2;
 FX.sh*=Math.exp(-9*dt);const shx=(rnd()-.5)*FX.sh,shy=(rnd()-.5)*FX.sh;
 cx.save();cx.translate(VW.ox+shx,VW.oy+shy);cx.scale(sc,sc);drawRing(cx);
 FX.ring.forEach(r=>{r.l-=dt;cx.strokeStyle='rgba(143,182,217,'+Math.max(0,r.l*2)+')';cx.lineWidth=3;cx.beginPath();cx.arc(r.x,r.y,(.4-r.l)*140,0,TAU);cx.stroke()});FX.ring=FX.ring.filter(r=>r.l>0);
 S.F.slice().sort((a,b)=>a.y-b.y).forEach(f=>{if(f.gone)return;const pv=G.pv[f.id]||{mv:0};if(f.s==='down'){cx.globalAlpha=.7}drawF(cx,f,TICK,pv.mv);cx.globalAlpha=1;
  cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(f.x-18,f.y+24,36,4);cx.fillStyle='#c9a24b';cx.fillRect(f.x-18,f.y+24,36*cl(f.hp/ST[f.style].hp,0,1),4)});
 FX.sp.forEach(p=>{p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;cx.fillStyle=p.c;cx.globalAlpha=Math.max(0,p.l*3);cx.fillRect(p.x-1.5,p.y-1.5,3,3)});cx.globalAlpha=1;FX.sp=FX.sp.filter(p=>p.l>0);
 FX.tx.forEach(p=>{p.l-=dt;p.y-=30*dt;cx.globalAlpha=Math.min(1,p.l*2.5);ctext(p.v+'',p.x,p.y,18,p.c)});cx.globalAlpha=1;FX.tx=FX.tx.filter(p=>p.l>0);
 cx.restore();drawHUD(S,me);
 FX.nf.forEach((n,i)=>{n.l-=dt;cx.globalAlpha=Math.min(1,n.l*2);ctext(n.m,VW.W/2,VW.oy-RING*sc*.55+i*26,18,'#c9a24b')});cx.globalAlpha=1;FX.nf=FX.nf.filter(n=>n.l>0);
 if(S.ph==='count')ctext(S.tm>.4?Math.ceil(S.tm)+'':'FIGHT',W/2,VW.oy,72,'#ecebe6');
 if(S.ph==='rend'&&S.rl){ctext(S.rl.w?S.rl.n.toUpperCase()+' WINS THE ROUND':'DRAW',W/2,VW.oy-20,34,'#c9a24b');ctext(S.rl.why,W/2,VW.oy+18,16,'#8d8c86')}}
/* style previews on menus */
function prevLoop(t){requestAnimationFrame(prevLoop);if(!UI.classList.contains('on'))return;const ts=t/1000;
 UI.querySelectorAll('canvas.pv').forEach(c=>{const s=c.dataset.pv||SV.style,g=c.getContext('2d'),w=c.width,h=c.height;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,w,h);g.setTransform(h/120,0,0,h/120,w/2,h/2);
  const k=Math.floor(ts/2.2)%3,pp=(ts%2.2)/2.2,atk=pp<.5&&k>0;drawF(g,{x:0,y:0,f:-Math.PI/2,style:s,s:'idle',st:50,hp:1,k:atk?(k===1?'jab':'hv'):'',p:atk?(pp<.12?0:pp<.3?1:2):-1,pp:atk?(pp<.12?pp/.12:pp<.3?(pp-.12)/.18:(pp-.3)/.2):0,h:1,rg:ST[s].rng,g:0,iv:0},ts,0)})}
requestAnimationFrame(prevLoop);

/* ================= GAME CONTROLLER ================= */
const K={},IN=Object.assign({},Z),mouse={x:0,y:0,on:false},joy={on:false,x:0,y:0,id:-1},TB={};
const G={mode:null,sim:null,S:null,run:false,paused:false,me:'p0',last:0,acc:0,pv:{},lastE:0,snapT:0,inT:0,inQ:0,ended:false,roster:null,rewarded:false,hid:0,disp:{},
 pause(p){if(!this.run)return;this.paused=p;if(p){this.pauseUI()}else hide();this.touchUI();this.release();if(!p&&this.mode==='train')this.trainUI()},
 release(){for(const k in K)K[k]=0;joy.on=false;joy.x=joy.y=0;IN.mx=IN.my=0;IN.g=0;IN.sp=0;$('#knob').style.transform='';document.querySelectorAll('.tb.on').forEach(e=>e.classList.remove('on'))},
 touchUI(){$('#tc').classList.toggle('on',TOUCH&&this.run&&!this.paused&&scr==='')},
 pauseUI(){const on=this.mode==='ai'||this.mode==='train';show('pause',`<div class="w s"><h2>Paused</h2><p class="mu">${on?'Combat and timers are frozen.':'Online match continues while this menu is open.'}</p><div class="grid"><button class="gd" data-a="resume">Resume</button><button class="gh" data-a="hsets">Settings and controls</button><button class="gh" data-a="leave">Return to lobby</button></div></div>`)},
 start(mode,roster){this.stop();AU.init();this.mode=mode;this.ended=false;this.rewarded=false;this.paused=false;this.lastE=0;this.pv={};this.disp={};
  const df=SV.set.df;let pl;
  if(mode==='ai'){const os=STY[rnd()*STY.length|0];this.me='p0';pl=[{id:'p0',name:SV.name,style:SV.style},{id:'ai1',name:'CPU '+ST[os].n,style:os,ai:df}]}
  else if(mode==='train'){this.me='p0';pl=[{id:'p0',name:SV.name,style:SV.style},{id:'d1',name:'Dummy',style:'basic',dummy:true}]}
  else{pl=roster;this.me=Net.me}
  this.roster=pl;
  if(mode!=='client'){this.sim=new Sim(pl,{train:mode==='train'})}else{this.sim=null;this.S=null}
  IN.jab=IN.hv=IN.dg=IN.sg=0;this.run=true;hide();this.touchUI();this.last=performance.now();this.acc=0;this.snapT=0;this.inT=0;this.inQ=0;this.release();if(mode==='train')this.trainUI();
  cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(t=>this.frame(t));clearInterval(this.hid);this.hid=setInterval(()=>{if(document.hidden&&this.run)this.tick(.05)},50)},
 stop(){this.run=false;cancelAnimationFrame(this.raf);clearInterval(this.hid);this.sim=null;this.S=null;this.release();$('#trn').classList.remove('on');$('#tc').classList.remove('on');cx.clearRect(0,0,VW.W,VW.H)},
 trainUI(){const f=this.sim.F[0],d=this.sim.F[1],e=$('#trn');e.classList.add('on');
  e.innerHTML=`<button class="gh" id="t1">Spar: ${d.dummy?'off':'on'}</button><button class="gh" id="t2">Inf stamina: ${this.sim.o.inf?'on':'off'}</button><button class="gh" id="t3">Reset</button><button class="gh" id="t4">Style: ${ST[f.style].n}</button><button class="gd" id="t5">Lobby</button>`;
  $('#t1').onclick=()=>{d.dummy=!d.dummy;d.ai=d.dummy?null:SV.set.df;d.in=Object.assign({},Z);d.sj=d.sh=d.sd=d.ss=0;this.trainUI()};
  $('#t2').onclick=()=>{this.sim.o.inf=!this.sim.o.inf;this.trainUI()};
  $('#t3').onclick=()=>{this.sim.reset(true);this.sim.F.forEach(x=>x.in=Object.assign({},Z));this.sim.F.forEach(x=>x.sj=x.sh=x.sd=x.ss=0)};
  $('#t4').onclick=()=>{const u=SV.unl,s=u[(u.indexOf(f.style)+1)%u.length];this.sim.setStyle(f,s);this.trainUI()};
  $('#t5').onclick=()=>lobby()},
 rematch(){if(this.mode==='client')return;if(this.mode==='host')Net.startMatch(true);else this.start('ai')},
 localIn(){if(this.paused||scr!==''||!this.run)return Z;
  let mx=(K.KeyD?1:0)-(K.KeyA?1:0),my=(K.KeyS?1:0)-(K.KeyW?1:0);const l=Math.hypot(mx,my);if(l>1){mx/=l;my/=l}if(joy.on){mx=joy.x;my=joy.y}
  const S=this.mode==='client'?this.S:this.sim&&this.sim.snap();const m=S&&S.F.find(f=>f.id===this.me);let a=IN.a;
  if(m){if(TOUCH||!mouse.on){let bd=1e9,t=null;S.F.forEach(o=>{if(o.id!==m.id&&!o.gone&&o.hp>0){const d=Math.hypot(o.x-m.x,o.y-m.y);if(d<bd){bd=d;t=o}}});if(t)a=Math.atan2(t.y-m.y,t.x-m.x)}
   else a=Math.atan2((mouse.y-VW.oy)/VW.s-m.y,(mouse.x-VW.ox)/VW.s-m.x)}
  IN.mx=mx;IN.my=my;IN.a=a;IN.g=K.KeyQ||TB.g?1:0;IN.sp=K.ShiftLeft||K.ShiftRight?1:0;return IN},
 frame(now){if(!this.run)return;this.raf=requestAnimationFrame(t=>this.frame(t));const dt=Math.min(.05,(now-this.last)/1000);this.last=now;this.tick(dt)},
 tick(dt){TICK+=dt;let S;const I=this.localIn();
  if(this.mode==='client'){this.inT+=dt*1000;if(this.inT>=IN_MS){this.inT=0;Net.sendIn(I)}S=this.S;if(!S)return render({F:[],ph:'count',tm:3,rd:1,rt:90},dt,this.me),void 0}
  else{const sim=this.sim,m=sim.F.find(f=>f.id===this.me);
   if(m&&!(m.ai))Object.assign(m.in,I);
   if(!this.paused||this.mode==='host'){this.acc+=dt;let n=0;while(this.acc>=1/60&&n++<6){sim.step(1/60);this.acc-=1/60}if(n>=6)this.acc=0}
   S=sim.snap();
   if(this.mode==='host'){this.snapT+=dt*1000;if(this.snapT>=SNAP_MS){this.snapT=0;Net.bcast(S)}}
   if(S.ph==='mend'&&!this.ended){this.ended=true;this.end(sim.res())}}
  S.ev.forEach(e=>{if(e.e>this.lastE){this.lastE=e.e;fxEv(e)}});
  if(this.mode==='client')S=this.smooth(S,dt);
  S.F.forEach(f=>{const p=this.pv[f.id]||(this.pv[f.id]={x:f.x,y:f.y,mv:0});p.mv+=(Math.hypot(f.x-p.x,f.y-p.y)/Math.max(dt,.001)-p.mv)*Math.min(1,10*dt);p.x=f.x;p.y=f.y});
  render(S,dt,this.me)},
 smooth(S,dt){const k=1-Math.exp(-20*dt);return Object.assign({},S,{F:S.F.map(f=>{const d=this.disp[f.id]||(this.disp[f.id]={x:f.x,y:f.y,f:f.f});if(Math.hypot(f.x-d.x,f.y-d.y)>120){d.x=f.x;d.y=f.y}d.x+=(f.x-d.x)*k;d.y+=(f.y-d.y)*k;d.f+=adiff(f.f,d.f)*k;return Object.assign({},f,{x:d.x,y:d.y,f:d.f})})})},
 onSnap(S){if(this.mode!=='client')return;if(this.S&&S.q<=this.S.q)return;this.S=S},
 end(res){this.release();this.touchUI();const me=res.F.find(f=>f.id===this.me),won=res.win===this.me,on=this.mode==='host'||this.mode==='client';let gain='';
  if(this.mode==='ai'&&me&&!this.rewarded){this.rewarded=true;const xp=40+(won?80:0)+Math.round(me.dmg*.6),co=won?120:35;SV.m++;won?SV.w++:SV.l++;SV.ko+=me.ko;SV.dmg+=me.dmg;SV.thr+=me.thr;SV.hit+=me.hit;SV.xp+=xp;SV.coins+=co;let lv=0;while(SV.xp>=need(SV.lvl)){SV.xp-=need(SV.lvl);SV.lvl++;lv++}save();gain=`<p><b style="color:var(--gd)">+${xp} XP · +${co} coins</b>${lv?` · LEVEL UP: ${SV.lvl}`:''}</p>`}
  else if(on)gain='<p class="mu">Online matches do not change your local record or rewards.</p>';
  const w=res.F.find(f=>f.id===res.win);
  setTimeout(()=>{if(!this.run)return;this.run=false;$('#tc').classList.remove('on');show('results',`<div class="w s"><small class="mu">MATCH OVER</small><h1>${won?'VICTORY':'<b>'+(w?w.name.toUpperCase():'')+'</b> WINS'}</h1><div class="card"><table><tr><th>Fighter</th><th>Rds</th><th>Dmg</th><th>Acc</th><th>KO</th></tr>${res.F.map(f=>`<tr><td>${f.name}</td><td>${f.rw}</td><td>${f.dmg}</td><td>${f.thr?Math.round(f.hit/f.thr*100):0}%</td><td>${f.ko}</td></tr>`).join('')}</table></div>${gain}
  <div class="grid" style="margin-top:12px">${this.mode==='client'?'<p class="mu">Waiting for the host to start a rematch.</p><button class="gh" data-a="leaveRoom">Return to lobby</button>':`<button class="gd" data-a="rematch">Rematch</button>${this.mode==='host'?'<button class="gh" data-a="toRoom">Back to room</button>':''}<button class="gh" data-a="${this.mode==='host'?'leaveRoom':'lobby'}">Return to lobby</button>`}</div></div>`)},1400)}};
function btnDown(k){if(!G.run||G.paused||scr!=='')return;if(k==='g'){TB.g=1;return}if(k==='ps'){G.pause(true);return}IN[k]++}
/* input listeners */
addEventListener('keydown',e=>{AU.init();if(e.code==='Escape'){if(G.run&&!G.paused&&scr==='')G.pause(true);else if(G.run&&G.paused&&scr==='pause')G.pause(false);return}
 if(!G.run||G.paused||scr!=='')return;if(['Space','ShiftLeft'].includes(e.code)||e.code.startsWith('Arrow'))e.preventDefault();if(e.repeat)return;K[e.code]=1;if(e.code==='Space')IN.dg++;if(e.code==='KeyE')IN.sg++});
addEventListener('keyup',e=>{K[e.code]=0});addEventListener('blur',()=>G.release());document.addEventListener('visibilitychange',()=>{if(document.hidden)G.release()});
addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true}});
cv.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.on=true;if(!G.run||G.paused||scr!=='')return;if(e.button===0)IN.jab++;else if(e.button===2)IN.hv++});
document.querySelectorAll('.tb').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');btnDown(k)});const up=()=>{b.classList.remove('on');if(k==='g')TB.g=0};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
const jz=$('#joy');jz.addEventListener('pointerdown',e=>{e.preventDefault();joy.on=true;joy.id=e.pointerId;jz.setPointerCapture(e.pointerId);jm(e)});jz.addEventListener('pointermove',e=>{if(joy.on&&e.pointerId===joy.id)jm(e)});
const ju=e=>{if(e.pointerId===joy.id){joy.on=false;joy.x=joy.y=0;$('#knob').style.transform=''}};jz.addEventListener('pointerup',ju);jz.addEventListener('pointercancel',ju);
function jm(e){const r=jz.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),l=Math.hypot(dx,dy),m=Math.min(l,50),nx=l?dx/l:0,ny=l?dy/l:0;joy.x=l>8?nx*m/50:0;joy.y=l>8?ny*m/50:0;$('#knob').style.transform=`translate(${nx*m}px,${ny*m}px)`}

/* ================= NETWORKING (PeerJS, host-authoritative; pattern adapted from fps-main) ================= */
const MSG=['hello','welcome','lobby_state','style_select','start_match','ready','player_input','game_snapshot','match_end','leave','ping','pong','error'];
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
  c.on('open',()=>{if(this.inMatch){c.send({t:'error',m:'Match already started.'});setTimeout(()=>c.close(),300)}else if(this.players.length>=4){c.send({t:'error',m:'Room is full.'});setTimeout(()=>c.close(),300)}});
  c.on('data',d=>this.hmsg(c,d));c.on('close',()=>{clearTimeout(t);this.drop(c)});c.on('error',()=>this.drop(c))},
 valid(d){return d&&typeof d==='object'&&MSG.includes(d.t)},
 hmsg(c,d){if(!this.valid(d))return;
  switch(d.t){
  case'hello':if(c.pid||this.inMatch||this.players.length>=4)return;{const id=['p1','p2','p3'].find(i=>!this.players.some(p=>p.id===i));if(!id)return;let n=cleanN(d.n)||'Player',k=2;while(this.players.some(p=>p.name.toLowerCase()===n.toLowerCase()))n=n.slice(0,10)+k++;
   c.pid=id;this.conns.push(c);this.players.push({id,name:n,style:ST[d.s]?d.s:'basic'});c.send({t:'welcome',id,code:this.code});this.lobbyBc()}break;
  case'style_select':if(c.pid&&!this.inMatch&&ST[d.s]){const p=this.players.find(x=>x.id===c.pid);if(p){p.style=d.s;this.lobbyBc()}}break;
  case'ready':c.ready=1;break;
  case'player_input':{if(!c.pid||!G.sim||G.mode!=='host')return;const q=d.q|0;if(q<=(this.lastIn[c.pid]||0))return;this.lastIn[c.pid]=q;const f=G.sim.F.find(x=>x.id===c.pid);if(!f||f.ai)return;
   const i=f.in;i.mx=this.num(d.mx,-1,1);i.my=this.num(d.my,-1,1);i.a=this.num(d.a,-7,7);i.g=d.g?1:0;i.sp=d.sp?1:0;
   ['jab','hv','dg','sg'].forEach(k=>{const v=d[k]|0;if(v>=0&&v<1e9&&v>=i[k])i[k]=Math.min(v,i[k]+3)})}break;
  case'leave':this.drop(c);try{c.close()}catch(e){}break;
  case'ping':c.send({t:'pong',n:d.n});break}},
 drop(c){if(!this.conns.includes(c))return;this.conns=this.conns.filter(x=>x!==c);const p=this.players.find(x=>x.id===c.pid);this.players=this.players.filter(x=>x.id!==c.pid);
  if(this.inMatch&&G.sim){const f=G.sim.F.find(x=>x.id===c.pid);if(f){f.gone=true;f.hp=0;f.state='idle';G.sim.txt(f,f.name+' LEFT');if(G.sim.F.filter(x=>!x.gone).length<2&&G.sim.ph==='fight'){G.sim.endRound(G.sim.F.find(x=>!x.gone)||null,'OPPONENT LEFT');G.sim.fin=true}}}
  if(p)toast(p.name+' left');if(!this.inMatch)this.lobbyBc()},
 lobbyBc(){const m={t:'lobby_state',code:this.code,players:this.players,fill:this.fill};this.conns.forEach(c=>c.open&&c.send(m));if(!this.inMatch&&G.mode!=='host'&&G.mode!=='client'||scr==='room'||scr==='results')this.room()},
 bcast(m){this.conns.forEach(c=>c.open&&c.pid&&c.send(m))},
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
  case'welcome':if(typeof d.id==='string'&&/^p[1-3]$/.test(d.id)){this.me=d.id;this.code=String(d.code||this.code).slice(0,4)}break;
  case'lobby_state':if(!Array.isArray(d.players)||this.me==='?')return;this.players=d.players.slice(0,4).filter(p=>p&&typeof p.id==='string'&&ST[p.style]).map(p=>({id:p.id,name:cleanN(p.name),style:p.style,host:p.host?1:0}));this.fill=!!d.fill;if(!G.run||G.mode!=='client'){G.stop();this.room()}break;
  case'start_match':if(!Array.isArray(d.roster))return;{const r=d.roster.slice(0,4).filter(p=>p&&typeof p.id==='string'&&ST[p.style]).map(p=>({id:p.id,name:cleanN(p.name),style:p.style}));if(r.length<2)return;this.mid=d.mid|0;G.start('client',r);G.me=this.me;this.hc.send({t:'ready',mid:this.mid})}break;
  case'game_snapshot':if(G.mode==='client'&&Array.isArray(d.F))G.onSnap(d);break;
  case'match_end':break;
  case'error':{const m=String(d.m||'Error').slice(0,80);this.stop();this.menu();this.st(m)}break;
  case'pong':break}},
 sendIn(I){if(!this.hc||!this.hc.open)return;this.hc.send({t:'player_input',q:++this.seq,mx:r2(I.mx),my:r2(I.my),a:r2(I.a),g:I.g,sp:I.sp,jab:I.jab,hv:I.hv,dg:I.dg,sg:I.sg})},
 setStyle(s){if(!ST[s])return;SV.style=s;save();if(this.host){const p=this.players.find(x=>x.id==='p0');p.style=s;this.lobbyBc()}else if(this.hc&&this.hc.open){this.hc.send({t:'style_select',s});const p=this.players.find(x=>x.id===this.me);if(p)p.style=s;this.room()}},
 room(){const me=this.players.find(p=>p.id===this.me)||{style:SV.style},n=this.players.length,can=this.host&&(n>=2||this.fill);
  show('room',`<div class="w s"><small class="mu">ROOM CODE</small><div class="code">${this.code}</div><div class="row" style="justify-content:center"><button class="gh" data-a="copy">Copy code</button></div>
  <div class="card" style="margin:14px 0"><div class="row sp"><b>Players</b><small>${n}/4 · ${this.host?'You are host':'Connected'}</small></div><table>${[0,1,2,3].map(i=>{const p=this.players[i];return p?`<tr><td>${emb(p.style,18)}</td><td>${p.name}${p.id===this.me?' (you)':''}</td><td>${ST[p.style].n}</td><td>${p.host?'<span class="tag">Host</span>':''}</td></tr>`:`<tr><td></td><td class="mu" colspan="3">Open slot</td></tr>`}).join('')}</table></div>
  <div class="row" style="margin-bottom:12px">${STY.map(s=>`<button class="${me.style===s?'gd':'gh'}" data-a="rs" data-s="${s}" title="${ST[s].n}" style="padding:8px 10px">${emb(s,18)}</button>`).join('')}</div>
  ${this.host?`<label class="row" style="margin-bottom:12px"><input type="checkbox" id="fl" ${this.fill?'checked':''}> Fill empty slots with AI</label><button class="gd" data-a="startM" style="width:100%" ${can?'':'disabled'}>Start match</button>`:'<p class="mu">Waiting for the host to start...</p>'}
  <p class="msg" id="nst"></p><button class="gh" data-a="leaveRoom" style="width:100%">Leave room</button></div>`);
  const fl=$('#fl');if(fl)fl.onchange=()=>{this.fill=fl.checked;this.lobbyBc()}},
 toRoom(){if(!this.host)return;G.stop();this.inMatch=false;this.lobbyBc();this.room()},
 startMatch(re){if(!this.host)return;const hum=this.players.slice(),ro=hum.map(p=>({id:p.id,name:p.name,style:p.style}));
  if(this.fill){const df=SV.set.df;let k=1;while(ro.length<4){const s=STY[rnd()*6|0];ro.push({id:'ai'+k,name:'CPU '+ST[s].n,style:s,ai:df});k++}}
  if(ro.length<2)return this.st('Need at least two fighters.');
  this.inMatch=true;G.stop();this.mid++;this.lastIn={};this.conns.forEach(c=>c.ready=0);
  this.bcast({t:'start_match',mid:this.mid,roster:ro.map(p=>({id:p.id,name:p.name,style:p.style}))});
  show('wait','<div class="w s"><h2>Starting...</h2><p class="mu">Waiting for all players to be ready.</p></div>');
  const t0=Date.now(),chk=()=>{if(!this.inMatch)return;const all=this.conns.every(c=>c.ready);if(all||Date.now()-t0>3500){G.start('host',ro);G.me='p0'}else this.readyT=setTimeout(chk,100)};chk()}};
addEventListener('beforeunload',()=>{try{if(Net.hc&&Net.hc.open)Net.hc.send({t:'leave'})}catch(e){}});
lobby();
