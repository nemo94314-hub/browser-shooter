// ============ ZOMBIESHOOT v9.0 MOBILE ============
let scene, camera, renderer;
let score = 0, health = 100, wave = 1;
let isGameActive = false;
let enemies = [], obstacles = [], enemyBullets = [], grenades = [], lootCrates = [];
let clock = new THREE.Clock();
let yaw = 0, pitch = 0, recoilPitch = 0;
let verticalVelocity = 0, playerY = 1.7, isJumping = false;
const GRAVITY = 22, JUMP_POWER = 8;
let MOUSE_SENSITIVITY = 0.002;
let volume = 0.4;
let medkits = 2;
const MAX_MEDKITS = 5;

// ============ МОБИЛЬНОЕ УПРАВЛЕНИЕ ============
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
                 || ('ontouchstart' in window && window.innerWidth < 1200);
let joystickActive = false;
let joystickTouchId = null;
let joystickStartX = 0, joystickStartY = 0;
let joystickDeltaX = 0, joystickDeltaY = 0;
let lookTouchId = null;
let lookLastX = 0, lookLastY = 0;

const WEAPONS = {
  pistol:  { name:'Пистолет', ammo:15, maxAmmo:15, damage:35, cooldown:280, spread:0.004, auto:false, reload:1100 },
  rifle:   { name:'Автомат',  ammo:30, maxAmmo:30, damage:22, cooldown:90,  spread:0.012, auto:true,  reload:1800 },
  shotgun: { name:'Дробовик', ammo:6,  maxAmmo:6,  damage:20, cooldown:750, spread:0.055, auto:false, reload:2000, pellets:10 }
};
let currentWeapon = 'rifle';
let reloading = false;
let lastShotTime = 0;
let isMouseDown = false;
let weaponGroup = null, audioCtx = null;
let debugMode = false;
let nearLootCrate = null;

const keys = { w:false, a:false, s:false, d:false };

// ============================================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87a5c4);
  scene.fog = new THREE.Fog(0x87a5c4, 60, 130);

  const initialFov = isMobile ? 85 : 75;
  camera = new THREE.PerspectiveCamera(initialFov, innerWidth / innerHeight, 0.1, 300);
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
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  scene.add(sun);

  const skyGeo = new THREE.SphereGeometry(150, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x87a5c4, side: THREE.BackSide, fog: false });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  createGround();
  createBase();
  createWeapon(currentWeapon);

  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}

  setInterval(spawnEnemy, 1800);
  setInterval(nextWave, 30000);

  setupControls();
  animate();
  updateHUD();
  createDebugPanel();
}

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 80),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  scene.add(road);
}

function createBase() {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });
  [
    { pos:[0,2,-48], size:[96,4,1] },
    { pos:[0,2,48],  size:[96,4,1] },
    { pos:[-48,2,0], size:[1,4,96] },
    { pos:[48,2,0],  size:[1,4,96] }
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos);
    wall.castShadow = true; wall.receiveShadow = true;
    wall.userData.size = { x:w.size[0], y:w.size[1], z:w.size[2] };
    scene.add(wall);
    obstacles.push(wall);
  });

  const hescoMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  [[12,1.5,8,3,3,2],[-12,1.5,8,3,3,2],[12,1.5,-8,3,3,2],[-12,1.5,-8,3,3,2]].forEach(([x,y,z,sx,sy,sz]) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), hescoMat);
    h.position.set(x,y,z);
    h.castShadow = true; h.receiveShadow = true;
    h.userData.size = { x:sx, y:sy, z:sz };
    scene.add(h); obstacles.push(h);
  });

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6a552a });
  [[8,0.6,3],[-8,0.6,3],[8,0.6,-3],[-8,0.6,-3]].forEach(([x,y,z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), crateMat);
    c.position.set(x,y,z);
    c.castShadow = true; c.receiveShadow = true;
    c.userData.size = { x:1.2, y:1.2, z:1.2 };
    scene.add(c); obstacles.push(c);
  });
}

function createWeapon(type) {
  if (weaponGroup) camera.remove(weaponGroup);
  weaponGroup = new THREE.Group();

  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

  if (type === 'pistol') {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.28), metal);
    s.position.set(0, 0.02, -0.15); weaponGroup.add(s);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), grip);
    g.position.set(0, -0.15, 0.02); g.rotation.x = 0.25; weaponGroup.add(g);
    weaponGroup.position.set(0.22, -0.22, -0.4);
  } else if (type === 'rifle') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.5), metal);
    b.position.set(0, 0, -0.25); weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), metal);
    br.rotation.x = Math.PI / 2; br.position.set(0, 0.01, -0.7); weaponGroup.add(br);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.09), black);
    mag.position.set(0, -0.15, -0.15); mag.rotation.x = 0.15; weaponGroup.add(mag);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip);
    g.position.set(0, -0.13, 0.05); g.rotation.x = 0.3; weaponGroup.add(g);
    weaponGroup.position.set(0.28, -0.26, -0.5);
  } else if (type === 'shotgun') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.55), metal);
    b.position.set(0, 0, -0.25); weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), metal);
    br.rotation.x = Math.PI / 2; br.position.set(0, 0.03, -0.75); weaponGroup.add(br);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.2), wood);
    p.position.set(0, -0.03, -0.5); weaponGroup.add(p);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), wood);
    g.position.set(0, -0.14, 0.05); g.rotation.x = 0.3; weaponGroup.add(g);
    weaponGroup.position.set(0.3, -0.28, -0.5);
  }

  const flash = new THREE.PointLight(0xffaa00, 0, 6);
  flash.position.set(0, 0.03, -0.9);
  weaponGroup.add(flash);
  weaponGroup.userData.flash = flash;
  camera.add(weaponGroup);
}

function createZombie() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x7a9a4a });
  const uniform = new THREE.MeshStandardMaterial({ color: 0x5a6a3a });
  const metal = new THREE.MeshStandardMaterial({ color: 0x6a7a5a, metalness: 0.7 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 1.0, 12), uniform);
  torso.position.y = 0.5; torso.castShadow = true; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
  head.position.y = 1.45; head.castShadow = true; g.add(head);

  const helmet = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), metal
  );
  helmet.position.y = 1.55; helmet.castShadow = true; g.add(helmet);

  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glow);
  eL.position.set(-0.1, 1.48, -0.24); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), glow);
  eR.position.set(0.1, 1.48, -0.24); g.add(eR);

  const gunMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
  const zGun = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.7), gunMat);
  zGun.position.set(0.35, 0.75, -0.5);
  g.add(zGun);

  g.position.y = 0.85;
  return g;
}

function spawnEnemy() {
  if (!isGameActive) return;
  if (enemies.length >= 6 + wave) return;

  const e = createZombie();
  const sides = [
    [-45,-30],[-45,0],[-45,30],[45,-30],[45,0],[45,30],
    [-30,-45],[0,-45],[30,-45],[-30,45],[0,45],[30,45]
  ];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random() - 0.5) * 3, 0.85, s[1] + (Math.random() - 0.5) * 3);

  const r = Math.random();
  let type = 'melee';
  if (r < 0.5) type = 'shooter';
  else if (r < 0.7) type = 'grenadier';

  e.userData = {
    type: type,
    health: 30 + wave * 8,
    speed: 1.2 + Math.random() * 0.6 + wave * 0.1,
    radius: 0.5,
    walkPhase: Math.random() * Math.PI * 2,
    nextShotTime: performance.now() + 2000 + Math.random() * 3000,
    weaponDrop: type === 'shooter' ? 'rifle' : (type === 'grenadier' ? 'shotgun' : 'pistol')
  };
  scene.add(e);
  enemies.push(e);
}

function checkCollision(pos, r) {
  if (Math.abs(pos.x) > 46.5 || Math.abs(pos.z) > 46.5) return true;
  for (const o of obstacles) {
    if (!o.userData.size) continue;
    const hx = o.userData.size.x / 2;
    const hz = o.userData.size.z / 2;
    const topY = o.position.y + o.userData.size.y / 2;
    if (topY < 0.6) continue;
    if (Math.abs(pos.x - o.position.x) < hx + r &&
        Math.abs(pos.z - o.position.z) < hz + r) return true;
  }
  return false;
}

function shoot() {
  if (!isGameActive || reloading) return;
  const w = WEAPONS[currentWeapon];
  const now = performance.now();
  if (now - lastShotTime < w.cooldown) return;
  if (w.ammo <= 0) { reload(); return; }

  lastShotTime = now;
  w.ammo--;
  updateHUD();

  recoilPitch += currentWeapon === 'shotgun' ? 0.07 : 0.028;
  playShootSound();

  if (weaponGroup.userData.flash) {
    weaponGroup.userData.flash.intensity = 4;
    setTimeout(() => { if (weaponGroup.userData.flash) weaponGroup.userData.flash.intensity = 0; }, 60);
  }

  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(
      new THREE.Vector2((Math.random() - 0.5) * w.spread * 2, (Math.random() - 0.5) * w.spread * 2),
      camera
    );
    const hits = ray.intersectObjects(enemies, true);
    const start = camera.position.clone();
    const end = start.clone().add(ray.ray.direction.clone().multiplyScalar(150));

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
  reloading = true;
  updateHUD();
  setTimeout(() => { w.ammo = w.maxAmmo; reloading = false; updateHUD(); }, w.reload);
}

function createTracer(a, b) {
  const g = new THREE.BufferGeometry().setFromPoints([a, b]);
  const m = new THREE.LineBasicMaterial({ color: 0xffee88, opacity: 0.85, transparent: true });
  const l = new THREE.Line(g, m);
  scene.add(l);
  setTimeout(() => { scene.remove(l); g.dispose(); m.dispose(); }, 40);
}

function createBlood(pos) {
  for (let i = 0; i < 5; i++) {
    const g = new THREE.SphereGeometry(0.08, 6, 6);
    const m = new THREE.MeshBasicMaterial({ color: 0x8a0000 });
    const s = new THREE.Mesh(g, m);
    s.position.copy(pos);
    scene.add(s);
    const v = new THREE.Vector3((Math.random()-0.5)*2, Math.random()*2, (Math.random()-0.5)*2);
    let life = 0;
    const iv = setInterval(() => {
      life += 0.05;
      s.position.addScaledVector(v, 0.05);
      v.y -= 0.15;
      s.scale.multiplyScalar(0.9);
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
  score += 10;
  playHitSound();
  updateHUD();
  spawnLootCrate(en.position.clone(), en.userData.weaponDrop);
  if (Math.random() < 0.3) spawnMedkitPickup(en.position.clone());
}

function spawnLootCrate(pos, weaponType) {
  const g = new THREE.Group();
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.5 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), boxMat);
  box.castShadow = true;
  g.add(box);
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, emissive: 0xffaa00, emissiveIntensity: 0.4 });
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.65), trimMat);
  trim.position.y = 0.35;
  g.add(trim);
  const glow = new THREE.PointLight(0xffaa00, 0.8, 3);
  g.add(glow);
  g.position.copy(pos);
  g.position.y = 0.3;
  g.userData = { weapon: weaponType, phase: Math.random() * Math.PI * 2, isCrate: true };
  scene.add(g);
  lootCrates.push(g);
}

function spawnMedkitPickup(pos) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.4), mat);
  box.castShadow = true;
  g.add(box);
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.08), crossMat);
  c1.position.y = 0.13; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.3), crossMat);
  c2.position.y = 0.13; g.add(c2);
  g.position.copy(pos);
  g.position.y = 0.15;
  g.userData = { isMedkit: true, phase: Math.random() * Math.PI * 2 };
  scene.add(g);
  lootCrates.push(g);
}

function updateLootCrates(delta) {
  const t = performance.now() / 400;
  nearLootCrate = null;

  lootCrates.forEach(crate => {
    crate.rotation.y += delta * 1.5;
    crate.position.y = (crate.userData.isMedkit ? 0.15 : 0.3) + Math.sin(t + crate.userData.phase) * 0.1;
    const dist = crate.position.distanceTo(camera.position);
    if (dist < 2.5) nearLootCrate = crate;
  });

  const prompt = document.getElementById('interactPrompt');
  if (prompt) {
    if (nearLootCrate && !isMobile) {
      prompt.style.display = 'block';
      prompt.textContent = nearLootCrate.userData.isMedkit ? '[F] Подобрать аптечку' : '[F] Открыть ящик';
    } else {
      prompt.style.display = 'none';
    }
  }
}

function pickUpLoot() {
  if (!nearLootCrate) return;
  if (nearLootCrate.userData.isMedkit) {
    medkits = Math.min(MAX_MEDKITS, medkits + 1);
    showToast('+1 🩹 Аптечка');
  } else {
    const newWeapon = nearLootCrate.userData.weapon;
    WEAPONS[newWeapon].ammo = WEAPONS[newWeapon].maxAmmo;
    currentWeapon = newWeapon;
    createWeapon(newWeapon);
    showToast('Получено: ' + WEAPONS[newWeapon].name);
  }
  scene.remove(nearLootCrate);
  lootCrates = lootCrates.filter(c => c !== nearLootCrate);
  nearLootCrate = null;
  updateHUD();
}

function showToast(text) {
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    position:fixed; top:30%; left:50%; transform:translateX(-50%);
    color:#ffdd00; font-family:'Courier New',monospace; font-size:24px;
    font-weight:800; text-shadow:0 0 15px #ffdd00, 0 2px 8px #000;
    z-index:200; pointer-events:none;
    animation:toastFade 1.5s ease-out forwards;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

if (!document.getElementById('toastStyle')) {
  const ts = document.createElement('style');
  ts.id = 'toastStyle';
  ts.textContent = `@keyframes toastFade { 0% { opacity:0; transform:translate(-50%, -20px); } 20% { opacity:1; transform:translate(-50%, 0); } 80% { opacity:1; } 100% { opacity:0; transform:translate(-50%, -20px); } }`;
  document.head.appendChild(ts);
}

function useMedkit() {
  if (!isGameActive) return;
  if (medkits <= 0) { showToast('Нет аптечек!'); return; }
  if (health >= 100) { showToast('Здоровье полное'); return; }
  medkits--;
  health = Math.min(100, health + 40);
  updateHUD();
  showToast('+40 ❤️');
  playHealSound();
}

function playHealSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(400, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.3);
  g.gain.setValueAtTime(0.1 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.35);
}

function playShootSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.setValueAtTime(200, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.08);
  g.gain.setValueAtTime(0.15 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.1);
}

function playHitSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(900, audioCtx.currentTime);
  g.gain.setValueAtTime(0.1 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.15);
}

function enemyShoot(en) {
  const start = en.position.clone();
  start.y = 1.4;
  const target = camera.position.clone();
  const dir = new THREE.Vector3().subVectors(target, start).normalize();
  dir.x += (Math.random() - 0.5) * 0.08;
  dir.y += (Math.random() - 0.5) * 0.05;
  dir.z += (Math.random() - 0.5) * 0.08;
  dir.normalize();

  const geo = new THREE.SphereGeometry(0.08, 6, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
  const bullet = new THREE.Mesh(geo, mat);
  bullet.position.copy(start);
  scene.add(bullet);

  enemyBullets.push({ mesh: bullet, dir: dir, speed: 40, life: 2.5, damage: 8 });
}

function enemyThrowGrenade(en) {
  const start = en.position.clone();
  start.y = 1.4;
  const target = camera.position.clone();
  const dir = new THREE.Vector3().subVectors(target, start).normalize();
  dir.y = 0.4;
  dir.normalize();

  const geo = new THREE.SphereGeometry(0.18, 8, 8);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2a4a1a, metalness: 0.6 });
  const gren = new THREE.Mesh(geo, mat);
  gren.position.copy(start);
  gren.castShadow = true;
  scene.add(gren);

  grenades.push({ mesh: gren, velocity: dir.multiplyScalar(18), timer: 2.0, exploded: false });
}

function updateEnemyBullets(delta) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.mesh.position.addScaledVector(b.dir, b.speed * delta);
    b.life -= delta;

    const dist = b.mesh.position.distanceTo(camera.position);
    if (dist < 0.6) {
      health -= b.damage;
      showDamage();
      updateHUD();
      if (health <= 0) gameOver();
      scene.remove(b.mesh);
      enemyBullets.splice(i, 1);
      continue;
    }

    if (b.life <= 0) {
      scene.remove(b.mesh);
      enemyBullets.splice(i, 1);
    }
  }
}

function updateGrenades(delta) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    if (g.exploded) { scene.remove(g.mesh); grenades.splice(i, 1); continue; }

    g.timer -= delta;
    g.mesh.position.addScaledVector(g.velocity, delta);
    g.velocity.y -= 15 * delta;

    if (g.mesh.position.y < 0.2) {
      g.mesh.position.y = 0.2;
      g.velocity.y *= -0.4;
      g.velocity.x *= 0.7;
      g.velocity.z *= 0.7;
    }

    if (g.timer < 1 && Math.floor(g.timer * 8) % 2 === 0) g.mesh.material.color.setHex(0xff0000);
    else g.mesh.material.color.setHex(0x2a4a1a);

    if (g.timer <= 0) {
      g.exploded = true;
      const dist = g.mesh.position.distanceTo(camera.position);
      if (dist < 5) {
        const dmg = Math.max(10, 50 - dist * 8);
        health -= dmg;
        showDamage();
        updateHUD();
        if (health <= 0) gameOver();
      }

      const fireGeo = new THREE.SphereGeometry(1.5, 12, 12);
      const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.9 });
      const fire = new THREE.Mesh(fireGeo, fireMat);
      fire.position.copy(g.mesh.position);
      scene.add(fire);
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

function setupControls() {
  document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;
    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyD') keys.d = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (!isJumping) { verticalVelocity = JUMP_POWER; isJumping = true; }
    }
    if (e.code === 'KeyR') reload();
    if (e.code === 'Digit1') { currentWeapon = 'pistol'; createWeapon('pistol'); updateHUD(); }
    if (e.code === 'Digit2') { currentWeapon = 'rifle'; createWeapon('rifle'); updateHUD(); }
    if (e.code === 'Digit3') { currentWeapon = 'shotgun'; createWeapon('shotgun'); updateHUD(); }
    if (e.code === 'Digit4') useMedkit();
    if (e.code === 'KeyF') pickUpLoot();
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyD') keys.d = false;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !isGameActive) return;
    isMouseDown = true;
    shoot();
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) isMouseDown = false;
  });

  renderer.domElement.addEventListener('click', () => {
    if (isGameActive && !document.pointerLockElement && !isMobile) {
      renderer.domElement.requestPointerLock();
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= e.movementX * MOUSE_SENSITIVITY;
      pitch -= e.movementY * MOUSE_SENSITIVITY;
      pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Мобильное управление
  if (isMobile) setupMobileControls();
}

function setupMobileControls() {
  const joystickZone = document.getElementById('joystickZone');
  const joystickBase = document.getElementById('joystickBase');
  const joystickKnob = document.getElementById('joystickKnob');
  const btnShoot = document.getElementById('btnShoot');
  const btnJump = document.getElementById('btnJump');
  const btnReload = document.getElementById('btnReload');
  const btnMedkit = document.getElementById('btnMedkit');
  const btnWeapon = document.getElementById('btnWeapon');
  const btnPickup = document.getElementById('btnPickup');

  if (!joystickZone) return;

  joystickZone.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    joystickTouchId = touch.identifier;
    joystickActive = true;
    joystickStartX = touch.clientX;
    joystickStartY = touch.clientY;
    joystickBase.style.display = 'block';
    joystickBase.style.left = joystickStartX + 'px';
    joystickBase.style.top = joystickStartY + 'px';
    joystickKnob.style.transform = 'translate(-50%, -50%)';
  }, { passive: false });

  joystickZone.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier !== joystickTouchId) continue;
      let dx = touch.clientX - joystickStartX;
      let dy = touch.clientY - joystickStartY;
      const maxDist = 50;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) {
        dx = dx / dist * maxDist;
        dy = dy / dist * maxDist;
      }
      joystickDeltaX = dx / maxDist;
      joystickDeltaY = dy / maxDist;
      joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  }, { passive: false });

  const resetJoy = (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier !== joystickTouchId) continue;
      joystickActive = false;
      joystickTouchId = null;
      joystickDeltaX = 0;
      joystickDeltaY = 0;
      joystickBase.style.display = 'none';
    }
  };
  joystickZone.addEventListener('touchend', resetJoy);
  joystickZone.addEventListener('touchcancel', resetJoy);

  // Обзор
  document.addEventListener('touchstart', (e) => {
    if (!isGameActive) return;
    for (const touch of e.changedTouches) {
      if (touch.clientX > window.innerWidth / 2 && lookTouchId === null) {
        lookTouchId = touch.identifier;
        lookLastX = touch.clientX;
        lookLastY = touch.clientY;
      }
    }
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isGameActive) return;
    for (const touch of e.changedTouches) {
      if (touch.identifier !== lookTouchId) continue;
      const dx = touch.clientX - lookLastX;
      const dy = touch.clientY - lookLastY;
      yaw -= dx * MOUSE_SENSITIVITY * 0.7;
      pitch -= dy * MOUSE_SENSITIVITY * 0.7;
      pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
      lookLastX = touch.clientX;
      lookLastY = touch.clientY;
    }
  }, { passive: true });

  const resetLook = (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === lookTouchId) lookTouchId = null;
    }
  };
  document.addEventListener('touchend', resetLook);
  document.addEventListener('touchcancel', resetLook);

  if (btnShoot) {
    btnShoot.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnShoot.classList.add('pressed');
      isMouseDown = true;
      if (isGameActive) shoot();
    }, { passive: false });
    btnShoot.addEventListener('touchend', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnShoot.classList.remove('pressed');
      isMouseDown = false;
    }, { passive: false });
  }

  if (btnJump) {
    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnJump.classList.add('pressed');
      if (isGameActive && !isJumping) {
        verticalVelocity = JUMP_POWER;
        isJumping = true;
      }
      setTimeout(() => btnJump.classList.remove('pressed'), 150);
    }, { passive: false });
  }

  if (btnReload) {
    btnReload.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnReload.classList.add('pressed');
      if (isGameActive) reload();
      setTimeout(() => btnReload.classList.remove('pressed'), 150);
    }, { passive: false });
  }

  if (btnMedkit) {
    btnMedkit.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnMedkit.classList.add('pressed');
      if (isGameActive) useMedkit();
      setTimeout(() => btnMedkit.classList.remove('pressed'), 150);
    }, { passive: false });
  }

  if (btnWeapon) {
    btnWeapon.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnWeapon.classList.add('pressed');
      if (currentWeapon === 'pistol') currentWeapon = 'rifle';
      else if (currentWeapon === 'rifle') currentWeapon = 'shotgun';
      else currentWeapon = 'pistol';
      createWeapon(currentWeapon);
      updateHUD();
      showToast('🔫 ' + WEAPONS[currentWeapon].name);
      setTimeout(() => btnWeapon.classList.remove('pressed'), 150);
    }, { passive: false });
  }

  if (btnPickup) {
    btnPickup.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      btnPickup.classList.add('pressed');
      if (isGameActive) pickUpLoot();
      setTimeout(() => btnPickup.classList.remove('pressed'), 150);
    }, { passive: false });
  }
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

function updatePlayer(delta) {
  if (!isGameActive) return;

  const speed = 7.5;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();
  let moved = false;

  if (keys.w) { move.add(forward); moved = true; }
  if (keys.s) { move.sub(forward); moved = true; }
  if (keys.a) { move.sub(right); moved = true; }
  if (keys.d) { move.add(right); moved = true; }

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

    if (dist > 2) {
      const np = en.position.clone().addScaledVector(dir, en.userData.speed * delta);
      np.y = 0.85;
      if (!checkCollision(np, en.userData.radius)) en.position.copy(np);
    } else {
      health -= 0.5;
      showDamage();
      updateHUD();
      if (health <= 0) gameOver();
    }

    if (en.userData.type === 'shooter' && dist < 35 && dist > 3 && now > en.userData.nextShotTime) {
      enemyShoot(en);
      en.userData.nextShotTime = now + 1500 + Math.random() * 2000;
    }

    if (en.userData.type === 'grenadier' && dist < 25 && dist > 8 && now > en.userData.nextShotTime) {
      enemyThrowGrenade(en);
      en.userData.nextShotTime = now + 5000 + Math.random() * 3000;
    }

    en.rotation.y = Math.atan2(dir.x, dir.z);
    en.userData.walkPhase += delta * 4;
    en.position.y = 0.85 + Math.abs(Math.sin(en.userData.walkPhase)) * 0.05;
  });
}

function showDamage() {
  const v = document.getElementById('damageVignette');
  if (!v) return;
  v.style.opacity = '0.8';
  setTimeout(() => v.style.opacity = '0', 150);
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

function createDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debugPanel';
  panel.style.cssText = `
    position:fixed; top:60px; left:10px; z-index:9999;
    background:rgba(0,0,0,0.85); color:#0f0; padding:8px 12px;
    font-family:'Courier New',monospace; font-size:12px;
    border:1px solid #0f0; border-radius:4px;
    pointer-events:none; line-height:1.5; white-space:pre;
    display:none;
  `;
  document.body.appendChild(panel);
}

function updateDebugPanel() {
  const panel = document.getElementById('debugPanel');
  if (!panel) return;
  if (!debugMode) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  const now = performance.now();
  const w = WEAPONS[currentWeapon];
  const cd = Math.max(0, w.cooldown - (now - lastShotTime));
  panel.textContent =
    `🎮 DEBUG\n` +
    `mobile: ${isMobile}\n` +
    `active: ${isGameActive}\n` +
    `enemies: ${enemies.length}\n` +
    `bullets: ${enemyBullets.length}\n` +
    `weapon: ${w.name}\n` +
    `ammo: ${w.ammo}/${w.maxAmmo}\n` +
    `medkits: ${medkits}\n` +
    `cooldown: ${cd.toFixed(0)}ms`;
}

function updateHUD() {
  const w = WEAPONS[currentWeapon];
  const scoreEl = document.getElementById('score');
  const healthEl = document.getElementById('health');
  const ammoEl = document.getElementById('ammo');
  const medEl = document.getElementById('medkits');
  if (scoreEl) scoreEl.textContent = 'Счёт: ' + score + ' | Волна: ' + wave;
  if (healthEl) healthEl.textContent = '❤️ ' + Math.max(0, Math.floor(health));
  if (ammoEl) ammoEl.textContent = reloading ? '🔄...' : '🔫 ' + w.name + ' ' + w.ammo + '/' + w.maxAmmo;
  if (medEl) medEl.textContent = '🩹 x' + medkits;
}

function nextWave() {
  if (!isGameActive) return;
  wave++;
  health = Math.min(100, health + 20);
  Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);
  updateHUD();
}

function startGame() {
  document.getElementById('menu').style.display = 'none';
  document.getElementById('settings').style.display = 'none';
  document.getElementById('gameover').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  const bgCanvas = document.getElementById('bgCanvas');
  if (bgCanvas) bgCanvas.style.display = 'none';

  isGameActive = true;
  health = 100;
  score = 0;
  wave = 1;
  medkits = 2;
  playerY = 1.7;
  verticalVelocity = 0;
  isJumping = false;
  lastShotTime = 0;
  isMouseDown = false;
  reloading = false;
  Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);

  enemies.forEach(e => scene.remove(e));
  enemies = [];
  enemyBullets.forEach(b => scene.remove(b.mesh));
  enemyBullets = [];
  grenades.forEach(g => scene.remove(g.mesh));
  grenades = [];
  lootCrates.forEach(l => scene.remove(l));
  lootCrates = [];

  currentWeapon = 'rifle';
  createWeapon('rifle');
  updateHUD();

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (window.startBackgroundMusic) window.startBackgroundMusic();

  if (!isMobile) {
    setTimeout(() => {
      if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
    }, 200);
  }
}

function gameOver() {
  isGameActive = false;
  if (!isMobile) document.exitPointerLock();
  document.getElementById('hud').style.display = 'none';
  document.getElementById('gameover').style.display = 'flex';
  document.getElementById('finalScore').textContent = score;
  if (window.startBackgroundMusic) window.startBackgroundMusic();
}

function restartGame() {
  startGame();
}

function setupSettings() {
  const sens = document.getElementById('sensSlider');
  const vol = document.getElementById('volSlider');
  const qual = document.getElementById('qualitySelect');
  const dbg = document.getElementById('debugToggle');
  const fovS = document.getElementById('fovSlider');

  if (sens) sens.addEventListener('input', () => { MOUSE_SENSITIVITY = sens.value * 0.0004; });
  if (vol) vol.addEventListener('input', () => {
    volume = vol.value / 100;
    if (window.setMusicVolume) window.setMusicVolume(volume * 0.5);
  });
  if (qual) qual.addEventListener('change', () => {
    if (qual.value === 'low') { renderer.shadowMap.enabled = false; scene.fog.far = 80; }
    else if (qual.value === 'high') { renderer.shadowMap.enabled = !isMobile; scene.fog.far = 180; }
    else { renderer.shadowMap.enabled = !isMobile; scene.fog.far = 140; }
  });
  if (dbg) dbg.addEventListener('change', () => { debugMode = dbg.checked; });
  if (fovS) fovS.addEventListener('input', () => {
    camera.fov = parseInt(fovS.value);
    camera.updateProjectionMatrix();
  });
}

window.addEventListener('load', () => {
  init();
  setupSettings();

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', restartGame);
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('settings').style.display = 'flex';
  });
  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settings').style.display = 'none';
    document.getElementById('menu').style.display = 'flex';
  });
});
