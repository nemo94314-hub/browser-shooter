// ============ ZOMBIESHOOT v10.0 — LEVELS ============

// ============ ПРОГРЕСС (сохранение) ============
const DEFAULT_PROGRESS = {
  coins: 0,
  levels: {
    1: { unlocked: true, completed: false, stars: 0 },
    2: { unlocked: false, completed: false, stars: 0 },
    3: { unlocked: false, completed: false, stars: 0 },
    4: { unlocked: false, completed: false, stars: 0 },
    5: { unlocked: false, completed: false, stars: 0 }
  },
  ownedSkins: ['default'],
  ownedWeapons: ['pistol', 'rifle', 'shotgun'],
  currentSkin: 'default'
};
let PROGRESS = loadProgress();

function loadProgress() {
  try {
    const s = localStorage.getItem('zombieshoot_progress_v10');
    if (s) {
      const p = JSON.parse(s);
      return Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROGRESS)), p);
    }
  } catch(e) {}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
function saveProgress() {
  try { localStorage.setItem('zombieshoot_progress_v10', JSON.stringify(PROGRESS)); } catch(e) {}
}
function resetProgress() {
  PROGRESS = JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
  saveProgress();
  updateCoinsDisplay();
  renderLevelGrid();
}

// ============ УРОВНИ ============
const LEVELS = {
  1: { name:'Лагерь',       waves:1, boss:false, maxEnemies:5,  enemySpeed:1.2, enemyHealth:30, enemyDamage:0.5, shooterChance:0.3, grenadierChance:0.05 },
  2: { name:'Лес',          waves:2, boss:false, maxEnemies:7,  enemySpeed:1.4, enemyHealth:45, enemyDamage:0.6, shooterChance:0.4, grenadierChance:0.1 },
  3: { name:'База',         waves:3, boss:false, maxEnemies:9,  enemySpeed:1.6, enemyHealth:60, enemyDamage:0.7, shooterChance:0.5, grenadierChance:0.15 },
  4: { name:'Руины',        waves:4, boss:false, maxEnemies:11, enemySpeed:1.8, enemyHealth:75, enemyDamage:0.8, shooterChance:0.6, grenadierChance:0.2 },
  5: { name:'Логово Босса', waves:5, boss:true,  maxEnemies:12, enemySpeed:2.0, enemyHealth:90, enemyDamage:1.0, shooterChance:0.6, grenadierChance:0.25 }
};

// ============ ОРУЖИЕ ============
const WEAPONS = {
  pistol:      { name:'Пистолет',      ammo:15,  maxAmmo:15,  damage:35,  cooldown:280,  spread:0.004, auto:false, reload:1100 },
  rifle:       { name:'Автомат',       ammo:30,  maxAmmo:30,  damage:22,  cooldown:90,   spread:0.012, auto:true,  reload:1800 },
  shotgun:     { name:'Дробовик',      ammo:6,   maxAmmo:6,   damage:20,  cooldown:750,  spread:0.055, auto:false, reload:2000, pellets:10 },
  sniper:      { name:'Снайперка',     ammo:5,   maxAmmo:5,   damage:200, cooldown:1600, spread:0.001, auto:false, reload:2600, zoom:true, cost:500 },
  dualPistols: { name:'Два пистолета', ammo:30,  maxAmmo:30,  damage:25,  cooldown:150,  spread:0.022, auto:true,  reload:1500, cost:300 },
  flamethrower:{ name:'Огнемёт',       ammo:100, maxAmmo:100, damage:6,   cooldown:50,   spread:0.14,  auto:true,  reload:3000, shortRange:12, cost:800 }
};

// ============ СКИНЫ ============
const SKINS = {
  default:  { name:'Новобранец',  body:0x4a6b3a, head:0x7a9a4a, cost:0 },
  soldier:  { name:'Солдат',      body:0x556b3a, head:0x8aaa5a, cost:200 },
  commando: { name:'Коммандос',   body:0x2a3a2a, head:0x5a7a3a, cost:500 },
  ghost:    { name:'Призрак',     body:0x888888, head:0xcccccc, cost:1000 }
};

// ============ СОСТОЯНИЕ ИГРЫ ============
let scene, camera, renderer;
let score = 0, health = 100, wave = 1, currentLevel = 1;
let hitsTaken = 0;
let isGameActive = false;
let enemies = [], obstacles = [], enemyBullets = [], grenades = [], lootCrates = [];
let currentBoss = null;
let bossMaxHealth = 0;
let clock = new THREE.Clock();
let yaw = 0, pitch = 0, recoilPitch = 0;
let verticalVelocity = 0, playerY = 1.7, isJumping = false;
const GRAVITY = 22, JUMP_POWER = 8;
let MOUSE_SENSITIVITY = 0.002;
let volume = 0.4;
let medkits = 2;
const MAX_MEDKITS = 5;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window && window.innerWidth < 1200);
let joystickActive = false, joystickTouchId = null;
let joystickStartX = 0, joystickStartY = 0, joystickDeltaX = 0, joystickDeltaY = 0;
let lookTouchId = null, lookLastX = 0, lookLastY = 0;

let currentWeapon = 'rifle';
let reloading = false, lastShotTime = 0, isMouseDown = false;
let weaponGroup = null, audioCtx = null;
let debugMode = false, nearLootCrate = null;
const keys = { w:false, a:false, s:false, d:false };

// ============ ИНИЦИАЛИЗАЦИЯ ============
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a5c4);
  scene.fog = new THREE.Fog(0x87a5c4, 60, 130);
  const fov = isMobile ? 85 : 75;
  camera = new THREE.PerspectiveCamera(fov, innerWidth/innerHeight, 0.1, 300);
  camera.position.set(0, playerY, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(isMobile ? 1 : Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = !isMobile;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '1';
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1);
  sun.position.set(40, 60, 20);
  sun.castShadow = !isMobile;
  scene.add(sun);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ color: 0x87a5c4, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  createGround();
  createBase();
  createWeapon(currentWeapon);

  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}

  setupControls();
  animate();
  setupUI();
  renderLevelGrid();
  updateCoinsDisplay();
}

// ============ ЗЕМЛЯ ============
function createGround() {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 1 }));
  g.rotation.x = -Math.PI/2; g.receiveShadow = true; scene.add(g);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 80), new THREE.MeshStandardMaterial({ color: 0x2a2a2e }));
  road.rotation.x = -Math.PI/2; road.position.y = 0.02; scene.add(road);
}

// ============ БАЗА ============
function createBase() {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
  [
    { pos:[0,2,-48], size:[96,4,1] }, { pos:[0,2,48], size:[96,4,1] },
    { pos:[-48,2,0], size:[1,4,96] }, { pos:[48,2,0], size:[1,4,96] }
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos); wall.castShadow = true; wall.receiveShadow = true;
    wall.userData.size = { x:w.size[0], y:w.size[1], z:w.size[2] };
    scene.add(wall); obstacles.push(wall);
  });
  const hescoMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a });
  [[12,1.5,8,3,3,2],[-12,1.5,8,3,3,2],[12,1.5,-8,3,3,2],[-12,1.5,-8,3,3,2]].forEach(([x,y,z,sx,sy,sz]) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), hescoMat);
    h.position.set(x,y,z); h.castShadow = true; h.receiveShadow = true;
    h.userData.size = { x:sx, y:sy, z:sz }; scene.add(h); obstacles.push(h);
  });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6a552a });
  [[8,0.6,3],[-8,0.6,3],[8,0.6,-3],[-8,0.6,-3]].forEach(([x,y,z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), crateMat);
    c.position.set(x,y,z); c.castShadow = true; c.receiveShadow = true;
    c.userData.size = { x:1.2, y:1.2, z:1.2 }; scene.add(c); obstacles.push(c);
  });
}

// ============ ОРУЖИЕ ============
function createWeapon(type) {
  if (weaponGroup) camera.remove(weaponGroup);
  weaponGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

  if (type === 'pistol') {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.28), metal); s.position.set(0, 0.02, -0.15); weaponGroup.add(s);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), grip); g.position.set(0, -0.15, 0.02); g.rotation.x = 0.25; weaponGroup.add(g);
    weaponGroup.position.set(0.22, -0.22, -0.4);
  } else if (type === 'rifle' || type === 'sniper' || type === 'flamethrower') {
    const len = type === 'sniper' ? 0.9 : (type === 'flamethrower' ? 0.45 : 0.5);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, len), metal); b.position.set(0, 0, -len/2); weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(type === 'flamethrower' ? 0.04 : 0.018, type === 'flamethrower' ? 0.04 : 0.018, len, 8), type === 'flamethrower' ? new THREE.MeshStandardMaterial({ color: 0xcc6600 }) : metal);
    br.rotation.x = Math.PI/2; br.position.set(0, 0.01, -0.7); weaponGroup.add(br);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.09), black); mag.position.set(0, -0.15, -0.15); mag.rotation.x = 0.15; weaponGroup.add(mag);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip); g.position.set(0, -0.13, 0.05); g.rotation.x = 0.3; weaponGroup.add(g);
    if (type === 'sniper') {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), black); sc.rotation.x = Math.PI/2; sc.position.set(0, 0.1, -0.2); weaponGroup.add(sc);
    }
    weaponGroup.position.set(0.28, -0.26, -0.5);
  } else if (type === 'shotgun') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.55), metal); b.position.set(0, 0, -0.25); weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), metal); br.rotation.x = Math.PI/2; br.position.set(0, 0.03, -0.75); weaponGroup.add(br);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.2), wood); p.position.set(0, -0.03, -0.5); weaponGroup.add(p);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), wood); g.position.set(0, -0.14, 0.05); g.rotation.x = 0.3; weaponGroup.add(g);
    weaponGroup.position.set(0.3, -0.28, -0.5);
  } else if (type === 'dualPistols') {
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.24), metal); s1.position.set(-0.15, 0.02, -0.12); weaponGroup.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.24), metal); s2.position.set(0.15, 0.02, -0.12); weaponGroup.add(s2);
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip); g1.position.set(-0.15, -0.13, 0.02); g1.rotation.x = 0.25; weaponGroup.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip); g2.position.set(0.15, -0.13, 0.02); g2.rotation.x = 0.25; weaponGroup.add(g2);
    weaponGroup.position.set(0, -0.25, -0.5);
  }

  const flash = new THREE.PointLight(0xffaa00, 0, 6);
  flash.position.set(0, 0.03, -0.9);
  weaponGroup.add(flash);
  weaponGroup.userData.flash = flash;
  camera.add(weaponGroup);
}

// ============ ЗОМБИ ============
function createZombie(isBoss) {
  const g = new THREE.Group();
  const skinColors = isBoss
    ? { body: 0x6a2a2a, head: 0x8a3a3a, helmet: 0x333333 }
    : (() => { const sk = SKINS[PROGRESS.currentSkin] || SKINS.default; return { body: sk.body, head: sk.head, helmet: 0x6a7a5a }; })();
  const uniform = new THREE.MeshStandardMaterial({ color: skinColors.body });
  const skin = new THREE.MeshStandardMaterial({ color: skinColors.head });
  const metal = new THREE.MeshStandardMaterial({ color: skinColors.helmet, metalness: 0.7 });
  const glow = new THREE.MeshBasicMaterial({ color: isBoss ? 0xffaa00 : 0xff0000 });
  const size = isBoss ? 1.8 : 1;

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35*size, 0.32*size, 1.0*size, 12), uniform);
  torso.position.y = 0.5*size; torso.castShadow = true; g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28*size, 16, 12), skin);
  head.position.y = 1.45*size; head.castShadow = true; g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.34*size, 16, 10, 0, Math.PI*2, 0, Math.PI/2), metal);
  helmet.position.y = 1.55*size; helmet.castShadow = true; g.add(helmet);
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.05*size, 8, 8), glow); eL.position.set(-0.1*size, 1.48*size, -0.24*size); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.05*size, 8, 8), glow); eR.position.set(0.1*size, 1.48*size, -0.24*size); g.add(eR);
  const zGun = new THREE.Mesh(new THREE.BoxGeometry(0.15*size, 0.15*size, 0.7*size), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  zGun.position.set(0.35*size, 0.75*size, -0.5*size); g.add(zGun);
  g.position.y = 0.85*size;
  return g;
}

function spawnEnemy(isBoss = false) {
  if (!isGameActive) return;
  const lvl = LEVELS[currentLevel];
  if (!isBoss && enemies.length >= lvl.maxEnemies) return;

  const e = createZombie(isBoss);
  const range = isBoss ? 20 : 45;
  const sides = [
    [-range,-30],[-range,0],[-range,30],[range,-30],[range,0],[range,30],
    [-30,-range],[0,-range],[30,-range],[-30,range],[0,range],[30,range]
  ];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random()-0.5)*3, 0.85*(isBoss?1.8:1), s[1] + (Math.random()-0.5)*3);

  let type = 'melee';
  if (!isBoss) {
    const r = Math.random();
    if (r < lvl.shooterChance) type = 'shooter';
    else if (r < lvl.shooterChance + lvl.grenadierChance) type = 'grenadier';
  }

  const baseHealth = isBoss ? 1500 : lvl.enemyHealth;
  e.userData = {
    type, isBoss: !!isBoss,
    health: baseHealth,
    maxHealth: baseHealth,
    speed: isBoss ? 1.5 : lvl.enemySpeed + Math.random()*0.3,
    radius: isBoss ? 1.2 : 0.5,
    walkPhase: Math.random() * Math.PI * 2,
    nextShotTime: performance.now() + 2000 + Math.random()*3000,
    weaponDrop: type === 'shooter' ? 'rifle' : (type === 'grenadier' ? 'shotgun' : 'pistol')
  };
  scene.add(e);
  enemies.push(e);

  if (isBoss) {
    currentBoss = e;
    bossMaxHealth = baseHealth;
    document.getElementById('bossBar').style.display = 'block';
    document.getElementById('bossName').textContent = '💀 БОСС УРОВНЯ ' + currentLevel;
    updateBossBar();
  }
}

function updateBossBar() {
  if (!currentBoss) return;
  const pct = Math.max(0, currentBoss.userData.health / bossMaxHealth) * 100;
  document.getElementById('bossHealthFill').style.width = pct + '%';
}

// ============ КОЛЛИЗИИ ============
function checkCollision(pos, r) {
  if (Math.abs(pos.x) > 46.5 || Math.abs(pos.z) > 46.5) return true;
  for (const o of obstacles) {
    if (!o.userData.size) continue;
    const hx = o.userData.size.x/2, hz = o.userData.size.z/2;
    const topY = o.position.y + o.userData.size.y/2;
    if (topY < 0.6) continue;
    if (Math.abs(pos.x - o.position.x) < hx + r && Math.abs(pos.z - o.position.z) < hz + r) return true;
  }
  return false;
}

// ============ СТРЕЛЬБА ============
function shoot() {
  if (!isGameActive || reloading) return;
  const w = WEAPONS[currentWeapon];
  const now = performance.now();
  if (now - lastShotTime < w.cooldown) return;
  if (w.ammo <= 0) { reload(); return; }

  lastShotTime = now; w.ammo--; updateHUD();
  recoilPitch += currentWeapon === 'shotgun' ? 0.07 : (currentWeapon === 'sniper' ? 0.09 : 0.028);
  playShootSound();

  if (weaponGroup.userData.flash) {
    weaponGroup.userData.flash.intensity = 4;
    setTimeout(() => { if (weaponGroup.userData.flash) weaponGroup.userData.flash.intensity = 0; }, 60);
  }

  // Огнемёт — короткая дистанция
  const maxRange = w.shortRange || 150;
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2((Math.random()-0.5)*w.spread*2, (Math.random()-0.5)*w.spread*2), camera);
    ray.far = maxRange;
    const hits = ray.intersectObjects(enemies, true);
    const start = camera.position.clone();
    const end = start.clone().add(ray.ray.direction.clone().multiplyScalar(maxRange));
    if (hits.length > 0) {
      end.copy(hits[0].point);
      let en = hits[0].object;
      while (en.parent && !enemies.includes(en)) en = en.parent;
      if (enemies.includes(en)) {
        en.userData.health -= w.damage;
        createBlood(hits[0].point);
        showHitMarker();
        if (en.userData.health <= 0) killEnemy(en);
      }
    }
    createTracer(start, end);
  }
  if (w.ammo <= 0) setTimeout(reload, 250);
}

function reload() {
  if (reloading) return;
  const w = WEAPONS[currentWeapon];
  if (w.ammo === w.maxAmmo) return;
  reloading = true; updateHUD();
  setTimeout(() => { w.ammo = w.maxAmmo; reloading = false; updateHUD(); }, w.reload);
}

function createTracer(a, b) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const m = new THREE.LineBasicMaterial({ color: currentWeapon === 'flamethrower' ? 0xff6600 : 0xffee88, opacity: 0.85, transparent: true });
  const l = new THREE.Line(g, m);
  scene.add(l);
  setTimeout(() => { scene.remove(l); g.dispose(); m.dispose(); }, 40);
}

function createBlood(pos) {
  for (let i = 0; i < 5; i++) {
    const g = new THREE.SphereGeometry(0.08, 6, 6);
    const m = new THREE.MeshBasicMaterial({ color: 0x8a0000 });
    const s = new THREE.Mesh(g, m); s.position.copy(pos); scene.add(s);
    const v = new THREE.Vector3((Math.random()-0.5)*2, Math.random()*2, (Math.random()-0.5)*2);
    let life = 0;
    const iv = setInterval(() => {
      life += 0.05; s.position.addScaledVector(v, 0.05); v.y -= 0.15; s.scale.multiplyScalar(0.9);
      if (life > 0.4) { clearInterval(iv); scene.remove(s); g.dispose(); m.dispose(); }
    }, 30);
  }
}

function showHitMarker() {
  const hm = document.getElementById('hitMarker');
  if (!hm) return;
  hm.classList.add('show');
  setTimeout(() => hm.classList.remove('show'), 100);
}

function killEnemy(en) {
  scene.remove(en);
  enemies = enemies.filter(e => e !== en);
  score += en.userData.isBoss ? 500 : 10;
  playHitSound();
  updateHUD();

  if (en.userData.isBoss) {
    currentBoss = null;
    document.getElementById('bossBar').style.display = 'none';
    setTimeout(() => completeLevel(), 800);
    return;
  }

  spawnLootCrate(en.position.clone(), en.userData.weaponDrop);
  if (Math.random() < 0.3) spawnMedkitPickup(en.position.clone());
}

// ============ ЛУТ ============
function spawnLootCrate(pos, weaponType) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.5 }));
  box.castShadow = true; g.add(box);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.65), new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, emissive: 0xffaa00, emissiveIntensity: 0.4 }));
  trim.position.y = 0.35; g.add(trim);
  const glow = new THREE.PointLight(0xffaa00, 0.8, 3); g.add(glow);
  g.position.copy(pos); g.position.y = 0.3;
  g.userData = { weapon: weaponType, phase: Math.random()*Math.PI*2, isCrate: true };
  scene.add(g); lootCrates.push(g);
}

function spawnMedkitPickup(pos) {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  box.castShadow = true; g.add(box);
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.08), crossMat); c1.position.y = 0.13; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.3), crossMat); c2.position.y = 0.13; g.add(c2);
  g.position.copy(pos); g.position.y = 0.15;
  g.userData = { isMedkit: true, phase: Math.random()*Math.PI*2 };
  scene.add(g); lootCrates.push(g);
}

function updateLootCrates(delta) {
  const t = performance.now() / 400;
  nearLootCrate = null;
  lootCrates.forEach(crate => {
    crate.rotation.y += delta * 1.5;
    crate.position.y = (crate.userData.isMedkit ? 0.15 : 0.3) + Math.sin(t + crate.userData.phase) * 0.1;
    if (crate.position.distanceTo(camera.position) < 2.5) nearLootCrate = crate;
  });
  const prompt = document.getElementById('interactPrompt');
  if (prompt) {
    if (nearLootCrate && !isMobile) {
      prompt.style.display = 'block';
      prompt.textContent = nearLootCrate.userData.isMedkit ? '[F] Подобрать аптечку' : '[F] Открыть ящик';
    } else prompt.style.display = 'none';
  }
}

function pickUpLoot() {
  if (!nearLootCrate) return;
  if (nearLootCrate.userData.isMedkit) {
    medkits = Math.min(MAX_MEDKITS, medkits + 1);
    showToast('+1 🩹 Аптечка');
  } else {
    const nw = nearLootCrate.userData.weapon;
    WEAPONS[nw].ammo = WEAPONS[nw].maxAmmo;
    currentWeapon = nw;
    createWeapon(nw);
    showToast('Получено: ' + WEAPONS[nw].name);
  }
  scene.remove(nearLootCrate);
  lootCrates = lootCrates.filter(c => c !== nearLootCrate);
  nearLootCrate = null;
  updateHUD();
}

function showToast(text) {
  const t = document.createElement('div');
  t.textContent = text;
  t.style.cssText = 'position:fixed;top:30%;left:50%;transform:translateX(-50%);color:#ffdd00;font-family:Courier New,monospace;font-size:22px;font-weight:800;text-shadow:0 0 15px #ffdd00,0 2px 8px #000;z-index:200;pointer-events:none;animation:toastFade 1.5s ease-out forwards;';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1500);
}
if (!document.getElementById('toastStyle')) {
  const s = document.createElement('style');
  s.id = 'toastStyle';
  s.textContent = '@keyframes toastFade{0%{opacity:0;transform:translate(-50%,-20px)}20%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-20px)}}';
  document.head.appendChild(s);
}

// ============ АПТЕЧКА ============
function useMedkit() {
  if (!isGameActive) return;
  if (medkits <= 0) { showToast('Нет аптечек!'); return; }
  if (health >= 100) { showToast('Здоровье полное'); return; }
  medkits--; health = Math.min(100, health + 40);
  updateHUD(); showToast('+40 ❤️'); playHealSound();
}

// ============ ЗВУКИ ============
function playShootSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(currentWeapon === 'sniper' ? 350 : 200, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.08);
  g.gain.setValueAtTime(0.15 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.1);
}
function playHitSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(900, audioCtx.currentTime);
  g.gain.setValueAtTime(0.1 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.15);
}
function playHealSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(400, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.3);
  g.gain.setValueAtTime(0.1 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.35);
}

// ============ ВРАЖДЕБНЫЕ АТАКИ ============
function enemyShoot(en) {
  const start = en.position.clone(); start.y = en.userData.isBoss ? 2.5 : 1.4;
  const target = camera.position.clone();
  const dir = new THREE.Vector3().subVectors(target, start).normalize();
  dir.x += (Math.random()-0.5)*0.08; dir.y += (Math.random()-0.5)*0.05; dir.z += (Math.random()-0.5)*0.08;
  dir.normalize();
  const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff6600 }));
  bullet.position.copy(start); scene.add(bullet);
  enemyBullets.push({ mesh: bullet, dir, speed: 40, life: 2.5, damage: LEVELS[currentLevel].enemyDamage * 8 });
}
function enemyThrowGrenade(en) {
  const start = en.position.clone(); start.y = 1.4;
  const target = camera.position.clone();
  const dir = new THREE.Vector3().subVectors(target, start).normalize();
  dir.y = 0.4; dir.normalize();
  const gren = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2a4a1a, metalness: 0.6 }));
  gren.position.copy(start); gren.castShadow = true; scene.add(gren);
  grenades.push({ mesh: gren, velocity: dir.multiplyScalar(18), timer: 2.0, exploded: false });
}
function updateEnemyBullets(delta) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.mesh.position.addScaledVector(b.dir, b.speed * delta);
    b.life -= delta;
    if (b.mesh.position.distanceTo(camera.position) < 0.6) {
      takeDamage(b.damage);
      scene.remove(b.mesh); enemyBullets.splice(i, 1); continue;
    }
    if (b.life <= 0) { scene.remove(b.mesh); enemyBullets.splice(i, 1); }
  }
}
function updateGrenades(delta) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    if (g.exploded) { scene.remove(g.mesh); grenades.splice(i, 1); continue; }
    g.timer -= delta;
    g.mesh.position.addScaledVector(g.velocity, delta);
    g.velocity.y -= 15 * delta;
    if (g.mesh.position.y < 0.2) { g.mesh.position.y = 0.2; g.velocity.y *= -0.4; g.velocity.x *= 0.7; g.velocity.z *= 0.7; }
    if (g.timer < 1 && Math.floor(g.timer * 8) % 2 === 0) g.mesh.material.color.setHex(0xff0000);
    else g.mesh.material.color.setHex(0x2a4a1a);
    if (g.timer <= 0) {
      g.exploded = true;
      const dist = g.mesh.position.distanceTo(camera.position);
      if (dist < 5) takeDamage(Math.max(10, 50 - dist*8));
      const fire = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 12), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 }));
      fire.position.copy(g.mesh.position); scene.add(fire);
      setTimeout(() => scene.remove(fire), 300);
      enemies.forEach(en => {
        if (en.position.distanceTo(g.mesh.position) < 5) {
          en.userData.health -= 40;
          if (en.userData.health <= 0) killEnemy(en);
        }
      });
    }
  }
}
function takeDamage(amount) {
  health -= amount;
  hitsTaken++;
  showDamage(); updateHUD();
  if (health <= 0) gameOver();
}
function showDamage() {
  const v = document.getElementById('damageVignette');
  if (!v) return;
  v.style.opacity = '0.8';
  setTimeout(() => v.style.opacity = '0', 150);
}

// ============ УПРАВЛЕНИЕ ============
function setupControls() {
  document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyD') keys.d = true;
    if (e.code === 'Space') { e.preventDefault(); if (!isJumping) { verticalVelocity = JUMP_POWER; isJumping = true; } }
    if (e.code === 'KeyR') reload();
    if (e.code === 'Digit1') switchWeapon('pistol');
    if (e.code === 'Digit2') switchWeapon('rifle');
    if (e.code === 'Digit3') switchWeapon('shotgun');
    if (e.code === 'Digit4') useMedkit();
    if (e.code === 'KeyF') pickUpLoot();
    if (e.code === 'KeyQ') cycleWeapon();
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyD') keys.d = false;
  });
  window.addEventListener('mousedown', (e) => { if (e.button !== 0 || !isGameActive) return; isMouseDown = true; shoot(); });
  window.addEventListener('mouseup', (e) => { if (e.button === 0) isMouseDown = false; });
  renderer.domElement.addEventListener('click', () => { if (isGameActive && !document.pointerLockElement && !isMobile) renderer.domElement.requestPointerLock(); });
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= e.movementX * MOUSE_SENSITIVITY;
      pitch -= e.movementY * MOUSE_SENSITIVITY;
      pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, pitch));
    }
  });
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  if (isMobile) setupMobileControls();
}

function switchWeapon(type) {
  if (!PROGRESS.ownedWeapons.includes(type)) { showToast('🔒 Не куплено'); return; }
  currentWeapon = type;
  WEAPONS[type].ammo = WEAPONS[type].maxAmmo;
  reloading = false;
  createWeapon(type);
  updateHUD();
}

function cycleWeapon() {
  const owned = PROGRESS.ownedWeapons;
  const idx = owned.indexOf(currentWeapon);
  const next = owned[(idx + 1) % owned.length];
  switchWeapon(next);
}

function setupMobileControls() {
  const jz = document.getElementById('joystickZone');
  const jb = document.getElementById('joystickBase');
  const jk = document.getElementById('joystickKnob');
  const btnShoot = document.getElementById('btnShoot');
  const btnJump = document.getElementById('btnJump');
  const btnReload = document.getElementById('btnReload');
  const btnMedkit = document.getElementById('btnMedkit');
  const btnWeapon = document.getElementById('btnWeapon');
  const btnPickup = document.getElementById('btnPickup');
  if (!jz) return;

  jz.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    joystickTouchId = t.identifier; joystickActive = true;
    joystickStartX = t.clientX; joystickStartY = t.clientY;
    jb.style.display = 'block'; jb.style.left = joystickStartX + 'px'; jb.style.top = joystickStartY + 'px';
    jk.style.transform = 'translate(-50%, -50%)';
  }, { passive: false });
  jz.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joystickTouchId) continue;
      let dx = t.clientX - joystickStartX, dy = t.clientY - joystickStartY;
      const max = 50, d = Math.sqrt(dx*dx + dy*dy);
      if (d > max) { dx = dx/d*max; dy = dy/d*max; }
      joystickDeltaX = dx/max; joystickDeltaY = dy/max;
      jk.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  }, { passive: false });
  const resetJoy = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joystickTouchId) continue;
      joystickActive = false; joystickTouchId = null; joystickDeltaX = 0; joystickDeltaY = 0;
      jb.style.display = 'none';
    }
  };
  jz.addEventListener('touchend', resetJoy);
  jz.addEventListener('touchcancel', resetJoy);

  document.addEventListener('touchstart', (e) => {
    if (!isGameActive) return;
    for (const t of e.changedTouches) {
      if (t.clientX > window.innerWidth/2 && lookTouchId === null) {
        lookTouchId = t.identifier; lookLastX = t.clientX; lookLastY = t.clientY;
      }
    }
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!isGameActive) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== lookTouchId) continue;
      yaw -= (t.clientX - lookLastX) * MOUSE_SENSITIVITY * 0.7;
      pitch -= (t.clientY - lookLastY) * MOUSE_SENSITIVITY * 0.7;
      pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, pitch));
      lookLastX = t.clientX; lookLastY = t.clientY;
    }
  }, { passive: true });
  const resetLook = (e) => {
    for (const t of e.changedTouches) if (t.identifier === lookTouchId) lookTouchId = null;
  };
  document.addEventListener('touchend', resetLook);
  document.addEventListener('touchcancel', resetLook);

  if (btnShoot) {
    btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); btnShoot.classList.add('pressed'); isMouseDown = true; if (isGameActive) shoot(); }, { passive: false });
    btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); btnShoot.classList.remove('pressed'); isMouseDown = false; }, { passive: false });
  }
  if (btnJump) btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (isGameActive && !isJumping) { verticalVelocity = JUMP_POWER; isJumping = true; } btnJump.classList.add('pressed'); setTimeout(() => btnJump.classList.remove('pressed'), 150); }, { passive: false });
  if (btnReload) btnReload.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (isGameActive) reload(); btnReload.classList.add('pressed'); setTimeout(() => btnReload.classList.remove('pressed'), 150); }, { passive: false });
  if (btnMedkit) btnMedkit.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (isGameActive) useMedkit(); btnMedkit.classList.add('pressed'); setTimeout(() => btnMedkit.classList.remove('pressed'), 150); }, { passive: false });
  if (btnWeapon) btnWeapon.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); cycleWeapon(); btnWeapon.classList.add('pressed'); setTimeout(() => btnWeapon.classList.remove('pressed'), 150); }, { passive: false });
  if (btnPickup) btnPickup.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); if (isGameActive) pickUpLoot(); btnPickup.classList.add('pressed'); setTimeout(() => btnPickup.classList.remove('pressed'), 150); }, { passive: false });
}

function updateMobileInput() {
  if (!isMobile || !joystickActive) return;
  keys.w = keys.s = keys.a = keys.d = false;
  const dz = 0.15;
  if (joystickDeltaY < -dz) keys.w = true;
  if (joystickDeltaY > dz) keys.s = true;
  if (joystickDeltaX < -dz) keys.a = true;
  if (joystickDeltaX > dz) keys.d = true;
}

// ============ ОБНОВЛЕНИЕ ============
function updatePlayer(delta) {
  if (!isGameActive) return;
  const speed = 7.5;
  const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const rgt = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();
  let moved = false;
  if (keys.w) { move.add(fwd); moved = true; }
  if (keys.s) { move.sub(fwd); moved = true; }
  if (keys.a) { move.sub(rgt); moved = true; }
  if (keys.d) { move.add(rgt); moved = true; }
  if (moved) {
    move.normalize().multiplyScalar(speed * delta);
    const nx = camera.position.x + move.x;
    if (!checkCollision(new THREE.Vector3(nx, camera.position.y, camera.position.z), 0.35)) camera.position.x = nx;
    const nz = camera.position.z + move.z;
    if (!checkCollision(new THREE.Vector3(camera.position.x, camera.position.y, nz), 0.35)) camera.position.z = nz;
  }
  verticalVelocity -= GRAVITY * delta;
  playerY += verticalVelocity * delta;
  if (playerY <= 1.7) { playerY = 1.7; verticalVelocity = 0; isJumping = false; }
  camera.position.y = playerY;
  recoilPitch *= 0.88;
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch + recoilPitch;
  if (weaponGroup) {
    const t = performance.now() / 220;
    const bob = moved ? Math.sin(t) * 0.012 : 0;
    weaponGroup.position.y = -0.26 + bob;
  }
  if (isMouseDown && WEAPONS[currentWeapon].auto) shoot();
}

function updateEnemies(delta) {
  if (!isGameActive) return;
  const now = performance.now();
  enemies.forEach(en => {
    const dir = new THREE.Vector3().subVectors(camera.position, en.position);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();
    const meleeRange = en.userData.isBoss ? 3 : 2;
    if (dist > meleeRange) {
      const np = en.position.clone().addScaledVector(dir, en.userData.speed * delta);
      np.y = 0.85 * (en.userData.isBoss ? 1.8 : 1);
      if (!checkCollision(np, en.userData.radius)) en.position.copy(np);
    } else {
      takeDamage(LEVELS[currentLevel].enemyDamage * (en.userData.isBoss ? 3 : 1));
    }
    if (!en.userData.isBoss) {
      if (en.userData.type === 'shooter' && dist < 35 && dist > 3 && now > en.userData.nextShotTime) {
        enemyShoot(en); en.userData.nextShotTime = now + 1500 + Math.random()*2000;
      }
      if (en.userData.type === 'grenadier' && dist < 25 && dist > 8 && now > en.userData.nextShotTime) {
        enemyThrowGrenade(en); en.userData.nextShotTime = now + 5000 + Math.random()*3000;
      }
    } else {
      if (now > en.userData.nextShotTime) {
        for (let k = 0; k < 5; k++) {
          setTimeout(() => { if (currentBoss) enemyShoot(en); }, k * 100);
        }
        if (Math.random() < 0.5) enemyThrowGrenade(en);
        en.userData.nextShotTime = now + 2000;
      }
      updateBossBar();
    }
    en.rotation.y = Math.atan2(dir.x, dir.z);
    en.userData.walkPhase += delta * 4;
    const baseY = 0.85 * (en.userData.isBoss ? 1.8 : 1);
    en.position.y = baseY + Math.abs(Math.sin(en.userData.walkPhase)) * 0.05;
  });
}

function animate() {
  requestAnimationFrame(animate);
  const d = Math.min(clock.getDelta(), 0.05);
  updateMobileInput();
  updatePlayer(d);
  updateEnemies(d);
  updateEnemyBullets(d);
  updateGrenades(d);
  updateLootCrates(d);
  updateDebugPanel();
  renderer.render(scene, camera);
}

// ============ HUD ============
function updateHUD() {
  const w = WEAPONS[currentWeapon];
  const lvl = LEVELS[currentLevel];
  const s = document.getElementById('score');
  const h = document.getElementById('health');
  const a = document.getElementById('ammo');
  const m = document.getElementById('medkits');
  if (s) s.textContent = `Ур.${currentLevel} ${lvl.name} | Волна ${wave}/${lvl.waves}`;
  if (h) h.textContent = '❤️ ' + Math.max(0, Math.floor(health));
  if (a) a.textContent = reloading ? '🔄...' : '🔫 ' + w.name + ' ' + w.ammo + '/' + w.maxAmmo;
  if (m) m.textContent = '🩹 x' + medkits;
}

function updateCoinsDisplay() {
  const els = ['menuCoins', 'mapCoins', 'shopCoins'];
  els.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = PROGRESS.coins; });
}

// ============ ВОЛНЫ / УРОВНИ ============
function nextWave() {
  if (!isGameActive) return;
  const lvl = LEVELS[currentLevel];
  if (wave < lvl.waves) {
    wave++;
    health = Math.min(100, health + 20);
    Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);
    updateHUD();
    showToast('🌊 Волна ' + wave);
  } else if (lvl.boss && !currentBoss) {
    // Последняя волна — спавним БОССА
    showToast('💀 БОСС!');
    spawnEnemy(true);
  } else if (!lvl.boss) {
    completeLevel();
  }
}

function completeLevel() {
  if (!isGameActive) return;
  isGameActive = false;
  document.exitPointerLock();
  document.getElementById('hud').style.display = 'none';

  // Расчёт звёзд
  let stars = 1;
  if (hitsTaken === 0) stars = 3;
  else if (hitsTaken === 1) stars = 2;

  const prevStars = PROGRESS.levels[currentLevel].stars;
  if (stars > prevStars) PROGRESS.levels[currentLevel].stars = stars;
  PROGRESS.levels[currentLevel].completed = true;

  // Разблокировка следующего
  const nextLvl = currentLevel + 1;
  if (PROGRESS.levels[nextLvl]) PROGRESS.levels[nextLvl].unlocked = true;

  // Монеты
  const earned = stars * 20;
  PROGRESS.coins += earned;

  saveProgress();

  // Показ экрана
  document.getElementById('coinsEarned').textContent = earned;
  const s1 = document.getElementById('star1'), s2 = document.getElementById('star2'), s3 = document.getElementById('star3');
  s1.classList.remove('active'); s2.classList.remove('active'); s3.classList.remove('active');
  setTimeout(() => s1.classList.add('active'), 300);
  if (stars >= 2) setTimeout(() => s2.classList.add('active'), 800);
  if (stars >= 3) setTimeout(() => s3.classList.add('active'), 1300);
  document.getElementById('levelComplete').style.display = 'flex';

  updateCoinsDisplay();
}

function gameOver() {
  isGameActive = false;
  document.exitPointerLock();
  document.getElementById('hud').style.display = 'none';
  document.getElementById('deadLevel').textContent = currentLevel;
  document.getElementById('gameover').style.display = 'flex';
}

// ============ ЗАПУСК УРОВНЯ ============
function startLevel(levelNum) {
  currentLevel = levelNum;
  const lvl = LEVELS[levelNum];
  wave = 1;
  health = 100;
  score = 0;
  hitsTaken = 0;
  medkits = 2;
  playerY = 1.7;
  verticalVelocity = 0;
  isJumping = false;
  lastShotTime = 0;
  isMouseDown = false;
  reloading = false;
  currentBoss = null;

  Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);

  enemies.forEach(e => scene.remove(e)); enemies = [];
  enemyBullets.forEach(b => scene.remove(b.mesh)); enemyBullets = [];
  grenades.forEach(g => scene.remove(g.mesh)); grenades = [];
  lootCrates.forEach(l => scene.remove(l)); lootCrates = [];
  currentBoss = null;
  document.getElementById('bossBar').style.display = 'none';

  camera.position.set(0, playerY, 0);
  yaw = 0; pitch = 0; recoilPitch = 0;

  // Устанавливаем текущее оружие (первое доступное)
  currentWeapon = 'rifle';
  if (!PROGRESS.ownedWeapons.includes('rifle')) currentWeapon = PROGRESS.ownedWeapons[0] || 'pistol';
  createWeapon(currentWeapon);

  document.getElementById('menu').style.display = 'none';
  document.getElementById('map').style.display = 'none';
  document.getElementById('shop').style.display = 'none';
  document.getElementById('settings').style.display = 'none';
  document.getElementById('levelComplete').style.display = 'none';
  document.getElementById('gameover').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('bgCanvas').style.display = 'none';

  isGameActive = true;
  updateHUD();

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (window.startBackgroundMusic) window.startBackgroundMusic();
  if (!isMobile) setTimeout(() => { if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock(); }, 200);

  // Начальный спавн
  for (let i = 0; i < 3; i++) setTimeout(() => spawnEnemy(), i * 500);

  // Интервалы
  if (window._spawnInt) clearInterval(window._spawnInt);
  window._spawnInt = setInterval(() => spawnEnemy(), 1800);
  if (window._waveInt) clearInterval(window._waveInt);
  window._waveInt = setInterval(() => nextWave(), 25000);
}

// ============ UI (меню, карта, магазин) ============
function setupUI() {
  document.getElementById('playBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('map').style.display = 'flex';
    renderLevelGrid();
    updateCoinsDisplay();
  });
  document.getElementById('backToMenu').addEventListener('click', () => {
    document.getElementById('map').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
  });
  document.getElementById('shopBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('shop').style.display = 'flex';
    renderShop('skins');
    updateCoinsDisplay();
  });
  document.getElementById('backFromShop').addEventListener('click', () => {
    document.getElementById('shop').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
  });
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
  });
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
  });
  document.getElementById('resetProgress').addEventListener('click', () => {
    if (confirm('Сбросить весь прогресс?')) resetProgress();
  });

  document.getElementById('retryBtn').addEventListener('click', () => {
    document.getElementById('gameover').style.display = 'none';
    startLevel(currentLevel);
  });
  document.getElementById('toMapBtn2').addEventListener('click', () => {
    document.getElementById('gameover').style.display = 'none';
    document.getElementById('map').style.display = 'flex';
    document.getElementById('bgCanvas').style.display = 'block';
    renderLevelGrid();
    updateCoinsDisplay();
  });
  document.getElementById('toMapBtn').addEventListener('click', () => {
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('map').style.display = 'flex';
    document.getElementById('bgCanvas').style.display = 'block';
    renderLevelGrid();
    updateCoinsDisplay();
  });
  document.getElementById('replayBtn').addEventListener('click', () => {
    document.getElementById('levelComplete').style.display = 'none';
    startLevel(currentLevel);
  });

  // Табы магазина
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderShop(tab.dataset.tab);
    });
  });

  setupSettings();
}

function renderLevelGrid() {
  const grid = document.getElementById('levelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const lvl = LEVELS[i];
    const p = PROGRESS.levels[i];
    const card = document.createElement('div');
    card.className = 'level-card' + (p.unlocked ? '' : ' locked') + (lvl.boss ? ' boss-level' : '');
    let starsHTML = '';
    for (let s = 1; s <= 3; s++) starsHTML += `<span class="${s <= p.stars ? '' : 's-off'}">⭐</span>`;
    card.innerHTML = `
      ${lvl.boss ? '<div class="boss-icon">💀</div>' : ''}
      <div class="level-num">${i}</div>
      <div class="level-name">${lvl.name}</div>
      <div class="level-stars">${starsHTML}</div>
      ${!p.unlocked ? '<div class="lock-icon">🔒</div>' : ''}
    `;
    if (p.unlocked) {
      card.addEventListener('click', () => startLevel(i));
    }
    grid.appendChild(card);
  }
}

function renderShop(tab) {
  const content = document.getElementById('shopContent');
  if (!content) return;
  content.innerHTML = '';

  if (tab === 'skins') {
    Object.keys(SKINS).forEach(key => {
      const s = SKINS[key];
      const owned = PROGRESS.ownedSkins.includes(key);
      const equipped = PROGRESS.currentSkin === key;
      const item = document.createElement('div');
      item.className = 'shop-item' + (owned ? ' owned' : '') + (equipped ? ' equipped' : '');
      const colorHex = '#' + s.body.toString(16).padStart(6, '0');
      item.innerHTML = `
        <div class="item-icon" style="filter: drop-shadow(0 0 15px ${colorHex});">👤</div>
        <div class="item-name">${s.name}</div>
        <div class="item-desc">Цвет: ${colorHex}</div>
        <div class="item-price">${owned ? '✓ Куплено' : '💰 ' + s.cost}</div>
        <button class="item-btn ${equipped ? 'equipped-btn' : ''}" data-type="skin" data-key="${key}">
          ${equipped ? '✓ НАДЕТО' : (owned ? 'НАДЕТЬ' : 'КУПИТЬ')}
        </button>
      `;
      content.appendChild(item);
    });
  } else {
    Object.keys(WEAPONS).forEach(key => {
      const w = WEAPONS[key];
      if (!w.cost) return; // Базовые не продаются
      const owned = PROGRESS.ownedWeapons.includes(key);
      const item = document.createElement('div');
      item.className = 'shop-item' + (owned ? ' owned' : '');
      item.innerHTML = `
        <div class="item-icon">🔫</div>
        <div class="item-name">${w.name}</div>
        <div class="item-desc">Урон: ${w.damage} · Обойма: ${w.maxAmmo}</div>
        <div class="item-price">${owned ? '✓ Куплено' : '💰 ' + w.cost}</div>
        <button class="item-btn" data-type="weapon" data-key="${key}">${owned ? '✓ КУПЛЕНО' : 'КУПИТЬ'}</button>
      `;
      content.appendChild(item);
    });
  }

  // Обработчики кнопок покупки
  content.querySelectorAll('.item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      const key = btn.dataset.key;
      if (type === 'skin') {
        const s = SKINS[key];
        const owned = PROGRESS.ownedSkins.includes(key);
        if (owned) {
          PROGRESS.currentSkin = key;
          showToast('Надет: ' + s.name);
        } else if (PROGRESS.coins >= s.cost) {
          PROGRESS.coins -= s.cost;
          PROGRESS.ownedSkins.push(key);
          PROGRESS.currentSkin = key;
          showToast('Куплено: ' + s.name);
        } else {
          showToast('Недостаточно монет!');
          return;
        }
        saveProgress();
        updateCoinsDisplay();
        renderShop('skins');
      } else {
        const w = WEAPONS[key];
        if (PROGRESS.ownedWeapons.includes(key)) return;
        if (PROGRESS.coins >= w.cost) {
          PROGRESS.coins -= w.cost;
          PROGRESS.ownedWeapons.push(key);
          showToast('Куплено: ' + w.name);
          saveProgress();
          updateCoinsDisplay();
          renderShop('weapons');
        } else {
          showToast('Недостаточно монет!');
        }
      }
    });
  });
}

// ============ DEBUG ============
function createDebugPanel() {
  const p = document.createElement('div');
  p.id = 'debugPanel';
  p.style.cssText = 'position:fixed;top:60px;left:10px;z-index:9999;background:rgba(0,0,0,0.85);color:#0f0;padding:8px 12px;font-family:Courier New,monospace;font-size:12px;border:1px solid #0f0;border-radius:4px;pointer-events:none;line-height:1.5;white-space:pre;display:none;';
  document.body.appendChild(p);
}
function updateDebugPanel() {
  const p = document.getElementById('debugPanel');
  if (!p) return;
  if (!debugMode) { p.style.display = 'none'; return; }
  p.style.display = 'block';
  const now = performance.now();
  const w = WEAPONS[currentWeapon];
  const cd = Math.max(0, w.cooldown - (now - lastShotTime));
  p.textContent = `🎮 DEBUG\nlevel: ${currentLevel} wave: ${wave}\nenemies: ${enemies.length}\nbullets: ${enemyBullets.length}\ngrenades: ${grenades.length}\nweapon: ${w.name}\nammo: ${w.ammo}/${w.maxAmmo}\nhits: ${hitsTaken}\ncoins: ${PROGRESS.coins}`;
}

// ============ НАСТРОЙКИ ============
function setupSettings() {
  const sens = document.getElementById('sensSlider');
  const vol = document.getElementById('volSlider');
  const qual = document.getElementById('qualitySelect');
  const dbg = document.getElementById('debugToggle');
  const fovS = document.getElementById('fovSlider');
  if (sens) sens.addEventListener('input', () => { MOUSE_SENSITIVITY = sens.value * 0.0004; });
  if (vol) vol.addEventListener('input', () => { volume = vol.value / 100; if (window.setMusicVolume) window.setMusicVolume(volume * 0.5); });
  if (qual) qual.addEventListener('change', () => {
    if (qual.value === 'low') { renderer.shadowMap.enabled = false; scene.fog.far = 80; }
    else if (qual.value === 'high') { renderer.shadowMap.enabled = !isMobile; scene.fog.far = 180; }
    else { renderer.shadowMap.enabled = !isMobile; scene.fog.far = 140; }
  });
  if (dbg) dbg.addEventListener('change', () => { debugMode = dbg.checked; });
  if (fovS) fovS.addEventListener('input', () => { camera.fov = parseInt(fovS.value); camera.updateProjectionMatrix(); });
}

// ============ СТАРТ ============
window.addEventListener('load', () => {
  init();
  createDebugPanel();
  console.log('🎮 ZOMBIESHOOT v10.0 запущен');
});
