// ============ ZOMBIE SHOOTER v3.1 ============
// Исправлено: спавн вне препятствий, зомби в военной форме, карта без ошибок

let scene, camera, renderer;
let score = 0;
let health = 100;
let wave = 1;
let isGameActive = false;
let enemies = [];
let obstacles = [];
let weaponParts = {};
let clock = new THREE.Clock();

const keys = { w: false, a: false, s: false, d: false, space: false };
let canShoot = true;

// --- Оружие ---
const WEAPONS = {
    pistol:  { name: 'Пистолет', ammo: 30, maxAmmo: 30, damage: 25, cooldown: 250, spread: 0.005, auto: false, reload: 1200 },
    shotgun: { name: 'Дробовик', ammo: 8,  maxAmmo: 8,  damage: 15, cooldown: 700, spread: 0.05,  auto: false, reload: 1800, pellets: 8 },
    rifle:   { name: 'Автомат',  ammo: 30, maxAmmo: 30, damage: 18, cooldown: 100, spread: 0.02,  auto: true,  reload: 2000 }
};
let currentWeapon = 'pistol';
let reloading = false;
let isMouseDown = false;

// --- Игрок ---
let yaw = 0, pitch = 0;
let recoilPitch = 0, recoilRoll = 0;
let playerY = 1.7;
let verticalVelocity = 0;
let isJumping = false;
const GRAVITY = 25;
const JUMP_POWER = 8;
const MOUSE_SENSITIVITY = 0.002;

let audioCtx = null;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 30, 110);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, playerY, 0);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
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

    createMap();
    createWeapon(currentWeapon);

    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio not available');
    }

    setInterval(spawnEnemy, 1800);
    setInterval(nextWave, 30000);

    setupControls();
    animate();
    updateHUD();
}

// ============================================
// КАРТА (исправлена — без центрального блока)
// ============================================
function createMap() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x6c63ff });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x4a5530 }); // военные ящики

    // Внешние стены
    const walls = [
        { pos: [0, 2, -50], size: [100, 4, 1] },
        { pos: [0, 2, 50],  size: [100, 4, 1] },
        { pos: [-50, 2, 0], size: [1, 4, 100] },
        { pos: [50, 2, 0],  size: [1, 4, 100] },
    ];
    walls.forEach(cfg => {
        const geo = new THREE.BoxGeometry(...cfg.size);
        const wall = new THREE.Mesh(geo, wallMat);
        wall.position.set(...cfg.pos);
        wall.castShadow = true;
        wall.receiveShadow = true;
        wall.userData.size = { x: cfg.size[0], y: cfg.size[1], z: cfg.size[2] };
        scene.add(wall);
        obstacles.push(wall);
    });

    // Укрытия (не в центре 0,0!)
    const boxes = [
        // Квадрант 1 (+X +Z)
        [15, 1, 15, 4, 2, 4], [22, 1, 25, 3, 2, 3], [28, 1, 10, 5, 2, 5],
        // Квадрант 2 (−X +Z)
        [-15, 1, 15, 4, 2, 4], [-22, 1, 25, 3, 2, 3], [-28, 1, 10, 5, 2, 5],
        // Квадрант 3 (+X −Z)
        [15, 1, -15, 4, 2, 4], [22, 1, -25, 3, 2, 3], [28, 1, -10, 5, 2, 5],
        // Квадрант 4 (−X −Z)
        [-15, 1, -15, 4, 2, 4], [-22, 1, -25, 3, 2, 3], [-28, 1, -10, 5, 2, 5],
        // По бокам от центра
        [35, 1, 0, 3, 2, 8], [-35, 1, 0, 3, 2, 8],
        [0, 1, 35, 8, 2, 3], [0, 1, -35, 8, 2, 3]
    ];

    boxes.forEach(([x, y, z, sx, sy, sz]) => {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const box = new THREE.Mesh(geo, obsMat);
        box.position.set(x, y, z);
        box.castShadow = true;
        box.receiveShadow = true;
        box.userData.size = { x: sx, y: sy, z: sz };
        scene.add(box);
        obstacles.push(box);
    });

    // Военные ящики (доп. детали)
    const crates = [
        [8, 0.5, 8, 1, 1, 1],
        [-8, 0.5, -8, 1, 1, 1],
        [8, 0.5, -8, 1, 1, 1],
        [-8, 0.5, 8, 1, 1, 1],
        [12, 0.5, -5, 1, 1, 1],
        [-12, 0.5, 5, 1, 1, 1]
    ];
    crates.forEach(([x, y, z, sx, sy, sz]) => {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const crate = new THREE.Mesh(geo, crateMat);
        crate.position.set(x, y, z);
        crate.castShadow = true;
        crate.receiveShadow = true;
        crate.userData.size = { x: sx, y: sy, z: sz };
        scene.add(crate);
        obstacles.push(crate);
    });

    // Мешки с песком у входа (обозначают зону)
    for (let i = -3; i <= 3; i++) {
        const bag = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.5, 1),
            new THREE.MeshStandardMaterial({ color: 0x8b7d55, roughness: 0.95 })
        );
        bag.position.set(i * 1.6, 0.25, -8);
        bag.castShadow = true;
        bag.receiveShadow = true;
        bag.userData.size = { x: 1.5, y: 0.5, z: 1 };
        scene.add(bag);
        obstacles.push(bag);
    }
}

// ============================================
// ОРУЖИЕ
// ============================================
function createWeapon(type) {
    if (weaponParts.group) camera.remove(weaponParts.group);
    weaponParts = {};

    const gunGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x333344, metalness: 0.8, roughness: 0.3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, metalness: 0.6, roughness: 0.5 });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    if (type === 'pistol') {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), metalMat);
        barrel.position.set(0, 0, -0.2);
        gunGroup.add(barrel);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.1), gripMat);
        grip.position.set(0, -0.13, 0.05);
        grip.rotation.x = 0.3;
        gunGroup.add(grip);
        gunGroup.position.set(0.25, -0.25, -0.5);
    } else if (type === 'shotgun') {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.9), metalMat);
        barrel.position.set(0, 0, -0.45);
        gunGroup.add(barrel);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), gripMat);
        grip.position.set(0, -0.15, 0.05);
        grip.rotation.x = 0.3;
        gunGroup.add(grip);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), darkMat);
        stock.position.set(0, -0.05, 0.25);
        gunGroup.add(stock);
        gunGroup.position.set(0.3, -0.28, -0.5);
    } else if (type === 'rifle') {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.8), metalMat);
        barrel.position.set(0, 0, -0.4);
        gunGroup.add(barrel);
        const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.1), darkMat);
        magazine.position.set(0, -0.15, -0.15);
        magazine.rotation.x = 0.15;
        gunGroup.add(magazine);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.1), gripMat);
        grip.position.set(0, -0.13, 0.08);
        grip.rotation.x = 0.3;
        gunGroup.add(grip);
        gunGroup.position.set(0.3, -0.28, -0.5);
    }

    const flash = new THREE.PointLight(0xffaa00, 0, 5);
    flash.position.set(0, 0.05, -0.7);
    gunGroup.add(flash);
    weaponParts.flash = flash;
    weaponParts.group = gunGroup;

    camera.add(gunGroup);
}

// ============================================
// ЗОМБИ В ВОЕННОЙ ФОРМЕ
// ============================================
function createEnemyMesh() {
    const group = new THREE.Group();
    
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3a, roughness: 0.9 });
    const darkSkinMat = new THREE.MeshStandardMaterial({ color: 0x3a5a20, roughness: 0.95 });
    const uniformMat = new THREE.MeshStandardMaterial({ color: 0x4a5530, roughness: 0.8 });
    const uniformDarkMat = new THREE.MeshStandardMaterial({ color: 0x2a3520, roughness: 0.85 });
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x556644, metalness: 0.7, roughness: 0.5 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    // Торс — военная куртка
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), uniformMat);
    torso.position.y = 0.5;
    torso.castShadow = true;
    group.add(torso);
    
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.1, 0.52), uniformDarkMat);
    belt.position.y = 0.1;
    group.add(belt);

    // Голова — зелёная кожа
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.position.y = 1.3;
    head.castShadow = true;
    group.add(head);
    
    // Каска
    const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        metalMat
    );
    helmet.position.y = 1.5;
    helmet.castShadow = true;
    group.add(helmet);
    
    const helmetBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.05, 16),
        metalMat
    );
    helmetBrim.position.y = 1.45;
    group.add(helmetBrim);

    // Красные глаза (светящиеся)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.08, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.32, -0.26);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.32, -0.26);
    group.add(eyeR);
    
    const eyeLight = new THREE.PointLight(0xff0000, 0.4, 2.5);
    eyeLight.position.set(0, 1.32, -0.3);
    group.add(eyeLight);

    // Руки
    const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armL = new THREE.Mesh(armGeo, uniformMat);
    armL.position.set(-0.55, 0.6, 0);
    armL.castShadow = true;
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, uniformMat);
    armR.position.set(0.55, 0.6, 0);
    armR.castShadow = true;
    group.add(armR);
    
    // Кисти рук (зелёные)
    const handGeo = new THREE.BoxGeometry(0.18, 0.15, 0.18);
    const handL = new THREE.Mesh(handGeo, darkSkinMat);
    handL.position.set(-0.55, 0.2, 0);
    group.add(handL);
    const handR = new THREE.Mesh(handGeo, darkSkinMat);
    handR.position.set(0.55, 0.2, 0);
    group.add(handR);

    // Ноги
    const legGeo = new THREE.BoxGeometry(0.25, 0.6, 0.25);
    const legL = new THREE.Mesh(legGeo, uniformDarkMat);
    legL.position.set(-0.2, -0.3, 0);
    legL.castShadow = true;
    group.add(legL);
    const legR = new THREE.Mesh(legGeo, uniformDarkMat);
    legR.position.set(0.2, -0.3, 0);
    legR.castShadow = true;
    group.add(legR);
    
    // Ботинки
    const bootGeo = new THREE.BoxGeometry(0.28, 0.15, 0.35);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const bootL = new THREE.Mesh(bootGeo, bootMat);
    bootL.position.set(-0.2, -0.65, -0.05);
    group.add(bootL);
    const bootR = new THREE.Mesh(bootGeo, bootMat);
    bootR.position.set(0.2, -0.65, -0.05);
    group.add(bootR);

    // Кровавые пятна
    const bloodMat = new THREE.MeshBasicMaterial({ color: 0x6a0000 });
    const bloodGeo = new THREE.BoxGeometry(0.15, 0.15, 0.02);
    const blood1 = new THREE.Mesh(bloodGeo, bloodMat);
    blood1.position.set(0.2, 0.6, -0.26);
    group.add(blood1);
    const blood2 = new THREE.Mesh(bloodGeo, bloodMat);
    blood2.position.set(-0.3, 0.3, -0.26);
    group.add(blood2);

    group.position.y = 1.0;
    return group;
}

// ============================================
// СПАВН (зомби приходят из-за краёв карты)
// ============================================
function spawnEnemy() {
    if (!isGameActive) return;
    if (enemies.length >= 8 + wave) return;

    const enemy = createEnemyMesh();

    // Спавн по краям карты (не в углах, где могут быть препятствия)
    const sides = [
        [-45, -20], [-45, 0], [-45, 20],   // левая стена
        [45, -20], [45, 0], [45, 20],       // правая стена
        [-20, -45], [0, -45], [20, -45],   // передняя
        [-20, 45], [0, 45], [20, 45]        // задняя
    ];
    const side = sides[Math.floor(Math.random() * sides.length)];
    enemy.position.set(
        side[0] + (Math.random() - 0.5) * 3,
        1.0,
        side[1] + (Math.random() - 0.5) * 3
    );

    enemy.userData = {
        health: 30 + wave * 5,
        speed: 1.3 + Math.random() * 0.8 + wave * 0.12,
        radius: 0.6
    };

    scene.add(enemy);
    enemies.push(enemy);
}

// ============================================
// КОЛЛИЗИИ
// ============================================
function checkCollision(newPos, radius) {
    for (const obs of obstacles) {
        const obsPos = obs.position;
        if (!obs.userData.size) continue;

        const hx = obs.userData.size.x / 2;
        const hz = obs.userData.size.z / 2;

        // Не проверяем высоту — препятствия от 0 до 2 м считаются "полными"
        // но если препятствие ниже 0.6 м (мешки с песком) — можно перешагнуть
        const topY = obsPos.y + obs.userData.size.y / 2;
        if (topY < 0.6) continue;

        const dx = Math.abs(newPos.x - obsPos.x);
        const dz = Math.abs(newPos.z - obsPos.z);

        if (dx < hx + radius && dz < hz + radius) return true;
    }

    if (Math.abs(newPos.x) > 48.5 || Math.abs(newPos.z) > 48.5) return true;
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

    recoilPitch += currentWeapon === 'shotgun' ? 0.06 : 0.025;
    recoilRoll += (Math.random() - 0.5) * 0.015;

    playShootSound(currentWeapon);

    if (weaponParts.flash) {
        weaponParts.flash.intensity = 3;
        setTimeout(() => { if (weaponParts.flash) weaponParts.flash.intensity = 0; }, 50);
    }

    const pellets = w.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const raycaster = new THREE.Raycaster();
        const spreadX = (Math.random() - 0.5) * w.spread * 2;
        const spreadY = (Math.random() - 0.5) * w.spread * 2;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

        const hits = raycaster.intersectObjects(enemies, true);
        const start = camera.position.clone();
        const end = start.clone().add(raycaster.ray.direction.clone().multiplyScalar(100));

        if (hits.length > 0) {
            end.copy(hits[0].point);
            let enemy = hits[0].object;
            while (enemy.parent && !enemies.includes(enemy)) enemy = enemy.parent;
            if (enemies.includes(enemy)) {
                enemy.userData.health -= w.damage;
                createHitEffect(hits[0].point);
                if (enemy.userData.health <= 0) killEnemy(enemy);
            }
        }

        createTracer(start, end);
    }

    setTimeout(() => { canShoot = true; }, w.cooldown);
    if (w.ammo <= 0) setTimeout(reload, 200);
}

function reload() {
    if (reloading) return;
    const w = WEAPONS[currentWeapon];
    if (w.ammo === w.maxAmmo) return;

    reloading = true;
    updateHUD();

    setTimeout(() => {
        w.ammo = w.maxAmmo;
        reloading = false;
        updateHUD();
    }, w.reload);
}

function createTracer(start, end) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, opacity: 0.9, transparent: true });
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
    const mat = new THREE.MeshBasicMaterial({ color: 0xaa0000 });
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
function playShootSound(type) {
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';

    if (type === 'shotgun') {
        o.frequency.setValueAtTime(150, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
        g.gain.setValueAtTime(0.25, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        o.stop(audioCtx.currentTime + 0.15);
    } else if (type === 'rifle') {
        o.frequency.setValueAtTime(300, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.06);
        g.gain.setValueAtTime(0.12, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        o.stop(audioCtx.currentTime + 0.08);
    } else {
        o.frequency.setValueAtTime(220, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.08);
        g.gain.setValueAtTime(0.15, audioCtx.currentTime);
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
    const handleKeyDown = (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'ц' || k === 'arrowup') keys.w = true;
        if (k === 's' || k === 'ы' || k === 'arrowdown') keys.s = true;
        if (k === 'a' || k === 'ф' || k === 'arrowleft') keys.a = true;
        if (k === 'd' || k === 'в' || k === 'arrowright') keys.d = true;
        if (k === ' ' || k === 'spacebar') {
            e.preventDefault();
            if (!isJumping && isGameActive) {
                verticalVelocity = JUMP_POWER;
                isJumping = true;
            }
        }
        if (k === 'r' || k === 'к') reload();
        if (k === '1') { currentWeapon = 'pistol'; createWeapon('pistol'); updateHUD(); }
        if (k === '2') { currentWeapon = 'shotgun'; createWeapon('shotgun'); updateHUD(); }
        if (k === '3') { currentWeapon = 'rifle'; createWeapon('rifle'); updateHUD(); }
    };
    const handleKeyUp = (e) => {
        const k = e.key.toLowerCase();
        if (k === 'w' || k === 'ц' || k === 'arrowup') keys.w = false;
        if (k === 's' || k === 'ы' || k === 'arrowdown') keys.s = false;
        if (k === 'a' || k === 'ф' || k === 'arrowleft') keys.a = false;
        if (k === 'd' || k === 'в' || k === 'arrowright') keys.d = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    renderer.domElement.addEventListener('click', () => {
        if (isGameActive && !document.pointerLockElement) {
            renderer.domElement.requestPointerLock();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (document.pointerLockElement === renderer.domElement) {
            yaw -= e.movementX * MOUSE_SENSITIVITY;
            pitch -= e.movementY * MOUSE_SENSITIVITY;
            pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
        }
    });

    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && isGameActive) {
            isMouseDown = true;
            shoot();
        }
    });
    document.addEventListener('mouseup', (e) => {
        if (e.button === 0) isMouseDown = false;
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

    const speed = 8;
    let moved = false;

    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const move = new THREE.Vector3(0, 0, 0);

    if (keys.w) { move.add(forward); moved = true; }
    if (keys.s) { move.sub(forward); moved = true; }
    if (keys.a) { move.sub(right); moved = true; }
    if (keys.d) { move.add(right); moved = true; }

    if (moved) {
        move.normalize();
        move.multiplyScalar(speed * delta);

        const newX = camera.position.x + move.x;
        if (!checkCollision(new THREE.Vector3(newX, camera.position.y, camera.position.z), 0.4)) {
            camera.position.x = newX;
        }
        const newZ = camera.position.z + move.z;
        if (!checkCollision(new THREE.Vector3(camera.position.x, camera.position.y, newZ), 0.4)) {
            camera.position.z = newZ;
        }
    }

    // Прыжок
    verticalVelocity -= GRAVITY * delta;
    playerY += verticalVelocity * delta;

    if (playerY <= 1.7) {
        playerY = 1.7;
        verticalVelocity = 0;
        isJumping = false;
    }

    camera.position.y = playerY;

    recoilPitch *= 0.9;
    recoilRoll *= 0.9;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch + recoilPitch;
    camera.rotation.z = recoilRoll;

    if (weaponParts.group) {
        const t = performance.now() / 200;
        const bob = moved ? Math.sin(t) * 0.01 : 0;
        weaponParts.group.position.y = -0.25 + bob;
    }

    if (isMouseDown && WEAPONS[currentWeapon].auto && canShoot && !reloading) {
        shoot();
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
    const w = WEAPONS[currentWeapon];
    document.getElementById('score').textContent = 'Счёт: ' + score + ' | Волна: ' + wave;
    document.getElementById('health').textContent = '❤️ ' + Math.max(0, Math.floor(health));
    
    const ammoEl = document.getElementById('ammo');
    if (ammoEl) {
        ammoEl.textContent = reloading ? '🔄 Перезарядка...' : '🔫 ' + w.name + ' ' + w.ammo + ' / ' + w.maxAmmo;
    }
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
    document.getElementById('hud').style.display = 'block';
    document.getElementById('gameover').style.display = 'none';
    isGameActive = true;
    health = 100;
    score = 0;
    wave = 1;
    playerY = 1.7;
    verticalVelocity = 0;
    isJumping = false;
    Object.keys(WEAPONS).forEach(k => WEAPONS[k].ammo = WEAPONS[k].maxAmmo);
    currentWeapon = 'pistol';
    createWeapon('pistol');
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
    playerY = 1.7;
    verticalVelocity = 0;
    isJumping = false;
    startGame();
}

window.addEventListener('load', () => {
    init();
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
});
