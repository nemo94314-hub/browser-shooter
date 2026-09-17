// ============ BROWSER SHOOTER v2.1 ============
// Исправлены коллизии и трассеры

let scene, camera, renderer;
let score = 0;
let health = 100;
let wave = 1;
let isGameActive = false;
let enemies = [];
let obstacles = [];
let weaponParts = [];
let clock = new THREE.Clock();

const keys = { w: false, a: false, s: false, d: false };
let canShoot = true;
const SHOOT_COOLDOWN = 120;

let yaw = 0, pitch = 0;
let recoilPitch = 0;
let recoilRoll = 0;
const MOUSE_SENSITIVITY = 0.002;

let audioCtx = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 30, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshStandardMaterial({ color: 0x1a1e4a, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const grid = new THREE.GridHelper(100, 50, 0x6c63ff, 0x2a2a4a);
    scene.add(grid);

    createWalls();
    createObstacles();
    createWeapon();

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio not available');
    }

    setInterval(spawnEnemy, 1800);
    setInterval(nextWave, 30000);

    setupControls();
    animate();
}

// ============================================
// ОРУЖИЕ
// ============================================
function createWeapon() {
    const gunGroup = new THREE.Group();

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.6, roughness: 0.5 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), metalMat);
    barrel.position.set(0, 0, -0.3);
    gunGroup.add(barrel);

    const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.5), darkMat);
    topRail.position.set(0, 0.06, -0.3);
    gunGroup.add(topRail);

    const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.1), darkMat);
    magazine.position.set(0, -0.12, -0.15);
    magazine.rotation.x = 0.15;
    gunGroup.add(magazine);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.1), gripMat);
    grip.position.set(0, -0.12, 0.05);
    grip.rotation.x = 0.25;
    gunGroup.add(grip);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), metalMat);
    sight.position.set(0, 0.09, -0.55);
    gunGroup.add(sight);

    const scope = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.02), metalMat);
    scope.position.set(0, 0.1, -0.1);
    gunGroup.add(scope);

    gunGroup.position.set(0.3, -0.25, -0.5);
    gunGroup.rotation.y = -0.05;
    gunGroup.rotation.z = 0.02;

    const flash = new THREE.PointLight(0xffaa00, 0, 5);
    flash.position.set(0, 0.05, -0.6);
    gunGroup.add(flash);
    weaponParts.flash = flash;
    weaponParts.group = gunGroup;

    camera.add(gunGroup);
}

// ============================================
// СТЕНЫ И ПРЕПЯТСТВИЯ
// ============================================
function createWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });

    const wallConfigs = [
        { pos: [0, 2, -50], size: [100, 4, 1] },
        { pos: [0, 2, 50], size: [100, 4, 1] },
        { pos: [-50, 2, 0], size: [1, 4, 100] },
        { pos: [50, 2, 0], size: [1, 4, 100] },
    ];

    wallConfigs.forEach(cfg => {
        const geo = new THREE.BoxGeometry(...cfg.size);
        const wall = new THREE.Mesh(geo, wallMat);
        wall.position.set(...cfg.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        // Помечаем как стену и сохраняем размеры
        wall.userData.isWall = true;
        wall.userData.size = { x: cfg.size[0], y: cfg.size[1], z: cfg.size[2] };
        scene.add(wall);
        obstacles.push(wall);
    });
}

function createObstacles() {
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x6c63ff });

    const positions = [
        [10, 1, 10], [-10, 1, -10], [15, 1, -20],
        [-15, 1, 20], [20, 1, 0], [-20, 1, 0],
        [5, 1, -25], [-5, 1, 25], [25, 1, 15], [-25, 1, -15]
    ];

    positions.forEach(pos => {
        const geo = new THREE.BoxGeometry(4, 2, 4);
        const box = new THREE.Mesh(geo, obsMat);
        box.position.set(...pos);
        box.castShadow = true;
        box.receiveShadow = true;
        box.userData.isObstacle = true;
        box.userData.size = { x: 4, y: 2, z: 4 };
        scene.add(box);
        obstacles.push(box);
    });
}

// ============================================
// ВРАГ
// ============================================
function createEnemyMesh() {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.6 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xff6b81, roughness: 0.5 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), bodyMat);
    torso.position.y = 0.5;
    torso.castShadow = true;
    group.add(torso);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
    head.position.y = 1.3;
    head.castShadow = true;
    group.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.35, -0.26);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.35, -0.26);
    group.add(eyeR);

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const pupilGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02);
    const pL = new THREE.Mesh(pupilGeo, pupilMat);
    pL.position.set(-0.12, 1.35, -0.29);
    group.add(pL);
    const pR = new THREE.Mesh(pupilGeo, pupilMat);
    pR.position.set(0.12, 1.35, -0.29);
    group.add(pR);

    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armL = new THREE.Mesh(armGeo, bodyMat);
    armL.position.set(-0.55, 0.6, 0);
    armL.castShadow = true;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, bodyMat);
    armR.position.set(0.55, 0.6, 0);
    armR.castShadow = true;
    group.add(armR);

    const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const legL = new THREE.Mesh(legGeo, bodyMat);
    legL.position.set(-0.2, -0.3, 0);
    legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, bodyMat);
    legR.position.set(0.2, -0.3, 0);
    legR.castShadow = true;
    group.add(legR);

    group.position.y = 1.0;
    return group;
}

// ============================================
// СПАВН
// ============================================
function spawnEnemy() {
    if (!isGameActive) return;
    if (enemies.length >= 8 + wave) return;

    const enemy = createEnemyMesh();

    const angle = Math.random() * Math.PI * 2;
    const radius = 25 + Math.random() * 15;
    enemy.position.set(
        Math.cos(angle) * radius,
        1.0,
        Math.sin(angle) * radius
    );

    enemy.userData = {
        health: 30 + wave * 5,
        speed: 1.5 + Math.random() * 1 + wave * 0.15,
        radius: 0.6
    };

    scene.add(enemy);
    enemies.push(enemy);
}

// ============================================
// КОЛЛИЗИИ (ИСПРАВЛЕНО)
// ============================================
function checkCollision(newPos, radius) {
    for (const obs of obstacles) {
        const obsPos = obs.position;
        let hx, hz;

        if (obs.userData.size) {
            // Используем реальные размеры объекта
            hx = obs.userData.size.x / 2;
            hz = obs.userData.size.z / 2;
        } else {
            continue;
        }

        const dx = Math.abs(newPos.x - obsPos.x);
        const dz = Math.abs(newPos.z - obsPos.z);

        if (dx < hx + radius && dz < hz + radius) {
            return true;
        }
    }

    // Границы карты (внутренние, не соприкасаемся со стенами)
    if (Math.abs(newPos.x) > 48.5 || Math.abs(newPos.z) > 48.5) return true;

    return false;
}

// ============================================
// СТРЕЛЬБА
// ============================================
function shoot() {
    if (!isGameActive || !canShoot) return;

    canShoot = false;
    setTimeout(() => { canShoot = true; }, SHOOT_COOLDOWN);

    recoilPitch += 0.025;
    recoilRoll += (Math.random() - 0.5) * 0.01;

    playShootSound();

    if (weaponParts.flash) {
        weaponParts.flash.intensity = 3;
        setTimeout(() => { if (weaponParts.flash) weaponParts.flash.intensity = 0; }, 50);
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = raycaster.intersectObjects(enemies, true);

    const start = camera.position.clone();
    const end = start.clone().add(raycaster.ray.direction.clone().multiplyScalar(100));

    if (hits.length > 0) {
        end.copy(hits[0].point);
        let enemy = hits[0].object;
        while (enemy.parent && !enemies.includes(enemy)) {
            enemy = enemy.parent;
        }
        if (enemies.includes(enemy)) {
            enemy.userData.health -= 20;
            createHitEffect(hits[0].point);
            if (enemy.userData.health <= 0) killEnemy(enemy);
        }
    }

    createTracer(start, end);
}

// ============================================
// ТРАССЕР (ИСПРАВЛЕНО)
// ============================================
function createTracer(start, end) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({ 
        color: 0x00d4ff, 
        opacity: 0.9, 
        transparent: true 
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    
    setTimeout(() => {
        scene.remove(line);
        geo.dispose();
        mat.dispose();
    }, 40);
}

function createHitEffect(position) {
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(position);
    scene.add(sphere);
    setTimeout(() => {
        scene.remove(sphere);
        geo.dispose();
        mat.dispose();
    }, 150);
}

function killEnemy(enemy) {
    scene.remove(enemy);
    enemies = enemies.filter(e => e !== enemy);
    score += 10;
    playHitSound();
    updateHUD();
}

// ============================================
// ЗВУКИ
// ============================================
function playShootSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(220, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.08);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.1);
}

function playHitSound() {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(800, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + 0.15);
}

// ============================================
// УПРАВЛЕНИЕ
// ============================================
function setupControls() {
    document.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = true;
        if (k === 'a') keys.a = true;
        if (k === 's') keys.s = true;
        if (k === 'd') keys.d = true;
    });

    document.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w') keys.w = false;
        if (k === 'a') keys.a = false;
        if (k === 's') keys.s = false;
        if (k === 'd') keys.d = false;
    });

    document.addEventListener('click', () => {
        if (isGameActive) renderer.domElement.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * MOUSE_SENSITIVITY;
            pitch -= e.movementY * MOUSE_SENSITIVITY;
            pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && isGameActive) shoot();
    });

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ============================================
// ОБНОВЛЕНИЕ
// ============================================
function updatePlayer(delta) {
    if (!isGameActive) return;

    const speed = 15;
    const dir = new THREE.Vector3(
        Number(keys.d) - Number(keys.a),
        0,
        Number(keys.s) - Number(keys.w)
    );
    if (dir.length() > 0) dir.normalize();

    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3()
        .addScaledVector(forward, -dir.z * speed * delta)
        .addScaledVector(right, dir.x * speed * delta);

    // Раздельное движение по осям — чтобы можно было скользить вдоль стен
    const posX = camera.position.clone();
    posX.x += move.x;
    if (!checkCollision(posX, 0.4)) camera.position.x = posX.x;

    const posZ = camera.position.clone();
    posZ.z += move.z;
    if (!checkCollision(posZ, 0.4)) camera.position.z = posZ.z;

    recoilPitch *= 0.9;
    recoilRoll *= 0.9;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch + recoilPitch;
    camera.rotation.z = recoilRoll;

    if (weaponParts.group) {
        const t = performance.now() / 200;
        const bob = dir.length() > 0 ? Math.sin(t) * 0.01 : 0;
        weaponParts.group.position.y = -0.25 + bob;
    }
}

function updateEnemies(delta) {
    if (!isGameActive) return;

    enemies.forEach(enemy => {
        const dir = new THREE.Vector3().subVectors(camera.position, enemy.position);
        dir.y = 0;
        const dist = dir.length();
        dir.normalize();

        if (dist > 1.8) {
            const newPos = enemy.position.clone().addScaledVector(dir, enemy.userData.speed * delta);
            newPos.y = 1.0;
            if (!checkCollision(newPos, enemy.userData.radius)) {
                enemy.position.copy(newPos);
            } else {
                // Обход
                const side = new THREE.Vector3(-dir.z, 0, dir.x);
                const tryPos = enemy.position.clone().addScaledVector(side, enemy.userData.speed * delta);
                tryPos.y = 1.0;
                if (!checkCollision(tryPos, enemy.userData.radius)) {
                    enemy.position.copy(tryPos);
                }
            }
        } else {
            health -= 0.5;
            updateHUD();
            if (health <= 0) gameOver();
        }

        enemy.rotation.y = Math.atan2(dir.x, dir.z);
    });
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    updatePlayer(delta);
    updateEnemies(delta);
    renderer.render(scene, camera);
}

// ============================================
// HUD
// ============================================
function updateHUD() {
    document.getElementById('score').textContent = 'Счёт: ' + score + ' | Волна: ' + wave;
    document.getElementById('health').textContent = '❤️ ' + Math.max(0, Math.floor(health));
}

function nextWave() {
    if (!isGameActive) return;
    wave++;
    health = Math.min(100, health + 20);
    updateHUD();
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('gameover').style.display = 'none';
    isGameActive = true;
    health = 100;
    score = 0;
    wave = 1;
    updateHUD();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
    yaw = 0;
    pitch = 0;
    recoilPitch = 0;
    recoilRoll = 0;
    startGame();
}

window.addEventListener('load', () => {
    init();
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
});
