// ============ MULTIPLAYER через Firebase ============
let currentRoom = null;
let currentRoomCode = null;
let myPlayerId = null;
let isHost = false;
let playersRef = null;
let remotePlayers = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function generatePlayerId() {
  return 'p_' + Math.random().toString(36).substr(2, 9);
}

async function createRoom() {
  if (!window.firebaseDB) { alert('Firebase не подключен'); return; }

  myPlayerId = generatePlayerId();
  currentRoomCode = generateRoomCode();
  isHost = true;

  currentRoom = window.firebaseDB.ref('rooms/' + currentRoomCode);
  playersRef = currentRoom.child('players');

  await currentRoom.set({
    host: myPlayerId,
    created: Date.now(),
    state: 'waiting'
  });

  await playersRef.child(myPlayerId).set({
    name: 'Хозяин',
    x: 0, y: 1.7, z: 0,
    yaw: 0,
    health: 100,
    weapon: 'rifle',
    lastUpdate: Date.now()
  });

  playersRef.on('value', (snapshot) => {
    const players = snapshot.val() || {};
    updateRoomUI(players);
    syncRemotePlayers(players);
  });

  currentRoom.child('state').on('value', (snap) => {
    if (snap.val() === 'playing' && !isHost) {
      startMultiplayerGame();
    }
  });

  document.getElementById('roomInfo').style.display = 'block';
  document.getElementById('roomCodeDisplay').textContent = currentRoomCode;
  document.getElementById('startMPBtn').style.display = 'block';
}

async function joinRoom(code) {
  if (!window.firebaseDB) { alert('Firebase не подключен'); return; }
  code = code.toUpperCase().trim();
  if (code.length !== 6) { alert('Код должен быть 6 символов'); return; }

  const testRef = window.firebaseDB.ref('rooms/' + code);
  const snapshot = await testRef.once('value');
  if (!snapshot.exists()) { alert('Комната не найдена'); return; }

  myPlayerId = generatePlayerId();
  currentRoomCode = code;
  isHost = false;
  currentRoom = testRef;
  playersRef = currentRoom.child('players');

  await playersRef.child(myPlayerId).set({
    name: 'Игрок ' + Math.floor(Math.random() * 100),
    x: (Math.random() - 0.5) * 10,
    y: 1.7,
    z: (Math.random() - 0.5) * 10,
    yaw: 0,
    health: 100,
    weapon: 'rifle',
    lastUpdate: Date.now()
  });

  playersRef.on('value', (snapshot) => {
    const players = snapshot.val() || {};
    updateRoomUI(players);
    syncRemotePlayers(players);
  });

  currentRoom.child('state').on('value', (snap) => {
    if (snap.val() === 'playing') startMultiplayerGame();
  });

  document.getElementById('roomInfo').style.display = 'block';
  document.getElementById('roomCodeDisplay').textContent = currentRoomCode;
  document.getElementById('startMPBtn').style.display = 'none';
}

function updateRoomUI(players) {
  const list = Object.keys(players);
  const countEl = document.getElementById('playerCount');
  if (countEl) countEl.textContent = list.length;
}

function syncRemotePlayers(players) {
  const now = Date.now();

  Object.keys(players).forEach(pid => {
    if (pid === myPlayerId) return;
    const p = players[pid];

    if (now - p.lastUpdate > 5000) {
      if (remotePlayers[pid]) {
        scene.remove(remotePlayers[pid].mesh);
        delete remotePlayers[pid];
      }
      return;
    }

    if (!remotePlayers[pid]) {
      const mesh = createRemotePlayerMesh(p.name || 'Player');
      mesh.position.set(p.x, p.y, p.z);
      scene.add(mesh);
      remotePlayers[pid] = {
        mesh: mesh,
        targetPos: new THREE.Vector3(p.x, p.y, p.z),
        targetYaw: p.yaw || 0
      };
    } else {
      remotePlayers[pid].targetPos.set(p.x, p.y, p.z);
      remotePlayers[pid].targetYaw = p.yaw || 0;
    }
  });

  Object.keys(remotePlayers).forEach(pid => {
    if (!players[pid]) {
      scene.remove(remotePlayers[pid].mesh);
      delete remotePlayers[pid];
    }
  });
}

function createRemotePlayerMesh(name) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0x5566aa });
  const uniform = new THREE.MeshStandardMaterial({ color: 0x2a3a5a });
  const glow = new THREE.MeshBasicMaterial({ color: 0x00d4ff });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 1.0, 8), uniform);
  torso.position.y = 0.5; torso.castShadow = true; g.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), skin);
  head.position.y = 1.45; head.castShadow = true; g.add(head);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), glow);
  eyeL.position.set(-0.1, 1.5, -0.24); g.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), glow);
  eyeR.position.set(0.1, 1.5, -0.24); g.add(eyeR);

  const nameSprite = makeNameSprite(name);
  nameSprite.position.y = 2.2;
  g.add(nameSprite);

  g.position.y = 0.9;
  return g;
}

function makeNameSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 28px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(text.substring(0, 16), 128, 42);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 0.4, 1);
  return sprite;
}

function updateRemotePlayers(delta) {
  Object.keys(remotePlayers).forEach(pid => {
    const rp = remotePlayers[pid];
    rp.mesh.position.lerp(rp.targetPos, delta * 10);
    const curYaw = rp.mesh.rotation.y;
    const diff = rp.targetYaw - curYaw;
    rp.mesh.rotation.y += diff * delta * 8;
  });
}

let lastSendTime = 0;
function sendMyPosition() {
  if (!playersRef || !myPlayerId) return;
  if (typeof isGameActive !== 'undefined' && !isGameActive) return;
  const now = performance.now();
  if (now - lastSendTime < 100) return;
  lastSendTime = now;

  playersRef.child(myPlayerId).update({
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    yaw: yaw,
    health: Math.floor(health),
    weapon: currentWeapon,
    lastUpdate: Date.now()
  });
}

function startMultiplayerGame() {
  document.getElementById('multiplayerMenu').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  document.getElementById('bgCanvas').style.display = 'none';

  currentLevel = 1;
  survivalActive = false;
  survivalMode = null;
  wave = 1;
  health = 100;
  score = 0;
  hitsTaken = 0;
  medkits = 2;
  playerY = 1.7;
  verticalVelocity = 0;
  isJumping = false;
  currentBoss = null;

  Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);
  enemies.forEach(e => scene.remove(e)); enemies = [];
  enemyBullets.forEach(b => scene.remove(b.mesh)); enemyBullets = [];
  grenades.forEach(g => scene.remove(g.mesh)); grenades = [];
  lootCrates.forEach(l => scene.remove(l)); lootCrates = [];
  corpses.forEach(c => scene.remove(c)); corpses = [];
  bloodStains.forEach(b => scene.remove(b)); bloodStains = [];

  camera.position.set(0, playerY, 0);
  yaw = 0; pitch = 0;

  buildLevelEnvironment(1);
  currentWeapon = 'rifle';
  createWeapon(currentWeapon);
  updateHUD();

  isGameActive = true;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (window.startBackgroundMusic) window.startBackgroundMusic();
  startHorrorAmbient();

  if (!isMobile) setTimeout(() => {
    if (renderer.domElement.requestPointerLock) renderer.domElement.requestPointerLock();
  }, 200);

  for (let i = 0; i < 3; i++) setTimeout(() => spawnEnemy(), i * 500);
  if (window._spawnInt) clearInterval(window._spawnInt);
  window._spawnInt = setInterval(() => spawnEnemy(), 2000);
  if (window._waveInt) clearInterval(window._waveInt);
  window._waveInt = setInterval(() => nextWave(), 25000);
}

async function leaveRoom() {
  if (playersRef && myPlayerId) {
    try { await playersRef.child(myPlayerId).remove(); } catch(e){}
  }
  if (isHost && currentRoom) {
    try { await currentRoom.remove(); } catch(e){}
  }
  if (currentRoom) currentRoom.off();

  Object.keys(remotePlayers).forEach(pid => {
    scene.remove(remotePlayers[pid].mesh);
  });
  remotePlayers = {};

  currentRoom = null;
  currentRoomCode = null;
  myPlayerId = null;
  isHost = false;
  playersRef = null;

  document.getElementById('roomInfo').style.display = 'none';
}

function setupMultiplayerUI() {
  const mpBtn = document.getElementById('multiplayerBtn');
  if (mpBtn) {
    mpBtn.addEventListener('click', () => {
      document.getElementById('menu').style.display = 'none';
      document.getElementById('multiplayerMenu').style.display = 'flex';
      const mpCoins = document.getElementById('mpCoins');
      if (mpCoins) mpCoins.textContent = PROGRESS.coins;
    });
  }

  const backBtn = document.getElementById('backFromMultiplayer');
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      await leaveRoom();
      document.getElementById('multiplayerMenu').style.display = 'none';
      document.getElementById('menu').style.display = 'flex';
    });
  }

  const createBtn = document.getElementById('createRoomBtn');
  if (createBtn) createBtn.addEventListener('click', createRoom);

  const joinBtn = document.getElementById('joinRoomBtn');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const code = document.getElementById('roomCodeInput').value;
      if (code) joinRoom(code);
    });
  }

  const startBtn = document.getElementById('startMPBtn');
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      if (!isHost) return;
      await currentRoom.update({ state: 'playing' });
      startMultiplayerGame();
    });
  }

  const leaveBtn = document.getElementById('leaveRoomBtn');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', async () => {
      await leaveRoom();
      document.getElementById('roomInfo').style.display = 'none';
    });
  }
}
