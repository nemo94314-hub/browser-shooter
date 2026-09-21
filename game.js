// ============ ZOMBIESHOOT v15.0 — game.js ============

const DEFAULT_PROGRESS = {
  coins: 0,
  levels: {
    0:{unlocked:true, completed:false, stars:0},
    1:{unlocked:true,completed:false,stars:0}, 2:{unlocked:false,completed:false,stars:0},
    3:{unlocked:false,completed:false,stars:0}, 4:{unlocked:false,completed:false,stars:0},
    5:{unlocked:false,completed:false,stars:0}, 6:{unlocked:false,completed:false,stars:0},
    7:{unlocked:false,completed:false,stars:0}, 8:{unlocked:false,completed:false,stars:0}
  },
  ownedSkins: ['default'],
  ownedWeapons: ['pistol','rifle','shotgun'],
  currentSkin: 'default',
  upgrades: { damage:0, reload:0, health:0 },
  achievements: {},
  records: {
    bestScore: 0,
    survivalBest: { easy:0, normal:0, hard:0, nightmare:0 },
    totalKills: 0,
    totalHeadshots: 0,
    totalDeaths: 0,
    gamesPlayed: 0
  }
};
let PROGRESS = loadProgress();
function loadProgress() {
  try {
    const s = localStorage.getItem('zombieshoot_progress_v15');
    if (s) {
      const loaded = JSON.parse(s);
      const merged = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
      Object.assign(merged, loaded);
      if (!merged.upgrades) merged.upgrades = { damage:0, reload:0, health:0 };
      if (!merged.ownedWeapons) merged.ownedWeapons = ['pistol','rifle','shotgun'];
      if (!merged.ownedSkins) merged.ownedSkins = ['default'];
      if (!merged.levels[0]) merged.levels[0] = {unlocked:true, completed:false, stars:0};
      if (!merged.achievements) merged.achievements = {};
      if (!merged.records) merged.records = JSON.parse(JSON.stringify(DEFAULT_PROGRESS.records));
      if (!merged.records.survivalBest) merged.records.survivalBest = {easy:0,normal:0,hard:0,nightmare:0};
      return merged;
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
function saveProgress(){ try{ localStorage.setItem('zombieshoot_progress_v15', JSON.stringify(PROGRESS)); }catch(e){} }
function resetProgress(){
  PROGRESS = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  saveProgress(); updateCoinsDisplay(); renderLevelGrid(); updateAchCount();
}

// ============ УРОВНИ ============
const LEVELS = {
  0:{name:'Тренировка',icon:'🎓',waves:1,boss:false,maxEnemies:3,enemySpeed:0.8,enemyHealth:50,enemyDamage:0,shooterChance:0,grenadierChance:0,theme:'grass',sky:0x87a5c4,fog:0x87a5c4,fogNear:50,fogFar:130,ambient:0.9,isTutorial:true,daylight:true},
  1:{name:'Лагерь',icon:'⛺',waves:1,boss:false,maxEnemies:5,enemySpeed:1.2,enemyHealth:30,enemyDamage:0.5,shooterChance:0.3,grenadierChance:0.05,theme:'grass',sky:0x0a0a1a,fog:0x050510,fogNear:8,fogFar:40,ambient:0.08},
  2:{name:'Лес',icon:'🌲',waves:2,boss:false,maxEnemies:7,enemySpeed:1.4,enemyHealth:45,enemyDamage:0.6,shooterChance:0.4,grenadierChance:0.10,theme:'forest',sky:0x050a05,fog:0x030803,fogNear:6,fogFar:35,ambient:0.06},
  3:{name:'Деревня',icon:'🏘️',waves:3,boss:false,maxEnemies:9,enemySpeed:1.6,enemyHealth:60,enemyDamage:0.7,shooterChance:0.5,grenadierChance:0.15,theme:'village',sky:0x1a0a05,fog:0x0a0503,fogNear:7,fogFar:38,ambient:0.07},
  4:{name:'Пустыня',icon:'🏜️',waves:4,boss:false,maxEnemies:11,enemySpeed:1.8,enemyHealth:75,enemyDamage:0.8,shooterChance:0.6,grenadierChance:0.20,theme:'desert',sky:0x2a1a05,fog:0x1a1005,fogNear:10,fogFar:50,ambient:0.15},
  5:{name:'Завод',icon:'🏭',waves:5,boss:false,maxEnemies:12,enemySpeed:1.9,enemyHealth:90,enemyDamage:0.9,shooterChance:0.6,grenadierChance:0.25,theme:'factory',sky:0x0a0a0a,fog:0x050505,fogNear:5,fogFar:30,ambient:0.05},
  6:{name:'Метро',icon:'🚇',waves:6,boss:false,maxEnemies:13,enemySpeed:2.0,enemyHealth:110,enemyDamage:1.0,shooterChance:0.65,grenadierChance:0.3,theme:'metro',sky:0x000000,fog:0x000000,fogNear:4,fogFar:22,ambient:0.03},
  7:{name:'Лаборатория',icon:'🧪',waves:7,boss:false,maxEnemies:14,enemySpeed:2.1,enemyHealth:130,enemyDamage:1.2,shooterChance:0.7,grenadierChance:0.35,theme:'lab',sky:0x001a10,fog:0x000a05,fogNear:5,fogFar:28,ambient:0.06},
  8:{name:'Логово Босса',icon:'💀',waves:8,boss:true,maxEnemies:15,enemySpeed:2.3,enemyHealth:150,enemyDamage:1.4,shooterChance:0.7,grenadierChance:0.4,theme:'lair',sky:0x1a0000,fog:0x0a0000,fogNear:4,fogFar:25,ambient:0.05}
};

const SURVIVAL_MODES = {
  easy:      {icon:'🟢',name:'Лёгкий',  desc:'Медленные зомби, слабые волны',multiplier:1.0,enemySpeed:1.0,enemyHealth:0.7,enemyDamage:0.6,shooterChance:0.3,grenadierChance:0.05,maxEnemies:8,spawnInterval:2500},
  normal:    {icon:'🔵',name:'Обычный', desc:'Стандартный баланс',multiplier:2.0,enemySpeed:1.3,enemyHealth:1.0,enemyDamage:1.0,shooterChance:0.5,grenadierChance:0.15,maxEnemies:12,spawnInterval:2000},
  hard:      {icon:'🟠',name:'Сложный', desc:'Быстрые зомби, много стрелков',multiplier:3.5,enemySpeed:1.7,enemyHealth:1.4,enemyDamage:1.4,shooterChance:0.7,grenadierChance:0.25,maxEnemies:16,spawnInterval:1500},
  nightmare: {icon:'🔴',name:'Кошмар',  desc:'Хаос. Только для опытных.',multiplier:5.0,enemySpeed:2.2,enemyHealth:2.0,enemyDamage:2.0,shooterChance:0.8,grenadierChance:0.4,maxEnemies:22,spawnInterval:1000}
};

const WEAPONS = {
  pistol:      {name:'Пистолет',      ammo:15, maxAmmo:15, damage:35, cooldown:280, spread:0.004, auto:false,reload:1100, icon:'pistol', cost:0},
  rifle:       {name:'Автомат',       ammo:30, maxAmmo:30, damage:22, cooldown:90,  spread:0.012, auto:true, reload:1800, icon:'rifle',  cost:0},
  shotgun:     {name:'Дробовик',      ammo:6,  maxAmmo:6,  damage:20, cooldown:750, spread:0.055, auto:false,reload:2000, icon:'shotgun',cost:0, pellets:10},
  sniper:      {name:'Снайперка',     ammo:5,  maxAmmo:5,  damage:200,cooldown:1600,spread:0.001, auto:false,reload:2600, icon:'sniper', cost:500},
  dualPistols: {name:'Два пистолета', ammo:30, maxAmmo:30, damage:25, cooldown:150, spread:0.022, auto:true, reload:1500, icon:'dual',   cost:300},
  flamethrower:{name:'Огнемёт',       ammo:100,maxAmmo:100,damage:6,  cooldown:50,  spread:0.14,  auto:true, reload:3000, icon:'flame',  cost:800}
};

const SKINS = {
  default:  {name:'Новобранец',body:0x3a4a2a,head:0x5a6a3a,cost:0},
  soldier:  {name:'Солдат',    body:0x2a3a2a,head:0x4a5a2a,cost:200},
  commando: {name:'Коммандос', body:0x1a1a1a,head:0x3a3a2a,cost:500},
  ghost:    {name:'Призрак',   body:0x666666,head:0x999999,cost:1000}
};

// ============ ДОСТИЖЕНИЯ ============
const ACHIEVEMENTS = {
  firstBlood:  {icon:'🩸', name:'Первая кровь',     desc:'Убей первого зомби'},
  shooter:     {icon:'🔫', name:'Стрелок',          desc:'Убей 10 зомби'},
  butcher:     {icon:'💀', name:'Мясник',           desc:'Убей 100 зомби'},
  genocide:    {icon:'☠️', name:'Геноцид',          desc:'Убей 500 зомби'},
  sniper10:    {icon:'🎯', name:'Снайпер',          desc:'10 хедшотов'},
  sniper100:   {icon:'🎯', name:'Снайпер-про',      desc:'100 хедшотов'},
  grenadier:   {icon:'💥', name:'Гранатомётчик',    desc:'Убей 5 зомби одной гранатой'},
  bossKill:    {icon:'👹', name:'Босс-слейер',      desc:'Убей первого босса'},
  bossAll:     {icon:'👑', name:'Покоритель',       desc:'Пройди 8 уровень'},
  trained:     {icon:'🎓', name:'Обучен',           desc:'Пройди тренировку'},
  threeStars:  {icon:'⭐', name:'Три звезды',       desc:'Получи 3 звезды на уровне'},
  perfection:  {icon:'🌟', name:'Перфекционист',    desc:'3 звезды на 5 уровнях'},
  legend:      {icon:'🏆', name:'Легенда',          desc:'3 звезды на всех уровнях'},
  healer:      {icon:'🩹', name:'Целитель',         desc:'Используй 10 аптечек'},
  invincible:  {icon:'🛡️', name:'Неуязвимый',      desc:'Пройди уровень без урона'},
  collector:   {icon:'🔫', name:'Коллекционер',     desc:'Купи всё оружие'},
  stylish:     {icon:'👤', name:'Стильный',         desc:'Купи все скины'},
  upgraded:    {icon:'⬆️', name:'Прокачан',         desc:'Прокачай все апгрейды'},
  rich:        {icon:'💰', name:'Богач',            desc:'Накопи 5000 монет'},
  wave10:      {icon:'🌊', name:'Волна 10',         desc:'Дойди до 10 волны'},
  wave20:      {icon:'🌊', name:'Волна 20',         desc:'Дойди до 20 волны'},
  wave30:      {icon:'🌊', name:'Волна 30',         desc:'Дойди до 30 волны'},
  firestarter: {icon:'🔥', name:'Огнемётчик',       desc:'Убей 20 огнемётом'},
  streak:      {icon:'⚡', name:'Серия хедшотов',   desc:'5 хедшотов подряд'},
  hardcore:    {icon:'💀', name:'Хардкор',          desc:'Пройди Кошмар'}
};

let sessionStats = {
  kills: 0, headshots: 0, headshotStreak: 0, maxStreak: 0,
  grenadeKills: 0, flameKills: 0, medkitsUsed: 0, damageTaken: 0
};

function hasAch(id){ return !!PROGRESS.achievements[id]; }
function unlockAch(id){
  if (hasAch(id)) return;
  if (!ACHIEVEMENTS[id]) return;
  PROGRESS.achievements[id] = Date.now();
  saveProgress();
  showAchToast(ACHIEVEMENTS[id]);
  updateAchCount();
}
function showAchToast(ach){
  let el = document.getElementById('achToast');
  if (!el){
    el = document.createElement('div');
    el.id = 'achToast';
    document.body.appendChild(el);
  }
  el.innerHTML = `
    <div class="toast-icon">${ach.icon}</div>
    <div class="toast-content">
      <div class="toast-label">🏆 ДОСТИЖЕНИЕ</div>
      <div class="toast-name">${ach.name}</div>
      <div class="toast-desc">${ach.desc}</div>
    </div>
  `;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 4000);
}
function updateAchCount(){
  const n = Object.keys(PROGRESS.achievements || {}).length;
  const total = Object.keys(ACHIEVEMENTS).length;
  const a = document.getElementById('achProgress');
  const b = document.getElementById('achCount');
  if (a) a.textContent = `${n}/${total}`;
  if (b) b.textContent = `${n}/${total}`;
}
function renderAchievements(){
  const grid = document.getElementById('achGrid');
  if (!grid) return;
  let html = '';
  for (const id in ACHIEVEMENTS){
    const a = ACHIEVEMENTS[id];
    const un = hasAch(id);
    html += `
      <div class="ach-card ${un ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${a.name}</div>
          <div class="ach-desc">${a.desc}</div>
        </div>
        ${!un ? '<div class="ach-lock">🔒</div>' : ''}
      </div>`;
  }
  grid.innerHTML = html;
  updateAchCount();
}
function checkAchConditions(){
  const r = PROGRESS.records;
  if (r.totalKills >= 1) unlockAch('firstBlood');
  if (r.totalKills >= 10) unlockAch('shooter');
  if (r.totalKills >= 100) unlockAch('butcher');
  if (r.totalKills >= 500) unlockAch('genocide');
  if (r.totalHeadshots >= 10) unlockAch('sniper10');
  if (r.totalHeadshots >= 100) unlockAch('sniper100');
  if (sessionStats.maxStreak >= 5) unlockAch('streak');
  if (sessionStats.flameKills >= 20) unlockAch('firestarter');
  if (PROGRESS.coins >= 5000) unlockAch('rich');
  if (PROGRESS.ownedWeapons.length >= Object.keys(WEAPONS).length) unlockAch('collector');
  if (PROGRESS.ownedSkins.length >= Object.keys(SKINS).length) unlockAch('stylish');
  if (Object.values(PROGRESS.upgrades).every(v => v >= 5)) unlockAch('upgraded');
  let threeStarCount = 0;
  for (let i = 0; i <= 8; i++){ if ((PROGRESS.levels[i]?.stars || 0) >= 3) threeStarCount++; }
  if (threeStarCount >= 1) unlockAch('threeStars');
  if (threeStarCount >= 5) unlockAch('perfection');
  if (threeStarCount >= 9) unlockAch('legend');
}

// ============ РЕКОРДЫ ============
function getPlayerName(){
  let n = localStorage.getItem('zombieshoot_name');
  if (!n){
    n = 'Игрок' + Math.floor(Math.random()*9000 + 1000);
    localStorage.setItem('zombieshoot_name', n);
  }
  return n;
}
function updateBestScore(newScore){
  if (newScore > (PROGRESS.records.bestScore || 0)){
    PROGRESS.records.bestScore = newScore;
    saveProgress();
  }
}
function updateSurvivalRecord(mode, wave){
  if (!PROGRESS.records.survivalBest[mode] || wave > PROGRESS.records.survivalBest[mode]){
    PROGRESS.records.survivalBest[mode] = wave;
    saveProgress();
  }
  const best = Math.max(...Object.values(PROGRESS.records.survivalBest), 0);
  const el = document.getElementById('survivalBest');
  if (el) el.textContent = best;
}
function submitToLeaderboard(){
  if (!window.firebaseDB) return;
  const name = getPlayerName();
  const ref = firebaseDB.ref('leaderboard/survival').push();
  ref.set({
    name,
    score: score,
    wave,
    mode: survivalMode ? survivalMode.name : 'Кампания',
    level: currentLevel,
    time: Date.now()
  }).catch(err => console.warn('LB submit failed:', err));
}
function fetchLeaderboard(callback){
  if (!window.firebaseDB){ callback([]); return; }
  firebaseDB.ref('leaderboard/survival').orderByChild('score').limitToLast(20).once('value')
    .then(snap => {
      const arr = [];
      snap.forEach(ch => { arr.push(ch.val()); });
      arr.reverse();
      callback(arr);
    })
    .catch(err => { console.warn('LB fetch failed:', err); callback([]); });
}
function renderRecords(tab = 'personal'){
  const body = document.getElementById('recordsBody');
  if (!body) return;
  if (tab === 'personal'){
    const r = PROGRESS.records;
    const name = getPlayerName();
    const rows = [
      {label:'Лучший счёт',       value: r.bestScore || 0,   extra:'очков'},
      {label:'Лёгкий',            value: r.survivalBest.easy      || 0, extra:'волн'},
      {label:'Обычный',           value: r.survivalBest.normal    || 0, extra:'волн'},
      {label:'Сложный',           value: r.survivalBest.hard      || 0, extra:'волн'},
      {label:'Кошмар',            value: r.survivalBest.nightmare || 0, extra:'волн'},
      {label:'Всего убийств',     value: r.totalKills || 0,   extra:'зомби'},
      {label:'Всего хедшотов',    value: r.totalHeadshots || 0, extra:'попаданий'},
      {label:'Игр сыграно',       value: r.gamesPlayed || 0,  extra:''}
    ];
    let html = `<div class="rec-head"><span>${name}</span><span>${new Date().toLocaleDateString('ru-RU')}</span></div>`;
    rows.forEach((row, i) => {
      html += `<div class="rec-row">
        <div class="rec-rank">${i+1}</div>
        <div class="rec-name">${row.label}</div>
        <div class="rec-value">${row.value}</div>
        <div class="rec-extra">${row.extra}</div>
      </div>`;
    });
    body.innerHTML = html;
  } else {
    body.innerHTML = '<div class="rec-empty">ЗАГРУЗКА...</div>';
    fetchLeaderboard(arr => {
      if (!arr.length){
        body.innerHTML = '<div class="rec-empty">Пока нет записей.<br>Сыграй в выживание, чтобы попасть в ТОП!</div>';
        return;
      }
      let html = '<div class="rec-head"><span>ТОП-20 ГЛОБАЛЬНО</span><span>SCORE</span></div>';
      arr.forEach((r, i) => {
        const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
        html += `<div class="rec-row ${cls}">
          <div class="rec-rank">#${i+1}</div>
          <div class="rec-name">${r.name}</div>
          <div class="rec-extra">Волна ${r.wave} · ${r.mode}</div>
          <div class="rec-value">${r.score}</div>
        </div>`;
      });
      body.innerHTML = html;
    });
  }
}

// ============ ТУТОРИАЛ ============
const TUTORIAL_STEPS = [
  {id:'move',   text:'Двигайся: W A S D (или джойстик)', done:false},
  {id:'look',   text:'Осмотрись: мышь (свайп справа)',   done:false},
  {id:'shoot',  text:'Стреляй по красным мишеням: ЛКМ',  done:false},
  {id:'reload', text:'Перезарядись: R',                   done:false},
  {id:'grenade',text:'Брось гранату: G (или ПКМ)',        done:false},
  {id:'pickup', text:'Подойди к ящику и нажми E',         done:false},
  {id:'kill',   text:'Уничтожь 3 мишени',                 done:false}
];
let tutorialState = null;
function initTutorial(){
  tutorialState = {
    steps: TUTORIAL_STEPS.map(s => ({...s})),
    moved: false, looked: false, shot: false, reloaded: false,
    grenade: false, picked: false, targetsKilled: 0, damageTaken: 0,
    startTime: performance.now()
  };
}
function tutStep(id){ return tutorialState?.steps.find(s => s.id === id); }
function markTutStep(id){
  const s = tutStep(id);
  if (s && !s.done){ s.done = true; updateTutorialHUD(); }
}
function updateTutorialHUD(){
  const el = document.getElementById('tutorialHUD');
  if (!el || !tutorialState) return;
  const list = tutorialState.steps.map(s => 
    `<div class="tut-step ${s.done ? 'done' : ''}">
      <span class="tut-check">${s.done ? '✅' : '⬜'}</span>
      <span class="tut-text">${s.text}</span>
    </div>`
  ).join('');
  el.innerHTML = `<div class="tut-title">🎓 ТРЕНИРОВКА</div>${list}`;
}

// ============ АПГРЕЙДЫ ============
const UPGRADES = {
  damage:{name:'Урон',icon:'💥',desc:'+10% урона за уровень',maxLevel:5,costs:[200,400,600,800,1000]},
  reload:{name:'Скорость перезарядки',icon:'⚡',desc:'−10% времени перезарядки',maxLevel:5,costs:[150,300,450,600,750]},
  health:{name:'Здоровье',icon:'❤️',desc:'+20 к максимальному HP',maxLevel:5,costs:[250,500,750,1000,1250]}
};
function getDamageMultiplier(){ return 1 + 0.1 * (PROGRESS.upgrades?.damage || 0); }
function getReloadMultiplier(){ return Math.max(0.5, 1 - 0.1 * (PROGRESS.upgrades?.reload || 0)); }
function getMaxHealth(){ return 100 + 20 * (PROGRESS.upgrades?.health || 0); }

// ============ СОСТОЯНИЕ ============
let scene, camera, renderer, composer;
let score = 0, health = 100, wave = 1, currentLevel = 1;
let hitsTaken = 0;
let isGameActive = false;
let enemies = [], obstacles = [], enemyBullets = [], grenades = [], lootCrates = [], corpses = [], bloodStains = [], particles = [];
let currentBoss = null, bossMaxHealth = 0, bossPhase = 1;
let playerGrenades = 3;
let clock = new THREE.Clock();
let yaw = 0, pitch = 0, recoilPitch = 0;
let verticalVelocity = 0, playerY = 1.7, isJumping = false;
let bobPhase = 0, breathPhase = 0, shakeAmount = 0;
const GRAVITY = 22, JUMP_POWER = 8;
let MOUSE_SENSITIVITY = 0.002, volume = 0.4, medkits = 2;
let horrorMode = true;
let survivalMode = null;
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1200);
let joystickActive = false, joystickTouchId = null;
let joystickStartX = 0, joystickStartY = 0, joystickDeltaX = 0, joystickDeltaY = 0;
let lookTouchId = null, lookLastX = 0, lookLastY = 0;
let currentWeapon = 'rifle';
let reloading = false, lastShotTime = 0, isMouseDown = false;
let weaponGroup = null, flashlight = null, audioCtx = null;
let nearLootCrate = null;
let filmPass = null, vignettePass = null;
const keys = { w:false, a:false, s:false, d:false };
let activeAmbientNodes = [];
let footstepTimer = 0, lastFootstepTime = 0;
let waveSpawnTimer = null;
let musicState = { calmGain:null, combatGain:null, calmOsc:null, combatOsc:null, bassGain:null, intensity:0, running:false };

// ============ ЗВУК ============
function playClickSound(freq, dur){
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(0.08 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
function playShootSoundEnhanced(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  const baseFreq = currentWeapon === 'sniper' ? 400 : (currentWeapon === 'shotgun' ? 150 : 200);
  o.frequency.setValueAtTime(baseFreq, now);
  o.frequency.exponentialRampToValueAtTime(40, now + 0.1);
  g.gain.setValueAtTime(0.2 * volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.13);
}
function playHitSoundEnhanced(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(600, now);
  o.frequency.exponentialRampToValueAtTime(200, now + 0.1);
  g.gain.setValueAtTime(0.12 * volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.16);
}
function playHeadshotSound(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [1200, 300].forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = i ? 'triangle' : 'square';
    o.frequency.setValueAtTime(f, now);
    o.frequency.exponentialRampToValueAtTime(f * 0.3, now + 0.1);
    g.gain.setValueAtTime(0.15 * volume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + 0.18);
  });
}
function playReloadSoundEnhanced(){
  if (!audioCtx) return;
  const w = WEAPONS[currentWeapon];
  setTimeout(() => playClickSound(150, 0.08), 0);
  setTimeout(() => playClickSound(120, 0.1), w.reload * getReloadMultiplier() * 0.5);
}
function playExplosionSound(pos){
  if (!audioCtx) return;
  const dist = pos ? pos.distanceTo(camera.position) : 0;
  const vol = Math.max(0.1, (1 - dist / 30)) * 0.5 * volume;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(80, now);
  o.frequency.exponentialRampToValueAtTime(20, now + 0.6);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.8);
}
function playHurtSoundEnhanced(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(250, now);
  o.frequency.exponentialRampToValueAtTime(80, now + 0.3);
  g.gain.setValueAtTime(0.15 * volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.36);
}
function playHealSoundEnhanced(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(400, now);
  o.frequency.exponentialRampToValueAtTime(1000, now + 0.4);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.1 * volume, now + 0.1);
  g.gain.linearRampToValueAtTime(0, now + 0.45);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.5);
}
function playPickupSound(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(600, now);
  o.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
  g.gain.setValueAtTime(0.1 * volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.22);
}
function playBuySound(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523,659,784,1047].forEach((freq,i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, now + i*0.06);
    g.gain.setValueAtTime(0, now + i*0.06);
    g.gain.linearRampToValueAtTime(0.12 * volume, now + i*0.06 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + i*0.06 + 0.15);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + i*0.06); o.stop(now + i*0.06 + 0.16);
  });
}
function playErrorSound(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(200, now);
  o.frequency.setValueAtTime(150, now + 0.08);
  g.gain.setValueAtTime(0.1 * volume, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.21);
}
function playZombieGroan(pos){
  if (!audioCtx) return;
  const dist = pos.distanceTo(camera.position);
  if (dist > 35) return;
  const vol = (1 - dist / 35) * 0.25 * volume;
  if (vol < 0.01) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.setValueAtTime(500, audioCtx.currentTime);
  o.type = 'sawtooth';
  const base = 70 + Math.random() * 40;
  o.frequency.setValueAtTime(base, audioCtx.currentTime);
  o.frequency.linearRampToValueAtTime(base * 0.6, audioCtx.currentTime + 0.7);
  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.15);
  g.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.75);
  o.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.85);
}
function playBossRoar(){
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain(), f = audioCtx.createBiquadFilter();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(60, now);
  o.frequency.linearRampToValueAtTime(120, now + 0.3);
  o.frequency.linearRampToValueAtTime(45, now + 1.2);
  f.type = 'lowpass'; f.frequency.setValueAtTime(800, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.4 * volume, now + 0.15);
  g.gain.linearRampToValueAtTime(0.001, now + 1.4);
  o.connect(f); f.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 1.5);
}
function playFootstepSound(){
  if (!audioCtx || !isGameActive) return;
  const now = performance.now();
  if (now - lastFootstepTime < 400) return;
  lastFootstepTime = now;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain(), filter = audioCtx.createBiquadFilter();
  o.type = 'triangle';
  const freq = 80 + Math.random() * 60;
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(freq * 0.5, audioCtx.currentTime + 0.08);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, audioCtx.currentTime);
  g.gain.setValueAtTime(0.04 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  o.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.12);
}
function startHorrorAmbient(){
  if (!audioCtx) return;
  stopHorrorAmbient();
  if (currentLevel === 0) return;
  const drone = audioCtx.createOscillator(), dg = audioCtx.createGain(), df = audioCtx.createBiquadFilter();
  drone.type = 'sine'; drone.frequency.setValueAtTime(45, audioCtx.currentTime);
  df.type = 'lowpass'; df.frequency.setValueAtTime(150, audioCtx.currentTime);
  dg.gain.setValueAtTime(0, audioCtx.currentTime);
  dg.gain.linearRampToValueAtTime(0.04 * volume, audioCtx.currentTime + 3);
  drone.connect(df); df.connect(dg); dg.connect(audioCtx.destination);
  drone.start();
  activeAmbientNodes.push({osc:drone, gain:dg});
}
function stopHorrorAmbient(){
  activeAmbientNodes.forEach(n => { try{ if(n.osc) n.osc.stop(); if(n.source) n.source.stop(); }catch(e){} });
  activeAmbientNodes = [];
}
function startDynamicMusic(){
  if (!audioCtx || musicState.running) return;
  musicState.running = true;
  const calmGain = audioCtx.createGain();
  calmGain.gain.setValueAtTime(0.06 * volume, audioCtx.currentTime);
  calmGain.connect(audioCtx.destination);
  const calmOsc = audioCtx.createOscillator();
  calmOsc.type = 'sine'; calmOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  const calmFilter = audioCtx.createBiquadFilter();
  calmFilter.type = 'lowpass'; calmFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
  calmOsc.connect(calmFilter); calmFilter.connect(calmGain);
  calmOsc.start();
  const combatGain = audioCtx.createGain();
  combatGain.gain.setValueAtTime(0, audioCtx.currentTime);
  combatGain.connect(audioCtx.destination);
  const combatOsc = audioCtx.createOscillator();
  combatOsc.type = 'sawtooth'; combatOsc.frequency.setValueAtTime(40, audioCtx.currentTime);
  const cf = audioCtx.createBiquadFilter();
  cf.type = 'lowpass'; cf.frequency.setValueAtTime(400, audioCtx.currentTime);
  const bassGain = audioCtx.createGain();
  bassGain.gain.setValueAtTime(0, audioCtx.currentTime);
  combatOsc.connect(cf); cf.connect(bassGain); bassGain.connect(combatGain);
  combatOsc.start();
  function beat(){
    if (!musicState.running) return;
    const t = audioCtx.currentTime;
    bassGain.gain.cancelScheduledValues(t);
    bassGain.gain.setValueAtTime(0.35, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    setTimeout(beat, 260);
  }
  beat();
  musicState.calmGain = calmGain;
  musicState.combatGain = combatGain;
  musicState.calmOsc = calmOsc;
  musicState.combatOsc = combatOsc;
  musicState.bassGain = bassGain;
}
function stopDynamicMusic(){
  musicState.running = false;
  try{ musicState.calmOsc?.stop(); }catch(e){}
  try{ musicState.combatOsc?.stop(); }catch(e){}
  try{
    if(musicState.calmGain) musicState.calmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    if(musicState.combatGain) musicState.combatGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
  }catch(e){}
  musicState = { calmGain:null, combatGain:null, calmOsc:null, combatOsc:null, bassGain:null, intensity:0, running:false };
}
function updateMusicIntensity(){
  if (!audioCtx || !musicState.running || !isGameActive) return;
  let maxThreat = 0;
  for (const e of enemies){
    if (e.userData.isTarget) continue;
    const d = e.position.distanceTo(camera.position);
    if (d < 30){
      const t = (1 - d/30) * (e.userData.isBoss ? 1.5 : 1);
      if (t > maxThreat) maxThreat = t;
    }
  }
  musicState.intensity += (Math.min(1, maxThreat) - musicState.intensity) * 0.05;
  const t = audioCtx.currentTime;
  try{
    musicState.calmGain.gain.linearRampToValueAtTime((1 - musicState.intensity) * 0.06 * volume, t + 0.3);
    musicState.combatGain.gain.linearRampToValueAtTime(musicState.intensity * 0.12 * volume, t + 0.3);
  }catch(e){}
}

// ============ ПРОЦЕДУРНЫЕ ТЕКСТУРЫ ============
const textureCache = {};
function getTex(key, gen){
  if (textureCache[key]) return textureCache[key];
  textureCache[key] = gen();
  return textureCache[key];
}
function createGroundTexture(theme){
  return getTex('ground_' + theme, () => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    const base = {
      grass:'#3a5a2a', forest:'#2a4a1a', village:'#5a4a2a',
      desert:'#b89858', factory:'#3a3a3a', metro:'#1a1a1a',
      lab:'#2a4a3a', lair:'#3a1a1a'
    }[theme] || '#3a5a2a';
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++){
      const x = Math.random() * 512, y = Math.random() * 512;
      const r = 3 + Math.random() * 28;
      const a = 0.04 + Math.random() * 0.14;
      const dark = Math.random() < 0.55;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, dark ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a*0.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    }
    if (theme === 'grass' || theme === 'forest'){
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 400; i++){
        const x = Math.random()*512, y = Math.random()*512;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random()-0.5)*4, y + 4 + Math.random()*6);
        ctx.stroke();
      }
    }
    if (theme === 'desert'){
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < 40; i++){
        ctx.beginPath();
        const y0 = Math.random()*512;
        ctx.moveTo(0, y0);
        for (let x = 0; x < 512; x += 20){
          ctx.lineTo(x, y0 + Math.sin(x*0.05)*6 + (Math.random()-0.5)*3);
        }
        ctx.stroke();
      }
    }
    if (theme === 'factory' || theme === 'metro'){
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      for (let i = 0; i < 20; i++){
        ctx.beginPath();
        let x = Math.random()*512, y = Math.random()*512;
        ctx.moveTo(x, y);
        for (let s = 0; s < 5; s++){
          x += (Math.random()-0.5)*60;
          y += (Math.random()-0.5)*60;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    const img = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < img.data.length; i += 4){
      const n = (Math.random()-0.5)*35;
      img.data[i]   = Math.max(0, Math.min(255, img.data[i]+n));
      img.data[i+1] = Math.max(0, Math.min(255, img.data[i+1]+n));
      img.data[i+2] = Math.max(0, Math.min(255, img.data[i+2]+n));
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    t.anisotropy = 4;
    return t;
  });
}
function createWallTexture(){
  return getTex('wall_brick', () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 512, 512);
    const bw = 64, bh = 32, gap = 4;
    for (let y = 0; y < 512; y += bh + gap){
      const off = ((y/(bh+gap)) % 2) * (bw+gap)/2;
      for (let x = -bw; x < 512; x += bw + gap){
        const shade = 50 + Math.random()*40;
        ctx.fillStyle = `rgb(${shade}, ${shade*0.75}, ${shade*0.55})`;
        ctx.fillRect(x + off, y, bw, bh);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeRect(x + off, y, bw, bh);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 2);
    t.anisotropy = 4;
    return t;
  });
}
function createMetalTexture(){
  return getTex('metal_panel', () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2a2a2e';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 128){
      for (let x = 0; x < 512; x += 128){
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x+2, y+2, 124, 124);
        ctx.fillStyle = `rgba(${60+Math.random()*20},${60+Math.random()*20},${65+Math.random()*20},1)`;
        ctx.fillRect(x+4, y+4, 120, 120);
      }
    }
    ctx.fillStyle = '#0a0a0a';
    for (let y = 20; y < 512; y += 128){
      for (let x = 20; x < 512; x += 128){
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+124, y, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y+124, 4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+124, y+124, 4, 0, Math.PI*2); ctx.fill();
      }
    }
    const img = ctx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < img.data.length; i += 4){
      const n = (Math.random()-0.5)*20;
      img.data[i]   = Math.max(0, Math.min(255, img.data[i]+n));
      img.data[i+1] = Math.max(0, Math.min(255, img.data[i+1]+n));
      img.data[i+2] = Math.max(0, Math.min(255, img.data[i+2]+n));
    }
    ctx.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(4, 1);
    return t;
  });
}
function createWoodTexture(){
  return getTex('wood', () => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5a3f22';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64){
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
      for (let i = 0; i < 30; i++){
        ctx.strokeStyle = `rgba(${40+Math.random()*30},${20+Math.random()*15},0,${0.3+Math.random()*0.3})`;
        ctx.beginPath();
        const yy = y + Math.random()*64;
        ctx.moveTo(0, yy);
        for (let x = 0; x < 512; x += 40) ctx.lineTo(x, yy + (Math.random()-0.5)*3);
        ctx.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return t;
  });
}

// ============ ЧАСТИЦЫ ============
function spawnParticle(pos, velocity, color, size, life, useGravity = true){
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(size, 4, 4),
    new THREE.MeshBasicMaterial({color, transparent:true, opacity:1})
  );
  m.position.copy(pos);
  m.userData = {velocity: velocity.clone(), life, maxLife: life, gravity: useGravity};
  scene.add(m);
  particles.push(m);
}
function createBloodBurst(pos, isHead){
  const count = isHead ? 22 : 12;
  const color = isHead ? 0xbb0000 : 0x880000;
  for (let i = 0; i < count; i++){
    const v = new THREE.Vector3((Math.random()-0.5)*6, Math.random()*4+1, (Math.random()-0.5)*6);
    spawnParticle(pos, v, color, 0.035 + Math.random()*0.055, 0.5 + Math.random()*0.6, true);
  }
  for (let i = 0; i < 5; i++){
    const v = new THREE.Vector3((Math.random()-0.5)*2, Math.random()*1.5+0.3, (Math.random()-0.5)*2);
    spawnParticle(pos, v, 0x550000, 0.14 + Math.random()*0.08, 1.0 + Math.random()*0.4, false);
  }
  if (isHead){
    const f = new THREE.PointLight(0xff2200, 2, 4);
    f.position.copy(pos); scene.add(f);
    setTimeout(() => scene.remove(f), 60);
  }
}
function createShellCasing(){
  if (!weaponGroup) return;
  const c = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.05, 6),
    new THREE.MeshStandardMaterial({color:0xc4a040, metalness:0.9, roughness:0.2})
  );
  const wp = new THREE.Vector3(); weaponGroup.getWorldPosition(wp);
  const right = new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  c.position.copy(wp).add(right.clone().multiplyScalar(0.15)).add(up.clone().multiplyScalar(0.05));
  const v = right.clone().multiplyScalar(1.8 + Math.random()*0.8);
  v.y += 1.5 + Math.random()*0.8;
  c.userData = {velocity:v, life:2.5, maxLife:2.5, gravity:true,
    spin: new THREE.Vector3(Math.random()*25-12, Math.random()*25-12, Math.random()*25-12)};
  scene.add(c); particles.push(c);
}
function createMuzzleSmoke(){
  if (!weaponGroup) return;
  const wp = new THREE.Vector3(); weaponGroup.getWorldPosition(wp);
  const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  const sp = wp.clone().add(fwd.clone().multiplyScalar(0.6));
  for (let i = 0; i < 4; i++){
    const v = new THREE.Vector3((Math.random()-0.5)*1.2, Math.random()*0.6+0.2, (Math.random()-0.5)*1.2);
    spawnParticle(sp, v, 0x999999, 0.06 + Math.random()*0.05, 0.7 + Math.random()*0.3, false);
  }
}
function updateParticles(delta){
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.userData.life -= delta;
    if (p.userData.life <= 0){ scene.remove(p); particles.splice(i,1); continue; }
    if (p.userData.gravity) p.userData.velocity.y -= GRAVITY * delta;
    p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
    if (p.userData.gravity && p.position.y < 0.03){
      p.position.y = 0.03;
      p.userData.velocity.y *= -0.3;
      p.userData.velocity.x *= 0.7;
      p.userData.velocity.z *= 0.7;
    }
    if (p.userData.spin){
      p.rotation.x += p.userData.spin.x * delta;
      p.rotation.y += p.userData.spin.y * delta;
      p.rotation.z += p.userData.spin.z * delta;
    }
    const a = p.userData.life / p.userData.maxLife;
    if (p.material){ p.material.opacity = Math.max(0, Math.min(1, a)); p.material.transparent = true; }
  }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.Fog(0x050510, 8, 40);
  const fov = isMobile ? 85 : 75;
  camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, playerY, 0);
  scene.add(camera);
  renderer = new THREE.WebGLRenderer({antialias: !isMobile, powerPreference:'high-performance'});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isMobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '20';
  document.body.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'none';
  try{
    const hm = localStorage.getItem('zombieshoot_horror');
    if (hm !== null) horrorMode = hm === 'true';
  }catch(e){}
  buildLevelEnvironment(1);
  try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  setupControls();
  initUI();
  initMobileControls();
  renderLevelGrid();
  updateCoinsDisplay();
  updateAchCount();
  const best = Math.max(...Object.values(PROGRESS.records.survivalBest || {easy:0,normal:0,hard:0,nightmare:0}), 0);
  const el = document.getElementById('survivalBest');
  if (el) el.textContent = best;
  animate();
}

// ============ ОКРУЖЕНИЕ ============
function clearLevelEnvironment(){
  for (let i = scene.children.length - 1; i >= 0; i--){
    const c = scene.children[i];
    if (c === camera) continue;
    if (c.isLight) continue;
    scene.remove(c);
  }
  obstacles = [];
}
function buildLevelEnvironment(levelNum){
  clearLevelEnvironment();
  const lvl = LEVELS[levelNum] || LEVELS[1];
  const isTutorial = !!lvl.isTutorial;
  let skyColor, fogColor, fogNear, fogFar, ambientLevel;
  if (isTutorial){
    skyColor = 0x8ec8e8; fogColor = 0x9ed4e8;
    fogNear = 60; fogFar = 160; ambientLevel = 1.0;
  } else if (horrorMode){
    skyColor = lvl.sky; fogColor = lvl.fog;
    fogNear = lvl.fogNear; fogFar = lvl.fogFar;
    ambientLevel = lvl.ambient || 0.08;
  } else {
    const light = {grass:0x87a5c4,forest:0x6a8a6a,village:0xa89a7a,desert:0xe8d0a0,factory:0x8a8a9a,metro:0x5a5a6a,lab:0x6aaa8a,lair:0x8a4a4a};
    skyColor = light[lvl.theme] || 0x87a5c4;
    fogColor = skyColor; fogNear = 50; fogFar = 130; ambientLevel = 0.7;
  }
  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(150, 32, 16),
    new THREE.MeshBasicMaterial({color: skyColor, side: THREE.BackSide, fog:false})
  ));
  if (isTutorial){
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sun = new THREE.DirectionalLight(0xfff4d0, 1.2);
    sun.position.set(30, 60, 20);
    sun.castShadow = !isMobile;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x8ec8e8, 0x6a8a5a, 0.6));
  } else {
    scene.add(new THREE.AmbientLight(0xffffff, ambientLevel));
    if (horrorMode){
      const moon = new THREE.DirectionalLight(0x8899cc, 0.3);
      moon.position.set(-30, 40, -20);
      moon.castShadow = !isMobile;
      scene.add(moon);
    } else {
      const sun = new THREE.DirectionalLight(0xfff0d0, 0.9);
      sun.position.set(40, 60, 20);
      sun.castShadow = !isMobile;
      scene.add(sun);
    }
  }
  const groundTex = createGroundTexture(lvl.theme);
  const gcTint = horrorMode ? 0x808080 : 0xffffff;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100, 20, 20),
    new THREE.MeshStandardMaterial({map: groundTex, color: gcTint, roughness: 1, metalness: 0.02})
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);
  const wallTex = createWallTexture();
  const wallMat = new THREE.MeshStandardMaterial({map: wallTex, color: horrorMode ? 0x666666 : 0xaaaaaa, roughness: 0.95});
  [
    {pos:[0,5,-48],size:[96,10,1]}, {pos:[0,5,48],size:[96,10,1]},
    {pos:[-48,5,0],size:[1,10,96]}, {pos:[48,5,0],size:[1,10,96]}
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos);
    wall.castShadow = true; wall.receiveShadow = true;
    wall.userData.size = {x:w.size[0], y:w.size[1], z:w.size[2]};
    scene.add(wall); obstacles.push(wall);
  });
  const metalTex = createMetalTexture();
  const obsMat = new THREE.MeshStandardMaterial({map: metalTex, color: horrorMode ? 0x666666 : 0x999999, roughness: 0.7, metalness: 0.4});
  [[12,1,8,3,2,3],[-12,1,8,3,2,3],[12,1,-8,3,2,3],[-12,1,-8,3,2,3]].forEach(([x,y,z,sx,sy,sz]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), obsMat);
    c.position.set(x, y, z);
    c.castShadow = true; c.receiveShadow = true;
    c.userData.size = {x:sx, y:sy, z:sz};
    scene.add(c); obstacles.push(c);
  });
  const woodTex = createWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({map: woodTex, color: 0xdddddd, roughness: 0.9});
  [[-20,0.5,-20],[20,0.5,-20],[-20,0.5,20],[20,0.5,20]].forEach(([x,y,z]) => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), woodMat);
    box.position.set(x, y, z);
    box.rotation.y = Math.random() * Math.PI;
    box.castShadow = true; box.receiveShadow = true;
    box.userData.size = {x:1, y:1, z:1};
    scene.add(box); obstacles.push(box);
  });
  if (isTutorial){
    for (let i = 0; i < 3; i++){
      const dummy = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({color:0xcc4444, roughness:0.5});
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.35), bodyMat);
      body.position.y = 0.7; body.castShadow = true; dummy.add(body);
      const headMat = new THREE.MeshStandardMaterial({color:0xff6666, roughness:0.4});
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), headMat);
      head.position.y = 1.65; head.castShadow = true;
      head.userData.isHead = true; dummy.add(head);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 0.15, 8),
        new THREE.MeshStandardMaterial({color:0x444444, metalness:0.7, roughness:0.4})
      );
      base.position.y = 0.07; dummy.add(base);
      dummy.position.set(-4 + i * 4, 0, -8);
      dummy.userData = {isTarget:true, health:80, maxHealth:80, type:'target', isBoss:false};
      scene.add(dummy); enemies.push(dummy);
    }
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({map: metalTex, color:0x3a6aaa, metalness:0.6, roughness:0.3})
    );
    crate.position.set(0, 0.3, 4);
    crate.userData = {weapon:'rifle', isTutorialCrate: true};
    scene.add(crate);
    lootCrates.push(crate);
  }
  if (horrorMode && !isTutorial){
    flashlight = new THREE.SpotLight(0xfff2d0, 1.5, 25, Math.PI/7, 0.4, 1.5);
    flashlight.position.set(0,0,0);
    flashlight.target.position.set(0,0,-1);
    camera.add(flashlight);
    camera.add(flashlight.target);
  } else flashlight = null;
}

// ============ ОРУЖИЕ ============
function createWeapon(type){
  if (weaponGroup) camera.remove(weaponGroup);
  weaponGroup = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({color:0x0a0a0a, metalness:0.6, roughness:0.6});
  const metal = new THREE.MeshStandardMaterial({color:0x1a1a1a, metalness:0.95, roughness:0.25});
  const metalLight = new THREE.MeshStandardMaterial({color:0x333333, metalness:0.9, roughness:0.3});
  const grip = new THREE.MeshStandardMaterial({color:0x0f0f0f, metalness:0.2, roughness:0.8});
  const wood = new THREE.MeshStandardMaterial({color:0x4a2a15, metalness:0.1, roughness:0.75});
  const rail = new THREE.MeshStandardMaterial({color:0x111111, metalness:0.9, roughness:0.2});
  const glass = new THREE.MeshStandardMaterial({color:0x0a1a3a, metalness:0.5, roughness:0.05, transparent:true, opacity:0.85});

  function addRail(obj, x, y, z, len){
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.008, len), rail);
    r.position.set(x, y, z); obj.add(r);
    for (let i = 0; i < len * 40; i++){
      const slot = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.006, 0.004), black);
      slot.position.set(x, y + 0.002, z - len/2 + i * 0.025 + 0.01);
      obj.add(slot);
    }
  }

  if (type === 'pistol'){
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 0.22), metal);
    frame.position.set(0, 0, -0.05); weaponGroup.add(frame);
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.035, 0.24), metal);
    slide.position.set(0, 0.04, -0.05); weaponGroup.add(slide);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 10), metal);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.04, -0.19); weaponGroup.add(barrel);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.13, 0.05), metal);
    mag.position.set(0, -0.09, 0.01); weaponGroup.add(mag);
    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.06), grip);
    gripMesh.position.set(0, -0.13, 0.07); gripMesh.rotation.x = 0.22; weaponGroup.add(gripMesh);
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.015, 0.008), black);
    front.position.set(0, 0.065, -0.16); weaponGroup.add(front);
    const rear = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.008), black);
    rear.position.set(0, 0.062, 0.05); weaponGroup.add(rear);
    weaponGroup.position.set(0.22, -0.22, -0.4);
    weaponGroup.rotation.z = 0.02;
  }
  else if (type === 'rifle'){
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.5), metal);
    body.position.set(0, 0, -0.2); weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 12), metal);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.005, -0.55); weaponGroup.add(barrel);
    const gas = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 8), metalLight);
    gas.rotation.x = Math.PI/2; gas.position.set(0, 0.035, -0.5); weaponGroup.add(gas);
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.22), black);
    handguard.position.set(0, 0, -0.4); weaponGroup.add(handguard);
    addRail(weaponGroup, 0, 0.055, -0.4, 0.2);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.05), metal);
    mag.position.set(0, -0.11, 0.02); mag.rotation.x = -0.15; weaponGroup.add(mag);
    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.055), grip);
    gripMesh.position.set(0, -0.1, 0.12); gripMesh.rotation.x = 0.28; weaponGroup.add(gripMesh);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.18), black);
    stock.position.set(0, 0.005, 0.24); weaponGroup.add(stock);
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.12, 0.03), grip);
    stockPad.position.set(0, 0, 0.33); weaponGroup.add(stockPad);
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.03, 0.006), black);
    front.position.set(0, 0.07, -0.62); weaponGroup.add(front);
    weaponGroup.position.set(0.28, -0.26, -0.5);
    weaponGroup.rotation.z = 0.01;
  }
  else if (type === 'shotgun'){
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.085, 0.45), metal);
    body.position.set(0, 0, -0.15); weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.4, 12), metal);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.01, -0.5); weaponGroup.add(barrel);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.32, 10), metalLight);
    tube.rotation.x = Math.PI/2; tube.position.set(0, -0.035, -0.42); weaponGroup.add(tube);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.14), wood);
    pump.position.set(0, -0.045, -0.36); weaponGroup.add(pump);
    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.15, 0.06), wood);
    gripMesh.position.set(0, -0.11, 0.13); gripMesh.rotation.x = 0.25; weaponGroup.add(gripMesh);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.1, 0.2), wood);
    stock.position.set(0, 0, 0.26); weaponGroup.add(stock);
    weaponGroup.position.set(0.3, -0.28, -0.5);
  }
  else if (type === 'sniper'){
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.075, 0.6), metal);
    body.position.set(0, 0, -0.25); weaponGroup.add(body);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.5, 12), metal);
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.005, -0.8); weaponGroup.add(barrel);
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.06, 10), metalLight);
    muzzle.rotation.x = Math.PI/2; muzzle.position.set(0, 0.005, -1.06); weaponGroup.add(muzzle);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.055), metal);
    mag.position.set(0, -0.1, -0.1); weaponGroup.add(mag);
    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), grip);
    gripMesh.position.set(0, -0.1, 0.05); gripMesh.rotation.x = 0.28; weaponGroup.add(gripMesh);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.22), black);
    stock.position.set(0, 0.01, 0.2); weaponGroup.add(stock);
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.14), grip);
    cheek.position.set(0, 0.08, 0.22); weaponGroup.add(cheek);
    const scopeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.28, 14), rail);
    scopeBody.rotation.x = Math.PI/2; scopeBody.position.set(0, 0.075, -0.2); weaponGroup.add(scopeBody);
    const lensF = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), glass);
    lensF.position.set(0, 0.075, -0.342); weaponGroup.add(lensF);
    const lensR = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), glass);
    lensR.position.set(0, 0.075, -0.058); lensR.rotation.y = Math.PI; weaponGroup.add(lensR);
    [0.09, -0.09].forEach(dz => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.006, 8, 12), black);
      ring.rotation.y = Math.PI/2;
      ring.position.set(0, 0.045, -0.2 + dz); weaponGroup.add(ring);
    });
    [-0.05, 0.05].forEach(dx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 6), metal);
      leg.position.set(dx, -0.06, -0.55);
      leg.rotation.z = dx > 0 ? -0.4 : 0.4; weaponGroup.add(leg);
    });
    weaponGroup.position.set(0.3, -0.26, -0.55);
  }
  else if (type === 'dualPistols'){
    [-0.16, 0.16].forEach((dx) => {
      const g = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.2), metal);
      frame.position.set(0, 0, -0.05); g.add(frame);
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.032, 0.22), metal);
      slide.position.set(0, 0.038, -0.05); g.add(slide);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.09, 8), metal);
      barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.038, -0.18); g.add(barrel);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.12, 0.045), metal);
      mag.position.set(0, -0.08, 0); g.add(mag);
      const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.15, 0.055), grip);
      gripMesh.position.set(0, -0.12, 0.07); gripMesh.rotation.x = 0.22; g.add(gripMesh);
      g.position.set(dx, 0, 0); weaponGroup.add(g);
    });
    weaponGroup.position.set(0, -0.25, -0.5);
  }
  else if (type === 'flamethrower'){
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.4), metal);
    body.position.set(0, 0, -0.15); weaponGroup.add(body);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 14), new THREE.MeshStandardMaterial({color:0xcc2200, metalness:0.85, roughness:0.35}));
    tank.position.set(-0.09, -0.05, -0.1); tank.rotation.z = Math.PI/2; weaponGroup.add(tank);
    const tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 14), new THREE.MeshStandardMaterial({color:0x228800, metalness:0.85, roughness:0.35}));
    tank2.position.set(-0.09, -0.05, 0.28); tank2.rotation.z = Math.PI/2; weaponGroup.add(tank2);
    const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.25, 8), new THREE.MeshStandardMaterial({color:0x1a1a1a, roughness:0.8}));
    hose.rotation.z = Math.PI/2; hose.position.set(-0.05, -0.09, 0.14); weaponGroup.add(hose);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.28, 10), metal);
    nozzle.rotation.x = Math.PI/2; nozzle.position.set(0, 0.01, -0.44); weaponGroup.add(nozzle);
    const pilot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({color:0xff6600}));
    pilot.position.set(0, 0.03, -0.6); weaponGroup.add(pilot);
    const pilotLight = new THREE.PointLight(0xff6600, 0.5, 2);
    pilotLight.position.copy(pilot.position); weaponGroup.add(pilotLight);
    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.06), grip);
    gripMesh.position.set(0, -0.1, 0.1); gripMesh.rotation.x = 0.25; weaponGroup.add(gripMesh);
    weaponGroup.position.set(0.28, -0.28, -0.5);
  }
  const flash = new THREE.PointLight(0xffaa00, 0, 8);
  flash.position.set(0, 0.03, -1.0);
  weaponGroup.add(flash);
  weaponGroup.userData.flash = flash;
  camera.add(weaponGroup);
}

// ============ ЗОМБИ ============
function createZombie(isBoss, type = 'melee'){
  const g = new THREE.Group();
  const sk = SKINS[PROGRESS.currentSkin] || SKINS.default;
  const size = isBoss ? 1.8 : 1;
  let bodyColor, headColor, eyeColor;
  if (isBoss){ bodyColor = 0x4a1a1a; headColor = 0x6a2a2a; eyeColor = 0xff6600; }
  else if (type === 'shooter'){ bodyColor = 0x2a2a3a; headColor = 0x5a5a3a; eyeColor = 0xffcc00; }
  else if (type === 'grenadier'){ bodyColor = 0x2a4a2a; headColor = 0x3a5a3a; eyeColor = 0x00ff66; }
  else { bodyColor = sk.body; headColor = 0x5a6a3a; eyeColor = 0xaa0000; }
  const skinMat = new THREE.MeshStandardMaterial({color: headColor, roughness:0.8});
  const uniform = new THREE.MeshStandardMaterial({color: bodyColor, roughness:0.75});
  const dark = new THREE.MeshStandardMaterial({color: 0x1a1a1a, roughness:0.9});
  const glow = new THREE.MeshBasicMaterial({color: eyeColor});
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35*size, 0.32*size, 1.0*size, 8), uniform);
  torso.position.y = 0.5*size; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28*size, 12, 10), skinMat);
  head.position.y = 1.45*size; head.castShadow = true; g.add(head);
  head.userData.isHead = true;
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.055*size, 6, 6), glow);
  eL.position.set(-0.11*size, 1.48*size, -0.24*size); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.055*size, 6, 6), glow);
  eR.position.set(0.11*size, 1.48*size, -0.24*size); g.add(eR);
  const legGeo = new THREE.CylinderGeometry(0.13*size, 0.11*size, 0.75*size, 6);
  const lL = new THREE.Mesh(legGeo, dark);
  lL.position.set(-0.18*size, -0.4*size, 0); g.add(lL);
  const lR = new THREE.Mesh(legGeo, dark);
  lR.position.set(0.18*size, -0.4*size, 0); g.add(lR);
  if (!isBoss){
    if (type === 'shooter'){
      const gunMat = new THREE.MeshStandardMaterial({color:0x111111, metalness:0.9, roughness:0.3});
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.7), gunMat);
      rifle.position.set(0.35*size, 0.9*size, -0.35*size);
      rifle.rotation.z = -0.15; g.add(rifle);
    } else if (type === 'grenadier'){
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), new THREE.MeshStandardMaterial({color:0x4a6a3a, roughness:0.9}));
      bag.position.set(0, 0.5*size, 0.35*size); g.add(bag);
    }
  } else {
    const hornMat = new THREE.MeshStandardMaterial({color:0xaa8866, roughness:0.7});
    const hl = new THREE.Mesh(new THREE.ConeGeometry(0.1*size, 0.5*size, 6), hornMat);
    hl.position.set(-0.2*size, 1.75*size, 0); hl.rotation.z = 0.5; g.add(hl);
    const hr = new THREE.Mesh(new THREE.ConeGeometry(0.1*size, 0.5*size, 6), hornMat);
    hr.position.set(0.2*size, 1.75*size, 0); hr.rotation.z = -0.5; g.add(hr);
    const aura = new THREE.PointLight(0xff3300, 1.5, 8);
    aura.position.y = 1.2*size;
    aura.userData.isBossAura = true; g.add(aura);
  }
  g.position.y = 0.9*size;
  return g;
}
function spawnEnemy(isBoss = false, forcedType = null){
  if (!isGameActive) return;
  const lvl = LEVELS[currentLevel] || LEVELS[1];
  if (lvl.isTutorial) return;
  if (!isBoss && enemies.length >= lvl.maxEnemies) return;
  let type = 'melee';
  if (!isBoss){
    if (forcedType) type = forcedType;
    else {
      const r = Math.random();
      if (r < lvl.shooterChance) type = 'shooter';
      else if (r < lvl.shooterChance + lvl.grenadierChance) type = 'grenadier';
    }
  }
  const e = createZombie(isBoss, type);
  const range = isBoss ? 20 : 45;
  const sides = [[-range,0],[range,0],[0,-range],[0,range],[-range,-range],[-range,range],[range,-range],[range,range]];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random()-0.5)*3, 0.9*(isBoss?1.8:1), s[1] + (Math.random()-0.5)*3);
  const baseHealth = isBoss ? 2000 : lvl.enemyHealth;
  e.userData = {
    type, isBoss: !!isBoss,
    health: baseHealth, maxHealth: baseHealth,
    speed: isBoss ? 1.5 : lvl.enemySpeed + Math.random()*0.3,
    radius: isBoss ? 1.2 : 0.5,
    walkPhase: Math.random()*Math.PI*2,
    nextShotTime: performance.now() + 2000 + Math.random()*3000,
    weaponDrop: type === 'shooter' ? 'rifle' : (type === 'grenadier' ? 'shotgun' : 'pistol'),
    phase: 1, nextSummonTime: performance.now() + 8000,
    lastShot: 0, nextGroan: performance.now() + Math.random()*5000
  };
  scene.add(e);
  enemies.push(e);
  if (isBoss){
    currentBoss = e;
    bossMaxHealth = e.userData.maxHealth;
    bossPhase = 1;
    playBossRoar();
    showToast('👹 БОСС ПРОБУДИЛСЯ!', 2500);
    shakeAmount = 1;
  }
}
function checkBossPhase(){
  if (!currentBoss || !currentBoss.userData) return;
  const ratio = currentBoss.userData.health / currentBoss.userData.maxHealth;
  const ud = currentBoss.userData;
  let newPhase = 1;
  if (ratio <= 0.33) newPhase = 3;
  else if (ratio <= 0.66) newPhase = 2;
  if (newPhase !== ud.phase){
    ud.phase = newPhase;
    bossPhase = newPhase;
    playBossRoar();
    shakeAmount = 1;
    currentBoss.traverse(ch => {
      if (ch.isMesh && ch.material && ch.material.color){
        ch.material = ch.material.clone();
        if (newPhase === 2) ch.material.color.setHex(0x8a3a1a);
        else if (newPhase === 3) ch.material.color.setHex(0xaa0000);
      }
      if (ch.userData.isBossAura){
        ch.intensity = 1.5 + newPhase * 1.5;
        ch.distance = 8 + newPhase * 4;
        ch.color.setHex(newPhase === 3 ? 0xff0000 : 0xff6600);
      }
    });
    showToast(newPhase === 2 ? '⚡ ФАЗА 2: Ярость!' : '💀 ФАЗА 3: БЕЗУМИЕ!', 2500);
  }
}

// ============ ИГРОВОЙ ФЛОУ ============
function startGame(level = 1, survival = null){
  currentLevel = level;
  survivalMode = survival;
  score = 0; health = getMaxHealth(); wave = 1;
  hitsTaken = 0; medkits = 2; playerGrenades = 3; bossPhase = 1;
  enemies.forEach(e => scene.remove(e)); enemies = [];
  enemyBullets.forEach(b => scene.remove(b)); enemyBullets = [];
  grenades.forEach(g => scene.remove(g)); grenades = [];
  lootCrates.forEach(l => scene.remove(l)); lootCrates = [];
  corpses.forEach(c => scene.remove(c)); corpses = [];
  bloodStains.forEach(b => scene.remove(b)); bloodStains = [];
  particles.forEach(p => scene.remove(p)); particles = [];
  currentBoss = null; bossMaxHealth = 0;
  isGameActive = true;
  reloading = false; lastShotTime = 0; isMouseDown = false;
  yaw = 0; pitch = 0; recoilPitch = 0;
  verticalVelocity = 0; playerY = 1.7; isJumping = false;
  bobPhase = 0; breathPhase = 0; shakeAmount = 0;
  keys.w = keys.a = keys.s = keys.d = false;
  sessionStats = {
    kills: 0, headshots: 0, headshotStreak: 0, maxStreak: 0,
    grenadeKills: 0, flameKills: 0, medkitsUsed: 0, damageTaken: 0
  };
  PROGRESS.records.gamesPlayed = (PROGRESS.records.gamesPlayed || 0) + 1;
  saveProgress();

  buildLevelEnvironment(level);
  createWeapon(currentWeapon);
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById('hud').style.display = 'block';
  renderer.domElement.style.display = 'block';
  if (LEVELS[level]?.isTutorial){
    initTutorial();
    document.getElementById('tutorialHUD').style.display = 'block';
    updateTutorialHUD();
    showToast('🎓 Добро пожаловать в тренировку!', 3000);
  } else {
    tutorialState = null;
    document.getElementById('tutorialHUD').style.display = 'none';
    startWave();
  }
  updateHUD();
  startHorrorAmbient();
  startDynamicMusic();
  checkAchConditions();
  if (!isMobile){
    setTimeout(() => { if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock(); }, 100);
  }
}
function startWave(){
  const lvl = LEVELS[currentLevel] || LEVELS[1];
  if (lvl.isTutorial) return;
  const mode = survivalMode;
  const maxEnemies = mode ? mode.maxEnemies : lvl.maxEnemies;
  const spawnInterval = mode ? mode.spawnInterval : 3000;
  let waveEnemiesRemaining = mode ? 10 + wave * 3 : 5 + wave * 2;
  showToast(`Волна ${wave}`, 1500);
  updateHUD();
  if (survivalMode){
    const key = survivalMode.name === 'Лёгкий' ? 'easy' : survivalMode.name === 'Обычный' ? 'normal' : survivalMode.name === 'Сложный' ? 'hard' : 'nightmare';
    updateSurvivalRecord(key, wave);
    if (wave >= 10) unlockAch('wave10');
    if (wave >= 20) unlockAch('wave20');
    if (wave >= 30) unlockAch('wave30');
    if (key === 'nightmare' && wave >= 10) unlockAch('hardcore');
  }
  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  waveSpawnTimer = setInterval(() => {
    if (!isGameActive) return;
    if (enemies.length >= maxEnemies) return;
    if (waveEnemiesRemaining <= 0){
      clearInterval(waveSpawnTimer);
      waveSpawnTimer = null;
      checkWaveComplete();
      return;
    }
    spawnEnemy(false);
    waveEnemiesRemaining--;
  }, spawnInterval);
  if (lvl.boss && wave === lvl.waves && !currentBoss){
    setTimeout(() => { if (isGameActive && !currentBoss) spawnEnemy(true); }, 3000);
  }
}
function checkWaveComplete(){
  if (LEVELS[currentLevel]?.isTutorial) return;
  const alive = enemies.filter(e => e.userData.health > 0).length;
  if (alive === 0){
    const lvl = LEVELS[currentLevel] || LEVELS[1];
    if (lvl.boss && wave >= lvl.waves && currentBoss) return;
    if (wave >= lvl.waves) completeLevel();
    else { wave++; startWave(); }
  }
}
function completeTutorial(){
  if (!tutorialState) return;
  isGameActive = false;
  stopHorrorAmbient();
  stopDynamicMusic();
  if (document.pointerLockElement) document.exitPointerLock();
  const doneSteps = tutorialState.steps.filter(s => s.done).length;
  let stars = 0;
  if (doneSteps >= 7 && tutorialState.damageTaken === 0) stars = 3;
  else if (doneSteps >= 7) stars = 2;
  else if (doneSteps >= 5) stars = 1;
  const coinsEarned = [50, 100, 200, 300][stars];
  PROGRESS.coins += coinsEarned;
  PROGRESS.levels[0].completed = true;
  PROGRESS.levels[0].stars = Math.max(PROGRESS.levels[0].stars, stars);
  if (stars >= 2 && PROGRESS.levels[2]) PROGRESS.levels[2].unlocked = true;
  if (stars >= 3 && PROGRESS.levels[3]) PROGRESS.levels[3].unlocked = true;
  saveProgress();
  updateCoinsDisplay();
  renderLevelGrid();
  unlockAch('trained');
  if (stars >= 3) unlockAch('threeStars');
  if (tutorialState.damageTaken === 0) unlockAch('invincible');
  updateBestScore(score);
  checkAchConditions();
  document.getElementById('hud').style.display = 'none';
  document.getElementById('tutorialHUD').style.display = 'none';
  renderer.domElement.style.display = 'none';
  for (let i = 1; i <= 3; i++){
    const s = document.getElementById('star' + i);
    if (s) s.classList.toggle('active', i <= stars);
  }
  const c = document.getElementById('coinsEarned');
  if (c) c.textContent = coinsEarned;
  const h1 = document.querySelector('#levelComplete h1');
  if (h1) h1.textContent = stars >= 3 ? '🎓 ОТЛИЧНО!' : stars >= 2 ? '🎓 ХОРОШО!' : '🎓 ТРЕНИРОВКА ПРОЙДЕНА';
  document.getElementById('levelComplete').style.display = 'flex';
}
function completeLevel(){
  isGameActive = false;
  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  stopHorrorAmbient();
  stopDynamicMusic();
  const stars = health > getMaxHealth()*0.75 ? 3 : health > getMaxHealth()*0.4 ? 2 : 1;
  const coinsEarned = Math.floor(score/10) + stars * 50;
  PROGRESS.coins += coinsEarned;
  PROGRESS.levels[currentLevel].completed = true;
  PROGRESS.levels[currentLevel].stars = Math.max(PROGRESS.levels[currentLevel].stars, stars);
  if (PROGRESS.levels[currentLevel + 1]) PROGRESS.levels[currentLevel + 1].unlocked = true;
  saveProgress();
  updateCoinsDisplay();
  updateBestScore(score);
  if (survivalMode) submitToLeaderboard();
  if (sessionStats.damageTaken === 0) unlockAch('invincible');
  if (currentLevel === 8) unlockAch('bossAll');
  checkAchConditions();
  if (document.pointerLockElement) document.exitPointerLock();
  setTimeout(() => {
    document.getElementById('hud').style.display = 'none';
    renderer.domElement.style.display = 'none';
    for (let i = 1; i <= 3; i++){
      const s = document.getElementById('star' + i);
      if (s) s.classList.toggle('active', i <= stars);
    }
    const c = document.getElementById('coinsEarned');
    if (c) c.textContent = coinsEarned;
    const h1 = document.querySelector('#levelComplete h1');
    if (h1) h1.textContent = 'УРОВЕНЬ ПРОЙДЕН!';
    document.getElementById('levelComplete').style.display = 'flex';
  }, 1500);
}
function gameOver(){
  isGameActive = false;
  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  stopHorrorAmbient();
  stopDynamicMusic();
  PROGRESS.records.totalDeaths = (PROGRESS.records.totalDeaths || 0) + 1;
  updateBestScore(score);
  if (survivalMode) submitToLeaderboard();
  saveProgress();
  checkAchConditions();
  showToast('Вы погибли...', 2000);
  if (document.pointerLockElement) document.exitPointerLock();
  setTimeout(() => {
    document.getElementById('hud').style.display = 'none';
    document.getElementById('tutorialHUD').style.display = 'none';
    renderer.domElement.style.display = 'none';
    const dl = document.getElementById('deadLevel');
    if (dl) dl.textContent = currentLevel;
    document.getElementById('gameover').style.display = 'flex';
  }, 1800);
}

function updateEnemies(delta){
  if (!isGameActive) return;
  const now = performance.now();
  const playerPos = camera.position;
  if (currentBoss) checkBossPhase();
  for (let i = enemies.length - 1; i >= 0; i--){
    const e = enemies[i];
    const ud = e.userData;
    if (ud.health <= 0){
      if (ud.isTarget){
        scene.remove(e);
        enemies.splice(i, 1);
        if (tutorialState){
          tutorialState.targetsKilled++;
          if (tutorialState.targetsKilled >= 3) markTutStep('kill');
          setTimeout(() => {
            if (!isGameActive || currentLevel !== 0) return;
            const dummy = new THREE.Group();
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.35), new THREE.MeshStandardMaterial({color:0xcc4444, roughness:0.5}));
            body.position.y = 0.7; body.castShadow = true; dummy.add(body);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshStandardMaterial({color:0xff6666, roughness:0.4}));
            head.position.y = 1.65; head.castShadow = true;
            head.userData.isHead = true; dummy.add(head);
            dummy.position.set((Math.random()-0.5)*20, 0, -5 - Math.random()*8);
            dummy.userData = {isTarget:true, health:80, maxHealth:80, type:'target', isBoss:false};
            scene.add(dummy); enemies.push(dummy);
          }, 500);
        }
        continue;
      }
      createCorpse(e);
      sessionStats.kills++;
      PROGRESS.records.totalKills = (PROGRESS.records.totalKills || 0) + 1;
      if (ud.isBoss){
        currentBoss = null;
        addScore(5000); addCoins(500);
        createLootCrate(e.position.clone(), 'sniper');
        showToast('💀 БОСС ПОВЕРЖЕН!', 3000);
        stopDynamicMusic();
        unlockAch('bossKill');
        if (currentLevel === 8) unlockAch('bossAll');
      } else {
        addScore(100);
        if (Math.random() < 0.3) createLootCrate(e.position.clone(), ud.weaponDrop);
      }
      saveProgress();
      checkAchConditions();
      scene.remove(e);
      enemies.splice(i, 1);
      checkWaveComplete();
      continue;
    }
    if (ud.isTarget) continue;
    const dir = new THREE.Vector3().subVectors(playerPos, e.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.1){
      dir.normalize();
      let sp = ud.speed;
      if (ud.isBoss){
        if (ud.phase === 2) sp *= 1.3;
        else if (ud.phase === 3) sp *= 1.6;
      }
      const speed = sp * (survivalMode ? survivalMode.enemySpeed : 1);
      const move = dir.clone().multiplyScalar(speed * delta);
      const newPos = e.position.clone().add(move);
      newPos.x = clamp(newPos.x, -46, 46);
      newPos.z = clamp(newPos.z, -46, 46);
      e.position.copy(newPos);
      e.lookAt(playerPos.x, e.position.y, playerPos.z);
    }
    ud.walkPhase += delta * 6;
    e.children.forEach((ch, idx) => {
      if (ch.geometry && ch.geometry.type === 'CylinderGeometry' && idx >= 4 && idx <= 7){
        ch.rotation.x = Math.sin(ud.walkPhase) * 0.4;
      }
    });
    if (now > ud.nextGroan){
      playZombieGroan(e.position);
      ud.nextGroan = now + 3000 + Math.random() * 5000;
    }
    if (dist < (ud.isBoss ? 2.5 : 1.5)){
      if (now - ud.lastShot > 1000){
        ud.lastShot = now;
        const dmg = (ud.isBoss ? 20 : 8) * (survivalMode ? survivalMode.enemyDamage : 1);
        takeDamage(dmg);
      }
    }
    if (ud.isBoss){
      if (ud.phase >= 2 && now > ud.nextSummonTime){
        ud.nextSummonTime = now + 10000;
        for (let k = 0; k < 2 + ud.phase; k++){
          const off = new THREE.Vector3((Math.random()-0.5)*6, 0, (Math.random()-0.5)*6);
          const minion = createZombie(false, 'melee');
          minion.position.copy(e.position).add(off);
          minion.position.y = 0.9;
          const bh = LEVELS[currentLevel].enemyHealth;
          minion.userData = { type:'melee', isBoss:false, health:bh, maxHealth:bh, speed:LEVELS[currentLevel].enemySpeed, radius:0.5, walkPhase:0, nextShotTime:now+99999, weaponDrop:'pistol', phase:1, lastShot:0, nextGroan:now+5000 };
          scene.add(minion); enemies.push(minion);
        }
        const fl = new THREE.PointLight(0xff4400, 3, 10);
        fl.position.copy(e.position); scene.add(fl);
        setTimeout(() => scene.remove(fl), 200);
      }
      if (ud.phase >= 3 && now > ud.nextShotTime){
        ud.nextShotTime = now + 1000 + Math.random()*1500;
        if (dist < 30 && dist > 3){
          if (Math.random() < 0.6) enemyShoot(e, playerPos);
          else throwGrenade(e, playerPos);
        }
      }
    } else if ((ud.type === 'shooter' || ud.type === 'grenadier') && now > ud.nextShotTime){
      if (dist < 30 && dist > 3){
        ud.nextShotTime = now + 1500 + Math.random()*2000;
        if (ud.type === 'shooter') enemyShoot(e, playerPos);
        else throwGrenade(e, playerPos);
      }
    }
  }
}
function enemyShoot(e, target){
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({color:0xff3300}));
  b.position.copy(e.position).add(new THREE.Vector3(0, e.userData.isBoss ? 2 : 1.2, 0));
  const dir = new THREE.Vector3().subVectors(target, b.position).normalize();
  b.userData = {velocity: dir.multiplyScalar(25), life:3, damage: e.userData.isBoss ? 15 : 10};
  scene.add(b); enemyBullets.push(b);
  playShootSoundEnhanced();
}
function throwGrenade(e, target){
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({color:0x2a5a2a, metalness:0.8, roughness:0.2}));
  g.position.copy(e.position).add(new THREE.Vector3(0, e.userData.isBoss ? 2 : 1.2, 0));
  const dir = new THREE.Vector3().subVectors(target, g.position).normalize();
  g.userData = {velocity: dir.multiplyScalar(12).add(new THREE.Vector3(0,5,0)), life:2.5, damage:40, radius:6, isPlayer:false};
  scene.add(g); grenades.push(g);
}
function throwPlayerGrenade(){
  if (!isGameActive || playerGrenades <= 0) return;
  playerGrenades--;
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshStandardMaterial({color:0x2a5a2a, metalness:0.8, roughness:0.2}));
  const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  g.position.copy(camera.position).add(fwd.clone().multiplyScalar(0.5));
  g.position.y -= 0.2;
  const v = fwd.clone().multiplyScalar(15);
  v.y += 6;
  g.userData = {velocity:v, life:2.5, damage:80, radius:8, isPlayer:true};
  scene.add(g); grenades.push(g);
  playClickSound(300, 0.05);
  updateHUD();
  if (tutorialState) markTutStep('grenade');
}
function updateBullets(delta){
  for (let i = enemyBullets.length - 1; i >= 0; i--){
    const b = enemyBullets[i];
    b.userData.life -= delta;
    b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
    if (b.userData.life <= 0 || b.position.length() > 100){ scene.remove(b); enemyBullets.splice(i, 1); continue; }
    if (b.position.distanceTo(camera.position) < 1){
      takeDamage(b.userData.damage * (survivalMode ? survivalMode.enemyDamage : 1));
      scene.remove(b); enemyBullets.splice(i, 1);
    }
  }
  for (let i = grenades.length - 1; i >= 0; i--){
    const g = grenades[i];
    g.userData.life -= delta;
    g.userData.velocity.y -= GRAVITY * delta;
    g.position.add(g.userData.velocity.clone().multiplyScalar(delta));
    if (g.position.y < 0.2){ g.userData.velocity.y *= -0.5; g.position.y = 0.2; }
    if (g.userData.life <= 0){
      explodeGrenade(g.position, g.userData.damage, g.userData.radius, g.userData.isPlayer);
      scene.remove(g); grenades.splice(i, 1);
    }
  }
}
function explodeGrenade(pos, damage, radius, isPlayer){
  playExplosionSound(pos);
  if (!isPlayer && pos.distanceTo(camera.position) < radius){
    takeDamage(damage * (1 - pos.distanceTo(camera.position)/radius));
  }
  let killedByGrenade = 0;
  enemies.forEach(e => {
    if (e.userData.isTarget) return;
    const d = pos.distanceTo(e.position);
    if (d < radius){
      const wasAlive = e.userData.health > 0;
      e.userData.health -= damage * (1 - d/radius);
      if (wasAlive && e.userData.health <= 0) killedByGrenade++;
    }
  });
  if (isPlayer && killedByGrenade >= 5){
    sessionStats.grenadeKills = Math.max(sessionStats.grenadeKills, killedByGrenade);
    unlockAch('grenadier');
  }
  const fl = new THREE.PointLight(0xff6600, 3, radius*2);
  fl.position.copy(pos); scene.add(fl);
  setTimeout(() => scene.remove(fl), 100);
  for (let i = 0; i < 15; i++){
    const v = new THREE.Vector3((Math.random()-0.5)*12, Math.random()*6+2, (Math.random()-0.5)*12);
    spawnParticle(pos, v, i%2===0 ? 0xff6600 : 0xffaa00, 0.08+Math.random()*0.06, 0.6+Math.random()*0.4, true);
  }
}
function takeDamage(amount){
  if (!isGameActive) return;
  health -= amount;
  hitsTaken++;
  sessionStats.damageTaken += amount;
  if (tutorialState) tutorialState.damageTaken += amount;
  shakeAmount = Math.min(1, shakeAmount + 0.3);
  playHurtSoundEnhanced();
  const vig = document.getElementById('damageVignette');
  if (vig){ vig.style.opacity = '1'; setTimeout(() => vig.style.opacity = '0', 200); }
  updateHUD();
  if (health <= 0){ health = 0; gameOver(); }
}
function healPlayer(amount){ health = Math.min(getMaxHealth(), health + amount); playHealSoundEnhanced(); updateHUD(); }
function useMedkit(){
  if (medkits > 0 && health < getMaxHealth()){
    medkits--; healPlayer(50); updateHUD();
    sessionStats.medkitsUsed++;
    if (sessionStats.medkitsUsed >= 10) unlockAch('healer');
  }
}
function addScore(p){ score += p; updateHUD(); }
function addCoins(a){ PROGRESS.coins += a; saveProgress(); updateCoinsDisplay(); checkAchConditions(); }

function createLootCrate(pos, weaponKey){
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({color:0x8a6a2a, metalness:0.5, roughness:0.5}));
  c.position.copy(pos); c.position.y = 0.3;
  c.userData = {weapon: weaponKey};
  scene.add(c); lootCrates.push(c);
}
function updateLoot(delta){
  nearLootCrate = null;
  lootCrates.forEach(c => {
    c.rotation.y += delta * 2;
    if (c.position.distanceTo(camera.position) < 2.5) nearLootCrate = c;
  });
  const prompt = document.getElementById('interactPrompt');
  if (prompt) prompt.style.display = nearLootCrate ? 'block' : 'none';
}
function pickupLoot(){
  if (!nearLootCrate) return;
  const w = nearLootCrate.userData.weapon;
  if (WEAPONS[w]){ WEAPONS[w].ammo = WEAPONS[w].maxAmmo; playPickupSound(); addScore(50); }
  const wasTut = nearLootCrate.userData.isTutorialCrate;
  scene.remove(nearLootCrate);
  lootCrates = lootCrates.filter(c => c !== nearLootCrate);
  nearLootCrate = null; updateHUD();
  if (wasTut && tutorialState) markTutStep('pickup');
}
function createCorpse(enemy){
  const c = enemy.clone();
  c.rotation.x = Math.PI/2; c.position.y = 0.1;
  c.traverse(ch => { if (ch.isMesh) ch.material = ch.material.clone(); });
  scene.add(c); corpses.push(c);
  setTimeout(() => { scene.remove(c); corpses = corpses.filter(x => x !== c); }, 10000);
  const stain = new THREE.Mesh(new THREE.CircleGeometry(0.8, 8), new THREE.MeshBasicMaterial({color:0x6a0000, transparent:true, opacity:0.7}));
  stain.rotation.x = -Math.PI/2;
  stain.position.set(enemy.position.x, 0.02, enemy.position.z);
  scene.add(stain); bloodStains.push(stain);
  setTimeout(() => { scene.remove(stain); bloodStains = bloodStains.filter(s => s !== stain); }, 15000);
}
function shoot(){
  if (!isGameActive || reloading) return;
  const w = WEAPONS[currentWeapon];
  const now = performance.now();
  if (now - lastShotTime < w.cooldown) return;
  if (w.ammo <= 0){ reload(); return; }
  lastShotTime = now; w.ammo--;
  playShootSoundEnhanced();
  recoilPitch = 0.02 + Math.random()*0.02;
  shakeAmount = Math.min(1, shakeAmount + 0.1);
  const fl = weaponGroup?.userData?.flash;
  if (fl){ fl.intensity = 3; setTimeout(() => fl.intensity = 0, 50); }
  createMuzzleSmoke(); createShellCasing();
  if (tutorialState) markTutStep('shoot');
  const dmgMult = getDamageMultiplier();
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++){
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x += (Math.random()-0.5) * w.spread * 2;
    dir.y += (Math.random()-0.5) * w.spread * 2;
    dir.z += (Math.random()-0.5) * w.spread * 2;
    dir.normalize();
    const ray = new THREE.Raycaster(camera.position, dir);
    const hits = ray.intersectObjects(enemies, true);
    if (hits.length > 0){
      const hit = hits[0];
      let eo = hit.object;
      while (eo.parent && !enemies.includes(eo)) eo = eo.parent;
      if (enemies.includes(eo)){
        const isHead = hit.object.userData && hit.object.userData.isHead;
        const mult = isHead ? 3 : 1;
        eo.userData.health -= w.damage * mult * dmgMult;
        playHitSoundEnhanced();
        createBloodBurst(hit.point, isHead);
        showHitMarker(isHead);
        if (isHead){
          playHeadshotSound();
          addScore(25);
          PROGRESS.records.totalHeadshots = (PROGRESS.records.totalHeadshots || 0) + 1;
          sessionStats.headshots++;
          sessionStats.headshotStreak++;
          if (sessionStats.headshotStreak > sessionStats.maxStreak) sessionStats.maxStreak = sessionStats.headshotStreak;
          if (currentWeapon === 'flamethrower') sessionStats.flameKills++;
          saveProgress();
          checkAchConditions();
        } else {
          addScore(10);
          sessionStats.headshotStreak = 0;
        }
      }
    } else {
      const wh = ray.intersectObjects(obstacles, true);
      if (wh.length > 0){
        const wp = wh[0].point;
        for (let j = 0; j < 6; j++){
          const v = new THREE.Vector3((Math.random()-0.5)*3, Math.random()*2+0.5, (Math.random()-0.5)*3);
          spawnParticle(wp, v, 0xaaaaaa, 0.04, 0.5, true);
        }
      }
    }
  }
  updateHUD();
}
function showHitMarker(isHead){
  const hm = document.getElementById('hitMarker');
  if (!hm) return;
  hm.textContent = '✖';
  hm.style.color = isHead ? '#ffcc00' : '#ffffff';
  hm.style.fontSize = isHead ? '42px' : '30px';
  hm.classList.add('show');
  clearTimeout(hm._t);
  hm._t = setTimeout(() => hm.classList.remove('show'), 120);
}
function reload(){
  if (reloading) return;
  const w = WEAPONS[currentWeapon];
  if (w.ammo === w.maxAmmo) return;
  reloading = true;
  playReloadSoundEnhanced();
  const t = w.reload * getReloadMultiplier();
  showToast('Перезарядка...', t);
  setTimeout(() => { w.ammo = w.maxAmmo; reloading = false; updateHUD(); }, t);
  if (tutorialState) markTutStep('reload');
}
function switchWeapon(key){
  if (!WEAPONS[key]) return;
  if (!PROGRESS.ownedWeapons.includes(key)) return;
  currentWeapon = key;
  createWeapon(key);
  updateHUD();
}
function updatePlayer(delta){
  if (!isGameActive) return;
  const speed = 5.0 * (isMobile ? 0.8 : 1);
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();
  if (keys.w) move.add(forward);
  if (keys.s) move.sub(forward);
  if (keys.a) move.sub(right);
  if (keys.d) move.add(right);
  if (isMobile && joystickActive){
    move.add(forward.clone().multiplyScalar(-joystickDeltaY / 50));
    move.add(right.clone().multiplyScalar(joystickDeltaX / 50));
  }
  if (move.length() > 0){
    move.normalize();
    const np = camera.position.clone().add(move.multiplyScalar(speed * delta));
    let ok = true;
    for (const obs of obstacles){
      if (obs.userData.size){
        const hx = obs.userData.size.x/2, hz = obs.userData.size.z/2;
        if (Math.abs(np.x - obs.position.x) < hx + 0.5 && Math.abs(np.z - obs.position.z) < hz + 0.5){ ok = false; break; }
      }
    }
    if (ok){
      np.x = clamp(np.x, -47, 47);
      np.z = clamp(np.z, -47, 47);
      camera.position.x = np.x;
      camera.position.z = np.z;
    }
    if (footstepTimer <= 0){ playFootstepSound(); footstepTimer = 0.5; }
    if (tutorialState && !tutorialState.moved){ tutorialState.moved = true; markTutStep('move'); }
  }
  if (isJumping){
    verticalVelocity -= GRAVITY * delta;
    playerY += verticalVelocity * delta;
    if (playerY <= 1.7){ playerY = 1.7; verticalVelocity = 0; isJumping = false; }
  }
  camera.position.y = playerY;
  bobPhase += delta * (move.length() > 0 ? 10 : 2);
  const ba = move.length() > 0 ? 0.05 : 0.01;
  camera.position.y += Math.sin(bobPhase) * ba;
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch + recoilPitch;
  recoilPitch *= 0.9;
  if (shakeAmount > 0){
    camera.rotation.x += (Math.random()-0.5) * shakeAmount * 0.05;
    camera.rotation.y += (Math.random()-0.5) * shakeAmount * 0.05;
    shakeAmount *= 0.9;
  }
  footstepTimer -= delta;
  if (tutorialState && tutorialState.steps.every(s => s.done)){
    setTimeout(() => { if (isGameActive && tutorialState && tutorialState.steps.every(s => s.done)) completeTutorial(); }, 800);
  }
}
function jump(){ if (!isJumping && isGameActive){ verticalVelocity = JUMP_POWER; isJumping = true; } }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function animate(){
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  if (isGameActive){
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateLoot(delta);
    updateParticles(delta);
    updateMusicIntensity();
  }
  if (isMouseDown && isGameActive){
    const w = WEAPONS[currentWeapon];
    if (w.auto) shoot();
  }
  if (isGameActive) updateHUD();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

function initUI(){
  document.getElementById('playBtn')?.addEventListener('click', () => { renderLevelGrid(); showScreen('map'); });
  document.getElementById('survivalBtn')?.addEventListener('click', () => { renderSurvivalGrid(); showScreen('survivalMenu'); });
  document.getElementById('multiplayerBtn')?.addEventListener('click', () => { showScreen('multiplayerMenu'); });
  document.getElementById('shopBtn')?.addEventListener('click', () => { renderShop('skins'); updateCoinsDisplay(); showScreen('shop'); });
  document.getElementById('settingsBtn')?.addEventListener('click', () => showScreen('settings'));
  document.getElementById('achBtn')?.addEventListener('click', () => { renderAchievements(); showScreen('achScreen'); });
  document.getElementById('recordsBtn')?.addEventListener('click', () => { renderRecords('personal'); showScreen('recordsScreen'); });
  document.getElementById('backToMenu')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('backFromShop')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('closeSettings')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('backFromSurvival')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('backFromMultiplayer')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('backFromAch')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('backFromRecords')?.addEventListener('click', () => showScreen('menu'));
  document.getElementById('horrorToggle')?.addEventListener('change', e => {
    horrorMode = e.target.checked;
    try{ localStorage.setItem('zombieshoot_horror', horrorMode); }catch(e){}
  });
  document.getElementById('sensSlider')?.addEventListener('input', e => { MOUSE_SENSITIVITY = parseFloat(e.target.value) / 2500; });
  document.getElementById('volSlider')?.addEventListener('input', e => { volume = parseInt(e.target.value) / 100; });
  document.getElementById('fovSlider')?.addEventListener('input', e => { if (camera){ camera.fov = parseInt(e.target.value); camera.updateProjectionMatrix(); } });
  document.getElementById('resetProgress')?.addEventListener('click', () => { if (confirm('Сбросить прогресс?')) resetProgress(); });
  document.getElementById('toMapBtn')?.addEventListener('click', () => { renderLevelGrid(); showScreen('map'); });
  document.getElementById('replayBtn')?.addEventListener('click', () => startGame(currentLevel, survivalMode));
  document.getElementById('retryBtn')?.addEventListener('click', () => startGame(currentLevel, survivalMode));
  document.getElementById('toMapBtn2')?.addEventListener('click', () => { renderLevelGrid(); showScreen('map'); });
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderShop(tab.dataset.tab);
    });
  });
  document.querySelectorAll('.rec-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rec-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRecords(tab.dataset.tab);
    });
  });
  if (document.getElementById('horrorToggle')) document.getElementById('horrorToggle').checked = horrorMode;
}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  if (id) document.getElementById(id).style.display = 'flex';
  renderer.domElement.style.display = 'none';
}
function renderLevelGrid(){
  const grid = document.getElementById('levelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const tutProg = PROGRESS.levels[0] || {unlocked:true, stars:0};
  const tutCard = document.createElement('div');
  tutCard.className = 'level-card' + (tutProg.completed ? ' completed' : '');
  tutCard.style.borderColor = '#00d4ff';
  let tutStars = '';
  for (let s = 1; s <= 3; s++) tutStars += `<svg class="${s <= (tutProg.stars || 0) ? '' : 'off'}"><use href="#icon-star"/></svg>`;
  tutCard.innerHTML = `
    <div class="level-num" style="color:#00d4ff">0</div>
    <div class="level-icon">🎓</div>
    <div class="level-name">Тренировка</div>
    <div class="level-stars">${tutStars}</div>
  `;
  tutCard.onclick = () => startGame(0);
  grid.appendChild(tutCard);
  for (let i = 1; i <= 8; i++){
    const lvl = LEVELS[i];
    const prog = PROGRESS.levels[i];
    const card = document.createElement('div');
    card.className = 'level-card' + (prog.unlocked ? '' : ' locked') + (lvl.boss ? ' boss-level' : '');
    let stars = '';
    for (let s = 1; s <= 3; s++) stars += `<svg class="${s <= prog.stars ? '' : 'off'}"><use href="#icon-star"/></svg>`;
    card.innerHTML = `
      <div class="level-num">${i}</div>
      <div class="level-icon">${lvl.icon}</div>
      <div class="level-name">${lvl.name}</div>
      <div class="level-stars">${stars}</div>
      ${!prog.unlocked ? '<div class="lock-icon">🔒</div>' : ''}
      ${lvl.boss ? '<div class="boss-icon">👹</div>' : ''}
    `;
    if (prog.unlocked) card.onclick = () => startGame(i);
    grid.appendChild(card);
  }
}
function renderSurvivalGrid(){
  const grid = document.getElementById('survivalGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const key in SURVIVAL_MODES){
    const m = SURVIVAL_MODES[key];
    const card = document.createElement('div');
    card.className = 'level-card';
    card.innerHTML = `
      <div class="level-num">${m.icon}</div>
      <div class="level-name">${m.name}</div>
      <div class="level-icon" style="font-size:11px;color:#888;font-family:'Courier New',monospace;">${m.desc}</div>
    `;
    card.onclick = () => startGame(1, m);
    grid.appendChild(card);
  }
}
function updateCoinsDisplay(){
  ['menuCoins','mapCoins','shopCoins','survivalCoins','mpCoins','recCoins'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = PROGRESS.coins;
  });
}
function updateHUD(){
  const hp = document.getElementById('health');
  if (hp) hp.textContent = Math.ceil(health);
  const sc = document.getElementById('score');
  if (sc){
    const lvl = LEVELS[currentLevel] || LEVELS[1];
    if (lvl.isTutorial) sc.textContent = '🎓 ТРЕНИРОВКА';
    else sc.textContent = `Ур.${currentLevel} | Волна ${wave}/${lvl.waves}`;
  }
  const am = document.getElementById('ammo');
  if (am){
    const w = WEAPONS[currentWeapon];
    am.innerHTML = `<svg class="ico-hud"><use href="#icon-${w.icon}"/></svg> ${w.ammo}/${w.maxAmmo}`;
  }
  const md = document.getElementById('medkits');
  if (md) md.innerHTML = `<svg class="ico-hud"><use href="#icon-medkit"/></svg> x${medkits}`;
  const gr = document.getElementById('grenades');
  if (gr) gr.innerHTML = `<svg class="ico-hud"><use href="#icon-grenade"/></svg> x${playerGrenades}`;
  const bb = document.getElementById('bossBar');
  if (bb){
    if (currentBoss && currentBoss.userData){
      bb.style.display = 'block';
      const r = currentBoss.userData.health / currentBoss.userData.maxHealth;
      const fill = document.getElementById('bossHealthFill');
      if (fill) fill.style.width = (r*100) + '%';
      const nm = document.getElementById('bossName');
      if (nm) nm.innerHTML = `<svg class="ico-hud"><use href="#icon-skull"/></svg> БОСС — ФАЗА ${bossPhase}`;
    } else bb.style.display = 'none';
  }
}
let toastEl = null, toastTimeout = null;
function showToast(text, duration = 2000){
  if (!toastEl){
    toastEl = document.createElement('div');
    toastEl.style.cssText = 'position:fixed;top:25%;left:50%;transform:translateX(-50%);font-size:22px;color:#fff;text-shadow:2px 2px 8px #000;font-family:Impact,sans-serif;letter-spacing:2px;pointer-events:none;z-index:80;transition:opacity 0.3s;text-align:center;';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.style.opacity = '1';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toastEl.style.opacity = '0'; }, duration);
}
function renderShop(tab = 'weapons'){
  const body = document.getElementById('shopContent');
  if (!body) return;
  updateCoinsDisplay();
  if (tab === 'weapons'){
    let html = '<div class="shop-grid">';
    for (const key in WEAPONS){
      const w = WEAPONS[key];
      const owned = PROGRESS.ownedWeapons.includes(key);
      const eq = currentWeapon === key;
      let btn = 'КУПИТЬ', dis = false;
      if (eq){ btn = '✅ ВЫБРАНО'; dis = true; }
      else if (owned) btn = 'ВЫБРАТЬ';
      else if (PROGRESS.coins < w.cost){ btn = 'МАЛО МОНЕТ'; dis = true; }
      html += `
        <div class="shop-item ${owned ? 'owned' : ''} ${eq ? 'equipped' : ''}">
          <svg class="item-icon"><use href="#icon-${w.icon}"/></svg>
          <div class="item-name">${w.name}</div>
          <div class="item-desc">Урон: ${w.damage} | Магазин: ${w.maxAmmo}<br>${w.auto ? 'Авто' : 'Одиночный'}</div>
          <div class="item-price"><svg class="ico-sm"><use href="#icon-coin"/></svg> ${owned ? (eq ? '—' : 'Куплено') : w.cost}</div>
          <button class="item-btn ${eq ? 'equipped-btn' : ''}" ${dis ? 'disabled' : ''} onclick="handleWeapon('${key}')">${btn}</button>
        </div>`;
    }
    html += '</div>';
    body.innerHTML = html;
  } else if (tab === 'skins'){
    let html = '<div class="shop-grid">';
    for (const key in SKINS){
      const sk = SKINS[key];
      const owned = PROGRESS.ownedSkins.includes(key);
      const eq = PROGRESS.currentSkin === key;
      let btn = 'КУП
