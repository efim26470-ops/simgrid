(() => {
  'use strict';
  const D = window.SIMGRID_DATA;
  const STORAGE_KEY = 'simgrid.state.v1';
  const NAV = [
    {id:'dashboard',label:'РћР±Р·РѕСЂ',icon:'в—«',eyebrow:'Р¦РµРЅС‚СЂ РїРёР»РѕС‚Р°'},
    {id:'sessions',label:'РЎРµСЃСЃРёРё',icon:'в—·',eyebrow:'Р–СѓСЂРЅР°Р» Р·Р°РµР·РґРѕРІ'},
    {id:'strategy',label:'РЎС‚СЂР°С‚РµРіРёСЏ',icon:'вЊЃ',eyebrow:'Race engineer'},
    {id:'setups',label:'РЎРµС‚Р°РїС‹',icon:'вЊ',eyebrow:'Garage lab'},
    {id:'catalog',label:'РљР°С‚Р°Р»РѕРі',icon:'в–¦',eyebrow:'РўСЂР°СЃСЃС‹ Рё РјР°С€РёРЅС‹'},
    {id:'guides',label:'Р“Р°Р№РґС‹',icon:'в—‡',eyebrow:'Track academy'},
    {id:'settings',label:'Р•С‰С‘',icon:'вЂўвЂўвЂў',eyebrow:'РџСЂРѕС„РёР»Рё Рё РґР°РЅРЅС‹Рµ'}
  ];
  const MOBILE_NAV = ['dashboard','sessions','strategy','setups','guides','settings'];
  const DEFAULT_STRATEGY = {raceMode:'time',duration:60,raceLaps:30,lapTime:'2:20.000',fuelPerLap:2.65,tank:120,startFuel:70,pitLoss:32,mandatoryStops:0,tyreLife:24,traffic:4,weather:'dry',compound:'medium'};
  const defaultState = {
    version:2,
    theme:'telemetry',
    activeProfile:'sprint',
    sessions:structuredCloneSafe(D.sampleSessions),
    setups:structuredCloneSafe(D.sampleSetups),
    settings:{units:'metric',reduceMotion:false,autoBackup:false,showDemo:true},
    steam:{steamId:'',endpoint:'',profile:null,lastSync:null,ownedGames:[]},
    live:{running:false,startTs:null,elapsed:0,game:'acc',track:'spa',car:'m4gt3',laps:0,best:'вЂ”'},
    strategy:DEFAULT_STRATEGY,
    setupFavorites:[],
    guideProgress:{},
    guideQuiz:{},
    onboarded:true
  };

  let state = loadState();
  let route = new URLSearchParams(location.search).get('view') || 'dashboard';
  if (!NAV.some(n => n.id === route)) route = 'dashboard';
  let deferredInstall = null;
  let liveTicker = null;
  let setupViewMode = 'mine';
  let setupOnlyFavorites = false;

  const els = {
    view:document.getElementById('view'),
    desktopNav:document.getElementById('desktopNav'),
    mobileNav:document.getElementById('mobileNav'),
    title:document.getElementById('pageTitle'),
    eyebrow:document.getElementById('pageEyebrow'),
    modalRoot:document.getElementById('modalRoot'),
    toastRoot:document.getElementById('toastRoot'),
    importInput:document.getElementById('importInput'),
    themeBtn:document.getElementById('themeBtn'),
    installBtn:document.getElementById('installBtn'),
    quickAddBtn:document.getElementById('quickAddBtn'),
    profileSwitch:document.getElementById('profileSwitch'),
    activeProfileName:document.getElementById('activeProfileName'),
    profileAvatar:document.getElementById('profileAvatar'),
    profileGameHint:document.getElementById('profileGameHint')
  };

  function structuredCloneSafe(value){
    try{return structuredClone(value);}catch{return JSON.parse(JSON.stringify(value));}
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return structuredCloneSafe(defaultState);
      const saved=JSON.parse(raw);
      return {...structuredCloneSafe(defaultState),...saved,settings:{...defaultState.settings,...saved.settings},steam:{...defaultState.steam,...saved.steam},live:{...defaultState.live,...saved.live},strategy:{...DEFAULT_STRATEGY,...saved.strategy},setupFavorites:Array.isArray(saved.setupFavorites)?saved.setupFavorites:[],guideProgress:{...defaultState.guideProgress,...saved.guideProgress},guideQuiz:{...defaultState.guideQuiz,...saved.guideQuiz}};
    }catch(err){console.warn('Storage unavailable',err);return structuredCloneSafe(defaultState);}
  }
  function saveState(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(err){toast('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РґР°РЅРЅС‹Рµ РІ Р±СЂР°СѓР·РµСЂРµ','bad');}
  }
  function esc(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function game(id){return D.games.find(x=>x.id===id)||D.games[D.games.length-1];}
  function track(id){return D.tracks.find(x=>x.id===id)||{name:'РќРµРёР·РІРµСЃС‚РЅР°СЏ С‚СЂР°СЃСЃР°',path:'M10 50 L90 50'};}
  function car(id){return D.cars.find(x=>x.id===id)||{name:'РќРµРёР·РІРµСЃС‚РЅР°СЏ РјР°С€РёРЅР°',class:'вЂ”'};}
  function profile(id=state.activeProfile){return D.profiles.find(x=>x.id===id)||D.profiles[0];}
  function formatDate(date){try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${date}T12:00:00`));}catch{return date;}}
  function today(){return new Date().toISOString().slice(0,10);}
  function lapToMs(v){
    if(typeof v==='number') return v;
    if(!v) return NaN;
    const s=String(v).trim().replace(',','.');
    const parts=s.split(':');
    if(parts.length===1) return Number(parts[0])*1000;
    const mins=Number(parts[0]); const secs=Number(parts[1]);
    return (mins*60+secs)*1000;
  }
  function msToLap(ms){
    if(!Number.isFinite(ms)||ms<0) return 'вЂ”';
    const mins=Math.floor(ms/60000); const secs=(ms-mins*60000)/1000;
    return `${mins}:${secs.toFixed(3).padStart(6,'0')}`;
  }
  function secondsToClock(sec){
    sec=Math.max(0,Math.floor(sec)); const h=Math.floor(sec/3600); const m=Math.floor((sec%3600)/60); const s=sec%60;
    return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function consistencyFromLaps(laps){
    const nums=(laps||[]).map(lapToMs).filter(Number.isFinite);
    if(nums.length<2) return 0;
    const avg=nums.reduce((a,b)=>a+b,0)/nums.length;
    const variance=nums.reduce((s,n)=>s+(n-avg)**2,0)/nums.length;
    const std=Math.sqrt(variance);
    return Math.max(0,Math.min(100,100-(std/avg*100*12)));
  }
  function trackStartPoint(path=''){
    const m=String(path).match(/M\s*([0-9.]+)\s+([0-9.]+)/i);
    return m?{x:Number(m[1]),y:Number(m[2])}:{x:18,y:68};
  }
  function trackSvg(t,color='currentColor'){
    const start=trackStartPoint(t.path);
    const markerA={x:Math.max(10,Math.min(98,start.x+14)),y:Math.max(10,Math.min(98,start.y-12))};
    const markerB={x:Math.max(10,Math.min(98,start.x+28)),y:Math.max(10,Math.min(98,start.y+8))};
    return `<svg class="track-svg" viewBox="0 0 110 110" aria-hidden="true"><path class="track-glow" pathLength="100" d="${esc(t.path)}" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".10"/><path class="track-asphalt" pathLength="100" d="${esc(t.path)}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path class="track-line" pathLength="100" d="${esc(t.path)}" fill="none" stroke="${color}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle class="track-sector-dot" cx="${markerA.x}" cy="${markerA.y}" r="2.4"/><circle class="track-sector-dot second" cx="${markerB.x}" cy="${markerB.y}" r="2.1"/><circle class="track-start" cx="${start.x}" cy="${start.y}" r="4.4"/></svg>`;
  }
  function trackTypeLabel(type){return type==='street'?'Р“РѕСЂРѕРґСЃРєР°СЏ':type==='oval'?'РћРІР°Р»':type==='drift'?'Drift':type==='historic'?'Historic':type==='mixed'?'Mixed':'Road';}
  function difficultyLabel(value){return value>=5?'Р­РєСЃРїРµСЂС‚':value>=4?'РЎР»РѕР¶РЅР°СЏ':value>=3?'РЎСЂРµРґРЅСЏСЏ':'Р›С‘РіРєР°СЏ';}
  function carIcon(c){const cls=String(c.class||'').toLowerCase();if(cls.includes('formula'))return 'Ж’';if(cls.includes('hyper')||cls.includes('gtp')||cls.includes('lmp'))return 'в†Ї';if(cls.includes('drift'))return 'в†є';if(cls.includes('tcr'))return 'FF';if(cls.includes('cup'))return 'Cup';return 'GT';}
  function uniqueSorted(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ru'));}
  function optionList(items,selected,label=x=>x.name){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(label(x))}</option>`).join('');}
  const toastQueue=[]; let toastVisible=false;
  function toast(message,type='good'){
    toastQueue.push({message,type});
    if(!toastVisible) consumeToastQueue();
  }
  function consumeToastQueue(){
    const next=toastQueue.shift();
    if(!next){toastVisible=false;return;}
    toastVisible=true;
    const el=document.createElement('div');
    el.className=`toast ${next.type}`;
    el.textContent=next.message;
    els.toastRoot.replaceChildren(el);
    setTimeout(()=>{el.remove();consumeToastQueue();},2600);
  }
  function resetPageScroll(){
    requestAnimationFrame(()=>{
      window.scrollTo(0,0);
      document.scrollingElement?.scrollTo?.(0,0);
    });
  }
  function setRoute(next,push=true){
    route=next;
    if(push){const u=new URL(location.href);u.searchParams.set('view',route);u.searchParams.delete('action');history.pushState({},'',u);}
    render();
    resetPageScroll();
  }
  function applyTheme(){document.documentElement.dataset.theme=state.theme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#090b10';}
  function updateProfileUI(){const p=profile();els.activeProfileName.textContent=p.name;els.profileAvatar.textContent=p.icon;els.profileGameHint.textContent=p.hint;}
  function renderNav(){
    els.desktopNav.innerHTML=NAV.map(n=>`<button class="nav-button ${route===n.id?'active':''}" data-route="${n.id}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span>${n.id==='sessions'?`<small>${state.sessions.length}</small>`:''}</button>`).join('');
    els.mobileNav.innerHTML=MOBILE_NAV.map(id=>{const n=NAV.find(x=>x.id===id);return `<button class="${route===id?'active':''}" data-route="${id}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span></button>`}).join('');
  }
  function render(){
    applyTheme();updateProfileUI();renderNav();
    const n=NAV.find(x=>x.id===route)||NAV[0];els.title.textContent=n.label;els.eyebrow.textContent=n.eyebrow;
    stopLiveTicker();
    const renders={dashboard:renderDashboard,sessions:renderSessions,strategy:renderStrategy,setups:renderSetups,catalog:renderCatalog,guides:renderGuides,settings:renderSettings};
    els.view.innerHTML=renders[route]();
    bindViewEnhancements();
  }

  function sessionsForProfile(){return state.sessions.filter(s=>s.profileId===state.activeProfile).sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
  function statsForProfile(){
    const sessions=sessionsForProfile();
    const laps=sessions.reduce((n,s)=>n+(Number(s.laps)||0),0);
    const clean=sessions.reduce((n,s)=>n+(Number(s.cleanLaps)||0),0);
    const focus=sessions[0]||null;
    const focusSessions=focus?sessions.filter(s=>s.track===focus.track&&s.car===focus.car&&s.game===focus.game):[];
    const best=focusSessions.map(s=>({...s,ms:lapToMs(s.bestLap)})).filter(s=>Number.isFinite(s.ms)).sort((a,b)=>a.ms-b.ms)[0];
    const consistency=sessions.length?sessions.reduce((n,s)=>n+(Number(s.consistency)||0),0)/sessions.length:0;
    const fuelUsed=sessions.reduce((n,s)=>n+Math.max(0,(Number(s.fuelStart)||0)-(Number(s.fuelEnd)||0)),0);
    return {sessions,laps,clean,best,consistency,fuelUsed,focus,focusSessions};
  }
  function renderDashboard(){
    const p=profile();const st=statsForProfile();const recent=st.sessions.slice(0,5);
    const sessionGoal=Math.min(100,Math.round(st.sessions.filter(s=>Date.now()-new Date(s.date).getTime()<7*864e5).length/p.goalSessions*100));
    const lapGoal=Math.min(100,Math.round(st.sessions.filter(s=>Date.now()-new Date(s.date).getTime()<7*864e5).reduce((a,s)=>a+(+s.laps||0),0)/p.goalLaps*100));
    const cleanPct=st.laps?Math.round(st.clean/st.laps*100):0;
    const delta=bestDelta(st.focusSessions);
    return `<div class="dashboard-grid">
      <div class="stack">
        ${renderLiveCard()}
        <div class="grid-4">
          <article class="card metric"><small>Р›РёС‡РЅС‹Р№ СЂРµРєРѕСЂРґ</small><strong>${esc(st.best?.bestLap||'вЂ”')}</strong><span>${st.best?esc(track(st.best.track).name):'Р”РѕР±Р°РІСЊС‚Рµ СЃРµСЃСЃРёСЋ'}</span></article>
          <article class="card metric"><small>РЎСЂРµРґРЅСЏСЏ СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ</small><strong>${st.consistency?st.consistency.toFixed(1)+'%':'вЂ”'}</strong><span class="${st.consistency>=90?'up':''}">${st.consistency>=90?'Р“РѕРЅРѕС‡РЅС‹Р№ С‚РµРјРї':'Р Р°Р±РѕС‚Р°Р№С‚Рµ РЅР°Рґ СЃРµСЂРёСЏРјРё'}</span></article>
          <article class="card metric"><small>РљСЂСѓРіРѕРІ Р·Р°РїРёСЃР°РЅРѕ</small><strong>${st.laps}</strong><span>${st.clean} С‡РёСЃС‚С‹С… РєСЂСѓРіРѕРІ</span></article>
          <article class="card metric"><small>РџСЂРѕРіСЂРµСЃСЃ С‚РµРјРїР°</small><strong>${delta.text}</strong><span class="${delta.good?'up':'down'}">${delta.caption}</span></article>
        </div>
        <article class="card card-pad">
          <div class="card-head"><div><h2>РџСЂРѕРіСЂРµСЃСЃ РІСЂРµРјРµРЅРё РєСЂСѓРіР°</h2><p>${st.focus?esc(track(st.focus.track).name)+' В· '+esc(car(st.focus.car).name):'Р›СѓС‡С€РёРµ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РїРѕ РґР°С‚Р°Рј'}</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Р»СѓС‡С€РёР№ РєСЂСѓРі</span></div></div>
          <div class="chart-wrap"><canvas id="progressChart"></canvas></div>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>РџРѕСЃР»РµРґРЅРёРµ СЃРµСЃСЃРёРё</h2><p>${p.name} В· Р»РѕРєР°Р»СЊРЅС‹Р№ Р¶СѓСЂРЅР°Р»</p></div><button class="link-button" data-route="sessions">Р’СЃРµ СЃРµСЃСЃРёРё</button></div>
          ${recent.length?`<div class="session-list">${recent.map(renderSessionRow).join('')}</div>`:renderEmpty('в—·','РџРѕРєР° РЅРµС‚ СЃРµСЃСЃРёР№','Р—Р°РїРёС€РёС‚Рµ РїРµСЂРІС‹Р№ Р·Р°РµР·Рґ РёР»Рё РёРјРїРѕСЂС‚РёСЂСѓР№С‚Рµ С‚РµР»РµРјРµС‚СЂРёСЋ.')}
        </article>
      </div>
      <div class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><h2>РќРµРґРµР»СЊРЅР°СЏ С†РµР»СЊ</h2><p>${p.focus} В· РїСЂРѕС„РёР»СЊ ${p.name}</p></div><span class="pill">7 РґРЅРµР№</span></div>
          <div class="rings">
            <div class="ring-wrap"><div class="ring" style="--p:${lapGoal};--ring-color:var(--accent)"><strong>${lapGoal}%</strong></div><small>РљСЂСѓРіРё</small><b>${Math.round(p.goalLaps*lapGoal/100)} / ${p.goalLaps}</b></div>
            <div class="ring-wrap"><div class="ring" style="--p:${sessionGoal};--ring-color:var(--good)"><strong>${sessionGoal}%</strong></div><small>РЎРµСЃСЃРёРё</small><b>${Math.round(p.goalSessions*sessionGoal/100)} / ${p.goalSessions}</b></div>
            <div class="ring-wrap"><div class="ring" style="--p:${cleanPct};--ring-color:var(--warn)"><strong>${cleanPct}%</strong></div><small>Р§РёСЃС‚РѕС‚Р°</small><b>${st.clean} РєСЂСѓРіРѕРІ</b></div>
          </div>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>Race engineer</h2><p>Р‘С‹СЃС‚СЂС‹Р№ СЂР°СЃС‡С‘С‚ СЃР»РµРґСѓСЋС‰РµРіРѕ Р·Р°РµР·РґР°</p></div></div>
          <div class="form-grid">
            <div class="field"><label>РўСЂР°СЃСЃР°</label><select class="select" id="quickTrack">${optionList(D.tracks,state.live.track)}</select></div>
            <div class="field"><label>Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ</label><select class="select" id="quickDuration"><option value="20">20 РјРёРЅ</option><option value="30">30 РјРёРЅ</option><option value="45">45 РјРёРЅ</option><option value="60" selected>60 РјРёРЅ</option><option value="90">90 РјРёРЅ</option></select></div>
          </div>
          <button class="primary" data-action="quick-strategy" style="width:100%;margin-top:12px">Р Р°СЃСЃС‡РёС‚Р°С‚СЊ СЃС‚СЂР°С‚РµРіРёСЋ</button>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>РЎРѕСЃС‚РѕСЏРЅРёРµ РґР°РЅРЅС‹С…</h2><p>Р›РѕРєР°Р»СЊРЅРѕ РЅР° СЌС‚РѕРј СѓСЃС‚СЂРѕР№СЃС‚РІРµ</p></div><span class="pill">Offline-ready</span></div>
          <div class="setting-row"><div><h3>${state.sessions.length} СЃРµСЃСЃРёР№</h3><p>JSON/CSV СЌРєСЃРїРѕСЂС‚ РґРѕСЃС‚СѓРїРµРЅ РІ СЂР°Р·РґРµР»Рµ В«Р•С‰С‘В».</p></div><button class="secondary" data-action="export-json">JSON</button></div>
          <div class="setting-row"><div><h3>${state.steam.profile?'Steam РїРѕРґРєР»СЋС‡С‘РЅ':'Steam РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ'}</h3><p>${state.steam.profile?esc(state.steam.profile.personaname||'РџСЂРѕС„РёР»СЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ'):'РџСЂРѕС„РёР»СЊ Рё Р±РёР±Р»РёРѕС‚РµРєР° вЂ” С‡РµСЂРµР· Р±РµР·РѕРїР°СЃРЅС‹Р№ Worker.'}</p></div><button class="secondary" data-route="settings">РћС‚РєСЂС‹С‚СЊ</button></div>
        </article>
      </div>
    </div>`;
  }
  function bestDelta(sessions){
    const sorted=sessions.map(s=>lapToMs(s.bestLap)).filter(Number.isFinite);
    if(sorted.length<2)return{text:'вЂ”',caption:'РќСѓР¶РЅРѕ 2+ СЃРµСЃСЃРёРё',good:true};
    const first=sorted[sorted.length-1],last=sorted[0],d=first-last;
    return{text:`${d>=0?'в€’':'+'}${(Math.abs(d)/1000).toFixed(2)}СЃ`,caption:d>=0?'Р‘С‹СЃС‚СЂРµРµ СЂР°РЅРЅРµРіРѕ СЂРµР·СѓР»СЊС‚Р°С‚Р°':'РџРѕСЃР»РµРґРЅРёР№ С‚РµРјРї РЅРёР¶Рµ',good:d>=0};
  }
  function renderLiveCard(){
    const l=state.live;const t=track(l.track);const c=car(l.car);const g=game(l.game);const elapsed=currentElapsed();
    return `<article class="card live-card">
      <div class="live-top"><div><span class="pill ${l.running?'live':''}">${l.running?'LIVE SESSION':'Р“РћРўРћР’ Рљ РЎРўРђР РўРЈ'}</span><p class="live-track">${esc(g.name)} В· ${esc(t.name)}</p><h2 class="live-title">${esc(c.name)}</h2></div><div style="width:100px;color:color-mix(in srgb,var(--accent) 75%,white)">${trackSvg(t,'currentColor')}</div></div>
      <div class="timer" id="liveTimer">${secondsToClock(elapsed)}</div>
      <div class="live-stats"><div class="live-stat"><small>РљСЂСѓРіРё</small><strong>${l.laps||0}</strong></div><div class="live-stat"><small>Р›СѓС‡С€РёР№</small><strong>${esc(l.best||'вЂ”')}</strong></div><div class="live-stat"><small>РџСЂРѕС„РёР»СЊ</small><strong>${esc(profile().name)}</strong></div><div class="live-stat"><small>Р РµР¶РёРј</small><strong>${l.running?'Р—Р°РїРёСЃСЊ':'РћР¶РёРґР°РЅРёРµ'}</strong></div></div>
      <div class="live-actions">${l.running?`<button class="secondary" data-action="pause-live">РџР°СѓР·Р°</button><button class="primary" data-action="finish-live">Р—Р°РІРµСЂС€РёС‚СЊ</button>`:`<button class="primary" data-action="start-live">РќР°С‡Р°С‚СЊ СЃРµСЃСЃРёСЋ</button><button class="secondary" data-action="configure-live">РќР°СЃС‚СЂРѕРёС‚СЊ</button>`}</div>
    </article>`;
  }
  function currentElapsed(){return state.live.running&&state.live.startTs?state.live.elapsed+(Date.now()-state.live.startTs)/1000:state.live.elapsed||0;}
  function startLiveTicker(){
    if(!state.live.running)return;const el=document.getElementById('liveTimer');if(!el)return;
    liveTicker=setInterval(()=>{el.textContent=secondsToClock(currentElapsed());},1000);
  }
  function stopLiveTicker(){if(liveTicker){clearInterval(liveTicker);liveTicker=null;}}

  function renderSessionRow(s){
    return `<button class="session-row" data-action="session-detail" data-id="${esc(s.id)}" style="border:0;width:100%;color:inherit;text-align:left">
      <span class="game-badge" style="color:${game(s.game).accent}">${esc(game(s.game).short)}</span>
      <span class="session-main"><strong>${esc(track(s.track).name)} В· ${esc(car(s.car).name)}</strong><small>${formatDate(s.date)} В· ${esc(s.sessionType||'РЎРµСЃСЃРёСЏ')} В· ${esc(s.weather||'')}</small></span>
      <span class="session-cell hide-mobile"><small>Р›СѓС‡С€РёР№</small><strong>${esc(s.bestLap||'вЂ”')}</strong></span>
      <span class="session-cell"><small>РЎС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ</small><strong>${Number(s.consistency||0).toFixed(1)}%</strong></span>
      <span class="session-cell hide-md"><small>РљСЂСѓРіРё</small><strong>${Number(s.laps)||0}</strong></span>
      <span class="session-cell hide-md"><small>РўРѕРїР»РёРІРѕ</small><strong>${Math.max(0,(+s.fuelStart||0)-(+s.fuelEnd||0)).toFixed(1)} Р»</strong></span>
      <span class="more-button">вЂє</span>
    </button>`;
  }
  function renderSessions(){
    const sessions=sessionsForProfile();
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="sessionSearch" placeholder="РўСЂР°СЃСЃР°, РјР°С€РёРЅР°, Р·Р°РјРµС‚РєР°"></div><select class="select" id="sessionGameFilter" style="width:auto"><option value="all">Р’СЃРµ РёРіСЂС‹</option>${optionList(D.games,'none')}</select></div><div class="toolbar-group"><button class="secondary" data-action="import-data">РРјРїРѕСЂС‚</button><button class="primary" data-action="new-session">пј‹ РќРѕРІР°СЏ СЃРµСЃСЃРёСЏ</button></div></div>
      <article class="card card-pad">
        <div class="card-head"><div><h2>Р–СѓСЂРЅР°Р» ${esc(profile().name)}</h2><p>${sessions.length} СЃРµСЃСЃРёР№ В· ${sessions.reduce((a,s)=>a+(+s.laps||0),0)} РєСЂСѓРіРѕРІ</p></div><div class="segmented" id="sessionTypeFilter"><button class="active" data-value="all">Р’СЃРµ</button><button data-value="РџСЂР°РєС‚РёРєР°">РџСЂР°РєС‚РёРєР°</button><button data-value="РљРІР°Р»РёС„РёРєР°С†РёСЏ">РљРІР°Р»РёС„РёРєР°С†РёСЏ</button><button data-value="Р“РѕРЅРєР°">Р“РѕРЅРєР°</button></div></div>
        <div id="sessionList" class="session-list">${sessions.length?sessions.map(renderSessionRow).join(''):renderEmpty('в—·','Р–СѓСЂРЅР°Р» РїСѓСЃС‚','Р”РѕР±Р°РІСЊС‚Рµ СЃРµСЃСЃРёСЋ РІСЂСѓС‡РЅСѓСЋ РёР»Рё РёРјРїРѕСЂС‚РёСЂСѓР№С‚Рµ JSON/CSV.')}</div>
      </article>`;
  }

  function renderStrategy(){
    const s=state.strategy;const results=calculateStrategies(s);
    return `<div class="strategy-layout">
      <article class="card card-pad">
        <div class="card-head"><div><h2>РџР°СЂР°РјРµС‚СЂС‹ РіРѕРЅРєРё</h2><p>Р Р°СЃС…РѕРґ, РґРµРіСЂР°РґР°С†РёСЏ, С‚СЂР°С„РёРє Рё РѕР±СЏР·Р°С‚РµР»СЊРЅС‹Рµ РѕСЃС‚Р°РЅРѕРІРєРё</p></div></div>
        <form id="strategyForm">
          <div class="form-grid">
            <div class="field"><label>Р Р°СЃС‡С‘С‚ РїРѕ</label><select class="select" name="raceMode"><option value="time" ${s.raceMode==='time'?'selected':''}>РІСЂРµРјРµРЅРё</option><option value="laps" ${s.raceMode==='laps'?'selected':''}>РєСЂСѓРіР°Рј</option></select></div>
            <div class="field"><label>${s.raceMode==='laps'?'РљСЂСѓРіРѕРІ':'Р”Р»РёС‚РµР»СЊРЅРѕСЃС‚СЊ, РјРёРЅ'}</label><input class="input" name="${s.raceMode==='laps'?'raceLaps':'duration'}" type="number" min="1" step="1" value="${s.raceMode==='laps'?s.raceLaps:s.duration}"></div>
            <div class="field"><label>РЎСЂРµРґРЅРёР№ РєСЂСѓРі</label><input class="input" name="lapTime" value="${esc(s.lapTime)}" inputmode="decimal"></div>
            <div class="field"><label>Р Р°СЃС…РѕРґ, Р»/РєСЂСѓРі</label><input class="input" name="fuelPerLap" type="number" min="0.1" step="0.01" value="${s.fuelPerLap}"></div>
            <div class="field"><label>Р‘Р°Рє, Р»</label><input class="input" name="tank" type="number" min="1" step="1" value="${s.tank}"></div>
            <div class="field"><label>РЎС‚Р°СЂС‚РѕРІРѕРµ С‚РѕРїР»РёРІРѕ, Р»</label><input class="input" name="startFuel" type="number" min="0" step="1" value="${s.startFuel}"></div>
            <div class="field"><label>РџРѕС‚РµСЂСЏ РЅР° РїРёС‚-Р»РµР№РЅРµ, СЃРµРє</label><input class="input" name="pitLoss" type="number" min="0" step="0.1" value="${s.pitLoss}"></div>
            <div class="field"><label>РћР±СЏР·Р°С‚РµР»СЊРЅС‹С… РїРёС‚-СЃС‚РѕРїРѕРІ</label><input class="input" name="mandatoryStops" type="number" min="0" max="8" step="1" value="${s.mandatoryStops}"></div>
            <div class="field"><label>Р РµСЃСѓСЂСЃ РєРѕРјРїР»РµРєС‚Р°, РєСЂСѓРіРѕРІ</label><input class="input" name="tyreLife" type="number" min="1" step="1" value="${s.tyreLife}"></div>
            <div class="field"><label>РўСЂР°С„РёРє</label><select class="select" name="traffic"><option value="0" ${+s.traffic===0?'selected':''}>Р§РёСЃС‚Р°СЏ С‚СЂР°СЃСЃР°</option><option value="4" ${+s.traffic===4?'selected':''}>РЈРјРµСЂРµРЅРЅС‹Р№</option><option value="9" ${+s.traffic===9?'selected':''}>РџР»РѕС‚РЅС‹Р№</option></select></div>
            <div class="field"><label>РџРѕРіРѕРґР°</label><select class="select" name="weather"><option value="dry" ${s.weather==='dry'?'selected':''}>РЎСѓС…Рѕ</option><option value="mixed" ${s.weather==='mixed'?'selected':''}>РџРµСЂРµРјРµРЅРЅРѕ</option><option value="wet" ${s.weather==='wet'?'selected':''}>Р”РѕР¶РґСЊ</option></select></div>
            <div class="field"><label>РџСЂРµРґРїРѕС‡С‚РёС‚РµР»СЊРЅС‹Р№ СЃРѕСЃС‚Р°РІ</label><select class="select" name="compound"><option value="soft" ${s.compound==='soft'?'selected':''}>Soft</option><option value="medium" ${s.compound==='medium'?'selected':''}>Medium</option><option value="hard" ${s.compound==='hard'?'selected':''}>Hard</option></select></div>
          </div>
          <button class="primary" style="width:100%;margin-top:16px">РџРµСЂРµСЃС‡РёС‚Р°С‚СЊ</button>
        </form>
      </article>
      <div class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><h2>Р’Р°СЂРёР°РЅС‚С‹ СЃС‚СЂР°С‚РµРіРёРё</h2><p>${results.meta.laps} РєСЂСѓРіРѕРІ В· ${results.meta.fuel.toFixed(1)} Р» СЃ СЂРµР·РµСЂРІРѕРј В· РѕРєРЅРѕ РїРёС‚-СЃС‚РѕРїР° ${results.meta.window}</p></div><span class="pill">${results.meta.weather}</span></div>
          <div class="strategy-results">${results.items.map((r,i)=>renderStrategyCard(r,i===0)).join('')}</div>
        </article>
        <div class="grid-3">
          <article class="card metric"><small>РўРѕРїР»РёРІРѕ РЅР° РіРѕРЅРєСѓ</small><strong>${results.meta.fuel.toFixed(1)} Р»</strong><span>РІРєР»СЋС‡Р°СЏ СЂРµР·РµСЂРІ 1.5 РєСЂСѓРіР°</span></article>
          <article class="card metric"><small>РњРёРЅРёРјСѓРј РѕСЃС‚Р°РЅРѕРІРѕРє</small><strong>${results.meta.minStops}</strong><span>Р±Р°Рє + СЂРµСЃСѓСЂСЃ С€РёРЅ</span></article>
          <article class="card metric"><small>Р¦РµРЅР° С‚СЂР°С„РёРєР°</small><strong>+${results.meta.trafficLoss.toFixed(1)}СЃ</strong><span>РѕС†РµРЅРєР° РґР»СЏ РІС‹Р±СЂР°РЅРЅРѕР№ РїР»РѕС‚РЅРѕСЃС‚Рё</span></article>
        </div>
      </div>
    </div>`;
  }
  function calculateStrategies(input){
    const lapMs=lapToMs(input.lapTime)||120000;const lapSec=lapMs/1000;
    const laps=input.raceMode==='laps'?Math.max(1,Math.round(+input.raceLaps||1)):Math.max(1,Math.ceil((+input.duration||1)*60/lapSec));
    const fuelPer=Math.max(.01,+input.fuelPerLap||1);const fuel=laps*fuelPer+fuelPer*1.5;const tank=Math.max(1,+input.tank||1);
    const fuelStops=Math.max(0,Math.ceil(fuel/tank)-1);const tyreStops=Math.max(0,Math.ceil(laps/Math.max(1,+input.tyreLife||1))-1);const minStops=Math.max(+input.mandatoryStops||0,fuelStops,tyreStops);
    const pitLoss=Math.max(0,+input.pitLoss||0);const traffic=+input.traffic||0;const weather=input.weather==='wet'?'Р”РѕР¶РґСЊ':input.weather==='mixed'?'РџРµСЂРµРјРµРЅРЅРѕ':'РЎСѓС…Рѕ';
    const make=(name,stops,compounds,risk,pacePenalty,note)=>{
      stops=Math.max(minStops,stops);const stints=splitLaps(laps,stops+1);const degPenalty=stints.reduce((sum,n,idx)=>sum+Math.max(0,n-(+input.tyreLife||20)*compoundLife(compounds[idx]||compounds.at(-1)))*1.05,0);
      const total=laps*lapSec+stops*pitLoss+pacePenalty*laps+degPenalty+traffic*(stops?0.7:1.15);
      return {name,stops,compounds,stints,risk,total,note,degPenalty};
    };
    const base=String(input.compound||'medium');
    const candidates=[
      make('РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅР°СЏ',minStops,[base,...Array(minStops).fill(base==='soft'?'medium':base)],'РќРёР·РєРёР№',base==='hard'?0.7:base==='soft'?-0.25:0,'РќР°РґС‘Р¶РЅРѕРµ РѕРєРЅРѕ РїРёС‚-СЃС‚РѕРїР° Рё РЅРµР±РѕР»СЊС€РѕР№ СЂРёСЃРє РїРµСЂРµРіСЂРµРІР° С€РёРЅ.'),
      make('РђС‚Р°РєР° С‚РµРјРїР°',Math.max(1,minStops+1),Array(Math.max(2,minStops+2)).fill(input.weather==='wet'?'wet':'soft'),'РЎСЂРµРґРЅРёР№',-0.45,'РљРѕСЂРѕС‚РєРёРµ СЃС‚РёРЅС‚С‹, Р±С‹СЃС‚СЂС‹Рµ РєСЂСѓРіРё Рё Р±РѕР»СЊС€Рµ СЃРІРѕР±РѕРґС‹ РґР»СЏ Р°РЅРґРµСЂРєР°С‚Р°.'),
      make('Р”Р»РёРЅРЅС‹Р№ РїРµСЂРІС‹Р№ СЃС‚РёРЅС‚',minStops,[input.weather==='wet'?'wet':'hard',...Array(minStops).fill('medium')],'РЎСЂРµРґРЅРёР№',0.42,'РџРѕР»РµР·РЅРѕ РїСЂРё СЃС‚Р°СЂС‚Рµ РІ С‚СЂР°С„РёРєРµ РёР»Рё РѕР¶РёРґР°РµРјРѕРј СЂР°РЅРЅРµРј Safety Car.'),
      make('РњРёРЅРёРјСѓРј РїРёС‚-Р»РµР№РЅР°',minStops,[input.weather==='wet'?'wet':'hard',...Array(minStops).fill('hard')],'Р’С‹СЃРѕРєРёР№',0.85,'РњРёРЅРёРјСѓРј РѕСЃС‚Р°РЅРѕРІРѕРє, РЅРѕ Р±РѕР»СЊС€Рµ РґРµРіСЂР°РґР°С†РёРё Рё С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅРѕСЃС‚СЊ Рє С‚РµРјРїРµСЂР°С‚СѓСЂРµ.')
    ].sort((a,b)=>a.total-b.total);
    const firstStop=candidates[0].stints[0];const window=`${Math.max(1,firstStop-2)}вЂ“${Math.min(laps-1,firstStop+2)} РєСЂСѓРі`;
    return {items:candidates,meta:{laps,fuel,minStops,trafficLoss:traffic*(minStops?0.7:1.15),window,weather}};
  }
  function splitLaps(laps,parts){const base=Math.floor(laps/parts),rem=laps%parts;return Array.from({length:parts},(_,i)=>base+(i<rem?1:0));}
  function compoundLife(c){return c==='soft'?.78:c==='hard'?1.3:c==='wet'?1.15:1;}
  function renderStrategyCard(r,recommended){
    const colors={soft:'',medium:'medium',hard:'hard',wet:'wet'};
    return `<div class="strategy-card ${recommended?'recommended':''}">${recommended?'<span class="recommend">Р РµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ</span>':''}<div class="strategy-title"><div><h3>${esc(r.name)}</h3><span class="pill" style="margin-top:7px">Р РёСЃРє: ${esc(r.risk)}</span></div><strong>${secondsToClock(r.total)}</strong></div><div class="stints">${r.stints.map((n,i)=>`<span class="stint ${colors[r.compounds[i]||r.compounds.at(-1)]||''}" style="--stint:${n}" title="${n} РєСЂСѓРіРѕРІ"></span>`).join('')}</div><div class="strategy-meta"><div><small>РћСЃС‚Р°РЅРѕРІРєРё</small><strong>${r.stops}</strong></div><div><small>РЎС‚РёРЅС‚С‹</small><strong>${r.stints.join(' / ')}</strong></div><div><small>РЎРѕСЃС‚Р°РІС‹</small><strong>${r.compounds.slice(0,r.stints.length).map(x=>x[0].toUpperCase()).join(' в†’ ')}</strong></div><div><small>Р”РµРіСЂР°РґР°С†РёСЏ</small><strong>+${r.degPenalty.toFixed(1)}СЃ</strong></div></div><p class="strategy-note">${esc(r.note)}</p></div>`;
  }

  function setupPool(mode=setupViewMode){
    return mode==='library'?(D.setupLibrary||[]):state.setups.filter(s=>s.profileId===state.activeProfile);
  }
  function weatherLabel(value){return value==='wet'?'Р”РѕР¶РґСЊ':value==='hot'?'Р–Р°СЂР°':value==='mixed'?'РџРµСЂРµРјРµРЅРЅРѕ':'РЎСѓС…Рѕ';}
  function renderSetups(){
    const mine=state.setups.filter(s=>s.profileId===state.activeProfile).length;
    const library=(D.setupLibrary||[]).length;
    const pool=setupPool();
    return `<div class="garage-hero card"><div><p class="eyebrow">Setup Garage Pro</p><h2>Р‘РёР±Р»РёРѕС‚РµРєР° Рё РІРµСЂСЃРёРё СЃРµС‚Р°РїРѕРІ</h2><p>Р¤РёР»СЊС‚СЂСѓР№ РїРѕ СЃРёРјСѓР»СЏС‚РѕСЂСѓ, С‚СЂР°СЃСЃРµ, РјР°С€РёРЅРµ Рё РїРѕРіРѕРґРµ. РљРѕРїРёСЂСѓР№ Р±Р°Р·РѕРІС‹Рµ СЃРµС‚Р°РїС‹, СЃСЂР°РІРЅРёРІР°Р№ РёР·РјРµРЅРµРЅРёСЏ Рё РѕС‚РєР°С‚С‹РІР°Р№ РІРµСЂСЃРёРё.</p></div><div class="garage-stats"><span><b>${mine}</b> РјРѕРёС…</span><span><b>${library}</b> РІ Р±РёР±Р»РёРѕС‚РµРєРµ</span><span><b>${state.setupFavorites.length}</b> РёР·Р±СЂР°РЅРЅС‹С…</span></div></div>
      <div class="toolbar garage-toolbar"><div class="toolbar-group"><div class="search"><input id="setupSearch" placeholder="РќР°Р·РІР°РЅРёРµ, С‚СЂР°СЃСЃР°, РјР°С€РёРЅР° РёР»Рё С‚РµРі"></div><div class="segmented" id="setupMode"><button class="${setupViewMode==='mine'?'active':''}" data-value="mine">РњРѕРё</button><button class="${setupViewMode==='library'?'active':''}" data-value="library">Р‘РёР±Р»РёРѕС‚РµРєР°</button></div></div><div class="toolbar-group"><select class="select compact-select" id="setupGame"><option value="all">Р’СЃРµ РёРіСЂС‹</option>${optionList(D.games,'none')}</select><select class="select compact-select" id="setupTrack"><option value="all">Р’СЃРµ С‚СЂР°СЃСЃС‹</option>${optionList(D.tracks,'none')}</select><select class="select compact-select" id="setupWeather"><option value="all">Р›СЋР±Р°СЏ РїРѕРіРѕРґР°</option><option value="dry">РЎСѓС…Рѕ</option><option value="wet">Р”РѕР¶РґСЊ</option><option value="hot">Р–Р°СЂР°</option><option value="mixed">РџРµСЂРµРјРµРЅРЅРѕ</option></select><button class="secondary favorite-filter ${setupOnlyFavorites?'active':''}" id="setupFavoritesFilter">в… РР·Р±СЂР°РЅРЅРѕРµ</button></div><div class="toolbar-group"><button class="secondary" data-action="compare-setups">РЎСЂР°РІРЅРёС‚СЊ</button><button class="primary" data-action="new-setup">пј‹ РќРѕРІС‹Р№ СЃРµС‚Р°Рї</button></div></div>
      <div id="setupGrid" class="setup-grid pro">${pool.length?pool.map(s=>renderSetupCard(s,setupViewMode)).join(''):renderEmpty('вЊ','РќРµС‚ СЃРµС‚Р°РїРѕРІ','РЎРѕР·РґР°Р№ СЃРµС‚Р°Рї РёР»Рё РѕС‚РєСЂРѕР№ Р±РёР±Р»РёРѕС‚РµРєСѓ РіРѕС‚РѕРІС‹С… Р±Р°Р·РѕРІС‹С… РєРѕРЅС„РёРіСѓСЂР°С†РёР№.')}</div>`;
  }
  function renderSetupCard(s,source=setupViewMode){
    const v=s.values||{};const favorite=state.setupFavorites.includes(s.id);const analysis=analyzeSetup(s);const history=(s.history||[]).length;
    return `<article class="setup-card-wrap"><button class="setup-card pro" data-action="setup-detail" data-id="${esc(s.id)}" data-source="${source}" style="text-align:left;color:inherit"><div class="setup-card-top"><span class="game-badge" style="width:38px;height:38px;color:${game(s.game).accent}">${esc(game(s.game).short)}</span><div class="setup-rating"><span>в… ${Number(s.rating||4.5).toFixed(1)}</span><small>${source==='library'?`${s.downloads||0} РєРѕРїРёР№`:`v${history+1}`}</small></div></div><h3>${esc(s.name)}</h3><p>${esc(track(s.track).name)} В· ${esc(car(s.car).name)}</p><div class="tags"><span class="tag weather-${esc(s.weather||'dry')}">${weatherLabel(s.weather||'dry')}</span>${(s.tags||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><div class="setup-mini"><div><small>РљСЂС‹Р»Рѕ</small><strong>${v.frontWing??'вЂ”'} / ${v.rearWing??'вЂ”'}</strong></div><div><small>Р”Р°РІР»РµРЅРёРµ</small><strong>${v.frontPressure??'вЂ”'} / ${v.rearPressure??'вЂ”'}</strong></div><div><small>Р‘Р°Р»Р°РЅСЃ</small><strong>${v.brakeBias??'вЂ”'}%</strong></div></div><div class="setup-analysis-preview"><span class="analysis-dot ${analysis.tone}"></span><span>${esc(analysis.summary)}</span></div></button><button class="setup-favorite ${favorite?'active':''}" data-action="toggle-setup-favorite" data-id="${esc(s.id)}" aria-label="РР·Р±СЂР°РЅРЅРѕРµ">${favorite?'в…':'в†'}</button></article>`;
  }

  function renderCatalog(){
    const trackTypes=uniqueSorted(D.tracks.map(t=>t.type)).map(type=>`<option value="${esc(type)}">${trackTypeLabel(type)}</option>`).join('');
    return `<div class="catalog-hero card"><div><p class="eyebrow">Tracks & Cars Library</p><h2>РљР°С‚Р°Р»РѕРі СЃС‚Р°Р» СЂР°Р±РѕС‡РёРј РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРј</h2><p>РљР°СЂС‚РѕС‡РєРё С‚СЂР°СЃСЃ С‚РµРїРµСЂСЊ РїРѕРєР°Р·С‹РІР°СЋС‚ С‚РёРї, СЃР»РѕР¶РЅРѕСЃС‚СЊ, РєРѕРЅС„РёРіСѓСЂР°С†РёРё Рё РґРѕСЃС‚СѓРїРЅС‹Рµ СЃРёРјСѓР»СЏС‚РѕСЂС‹. РђРІС‚РѕРјРѕР±РёР»Рё РјРѕР¶РЅРѕ С„РёР»СЊС‚СЂРѕРІР°С‚СЊ РїРѕ РєР»Р°СЃСЃСѓ Рё СЃСЂР°Р·Сѓ РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ РґР»СЏ РЅРѕРІРѕР№ СЃРµСЃСЃРёРё.</p></div><div class="catalog-hero-stats"><span><b>${D.tracks.length}</b> С‚СЂР°СЃСЃ</span><span><b>${D.cars.length}</b> РјР°С€РёРЅ</span><span><b>${D.guides.length}</b> РіР°Р№РґРѕРІ</span></div></div><div class="toolbar catalog-toolbar"><div class="toolbar-group"><div class="search"><input id="catalogSearch" placeholder="РќР°Р№С‚Рё С‚СЂР°СЃСЃСѓ, СЃС‚СЂР°РЅСѓ, РєР»Р°СЃСЃ РёР»Рё Р°РІС‚РѕРјРѕР±РёР»СЊ"></div><div class="segmented" id="catalogMode"><button class="active" data-value="tracks">РўСЂР°СЃСЃС‹</button><button data-value="cars">РђРІС‚РѕРјРѕР±РёР»Рё</button></div></div><div class="toolbar-group"><select class="select compact-select" id="catalogGame"><option value="all">Р’СЃРµ РёРіСЂС‹</option>${optionList(D.games,'none')}</select><select class="select compact-select" id="catalogKind"><option value="all">Р’СЃРµ С‚РёРїС‹</option>${trackTypes}</select></div></div><div id="catalogGrid" class="catalog-grid">${D.tracks.map(renderTrackCard).join('')}</div>`;
  }
  function renderTrackCard(t){const hasGuide=D.guides.some(g=>g.track===t.id);return `<button class="catalog-card catalog-card--track" data-action="catalog-track" data-id="${esc(t.id)}" style="text-align:left;color:inherit"><div class="catalog-visual catalog-visual--track" style="color:var(--text)"><span class="catalog-badge">${trackTypeLabel(t.type)}</span><span class="catalog-guide-flag">${hasGuide?'Р“Р°Р№Рґ':'РЎС…РµРјР°'}</span><div class="track-frame">${trackSvg(t,'currentColor')}</div><div class="track-visual-meta"><span>${t.length.toFixed(3)} РєРј</span><span>${t.corners} РїРѕРІ.</span></div></div><div class="catalog-content"><div class="catalog-title-row"><h3>${esc(t.name)}</h3><span class="difficulty-pill diff-${Math.min(5,t.difficulty)}">${difficultyLabel(t.difficulty)}</span></div><p>${esc(t.country)} В· ${t.configs.slice(0,3).join(' / ')}${t.configs.length>3?' / +'+(t.configs.length-3):''}</p><div class="track-card-footer"><span>${t.games.map(id=>game(id).short).slice(0,4).join(' В· ')}</span><span class="dot-rating" aria-label="РЎР»РѕР¶РЅРѕСЃС‚СЊ ${t.difficulty} РёР· 5">${Array.from({length:5},(_,i)=>`<i class="${i<t.difficulty?'on':''}"></i>`).join('')}</span></div></div></button>`;}
  function renderCarCard(c){const pwr=Math.round(c.power/c.weight*1000);return `<button class="catalog-card catalog-card--car" data-action="catalog-car" data-id="${esc(c.id)}" style="text-align:left;color:inherit"><div class="catalog-visual catalog-visual--car"><span class="catalog-badge">${esc(c.class)}</span><div class="car-visual"><span class="car-type">${esc(carIcon(c))}</span><span class="car-shadow"></span></div><div class="track-visual-meta"><span>${c.drivetrain}</span><span>${pwr} Р».СЃ./С‚</span></div></div><div class="catalog-content"><div class="catalog-title-row"><h3>${esc(c.name)}</h3><span class="difficulty-pill">${esc(c.drivetrain)}</span></div><p>${esc(c.class)} В· ${c.power} Р».СЃ. В· ${c.weight} РєРі</p><div class="track-card-footer"><span>${c.games.map(id=>game(id).short).slice(0,5).join(' В· ')}</span><span class="link-button">РћС‚РєСЂС‹С‚СЊ в†’</span></div></div></button>`;}

  function guideCompletion(id){const done=state.guideProgress[id]||[];const guide=D.guides.find(g=>g.track===id);return guide?.checklist?.length?Math.round(done.filter(Boolean).length/guide.checklist.length*100):0;}
  function renderGuides(){
    const completed=D.guides.filter(g=>guideCompletion(g.track)===100).length;
    const avg=D.guides.length?Math.round(D.guides.reduce((sum,g)=>sum+guideCompletion(g.track),0)/D.guides.length):0;
    return `<div class="academy-hero card"><div class="academy-hero-copy"><p class="eyebrow">Track Academy</p><h2>РџРѕРЅСЏС‚РЅС‹Р№ РїР»Р°РЅ С‚СЂРµРЅРёСЂРѕРІРєРё РЅР° РєР°Р¶РґРѕР№ С‚СЂР°СЃСЃРµ</h2><p>Р’С‹Р±РµСЂРё С‚СЂР°СЃСЃСѓ, СЂР°Р·РѕРіСЂРµР№ С€РёРЅС‹, РѕС‚СЂР°Р±РѕС‚Р°Р№ РѕРґРЅСѓ РєР»СЋС‡РµРІСѓСЋ Р·РѕРЅСѓ Рё С‚РѕР»СЊРєРѕ Р·Р°С‚РµРј СЃРѕР±РёСЂР°Р№ СЃРµСЂРёСЋ С‡РёСЃС‚С‹С… РєСЂСѓРіРѕРІ.</p><div class="academy-howto"><span><b>1</b><em>3 РєСЂСѓРіР°<br><small>СЂР°Р·РјРёРЅРєР°</small></em></span><span><b>2</b><em>1 Р·РѕРЅР°<br><small>С„РѕРєСѓСЃ</small></em></span><span><b>3</b><em>5 РєСЂСѓРіРѕРІ<br><small>СЃРµСЂРёСЏ</small></em></span></div></div><div class="academy-progress" style="--academy-p:${avg}%"><strong>${avg}%</strong><span>РѕР±С‰РёР№ РїСЂРѕРіСЂРµСЃСЃ</span><small>${completed} РіР°Р№РґРѕРІ Р·Р°РІРµСЂС€РµРЅРѕ</small></div></div><div class="toolbar guide-toolbar"><div class="toolbar-group"><div class="search"><input id="guideSearch" placeholder="РўСЂР°СЃСЃР° РёР»Рё РЅР°Р·РІР°РЅРёРµ РїРѕРІРѕСЂРѕС‚Р°"></div><select class="select compact-select" id="guideLevel"><option value="all">Р›СЋР±Р°СЏ СЃР»РѕР¶РЅРѕСЃС‚СЊ</option><option value="РЎСЂРµРґРЅРёР№">РЎСЂРµРґРЅРёР№</option><option value="РџСЂРѕРґРІРёРЅСѓС‚С‹Р№">РџСЂРѕРґРІРёРЅСѓС‚С‹Р№</option><option value="Р­РєСЃРїРµСЂС‚">Р­РєСЃРїРµСЂС‚</option></select></div><span class="pill">${D.guides.length} С‚СЂР°СЃСЃ В· С„РѕС‚Рѕ Рё СЃС…РµРјР°</span></div><div id="guideGrid" class="guide-grid">${D.guides.map(renderGuideCard).join('')}</div>`;
  }
  function renderGuideCard(g){
    const t=track(g.track),progress=guideCompletion(g.track),quiz=state.guideQuiz[g.track],cover=g.photo||g.cover||'',hasCover=Boolean(cover);
    const hero=hasCover?`<div class="guide-photo"><img class="guide-photo-img" src="${esc(cover)}" alt="РўСЂРµРєРѕРІР°СЏ РѕР±Р»РѕР¶РєР° ${esc(t.name)}" loading="lazy" decoding="async" onerror="this.closest('.guide-photo').classList.add('guide-photo--schematic');this.remove()"><span class="guide-level">${esc(g.level)}</span><span class="guide-country">${esc(t.country)}</span><div class="guide-map" aria-hidden="true">${trackSvg(t,'#ffffff')}</div></div>`:`<div class="guide-photo guide-photo--schematic"><span class="guide-level">${esc(g.level)}</span><div class="guide-blueprint"><div class="guide-blueprint-copy"><p class="guide-kicker">Track Academy</p><h4>${esc(t.name)}</h4><div class="guide-blueprint-meta">${esc(t.country)} вЂў ${t.length.toFixed(3)} РєРј вЂў ${t.corners} РїРѕРІРѕСЂРѕС‚РѕРІ</div></div><div class="guide-map guide-map--large" aria-hidden="true">${trackSvg(t,'#ffffff')}</div></div></div>`;
    return `<button type="button" class="guide-card" data-action="guide-detail" data-id="${g.track}" style="text-align:left;color:inherit">${hero}<div class="guide-content"><div class="guide-title-row"><h3>${esc(t.name)}</h3>${quiz?`<span class="quiz-score">РўРµСЃС‚ ${quiz.score}/${quiz.total}</span>`:''}</div><p>${esc(g.summary)}</p><div class="guide-card-focus"><small>РџРµСЂРІР°СЏ С†РµР»СЊ</small><strong>${esc(g.primaryGoal||`РћС‚СЂР°Р±РѕС‚Р°С‚СЊ ${g.sectors[0]?.name||'РєР»СЋС‡РµРІСѓСЋ Р·РѕРЅСѓ'}`)}</strong></div><div class="guide-card-meta"><span>${g.sectors.length} РєР»СЋС‡РµРІС‹С… Р·РѕРЅ</span><span>${esc(g.sessionPlan||'3 + 5 РєСЂСѓРіРѕРІ')}</span></div><div class="guide-progress" aria-label="РџСЂРѕРіСЂРµСЃСЃ ${progress}%"><span style="width:${progress}%"></span></div><div class="guide-actions"><span class="corner-count">РџСЂРѕРіСЂРµСЃСЃ ${progress}%</span><span class="link-button">РћС‚РєСЂС‹С‚СЊ РїР»Р°РЅ в†’</span></div></div></button>`;
  }

  function renderSettings(){
    const p=profile();
    return `<div class="settings-grid">
      <div class="stack">
        <article class="card setting-card"><div class="card-head"><div><h2>РџСЂРѕС„РёР»Рё РїРёР»РѕС‚Р°</h2><p>Р Р°Р·РґРµР»СЊРЅС‹Рµ С†РµР»Рё, СЃРµСЃСЃРёРё Рё СЃРµС‚Р°РїС‹</p></div></div><div class="grid-2">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===p.id?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} В· ${x.focus}</small></span><span>${x.id===p.id?'вњ“':'вЂє'}</span></button>`).join('')}</div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Р’РёР·СѓР°Р»СЊРЅС‹Рµ С‚РµРјС‹</h2><p>РџСЂРёРјРµРЅСЏСЋС‚СЃСЏ РєРѕ РІСЃРµРјСѓ РёРЅС‚РµСЂС„РµР№СЃСѓ Рё PWA</p></div></div><div class="theme-grid">${D.themes.map(t=>`<button class="theme-option ${state.theme===t.id?'active':''}" data-action="set-theme" data-id="${t.id}"><span class="theme-swatch" style="--swatch:${t.preview};--swatch-accent:${t.accent}"></span><strong>${esc(t.name)}</strong></button>`).join('')}</div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Р”Р°РЅРЅС‹Рµ</h2><p>Р­РєСЃРїРѕСЂС‚, РёРјРїРѕСЂС‚ Рё СЂРµР·РµСЂРІРЅР°СЏ РєРѕРїРёСЏ</p></div></div>
          <div class="setting-row"><div><h3>РџРѕР»РЅР°СЏ РєРѕРїРёСЏ JSON</h3><p>РЎРµСЃСЃРёРё, СЃРµС‚Р°РїС‹, РїСЂРѕС„РёР»Рё Рё РЅР°СЃС‚СЂРѕР№РєРё.</p></div><button class="secondary" data-action="export-json">РЎРєР°С‡Р°С‚СЊ</button></div>
          <div class="setting-row"><div><h3>РўР°Р±Р»РёС†Р° СЃРµСЃСЃРёР№ CSV</h3><p>Р”Р»СЏ Excel, Numbers Рё Р°РЅР°Р»РёР·Р° РІ Python.</p></div><button class="secondary" data-action="export-csv">РЎРєР°С‡Р°С‚СЊ</button></div>
          <div class="setting-row"><div><h3>РРјРїРѕСЂС‚ РґР°РЅРЅС‹С…</h3><p>SimGrid JSON РёР»Рё CSV СЃ РєРѕР»РѕРЅРєР°РјРё РІСЂРµРјРµРЅРё РєСЂСѓРіР°.</p></div><button class="secondary" data-action="import-data">Р’С‹Р±СЂР°С‚СЊ</button></div>
        </article>
      </div>
      <div class="stack">
        <article class="card setting-card"><div class="steam-panel"><div class="steam-logo"><span>в—‰</span><div><h3>${state.steam.profile?esc(state.steam.profile.personaname):'Steam Connector'}</h3><p style="margin:3px 0 0">${state.steam.lastSync?'РџРѕСЃР»РµРґРЅСЏСЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ '+new Date(state.steam.lastSync).toLocaleString('ru-RU'):'Р‘РµР·РѕРїР°СЃРЅР°СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ РїСЂРѕС„РёР»СЏ Рё РёРіСЂ'}</p></div></div>
          <p>Steam РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РґР»СЏ РѕРїСЂРµРґРµР»РµРЅРёСЏ РїСЂРѕС„РёР»СЏ, Р±РёР±Р»РёРѕС‚РµРєРё Рё РЅРµРґР°РІРЅРѕ Р·Р°РїСѓС‰РµРЅРЅРѕРіРѕ СЃРёРјСѓР»СЏС‚РѕСЂР°. Р’СЂРµРјРµРЅР° РєСЂСѓРіРѕРІ Рё СЃРµС‚Р°РїС‹ РёРјРїРѕСЂС‚РёСЂСѓСЋС‚СЃСЏ РёР· С‚РµР»РµРјРµС‚СЂРёРё РёРіСЂС‹: Steam РёС… РЅРµ С…СЂР°РЅРёС‚.</p>
          ${state.steam.profile?.avatarfull?`<div style="display:flex;gap:12px;align-items:center;margin:13px 0"><img src="${esc(state.steam.profile.avatarfull)}" alt="" style="width:54px;height:54px;border-radius:14px"><div><strong>${esc(state.steam.profile.personaname||'Steam')}</strong><small style="display:block;color:#9eaac0;margin-top:4px">${state.steam.ownedGames.length} РёРіСЂ РїРѕР»СѓС‡РµРЅРѕ</small></div></div>`:''}
          <button class="primary" data-action="steam-connect" style="width:100%">${state.steam.profile?'РћР±РЅРѕРІРёС‚СЊ Steam':'РќР°СЃС‚СЂРѕРёС‚СЊ Steam'}</button>
        </div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>РўРµР»РµРјРµС‚СЂРёСЏ СЃ РџРљ</h2><p>ACC, iRacing, F1 Рё СЃРѕРІРјРµСЃС‚РёРјС‹Рµ РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹</p></div></div><div class="notice">iOS PWA РЅРµ РјРѕР¶РµС‚ РЅР°РїСЂСЏРјСѓСЋ С‡РёС‚Р°С‚СЊ РїР°РјСЏС‚СЊ РёР»Рё UDP РёРіСЂРѕРІРѕРіРѕ РџРљ. РџР°РїРєР° <b>telemetry-bridge</b> РІ Р°СЂС…РёРІРµ СЃРѕРґРµСЂР¶РёС‚ С„РѕСЂРјР°С‚ РёРјРїРѕСЂС‚Р° Рё Р»РѕРєР°Р»СЊРЅС‹Р№ РєРѕРЅРІРµСЂС‚РµСЂ. Р РµР·СѓР»СЊС‚Р°С‚ РїРµСЂРµРЅРѕСЃРёС‚СЃСЏ РІ РїСЂРёР»РѕР¶РµРЅРёРµ РѕРґРЅРёРј JSON-С„Р°Р№Р»РѕРј.</div><div class="setting-row"><div><h3>РРјРїРѕСЂС‚ РїРѕСЃР»РµРґРЅРµР№ СЃРµСЃСЃРёРё</h3><p>РџРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ SimGrid JSON Рё СѓРЅРёРІРµСЂСЃР°Р»СЊРЅС‹Р№ CSV.</p></div><button class="secondary" data-action="import-data">РРјРїРѕСЂС‚</button></div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>РџСЂРёР»РѕР¶РµРЅРёРµ</h2><p>Р›РѕРєР°Р»СЊРЅС‹Рµ РїР°СЂР°РјРµС‚СЂС‹</p></div></div>
          <div class="setting-row"><div><h3>РЎР±СЂРѕСЃ РґРµРјРѕ-РґР°РЅРЅС‹С…</h3><p>Р’РµСЂРЅСѓС‚СЊ С‚СЂРё РїСЂРёРјРµСЂР° СЃРµСЃСЃРёР№ Рё СЃРµС‚Р°РїРѕРІ.</p></div><button class="secondary" data-action="restore-demo">Р’РµСЂРЅСѓС‚СЊ</button></div>
          <div class="setting-row"><div><h3>РћС‡РёСЃС‚РёС‚СЊ РІСЃС‘</h3><p>РЈРґР°Р»РёС‚СЊ Р»РѕРєР°Р»СЊРЅС‹Рµ СЃРµСЃСЃРёРё, СЃРµС‚Р°РїС‹ Рё РЅР°СЃС‚СЂРѕР№РєРё Steam.</p></div><button class="danger-button" data-action="clear-data">РћС‡РёСЃС‚РёС‚СЊ</button></div>
        </article>
      </div>
    </div>`;
  }

  function renderEmpty(icon,title,text){return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;}
  function bindViewEnhancements(){
    if(route==='dashboard'){drawProgressChart();startLiveTicker();}
    if(route==='sessions')bindSessionFilters();
    if(route==='setups')bindSetupFilter();
    if(route==='catalog')bindCatalog();
    if(route==='guides')bindGuideFilter();
  }
  function drawProgressChart(){
    const canvas=document.getElementById('progressChart');if(!canvas)return;const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height,pad={l:46,r:16,t:18,b:28};const all=sessionsForProfile();const focus=all[0];const rows=(focus?all.filter(s=>s.track===focus.track&&s.car===focus.car&&s.game===focus.game):[]).slice().reverse().map(s=>({date:s.date,v:lapToMs(s.bestLap)})).filter(x=>Number.isFinite(x.v)).slice(-12);
    ctx.clearRect(0,0,w,h);const line=getCss('--line-strong'),muted=getCss('--muted'),accent=getCss('--accent'),panel=getCss('--panel2');ctx.font='10px -apple-system';ctx.fillStyle=muted;
    if(rows.length<2){ctx.textAlign='center';ctx.fillText('Р”РѕР±Р°РІСЊС‚Рµ РјРёРЅРёРјСѓРј РґРІРµ СЃРµСЃСЃРёРё РґР»СЏ РіСЂР°С„РёРєР°',w/2,h/2);return;}
    let min=Math.min(...rows.map(x=>x.v)),max=Math.max(...rows.map(x=>x.v));const range=Math.max(1000,max-min);min-=range*.18;max+=range*.18;
    for(let i=0;i<5;i++){const y=pad.t+(h-pad.t-pad.b)*i/4;ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(msToLap(max-(max-min)*i/4).slice(0,-1),pad.l-8,y+3);}
    const pts=rows.map((r,i)=>({x:pad.l+(w-pad.l-pad.r)*i/(rows.length-1),y:pad.t+(h-pad.t-pad.b)*(r.v-min)/(max-min),...r}));
    const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,colorAlpha(accent,.32));grad.addColorStop(1,colorAlpha(accent,0));ctx.beginPath();ctx.moveTo(pts[0].x,h-pad.b);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts.at(-1).x,h-pad.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
    pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=panel;ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();if(i===0||i===pts.length-1){ctx.fillStyle=muted;ctx.textAlign=i===0?'left':'right';ctx.fillText(new Date(`${p.date}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}),p.x,h-7);}});
  }
  function getCss(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}
  function colorAlpha(hex,a){if(hex.startsWith('#')){let h=hex.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}return hex;}

  function bindSessionFilters(){
    const search=document.getElementById('sessionSearch'),gameFilter=document.getElementById('sessionGameFilter'),type=document.getElementById('sessionTypeFilter');let selectedType='all';
    const run=()=>{const q=(search.value||'').toLowerCase();const gid=gameFilter.value;const rows=sessionsForProfile().filter(s=>(gid==='all'||s.game===gid)&&(selectedType==='all'||s.sessionType===selectedType)&&`${track(s.track).name} ${car(s.car).name} ${s.notes||''}`.toLowerCase().includes(q));document.getElementById('sessionList').innerHTML=rows.length?rows.map(renderSessionRow).join(''):renderEmpty('вЊ•','РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ','РР·РјРµРЅРёС‚Рµ С„РёР»СЊС‚СЂ РёР»Рё РїРѕРёСЃРєРѕРІС‹Р№ Р·Р°РїСЂРѕСЃ.');};
    search.addEventListener('input',run);gameFilter.addEventListener('change',run);type.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.value;type.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));run();});
  }
  function bindSetupFilter(){
    const search=document.getElementById('setupSearch'),gameFilter=document.getElementById('setupGame'),trackFilter=document.getElementById('setupTrack'),weatherFilter=document.getElementById('setupWeather'),mode=document.getElementById('setupMode'),fav=document.getElementById('setupFavoritesFilter');
    const run=()=>{const q=(search?.value||'').toLowerCase(),gid=gameFilter?.value||'all',tid=trackFilter?.value||'all',weather=weatherFilter?.value||'all';const rows=setupPool().filter(s=>(gid==='all'||s.game===gid)&&(tid==='all'||s.track===tid)&&(weather==='all'||(s.weather||'dry')===weather)&&(!setupOnlyFavorites||state.setupFavorites.includes(s.id))&&`${s.name} ${track(s.track).name} ${car(s.car).name} ${(s.tags||[]).join(' ')} ${s.description||''}`.toLowerCase().includes(q));document.getElementById('setupGrid').innerHTML=rows.length?rows.map(s=>renderSetupCard(s,setupViewMode)).join(''):renderEmpty('вЊ•','РЎРµС‚Р°РїС‹ РЅРµ РЅР°Р№РґРµРЅС‹','РР·РјРµРЅРё С„РёР»СЊС‚СЂС‹ РёР»Рё РїРµСЂРµРєР»СЋС‡РёСЃСЊ РјРµР¶РґСѓ РіР°СЂР°Р¶РѕРј Рё Р±РёР±Р»РёРѕС‚РµРєРѕР№.');};
    [search,gameFilter,trackFilter,weatherFilter].forEach(el=>el?.addEventListener(el===search?'input':'change',run));
    mode?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setupViewMode=b.dataset.value;mode.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));run();});
    fav?.addEventListener('click',()=>{setupOnlyFavorites=!setupOnlyFavorites;fav.classList.toggle('active',setupOnlyFavorites);run();});
  }
  function bindCatalog(){
    const mode=document.getElementById('catalogMode'),search=document.getElementById('catalogSearch'),gf=document.getElementById('catalogGame'),kind=document.getElementById('catalogKind');let current='tracks';
    const fillKind=()=>{if(!kind)return;const values=current==='tracks'?uniqueSorted(D.tracks.map(t=>t.type)):uniqueSorted(D.cars.map(c=>c.class));kind.innerHTML=`<option value="all">${current==='tracks'?'Р’СЃРµ С‚РёРїС‹':'Р’СЃРµ РєР»Р°СЃСЃС‹'}</option>`+values.map(v=>`<option value="${esc(v)}">${current==='tracks'?trackTypeLabel(v):esc(v)}</option>`).join('');};
    const run=()=>{const q=(search?.value||'').toLowerCase(),gid=gf?.value||'all',k=kind?.value||'all';const list=current==='tracks'?D.tracks.filter(t=>(gid==='all'||t.games.includes(gid))&&(k==='all'||t.type===k)&&`${t.name} ${t.country} ${t.configs.join(' ')} ${trackTypeLabel(t.type)}`.toLowerCase().includes(q)):D.cars.filter(c=>(gid==='all'||c.games.includes(gid))&&(k==='all'||c.class===k)&&`${c.name} ${c.class} ${c.drivetrain}`.toLowerCase().includes(q));document.getElementById('catalogGrid').innerHTML=list.length?list.map(current==='tracks'?renderTrackCard:renderCarCard).join(''):renderEmpty('вЊ•','РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ','РР·РјРµРЅРё РёРіСЂСѓ, С‚РёРї/РєР»Р°СЃСЃ РёР»Рё РїРѕРёСЃРєРѕРІС‹Р№ Р·Р°РїСЂРѕСЃ.');};
    mode?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;current=b.dataset.value;mode.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));fillKind();run();});
    search?.addEventListener('input',run);gf?.addEventListener('change',run);kind?.addEventListener('change',run);
    fillKind();
  }
  function bindGuideFilter(){const input=document.getElementById('guideSearch'),level=document.getElementById('guideLevel');const run=()=>{const q=(input?.value||'').toLowerCase(),l=level?.value||'all';const list=D.guides.filter(g=>(l==='all'||g.level===l)&&`${track(g.track).name} ${g.summary} ${g.sectors.map(s=>s.name+' '+s.tip+' '+s.braking).join(' ')} ${g.mistakes.join(' ')}`.toLowerCase().includes(q));document.getElementById('guideGrid').innerHTML=list.length?list.map(renderGuideCard).join(''):renderEmpty('вЊ•','Р“Р°Р№Рґ РЅРµ РЅР°Р№РґРµРЅ','РџСЂРѕРІРµСЂСЊ РЅР°Р·РІР°РЅРёРµ С‚СЂР°СЃСЃС‹, РїРѕРІРѕСЂРѕС‚Р° РёР»Рё СѓСЂРѕРІРµРЅСЊ СЃР»РѕР¶РЅРѕСЃС‚Рё.');};input?.addEventListener('input',run);level?.addEventListener('change',run);}

  function openModal(content,size=''){els.modalRoot.innerHTML=`<div class="modal-backdrop" data-modal-backdrop><div class="modal ${size}" role="dialog" aria-modal="true">${content}</div></div>`;document.body.style.overflow='hidden';setTimeout(()=>els.modalRoot.querySelector('input,select,button')?.focus(),20);}
  function closeModal(){els.modalRoot.innerHTML='';document.body.style.overflow='';}
  function modalShell(title,body,actions=''){return `<div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close" data-action="close-modal">Г—</button></div><div class="modal-body">${body}</div>${actions?`<div class="modal-actions">${actions}</div>`:''}`;}

  function showSessionForm(seed={}){
    const s={profileId:state.activeProfile,date:today(),game:state.live.game,track:state.live.track,config:track(state.live.track).configs?.[0]||'Grand Prix',car:state.live.car,weather:'РЎСѓС…Рѕ В· 24В°C',sessionType:'РџСЂР°РєС‚РёРєР°',bestLap:'',averageLap:'',laps:0,cleanLaps:0,fuelStart:0,fuelEnd:0,tyreWear:0,notes:'',lapTimes:[],...seed};
    const body=`<form id="sessionForm"><div class="form-section"><div class="form-grid three"><div class="field"><label>Р”Р°С‚Р°</label><input class="input" name="date" type="date" value="${esc(s.date)}" required></div><div class="field"><label>РРіСЂР°</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>РўРёРї</label><select class="select" name="sessionType">${['РџСЂР°РєС‚РёРєР°','РљРІР°Р»РёС„РёРєР°С†РёСЏ','Р“РѕРЅРєР°','Time Attack','Drift'].map(x=>`<option ${x===s.sessionType?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>РўСЂР°СЃСЃР°</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>РљРѕРЅС„РёРіСѓСЂР°С†РёСЏ</label><input class="input" name="config" value="${esc(s.config)}"></div><div class="field"><label>РњР°С€РёРЅР°</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field full"><label>РџРѕРіРѕРґР° / С‚РµРјРїРµСЂР°С‚СѓСЂР°</label><input class="input" name="weather" value="${esc(s.weather)}"></div></div></div>
      <div class="form-section"><h3>Р РµР·СѓР»СЊС‚Р°С‚С‹</h3><div class="form-grid three"><div class="field"><label>Р›СѓС‡С€РёР№ РєСЂСѓРі</label><input class="input" name="bestLap" placeholder="1:42.381" value="${esc(s.bestLap)}"></div><div class="field"><label>РЎСЂРµРґРЅРёР№ РєСЂСѓРі</label><input class="input" name="averageLap" placeholder="1:44.020" value="${esc(s.averageLap)}"></div><div class="field"><label>РљСЂСѓРіРѕРІ</label><input class="input" name="laps" type="number" min="0" value="${s.laps||0}"></div><div class="field"><label>Р§РёСЃС‚С‹С… РєСЂСѓРіРѕРІ</label><input class="input" name="cleanLaps" type="number" min="0" value="${s.cleanLaps||0}"></div><div class="field"><label>РўРѕРїР»РёРІРѕ СЃС‚Р°СЂС‚, Р»</label><input class="input" name="fuelStart" type="number" step="0.1" value="${s.fuelStart||0}"></div><div class="field"><label>РўРѕРїР»РёРІРѕ С„РёРЅРёС€, Р»</label><input class="input" name="fuelEnd" type="number" step="0.1" value="${s.fuelEnd||0}"></div><div class="field"><label>РР·РЅРѕСЃ С€РёРЅ, %</label><input class="input" name="tyreWear" type="number" min="0" max="100" value="${s.tyreWear||0}"></div></div></div>
      <div class="form-section"><h3>РЎРµСЂРёСЏ РєСЂСѓРіРѕРІ</h3><div class="field"><label>РџРѕ РѕРґРЅРѕРјСѓ РІСЂРµРјРµРЅРё РЅР° СЃС‚СЂРѕРєСѓ</label><textarea class="textarea" name="lapTimes" placeholder="1:44.210\n1:43.881\n1:43.522">${esc((s.lapTimes||[]).join('\n'))}</textarea><span class="field-help">РЎС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ Рё СЃСЂРµРґРЅРµРµ РІСЂРµРјСЏ Р±СѓРґСѓС‚ СЂР°СЃСЃС‡РёС‚Р°РЅС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.</span></div></div>
      <div class="form-section"><div class="field"><label>Р—Р°РјРµС‚РєРё РїРёР»РѕС‚Р°</label><textarea class="textarea" name="notes" placeholder="Р‘Р°Р»Р°РЅСЃ, РѕС€РёР±РєРё, С‚РѕС‡РєРё С‚РѕСЂРјРѕР¶РµРЅРёСЏвЂ¦">${esc(s.notes)}</textarea></div></div></form>`;
    openModal(modalShell(s.id?'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ СЃРµСЃСЃРёСЋ':'РќРѕРІР°СЏ СЃРµСЃСЃРёСЏ',body,`<button class="secondary" data-action="close-modal">РћС‚РјРµРЅР°</button><button class="primary" data-action="save-session" data-id="${esc(s.id||'')}">РЎРѕС…СЂР°РЅРёС‚СЊ</button>`));
  }
  function saveSession(id){
    const form=document.getElementById('sessionForm');if(!form?.reportValidity())return;const fd=new FormData(form);const lapTimes=String(fd.get('lapTimes')||'').split(/[\n;,]+/).map(x=>x.trim()).filter(x=>Number.isFinite(lapToMs(x)));const avg=lapTimes.length?msToLap(lapTimes.reduce((a,x)=>a+lapToMs(x),0)/lapTimes.length):String(fd.get('averageLap')||'');const best=lapTimes.length?msToLap(Math.min(...lapTimes.map(lapToMs))):String(fd.get('bestLap')||'');
    const entry={id:id||uid('session'),profileId:state.activeProfile,date:String(fd.get('date')),game:String(fd.get('game')),track:String(fd.get('track')),config:String(fd.get('config')),car:String(fd.get('car')),weather:String(fd.get('weather')),sessionType:String(fd.get('sessionType')),bestLap:best,averageLap:avg,laps:+fd.get('laps')||lapTimes.length,cleanLaps:+fd.get('cleanLaps')||0,consistency:lapTimes.length?consistencyFromLaps(lapTimes):0,fuelStart:+fd.get('fuelStart')||0,fuelEnd:+fd.get('fuelEnd')||0,tyreWear:+fd.get('tyreWear')||0,notes:String(fd.get('notes')||''),lapTimes};
    const idx=state.sessions.findIndex(x=>x.id===id);if(idx>=0)state.sessions[idx]=entry;else state.sessions.push(entry);saveState();closeModal();toast('РЎРµСЃСЃРёСЏ СЃРѕС…СЂР°РЅРµРЅР°');render();
  }
  function showSessionDetail(id){const s=state.sessions.find(x=>x.id===id);if(!s)return;const laps=(s.lapTimes||[]).map((x,i)=>`<div class="setting-row"><div><h3>РљСЂСѓРі ${i+1}</h3><p>${i===0?'РќР°С‡Р°Р»Рѕ СЃРµСЂРёРё':lapDelta(x,s.bestLap)}</p></div><strong style="font-variant-numeric:tabular-nums">${esc(x)}</strong></div>`).join('');const body=`<div class="grid-3"><div class="metric card"><small>Р›СѓС‡С€РёР№ РєСЂСѓРі</small><strong>${esc(s.bestLap)}</strong><span>${esc(track(s.track).name)}</span></div><div class="metric card"><small>РЎСЂРµРґРЅРёР№</small><strong>${esc(s.averageLap||'вЂ”')}</strong><span>${s.laps} РєСЂСѓРіРѕРІ</span></div><div class="metric card"><small>РЎС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ</small><strong>${(+s.consistency||0).toFixed(1)}%</strong><span>${s.cleanLaps||0} С‡РёСЃС‚С‹С…</span></div></div><div class="form-section"><h3>${esc(game(s.game).name)} В· ${esc(car(s.car).name)}</h3><p style="color:var(--muted);font-size:12px;line-height:1.6">${formatDate(s.date)} В· ${esc(s.sessionType)} В· ${esc(s.weather)}<br>${esc(s.notes||'Р‘РµР· Р·Р°РјРµС‚РѕРє')}</p></div>${laps?`<div class="form-section"><h3>РЎРµСЂРёСЏ РєСЂСѓРіРѕРІ</h3>${laps}</div>`:''}`;openModal(modalShell(`${track(s.track).name} В· ${s.bestLap}`,body,`<button class="danger-button" data-action="delete-session" data-id="${s.id}">РЈРґР°Р»РёС‚СЊ</button><button class="secondary" data-action="edit-session" data-id="${s.id}">РР·РјРµРЅРёС‚СЊ</button><button class="primary" data-action="close-modal">Р“РѕС‚РѕРІРѕ</button>`));}
  function lapDelta(v,best){const d=lapToMs(v)-lapToMs(best);return d<=0?'Р›СѓС‡С€РёР№ РєСЂСѓРі':`+${(d/1000).toFixed(3)} СЃРµРє`;}

  function showLiveConfig(){const l=state.live;const body=`<div class="form-grid"><div class="field"><label>РРіСЂР°</label><select class="select" id="liveGame">${optionList(D.games,l.game)}</select></div><div class="field"><label>РўСЂР°СЃСЃР°</label><select class="select" id="liveTrack">${optionList(D.tracks,l.track)}</select></div><div class="field full"><label>РњР°С€РёРЅР°</label><select class="select" id="liveCar">${optionList(D.cars,l.car)}</select></div></div>`;openModal(modalShell('Live Activity-СЃРµСЃСЃРёСЏ',body,`<button class="secondary" data-action="close-modal">РћС‚РјРµРЅР°</button><button class="primary" data-action="save-live-config">РЎРѕС…СЂР°РЅРёС‚СЊ</button>`),'small');}
  function finishLive(){const elapsed=currentElapsed();state.live.running=false;state.live.startTs=null;state.live.elapsed=0;saveState();showSessionForm({game:state.live.game,track:state.live.track,car:state.live.car,laps:state.live.laps||0,bestLap:state.live.best==='вЂ”'?'':state.live.best,notes:`РџСЂРѕРґРѕР»Р¶РёС‚РµР»СЊРЅРѕСЃС‚СЊ live-СЃРµСЃСЃРёРё: ${secondsToClock(elapsed)}`});}

  const setupValueKeys=['frontPressure','rearPressure','frontWing','rearWing','frontARB','rearARB','frontRide','rearRide','brakeBias','tc','abs','fuel','springFront','springRear','camberFront','camberRear','toeFront','toeRear','diffPower','diffCoast'];
  const setupLabels={frontPressure:'Р”Р°РІР»РµРЅРёРµ РїРµСЂРµРґ, PSI',rearPressure:'Р”Р°РІР»РµРЅРёРµ Р·Р°Рґ, PSI',frontWing:'РљСЂС‹Р»Рѕ РїРµСЂРµРґ',rearWing:'РљСЂС‹Р»Рѕ Р·Р°Рґ',frontARB:'ARB РїРµСЂРµРґ',rearARB:'ARB Р·Р°Рґ',frontRide:'РљР»РёСЂРµРЅСЃ РїРµСЂРµРґ, РјРј',rearRide:'РљР»РёСЂРµРЅСЃ Р·Р°Рґ, РјРј',brakeBias:'Р‘Р°Р»Р°РЅСЃ С‚РѕСЂРјРѕР·РѕРІ, %',tc:'TC',abs:'ABS',fuel:'РўРѕРїР»РёРІРѕ, Р»',springFront:'РџСЂСѓР¶РёРЅР° РїРµСЂРµРґ',springRear:'РџСЂСѓР¶РёРЅР° Р·Р°Рґ',camberFront:'Р Р°Р·РІР°Р» РїРµСЂРµРґ',camberRear:'Р Р°Р·РІР°Р» Р·Р°Рґ',toeFront:'РЎС…РѕР¶РґРµРЅРёРµ РїРµСЂРµРґ',toeRear:'РЎС…РѕР¶РґРµРЅРёРµ Р·Р°Рґ',diffPower:'Р”РёС„С„РµСЂРµРЅС†РёР°Р» power, %',diffCoast:'Р”РёС„С„РµСЂРµРЅС†РёР°Р» coast, %'};
  function analyzeSetup(s){
    const v=s.values||{},items=[];let score=0;
    const wing=(+v.rearWing||0)-(+v.frontWing||0);if(wing>=5){items.push({title:'РђСЌСЂРѕР±Р°Р»Р°РЅСЃ',text:'Р’С‹СЃРѕРєРёР№ Р·Р°РїР°СЃ Р·Р°РґРЅРµР№ СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚Рё; РІРѕР·РјРѕР¶РЅР° РЅРµРґРѕСЃС‚Р°С‚РѕС‡РЅР°СЏ РїРѕРІРѕСЂР°С‡РёРІР°РµРјРѕСЃС‚СЊ РІ Р±С‹СЃС‚СЂС‹С… РґСѓРіР°С….',tone:'safe'});score++;}else if(wing<=1){items.push({title:'РђСЌСЂРѕР±Р°Р»Р°РЅСЃ',text:'РћСЃС‚СЂС‹Р№ РїРµСЂРµРґРѕРє Рё СЃРІРѕР±РѕРґРЅР°СЏ СЂРѕС‚Р°С†РёСЏ; РєРѕРЅС‚СЂРѕР»РёСЂСѓР№ Р·Р°РґРЅСЋСЋ РѕСЃСЊ РЅР° РІС…РѕРґРµ.',tone:'attack'});score--;}else items.push({title:'РђСЌСЂРѕР±Р°Р»Р°РЅСЃ',text:'РќРµР№С‚СЂР°Р»СЊРЅС‹Р№ Р±Р°Р»Р°РЅСЃ РјРµР¶РґСѓ РїРѕРІРѕСЂРѕС‚РѕРј Рё СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊСЋ.',tone:'neutral'});
    const arb=(+v.rearARB||0)-(+v.frontARB||0);if(arb>=2){items.push({title:'РњРµС…Р°РЅРёС‡РµСЃРєРёР№ Р±Р°Р»Р°РЅСЃ',text:'Р–С‘СЃС‚С‡Рµ Р·Р°РґРЅРёР№ СЃС‚Р°Р±РёР»РёР·Р°С‚РѕСЂ: РјР°С€РёРЅР° РѕС…РѕС‚РЅРµРµ РІСЂР°С‰Р°РµС‚СЃСЏ, РЅРѕ С…СѓР¶Рµ РґРµСЂР¶РёС‚ РіР°Р· РЅР° РЅРµСЂРѕРІРЅРѕСЃС‚СЏС….',tone:'attack'});score--;}else if(arb<=-2){items.push({title:'РњРµС…Р°РЅРёС‡РµСЃРєРёР№ Р±Р°Р»Р°РЅСЃ',text:'Р–С‘СЃС‚С‡Рµ РїРµСЂРµРґРЅРёР№ СЃС‚Р°Р±РёР»РёР·Р°С‚РѕСЂ: СЃС‚Р°Р±РёР»СЊРЅРµРµ РЅР° РІС‹С…РѕРґРµ, РІРѕР·РјРѕР¶РµРЅ РїСѓС€ РїРµСЂРµРґРЅРµР№ РѕСЃРё.',tone:'safe'});score++;}
    const rake=(+v.rearRide||0)-(+v.frontRide||0);if(rake>16)items.push({title:'РџР»Р°С‚С„РѕСЂРјР°',text:'Р‘РѕР»СЊС€РѕР№ rake СѓСЃРёР»РёРІР°РµС‚ СЂРѕС‚Р°С†РёСЋ Рё С‡СѓРІСЃС‚РІРёС‚РµР»СЊРЅРѕСЃС‚СЊ Рє РІС‹СЃРѕС‚Рµ РєСѓР·РѕРІР°.',tone:'attack'});else if(rake<8)items.push({title:'РџР»Р°С‚С„РѕСЂРјР°',text:'РџР»РѕСЃРєР°СЏ РїР»Р°С‚С„РѕСЂРјР° РїСЂРµРґСЃРєР°Р·СѓРµРјР°, РЅРѕ РјРѕР¶РµС‚ РґР°РІР°С‚СЊ РјРµРЅСЊС€Рµ Р°СЌСЂРѕСЂРѕС‚Р°С†РёРё.',tone:'safe'});else items.push({title:'РџР»Р°С‚С„РѕСЂРјР°',text:'РЈРјРµСЂРµРЅРЅС‹Р№ rake РїРѕРґС…РѕРґРёС‚ РґР»СЏ СѓРЅРёРІРµСЂСЃР°Р»СЊРЅРѕРіРѕ РіРѕРЅРѕС‡РЅРѕРіРѕ Р±Р°Р»Р°РЅСЃР°.',tone:'neutral'});
    const bias=+v.brakeBias||54;if(bias>56)items.push({title:'РўРѕСЂРјРѕР¶РµРЅРёРµ',text:'РЎРёР»СЊРЅС‹Р№ РїРµСЂРµРґРЅРёР№ Р±Р°Р»Р°РЅСЃ: Р±РµР·РѕРїР°СЃРЅРµРµ Р·Р°РґРЅСЏСЏ РѕСЃСЊ, РЅРѕ РІС‹С€Рµ СЂРёСЃРє Р±Р»РѕРєРёСЂРѕРІРєРё РїРµСЂРµРґРЅРёС… С€РёРЅ.',tone:'safe'});else if(bias<52)items.push({title:'РўРѕСЂРјРѕР¶РµРЅРёРµ',text:'Р—Р°РґРЅРёР№ Р±Р°Р»Р°РЅСЃ РїРѕРјРѕРіР°РµС‚ РїРѕРІРѕСЂРѕС‚Сѓ, РЅРѕ С‚СЂРµР±СѓРµС‚ Р°РєРєСѓСЂР°С‚РЅРѕРіРѕ trail braking.',tone:'attack'});else items.push({title:'РўРѕСЂРјРѕР¶РµРЅРёРµ',text:'Р‘Р°Р»Р°РЅСЃ С‚РѕСЂРјРѕР·РѕРІ РЅР°С…РѕРґРёС‚СЃСЏ РІ СѓРЅРёРІРµСЂСЃР°Р»СЊРЅРѕРј СЂР°Р±РѕС‡РµРј РґРёР°РїР°Р·РѕРЅРµ.',tone:'neutral'});
    const p=((+v.frontPressure||0)+(+v.rearPressure||0))/2;if(p>27.4)items.push({title:'РЁРёРЅС‹',text:'Р’С‹СЃРѕРєРѕРµ РґР°РІР»РµРЅРёРµ РјРѕР¶РµС‚ РїРµСЂРµРіСЂРµС‚СЊ С†РµРЅС‚СЂ РїСЂРѕС‚РµРєС‚РѕСЂР° РЅР° РґР»РёРЅРЅРѕР№ СЃРµСЂРёРё.',tone:'warn'});else if(p&&p<25.5)items.push({title:'РЁРёРЅС‹',text:'РќРёР·РєРѕРµ РґР°РІР»РµРЅРёРµ РґР°СЃС‚ СЃС†РµРїР»РµРЅРёРµ РїРѕСЃР»Рµ РїСЂРѕРіСЂРµРІР°, РЅРѕ СѓРІРµР»РёС‡РёС‚ РґРµС„РѕСЂРјР°С†РёСЋ Рё РЅР°РіСЂРµРІ.',tone:'warn'});else items.push({title:'РЁРёРЅС‹',text:'Р”Р°РІР»РµРЅРёРµ Р±Р»РёР·РєРѕ Рє С‚РёРїРёС‡РЅРѕРјСѓ Р±Р°Р·РѕРІРѕРјСѓ РґРёР°РїР°Р·РѕРЅСѓ GT-СЃРµС‚Р°РїР°.',tone:'neutral'});
    const summary=score>=2?'РЎС‚Р°Р±РёР»СЊРЅС‹Р№ Рё Р±РµР·РѕРїР°СЃРЅС‹Р№ Р±Р°Р»Р°РЅСЃ':score<=-2?'РћСЃС‚СЂС‹Р№ Р°С‚Р°РєСѓСЋС‰РёР№ Р±Р°Р»Р°РЅСЃ':'РЎР±Р°Р»Р°РЅСЃРёСЂРѕРІР°РЅРЅР°СЏ Р±Р°Р·Р°';
    return {summary,tone:score>=2?'safe':score<=-2?'attack':'neutral',items};
  }
  function showSetupForm(seed={}){
    const defaults={name:'',game:'acc',track:'spa',car:'m4gt3',weather:'dry',temperature:24,rating:4,notes:'',tags:[],history:[],values:{frontPressure:26.7,rearPressure:26.7,frontWing:5,rearWing:8,frontARB:4,rearARB:2,frontRide:55,rearRide:68,brakeBias:54.5,tc:4,abs:3,fuel:50,springFront:0,springRear:0,camberFront:-3.1,camberRear:-2.7,toeFront:.03,toeRear:.14,diffPower:55,diffCoast:45}};
    const s={...defaults,...seed,values:{...defaults.values,...(seed.values||{})}};const v=s.values;
    const groups=[['РЁРёРЅС‹ Рё РіРµРѕРјРµС‚СЂРёСЏ',['frontPressure','rearPressure','camberFront','camberRear','toeFront','toeRear']],['РђСЌСЂРѕРґРёРЅР°РјРёРєР° Рё РїР»Р°С‚С„РѕСЂРјР°',['frontWing','rearWing','frontRide','rearRide']],['РџРѕРґРІРµСЃРєР°',['frontARB','rearARB','springFront','springRear']],['РўРѕСЂРјРѕР·Р°, РґРёС„С„РµСЂРµРЅС†РёР°Р» Рё СЌР»РµРєС‚СЂРѕРЅРёРєР°',['brakeBias','diffPower','diffCoast','tc','abs','fuel']]];
    const fields=keys=>keys.map(id=>`<div class="field"><label>${setupLabels[id]}</label><input class="input" name="${id}" type="number" step="${['frontPressure','rearPressure','brakeBias','camberFront','camberRear','toeFront','toeRear'].includes(id)?.01:1}" value="${v[id]??0}"></div>`).join('');
    const body=`<form id="setupForm"><div class="form-grid three"><div class="field full"><label>РќР°Р·РІР°РЅРёРµ</label><input class="input" name="name" value="${esc(s.name)}" required></div><div class="field"><label>РРіСЂР°</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>РўСЂР°СЃСЃР°</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>РњР°С€РёРЅР°</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field"><label>РџРѕРіРѕРґР°</label><select class="select" name="weather"><option value="dry" ${s.weather==='dry'?'selected':''}>РЎСѓС…Рѕ</option><option value="wet" ${s.weather==='wet'?'selected':''}>Р”РѕР¶РґСЊ</option><option value="hot" ${s.weather==='hot'?'selected':''}>Р–Р°СЂР°</option><option value="mixed" ${s.weather==='mixed'?'selected':''}>РџРµСЂРµРјРµРЅРЅРѕ</option></select></div><div class="field"><label>РўРµРјРїРµСЂР°С‚СѓСЂР° С‚СЂР°СЃСЃС‹, В°C</label><input class="input" name="temperature" type="number" value="${s.temperature??24}"></div><div class="field"><label>РћС†РµРЅРєР°</label><select class="select" name="rating">${[1,2,3,4,5].map(x=>`<option value="${x}" ${Number(s.rating||4)===x?'selected':''}>${'в…'.repeat(x)}</option>`).join('')}</select></div><div class="field full"><label>РўРµРіРё С‡РµСЂРµР· Р·Р°РїСЏС‚СѓСЋ</label><input class="input" name="tags" value="${esc((s.tags||[]).join(', '))}"></div></div>${groups.map(([title,keys])=>`<div class="form-section"><h3>${title}</h3><div class="form-grid three">${fields(keys)}</div></div>`).join('')}<div class="form-section"><div class="field"><label>Р—Р°РјРµС‚РєРё Рё РїРѕРІРµРґРµРЅРёРµ РјР°С€РёРЅС‹</label><textarea class="textarea" name="notes" placeholder="Р§С‚Рѕ РёР·РјРµРЅРёР»РѕСЃСЊ, РіРґРµ СЃС‚Р°Р»Рѕ Р»СѓС‡С€Рµ РёР»Рё С…СѓР¶РµвЂ¦">${esc(s.notes||'')}</textarea></div></div></form>`;
    openModal(modalShell(s.id?'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ СЃРµС‚Р°Рї':'РќРѕРІС‹Р№ СЃРµС‚Р°Рї',body,`<button class="secondary" data-action="close-modal">РћС‚РјРµРЅР°</button><button class="primary" data-action="save-setup" data-id="${esc(s.id||'')}">РЎРѕС…СЂР°РЅРёС‚СЊ</button>`));
  }
  function saveSetup(id){
    const form=document.getElementById('setupForm');if(!form?.reportValidity())return;const fd=new FormData(form);const existing=state.setups.find(x=>x.id===id);const history=[...(existing?.history||[])];
    if(existing)history.push({savedAt:new Date().toISOString(),name:existing.name,weather:existing.weather,temperature:existing.temperature,rating:existing.rating,notes:existing.notes,tags:existing.tags,values:structuredCloneSafe(existing.values)});
    const entry={id:id||uid('setup'),profileId:state.activeProfile,name:String(fd.get('name')),game:String(fd.get('game')),track:String(fd.get('track')),car:String(fd.get('car')),weather:String(fd.get('weather')||'dry'),temperature:+fd.get('temperature')||24,rating:+fd.get('rating')||4,notes:String(fd.get('notes')||''),created:existing?.created||today(),updated:today(),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),history,values:Object.fromEntries(setupValueKeys.map(k=>[k,+fd.get(k)||0]))};
    const idx=state.setups.findIndex(x=>x.id===id);if(idx>=0)state.setups[idx]=entry;else state.setups.push(entry);saveState();closeModal();toast(existing?'РќРѕРІР°СЏ РІРµСЂСЃРёСЏ СЃРµС‚Р°РїР° СЃРѕС…СЂР°РЅРµРЅР°':'РЎРµС‚Р°Рї СЃРѕС…СЂР°РЅС‘РЅ');render();
  }
  function setupBySource(id,source='mine'){return source==='library'?(D.setupLibrary||[]).find(x=>x.id===id):state.setups.find(x=>x.id===id);}
  function showSetupDetail(id,source='mine'){
    const s=setupBySource(id,source);if(!s)return;const analysis=analyzeSetup(s),favorite=state.setupFavorites.includes(s.id),history=(s.history||[]).length;
    const body=`<div class="setup-detail-head"><div><div class="tags"><span class="tag weather-${esc(s.weather||'dry')}">${weatherLabel(s.weather||'dry')}</span>${(s.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><p>${esc(game(s.game).name)} В· ${esc(track(s.track).name)} В· ${esc(car(s.car).name)}</p></div><div class="setup-score"><strong>в… ${Number(s.rating||4.5).toFixed(1)}</strong><small>${source==='library'?`${s.downloads||0} РєРѕРїРёР№`:`Р’РµСЂСЃРёСЏ ${history+1}`}</small></div></div>${s.description||s.notes?`<div class="guide-summary">${esc(s.description||s.notes)}</div>`:''}<div class="analysis-grid">${analysis.items.map(x=>`<article class="analysis-card ${x.tone}"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div><div class="form-section"><h3>РџР°СЂР°РјРµС‚СЂС‹</h3><table class="compare-table"><tbody>${setupValueKeys.filter(k=>s.values?.[k]!==undefined).map(k=>`<tr><th>${setupLabels[k]}</th><td>${s.values[k]}</td></tr>`).join('')}</tbody></table></div>${source==='mine'&&history?`<div class="notice">РСЃС‚РѕСЂРёСЏ СЃРѕРґРµСЂР¶РёС‚ ${history} СЃРѕС…СЂР°РЅС‘РЅРЅС‹С… РІРµСЂСЃРёР№. РњРѕР¶РЅРѕ РѕС‚РєСЂС‹С‚СЊ РµС‘ Рё РѕС‚РєР°С‚РёС‚СЊ РїР°СЂР°РјРµС‚СЂС‹.</div>`:''}`;
    const actions=source==='library'?`<button class="secondary" data-action="toggle-setup-favorite" data-id="${s.id}">${favorite?'в… Р’ РёР·Р±СЂР°РЅРЅРѕРј':'в† Р’ РёР·Р±СЂР°РЅРЅРѕРµ'}</button><button class="primary" data-action="copy-library-setup" data-id="${s.id}">РЎРєРѕРїРёСЂРѕРІР°С‚СЊ РІ РіР°СЂР°Р¶</button>`:`<button class="secondary" data-action="toggle-setup-favorite" data-id="${s.id}">${favorite?'в… Р’ РёР·Р±СЂР°РЅРЅРѕРј':'в† Р’ РёР·Р±СЂР°РЅРЅРѕРµ'}</button>${history?`<button class="secondary" data-action="setup-history" data-id="${s.id}">РСЃС‚РѕСЂРёСЏ</button>`:''}<button class="secondary" data-action="edit-setup" data-id="${s.id}">РР·РјРµРЅРёС‚СЊ</button><button class="danger-button" data-action="delete-setup" data-id="${s.id}">РЈРґР°Р»РёС‚СЊ</button>`;
    openModal(modalShell(s.name,body,actions));
  }
  function toggleSetupFavorite(id){const i=state.setupFavorites.indexOf(id);if(i>=0)state.setupFavorites.splice(i,1);else state.setupFavorites.push(id);saveState();toast(i>=0?'РЈРґР°Р»РµРЅРѕ РёР· РёР·Р±СЂР°РЅРЅРѕРіРѕ':'Р”РѕР±Р°РІР»РµРЅРѕ РІ РёР·Р±СЂР°РЅРЅРѕРµ');if(els.modalRoot.innerHTML)closeModal();render();}
  function copyLibrarySetup(id){const src=(D.setupLibrary||[]).find(x=>x.id===id);if(!src)return;const copy={...structuredCloneSafe(src),id:uid('setup'),library:false,profileId:state.activeProfile,name:src.name.replace(/^[^В·]+ В· /,''),created:today(),updated:today(),history:[],rating:Math.round(src.rating||4),notes:`Р‘Р°Р·Р° РёР· Р±РёР±Р»РёРѕС‚РµРєРё SimGrid. ${src.description||''}`};state.setups.push(copy);saveState();closeModal();setupViewMode='mine';toast('РЎРµС‚Р°Рї СЃРєРѕРїРёСЂРѕРІР°РЅ РІ РіР°СЂР°Р¶');render();}
  function showSetupHistory(id){const s=state.setups.find(x=>x.id===id);if(!s)return;const history=[...(s.history||[])].reverse();const body=history.length?`<div class="version-list">${history.map((v,i)=>`<article class="version-card"><div><strong>Р’РµСЂСЃРёСЏ ${history.length-i}</strong><small>${new Date(v.savedAt).toLocaleString('ru-RU')}</small><p>${esc(v.notes||'Р‘РµР· Р·Р°РјРµС‚РѕРє')}</p></div><button class="secondary" data-action="restore-setup-version" data-id="${id}" data-index="${(s.history||[]).length-1-i}">Р’РѕСЃСЃС‚Р°РЅРѕРІРёС‚СЊ</button></article>`).join('')}</div>`:renderEmpty('в†¶','РСЃС‚РѕСЂРёСЏ РїСѓСЃС‚Р°','РР·РјРµРЅРё Рё СЃРѕС…СЂР°РЅРё СЃРµС‚Р°Рї вЂ” РїСЂРµРґС‹РґСѓС‰Р°СЏ РІРµСЂСЃРёСЏ РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.');openModal(modalShell(`РСЃС‚РѕСЂРёСЏ В· ${s.name}`,body,`<button class="primary" data-action="close-modal">Р“РѕС‚РѕРІРѕ</button>`),'small');}
  function restoreSetupVersion(id,index){const s=state.setups.find(x=>x.id===id),v=s?.history?.[Number(index)];if(!s||!v)return;s.history.push({savedAt:new Date().toISOString(),name:s.name,weather:s.weather,temperature:s.temperature,rating:s.rating,notes:s.notes,tags:s.tags,values:structuredCloneSafe(s.values)});Object.assign(s,{name:v.name||s.name,weather:v.weather||s.weather,temperature:v.temperature??s.temperature,rating:v.rating??s.rating,notes:v.notes||'',tags:v.tags||[],values:structuredCloneSafe(v.values)});saveState();closeModal();toast('Р’РµСЂСЃРёСЏ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅР°');render();}

  function showCompareSetups(){const list=state.setups.filter(s=>s.profileId===state.activeProfile);if(list.length<2){toast('Р”Р»СЏ СЃСЂР°РІРЅРµРЅРёСЏ РЅСѓР¶РЅС‹ РјРёРЅРёРјСѓРј РґРІР° СЃРµС‚Р°РїР°','warn');return;}const body=`<div class="form-grid"><div class="field"><label>РЎРµС‚Р°Рї A</label><select class="select" id="compareA">${optionList(list,list[0].id,x=>x.name)}</select></div><div class="field"><label>РЎРµС‚Р°Рї B</label><select class="select" id="compareB">${optionList(list,list[1].id,x=>x.name)}</select></div></div><div id="compareResult" class="form-section"></div>`;openModal(modalShell('РЎСЂР°РІРЅРµРЅРёРµ СЃРµС‚Р°РїРѕРІ',body,`<button class="secondary" data-action="close-modal">Р—Р°РєСЂС‹С‚СЊ</button><button class="primary" data-action="run-compare">РЎСЂР°РІРЅРёС‚СЊ</button>`));renderCompare(list[0].id,list[1].id);}
  function renderCompare(aId,bId){const a=state.setups.find(x=>x.id===aId),b=state.setups.find(x=>x.id===bId),root=document.getElementById('compareResult');if(!a||!b||!root)return;root.innerHTML=`<table class="compare-table"><thead><tr><th>РџР°СЂР°РјРµС‚СЂ</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th>О” Bв€’A</th></tr></thead><tbody>${setupValueKeys.map(k=>{const av=+a.values?.[k]||0,bv=+b.values?.[k]||0,d=bv-av;return `<tr><th>${setupLabels[k]}</th><td>${av}</td><td>${bv}</td><td class="${d>0?'diff-positive':d<0?'diff-negative':''}">${d>0?'+':''}${Number(d.toFixed(2))}</td></tr>`}).join('')}</tbody></table><div class="analysis-grid" style="margin-top:14px"><article class="analysis-card ${analyzeSetup(a).tone}"><h3>${esc(a.name)}</h3><p>${esc(analyzeSetup(a).summary)}</p></article><article class="analysis-card ${analyzeSetup(b).tone}"><h3>${esc(b.name)}</h3><p>${esc(analyzeSetup(b).summary)}</p></article></div>`;}

  function telemetryBar(label,value,type){return `<div class="telemetry-row"><span>${label}</span><div><i class="${type}" style="width:${Math.max(4,Math.min(100,value))}%"></i></div><b>${value}%</b></div>`;}
  function showGuideDetail(trackId){
    const g=D.guides.find(x=>x.track===trackId);if(!g)return;const t=track(trackId),done=state.guideProgress[trackId]||[],quiz=state.guideQuiz[trackId];
    const modes=(g.modes||[]).map(m=>`<article class="training-mode"><span>${m.icon}</span><div><h4>${esc(m.name)}</h4><small>${esc(m.focus)}</small><p>${esc(m.note)}</p></div></article>`).join('');
    const sectors=g.sectors.map((sector,i)=>`<article class="academy-sector"><div class="sector-head"><span class="corner-num">${i+1}</span><div><p class="sector-label">РљР»СЋС‡РµРІР°СЏ Р·РѕРЅР° ${i+1}</p><h3>${esc(sector.name)}</h3></div><span class="gear">${esc(sector.gear)} РїРµСЂРµРґР°С‡Р°</span></div><div class="sector-instruction"><span>Р§С‚Рѕ РґРµР»Р°С‚СЊ</span><p>${esc(sector.tip)}</p></div><div class="sector-facts"><span><small>РўРѕСЂРјРѕР¶РµРЅРёРµ</small><b>${esc(sector.braking)}</b></span><span><small>РћСЂРёРµРЅС‚РёСЂ РІС…РѕРґР°</small><b>${esc(sector.entrySpeed)}</b></span><span><small>РђРїРµРєСЃ</small><b>${esc(sector.apex)}</b></span><span><small>Р“Р°Р·</small><b>${esc(sector.throttle)}</b></span></div><p class="sector-curb"><b>РџРѕСЂРµР±СЂРёРє:</b> ${esc(sector.curb)}</p></article>`).join('');
    const checklist=(g.checklist||[]).map((item,i)=>`<button class="guide-task ${done[i]?'done':''}" data-action="toggle-guide-task" data-id="${trackId}" data-index="${i}"><span>${done[i]?'вњ“':'в—‹'}</span><b>${esc(item)}</b></button>`).join('');
    const hero=g.hero?`<div class="guide-detail-hero"><img src="${esc(g.hero)}" alt="РўСЂРµРєРѕРІР°СЏ РѕР±Р»РѕР¶РєР° ${esc(t.name)}" loading="eager" onerror="this.closest('.guide-detail-hero').classList.add('guide-detail-hero--schematic');this.remove()"><div class="guide-detail-title"><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} РєРј В· ${t.corners} РїРѕРІРѕСЂРѕС‚РѕРІ В· ${esc(t.country)}</p><div class="guide-configs">${t.configs.slice(0,4).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div><div class="guide-detail-mapfloat">${trackSvg(t,'#ffffff')}</div></div>`:`<div class="guide-detail-hero guide-detail-hero--schematic"><div class="guide-detail-blueprint"><div class="guide-detail-copy"><p class="guide-kicker">Track Academy</p><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} РєРј В· ${t.corners} РїРѕРІРѕСЂРѕС‚РѕРІ В· ${esc(t.country)}</p></div><div class="guide-detail-trackbox">${trackSvg(t,'#ffffff')}</div></div></div>`;
    const setupList=g.setup.map(x=>`<li><span>вњ“</span>${esc(x)}</li>`).join('');
    const mistakeList=g.mistakes.map(x=>`<li><span>!</span>${esc(x)}</li>`).join('');
    const body=`${hero}<section class="guide-start-panel"><div><p class="eyebrow">Р¦РµР»СЊ С‚СЂРµРЅРёСЂРѕРІРєРё</p><h3>${esc(g.primaryGoal||g.summary)}</h3><p>${esc(g.summary)}</p><small>РЎРєРѕСЂРѕСЃС‚Рё Рё РґРёСЃС‚Р°РЅС†РёРё РЅРёР¶Рµ вЂ” СЃС‚Р°СЂС‚РѕРІС‹Рµ РѕСЂРёРµРЅС‚РёСЂС‹. РЎРЅР°С‡Р°Р»Р° РґРѕР±РµР№СЃСЏ РїРѕРІС‚РѕСЂСЏРµРјРѕР№ Р»РёРЅРёРё, Р·Р°С‚РµРј РїРѕРґСЃС‚СЂРѕР№ РёС… РїРѕРґ РјР°С€РёРЅСѓ, С‚РѕРїР»РёРІРѕ Рё РїРѕРіРѕРґСѓ.</small></div><ol class="guide-start-steps"><li><b>1</b><span>Р Р°Р·РјРёРЅРєР°<small>3 СЃРїРѕРєРѕР№РЅС‹С… РєСЂСѓРіР°</small></span></li><li><b>2</b><span>РћРґРЅР° Р·РѕРЅР°<small>${esc(g.sectors[0]?.name||'РїРµСЂРІС‹Р№ СЃРµРєС‚РѕСЂ')}</small></span></li><li><b>3</b><span>Р Р°Р±РѕС‡Р°СЏ СЃРµСЂРёСЏ<small>5 С‡РёСЃС‚С‹С… РєСЂСѓРіРѕРІ</small></span></li><li><b>4</b><span>РџСЂРѕРІРµСЂРєР°<small>СЃСЂРµРґРЅРёР№ РєСЂСѓРі Рё СЂР°Р·Р±СЂРѕСЃ</small></span></li></ol></section><div class="guide-quickfacts"><div class="metric card"><small>РџР»Р°РЅ</small><strong>${esc(g.sessionPlan||'3 + 5')}</strong><span>РѕРґРЅР° С†РµР»СЊ Р·Р° СЃРµСЃСЃРёСЋ</span></div><div class="metric card"><small>РљР»СЋС‡РµРІС‹Рµ Р·РѕРЅС‹</small><strong>${g.sectors.length}</strong><span>СЂР°Р·РѕР±СЂР°РЅС‹ РїРѕ РїРѕСЂСЏРґРєСѓ</span></div><div class="metric card"><small>РџСЂРѕРіСЂРµСЃСЃ</small><strong>${guideCompletion(trackId)}%</strong><span>${done.filter(Boolean).length} РёР· ${(g.checklist||[]).length} Р·Р°РґР°С‡</span></div><div class="metric card"><small>РњРёРЅРё-С‚РµСЃС‚</small><strong>${quiz?`${quiz.score}/${quiz.total}`:'вЂ”'}</strong><span>${quiz?'РїРѕСЃР»РµРґРЅРёР№ СЂРµР·СѓР»СЊС‚Р°С‚':'РµС‰С‘ РЅРµ РїСЂРѕР№РґРµРЅ'}</span></div></div><section class="academy-section training-section"><div class="card-head"><div><h2>Р’С‹Р±РµСЂРё СЂРµР¶РёРј</h2><p>РњРµРЅСЏРµС‚СЃСЏ РїСЂРёРѕСЂРёС‚РµС‚, РЅРѕ РїРѕСЂСЏРґРѕРє СЂР°Р±РѕС‚С‹ РѕСЃС‚Р°С‘С‚СЃСЏ С‚РµРј Р¶Рµ</p></div></div><div class="training-modes">${modes}</div></section><div class="academy-layout"><main><section class="academy-section"><div class="card-head"><div><h2>РљР»СЋС‡РµРІС‹Рµ Р·РѕРЅС‹ РїРѕ РїРѕСЂСЏРґРєСѓ</h2><p>Р’ РєР°Р¶РґРѕР№ РєР°СЂС‚РѕС‡РєРµ СЃРЅР°С‡Р°Р»Р° РїСЂРѕС‡РёС‚Р°Р№ РґРµР№СЃС‚РІРёРµ, Р·Р°С‚РµРј СЃРІРµСЂСЏР№ РѕСЂРёРµРЅС‚РёСЂС‹</p></div></div><div class="academy-sectors">${sectors}</div></section></main><aside class="stack guide-aside"><article class="guide-map-panel"><div class="card-head"><div><h3>РЎС…РµРјР° С‚СЂР°СЃСЃС‹</h3><p>${esc(t.configs[0]||'РћСЃРЅРѕРІРЅР°СЏ РєРѕРЅС„РёРіСѓСЂР°С†РёСЏ')}</p></div></div><div class="guide-track-map" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><p class="guide-map-caption">РРґРё РїРѕ Р·РѕРЅР°Рј СЃРІРµСЂС…Сѓ РІРЅРёР·. РќРµ РїС‹С‚Р°Р№СЃСЏ СѓР»СѓС‡С€РёС‚СЊ РІРµСЃСЊ РєСЂСѓРі Р·Р° РѕРґРёРЅ РІС‹РµР·Рґ.</p></article><article class="card card-pad guide-advice"><div class="card-head"><div><h3>Р‘Р°Р·РѕРІР°СЏ РЅР°СЃС‚СЂРѕР№РєР°</h3><p>Р§С‚Рѕ РїСЂРѕРІРµСЂРёС‚СЊ РїРµСЂРµРґ СЃРµСЂРёРµР№</p></div></div><ul>${setupList}</ul></article><article class="card card-pad guide-advice danger"><div class="card-head"><div><h3>Р§Р°СЃС‚С‹Рµ РѕС€РёР±РєРё</h3><p>Р§С‚Рѕ СЃСЂР°Р·Сѓ РїРѕСЂС‚РёС‚ РєСЂСѓРі</p></div></div><ul>${mistakeList}</ul></article><article class="card card-pad"><div class="card-head"><div><h3>Р§РµРє-Р»РёСЃС‚ С‚СЂРµРЅРёСЂРѕРІРєРё</h3><p>РќР°Р¶РёРјР°Р№ РїРѕСЃР»Рµ РІС‹РїРѕР»РЅРµРЅРёСЏ</p></div></div><div class="guide-checklist">${checklist}</div></article></aside></div>`;
    openModal(modalShell(`Р“Р°Р№Рґ: ${t.name}`,body,`<button class="secondary" data-action="guide-quiz" data-id="${t.id}">${quiz?'РџРѕРІС‚РѕСЂРёС‚СЊ С‚РµСЃС‚':'РњРёРЅРё-С‚РµСЃС‚'}</button><button class="secondary" data-action="new-session-guide" data-id="${t.id}">Р—Р°РїРёСЃР°С‚СЊ 5 РєСЂСѓРіРѕРІ</button><button class="primary" data-action="close-modal">Р—Р°РєСЂС‹С‚СЊ</button>`),'wide');
  }
  function toggleGuideTask(id,index){const guide=D.guides.find(g=>g.track===id);if(!guide)return;const list=[...(state.guideProgress[id]||Array(guide.checklist.length).fill(false))];list[Number(index)]=!list[Number(index)];state.guideProgress[id]=list;saveState();showGuideDetail(id);}
  function showGuideQuiz(id){const g=D.guides.find(x=>x.track===id);if(!g)return;const body=`<form id="guideQuizForm"><div class="quiz-list">${g.quiz.map((q,qi)=>`<fieldset class="quiz-question"><legend>${qi+1}. ${esc(q.q)}</legend>${q.options.map((option,oi)=>`<label><input type="radio" name="q${qi}" value="${oi}" ${oi===0?'required':''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}</div></form>`;openModal(modalShell(`РњРёРЅРё-С‚РµСЃС‚ В· ${track(id).name}`,body,`<button class="secondary" data-action="guide-detail" data-id="${id}">РќР°Р·Р°Рґ Рє РіР°Р№РґСѓ</button><button class="primary" data-action="submit-guide-quiz" data-id="${id}">РџСЂРѕРІРµСЂРёС‚СЊ</button>`));}
  function submitGuideQuiz(id){const g=D.guides.find(x=>x.track===id),form=document.getElementById('guideQuizForm');if(!g||!form?.reportValidity())return;const fd=new FormData(form);let score=0;g.quiz.forEach((q,i)=>{if(Number(fd.get(`q${i}`))===q.answer)score++;});state.guideQuiz[id]={score,total:g.quiz.length,date:new Date().toISOString()};saveState();const pct=Math.round(score/g.quiz.length*100);const body=`<div class="quiz-result"><strong>${score}/${g.quiz.length}</strong><h3>${pct>=80?'РўСЂР°СЃСЃР° РёР·СѓС‡РµРЅР° СѓРІРµСЂРµРЅРЅРѕ':pct>=60?'РҐРѕСЂРѕС€Р°СЏ Р±Р°Р·Р°':'РЎС‚РѕРёС‚ РїРѕРІС‚РѕСЂРёС‚СЊ РєР»СЋС‡РµРІС‹Рµ Р·РѕРЅС‹'}</h3><p>${pct>=80?'РџРµСЂРµС…РѕРґРё Рє СЃРµСЂРёРё С‡РёСЃС‚С‹С… РєСЂСѓРіРѕРІ Рё СЃСЂР°РІРЅРё СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚СЊ.':'Р’РµСЂРЅРёСЃСЊ Рє РєР°СЂС‚РѕС‡РєР°Рј С‚РѕСЂРјРѕР¶РµРЅРёСЏ, Р°РїРµРєСЃР° Рё С‚РёРїРёС‡РЅС‹С… РѕС€РёР±РѕРє.'}</p></div>`;openModal(modalShell(`Р РµР·СѓР»СЊС‚Р°С‚ В· ${track(id).name}`,body,`<button class="secondary" data-action="guide-quiz" data-id="${id}">РџРѕРІС‚РѕСЂРёС‚СЊ</button><button class="primary" data-action="guide-detail" data-id="${id}">Р’РµСЂРЅСѓС‚СЊСЃСЏ РІ РіР°Р№Рґ</button>`),'small');}

  function showCatalogTrack(id){const t=track(id),guide=D.guides.find(g=>g.track===id);const guideProgress=guide?guideCompletion(t.id):0;const body=`<div class="catalog-detail-hero track-detail-hero"><div class="catalog-detail-map" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><div class="catalog-detail-copy"><span class="pill">${trackTypeLabel(t.type)} В· ${difficultyLabel(t.difficulty)}</span><h2>${esc(t.name)}</h2><p>${esc(t.country)} В· ${t.length.toFixed(3)} РєРј В· ${t.corners} РїРѕРІРѕСЂРѕС‚РѕРІ</p><div class="guide-configs">${t.configs.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div><div class="grid-3"><div class="metric card"><small>Р”Р»РёРЅР°</small><strong>${t.length.toFixed(3)}</strong><span>РєРёР»РѕРјРµС‚СЂР°</span></div><div class="metric card"><small>РЎР»РѕР¶РЅРѕСЃС‚СЊ</small><strong>${t.difficulty}/5</strong><span>${difficultyLabel(t.difficulty)}</span></div><div class="metric card"><small>Р“Р°Р№Рґ</small><strong>${guide?guideProgress+'%':'вЂ”'}</strong><span>${guide?'РїСЂРѕРіСЂРµСЃСЃ':'РЅРµС‚ РіР°Р№РґР°'}</span></div></div><section class="catalog-plan card"><h3>РџР»Р°РЅ РїРµСЂРІРѕР№ С‚СЂРµРЅРёСЂРѕРІРєРё</h3><div class="plan-steps"><span><b>01</b> 5 РєСЂСѓРіРѕРІ Р±РµР· Р°С‚Р°РєРё</span><span><b>02</b> С„РёРєСЃРёСЂСѓР№ С‚РѕС‡РєСѓ С‚РѕСЂРјРѕР¶РµРЅРёСЏ</span><span><b>03</b> СЃСЂР°РІРЅРё Р»СѓС‡С€РёР№ Рё СЃСЂРµРґРЅРёР№ РєСЂСѓРі</span></div></section><div class="form-section"><h3>Р”РѕСЃС‚СѓРїРЅРѕСЃС‚СЊ</h3><div class="tags">${t.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(t.name,body,`${guide?`<button class="secondary" data-action="guide-detail" data-id="${t.id}">РћС‚РєСЂС‹С‚СЊ РіР°Р№Рґ</button>`:''}<button class="primary" data-action="new-session-track" data-id="${t.id}">РќРѕРІР°СЏ СЃРµСЃСЃРёСЏ</button>`));}
  function showCatalogCar(id){const c=car(id);const pwr=(c.power/c.weight*1000).toFixed(0);const driveHint=c.drivetrain==='FWD'?'Р±РµСЂРµР¶РЅРµРµ СЃ РїРµСЂРµРґРЅРёРјРё С€РёРЅР°РјРё':c.drivetrain==='AWD'?'СЃР»РµРґРё Р·Р° РїРµСЂРµРіСЂРµРІРѕРј С‚СЂР°РЅСЃРјРёСЃСЃРёРё':'РєРѕРЅС‚СЂРѕР»РёСЂСѓР№ Р·Р°РґРЅСЋСЋ РѕСЃСЊ РЅР° РІС‹С…РѕРґРµ';const body=`<div class="catalog-detail-hero car-detail-hero"><div class="car-visual big"><span class="car-type">${esc(carIcon(c))}</span><span class="car-shadow"></span></div><div class="catalog-detail-copy"><span class="pill">${esc(c.class)} В· ${esc(c.drivetrain)}</span><h2>${esc(c.name)}</h2><p>${c.power} Р».СЃ. В· ${c.weight} РєРі В· ${pwr} Р».СЃ./С‚</p></div></div><div class="grid-3"><div class="metric card"><small>РњРѕС‰РЅРѕСЃС‚СЊ</small><strong>${c.power}</strong><span>Р».СЃ.</span></div><div class="metric card"><small>РњР°СЃСЃР°</small><strong>${c.weight}</strong><span>РєРі</span></div><div class="metric card"><small>Р».СЃ./С‚</small><strong>${pwr}</strong><span>${esc(c.drivetrain)}</span></div></div><section class="catalog-plan card"><h3>РџРѕРґСЃРєР°Р·РєР° РёРЅР¶РµРЅРµСЂР°</h3><p>Р”Р»СЏ ${esc(c.class)} РЅР°С‡РЅРё СЃ Р±РµР·РѕРїР°СЃРЅРѕРіРѕ СЃРµС‚Р°РїР°, РїСЂРѕРіСЂРµР№ С€РёРЅС‹ РґРІСѓРјСЏ РєСЂСѓРіР°РјРё Рё ${esc(driveHint)}. РџРѕСЃР»Рµ СЃРµСЂРёРё СЃРѕС…СЂР°РЅРё СЃСЂРµРґРЅРёР№ РєСЂСѓРі, Р° РЅРµ С‚РѕР»СЊРєРѕ Р»СѓС‡С€РёР№.</p></section><div class="form-section"><h3>РРіСЂС‹</h3><div class="tags">${c.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(c.name,body,`<button class="primary" data-action="new-session-car" data-id="${c.id}">РќРѕРІР°СЏ СЃРµСЃСЃРёСЏ</button>`));}

  function showThemePicker(){const body=`<div class="theme-grid">${D.themes.map(t=>`<button class="theme-option ${state.theme===t.id?'active':''}" data-action="set-theme" data-id="${t.id}"><span class="theme-swatch" style="--swatch:${t.preview};--swatch-accent:${t.accent}"></span><strong>${esc(t.name)}</strong></button>`).join('')}</div>`;openModal(modalShell('РўРµРјР° РёРЅС‚РµСЂС„РµР№СЃР°',body,`<button class="primary" data-action="close-modal">Р“РѕС‚РѕРІРѕ</button>`),'small');}
  function showProfilePicker(){const body=`<div class="stack">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===state.activeProfile?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} В· С†РµР»СЊ ${x.goalLaps} РєСЂСѓРіРѕРІ</small></span><span>${x.id===state.activeProfile?'вњ“':'вЂє'}</span></button>`).join('')}</div>`;openModal(modalShell('РџСЂРѕС„РёР»СЊ РїРёР»РѕС‚Р°',body),'small');}
  function steamGameId(name=''){const n=String(name).toLowerCase();if(n.includes('competizione'))return'acc';if(n.includes('assetto corsa evo'))return'ace';if(n.includes('assetto corsa'))return'ac';if(n.includes('iracing'))return'iracing';if(/(^|\s)f1\D*2\d|formula 1/.test(n))return'f1';return'';}
  function showSteamConnect(){const s=state.steam;const body=`<div class="steam-panel"><p>РЈРєР°Р¶РёС‚Рµ SteamID64 Рё Р°РґСЂРµСЃ Worker РёР· РїР°РїРєРё <b>steam-worker</b>. API-РєР»СЋС‡ С…СЂР°РЅРёС‚СЃСЏ С‚РѕР»СЊРєРѕ РІ Worker, Р° РЅРµ РІ GitHub Pages.</p><div class="field"><label>SteamID64 (17 С†РёС„СЂ)</label><input class="input" id="steamId" inputmode="numeric" pattern="[0-9]{17}" value="${esc(s.steamId)}" placeholder="7656119вЂ¦"></div><div class="field" style="margin-top:12px"><label>URL Steam Worker</label><input class="input" id="steamEndpoint" value="${esc(s.endpoint)}" placeholder="https://simgrid-steam.example.workers.dev"></div><div class="notice" style="margin-top:14px">Р‘РµР· Worker РїСЂРёР»РѕР¶РµРЅРёРµ РЅРµ Р·Р°РїСЂР°С€РёРІР°РµС‚ Steam Web API Рё РЅРµ СЂР°СЃРєСЂС‹РІР°РµС‚ РєР»СЋС‡. Steam РЅРµ РїСЂРµРґРѕСЃС‚Р°РІР»СЏРµС‚ С‚РµР»РµРјРµС‚СЂРёСЋ РєСЂСѓРіРѕРІ вЂ” РѕРЅР° РёРјРїРѕСЂС‚РёСЂСѓРµС‚СЃСЏ РѕС‚РґРµР»СЊРЅРѕ.</div></div>`;openModal(modalShell('РџРѕРґРєР»СЋС‡РµРЅРёРµ Steam',body,`<button class="secondary" data-action="open-steam-profile">РћС‚РєСЂС‹С‚СЊ РїСЂРѕС„РёР»СЊ</button><button class="primary" data-action="save-steam">РЎРѕС…СЂР°РЅРёС‚СЊ Рё РїСЂРѕРІРµСЂРёС‚СЊ</button>`),'small');}
  async function syncSteam(){const steamId=document.getElementById('steamId')?.value.trim()||state.steam.steamId;const endpoint=(document.getElementById('steamEndpoint')?.value.trim()||state.steam.endpoint).replace(/\/$/,'');if(!/^\d{17}$/.test(steamId)){toast('SteamID64 РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ 17 С†РёС„СЂ','warn');return;}state.steam.steamId=steamId;state.steam.endpoint=endpoint;saveState();if(!endpoint){closeModal();toast('РќР°СЃС‚СЂРѕР№РєРё СЃРѕС…СЂР°РЅРµРЅС‹. Р”РѕР±Р°РІСЊС‚Рµ URL Worker РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё.','warn');return;}try{const res=await fetch(`${endpoint}/steam/sync?steamid=${encodeURIComponent(steamId)}`);if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();state.steam.profile=data.profile||null;state.steam.ownedGames=data.games||[];state.steam.lastSync=new Date().toISOString();const recentName=(data.recent||[]).map(x=>x.name||'').find(Boolean)||'';const detected=steamGameId(recentName);if(detected)state.live.game=detected;saveState();closeModal();toast('Steam-РїСЂРѕС„РёР»СЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ');render();}catch(err){console.error(err);toast('Worker РЅРµРґРѕСЃС‚СѓРїРµРЅ РёР»Рё Steam API РІРµСЂРЅСѓР» РѕС€РёР±РєСѓ','bad');}}

  function exportJson(){download(`simgrid-backup-${today()}.json`,JSON.stringify({app:'SimGrid',exportedAt:new Date().toISOString(),state},null,2),'application/json');toast('Р РµР·РµСЂРІРЅР°СЏ РєРѕРїРёСЏ СЃРѕР·РґР°РЅР°');}
  function exportCsv(){const headers=['date','profile','game','track','config','car','weather','sessionType','bestLap','averageLap','laps','cleanLaps','consistency','fuelStart','fuelEnd','tyreWear','notes'];const rows=state.sessions.map(s=>headers.map(h=>csvCell(h==='profile'?s.profileId:h==='game'?game(s.game).name:h==='track'?track(s.track).name:h==='car'?car(s.car).name:s[h]??'')).join(','));download(`simgrid-sessions-${today()}.csv`,[headers.join(','),...rows].join('\n'),'text/csv;charset=utf-8');toast('CSV СЃРѕР·РґР°РЅ');}
  function csvCell(v){const s=String(v).replace(/"/g,'""');return `"${s}"`;}
  function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importFile(file){if(!file)return;try{const text=await file.text();if(file.name.toLowerCase().endsWith('.csv'))importCsv(text);else{const data=JSON.parse(text);const incoming=data.state||data;if(incoming.sessions||incoming.setups){state={...state,...incoming,settings:{...state.settings,...incoming.settings},steam:{...state.steam,...incoming.steam},live:{...state.live,...incoming.live},strategy:{...state.strategy,...incoming.strategy}};saveState();toast('Р РµР·РµСЂРІРЅР°СЏ РєРѕРїРёСЏ РёРјРїРѕСЂС‚РёСЂРѕРІР°РЅР°');render();}else if(data.session){state.sessions.push(normalizeImportedSession(data.session));saveState();toast('РЎРµСЃСЃРёСЏ РёРјРїРѕСЂС‚РёСЂРѕРІР°РЅР°');render();}else throw new Error('Unknown JSON');}}catch(err){console.error(err);toast('Р¤Р°Р№Р» РЅРµ СЂР°СЃРїРѕР·РЅР°РЅ. РќСѓР¶РµРЅ SimGrid JSON РёР»Рё CSV.','bad');}finally{els.importInput.value='';}}
  function importCsv(text){const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)throw new Error('Empty CSV');const parse=line=>{const out=[];let cur='',quote=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(c==='"')quote=!quote;else if(c===','&&!quote){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};const headers=parse(lines[0]).map(x=>x.trim());const imported=lines.slice(1).map(line=>Object.fromEntries(headers.map((h,i)=>[h,parse(line)[i]??'']))).map(r=>normalizeImportedSession(r));state.sessions.push(...imported);saveState();toast(`РРјРїРѕСЂС‚РёСЂРѕРІР°РЅРѕ СЃРµСЃСЃРёР№: ${imported.length}`);render();}
  function normalizeImportedSession(r){const findGame=value=>D.games.find(g=>g.id===value||g.name.toLowerCase()===String(value).toLowerCase())?.id||'other';const findTrack=value=>D.tracks.find(t=>t.id===value||t.name.toLowerCase()===String(value).toLowerCase())?.id||'spa';const findCar=value=>D.cars.find(c=>c.id===value||c.name.toLowerCase()===String(value).toLowerCase())?.id||'roadcar';const lapTimes=Array.isArray(r.lapTimes)?r.lapTimes:[];return {id:uid('import'),profileId:r.profileId||r.profile||state.activeProfile,date:r.date||today(),game:findGame(r.game),track:findTrack(r.track),config:r.config||'',car:findCar(r.car),weather:r.weather||'',sessionType:r.sessionType||r.type||'РРјРїРѕСЂС‚',bestLap:r.bestLap||r.best||'',averageLap:r.averageLap||r.average||'',laps:+r.laps||lapTimes.length,cleanLaps:+r.cleanLaps||0,consistency:+r.consistency||consistencyFromLaps(lapTimes),fuelStart:+r.fuelStart||0,fuelEnd:+r.fuelEnd||0,tyreWear:+r.tyreWear||0,notes:r.notes||'РРјРїРѕСЂС‚РёСЂРѕРІР°РЅРѕ',lapTimes};}

  document.addEventListener('click',async e=>{
    if(e.target.matches('[data-modal-backdrop]')){closeModal();return;}
    const routeBtn=e.target.closest('[data-route]');if(routeBtn){closeModal();setRoute(routeBtn.dataset.route);return;}
    const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action,id=a.dataset.id,source=a.dataset.source||'mine',index=a.dataset.index;
    const map={
      'close-modal':()=>closeModal(),
      'new-session':()=>showSessionForm(),
      'session-detail':()=>showSessionDetail(id),
      'edit-session':()=>{const s=state.sessions.find(x=>x.id===id);closeModal();showSessionForm(s)},
      'delete-session':()=>{state.sessions=state.sessions.filter(x=>x.id!==id);saveState();closeModal();toast('РЎРµСЃСЃРёСЏ СѓРґР°Р»РµРЅР°','warn');render()},
      'save-session':()=>saveSession(id),
      'configure-live':()=>showLiveConfig(),
      'save-live-config':()=>{state.live.game=document.getElementById('liveGame').value;state.live.track=document.getElementById('liveTrack').value;state.live.car=document.getElementById('liveCar').value;saveState();closeModal();render()},
      'start-live':()=>{state.live.running=true;state.live.startTs=Date.now();saveState();render()},
      'pause-live':()=>{state.live.elapsed=currentElapsed();state.live.running=false;state.live.startTs=null;saveState();render()},
      'finish-live':()=>finishLive(),
      'quick-strategy':()=>{state.strategy.track=document.getElementById('quickTrack')?.value;state.strategy.duration=+document.getElementById('quickDuration')?.value||60;state.strategy.raceMode='time';saveState();setRoute('strategy')},
      'new-setup':()=>showSetupForm(),
      'save-setup':()=>saveSetup(id),
      'setup-detail':()=>showSetupDetail(id,source),
      'edit-setup':()=>{const s=state.setups.find(x=>x.id===id);closeModal();showSetupForm(s)},
      'delete-setup':()=>{state.setups=state.setups.filter(x=>x.id!==id);state.setupFavorites=state.setupFavorites.filter(x=>x!==id);saveState();closeModal();toast('РЎРµС‚Р°Рї СѓРґР°Р»С‘РЅ','warn');render()},
      'toggle-setup-favorite':()=>toggleSetupFavorite(id),
      'copy-library-setup':()=>copyLibrarySetup(id),
      'setup-history':()=>showSetupHistory(id),
      'restore-setup-version':()=>restoreSetupVersion(id,index),
      'compare-setups':()=>showCompareSetups(),
      'run-compare':()=>renderCompare(document.getElementById('compareA').value,document.getElementById('compareB').value),
      'guide-detail':()=>showGuideDetail(id),
      'toggle-guide-task':()=>toggleGuideTask(id,index),
      'guide-quiz':()=>showGuideQuiz(id),
      'submit-guide-quiz':()=>submitGuideQuiz(id),
      'new-session-guide':()=>{closeModal();showSessionForm({track:id,config:track(id).configs[0]})},
      'catalog-track':()=>showCatalogTrack(id),
      'catalog-car':()=>showCatalogCar(id),
      'new-session-track':()=>{closeModal();showSessionForm({track:id,config:track(id).configs[0]})},
      'new-session-car':()=>{closeModal();showSessionForm({car:id})},
      'set-theme':()=>{state.theme=id;saveState();applyTheme();render();if(els.modalRoot.innerHTML)showThemePicker()},
      'select-profile':()=>{state.activeProfile=id;saveState();closeModal();toast(`РџСЂРѕС„РёР»СЊ ${profile(id).name} Р°РєС‚РёРІРёСЂРѕРІР°РЅ`);render()},
      'export-json':()=>exportJson(),
      'export-csv':()=>exportCsv(),
      'import-data':()=>els.importInput.click(),
      'steam-connect':()=>showSteamConnect(),
      'save-steam':()=>syncSteam(),
      'open-steam-profile':()=>{const sid=document.getElementById('steamId')?.value.trim()||state.steam.steamId;if(/^\d{17}$/.test(sid))open(`https://steamcommunity.com/profiles/${sid}`,'_blank');else toast('РЎРЅР°С‡Р°Р»Р° РІРІРµРґРёС‚Рµ SteamID64','warn')},
      'restore-demo':()=>{state.sessions=structuredCloneSafe(D.sampleSessions);state.setups=structuredCloneSafe(D.sampleSetups);saveState();toast('Р”РµРјРѕ-РґР°РЅРЅС‹Рµ РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅС‹');render()},
      'clear-data':()=>{if(confirm('РЈРґР°Р»РёС‚СЊ РІСЃРµ Р»РѕРєР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ SimGrid?')){state=structuredCloneSafe(defaultState);state.sessions=[];state.setups=[];saveState();toast('Р›РѕРєР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ СѓРґР°Р»РµРЅС‹','warn');render()}}
    };
    if(map[action])await map[action]();
  });
  document.addEventListener('submit',e=>{if(e.target.id==='strategyForm'){e.preventDefault();const fd=new FormData(e.target);state.strategy={...state.strategy,...Object.fromEntries(fd.entries())};['duration','raceLaps','fuelPerLap','tank','startFuel','pitLoss','mandatoryStops','tyreLife','traffic'].forEach(k=>state.strategy[k]=+state.strategy[k]);saveState();render();}});
  els.importInput.addEventListener('change',()=>importFile(els.importInput.files[0]));
  els.quickAddBtn.addEventListener('click',()=>showSessionForm());els.themeBtn.addEventListener('click',showThemePicker);els.profileSwitch.addEventListener('click',showProfilePicker);
  window.addEventListener('popstate',()=>{route=new URLSearchParams(location.search).get('view')||'dashboard';render();resetPageScroll();});
  window.addEventListener('resize',()=>{if(route==='dashboard')drawProgressChart();});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;els.installBtn.classList.remove('hidden');});
  els.installBtn.addEventListener('click',async()=>{if(!deferredInstall){toast('РќР° iPhone: РџРѕРґРµР»РёС‚СЊСЃСЏ в†’ РќР° СЌРєСЂР°РЅ В«Р”РѕРјРѕР№В»','warn');return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;els.installBtn.classList.add('hidden');});
  window.addEventListener('appinstalled',()=>toast('SimGrid СѓСЃС‚Р°РЅРѕРІР»РµРЅ'));

  if('serviceWorker' in navigator){
    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return;
      refreshing=true;
      window.location.reload();
    });
    window.addEventListener('load',async()=>{
      try{
        const reg=await navigator.serviceWorker.register('./sw.js');
        reg.update?.();
        if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
        reg.addEventListener('updatefound',()=>{
          const worker=reg.installing;
          worker?.addEventListener('statechange',()=>{
            if(worker.state==='installed' && navigator.serviceWorker.controller) worker.postMessage({type:'SKIP_WAITING'});
          });
        });
      }catch(err){console.warn(err);}
    });
  }
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  const params=new URLSearchParams(location.search);if(params.get('action')==='new-session')setTimeout(()=>showSessionForm(),300);
  render();
  resetPageScroll();
})();
(() => {
  'use strict';
  const D = window.SIMGRID_DATA;
  const STORAGE_KEY = 'simgrid.state.v1';
  const NAV = [
    {id:'dashboard',label:'Обзор',icon:'◫',eyebrow:'Центр пилота'},
    {id:'sessions',label:'Сессии',icon:'◷',eyebrow:'Журнал заездов'},
    {id:'strategy',label:'Стратегия',icon:'⌁',eyebrow:'Race engineer'},
    {id:'setups',label:'Сетапы',icon:'⌘',eyebrow:'Garage lab'},
    {id:'catalog',label:'Каталог',icon:'▦',eyebrow:'Трассы и машины'},
    {id:'guides',label:'Гайды',icon:'◇',eyebrow:'Track academy'},
    {id:'settings',label:'Ещё',icon:'•••',eyebrow:'Профили и данные'}
  ];
  const MOBILE_NAV = ['dashboard','sessions','strategy','setups','guides','settings'];
  const DEFAULT_STRATEGY = {raceMode:'time',duration:60,raceLaps:30,lapTime:'2:20.000',fuelPerLap:2.65,tank:120,startFuel:70,pitLoss:32,mandatoryStops:0,tyreLife:24,traffic:4,weather:'dry',compound:'medium'};
  const defaultState = {
    version:2,
    theme:'telemetry',
    activeProfile:'sprint',
    sessions:structuredCloneSafe(D.sampleSessions),
    setups:structuredCloneSafe(D.sampleSetups),
    settings:{units:'metric',reduceMotion:false,autoBackup:false,showDemo:true},
    steam:{steamId:'',endpoint:'',profile:null,lastSync:null,ownedGames:[]},
    live:{running:false,startTs:null,elapsed:0,game:'acc',track:'spa',car:'m4gt3',laps:0,best:'—'},
    strategy:DEFAULT_STRATEGY,
    setupFavorites:[],
    guideProgress:{},
    guideQuiz:{},
    onboarded:true
  };

  let state = loadState();
  let route = new URLSearchParams(location.search).get('view') || 'dashboard';
  if (!NAV.some(n => n.id === route)) route = 'dashboard';
  let deferredInstall = null;
  let liveTicker = null;
  let setupViewMode = 'mine';
  let setupOnlyFavorites = false;

  const els = {
    view:document.getElementById('view'),
    desktopNav:document.getElementById('desktopNav'),
    mobileNav:document.getElementById('mobileNav'),
    title:document.getElementById('pageTitle'),
    eyebrow:document.getElementById('pageEyebrow'),
    modalRoot:document.getElementById('modalRoot'),
    toastRoot:document.getElementById('toastRoot'),
    importInput:document.getElementById('importInput'),
    themeBtn:document.getElementById('themeBtn'),
    installBtn:document.getElementById('installBtn'),
    quickAddBtn:document.getElementById('quickAddBtn'),
    profileSwitch:document.getElementById('profileSwitch'),
    activeProfileName:document.getElementById('activeProfileName'),
    profileAvatar:document.getElementById('profileAvatar'),
    profileGameHint:document.getElementById('profileGameHint')
  };

  function structuredCloneSafe(value){
    try{return structuredClone(value);}catch{return JSON.parse(JSON.stringify(value));}
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY);
      if(!raw) return structuredCloneSafe(defaultState);
      const saved=JSON.parse(raw);
      return {...structuredCloneSafe(defaultState),...saved,settings:{...defaultState.settings,...saved.settings},steam:{...defaultState.steam,...saved.steam},live:{...defaultState.live,...saved.live},strategy:{...DEFAULT_STRATEGY,...saved.strategy},setupFavorites:Array.isArray(saved.setupFavorites)?saved.setupFavorites:[],guideProgress:{...defaultState.guideProgress,...saved.guideProgress},guideQuiz:{...defaultState.guideQuiz,...saved.guideQuiz}};
    }catch(err){console.warn('Storage unavailable',err);return structuredCloneSafe(defaultState);}
  }
  function saveState(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(err){toast('Не удалось сохранить данные в браузере','bad');}
  }
  function esc(value=''){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function uid(prefix='id'){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;}
  function game(id){return D.games.find(x=>x.id===id)||D.games[D.games.length-1];}
  function track(id){return D.tracks.find(x=>x.id===id)||{name:'Неизвестная трасса',path:'M10 50 L90 50'};}
  function car(id){return D.cars.find(x=>x.id===id)||{name:'Неизвестная машина',class:'—'};}
  function profile(id=state.activeProfile){return D.profiles.find(x=>x.id===id)||D.profiles[0];}
  function formatDate(date){try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${date}T12:00:00`));}catch{return date;}}
  function today(){return new Date().toISOString().slice(0,10);}
  function lapToMs(v){
    if(typeof v==='number') return v;
    if(!v) return NaN;
    const s=String(v).trim().replace(',','.');
    const parts=s.split(':');
    if(parts.length===1) return Number(parts[0])*1000;
    const mins=Number(parts[0]); const secs=Number(parts[1]);
    return (mins*60+secs)*1000;
  }
  function msToLap(ms){
    if(!Number.isFinite(ms)||ms<0) return '—';
    const mins=Math.floor(ms/60000); const secs=(ms-mins*60000)/1000;
    return `${mins}:${secs.toFixed(3).padStart(6,'0')}`;
  }
  function secondsToClock(sec){
    sec=Math.max(0,Math.floor(sec)); const h=Math.floor(sec/3600); const m=Math.floor((sec%3600)/60); const s=sec%60;
    return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  function consistencyFromLaps(laps){
    const nums=(laps||[]).map(lapToMs).filter(Number.isFinite);
    if(nums.length<2) return 0;
    const avg=nums.reduce((a,b)=>a+b,0)/nums.length;
    const variance=nums.reduce((s,n)=>s+(n-avg)**2,0)/nums.length;
    const std=Math.sqrt(variance);
    return Math.max(0,Math.min(100,100-(std/avg*100*12)));
  }
  function trackStartPoint(path=''){
    const m=String(path).match(/M\s*([0-9.]+)\s+([0-9.]+)/i);
    return m?{x:Number(m[1]),y:Number(m[2])}:{x:18,y:68};
  }
  function trackSvg(t,color='currentColor'){
    const start=trackStartPoint(t.path);
    const markerA={x:Math.max(10,Math.min(98,start.x+14)),y:Math.max(10,Math.min(98,start.y-12))};
    const markerB={x:Math.max(10,Math.min(98,start.x+28)),y:Math.max(10,Math.min(98,start.y+8))};
    return `<svg class="track-svg" viewBox="0 0 110 110" aria-hidden="true"><path class="track-glow" pathLength="100" d="${esc(t.path)}" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".10"/><path class="track-asphalt" pathLength="100" d="${esc(t.path)}" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path class="track-line" pathLength="100" d="${esc(t.path)}" fill="none" stroke="${color}" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle class="track-sector-dot" cx="${markerA.x}" cy="${markerA.y}" r="2.4"/><circle class="track-sector-dot second" cx="${markerB.x}" cy="${markerB.y}" r="2.1"/><circle class="track-start" cx="${start.x}" cy="${start.y}" r="4.4"/></svg>`;
  }
  function trackTypeLabel(type){return type==='street'?'Городская':type==='oval'?'Овал':type==='drift'?'Drift':type==='historic'?'Historic':type==='mixed'?'Mixed':'Road';}
  function difficultyLabel(value){return value>=5?'Эксперт':value>=4?'Сложная':value>=3?'Средняя':'Лёгкая';}
  function carIcon(c){const cls=String(c.class||'').toLowerCase();if(cls.includes('formula'))return 'ƒ';if(cls.includes('hyper')||cls.includes('gtp')||cls.includes('lmp'))return '↯';if(cls.includes('drift'))return '↺';if(cls.includes('tcr'))return 'FF';if(cls.includes('cup'))return 'Cup';return 'GT';}
  function uniqueSorted(values){return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ru'));}
  function optionList(items,selected,label=x=>x.name){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(label(x))}</option>`).join('');}
  const toastQueue=[]; let toastVisible=false;
  function toast(message,type='good'){
    toastQueue.push({message,type});
    if(!toastVisible) consumeToastQueue();
  }
  function consumeToastQueue(){
    const next=toastQueue.shift();
    if(!next){toastVisible=false;return;}
    toastVisible=true;
    const el=document.createElement('div');
    el.className=`toast ${next.type}`;
    el.textContent=next.message;
    els.toastRoot.replaceChildren(el);
    setTimeout(()=>{el.remove();consumeToastQueue();},2600);
  }
  function resetPageScroll(){
    requestAnimationFrame(()=>{
      window.scrollTo(0,0);
      document.scrollingElement?.scrollTo?.(0,0);
    });
  }
  function setRoute(next,push=true){
    route=next;
    if(push){const u=new URL(location.href);u.searchParams.set('view',route);u.searchParams.delete('action');history.pushState({},'',u);}
    render();
    resetPageScroll();
  }
  function applyTheme(){document.documentElement.dataset.theme=state.theme;const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()||'#090b10';}
  function updateProfileUI(){const p=profile();els.activeProfileName.textContent=p.name;els.profileAvatar.textContent=p.icon;els.profileGameHint.textContent=p.hint;}
  function renderNav(){
    els.desktopNav.innerHTML=NAV.map(n=>`<button class="nav-button ${route===n.id?'active':''}" data-route="${n.id}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span>${n.id==='sessions'?`<small>${state.sessions.length}</small>`:''}</button>`).join('');
    els.mobileNav.innerHTML=MOBILE_NAV.map(id=>{const n=NAV.find(x=>x.id===id);return `<button class="${route===id?'active':''}" data-route="${id}"><span class="nav-icon">${n.icon}</span><span>${n.label}</span></button>`}).join('');
  }
  function render(){
    applyTheme();updateProfileUI();renderNav();
    const n=NAV.find(x=>x.id===route)||NAV[0];els.title.textContent=n.label;els.eyebrow.textContent=n.eyebrow;
    stopLiveTicker();
    const renders={dashboard:renderDashboard,sessions:renderSessions,strategy:renderStrategy,setups:renderSetups,catalog:renderCatalog,guides:renderGuides,settings:renderSettings};
    els.view.innerHTML=renders[route]();
    bindViewEnhancements();
  }

  function sessionsForProfile(){return state.sessions.filter(s=>s.profileId===state.activeProfile).sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
  function statsForProfile(){
    const sessions=sessionsForProfile();
    const laps=sessions.reduce((n,s)=>n+(Number(s.laps)||0),0);
    const clean=sessions.reduce((n,s)=>n+(Number(s.cleanLaps)||0),0);
    const focus=sessions[0]||null;
    const focusSessions=focus?sessions.filter(s=>s.track===focus.track&&s.car===focus.car&&s.game===focus.game):[];
    const best=focusSessions.map(s=>({...s,ms:lapToMs(s.bestLap)})).filter(s=>Number.isFinite(s.ms)).sort((a,b)=>a.ms-b.ms)[0];
    const consistency=sessions.length?sessions.reduce((n,s)=>n+(Number(s.consistency)||0),0)/sessions.length:0;
    const fuelUsed=sessions.reduce((n,s)=>n+Math.max(0,(Number(s.fuelStart)||0)-(Number(s.fuelEnd)||0)),0);
    return {sessions,laps,clean,best,consistency,fuelUsed,focus,focusSessions};
  }
  function renderDashboard(){
    const p=profile();const st=statsForProfile();const recent=st.sessions.slice(0,5);
    const sessionGoal=Math.min(100,Math.round(st.sessions.filter(s=>Date.now()-new Date(s.date).getTime()<7*864e5).length/p.goalSessions*100));
    const lapGoal=Math.min(100,Math.round(st.sessions.filter(s=>Date.now()-new Date(s.date).getTime()<7*864e5).reduce((a,s)=>a+(+s.laps||0),0)/p.goalLaps*100));
    const cleanPct=st.laps?Math.round(st.clean/st.laps*100):0;
    const delta=bestDelta(st.focusSessions);
    return `<div class="dashboard-grid">
      <div class="stack">
        ${renderLiveCard()}
        <div class="grid-4">
          <article class="card metric"><small>Личный рекорд</small><strong>${esc(st.best?.bestLap||'—')}</strong><span>${st.best?esc(track(st.best.track).name):'Добавьте сессию'}</span></article>
          <article class="card metric"><small>Средняя стабильность</small><strong>${st.consistency?st.consistency.toFixed(1)+'%':'—'}</strong><span class="${st.consistency>=90?'up':''}">${st.consistency>=90?'Гоночный темп':'Работайте над сериями'}</span></article>
          <article class="card metric"><small>Кругов записано</small><strong>${st.laps}</strong><span>${st.clean} чистых кругов</span></article>
          <article class="card metric"><small>Прогресс темпа</small><strong>${delta.text}</strong><span class="${delta.good?'up':'down'}">${delta.caption}</span></article>
        </div>
        <article class="card card-pad">
          <div class="card-head"><div><h2>Прогресс времени круга</h2><p>${st.focus?esc(track(st.focus.track).name)+' · '+esc(car(st.focus.car).name):'Лучшие результаты по датам'}</p></div><div class="chart-legend"><span><i class="legend-dot"></i>лучший круг</span></div></div>
          <div class="chart-wrap"><canvas id="progressChart"></canvas></div>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>Последние сессии</h2><p>${p.name} · локальный журнал</p></div><button class="link-button" data-route="sessions">Все сессии</button></div>
          ${recent.length?`<div class="session-list">${recent.map(renderSessionRow).join('')}</div>`:renderEmpty('◷','Пока нет сессий','Запишите первый заезд или импортируйте телеметрию.')}
        </article>
      </div>
      <div class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><h2>Недельная цель</h2><p>${p.focus} · профиль ${p.name}</p></div><span class="pill">7 дней</span></div>
          <div class="rings">
            <div class="ring-wrap"><div class="ring" style="--p:${lapGoal};--ring-color:var(--accent)"><strong>${lapGoal}%</strong></div><small>Круги</small><b>${Math.round(p.goalLaps*lapGoal/100)} / ${p.goalLaps}</b></div>
            <div class="ring-wrap"><div class="ring" style="--p:${sessionGoal};--ring-color:var(--good)"><strong>${sessionGoal}%</strong></div><small>Сессии</small><b>${Math.round(p.goalSessions*sessionGoal/100)} / ${p.goalSessions}</b></div>
            <div class="ring-wrap"><div class="ring" style="--p:${cleanPct};--ring-color:var(--warn)"><strong>${cleanPct}%</strong></div><small>Чистота</small><b>${st.clean} кругов</b></div>
          </div>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>Race engineer</h2><p>Быстрый расчёт следующего заезда</p></div></div>
          <div class="form-grid">
            <div class="field"><label>Трасса</label><select class="select" id="quickTrack">${optionList(D.tracks,state.live.track)}</select></div>
            <div class="field"><label>Длительность</label><select class="select" id="quickDuration"><option value="20">20 мин</option><option value="30">30 мин</option><option value="45">45 мин</option><option value="60" selected>60 мин</option><option value="90">90 мин</option></select></div>
          </div>
          <button class="primary" data-action="quick-strategy" style="width:100%;margin-top:12px">Рассчитать стратегию</button>
        </article>
        <article class="card card-pad">
          <div class="card-head"><div><h2>Состояние данных</h2><p>Локально на этом устройстве</p></div><span class="pill">Offline-ready</span></div>
          <div class="setting-row"><div><h3>${state.sessions.length} сессий</h3><p>JSON/CSV экспорт доступен в разделе «Ещё».</p></div><button class="secondary" data-action="export-json">JSON</button></div>
          <div class="setting-row"><div><h3>${state.steam.profile?'Steam подключён':'Steam не подключён'}</h3><p>${state.steam.profile?esc(state.steam.profile.personaname||'Профиль синхронизирован'):'Профиль и библиотека — через безопасный Worker.'}</p></div><button class="secondary" data-route="settings">Открыть</button></div>
        </article>
      </div>
    </div>`;
  }
  function bestDelta(sessions){
    const sorted=sessions.map(s=>lapToMs(s.bestLap)).filter(Number.isFinite);
    if(sorted.length<2)return{text:'—',caption:'Нужно 2+ сессии',good:true};
    const first=sorted[sorted.length-1],last=sorted[0],d=first-last;
    return{text:`${d>=0?'−':'+'}${(Math.abs(d)/1000).toFixed(2)}с`,caption:d>=0?'Быстрее раннего результата':'Последний темп ниже',good:d>=0};
  }
  function renderLiveCard(){
    const l=state.live;const t=track(l.track);const c=car(l.car);const g=game(l.game);const elapsed=currentElapsed();
    return `<article class="card live-card">
      <div class="live-top"><div><span class="pill ${l.running?'live':''}">${l.running?'LIVE SESSION':'ГОТОВ К СТАРТУ'}</span><p class="live-track">${esc(g.name)} · ${esc(t.name)}</p><h2 class="live-title">${esc(c.name)}</h2></div><div style="width:100px;color:color-mix(in srgb,var(--accent) 75%,white)">${trackSvg(t,'currentColor')}</div></div>
      <div class="timer" id="liveTimer">${secondsToClock(elapsed)}</div>
      <div class="live-stats"><div class="live-stat"><small>Круги</small><strong>${l.laps||0}</strong></div><div class="live-stat"><small>Лучший</small><strong>${esc(l.best||'—')}</strong></div><div class="live-stat"><small>Профиль</small><strong>${esc(profile().name)}</strong></div><div class="live-stat"><small>Режим</small><strong>${l.running?'Запись':'Ожидание'}</strong></div></div>
      <div class="live-actions">${l.running?`<button class="secondary" data-action="pause-live">Пауза</button><button class="primary" data-action="finish-live">Завершить</button>`:`<button class="primary" data-action="start-live">Начать сессию</button><button class="secondary" data-action="configure-live">Настроить</button>`}</div>
    </article>`;
  }
  function currentElapsed(){return state.live.running&&state.live.startTs?state.live.elapsed+(Date.now()-state.live.startTs)/1000:state.live.elapsed||0;}
  function startLiveTicker(){
    if(!state.live.running)return;const el=document.getElementById('liveTimer');if(!el)return;
    liveTicker=setInterval(()=>{el.textContent=secondsToClock(currentElapsed());},1000);
  }
  function stopLiveTicker(){if(liveTicker){clearInterval(liveTicker);liveTicker=null;}}

  function renderSessionRow(s){
    return `<button class="session-row" data-action="session-detail" data-id="${esc(s.id)}" style="border:0;width:100%;color:inherit;text-align:left">
      <span class="game-badge" style="color:${game(s.game).accent}">${esc(game(s.game).short)}</span>
      <span class="session-main"><strong>${esc(track(s.track).name)} · ${esc(car(s.car).name)}</strong><small>${formatDate(s.date)} · ${esc(s.sessionType||'Сессия')} · ${esc(s.weather||'')}</small></span>
      <span class="session-cell hide-mobile"><small>Лучший</small><strong>${esc(s.bestLap||'—')}</strong></span>
      <span class="session-cell"><small>Стабильность</small><strong>${Number(s.consistency||0).toFixed(1)}%</strong></span>
      <span class="session-cell hide-md"><small>Круги</small><strong>${Number(s.laps)||0}</strong></span>
      <span class="session-cell hide-md"><small>Топливо</small><strong>${Math.max(0,(+s.fuelStart||0)-(+s.fuelEnd||0)).toFixed(1)} л</strong></span>
      <span class="more-button">›</span>
    </button>`;
  }
  function renderSessions(){
    const sessions=sessionsForProfile();
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="sessionSearch" placeholder="Трасса, машина, заметка"></div><select class="select" id="sessionGameFilter" style="width:auto"><option value="all">Все игры</option>${optionList(D.games,'none')}</select></div><div class="toolbar-group"><button class="secondary" data-action="import-data">Импорт</button><button class="primary" data-action="new-session">＋ Новая сессия</button></div></div>
      <article class="card card-pad">
        <div class="card-head"><div><h2>Журнал ${esc(profile().name)}</h2><p>${sessions.length} сессий · ${sessions.reduce((a,s)=>a+(+s.laps||0),0)} кругов</p></div><div class="segmented" id="sessionTypeFilter"><button class="active" data-value="all">Все</button><button data-value="Практика">Практика</button><button data-value="Квалификация">Квалификация</button><button data-value="Гонка">Гонка</button></div></div>
        <div id="sessionList" class="session-list">${sessions.length?sessions.map(renderSessionRow).join(''):renderEmpty('◷','Журнал пуст','Добавьте сессию вручную или импортируйте JSON/CSV.')}</div>
      </article>`;
  }

  function renderStrategy(){
    const s=state.strategy;const results=calculateStrategies(s);
    return `<div class="strategy-layout">
      <article class="card card-pad">
        <div class="card-head"><div><h2>Параметры гонки</h2><p>Расход, деградация, трафик и обязательные остановки</p></div></div>
        <form id="strategyForm">
          <div class="form-grid">
            <div class="field"><label>Расчёт по</label><select class="select" name="raceMode"><option value="time" ${s.raceMode==='time'?'selected':''}>времени</option><option value="laps" ${s.raceMode==='laps'?'selected':''}>кругам</option></select></div>
            <div class="field"><label>${s.raceMode==='laps'?'Кругов':'Длительность, мин'}</label><input class="input" name="${s.raceMode==='laps'?'raceLaps':'duration'}" type="number" min="1" step="1" value="${s.raceMode==='laps'?s.raceLaps:s.duration}"></div>
            <div class="field"><label>Средний круг</label><input class="input" name="lapTime" value="${esc(s.lapTime)}" inputmode="decimal"></div>
            <div class="field"><label>Расход, л/круг</label><input class="input" name="fuelPerLap" type="number" min="0.1" step="0.01" value="${s.fuelPerLap}"></div>
            <div class="field"><label>Бак, л</label><input class="input" name="tank" type="number" min="1" step="1" value="${s.tank}"></div>
            <div class="field"><label>Стартовое топливо, л</label><input class="input" name="startFuel" type="number" min="0" step="1" value="${s.startFuel}"></div>
            <div class="field"><label>Потеря на пит-лейне, сек</label><input class="input" name="pitLoss" type="number" min="0" step="0.1" value="${s.pitLoss}"></div>
            <div class="field"><label>Обязательных пит-стопов</label><input class="input" name="mandatoryStops" type="number" min="0" max="8" step="1" value="${s.mandatoryStops}"></div>
            <div class="field"><label>Ресурс комплекта, кругов</label><input class="input" name="tyreLife" type="number" min="1" step="1" value="${s.tyreLife}"></div>
            <div class="field"><label>Трафик</label><select class="select" name="traffic"><option value="0" ${+s.traffic===0?'selected':''}>Чистая трасса</option><option value="4" ${+s.traffic===4?'selected':''}>Умеренный</option><option value="9" ${+s.traffic===9?'selected':''}>Плотный</option></select></div>
            <div class="field"><label>Погода</label><select class="select" name="weather"><option value="dry" ${s.weather==='dry'?'selected':''}>Сухо</option><option value="mixed" ${s.weather==='mixed'?'selected':''}>Переменно</option><option value="wet" ${s.weather==='wet'?'selected':''}>Дождь</option></select></div>
            <div class="field"><label>Предпочтительный состав</label><select class="select" name="compound"><option value="soft" ${s.compound==='soft'?'selected':''}>Soft</option><option value="medium" ${s.compound==='medium'?'selected':''}>Medium</option><option value="hard" ${s.compound==='hard'?'selected':''}>Hard</option></select></div>
          </div>
          <button class="primary" style="width:100%;margin-top:16px">Пересчитать</button>
        </form>
      </article>
      <div class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><h2>Варианты стратегии</h2><p>${results.meta.laps} кругов · ${results.meta.fuel.toFixed(1)} л с резервом · окно пит-стопа ${results.meta.window}</p></div><span class="pill">${results.meta.weather}</span></div>
          <div class="strategy-results">${results.items.map((r,i)=>renderStrategyCard(r,i===0)).join('')}</div>
        </article>
        <div class="grid-3">
          <article class="card metric"><small>Топливо на гонку</small><strong>${results.meta.fuel.toFixed(1)} л</strong><span>включая резерв 1.5 круга</span></article>
          <article class="card metric"><small>Минимум остановок</small><strong>${results.meta.minStops}</strong><span>бак + ресурс шин</span></article>
          <article class="card metric"><small>Цена трафика</small><strong>+${results.meta.trafficLoss.toFixed(1)}с</strong><span>оценка для выбранной плотности</span></article>
        </div>
      </div>
    </div>`;
  }
  function calculateStrategies(input){
    const lapMs=lapToMs(input.lapTime)||120000;const lapSec=lapMs/1000;
    const laps=input.raceMode==='laps'?Math.max(1,Math.round(+input.raceLaps||1)):Math.max(1,Math.ceil((+input.duration||1)*60/lapSec));
    const fuelPer=Math.max(.01,+input.fuelPerLap||1);const fuel=laps*fuelPer+fuelPer*1.5;const tank=Math.max(1,+input.tank||1);
    const fuelStops=Math.max(0,Math.ceil(fuel/tank)-1);const tyreStops=Math.max(0,Math.ceil(laps/Math.max(1,+input.tyreLife||1))-1);const minStops=Math.max(+input.mandatoryStops||0,fuelStops,tyreStops);
    const pitLoss=Math.max(0,+input.pitLoss||0);const traffic=+input.traffic||0;const weather=input.weather==='wet'?'Дождь':input.weather==='mixed'?'Переменно':'Сухо';
    const make=(name,stops,compounds,risk,pacePenalty,note)=>{
      stops=Math.max(minStops,stops);const stints=splitLaps(laps,stops+1);const degPenalty=stints.reduce((sum,n,idx)=>sum+Math.max(0,n-(+input.tyreLife||20)*compoundLife(compounds[idx]||compounds.at(-1)))*1.05,0);
      const total=laps*lapSec+stops*pitLoss+pacePenalty*laps+degPenalty+traffic*(stops?0.7:1.15);
      return {name,stops,compounds,stints,risk,total,note,degPenalty};
    };
    const base=String(input.compound||'medium');
    const candidates=[
      make('Сбалансированная',minStops,[base,...Array(minStops).fill(base==='soft'?'medium':base)],'Низкий',base==='hard'?0.7:base==='soft'?-0.25:0,'Надёжное окно пит-стопа и небольшой риск перегрева шин.'),
      make('Атака темпа',Math.max(1,minStops+1),Array(Math.max(2,minStops+2)).fill(input.weather==='wet'?'wet':'soft'),'Средний',-0.45,'Короткие стинты, быстрые круги и больше свободы для андерката.'),
      make('Длинный первый стинт',minStops,[input.weather==='wet'?'wet':'hard',...Array(minStops).fill('medium')],'Средний',0.42,'Полезно при старте в трафике или ожидаемом раннем Safety Car.'),
      make('Минимум пит-лейна',minStops,[input.weather==='wet'?'wet':'hard',...Array(minStops).fill('hard')],'Высокий',0.85,'Минимум остановок, но больше деградации и чувствительность к температуре.')
    ].sort((a,b)=>a.total-b.total);
    const firstStop=candidates[0].stints[0];const window=`${Math.max(1,firstStop-2)}–${Math.min(laps-1,firstStop+2)} круг`;
    return {items:candidates,meta:{laps,fuel,minStops,trafficLoss:traffic*(minStops?0.7:1.15),window,weather}};
  }
  function splitLaps(laps,parts){const base=Math.floor(laps/parts),rem=laps%parts;return Array.from({length:parts},(_,i)=>base+(i<rem?1:0));}
  function compoundLife(c){return c==='soft'?.78:c==='hard'?1.3:c==='wet'?1.15:1;}
  function renderStrategyCard(r,recommended){
    const colors={soft:'',medium:'medium',hard:'hard',wet:'wet'};
    return `<div class="strategy-card ${recommended?'recommended':''}">${recommended?'<span class="recommend">Рекомендуется</span>':''}<div class="strategy-title"><div><h3>${esc(r.name)}</h3><span class="pill" style="margin-top:7px">Риск: ${esc(r.risk)}</span></div><strong>${secondsToClock(r.total)}</strong></div><div class="stints">${r.stints.map((n,i)=>`<span class="stint ${colors[r.compounds[i]||r.compounds.at(-1)]||''}" style="--stint:${n}" title="${n} кругов"></span>`).join('')}</div><div class="strategy-meta"><div><small>Остановки</small><strong>${r.stops}</strong></div><div><small>Стинты</small><strong>${r.stints.join(' / ')}</strong></div><div><small>Составы</small><strong>${r.compounds.slice(0,r.stints.length).map(x=>x[0].toUpperCase()).join(' → ')}</strong></div><div><small>Деградация</small><strong>+${r.degPenalty.toFixed(1)}с</strong></div></div><p class="strategy-note">${esc(r.note)}</p></div>`;
  }

  function setupPool(mode=setupViewMode){
    return mode==='library'?(D.setupLibrary||[]):state.setups.filter(s=>s.profileId===state.activeProfile);
  }
  function weatherLabel(value){return value==='wet'?'Дождь':value==='hot'?'Жара':value==='mixed'?'Переменно':'Сухо';}
  function renderSetups(){
    const mine=state.setups.filter(s=>s.profileId===state.activeProfile).length;
    const library=(D.setupLibrary||[]).length;
    const pool=setupPool();
    return `<div class="garage-hero card"><div><p class="eyebrow">Setup Garage Pro</p><h2>Библиотека и версии сетапов</h2><p>Фильтруй по симулятору, трассе, машине и погоде. Копируй базовые сетапы, сравнивай изменения и откатывай версии.</p></div><div class="garage-stats"><span><b>${mine}</b> моих</span><span><b>${library}</b> в библиотеке</span><span><b>${state.setupFavorites.length}</b> избранных</span></div></div>
      <div class="toolbar garage-toolbar"><div class="toolbar-group"><div class="search"><input id="setupSearch" placeholder="Название, трасса, машина или тег"></div><div class="segmented" id="setupMode"><button class="${setupViewMode==='mine'?'active':''}" data-value="mine">Мои</button><button class="${setupViewMode==='library'?'active':''}" data-value="library">Библиотека</button></div></div><div class="toolbar-group"><select class="select compact-select" id="setupGame"><option value="all">Все игры</option>${optionList(D.games,'none')}</select><select class="select compact-select" id="setupTrack"><option value="all">Все трассы</option>${optionList(D.tracks,'none')}</select><select class="select compact-select" id="setupWeather"><option value="all">Любая погода</option><option value="dry">Сухо</option><option value="wet">Дождь</option><option value="hot">Жара</option><option value="mixed">Переменно</option></select><button class="secondary favorite-filter ${setupOnlyFavorites?'active':''}" id="setupFavoritesFilter">★ Избранное</button></div><div class="toolbar-group"><button class="secondary" data-action="compare-setups">Сравнить</button><button class="primary" data-action="new-setup">＋ Новый сетап</button></div></div>
      <div id="setupGrid" class="setup-grid pro">${pool.length?pool.map(s=>renderSetupCard(s,setupViewMode)).join(''):renderEmpty('⌘','Нет сетапов','Создай сетап или открой библиотеку готовых базовых конфигураций.')}</div>`;
  }
  function renderSetupCard(s,source=setupViewMode){
    const v=s.values||{};const favorite=state.setupFavorites.includes(s.id);const analysis=analyzeSetup(s);const history=(s.history||[]).length;
    return `<article class="setup-card-wrap"><button class="setup-card pro" data-action="setup-detail" data-id="${esc(s.id)}" data-source="${source}" style="text-align:left;color:inherit"><div class="setup-card-top"><span class="game-badge" style="width:38px;height:38px;color:${game(s.game).accent}">${esc(game(s.game).short)}</span><div class="setup-rating"><span>★ ${Number(s.rating||4.5).toFixed(1)}</span><small>${source==='library'?`${s.downloads||0} копий`:`v${history+1}`}</small></div></div><h3>${esc(s.name)}</h3><p>${esc(track(s.track).name)} · ${esc(car(s.car).name)}</p><div class="tags"><span class="tag weather-${esc(s.weather||'dry')}">${weatherLabel(s.weather||'dry')}</span>${(s.tags||[]).slice(0,3).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><div class="setup-mini"><div><small>Крыло</small><strong>${v.frontWing??'—'} / ${v.rearWing??'—'}</strong></div><div><small>Давление</small><strong>${v.frontPressure??'—'} / ${v.rearPressure??'—'}</strong></div><div><small>Баланс</small><strong>${v.brakeBias??'—'}%</strong></div></div><div class="setup-analysis-preview"><span class="analysis-dot ${analysis.tone}"></span><span>${esc(analysis.summary)}</span></div></button><button class="setup-favorite ${favorite?'active':''}" data-action="toggle-setup-favorite" data-id="${esc(s.id)}" aria-label="Избранное">${favorite?'★':'☆'}</button></article>`;
  }

  function renderCatalog(){
    const trackTypes=uniqueSorted(D.tracks.map(t=>t.type)).map(type=>`<option value="${esc(type)}">${trackTypeLabel(type)}</option>`).join('');
    return `<div class="catalog-hero card"><div><p class="eyebrow">Tracks & Cars Library</p><h2>Каталог стал рабочим инструментом</h2><p>Карточки трасс теперь показывают тип, сложность, конфигурации и доступные симуляторы. Автомобили можно фильтровать по классу и сразу использовать для новой сессии.</p></div><div class="catalog-hero-stats"><span><b>${D.tracks.length}</b> трасс</span><span><b>${D.cars.length}</b> машин</span><span><b>${D.guides.length}</b> гайдов</span></div></div><div class="toolbar catalog-toolbar"><div class="toolbar-group"><div class="search"><input id="catalogSearch" placeholder="Найти трассу, страну, класс или автомобиль"></div><div class="segmented" id="catalogMode"><button class="active" data-value="tracks">Трассы</button><button data-value="cars">Автомобили</button></div></div><div class="toolbar-group"><select class="select compact-select" id="catalogGame"><option value="all">Все игры</option>${optionList(D.games,'none')}</select><select class="select compact-select" id="catalogKind"><option value="all">Все типы</option>${trackTypes}</select></div></div><div id="catalogGrid" class="catalog-grid">${D.tracks.map(renderTrackCard).join('')}</div>`;
  }
  function renderTrackCard(t){const hasGuide=D.guides.some(g=>g.track===t.id);return `<button class="catalog-card catalog-card--track" data-action="catalog-track" data-id="${esc(t.id)}" style="text-align:left;color:inherit"><div class="catalog-visual catalog-visual--track" style="color:var(--text)"><span class="catalog-badge">${trackTypeLabel(t.type)}</span><span class="catalog-guide-flag">${hasGuide?'Гайд':'Схема'}</span><div class="track-frame">${trackSvg(t,'currentColor')}</div><div class="track-visual-meta"><span>${t.length.toFixed(3)} км</span><span>${t.corners} пов.</span></div></div><div class="catalog-content"><div class="catalog-title-row"><h3>${esc(t.name)}</h3><span class="difficulty-pill diff-${Math.min(5,t.difficulty)}">${difficultyLabel(t.difficulty)}</span></div><p>${esc(t.country)} · ${t.configs.slice(0,3).join(' / ')}${t.configs.length>3?' / +'+(t.configs.length-3):''}</p><div class="track-card-footer"><span>${t.games.map(id=>game(id).short).slice(0,4).join(' · ')}</span><span class="dot-rating" aria-label="Сложность ${t.difficulty} из 5">${Array.from({length:5},(_,i)=>`<i class="${i<t.difficulty?'on':''}"></i>`).join('')}</span></div></div></button>`;}
  function renderCarCard(c){const pwr=Math.round(c.power/c.weight*1000);return `<button class="catalog-card catalog-card--car" data-action="catalog-car" data-id="${esc(c.id)}" style="text-align:left;color:inherit"><div class="catalog-visual catalog-visual--car"><span class="catalog-badge">${esc(c.class)}</span><div class="car-visual"><span class="car-type">${esc(carIcon(c))}</span><span class="car-shadow"></span></div><div class="track-visual-meta"><span>${c.drivetrain}</span><span>${pwr} л.с./т</span></div></div><div class="catalog-content"><div class="catalog-title-row"><h3>${esc(c.name)}</h3><span class="difficulty-pill">${esc(c.drivetrain)}</span></div><p>${esc(c.class)} · ${c.power} л.с. · ${c.weight} кг</p><div class="track-card-footer"><span>${c.games.map(id=>game(id).short).slice(0,5).join(' · ')}</span><span class="link-button">Открыть →</span></div></div></button>`;}

  function guideCompletion(id){const done=state.guideProgress[id]||[];const guide=D.guides.find(g=>g.track===id);return guide?.checklist?.length?Math.round(done.filter(Boolean).length/guide.checklist.length*100):0;}
  function renderGuides(){
    const completed=D.guides.filter(g=>guideCompletion(g.track)===100).length;
    const avg=D.guides.length?Math.round(D.guides.reduce((sum,g)=>sum+guideCompletion(g.track),0)/D.guides.length):0;
    return `<div class="academy-hero card"><div><p class="eyebrow">Track Academy Pro</p><h2>Траектория, торможение и тренировочный план</h2><p>Разбор ключевых зон, режимы «квалификация / гонка / дождь / защита», телеметрические ориентиры и мини-тесты.</p></div><div class="academy-progress" style="--academy-p:${avg}%"><strong>${avg}%</strong><span>общий прогресс</span><small>${completed} гайдов завершено</small></div></div><div class="toolbar"><div class="toolbar-group"><div class="search"><input id="guideSearch" placeholder="Найти трассу, поворот или ошибку"></div><select class="select compact-select" id="guideLevel"><option value="all">Любая сложность</option><option value="Средний">Средний</option><option value="Продвинутый">Продвинутый</option><option value="Эксперт">Эксперт</option></select></div><span class="pill">${D.guides.length} подробных гайдов</span></div><div id="guideGrid" class="guide-grid">${D.guides.map(renderGuideCard).join('')}</div>`;
  }
  function renderGuideCard(g){const t=track(g.track),progress=guideCompletion(g.track),quiz=state.guideQuiz[g.track],cover=g.cover||'',hasCover=Boolean(cover),heroClass=`guide-photo${hasCover?'':' guide-photo--schematic'}`;const hero=hasCover?`<div class="${heroClass}"><img class="guide-photo-img" src="${esc(cover)}" alt="${esc(t.name)}" loading="lazy" decoding="async" onerror="this.closest('.guide-photo').classList.add('guide-photo--schematic');this.remove()"><span class="guide-level">${esc(g.level)}</span><span class="guide-country">${esc(t.country)}</span><div class="guide-map" aria-hidden="true">${trackSvg(t,'#ffffff')}</div></div>`:`<div class="${heroClass}"><span class="guide-level">${esc(g.level)}</span><div class="guide-blueprint"><div class="guide-blueprint-copy"><p class="guide-kicker">Track Academy</p><h4>${esc(t.name)}</h4><div class="guide-blueprint-meta">${esc(t.country)} • ${t.length.toFixed(3)} км • ${t.corners} поворотов</div><div class="guide-configs">${t.configs.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}${t.configs.length>3?`<span>+${t.configs.length-3}</span>`:''}</div></div><div class="guide-map guide-map--large" aria-hidden="true">${trackSvg(t,'#ffffff')}</div></div></div>`;return `<button type="button" class="guide-card ${hasCover?'':'guide-card--schematic'}" data-action="guide-detail" data-id="${g.track}" style="text-align:left;color:inherit">${hero}<div class="guide-content"><div class="guide-title-row"><h3>${esc(t.name)}</h3>${quiz?`<span class="quiz-score">Тест ${quiz.score}/${quiz.total}</span>`:''}</div><p>${esc(g.summary)}</p>${hasCover?`<div class="guide-configs">${t.configs.slice(0,3).map(x=>`<span>${esc(x)}</span>`).join('')}${t.configs.length>3?`<span>+${t.configs.length-3}</span>`:''}</div>`:''}<div class="guide-progress" aria-label="Прогресс ${progress}%"><span style="width:${progress}%"></span></div><div class="guide-actions"><span class="corner-count">${g.sectors.length} зон · ${t.corners} поворотов · ${progress}%</span><span class="link-button">Изучить →</span></div></div></button>`;}

  function renderSettings(){
    const p=profile();
    return `<div class="settings-grid">
      <div class="stack">
        <article class="card setting-card"><div class="card-head"><div><h2>Профили пилота</h2><p>Раздельные цели, сессии и сетапы</p></div></div><div class="grid-2">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===p.id?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} · ${x.focus}</small></span><span>${x.id===p.id?'✓':'›'}</span></button>`).join('')}</div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Визуальные темы</h2><p>Применяются ко всему интерфейсу и PWA</p></div></div><div class="theme-grid">${D.themes.map(t=>`<button class="theme-option ${state.theme===t.id?'active':''}" data-action="set-theme" data-id="${t.id}"><span class="theme-swatch" style="--swatch:${t.preview};--swatch-accent:${t.accent}"></span><strong>${esc(t.name)}</strong></button>`).join('')}</div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Данные</h2><p>Экспорт, импорт и резервная копия</p></div></div>
          <div class="setting-row"><div><h3>Полная копия JSON</h3><p>Сессии, сетапы, профили и настройки.</p></div><button class="secondary" data-action="export-json">Скачать</button></div>
          <div class="setting-row"><div><h3>Таблица сессий CSV</h3><p>Для Excel, Numbers и анализа в Python.</p></div><button class="secondary" data-action="export-csv">Скачать</button></div>
          <div class="setting-row"><div><h3>Импорт данных</h3><p>SimGrid JSON или CSV с колонками времени круга.</p></div><button class="secondary" data-action="import-data">Выбрать</button></div>
        </article>
      </div>
      <div class="stack">
        <article class="card setting-card"><div class="steam-panel"><div class="steam-logo"><span>◉</span><div><h3>${state.steam.profile?esc(state.steam.profile.personaname):'Steam Connector'}</h3><p style="margin:3px 0 0">${state.steam.lastSync?'Последняя синхронизация '+new Date(state.steam.lastSync).toLocaleString('ru-RU'):'Безопасная синхронизация профиля и игр'}</p></div></div>
          <p>Steam используется для определения профиля, библиотеки и недавно запущенного симулятора. Времена кругов и сетапы импортируются из телеметрии игры: Steam их не хранит.</p>
          ${state.steam.profile?.avatarfull?`<div style="display:flex;gap:12px;align-items:center;margin:13px 0"><img src="${esc(state.steam.profile.avatarfull)}" alt="" style="width:54px;height:54px;border-radius:14px"><div><strong>${esc(state.steam.profile.personaname||'Steam')}</strong><small style="display:block;color:#9eaac0;margin-top:4px">${state.steam.ownedGames.length} игр получено</small></div></div>`:''}
          <button class="primary" data-action="steam-connect" style="width:100%">${state.steam.profile?'Обновить Steam':'Настроить Steam'}</button>
        </div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Телеметрия с ПК</h2><p>ACC, iRacing, F1 и совместимые инструменты</p></div></div><div class="notice">iOS PWA не может напрямую читать память или UDP игрового ПК. Папка <b>telemetry-bridge</b> в архиве содержит формат импорта и локальный конвертер. Результат переносится в приложение одним JSON-файлом.</div><div class="setting-row"><div><h3>Импорт последней сессии</h3><p>Поддерживается SimGrid JSON и универсальный CSV.</p></div><button class="secondary" data-action="import-data">Импорт</button></div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Приложение</h2><p>Локальные параметры</p></div></div>
          <div class="setting-row"><div><h3>Сброс демо-данных</h3><p>Вернуть три примера сессий и сетапов.</p></div><button class="secondary" data-action="restore-demo">Вернуть</button></div>
          <div class="setting-row"><div><h3>Очистить всё</h3><p>Удалить локальные сессии, сетапы и настройки Steam.</p></div><button class="danger-button" data-action="clear-data">Очистить</button></div>
        </article>
      </div>
    </div>`;
  }

  function renderEmpty(icon,title,text){return `<div class="empty"><div class="empty-icon">${icon}</div><h3>${title}</h3><p>${text}</p></div>`;}
  function bindViewEnhancements(){
    if(route==='dashboard'){drawProgressChart();startLiveTicker();}
    if(route==='sessions')bindSessionFilters();
    if(route==='setups')bindSetupFilter();
    if(route==='catalog')bindCatalog();
    if(route==='guides')bindGuideFilter();
  }
  function drawProgressChart(){
    const canvas=document.getElementById('progressChart');if(!canvas)return;const rect=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,rect.width*dpr);canvas.height=Math.max(1,rect.height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    const w=rect.width,h=rect.height,pad={l:46,r:16,t:18,b:28};const all=sessionsForProfile();const focus=all[0];const rows=(focus?all.filter(s=>s.track===focus.track&&s.car===focus.car&&s.game===focus.game):[]).slice().reverse().map(s=>({date:s.date,v:lapToMs(s.bestLap)})).filter(x=>Number.isFinite(x.v)).slice(-12);
    ctx.clearRect(0,0,w,h);const line=getCss('--line-strong'),muted=getCss('--muted'),accent=getCss('--accent'),panel=getCss('--panel2');ctx.font='10px -apple-system';ctx.fillStyle=muted;
    if(rows.length<2){ctx.textAlign='center';ctx.fillText('Добавьте минимум две сессии для графика',w/2,h/2);return;}
    let min=Math.min(...rows.map(x=>x.v)),max=Math.max(...rows.map(x=>x.v));const range=Math.max(1000,max-min);min-=range*.18;max+=range*.18;
    for(let i=0;i<5;i++){const y=pad.t+(h-pad.t-pad.b)*i/4;ctx.strokeStyle=line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(msToLap(max-(max-min)*i/4).slice(0,-1),pad.l-8,y+3);}
    const pts=rows.map((r,i)=>({x:pad.l+(w-pad.l-pad.r)*i/(rows.length-1),y:pad.t+(h-pad.t-pad.b)*(r.v-min)/(max-min),...r}));
    const grad=ctx.createLinearGradient(0,pad.t,0,h-pad.b);grad.addColorStop(0,colorAlpha(accent,.32));grad.addColorStop(1,colorAlpha(accent,0));ctx.beginPath();ctx.moveTo(pts[0].x,h-pad.b);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts.at(-1).x,h-pad.b);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
    ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
    pts.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=panel;ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.stroke();if(i===0||i===pts.length-1){ctx.fillStyle=muted;ctx.textAlign=i===0?'left':'right';ctx.fillText(new Date(`${p.date}T12:00:00`).toLocaleDateString('ru-RU',{day:'numeric',month:'short'}),p.x,h-7);}});
  }
  function getCss(name){return getComputedStyle(document.documentElement).getPropertyValue(name).trim();}
  function colorAlpha(hex,a){if(hex.startsWith('#')){let h=hex.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');const n=parseInt(h,16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}return hex;}

  function bindSessionFilters(){
    const search=document.getElementById('sessionSearch'),gameFilter=document.getElementById('sessionGameFilter'),type=document.getElementById('sessionTypeFilter');let selectedType='all';
    const run=()=>{const q=(search.value||'').toLowerCase();const gid=gameFilter.value;const rows=sessionsForProfile().filter(s=>(gid==='all'||s.game===gid)&&(selectedType==='all'||s.sessionType===selectedType)&&`${track(s.track).name} ${car(s.car).name} ${s.notes||''}`.toLowerCase().includes(q));document.getElementById('sessionList').innerHTML=rows.length?rows.map(renderSessionRow).join(''):renderEmpty('⌕','Ничего не найдено','Измените фильтр или поисковый запрос.');};
    search.addEventListener('input',run);gameFilter.addEventListener('change',run);type.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;selectedType=b.dataset.value;type.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));run();});
  }
  function bindSetupFilter(){
    const search=document.getElementById('setupSearch'),gameFilter=document.getElementById('setupGame'),trackFilter=document.getElementById('setupTrack'),weatherFilter=document.getElementById('setupWeather'),mode=document.getElementById('setupMode'),fav=document.getElementById('setupFavoritesFilter');
    const run=()=>{const q=(search?.value||'').toLowerCase(),gid=gameFilter?.value||'all',tid=trackFilter?.value||'all',weather=weatherFilter?.value||'all';const rows=setupPool().filter(s=>(gid==='all'||s.game===gid)&&(tid==='all'||s.track===tid)&&(weather==='all'||(s.weather||'dry')===weather)&&(!setupOnlyFavorites||state.setupFavorites.includes(s.id))&&`${s.name} ${track(s.track).name} ${car(s.car).name} ${(s.tags||[]).join(' ')} ${s.description||''}`.toLowerCase().includes(q));document.getElementById('setupGrid').innerHTML=rows.length?rows.map(s=>renderSetupCard(s,setupViewMode)).join(''):renderEmpty('⌕','Сетапы не найдены','Измени фильтры или переключись между гаражом и библиотекой.');};
    [search,gameFilter,trackFilter,weatherFilter].forEach(el=>el?.addEventListener(el===search?'input':'change',run));
    mode?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;setupViewMode=b.dataset.value;mode.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));run();});
    fav?.addEventListener('click',()=>{setupOnlyFavorites=!setupOnlyFavorites;fav.classList.toggle('active',setupOnlyFavorites);run();});
  }
  function bindCatalog(){
    const mode=document.getElementById('catalogMode'),search=document.getElementById('catalogSearch'),gf=document.getElementById('catalogGame'),kind=document.getElementById('catalogKind');let current='tracks';
    const fillKind=()=>{if(!kind)return;const values=current==='tracks'?uniqueSorted(D.tracks.map(t=>t.type)):uniqueSorted(D.cars.map(c=>c.class));kind.innerHTML=`<option value="all">${current==='tracks'?'Все типы':'Все классы'}</option>`+values.map(v=>`<option value="${esc(v)}">${current==='tracks'?trackTypeLabel(v):esc(v)}</option>`).join('');};
    const run=()=>{const q=(search?.value||'').toLowerCase(),gid=gf?.value||'all',k=kind?.value||'all';const list=current==='tracks'?D.tracks.filter(t=>(gid==='all'||t.games.includes(gid))&&(k==='all'||t.type===k)&&`${t.name} ${t.country} ${t.configs.join(' ')} ${trackTypeLabel(t.type)}`.toLowerCase().includes(q)):D.cars.filter(c=>(gid==='all'||c.games.includes(gid))&&(k==='all'||c.class===k)&&`${c.name} ${c.class} ${c.drivetrain}`.toLowerCase().includes(q));document.getElementById('catalogGrid').innerHTML=list.length?list.map(current==='tracks'?renderTrackCard:renderCarCard).join(''):renderEmpty('⌕','Ничего не найдено','Измени игру, тип/класс или поисковый запрос.');};
    mode?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;current=b.dataset.value;mode.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));fillKind();run();});
    search?.addEventListener('input',run);gf?.addEventListener('change',run);kind?.addEventListener('change',run);
    fillKind();
  }
  function bindGuideFilter(){const input=document.getElementById('guideSearch'),level=document.getElementById('guideLevel');const run=()=>{const q=(input?.value||'').toLowerCase(),l=level?.value||'all';const list=D.guides.filter(g=>(l==='all'||g.level===l)&&`${track(g.track).name} ${g.summary} ${g.sectors.map(s=>s.name+' '+s.tip+' '+s.braking).join(' ')} ${g.mistakes.join(' ')}`.toLowerCase().includes(q));document.getElementById('guideGrid').innerHTML=list.length?list.map(renderGuideCard).join(''):renderEmpty('⌕','Гайд не найден','Проверь название трассы, поворота или уровень сложности.');};input?.addEventListener('input',run);level?.addEventListener('change',run);}

  function openModal(content,size=''){els.modalRoot.innerHTML=`<div class="modal-backdrop" data-modal-backdrop><div class="modal ${size}" role="dialog" aria-modal="true">${content}</div></div>`;document.body.style.overflow='hidden';setTimeout(()=>els.modalRoot.querySelector('input,select,button')?.focus(),20);}
  function closeModal(){els.modalRoot.innerHTML='';document.body.style.overflow='';}
  function modalShell(title,body,actions=''){return `<div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close" data-action="close-modal">×</button></div><div class="modal-body">${body}</div>${actions?`<div class="modal-actions">${actions}</div>`:''}`;}

  function showSessionForm(seed={}){
    const s={profileId:state.activeProfile,date:today(),game:state.live.game,track:state.live.track,config:track(state.live.track).configs?.[0]||'Grand Prix',car:state.live.car,weather:'Сухо · 24°C',sessionType:'Практика',bestLap:'',averageLap:'',laps:0,cleanLaps:0,fuelStart:0,fuelEnd:0,tyreWear:0,notes:'',lapTimes:[],...seed};
    const body=`<form id="sessionForm"><div class="form-section"><div class="form-grid three"><div class="field"><label>Дата</label><input class="input" name="date" type="date" value="${esc(s.date)}" required></div><div class="field"><label>Игра</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>Тип</label><select class="select" name="sessionType">${['Практика','Квалификация','Гонка','Time Attack','Drift'].map(x=>`<option ${x===s.sessionType?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>Конфигурация</label><input class="input" name="config" value="${esc(s.config)}"></div><div class="field"><label>Машина</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field full"><label>Погода / температура</label><input class="input" name="weather" value="${esc(s.weather)}"></div></div></div>
      <div class="form-section"><h3>Результаты</h3><div class="form-grid three"><div class="field"><label>Лучший круг</label><input class="input" name="bestLap" placeholder="1:42.381" value="${esc(s.bestLap)}"></div><div class="field"><label>Средний круг</label><input class="input" name="averageLap" placeholder="1:44.020" value="${esc(s.averageLap)}"></div><div class="field"><label>Кругов</label><input class="input" name="laps" type="number" min="0" value="${s.laps||0}"></div><div class="field"><label>Чистых кругов</label><input class="input" name="cleanLaps" type="number" min="0" value="${s.cleanLaps||0}"></div><div class="field"><label>Топливо старт, л</label><input class="input" name="fuelStart" type="number" step="0.1" value="${s.fuelStart||0}"></div><div class="field"><label>Топливо финиш, л</label><input class="input" name="fuelEnd" type="number" step="0.1" value="${s.fuelEnd||0}"></div><div class="field"><label>Износ шин, %</label><input class="input" name="tyreWear" type="number" min="0" max="100" value="${s.tyreWear||0}"></div></div></div>
      <div class="form-section"><h3>Серия кругов</h3><div class="field"><label>По одному времени на строку</label><textarea class="textarea" name="lapTimes" placeholder="1:44.210\n1:43.881\n1:43.522">${esc((s.lapTimes||[]).join('\n'))}</textarea><span class="field-help">Стабильность и среднее время будут рассчитаны автоматически.</span></div></div>
      <div class="form-section"><div class="field"><label>Заметки пилота</label><textarea class="textarea" name="notes" placeholder="Баланс, ошибки, точки торможения…">${esc(s.notes)}</textarea></div></div></form>`;
    openModal(modalShell(s.id?'Редактировать сессию':'Новая сессия',body,`<button class="secondary" data-action="close-modal">Отмена</button><button class="primary" data-action="save-session" data-id="${esc(s.id||'')}">Сохранить</button>`));
  }
  function saveSession(id){
    const form=document.getElementById('sessionForm');if(!form?.reportValidity())return;const fd=new FormData(form);const lapTimes=String(fd.get('lapTimes')||'').split(/[\n;,]+/).map(x=>x.trim()).filter(x=>Number.isFinite(lapToMs(x)));const avg=lapTimes.length?msToLap(lapTimes.reduce((a,x)=>a+lapToMs(x),0)/lapTimes.length):String(fd.get('averageLap')||'');const best=lapTimes.length?msToLap(Math.min(...lapTimes.map(lapToMs))):String(fd.get('bestLap')||'');
    const entry={id:id||uid('session'),profileId:state.activeProfile,date:String(fd.get('date')),game:String(fd.get('game')),track:String(fd.get('track')),config:String(fd.get('config')),car:String(fd.get('car')),weather:String(fd.get('weather')),sessionType:String(fd.get('sessionType')),bestLap:best,averageLap:avg,laps:+fd.get('laps')||lapTimes.length,cleanLaps:+fd.get('cleanLaps')||0,consistency:lapTimes.length?consistencyFromLaps(lapTimes):0,fuelStart:+fd.get('fuelStart')||0,fuelEnd:+fd.get('fuelEnd')||0,tyreWear:+fd.get('tyreWear')||0,notes:String(fd.get('notes')||''),lapTimes};
    const idx=state.sessions.findIndex(x=>x.id===id);if(idx>=0)state.sessions[idx]=entry;else state.sessions.push(entry);saveState();closeModal();toast('Сессия сохранена');render();
  }
  function showSessionDetail(id){const s=state.sessions.find(x=>x.id===id);if(!s)return;const laps=(s.lapTimes||[]).map((x,i)=>`<div class="setting-row"><div><h3>Круг ${i+1}</h3><p>${i===0?'Начало серии':lapDelta(x,s.bestLap)}</p></div><strong style="font-variant-numeric:tabular-nums">${esc(x)}</strong></div>`).join('');const body=`<div class="grid-3"><div class="metric card"><small>Лучший круг</small><strong>${esc(s.bestLap)}</strong><span>${esc(track(s.track).name)}</span></div><div class="metric card"><small>Средний</small><strong>${esc(s.averageLap||'—')}</strong><span>${s.laps} кругов</span></div><div class="metric card"><small>Стабильность</small><strong>${(+s.consistency||0).toFixed(1)}%</strong><span>${s.cleanLaps||0} чистых</span></div></div><div class="form-section"><h3>${esc(game(s.game).name)} · ${esc(car(s.car).name)}</h3><p style="color:var(--muted);font-size:12px;line-height:1.6">${formatDate(s.date)} · ${esc(s.sessionType)} · ${esc(s.weather)}<br>${esc(s.notes||'Без заметок')}</p></div>${laps?`<div class="form-section"><h3>Серия кругов</h3>${laps}</div>`:''}`;openModal(modalShell(`${track(s.track).name} · ${s.bestLap}`,body,`<button class="danger-button" data-action="delete-session" data-id="${s.id}">Удалить</button><button class="secondary" data-action="edit-session" data-id="${s.id}">Изменить</button><button class="primary" data-action="close-modal">Готово</button>`));}
  function lapDelta(v,best){const d=lapToMs(v)-lapToMs(best);return d<=0?'Лучший круг':`+${(d/1000).toFixed(3)} сек`;}

  function showLiveConfig(){const l=state.live;const body=`<div class="form-grid"><div class="field"><label>Игра</label><select class="select" id="liveGame">${optionList(D.games,l.game)}</select></div><div class="field"><label>Трасса</label><select class="select" id="liveTrack">${optionList(D.tracks,l.track)}</select></div><div class="field full"><label>Машина</label><select class="select" id="liveCar">${optionList(D.cars,l.car)}</select></div></div>`;openModal(modalShell('Live Activity-сессия',body,`<button class="secondary" data-action="close-modal">Отмена</button><button class="primary" data-action="save-live-config">Сохранить</button>`),'small');}
  function finishLive(){const elapsed=currentElapsed();state.live.running=false;state.live.startTs=null;state.live.elapsed=0;saveState();showSessionForm({game:state.live.game,track:state.live.track,car:state.live.car,laps:state.live.laps||0,bestLap:state.live.best==='—'?'':state.live.best,notes:`Продолжительность live-сессии: ${secondsToClock(elapsed)}`});}

  const setupValueKeys=['frontPressure','rearPressure','frontWing','rearWing','frontARB','rearARB','frontRide','rearRide','brakeBias','tc','abs','fuel','springFront','springRear','camberFront','camberRear','toeFront','toeRear','diffPower','diffCoast'];
  const setupLabels={frontPressure:'Давление перед, PSI',rearPressure:'Давление зад, PSI',frontWing:'Крыло перед',rearWing:'Крыло зад',frontARB:'ARB перед',rearARB:'ARB зад',frontRide:'Клиренс перед, мм',rearRide:'Клиренс зад, мм',brakeBias:'Баланс тормозов, %',tc:'TC',abs:'ABS',fuel:'Топливо, л',springFront:'Пружина перед',springRear:'Пружина зад',camberFront:'Развал перед',camberRear:'Развал зад',toeFront:'Схождение перед',toeRear:'Схождение зад',diffPower:'Дифференциал power, %',diffCoast:'Дифференциал coast, %'};
  function analyzeSetup(s){
    const v=s.values||{},items=[];let score=0;
    const wing=(+v.rearWing||0)-(+v.frontWing||0);if(wing>=5){items.push({title:'Аэробаланс',text:'Высокий запас задней стабильности; возможна недостаточная поворачиваемость в быстрых дугах.',tone:'safe'});score++;}else if(wing<=1){items.push({title:'Аэробаланс',text:'Острый передок и свободная ротация; контролируй заднюю ось на входе.',tone:'attack'});score--;}else items.push({title:'Аэробаланс',text:'Нейтральный баланс между поворотом и стабильностью.',tone:'neutral'});
    const arb=(+v.rearARB||0)-(+v.frontARB||0);if(arb>=2){items.push({title:'Механический баланс',text:'Жёстче задний стабилизатор: машина охотнее вращается, но хуже держит газ на неровностях.',tone:'attack'});score--;}else if(arb<=-2){items.push({title:'Механический баланс',text:'Жёстче передний стабилизатор: стабильнее на выходе, возможен пуш передней оси.',tone:'safe'});score++;}
    const rake=(+v.rearRide||0)-(+v.frontRide||0);if(rake>16)items.push({title:'Платформа',text:'Большой rake усиливает ротацию и чувствительность к высоте кузова.',tone:'attack'});else if(rake<8)items.push({title:'Платформа',text:'Плоская платформа предсказуема, но может давать меньше аэроротации.',tone:'safe'});else items.push({title:'Платформа',text:'Умеренный rake подходит для универсального гоночного баланса.',tone:'neutral'});
    const bias=+v.brakeBias||54;if(bias>56)items.push({title:'Торможение',text:'Сильный передний баланс: безопаснее задняя ось, но выше риск блокировки передних шин.',tone:'safe'});else if(bias<52)items.push({title:'Торможение',text:'Задний баланс помогает повороту, но требует аккуратного trail braking.',tone:'attack'});else items.push({title:'Торможение',text:'Баланс тормозов находится в универсальном рабочем диапазоне.',tone:'neutral'});
    const p=((+v.frontPressure||0)+(+v.rearPressure||0))/2;if(p>27.4)items.push({title:'Шины',text:'Высокое давление может перегреть центр протектора на длинной серии.',tone:'warn'});else if(p&&p<25.5)items.push({title:'Шины',text:'Низкое давление даст сцепление после прогрева, но увеличит деформацию и нагрев.',tone:'warn'});else items.push({title:'Шины',text:'Давление близко к типичному базовому диапазону GT-сетапа.',tone:'neutral'});
    const summary=score>=2?'Стабильный и безопасный баланс':score<=-2?'Острый атакующий баланс':'Сбалансированная база';
    return {summary,tone:score>=2?'safe':score<=-2?'attack':'neutral',items};
  }
  function showSetupForm(seed={}){
    const defaults={name:'',game:'acc',track:'spa',car:'m4gt3',weather:'dry',temperature:24,rating:4,notes:'',tags:[],history:[],values:{frontPressure:26.7,rearPressure:26.7,frontWing:5,rearWing:8,frontARB:4,rearARB:2,frontRide:55,rearRide:68,brakeBias:54.5,tc:4,abs:3,fuel:50,springFront:0,springRear:0,camberFront:-3.1,camberRear:-2.7,toeFront:.03,toeRear:.14,diffPower:55,diffCoast:45}};
    const s={...defaults,...seed,values:{...defaults.values,...(seed.values||{})}};const v=s.values;
    const groups=[['Шины и геометрия',['frontPressure','rearPressure','camberFront','camberRear','toeFront','toeRear']],['Аэродинамика и платформа',['frontWing','rearWing','frontRide','rearRide']],['Подвеска',['frontARB','rearARB','springFront','springRear']],['Тормоза, дифференциал и электроника',['brakeBias','diffPower','diffCoast','tc','abs','fuel']]];
    const fields=keys=>keys.map(id=>`<div class="field"><label>${setupLabels[id]}</label><input class="input" name="${id}" type="number" step="${['frontPressure','rearPressure','brakeBias','camberFront','camberRear','toeFront','toeRear'].includes(id)?.01:1}" value="${v[id]??0}"></div>`).join('');
    const body=`<form id="setupForm"><div class="form-grid three"><div class="field full"><label>Название</label><input class="input" name="name" value="${esc(s.name)}" required></div><div class="field"><label>Игра</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>Машина</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field"><label>Погода</label><select class="select" name="weather"><option value="dry" ${s.weather==='dry'?'selected':''}>Сухо</option><option value="wet" ${s.weather==='wet'?'selected':''}>Дождь</option><option value="hot" ${s.weather==='hot'?'selected':''}>Жара</option><option value="mixed" ${s.weather==='mixed'?'selected':''}>Переменно</option></select></div><div class="field"><label>Температура трассы, °C</label><input class="input" name="temperature" type="number" value="${s.temperature??24}"></div><div class="field"><label>Оценка</label><select class="select" name="rating">${[1,2,3,4,5].map(x=>`<option value="${x}" ${Number(s.rating||4)===x?'selected':''}>${'★'.repeat(x)}</option>`).join('')}</select></div><div class="field full"><label>Теги через запятую</label><input class="input" name="tags" value="${esc((s.tags||[]).join(', '))}"></div></div>${groups.map(([title,keys])=>`<div class="form-section"><h3>${title}</h3><div class="form-grid three">${fields(keys)}</div></div>`).join('')}<div class="form-section"><div class="field"><label>Заметки и поведение машины</label><textarea class="textarea" name="notes" placeholder="Что изменилось, где стало лучше или хуже…">${esc(s.notes||'')}</textarea></div></div></form>`;
    openModal(modalShell(s.id?'Редактировать сетап':'Новый сетап',body,`<button class="secondary" data-action="close-modal">Отмена</button><button class="primary" data-action="save-setup" data-id="${esc(s.id||'')}">Сохранить</button>`));
  }
  function saveSetup(id){
    const form=document.getElementById('setupForm');if(!form?.reportValidity())return;const fd=new FormData(form);const existing=state.setups.find(x=>x.id===id);const history=[...(existing?.history||[])];
    if(existing)history.push({savedAt:new Date().toISOString(),name:existing.name,weather:existing.weather,temperature:existing.temperature,rating:existing.rating,notes:existing.notes,tags:existing.tags,values:structuredCloneSafe(existing.values)});
    const entry={id:id||uid('setup'),profileId:state.activeProfile,name:String(fd.get('name')),game:String(fd.get('game')),track:String(fd.get('track')),car:String(fd.get('car')),weather:String(fd.get('weather')||'dry'),temperature:+fd.get('temperature')||24,rating:+fd.get('rating')||4,notes:String(fd.get('notes')||''),created:existing?.created||today(),updated:today(),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),history,values:Object.fromEntries(setupValueKeys.map(k=>[k,+fd.get(k)||0]))};
    const idx=state.setups.findIndex(x=>x.id===id);if(idx>=0)state.setups[idx]=entry;else state.setups.push(entry);saveState();closeModal();toast(existing?'Новая версия сетапа сохранена':'Сетап сохранён');render();
  }
  function setupBySource(id,source='mine'){return source==='library'?(D.setupLibrary||[]).find(x=>x.id===id):state.setups.find(x=>x.id===id);}
  function showSetupDetail(id,source='mine'){
    const s=setupBySource(id,source);if(!s)return;const analysis=analyzeSetup(s),favorite=state.setupFavorites.includes(s.id),history=(s.history||[]).length;
    const body=`<div class="setup-detail-head"><div><div class="tags"><span class="tag weather-${esc(s.weather||'dry')}">${weatherLabel(s.weather||'dry')}</span>${(s.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><p>${esc(game(s.game).name)} · ${esc(track(s.track).name)} · ${esc(car(s.car).name)}</p></div><div class="setup-score"><strong>★ ${Number(s.rating||4.5).toFixed(1)}</strong><small>${source==='library'?`${s.downloads||0} копий`:`Версия ${history+1}`}</small></div></div>${s.description||s.notes?`<div class="guide-summary">${esc(s.description||s.notes)}</div>`:''}<div class="analysis-grid">${analysis.items.map(x=>`<article class="analysis-card ${x.tone}"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></article>`).join('')}</div><div class="form-section"><h3>Параметры</h3><table class="compare-table"><tbody>${setupValueKeys.filter(k=>s.values?.[k]!==undefined).map(k=>`<tr><th>${setupLabels[k]}</th><td>${s.values[k]}</td></tr>`).join('')}</tbody></table></div>${source==='mine'&&history?`<div class="notice">История содержит ${history} сохранённых версий. Можно открыть её и откатить параметры.</div>`:''}`;
    const actions=source==='library'?`<button class="secondary" data-action="toggle-setup-favorite" data-id="${s.id}">${favorite?'★ В избранном':'☆ В избранное'}</button><button class="primary" data-action="copy-library-setup" data-id="${s.id}">Скопировать в гараж</button>`:`<button class="secondary" data-action="toggle-setup-favorite" data-id="${s.id}">${favorite?'★ В избранном':'☆ В избранное'}</button>${history?`<button class="secondary" data-action="setup-history" data-id="${s.id}">История</button>`:''}<button class="secondary" data-action="edit-setup" data-id="${s.id}">Изменить</button><button class="danger-button" data-action="delete-setup" data-id="${s.id}">Удалить</button>`;
    openModal(modalShell(s.name,body,actions));
  }
  function toggleSetupFavorite(id){const i=state.setupFavorites.indexOf(id);if(i>=0)state.setupFavorites.splice(i,1);else state.setupFavorites.push(id);saveState();toast(i>=0?'Удалено из избранного':'Добавлено в избранное');if(els.modalRoot.innerHTML)closeModal();render();}
  function copyLibrarySetup(id){const src=(D.setupLibrary||[]).find(x=>x.id===id);if(!src)return;const copy={...structuredCloneSafe(src),id:uid('setup'),library:false,profileId:state.activeProfile,name:src.name.replace(/^[^·]+ · /,''),created:today(),updated:today(),history:[],rating:Math.round(src.rating||4),notes:`База из библиотеки SimGrid. ${src.description||''}`};state.setups.push(copy);saveState();closeModal();setupViewMode='mine';toast('Сетап скопирован в гараж');render();}
  function showSetupHistory(id){const s=state.setups.find(x=>x.id===id);if(!s)return;const history=[...(s.history||[])].reverse();const body=history.length?`<div class="version-list">${history.map((v,i)=>`<article class="version-card"><div><strong>Версия ${history.length-i}</strong><small>${new Date(v.savedAt).toLocaleString('ru-RU')}</small><p>${esc(v.notes||'Без заметок')}</p></div><button class="secondary" data-action="restore-setup-version" data-id="${id}" data-index="${(s.history||[]).length-1-i}">Восстановить</button></article>`).join('')}</div>`:renderEmpty('↶','История пуста','Измени и сохрани сетап — предыдущая версия появится здесь.');openModal(modalShell(`История · ${s.name}`,body,`<button class="primary" data-action="close-modal">Готово</button>`),'small');}
  function restoreSetupVersion(id,index){const s=state.setups.find(x=>x.id===id),v=s?.history?.[Number(index)];if(!s||!v)return;s.history.push({savedAt:new Date().toISOString(),name:s.name,weather:s.weather,temperature:s.temperature,rating:s.rating,notes:s.notes,tags:s.tags,values:structuredCloneSafe(s.values)});Object.assign(s,{name:v.name||s.name,weather:v.weather||s.weather,temperature:v.temperature??s.temperature,rating:v.rating??s.rating,notes:v.notes||'',tags:v.tags||[],values:structuredCloneSafe(v.values)});saveState();closeModal();toast('Версия восстановлена');render();}

  function showCompareSetups(){const list=state.setups.filter(s=>s.profileId===state.activeProfile);if(list.length<2){toast('Для сравнения нужны минимум два сетапа','warn');return;}const body=`<div class="form-grid"><div class="field"><label>Сетап A</label><select class="select" id="compareA">${optionList(list,list[0].id,x=>x.name)}</select></div><div class="field"><label>Сетап B</label><select class="select" id="compareB">${optionList(list,list[1].id,x=>x.name)}</select></div></div><div id="compareResult" class="form-section"></div>`;openModal(modalShell('Сравнение сетапов',body,`<button class="secondary" data-action="close-modal">Закрыть</button><button class="primary" data-action="run-compare">Сравнить</button>`));renderCompare(list[0].id,list[1].id);}
  function renderCompare(aId,bId){const a=state.setups.find(x=>x.id===aId),b=state.setups.find(x=>x.id===bId),root=document.getElementById('compareResult');if(!a||!b||!root)return;root.innerHTML=`<table class="compare-table"><thead><tr><th>Параметр</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th>Δ B−A</th></tr></thead><tbody>${setupValueKeys.map(k=>{const av=+a.values?.[k]||0,bv=+b.values?.[k]||0,d=bv-av;return `<tr><th>${setupLabels[k]}</th><td>${av}</td><td>${bv}</td><td class="${d>0?'diff-positive':d<0?'diff-negative':''}">${d>0?'+':''}${Number(d.toFixed(2))}</td></tr>`}).join('')}</tbody></table><div class="analysis-grid" style="margin-top:14px"><article class="analysis-card ${analyzeSetup(a).tone}"><h3>${esc(a.name)}</h3><p>${esc(analyzeSetup(a).summary)}</p></article><article class="analysis-card ${analyzeSetup(b).tone}"><h3>${esc(b.name)}</h3><p>${esc(analyzeSetup(b).summary)}</p></article></div>`;}

  function telemetryBar(label,value,type){return `<div class="telemetry-row"><span>${label}</span><div><i class="${type}" style="width:${Math.max(4,Math.min(100,value))}%"></i></div><b>${value}%</b></div>`;}
  function showGuideDetail(trackId){
    const g=D.guides.find(x=>x.track===trackId);if(!g)return;const t=track(trackId),done=state.guideProgress[trackId]||[],quiz=state.guideQuiz[trackId];
    const modes=(g.modes||[]).map(m=>`<article class="training-mode"><span>${m.icon}</span><div><h4>${esc(m.name)}</h4><small>${esc(m.focus)}</small><p>${esc(m.note)}</p></div></article>`).join('');
    const sectors=g.sectors.map((sector,i)=>`<article class="academy-sector"><div class="sector-head"><span class="corner-num">${i+1}</span><div><h3>${esc(sector.name)}</h3><p>${esc(sector.tip)}</p></div><span class="gear">${esc(sector.gear)} передача</span></div><div class="sector-facts"><span><small>Торможение</small><b>${esc(sector.braking)}</b></span><span><small>Вход</small><b>${esc(sector.entrySpeed)}</b></span><span><small>Апекс</small><b>${esc(sector.apex)}</b></span><span><small>Газ</small><b>${esc(sector.throttle)}</b></span><span><small>Поребрик</small><b>${esc(sector.curb)}</b></span></div><div class="telemetry-panel">${telemetryBar('Тормоз',sector.telemetry?.brake||50,'brake')}${telemetryBar('Газ',sector.telemetry?.throttle||50,'throttle')}${telemetryBar('Руль',sector.telemetry?.steering||50,'steering')}</div></article>`).join('');
    const checklist=(g.checklist||[]).map((item,i)=>`<button class="guide-task ${done[i]?'done':''}" data-action="toggle-guide-task" data-id="${trackId}" data-index="${i}"><span>${done[i]?'✓':'○'}</span><b>${esc(item)}</b></button>`).join('');
    const hero= g.hero ? `<div class="guide-detail-hero"><img src="${esc(g.hero)}" alt="${esc(t.name)}" loading="eager" referrerpolicy="no-referrer" onerror="this.closest('.guide-detail-hero').classList.add('guide-detail-hero--schematic');this.remove()"><div class="guide-detail-title"><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} км · ${t.corners} поворотов · ${esc(t.country)}</p></div><div class="guide-detail-mapfloat">${trackSvg(t,'#ffffff')}</div></div>` : `<div class="guide-detail-hero guide-detail-hero--schematic"><div class="guide-detail-blueprint"><div class="guide-detail-copy"><p class="guide-kicker">Track Academy</p><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} км · ${t.corners} поворотов · ${esc(t.country)}</p><div class="guide-configs">${t.configs.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div><div class="guide-detail-trackbox">${trackSvg(t,'#ffffff')}</div></div></div>`;const body=`${hero}<div class="guide-summary">${esc(g.summary)} Все скорости и точки торможения — стартовые ориентиры: корректируй их под машину, топливо, погоду и симулятор.</div><div class="guide-quickfacts" style="margin:16px 0 18px"><div class="metric card"><small>Конфигурации</small><strong>${t.configs.length}</strong><span>${esc(t.configs.join(' / '))}</span></div><div class="metric card"><small>Прогресс</small><strong>${guideCompletion(trackId)}%</strong><span>${done.filter(Boolean).length} из ${(g.checklist||[]).length} задач</span></div><div class="metric card"><small>Мини-тест</small><strong>${quiz?`${quiz.score}/${quiz.total}`:'—'}</strong><span>${quiz?'последний результат':'ещё не пройден'}</span></div></div><section class="academy-section"><div class="card-head"><div><h2>Режим тренировки</h2><p>Одна трасса — разные цели и линии</p></div></div><div class="training-modes">${modes}</div></section><div class="academy-layout"><main><section class="academy-section"><div class="card-head"><div><h2>Разбор ключевых зон</h2><p>Точка торможения, апекс, газ и телеметрический ориентир</p></div></div><div class="academy-sectors">${sectors}</div></section></main><aside class="stack"><article class="guide-map-panel"><div class="card-head" style="margin-bottom:0"><div><h3>Схема трассы</h3><p>Опорная карта последовательности зон</p></div></div><div class="guide-track-map" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><p class="guide-map-caption">Сначала зафиксируй ориентир торможения, затем апекс и только после этого ускоряй выход.</p></article><article class="card card-pad"><div class="card-head"><div><h3>Базовый сетап</h3></div></div>${g.setup.map(x=>`<div class="setting-row"><div><h3>${esc(x)}</h3></div><span>✓</span></div>`).join('')}</article><article class="card card-pad"><div class="card-head"><div><h3>Типичные ошибки</h3></div></div>${g.mistakes.map(x=>`<div class="setting-row"><div><h3>${esc(x)}</h3></div><span style="color:var(--danger)">!</span></div>`).join('')}</article><article class="card card-pad"><div class="card-head"><div><h3>Чек-лист тренировки</h3><p>Прогресс сохраняется локально</p></div></div><div class="guide-checklist">${checklist}</div></article></aside></div>`;
    openModal(modalShell(`Гайд · ${t.name}`,body,`<button class="secondary" data-action="guide-quiz" data-id="${t.id}">${quiz?'Повторить тест':'Пройти тест'}</button><button class="secondary" data-action="new-session-guide" data-id="${t.id}">Записать тренировку</button><button class="primary" data-action="close-modal">Закрыть</button>`),'wide');
  }
  function toggleGuideTask(id,index){const guide=D.guides.find(g=>g.track===id);if(!guide)return;const list=[...(state.guideProgress[id]||Array(guide.checklist.length).fill(false))];list[Number(index)]=!list[Number(index)];state.guideProgress[id]=list;saveState();showGuideDetail(id);}
  function showGuideQuiz(id){const g=D.guides.find(x=>x.track===id);if(!g)return;const body=`<form id="guideQuizForm"><div class="quiz-list">${g.quiz.map((q,qi)=>`<fieldset class="quiz-question"><legend>${qi+1}. ${esc(q.q)}</legend>${q.options.map((option,oi)=>`<label><input type="radio" name="q${qi}" value="${oi}" ${oi===0?'required':''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}</div></form>`;openModal(modalShell(`Мини-тест · ${track(id).name}`,body,`<button class="secondary" data-action="guide-detail" data-id="${id}">Назад к гайду</button><button class="primary" data-action="submit-guide-quiz" data-id="${id}">Проверить</button>`));}
  function submitGuideQuiz(id){const g=D.guides.find(x=>x.track===id),form=document.getElementById('guideQuizForm');if(!g||!form?.reportValidity())return;const fd=new FormData(form);let score=0;g.quiz.forEach((q,i)=>{if(Number(fd.get(`q${i}`))===q.answer)score++;});state.guideQuiz[id]={score,total:g.quiz.length,date:new Date().toISOString()};saveState();const pct=Math.round(score/g.quiz.length*100);const body=`<div class="quiz-result"><strong>${score}/${g.quiz.length}</strong><h3>${pct>=80?'Трасса изучена уверенно':pct>=60?'Хорошая база':'Стоит повторить ключевые зоны'}</h3><p>${pct>=80?'Переходи к серии чистых кругов и сравни стабильность.':'Вернись к карточкам торможения, апекса и типичных ошибок.'}</p></div>`;openModal(modalShell(`Результат · ${track(id).name}`,body,`<button class="secondary" data-action="guide-quiz" data-id="${id}">Повторить</button><button class="primary" data-action="guide-detail" data-id="${id}">Вернуться в гайд</button>`),'small');}

  function showCatalogTrack(id){const t=track(id),guide=D.guides.find(g=>g.track===id);const guideProgress=guide?guideCompletion(t.id):0;const body=`<div class="catalog-detail-hero track-detail-hero"><div class="catalog-detail-map" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><div class="catalog-detail-copy"><span class="pill">${trackTypeLabel(t.type)} · ${difficultyLabel(t.difficulty)}</span><h2>${esc(t.name)}</h2><p>${esc(t.country)} · ${t.length.toFixed(3)} км · ${t.corners} поворотов</p><div class="guide-configs">${t.configs.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div></div><div class="grid-3"><div class="metric card"><small>Длина</small><strong>${t.length.toFixed(3)}</strong><span>километра</span></div><div class="metric card"><small>Сложность</small><strong>${t.difficulty}/5</strong><span>${difficultyLabel(t.difficulty)}</span></div><div class="metric card"><small>Гайд</small><strong>${guide?guideProgress+'%':'—'}</strong><span>${guide?'прогресс':'нет гайда'}</span></div></div><section class="catalog-plan card"><h3>План первой тренировки</h3><div class="plan-steps"><span><b>01</b> 5 кругов без атаки</span><span><b>02</b> фиксируй точку торможения</span><span><b>03</b> сравни лучший и средний круг</span></div></section><div class="form-section"><h3>Доступность</h3><div class="tags">${t.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(t.name,body,`${guide?`<button class="secondary" data-action="guide-detail" data-id="${t.id}">Открыть гайд</button>`:''}<button class="primary" data-action="new-session-track" data-id="${t.id}">Новая сессия</button>`));}
  function showCatalogCar(id){const c=car(id);const pwr=(c.power/c.weight*1000).toFixed(0);const driveHint=c.drivetrain==='FWD'?'бережнее с передними шинами':c.drivetrain==='AWD'?'следи за перегревом трансмиссии':'контролируй заднюю ось на выходе';const body=`<div class="catalog-detail-hero car-detail-hero"><div class="car-visual big"><span class="car-type">${esc(carIcon(c))}</span><span class="car-shadow"></span></div><div class="catalog-detail-copy"><span class="pill">${esc(c.class)} · ${esc(c.drivetrain)}</span><h2>${esc(c.name)}</h2><p>${c.power} л.с. · ${c.weight} кг · ${pwr} л.с./т</p></div></div><div class="grid-3"><div class="metric card"><small>Мощность</small><strong>${c.power}</strong><span>л.с.</span></div><div class="metric card"><small>Масса</small><strong>${c.weight}</strong><span>кг</span></div><div class="metric card"><small>л.с./т</small><strong>${pwr}</strong><span>${esc(c.drivetrain)}</span></div></div><section class="catalog-plan card"><h3>Подсказка инженера</h3><p>Для ${esc(c.class)} начни с безопасного сетапа, прогрей шины двумя кругами и ${esc(driveHint)}. После серии сохрани средний круг, а не только лучший.</p></section><div class="form-section"><h3>Игры</h3><div class="tags">${c.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(c.name,body,`<button class="primary" data-action="new-session-car" data-id="${c.id}">Новая сессия</button>`));}

  function showThemePicker(){const body=`<div class="theme-grid">${D.themes.map(t=>`<button class="theme-option ${state.theme===t.id?'active':''}" data-action="set-theme" data-id="${t.id}"><span class="theme-swatch" style="--swatch:${t.preview};--swatch-accent:${t.accent}"></span><strong>${esc(t.name)}</strong></button>`).join('')}</div>`;openModal(modalShell('Тема интерфейса',body,`<button class="primary" data-action="close-modal">Готово</button>`),'small');}
  function showProfilePicker(){const body=`<div class="stack">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===state.activeProfile?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} · цель ${x.goalLaps} кругов</small></span><span>${x.id===state.activeProfile?'✓':'›'}</span></button>`).join('')}</div>`;openModal(modalShell('Профиль пилота',body),'small');}
  function steamGameId(name=''){const n=String(name).toLowerCase();if(n.includes('competizione'))return'acc';if(n.includes('assetto corsa evo'))return'ace';if(n.includes('assetto corsa'))return'ac';if(n.includes('iracing'))return'iracing';if(/(^|\s)f1\D*2\d|formula 1/.test(n))return'f1';return'';}
  function showSteamConnect(){const s=state.steam;const body=`<div class="steam-panel"><p>Укажите SteamID64 и адрес Worker из папки <b>steam-worker</b>. API-ключ хранится только в Worker, а не в GitHub Pages.</p><div class="field"><label>SteamID64 (17 цифр)</label><input class="input" id="steamId" inputmode="numeric" pattern="[0-9]{17}" value="${esc(s.steamId)}" placeholder="7656119…"></div><div class="field" style="margin-top:12px"><label>URL Steam Worker</label><input class="input" id="steamEndpoint" value="${esc(s.endpoint)}" placeholder="https://simgrid-steam.example.workers.dev"></div><div class="notice" style="margin-top:14px">Без Worker приложение не запрашивает Steam Web API и не раскрывает ключ. Steam не предоставляет телеметрию кругов — она импортируется отдельно.</div></div>`;openModal(modalShell('Подключение Steam',body,`<button class="secondary" data-action="open-steam-profile">Открыть профиль</button><button class="primary" data-action="save-steam">Сохранить и проверить</button>`),'small');}
  async function syncSteam(){const steamId=document.getElementById('steamId')?.value.trim()||state.steam.steamId;const endpoint=(document.getElementById('steamEndpoint')?.value.trim()||state.steam.endpoint).replace(/\/$/,'');if(!/^\d{17}$/.test(steamId)){toast('SteamID64 должен содержать 17 цифр','warn');return;}state.steam.steamId=steamId;state.steam.endpoint=endpoint;saveState();if(!endpoint){closeModal();toast('Настройки сохранены. Добавьте URL Worker для синхронизации.','warn');return;}try{const res=await fetch(`${endpoint}/steam/sync?steamid=${encodeURIComponent(steamId)}`);if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();state.steam.profile=data.profile||null;state.steam.ownedGames=data.games||[];state.steam.lastSync=new Date().toISOString();const recentName=(data.recent||[]).map(x=>x.name||'').find(Boolean)||'';const detected=steamGameId(recentName);if(detected)state.live.game=detected;saveState();closeModal();toast('Steam-профиль синхронизирован');render();}catch(err){console.error(err);toast('Worker недоступен или Steam API вернул ошибку','bad');}}

  function exportJson(){download(`simgrid-backup-${today()}.json`,JSON.stringify({app:'SimGrid',exportedAt:new Date().toISOString(),state},null,2),'application/json');toast('Резервная копия создана');}
  function exportCsv(){const headers=['date','profile','game','track','config','car','weather','sessionType','bestLap','averageLap','laps','cleanLaps','consistency','fuelStart','fuelEnd','tyreWear','notes'];const rows=state.sessions.map(s=>headers.map(h=>csvCell(h==='profile'?s.profileId:h==='game'?game(s.game).name:h==='track'?track(s.track).name:h==='car'?car(s.car).name:s[h]??'')).join(','));download(`simgrid-sessions-${today()}.csv`,[headers.join(','),...rows].join('\n'),'text/csv;charset=utf-8');toast('CSV создан');}
  function csvCell(v){const s=String(v).replace(/"/g,'""');return `"${s}"`;}
  function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function importFile(file){if(!file)return;try{const text=await file.text();if(file.name.toLowerCase().endsWith('.csv'))importCsv(text);else{const data=JSON.parse(text);const incoming=data.state||data;if(incoming.sessions||incoming.setups){state={...state,...incoming,settings:{...state.settings,...incoming.settings},steam:{...state.steam,...incoming.steam},live:{...state.live,...incoming.live},strategy:{...state.strategy,...incoming.strategy}};saveState();toast('Резервная копия импортирована');render();}else if(data.session){state.sessions.push(normalizeImportedSession(data.session));saveState();toast('Сессия импортирована');render();}else throw new Error('Unknown JSON');}}catch(err){console.error(err);toast('Файл не распознан. Нужен SimGrid JSON или CSV.','bad');}finally{els.importInput.value='';}}
  function importCsv(text){const lines=text.split(/\r?\n/).filter(Boolean);if(lines.length<2)throw new Error('Empty CSV');const parse=line=>{const out=[];let cur='',quote=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'){cur+='"';i++;}else if(c==='"')quote=!quote;else if(c===','&&!quote){out.push(cur);cur='';}else cur+=c;}out.push(cur);return out;};const headers=parse(lines[0]).map(x=>x.trim());const imported=lines.slice(1).map(line=>Object.fromEntries(headers.map((h,i)=>[h,parse(line)[i]??'']))).map(r=>normalizeImportedSession(r));state.sessions.push(...imported);saveState();toast(`Импортировано сессий: ${imported.length}`);render();}
  function normalizeImportedSession(r){const findGame=value=>D.games.find(g=>g.id===value||g.name.toLowerCase()===String(value).toLowerCase())?.id||'other';const findTrack=value=>D.tracks.find(t=>t.id===value||t.name.toLowerCase()===String(value).toLowerCase())?.id||'spa';const findCar=value=>D.cars.find(c=>c.id===value||c.name.toLowerCase()===String(value).toLowerCase())?.id||'roadcar';const lapTimes=Array.isArray(r.lapTimes)?r.lapTimes:[];return {id:uid('import'),profileId:r.profileId||r.profile||state.activeProfile,date:r.date||today(),game:findGame(r.game),track:findTrack(r.track),config:r.config||'',car:findCar(r.car),weather:r.weather||'',sessionType:r.sessionType||r.type||'Импорт',bestLap:r.bestLap||r.best||'',averageLap:r.averageLap||r.average||'',laps:+r.laps||lapTimes.length,cleanLaps:+r.cleanLaps||0,consistency:+r.consistency||consistencyFromLaps(lapTimes),fuelStart:+r.fuelStart||0,fuelEnd:+r.fuelEnd||0,tyreWear:+r.tyreWear||0,notes:r.notes||'Импортировано',lapTimes};}

  document.addEventListener('click',async e=>{
    if(e.target.matches('[data-modal-backdrop]')){closeModal();return;}
    const routeBtn=e.target.closest('[data-route]');if(routeBtn){closeModal();setRoute(routeBtn.dataset.route);return;}
    const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action,id=a.dataset.id,source=a.dataset.source||'mine',index=a.dataset.index;
    const map={
      'close-modal':()=>closeModal(),
      'new-session':()=>showSessionForm(),
      'session-detail':()=>showSessionDetail(id),
      'edit-session':()=>{const s=state.sessions.find(x=>x.id===id);closeModal();showSessionForm(s)},
      'delete-session':()=>{state.sessions=state.sessions.filter(x=>x.id!==id);saveState();closeModal();toast('Сессия удалена','warn');render()},
      'save-session':()=>saveSession(id),
      'configure-live':()=>showLiveConfig(),
      'save-live-config':()=>{state.live.game=document.getElementById('liveGame').value;state.live.track=document.getElementById('liveTrack').value;state.live.car=document.getElementById('liveCar').value;saveState();closeModal();render()},
      'start-live':()=>{state.live.running=true;state.live.startTs=Date.now();saveState();render()},
      'pause-live':()=>{state.live.elapsed=currentElapsed();state.live.running=false;state.live.startTs=null;saveState();render()},
      'finish-live':()=>finishLive(),
      'quick-strategy':()=>{state.strategy.track=document.getElementById('quickTrack')?.value;state.strategy.duration=+document.getElementById('quickDuration')?.value||60;state.strategy.raceMode='time';saveState();setRoute('strategy')},
      'new-setup':()=>showSetupForm(),
      'save-setup':()=>saveSetup(id),
      'setup-detail':()=>showSetupDetail(id,source),
      'edit-setup':()=>{const s=state.setups.find(x=>x.id===id);closeModal();showSetupForm(s)},
      'delete-setup':()=>{state.setups=state.setups.filter(x=>x.id!==id);state.setupFavorites=state.setupFavorites.filter(x=>x!==id);saveState();closeModal();toast('Сетап удалён','warn');render()},
      'toggle-setup-favorite':()=>toggleSetupFavorite(id),
      'copy-library-setup':()=>copyLibrarySetup(id),
      'setup-history':()=>showSetupHistory(id),
      'restore-setup-version':()=>restoreSetupVersion(id,index),
      'compare-setups':()=>showCompareSetups(),
      'run-compare':()=>renderCompare(document.getElementById('compareA').value,document.getElementById('compareB').value),
      'guide-detail':()=>showGuideDetail(id),
      'toggle-guide-task':()=>toggleGuideTask(id,index),
      'guide-quiz':()=>showGuideQuiz(id),
      'submit-guide-quiz':()=>submitGuideQuiz(id),
      'new-session-guide':()=>{closeModal();showSessionForm({track:id,config:track(id).configs[0]})},
      'catalog-track':()=>showCatalogTrack(id),
      'catalog-car':()=>showCatalogCar(id),
      'new-session-track':()=>{closeModal();showSessionForm({track:id,config:track(id).configs[0]})},
      'new-session-car':()=>{closeModal();showSessionForm({car:id})},
      'set-theme':()=>{state.theme=id;saveState();applyTheme();render();if(els.modalRoot.innerHTML)showThemePicker()},
      'select-profile':()=>{state.activeProfile=id;saveState();closeModal();toast(`Профиль ${profile(id).name} активирован`);render()},
      'export-json':()=>exportJson(),
      'export-csv':()=>exportCsv(),
      'import-data':()=>els.importInput.click(),
      'steam-connect':()=>showSteamConnect(),
      'save-steam':()=>syncSteam(),
      'open-steam-profile':()=>{const sid=document.getElementById('steamId')?.value.trim()||state.steam.steamId;if(/^\d{17}$/.test(sid))open(`https://steamcommunity.com/profiles/${sid}`,'_blank');else toast('Сначала введите SteamID64','warn')},
      'restore-demo':()=>{state.sessions=structuredCloneSafe(D.sampleSessions);state.setups=structuredCloneSafe(D.sampleSetups);saveState();toast('Демо-данные восстановлены');render()},
      'clear-data':()=>{if(confirm('Удалить все локальные данные SimGrid?')){state=structuredCloneSafe(defaultState);state.sessions=[];state.setups=[];saveState();toast('Локальные данные удалены','warn');render()}}
    };
    if(map[action])await map[action]();
  });
  document.addEventListener('submit',e=>{if(e.target.id==='strategyForm'){e.preventDefault();const fd=new FormData(e.target);state.strategy={...state.strategy,...Object.fromEntries(fd.entries())};['duration','raceLaps','fuelPerLap','tank','startFuel','pitLoss','mandatoryStops','tyreLife','traffic'].forEach(k=>state.strategy[k]=+state.strategy[k]);saveState();render();}});
  els.importInput.addEventListener('change',()=>importFile(els.importInput.files[0]));
  els.quickAddBtn.addEventListener('click',()=>showSessionForm());els.themeBtn.addEventListener('click',showThemePicker);els.profileSwitch.addEventListener('click',showProfilePicker);
  window.addEventListener('popstate',()=>{route=new URLSearchParams(location.search).get('view')||'dashboard';render();resetPageScroll();});
  window.addEventListener('resize',()=>{if(route==='dashboard')drawProgressChart();});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;els.installBtn.classList.remove('hidden');});
  els.installBtn.addEventListener('click',async()=>{if(!deferredInstall){toast('На iPhone: Поделиться → На экран «Домой»','warn');return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;els.installBtn.classList.add('hidden');});
  window.addEventListener('appinstalled',()=>toast('SimGrid установлен'));

  if('serviceWorker' in navigator){
    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshing) return;
      refreshing=true;
      window.location.reload();
    });
    window.addEventListener('load',async()=>{
      try{
        const reg=await navigator.serviceWorker.register('./sw.js');
        reg.update?.();
        if(reg.waiting) reg.waiting.postMessage({type:'SKIP_WAITING'});
        reg.addEventListener('updatefound',()=>{
          const worker=reg.installing;
          worker?.addEventListener('statechange',()=>{
            if(worker.state==='installed' && navigator.serviceWorker.controller) worker.postMessage({type:'SKIP_WAITING'});
          });
        });
      }catch(err){console.warn(err);}
    });
  }
  if('scrollRestoration' in history) history.scrollRestoration='manual';
  const params=new URLSearchParams(location.search);if(params.get('action')==='new-session')setTimeout(()=>showSessionForm(),300);
  render();
  resetPageScroll();
})();
