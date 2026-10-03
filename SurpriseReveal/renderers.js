import {styling,mechanism} from './personalization.js';
export const escape = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escape;
const motifs={
 'little-something':'<div class="fold" aria-hidden="true"></div><div class="seal" aria-hidden="true">s<span>r</span></div>',
 'birthday-confetti':'<div class="confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>',
 'big-number':'<div class="big-mark" aria-hidden="true">A big<br>little moment.</div>',
 'hidden-present':'<div class="stack-mark" aria-hidden="true"><span>01</span><span>02</span><span>03</span></div>',
 'ticket-night':'<div class="ticket-strip">AN EVENING TO REMEMBER <span>KEEP THIS MOMENT</span></div>',
 'weekend-away':'<svg class="landscape" viewBox="0 0 600 140" aria-hidden="true"><circle cx="465" cy="45" r="25" fill="#d99356"/><path d="M0 140V90L120 35 250 120 390 70 600 140" fill="#53776c"/><path d="M0 140L240 80 420 140 600 90V140" fill="#c5b797"/></svg>',
 'dinner-on-me':'<svg class="plate" viewBox="0 0 180 90" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="90" cy="45" r="33"/><circle cx="90" cy="45" r="26"/><path d="M30 14V76M23 14V34Q30 44 37 34V14M150 14V76M150 14Q167 28 150 46"/></g></svg>',
 'good-news':'<div class="poster-mark" aria-hidden="true">GOOD<br>THINGS<br>AHEAD.</div>',
 'a-proper-thank-you':'<div class="thanks-mark" aria-hidden="true">Thank<br><em>you.</em></div>',
 'team-thank-you':'<div class="team-rule" aria-hidden="true"></div><div class="card-kicker">WITH OUR APPRECIATION</div>',
 'client-appreciation':'<div class="client-rule" aria-hidden="true"></div><div class="card-kicker">A NOTE OF THANKS</div>',
 'winter-surprise':'<svg class="winter-mark" viewBox="0 0 200 70" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M10 55Q100 10 190 55M40 45L35 25M60 37L58 16M140 37L142 16M160 45L165 25M45 42L48 59M75 30L83 48M125 30L117 48M155 42L152 59"/></g></svg>'
};
const headings={'little-something':'A note, just for you','birthday-confetti':'Make a wish','big-number':'Here’s to you','hidden-present':'A little trail','ticket-night':'YOUR INVITATION','weekend-away':'Somewhere lovely','dinner-on-me':'At the table','good-news':'A little announcement','a-proper-thank-you':'With gratitude','team-thank-you':'For a brilliant contribution','client-appreciation':'Thoughtfully sent','winter-surprise':'Something to unwrap'};
export function cardHTML(t,c,final=false,compact=false) {
 t={...t,mechanism:mechanism(t,c)};const style=styling(c),hasBackground=typeof c.background==='string'&&/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(c.background);

 return `<article class="reveal-card font-${style.font} backdrop-${style.backdrop} ${hasBackground?'has-background':''} ${e(t.id)} ${final?'is-final':''} ${compact?'compact':''} ${c.palette==='alternate'?'alternate':''}" data-template="${e(t.id)}">
 ${hasBackground?`<img class="background-art" src="${e(c.background)}" alt="">`:''}${motifs[t.id]||''}<div class="card-content">${final&&c.logo?`<img class="logo" src="${e(c.logo)}" alt="Sender’s authorised logo">`:''}
 <p class="eyebrow">${final?e(c.recipient?`For ${c.recipient}`:'The surprise'):headings[t.id]}</p>
 ${final&&t.id==='big-number'&&c.number?`<p class="milestone">${e(c.number)}</p>`:''}
 <h2 ${final?'tabindex="-1"':''}>${e(final?c.headline:c.cover)}</h2>
 ${final?`<div class="message">${e(c.body)}</div>${c.photo?`<img class="photo" src="${e(c.photo)}" alt="Photograph chosen by the sender">`:''}${c.note?`<p class="practical">${e(c.note)}</p>`:''}${c.sender?`<p class="signature">${(c.signoff??(t.occasions?.includes('work')?'From':'With love, from'))?`${e(c.signoff??(t.occasions?.includes('work')?'From':'With love, from'))}<br>`:''}<strong>${e(c.sender)}</strong></p>`:''}`:''}
 ${t.id==='ticket-night'?'<p class="ticket-note">A surprise announcement · not an admission ticket</p>':''}
 </div>${!final&&t.mechanism==='scratch'?'<div class="scratch-placeholder" aria-hidden="true"><span>A little suspense</span></div>':''}${!final&&t.mechanism==='envelope'?'<div class="envelope-line" aria-hidden="true"></div>':''}
 </article>`;
}
export function scratchCells(x,y,width,height,radius=25) {
  const result=[];for(let row=0;row<16;row++)for(let col=0;col<24;col++){const px=(col+.5)*width/24,py=(row+.5)*height/16;if((px-x)**2+(py-y)**2<=radius**2)result.push(row*24+col);}return result;
}
export function mountExperience(host,t,cover,loadResult,{compact=false,loadClues=async()=>({clues:[]}),reduced=false,onResult=()=>{},reviewPause=false}={}) {
 t={...t,mechanism:mechanism(t,cover)};const style=styling(cover),quiet=()=>reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
 let active=false,done=false,disposed=false,clueIndex=-1,clues=[],resizeObserver,effectTimer,audioContext,noiseNode,gain,soundEnabled=false;
 function stopSound(){if(gain&&audioContext)gain.gain.setTargetAtTime(0,audioContext.currentTime,.015);}
 async function enableAudio(){
  try{if(!audioContext){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error();audioContext=new Audio();const buffer=audioContext.createBuffer(1,audioContext.sampleRate,audioContext.sampleRate);const samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;noiseNode=audioContext.createBufferSource();noiseNode.buffer=buffer;noiseNode.loop=true;const filter=audioContext.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1700;filter.Q.value=.7;gain=audioContext.createGain();gain.gain.value=0;noiseNode.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);noiseNode.start();}await audioContext.resume();return true;}catch{return false;}
 }
 function scratchNoise(){if(soundEnabled&&gain&&audioContext){const now=audioContext.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(.055,now,.008);gain.gain.setTargetAtTime(0,now+.045,.025);}}

 const initial=()=>{
  resizeObserver?.disconnect();clearTimeout(effectTimer);stopSound();
  host.innerHTML=`<div class="experience ${quiet()?'reduce-motion':''}">${cardHTML(t,cover,false,compact)}${t.mechanism==='curtains'?'<div class="curtain-frame" aria-hidden="true"><div class="curtain left"></div><div class="curtain right"></div></div>':''}<div class="interaction"></div>${t.mechanism==='slider'?'<div class="slide-control"><label>Slide to reveal<input type="range" min="0" max="100" step="5" value="0" aria-label="Slide to reveal"></label><span aria-hidden="true">A little surprise is waiting →</span></div>':''}<p class="experience-error" role="alert"></p><div class="experience-actions"><button class="primary open-action">${t.mechanism==='scratch'?'Reveal now':t.mechanism==='clues'?'Start the clues':t.mechanism==='curtains'?'Open the curtains':t.mechanism==='slider'?'Open now':t.mechanism==='button'?'Reveal my surprise':'Open your note'}</button>${t.mechanism==='clues'?'<button class="skip-action">Reveal now</button>':''}</div></div>`;
  host.querySelector('.open-action').onclick=t.mechanism==='clues'?nextClue:reveal;
  host.querySelector('.skip-action')?.addEventListener('click',reveal);
  if(t.mechanism==='slider'){const slider=host.querySelector('input[type=range]');slider.oninput=()=>{slider.style.setProperty('--progress',slider.value+'%');slider.setAttribute('aria-valuetext',slider.value+' percent. Slide to the end to open.');if(Number(slider.value)>=95)reveal();};slider.onpointerup=slider.onpointercancel=()=>{if(!active&&!done){slider.value=0;slider.style.setProperty('--progress','0%');slider.setAttribute('aria-valuetext','Slide to the end to open.');}};}
  if(t.mechanism==='scratch'&&!compact)setupScratch();
 };
 async function reveal(){if(disposed||active||done)return;active=true;stopSound();host.querySelector('input[type=range]')?.setAttribute('disabled','');host.querySelector('.experience-error').textContent='';host.querySelectorAll('button').forEach(b=>b.disabled=true);
  try{const result={...cover,...await loadResult()};if(disposed)return;const experience=host.querySelector('.experience');experience.classList.add('opening');
   if(t.mechanism==='curtains'){experience.querySelector('.reveal-card').outerHTML=cardHTML(t,result,true,compact);const frame=experience.querySelector('.curtain-frame');frame.style.bottom='auto';frame.style.height=experience.querySelector('.reveal-card').offsetHeight+'px';}
   if(reviewPause&&!reduced){experience.classList.add('review-pause');await new Promise(resolve=>{const b=document.createElement('button');b.textContent='Finish midpoint review';b.onclick=resolve;experience.querySelector('.experience-actions').append(b);});}
   if(!quiet())await new Promise(r=>setTimeout(r,650));
   if(disposed)return;resizeObserver?.disconnect();host.innerHTML=`<div class="experience ${quiet()?'reduce-motion':''}">${cardHTML(t,result,true,compact)}<div class="experience-actions"><button class="replay">Open it again</button><button class="copy-message">Copy message</button></div>${result.showCredit?'<p class="credit">Made with Surprise Reveal · <a href="/">Make your own</a></p>':''}</div>`;
   celebrate();done=true;host.querySelector('h2').focus({preventScroll:true});host.querySelector('.replay').onclick=()=>{done=false;clueIndex=-1;initial();};
   host.querySelector('.copy-message').onclick=async()=>{try{await navigator.clipboard.writeText(`${result.headline}\n\n${result.body}`);host.querySelector('.copy-message').textContent='Copied';}catch{host.querySelector('.message').setAttribute('tabindex','0');host.querySelector('.message').focus();}};onResult(result);
  }catch(err){if(disposed)return;host.querySelector('.experience-error').textContent=err.message||'Reconnect and try again.';host.querySelectorAll('button,input').forEach(b=>b.disabled=false);}finally{active=false;}
 }
 async function nextClue(){if(disposed||active||done)return;if(clueIndex>=clues.length-1&&clueIndex!==-1)return reveal();active=true;
  try{if(clueIndex===-1)clues=(await loadClues()).clues;if(disposed)return;if(!clues.length){active=false;return reveal();}clueIndex++;
   host.querySelector('.interaction').innerHTML=`<div class="clue-card" aria-live="polite"><span>Clue ${clueIndex+1} of ${clues.length}</span><p>${e(clues[clueIndex])}</p></div>`;host.querySelector('.open-action').textContent=clueIndex===clues.length-1?'Open the surprise':'Next clue';
  }catch(err){if(disposed)return;host.querySelector('.experience-error').textContent=err.message;}finally{active=false;}
 }
 function celebrate(){
  if(quiet()||style.celebration==='none')return;
  const layer=document.createElement('div');layer.className='celebration effect-'+style.celebration;layer.setAttribute('aria-hidden','true');
  for(let i=0;i<38;i++){const piece=document.createElement('i');piece.style.setProperty('--x',((i*37)%100)+'%');piece.style.setProperty('--delay',((i%9)*.065)+'s');piece.style.setProperty('--spin',(i%2?1:-1)*((i*59)%480+180)+'deg');piece.style.setProperty('--drift',((i*43)%150-75)+'px');piece.style.setProperty('--color',['#e9b34b','#f48399','#9b85ef','#64bdac','#6ea3ea'][i%5]);piece.textContent=style.celebration==='stars'?'✦':style.celebration==='hearts'?'♥':'';layer.append(piece);}
  host.querySelector('.experience').append(layer);effectTimer=setTimeout(()=>layer.remove(),3800);
 }
 function setupScratch(){
  const panel=host.querySelector('.scratch-placeholder');panel.classList.add('foil-'+style.foil,'tool-'+style.scratchTool);panel.innerHTML='<b class="scratch-under">A little magic awaits ✦</b><canvas aria-label="Scratch here, or use Reveal now below"></canvas><span>Scratch a little. Smile a lot.</span>';
  const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d'),cells=new Set();let dragging=false,last=null;
  if(style.scratchSound==='optional'){const toggle=document.createElement('button');toggle.type='button';toggle.className='scratch-sound';toggle.textContent=soundEnabled?'Sound on':'Sound off';toggle.setAttribute('aria-pressed',String(soundEnabled));toggle.onclick=async()=>{if(soundEnabled){soundEnabled=false;stopSound();}else soundEnabled=await enableAudio();if(disposed)return;toggle.textContent=soundEnabled?'Sound on':'Sound off';toggle.setAttribute('aria-pressed',String(soundEnabled));if(!soundEnabled&&!audioContext)host.querySelector('.experience-error').textContent='Sound is unavailable in this browser. You can still scratch to reveal.';};host.querySelector('.experience-actions').append(toggle);}
  const resize=()=>{const b=panel.getBoundingClientRect(),dpr=devicePixelRatio||1;canvas.width=Math.round(b.width*dpr);canvas.height=Math.round(b.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='source-over';const foil=ctx.createLinearGradient(0,0,b.width,b.height);const colors=style.foil==='silver'?['#c8d7e6','#f6e8fb','#aab8cc','#e0faef']:style.foil==='rose'?['#b77669','#ffe2ca','#ca968b','#f3c6ab']:['#b18a40','#f9e7ac','#bf9a52','#f0d794'];colors.forEach((c,i)=>foil.addColorStop(i/3,c));ctx.fillStyle=foil;ctx.fillRect(0,0,b.width,b.height);for(let i=0;i<950;i++){const x=(i*73.19)%b.width,y=(i*37.73)%b.height;ctx.fillStyle=i%2?'#ffffff50':'#66552a20';ctx.fillRect(x,y,1.2,1.2);}ctx.strokeStyle='#ffffff55';ctx.lineWidth=1;for(let x=-b.height;x<b.width;x+=14){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+b.height,b.height);ctx.stroke();}ctx.globalCompositeOperation='destination-out';cells.clear();last=null;};
  resizeObserver=new ResizeObserver(resize);resizeObserver.observe(panel);
  function erase(event){if(!dragging||active||done||disposed)return;const b=canvas.getBoundingClientRect(),x=event.clientX-b.left,y=event.clientY-b.top;const from=last||{x,y},steps=Math.max(1,Math.ceil(Math.hypot(x-from.x,y-from.y)/10));ctx.lineCap='round';ctx.lineWidth=42;ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(x,y);ctx.stroke();for(let step=1;step<=steps;step++){const px=from.x+(x-from.x)*step/steps,py=from.y+(y-from.y)*step/steps;ctx.beginPath();ctx.arc(px,py,21,0,Math.PI*2);ctx.fill();scratchCells(px,py,b.width,b.height,21).forEach(i=>cells.add(i));}last={x,y};scratchNoise();panel.querySelector('span').style.opacity=cells.size/384>.08?0:1;if(cells.size/384>=.45){dragging=false;stopSound();reveal();}}
  canvas.onpointerdown=ev=>{dragging=true;last=null;canvas.setPointerCapture(ev.pointerId);erase(ev);};canvas.onpointermove=erase;canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=()=>{dragging=false;last=null;stopSound();};
 }

 initial();return {reveal,destroy(){disposed=true;resizeObserver?.disconnect();clearTimeout(effectTimer);stopSound();noiseNode?.stop();audioContext?.close().catch(()=>{});}};
}
