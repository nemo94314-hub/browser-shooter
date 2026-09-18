// ============ ZOMBIESHOOT v4.0 ============
let scene, camera, renderer;
let score=0, health=100, wave=1;
let isGameActive=false;
let enemies=[], obstacles=[], obstaclesBox=[];
let clock=new THREE.Clock();
let yaw=0, pitch=0, recoilPitch=0, recoilRoll=0;
let verticalVelocity=0, playerY=1.7, isJumping=false;
const GRAVITY=22, JUMP_POWER=7.5;
let MOUSE_SENSITIVITY=0.002;
let volume=0.7;

const WEAPONS={
  pistol:{name:'Пистолет',ammo:15,maxAmmo:15,damage:35,cooldown:280,spread:0.004,auto:false,reload:1100,color:0x333344},
  rifle:{name:'Автомат',ammo:30,maxAmmo:30,damage:22,cooldown:90,spread:0.012,auto:true,reload:1800,color:0x2a2a2e},
  shotgun:{name:'Дробовик',ammo:6,maxAmmo:6,damage:20,cooldown:750,spread:0.055,auto:false,reload:2000,pellets:10,color:0x3a2a1a}
};
let currentWeapon='rifle';
let reloading=false, canShoot=true, isMouseDown=false;
let weaponGroup;
let audioCtx=null;
const keys={w:false,a:false,s:false,d:false};

// ============================================
function init(){
  scene=new THREE.Scene();
  scene.background=new THREE.Color(0x87a5c4);
  scene.fog=new THREE.Fog(0x87a5c4,45,140);

  camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,0.1,500);
  camera.position.set(0,playerY,0);
  scene.add(camera);

  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Свет
  scene.add(new THREE.AmbientLight(0xffffff,0.55));
  scene.add(new THREE.HemisphereLight(0xaaccff,0x3a5a30,0.6));
  const sun=new THREE.DirectionalLight(0xfff4d6,1);
  sun.position.set(40,60,20);
  sun.castShadow=true;
  sun.shadow.mapSize.width=2048;
  sun.shadow.mapSize.height=2048;
  sun.shadow.camera.left=-70;
  sun.shadow.camera.right=70;
  sun.shadow.camera.top=70;
  sun.shadow.camera.bottom=-70;
  scene.add(sun);

  createGround();
  createMilitaryBase();
  createWeapon(currentWeapon);

  try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}

  setInterval(spawnEnemy,1600);
  setInterval(nextWave,30000);
  setupControls();
  animate();
  updateHUD();
}

// ============================================
// ЗЕМЛЯ + ТРАВА
// ============================================
function createGround(){
  // Земля
  const ground=new THREE.Mesh(
    new THREE.PlaneGeometry(300,300),
    new THREE.MeshStandardMaterial({color:0x4a6b3a,roughness:0.95})
  );
  ground.rotation.x=-Math.PI/2;
  ground.receiveShadow=true;
  scene.add(ground);

  // Дорога (асфальт по центру)
  const road=new THREE.Mesh(
    new THREE.PlaneGeometry(14,100),
    new THREE.MeshStandardMaterial({color:0x2a2a2e,roughness:0.9})
  );
  road.rotation.x=-Math.PI/2;
  road.position.y=0.01;
  road.receiveShadow=true;
  scene.add(road);

  // Трава (инстансы)
  const grassGeo=new THREE.PlaneGeometry(0.4,0.8);
  const grassMat=new THREE.MeshStandardMaterial({color:0x5a8a3a,side:THREE.DoubleSide,alphaTest:0.5});
  const grassCount=800;
  const grass=new THREE.InstancedMesh(grassGeo,grassMat,grassCount);
  const dummy=new THREE.Object3D();
  for(let i=0;i<grassCount;i++){
    const x=(Math.random()-0.5)*180;
    const z=(Math.random()-0.5)*180;
    if(Math.abs(x)<10&&Math.abs(z)<55) continue; // не на дороге
    dummy.position.set(x,0.4,z);
    dummy.rotation.y=Math.random()*Math.PI;
    dummy.scale.setScalar(0.7+Math.random()*0.8);
    dummy.updateMatrix();
    grass.setMatrixAt(i,dummy.matrix);
  }
  scene.add(grass);

  // Камни
  for(let i=0;i<30;i++){
    const r=0.3+Math.random()*0.6;
    const rock=new THREE.Mesh(
      new THREE.DodecahedronGeometry(r),
      new THREE.MeshStandardMaterial({color:0x555555,roughness:0.9})
    );
    rock.position.set((Math.random()-0.5)*180,r*0.5,(Math.random()-0.5)*180);
    rock.castShadow=true;rock.receiveShadow=true;
    scene.add(rock);
  }
}

// ============================================
// ВОЕННАЯ БАЗА
// ============================================
function createMilitaryBase(){
  // Внешние стены (забор с колючкой)
  const wallMat=new THREE.MeshStandardMaterial({color:0x5a5a5a,roughness:0.85});
  const walls=[
    {pos:[0,2,-50],size:[100,4,1]},
    {pos:[0,2,50],size:[100,4,1]},
    {pos:[-50,2,0],size:[1,4,100]},
    {pos:[50,2,0],size:[1,4,100]}
  ];
  walls.forEach(w=>{
    const wall=new THREE.Mesh(new THREE.BoxGeometry(...w.size),wallMat);
    wall.position.set(...w.pos);
    wall.castShadow=true;wall.receiveShadow=true;
    wall.userData.size={x:w.size[0],y:w.size[1],z:w.size[2]};
    scene.add(wall);obstacles.push(wall);
  });

  // Бетонные блоки (HESCO)
  const hescoMat=new THREE.MeshStandardMaterial({color:0x8a7a5a,roughness:0.95});
  const hescoPositions=[
    [12,1.5,8,3,3,2], [-12,1.5,8,3,3,2], [12,1.5,-8,3,3,2], [-12,1.5,-8,3,3,2],
    [22,1.5,15,3,3,2], [-22,1.5,15,3,3,2], [22,1.5,-15,3,3,2], [-22,1.5,-15,3,3,2],
    [0,1.5,20,6,3,2], [0,1.5,-20,6,3,2]
  ];
  hescoPositions.forEach(([x,y,z,sx,sy,sz])=>{
    const h=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),hescoMat);
    h.position.set(x,y,z);
    h.castShadow=true;h.receiveShadow=true;
    h.userData.size={x:sx,y:sy,z:sz};
    scene.add(h);obstacles.push(h);
  });

  // Ящики
  const crateMat=new THREE.MeshStandardMaterial({color:0x6a552a,roughness:0.9});
  const cratePositions=[
    [8,0.5,3],[-8,0.5,3],[8,0.5,-3],[-8,0.5,-3],
    [15,0.5,0],[-15,0.5,0]
  ];
  cratePositions.forEach(([x,y,z])=>{
    const c=new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2),crateMat);
    c.position.set(x,y,z);
    c.castShadow=true;c.receiveShadow=true;
    c.userData.size={x:1.2,y:1.2,z:1.2};
    scene.add(c);obstacles.push(c);
  });

  // Мешки с песком
  const sandMat=new THREE.MeshStandardMaterial({color:0x9a8a5a,roughness:0.95});
  for(let i=-4;i<=4;i++){
    if(i===0) continue;
    const bag=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,1),sandMat);
    bag.position.set(i*1.5,0.25,-10);
    bag.castShadow=true;bag.receiveShadow=true;
    bag.userData.size={x:1.4,y:0.5,z:1};
    scene.add(bag);obstacles.push(bag);
  }

  // Вышка (смотровая)
  const towerMat=new THREE.MeshStandardMaterial({color:0x4a3a2a,roughness:0.9});
  const towerBase=new THREE.Mesh(new THREE.BoxGeometry(4,6,4),towerMat);
  towerBase.position.set(-35,3,25);
  towerBase.castShadow=true;towerBase.receiveShadow=true;
  towerBase.userData.size={x:4,y:6,z:4};
  scene.add(towerBase);obstacles.push(towerBase);

  const towerRoof=new THREE.Mesh(new THREE.BoxGeometry(5,0.4,5),towerMat);
  towerRoof.position.set(-35,6.2,25);
  towerRoof.castShadow=true;
  scene.add(towerRoof);

  // Палатки (конусы)
  const tentMat=new THREE.MeshStandardMaterial({color:0x556b3a,roughness:0.95,side:THREE.DoubleSide});
  [[-25,0,15],[25,0,15],[-25,0,-15],[25,0,-15]].forEach(([x,y,z])=>{
    const tent=new THREE.Mesh(new THREE.ConeGeometry(2.5,3,8),tentMat);
    tent.position.set(x,1.5,z);
    tent.castShadow=true;tent.receiveShadow=true;
    tent.userData.size={x:3,y:3,z:3};
    scene.add(tent);obstacles.push(tent);
  });

  // Бочки
  const barrelMat=new THREE.MeshStandardMaterial({color:0x8a2a2a,metalness:0.4,roughness:0.6});
  [[18,0.5,18],[-18,0.5,18],[18,0.5,-18],[-18,0.5,-18]].forEach(([x,y,z])=>{
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,1.2,12),barrelMat);
    b.position.set(x,y,z);
    b.castShadow=true;b.receiveShadow=true;
    b.userData.size={x:1,y:1.2,z:1};
    scene.add(b);obstacles.push(b);
  });
}

// ============================================
// ОРУЖИЕ (реалистичное)
// ============================================
function createWeapon(type){
  if(weaponGroup) camera.remove(weaponGroup);
  weaponGroup=new THREE.Group();

  const metalMat=new THREE.MeshStandardMaterial({color:0x2a2a2e,metalness:0.85,roughness:0.35});
  const blackMat=new THREE.MeshStandardMaterial({color:0x0a0a0a,metalness:0.6,roughness:0.6});
  const woodMat=new THREE.MeshStandardMaterial({color:0x5a3a1a,roughness:0.8});
  const gripMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.9});

  if(type==='pistol'){
    const slide=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.09,0.28),metalMat);
    slide.position.set(0,0.02,-0.15);
    weaponGroup.add(slide);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.1,8),metalMat);
    barrel.rotation.x=Math.PI/2;
    barrel.position.set(0,0.02,-0.32);
    weaponGroup.add(barrel);
    const grip=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.2,0.08),gripMat);
    grip.position.set(0,-0.15,0.02);
    grip.rotation.x=0.25;
    weaponGroup.add(grip);
    weaponGroup.position.set(0.22,-0.22,-0.4);
  }
  else if(type==='rifle'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.09,0.5),metalMat);
    body.position.set(0,0,-0.25);
    weaponGroup.add(body);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.5,8),metalMat);
    barrel.rotation.x=Math.PI/2;
    barrel.position.set(0,0.01,-0.7);
    weaponGroup.add(barrel);
    const handguard=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.3),blackMat);
    handguard.position.set(0,-0.01,-0.5);
    weaponGroup.add(handguard);
    const mag=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.22,0.09),blackMat);
    mag.position.set(0,-0.15,-0.15);
    mag.rotation.x=0.15;
    weaponGroup.add(mag);
    const grip=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.18,0.08),gripMat);
    grip.position.set(0,-0.13,0.05);
    grip.rotation.x=0.3;
    weaponGroup.add(grip);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.11,0.25),blackMat);
    stock.position.set(0,-0.02,0.3);
    weaponGroup.add(stock);
    const scope=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.05,0.12),blackMat);
    scope.position.set(0,0.09,-0.1);
    weaponGroup.add(scope);
    weaponGroup.position.set(0.28,-0.26,-0.5);
  }
  else if(type==='shotgun'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.11,0.55),metalMat);
    body.position.set(0,0,-0.25);
    weaponGroup.add(body);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.55,8),metalMat);
    barrel.rotation.x=Math.PI/2;
    barrel.position.set(0,0.03,-0.75);
    weaponGroup.add(barrel);
    const pump=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.2),woodMat);
    pump.position.set(0,-0.03,-0.5);
    weaponGroup.add(pump);
    const grip=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.18,0.09),woodMat);
    grip.position.set(0,-0.14,0.05);
    grip.rotation.x=0.3;
    weaponGroup.add(grip);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.14,0.3),woodMat);
    stock.position.set(0,-0.05,0.3);
    weaponGroup.add(stock);
    weaponGroup.position.set(0.3,-0.28,-0.5);
  }

  const flash=new THREE.PointLight(0xffaa00,0,6);
  flash.position.set(0,0.03,-0.9);
  weaponGroup.add(flash);
  weaponGroup.userData.flash=flash;

  camera.add(weaponGroup);
}

// ============================================
// ЗОМБИ (человекоподобный)
// ============================================
function createZombie(){
  const g=new THREE.Group();
  const skin=new THREE.MeshStandardMaterial({color:0x7a9a4a,roughness:0.9});
  const skinDark=new THREE.MeshStandardMaterial({color:0x4a6a2a,roughness:0.95});
  const uniform=new THREE.MeshStandardMaterial({color:0x5a6a3a,roughness:0.85});
  const uniformDark=new THREE.MeshStandardMaterial({color:0x3a4a2a,roughness:0.9});
  const metal=new THREE.MeshStandardMaterial({color:0x6a7a5a,metalness:0.7,roughness:0.5});
  const eyeGlow=new THREE.MeshBasicMaterial({color:0xff0000});

  // Торс (капсула через цилиндр+сферы)
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.32,1.0,12),uniform);
  torso.position.y=0.5;torso.castShadow=true;g.add(torso);
  const chestTop=new THREE.Mesh(new THREE.SphereGeometry(0.35,12,8),uniform);
  chestTop.position.y=1.0;g.add(chestTop);
  const chestBottom=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,8),uniform);
  chestBottom.position.y=0;g.add(chestBottom);

  // Ремень
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.08,12),uniformDark);
  belt.position.y=0.15;g.add(belt);

  // Шея
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.15,8),skin);
  neck.position.y=1.15;g.add(neck);

  // Голова
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.28,16,12),skin);
  head.position.y=1.45;head.castShadow=true;g.add(head);

  // Челюсть (выдвинутая, зомби-стиль)
  const jaw=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.12,0.15),skinDark);
  jaw.position.set(0,1.35,-0.2);g.add(jaw);

  // Каска
  const helmet=new THREE.Mesh(
    new THREE.SphereGeometry(0.34,16,10,0,Math.PI*2,0,Math.PI/2),
    metal
  );
  helmet.position.y=1.55;helmet.castShadow=true;g.add(helmet);
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.04,16),metal);
  brim.position.y=1.5;g.add(brim);

  // Глаза
  const eyeGeo=new THREE.SphereGeometry(0.05,8,8);
  const eyeL=new THREE.Mesh(eyeGeo,eyeGlow);eyeL.position.set(-0.1,1.48,-0.24);g.add(eyeL);
  const eyeR=new THREE.Mesh(eyeGeo,eyeGlow);eyeR.position.set(0.1,1.48,-0.24);g.add(eyeR);
  const eyeLight=new THREE.PointLight(0xff0000,0.4,2.5);
  eyeLight.position.set(0,1.48,-0.35);g.add(eyeLight);

  // Руки (вытянуты вперёд)
  const armGeo=new THREE.CylinderGeometry(0.1,0.09,0.75,8);
  const armL=new THREE.Mesh(armGeo,uniform);
  armL.position.set(-0.45,0.7,-0.25);armL.rotation.x=Math.PI/2.2;armL.castShadow=true;g.add(armL);
  const armR=new THREE.Mesh(armGeo,uniform);
  armR.position.set(0.45,0.7,-0.25);armR.rotation.x=Math.PI/2.2;armR.castShadow=true;g.add(armR);

  // Кисти рук
  const handGeo=new THREE.SphereGeometry(0.11,8,8);
  const handL=new THREE.Mesh(handGeo,skinDark);handL.position.set(-0.45,0.85,-0.7);g.add(handL);
  const handR=new THREE.Mesh(handGeo,skinDark);handR.position.set(0.45,0.85,-0.7);g.add(handR);

  // Ноги
  const legGeo=new THREE.CylinderGeometry(0.13,0.11,0.7,8);
  const legL=new THREE.Mesh(legGeo,uniformDark);
  legL.position.set(-0.18,-0.35,0);legL.castShadow=true;g.add(legL);
  const legR=new THREE.Mesh(legGeo,uniformDark);
  legR.position.set(0.18,-0.35,0);legR.castShadow=true;g.add(legR);

  // Ботинки
  const bootGeo=new THREE.BoxGeometry(0.24,0.18,0.36);
  const bootMat=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.95});
  const bootL=new THREE.Mesh(bootGeo,bootMat);bootL.position.set(-0.18,-0.8,-0.06);g.add(bootL);
  const bootR=new THREE.Mesh(bootGeo,bootMat);bootR.position.set(0.18,-0.8,-0.06);g.add(bootR);

  // Кровь
  const bloodMat=new THREE.MeshBasicMaterial({color:0x8a0000});
  const b1=new THREE.Mesh(new THREE.SphereGeometry(0.08,8,8),bloodMat);
  b1.position.set(0.25,0.6,-0.31);g.add(b1);
  const b2=new THREE.Mesh(new THREE.SphereGeometry(0.06,8,8),bloodMat);
  b2.position.set(-0.2,0.4,-0.3);g.add(b2);

  g.position.y=0.85;
  return g;
}

function spawnEnemy(){
  if(!isGameActive) return;
  if(enemies.length>=8+wave) return;

  const enemy=createZombie();
  const sides=[
    [-47,-30],[-47,0],[-47,30],
    [47,-30],[47,0],[47,30],
    [-30,-47],[0,-47],[30,-47],
    [-30,47],[0,47],[30,47]
  ];
  const side=sides[Math.floor(Math.random()*sides.length)];
  enemy.position.set(side[0]+(Math.random()-0.5)*3,0.85,side[1]+(Math.random()-0.5)*3);

  enemy.userData={
    health:30+wave*8,
    speed:1.2+Math.random()*0.6+wave*0.1,
    radius:0.5,
    walkPhase:Math.random()*Math.PI*2
  };
  scene.add(enemy);
  enemies.push(enemy);
}

// ============================================
// КОЛЛИЗИИ
// ============================================
function checkCollision(newPos,radius){
  for(const obs of obstacles){
    if(!obs.userData.size) continue;
    const hx=obs.userData.size.x/2;
    const hz=obs.userData.size.z/2;
    const topY=obs.position.y+obs.userData.size.y/2;
    if(topY<0.6) continue;
    const dx=Math.abs(newPos.x-obs.position.x);
    const dz=Math.abs(newPos.z-obs.position.z);
    if(dx<hx+radius&&dz<hz+radius) return true;
  }
  if(Math.abs(newPos.x)>48.5||Math.abs(newPos.z)>48.5) return true;
  return false;
}

// ============================================
// СТРЕЛЬБА
// ============================================
function shoot(){
  if(!isGameActive||!canShoot||reloading) return;
  const w=WEAPONS[currentWeapon];
  if(w.ammo<=0){reload();return;}

  canShoot=false;
  w.ammo--;
  updateHUD();

  recoilPitch+=currentWeapon==='shotgun'?0.07:0.028;
  recoilRoll+=(Math.random()-0.5)*0.018;
  playShootSound(currentWeapon);

  if(weaponGroup.userData.flash){
    weaponGroup.userData.flash.intensity=4;
    setTimeout(()=>{if(weaponGroup.userData.flash)weaponGroup.userData.flash.intensity=0;},60);
  }

  const pellets=w.pellets||1;
  for(let i=0;i<pellets;i++){
    const ray=new THREE.Raycaster();
    const sx=(Math.random()-0.5)*w.spread*2;
    const sy=(Math.random()-0.5)*w.spread*2;
    ray.setFromCamera(new THREE.Vector2(sx,sy),camera);

    const hits=ray.intersectObjects(enemies,true);
    const start=camera.position.clone();
    const end=start.clone().add(ray.ray.direction.clone().multiplyScalar(150));

    if(hits.length>0){
      end.copy(hits[0].point);
      let en=hits[0].object;
      while(en.parent&&!enemies.includes(en)) en=en.parent;
      if(enemies.includes(en)){
        en.userData.health-=w.damage;
        createBlood(hits[0].point);
        if(en.userData.health<=0) killEnemy(en);
      }
    }
    createTracer(start,end);
  }
  setTimeout(()=>{canShoot=true;},w.cooldown);
  if(w.ammo<=0) setTimeout(reload,250);
}

function reload(){
  if(reloading) return;
  const w=WEAPONS[currentWeapon];
  if(w.ammo===w.maxAmmo) return;
  reloading=true;updateHUD();
  setTimeout(()=>{w.ammo=w.maxAmmo;reloading=false;updateHUD();},w.reload);
}

function createTracer(a,b){
  const geo=new THREE.BufferGeometry().setFromPoints([a,b]);
  const mat=new THREE.LineBasicMaterial({color:0xffee88,opacity:0.85,transparent:true});
  const line=new THREE.Line(geo,mat);
  scene.add(line);
  setTimeout(()=>{scene.remove(line);geo.dispose();mat.dispose();},40);
}

function createBlood(pos){
  for(let i=0;i<6;i++){
    const geo=new THREE.SphereGeometry(0.08+Math.random()*0.06,6,6);
    const mat=new THREE.MeshBasicMaterial({color:0x8a0000});
    const s=new THREE.Mesh(geo,mat);
    s.position.copy(pos);
    scene.add(s);
    const vel=new THREE.Vector3((Math.random()-0.5)*2,Math.random()*2,(Math.random()-0.5)*2);
    let life=0;
    const iv=setInterval(()=>{
      life+=0.05;
      s.position.addScaledVector(vel,0.05);
      vel.y-=0.15;
      s.scale.multiplyScalar(0.9);
      if(life>0.5){clearInterval(iv);scene.remove(s);geo.dispose();mat.dispose();}
    },30);
  }
}

function killEnemy(en){
  scene.remove(en);
  enemies=enemies.filter(e=>e!==en);
  score+=10;playHitSound();updateHUD();
}

// ============================================
// ЗВУКИ
// ============================================
function playShootSound(type){
  if(!audioCtx) return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='square';
  if(type==='shotgun'){
    o.frequency.setValueAtTime(120,audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(35,audioCtx.currentTime+0.18);
    g.gain.setValueAtTime(0.3*volume,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.18);
    o.stop(audioCtx.currentTime+0.18);
  } else if(type==='rifle'){
    o.frequency.setValueAtTime(280,audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(70,audioCtx.currentTime+0.06);
    g.gain.setValueAtTime(0.15*volume,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.08);
    o.stop(audioCtx.currentTime+0.08);
  } else {
    o.frequency.setValueAtTime(200,audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55,audioCtx.currentTime+0.09);
    g.gain.setValueAtTime(0.18*volume,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.1);
    o.stop(audioCtx.currentTime+0.1);
  }
  o.connect(g);g.connect(audioCtx.destination);o.start();
}
function playHitSound(){
  if(!audioCtx) return;
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type='sine';
  o.frequency.setValueAtTime(900,audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(1400,audioCtx.currentTime+0.05);
  g.gain.setValueAtTime(0.1*volume,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.15);
  o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.15);
}

// ============================================
// УПРАВЛЕНИЕ (ФИКС: space + shoot)
// ============================================
function setupControls(){
  document.addEventListener('keydown',e=>{
    if(!isGameActive) return;
    const k=e.key.toLowerCase();
    if(k==='w'||k==='ц'||e.code==='KeyW') keys.w=true;
    if(k==='s'||k==='ы'||e.code==='KeyS') keys.s=true;
    if(k==='a'||k==='ф'||e.code==='KeyA') keys.a=true;
    if(k==='d'||k==='в'||e.code==='KeyD') keys.d=true;

    // ФИКС: пробел через e.code
    if(e.code==='Space'){
      e.preventDefault();
      if(!isJumping){
        verticalVelocity=JUMP_POWER;
        isJumping=true;
      }
    }
    if(e.code==='KeyR') reload();
    if(e.code==='Digit1'){currentWeapon='pistol';createWeapon('pistol');updateHUD();}
    if(e.code==='Digit2'){currentWeapon='rifle';createWeapon('rifle');updateHUD();}
    if(e.code==='Digit3'){currentWeapon='shotgun';createWeapon('shotgun');updateHUD();}
  });
  document.addEventListener('keyup',e=>{
    const k=e.key.toLowerCase();
    if(k==='w'||k==='ц'||e.code==='KeyW') keys.w=false;
    if(k==='s'||k==='ы'||e.code==='KeyS') keys.s=false;
    if(k==='a'||k==='ф'||e.code==='KeyA') keys.a=false;
    if(k==='d'||k==='в'||e.code==='KeyD') keys.d=false;
  });

  // ФИКС: стрельба на document
  document.addEventListener('mousedown',e=>{
    if(e.button===0&&isGameActive){
      isMouseDown=true;
      if(!document.pointerLockElement){
        renderer.domElement.requestPointerLock();
      }
      shoot();
    }
  });
  document.addEventListener('mouseup',e=>{
    if(e.button===0) isMouseDown=false;
  });

  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement===renderer.domElement){
      yaw-=e.movementX*MOUSE_SENSITIVITY;
      pitch-=e.movementY*MOUSE_SENSITIVITY;
      pitch=Math.max(-Math.PI/2+0.05,Math.min(Math.PI/2-0.05,pitch));
    }
  });

  addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
}

// ============================================
// ОБНОВЛЕНИЕ
// ============================================
function updatePlayer(delta){
  if(!isGameActive) return;
  const speed=7.5;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=new THREE.Vector3();
  let moved=false;
  if(keys.w){move.add(forward);moved=true;}
  if(keys.s){move.sub(forward);moved=true;}
  if(keys.a){move.sub(right);moved=true;}
  if(keys.d){move.add(right);moved=true;}

  if(moved){
    move.normalize().multiplyScalar(speed*delta);
    const nx=camera.position.x+move.x;
    if(!checkCollision(new THREE.Vector3(nx,camera.position.y,camera.position.z),0.35)) camera.position.x=nx;
    const nz=camera.position.z+move.z;
    if(!checkCollision(new THREE.Vector3(camera.position.x,camera.position.y,nz),0.35)) camera.position.z=nz;
  }

  verticalVelocity-=GRAVITY*delta;
  playerY+=verticalVelocity*delta;
  if(playerY<=1.7){playerY=1.7;verticalVelocity=0;isJumping=false;}
  camera.position.y=playerY;

  recoilPitch*=0.88;recoilRoll*=0.88;
  camera.rotation.order='YXZ';
  camera.rotation.y=yaw;
  camera.rotation.x=pitch+recoilPitch;
  camera.rotation.z=recoilRoll;

  if(weaponGroup){
    const t=performance.now()/220;
    const bob=moved?Math.sin(t)*0.012:0;
    weaponGroup.position.y=-0.26+bob;
  }

  if(isMouseDown&&WEAPONS[currentWeapon].auto&&canShoot&&!reloading) shoot();
}

function updateEnemies(delta){
  if(!isGameActive) return;
  enemies.forEach(en=>{
    const dir=new THREE.Vector3().subVectors(camera.position,en.position);
    dir.y=0;
    const dist=dir.length();
    dir.normalize();

    if(dist>1.6){
      const np=en.position.clone().addScaledVector(dir,en.userData.speed*delta);
      np.y=0.85;
      if(!checkCollision(np,en.userData.radius)){
        en.position.copy(np);
      } else {
        const side=new THREE.Vector3(-dir.z,0,dir.x);
        const tp=en.position.clone().addScaledVector(side,en.userData.speed*delta);
        tp.y=0.85;
        if(!checkCollision(tp,en.userData.radius)) en.position.copy(tp);
      }
    } else {
      health-=0.6;
      showDamage();
      updateHUD();
      if(health<=0) gameOver();
    }
    en.rotation.y=Math.atan2(dir.x,dir.z);
    // Покачивание при ходьбе
    en.userData.walkPhase+=delta*4;
    en.position.y=0.85+Math.abs(Math.sin(en.userData.walkPhase))*0.05;
  });
}

function showDamage(){
  const v=document.getElementById('damageVignette');
  v.style.opacity='0.8';
  setTimeout(()=>v.style.opacity='0',150);
}

function animate(){
  requestAnimationFrame(animate);
  const delta=Math.min(clock.getDelta(),0.05);
  updatePlayer(delta);
  updateEnemies(delta);
  renderer.render(scene,camera);
}

// ============================================
// HUD
// ============================================
function updateHUD(){
  const w=WEAPONS[currentWeapon];
  document.getElementById('score').textContent='Счёт: '+score+' | Волна: '+wave;
  document.getElementById('health').textContent='❤️ '+Math.max(0,Math.floor(health));
  const a=document.getElementById('ammo');
  if(a) a.textContent=reloading?'🔄 Перезарядка...':'🔫 '+w.name+' '+w.ammo+' / '+w.maxAmmo;
}

function nextWave(){
  if(!isGameActive) return;
  wave++;
  health=Math.min(100,health+25);
  Object.keys(WEAPONS).forEach(k=>WEAPONS[k].ammo=WEAPONS[k].maxAmmo);
  updateHUD();
}

function startGame(){
  document.getElementById('menu').style.display='none';
  document.getElementById('hud').style.display='block';
  document.getElementById('gameover').style.display='none';
  isGameActive=true;health=100;score=0;wave=1;
  playerY=1.7;verticalVelocity=0;isJumping=false;
  Object.keys(WEAPONS).forEach(k=>WEAPONS[k].ammo=WEAPONS[k].maxAmmo);
  currentWeapon='rifle';createWeapon('rifle');
  updateHUD();
  if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume();
}

function gameOver(){
  isGameActive=false;
  document.exitPointerLock();
  document.getElementById('hud').style.display='none';
  document.getElementById('gameover').style.display='flex';
  document.getElementById('finalScore').textContent=score;
}

function restartGame(){
  enemies.forEach(e=>scene.remove(e));
  enemies=[];
  camera.position.set(0,1.7,0);
  yaw=0;pitch=0;recoilPitch=0;recoilRoll=0;
  playerY=1.7;verticalVelocity=0;isJumping=false;
  startGame();
}

// ============================================
// НАСТРОЙКИ
// ============================================
function setupSettings(){
  const sens=document.getElementById('sensSlider');
  const vol=document.getElementById('volSlider');
  const qual=document.getElementById('qualitySelect');
  sens.addEventListener('input',()=>{MOUSE_SENSITIVITY=sens.value*0.0004;});
  vol.addEventListener('input',()=>{volume=vol.value/100;});
  qual.addEventListener('change',()=>{
    if(qual.value==='low'){renderer.shadowMap.enabled=false;scene.fog.far=80;}
    else if(qual.value==='high'){renderer.shadowMap.enabled=true;scene.fog.far=160;}
    else {renderer.shadowMap.enabled=true;scene.fog.far=120;}
  });
}

window.addEventListener('load',()=>{
  init();
  setupSettings();
  document.getElementById('startBtn').addEventListener('click',startGame);
  document.getElementById('restartBtn').addEventListener('click',restartGame);
  document.getElementById('settingsBtn').addEventListener('click',()=>{
    document.getElementById('menu').style.display='none';
    document.getElementById('settings').style.display='flex';
  });
  document.getElementById('closeSettings').addEventListener('click',()=>{
    document.getElementById('settings').style.display='none';
    document.getElementById('menu').style.display='flex';
  });
});
