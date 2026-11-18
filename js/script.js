// ---------- name: split into letters that bloom in ----------
document.querySelectorAll('.split').forEach(el=>{
  const txt=el.textContent;el.textContent='';
  [...txt].forEach((c,i)=>{const s=document.createElement('span');s.className='l';s.style.setProperty('--i',i);s.setAttribute('aria-hidden','true');s.innerHTML=c===' '?'&nbsp;':c;el.appendChild(s)});
});

// ---------- reveal on scroll ----------
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%2)*.1+'s';io.observe(el)});

// ---------- photo tilts toward your finger / cursor ----------
const tilt=document.querySelector('.tilt');
addEventListener('pointermove',e=>{
  if(!tilt)return;
  const r=tilt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  if(Math.abs(x)<1.2&&Math.abs(y)<1.2){tilt.style.setProperty('--ry',x*14+'deg');tilt.style.setProperty('--rx',-y*14+'deg')}
  else{tilt.style.setProperty('--ry','0deg');tilt.style.setProperty('--rx','0deg')}
},{passive:true});

// ---------- touch: ripple ring + blossoms and hearts float up ----------
const cols=['#ff8fb8','#f6c25b','#86dcc3','#8fcbff','#bf9cf5','#ffb48a'];
const emo=['🌸','💖','🌷','🌼','💗','🦋','🌺'];
const rnd=(a,b)=>a+Math.random()*(b-a);
addEventListener('pointerdown',e=>{
  const ring=document.createElement('div');ring.className='ring';
  ring.style.left=e.clientX+'px';ring.style.top=e.clientY+'px';ring.style.borderColor=cols[Math.floor(rnd(0,cols.length))];
  document.body.appendChild(ring);setTimeout(()=>ring.remove(),900);
  for(let i=0;i<7;i++){
    const s=document.createElement('span');s.className='pop';
    s.textContent=emo[Math.floor(rnd(0,emo.length))];
    const a=rnd(0,Math.PI*2),d=rnd(30,90);
    s.style.left=e.clientX-11+'px';s.style.top=e.clientY-11+'px';
    s.style.setProperty('--dx',Math.cos(a)*d+'px');
    s.style.setProperty('--dy',(Math.sin(a)*d-70)+'px');
    s.style.setProperty('--r',rnd(-90,90)+'deg');
    s.style.animationDelay=i*.03+'s';
    document.body.appendChild(s);setTimeout(()=>s.remove(),1600);
  }
});

// ---------- sparkle trail while dragging ----------
let lastSpark=0;
addEventListener('pointermove',e=>{
  const n=performance.now();if(n-lastSpark<45||(e.pointerType==='mouse'&&!e.buttons&&e.pointerType!=='mouse'))return;
  if(e.pointerType==='mouse'&&e.buttons===0&&Math.random()<.5)return;
  lastSpark=n;
  const s=document.createElement('span');s.className='spark';
  const c=cols[Math.floor(rnd(0,cols.length))];
  s.style.left=e.clientX-4+'px';s.style.top=e.clientY-4+'px';s.style.background=c;s.style.boxShadow='0 0 10px '+c;
  document.body.appendChild(s);setTimeout(()=>s.remove(),800);
},{passive:true});

// ---------- gentle falling petals ----------
setInterval(()=>{
  if(document.hidden)return;
  const p=document.createElement('span');p.className='petal';p.textContent=['🌸','🌺','🌷','🌼'][Math.floor(rnd(0,4))];
  p.style.left=rnd(0,100)+'vw';p.style.fontSize=rnd(12,26)+'px';
  p.style.setProperty('--sx',rnd(-60,60)+'px');
  p.style.animationDuration=rnd(9,16)+'s';
  document.body.appendChild(p);setTimeout(()=>p.remove(),17000);
},1400);

// ---------- music: slow, warm, romantic piano-and-pad (made in the browser) ----------
let ctx,master,playing=false,started=false,timer,step=0;
const mtof=m=>440*Math.pow(2,(m-69)/12);
// Cmaj7 - Em7 - Am7 - Fmaj7 - Dm7 - G6 - Cmaj7 - G  (a soft, hopeful loop)
const chords=[
 [48,55,59,64,67],[52,59,62,67,71],[45,52,55,60,64],[41,48,52,57,60],
 [50,57,60,65,69],[43,50,55,59,64],[48,55,59,64,67],[43,50,55,59,62]];
const melody=[[79,76],[79,74],[76,72],[77,72],[74,77],[79,76],[76,72],[74,71]];
const arp=[0,1,2,3,4,3,2,1];
const STEP=.62;

function makeReverb(){
  const len=ctx.sampleRate*3.5,buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=buf.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)}
  const cv=ctx.createConvolver();cv.buffer=buf;return cv;
}
function setup(){
  ctx=new (window.AudioContext||window.webkitAudioContext)();
  master=ctx.createGain();master.gain.value=.9;
  const comp=ctx.createDynamicsCompressor();
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
  const rev=makeReverb(),wet=ctx.createGain();wet.gain.value=.55;
  const dly=ctx.createDelay(1),fb=ctx.createGain();dly.delayTime.value=STEP*1.5;fb.gain.value=.32;
  dly.connect(fb).connect(dly);
  master.connect(lp);lp.connect(comp);lp.connect(dly);dly.connect(rev);lp.connect(rev);rev.connect(wet).connect(comp);
  comp.connect(ctx.destination);
}
function note(m,t,dur,vol,slow){
  const f=mtof(m),g=ctx.createGain();
  g.gain.setValueAtTime(0,t);
  g.gain.linearRampToValueAtTime(vol,t+(slow?.9:.012));
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  g.connect(master);
  [[1,1],[2,.22],[3,.07]].forEach(([mul,amp])=>{
    const o=ctx.createOscillator(),h=ctx.createGain();
    o.type='sine';o.frequency.value=f*mul;o.detune.value=(Math.random()-.5)*6;h.gain.value=amp;
    o.connect(h).connect(g);o.start(t);o.stop(t+dur+.1);
  });
}
function tick(){
  if(!ctx||ctx.state!=='running')return;
  const t=ctx.currentTime+.06,bar=Math.floor(step/8)%chords.length,s=step%8,ch=chords[bar];
  note(ch[arp[s]]+(s%2?12:0),t,2.2,.075);                 // arpeggio
  if(s===0){
    note(ch[0]-12,t,STEP*8,.09,true);                       // deep warm root
    note(ch[2],t,STEP*8,.035,true);note(ch[3],t,STEP*8,.03,true); // pad
    note(melody[bar][0],t+.02,3.2,.11);                     // melody, phrase start
  }
  if(s===4)note(melody[bar][1],t+.02,3,.1);                 // melody, answer
  if(s===6&&bar%2===1)note(melody[bar][0]+2,t,1.6,.06);     // small tender lift
  step++;
}
const btn=document.getElementById('music');
function label(){btn.textContent=playing?'💗 playing · tap to pause':'🎶 tap to play our song';btn.classList.toggle('on',playing)}
function play(){
  try{if(!ctx)setup()}catch(e){return}
  ctx.resume().then(()=>{
    if(ctx.state!=='running')return;
    playing=true;started=true;label();
    if(!timer){tick();timer=setInterval(tick,STEP*1000)}
  }).catch(()=>{});
}
function pause(){if(ctx)ctx.suspend();playing=false;label()}
btn.addEventListener('click',e=>{e.stopPropagation();playing?pause():play()});
// browsers need a gesture: first touch anywhere (except the button) starts the music
const evs=['pointerdown','touchend','keydown','wheel'];
function first(e){if(started||(e.target&&e.target.closest&&e.target.closest('#music')))return;play();if(started)evs.forEach(x=>removeEventListener(x,first))}
evs.forEach(x=>addEventListener(x,first,{passive:true}));
play(); // works where autoplay is allowed
document.addEventListener('visibilitychange',()=>{if(!ctx||!playing)return;document.hidden?ctx.suspend():ctx.resume()});
