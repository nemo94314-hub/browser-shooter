// ============ ZOMBIESHOOT v15.0 — FULL EDITION ============

const DEFAULT_PROGRESS = {
  coins: 0,
  levels: {
    1: { unlocked: true, completed: false, stars: 0 },
    2: { unlocked: false, completed: false, stars: 0 },
    3: { unlocked: false, completed: false, stars: 0 },
    4: { unlocked: false, completed: false, stars: 0 },
    5: { unlocked: false, completed: false, stars: 0 },
    6: { unlocked: false, completed: false, stars: 0 },
    7: { unlocked: false, completed: false, stars: 0 },
    8: { unlocked: false, completed: false, stars: 0 }
  },
  ownedSkins: ['default'],
  ownedWeapons: ['pistol', 'rifle', 'shotgun'],
  currentSkin: 'default',
  upgrades: { damage: 0, reload: 0, health: 0 }
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
      return merged;
    }
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
function saveProgress() { try { localStorage.setItem('zombieshoot_progress_v15', JSON.stringify(PROGRESS)); } catch(e) {} }
function resetProgress() { PROGRESS = JSON.parse(JSON.stringify(DEFAULT_PROGRESS)); saveProgress(); updateCoinsDisplay(); renderLevelGrid(); if (document.getElementById('shopModal')) renderShop(); }

const LEVELS = {
  1: { name:'Лагерь', icon:'⛺', waves:1, boss:false, maxEnemies:5, enemySpeed:1.2, enemyHealth:30, enemyDamage:0.5, shooterChance:0.3, grenadierChance:0.05, theme:'grass', sky:0x0a0a1a, fog:0x050510, fogNear:8, fogFar:40, ambient:0.08 },
  2: { name:'Лес', icon:'🌲', waves:2, boss:false, maxEnemies:7, enemySpeed:1.4, enemyHealth:45, enemyDamage:0.6, shooterChance:0.4, grenadierChance:0.10, theme:'forest', sky:0x050a05, fog:0x030803, fogNear:6, fogFar:35, ambient:0.06 },
  3: { name:'Деревня', icon:'🏘️', waves:3, boss:false, maxEnemies:9, enemySpeed:1.6, enemyHealth:60, enemyDamage:0.7, shooterChance:0.5, grenadierChance:0.15, theme:'village', sky:0x1a0a05, fog:0x0a0503, fogNear:7, fogFar:38, ambient:0.07 },
  4: { name:'Пустыня', icon:'🏜️', waves:4, boss:false, maxEnemies:11, enemySpeed:1.8, enemyHealth:75, enemyDamage:0.8, shooterChance:0.6, grenadierChance:0.20, theme:'desert', sky:0x2a1a05, fog:0x1a1005, fogNear:10, fogFar:50, ambient:0.15 },
  5: { name:'Завод', icon:'🏭', waves:5, boss:false, maxEnemies:12, enemySpeed:1.9, enemyHealth:90, enemyDamage:0.9, shooterChance:0.6, grenadierChance:0.25, theme:'factory', sky:0x0a0a0a, fog:0x050505, fogNear:5, fogFar:30, ambient:0.05 },
  6: { name:'Метро', icon:'🚇', waves:6, boss:false, maxEnemies:13, enemySpeed:2.0, enemyHealth:110, enemyDamage:1.0, shooterChance:0.65, grenadierChance:0.3, theme:'metro', sky:0x000000, fog:0x000000, fogNear:4, fogFar:22, ambient:0.03 },
  7: { name:'Лаборатория', icon:'🧪', waves:7, boss:false, maxEnemies:14, enemySpeed:2.1, enemyHealth:130, enemyDamage:1.2, shooterChance:0.7, grenadierChance:0.35, theme:'lab', sky:0x001a10, fog:0x000a05, fogNear:5, fogFar:28, ambient:0.06 },
  8: { name:'Логово Босса', icon:'💀', waves:8, boss:true, maxEnemies:15, enemySpeed:2.3, enemyHealth:150, enemyDamage:1.4, shooterChance:0.7, grenadierChance:0.4, theme:'lair', sky:0x1a0000, fog:0x0a0000, fogNear:4, fogFar:25, ambient:0.05 }
};

const SURVIVAL_MODES = {
  easy:      { icon:'🟢', name:'Лёгкий',  desc:'Медленные зомби, слабые волны', multiplier:1.0, enemySpeed:1.0, enemyHealth:0.7, enemyDamage:0.6, shooterChance:0.3, grenadierChance:0.05, maxEnemies:8, spawnInterval:2500 },
  normal:    { icon:'🔵', name:'Обычный', desc:'Стандартный баланс', multiplier:2.0, enemySpeed:1.3, enemyHealth:1.0, enemyDamage:1.0, shooterChance:0.5, grenadierChance:0.15, maxEnemies:12, spawnInterval:2000 },
  hard:      { icon:'🟠', name:'Сложный', desc:'Быстрые зомби, много стрелков', multiplier:3.5, enemySpeed:1.7, enemyHealth:1.4, enemyDamage:1.4, shooterChance:0.7, grenadierChance:0.25, maxEnemies:16, spawnInterval:1500 },
  nightmare: { icon:'🔴', name:'Кошмар',  desc:'Хаос. Только для опытных.', multiplier:5.0, enemySpeed:2.2, enemyHealth:2.0, enemyDamage:2.0, shooterChance:0.8, grenadierChance:0.4, maxEnemies:22, spawnInterval:1000 }
};

const WEAPONS = {
  pistol:      { name:'Пистолет', ammo:15, maxAmmo:15, damage:35, cooldown:280, spread:0.004, auto:false, reload:1100, icon:'🔫', cost:0 },
  rifle:       { name:'Автомат', ammo:30, maxAmmo:30, damage:22, cooldown:90, spread:0.012, auto:true, reload:1800, icon:'🔫', cost:0 },
  shotgun:     { name:'Дробовик', ammo:6, maxAmmo:6, damage:20, cooldown:750, spread:0.055, auto:false, reload:2000, icon:'🔫', cost:0, pellets:10 },
  sniper:      { name:'Снайперка', ammo:5, maxAmmo:5, damage:200, cooldown:1600, spread:0.001, auto:false, reload:2600, icon:'🎯', cost:500, zoom:true },
  dualPistols: { name:'Два пистолета', ammo:30, maxAmmo:30, damage:25, cooldown:150, spread:0.022, auto:true, reload:1500, icon:'🔫', cost:300 },
  flamethrower:{ name:'Огнемёт', ammo:100, maxAmmo:100, damage:6, cooldown:50, spread:0.14, auto:true, reload:3000, icon:'🔥', cost:800, shortRange:12 }
};

const SKINS = {
  default:  { name:'Новобранец', body:0x3a4a2a, head:0x5a6a3a, cost:0 },
  soldier:  { name:'Солдат', body:0x2a3a2a, head:0x4a5a2a, cost:200 },
  commando: { name:'Коммандос', body:0x1a1a1a, head:0x3a3a2a, cost:500 },
  ghost:    { name:'Призрак', body:0x666666, head:0x999999, cost:1000 }
};

const UPGRADES = {
  damage: { name:'Урон', icon:'💥', desc:'+10% урона за уровень', maxLevel: 5, costs: [200, 400, 600, 800, 1000] },
  reload: { name:'Скорость перезарядки', icon:'⚡', desc:'−10% времени перезарядки', maxLevel: 5, costs: [150, 300, 450, 600, 750] },
  health: { name:'Здоровье', icon:'❤️', desc:'+20 к максимальному HP', maxLevel: 5, costs: [250, 500, 750, 1000, 1250] }
};

function getDamageMultiplier() { return 1 + 0.1 * (PROGRESS.upgrades?.damage || 0); }
function getReloadMultiplier() { return Math.max(0.5, 1 - 0.1 * (PROGRESS.upgrades?.reload || 0)); }
function getMaxHealth() { return 100 + 20 * (PROGRESS.upgrades?.health || 0); }

let scene, camera, renderer, composer;
let score = 0, health = 100, wave = 1, currentLevel = 1;
let hitsTaken = 0;
let isGameActive = false;
let enemies = [], obstacles = [], enemyBullets = [], grenades = [], lootCrates = [], corpses = [], bloodStains = [];
let particles = [];
let currentBoss = null, bossMaxHealth = 0, bossPhase = 1;
let playerGrenades = 3;
const MAX_PLAYER_GRENADES = 5;
let clock = new THREE.Clock();
let yaw = 0, pitch = 0, recoilPitch = 0;
let verticalVelocity = 0, playerY = 1.7, isJumping = false;
let bobPhase = 0, breathPhase = 0, shakeAmount = 0;
let slowMotionFactor = 1.0, slowMotionTimer = 0;
const GRAVITY = 22, JUMP_POWER = 8;
let MOUSE_SENSITIVITY = 0.002, volume = 0.4, medkits = 2;
const MAX_MEDKITS = 5;
let horrorMode = true;
let survivalMode = null;
let survivalActive = false;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1200);
let joystickActive = false, joystickTouchId = null;
let joystickStartX = 0, joystickStartY = 0, joystickDeltaX = 0, joystickDeltaY = 0;
let lookTouchId = null, lookLastX = 0, lookLastY = 0;

let currentWeapon = 'rifle';
let reloading = false, lastShotTime = 0, isMouseDown = false;
let weaponGroup = null, flashlight = null, audioCtx = null;
let debugMode = false, nearLootCrate = null;
let filmPass = null, vignettePass = null;
const keys = { w:false, a:false, s:false, d:false };

let activeAmbientNodes = [];
let footstepTimer = 0;
let lastFootstepTime = 0;
let zombieWhisperTimer = null;

// ============ ДИНАМИЧЕСКАЯ МУЗЫКА ============
let musicState = { calmGain:null, combatGain:null, calmOsc:null, combatOsc:null, combatRhythm:null, intensity: 0, running: false };

function startDynamicMusic() {
  if (!audioCtx || musicState.running) return;
  musicState.running = true;

  // === СПОКОЙНЫЙ СЛОЙ: низкий дрон + редкие высокие ноты ===
  const calmGain = audioCtx.createGain();
  calmGain.gain.setValueAtTime(0.06 * volume, audioCtx.currentTime);
  calmGain.connect(audioCtx.destination);

  const calmOsc = audioCtx.createOscillator();
  calmOsc.type = 'sine';
  calmOsc.frequency.setValueAtTime(55, audioCtx.currentTime);
  const calmFilter = audioCtx.createBiquadFilter();
  calmFilter.type = 'lowpass'; calmFilter.frequency.setValueAtTime(200, audioCtx.currentTime);
  const calmOsc2 = audioCtx.createOscillator();
  calmOsc2.type = 'sine';
  calmOsc2.frequency.setValueAtTime(82.5, audioCtx.currentTime); // квинта
  const calmGain2 = audioCtx.createGain();
  calmGain2.gain.setValueAtTime(0.4, audioCtx.currentTime);

  calmOsc.connect(calmFilter); calmFilter.connect(calmGain);
  calmOsc2.connect(calmGain2); calmGain2.connect(calmGain);
  calmOsc.start(); calmOsc2.start();

  // Медленное "дыхание" спокойного слоя
  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine'; lfo.frequency.setValueAtTime(0.1, audioCtx.currentTime);
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.setValueAtTime(0.02 * volume, audioCtx.currentTime);
  lfo.connect(lfoGain); lfoGain.connect(calmGain.gain);
  lfo.start();

  // === БОЕВОЙ СЛОЙ: быстрый бас + пульсация ===
  const combatGain = audioCtx.createGain();
  combatGain.gain.setValueAtTime(0, audioCtx.currentTime); // начинаем с 0
  combatGain.connect(audioCtx.destination);

  // Басовая пульсация
  const combatOsc = audioCtx.createOscillator();
  combatOsc.type = 'sawtooth';
  combatOsc.frequency.setValueAtTime(40, audioCtx.currentTime);
  const combatFilter = audioCtx.createBiquadFilter();
  combatFilter.type = 'lowpass'; combatFilter.frequency.setValueAtTime(400, audioCtx.currentTime);
  const bassGain = audioCtx.createGain();
  bassGain.gain.setValueAtTime(0, audioCtx.currentTime);
  combatOsc.connect(combatFilter); combatFilter.connect(bassGain); bassGain.connect(combatGain);
  combatOsc.start();

  // Ритм баса: 4 удара в секунду
  function scheduleBassHit() {
    if (!musicState.running) return;
    const t = audioCtx.currentTime;
    bassGain.gain.cancelScheduledValues(t);
    bassGain.gain.setValueAtTime(0.35, t);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    setTimeout(scheduleBassHit, 260);
  }
  scheduleBassHit();

  // Высокие тревожные ноты — каждые 2 секунды
  function scheduleHighNote() {
    if (!musicState.running) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square';
    const freqs = [330, 392, 440, 349];
    o.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(combatGain);
    o.start(t); o.stop(t + 0.45);
    setTimeout(scheduleHighNote, 2000);
  }
  scheduleHighNote();

  musicState.calmGain = calmGain;
  musicState.combatGain = combatGain;
  musicState.calmOsc = calmOsc;
  musicState.combatOsc = combatOsc;
  musicState.bassGain = bassGain;
}

function stopDynamicMusic() {
  musicState.running = false;
  try { musicState.calmOsc?.stop(); } catch(e){}
  try { musicState.combatOsc?.stop(); } catch(e){}
  try {
    if (musicState.calmGain) musicState.calmGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    if (musicState.combatGain) musicState.combatGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
  } catch(e){}
  musicState = { calmGain:null, combatGain:null, calmOsc:null, combatOsc:null, combatRhythm:null, intensity: 0, running: false };
}

function updateMusicIntensity() {
  if (!audioCtx || !musicState.running || !isGameActive) return;
  // Определяем "боевое напряжение" — близость зомби
  let maxThreat = 0;
  const playerPos = camera.position;
  for (const e of enemies) {
    const d = e.position.distanceTo(playerPos);
    if (d < 30) {
      const threat = (1 - d / 30) * (e.userData.isBoss ? 1.5 : 1);
      if (threat > maxThreat) maxThreat = threat;
    }
  }
  // Плавно приближаем intensity к цели
  const target = Math.min(1, maxThreat);
  musicState.intensity += (target - musicState.intensity) * 0.05;

  const t = audioCtx.currentTime;
  const calmVol = (1 - musicState.intensity) * 0.06 * volume;
  const combatVol = musicState.intensity * 0.12 * volume;
  try {
    musicState.calmGain.gain.cancelScheduledValues(t);
    musicState.combatGain.gain.cancelScheduledValues(t);
    musicState.calmGain.gain.linearRampToValueAtTime(calmVol, t + 0.3);
    musicState.combatGain.gain.linearRampToValueAtTime(combatVol, t + 0.3);
  } catch(e){}
}

// ============ ЗВУКИ ============
function playFootstepSound() {
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
  filter.frequency.setValueAtTime(300 + Math.random() * 200, audioCtx.currentTime);
  g.gain.setValueAtTime(0.04 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  o.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.12);
}

function playZombieGroan(pos) {
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

function playBossRoar() {
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

  // Реверберация-эхо
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.type = 'triangle';
  o2.frequency.setValueAtTime(90, now);
  o2.frequency.exponentialRampToValueAtTime(40, now + 1.5);
  g2.gain.setValueAtTime(0, now + 0.3);
  g2.gain.linearRampToValueAtTime(0.15 * volume, now + 0.5);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
  o2.connect(g2); g2.connect(audioCtx.destination);
  o2.start(now + 0.3); o2.stop(now + 2);
}

function startHorrorAmbient() {
  if (!audioCtx) return;
  stopHorrorAmbient();
  const drone = audioCtx.createOscillator(), droneGain = audioCtx.createGain(), droneFilter = audioCtx.createBiquadFilter();
  drone.type = 'sine'; drone.frequency.setValueAtTime(45, audioCtx.currentTime);
  droneFilter.type = 'lowpass'; droneFilter.frequency.setValueAtTime(150, audioCtx.currentTime);
  droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.05 * volume, audioCtx.currentTime + 3);
  drone.connect(droneFilter); droneFilter.connect(droneGain); droneGain.connect(audioCtx.destination);
  drone.start();
  activeAmbientNodes.push({ osc: drone, gain: droneGain });

  const windBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const windData = windBuffer.getChannelData(0);
  for (let i = 0; i < windData.length; i++) windData[i] = (Math.random() * 2 - 1) * 0.3;
  const wind = audioCtx.createBufferSource();
  wind.buffer = windBuffer; wind.loop = true;
  const windFilter = audioCtx.createBiquadFilter();
  windFilter.type = 'lowpass'; windFilter.frequency.setValueAtTime(400, audioCtx.currentTime);
  const windGain = audioCtx.createGain();
  windGain.gain.setValueAtTime(0, audioCtx.currentTime);
  windGain.gain.linearRampToValueAtTime(0.015 * volume, audioCtx.currentTime + 2);
  wind.connect(windFilter); windFilter.connect(windGain); windGain.connect(audioCtx.destination);
  wind.start();
  activeAmbientNodes.push({ source: wind, gain: windGain });
}

function stopHorrorAmbient() {
  activeAmbientNodes.forEach(node => {
    try { if (node.osc) node.osc.stop(); } catch(e){}
    try { if (node.source) node.source.stop(); } catch(e){}
  });
  activeAmbientNodes = [];
  if (zombieWhisperTimer) { clearInterval(zombieWhisperTimer); zombieWhisperTimer = null; }
}

function playShootSoundEnhanced() {
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

function playHitSoundEnhanced() {
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

function playReloadSoundEnhanced() {
  if (!audioCtx) return;
  const w = WEAPONS[currentWeapon];
  setTimeout(() => playClickSound(150, 0.08), 0);
  setTimeout(() => playClickSound(120, 0.1), w.reload * getReloadMultiplier() * 0.5);
}

function playClickSound(freq, dur) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(freq, audioCtx.currentTime);
  g.gain.setValueAtTime(0.08 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

function playExplosionSound(pos) {
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

function playHurtSoundEnhanced() {
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

function playHealSoundEnhanced() {
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

function playPickupSound() {
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

function playBuySound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, now + i * 0.06);
    g.gain.setValueAtTime(0, now + i * 0.06);
    g.gain.linearRampToValueAtTime(0.12 * volume, now + i * 0.06 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.16);
  });
}

function playErrorSound() {
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

function playHeadshotSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
  o1.type = 'square';
  o1.frequency.setValueAtTime(1200, now);
  o1.frequency.exponentialRampToValueAtTime(300, now + 0.08);
  g1.gain.setValueAtTime(0.15 * volume, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  o1.connect(g1); g1.connect(audioCtx.destination);
  o1.start(now); o1.stop(now + 0.11);
  const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
  o2.type = 'triangle';
  o2.frequency.setValueAtTime(180, now);
  o2.frequency.exponentialRampToValueAtTime(60, now + 0.15);
  g2.gain.setValueAtTime(0.2 * volume, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  o2.connect(g2); g2.connect(audioCtx.destination);
  o2.start(now); o2.stop(now + 0.2);
}

function showHitmarker(isHead) {
  const hm = document.getElementById('hitmarker');
  if (!hm) return;
  hm.textContent = '✕';
  hm.style.color = isHead ? '#ffcc00' : '#ffffff';
  hm.style.fontSize = isHead ? '42px' : '28px';
  hm.style.opacity = '1';
  hm.style.transform = 'translate(-50%, -50%) scale(' + (isHead ? '1.3' : '1') + ')';
  clearTimeout(hm._timeout);
  hm._timeout = setTimeout(() => {
    hm.style.opacity = '0';
    hm.style.transform = 'translate(-50%, -50%) scale(0.8)';
  }, 120);
}

// ============ СИСТЕМА ЧАСТИЦ ============
function spawnParticle(pos, velocity, color, size, life, useGravity = true) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 4, 4),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
  );
  mesh.position.copy(pos);
  mesh.userData = { velocity: velocity.clone(), life, maxLife: life, gravity: useGravity };
  scene.add(mesh);
  particles.push(mesh);
}

function createBloodBurst(pos, isHead) {
  const count = isHead ? 22 : 12;
  const baseColor = isHead ? 0xbb0000 : 0x880000;
  for (let i = 0; i < count; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 6, Math.random() * 4 + 1, (Math.random() - 0.5) * 6);
    spawnParticle(pos, vel, baseColor, 0.035 + Math.random() * 0.055, 0.5 + Math.random() * 0.6, true);
  }
  for (let i = 0; i < 5; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 1.5 + 0.3, (Math.random() - 0.5) * 2);
    spawnParticle(pos, vel, 0x550000, 0.14 + Math.random() * 0.08, 1.0 + Math.random() * 0.4, false);
  }
  if (isHead) {
    const flash = new THREE.PointLight(0xff2200, 2, 4);
    flash.position.copy(pos);
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 60);
  }
}

function createShellCasing() {
  if (!weaponGroup) return;
  const casing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.05, 6),
    new THREE.MeshStandardMaterial({ color: 0xc4a040, metalness: 0.9, roughness: 0.2 })
  );
  const worldPos = new THREE.Vector3();
  weaponGroup.getWorldPosition(worldPos);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  casing.position.copy(worldPos).add(right.clone().multiplyScalar(0.15)).add(up.clone().multiplyScalar(0.05));
  const ejectVel = right.clone().multiplyScalar(1.8 + Math.random() * 0.8);
  ejectVel.y += 1.5 + Math.random() * 0.8;
  casing.userData = {
    velocity: ejectVel, life: 2.5, maxLife: 2.5, gravity: true,
    spin: new THREE.Vector3(Math.random() * 25 - 12, Math.random() * 25 - 12, Math.random() * 25 - 12)
  };
  scene.add(casing);
  particles.push(casing);
}

function createMuzzleSmoke() {
  if (!weaponGroup) return;
  const worldPos = new THREE.Vector3();
  weaponGroup.getWorldPosition(worldPos);
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const spawnPos = worldPos.clone().add(forward.clone().multiplyScalar(0.6));
  for (let i = 0; i < 4; i++) {
    const vel = new THREE.Vector3((Math.random() - 0.5) * 1.2, Math.random() * 0.6 + 0.2, (Math.random() - 0.5) * 1.2);
    spawnParticle(spawnPos, vel, 0x999999, 0.06 + Math.random() * 0.05, 0.7 + Math.random() * 0.3, false);
  }
}

function updateParticles(delta) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= delta;
    if (p.userData.life <= 0) {
      scene.remove(p); particles.splice(i, 1); continue;
    }
    if (p.userData.gravity) p.userData.velocity.y -= GRAVITY * delta;
    p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
    if (p.userData.gravity && p.position.y < 0.03) {
      p.position.y = 0.03;
      p.userData.velocity.y *= -0.3;
      p.userData.velocity.x *= 0.7;
      p.userData.velocity.z *= 0.7;
    }
    if (p.userData.spin) {
      p.rotation.x += p.userData.spin.x * delta;
      p.rotation.y += p.userData.spin.y * delta;
      p.rotation.z += p.userData.spin.z * delta;
    }
    const alpha = p.userData.life / p.userData.maxLife;
    if (p.material) {
      p.material.opacity = Math.max(0, Math.min(1, alpha));
      p.material.transparent = true;
    }
  }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.Fog(0x050510, 8, 40);

  const fov = isMobile ? 85 : 75;
  camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.1, 300);
  camera.position.set(0, playerY, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isMobile;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '1';
  document.body.appendChild(renderer.domElement);

  try {
    const hm = localStorage.getItem('zombieshoot_horror');
    if (hm !== null) horrorMode = hm === 'true';
  } catch(e){}

  if (horrorMode && typeof THREE.EffectComposer !== 'undefined') {
    try {
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      if (THREE.FilmShader) {
        filmPass = new THREE.ShaderPass(THREE.FilmShader);
        filmPass.uniforms['nIntensity'].value = 0.15;
        composer.addPass(filmPass);
      }
      if (THREE.VignetteShader) {
        vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
        vignettePass.uniforms['darkness'].value = 1.4;
        vignettePass.renderToScreen = true;
        composer.addPass(vignettePass);
      }
    } catch(e) { composer = null; }
  }

  buildLevelEnvironment(1);

  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
  setupControls();
  animate();
  setupUI();
  renderLevelGrid();
  updateCoinsDisplay();
}

// ============ ОКРУЖЕНИЕ ============
function clearLevelEnvironment() {
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const child = scene.children[i];
    if (child === camera) continue;
    if (child.isLight) continue;
    scene.remove(child);
  }
  obstacles = [];
}

function buildLevelEnvironment(levelNum) {
  clearLevelEnvironment();
  const lvl = LEVELS[levelNum] || LEVELS[1];

  let skyColor, fogColor, fogNear, fogFar, ambientLevel;
  if (horrorMode) {
    skyColor = lvl.sky; fogColor = lvl.fog;
    fogNear = lvl.fogNear; fogFar = lvl.fogFar;
    ambientLevel = lvl.ambient || 0.08;
  } else {
    const light = { grass:0x87a5c4, forest:0x6a8a6a, village:0xa89a7a, desert:0xe8d0a0, factory:0x8a8a9a, metro:0x5a5a6a, lab:0x6aaa8a, lair:0x8a4a4a };
    skyColor = light[lvl.theme] || 0x87a5c4;
    fogColor = skyColor; fogNear = 50; fogFar = 130; ambientLevel = 0.7;
  }

  scene.background = new THREE.Color(skyColor);
  scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ color: skyColor, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  scene.add(new THREE.AmbientLight(0xffffff, ambientLevel));
  if (horrorMode) {
    const moon = new THREE.DirectionalLight(0x8899cc, 0.25);
    moon.position.set(-30, 40, -20);
    scene.add(moon);
  } else {
    const sun = new THREE.DirectionalLight(0xfff0d0, 0.8);
    sun.position.set(40, 60, 20);
    sun.castShadow = !isMobile;
    scene.add(sun);
  }

  const groundColors = horrorMode
    ? { grass:0x1a2a15, forest:0x0a1a0a, village:0x2a1a0a, desert:0x4a3a1a, factory:0x1a1a1a, metro:0x0a0a0a, lab:0x0a1a15, lair:0x1a0000 }
    : { grass:0x4a6b3a, forest:0x3a5a2a, village:0x6a5a3a, desert:0xc4a868, factory:0x5a5a5a, metro:0x3a3a3e, lab:0x4a6a5a, lair:0x5a2a2a };
  const groundColor = groundColors[lvl.theme] || 0x4a6b3a;

  const groundGeo = new THREE.PlaneGeometry(100, 100, 20, 20);
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: groundColor, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const wallMat = new THREE.MeshStandardMaterial({ color: horrorMode ? 0x1a1a1a : 0x5a5a5a, roughness: 1 });
  [
    { pos:[0,5,-48], size:[96,10,1] }, { pos:[0,5,48], size:[96,10,1] },
    { pos:[-48,5,0], size:[1,10,96] }, { pos:[48,5,0], size:[1,10,96] }
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos);
    wall.castShadow = true; wall.receiveShadow = true;
    wall.userData.size = { x:w.size[0], y:w.size[1], z:w.size[2] };
    scene.add(wall); obstacles.push(wall);
  });

  const obsMat = new THREE.MeshStandardMaterial({ color: horrorMode ? 0x3a2a1a : 0x6a552a, roughness: 1 });
  [[12,1,8,3,2,3],[-12,1,8,3,2,3],[12,1,-8,3,2,3],[-12,1,-8,3,2,3]].forEach(([x,y,z,sx,sy,sz]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), obsMat);
    c.position.set(x, y, z);
    c.castShadow = true; c.receiveShadow = true;
    c.userData.size = { x: sx, y: sy, z: sz };
    scene.add(c); obstacles.push(c);
  });

  if (horrorMode) {
    flashlight = new THREE.SpotLight(0xfff2d0, 1.5, 25, Math.PI / 7, 0.4, 1.5);
    flashlight.position.set(0, 0, 0);
    flashlight.target.position.set(0, 0, -1);
    camera.add(flashlight);
    camera.add(flashlight.target);
  } else {
    flashlight = null;
  }
}

// ============ ОРУЖИЕ ============
function createWeapon(type) {
  if (weaponGroup) camera.remove(weaponGroup);
  weaponGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.9, roughness: 0.4 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });

  if (type === 'pistol') {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.28), metal);
    s.position.set(0, 0.02, -0.15); weaponGroup.add(s);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), grip);
    g.position.set(0, -0.15, 0.02); g.rotation.x = 0.25; weaponGroup.add(g);
    weaponGroup.position.set(0.22, -0.22, -0.4);
  } else if (type === 'rifle' || type === 'sniper' || type === 'flamethrower') {
    const len = type === 'sniper' ? 0.9 : 0.5;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, len), metal);
    b.position.set(0, 0, -len / 2); weaponGroup.add(b);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip);
    g.position.set(0, -0.13, 0.05); g.rotation.x = 0.3; weaponGroup.add(g);
    weaponGroup.position.set(0.28, -0.26, -0.5);
  } else if (type === 'shotgun') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.55), metal);
    b.position.set(0, 0, -0.25); weaponGroup.add(b);
    weaponGroup.position.set(0.3, -0.28, -0.5);
  } else if (type === 'dualPistols') {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.24), metal);
    s1.position.set(-0.15, 0.02, -0.12); weaponGroup.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.24), metal);
    s2.position.set(0.15, 0.02, -0.12); weaponGroup.add(s2);
    weaponGroup.position.set(0, -0.25, -0.5);
  }

  const flash = new THREE.PointLight(0xffaa00, 0, 8);
  flash.position.set(0, 0.03, -0.9); weaponGroup.add(flash);
  weaponGroup.userData.flash = flash;
  camera.add(weaponGroup);
}

// ============ ЗОМБИ (с разными моделями) ============
function createZombie(isBoss, type = 'melee') {
  const g = new THREE.Group();
  const sk = SKINS[PROGRESS.currentSkin] || SKINS.default;
  const size = isBoss ? 1.8 : 1;

  // Цвета в зависимости от типа
  let bodyColor, headColor, eyeColor;
  if (isBoss) {
    bodyColor = 0x4a1a1a; headColor = 0x6a2a2a; eyeColor = 0xff6600;
  } else if (type === 'shooter') {
    bodyColor = 0x2a2a3a; headColor = 0x5a5a3a; eyeColor = 0xffcc00; // Тёмно-синий, жёлтые глаза
  } else if (type === 'grenadier') {
    bodyColor = 0x2a4a2a; headColor = 0x3a5a3a; eyeColor = 0x00ff66; // Тёмно-зелёный, зелёные глаза
  } else {
    bodyColor = sk.body; headColor = 0x5a6a3a; eyeColor = 0xaa0000; // По умолчанию
  }

  const skin = new THREE.MeshStandardMaterial({ color: headColor });
  const uniform = new THREE.MeshStandardMaterial({ color: bodyColor });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const glow = new THREE.MeshBasicMaterial({ color: eyeColor });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * size, 0.32 * size, 1.0 * size, 8), uniform);
  torso.position.y = 0.5 * size; torso.castShadow = true; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28 * size, 12, 10), skin);
  head.position.y = 1.45 * size; head.castShadow = true; g.add(head);
  head.userData.isHead = true;

  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.055 * size, 6, 6), glow);
  eL.position.set(-0.11 * size, 1.48 * size, -0.24 * size); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.055 * size, 6, 6), glow);
  eR.position.set(0.11 * size, 1.48 * size, -0.24 * size); g.add(eR);

  const legGeo = new THREE.CylinderGeometry(0.13 * size, 0.11 * size, 0.75 * size, 6);
  const lL = new THREE.Mesh(legGeo, dark);
  lL.position.set(-0.18 * size, -0.4 * size, 0); g.add(lL);
  const lR = new THREE.Mesh(legGeo, dark);
  lR.position.set(0.18 * size, -0.4 * size, 0); g.add(lR);

  // ОРУЖИЕ / АКСЕССУАРЫ ПО ТИПУ
  if (!isBoss) {
    if (type === 'shooter') {
      // Винтовка в руках
      const gunMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.3 });
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.7), gunMat);
      rifle.position.set(0.35 * size, 0.9 * size, -0.35 * size);
      rifle.rotation.z = -0.15;
      g.add(rifle);
      // Сумка с патронами
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.15), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }));
      bag.position.set(0, 0.5 * size, 0.3 * size);
      g.add(bag);
    } else if (type === 'grenadier') {
      // Сумка с гранатами
      const bagMat = new THREE.MeshStandardMaterial({ color: 0x4a6a3a });
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), bagMat);
      bag.position.set(0, 0.5 * size, 0.35 * size);
      g.add(bag);
      // Гранаты-шарики на поясе
      for (let i = 0; i < 3; i++) {
        const gre = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: 0x2a5a2a }));
        gre.position.set(-0.15 + i * 0.15, 0.35 * size, 0.35 * size);
        g.add(gre);
      }
    }
  } else {
    // БОСС: рога и дополнительная броня
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(0.1 * size, 0.5 * size, 6), hornMat);
    hornL.position.set(-0.2 * size, 1.75 * size, 0);
    hornL.rotation.z = 0.5;
    g.add(hornL);
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(0.1 * size, 0.5 * size, 6), hornMat);
    hornR.position.set(0.2 * size, 1.75 * size, 0);
    hornR.rotation.z = -0.5;
    g.add(hornR);
    // Свечение
    const aura = new THREE.PointLight(0xff3300, 1.5, 8);
    aura.position.y = 1.2 * size;
    aura.userData.isBossAura = true;
    g.add(aura);
  }

  g.position.y = 0.9 * size;
  return g;
}

// ============ СПАВН ============
function spawnEnemy(isBoss = false, forcedType = null) {
  if (!isGameActive) return;
  const lvl = LEVELS[currentLevel] || LEVELS[1];
  if (!isBoss && enemies.length >= lvl.maxEnemies) return;

  let type = 'melee';
  if (!isBoss) {
    if (forcedType) {
      type = forcedType;
    } else {
      const r = Math.random();
      if (r < lvl.shooterChance) type = 'shooter';
      else if (r < lvl.shooterChance + lvl.grenadierChance) type = 'grenadier';
    }
  }

  const e = createZombie(isBoss, type);
  const range = isBoss ? 20 : 45;
  const sides = [[-range,0],[range,0],[0,-range],[0,range],[-range,-range],[-range,range],[range,-range],[range,range]];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random() - 0.5) * 3, 0.9 * (isBoss ? 1.8 : 1), s[1] + (Math.random() - 0.5) * 3);

  const baseHealth = isBoss ? 2000 : lvl.enemyHealth;
  e.userData = {
    type, isBoss: !!isBoss,
    health: baseHealth, maxHealth: baseHealth,
    speed: isBoss ? 1.5 : lvl.enemySpeed + Math.random() * 0.3,
    radius: isBoss ? 1.2 : 0.5,
    walkPhase: Math.random() * Math.PI * 2,
    nextShotTime: performance.now() + 2000 + Math.random() * 3000,
    weaponDrop: type === 'shooter' ? 'rifle' : (type === 'grenadier' ? 'shotgun' : 'pistol'),
    phase: 1,
    nextSummonTime: performance.now() + 8000,
    phaseChanged: false
  };
  scene.add(e);
  e.userData.lastShot = 0;
  e.userData.nextGroan = performance.now() + Math.random() * 5000;
  enemies.push(e);
  if (isBoss) {
    currentBoss = e;
    bossMaxHealth = e.userData.maxHealth;
    bossPhase = 1;
    playBossRoar();
    showMessage('👹 БОСС ПРОБУДИЛСЯ!', 3000);
    shakeAmount = 1;
  }
}

// ============ БОСС: ФАЗЫ ============
function checkBossPhase() {
  if (!currentBoss || !currentBoss.userData) return;
  const hpRatio = currentBoss.userData.health / currentBoss.userData.maxHealth;
  const ud = currentBoss.userData;
  let newPhase = 1;
  if (hpRatio <= 0.33) newPhase = 3;
  else if (hpRatio <= 0.66) newPhase = 2;

  if (newPhase !== ud.phase) {
    ud.phase = newPhase;
    bossPhase = newPhase;
    playBossRoar();
    shakeAmount = 1;

    // Визуальные изменения
    currentBoss.traverse(child => {
      if (child.isMesh && child.material && child.material.color) {
        if (newPhase === 2) {
          child.material = child.material.clone();
          child.material.color.setHex(0x8a3a1a);
        } else if (newPhase === 3) {
          child.material = child.material.clone();
          child.material.color.setHex(0xaa0000);
        }
      }
      if (child.userData.isBossAura) {
        child.intensity = 1.5 + newPhase * 1.5;
        child.distance = 8 + newPhase * 4;
        child.color.setHex(newPhase === 3 ? 0xff0000 : 0xff6600);
      }
    });

    const phaseTexts = {
      2: '⚡ ФАЗА 2: Ярость!',
      3: '💀 ФАЗА 3: БЕЗУМИЕ!'
    };
    showMessage(phaseTexts[newPhase], 2500);
    updateHUD();
  }
}

// ============ ГРАНАТА ИГРОКА ============
function throwPlayerGrenade() {
  if (!isGameActive || playerGrenades <= 0) return;
  playerGrenades--;

  const grenade = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, metalness: 0.8, roughness: 0.2 })
  );
  const startPos = camera.position.clone();
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  grenade.position.copy(startPos).add(forward.clone().multiplyScalar(0.5));
  grenade.position.y -= 0.2;

  const velocity = forward.clone().multiplyScalar(15);
  velocity.y += 6;
  grenade.userData = {
    velocity,
    life: 2.5,
    damage: 80,
    radius: 8,
    isPlayer: true,
    startTime: performance.now()
  };
  scene.add(grenade);
  grenades.push(grenade);
  playClickSound(300, 0.05);
  updateHUD();
}

let gameStartTime = 0;
let waveEnemiesRemaining = 0;
let waveSpawnTimer = null;
let messageTimeout = null;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// ============ ЗАПУСК ИГРЫ ============
function startGame(level = 1, survival = null) {
  currentLevel = level;
  survivalMode = survival;
  survivalActive = !!survival;
  score = 0;
  health = getMaxHealth();
  wave = 1;
  hitsTaken = 0;
  medkits = 2;
  playerGrenades = 3;
  bossPhase = 1;
  enemies.forEach(e => scene.remove(e)); enemies = [];
  enemyBullets.forEach(b => scene.remove(b)); enemyBullets = [];
  grenades.forEach(g => scene.remove(g)); grenades = [];
  lootCrates.forEach(l => scene.remove(l)); lootCrates = [];
  corpses.forEach(c => scene.remove(c)); corpses = [];
  bloodStains.forEach(b => scene.remove(b)); bloodStains = [];
  particles.forEach(p => scene.remove(p)); particles = [];
  currentBoss = null;
  bossMaxHealth = 0;
  isGameActive = true;
  reloading = false;
  lastShotTime = 0;
  isMouseDown = false;
  yaw = 0; pitch = 0; recoilPitch = 0;
  verticalVelocity = 0; playerY = 1.7; isJumping = false;
  bobPhase = 0; breathPhase = 0; shakeAmount = 0;
  slowMotionFactor = 1.0; slowMotionTimer = 0;
  keys.w = keys.a = keys.s = keys.d = false;

  buildLevelEnvironment(level);
  createWeapon(currentWeapon);
  updateHUD();
  showMessage(survival ? `Режим выживания: ${survival.name}` : `Уровень ${level}: ${LEVELS[level].name}`, 2000);
  startHorrorAmbient();
  startDynamicMusic();
  startWave();
  document.getElementById('mainMenu')?.classList.add('hidden');
  document.getElementById('hud')?.classList.remove('hidden');
  gameStartTime = performance.now();
}

function startWave() {
  const lvl = LEVELS[currentLevel] || LEVELS[1];
  const mode = survivalMode;
  const maxEnemies = mode ? mode.maxEnemies : lvl.maxEnemies;
  const spawnInterval = mode ? mode.spawnInterval : 3000;
  waveEnemiesRemaining = mode ? 10 + wave * 3 : 5 + wave * 2;
  showMessage(`Волна ${wave}`, 1500);
  updateHUD();

  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  waveSpawnTimer = setInterval(() => {
    if (!isGameActive) return;
    if (enemies.length >= maxEnemies) return;
    if (waveEnemiesRemaining <= 0) {
      clearInterval(waveSpawnTimer);
      waveSpawnTimer = null;
      checkWaveComplete();
      return;
    }
    spawnEnemy(false);
    waveEnemiesRemaining--;
  }, spawnInterval);

  // На 8 уровне — босс появляется на последней волне
  if (lvl.boss && wave === lvl.waves && !currentBoss) {
    setTimeout(() => { if (isGameActive && !currentBoss) spawnEnemy(true); }, 3000);
  }
}

function checkWaveComplete() {
  if (enemies.length === 0 && waveEnemiesRemaining <= 0) {
    const lvl = LEVELS[currentLevel] || LEVELS[1];
    if (lvl.boss && wave >= lvl.waves && currentBoss) return; // ждём убийства босса
    if (wave >= lvl.waves && !lvl.boss) completeLevel();
    else if (lvl.boss && wave >= lvl.waves && !currentBoss) completeLevel();
    else { wave++; startWave(); }
  }
}

function completeLevel() {
  isGameActive = false;
  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  stopHorrorAmbient();
  stopDynamicMusic();
  const stars = health > getMaxHealth() * 0.75 ? 3 : health > getMaxHealth() * 0.4 ? 2 : 1;
  const coinsEarned = Math.floor(score / 10) + stars * 50;
  PROGRESS.coins += coinsEarned;
  PROGRESS.levels[currentLevel].completed = true;
  PROGRESS.levels[currentLevel].stars = Math.max(PROGRESS.levels[currentLevel].stars, stars);
  if (PROGRESS.levels[currentLevel + 1]) PROGRESS.levels[currentLevel + 1].unlocked = true;
  saveProgress();
  updateCoinsDisplay();
  renderLevelGrid();
  showMessage(`Уровень пройден! Звёзд: ${stars}, монет: ${coinsEarned}`, 4000);
  setTimeout(() => {
    document.getElementById('hud')?.classList.add('hidden');
    showMainMenu();
  }, 3000);
}

function gameOver() {
  isGameActive = false;
  if (waveSpawnTimer) clearInterval(waveSpawnTimer);
  stopHorrorAmbient();
  stopDynamicMusic();
  showMessage('Вы погибли...', 3000);
  setTimeout(() => {
    document.getElementById('hud')?.classList.add('hidden');
    showMainMenu();
  }, 2500);
}

// ============ ОБНОВЛЕНИЕ ВРАГОВ ============
function updateEnemies(delta) {
  if (!isGameActive) return;
  const now = performance.now();
  const playerPos = camera.position;

  // Проверка фаз босса
  if (currentBoss) checkBossPhase();

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const ud = e.userData;
    if (ud.health <= 0) {
      createCorpse(e);
      if (ud.isBoss) {
        currentBoss = null;
        addScore(5000);
        addCoins(500);
        createLootCrate(e.position.clone(), 'sniper');
        showMessage('💀 БОСС ПОВЕРЖЕН!', 3000);
        stopDynamicMusic();
      } else {
        addScore(100);
        if (Math.random() < 0.3) createLootCrate(e.position.clone(), ud.weaponDrop);
      }
      scene.remove(e);
      enemies.splice(i, 1);
      checkWaveComplete();
      continue;
    }

    const dir = new THREE.Vector3().subVectors(playerPos, e.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist > 0.1) {
      dir.normalize();
      let speedMult = ud.speed;
      if (ud.isBoss) {
        // Фаза 2+ — босс быстрее
        if (ud.phase === 2) speedMult *= 1.3;
        else if (ud.phase === 3) speedMult *= 1.6;
      }
      const speed = speedMult * (survivalMode ? survivalMode.enemySpeed : 1);
      const move = dir.clone().multiplyScalar(speed * delta);
      const newPos = e.position.clone().add(move);
      newPos.x = clamp(newPos.x, -46, 46);
      newPos.z = clamp(newPos.z, -46, 46);
      e.position.copy(newPos);
      e.lookAt(playerPos.x, e.position.y, playerPos.z);
    }

    ud.walkPhase += delta * 6;
    e.children.forEach((child, idx) => {
      if (child.geometry && child.geometry.type === 'CylinderGeometry' && idx >= 4 && idx <= 7) {
        child.rotation.x = Math.sin(ud.walkPhase) * 0.4;
      }
    });

    if (now > ud.nextGroan) {
      playZombieGroan(e.position);
      ud.nextGroan = now + 3000 + Math.random() * 5000;
    }

    // Ближний бой
    if (dist < (ud.isBoss ? 2.5 : 1.5)) {
      if (now - ud.lastShot > 1000) {
        ud.lastShot = now;
        const dmg = (ud.isBoss ? 20 : 8) * (survivalMode ? survivalMode.enemyDamage : 1);
        takeDamage(dmg);
      }
    }

    // ===== ЛОГИКА БОССА ПО ФАЗАМ =====
    if (ud.isBoss) {
      // ФАЗА 2+: призыв миньонов каждые 10 сек
      if (ud.phase >= 2 && now > ud.nextSummonTime) {
        ud.nextSummonTime = now + 10000;
        for (let k = 0; k < 2 + ud.phase; k++) {
          const offset = new THREE.Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
          const summonPos = e.position.clone().add(offset);
          const minion = createZombie(false, 'melee');
          minion.position.copy(summonPos);
          minion.position.y = 0.9;
          const baseHealth = LEVELS[currentLevel].enemyHealth;
          minion.userData = {
            type: 'melee', isBoss: false,
            health: baseHealth, maxHealth: baseHealth,
            speed: LEVELS[currentLevel].enemySpeed,
            radius: 0.5, walkPhase: 0,
            nextShotTime: now + 99999,
            weaponDrop: 'pistol',
            phase: 1, phaseChanged: false
          };
          scene.add(minion);
          enemies.push(minion);
        }
        // Эффект призыва
        const flash = new THREE.PointLight(0xff4400, 3, 10);
        flash.position.copy(e.position);
        scene.add(flash);
        setTimeout(() => scene.remove(flash), 200);
      }

      // ФАЗА 3: стрельба + гранаты
      if (ud.phase >= 3 && now > ud.nextShotTime) {
        ud.nextShotTime = now + 1000 + Math.random() * 1500;
        if (dist < 30 && dist > 3) {
          if (Math.random() < 0.6) enemyShoot(e, playerPos);
          else throwGrenade(e, playerPos);
        }
      }
    }
    // ===== ОБЫЧНЫЕ ВРАГИ =====
    else if ((ud.type === 'shooter' || ud.type === 'grenadier') && now > ud.nextShotTime) {
      if (dist < 30 && dist > 3) {
        ud.nextShotTime = now + 1500 + Math.random() * 2000;
        if (ud.type === 'shooter') enemyShoot(e, playerPos);
        else throwGrenade(e, playerPos);
      }
    }
  }
}

function enemyShoot(e, target) {
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3300 }));
  bullet.position.copy(e.position).add(new THREE.Vector3(0, e.userData.isBoss ? 2 : 1.2, 0));
  const dir = new THREE.Vector3().subVectors(target, bullet.position).normalize();
  bullet.userData = { velocity: dir.multiplyScalar(25), life: 3, damage: e.userData.isBoss ? 15 : 10 };
  scene.add(bullet);
  enemyBullets.push(bullet);
  playShootSoundEnhanced();
}

function throwGrenade(e, target) {
  const grenade = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, metalness: 0.8, roughness: 0.2 })
  );
  grenade.position.copy(e.position).add(new THREE.Vector3(0, e.userData.isBoss ? 2 : 1.2, 0));
  const dir = new THREE.Vector3().subVectors(target, grenade.position).normalize();
  grenade.userData = {
    velocity: dir.multiplyScalar(12).add(new THREE.Vector3(0, 5, 0)),
    life: 2.5, damage: 40, radius: 6, isPlayer: false
  };
  scene.add(grenade);
  grenades.push(grenade);
}

function updateBullets(delta) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.userData.life -= delta;
    b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
    if (b.userData.life <= 0 || b.position.length() > 100) {
      scene.remove(b); enemyBullets.splice(i, 1); continue;
    }
    if (b.position.distanceTo(camera.position) < 1) {
      takeDamage(b.userData.damage * (survivalMode ? survivalMode.enemyDamage : 1));
      scene.remove(b); enemyBullets.splice(i, 1);
    }
  }
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.userData.life -= delta;
    g.userData.velocity.y -= GRAVITY * delta;
    g.position.add(g.userData.velocity.clone().multiplyScalar(delta));
    if (g.position.y < 0.2) { g.userData.velocity.y *= -0.5; g.position.y = 0.2; }
    if (g.userData.life <= 0) {
      explodeGrenade(g.position, g.userData.damage, g.userData.radius, g.userData.isPlayer);
      scene.remove(g); grenades.splice(i, 1);
    }
  }
}

function explodeGrenade(pos, damage, radius, isPlayer) {
  playExplosionSound(pos);
  const dist = pos.distanceTo(camera.position);
  // Урон игроку — только от вражеских гранат
  if (!isPlayer && dist < radius) takeDamage(damage * (1 - dist / radius));

  // Урон зомби — от любых гранат
  enemies.forEach(e => {
    const d = pos.distanceTo(e.position);
    if (d < radius) e.userData.health -= damage * (1 - d / radius);
  });

  const flash = new THREE.PointLight(0xff6600, 3, radius * 2);
  flash.position.copy(pos);
  scene.add(flash);
  setTimeout(() => scene.remove(flash), 100);

  // Частицы взрыва
  for (let i = 0; i < 15; i++) {
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 12,
      Math.random() * 6 + 2,
      (Math.random() - 0.5) * 12
    );
    spawnParticle(pos, vel, i % 2 === 0 ? 0xff6600 : 0xffaa00, 0.08 + Math.random() * 0.06, 0.6 + Math.random() * 0.4, true);
  }
}

// ============ УРОН И ЗДОРОВЬЕ ============
function takeDamage(amount) {
  if (!isGameActive) return;
  health -= amount;
  hitsTaken++;
  shakeAmount = Math.min(1, shakeAmount + 0.3);
  playHurtSoundEnhanced();
  updateHUD();
  if (health <= 0) { health = 0; gameOver(); }
}

function healPlayer(amount) {
  health = Math.min(getMaxHealth(), health + amount);
  playHealSoundEnhanced();
  updateHUD();
}

function useMedkit() {
  if (medkits > 0 && health < getMaxHealth()) {
    medkits--;
    healPlayer(50);
    updateHUD();
  }
}

function addScore(points) { score += points; updateHUD(); }
function addCoins(amount) { PROGRESS.coins += amount; saveProgress(); updateCoinsDisplay(); }

// ============ ЛУТ ============
function createLootCrate(pos, weaponKey) {
  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.5, roughness: 0.5 })
  );
  crate.position.copy(pos);
  crate.position.y = 0.3;
  crate.userData = { weapon: weaponKey, ammo: WEAPONS[weaponKey]?.maxAmmo || 15, type: 'weapon' };
  scene.add(crate);
  lootCrates.push(crate);
}

function updateLoot(delta) {
  const playerPos = camera.position;
  nearLootCrate = null;
  lootCrates.forEach(crate => {
    crate.rotation.y += delta * 2;
    if (crate.position.distanceTo(playerPos) < 2.5) nearLootCrate = crate;
  });
  if (nearLootCrate) showMessage('Нажмите E чтобы подобрать', 100);
}

function pickupLoot() {
  if (!nearLootCrate) return;
  const w = nearLootCrate.userData.weapon;
  if (WEAPONS[w]) {
    WEAPONS[w].ammo = WEAPONS[w].maxAmmo;
    playPickupSound();
    addScore(50);
  }
  scene.remove(nearLootCrate);
  lootCrates = lootCrates.filter(c => c !== nearLootCrate);
  nearLootCrate = null;
  updateHUD();
}

// ============ ТРУПЫ И КРОВЬ ============
function createCorpse(enemy) {
  const corpse = enemy.clone();
  corpse.rotation.x = Math.PI / 2;
  corpse.position.y = 0.1;
  corpse.traverse(child => { if (child.isMesh) child.material = child.material.clone(); });
  scene.add(corpse);
  corpses.push(corpse);
  setTimeout(() => {
    scene.remove(corpse);
    corpses = corpses.filter(c => c !== corpse);
  }, 10000);
  createBloodStain(enemy.position);
}

function createBloodStain(pos) {
  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(0.8, 8),
    new THREE.MeshBasicMaterial({ color: 0x6a0000, transparent: true, opacity: 0.7 })
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.set(pos.x, 0.02, pos.z);
  scene.add(stain);
  bloodStains.push(stain);
  setTimeout(() => {
    scene.remove(stain);
    bloodStains = bloodStains.filter(s => s !== stain);
  }, 15000);
}

// ============ СТРЕЛЬБА ИГРОКА ============
function shoot() {
  if (!isGameActive || reloading) return;
  const w = WEAPONS[currentWeapon];
  const now = performance.now();
  if (now - lastShotTime < w.cooldown) return;
  if (w.ammo <= 0) { reload(); return; }
  lastShotTime = now;
  w.ammo--;
  playShootSoundEnhanced();
  recoilPitch = 0.02 + Math.random() * 0.02;
  shakeAmount = Math.min(1, shakeAmount + 0.1);

  const flash = weaponGroup?.userData?.flash;
  if (flash) { flash.intensity = 3; setTimeout(() => { flash.intensity = 0; }, 50); }

  createMuzzleSmoke();
  createShellCasing();

  const dmgMult = getDamageMultiplier();
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spread = w.spread;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x += (Math.random() - 0.5) * spread * 2;
    dir.y += (Math.random() - 0.5) * spread * 2;
    dir.z += (Math.random() - 0.5) * spread * 2;
    dir.normalize();

    const raycaster = new THREE.Raycaster(camera.position, dir);
    const intersects = raycaster.intersectObjects(enemies, true);
    if (intersects.length > 0) {
      const hit = intersects[0];
      let enemyObj = hit.object;
      while (enemyObj.parent && !enemies.includes(enemyObj)) enemyObj = enemyObj.parent;
      if (enemies.includes(enemyObj)) {
        const isHead = hit.object.userData && hit.object.userData.isHead === true;
        const multiplier = isHead ? 3 : 1;
        enemyObj.userData.health -= w.damage * multiplier * dmgMult;
        playHitSoundEnhanced();
        createBloodBurst(hit.point, isHead);
        if (isHead) { playHeadshotSound(); addScore(25); showHitmarker(true); }
        else { addScore(10); showHitmarker(false); }
      }
    } else {
      const wallIntersects = raycaster.intersectObjects(obstacles, true);
      if (wallIntersects.length > 0) {
        createBulletHole(wallIntersects[0].point, wallIntersects[0].face.normal);
        const wp = wallIntersects[0].point;
        for (let j = 0; j < 6; j++) {
          const vel = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 2 + 0.5, (Math.random() - 0.5) * 3);
          spawnParticle(wp, vel, 0xaaaaaa, 0.04, 0.5, true);
        }
      }
    }
  }
  updateHUD();
}

function createBulletHole(pos, normal) {
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 6),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.8 })
  );
  hole.position.copy(pos).add(normal.clone().multiplyScalar(0.01));
  hole.lookAt(pos.clone().add(normal));
  scene.add(hole);
  setTimeout(() => scene.remove(hole), 5000);
}

function reload() {
  if (reloading) return;
  const w = WEAPONS[currentWeapon];
  if (w.ammo === w.maxAmmo) return;
  reloading = true;
  playReloadSoundEnhanced();
  const actualReload = w.reload * getReloadMultiplier();
  showMessage('Перезарядка...', actualReload);
  setTimeout(() => {
    w.ammo = w.maxAmmo;
    reloading = false;
    updateHUD();
  }, actualReload);
}

function switchWeapon(key) {
  if (!WEAPONS[key]) return;
  if (!PROGRESS.ownedWeapons.includes(key)) return;
  currentWeapon = key;
  createWeapon(key);
  updateHUD();
}

// ============ УПРАВЛЕНИЕ ============
function setupControls() {
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = true;
    if (k === 'a') keys.a = true;
    if (k === 's') keys.s = true;
    if (k === 'd') keys.d = true;
    if (k === 'r') reload();
    if (k === 'e') pickupLoot();
    if (k === 'q') useMedkit();
    if (k === 'g') throwPlayerGrenade();
    if (k === '1') switchWeapon('pistol');
    if (k === '2') switchWeapon('rifle');
    if (k === '3') switchWeapon('shotgun');
    if (k === '4') switchWeapon('sniper');
    if (k === '5') switchWeapon('dualPistols');
    if (k === '6') switchWeapon('flamethrower');
    if (k === 'f') { if (flashlight) flashlight.visible = !flashlight.visible; }
    if (k === 'escape') { if (isGameActive) { isGameActive = false; stopHorrorAmbient(); stopDynamicMusic(); showMainMenu(); } }
    if (k === ' ') { e.preventDefault(); jump(); }
  });
  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w') keys.w = false;
    if (k === 'a') keys.a = false;
    if (k === 's') keys.s = false;
    if (k === 'd') keys.d = false;
  });
  document.addEventListener('mousemove', (e) => {
    if (!isGameActive) return;
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= e.movementX * MOUSE_SENSITIVITY;
      pitch -= e.movementY * MOUSE_SENSITIVITY;
      pitch = clamp(pitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
    }
  });
  document.addEventListener('mousedown', (e) => {
    if (!isGameActive) return;
    if (e.button === 0) {
      isMouseDown = true;
      if (!document.pointerLockElement) renderer.domElement.requestPointerLock();
      shoot();
    }
    if (e.button === 2) { e.preventDefault(); throwPlayerGrenade(); }
  });
  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) isMouseDown = false;
  });
  document.addEventListener('contextmenu', (e) => { if (isGameActive) e.preventDefault(); });
  if (isMobile) setupMobileControls();
}

function jump() {
  if (!isJumping && isGameActive) {
    verticalVelocity = JUMP_POWER;
    isJumping = true;
  }
}

function setupMobileControls() {
  const joystickZone = document.getElementById('joystickZone');
  const lookZone = document.getElementById('lookZone');
  if (!joystickZone || !lookZone) return;

  joystickZone.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    joystickActive = true; joystickTouchId = t.identifier;
    joystickStartX = t.clientX; joystickStartY = t.clientY;
    joystickDeltaX = 0; joystickDeltaY = 0;
  }, { passive: true });
  joystickZone.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joystickTouchId) {
        joystickDeltaX = t.clientX - joystickStartX;
        joystickDeltaY = t.clientY - joystickStartY;
        const maxDist = 50;
        const dist = Math.hypot(joystickDeltaX, joystickDeltaY);
        if (dist > maxDist) {
          joystickDeltaX = (joystickDeltaX / dist) * maxDist;
          joystickDeltaY = (joystickDeltaY / dist) * maxDist;
        }
      }
    }
  }, { passive: true });
  joystickZone.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joystickTouchId) {
        joystickActive = false; joystickTouchId = null;
        joystickDeltaX = 0; joystickDeltaY = 0;
      }
    }
  }, { passive: true });

  lookZone.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    lookTouchId = t.identifier;
    lookLastX = t.clientX; lookLastY = t.clientY;
  }, { passive: true });
  lookZone.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === lookTouchId) {
        yaw -= (t.clientX - lookLastX) * 0.005;
        pitch -= (t.clientY - lookLastY) * 0.005;
        pitch = clamp(pitch, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
        lookLastX = t.clientX; lookLastY = t.clientY;
      }
    }
  }, { passive: true });
  lookZone.addEventListener('touchend', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === lookTouchId) lookTouchId = null;
    }
  }, { passive: true });
}

// ============ ОБНОВЛЕНИЕ ИГРОКА ============
function updatePlayer(delta) {
  if (!isGameActive) return;
  const speed = 5.0 * (isMobile ? 0.8 : 1);
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();

  if (keys.w) move.add(forward);
  if (keys.s) move.sub(forward);
  if (keys.a) move.sub(right);
  if (keys.d) move.add(right);
  if (isMobile && joystickActive) {
    move.add(forward.clone().multiplyScalar(-joystickDeltaY / 50));
    move.add(right.clone().multiplyScalar(joystickDeltaX / 50));
  }

  if (move.length() > 0) {
    move.normalize();
    const newPos = camera.position.clone().add(move.multiplyScalar(speed * delta));
    let canMove = true;
    for (const obs of obstacles) {
      if (obs.userData.size) {
        const half = new THREE.Vector3(obs.userData.size.x / 2, 0, obs.userData.size.z / 2);
        if (Math.abs(newPos.x - obs.position.x) < half.x + 0.5 &&
            Math.abs(newPos.z - obs.position.z) < half.z + 0.5) { canMove = false; break; }
      }
    }
    if (canMove) {
      newPos.x = clamp(newPos.x, -47, 47);
      newPos.z = clamp(newPos.z, -47, 47);
      camera.position.x = newPos.x;
      camera.position.z = newPos.z;
    }
    if (footstepTimer <= 0) { playFootstepSound(); footstepTimer = 0.5; }
  }

  if (isJumping) {
    verticalVelocity -= GRAVITY * delta;
    playerY += verticalVelocity * delta;
    if (playerY <= 1.7) { playerY = 1.7; verticalVelocity = 0; isJumping = false; }
  }
  camera.position.y = playerY;

  bobPhase += delta * (move.length() > 0 ? 10 : 2);
  breathPhase += delta * 1.5;
  const bobAmount = move.length() > 0 ? 0.05 : 0.01;
  camera.position.y += Math.sin(bobPhase) * bobAmount;
  camera.position.x += Math.cos(bobPhase * 0.5) * bobAmount * 0.5;

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch + recoilPitch;
  recoilPitch *= 0.9;

  if (shakeAmount > 0) {
    camera.rotation.x += (Math.random() - 0.5) * shakeAmount * 0.05;
    camera.rotation.y += (Math.random() - 0.5) * shakeAmount * 0.05;
    shakeAmount *= 0.9;
  }
  footstepTimer -= delta;
}

// ============ АНИМАЦИЯ ============
function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);
  if (isGameActive) {
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateLoot(delta);
    updateParticles(delta);
    updateMusicIntensity();
  }
  if (isMouseDown && isGameActive) {
    const w = WEAPONS[currentWeapon];
    if (w.auto) shoot();
  }
  if (isGameActive && performance.now() % 100 < 20) updateHUD();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

// ============ UI ============
function setupUI() {
  if (!document.getElementById('hud')) {
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.className = 'hidden';
    hud.innerHTML = `
      <div id="healthBar"><div id="healthFill"></div></div>
      <div id="ammoDisplay">Патроны: <span id="ammoCount">30</span></div>
      <div id="scoreDisplay">Очки: <span id="scoreValue">0</span></div>
      <div id="waveDisplay">Волна: <span id="waveValue">1</span></div>
      <div id="medkitDisplay">Аптечки: <span id="medkitCount">2</span></div>
      <div id="grenadeDisplay">💣 <span id="grenadeCount">3</span></div>
      <div id="bossBar" class="hidden"><div id="bossFill"></div><div id="bossLabel">БОСС</div></div>
      <div id="messageBox"></div>
      <div id="hitmarker">✕</div>
    `;
    document.body.appendChild(hud);
  }

  if (!document.getElementById('mainMenu')) {
    const menu = document.createElement('div');
    menu.id = 'mainMenu';
    menu.innerHTML = `
      <h1>ZOMBIESHOOT v15.0</h1>
      <div id="levelGrid"></div>
      <div id="coinsDisplay">💰 Монеты: <span id="coinsValue">0</span></div>
      <button id="survivalBtn">Режим выживания</button>
      <button id="shopBtn">🛒 Магазин</button>
      <button id="horrorToggle">Хоррор-режим: ВКЛ</button>
      <button id="resetBtn">Сбросить прогресс</button>
    `;
    document.body.appendChild(menu);
    document.getElementById('survivalBtn').onclick = () => {
      const mode = prompt('Выберите режим: easy, normal, hard, nightmare', 'normal');
      if (SURVIVAL_MODES[mode]) startGame(1, SURVIVAL_MODES[mode]);
    };
    document.getElementById('shopBtn').onclick = showShop;
    document.getElementById('horrorToggle').onclick = toggleHorrorMode;
    document.getElementById('resetBtn').onclick = () => { if (confirm('Сбросить прогресс?')) resetProgress(); };
  }

  if (!document.getElementById('shopModal')) {
    const shop = document.createElement('div');
    shop.id = 'shopModal';
    shop.className = 'hidden';
    shop.innerHTML = `
      <div class="shopContent">
        <div class="shopHeader">
          <h2>🛒 Магазин</h2>
          <div class="shopCoins">💰 <span id="shopCoins">0</span></div>
          <button class="closeBtn" onclick="hideShop()">✕</button>
        </div>
        <div class="shopTabs">
          <button class="shopTab active" data-tab="weapons">🔫 Оружие</button>
          <button class="shopTab" data-tab="skins">👤 Скины</button>
          <button class="shopTab" data-tab="upgrades">⬆️ Апгрейды</button>
        </div>
        <div id="shopBody" class="shopBody"></div>
      </div>
    `;
    document.body.appendChild(shop);
    shop.querySelectorAll('.shopTab').forEach(tab => {
      tab.onclick = () => {
        shop.querySelectorAll('.shopTab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderShop(tab.dataset.tab);
      };
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    #hud { position: fixed; inset: 0; pointer-events: none; z-index: 10; font-family: monospace; color: #fff; }
    #healthBar { position: absolute; bottom: 20px; left: 20px; width: 200px; height: 20px; background: #333; border: 2px solid #fff; }
    #healthFill { height: 100%; width: 100%; background: #c00; transition: width 0.2s; }
    #ammoDisplay, #scoreDisplay, #waveDisplay, #medkitDisplay, #grenadeDisplay { position: absolute; bottom: 50px; right: 20px; background: rgba(0,0,0,0.5); padding: 5px 10px; }
    #scoreDisplay { top: 20px; left: 20px; bottom: auto; right: auto; }
    #waveDisplay { top: 20px; left: 50%; transform: translateX(-50%); bottom: auto; right: auto; }
    #medkitDisplay { bottom: 80px; right: 20px; }
    #grenadeDisplay { bottom: 110px; right: 20px; color: #8f8; }
    #bossBar { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); width: 60%; max-width: 600px; height: 30px; background: #1a0000; border: 3px solid #800; }
    #bossFill { height: 100%; width: 100%; background: linear-gradient(90deg, #f00, #800); transition: width 0.2s; }
    #bossLabel { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; font-weight: bold; text-shadow: 2px 2px 4px #000; letter-spacing: 3px; }
    .hidden { display: none !important; }
    #messageBox { position: absolute; top: 30%; left: 50%; transform: translateX(-50%); font-size: 24px; text-align: center; text-shadow: 2px 2px 4px #000; }
    #hitmarker { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 28px; font-weight: bold; opacity: 0; pointer-events: none; z-index: 15; transition: opacity 0.1s, transform 0.1s, font-size 0.1s, color 0.1s; text-shadow: 0 0 6px rgba(0,0,0,0.9); font-family: monospace; }
    #mainMenu { position: fixed; inset: 0; background: rgba(0,0,0,0.9); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; font-family: monospace; }
    #mainMenu.hidden { display: none; }
    #levelGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px; }
    .levelBtn { padding: 10px; background: #333; border: 2px solid #666; color: #fff; cursor: pointer; }
    .levelBtn.unlocked { border-color: #0f0; }
    .levelBtn.completed { background: #060; }
    .levelBtn.locked { opacity: 0.5; cursor: not-allowed; }
    #coinsDisplay { margin: 10px; font-size: 20px; }
    button { padding: 10px 20px; margin: 5px; background: #444; color: #fff; border: 2px solid #888; cursor: pointer; font-size: 16px; }
    button:hover { background: #666; }
    #shopModal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 200; display: flex; align-items: center; justify-content: center; font-family: monospace; color: #fff; }
    .shopContent { background: #1a1a1a; border: 2px solid #555; width: 90%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; border-radius: 8px; overflow: hidden; }
    .shopHeader { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; background: #222; border-bottom: 2px solid #555; }
    .shopHeader h2 { margin: 0; }
    .shopCoins { font-size: 20px; color: #fc0; }
    .closeBtn { background: #800; padding: 5px 12px; font-size: 18px; border: 2px solid #c00; margin: 0; }
    .closeBtn:hover { background: #c00; }
    .shopTabs { display: flex; background: #222; border-bottom: 2px solid #555; }
    .shopTab { flex: 1; margin: 0; border: none; border-radius: 0; padding: 12px; background: #222; color: #aaa; }
    .shopTab.active { background: #444; color: #fff; border-bottom: 3px solid #0f0; }
    .shopBody { padding: 20px; overflow-y: auto; flex: 1; }
    .shopGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
    .shopItem { background: #2a2a2a; border: 2px solid #444; border-radius: 6px; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
    .shopItem.owned { border-color: #0a0; }
    .shopItem.equipped { border-color: #fc0; background: #3a3000; }
    .shopItem .itemIcon { font-size: 36px; text-align: center; }
    .shopItem .itemName { font-size: 18px; font-weight: bold; text-align: center; }
    .shopItem .itemDesc { font-size: 12px; color: #aaa; text-align: center; min-height: 30px; }
    .shopItem .itemCost { text-align: center; color: #fc0; font-size: 16px; }
    .shopItem button { margin: 0; padding: 8px; width: 100%; }
    .shopItem button:disabled { opacity: 0.5; cursor: not-allowed; }
    .upgradeBar { display: flex; justify-content: center; gap: 4px; margin: 5px 0; }
    .upgradeBar .pip { width: 20px; height: 10px; background: #333; border-radius: 2px; }
    .upgradeBar .pip.filled { background: #0f0; }
  `;
  document.head.appendChild(style);

  if (isMobile) {
    const mobileUI = document.createElement('div');
    mobileUI.id = 'mobileUI';
    mobileUI.innerHTML = `
      <div id="joystickZone" style="position:fixed;bottom:20px;left:20px;width:120px;height:120px;background:rgba(255,255,255,0.1);border-radius:50%;z-index:20;"></div>
      <div id="lookZone" style="position:fixed;top:0;right:0;width:50%;height:100%;z-index:19;"></div>
      <button id="shootBtn" style="position:fixed;bottom:30px;right:30px;width:80px;height:80px;border-radius:50%;z-index:21;">🔫</button>
      <button id="grenadeBtn" style="position:fixed;bottom:120px;right:120px;width:60px;height:60px;border-radius:50%;z-index:21;">💣</button>
      <button id="reloadBtn" style="position:fixed;bottom:120px;right:30px;width:60px;height:60px;border-radius:50%;z-index:21;">🔄</button>
    `;
    document.body.appendChild(mobileUI);
    document.getElementById('shootBtn').addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); });
    document.getElementById('reloadBtn').addEventListener('touchstart', (e) => { e.preventDefault(); reload(); });
    document.getElementById('grenadeBtn').addEventListener('touchstart', (e) => { e.preventDefault(); throwPlayerGrenade(); });
  }
}

function updateHUD() {
  const healthFill = document.getElementById('healthFill');
  if (healthFill) healthFill.style.width = `${(health / getMaxHealth()) * 100}%`;
  const ammoCount = document.getElementById('ammoCount');
  if (ammoCount) ammoCount.textContent = `${WEAPONS[currentWeapon]?.ammo || 0} / ${WEAPONS[currentWeapon]?.maxAmmo || 0}`;
  const scoreValue = document.getElementById('scoreValue');
  if (scoreValue) scoreValue.textContent = score;
  const waveValue = document.getElementById('waveValue');
  if (waveValue) waveValue.textContent = wave;
  const medkitCount = document.getElementById('medkitCount');
  if (medkitCount) medkitCount.textContent = medkits;
  const grenadeCount = document.getElementById('grenadeCount');
  if (grenadeCount) grenadeCount.textContent = playerGrenades;

  // Полоса босса
  const bossBar = document.getElementById('bossBar');
  const bossFill = document.getElementById('bossFill');
  const bossLabel = document.getElementById('bossLabel');
  if (bossBar && currentBoss && currentBoss.userData) {
    bossBar.classList.remove('hidden');
    const ratio = currentBoss.userData.health / currentBoss.userData.maxHealth;
    bossFill.style.width = (ratio * 100) + '%';
    bossLabel.textContent = `БОСС — ФАЗА ${bossPhase}`;
  } else if (bossBar) {
    bossBar.classList.add('hidden');
  }
}

function showMessage(text, duration = 2000) {
  const msg = document.getElementById('messageBox');
  if (!msg) return;
  msg.textContent = text;
  if (messageTimeout) clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => { msg.textContent = ''; }, duration);
}

function renderLevelGrid() {
  const grid = document.getElementById('levelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 8; i++) {
    const lvl = LEVELS[i];
    const prog = PROGRESS.levels[i];
    const btn = document.createElement('button');
    btn.className = `levelBtn ${prog.unlocked ? 'unlocked' : 'locked'} ${prog.completed ? 'completed' : ''}`;
    btn.innerHTML = `${lvl.icon} ${lvl.name}<br>${'★'.repeat(prog.stars)}${'☆'.repeat(3 - prog.stars)}`;
    btn.disabled = !prog.unlocked;
    btn.onclick = () => { if (prog.unlocked) startGame(i); };
    grid.appendChild(btn);
  }
}

function updateCoinsDisplay() {
  const el = document.getElementById('coinsValue');
  if (el) el.textContent = PROGRESS.coins;
  const shopEl = document.getElementById('shopCoins');
  if (shopEl) shopEl.textContent = PROGRESS.coins;
}

function showMainMenu() {
  document.getElementById('mainMenu')?.classList.remove('hidden');
  document.getElementById('hud')?.classList.add('hidden');
  document.getElementById('bossBar')?.classList.add('hidden');
  renderLevelGrid();
  updateCoinsDisplay();
}

function toggleHorrorMode() {
  horrorMode = !horrorMode;
  try { localStorage.setItem('zombieshoot_horror', horrorMode); } catch(e){}
  const btn = document.getElementById('horrorToggle');
  if (btn) btn.textContent = `Хоррор-режим: ${horrorMode ? 'ВКЛ' : 'ВЫКЛ'}`;
  if (isGameActive) buildLevelEnvironment(currentLevel);
}

// ============ МАГАЗИН ============
function showShop() {
  document.getElementById('shopModal')?.classList.remove('hidden');
  updateCoinsDisplay();
  renderShop('weapons');
}
function hideShop() { document.getElementById('shopModal')?.classList.add('hidden'); }

function renderShop(tab = 'weapons') {
  const body = document.getElementById('shopBody');
  if (!body) return;
  updateCoinsDisplay();

  if (tab === 'weapons') {
    let html = '<div class="shopGrid">';
    for (const key in WEAPONS) {
      const w = WEAPONS[key];
      const owned = PROGRESS.ownedWeapons.includes(key);
      const equipped = currentWeapon === key;
      const canAfford = PROGRESS.coins >= (w.cost || 0);
      let btnText, disabled = false;
      if (equipped) { btnText = '✅ Выбрано'; disabled = true; }
      else if (owned) { btnText = 'Выбрать'; }
      else if (canAfford) { btnText = 'Купить'; }
      else { btnText = 'Не хватает монет'; disabled = true; }
      const stats = `Урон: ${w.damage} | Магазин: ${w.maxAmmo}<br>${w.auto ? 'Авто' : 'Одиночный'} | Перезарядка: ${(w.reload/1000).toFixed(1)}с`;
      const costText = owned ? (equipped ? 'В руках' : 'Куплено') : `💰 ${w.cost}`;
      html += `
        <div class="shopItem ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
          <div class="itemIcon">${w.icon || '🔫'}</div>
          <div class="itemName">${w.name}</div>
          <div class="itemDesc">${stats}</div>
          <div class="itemCost">${costText}</div>
          <button ${disabled ? 'disabled' : ''} onclick="handleWeapon('${key}')">${btnText}</button>
        </div>`;
    }
    html += '</div>';
    body.innerHTML = html;
  } else if (tab === 'skins') {
    let html = '<div class="shopGrid">';
    for (const key in SKINS) {
      const sk = SKINS[key];
      const owned = PROGRESS.ownedSkins.includes(key);
      const equipped = PROGRESS.currentSkin === key;
      const canAfford = PROGRESS.coins >= sk.cost;
      let btnText, disabled = false;
      if (equipped) { btnText = '✅ Надет'; disabled = true; }
      else if (owned) { btnText = 'Надеть'; }
      else if (canAfford) { btnText = 'Купить'; }
      else { btnText = 'Не хватает монет'; disabled = true; }
      const costText = owned ? (equipped ? 'На персонаже' : 'Куплено') : `💰 ${sk.cost}`;
      html += `
        <div class="shopItem ${owned ? 'owned' : ''} ${equipped ? 'equipped' : ''}">
          <div class="itemIcon">👤</div>
          <div class="itemName">${sk.name}</div>
          <div class="itemDesc">Изменяет цвет зомби-игрока</div>
          <div class="itemCost">${costText}</div>
          <button ${disabled ? 'disabled' : ''} onclick="handleSkin('${key}')">${btnText}</button>
        </div>`;
    }
    html += '</div>';
    body.innerHTML = html;
  } else if (tab === 'upgrades') {
    let html = '<div class="shopGrid">';
    for (const key in UPGRADES) {
      const upg = UPGRADES[key];
      const level = PROGRESS.upgrades?.[key] || 0;
      const maxed = level >= upg.maxLevel;
      const cost = maxed ? 0 : upg.costs[level];
      const canAfford = PROGRESS.coins >= cost;
      let btnText, disabled = false;
      if (maxed) { btnText = '⭐ МАКС'; disabled = true; }
      else if (canAfford) { btnText = `Улучшить (ур. ${level+1})`; }
      else { btnText = 'Не хватает монет'; disabled = true; }
      let pips = '';
      for (let i = 0; i < upg.maxLevel; i++) pips += `<div class="pip ${i < level ? 'filled' : ''}"></div>`;
      const effectText = key === 'damage' ? `+${level*10}% урона`
                       : key === 'reload' ? `−${level*10}% перезарядки`
                       : `+${level*20} HP`;
      html += `
        <div class="shopItem ${maxed ? 'owned' : ''}">
          <div class="itemIcon">${upg.icon}</div>
          <div class="itemName">${upg.name}</div>
          <div class="itemDesc">${upg.desc}<br><b>Сейчас: ${effectText}</b></div>
          <div class="upgradeBar">${pips}</div>
          <div class="itemCost">${maxed ? '⭐ Максимум' : '💰 ' + cost}</div>
          <button ${disabled ? 'disabled' : ''} onclick="buyUpgrade('${key}')">${btnText}</button>
        </div>`;
    }
    html += '</div>';
    body.innerHTML = html;
  }
}

function handleWeapon(key) {
  if (PROGRESS.ownedWeapons.includes(key)) { switchWeapon(key); playClickSound(500, 0.05); }
  else {
    const w = WEAPONS[key];
    if (PROGRESS.coins >= w.cost) {
      PROGRESS.coins -= w.cost;
      PROGRESS.ownedWeapons.push(key);
      saveProgress(); playBuySound(); switchWeapon(key);
    } else playErrorSound();
  }
  updateCoinsDisplay(); renderShop('weapons');
}

function handleSkin(key) {
  if (PROGRESS.ownedSkins.includes(key)) {
    PROGRESS.currentSkin = key; saveProgress(); playClickSound(500, 0.05);
  } else {
    const sk = SKINS[key];
    if (PROGRESS.coins >= sk.cost) {
      PROGRESS.coins -= sk.cost;
      PROGRESS.ownedSkins.push(key);
      PROGRESS.currentSkin = key;
      saveProgress(); playBuySound();
    } else playErrorSound();
  }
  updateCoinsDisplay(); renderShop('skins');
}

function buyUpgrade(key) {
  const upg = UPGRADES[key];
  if (!upg) return;
  const level = PROGRESS.upgrades?.[key] || 0;
  if (level >= upg.maxLevel) return;
  const cost = upg.costs[level];
  if (PROGRESS.coins >= cost) {
    PROGRESS.coins -= cost;
    PROGRESS.upgrades[key] = level + 1;
    saveProgress(); playBuySound();
    updateCoinsDisplay(); renderShop('upgrades');
    if (key === 'health' && isGameActive) { health = Math.min(health + 20, getMaxHealth()); updateHUD(); }
  } else playErrorSound();
}

window.hideShop = hideShop;
window.handleWeapon = handleWeapon;
window.handleSkin = handleSkin;
window.buyUpgrade = buyUpgrade;

// ============ ЗАПУСК ============
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (composer) composer.setSize(innerWidth, innerHeight);
});

window.addEventListener('load', () => { init(); });
