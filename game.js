// ============ BROWSER SHOOTER ============
// Простой 3D-шутер на Three.js

let scene, camera, renderer;
let score = 0;
let health = 100;
let isGameActive = false;
let enemies = [];
let bullets = [];
const clock = new THREE.Clock();

// --- Движение игрока ---
const keys = { w: false, a: false, s: false, d: false, space: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let canJump = true;

// --- Мышь ---
let yaw = 0, pitch = 0;
const MOUSE_SENSITIVITY = 0.002;

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function init() {
    // Сцена
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);
    scene.fog = new THREE.Fog(0x0a0e27, 30, 100);

    // Камера
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 0);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Пол
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a1e4a,
        roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Сетка на полу
    const grid = new THREE.GridHelper(100, 50, 0x6c63ff, 0x2a2a4a);
    scene.add(grid);

    // Стены (кубы по периметру)
    createWalls();

    // Несколько препятствий
    createObstacles();

    // Начинаем спавнить врагов
    setInterval(spawnEnemy, 2000);

    // Обработчики
    setupControls();
    animate();
}

// ============================================
// СОЗДАНИЕ СТЕН И УКРЫТИЙ
// ============================================
function createWalls() {
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });

    // Внешние стены
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
        scene.add(wall);
    });
}

function createObstacles() {
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x6c63ff });
    
    const positions = [
        [10, 1, 10], [-10, 1, -10], [15, 1, -20], 
        [-15, 1, 20], [20, 1, 0], [-20, 1, 0]
    ];

    positions.forEach(pos => {
        const geo = new THREE.BoxGeometry(4, 2, 4);
        const box = new THREE.Mesh(geo, obsMat);
        box.position.set(...pos);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
    });
}

// ============================================
// ВРАГИ
// ============================================
function spawnEnemy() {
    if (!isGameActive) return;
    if (enemies.length >= 8) return;

    const size = 1;
    const geo = new THREE.BoxGeometry(size, size * 2, size);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4757 });
    const enemy = new THREE.Mesh(geo, mat);
    
    // Спавн в случайной точке по кругу
    const angle = Math.random() * Math.PI * 2;
    const radius = 25 + Math.random() * 15;
    enemy.position.set(
        Math.cos(angle) * radius,
        1,
        Math.sin(angle) * radius
    );
    enemy.castShadow = true;
    enemy.userData = { health: 30, speed: 1.5 + Math.random() * 1.5 };
    
    scene.add(enemy);
    enemies.push(enemy);
}

// ============================================
// СТРЕЛЬБА
// ============================================
function shoot() {
    if (!isGameActive) return;

    // Raycast из центра экрана
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

    // Проверяем попадания по врагам
    const enemyMeshes = enemies;
    const hits = raycaster.intersectObjects(enemyMeshes);

    // Визуальный эффект выстрела (линия)
    const start = camera.position.clone();
    const end = start.clone().add(
        raycaster.ray.direction.clone().multiplyScalar(100)
    );
    
    if (hits.length > 0) {
        // Попадание
        end.copy(hits[0].point);
        const enemy = hits[0].object;
        enemy.userData.health -= 15;

        // Вспышка попадания
        createHitEffect(hits[0].point);

        if (enemy.userData.health <= 0) {
            killEnemy(enemy);
        }
    }

    // Линия выстрела (трассер)
    createTracer(start, end);
}

function createTracer(start, end) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, opacity: 0.8, transparent: true });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    
    setTimeout(() => scene.remove(line), 80);
}

function createHitEffect(position) {
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const sphere = new THREE.Mesh(geo, mat);
    sphere.position.copy(position);
    scene.add(sphere);
    
    setTimeout(() => scene.remove(sphere), 150);
}

function killEnemy(enemy) {
    scene.remove(enemy);
    enemies = enemies.filter(e => e !== enemy);
    score += 10;
    updateHUD();
}

// ============================================
// УПРАВЛЕНИЕ
// ============================================
function setupControls() {
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') keys.w = true;
        if (key === 'a') keys.a = true;
        if (key === 's') keys.s = true;
        if (key === 'd') keys.d = true;
        if (key === ' ') keys.space = true;
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') keys.w = false;
        if (key === 'a') keys.a = false;
        if (key === 's') keys.s = false;
        if (key === 'd') keys.d = false;
        if (key === ' ') keys.space = false;
    });

    // Мышь (pointer lock)
    document.addEventListener('click', () => {
        if (isGameActive) {
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

    // Стрельба
    document.addEventListener('mousedown', (e) => {
        if (e.button === 0 && isGameActive) shoot();
    });

    // Изменение размера окна
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
    
    // Направление движения
    direction.z = Number(keys.w) - Number(keys.s);
    direction.x = Number(keys.d) - Number(keys.a);
    direction.normalize();

    // Движение относительно поворота камеры
    const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    velocity.x = (forward.x * direction.z + right.x * direction.x) * speed * delta;
    velocity.z = (forward.z * direction.z + right.z * direction.x) * speed * delta;

    camera.position.x += velocity.x;
    camera.position.z += velocity.z;

    // Ограничение по карте
    camera.position.x = Math.max(-48, Math.min(48, camera.position.x));
    camera.position.z = Math.max(-48, Math.min(48, camera.position.z));

    // Поворот камеры
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

function updateEnemies(delta) {
    if (!isGameActive) return;

    enemies.forEach(enemy => {
        // Враги идут к игроку
        const dir = new THREE.Vector3()
            .subVectors(camera.position, enemy.position);
        dir.y = 0;
        const dist = dir.length();
        dir.normalize();

        if (dist > 1.5) {
            enemy.position.x += dir.x * enemy.userData.speed * delta;
            enemy.position.z += dir.z * enemy.userData.speed * delta;
        } else {
            // Атака игрока
            health -= 0.5;
            updateHUD();
            if (health <= 0) gameOver();
        }

        // Поворот врага к игроку
        enemy.lookAt(camera.position.x, enemy.position.y, camera.position.z);
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
// HUD И СОСТОЯНИЯ ИГРЫ
// ============================================
function updateHUD() {
    document.getElementById('score').textContent = 'Счёт: ' + score;
    document.getElementById('health').textContent = '❤️ ' + Math.max(0, Math.floor(health));
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('gameover').style.display = 'none';
    isGameActive = true;
    health = 100;
    score = 0;
    updateHUD();
}

function gameOver() {
    isGameActive = false;
    document.exitPointerLock();
    document.getElementById('hud').style.display = 'none';
    document.getElementById('gameover').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
}

function restartGame() {
    // Очищаем врагов
    enemies.forEach(e => scene.remove(e));
    enemies = [];
    
    // Сброс позиции
    camera.position.set(0, 1.7, 0);
    yaw = 0;
    pitch = 0;
    
    startGame();
}

// ============================================
// ЗАПУСК
// ============================================
window.addEventListener('load', () => {
    init();
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
});
