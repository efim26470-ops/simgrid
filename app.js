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
    version:1,
    theme:'telemetry',
    activeProfile:'sprint',
    sessions:structuredCloneSafe(D.sampleSessions),
    setups:structuredCloneSafe(D.sampleSetups),
    settings:{units:'metric',reduceMotion:false,autoBackup:false,showDemo:true},
    steam:{steamId:'',endpoint:'',profile:null,lastSync:null,ownedGames:[]},
    live:{running:false,startTs:null,elapsed:0,game:'acc',track:'spa',car:'m4gt3',laps:0,best:'—'},
    strategy:DEFAULT_STRATEGY,
    onboarded:true
  };

  let state = loadState();
  let route = new URLSearchParams(location.search).get('view') || 'dashboard';
  if (!NAV.some(n => n.id === route)) route = 'dashboard';
  let deferredInstall = null;
  let liveTicker = null;

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
      return {...structuredCloneSafe(defaultState),...saved,settings:{...defaultState.settings,...saved.settings},steam:{...defaultState.steam,...saved.steam},live:{...defaultState.live,...saved.live},strategy:{...DEFAULT_STRATEGY,...saved.strategy}};
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
  function trackSvg(t,color='currentColor'){
    return `<svg viewBox="0 0 110 110" aria-hidden="true"><path d="${esc(t.path)}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="18" cy="68" r="4" fill="var(--accent)"/></svg>`;
  }
  function optionList(items,selected,label=x=>x.name){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(label(x))}</option>`).join('');}
  function toast(message,type='good'){
    const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=message; els.toastRoot.append(el);
    setTimeout(()=>el.remove(),3200);
  }
  function setRoute(next,push=true){
    route=next;
    if(push){const u=new URL(location.href);u.searchParams.set('view',route);u.searchParams.delete('action');history.pushState({},'',u);}
    render();
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

  function renderSetups(){
    const setups=state.setups.filter(s=>s.profileId===state.activeProfile).sort((a,b)=>String(b.created).localeCompare(String(a.created)));
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="setupSearch" placeholder="Название, трасса, машина"></div></div><div class="toolbar-group"><button class="secondary" data-action="compare-setups">Сравнить</button><button class="primary" data-action="new-setup">＋ Новый сетап</button></div></div>
      <article class="card card-pad"><div class="card-head"><div><h2>Гараж сетапов</h2><p>${setups.length} конфигураций в профиле ${esc(profile().name)}</p></div></div><div id="setupGrid" class="setup-grid">${setups.length?setups.map(renderSetupCard).join(''):renderEmpty('⌘','Нет сохранённых сетапов','Создайте первый сетап и сравнивайте изменения по ключевым параметрам.')}</div></article>`;
  }
  function renderSetupCard(s){const v=s.values||{};return `<button class="setup-card" data-action="setup-detail" data-id="${esc(s.id)}" style="text-align:left;color:inherit"><div style="display:flex;justify-content:space-between;align-items:center"><span class="game-badge" style="width:38px;height:38px;color:${game(s.game).accent}">${esc(game(s.game).short)}</span><span class="pill">${formatDate(s.created)}</span></div><h3>${esc(s.name)}</h3><p>${esc(track(s.track).name)} · ${esc(car(s.car).name)}</p><div class="tags">${(s.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><div class="setup-mini"><div><small>Крыло</small><strong>${v.frontWing??'—'} / ${v.rearWing??'—'}</strong></div><div><small>Давление</small><strong>${v.frontPressure??'—'} / ${v.rearPressure??'—'}</strong></div><div><small>Баланс</small><strong>${v.brakeBias??'—'}%</strong></div></div></button>`;}

  function renderCatalog(){
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="catalogSearch" placeholder="Найти трассу или автомобиль"></div><div class="segmented" id="catalogMode"><button class="active" data-value="tracks">Трассы</button><button data-value="cars">Автомобили</button></div></div><select class="select" id="catalogGame" style="width:auto"><option value="all">Все игры</option>${optionList(D.games,'none')}</select></div><div id="catalogGrid" class="catalog-grid">${D.tracks.map(renderTrackCard).join('')}</div>`;
  }
  function renderTrackCard(t){return `<button class="catalog-card" data-action="catalog-track" data-id="${t.id}" style="text-align:left;color:inherit"><div class="catalog-visual" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><div class="catalog-content"><h3>${esc(t.name)}</h3><p>${esc(t.country)} · ${t.configs.join(' / ')}</p><div class="catalog-meta"><span>${t.length.toFixed(3)} км</span><span>${t.corners} пов.</span><span>${'●'.repeat(Math.min(5,t.difficulty))}</span></div></div></button>`;}
  function renderCarCard(c){return `<button class="catalog-card" data-action="catalog-car" data-id="${c.id}" style="text-align:left;color:inherit"><div class="catalog-visual"><span class="car-silhouette">⌁</span></div><div class="catalog-content"><h3>${esc(c.name)}</h3><p>${esc(c.class)} · ${esc(c.drivetrain)}</p><div class="catalog-meta"><span>${c.power} л.с.</span><span>${c.weight} кг</span><span>${c.games.map(id=>game(id).short).join(' · ')}</span></div></div></button>`;}

  function renderGuides(){
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="guideSearch" placeholder="Найти трассу или поворот"></div></div><span class="pill">${D.guides.length} подробных гайдов</span></div><div id="guideGrid" class="guide-grid">${D.guides.map(renderGuideCard).join('')}</div>`;
  }
  function renderGuideCard(g){const t=track(g.track);return `<button class="guide-card" data-action="guide-detail" data-id="${g.track}" style="text-align:left;color:inherit"><div class="guide-photo" style="background-image:url('${esc(g.photo)}')"><span class="guide-level">${esc(g.level)}</span><div class="guide-map" style="color:white">${trackSvg(t,'currentColor')}</div></div><div class="guide-content"><h3>${esc(t.name)}</h3><p>${esc(g.summary)}</p><div class="guide-actions"><span class="corner-count">${g.sectors.length} ключевых зон</span><span class="link-button">Открыть →</span></div></div></button>`;}

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
  function bindSetupFilter(){const input=document.getElementById('setupSearch');input?.addEventListener('input',()=>{const q=input.value.toLowerCase();const rows=state.setups.filter(s=>s.profileId===state.activeProfile&&`${s.name} ${track(s.track).name} ${car(s.car).name}`.toLowerCase().includes(q));document.getElementById('setupGrid').innerHTML=rows.length?rows.map(renderSetupCard).join(''):renderEmpty('⌕','Сетапы не найдены','Попробуйте другой запрос.');});}
  function bindCatalog(){
    const mode=document.getElementById('catalogMode'),search=document.getElementById('catalogSearch'),gf=document.getElementById('catalogGame');let current='tracks';
    const run=()=>{const q=search.value.toLowerCase(),gid=gf.value;const list=current==='tracks'?D.tracks.filter(t=>(gid==='all'||t.games.includes(gid))&&`${t.name} ${t.country}`.toLowerCase().includes(q)):D.cars.filter(c=>(gid==='all'||c.games.includes(gid))&&`${c.name} ${c.class}`.toLowerCase().includes(q));document.getElementById('catalogGrid').innerHTML=list.length?list.map(current==='tracks'?renderTrackCard:renderCarCard).join(''):renderEmpty('⌕','Ничего не найдено','Измените игру или поисковый запрос.');};
    mode.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;current=b.dataset.value;mode.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));run();});search.addEventListener('input',run);gf.addEventListener('change',run);
  }
  function bindGuideFilter(){const input=document.getElementById('guideSearch');input?.addEventListener('input',()=>{const q=input.value.toLowerCase();const list=D.guides.filter(g=>`${track(g.track).name} ${g.summary} ${g.sectors.map(s=>s.name+' '+s.tip).join(' ')}`.toLowerCase().includes(q));document.getElementById('guideGrid').innerHTML=list.length?list.map(renderGuideCard).join(''):renderEmpty('⌕','Гайд не найден','Проверьте название трассы или поворота.');});}

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

  function showSetupForm(seed={}){const s={name:'',game:'acc',track:'spa',car:'m4gt3',tags:[],values:{frontPressure:26.7,rearPressure:26.7,frontWing:5,rearWing:8,frontARB:4,rearARB:2,frontRide:55,rearRide:68,brakeBias:54.5,tc:4,abs:3,fuel:50,springFront:0,springRear:0},...seed};const v=s.values;const fields=[['frontPressure','Давление перед, PSI',.1],['rearPressure','Давление зад, PSI',.1],['frontWing','Крыло перед',1],['rearWing','Крыло зад',1],['frontARB','ARB перед',1],['rearARB','ARB зад',1],['frontRide','Клиренс перед',1],['rearRide','Клиренс зад',1],['brakeBias','Баланс тормозов, %',.1],['tc','TC',1],['abs','ABS',1],['fuel','Топливо, л',1],['springFront','Пружина перед',1],['springRear','Пружина зад',1]];const body=`<form id="setupForm"><div class="form-grid"><div class="field full"><label>Название</label><input class="input" name="name" value="${esc(s.name)}" required></div><div class="field"><label>Игра</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>Машина</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field"><label>Теги через запятую</label><input class="input" name="tags" value="${esc((s.tags||[]).join(', '))}"></div></div><div class="form-section"><h3>Параметры</h3><div class="form-grid three">${fields.map(([id,label,step])=>`<div class="field"><label>${label}</label><input class="input" name="${id}" type="number" step="${step}" value="${v[id]??0}"></div>`).join('')}</div></div></form>`;openModal(modalShell(s.id?'Редактировать сетап':'Новый сетап',body,`<button class="secondary" data-action="close-modal">Отмена</button><button class="primary" data-action="save-setup" data-id="${esc(s.id||'')}">Сохранить</button>`));}
  function saveSetup(id){const form=document.getElementById('setupForm');if(!form?.reportValidity())return;const fd=new FormData(form);const valueKeys=['frontPressure','rearPressure','frontWing','rearWing','frontARB','rearARB','frontRide','rearRide','brakeBias','tc','abs','fuel','springFront','springRear'];const entry={id:id||uid('setup'),profileId:state.activeProfile,name:String(fd.get('name')),game:String(fd.get('game')),track:String(fd.get('track')),car:String(fd.get('car')),created:today(),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),values:Object.fromEntries(valueKeys.map(k=>[k,+fd.get(k)||0]))};const idx=state.setups.findIndex(x=>x.id===id);if(idx>=0)state.setups[idx]=entry;else state.setups.push(entry);saveState();closeModal();toast('Сетап сохранён');render();}
  function showSetupDetail(id){const s=state.setups.find(x=>x.id===id);if(!s)return;const labels={frontPressure:'Давление перед',rearPressure:'Давление зад',frontWing:'Крыло перед',rearWing:'Крыло зад',frontARB:'ARB перед',rearARB:'ARB зад',frontRide:'Клиренс перед',rearRide:'Клиренс зад',brakeBias:'Баланс тормозов',tc:'TC',abs:'ABS',fuel:'Топливо',springFront:'Пружина перед',springRear:'Пружина зад'};const body=`<div class="tags">${s.tags.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><p style="color:var(--muted);font-size:12px">${esc(game(s.game).name)} · ${esc(track(s.track).name)} · ${esc(car(s.car).name)}</p><table class="compare-table"><tbody>${Object.entries(s.values).map(([k,v])=>`<tr><th>${labels[k]||k}</th><td>${v}</td></tr>`).join('')}</tbody></table>`;openModal(modalShell(s.name,body,`<button class="danger-button" data-action="delete-setup" data-id="${s.id}">Удалить</button><button class="secondary" data-action="edit-setup" data-id="${s.id}">Изменить</button><button class="primary" data-action="close-modal">Готово</button>`));}
  function showCompareSetups(){const list=state.setups.filter(s=>s.profileId===state.activeProfile);if(list.length<2){toast('Для сравнения нужны минимум два сетапа','warn');return;}const body=`<div class="form-grid"><div class="field"><label>Сетап A</label><select class="select" id="compareA">${optionList(list,list[0].id,x=>x.name)}</select></div><div class="field"><label>Сетап B</label><select class="select" id="compareB">${optionList(list,list[1].id,x=>x.name)}</select></div></div><div id="compareResult" class="form-section"></div>`;openModal(modalShell('Сравнение сетапов',body,`<button class="secondary" data-action="close-modal">Закрыть</button><button class="primary" data-action="run-compare">Сравнить</button>`));renderCompare(list[0].id,list[1].id);}
  function renderCompare(aId,bId){const a=state.setups.find(x=>x.id===aId),b=state.setups.find(x=>x.id===bId),root=document.getElementById('compareResult');if(!a||!b||!root)return;const labels={frontPressure:'Давление перед',rearPressure:'Давление зад',frontWing:'Крыло перед',rearWing:'Крыло зад',frontARB:'ARB перед',rearARB:'ARB зад',frontRide:'Клиренс перед',rearRide:'Клиренс зад',brakeBias:'Баланс тормозов',tc:'TC',abs:'ABS',fuel:'Топливо',springFront:'Пружина перед',springRear:'Пружина зад'};root.innerHTML=`<table class="compare-table"><thead><tr><th>Параметр</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th>Δ B−A</th></tr></thead><tbody>${Object.keys(labels).map(k=>{const av=+a.values[k]||0,bv=+b.values[k]||0,d=bv-av;return `<tr><th>${labels[k]}</th><td>${av}</td><td>${bv}</td><td class="${d>0?'diff-positive':d<0?'diff-negative':''}">${d>0?'+':''}${Number(d.toFixed(2))}</td></tr>`}).join('')}</tbody></table>`;}

  function showGuideDetail(trackId){const g=D.guides.find(x=>x.track===trackId);if(!g)return;const t=track(trackId);const body=`<div class="guide-detail-hero" style="background-image:url('${esc(g.photo)}')"><div class="guide-detail-title"><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} км · ${t.corners} поворотов</p></div></div><div class="grid-2"><article><h3>Ключевые зоны</h3><div class="corner-list">${g.sectors.map((s,i)=>`<div class="corner-item"><span class="corner-num">${i+1}</span><div><h4>${esc(s.name)}</h4><p>${esc(s.tip)}</p></div><span class="gear">${esc(s.gear)} передача</span></div>`).join('')}</div></article><div class="stack"><article class="card card-pad"><div class="card-head"><div><h3>Базовый сетап</h3></div></div>${g.setup.map(x=>`<div class="setting-row"><div><h3>${esc(x)}</h3></div><span>✓</span></div>`).join('')}</article><article class="card card-pad"><div class="card-head"><div><h3>Типичные ошибки</h3></div></div>${g.mistakes.map(x=>`<div class="setting-row"><div><h3>${esc(x)}</h3></div><span style="color:var(--danger)">!</span></div>`).join('')}</article><article class="card card-pad"><div style="height:180px;color:var(--text)">${trackSvg(t,'currentColor')}</div><p style="color:var(--muted);font-size:10px;text-align:center">Схематичная траектория. Используйте как карту зон, а не как точную гоночную линию.</p></article></div></div>`;openModal(modalShell(`Гайд · ${t.name}`,body,`<button class="secondary" data-action="new-session-guide" data-id="${t.id}">Записать тренировку</button><button class="primary" data-action="close-modal">Закрыть</button>`));}
  function showCatalogTrack(id){const t=track(id),guide=D.guides.find(g=>g.track===id);const body=`<div style="height:220px;color:var(--text)">${trackSvg(t,'currentColor')}</div><div class="grid-3"><div class="metric card"><small>Длина</small><strong>${t.length.toFixed(3)}</strong><span>километра</span></div><div class="metric card"><small>Повороты</small><strong>${t.corners}</strong><span>${t.configs.join(' / ')}</span></div><div class="metric card"><small>Сложность</small><strong>${t.difficulty}/5</strong><span>${t.country}</span></div></div><div class="form-section"><h3>Доступность</h3><div class="tags">${t.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(t.name,body,`${guide?`<button class="secondary" data-action="guide-detail" data-id="${t.id}">Открыть гайд</button>`:''}<button class="primary" data-action="new-session-track" data-id="${t.id}">Новая сессия</button>`));}
  function showCatalogCar(id){const c=car(id);const pwr=(c.power/c.weight*1000).toFixed(0);const body=`<div class="catalog-visual" style="height:180px"><span class="car-silhouette" style="font-size:80px">⌁</span></div><div class="grid-3" style="margin-top:16px"><div class="metric card"><small>Мощность</small><strong>${c.power}</strong><span>л.с.</span></div><div class="metric card"><small>Масса</small><strong>${c.weight}</strong><span>кг</span></div><div class="metric card"><small>л.с./т</small><strong>${pwr}</strong><span>${c.drivetrain}</span></div></div><div class="form-section"><h3>Игры</h3><div class="tags">${c.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(c.name,body,`<button class="primary" data-action="new-session-car" data-id="${c.id}">Новая сессия</button>`));}

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
    const a=e.target.closest('[data-action]');if(!a)return;const action=a.dataset.action,id=a.dataset.id;
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
      'setup-detail':()=>showSetupDetail(id),
      'edit-setup':()=>{const s=state.setups.find(x=>x.id===id);closeModal();showSetupForm(s)},
      'delete-setup':()=>{state.setups=state.setups.filter(x=>x.id!==id);saveState();closeModal();toast('Сетап удалён','warn');render()},
      'compare-setups':()=>showCompareSetups(),
      'run-compare':()=>renderCompare(document.getElementById('compareA').value,document.getElementById('compareB').value),
      'guide-detail':()=>showGuideDetail(id),
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
  window.addEventListener('popstate',()=>{route=new URLSearchParams(location.search).get('view')||'dashboard';render();});
  window.addEventListener('resize',()=>{if(route==='dashboard')drawProgressChart();});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;els.installBtn.classList.remove('hidden');});
  els.installBtn.addEventListener('click',async()=>{if(!deferredInstall){toast('На iPhone: Поделиться → На экран «Домой»','warn');return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;els.installBtn.classList.add('hidden');});
  window.addEventListener('appinstalled',()=>toast('SimGrid установлен'));

  if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));}
  const params=new URLSearchParams(location.search);if(params.get('action')==='new-session')setTimeout(()=>showSessionForm(),300);
  render();
})();
