// ============ ZOMBIESHOOT v6.1 ============
// Исправлена стрельба через pointer lock

let scene, camera, renderer;
let score = 0, health = 100, wave = 1;
let isGameActive = false;
let enemies = [], obstacles = [];
let clock = new THREE.Clock();
let yaw = 0, pitch = 0, recoilPitch = 0;
let verticalVelocity = 0, playerY = 1.7, isJumping = false;
const GRAVITY = 22, JUMP_POWER = 8;
let MOUSE_SENSITIVITY = 0.002;
let volume = 0.7;

const WEAPONS = {
  pistol:  { name:'Пистолет', ammo:15, maxAmmo:15, damage:35, cooldown:280, spread:0.004, auto:false, reload:1100 },
  rifle:   { name:'Автомат',  ammo:30, maxAmmo:30, damage:22, cooldown:90,  spread:0.012, auto:true,  reload:1800 },
  shotgun: { name:'Дробовик', ammo:6,  maxAmmo:6,  damage:20, cooldown:750, spread:0.055, auto:false, reload:2000, pellets:10 }
};
let currentWeapon = 'rifle';
let reloading = false, canShoot = true, isMouseDown = false;
let weaponGroup = null, audioCtx = null;

const keys = { w:false, a:false, s:false, d:false };

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x6a8aa8);
  scene.fog = new THREE.Fog(0x6a8aa8, 50, 160);

  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
  camera.position.set(0, playerY, 0);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '1';
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1);
  sun.position.set(40, 60, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  scene.add(sun);

  createGround();
  createBase();
  createWeapon(currentWeapon);

  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}

  setInterval(spawnEnemy, 1600);
  setInterval(nextWave, 30000);

  setupControls();
  animate();
  updateHUD();
}

// ============================================
// ЗЕМЛЯ
// ============================================
function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 100),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.9 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  scene.add(road);

  const gGeo = new THREE.PlaneGeometry(0.4, 0.9);
  const gMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, side: THREE.DoubleSide });
  const count = 500;
  const grass = new THREE.InstancedMesh(gGeo, gMat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x) < 10 && Math.abs(z) < 55) continue;
    d.position.set(x, 0.45, z);
    d.rotation.y = Math.random() * Math.PI;
    d.scale.setScalar(0.6 + Math.random() * 0.8);
    d.updateMatrix();
    grass.setMatrixAt(i, d.matrix);
  }
  scene.add(grass);
}

// ============================================
// БАЗА
// ============================================
function createBase() {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x5a5a5a });

  [
    { pos:[0,2,-50], size:[100,4,1] },
    { pos:[0,2,50],  size:[100,4,1] },
    { pos:[-50,2,0], size:[1,4,100] },
    { pos:[50,2,0],  size:[1,4,100] }
  ].forEach(w => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...w.size), wallMat);
    wall.position.set(...w.pos);
    wall.castShadow = true; wall.receiveShadow = true;
    wall.userData.size = { x:w.size[0], y:w.size[1], z:w.size[2] };
    scene.add(wall);
    obstacles.push(wall);
  });

  const hescoMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 0.95 });
  [
    [12,1.5,8,3,3,2],[-12,1.5,8,3,3,2],[12,1.5,-8,3,3,2],[-12,1.5,-8,3,3,2],
    [22,1.5,15,3,3,2],[-22,1.5,15,3,3,2],[22,1.5,-15,3,3,2],[-22,1.5,-15,3,3,2]
  ].forEach(([x,y,z,sx,sy,sz]) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz), hescoMat);
    h.position.set(x,y,z);
    h.castShadow = true; h.receiveShadow = true;
    h.userData.size = { x:sx, y:sy, z:sz };
    scene.add(h);
    obstacles.push(h);
  });

  const crateMat = new THREE.MeshStandardMaterial({ color: 0x6a552a });
  [[8,0.6,3],[-8,0.6,3],[8,0.6,-3],[-8,0.6,-3],[15,0.6,0],[-15,0.6,0]].forEach(([x,y,z]) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), crateMat);
    c.position.set(x,y,z);
    c.castShadow = true; c.receiveShadow = true;
    c.userData.size = { x:1.2, y:1.2, z:1.2 };
    scene.add(c);
    obstacles.push(c);
  });

  const bMat = new THREE.MeshStandardMaterial({ color: 0x8a2a2a, metalness: 0.4 });
  [[18,0.6,18],[-18,0.6,18],[18,0.6,-18],[-18,0.6,-18]].forEach(([x,y,z]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.2,12), bMat);
    b.position.set(x,y,z);
    b.castShadow = true; b.receiveShadow = true;
    b.userData.size = { x:1, y:1.2, z:1 };
    scene.add(b);
    obstacles.push(b);
  });

  const tMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
  const tBase = new THREE.Mesh(new THREE.BoxGeometry(4,6,4), tMat);
  tBase.position.set(-35, 3, 25);
  tBase.castShadow = true;
  tBase.userData.size = { x:4, y:6, z:4 };
  scene.add(tBase);
  obstacles.push(tBase);
}

// ============================================
// ОРУЖИЕ
// ============================================
function createWeapon(type) {
  if (weaponGroup) camera.remove(weaponGroup);
  weaponGroup = new THREE.Group();

  const metal = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.85, roughness: 0.35 });
  const black = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });
  const grip = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

  if (type === 'pistol') {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.28), metal);
    s.position.set(0, 0.02, -0.15);
    weaponGroup.add(s);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.08), grip);
    g.position.set(0, -0.15, 0.02);
    g.rotation.x = 0.25;
    weaponGroup.add(g);
    weaponGroup.position.set(0.22, -0.22, -0.4);
  } else if (type === 'rifle') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.5), metal);
    b.position.set(0, 0, -0.25);
    weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), metal);
    br.rotation.x = Math.PI / 2;
    br.position.set(0, 0.01, -0.7);
    weaponGroup.add(br);
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.09), black);
    mag.position.set(0, -0.15, -0.15);
    mag.rotation.x = 0.15;
    weaponGroup.add(mag);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.08), grip);
    g.position.set(0, -0.13, 0.05);
    g.rotation.x = 0.3;
    weaponGroup.add(g);
    weaponGroup.position.set(0.28, -0.26, -0.5);
  } else if (type === 'shotgun') {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.55), metal);
    b.position.set(0, 0, -0.25);
    weaponGroup.add(b);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), metal);
    br.rotation.x = Math.PI / 2;
    br.position.set(0, 0.03, -0.75);
    weaponGroup.add(br);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.2), wood);
    p.position.set(0, -0.03, -0.5);
    weaponGroup.add(p);
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.09), wood);
    g.position.set(0, -0.14, 0.05);
    g.rotation.x = 0.3;
    weaponGroup.add(g);
    weaponGroup.position.set(0.3, -0.28, -0.5);
  }

  const flash = new THREE.PointLight(0xffaa00, 0, 6);
  flash.position.set(0, 0.03, -0.9);
  weaponGroup.add(flash);
  weaponGroup.userData.flash = flash;
  camera.add(weaponGroup);
}

// ============================================
// ЗОМБИ
// ============================================
function createZombie() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x7a9a4a });
  const uniform = new THREE.MeshStandardMaterial({ color: 0x5a6a3a });
  const uniformDark = new THREE.MeshStandardMaterial({ color: 0x3a4a2a });
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

  const eyeLight = new THREE.PointLight(0xff0000, 0.4, 2.5);
  eyeLight.position.set(0, 1.48, -0.35); g.add(eyeLight);

  const armGeo = new THREE.CylinderGeometry(0.1, 0.09, 0.75, 8);
  const aL = new THREE.Mesh(armGeo, uniform);
  aL.position.set(-0.45, 0.7, -0.25); aL.rotation.x = Math.PI / 2.2; aL.castShadow = true; g.add(aL);
  const aR = new THREE.Mesh(armGeo, uniform);
  aR.position.set(0.45, 0.7, -0.25); aR.rotation.x = Math.PI / 2.2; aR.castShadow = true; g.add(aR);

  const legGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.7, 8);
  const lL = new THREE.Mesh(legGeo, uniformDark);
  lL.position.set(-0.18, -0.35, 0); lL.castShadow = true; g.add(lL);
  const lR = new THREE.Mesh(legGeo, uniformDark);
  lR.position.set(0.18, -0.35, 0); lR.castShadow = true; g.add(lR);

  g.position.y = 0.85;
  return g;
}

function spawnEnemy() {
  if (!isGameActive) return;
  if (enemies.length >= 8 + wave) return;

  const e = createZombie();
  const sides = [
    [-47,-30],[-47,0],[-47,30],[47,-30],[47,0],[47,30],
    [-30,-47],[0,-47],[30,-47],[-30,47],[0,47],[30,47]
  ];
  const s = sides[Math.floor(Math.random() * sides.length)];
  e.position.set(s[0] + (Math.random() - 0.5) * 3, 0.85, s[1] + (Math.random() - 0.5) * 3);
  e.userData = {
    health: 30 + wave * 8,
    speed: 1.2 + Math.random() * 0.6 + wave * 0.1,
    radius: 0.5,
    walkPhase: Math.random() * Math.PI * 2
  };
  scene.add(e);
  enemies.push(e);
}

// ============================================
// КОЛЛИЗИИ
// ============================================
function checkCollision(pos, r) {
  if (Math.abs(pos.x) > 48.5 || Math.abs(pos.z) > 48.5) return true;

  for (const o of obstacles) {
    if (!o.userData.size) continue;
    const hx = o.userData.size.x / 2;
    const hz = o.userData.size.z / 2;
    const topY = o.position.y + o.userData.size.y / 2;
    if (topY < 0.6) continue;
    if (Math.abs(pos.x - o.position.x) < hx + r &&
        Math.abs(pos.z - o.position.z) < hz + r) {
      return true;
    }
  }
  return false;
}

// ============================================
// СТРЕЛЬБА
// ============================================
function shoot() {
  if (!isGameActive || !canShoot || reloading) return;
  const w = WEAPONS[currentWeapon];
  if (w.ammo <= 0) { reload(); return; }

  canShoot = false;
  w.ammo--;
  updateHUD();
  recoilPitch += currentWeapon === 'shotgun' ? 0.07 : 0.028;
  playShootSound(currentWeapon);

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
        if (en.userData.health <= 0) killEnemy(en);
      }
    }
    createTracer(start, end);
  }
  setTimeout(() => { canShoot = true; }, w.cooldown);
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

function killEnemy(en) {
  scene.remove(en);
  enemies = enemies.filter(e => e !== en);
  score += 10;
  playHitSound();
  updateHUD();
}

// ============================================
// ЗВУКИ
// ============================================
function playShootSound(type) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  if (type === 'shotgun') {
    o.frequency.setValueAtTime(120, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.18);
    g.gain.setValueAtTime(0.3 * volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    o.stop(audioCtx.currentTime + 0.18);
  } else if (type === 'rifle') {
    o.frequency.setValueAtTime(280, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.06);
    g.gain.setValueAtTime(0.15 * volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    o.stop(audioCtx.currentTime + 0.08);
  } else {
    o.frequency.setValueAtTime(200, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.09);
    g.gain.setValueAtTime(0.18 * volume, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    o.stop(audioCtx.currentTime + 0.1);
  }
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
}

function playHitSound() {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(900, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 0.05);
  g.gain.setValueAtTime(0.1 * volume, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start();
  o.stop(audioCtx.currentTime + 0.15);
}

// ============================================
// УПРАВЛЕНИЕ — ФИКС: стрельба на document
// ============================================
function setupControls() {

  // --- КЛАВИАТУРА ---
  document.addEventListener('keydown', (e) => {
    if (!isGameActive) return;

    if (e.code === 'KeyW') keys.w = true;
    if (e.code === 'KeyS') keys.s = true;
    if (e.code === 'KeyA') keys.a = true;
    if (e.code === 'KeyD') keys.d = true;

    if (e.code === 'Space') {
      e.preventDefault();
      if (!isJumping) {
        verticalVelocity = JUMP_POWER;
        isJumping = true;
      }
    }

    if (e.code === 'KeyR') reload();
    if (e.code === 'Digit1') { currentWeapon = 'pistol'; createWeapon('pistol'); updateHUD(); }
    if (e.code === 'Digit2') { currentWeapon = 'rifle'; createWeapon('rifle'); updateHUD(); }
    if (e.code === 'Digit3') { currentWeapon = 'shotgun'; createWeapon('shotgun'); updateHUD(); }
  });

  document.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW') keys.w = false;
    if (e.code === 'KeyS') keys.s = false;
    if (e.code === 'KeyA') keys.a = false;
    if (e.code === 'KeyD') keys.d = false;
  });

  // --- ЗАХВАТ МЫШИ при клике ---
  document.addEventListener('click', () => {
    if (isGameActive && !document.pointerLockElement) {
      renderer.domElement.requestPointerLock();
    }
  });

  // --- ФИКС: СТРЕЛЬБА на document (не на canvas) ---
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (!isGameActive) return;
    isMouseDown = true;
    shoot();
  });

  document.addEventListener('mouseup', (e) => {
    if (e.button === 0) isMouseDown = false;
  });

  // --- ДВИЖЕНИЕ МЫШИ ---
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
      yaw -= e.movementX * MOUSE_SENSITIVITY;
      pitch -= e.movementY * MOUSE_SENSITIVITY;
      pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, pitch));
    }
  });

  // --- АДАПТИВ ---
  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

// ============================================
// ОБНОВЛЕНИЕ ИГРОКА
// ============================================
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
    if (!checkCollision(new THREE.Vector3(nx, camera.position.y, camera.position.z), 0.35)) {
      camera.position.x = nx;
    }
    const nz = camera.position.z + move.z;
    if (!checkCollision(new THREE.Vector3(camera.position.x, camera.position.y, nz), 0.35)) {
      camera.position.z = nz;
    }
  }

  verticalVelocity -= GRAVITY * delta;
  playerY += verticalVelocity * delta;
  if (playerY <= 1.7) {
    playerY = 1.7;
    verticalVelocity = 0;
    isJumping = false;
  }
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

  if (isMouseDown && WEAPONS[currentWeapon].auto && canShoot && !reloading) {
    shoot();
  }
}

function updateEnemies(delta) {
  if (!isGameActive) return;
  enemies.forEach(en => {
    const dir = new THREE.Vector3().subVectors(camera.position, en.position);
    dir.y = 0;
    const dist = dir.length();
    dir.normalize();

    if (dist > 1.6) {
      const np = en.position.clone().addScaledVector(dir, en.userData.speed * delta);
      np.y = 0.85;
      if (!checkCollision(np, en.userData.radius)) {
        en.position.copy(np);
      } else {
        const side = new THREE.Vector3(-dir.z, 0, dir.x);
        const tp = en.position.clone().addScaledVector(side, en.userData.speed * delta);
        tp.y = 0.85;
        if (!checkCollision(tp, en.userData.radius)) en.position.copy(tp);
      }
    } else {
      health -= 0.6;
      showDamage();
      updateHUD();
      if (health <= 0) gameOver();
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
  updatePlayer(d);
  updateEnemies(d);
  renderer.render(scene, camera);
}

// ============================================
// HUD
// ============================================
function updateHUD() {
  const w = WEAPONS[currentWeapon];
  const scoreEl = document.getElementById('score');
  const healthEl = document.getElementById('health');
  const ammoEl = document.getElementById('ammo');

  if (scoreEl) scoreEl.textContent = 'Счёт: ' + score + ' | Волна: ' + wave;
  if (healthEl) healthEl.textContent = '❤️ ' + Math.max(0, Math.floor(health));
  if (ammoEl) ammoEl.textContent = reloading ? '🔄 Перезарядка...' : '🔫 ' + w.name + ' ' + w.ammo + ' / ' + w.maxAmmo;
}

function nextWave() {
  if (!isGameActive) return;
  wave++;
  health = Math.min(100, health + 25);
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
  playerY = 1.7;
  verticalVelocity = 0;
  isJumping = false;
  Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);
  currentWeapon = 'rifle';
  createWeapon('rifle');
  updateHUD();

  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  // Pointer lock будет запрошен при первом клике
}

function gameOver() {
  isGameActive = false;
  document.exitPointerLock();
  document.getElementById('hud').style.display = 'none';
  document.getElementById('gameover').style.display = 'flex';
  document.getElementById('finalScore').textContent = score;
}

function restartGame() {
  enemies.forEach(e => scene.remove(e));
  enemies = [];
  camera.position.set(0, 1.7, 0);
  yaw = 0; pitch = 0; recoilPitch = 0;
  playerY = 1.7; verticalVelocity = 0; isJumping = false;
  startGame();
}

// ============================================
// НАСТРОЙКИ
// ============================================
function setupSettings() {
  const sens = document.getElementById('sensSlider');
  const vol = document.getElementById('volSlider');
  const qual = document.getElementById('qualitySelect');

  if (sens) sens.addEventListener('input', () => { MOUSE_SENSITIVITY = sens.value * 0.0004; });
  if (vol) vol.addEventListener('input', () => { volume = vol.value / 100; });
  if (qual) qual.addEventListener('change', () => {
    if (qual.value === 'low') { renderer.shadowMap.enabled = false; scene.fog.far = 80; }
    else if (qual.value === 'high') { renderer.shadowMap.enabled = true; scene.fog.far = 180; }
    else { renderer.shadowMap.enabled = true; scene.fog.far = 140; }
  });
}

// ============================================
// СТАРТ
// ============================================
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
