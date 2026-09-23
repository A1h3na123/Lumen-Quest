const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const STORE_KEY = 'lumenQuest.v2';
const AI_KEY = 'lumenQuest.ai.session';

const REGIONS = [
  {id:'forest', name:'Moonlit Grove', subtitle:'Ancient trees, crystal roots, and living runes', monsters:['Mossfang','Thornmaw','Bramblehorn','Virid Wisp','Elderbark']},
  {id:'snow', name:'Frostbound Reach', subtitle:'Icefields, aurora ruins, and frozen sigils', monsters:['Cryofang','Rimehorn','Glaciera','Snowclaw','Shardwyrm']},
  {id:'underworld', name:'Ashen Underworld', subtitle:'Obsidian caverns, ember rivers, and cursed gates', monsters:['Cindermaw','Hexflare','Obsidrax','Ember Wraith','Dreadhoof']},
  {id:'kingdom', name:'Sunspire Kingdom', subtitle:'Golden towers, old libraries, and royal battlements', monsters:['Gilded Sentinel','Crownfang','Runeknight','Aurelia Golem','Bannerbeast']},
  {id:'coast', name:'Stormglass Coast', subtitle:'Black cliffs, lightning seas, and drowned shrines', monsters:['Tempest Drake','Tideclaw','Brinegeist','Voltfin','Stormshell']},
  {id:'astral', name:'Astral Ruins', subtitle:'Star-vaults, broken moons, and impossible temples', monsters:['Nebulisk','Starforged Golem','Voidling','Cometjaw','Eclipse Wyrm']}
];

let state = loadState();
let session = null;
let modalCleanup = null;
let serverConfig = {openaiConfigured:false, geminiConfigured:false};

function loadState(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {quests:[],settings:{sound:true}}; }
  catch { return {quests:[],settings:{sound:true}}; }
}
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function id(){ return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function esc(s=''){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function rand(arr){return arr[Math.floor(Math.random()*arr.length)]}
function shuffle(arr){return [...arr].sort(()=>Math.random()-.5)}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}
function dateLabel(ts){try{return new Date(ts).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}catch{return ''}}

async function refreshConfig(){
  try { serverConfig = await fetch('/api/config').then(r=>r.json()); }
  catch { serverConfig = {openaiConfigured:false, geminiConfigured:false}; }
}

function aiSession(){
  try{return JSON.parse(sessionStorage.getItem(AI_KEY))||{provider:'auto',openaiKey:'',geminiKey:''}}
  catch{return {provider:'auto',openaiKey:'',geminiKey:''}}
}
function saveAiSession(x){sessionStorage.setItem(AI_KEY,JSON.stringify(x))}

function shell(content, battle=false){
  app.innerHTML=`<div class="app-shell">
    <header class="topbar">
      <div class="brand" data-home><span class="brand-orb"></span>LUMEN QUEST</div>
      <div class="top-actions">
        <span class="badge"><span class="dot ${serverConfig.openaiConfigured?'on':''}"></span>OpenAI ${serverConfig.openaiConfigured?'ready':'optional'}</span>
        <button class="btn ghost" data-calc>Calculator</button>
        <button class="btn ghost" data-ai>Connect AI</button>
        ${battle?'<button class="btn ghost" data-exit>Quest Library</button>':''}
      </div>
    </header>
    ${battle?content:`<main>${content}</main>`}
  </div>`;
  app.querySelector('[data-home]')?.addEventListener('click',()=>{session=null;renderHome()});
  app.querySelector('[data-calc]')?.addEventListener('click',openCalculator);
  app.querySelector('[data-ai]')?.addEventListener('click',openAiModal);
  app.querySelector('[data-exit]')?.addEventListener('click',()=>{session=null;renderHome()});
}

function renderHome(){
  const cards = state.quests.length ? state.quests.map(q=>`
    <article class="quest-card">
      <div class="kicker">${esc(q.subject || 'STUDY QUEST')}</div>
      <h3>${esc(q.title)}</h3>
      <div class="meta">${esc((q.files||[]).map(f=>f.name).join(' · ') || 'Notes package')}<br>
      Updated ${dateLabel(q.updatedAt)} · ${q.totalAnswered||0} answered · ${Math.round(((q.correct||0)/Math.max(1,q.totalAnswered||0))*100)}% accuracy</div>
      <div class="quest-actions">
        <button class="btn primary" data-play="${q.id}">Enter quest</button>
        <button class="btn" data-update="${q.id}">Update notes</button>
      </div>
    </article>`).join('') : `<div class="empty-card">No subject quests yet. Upload your first notes package to begin.</div>`;
  shell(`
    <section class="hero">
      <div>
        <div class="kicker">YOUR STUDY ADVENTURE</div>
        <h1>Learn the idea.<br>Earn the victory.</h1>
        <p>Turn each subject note package into its own persistent RPG. Every time you enter a subject, Lumen Quest sends you to a different region with a new rotation of monsters. Questions are generated from your notes, reworded across attempts, and missed concepts return later instead of immediately revealing the answer.</p>
        <div class="hero-actions"><button class="btn primary" data-upload>Upload notes</button><button class="btn gold" data-demo>Play demo</button></div>
      </div>
      <div class="hero-art"><div class="mini-scene"><div class="mini-tree tree-a"></div><div class="mini-tree tree-b"></div><div class="mini-tree tree-c"></div><div class="crystal c1"></div><div class="crystal c2"></div></div></div>
    </section>
    <div class="section-head"><div><div class="kicker">YOUR QUESTS</div><h2>Subject adventures</h2></div><p>One game per note package · Update notes without losing the quest</p></div>
    <section class="quest-grid">${cards}</section>
    <section class="how">
      <div class="how-card"><div class="n">01 · BRING YOUR NOTES</div><h4>Upload a package</h4><p>PDF, text, or Markdown notes become a separate subject quest saved in this browser.</p></div>
      <div class="how-card"><div class="n">02 · ENTER A REGION</div><h4>Battle something new</h4><p>Forest, snow, underworld, kingdom, coast, and astral regions rotate between sessions, each with five monsters.</p></div>
      <div class="how-card"><div class="n">03 · LEARN, DON'T MEMORIZE</div><h4>Questions keep changing</h4><p>Missed concepts return a few questions later with different wording. Wrong answers explain the mistake without giving away the right answer.</p></div>
    </section>
    <div class="footer-note">LUMEN QUEST · Knowledge is your magic.</div>`);

  app.querySelector('[data-upload]')?.addEventListener('click',()=>openNotesModal());
  app.querySelector('[data-demo]')?.addEventListener('click',createDemo);
  app.querySelectorAll('[data-play]').forEach(b=>b.addEventListener('click',()=>startQuest(b.dataset.play)));
  app.querySelectorAll('[data-update]').forEach(b=>b.addEventListener('click',()=>openNotesModal(b.dataset.update)));
}

function createDemo(){
  const existing=state.quests.find(q=>q.demo);
  if(existing) return startQuest(existing.id);
  const q={id:id(),title:'The First Expedition',subject:'Biology & Chemistry Demo',demo:true,
    files:[{name:'Built-in demo notes'}],createdAt:Date.now(),updatedAt:Date.now(),lastRegion:null,totalAnswered:0,correct:0,
    notes:`Cell membranes regulate movement of substances into and out of cells. Phospholipid bilayers contain hydrophilic heads and hydrophobic tails. Diffusion moves particles down a concentration gradient without direct cellular energy. Active transport can move substances against a concentration gradient and requires energy. Enzymes lower activation energy and are affected by temperature and pH. In atomic structure, orbitals are regions of high probability for finding electrons. An s subshell contains one orbital, a p subshell contains three orbitals, and each orbital can hold up to two electrons with opposite spins.`};
  state.quests.unshift(q);saveState();startQuest(q.id);
}

function openModal(html){
  modalCleanup?.();
  const wrap=document.createElement('div');wrap.className='modal-backdrop';wrap.innerHTML=`<div class="modal">${html}</div>`;document.body.append(wrap);
  const close=()=>{wrap.remove();modalCleanup=null};modalCleanup=close;
  wrap.addEventListener('click',e=>{if(e.target===wrap)close()});
  wrap.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
  return {wrap,close};
}

function openNotesModal(questId=null){
  const q=questId?state.quests.find(x=>x.id===questId):null;
  const {wrap,close}=openModal(`
    <h2>${q?'Update this quest':'Create a new quest'}</h2>
    <p>${q?'Choose a new notes package. Lumen Quest will keep this subject game and its stats, but replace the study material with the new package.':'Each upload becomes its own subject game. Uploading another subject later creates a separate quest.'}</p>
    <div class="field"><label>Subject / quest name</label><input class="input" data-title value="${esc(q?.title||'')}" placeholder="e.g. CHEM 201 — Atomic Structure"></div>
    <div class="field"><label>Notes package</label><div class="file-drop"><input data-files type="file" multiple accept="application/pdf,.pdf,text/plain,.txt,text/markdown,.md"><div class="small" style="margin-top:8px">Searchable PDFs, TXT, or Markdown. Multiple files can be combined into one subject package.</div></div></div>
    <div class="small">PDF text is extracted in your browser. Scanned-image PDFs still need OCR before upload.</div>
    <div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save>${q?'Update notes':'Create quest'}</button></div>`);
  wrap.querySelector('[data-save]').addEventListener('click',async()=>{
    const title=wrap.querySelector('[data-title]').value.trim();
    const files=[...wrap.querySelector('[data-files]').files];
    if(!title) return toast('Give this quest a subject name.');
    if(!files.length) return toast('Choose at least one notes file.');
    const btn=wrap.querySelector('[data-save]');btn.disabled=true;btn.textContent='Reading notes…';
    try{
      const extracted=await extractFiles(files);
      if(extracted.text.trim().length<80) throw new Error('I could not extract enough searchable text from that package.');
      if(q){
        q.title=title;q.subject=title;q.notes=extracted.text;q.files=extracted.files;q.updatedAt=Date.now();q.noteVersion=(q.noteVersion||1)+1;
      }else{
        state.quests.unshift({id:id(),title,subject:title,notes:extracted.text,files:extracted.files,createdAt:Date.now(),updatedAt:Date.now(),lastRegion:null,totalAnswered:0,correct:0,noteVersion:1});
      }
      saveState();close();renderHome();toast(q?'Quest notes updated.':'New subject quest created.');
    }catch(err){btn.disabled=false;btn.textContent=q?'Update notes':'Create quest';toast(err.message||'Could not read notes.');}
  });
}

async function extractFiles(files){
  const out=[];const chunks=[];
  for(const file of files){
    const lower=file.name.toLowerCase();let text='';
    if(lower.endsWith('.pdf')||file.type==='application/pdf') text=await extractPdf(file);
    else text=await file.text();
    out.push({name:file.name,size:file.size});
    chunks.push(`\n\n===== ${file.name} =====\n${text}`);
  }
  return {text:chunks.join('\n'),files:out};
}

async function extractPdf(file){
  let pdfjs;
  try{pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');}
  catch{throw new Error('PDF reader could not load. Check your internet connection, or upload TXT/Markdown notes instead.');}
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  const data=new Uint8Array(await file.arrayBuffer());
  const pdf=await pdfjs.getDocument({data}).promise;
  const parts=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p);const content=await page.getTextContent();
    parts.push(content.items.map(i=>i.str).join(' '));
  }
  return parts.join('\n');
}

function chooseRegion(quest){
  const options=REGIONS.filter(r=>r.id!==quest.lastRegion);
  const region=rand(options.length?options:REGIONS);quest.lastRegion=region.id;saveState();return region;
}
function chooseMonster(region,used=[]){
  const names=region.monsters.filter(n=>!used.includes(n));const name=rand(names.length?names:region.monsters);return {name,index:region.monsters.indexOf(name)};
}

function startQuest(questId){
  const quest=state.quests.find(q=>q.id===questId);if(!quest)return;
  const region=chooseRegion(quest);const monster=chooseMonster(region,[]);
  session={quest,region,monster,usedMonsters:[monster.name],playerHp:100,enemyHp:100,answered:0,correct:0,recent:[],deferred:[],question:null,phase:'loading',provider:'',selected:null};
  renderBattle();loadNextQuestion();
}

function renderBattle(){
  const s=session;if(!s)return renderHome();
  const bubble = s.phase==='loading' ? `<div class="speech loading"><div class="speaker">${esc(s.monster.name)}</div>Consulting your notes…</div>` : s.question ? `<div class="speech ${s.phase==='wrong'?'wrong':s.phase==='correct'?'correct':''}"><div class="speaker">${esc(s.monster.name)}</div>${esc(s.phase==='asking'?s.question.prompt:s.feedback||s.question.prompt)}</div>` : '';
  const answers = s.question ? s.question.choices.map((c,i)=>`<button class="answer ${s.selected===i?(s.phase==='wrong'?'chosen-wrong':s.phase==='correct'?'chosen-correct':''):''}" data-answer="${i}" ${s.phase!=='asking'?'disabled':''}><span class="letter">${'ABCD'[i]}</span><span>${esc(c)}</span></button>`).join('') : '<div class="small">Generating a fresh question from your notes…</div>';
  shell(`<div class="battle-page"><div class="region-stage region-${s.region.id}"></div><div class="battle-ui">
    <div class="battle-head"><div class="region-label"><div class="title">${esc(s.region.name)}</div><div class="sub">${esc(s.region.subtitle)}</div></div><div class="battle-head-actions"><span class="badge">${esc(s.provider||'question engine')}</span></div></div>
    <div class="arena">
      <div class="player-zone"><div class="status-card"><div class="status-row"><span class="player-name">THE SCHOLAR</span><span>Lv. ${Math.max(1,Math.floor((s.quest.totalAnswered||0)/10)+1)}</span></div><div class="hp-track"><div class="hp-fill ${s.playerHp<35?'low':''}" style="width:${s.playerHp}%"></div></div></div><div class="sprite-wrap" data-player>${mageSvg()}</div></div>
      <div class="enemy-zone">${bubble}<div class="status-card"><div class="status-row"><span class="enemy-name">${esc(s.monster.name)}</span><span>${s.enemyHp}/100</span></div><div class="hp-track"><div class="hp-fill ${s.enemyHp<35?'low':''}" style="width:${s.enemyHp}%"></div></div></div><div class="sprite-wrap" data-enemy>${monsterSvg(s.region.id,s.monster.index)}</div></div>
    </div>
    <div class="question-panel"><div class="question-meta"><span>${s.question?esc(s.question.concept):'Preparing question'}${s.retrying?' · RETRY':''}</span><span>${s.answered} answered · ${Math.round((s.correct/Math.max(1,s.answered))*100)}% this run</span></div><div class="answers">${answers}</div>${s.phase==='wrong'||s.phase==='correct'?'<div class="continue-row"><button class="btn primary" data-continue>Continue</button></div>':''}</div>
  </div></div>`,true);
  app.querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>answerQuestion(Number(b.dataset.answer))));
  app.querySelector('[data-continue]')?.addEventListener('click',afterFeedback);
}

async function loadNextQuestion(){
  const s=session;if(!s)return;
  s.phase='loading';s.selected=null;s.feedback='';s.retrying=false;renderBattle();
  const dueIndex=s.deferred.findIndex(x=>x.dueAt<=s.answered);
  let retryConcept='';
  if(dueIndex>=0){const item=s.deferred.splice(dueIndex,1)[0];retryConcept=item.concept;s.retrying=true;}
  const excerpt=notesExcerpt(s.quest.notes,s.answered,retryConcept);
  const ai=aiSession();
  try{
    const r=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json',...(ai.openaiKey?{'x-openai-key':ai.openaiKey}:{}),...(ai.geminiKey?{'x-gemini-key':ai.geminiKey}:{})},body:JSON.stringify({provider:ai.provider,subject:s.quest.subject,notesExcerpt:excerpt,recentQuestions:s.recent,retryConcept,difficulty:s.answered>8?'hard':'medium'})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||'Question generation failed');
    s.question=data.question;s.provider=data.provider;s.phase='asking';s.recent.push(s.question.prompt);s.recent=s.recent.slice(-10);if(data.warning)toast(data.warning);
  }catch(err){toast(err.message||'Could not generate question');s.phase='loading';}
  renderBattle();
}

function notesExcerpt(notes,step,retryConcept=''){
  const clean=String(notes||'');if(clean.length<22000)return clean;
  if(retryConcept){const i=clean.toLowerCase().indexOf(retryConcept.toLowerCase());if(i>=0)return clean.slice(Math.max(0,i-9000),Math.min(clean.length,i+13000));}
  const chunk=20000;const max=Math.max(1,clean.length-chunk);const start=(step*7919)%max;return clean.slice(start,start+chunk);
}

function answerQuestion(i){
  const s=session;if(!s||s.phase!=='asking')return;s.selected=i;s.answered++;s.quest.totalAnswered=(s.quest.totalAnswered||0)+1;
  if(i===s.question.correctIndex){
    s.correct++;s.quest.correct=(s.quest.correct||0)+1;s.phase='correct';s.feedback=s.question.correctFeedback||'Correct — your spell lands.';s.enemyHp=Math.max(0,s.enemyHp-(24+Math.floor(Math.random()*13)));
    renderBattle();animate('[data-enemy]','enemy-hit');
  }else{
    s.phase='wrong';s.feedback=s.question.explanations?.[i]||'That choice does not match the concept being tested. Review what relationship or definition the question is asking about.';s.playerHp=Math.max(0,s.playerHp-(14+Math.floor(Math.random()*9)));
    const dueAt=s.answered+3+Math.floor(Math.random()*3);s.deferred.push({concept:s.question.concept,dueAt,origin:s.question.prompt});
    renderBattle();animate('[data-player]','hit');
  }
  saveState();
}

function animate(sel,klass){const el=app.querySelector(sel);if(!el)return;el.classList.add(klass);setTimeout(()=>el.classList.remove(klass),420)}
function afterFeedback(){
  const s=session;if(!s)return;
  if(s.playerHp<=0){s.playerHp=100;toast('Campfire recovery: HP restored. The missed concept stays in the retry queue.');}
  if(s.enemyHp<=0){const m=chooseMonster(s.region,s.usedMonsters);s.monster=m;s.usedMonsters.push(m.name);if(s.usedMonsters.length>=s.region.monsters.length)s.usedMonsters=[];s.enemyHp=100;toast(`A new foe appears: ${m.name}`);}
  loadNextQuestion();
}

function openAiModal(){
  const current=aiSession();
  const {wrap,close}=openModal(`<h2>Connect AI</h2><p>OpenAI is supported alongside Gemini. In <b>Auto</b> mode, Lumen Quest tries OpenAI first and Gemini second, then falls back to local note-based practice.</p>
  <div class="provider-grid">
    ${['auto','openai','gemini'].map(p=>`<label class="provider-choice ${current.provider===p?'active':''}"><input type="radio" name="provider" value="${p}" ${current.provider===p?'checked':''}>${p==='auto'?'Auto (OpenAI → Gemini)':p==='openai'?'OpenAI / ChatGPT':'Gemini'}</label>`).join('')}
  </div>
  <div class="field"><label>OpenAI API key (optional if the server already has OPENAI_API_KEY)</label><input class="input" data-openai type="password" value="${esc(current.openaiKey||'')}" placeholder="sk-…"></div>
  <div class="field"><label>Gemini API key (optional)</label><input class="input" data-gemini type="password" value="${esc(current.geminiKey||'')}" placeholder="AIza…"></div>
  <div class="small">Keys entered here are stored only in this browser tab's session storage and sent only to this app's own server endpoint when generating a question. For a deployed version, server-side environment variables are safer and require no key entry in the browser.</div>
  <div class="modal-actions"><button class="btn" data-close>Cancel</button><button class="btn primary" data-save-ai>Save connection</button></div>`);
  wrap.querySelectorAll('input[name=provider]').forEach(r=>r.addEventListener('change',()=>wrap.querySelectorAll('.provider-choice').forEach(x=>x.classList.toggle('active',x.querySelector('input').checked))));
  wrap.querySelector('[data-save-ai]').addEventListener('click',()=>{saveAiSession({provider:wrap.querySelector('input[name=provider]:checked').value,openaiKey:wrap.querySelector('[data-openai]').value.trim(),geminiKey:wrap.querySelector('[data-gemini]').value.trim()});close();toast('AI connection preferences saved for this tab.');if(session)loadNextQuestion();});
}

function openCalculator(){
  const {wrap}=openModal(`<h2>Scientific Calculator</h2><div class="calc-history" data-history></div><div class="calc-display" data-display>0</div><div class="calc-grid">
    ${[['7','7'],['8','8'],['9','9'],['÷','/','op'],['sin','sin(','op'],['cos','cos(','op'],['4','4'],['5','5'],['6','6'],['×','*','op'],['tan','tan(','op'],['√','sqrt(','op'],['1','1'],['2','2'],['3','3'],['−','-','op'],['log','log10(','op'],['ln','ln(','op'],['0','0'],['.','.'],['π','pi','op'],['+','+','op'],['(', '(','op'],[')',')','op'],['x²','^2','op'],['^','^','op'],['AC','AC'],['⌫','BK'],['=','=','eq']].map(([t,v,c=''])=>`<button class="calc-key ${c}" data-key="${esc(v)}">${t}</button>`).join('')}
  </div><div class="modal-actions"><button class="btn" data-close>Close</button></div>`);
  let expr='';const display=wrap.querySelector('[data-display]');const hist=wrap.querySelector('[data-history]');
  const show=()=>display.textContent=expr||'0';
  wrap.querySelectorAll('[data-key]').forEach(b=>b.addEventListener('click',()=>{
    const k=b.dataset.key;if(k==='AC'){expr='';hist.textContent='';show();return}if(k==='BK'){expr=expr.slice(0,-1);show();return}if(k==='='){try{const ans=calc(expr);hist.textContent=expr+' =';expr=String(ans);show()}catch{hist.textContent='Invalid expression'}return}expr+=k;show();
  }));
}
function calc(raw){
  let e=String(raw).replace(/\^/g,'**').replace(/\bpi\b/g,'Math.PI').replace(/\bsin\(/g,'Math.sin(').replace(/\bcos\(/g,'Math.cos(').replace(/\btan\(/g,'Math.tan(').replace(/\bsqrt\(/g,'Math.sqrt(').replace(/\blog10\(/g,'Math.log10(').replace(/\bln\(/g,'Math.log(');
  if(!/^[0-9+\-*/().\sA-Za-z*,]+$/.test(e))throw new Error('bad');
  if(/[^0-9+\-*/().\sMathPIincsqrlogta]/.test(e.replace(/Math\.(PI|sin|cos|tan|sqrt|log10|log)/g,'')))throw new Error('bad');
  const n=Function(`"use strict";return (${e})`)();if(!Number.isFinite(n))throw new Error('bad');return Math.round((n+Number.EPSILON)*1e12)/1e12;
}

function mageSvg(){return `<svg class="player-sprite" viewBox="0 0 180 220" shape-rendering="crispEdges" aria-label="Crystal mage">
<ellipse cx="90" cy="205" rx="58" ry="10" fill="#02050488"/>
<path d="M55 185h70l-8-67-27-23-27 23z" fill="#244b43" stroke="#08100d" stroke-width="6"/>
<path d="M68 118h44l13 62H53z" fill="#2d6457"/><path d="M75 96h30l13 27H62z" fill="#1b3f38"/>
<rect x="76" y="67" width="28" height="31" fill="#d6b596" stroke="#08100d" stroke-width="5"/><path d="M65 73l25-46 29 49-23-7z" fill="#335d54" stroke="#08100d" stroke-width="6"/><path d="M81 76h6v6h-6zm14 0h6v6h-6z" fill="#16221c"/>
<path d="M56 125l-24 41" stroke="#101711" stroke-width="9"/><path d="M31 167l-1-59" stroke="#57452a" stroke-width="7"/><polygon points="30,95 45,113 30,130 15,113" fill="#8fe9df" stroke="#10211c" stroke-width="5"/><rect x="74" y="128" width="32" height="8" fill="#d5c576"/>
</svg>`}

function monsterSvg(region,variant){
  const palettes={forest:['#315b32','#78a85e','#b9d57a'],snow:['#7fa6b5','#d8f0f3','#82d2e7'],underworld:['#5b1a20','#c84b24','#ffad3d'],kingdom:['#665a44','#c7a653','#f4e4a1'],coast:['#234d5b','#54a1ad','#b5f1e7'],astral:['#38255c','#825bc0','#e0b5ff']};
  const [a,b,c]=palettes[region];
  const extras=[
    `<path d="M58 70L30 38l44 18m48 14l28-32-44 18" fill="${b}" stroke="#111" stroke-width="6"/>`,
    `<path d="M70 48L85 16l14 33m-42 17L34 48m88 18l23-18" fill="none" stroke="${c}" stroke-width="9"/>`,
    `<circle cx="45" cy="88" r="17" fill="${c}" stroke="#111" stroke-width="6"/><circle cx="135" cy="88" r="17" fill="${c}" stroke="#111" stroke-width="6"/>`,
    `<path d="M62 42h56l-7-24H69z" fill="${c}" stroke="#111" stroke-width="6"/><rect x="83" y="13" width="15" height="28" fill="${b}"/>`,
    `<path d="M55 80C30 54 22 114 50 125M125 80c25-26 33 34 5 45" fill="none" stroke="${c}" stroke-width="13"/>`
  ];
  return `<svg class="enemy-sprite" viewBox="0 0 200 220" shape-rendering="crispEdges" aria-label="Monster">
    <ellipse cx="100" cy="205" rx="70" ry="11" fill="#0007"/>${extras[variant%extras.length]}
    <path d="M55 88l18-35h54l18 35 18 35-15 58H52l-15-58z" fill="${a}" stroke="#0d1010" stroke-width="7"/>
    <path d="M66 88l34-23 34 23-8 67H74z" fill="${b}" opacity=".85"/>
    <rect x="70" y="91" width="19" height="14" fill="#101514"/><rect x="111" y="91" width="19" height="14" fill="#101514"/><rect x="77" y="95" width="6" height="6" fill="${c}"/><rect x="117" y="95" width="6" height="6" fill="${c}"/>
    <path d="M82 126h36l-8 16H90z" fill="#14110f"/><path d="M67 179l-10 29m76-29l10 29" stroke="#111" stroke-width="12"/>
    <polygon points="100,120 111,136 100,156 89,136" fill="${c}" stroke="#111" stroke-width="4"/>
  </svg>`;
}

await refreshConfig();
renderHome();
