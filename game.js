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
  currentSkin: 'default'
};
let PROGRESS = loadProgress();
function loadProgress() {
  try {
    const s = localStorage.getItem('zombieshoot_progress_v15');
    if (s) return Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROGRESS)), JSON.parse(s));
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
function saveProgress() { try { localStorage.setItem('zombieshoot_progress_v15', JSON.stringify(PROGRESS)); } catch(e) {} }
function resetProgress() { PROGRESS = JSON.parse(JSON.stringify(DEFAULT_PROGRESS)); saveProgress(); updateCoinsDisplay(); renderLevelGrid(); }

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
  pistol:      { name:'Пистолет', ammo:15, maxAmmo:15, damage:35, cooldown:280, spread:0.004, auto:false, reload:1100, icon:'pistol', cost:0 },
  rifle:       { name:'Автомат', ammo:30, maxAmmo:30, damage:22, cooldown:90, spread:0.012, auto:true, reload:1800, icon:'rifle', cost:0 },
  shotgun:     { name:'Дробовик', ammo:6, maxAmmo:6, damage:20, cooldown:750, spread:0.055, auto:false, reload:2000, icon:'shotgun', cost:0, pellets:10 },
  sniper:      { name:'Снайперка', ammo:5, maxAmmo:5, damage:200, cooldown:1600, spread:0.001, auto:false, reload:2600, icon:'sniper', cost:500, zoom:true },
  dualPistols: { name:'Два пистолета', ammo:30, maxAmmo:30, damage:25, cooldown:150, spread:0.022, auto:true, reload:1500, icon:'dual', cost:300 },
  flamethrower:{ name:'Огнемёт', ammo:100, maxAmmo:100, damage:6, cooldown:50, spread:0.14, auto:true, reload:3000, icon:'flame', cost:800, shortRange:12 }
};

const SKINS = {
  default:  { name:'Новобранец', body:0x3a4a2a, head:0x5a6a3a, cost:0 },
  soldier:  { name:'Солдат', body:0x2a3a2a, head:0x4a5a2a, cost:200 },
  commando: { name:'Коммандос', body:0x1a1a1a, head:0x3a3a2a, cost:500 },
  ghost:    { name:'Призрак', body:0x666666, head:0x999999, cost:1000 }
};

let scene, camera, renderer, composer;
let score = 0, health = 100, wave = 1, currentLevel = 1;
let hitsTaken = 0;
let isGameActive = false;
let enemies = [], obstacles = [], enemyBullets = [], grenades = [], lootCrates = [], corpses = [], bloodStains = [];
let currentBoss = null, bossMaxHealth = 0;
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
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(500, audioCtx.currentTime);
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
  setTimeout(() => playClickSound(120, 0.1), w.reload * 0.5);
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

  // Простые укрытия
  const obsMat = new THREE.MeshStandardMaterial({ color: horrorMode ? 0x3a2a1a : 0x6a552a, roughness: 1 });
  [[12,1,8,3,2,3],[-12,1,8,3,2,3],[12,1,-8,3,2,3],[-12,1,-8,3,2,3]].forEach(([x,y,z,sx,sy,sz]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), obsMat);
    c.position.set(x, y, z);
    c.castShadow = true; c.receiveShadow = true;
    c.userData.size = { x: sx, y: sy, z: sz };
    scene.add(c); obstacles.push(c);
  });

  // Фонарик
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
  const black = new THREE.MeshStandardMaterial({ color: 0x050505 });
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

// ============ ЗОМБИ ============
function createZombie(isBoss) {
  const g = new THREE.Group();
  const sk = SKINS[PROGRESS.currentSkin] || SKINS.default;
  const skin = new THREE.MeshStandardMaterial({ color: isBoss ? 0x6a2a2a : 0x3a5a2a });
  const uniform = new THREE.MeshStandardMaterial({ color: isBoss ? 0x4a1a1a : sk.body });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const glow = new THREE.MeshBasicMaterial({ color: isBoss ? 0xff6600 : 0xaa0000 });
  const size = isBoss ? 1.8 : 1;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * size, 0.32 * size, 1.0 * size, 8), uniform);
  torso.position.y = 0.5 * size; torso.castShadow = true; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28 * size, 12, 10), skin);
  head.position.y = 1.45 * size; head.castShadow = true; g.add(head);

  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.055 * size, 6, 6), glow);
  eL.position.set(-0.11 * size, 1.48 * size, -0.24 * size); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.055 * size, 6, 6), glow);
  eR.position.set(0.11 * size, 1.48 * size, -0.24 * size); g.add(eR);

  const legGeo = new THREE.CylinderGeometry(0.13 * size, 0.11 * size, 0.75 * size, 6);
  const lL = new THREE.Mesh(legGeo, dark);
  lL.position.set(-0.18 * size, -0.4 * size, 0); g.add(lL);
  const lR = new THREE.Mesh(legGeo, dark);
  lR.position.set(0.18 * size, -0.4 * size, 0); g.add(lR);

  g.position.y = 0.9 * size;
  return g;
}

// ============ СПАВН ============
function spawnEnemy(isBoss = false) {
  if (!isGameActive) return;
  const lvl = LEVELS[currentLevel] || LEVELS[1];
  if (!isBoss && enemies.length >= lvl.maxEnemies) return;

  const e = createZombie(isBoss);
  const range = isBoss ? 20 : 45;
  const sides = [[-range,0],[range,0],[0,-range],[0,range],[-range,-range],[-range,range],[range,-range],[range,range]];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random() - 0.5) * 3, 0.9 * (isBoss ? 1.8 : 1), s[1] + (Math.random() - 0.5) * 3);

  let type = 'melee';
  if (!isBoss) {
    const r = Math.random();
    if (r < lvl.shooterChance) type = 'shooter';
    else if (r < lvl.shooterChance + lvl.grenadierChance) type = 'grenadier';
  }

  const baseHealth = isBoss ? 1500 : lvl.enemyHealth;
  e.userData = {
    type, isBoss: !!isBoss,
    health: baseHealth, maxHealth: baseHealth,
    speed: isBoss ? 1.5 : lvl.enemySpeed + Math.random() * 0.3,
    radius: isBoss ? 1.2 : 0.5,
    walkPhase: Math.random() * Math.PI * 2,
    nextShotTime: performance.now() + 2000 + Math.random() * 3000,
    weaponDrop: type === 'shooter' ? 'rifle' : (type === 'grenadier' ? 'shotgun' : 'pistol')
  };
    scene.add(e);
  e.userData.lastShot = 0;
  e.userData.nextGroan = performance.now() + Math.random() * 5000;
  enemies.push(e);
  if (isBoss) {
    currentBoss = e;
    bossMaxHealth = e.userData.maxHealth;
  }
}
