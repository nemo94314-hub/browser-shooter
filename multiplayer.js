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

  const torso = new THREE.Mesh
