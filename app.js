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
  const DEFAULT_STRATEGY = {
    track:'spa',config:'Grand Prix',car:'m4gt3',raceMode:'time',duration:60,raceLaps:30,lapTime:'2:20.000',
    fuelPerLap:2.65,tank:120,startFuel:70,fuelReserveLaps:1.5,pitLoss:32,pitEntryPenalty:0,pitTraffic:0,
    mandatoryStops:0,tyreLife:24,traffic:4,weather:'dry',rainLap:18,compound:'medium',compoundRule:'free',
    battlePlan:'balanced',safetyCar:'none',driverSwapRequired:'no',driverSwapLoss:28
  };
  const SETUP_GROUPS = [
    {id:'tyres',title:'Шины и геометрия',hint:'Давление, развал, схождение и рабочее окно',fields:[
      {key:'frontPressure',label:'Давление перед',unit:'PSI',step:.1,def:26.7},
      {key:'rearPressure',label:'Давление зад',unit:'PSI',step:.1,def:26.7},
      {key:'camberFront',label:'Развал перед',unit:'°',step:.1,def:-3.2},
      {key:'camberRear',label:'Развал зад',unit:'°',step:.1,def:-2.8},
      {key:'toeFront',label:'Схождение перед',unit:'°',step:.01,def:.05},
      {key:'toeRear',label:'Схождение зад',unit:'°',step:.01,def:.15},
      {key:'caster',label:'Кастер',unit:'°',step:.1,def:9},
      {key:'brakeDuctFront',label:'Воздуховоды перед',unit:'',step:1,def:3},
      {key:'brakeDuctRear',label:'Воздуховоды зад',unit:'',step:1,def:3}
    ]},
    {id:'suspension',title:'Подвеска',hint:'Пружины, демпферы, стабилизаторы и клиренс',fields:[
      {key:'springFront',label:'Пружина перед',unit:'N/mm',step:1,def:160},
      {key:'springRear',label:'Пружина зад',unit:'N/mm',step:1,def:145},
      {key:'bumpFront',label:'Сжатие перед',unit:'click',step:1,def:8},
      {key:'bumpRear',label:'Сжатие зад',unit:'click',step:1,def:7},
      {key:'reboundFront',label:'Отбой перед',unit:'click',step:1,def:10},
      {key:'reboundRear',label:'Отбой зад',unit:'click',step:1,def:9},
      {key:'frontARB',label:'ARB перед',unit:'',step:1,def:4},
      {key:'rearARB',label:'ARB зад',unit:'',step:1,def:2},
      {key:'frontRide',label:'Клиренс перед',unit:'мм',step:1,def:55},
      {key:'rearRide',label:'Клиренс зад',unit:'мм',step:1,def:68}
    ]},
    {id:'aero',title:'Аэродинамика',hint:'Крылья, рейк и аэробаланс',fields:[
      {key:'frontWing',label:'Крыло перед',unit:'',step:1,def:5},
      {key:'rearWing',label:'Крыло зад',unit:'',step:1,def:8},
      {key:'aeroBalance',label:'Аэробаланс вперёд',unit:'%',step:.1,def:45},
      {key:'rake',label:'Рейк',unit:'мм',step:.1,def:13}
    ]},
    {id:'drivetrain',title:'Трансмиссия',hint:'Дифференциал, торможение двигателем и главная пара',fields:[
      {key:'diffPreload',label:'Преднатяг дифф.',unit:'Н·м',step:1,def:100},
      {key:'diffPower',label:'Дифф. под газом',unit:'%',step:1,def:55},
      {key:'diffCoast',label:'Дифф. на сбросе',unit:'%',step:1,def:45},
      {key:'engineBraking',label:'Торможение двигателем',unit:'',step:1,def:4},
      {key:'finalDrive',label:'Главная пара',unit:'',step:.01,def:3.9}
    ]},
    {id:'brakes',title:'Тормоза и электроника',hint:'Баланс, давление, ABS, TC и карта двигателя',fields:[
      {key:'brakeBias',label:'Баланс тормозов',unit:'%',step:.1,def:54.5},
      {key:'brakePressure',label:'Давление тормозов',unit:'%',step:1,def:100},
      {key:'tc',label:'TC',unit:'',step:1,def:4},
      {key:'abs',label:'ABS',unit:'',step:1,def:3},
      {key:'engineMap',label:'Карта двигателя',unit:'',step:1,def:1},
      {key:'fuel',label:'Топливо',unit:'л',step:1,def:50}
    ]}
  ];
  const SETUP_FIELDS = SETUP_GROUPS.flatMap(group=>group.fields.map(field=>({...field,group:group.id})));
  const SETUP_LABELS = Object.fromEntries(SETUP_FIELDS.map(field=>[field.key,`${field.label}${field.unit?`, ${field.unit}`:''}`]));
  const DEFAULT_SETUP_VALUES = Object.fromEntries(SETUP_FIELDS.map(field=>[field.key,field.def]));
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
  let modalReturnFocus = null;
  const toastState = {queue:[],active:false,timer:null,lastKey:'',lastAt:0};

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
  function trackSvg(t,color='currentColor',label=''){
    return `<svg viewBox="0 0 110 110" role="img" aria-label="${esc(label||`Схема ${t.name||'трассы'}`)}"><path d="${esc(t.path)}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="18" cy="68" r="4" fill="var(--accent)"/><circle cx="18" cy="68" r="8" fill="none" stroke="var(--accent)" opacity=".28"/></svg>`;
  }
  function optionList(items,selected,label=x=>x.name){return items.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(label(x))}</option>`).join('');}
  function configOptions(trackId,selected=''){
    const t=track(trackId);const configs=(t.configDetails?.length?t.configDetails:t.configs.map(name=>({name})));
    return configs.map(c=>`<option value="${esc(c.name)}" ${c.name===selected?'selected':''}>${esc(c.name)}${c.length?` · ${Number(c.length).toFixed(3)} км`:''}</option>`).join('');
  }
  function themeCard(t){
    return `<button class="theme-option ${state.theme===t.id?'active':''}" data-action="set-theme" data-id="${t.id}" aria-pressed="${state.theme===t.id}"><span class="theme-preview" style="--swatch:${t.preview};--swatch-accent:${t.accent}"><span class="theme-preview-top"><i></i><i></i><i></i></span><span class="theme-preview-card"><b></b><i></i></span><span class="theme-preview-cta"></span></span><span class="theme-name">${esc(t.name)}</span>${state.theme===t.id?'<span class="theme-check">✓</span>':''}</button>`;
  }
  function toast(message,type='good'){
    const key=`${type}:${message}`;const now=Date.now();
    if(toastState.lastKey===key&&now-toastState.lastAt<1200)return;
    toastState.lastKey=key;toastState.lastAt=now;
    toastState.queue.push({message:String(message),type});
    if(toastState.queue.length>4)toastState.queue.splice(0,toastState.queue.length-4);
    pumpToast();
  }
  function pumpToast(){
    if(toastState.active||!toastState.queue.length)return;
    toastState.active=true;const item=toastState.queue.shift();
    const el=document.createElement('div');el.className=`toast ${item.type}`;el.setAttribute('role','status');el.innerHTML=`<span class="toast-icon">${item.type==='bad'?'!':item.type==='warn'?'△':'✓'}</span><span>${esc(item.message)}</span>`;
    els.toastRoot.replaceChildren(el);
    requestAnimationFrame(()=>el.classList.add('visible'));
    clearTimeout(toastState.timer);toastState.timer=setTimeout(()=>{el.classList.remove('visible');setTimeout(()=>{el.remove();toastState.active=false;pumpToast();},220);},2700);
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
    const s=state.strategy;const t=track(s.track||'spa');const selectedConfig=t.configs.includes(s.config)?s.config:t.configs[0];const results=calculateStrategies({...s,config:selectedConfig});
    return `<div class="strategy-layout">
      <article class="card card-pad">
        <div class="card-head"><div><h2>Параметры гонки</h2><p>Топливо, шины, трафик, погода и правила пит-стопов</p></div></div>
        <form id="strategyForm">
          <div class="strategy-form-section"><div class="section-title compact"><span class="eyebrow">Race context</span><h3>Трасса и формат</h3></div><div class="form-grid three">
            <div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track||'spa')}</select></div>
            <div class="field"><label>Конфигурация</label><select class="select" name="config">${configOptions(s.track||'spa',selectedConfig)}</select></div>
            <div class="field"><label>Автомобиль</label><select class="select" name="car">${optionList(D.cars,s.car||'m4gt3')}</select></div>
            <div class="field"><label>Расчёт по</label><select class="select" name="raceMode"><option value="time" ${s.raceMode==='time'?'selected':''}>времени</option><option value="laps" ${s.raceMode==='laps'?'selected':''}>кругам</option></select></div>
            <div class="field" data-race-amount><label>${s.raceMode==='laps'?'Кругов':'Длительность, мин'}</label><input class="input" name="${s.raceMode==='laps'?'raceLaps':'duration'}" type="number" min="1" step="1" value="${s.raceMode==='laps'?s.raceLaps:s.duration}"></div>
            <div class="field"><label>Средний круг</label><input class="input" name="lapTime" value="${esc(s.lapTime)}" inputmode="decimal" placeholder="2:20.000"></div>
          </div></div>
          <div class="strategy-form-section"><div class="section-title compact"><span class="eyebrow">Fuel model</span><h3>Топливо</h3></div><div class="form-grid three">
            <div class="field"><label>Расход, л/круг</label><input class="input" name="fuelPerLap" type="number" min="0.1" step="0.01" value="${s.fuelPerLap}"></div>
            <div class="field"><label>Бак, л</label><input class="input" name="tank" type="number" min="1" step="1" value="${s.tank}"></div>
            <div class="field"><label>Стартовое топливо, л</label><input class="input" name="startFuel" type="number" min="0" step="0.1" value="${s.startFuel}"></div>
            <div class="field"><label>Резерв, кругов</label><input class="input" name="fuelReserveLaps" type="number" min="0" max="8" step="0.1" value="${s.fuelReserveLaps}"></div>
          </div></div>
          <div class="strategy-form-section"><div class="section-title compact"><span class="eyebrow">Pit lane</span><h3>Остановки и трафик</h3></div><div class="form-grid three">
            <div class="field"><label>Базовая потеря пит-лейна, сек</label><input class="input" name="pitLoss" type="number" min="0" step="0.1" value="${s.pitLoss}"></div>
            <div class="field"><label>Штраф входа/выезда, сек</label><input class="input" name="pitEntryPenalty" type="number" min="0" step="0.1" value="${s.pitEntryPenalty}"></div>
            <div class="field"><label>Задержка в питах, сек/стоп</label><select class="select" name="pitTraffic"><option value="0" ${+s.pitTraffic===0?'selected':''}>Свободно</option><option value="3" ${+s.pitTraffic===3?'selected':''}>Умеренно · +3с</option><option value="7" ${+s.pitTraffic===7?'selected':''}>Плотно · +7с</option></select></div>
            <div class="field"><label>Обязательных пит-стопов</label><input class="input" name="mandatoryStops" type="number" min="0" max="8" step="1" value="${s.mandatoryStops}"></div>
            <div class="field"><label>Трафик на трассе</label><select class="select" name="traffic"><option value="0" ${+s.traffic===0?'selected':''}>Чистая трасса</option><option value="4" ${+s.traffic===4?'selected':''}>Умеренный</option><option value="9" ${+s.traffic===9?'selected':''}>Плотный</option></select></div>
            <div class="field"><label>Тактический приоритет</label><select class="select" name="battlePlan"><option value="balanced" ${s.battlePlan==='balanced'?'selected':''}>Сбалансированно</option><option value="undercut" ${s.battlePlan==='undercut'?'selected':''}>Андеркат</option><option value="overcut" ${s.battlePlan==='overcut'?'selected':''}>Оверкат</option></select></div>
          </div></div>
          <div class="strategy-form-section"><div class="section-title compact"><span class="eyebrow">Tyres & weather</span><h3>Шины, погода и нейтрализация</h3></div><div class="form-grid three">
            <div class="field"><label>Ресурс комплекта, кругов</label><input class="input" name="tyreLife" type="number" min="1" step="1" value="${s.tyreLife}"></div>
            <div class="field"><label>Погода</label><select class="select" name="weather"><option value="dry" ${s.weather==='dry'?'selected':''}>Сухо</option><option value="mixed" ${s.weather==='mixed'?'selected':''}>Переменно</option><option value="wet" ${s.weather==='wet'?'selected':''}>Дождь</option></select></div>
            <div class="field"><label>Прогноз дождя, круг</label><input class="input" name="rainLap" type="number" min="1" step="1" value="${s.rainLap}"></div>
            <div class="field"><label>Стартовый состав</label><select class="select" name="compound"><option value="soft" ${s.compound==='soft'?'selected':''}>Soft</option><option value="medium" ${s.compound==='medium'?'selected':''}>Medium</option><option value="hard" ${s.compound==='hard'?'selected':''}>Hard</option><option value="intermediate" ${s.compound==='intermediate'?'selected':''}>Intermediate</option><option value="wet" ${s.compound==='wet'?'selected':''}>Wet</option></select></div>
            <div class="field"><label>Правило составов</label><select class="select" name="compoundRule"><option value="free" ${s.compoundRule==='free'?'selected':''}>Без ограничения</option><option value="two" ${s.compoundRule==='two'?'selected':''}>Минимум 2 состава</option></select></div>
            <div class="field"><label>Safety Car / VSC</label><select class="select" name="safetyCar"><option value="none" ${s.safetyCar==='none'?'selected':''}>Не ожидается</option><option value="possible" ${s.safetyCar==='possible'?'selected':''}>Возможен</option><option value="likely" ${s.safetyCar==='likely'?'selected':''}>Высокая вероятность</option></select></div>
          </div></div>
          <div class="strategy-form-section"><div class="section-title compact"><span class="eyebrow">Endurance</span><h3>Смена пилота</h3></div><div class="form-grid">
            <div class="field"><label>Обязательная смена</label><select class="select" name="driverSwapRequired"><option value="no" ${s.driverSwapRequired==='no'?'selected':''}>Нет</option><option value="yes" ${s.driverSwapRequired==='yes'?'selected':''}>Да</option></select></div>
            <div class="field"><label>Время смены, сек</label><input class="input" name="driverSwapLoss" type="number" min="0" step="0.1" value="${s.driverSwapLoss}"></div>
          </div></div>
          <button class="primary" style="width:100%;margin-top:16px">Пересчитать стратегию</button>
        </form>
      </article>
      <div class="stack">
        <article class="card card-pad">
          <div class="card-head"><div><h2>Варианты стратегии</h2><p>${esc(results.meta.track)} · ${esc(results.meta.config)} · ${results.meta.laps} кругов · ${results.meta.fuel.toFixed(1)} л</p></div><span class="pill">${results.meta.weather}</span></div>
          ${renderStrategyComparison(results.items)}
          <div class="strategy-summary-grid"><div><small>Окно лучшей стратегии</small><strong>${esc(results.meta.window)}</strong></div><div><small>Минимум остановок</small><strong>${results.meta.minStops}</strong></div><div><small>Прогноз трафика</small><strong>${esc(results.meta.trafficForecast)}</strong></div><div><small>Нейтрализация</small><strong>${esc(results.meta.safetyCar)}</strong></div></div>
          <div class="strategy-results">${results.items.map((r,i)=>renderStrategyCard(r,i===0)).join('')}</div>
        </article>
        <div class="grid-3">
          <article class="card metric"><small>Топливо на гонку</small><strong>${results.meta.fuel.toFixed(1)} л</strong><span>резерв ${results.meta.reserveLaps.toFixed(1)} круга</span></article>
          <article class="card metric"><small>Оценка длительности</small><strong>${secondsToClock(results.meta.raceSeconds)}</strong><span>без красных флагов</span></article>
          <article class="card metric"><small>Цена трафика</small><strong>+${results.meta.trafficLoss.toFixed(1)}с</strong><span>ожидаемая модель</span></article>
        </div>
      </div>
    </div>`;
  }
  function renderStrategyComparison(items){
    const fastest=Math.min(...items.map(item=>item.total)),slowest=Math.max(...items.map(item=>item.total)),range=Math.max(1,slowest-fastest);
    return `<div class="strategy-comparison" aria-label="Сравнение вариантов стратегии">${items.map((item,index)=>{const width=44+(slowest-item.total)/range*56;const delta=item.total-fastest;return `<div class="strategy-bar-row"><span>${index+1}. ${esc(item.name)}</span><div class="strategy-bar-track"><i style="width:${width.toFixed(1)}%"></i></div><strong>${delta<.05?'лучший':`+${delta.toFixed(1)}с`}</strong></div>`}).join('')}</div>`;
  }
  function calculateStrategies(input){
    const lapMs=lapToMs(input.lapTime)||120000,lapSec=lapMs/1000;
    const laps=input.raceMode==='laps'?Math.max(1,Math.round(+input.raceLaps||1)):Math.max(1,Math.ceil((+input.duration||1)*60/lapSec));
    const fuelPer=Math.max(.01,+input.fuelPerLap||1),reserveLaps=Math.max(0,+input.fuelReserveLaps||0),fuel=laps*fuelPer+fuelPer*reserveLaps;
    const tank=Math.max(1,+input.tank||1),startFuel=Math.min(tank,Math.max(0,+input.startFuel||tank)),maxFuelLaps=Math.max(1,Math.floor(tank/fuelPer)),firstFuelLaps=Math.max(1,Math.floor(startFuel/fuelPer));
    const fuelStops=laps<=firstFuelLaps?0:Math.ceil((laps-firstFuelLaps)/maxFuelLaps);
    const tyreLife=Math.max(1,+input.tyreLife||1),tyreStops=Math.max(0,Math.ceil(laps/tyreLife)-1);
    const compoundStops=input.compoundRule==='two'&&input.weather==='dry'&&laps>1?1:0,swapStops=input.driverSwapRequired==='yes'?1:0;
    const minStops=Math.max(+input.mandatoryStops||0,fuelStops,tyreStops,compoundStops,swapStops);
    const pitLoss=Math.max(0,+input.pitLoss||0),entryPenalty=Math.max(0,+input.pitEntryPenalty||0),pitTraffic=Math.max(0,+input.pitTraffic||0),trackTraffic=Math.max(0,+input.traffic||0);
    const weather=input.weather==='wet'?'Дождь':input.weather==='mixed'?'Переменно':'Сухо';
    const safetyLabel=input.safetyCar==='likely'?'Высокая вероятность':input.safetyCar==='possible'?'Возможен':'Не ожидается';
    const scExpected=input.safetyCar==='likely'?.35:input.safetyCar==='possible'?.16:0;
    const base=String(input.compound||'medium');
    const weatherSet=input.weather==='wet'?['wet']:input.weather==='mixed'?[base==='wet'?'intermediate':base,'intermediate','wet']:[];
    const ensureCompounds=(list,parts)=>{
      const result=Array.from({length:parts},(_,i)=>list[i]||list.at(-1)||base);
      if(input.compoundRule==='two'&&input.weather==='dry'&&parts>1&&new Set(result).size<2)result[1]=result[0]==='soft'?'medium':result[0]==='medium'?'hard':'medium';
      return result;
    };
    const make=(name,stops,compounds,risk,pacePenalty,note,shape='balanced',scBias=0)=>{
      stops=Math.max(minStops,stops);const parts=stops+1;let stints=shapeStints(laps,parts,shape);compounds=ensureCompounds(compounds,parts);
      const degPenalty=stints.reduce((sum,n,idx)=>{const limit=tyreLife*compoundLife(compounds[idx]);return sum+Math.max(0,n-limit)*1.05;},0);
      const pitCost=stops*(pitLoss+entryPenalty+pitTraffic),swapCost=input.driverSwapRequired==='yes'?Math.max(0,+input.driverSwapLoss||0):0;
      const trafficFactor=shape==='undercut'?.7:shape==='overcut'?.84:1,trafficLoss=trackTraffic*(stops?0.72:1.15)*trafficFactor;
      const tactical=(input.battlePlan==='undercut'&&shape==='undercut')?-2.8:(input.battlePlan==='overcut'&&shape==='overcut')?-2.2:(input.battlePlan!=='balanced'&&shape==='balanced')?.8:0;
      const scBenefit=(pitLoss+entryPenalty)*scExpected*scBias;
      const total=laps*lapSec+pitCost+swapCost+pacePenalty*laps+degPenalty+trafficLoss+tactical-scBenefit;
      const first=stints[0],window=`${Math.max(1,first-2)}–${Math.min(laps-1,first+2)} круг`;
      return {name,stops,compounds,stints,risk,total,note,degPenalty,pitCost:pitCost+swapCost,trafficLoss,window};
    };
    const dryBalanced=[base,...Array(Math.max(1,minStops)).fill(base==='soft'?'medium':base)];
    const candidates=[
      make('Сбалансированная',minStops,input.weather==='dry'?dryBalanced:weatherSet,'Низкий',base==='hard'?.65:base==='soft'?-.18:0,'Равномерные стинты, предсказуемое окно и небольшой риск перегрева шин.','balanced',.25),
      make('Андеркат',Math.max(1,minStops),input.weather==='dry'?['soft','medium','hard']:weatherSet,'Средний',-.34,'Ранний первый стоп освобождает трассу и создаёт преимущество на свежем комплекте.','undercut',.1),
      make('Оверкат',minStops,input.weather==='dry'?['hard','medium','soft']:weatherSet,'Средний',.3,'Длинный первый стинт полезен при чистом воздухе и падении темпа соперников.','overcut',.3),
      make(input.weather==='mixed'?'Погодное окно':'Safety Car hedge',Math.max(1,minStops),input.weather==='mixed'?[base,'intermediate','wet']:input.weather==='wet'?['wet','wet']:['medium','hard','soft'],'Средне-высокий',input.weather==='mixed'?.15:.42,input.weather==='mixed'?`Переход на дождевой состав около ${Math.max(1,+input.rainLap||1)} круга с запасом на изменение прогноза.`:'Окно оставлено гибким: остановка переносится под VSC/SC без разрушения всей гонки.','sc',1)
    ].sort((a,b)=>a.total-b.total);
    const best=candidates[0],t=track(input.track||'spa'),config=t.configs.includes(input.config)?input.config:t.configs[0];
    const trafficForecast=trackTraffic>=8?'Плотный после пит-стопа':trackTraffic>=4?'Умеренный, окно ±2 круга':'Чистый воздух вероятен';
    return {items:candidates,meta:{laps,fuel,reserveLaps,minStops,trafficLoss:best.trafficLoss,window:best.window,weather,safetyCar:safetyLabel,trafficForecast,track:t.name,config,raceSeconds:laps*lapSec}};
  }
  function shapeStints(laps,parts,shape){
    if(parts<=1)return[laps];const balanced=splitLaps(laps,parts),base=balanced[0],shift=Math.max(1,Math.min(3,Math.round(laps*.05)));
    let first=base;if(shape==='undercut')first=Math.max(1,base-shift);if(shape==='overcut')first=Math.min(laps-parts+1,base+shift);if(shape==='sc')first=Math.max(1,base-1);
    return [first,...splitLaps(laps-first,parts-1)];
  }
  function splitLaps(laps,parts){const base=Math.floor(laps/parts),rem=laps%parts;return Array.from({length:parts},(_,i)=>base+(i<rem?1:0));}
  function compoundLife(c){return c==='soft'?.78:c==='hard'?1.3:c==='wet'?1.18:c==='intermediate'?1.05:1;}
  function compoundLetter(c){return c==='intermediate'?'I':c==='wet'?'W':String(c||'?')[0].toUpperCase();}
  function renderStrategyCard(r,recommended){
    const colors={soft:'',medium:'medium',hard:'hard',wet:'wet',intermediate:'intermediate'};
    return `<div class="strategy-card ${recommended?'recommended':''}">${recommended?'<span class="recommend">Рекомендуется</span>':''}<div class="strategy-title"><div><h3>${esc(r.name)}</h3><span class="pill" style="margin-top:7px">Риск: ${esc(r.risk)}</span></div><strong>${secondsToClock(r.total)}</strong></div><div class="stints">${r.stints.map((n,i)=>`<span class="stint ${colors[r.compounds[i]||r.compounds.at(-1)]||''}" style="--stint:${n}" title="${n} кругов"></span>`).join('')}</div><div class="strategy-meta"><div><small>Остановки</small><strong>${r.stops}</strong></div><div><small>Пит-окно</small><strong>${esc(r.window)}</strong></div><div><small>Составы</small><strong>${r.compounds.slice(0,r.stints.length).map(compoundLetter).join(' → ')}</strong></div><div><small>Пит + смена</small><strong>+${r.pitCost.toFixed(1)}с</strong></div><div><small>Деградация</small><strong>+${r.degPenalty.toFixed(1)}с</strong></div><div><small>Трафик</small><strong>+${r.trafficLoss.toFixed(1)}с</strong></div></div><p class="strategy-note">${esc(r.note)}</p></div>`;
  }

  function renderSetups(){
    const setups=state.setups.filter(s=>s.profileId===state.activeProfile).sort((a,b)=>String(b.created).localeCompare(String(a.created)));
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="setupSearch" placeholder="Название, трасса, машина"></div></div><div class="toolbar-group"><button class="secondary" data-action="compare-setups">Сравнить</button><button class="primary" data-action="new-setup">＋ Новый сетап</button></div></div>
      <article class="card card-pad"><div class="card-head"><div><h2>Гараж сетапов</h2><p>${setups.length} конфигураций в профиле ${esc(profile().name)}</p></div></div><div id="setupGrid" class="setup-grid">${setups.length?setups.map(renderSetupCard).join(''):renderEmpty('⌘','Нет сохранённых сетапов','Создайте первый сетап и сравнивайте изменения по ключевым параметрам.')}</div></article>`;
  }
  function renderSetupCard(s){const v=s.values||{};return `<button class="setup-card" data-action="setup-detail" data-id="${esc(s.id)}" style="text-align:left;color:inherit"><div style="display:flex;justify-content:space-between;align-items:center"><span class="game-badge" style="width:38px;height:38px;color:${game(s.game).accent}">${esc(game(s.game).short)}</span><span class="pill">${formatDate(s.created)}</span></div><h3>${esc(s.name)}</h3><p>${esc(track(s.track).name)} · ${esc(s.config||track(s.track).configs[0])} · ${esc(car(s.car).name)}</p><div class="tags">${(s.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div><div class="setup-mini"><div><small>Крыло</small><strong>${v.frontWing??'—'} / ${v.rearWing??'—'}</strong></div><div><small>Давление</small><strong>${v.frontPressure??'—'} / ${v.rearPressure??'—'}</strong></div><div><small>Баланс</small><strong>${v.brakeBias??'—'}%</strong></div></div></button>`;}

  function renderCatalog(){
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="catalogSearch" placeholder="Найти трассу или автомобиль"></div><div class="segmented" id="catalogMode"><button class="active" data-value="tracks">Трассы</button><button data-value="cars">Автомобили</button></div></div><select class="select" id="catalogGame" style="width:auto"><option value="all">Все игры</option>${optionList(D.games,'none')}</select></div><div id="catalogGrid" class="catalog-grid">${D.tracks.map(renderTrackCard).join('')}</div>`;
  }
  function renderTrackCard(t){const configs=t.configDetails?.length||t.configs.length;return `<button class="catalog-card" data-action="catalog-track" data-id="${t.id}" style="text-align:left;color:inherit"><div class="catalog-visual track-catalog-visual" style="color:var(--text)">${trackSvg(t,'currentColor')}</div><div class="catalog-content"><div class="catalog-title-row"><h3>${esc(t.name)}</h3><span class="config-count">${configs} конф.</span></div><p>${esc(t.country)} · ${esc(t.type==='street'?'городская':t.type==='drift'?'дрифт':'кольцевая')}</p><div class="catalog-meta"><span>${t.length.toFixed(3)} км</span><span>${t.corners} пов.</span><span aria-label="Сложность ${t.difficulty} из 5">${'●'.repeat(Math.min(5,t.difficulty))}</span></div></div></button>`;}
  function renderCarCard(c){return `<button class="catalog-card" data-action="catalog-car" data-id="${c.id}" style="text-align:left;color:inherit"><div class="catalog-visual"><span class="car-silhouette">⌁</span></div><div class="catalog-content"><h3>${esc(c.name)}</h3><p>${esc(c.class)} · ${esc(c.drivetrain)}</p><div class="catalog-meta"><span>${c.power} л.с.</span><span>${c.weight} кг</span><span>${c.games.map(id=>game(id).short).join(' · ')}</span></div></div></button>`;}

  function renderGuides(){
    return `<div class="toolbar"><div class="toolbar-group"><div class="search"><input id="guideSearch" placeholder="Найти трассу или поворот"></div></div><span class="pill">${D.guides.length} подробных гайдов</span></div><div id="guideGrid" class="guide-grid">${D.guides.map(renderGuideCard).join('')}</div>`;
  }
  function renderGuideCard(g){const t=track(g.track);return `<button class="guide-card" data-action="guide-detail" data-id="${g.track}" style="text-align:left;color:inherit"><div class="guide-photo"><img src="${esc(g.photo)}" alt="Вид трассы ${esc(t.name)}" loading="lazy" decoding="async"><span class="image-fallback" aria-hidden="true">${trackSvg(t,'currentColor')}</span><span class="guide-level">${esc(g.level)}</span><div class="guide-map" style="color:white">${trackSvg(t,'currentColor')}</div><span class="guide-photo-shade"></span></div><div class="guide-content"><div class="guide-card-topline"><span>${t.length.toFixed(3)} км</span><span>${t.configs.length} конф.</span></div><h3>${esc(t.name)}</h3><p>${esc(g.summary)}</p><div class="guide-focus"><span>Фокус</span><strong>${esc(g.focus||'Траектория и стабильность')}</strong></div><div class="guide-actions"><span class="corner-count">${g.sectors.length} ключевых зон</span><span class="link-button">Открыть →</span></div></div></button>`;}

  function renderSettings(){
    const p=profile();
    return `<div class="settings-grid">
      <div class="stack">
        <article class="card setting-card"><div class="card-head"><div><h2>Профили пилота</h2><p>Раздельные цели, сессии и сетапы</p></div></div><div class="grid-2">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===p.id?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} · ${x.focus}</small></span><span>${x.id===p.id?'✓':'›'}</span></button>`).join('')}</div></article>
        <article class="card setting-card"><div class="card-head"><div><h2>Визуальные темы</h2><p>Применяются ко всему интерфейсу и PWA</p></div></div><div class="theme-grid">${D.themes.map(themeCard).join('')}</div></article>
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
          <div class="setting-row"><div><h3>Сброс демо-данных</h3><p>Вернуть четыре примера сессий и четыре сетапа.</p></div><button class="secondary" data-action="restore-demo">Вернуть</button></div>
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
    if(route==='strategy')bindStrategyForm();
    bindGuideImages(els.view);
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
  function bindGuideFilter(){const input=document.getElementById('guideSearch');input?.addEventListener('input',()=>{const q=input.value.toLowerCase();const list=D.guides.filter(g=>`${track(g.track).name} ${track(g.track).country} ${g.summary} ${g.focus||''} ${(g.setup||[]).join(' ')} ${g.sectors.map(s=>Object.values(s).join(' ')).join(' ')}`.toLowerCase().includes(q));const grid=document.getElementById('guideGrid');grid.innerHTML=list.length?list.map(renderGuideCard).join(''):renderEmpty('⌕','Гайд не найден','Проверьте название трассы, конфигурации или поворота.');bindGuideImages(grid);});}
  function bindStrategyForm(){
    const form=document.getElementById('strategyForm');if(!form)return;
    const trackSelect=form.querySelector('[name="track"]'),configSelect=form.querySelector('[name="config"]'),mode=form.querySelector('[name="raceMode"]');
    trackSelect?.addEventListener('change',()=>{if(configSelect){configSelect.innerHTML=configOptions(trackSelect.value,'');configSelect.selectedIndex=0;}});
    mode?.addEventListener('change',()=>{const wrap=form.querySelector('[data-race-amount]');const input=wrap?.querySelector('input');if(!wrap||!input)return;const laps=mode.value==='laps';wrap.querySelector('label').textContent=laps?'Кругов':'Длительность, мин';input.name=laps?'raceLaps':'duration';input.value=laps?state.strategy.raceLaps:state.strategy.duration;});
  }

  function openModal(content,size=''){
    modalReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    els.modalRoot.innerHTML=`<div class="modal-backdrop" data-modal-backdrop><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="Диалог SimGrid">${content}</div></div>`;
    document.documentElement.classList.add('modal-open');document.body.classList.add('modal-open');
    bindModalEnhancements();
    setTimeout(()=>els.modalRoot.querySelector('input,select,textarea,button')?.focus(),20);
  }
  function closeModal(){els.modalRoot.innerHTML='';document.documentElement.classList.remove('modal-open');document.body.classList.remove('modal-open');modalReturnFocus?.focus?.();modalReturnFocus=null;}
  function modalShell(title,body,actions=''){return `<div class="modal-head"><h2>${esc(title)}</h2><button class="modal-close" data-action="close-modal" aria-label="Закрыть">×</button></div><div class="modal-body"><div class="modal-scroll-content">${body}</div></div>${actions?`<div class="modal-actions">${actions}</div>`:''}`;}
  function bindGuideImages(root=document){
    root.querySelectorAll('.guide-photo img,.guide-detail-hero img').forEach(img=>{
      if(img.dataset.boundImage==='1')return;
      img.dataset.boundImage='1';
      const holder=img.closest('.guide-photo,.guide-detail-hero');
      const loaded=()=>{holder?.classList.add('image-loaded');holder?.classList.remove('image-error');};
      const failed=()=>{holder?.classList.add('image-error');holder?.classList.remove('image-loaded');};
      img.addEventListener('load',loaded,{once:true});
      img.addEventListener('error',failed,{once:true});
      if(img.complete)(img.naturalWidth?loaded:failed)();
    });
  }
  function bindModalEnhancements(){
    const root=els.modalRoot;
    const trackSelect=root.querySelector('select[name="track"]');const configSelect=root.querySelector('select[name="config"]');
    if(trackSelect&&configSelect){trackSelect.addEventListener('change',()=>{const previous=configSelect.value;configSelect.innerHTML=configOptions(trackSelect.value,previous);if(!configSelect.value)configSelect.selectedIndex=0;});}
    const guideConfig=root.querySelector('#guideConfig');const guideMeta=root.querySelector('#guideConfigMeta');
    guideConfig?.addEventListener('change',()=>{const t=track(guideConfig.dataset.track);const detail=(t.configDetails||[]).find(item=>item.name===guideConfig.value)||{length:t.length,corners:t.corners};if(guideMeta)guideMeta.textContent=`${Number(detail.length||t.length).toFixed(3)} км · ${detail.corners||t.corners} поворотов`;});
    bindGuideImages(root);
  }

  function showSessionForm(seed={}){
    const s={profileId:state.activeProfile,date:today(),game:state.live.game,track:state.live.track,config:track(state.live.track).configs?.[0]||'Grand Prix',car:state.live.car,weather:'Сухо · 24°C',sessionType:'Практика',bestLap:'',averageLap:'',laps:0,cleanLaps:0,fuelStart:0,fuelEnd:0,tyreWear:0,notes:'',lapTimes:[],...seed};
    if(!track(s.track).configs.includes(s.config))s.config=track(s.track).configs[0]||s.config;
    const body=`<form id="sessionForm"><div class="form-section"><div class="form-grid three"><div class="field"><label>Дата</label><input class="input" name="date" type="date" value="${esc(s.date)}" required></div><div class="field"><label>Игра</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>Тип</label><select class="select" name="sessionType">${['Практика','Квалификация','Гонка','Time Attack','Drift'].map(x=>`<option ${x===s.sessionType?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>Конфигурация</label><select class="select" name="config">${configOptions(s.track,s.config)}</select><span class="field-help">Список меняется вместе с выбранной трассой.</span></div><div class="field"><label>Машина</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field full"><label>Погода / температура</label><input class="input" name="weather" value="${esc(s.weather)}"></div></div></div>
      <div class="form-section"><h3>Результаты</h3><div class="form-grid three"><div class="field"><label>Лучший круг</label><input class="input" name="bestLap" placeholder="1:42.381" value="${esc(s.bestLap)}"></div><div class="field"><label>Средний круг</label><input class="input" name="averageLap" placeholder="1:44.020" value="${esc(s.averageLap)}"></div><div class="field"><label>Кругов</label><input class="input" name="laps" type="number" min="0" value="${s.laps||0}"></div><div class="field"><label>Чистых кругов</label><input class="input" name="cleanLaps" type="number" min="0" value="${s.cleanLaps||0}"></div><div class="field"><label>Топливо старт, л</label><input class="input" name="fuelStart" type="number" step="0.1" value="${s.fuelStart||0}"></div><div class="field"><label>Топливо финиш, л</label><input class="input" name="fuelEnd" type="number" step="0.1" value="${s.fuelEnd||0}"></div><div class="field"><label>Износ шин, %</label><input class="input" name="tyreWear" type="number" min="0" max="100" value="${s.tyreWear||0}"></div></div></div>
      <div class="form-section"><h3>Серия кругов</h3><div class="field"><label>По одному времени на строку</label><textarea class="textarea" name="lapTimes" placeholder="1:44.210&#10;1:43.881&#10;1:43.522">${esc((s.lapTimes||[]).join('\n'))}</textarea><span class="field-help">Стабильность, среднее и лучший круг будут рассчитаны автоматически.</span></div></div>
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

  function setupFieldsHtml(values){
    return SETUP_GROUPS.map(group=>`<section class="form-section setup-form-section"><div class="section-title compact"><span class="eyebrow">${esc(group.id)}</span><h3>${esc(group.title)}</h3><p>${esc(group.hint)}</p></div><div class="form-grid three">${group.fields.map(field=>`<div class="field"><label>${esc(field.label)}${field.unit?` · ${esc(field.unit)}`:''}</label><input class="input" name="${field.key}" type="number" step="${field.step}" value="${values[field.key]??field.def}"></div>`).join('')}</div></section>`).join('');
  }
  function showSetupForm(seed={}){
    const base={name:'',game:'acc',track:'spa',config:'Grand Prix',car:'m4gt3',tags:[],values:{...DEFAULT_SETUP_VALUES}};
    const s={...base,...seed,values:{...DEFAULT_SETUP_VALUES,...(seed.values||{})}};if(!track(s.track).configs.includes(s.config))s.config=track(s.track).configs[0];
    const body=`<form id="setupForm"><div class="form-grid three"><div class="field full"><label>Название</label><input class="input" name="name" value="${esc(s.name)}" required placeholder="Spa race · стабильный зад"></div><div class="field"><label>Игра</label><select class="select" name="game">${optionList(D.games,s.game)}</select></div><div class="field"><label>Трасса</label><select class="select" name="track">${optionList(D.tracks,s.track)}</select></div><div class="field"><label>Конфигурация</label><select class="select" name="config">${configOptions(s.track,s.config)}</select></div><div class="field"><label>Машина</label><select class="select" name="car">${optionList(D.cars,s.car)}</select></div><div class="field"><label>Теги через запятую</label><input class="input" name="tags" value="${esc((s.tags||[]).join(', '))}" placeholder="race, stable, dry"></div></div>${setupFieldsHtml(s.values)}</form>`;
    openModal(modalShell(s.id?'Редактировать сетап':'Новый сетап',body,`<button class="secondary" data-action="close-modal">Отмена</button><button class="primary" data-action="save-setup" data-id="${esc(s.id||'')}">Сохранить</button>`),'wide');
  }
  function saveSetup(id){
    const form=document.getElementById('setupForm');if(!form?.reportValidity())return;const fd=new FormData(form);
    const entry={id:id||uid('setup'),profileId:state.activeProfile,name:String(fd.get('name')),game:String(fd.get('game')),track:String(fd.get('track')),config:String(fd.get('config')),car:String(fd.get('car')),created:today(),tags:String(fd.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),values:Object.fromEntries(SETUP_FIELDS.map(field=>[field.key,+fd.get(field.key)||0]))};
    const idx=state.setups.findIndex(x=>x.id===id);if(idx>=0)state.setups[idx]=entry;else state.setups.push(entry);saveState();closeModal();toast('Сетап сохранён');render();
  }
  function setupTables(values){
    return SETUP_GROUPS.map(group=>`<section class="setup-detail-group"><div class="section-title compact"><span class="eyebrow">${esc(group.id)}</span><h3>${esc(group.title)}</h3></div><table class="compare-table"><tbody>${group.fields.map(field=>`<tr><th>${esc(field.label)}</th><td>${values[field.key]??field.def}${field.unit?` <small>${esc(field.unit)}</small>`:''}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function showSetupDetail(id){
    const s=state.setups.find(x=>x.id===id);if(!s)return;const values={...DEFAULT_SETUP_VALUES,...(s.values||{})};const cfg=s.config||track(s.track).configs[0];
    const body=`<div class="setup-detail-hero"><div><span class="eyebrow">${esc(game(s.game).name)}</span><h3>${esc(s.name)}</h3><p>${esc(track(s.track).name)} · ${esc(cfg)} · ${esc(car(s.car).name)}</p></div><div class="tags">${(s.tags||[]).map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div></div><div class="setup-detail-grid">${setupTables(values)}</div>`;
    openModal(modalShell(s.name,body,`<button class="danger-button" data-action="delete-setup" data-id="${s.id}">Удалить</button><button class="secondary" data-action="edit-setup" data-id="${s.id}">Изменить</button><button class="primary" data-action="close-modal">Готово</button>`),'wide');
  }
  function showCompareSetups(){const list=state.setups.filter(s=>s.profileId===state.activeProfile);if(list.length<2){toast('Для сравнения нужны минимум два сетапа','warn');return;}const body=`<div class="form-grid"><div class="field"><label>Сетап A</label><select class="select" id="compareA">${optionList(list,list[0].id,x=>x.name)}</select></div><div class="field"><label>Сетап B</label><select class="select" id="compareB">${optionList(list,list[1].id,x=>x.name)}</select></div></div><div id="compareResult" class="form-section compare-result"></div>`;openModal(modalShell('Сравнение сетапов',body,`<button class="secondary" data-action="close-modal">Закрыть</button><button class="primary" data-action="run-compare">Сравнить</button>`),'wide');renderCompare(list[0].id,list[1].id);}
  function renderCompare(aId,bId){
    const a=state.setups.find(x=>x.id===aId),b=state.setups.find(x=>x.id===bId),root=document.getElementById('compareResult');if(!a||!b||!root)return;const av={...DEFAULT_SETUP_VALUES,...(a.values||{})},bv={...DEFAULT_SETUP_VALUES,...(b.values||{})};
    root.innerHTML=`<div class="compare-context"><div><small>A</small><strong>${esc(a.name)}</strong><span>${esc(track(a.track).name)} · ${esc(a.config||track(a.track).configs[0])}</span></div><div><small>B</small><strong>${esc(b.name)}</strong><span>${esc(track(b.track).name)} · ${esc(b.config||track(b.track).configs[0])}</span></div></div><div class="compare-scroll"><table class="compare-table"><thead><tr><th>Параметр</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th><th>Δ B−A</th></tr></thead><tbody>${SETUP_GROUPS.map(group=>`<tr class="compare-group-row"><th colspan="4">${esc(group.title)}</th></tr>${group.fields.map(field=>{const x=+av[field.key]||0,y=+bv[field.key]||0,d=y-x;return `<tr><th>${esc(SETUP_LABELS[field.key])}</th><td>${x}</td><td>${y}</td><td class="${d>0?'diff-positive':d<0?'diff-negative':''}">${d>0?'+':''}${Number(d.toFixed(2))}</td></tr>`}).join('')}`).join('')}</tbody></table></div>`;
  }

  function phaseVisual(label,value,kind){return `<div class="phase ${kind}"><small>${esc(label)}</small><strong>${esc(value||'—')}</strong></div>`;}
  function cornerDiagram(index,name='Поворот'){
    const mirror=index%2===1?'translate(160 0) scale(-1 1)':'';const hairpin=index%3===2;
    const d=hairpin?'M18 91 C62 91 72 72 72 50 C72 28 93 17 142 23':'M15 92 C48 88 55 64 73 50 C91 36 108 31 146 22';
    return `<svg viewBox="0 0 160 110" role="img" aria-label="Схема: ${esc(name)}"><g transform="${mirror}"><path class="corner-road-edge" d="${d}"/><path class="corner-racing-line" d="${d}"/><circle class="corner-marker brake" cx="31" cy="86" r="6"/><circle class="corner-marker apex" cx="76" cy="49" r="6"/><circle class="corner-marker exit" cx="132" cy="25" r="6"/></g><text x="9" y="106">BRAKE</text><text x="67" y="106">APEX</text><text x="124" y="106">EXIT</text></svg>`;
  }
  function showGuideDetail(trackId){
    const g=D.guides.find(x=>x.track===trackId);if(!g)return;const t=track(trackId);
    const sectors=g.sectors.map((s,i)=>`<article class="corner-item-rich"><div class="corner-item-head"><span class="corner-num">${i+1}</span><div><h4>${esc(s.name)}</h4><p>${esc(s.tip)}</p></div><span class="gear">${esc(s.gear)} · ${esc(s.speed||'')}</span></div><div class="corner-visual">${cornerDiagram(i,s.name)}<div><span>Визуальная последовательность</span><strong>Торможение → апекс → раннее открытие руля</strong><p>Схема показывает порядок действий; реальные ориентиры и значения указаны ниже.</p></div></div><div class="corner-phases">${phaseVisual('Торможение',s.brake,'brake')}<span class="phase-arrow">→</span>${phaseVisual('Траектория',s.line,'line')}<span class="phase-arrow">→</span>${phaseVisual('Апекс',s.apex,'apex')}<span class="phase-arrow">→</span>${phaseVisual('Выход',s.exit,'exit')}</div></article>`).join('');
    const body=`<div class="guide-detail-hero"><img src="${esc(g.photo)}" alt="Вид трассы ${esc(t.name)}" decoding="async"><span class="image-fallback">${trackSvg(t,'currentColor')}</span><div class="guide-detail-title"><span class="pill">${esc(g.level)}</span><h2>${esc(t.name)}</h2><p>${t.length.toFixed(3)} км · ${t.corners} поворотов · ${esc(t.country)}</p></div></div>
      <nav class="guide-jumpbar" aria-label="Разделы гайда"><button type="button" data-action="guide-jump" data-target="guide-map">Карта</button><button type="button" data-action="guide-jump" data-target="guide-zones">Зоны</button><button type="button" data-action="guide-jump" data-target="guide-setup">Сетап</button><button type="button" data-action="guide-jump" data-target="guide-errors">Ошибки</button></nav>
      <section class="guide-overview"><div><span>Главный фокус</span><strong>${esc(g.focus||'Точность и стабильность')}</strong><small id="guideConfigMeta">${t.length.toFixed(3)} км · ${t.corners} поворотов</small></div><div class="field"><label>Конфигурация</label><select id="guideConfig" data-track="${t.id}" class="select">${configOptions(t.id,t.configs[0])}</select></div></section>
      <section id="guide-map" class="guide-map-stage card"><div class="guide-map-canvas">${trackSvg(t,'currentColor',`Схема ${t.name}`)}<div class="map-callouts">${g.sectors.map((_,i)=>`<span style="--i:${i}">${i+1}</span>`).join('')}</div></div><div class="map-copy"><span class="eyebrow">Схема зон</span><h3>Сначала выучи ориентиры, затем повышай темп</h3><p>Красная точка отмечает старт/финиш. Номера соответствуют ключевым зонам ниже; схема служит навигацией, а аэрофото помогает понять рельеф и окружение.</p><div class="map-legend"><span><i class="legend-brake"></i> торможение</span><span><i class="legend-apex"></i> апекс</span><span><i class="legend-exit"></i> выход</span></div></div></section>
      <section id="guide-zones"><div class="section-title"><span class="eyebrow">Racing line</span><h3>Ключевые зоны</h3><p>Для каждой зоны показана последовательность «торможение → траектория → апекс → выход».</p></div><div class="corner-list-rich">${sectors}</div></section>
      <div class="guide-bottom-grid"><article id="guide-setup" class="card guide-info-card"><div class="card-head"><div><span class="eyebrow">Garage</span><h3>Базовый сетап</h3></div></div>${g.setup.map(x=>`<div class="guide-check"><span>✓</span><p>${esc(x)}</p></div>`).join('')}</article><article id="guide-errors" class="card guide-info-card"><div class="card-head"><div><span class="eyebrow">Risk</span><h3>Типичные ошибки</h3></div></div>${g.mistakes.map(x=>`<div class="guide-check danger"><span>!</span><p>${esc(x)}</p></div>`).join('')}</article><article class="card guide-info-card"><div class="card-head"><div><span class="eyebrow">Drill</span><h3>Чеклист тренировки</h3></div></div>${(g.checklist||[]).map(x=>`<div class="guide-check"><span>○</span><p>${esc(x)}</p></div>`).join('')}</article></div>
      <p class="guide-credit">Фотография трассы сохранена локально для офлайн-режима. Автор и лицензия указаны в CREDITS.md.</p>`;
    openModal(modalShell(`Гайд · ${t.name}`,body,`<button class="secondary" data-action="new-session-guide" data-id="${t.id}">Записать тренировку</button><button class="primary" data-action="close-modal">Закрыть</button>`),'wide guide-modal');
  }
  function showCatalogTrack(id){
    const t=track(id),guide=D.guides.find(g=>g.track===id);const configs=(t.configDetails?.length?t.configDetails:t.configs.map(name=>({name,length:t.length,corners:t.corners})));
    const body=`<div class="catalog-track-hero"><div class="catalog-track-map">${trackSvg(t,'currentColor')}</div><div><span class="eyebrow">${esc(t.country)}</span><h3>${esc(t.name)}</h3><p>${esc(t.type==='street'?'Городская трасса':t.type==='drift'?'Дрифт-площадка':'Кольцевая трасса')} · сложность ${t.difficulty}/5</p></div></div><div class="grid-3"><div class="metric card"><small>Базовая длина</small><strong>${t.length.toFixed(3)}</strong><span>километра</span></div><div class="metric card"><small>Повороты</small><strong>${t.corners}</strong><span>в основной версии</span></div><div class="metric card"><small>Конфигурации</small><strong>${configs.length}</strong><span>доступно в каталоге</span></div></div><div class="form-section"><div class="section-title compact"><h3>Выберите конфигурацию</h3><p>Она автоматически попадёт в новую сессию.</p></div><select class="select" id="catalogTrackConfig">${configOptions(t.id,t.configs[0])}</select><div class="configuration-grid">${configs.map(c=>`<article class="configuration-card"><strong>${esc(c.name)}</strong><span>${c.length?`${Number(c.length).toFixed(3)} км`:''}${c.corners?` · ${c.corners} пов.`:''}</span><p>${esc(c.note||'Конфигурация трассы')}</p></article>`).join('')}</div></div><div class="form-section"><h3>Доступность</h3><div class="tags">${t.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;
    openModal(modalShell(t.name,body,`${guide?`<button class="secondary" data-action="guide-detail" data-id="${t.id}">Открыть гайд</button>`:''}<button class="primary" data-action="new-session-track" data-id="${t.id}">Новая сессия</button>`),'wide');
  }
  function showCatalogCar(id){const c=car(id);const pwr=(c.power/c.weight*1000).toFixed(0);const body=`<div class="catalog-visual" style="height:180px"><span class="car-silhouette" style="font-size:80px">⌁</span></div><div class="grid-3" style="margin-top:16px"><div class="metric card"><small>Мощность</small><strong>${c.power}</strong><span>л.с.</span></div><div class="metric card"><small>Масса</small><strong>${c.weight}</strong><span>кг</span></div><div class="metric card"><small>л.с./т</small><strong>${pwr}</strong><span>${c.drivetrain}</span></div></div><div class="form-section"><h3>Игры</h3><div class="tags">${c.games.map(id=>`<span class="tag">${esc(game(id).name)}</span>`).join('')}</div></div>`;openModal(modalShell(c.name,body,`<button class="primary" data-action="new-session-car" data-id="${c.id}">Новая сессия</button>`));}

  function showThemePicker(){const body=`<div class="theme-grid modal-theme-grid">${D.themes.map(themeCard).join('')}</div>`;openModal(modalShell('Тема интерфейса',body,`<button class="primary" data-action="close-modal">Готово</button>`),'small');}
  function showProfilePicker(){const body=`<div class="stack">${D.profiles.map(x=>`<button class="profile-switch" data-action="select-profile" data-id="${x.id}" style="border-color:${x.id===state.activeProfile?'var(--accent)':'var(--line)'}"><span class="profile-avatar">${x.icon}</span><span><strong>${x.name}</strong><small>${x.hint} · цель ${x.goalLaps} кругов</small></span><span>${x.id===state.activeProfile?'✓':'›'}</span></button>`).join('')}</div>`;openModal(modalShell('Профиль пилота',body),'small');}
  function steamGameId(name=''){const n=String(name).toLowerCase();if(n.includes('competizione'))return'acc';if(n.includes('assetto corsa evo'))return'ace';if(n.includes('assetto corsa'))return'ac';if(n.includes('iracing'))return'iracing';if(n.includes('le mans ultimate'))return'lmu';if(n.includes('automobilista 2'))return'ams2';if(n.includes('raceroom'))return'raceroom';if(n.includes('rfactor 2'))return'rf2';if(/(^|\s)f1\D*2\d|formula 1/.test(n))return'f1';return'';}
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
      'guide-jump':()=>{const target=document.getElementById(a.dataset.target);if(!target)return;const scroller=target.closest('.modal-body');if(scroller){const top=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-12;scroller.scrollTo({top:Math.max(0,top),behavior:state.settings.reduceMotion?'auto':'smooth'});}else target.scrollIntoView({behavior:state.settings.reduceMotion?'auto':'smooth',block:'start'});},
      'new-session-guide':()=>{const cfg=document.getElementById('guideConfig')?.value||track(id).configs[0];closeModal();showSessionForm({track:id,config:cfg})},
      'catalog-track':()=>showCatalogTrack(id),
      'catalog-car':()=>showCatalogCar(id),
      'new-session-track':()=>{const cfg=document.getElementById('catalogTrackConfig')?.value||track(id).configs[0];closeModal();showSessionForm({track:id,config:cfg})},
      'new-session-car':()=>{closeModal();showSessionForm({car:id})},
      'set-theme':()=>{const hadModal=Boolean(els.modalRoot.innerHTML);state.theme=id;saveState();applyTheme();render();if(hadModal)showThemePicker();else toast(`Тема ${D.themes.find(t=>t.id===id)?.name||''} включена`)},
      'select-profile':()=>{if(state.activeProfile===id){closeModal();return;}state.activeProfile=id;saveState();closeModal();render();toast(`Профиль ${profile(id).name} активирован`)},
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
  document.addEventListener('submit',e=>{if(e.target.id==='strategyForm'){e.preventDefault();const fd=new FormData(e.target);state.strategy={...state.strategy,...Object.fromEntries(fd.entries())};['duration','raceLaps','fuelPerLap','tank','startFuel','fuelReserveLaps','pitLoss','pitEntryPenalty','pitTraffic','mandatoryStops','tyreLife','traffic','rainLap','driverSwapLoss'].forEach(k=>state.strategy[k]=+state.strategy[k]);saveState();render();}});
  els.importInput.addEventListener('change',()=>importFile(els.importInput.files[0]));
  els.quickAddBtn.addEventListener('click',()=>showSessionForm());els.themeBtn.addEventListener('click',showThemePicker);els.profileSwitch.addEventListener('click',showProfilePicker);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&els.modalRoot.innerHTML)closeModal();});
  document.addEventListener('error',event=>{const img=event.target;if(img instanceof HTMLImageElement)img.closest('.guide-photo,.guide-detail-hero')?.classList.add('image-error');},true);
  window.addEventListener('popstate',()=>{route=new URLSearchParams(location.search).get('view')||'dashboard';render();});
  window.addEventListener('resize',()=>{if(route==='dashboard')drawProgressChart();});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;els.installBtn.classList.remove('hidden');});
  els.installBtn.addEventListener('click',async()=>{if(!deferredInstall){toast('На iPhone: Поделиться → На экран «Домой»','warn');return;}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;els.installBtn.classList.add('hidden');});
  window.addEventListener('appinstalled',()=>toast('SimGrid установлен'));

  if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));}
  const params=new URLSearchParams(location.search);if(params.get('action')==='new-session')setTimeout(()=>showSessionForm(),300);
  render();
})();
