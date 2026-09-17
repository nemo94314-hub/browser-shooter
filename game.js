// ============ BROWSER SHOOTER v3.0 ============
// Патроны, прыжок, 3 вида оружия, новая карта

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
    scene.fog = new THREE.Fog(0x0a0e27, 30, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, playerY, 0);
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

    // Пол
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
// НОВАЯ КАРТА (более интересная)
// ============================================
function createMap() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x6c63ff });
    const highMat = new THREE.MeshStandardMaterial({ color: 0x4a4aff });

    // Внешние стены (4)
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

    // Центральное здание
    const center = new THREE.Mesh(new THREE.BoxGeometry(15, 6, 15), wallMat);
    center.position.set(0, 3, 0);
    center.castShadow = true;
    center.receiveShadow = true;
    center.userData.size = { x: 15, y: 6, z: 15 };
    scene.add(center);
    obstacles.push(center);

    // Вход в центр (отверстие — показываем маленькими кубами вокруг)
    // 4 стены центра с проходом
    // (пропускаем — центр сделали сплошным, добавим 4 куба вокруг)

    // Кубы-укрытия (разбросаны)
    const boxes = [
        // Квадрант 1
        [15, 1, 15, 4, 2, 4], [20, 1, 25, 3, 2, 3], [25, 1, 10, 5, 2, 5],
        // Квадрант 2
        [-15, 1, 15, 4, 2, 4], [-20, 1, 25, 3, 2, 3], [-25, 1, 10, 5, 2, 5],
        // Квадрант 3
        [15, 1, -15, 4, 2, 4], [20, 1, -25, 3, 2, 3], [25, 1, -10, 5, 2, 5],
        // Квадрант 4
        [-15, 1, -15, 4, 2, 4], [-20, 1, -25, 3, 2, 3], [-25, 1, -10, 5, 2, 5],
        // Дополнительные
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

    // Высокие платформы (можно залезть при прыжке)
    const platforms = [
        [12, 1, 0, 6, 0.5, 6],
        [-12, 1, 0, 6, 0.5, 6],
        [0, 1, 12, 6, 0.5, 6],
        [0, 1, -12, 6, 0.5, 6],
    ];
    platforms.forEach(([x, y, z, sx, sy, sz]) => {
        const geo = new THREE.BoxGeometry(sx, sy, sz);
        const plat = new THREE.Mesh(geo, highMat);
        plat.position.set(x, y, z);
        plat.castShadow = true;
        plat.receiveShadow = true;
        plat.userData.size = { x: sx, y: sy, z: sz };
        scene.add(plat);
        obstacles.push(plat);
    });
}

// ============================================
// ОРУЖИЕ (3 вида)
// ============================================
function createWeapon(type) {
    // Удаляем старое оружие
    if (weaponParts.group) {
        camera.remove(weaponParts.group);
    }
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
        const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.02), metalMat);
        sight.position.set(0, 0.05, -0.35);
        gunGroup.add(sight);
        gunGroup.position.set(0.25, -0.25, -0.5);
    } 
    else if (type === 'shotgun') {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.9), metalMat);
        barrel.position.set(0, 0, -0.45);
        gunGroup.add(barrel);
        const barrel2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.9), darkMat);
        barrel2.position.set(0, -0.12, -0.45);
        gunGroup.add(barrel2);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), gripMat);
        grip.position.set(0, -0.15, 0.05);
        grip.rotation.x = 0.3;
        gunGroup.add(grip);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, 0.3), darkMat);
        stock.position.set(0, -0.05, 0.25);
        gunGroup.add(stock);
        gunGroup.position.set(0.3, -0.28, -0.5);
    } 
    else if (type === 'rifle') {
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.8), metalMat);
        barrel.position.set(0, 0, -0.4);
        gunGroup.add(barrel);
        const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.6), darkMat);
        topRail.position.set(0, 0.05, -0.4);
        gunGroup.add(topRail);
        const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.1), darkMat);
        magazine.position.set(0, -0.15, -0.15);
        magazine.rotation.x = 0.15;
        gunGroup.add(magazine);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.1), gripMat);
        grip.position.set(0, -0.13, 0.08);
        grip.rotation.x = 0.3;
        gunGroup.add(grip);
        const scope = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.15), metalMat);
        scope.position.set(0, 0.1, -0.1);
        gunGroup.add(scope);
        gunGroup.position.set(0.3, -0.28, -0.5);
    }

    // Вспышка
    const flash = new THREE.PointLight(0xffaa00, 0, 5);
    flash.position.set(0, 0.05, -0.7);
    gunGroup.add(flash);
    weaponParts.flash = flash;
    weaponParts.group = gunGroup;

    camera.add(gunGroup);
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

    // Спавн в углах карты (дальше от центра)
    const corners = [[45, 45], [-45, 45], [45, -45], [-45, -45], [0, 45], [45, 0], [-45, 0], [0, -45]];
    const corner = corners[Math.floor(Math.random() * corners.length)];
    enemy.position.set(
        corner[0] + (Math.random() - 0.5) * 6,
        1.0,
        corner[1] + (Math.random() - 0.5) * 6
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
// КОЛЛИЗИИ
// ============================================
function checkCollision(newPos, radius) {
    for (const obs of obstacles) {
        const obsPos = obs.position;
        let hx, hz;

        if (obs.userData.size) {
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

    if (Math.abs(newPos.x) > 48.5 || Math.abs(newPos.z) > 48.5) return true;

    return false;
}

// ============================================
// СТРЕЛЬБА
// ============================================
function shoot() {
    if (!isGameActive || !canShoot || reloading) return;

    const w = WEAPONS[currentWeapon];

    if (w.ammo <= 0) {
        reload();
        return;
    }

    canShoot = false;
    w.ammo--;
    updateHUD();

    // Отдача
    recoilPitch += currentWeapon === 'shotgun' ? 0.06 : 0.025;
    recoilRoll += (Math.random() - 0.5) * 0.015;

    // Звук
    playShootSound(currentWeapon);

    // Вспышка
    if (weaponParts.flash) {
        weaponParts.flash.intensity = 3;
        setTimeout(() => { if (weaponParts.flash) weaponParts.flash.intensity = 0; }, 50);
    }

    // Количество дробин (для дробовика)
    const pellets = w.pellets || 1;

    for (let i = 0; i < pellets; i++) {
        const raycaster = new THREE.Raycaster();
        
        // Разброс
        const spreadX = (Math.random() - 0.5) * w.spread * 2;
        const spreadY = (Math.random() - 0.5) * w.spread * 2;
        raycaster.setFromCamera(new THREE.Vector2(spreadX, spreadY), camera);

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
                enemy.userData.health -= w.damage;
                createHitEffect(hits[0].point);
                if (enemy.userData.health <= 0) killEnemy(enemy);
            }
        }

        createTracer(start, end);
    }

    // Перезарядка после выстрела (через cooldown)
    setTimeout(() => { canShoot = true; }, w.cooldown);

    // Автоперезарядка, если патроны кончились
    if (w.ammo <= 0) {
        setTimeout(reload, 200);
    }
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
    const mat = new THREE.LineBasicMaterial({ 
        color: 0x00d4ff, opacity: 0.9, transparent: true 
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

    // Обычный клик — стрельба
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
// ОБНОВЛЕНИЕ ИГРОКА
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

    // Прыжок (гравитация)
    verticalVelocity -= GRAVITY * delta;
    playerY += verticalVelocity * delta;

    if (playerY <= 1.7) {
        playerY = 1.7;
        verticalVelocity = 0;
        isJumping = false;
    }

    camera.position.y = playerY;

    // Отдача
    recoilPitch *= 0.9;
    recoilRoll *= 0.9;

    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch + recoilPitch;
    camera.rotation.z = recoilRoll;

    // Покачивание оружия
    if (weaponParts.group) {
        const t = performance.now() / 200;
        const bob = moved ? Math.sin(t) * 0.01 : 0;
        weaponParts.group.position.y = -0.25 + bob;
    }

    // Автоматическая стрельба для rifle
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
        if (reloading) {
            ammoEl.textContent = '🔄 Перезарядка...';
        } else {
            ammoEl.textContent = '🔫 ' + w.name + ' ' + w.ammo + ' / ' + w.maxAmmo;
        }
    }
}

function nextWave() {
    if (!isGameActive) return;
    wave++;
    health = Math.min(100, health + 20);
    // Восстанавливаем патроны между волнами
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
