// ============ ZOMBIESHOOT v15.2 — PART 1/2 ============

const DEFAULT_PROGRESS={
  coins:0,
  levels:{
    0:{unlocked:true,completed:false,stars:0},1:{unlocked:true,completed:false,stars:0},
    2:{unlocked:false,completed:false,stars:0},3:{unlocked:false,completed:false,stars:0},
    4:{unlocked:false,completed:false,stars:0},5:{unlocked:false,completed:false,stars:0},
    6:{unlocked:false,completed:false,stars:0},7:{unlocked:false,completed:false,stars:0},
    8:{unlocked:false,completed:false,stars:0},9:{unlocked:false,completed:false,stars:0},
    10:{unlocked:false,completed:false,stars:0},11:{unlocked:false,completed:false,stars:0}
  },
  ownedSkins:['default'],ownedWeapons:['pistol','rifle','shotgun'],currentSkin:'default',
  upgrades:{damage:0,reload:0,health:0},achievements:{},
  records:{bestScore:0,survivalBest:{easy:0,normal:0,hard:0,nightmare:0},totalKills:0,totalHeadshots:0,totalDeaths:0,gamesPlayed:0}
};
function loadProgress(){
  try{
    const s=localStorage.getItem('zombieshoot_progress_v15');
    if(s){
      const loaded=JSON.parse(s);
      const merged=JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
      if(loaded.levels)for(let i=0;i<=11;i++)if(loaded.levels[i])merged.levels[i]=Object.assign(merged.levels[i],loaded.levels[i]);
      if(loaded.coins!==undefined)merged.coins=loaded.coins;
      if(loaded.ownedSkins)merged.ownedSkins=loaded.ownedSkins;
      if(loaded.ownedWeapons)merged.ownedWeapons=loaded.ownedWeapons;
      if(loaded.currentSkin)merged.currentSkin=loaded.currentSkin;
      if(loaded.upgrades)merged.upgrades=Object.assign(merged.upgrades,loaded.upgrades);
      if(loaded.achievements)merged.achievements=loaded.achievements;
      if(loaded.records)merged.records=Object.assign(merged.records,loaded.records);
      return merged;
    }
  }catch(e){console.error(e);}
  return JSON.parse(JSON.stringify(DEFAULT_PROGRESS));
}
let PROGRESS=loadProgress();
function saveProgress(){try{localStorage.setItem('zombieshoot_progress_v15',JSON.stringify(PROGRESS));}catch(e){}}
function resetProgress(){PROGRESS=JSON.parse(JSON.stringify(DEFAULT_PROGRESS));saveProgress();updateCoinsDisplay();renderLevelGrid();updateAchCount();}

const LEVELS={
  0:{name:'Тренировка',icon:'🎓',waves:1,boss:false,maxEnemies:3,enemySpeed:0.8,enemyHealth:50,enemyDamage:0,shooterChance:0,grenadierChance:0,runnerChance:0,tankChance:0,bomberChance:0,spiderChance:0,theme:'grass',sky:0x87a5c4,fog:0x87a5c4,fogNear:50,fogFar:130,ambient:0.9,isTutorial:true},
  1:{name:'Лагерь',icon:'⛺',waves:1,boss:false,maxEnemies:5,enemySpeed:1.2,enemyHealth:30,enemyDamage:0.5,shooterChance:0.3,grenadierChance:0.05,runnerChance:0.05,tankChance:0,bomberChance:0,spiderChance:0,theme:'grass',sky:0x0a0a1a,fog:0x050510,fogNear:8,fogFar:40,ambient:0.08},
  2:{name:'Лес',icon:'🌲',waves:2,boss:false,maxEnemies:7,enemySpeed:1.4,enemyHealth:45,enemyDamage:0.6,shooterChance:0.4,grenadierChance:0.10,runnerChance:0.10,tankChance:0.02,bomberChance:0.02,spiderChance:0.02,theme:'forest',sky:0x050a05,fog:0x030803,fogNear:6,fogFar:35,ambient:0.06},
  3:{name:'Деревня',icon:'🏘️',waves:3,boss:false,maxEnemies:9,enemySpeed:1.6,enemyHealth:60,enemyDamage:0.7,shooterChance:0.5,grenadierChance:0.15,runnerChance:0.12,tankChance:0.04,bomberChance:0.05,spiderChance:0.03,theme:'village',sky:0x1a0a05,fog:0x0a0503,fogNear:7,fogFar:38,ambient:0.07},
  4:{name:'Пустыня',icon:'🏜️',waves:4,boss:false,maxEnemies:11,enemySpeed:1.8,enemyHealth:75,enemyDamage:0.8,shooterChance:0.6,grenadierChance:0.20,runnerChance:0.15,tankChance:0.06,bomberChance:0.08,spiderChance:0.04,theme:'desert',sky:0x2a1a05,fog:0x1a1005,fogNear:10,fogFar:50,ambient:0.15},
  5:{name:'Завод',icon:'🏭',waves:5,boss:false,maxEnemies:12,enemySpeed:1.9,enemyHealth:90,enemyDamage:0.9,shooterChance:0.6,grenadierChance:0.25,runnerChance:0.15,tankChance:0.08,bomberChance:0.10,spiderChance:0.05,theme:'factory',sky:0x0a0a0a,fog:0x050505,fogNear:5,fogFar:30,ambient:0.05},
  6:{name:'Метро',icon:'🚇',waves:6,boss:false,maxEnemies:13,enemySpeed:2.0,enemyHealth:110,enemyDamage:1.0,shooterChance:0.65,grenadierChance:0.3,runnerChance:0.18,tankChance:0.10,bomberChance:0.12,spiderChance:0.08,theme:'metro',sky:0x000000,fog:0x000000,fogNear:4,fogFar:22,ambient:0.03},
  7:{name:'Лаборатория',icon:'🧪',waves:7,boss:false,maxEnemies:14,enemySpeed:2.1,enemyHealth:130,enemyDamage:1.2,shooterChance:0.7,grenadierChance:0.35,runnerChance:0.20,tankChance:0.12,bomberChance:0.15,spiderChance:0.10,theme:'lab',sky:0x001a10,fog:0x000a05,fogNear:5,fogFar:28,ambient:0.06},
  8:{name:'Логово Босса',icon:'💀',waves:8,boss:true,maxEnemies:15,enemySpeed:2.3,enemyHealth:150,enemyDamage:1.4,shooterChance:0.7,grenadierChance:0.4,runnerChance:0.22,tankChance:0.15,bomberChance:0.15,spiderChance:0.10,theme:'lair',sky:0x1a0000,fog:0x0a0000,fogNear:4,fogFar:25,ambient:0.05},
  9:{name:'Больница',icon:'🏥',waves:9,boss:false,maxEnemies:16,enemySpeed:2.2,enemyHealth:180,enemyDamage:1.5,shooterChance:0.5,grenadierChance:0.2,runnerChance:0.25,tankChance:0.15,bomberChance:0.12,spiderChance:0.18,theme:'hospital',sky:0x0a1a1a,fog:0x051010,fogNear:4,fogFar:25,ambient:0.10},
  10:{name:'Кладбище',icon:'🪦',waves:10,boss:false,maxEnemies:18,enemySpeed:2.4,enemyHealth:220,enemyDamage:1.7,shooterChance:0.4,grenadierChance:0.25,runnerChance:0.30,tankChance:0.18,bomberChance:0.15,spiderChance:0.20,theme:'cemetery',sky:0x080820,fog:0x0a0a20,fogNear:3,fogFar:18,ambient:0.06},
  11:{name:'Крыша',icon:'🏢',waves:12,boss:true,maxEnemies:20,enemySpeed:2.6,enemyHealth:280,enemyDamage:2.0,shooterChance:0.55,grenadierChance:0.3,runnerChance:0.30,tankChance:0.20,bomberChance:0.15,spiderChance:0.15,theme:'rooftop',sky:0x0a0a30,fog:0x1a1a40,fogNear:20,fogFar:80,ambient:0.15}
};

const SURVIVAL_MODES={
  easy:{icon:'🟢',name:'Лёгкий',desc:'Медленные зомби',enemySpeed:1.0,enemyHealth:0.7,enemyDamage:0.6,shooterChance:0.3,grenadierChance:0.05,runnerChance:0.05,tankChance:0,bomberChance:0,spiderChance:0,maxEnemies:8,spawnInterval:2500},
  normal:{icon:'🔵',name:'Обычный',desc:'Стандарт',enemySpeed:1.3,enemyHealth:1.0,enemyDamage:1.0,shooterChance:0.5,grenadierChance:0.15,runnerChance:0.15,tankChance:0.05,bomberChance:0.05,spiderChance:0.05,maxEnemies:12,spawnInterval:2000},
  hard:{icon:'🟠',name:'Сложный',desc:'Быстрые стрелки',enemySpeed:1.7,enemyHealth:1.4,enemyDamage:1.4,shooterChance:0.7,grenadierChance:0.25,runnerChance:0.25,tankChance:0.15,bomberChance:0.10,spiderChance:0.15,maxEnemies:16,spawnInterval:1500},
  nightmare:{icon:'🔴',name:'Кошмар',desc:'Хаос',enemySpeed:2.2,enemyHealth:2.0,enemyDamage:2.0,shooterChance:0.8,grenadierChance:0.4,runnerChance:0.35,tankChance:0.25,bomberChance:0.20,spiderChance:0.25,maxEnemies:22,spawnInterval:1000}
};

const WEAPONS={
  pistol:{name:'Пистолет',ammo:15,maxAmmo:15,damage:35,cooldown:280,spread:0.004,auto:false,reload:1100,icon:'pistol',cost:0},
  rifle:{name:'Автомат',ammo:30,maxAmmo:30,damage:22,cooldown:90,spread:0.012,auto:true,reload:1800,icon:'rifle',cost:0},
  shotgun:{name:'Дробовик',ammo:6,maxAmmo:6,damage:20,cooldown:750,spread:0.055,auto:false,reload:2000,icon:'shotgun',cost:0,pellets:10},
  sniper:{name:'Снайперка',ammo:5,maxAmmo:5,damage:200,cooldown:1600,spread:0.001,auto:false,reload:2600,icon:'sniper',cost:500},
  dualPistols:{name:'Два пистолета',ammo:30,maxAmmo:30,damage:25,cooldown:150,spread:0.022,auto:true,reload:1500,icon:'dual',cost:300},
  flamethrower:{name:'Огнемёт',ammo:100,maxAmmo:100,damage:6,cooldown:50,spread:0.14,auto:true,reload:3000,icon:'flame',cost:800}
};

const SKINS={
  default:{name:'Новобранец',body:0x3a4a2a,cost:0},
  soldier:{name:'Солдат',body:0x2a3a2a,cost:200},
  commando:{name:'Коммандос',body:0x1a1a1a,cost:500},
  ghost:{name:'Призрак',body:0x666666,cost:1000}
};

const ACHIEVEMENTS={
  firstBlood:{icon:'🩸',name:'Первая кровь',desc:'Убей первого зомби'},
  shooter:{icon:'🔫',name:'Стрелок',desc:'Убей 10 зомби'},
  butcher:{icon:'💀',name:'Мясник',desc:'Убей 100 зомби'},
  genocide:{icon:'☠️',name:'Геноцид',desc:'Убей 500 зомби'},
  sniper10:{icon:'🎯',name:'Снайпер',desc:'10 хедшотов'},
  sniper100:{icon:'🎯',name:'Снайпер-про',desc:'100 хедшотов'},
  grenadier:{icon:'💥',name:'Гранатомётчик',desc:'5 зомби одной гранатой'},
  bossKill:{icon:'👹',name:'Босс-слейер',desc:'Убей первого босса'},
  bossAll:{icon:'👑',name:'Покоритель',desc:'Пройди 8 уровень'},
  trained:{icon:'🎓',name:'Обучен',desc:'Пройди тренировку'},
  threeStars:{icon:'⭐',name:'Три звезды',desc:'3 звезды на уровне'},
  perfection:{icon:'🌟',name:'Перфекционист',desc:'3 звезды на 5 уровнях'},
  legend:{icon:'🏆',name:'Легенда',desc:'3 звезды на 11 уровнях'},
  healer:{icon:'🩹',name:'Целитель',desc:'10 аптечек'},
  invincible:{icon:'🛡️',name:'Неуязвимый',desc:'Без урона'},
  collector:{icon:'🔫',name:'Коллекционер',desc:'Купи всё оружие'},
  stylish:{icon:'👤',name:'Стильный',desc:'Купи все скины'},
  upgraded:{icon:'⬆️',name:'Прокачан',desc:'Прокачай всё'},
  rich:{icon:'💰',name:'Богач',desc:'5000 монет'},
  wave10:{icon:'🌊',name:'Волна 10',desc:'Дойди до 10 волны'},
  wave20:{icon:'🌊',name:'Волна 20',desc:'Дойди до 20 волны'},
  wave30:{icon:'🌊',name:'Волна 30',desc:'Дойди до 30 волны'},
  firestarter:{icon:'🔥',name:'Огнемётчик',desc:'20 огнемётом'},
  streak:{icon:'⚡',name:'Серия хедшотов',desc:'5 подряд'},
  hardcore:{icon:'💀',name:'Хардкор',desc:'Пройди Кошмар'},
  hospital:{icon:'🏥',name:'Санитар',desc:'Пройди Больницу'},
  cemetery:{icon:'🪦',name:'Копатель',desc:'Пройди Кладбище'},
  rooftop:{icon:'🏢',name:'Высотник',desc:'Пройди Крышу'},
  tankKill:{icon:'🛡️',name:'Танк-слейер',desc:'10 танков'},
  spiderKill:{icon:'🕷️',name:'Паук-слейер',desc:'20 пауков'},
  daily1:{icon:'🎁',name:'Награда',desc:'Забери награду'},
  daily7:{icon:'🔥',name:'Стрик 7',desc:'7 дней подряд'}
};

const UPGRADES={
  damage:{name:'Урон',desc:'+10% урона',maxLevel:5,costs:[200,400,600,800,1000]},
  reload:{name:'Перезарядка',desc:'−10% времени',maxLevel:5,costs:[150,300,450,600,750]},
  health:{name:'Здоровье',desc:'+20 HP',maxLevel:5,costs:[250,500,750,1000,1250]}
};

function getDamageMultiplier(){return 1+0.1*(PROGRESS.upgrades?.damage||0);}
function getReloadMultiplier(){return Math.max(0.5,1-0.1*(PROGRESS.upgrades?.reload||0));}
function getMaxHealth(){return 100+20*(PROGRESS.upgrades?.health||0);}

let scene,camera,renderer,composer,bloomPass,ssaoPass;
let score=0,health=100,wave=1,currentLevel=1;
let isGameActive=false;
let enemies=[],obstacles=[],enemyBullets=[],grenades=[],lootCrates=[],corpses=[],bloodStains=[],particles=[];
let currentBoss=null,bossPhase=1;
let playerGrenades=3;
let clock=new THREE.Clock();
let yaw=0,pitch=0,recoilPitch=0;
let verticalVelocity=0,playerY=1.7,isJumping=false;
let bobPhase=0,shakeAmount=0;
const GRAVITY=22,JUMP_POWER=8;
let MOUSE_SENSITIVITY=0.002,volume=0.4,medkits=2;
let horrorMode=true;
let survivalMode=null;
let bloomEnabled=true,ssaoEnabled=false;
let weather=null;
const isMobile=/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||('ontouchstart' in window&&window.innerWidth<1200);
let joystickActive=false,joystickTouchId=null;
let joystickStartX=0,joystickStartY=0,joystickDeltaX=0,joystickDeltaY=0;
let lookTouchId=null,lookLastX=0,lookLastY=0;
let currentWeapon='rifle';
let reloading=false,lastShotTime=0,isMouseDown=false;
let weaponGroup=null,flashlight=null,audioCtx=null;
let nearLootCrate=null;
const keys={w:false,a:false,s:false,d:false};
let activeAmbientNodes=[];
let footstepTimer=0,lastFootstepTime=0;
let waveSpawnTimer=null;
let musicState={calmGain:null,combatGain:null,calmOsc:null,combatOsc:null,bassGain:null,intensity:0,running:false};
let tutorialState=null;
let sessionStats={kills:0,headshots:0,headshotStreak:0,maxStreak:0,grenadeKills:0,flameKills:0,medkitsUsed:0,damageTaken:0,tankKills:0,spiderKills:0};

const TUTORIAL_STEPS=[
  {id:'move',text:'Двигайся: W A S D',done:false},
  {id:'look',text:'Осмотрись: мышь',done:false},
  {id:'shoot',text:'Стреляй: ЛКМ',done:false},
  {id:'reload',text:'Перезарядка: R',done:false},
  {id:'grenade',text:'Граната: G',done:false},
  {id:'pickup',text:'Подобрать: E',done:false},
  {id:'kill',text:'Уничтожь 3 мишени',done:false}
];

function playTone(freq,dur,type='square',vol=0.08){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);g.gain.setValueAtTime(vol*volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}
function playClickSound(f,d){playTone(f,d,'square',0.08);}
function playShootSoundEnhanced(){if(!audioCtx)return;const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';const base=currentWeapon==='sniper'?400:(currentWeapon==='shotgun'?150:200);o.frequency.setValueAtTime(base,now);o.frequency.exponentialRampToValueAtTime(40,now+0.1);g.gain.setValueAtTime(0.2*volume,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.12);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.13);}
function playHitSoundEnhanced(){playTone(600,0.15,'sawtooth',0.12);}
function playHeadshotSound(){playTone(1200,0.1,'square',0.15);setTimeout(()=>playTone(300,0.15,'triangle',0.12),50);}
function playReloadSoundEnhanced(){const w=WEAPONS[currentWeapon];setTimeout(()=>playClickSound(150,0.08),0);setTimeout(()=>playClickSound(120,0.1),w.reload*getReloadMultiplier()*0.5);}
function playExplosionSound(pos){if(!audioCtx)return;const dist=pos?pos.distanceTo(camera.position):0;const vol=Math.max(0.1,1-dist/30)*0.5*volume;const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(80,now);o.frequency.exponentialRampToValueAtTime(20,now+0.6);g.gain.setValueAtTime(vol,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.7);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.8);}
function playHurtSoundEnhanced(){if(!audioCtx)return;const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(250,now);o.frequency.exponentialRampToValueAtTime(80,now+0.3);g.gain.setValueAtTime(0.15*volume,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.35);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.36);}
function playHealSoundEnhanced(){if(!audioCtx)return;const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(400,now);o.frequency.exponentialRampToValueAtTime(1000,now+0.4);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.1*volume,now+0.1);g.gain.linearRampToValueAtTime(0,now+0.45);o.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+0.5);}
function playPickupSound(){playTone(600,0.1,'triangle',0.1);setTimeout(()=>playTone(1200,0.15,'triangle',0.08),80);}
function playBuySound(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,0.15,'triangle',0.12),i*60));}
function playErrorSound(){playTone(200,0.1,'square',0.1);setTimeout(()=>playTone(150,0.1,'square',0.1),80);}
function playZombieGroan(pos){if(!audioCtx)return;const dist=pos.distanceTo(camera.position);if(dist>35)return;const vol=(1-dist/35)*0.25*volume;if(vol<0.01)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();filter.type='lowpass';filter.frequency.setValueAtTime(500,audioCtx.currentTime);o.type='sawtooth';const base=70+Math.random()*40;o.frequency.setValueAtTime(base,audioCtx.currentTime);o.frequency.linearRampToValueAtTime(base*0.6,audioCtx.currentTime+0.7);g.gain.setValueAtTime(0,audioCtx.currentTime);g.gain.linearRampToValueAtTime(vol,audioCtx.currentTime+0.15);g.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.75);o.connect(filter);filter.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.85);}
function playBossRoar(){if(!audioCtx)return;const now=audioCtx.currentTime;const o=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(60,now);o.frequency.linearRampToValueAtTime(120,now+0.3);o.frequency.linearRampToValueAtTime(45,now+1.2);f.type='lowpass';f.frequency.setValueAtTime(800,now);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.4*volume,now+0.15);g.gain.linearRampToValueAtTime(0.001,now+1.4);o.connect(f);f.connect(g);g.connect(audioCtx.destination);o.start(now);o.stop(now+1.5);}
function playFootstepSound(){if(!audioCtx||!isGameActive)return;const now=performance.now();if(now-lastFootstepTime<400)return;lastFootstepTime=now;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';const freq=80+Math.random()*60;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*0.5,audioCtx.currentTime+0.08);g.gain.setValueAtTime(0.04*volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.1);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+0.12);}

function startHorrorAmbient(){if(!audioCtx)return;stopHorrorAmbient();if(currentLevel===0)return;const drone=audioCtx.createOscillator(),dg=audioCtx.createGain(),df=audioCtx.createBiquadFilter();drone.type='sine';drone.frequency.setValueAtTime(45,audioCtx.currentTime);df.type='lowpass';df.frequency.setValueAtTime(150,audioCtx.currentTime);dg.gain.setValueAtTime(0,audioCtx.currentTime);dg.gain.linearRampToValueAtTime(0.04*volume,audioCtx.currentTime+3);drone.connect(df);df.connect(dg);dg.connect(audioCtx.destination);drone.start();activeAmbientNodes.push({osc:drone});}
function stopHorrorAmbient(){activeAmbientNodes.forEach(n=>{try{n.osc.stop();}catch(e){}});activeAmbientNodes=[];}
function startDynamicMusic(){if(!audioCtx||musicState.running)return;musicState.running=true;const calmGain=audioCtx.createGain();calmGain.gain.setValueAtTime(0.06*volume,audioCtx.currentTime);calmGain.connect(audioCtx.destination);const calmOsc=audioCtx.createOscillator();calmOsc.type='sine';calmOsc.frequency.setValueAtTime(55,audioCtx.currentTime);const cf=audioCtx.createBiquadFilter();cf.type='lowpass';cf.frequency.setValueAtTime(200,audioCtx.currentTime);calmOsc.connect(cf);cf.connect(calmGain);calmOsc.start();const combatGain=audioCtx.createGain();combatGain.gain.setValueAtTime(0,audioCtx.currentTime);combatGain.connect(audioCtx.destination);const combatOsc=audioCtx.createOscillator();combatOsc.type='sawtooth';combatOsc.frequency.setValueAtTime(40,audioCtx.currentTime);const bf=audioCtx.createBiquadFilter();bf.type='lowpass';bf.frequency.setValueAtTime(400,audioCtx.currentTime);const bassGain=audioCtx.createGain();bassGain.gain.setValueAtTime(0,audioCtx.currentTime);combatOsc.connect(bf);bf.connect(bassGain);bassGain.connect(combatGain);combatOsc.start();function beat(){if(!musicState.running)return;const t=audioCtx.currentTime;bassGain.gain.cancelScheduledValues(t);bassGain.gain.setValueAtTime(0.35,t);bassGain.gain.exponentialRampToValueAtTime(0.001,t+0.2);setTimeout(beat,260);}beat();musicState.calmGain=calmGain;musicState.combatGain=combatGain;musicState.calmOsc=calmOsc;musicState.combatOsc=combatOsc;musicState.bassGain=bassGain;}
function stopDynamicMusic(){musicState.running=false;try{musicState.calmOsc?.stop();}catch(e){}try{musicState.combatOsc?.stop();}catch(e){}try{if(musicState.calmGain)musicState.calmGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.3);if(musicState.combatGain)musicState.combatGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+0.3);}catch(e){}musicState={calmGain:null,combatGain:null,calmOsc:null,combatOsc:null,bassGain:null,intensity:0,running:false};}
function updateMusicIntensity(){if(!audioCtx||!musicState.running||!isGameActive)return;let maxThreat=0;for(const e of enemies){if(e.userData.isTarget)continue;const d=e.position.distanceTo(camera.position);if(d<30){const t=(1-d/30)*(e.userData.isBoss?1.5:1);if(t>maxThreat)maxThreat=t;}}musicState.intensity+=(Math.min(1,maxThreat)-musicState.intensity)*0.05;const t=audioCtx.currentTime;try{musicState.calmGain.gain.linearRampToValueAtTime((1-musicState.intensity)*0.06*volume,t+0.3);musicState.combatGain.gain.linearRampToValueAtTime(musicState.intensity*0.12*volume,t+0.3);}catch(e){}}

// ============ ТЕКСТУРЫ ============
const textureCache={};
function getTex(k,gen){if(textureCache[k])return textureCache[k];textureCache[k]=gen();return textureCache[k];}
function createGroundTexture(theme){
  return getTex('g_'+theme,()=>{
    const c=document.createElement('canvas');c.width=c.height=512;
    const ctx=c.getContext('2d');
    const bases={grass:'#3a5a2a',forest:'#2a4a1a',village:'#5a4a2a',desert:'#b89858',factory:'#3a3a3a',metro:'#1a1a1a',lab:'#2a4a3a',lair:'#3a1a1a',hospital:'#3a5a4a',cemetery:'#1a1a3a',rooftop:'#3a3a4a'};
    ctx.fillStyle=bases[theme]||'#3a5a2a';ctx.fillRect(0,0,512,512);
    for(let i=0;i<800;i++){const x=Math.random()*512,y=Math.random()*512,r=3+Math.random()*25;const a=0.04+Math.random()*0.14,dark=Math.random()<0.55;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,dark?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*0.4})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    const img=ctx.getImageData(0,0,512,512);
    for(let i=0;i<img.data.length;i+=4){const n=(Math.random()-0.5)*35;img.data[i]=Math.max(0,Math.min(255,img.data[i]+n));img.data[i+1]=Math.max(0,Math.min(255,img.data[i+1]+n));img.data[i+2]=Math.max(0,Math.min(255,img.data[i+2]+n));}
    ctx.putImageData(img,0,0);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(10,10);
    return t;
  });
}
function createWallTexture(){return getTex('wall',()=>{const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,512,512);const bw=64,bh=32,gap=4;for(let y=0;y<512;y+=bh+gap){const off=((y/(bh+gap))%2)*(bw+gap)/2;for(let x=-bw;x<512;x+=bw+gap){const shade=50+Math.random()*40;ctx.fillStyle=`rgb(${shade},${shade*0.75},${shade*0.55})`;ctx.fillRect(x+off,y,bw,bh);ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.strokeRect(x+off,y,bw,bh);}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,2);return t;});}
function createMetalTexture(){return getTex('metal',()=>{const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#2a2a2e';ctx.fillRect(0,0,512,512);for(let y=0;y<512;y+=128){for(let x=0;x<512;x+=128){ctx.strokeStyle='rgba(0,0,0,0.7)';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,124,124);ctx.fillStyle=`rgba(${60+Math.random()*20},${60+Math.random()*20},${65+Math.random()*20},1)`;ctx.fillRect(x+4,y+4,120,120);}}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,1);return t;});}
function createWoodTexture(){return getTex('wood',()=>{const c=document.createElement('canvas');c.width=512;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#5a3f22';ctx.fillRect(0,0,512,512);for(let y=0;y<512;y+=64){ctx.strokeStyle='rgba(0,0,0,0.6)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1);return t;});}

// ============ ПОГОДА ============
function createWeather(theme){
  clearWeather();
  let type=null;
  if(theme==='grass'||theme==='village'||theme==='rooftop')type='rain';
  else if(theme==='lab')type='snow';
  else if(theme==='desert')type='dust';
  else if(theme==='lair')type='blood';
  else if(theme==='cemetery')type='fog';
  if(!type)return;
  const count=600;
  const positions=new Float32Array(count*3);
  const velocities=[];
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-0.5)*80;
    positions[i*3+1]=Math.random()*40;
    positions[i*3+2]=(Math.random()-0.5)*80;
    velocities.push({
      x:type==='rain'?-0.6:type==='dust'?(Math.random()-0.5)*0.5:(Math.random()-0.5)*0.2,
      y:type==='rain'?-28:type==='snow'?-3:type==='dust'?-1.5:type==='blood'?-18:-0.5,
      z:type==='rain'?-1.5:0
    });
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const colors={rain:0x8899cc,snow:0xffffff,dust:0xcc9944,blood:0xaa0000,fog:0xaaaaaa};
  const sizes={rain:0.14,snow:0.28,dust:0.35,blood:0.18,fog:0.8};
  const opacities={rain:0.55,snow:0.85,dust:0.5,blood:0.7,fog:0.25};
  const mat=new THREE.PointsMaterial({color:colors[type],size:sizes[type],transparent:true,opacity:opacities[type],sizeAttenuation:true,depthWrite:false});
  const points=new THREE.Points(geo,mat);
  points.frustumCulled=false;
  scene.add(points);
  weather={points,velocities,type};
}
function updateWeather(delta){
  if(!weather||!weather.points)return;
  const pos=weather.points.geometry.attributes.position.array;
  const camPos=camera.position;
  const speedMul=weather.type==='rain'?12:weather.type==='snow'?3:weather.type==='dust'?5:weather.type==='blood'?10:2;
  for(let i=0;i<weather.velocities.length;i++){
    const v=weather.velocities[i];
    pos[i*3]+=v.x*delta*speedMul;
    pos[i*3+1]+=v.y*delta*speedMul;
    pos[i*3+2]+=v.z*delta*speedMul;
    if(pos[i*3+1]<0){
      pos[i*3]=camPos.x+(Math.random()-0.5)*70;
      pos[i*3+1]=30+Math.random()*15;
      pos[i*3+2]=camPos.z+(Math.random()-0.5)*70;
    }
    if(Math.abs(pos[i*3]-camPos.x)>45)pos[i*3]=camPos.x+(Math.random()-0.5)*70;
    if(Math.abs(pos[i*3+2]-camPos.z)>45)pos[i*3+2]=camPos.z+(Math.random()-0.5)*70;
  }
  weather.points.geometry.attributes.position.needsUpdate=true;
}
function clearWeather(){
  if(weather&&weather.points){scene.remove(weather.points);weather.points.geometry.dispose();weather.points.material.dispose();}
  weather=null;
}

// ============ POST-PROCESSING ============
function setupPostProcessing(){
  if(typeof THREE.EffectComposer==='undefined')return;
  try{
    composer=new THREE.EffectComposer(renderer);
    if(ssaoEnabled&&THREE.SSAOPass&&!isMobile){
      ssaoPass=new THREE.SSAOPass(scene,camera,innerWidth,innerHeight);
      ssaoPass.kernelRadius=8;
      composer.addPass(ssaoPass);
    }else{
      composer.addPass(new THREE.RenderPass(scene,camera));
    }
    if(bloomEnabled&&THREE.UnrealBloomPass&&!isMobile){
      bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.7,0.6,0.85);
      composer.addPass(bloomPass);
    }
    if(THREE.VignetteShader){
      const vig=new THREE.ShaderPass(THREE.VignetteShader);
      vig.uniforms['darkness'].value=1.3;
      vig.renderToScreen=true;
      composer.addPass(vig);
    }
  }catch(e){console.warn('PostFX:',e);composer=null;}
}
function rebuildPostProcessing(){composer=null;bloomPass=null;ssaoPass=null;setupPostProcessing();}

// ============ ЧАСТИЦЫ ============
function spawnParticle(pos,velocity,color,size,life,useGravity=true){const m=new THREE.Mesh(new THREE.SphereGeometry(size,4,4),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));m.position.copy(pos);m.userData={velocity:velocity.clone(),life,maxLife:life,gravity:useGravity};scene.add(m);particles.push(m);}
function createBloodBurst(pos,isHead){const count=isHead?22:12,color=isHead?0xbb0000:0x880000;for(let i=0;i<count;i++){const v=new THREE.Vector3((Math.random()-0.5)*6,Math.random()*4+1,(Math.random()-0.5)*6);spawnParticle(pos,v,color,0.035+Math.random()*0.055,0.5+Math.random()*0.6,true);}}
function createShellCasing(){if(!weaponGroup)return;const c=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.05,6),new THREE.MeshStandardMaterial({color:0xc4a040,metalness:0.9,roughness:0.2}));const wp=new THREE.Vector3();weaponGroup.getWorldPosition(wp);const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);c.position.copy(wp).add(right.clone().multiplyScalar(0.15)).add(up.clone().multiplyScalar(0.05));const v=right.clone().multiplyScalar(1.8+Math.random()*0.8);v.y+=1.5+Math.random()*0.8;c.userData={velocity:v,life:2.5,maxLife:2.5,gravity:true,spin:new THREE.Vector3(Math.random()*25-12,Math.random()*25-12,Math.random()*25-12)};scene.add(c);particles.push(c);}
function createMuzzleSmoke(){if(!weaponGroup)return;const wp=new THREE.Vector3();weaponGroup.getWorldPosition(wp);const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);const sp=wp.clone().add(fwd.clone().multiplyScalar(0.6));for(let i=0;i<4;i++){const v=new THREE.Vector3((Math.random()-0.5)*1.2,Math.random()*0.6+0.2,(Math.random()-0.5)*1.2);spawnParticle(sp,v,0x999999,0.06+Math.random()*0.05,0.7+Math.random()*0.3,false);}}
function updateParticles(delta){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=delta;if(p.userData.life<=0){scene.remove(p);particles.splice(i,1);continue;}if(p.userData.gravity)p.userData.velocity.y-=GRAVITY*delta;p.position.add(p.userData.velocity.clone().multiplyScalar(delta));if(p.userData.gravity&&p.position.y<0.03){p.position.y=0.03;p.userData.velocity.y*=-0.3;p.userData.velocity.x*=0.7;p.userData.velocity.z*=0.7;}if(p.userData.spin){p.rotation.x+=p.userData.spin.x*delta;p.rotation.y+=p.userData.spin.y*delta;p.rotation.z+=p.userData.spin.z*delta;}const a=p.userData.life/p.userData.maxLife;if(p.material){p.material.opacity=Math.max(0,Math.min(1,a));p.material.transparent=true;}}}

// ============ INIT ============
function init(){
  try{
    scene=new THREE.Scene();
    scene.background=new THREE.Color(0x050510);
    scene.fog=new THREE.Fog(0x050510,8,40);
    camera=new THREE.PerspectiveCamera(isMobile?85:75,innerWidth/innerHeight,0.1,300);
    camera.position.set(0,playerY,0);
    scene.add(camera);
    renderer=new THREE.WebGLRenderer({antialias:!isMobile,powerPreference:'high-performance'});
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(isMobile?1:Math.min(devicePixelRatio,2));
    renderer.shadowMap.enabled=!isMobile;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=0.9;
    renderer.domElement.style.position='fixed';
    renderer.domElement.style.inset='0';
    renderer.domElement.style.zIndex='20';
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.display='none';
  }catch(e){console.error('Renderer init:',e);return;}
  try{const hm=localStorage.getItem('zombieshoot_horror');if(hm!==null)horrorMode=hm==='true';}catch(e){}
  try{const be=localStorage.getItem('zombieshoot_bloom');if(be!==null)bloomEnabled=be==='true';}catch(e){}
  try{const se=localStorage.getItem('zombieshoot_ssao');if(se!==null)ssaoEnabled=se==='true';}catch(e){}
  try{setupPostProcessing();}catch(e){console.warn(e);}
  try{buildLevelEnvironment(1);}catch(e){console.warn(e);}
  try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}
  setupControls();
  initUI();
  initMobileControls();
  renderLevelGrid();
  updateCoinsDisplay();
  updateAchCount();
  initDailyReward();
  animate();
}

// ============ ОКРУЖЕНИЕ ============
function clearLevelEnvironment(){for(let i=scene.children.length-1;i>=0;i--){const c=scene.children[i];if(c===camera||c.isLight||(weather&&c===weather.points))continue;scene.remove(c);}obstacles=[];}
function buildLevelEnvironment(levelNum){
  clearLevelEnvironment();
  const lvl=LEVELS[levelNum]||LEVELS[1];
  const isTutorial=!!lvl.isTutorial;
  let skyColor,fogColor,fogNear,fogFar,ambientLevel;
  if(isTutorial){skyColor=0x8ec8e8;fogColor=0x9ed4e8;fogNear=60;fogFar=160;ambientLevel=1.0;}
  else if(horrorMode){skyColor=lvl.sky;fogColor=lvl.fog;fogNear=lvl.fogNear;fogFar=lvl.fogFar;ambientLevel=lvl.ambient||0.08;}
  else{const light={grass:0x87a5c4,forest:0x6a8a6a,village:0xa89a7a,desert:0xe8d0a0,factory:0x8a8a9a,metro:0x5a5a6a,lab:0x6aaa8a,lair:0x8a4a4a,hospital:0x8ac8b8,cemetery:0x6a6a9a,rooftop:0x9aaaca};skyColor=light[lvl.theme]||0x87a5c4;fogColor=skyColor;fogNear=50;fogFar=130;ambientLevel=0.7;}
  scene.background=new THREE.Color(skyColor);
  scene.fog=new THREE.Fog(fogColor,fogNear,fogFar);
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(150,32,16),new THREE.MeshBasicMaterial({color:skyColor,side:THREE.BackSide,fog:false})));
  if(isTutorial){
    scene.add(new THREE.AmbientLight(0xffffff,0.6));
    const sun=new THREE.DirectionalLight(0xfff4d0,1.2);
    sun.position.set(30,60,20);sun.castShadow=!isMobile;
    if(!isMobile){sun.shadow.mapSize.width=2048;sun.shadow.mapSize.height=2048;}
    scene.add(sun);
    scene.add(new THREE.HemisphereLight(0x8ec8e8,0x6a8a5a,0.6));
  }else{
    scene.add(new THREE.AmbientLight(0xffffff,ambientLevel));
    if(horrorMode){const moon=new THREE.DirectionalLight(0x8899cc,0.3);moon.position.set(-30,40,-20);moon.castShadow=!isMobile;scene.add(moon);}
    else{const sun=new THREE.DirectionalLight(0xfff0d0,0.9);sun.position.set(40,60,20);sun.castShadow=!isMobile;scene.add(sun);}
  }
  const groundTex=createGroundTexture(lvl.theme);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100,20,20),new THREE.MeshStandardMaterial({map:groundTex,color:horrorMode?0x808080:0xffffff,roughness:1}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const wallTex=createWallTexture();
  const wallMat=new THREE.MeshStandardMaterial({map:wallTex,color:horrorMode?0x666666:0xaaaaaa,roughness:0.95});
  [{pos:[0,5,-48],size:[96,10,1]},{pos:[0,5,48],size:[96,10,1]},{pos:[-48,5,0],size:[1,10,96]},{pos:[48,5,0],size:[1,10,96]}].forEach(w=>{
    const wall=new THREE.Mesh(new THREE.BoxGeometry(...w.size),wallMat);
    wall.position.set(...w.pos);wall.castShadow=true;wall.receiveShadow=true;
    wall.userData.size={x:w.size[0],y:w.size[1],z:w.size[2]};
    scene.add(wall);obstacles.push(wall);
  });
  const metalTex=createMetalTexture();
  const obsMat=new THREE.MeshStandardMaterial({map:metalTex,color:horrorMode?0x666666:0x999999,roughness:0.7,metalness:0.4});
  [[12,1,8,3,2,3],[-12,1,8,3,2,3],[12,1,-8,3,2,3],[-12,1,-8,3,2,3]].forEach(([x,y,z,sx,sy,sz])=>{
    const c=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),obsMat);
    c.position.set(x,y,z);c.castShadow=true;c.receiveShadow=true;
    c.userData.size={x:sx,y:sy,z:sz};scene.add(c);obstacles.push(c);
  });
  if(lvl.theme==='cemetery'){for(let i=0;i<20;i++){const grave=new THREE.Mesh(new THREE.BoxGeometry(0.6,1.2,0.2),new THREE.MeshStandardMaterial({color:0x555555,roughness:0.9}));grave.position.set((Math.random()-0.5)*80,0.6,(Math.random()-0.5)*80);grave.rotation.y=Math.random()*Math.PI;grave.castShadow=true;grave.userData.size={x:0.6,y:1.2,z:0.2};scene.add(grave);obstacles.push(grave);}}
  if(lvl.theme==='hospital'){for(let i=0;i<8;i++){const bed=new THREE.Mesh(new THREE.BoxGeometry(1,0.5,2),new THREE.MeshStandardMaterial({color:0xdddddd,roughness:0.7}));bed.position.set((Math.random()-0.5)*70,0.25,(Math.random()-0.5)*70);bed.castShadow=true;bed.userData.size={x:1,y:0.5,z:2};scene.add(bed);obstacles.push(bed);}}
  const woodTex=createWoodTexture();
  const woodMat=new THREE.MeshStandardMaterial({map:woodTex,color:0xdddddd,roughness:0.9});
  [[-20,0.5,-20],[20,0.5,-20],[-20,0.5,20],[20,0.5,20]].forEach(([x,y,z])=>{
    const box=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),woodMat);
    box.position.set(x,y,z);box.rotation.y=Math.random()*Math.PI;
    box.castShadow=true;box.receiveShadow=true;box.userData.size={x:1,y:1,z:1};
    scene.add(box);obstacles.push(box);
  });
  if(isTutorial){
    for(let i=0;i<3;i++){
      const dummy=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.4,0.35),new THREE.MeshStandardMaterial({color:0xcc4444,roughness:0.5}));
      body.position.y=0.7;body.castShadow=true;dummy.add(body);
      const head=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,10),new THREE.MeshStandardMaterial({color:0xff6666,roughness:0.4}));
      head.position.y=1.65;head.castShadow=true;head.userData.isHead=true;dummy.add(head);
      dummy.position.set(-4+i*4,0,-8);
      dummy.userData={isTarget:true,health:80,maxHealth:80,type:'target'};
      scene.add(dummy);enemies.push(dummy);
    }
    const crate=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),new THREE.MeshStandardMaterial({map:metalTex,color:0x3a6aaa,metalness:0.6,roughness:0.3}));
    crate.position.set(0,0.3,4);crate.userData={weapon:'rifle',isTutorialCrate:true};
    scene.add(crate);lootCrates.push(crate);
  }
  if(horrorMode&&!isTutorial){
    flashlight=new THREE.SpotLight(0xfff2d0,1.5,25,Math.PI/7,0.4,1.5);
    flashlight.position.set(0,0,0);flashlight.target.position.set(0,0,-1);
    camera.add(flashlight);camera.add(flashlight.target);
  }else flashlight=null;
  createWeather(lvl.theme);
}
// ============ ZOMBIESHOOT v15.2 — PART 2/2 ============

// ============ ОРУЖИЕ ============
function createWeapon(type){
  if(weaponGroup)camera.remove(weaponGroup);
  weaponGroup=new THREE.Group();
  const metal=new THREE.MeshStandardMaterial({color:0x1a1a1a,metalness:0.95,roughness:0.25});
  const black=new THREE.MeshStandardMaterial({color:0x0a0a0a,metalness:0.6,roughness:0.6});
  const grip=new THREE.MeshStandardMaterial({color:0x0f0f0f,metalness:0.2,roughness:0.8});
  const wood=new THREE.MeshStandardMaterial({color:0x4a2a15,metalness:0.1,roughness:0.75});
  const rail=new THREE.MeshStandardMaterial({color:0x111111,metalness:0.9,roughness:0.2});
  const glass=new THREE.MeshStandardMaterial({color:0x0a1a3a,metalness:0.5,roughness:0.05,transparent:true,opacity:0.85});
  if(type==='pistol'){
    const s=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.09,0.28),metal);s.position.set(0,0.02,-0.15);weaponGroup.add(s);
    const g=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.2,0.08),grip);g.position.set(0,-0.15,0.02);g.rotation.x=0.25;weaponGroup.add(g);
    weaponGroup.position.set(0.22,-0.22,-0.4);
  }else if(type==='rifle'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.075,0.5),metal);body.position.set(0,0,-0.2);weaponGroup.add(body);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.3,12),metal);barrel.rotation.x=Math.PI/2;barrel.position.set(0,0.005,-0.55);weaponGroup.add(barrel);
    const handguard=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.22),black);handguard.position.set(0,0,-0.4);weaponGroup.add(handguard);
    const mag=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.15,0.05),metal);mag.position.set(0,-0.11,0.02);mag.rotation.x=-0.15;weaponGroup.add(mag);
    const g=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.14,0.055),grip);g.position.set(0,-0.1,0.12);g.rotation.x=0.28;weaponGroup.add(g);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.09,0.18),black);stock.position.set(0,0.005,0.24);weaponGroup.add(stock);
    weaponGroup.position.set(0.28,-0.26,-0.5);
  }else if(type==='shotgun'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.085,0.45),metal);body.position.set(0,0,-0.15);weaponGroup.add(body);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.4,12),metal);barrel.rotation.x=Math.PI/2;barrel.position.set(0,0.01,-0.5);weaponGroup.add(barrel);
    const pump=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.14),wood);pump.position.set(0,-0.045,-0.36);weaponGroup.add(pump);
    const g=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.15,0.06),wood);g.position.set(0,-0.11,0.13);g.rotation.x=0.25;weaponGroup.add(g);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.1,0.2),wood);stock.position.set(0,0,0.26);weaponGroup.add(stock);
    weaponGroup.position.set(0.3,-0.28,-0.5);
  }else if(type==='sniper'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.075,0.6),metal);body.position.set(0,0,-0.25);weaponGroup.add(body);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.012,0.5,12),metal);barrel.rotation.x=Math.PI/2;barrel.position.set(0,0.005,-0.8);weaponGroup.add(barrel);
    const scope=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.28,14),rail);scope.rotation.x=Math.PI/2;scope.position.set(0,0.075,-0.2);weaponGroup.add(scope);
    const lensF=new THREE.Mesh(new THREE.CircleGeometry(0.03,14),glass);lensF.position.set(0,0.075,-0.342);weaponGroup.add(lensF);
    const lensR=new THREE.Mesh(new THREE.CircleGeometry(0.03,14),glass);lensR.position.set(0,0.075,-0.058);lensR.rotation.y=Math.PI;weaponGroup.add(lensR);
    const g=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.15,0.06),grip);g.position.set(0,-0.1,0.05);g.rotation.x=0.28;weaponGroup.add(g);
    const stock=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.11,0.22),black);stock.position.set(0,0.01,0.2);weaponGroup.add(stock);
    weaponGroup.position.set(0.3,-0.26,-0.55);
  }else if(type==='dualPistols'){
    [-0.16,0.16].forEach(dx=>{
      const g=new THREE.Group();
      const s=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.09,0.24),metal);s.position.set(0,0.02,-0.12);g.add(s);
      const grip2=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.18,0.06),grip);grip2.position.set(0,-0.13,0.06);grip2.rotation.x=0.22;g.add(grip2);
      g.position.set(dx,0,0);weaponGroup.add(g);
    });
    weaponGroup.position.set(0,-0.25,-0.5);
  }else if(type==='flamethrower'){
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.4),metal);body.position.set(0,0,-0.15);weaponGroup.add(body);
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.35,14),new THREE.MeshStandardMaterial({color:0xcc2200,metalness:0.85,roughness:0.35}));
    tank.position.set(-0.09,-0.05,-0.1);tank.rotation.z=Math.PI/2;weaponGroup.add(tank);
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.025,0.28,10),metal);nozzle.rotation.x=Math.PI/2;nozzle.position.set(0,0.01,-0.44);weaponGroup.add(nozzle);
    const g=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.15,0.06),grip);g.position.set(0,-0.1,0.1);g.rotation.x=0.25;weaponGroup.add(g);
    weaponGroup.position.set(0.28,-0.28,-0.5);
  }
  const flash=new THREE.PointLight(0xffaa00,0,8);
  flash.position.set(0,0.03,-1.0);
  weaponGroup.add(flash);
  weaponGroup.userData.flash=flash;
  camera.add(weaponGroup);
}

// ============ ЗОМБИ ============
function createZombie(isBoss,type='melee'){
  const g=new THREE.Group();
  const sk=SKINS[PROGRESS.currentSkin]||SKINS.default;
  const size=isBoss?1.8:1;
  let bodyColor,headColor,eyeColor,scale=1;
  if(isBoss){bodyColor=0x4a1a1a;headColor=0x6a2a2a;eyeColor=0xff6600;}
  else if(type==='shooter'){bodyColor=0x2a2a3a;headColor=0x5a5a3a;eyeColor=0xffcc00;}
  else if(type==='grenadier'){bodyColor=0x2a4a2a;headColor=0x3a5a3a;eyeColor=0x00ff66;}
  else if(type==='runner'){bodyColor=0x6a3a1a;headColor=0x8a5a2a;eyeColor=0xff8800;scale=0.9;}
  else if(type==='tank'){bodyColor=0x4a4a4a;headColor=0x6a6a6a;eyeColor=0xff0000;scale=1.4;}
  else if(type==='bomber'){bodyColor=0x8a1a1a;headColor=0xaa2a2a;eyeColor=0xff2200;}
  else if(type==='spider'){bodyColor=0x0a0a0a;headColor=0x1a1a1a;eyeColor=0xff00ff;scale=0.6;}
  else{bodyColor=sk.body;headColor=0x5a6a3a;eyeColor=0xaa0000;}
  const skinMat=new THREE.MeshStandardMaterial({color:headColor,roughness:0.8});
  const uniform=new THREE.MeshStandardMaterial({color:bodyColor,roughness:0.75});
  const dark=new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:0.9});
  const glow=new THREE.MeshBasicMaterial({color:eyeColor});
  if(type==='spider'){
    const body=new THREE.Mesh(new THREE.SphereGeometry(0.5,10,8),uniform);body.position.y=0.5;body.castShadow=true;g.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(0.25,10,8),skinMat);head.position.set(0,0.55,-0.5);head.castShadow=true;head.userData.isHead=true;g.add(head);
    [0.08,-0.08].forEach(dx=>{const eye=new THREE.Mesh(new THREE.SphereGeometry(0.04,6,6),glow);eye.position.set(dx,0.6,-0.7);g.add(eye);});
    for(let i=0;i<8;i++){const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.02,0.7,5),dark);const side=i<4?-1:1;const idx=i%4;leg.position.set(side*(0.4+Math.random()*0.05),0.35,-0.3+idx*0.2);leg.rotation.z=side*0.8;g.add(leg);}
    g.position.y=0.3;return g;
  }
  const fs=size*scale;
  const torso=new THREE.Mesh(new THREE.CylinderGeometry(0.35*fs,0.32*fs,1.0*fs,8),uniform);torso.position.y=0.5*fs;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.28*fs,12,10),skinMat);head.position.y=1.45*fs;head.castShadow=true;head.userData.isHead=true;g.add(head);
  const eL=new THREE.Mesh(new THREE.SphereGeometry(0.055*fs,6,6),glow);eL.position.set(-0.11*fs,1.48*fs,-0.24*fs);g.add(eL);
  const eR=new THREE.Mesh(new THREE.SphereGeometry(0.055*fs,6,6),glow);eR.position.set(0.11*fs,1.48*fs,-0.24*fs);g.add(eR);
  const legGeo=new THREE.CylinderGeometry(0.13*fs,0.11*fs,0.75*fs,6);
  const lL=new THREE.Mesh(legGeo,dark);lL.position.set(-0.18*fs,-0.4*fs,0);g.add(lL);
  const lR=new THREE.Mesh(legGeo,dark);lR.position.set(0.18*fs,-0.4*fs,0);g.add(lR);
  if(!isBoss){
    if(type==='shooter'){const rifle=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.1,0.7),new THREE.MeshStandardMaterial({color:0x111111,metalness:0.9,roughness:0.3}));rifle.position.set(0.35*fs,0.9*fs,-0.35*fs);rifle.rotation.z=-0.15;g.add(rifle);}
    else if(type==='grenadier'){const bag=new THREE.Mesh(new THREE.BoxGeometry(0.4,0.4,0.2),new THREE.MeshStandardMaterial({color:0x4a6a3a}));bag.position.set(0,0.5*fs,0.35*fs);g.add(bag);}
    else if(type==='tank'){const armor=new THREE.Mesh(new THREE.BoxGeometry(0.9*fs,1.0*fs,0.4*fs),new THREE.MeshStandardMaterial({color:0x2a2a2a,metalness:0.7,roughness:0.5}));armor.position.set(0,0.55*fs,0.15*fs);g.add(armor);}
    else if(type==='bomber'){const core=new THREE.Mesh(new THREE.SphereGeometry(0.18*fs,10,10),new THREE.MeshBasicMaterial({color:0xff0000}));core.position.set(0,0.5*fs,-0.2*fs);g.add(core);const light=new THREE.PointLight(0xff0000,1.5,5);light.position.copy(core.position);g.add(light);}
  }else{
    const hornMat=new THREE.MeshStandardMaterial({color:0xaa8866});
    const hl=new THREE.Mesh(new THREE.ConeGeometry(0.1*fs,0.5*fs,6),hornMat);hl.position.set(-0.2*fs,1.75*fs,0);hl.rotation.z=0.5;g.add(hl);
    const hr=new THREE.Mesh(new THREE.ConeGeometry(0.1*fs,0.5*fs,6),hornMat);hr.position.set(0.2*fs,1.75*fs,0);hr.rotation.z=-0.5;g.add(hr);
    const aura=new THREE.PointLight(0xff3300,1.5,8);aura.position.y=1.2*fs;g.add(aura);
  }
  g.position.y=0.9*fs;
  return g;
}

function spawnEnemy(isBoss=false,forcedType=null){
  if(!isGameActive)return;
  const lvl=LEVELS[currentLevel]||LEVELS[1];
  if(lvl.isTutorial)return;
  if(!isBoss&&enemies.length>=lvl.maxEnemies)return;
  let type='melee';
  if(!isBoss){
    if(forcedType)type=forcedType;
    else{
      const r=Math.random();let acc=0;
      const chances=[['shooter',lvl.shooterChance||0],['grenadier',lvl.grenadierChance||0],['runner',lvl.runnerChance||0],['tank',lvl.tankChance||0],['bomber',lvl.bomberChance||0],['spider',lvl.spiderChance||0]];
      for(const[t,ch]of chances){acc+=ch;if(r<acc){type=t;break;}}
    }
  }
  const e=createZombie(isBoss,type);
  const range=isBoss?20:45;
  const sides=[[-range,0],[range,0],[0,-range],[0,range]];
  const s=sides[Math.floor(Math.random()*sides.length)];
  const yScale=type==='tank'?1.4:type==='spider'?0.6:type==='runner'?0.9:1;
  e.position.set(s[0]+(Math.random()-0.5)*3,0.9*(isBoss?1.8:1)*yScale,s[1]+(Math.random()-0.5)*3);
  const baseHealth=isBoss?2000:(type==='tank'?lvl.enemyHealth*3:type==='runner'?lvl.enemyHealth*0.5:type==='spider'?lvl.enemyHealth*0.3:type==='bomber'?lvl.enemyHealth*0.7:lvl.enemyHealth);
  let speed=lvl.enemySpeed+Math.random()*0.3;
  if(type==='runner')speed*=1.8;
  if(type==='tank')speed*=0.5;
  if(type==='spider')speed*=1.5;
  if(type==='bomber')speed*=0.9;
  e.userData={type,isBoss:!!isBoss,health:baseHealth,maxHealth:baseHealth,speed:isBoss?1.5:speed,radius:isBoss?1.2:type==='tank'?0.9:0.5,walkPhase:Math.random()*Math.PI*2,nextShotTime:performance.now()+2000+Math.random()*3000,weaponDrop:type==='shooter'?'rifle':(type==='grenadier'?'shotgun':'pistol'),phase:1,nextSummonTime:performance.now()+8000,lastShot:0,nextGroan:performance.now()+Math.random()*5000};
  scene.add(e);
  enemies.push(e);
  if(isBoss){currentBoss=e;bossPhase=1;playBossRoar();showToast('👹 БОСС ПРОБУДИЛСЯ!',2500);shakeAmount=1;}
}

function checkBossPhase(){
  if(!currentBoss||!currentBoss.userData)return;
  const ratio=currentBoss.userData.health/currentBoss.userData.maxHealth;
  const ud=currentBoss.userData;
  let np=1;
  if(ratio<=0.33)np=3;else if(ratio<=0.66)np=2;
  if(np!==ud.phase){
    ud.phase=np;bossPhase=np;playBossRoar();shakeAmount=1;
    currentBoss.traverse(ch=>{if(ch.isMesh&&ch.material&&ch.material.color){ch.material=ch.material.clone();if(np===2)ch.material.color.setHex(0x8a3a1a);else if(np===3)ch.material.color.setHex(0xaa0000);}});
    showToast(np===2?'⚡ ФАЗА 2!':'💀 ФАЗА 3!',2500);
  }
}

// ============ ЗАПУСК ИГРЫ ============
function startGame(level=1,survival=null){
  currentLevel=level;
  survivalMode=survival;
  score=0;health=getMaxHealth();wave=1;
  medkits=2;playerGrenades=3;bossPhase=1;
  enemies.forEach(e=>scene.remove(e));enemies=[];
  enemyBullets.forEach(b=>scene.remove(b));enemyBullets=[];
  grenades.forEach(g=>scene.remove(g));grenades=[];
  lootCrates.forEach(l=>scene.remove(l));lootCrates=[];
  corpses.forEach(c=>scene.remove(c));corpses=[];
  bloodStains.forEach(b=>scene.remove(b));bloodStains=[];
  particles.forEach(p=>scene.remove(p));particles=[];
  currentBoss=null;
  isGameActive=true;
  reloading=false;lastShotTime=0;isMouseDown=false;
  yaw=0;pitch=0;recoilPitch=0;
  verticalVelocity=0;playerY=1.7;isJumping=false;
  bobPhase=0;shakeAmount=0;
  keys.w=keys.a=keys.s=keys.d=false;
  sessionStats={kills:0,headshots:0,headshotStreak:0,maxStreak:0,grenadeKills:0,flameKills:0,medkitsUsed:0,damageTaken:0,tankKills:0,spiderKills:0};
  PROGRESS.records.gamesPlayed=(PROGRESS.records.gamesPlayed||0)+1;
  saveProgress();
  buildLevelEnvironment(level);
  createWeapon(currentWeapon);
  document.querySelectorAll('.screen').forEach(s=>s.style.display='none');
  document.getElementById('hud').style.display='block';
  renderer.domElement.style.display='block';
  if(LEVELS[level]?.isTutorial){
    tutorialState={steps:TUTORIAL_STEPS.map(s=>({...s})),moved:false,looked:false,targetsKilled:0,damageTaken:0};
    document.getElementById('tutorialHUD').style.display='block';
    updateTutorialHUD();
    showToast('🎓 Тренировка!',3000);
  }else{
    tutorialState=null;
    document.getElementById('tutorialHUD').style.display='none';
    startWave();
  }
  updateHUD();
  startHorrorAmbient();
  startDynamicMusic();
  checkAchConditions();
  if(!isMobile)setTimeout(()=>{if(renderer.domElement.requestPointerLock)renderer.domElement.requestPointerLock();},100);
}

function startWave(){
  const lvl=LEVELS[currentLevel]||LEVELS[1];
  if(lvl.isTutorial)return;
  const mode=survivalMode;
  const maxEnemies=mode?mode.maxEnemies:lvl.maxEnemies;
  const spawnInterval=mode?mode.spawnInterval:3000;
  let waveEnemiesRemaining=mode?10+wave*3:5+wave*2;
  showToast(`Волна ${wave}`,1500);
  updateHUD();
  if(survivalMode){
    const key=survivalMode.name==='Лёгкий'?'easy':survivalMode.name==='Обычный'?'normal':survivalMode.name==='Сложный'?'hard':'nightmare';
    updateSurvivalRecord(key,wave);
    if(wave>=10)unlockAch('wave10');
    if(wave>=20)unlockAch('wave20');
    if(wave>=30)unlockAch('wave30');
  }
  if(waveSpawnTimer)clearInterval(waveSpawnTimer);
  waveSpawnTimer=setInterval(()=>{
    if(!isGameActive)return;
    if(enemies.length>=maxEnemies)return;
    if(waveEnemiesRemaining<=0){clearInterval(waveSpawnTimer);waveSpawnTimer=null;checkWaveComplete();return;}
    spawnEnemy(false);
    waveEnemiesRemaining--;
  },spawnInterval);
  if(lvl.boss&&wave===lvl.waves&&!currentBoss)setTimeout(()=>{if(isGameActive&&!currentBoss)spawnEnemy(true);},3000);
}

function checkWaveComplete(){
  if(LEVELS[currentLevel]?.isTutorial)return;
  const alive=enemies.filter(e=>e.userData.health>0).length;
  if(alive===0){
    const lvl=LEVELS[currentLevel]||LEVELS[1];
    if(lvl.boss&&wave>=lvl.waves&&currentBoss)return;
    if(wave>=lvl.waves)completeLevel();
    else{wave++;startWave();}
  }
}

function completeTutorial(){
  if(!tutorialState)return;
  isGameActive=false;
  stopHorrorAmbient();stopDynamicMusic();
  if(document.pointerLockElement)document.exitPointerLock();
  const done=tutorialState.steps.filter(s=>s.done).length;
  const stars=done>=7&&tutorialState.damageTaken===0?3:done>=7?2:done>=5?1:0;
  const coinsEarned=[50,100,200,300][stars];
  PROGRESS.coins+=coinsEarned;
  PROGRESS.levels[0].completed=true;
  PROGRESS.levels[0].stars=Math.max(PROGRESS.levels[0].stars,stars);
  if(stars>=2&&PROGRESS.levels[2])PROGRESS.levels[2].unlocked=true;
  if(stars>=3&&PROGRESS.levels[3])PROGRESS.levels[3].unlocked=true;
  saveProgress();updateCoinsDisplay();renderLevelGrid();
  unlockAch('trained');
  if(stars>=3)unlockAch('threeStars');
  if(tutorialState.damageTaken===0)unlockAch('invincible');
  updateBestScore(score);
  checkAchConditions();
  document.getElementById('hud').style.display='none';
  document.getElementById('tutorialHUD').style.display='none';
  renderer.domElement.style.display='none';
  for(let i=1;i<=3;i++){const s=document.getElementById('star'+i);if(s)s.classList.toggle('active',i<=stars);}
  const c=document.getElementById('coinsEarned');if(c)c.textContent=coinsEarned;
  const h=document.querySelector('#levelComplete h1');if(h)h.textContent=stars>=3?'🎓 ОТЛИЧНО!':stars>=2?'🎓 ХОРОШО!':'🎓 ПРОЙДЕНО';
  document.getElementById('levelComplete').style.display='flex';
}

function completeLevel(){
  isGameActive=false;
  if(waveSpawnTimer)clearInterval(waveSpawnTimer);
  stopHorrorAmbient();stopDynamicMusic();
  const stars=health>getMaxHealth()*0.75?3:health>getMaxHealth()*0.4?2:1;
  const coinsEarned=Math.floor(score/10)+stars*50;
  PROGRESS.coins+=coinsEarned;
  if(PROGRESS.levels[currentLevel]){PROGRESS.levels[currentLevel].completed=true;PROGRESS.levels[currentLevel].stars=Math.max(PROGRESS.levels[currentLevel].stars,stars);}
  if(PROGRESS.levels[currentLevel+1])PROGRESS.levels[currentLevel+1].unlocked=true;
  if(currentLevel===9)unlockAch('hospital');
  if(currentLevel===10)unlockAch('cemetery');
  if(currentLevel===11)unlockAch('rooftop');
  saveProgress();updateCoinsDisplay();
  updateBestScore(score);
  if(survivalMode)submitToLeaderboard();
  if(sessionStats.damageTaken===0)unlockAch('invincible');
  if(currentLevel===8)unlockAch('bossAll');
  checkAchConditions();
  if(document.pointerLockElement)document.exitPointerLock();
  setTimeout(()=>{
    document.getElementById('hud').style.display='none';
    renderer.domElement.style.display='none';
    for(let i=1;i<=3;i++){const s=document.getElementById('star'+i);if(s)s.classList.toggle('active',i<=stars);}
    const c=document.getElementById('coinsEarned');if(c)c.textContent=coinsEarned;
    const h=document.querySelector('#levelComplete h1');if(h)h.textContent='УРОВЕНЬ ПРОЙДЕН!';
    document.getElementById('levelComplete').style.display='flex';
  },1500);
}

function gameOver(){
  isGameActive=false;
  if(waveSpawnTimer)clearInterval(waveSpawnTimer);
  stopHorrorAmbient();stopDynamicMusic();
  PROGRESS.records.totalDeaths=(PROGRESS.records.totalDeaths||0)+1;
  updateBestScore(score);
  if(survivalMode)submitToLeaderboard();
  saveProgress();checkAchConditions();
  showToast('Вы погибли...',2000);
  if(document.pointerLockElement)document.exitPointerLock();
  setTimeout(()=>{
    document.getElementById('hud').style.display='none';
    document.getElementById('tutorialHUD').style.display='none';
    renderer.domElement.style.display='none';
    const dl=document.getElementById('deadLevel');if(dl)dl.textContent=currentLevel;
    document.getElementById('gameover').style.display='flex';
  },1800);
}

// ============ ОБНОВЛЕНИЕ ВРАГОВ ============
function updateEnemies(delta){
  if(!isGameActive)return;
  const now=performance.now();
  const playerPos=camera.position;
  if(currentBoss)checkBossPhase();
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    const ud=e.userData;
    if(ud.health<=0){
      if(ud.isTarget){
        scene.remove(e);enemies.splice(i,1);
        if(tutorialState){
          tutorialState.targetsKilled++;
          if(tutorialState.targetsKilled>=3)markTutStep('kill');
          setTimeout(()=>{
            if(!isGameActive||currentLevel!==0)return;
            const d=new THREE.Group();
            const b=new THREE.Mesh(new THREE.BoxGeometry(0.8,1.4,0.35),new THREE.MeshStandardMaterial({color:0xcc4444,roughness:0.5}));
            b.position.y=0.7;b.castShadow=true;d.add(b);
            const h=new THREE.Mesh(new THREE.SphereGeometry(0.32,12,10),new THREE.MeshStandardMaterial({color:0xff6666,roughness:0.4}));
            h.position.y=1.65;h.castShadow=true;h.userData.isHead=true;d.add(h);
            d.position.set((Math.random()-0.5)*20,0,-5-Math.random()*8);
            d.userData={isTarget:true,health:80,maxHealth:80,type:'target'};
            scene.add(d);enemies.push(d);
          },500);
        }
        continue;
      }
      createCorpse(e);
      sessionStats.kills++;
      PROGRESS.records.totalKills=(PROGRESS.records.totalKills||0)+1;
      if(ud.type==='tank')sessionStats.tankKills++;
      if(ud.type==='spider')sessionStats.spiderKills++;
      if(ud.type==='bomber'){
        playExplosionSound(e.position);
        const radius=5,damage=50;
        if(e.position.distanceTo(camera.position)<radius)takeDamage(damage*(1-e.position.distanceTo(camera.position)/radius));
        for(let j=0;j<20;j++){const v=new THREE.Vector3((Math.random()-0.5)*10,Math.random()*5+1,(Math.random()-0.5)*10);spawnParticle(e.position,v,0xff4400,0.1,0.8,true);}
        const fl=new THREE.PointLight(0xff4400,3,radius*2);fl.position.copy(e.position);scene.add(fl);
        setTimeout(()=>scene.remove(fl),100);
      }
      if(ud.isBoss){
        currentBoss=null;
        addScore(5000);addCoins(500);
        createLootCrate(e.position.clone(),'sniper');
        showToast('💀 БОСС ПОВЕРЖЕН!',3000);
        stopDynamicMusic();
        unlockAch('bossKill');
        if(currentLevel===8)unlockAch('bossAll');
      }else{
        addScore(ud.type==='tank'?300:ud.type==='runner'?80:100);
        if(Math.random()<0.3)createLootCrate(e.position.clone(),ud.weaponDrop);
      }
      saveProgress();checkAchConditions();
      scene.remove(e);enemies.splice(i,1);
      checkWaveComplete();
      continue;
    }
    if(ud.isTarget)continue;
    const dir=new THREE.Vector3().subVectors(playerPos,e.position);
    dir.y=0;
    const dist=dir.length();
    if(dist>0.1){
      dir.normalize();
      let sp=ud.speed;
      if(ud.isBoss){if(ud.phase===2)sp*=1.3;else if(ud.phase===3)sp*=1.6;}
      const speed=sp*(survivalMode?survivalMode.enemySpeed:1);
      const move=dir.clone().multiplyScalar(speed*delta);
      const newPos=e.position.clone().add(move);
      newPos.x=clamp(newPos.x,-46,46);
      newPos.z=clamp(newPos.z,-46,46);
      e.position.copy(newPos);
      e.lookAt(playerPos.x,e.position.y,playerPos.z);
    }
    ud.walkPhase+=delta*(ud.type==='runner'?12:ud.type==='spider'?15:6);
    e.children.forEach((ch,idx)=>{if(ch.geometry&&ch.geometry.type==='CylinderGeometry'&&idx>=4&&idx<=12)ch.rotation.x=Math.sin(ud.walkPhase)*0.4;});
    if(now>ud.nextGroan){playZombieGroan(e.position);ud.nextGroan=now+3000+Math.random()*5000;}
    if(dist<(ud.isBoss?2.5:ud.type==='tank'?2.0:1.5)){
      if(now-ud.lastShot>1000){
        ud.lastShot=now;
        let dmg=(ud.isBoss?20:ud.type==='tank'?20:ud.type==='runner'?5:8);
        dmg*=(survivalMode?survivalMode.enemyDamage:1);
        takeDamage(dmg);
      }
    }
    if(ud.isBoss){
      if(ud.phase>=2&&now>ud.nextSummonTime){
        ud.nextSummonTime=now+10000;
        for(let k=0;k<2+ud.phase;k++){
          const off=new THREE.Vector3((Math.random()-0.5)*6,0,(Math.random()-0.5)*6);
          const minion=createZombie(false,'melee');
          minion.position.copy(e.position).add(off);
          minion.position.y=0.9;
          const bh=LEVELS[currentLevel].enemyHealth;
          minion.userData={type:'melee',health:bh,maxHealth:bh,speed:LEVELS[currentLevel].enemySpeed,radius:0.5,walkPhase:0,nextShotTime:now+99999,weaponDrop:'pistol',phase:1,lastShot:0,nextGroan:now+5000};
          scene.add(minion);enemies.push(minion);
        }
      }
      if(ud.phase>=3&&now>ud.nextShotTime){
        ud.nextShotTime=now+1000+Math.random()*1500;
        if(dist<30&&dist>3){if(Math.random()<0.6)enemyShoot(e,playerPos);else throwGrenade(e,playerPos);}
      }
    }else if((ud.type==='shooter'||ud.type==='grenadier')&&now>ud.nextShotTime){
      if(dist<30&&dist>3){ud.nextShotTime=now+1500+Math.random()*2000;if(ud.type==='shooter')enemyShoot(e,playerPos);else throwGrenade(e,playerPos);}
    }
  }
}

function enemyShoot(e,target){
  const b=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),new THREE.MeshBasicMaterial({color:0xff3300}));
  b.position.copy(e.position).add(new THREE.Vector3(0,e.userData.isBoss?2:1.2,0));
  const dir=new THREE.Vector3().subVectors(target,b.position).normalize();
  b.userData={velocity:dir.multiplyScalar(25),life:3,damage:e.userData.isBoss?15:10};
  scene.add(b);enemyBullets.push(b);
  playShootSoundEnhanced();
}
function throwGrenade(e,target){
  const g=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),new THREE.MeshStandardMaterial({color:0x2a5a2a,metalness:0.8,roughness:0.2}));
  g.position.copy(e.position).add(new THREE.Vector3(0,e.userData.isBoss?2:1.2,0));
  const dir=new THREE.Vector3().subVectors(target,g.position).normalize();
  g.userData={velocity:dir.multiplyScalar(12).add(new THREE.Vector3(0,5,0)),life:2.5,damage:40,radius:6,isPlayer:false};
  scene.add(g);grenades.push(g);
}
function throwPlayerGrenade(){
  if(!isGameActive||playerGrenades<=0)return;
  playerGrenades--;
  const g=new THREE.Mesh(new THREE.SphereGeometry(0.15,8,8),new THREE.MeshStandardMaterial({color:0x2a5a2a,metalness:0.8,roughness:0.2}));
  const fwd=new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
  g.position.copy(camera.position).add(fwd.clone().multiplyScalar(0.5));
  g.position.y-=0.2;
  const v=fwd.clone().multiplyScalar(15);v.y+=6;
  g.userData={velocity:v,life:2.5,damage:80,radius:8,isPlayer:true};
  scene.add(g);grenades.push(g);
  playClickSound(300,0.05);
  updateHUD();
  if(tutorialState)markTutStep('grenade');
}
function updateBullets(delta){
  for(let i=enemyBullets.length-1;i>=0;i--){
    const b=enemyBullets[i];
    b.userData.life-=delta;
    b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
    if(b.userData.life<=0||b.position.length()>100){scene.remove(b);enemyBullets.splice(i,1);continue;}
    if(b.position.distanceTo(camera.position)<1){takeDamage(b.userData.damage*(survivalMode?survivalMode.enemyDamage:1));scene.remove(b);enemyBullets.splice(i,1);}
  }
  for(let i=grenades.length-1;i>=0;i--){
    const g=grenades[i];
    g.userData.life-=delta;
    g.userData.velocity.y-=GRAVITY*delta;
    g.position.add(g.userData.velocity.clone().multiplyScalar(delta));
    if(g.position.y<0.2){g.userData.velocity.y*=-0.5;g.position.y=0.2;}
    if(g.userData.life<=0){explodeGrenade(g.position,g.userData.damage,g.userData.radius,g.userData.isPlayer);scene.remove(g);grenades.splice(i,1);}
  }
}
function explodeGrenade(pos,damage,radius,isPlayer){
  playExplosionSound(pos);
  if(!isPlayer&&pos.distanceTo(camera.position)<radius)takeDamage(damage*(1-pos.distanceTo(camera.position)/radius));
  let killed=0;
  enemies.forEach(e=>{
    if(e.userData.isTarget)return;
    const d=pos.distanceTo(e.position);
    if(d<radius){const alive=e.userData.health>0;e.userData.health-=damage*(1-d/radius);if(alive&&e.userData.health<=0)killed++;}
  });
  if(isPlayer&&killed>=5){sessionStats.grenadeKills=Math.max(sessionStats.grenadeKills,killed);unlockAch('grenadier');}
  const fl=new THREE.PointLight(0xff6600,3,radius*2);fl.position.copy(pos);scene.add(fl);
  setTimeout(()=>scene.remove(fl),100);
  for(let i=0;i<15;i++){const v=new THREE.Vector3((Math.random()-0.5)*12,Math.random()*6+2,(Math.random()-0.5)*12);spawnParticle(pos,v,i%2===0?0xff6600:0xffaa00,0.08+Math.random()*0.06,0.6+Math.random()*0.4,true);}
}
function takeDamage(amount){
  if(!isGameActive)return;
  health-=amount;
  sessionStats.damageTaken+=amount;
  if(tutorialState)tutorialState.damageTaken+=amount;
  shakeAmount=Math.min(1,shakeAmount+0.3);
  playHurtSoundEnhanced();
  const vig=document.getElementById('damageVignette');
  if(vig){vig.style.opacity='1';setTimeout(()=>vig.style.opacity='0',200);}
  updateHUD();
  if(health<=0){health=0;gameOver();}
}
function healPlayer(amount){health=Math.min(getMaxHealth(),health+amount);playHealSoundEnhanced();updateHUD();}
function useMedkit(){if(medkits>0&&health<getMaxHealth()){medkits--;healPlayer(50);updateHUD();sessionStats.medkitsUsed++;if(sessionStats.medkitsUsed>=10)unlockAch('healer');}}
function addScore(p){score+=p;updateHUD();}
function addCoins(a){PROGRESS.coins+=a;saveProgress();updateCoinsDisplay();checkAchConditions();}

function createLootCrate(pos,weaponKey){
  const c=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),new THREE.MeshStandardMaterial({color:0x8a6a2a,metalness:0.5,roughness:0.5}));
  c.position.copy(pos);c.position.y=0.3;c.userData={weapon:weaponKey};
  scene.add(c);lootCrates.push(c);
}
function updateLoot(delta){
  nearLootCrate=null;
  lootCrates.forEach(c=>{c.rotation.y+=delta*2;if(c.position.distanceTo(camera.position)<2.5)nearLootCrate=c;});
  const prompt=document.getElementById('interactPrompt');
  if(prompt)prompt.style.display=nearLootCrate?'block':'none';
}
function pickupLoot(){
  if(!nearLootCrate)return;
  const w=nearLootCrate.userData.weapon;
  if(WEAPONS[w]){WEAPONS[w].ammo=WEAPONS[w].maxAmmo;playPickupSound();addScore(50);}
  const wasTut=nearLootCrate.userData.isTutorialCrate;
  scene.remove(nearLootCrate);
  lootCrates=lootCrates.filter(c=>c!==nearLootCrate);
  nearLootCrate=null;updateHUD();
  if(wasTut&&tutorialState)markTutStep('pickup');
}
function createCorpse(enemy){
  const c=enemy.clone();
  c.rotation.x=Math.PI/2;c.position.y=0.1;
  c.traverse(ch=>{if(ch.isMesh)ch.material=ch.material.clone();});
  scene.add(c);corpses.push(c);
  setTimeout(()=>{scene.remove(c);corpses=corpses.filter(x=>x!==c);},10000);
  const stain=new THREE.Mesh(new THREE.CircleGeometry(0.8,8),new THREE.MeshBasicMaterial({color:0x6a0000,transparent:true,opacity:0.7}));
  stain.rotation.x=-Math.PI/2;
  stain.position.set(enemy.position.x,0.02,enemy.position.z);
  scene.add(stain);bloodStains.push(stain);
  setTimeout(()=>{scene.remove(stain);bloodStains=bloodStains.filter(s=>s!==stain);},15000);
}

// ============ СТРЕЛЬБА ============
function shoot(){
  if(!isGameActive||reloading)return;
  const w=WEAPONS[currentWeapon];
  const now=performance.now();
  if(now-lastShotTime<w.cooldown)return;
  if(w.ammo<=0){reload();return;}
  lastShotTime=now;w.ammo--;
  playShootSoundEnhanced();
  recoilPitch=0.02+Math.random()*0.02;
  shakeAmount=Math.min(1,shakeAmount+0.1);
  const fl=weaponGroup?.userData?.flash;
  if(fl){fl.intensity=3;setTimeout(()=>fl.intensity=0,50);}
  createMuzzleSmoke();createShellCasing();
  if(tutorialState)markTutStep('shoot');
  const dmgMult=getDamageMultiplier();
  const pellets=w.pellets||1;
  for(let i=0;i<pellets;i++){
    const dir=new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.x+=(Math.random()-0.5)*w.spread*2;
    dir.y+=(Math.random()-0.5)*w.spread*2;
    dir.z+=(Math.random()-0.5)*w.spread*2;
    dir.normalize();
    const ray=new THREE.Raycaster(camera.position,dir);
    const hits=ray.intersectObjects(enemies,true);
    if(hits.length>0){
      const hit=hits[0];
      let eo=hit.object;
      while(eo.parent&&!enemies.includes(eo))eo=eo.parent;
      if(enemies.includes(eo)){
        const isHead=hit.object.userData&&hit.object.userData.isHead;
        const mult=isHead?3:1;
        eo.userData.health-=w.damage*mult*dmgMult;
        playHitSoundEnhanced();
        createBloodBurst(hit.point,isHead);
        showHitMarker(isHead);
        if(isHead){
          playHeadshotSound();addScore(25);
          PROGRESS.records.totalHeadshots=(PROGRESS.records.totalHeadshots||0)+1;
          sessionStats.headshots++;
          sessionStats.headshotStreak++;
          if(sessionStats.headshotStreak>sessionStats.maxStreak)sessionStats.maxStreak=sessionStats.headshotStreak;
          if(currentWeapon==='flamethrower')sessionStats.flameKills++;
          saveProgress();checkAchConditions();
        }else{addScore(10);sessionStats.headshotStreak=0;}
      }
    }else{
      const wh=ray.intersectObjects(obstacles,true);
      if(wh.length>0){const wp=wh[0].point;for(let j=0;j<6;j++){const v=new THREE.Vector3((Math.random()-0.5)*3,Math.random()*2+0.5,(Math.random()-0.5)*3);spawnParticle(wp,v,0xaaaaaa,0.04,0.5,true);}}
    }
  }
  updateHUD();
}
function showHitMarker(isHead){
  const hm=document.getElementById('hitMarker');
  if(!hm)return;
  hm.textContent='✖';
  hm.style.color=isHead?'#ffcc00':'#ffffff';
  hm.style.fontSize=isHead?'42px':'30px';
  hm.classList.add('show');
  clearTimeout(hm._t);
  hm._t=setTimeout(()=>hm.classList.remove('show'),120);
}
function reload(){
  if(reloading)return;
  const w=WEAPONS[currentWeapon];
  if(w.ammo===w.maxAmmo)return;
  reloading=true;
  playReloadSoundEnhanced();
  const t=w.reload*getReloadMultiplier();
  showToast('Перезарядка...',t);
  setTimeout(()=>{w.ammo=w.maxAmmo;reloading=false;updateHUD();},t);
  if(tutorialState)markTutStep('reload');
}
function switchWeapon(key){
  if(!WEAPONS[key])return;
  if(!PROGRESS.ownedWeapons.includes(key))return;
  currentWeapon=key;
  createWeapon(key);
  updateHUD();
}

function updatePlayer(delta){
  if(!isGameActive)return;
  const speed=5.0*(isMobile?0.8:1);
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const move=new THREE.Vector3();
  if(keys.w)move.add(forward);
  if(keys.s)move.sub(forward);
  if(keys.a)move.sub(right);
  if(keys.d)move.add(right);
  if(isMobile&&joystickActive){move.add(forward.clone().multiplyScalar(-joystickDeltaY/50));move.add(right.clone().multiplyScalar(joystickDeltaX/50));}
  if(move.length()>0){
    move.normalize();
    const np=camera.position.clone().add(move.multiplyScalar(speed*delta));
    let ok=true;
    for(const obs of obstacles){
      if(obs.userData.size){
        const hx=obs.userData.size.x/2,hz=obs.userData.size.z/2;
        if(Math.abs(np.x-obs.position.x)<hx+0.5&&Math.abs(np.z-obs.position.z)<hz+0.5){ok=false;break;}
      }
    }
    if(ok){np.x=clamp(np.x,-47,47);np.z=clamp(np.z,-47,47);camera.position.x=np.x;camera.position.z=np.z;}
    if(footstepTimer<=0){playFootstepSound();footstepTimer=0.5;}
    if(tutorialState&&!tutorialState.moved){tutorialState.moved=true;markTutStep('move');}
  }
  if(isJumping){verticalVelocity-=GRAVITY*delta;playerY+=verticalVelocity*delta;if(playerY<=1.7){playerY=1.7;verticalVelocity=0;isJumping=false;}}
  camera.position.y=playerY;
  bobPhase+=delta*(move.length()>0?10:2);
  const ba=move.length()>0?0.05:0.01;
  camera.position.y+=Math.sin(bobPhase)*ba;
  camera.rotation.order='YXZ';
  camera.rotation.y=yaw;
  camera.rotation.x=pitch+recoilPitch;
  recoilPitch*=0.9;
  if(shakeAmount>0){camera.rotation.x+=(Math.random()-0.5)*shakeAmount*0.05;camera.rotation.y+=(Math.random()-0.5)*shakeAmount*0.05;shakeAmount*=0.9;}
  footstepTimer-=delta;
  if(tutorialState&&tutorialState.steps.every(s=>s.done))setTimeout(()=>{if(isGameActive&&tutorialState&&tutorialState.steps.every(s=>s.done))completeTutorial();},800);
}
function jump(){if(!isJumping&&isGameActive){verticalVelocity=JUMP_POWER;isJumping=true;}}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function animate(){
  requestAnimationFrame(animate);
  const delta=Math.min(clock.getDelta(),0.1);
  if(isGameActive){
    updatePlayer(delta);
    updateEnemies(delta);
    updateBullets(delta);
    updateLoot(delta);
    updateParticles(delta);
    updateWeather(delta);
    updateMusicIntensity();
  }
  if(isMouseDown&&isGameActive){const w=WEAPONS[currentWeapon];if(w.auto)shoot();}
  if(isGameActive)updateHUD();
  try{
    if(composer)composer.render();
    else renderer.render(scene,camera);
  }catch(e){console.error(e);}
}

// ============ ЕЖЕДНЕВНАЯ НАГРАДА ============
function getDailyState(){
  const today=new Date();today.setHours(0,0,0,0);
  const lastStr=localStorage.getItem('zombieshoot_last_reward');
  let last=null;
  if(lastStr){last=new Date(lastStr);last.setHours(0,0,0,0);}
  let streak=parseInt(localStorage.getItem('zombieshoot_streak')||'0');
  const diffDays=last?Math.floor((today-last)/86400000):null;
  let canClaim=false;
  if(diffDays===null){canClaim=true;streak=0;}
  else if(diffDays===0){canClaim=false;}
  else if(diffDays===1){canClaim=true;}
  else{canClaim=true;streak=0;}
  return{canClaim,streak};
}
function initDailyReward(){
  const s=getDailyState();
  const btn=document.getElementById('dailyBtn');
  if(btn){
    if(!s.canClaim){
      btn.textContent='✅ НАГРАДА ПОЛУЧЕНА';
      btn.style.background='linear-gradient(135deg,#333,#555)';
      btn.style.borderColor='#666';
      btn.style.color='#aaa';
    }else{
      btn.textContent='🎁 ЕЖЕДНЕВНАЯ НАГРАДА';
      btn.style.background='linear-gradient(135deg,#8a5500,#ffcc00)';
      btn.style.borderColor='#ffcc00';
      btn.style.color='#000';
    }
  }
}
function renderDailyReward(){
  const s=getDailyState();
  document.getElementById('dailyStreak').textContent=s.streak;
  const rewards=[100,200,300,400,500,700,1000];
  const grid=document.getElementById('dailyGrid');
  if(!grid)return;
  let html='';
  const cur=s.streak;
  for(let i=0;i<7;i++){
    const dayNum=i+1;
    const claimed=dayNum<=cur;
    const isToday=s.canClaim&&dayNum===cur+1;
    const cls='daily-day'+(claimed?' claimed':'')+(isToday?' today':'');
    html+=`<div class="${cls}"><div class="day-num">День ${dayNum}</div><div class="day-icon">🎁</div><div class="day-reward">${rewards[i]}</div></div>`;
  }
  grid.innerHTML=html;
  const btn=document.getElementById('dailyClaimBtn');
  if(btn){
    btn.disabled=!s.canClaim;
    btn.textContent=s.canClaim?'ЗАБРАТЬ':'УЖЕ ПОЛУЧЕНО';
    btn.style.opacity=s.canClaim?'1':'0.5';
  }
}
function claimDailyReward(){
  const s=getDailyState();
  if(!s.canClaim)return;
  let streak=s.streak+1;
  if(streak>7)streak=1;
  const rewards=[100,200,300,400,500,700,1000];
  const reward=rewards[streak-1];
  PROGRESS.coins+=reward;
  saveProgress();updateCoinsDisplay();
  localStorage.setItem('zombieshoot_last_reward',new Date().toDateString());
  localStorage.setItem('zombieshoot_streak',String(streak));
  playBuySound();
  showToast(`🎁 +${reward} монет (день ${streak})`,3000);
  unlockAch('daily1');
  if(streak>=7)unlockAch('daily7');
  initDailyReward();
  renderDailyReward();
  checkAchConditions();
}

// ============ UI ============
function initUI(){
  const bind=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',fn);};
  bind('playBtn',()=>{renderLevelGrid();showScreen('map');});
  bind('dailyBtn',()=>{renderDailyReward();showScreen('dailyModal');});
  bind('dailyClaimBtn',claimDailyReward);
  bind('dailyCloseBtn',()=>showScreen('menu'));
  bind('survivalBtn',()=>{renderSurvivalGrid();showScreen('survivalMenu');});
  bind('multiplayerBtn',()=>showScreen('multiplayerMenu'));
  bind('shopBtn',()=>{renderShop('skins');updateCoinsDisplay();showScreen('shop');});
  bind('settingsBtn',()=>showScreen('settings'));
  bind('achBtn',()=>{renderAchievements();showScreen('achScreen');});
  bind('recordsBtn',()=>{renderRecords('personal');showScreen('recordsScreen');});
  bind('backToMenu',()=>showScreen('menu'));
  bind('backFromShop',()=>showScreen('menu'));
  bind('closeSettings',()=>showScreen('menu'));
  bind('backFromSurvival',()=>showScreen('menu'));
  bind('backFromMultiplayer',()=>showScreen('menu'));
  bind('backFromAch',()=>showScreen('menu'));
  bind('backFromRecords',()=>showScreen('menu'));
  bind('toMapBtn',()=>{renderLevelGrid();showScreen('map');});
  bind('replayBtn',()=>startGame(currentLevel,survivalMode));
  bind('retryBtn',()=>startGame(currentLevel,survivalMode));
  bind('toMapBtn2',()=>{renderLevelGrid();showScreen('map');});
  bind('resetProgress',()=>{if(confirm('Сбросить прогресс?'))resetProgress();});
  const ht=document.getElementById('horrorToggle');
  if(ht){ht.checked=horrorMode;ht.addEventListener('change',e=>{horrorMode=e.target.checked;try{localStorage.setItem('zombieshoot_horror',horrorMode);}catch(e){}});}
  const bt=document.getElementById('bloomToggle');
  if(bt){bt.checked=bloomEnabled;bt.addEventListener('change',e=>{bloomEnabled=e.target.checked;try{localStorage.setItem('zombieshoot_bloom',bloomEnabled);}catch(e){}rebuildPostProcessing();});}
  const st=document.getElementById('ssaoToggle');
  if(st){st.checked=ssaoEnabled;st.addEventListener('change',e=>{ssaoEnabled=e.target.checked;try{localStorage.setItem('zombieshoot_ssao',ssaoEnabled);}catch(e){}rebuildPostProcessing();});}
  bind('sensSlider',null);
  const ss=document.getElementById('sensSlider');
  if(ss)ss.addEventListener('input',e=>{MOUSE_SENSITIVITY=parseFloat(e.target.value)/2500;});
  const vs=document.getElementById('volSlider');
  if(vs)vs.addEventListener('input',e=>{volume=parseInt(e.target.value)/100;});
  const fs=document.getElementById('fovSlider');
  if(fs)fs.addEventListener('input',e=>{if(camera){camera.fov=parseInt(e.target.value);camera.updateProjectionMatrix();}});
  document.querySelectorAll('.shop-tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.shop-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderShop(tab.dataset.tab);});});
  document.querySelectorAll('.rec-tab').forEach(tab=>{tab.addEventListener('click',()=>{document.querySelectorAll('.rec-tab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderRecords(tab.dataset.tab);});});
}
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.style.display='none');
  if(id)document.getElementById(id).style.display='flex';
  renderer.domElement.style.display='none';
}
function renderLevelGrid(){
  const grid=document.getElementById('levelGrid');
  if(!grid)return;
  grid.innerHTML='';
  const tutProg=PROGRESS.levels[0]||{unlocked:true,stars:0};
  const tutCard=document.createElement('div');
  tutCard.className='level-card';tutCard.style.borderColor='#00d4ff';
  let tutStars='';
  for(let s=1;s<=3;s++)tutStars+=`<svg class="${s<=(tutProg.stars||0)?'':'off'}"><use href="#icon-star"/></svg>`;
  tutCard.innerHTML=`<div class="level-num" style="color:#00d4ff">0</div><div class="level-icon">🎓</div><div class="level-name">Тренировка</div><div class="level-stars">${tutStars}</div>`;
  tutCard.onclick=()=>startGame(0);
  grid.appendChild(tutCard);
  for(let i=1;i<=11;i++){
    const lvl=LEVELS[i];
    const prog=PROGRESS.levels[i]||{unlocked:false,completed:false,stars:0};
    const card=document.createElement('div');
    card.className='level-card'+(prog.unlocked?'':' locked')+(lvl.boss?' boss-level':'');
    let stars='';
    for(let s=1;s<=3;s++)stars+=`<svg class="${s<=prog.stars?'':'off'}"><use href="#icon-star"/></svg>`;
    card.innerHTML=`<div class="level-num">${i}</div><div class="level-icon">${lvl.icon}</div><div class="level-name">${lvl.name}</div><div class="level-stars">${stars}</div>${!prog.unlocked?'<div class="lock-icon">🔒</div>':''}${lvl.boss?'<div class="boss-icon">👹</div>':''}`;
    if(prog.unlocked)card.onclick=()=>startGame(i);
    grid.appendChild(card);
  }
}
function renderSurvivalGrid(){
  const grid=document.getElementById('survivalGrid');
  if(!grid)return;
  grid.innerHTML='';
  for(const key in SURVIVAL_MODES){
    const m=SURVIVAL_MODES[key];
    const card=document.createElement('div');
    card.className='level-card';
    card.innerHTML=`<div class="level-num">${m.icon}</div><div class="level-name">${m.name}</div><div class="level-icon" style="font-size:11px;color:#888;font-family:'Courier New',monospace;">${m.desc}</div>`;
    card.onclick=()=>startGame(1,m);
    grid.appendChild(card);
  }
}
function updateCoinsDisplay(){
  ['menuCoins','mapCoins','shopCoins','survivalCoins','mpCoins','recCoins'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=PROGRESS.coins;});
}
function updateHUD(){
  const hp=document.getElementById('health');if(hp)hp.textContent=Math.ceil(health);
  const sc=document.getElementById('score');
  if(sc){const lvl=LEVELS[currentLevel]||LEVELS[1];if(lvl.isTutorial)sc.textContent='🎓 ТРЕНИРОВКА';else sc.textContent=`Ур.${currentLevel} | Волна ${wave}/${lvl.waves}`;}
  const am=document.getElementById('ammo');
  if(am){const w=WEAPONS[currentWeapon];am.innerHTML=`<svg class="ico-hud"><use href="#icon-${w.icon}"/></svg> ${w.ammo}/${w.maxAmmo}`;}
  const md=document.getElementById('medkits');if(md)md.innerHTML=`<svg class="ico-hud"><use href="#icon-medkit"/></svg> x${medkits}`;
  const gr=document.getElementById('grenades');if(gr)gr.innerHTML=`<svg class="ico-hud"><use href="#icon-grenade"/></svg> x${playerGrenades}`;
  const bb=document.getElementById('bossBar');
  if(bb){
    if(currentBoss&&currentBoss.userData){
      bb.style.display='block';
      const r=currentBoss.userData.health/currentBoss.userData.maxHealth;
      const fill=document.getElementById('bossHealthFill');if(fill)fill.style.width=(r*100)+'%';
      const nm=document.getElementById('bossName');if(nm)nm.innerHTML=`<svg class="ico-hud"><use href="#icon-skull"/></svg> БОСС — ФАЗА ${bossPhase}`;
    }else bb.style.display='none';
  }
}
let toastEl=null,toastTimeout=null;
function showToast(text,duration=2000){
  if(!toastEl){toastEl=document.createElement('div');toastEl.style.cssText='position:fixed;top:25%;left:50%;transform:translateX(-50%);font-size:22px;color:#fff;text-shadow:2px 2px 8px #000;font-family:Impact,sans-serif;letter-spacing:2px;pointer-events:none;z-index:80;transition:opacity 0.3s;text-align:center;';document.body.appendChild(toastEl);}
  toastEl.textContent=text;
  toastEl.style.opacity='1';
  clearTimeout(toastTimeout);
  toastTimeout=setTimeout(()=>{toastEl.style.opacity='0';},duration);
}
function renderShop(tab='weapons'){
  const body=document.getElementById('shopContent');
  if(!body)return;
  updateCoinsDisplay();
  if(tab==='weapons'){
    let html='<div class="shop-grid">';
    for(const key in WEAPONS){
      const w=WEAPONS[key];
      const owned=PROGRESS.ownedWeapons.includes(key);
      const eq=currentWeapon===key;
      let btn='КУПИТЬ',dis=false;
      if(eq){btn='✅ ВЫБРАНО';dis=true;}else if(owned)btn='ВЫБРАТЬ';else if(PROGRESS.coins<w.cost){btn='МАЛО МОНЕТ';dis=true;}
      html+=`<div class="shop-item ${owned?'owned':''} ${eq?'equipped':''}"><svg class="item-icon"><use href="#icon-${w.icon}"/></svg><div class="item-name">${w.name}</div><div class="item-desc">Урон: ${w.damage} | Магазин: ${w.maxAmmo}</div><div class="item-price"><svg class="ico-sm"><use href="#icon-coin"/></svg> ${owned?(eq?'—':'Куплено'):w.cost}</div><button class="item-btn ${eq?'equipped-btn':''}" ${dis?'disabled':''} onclick="handleWeapon('${key}')">${btn}</button></div>`;
    }
    html+='</div>';
    body.innerHTML=html;
  }else if(tab==='skins'){
    let html='<div class="shop-grid">';
    for(const key in SKINS){
      const sk=SKINS[key];
      const owned=PROGRESS.ownedSkins.includes(key);
      const eq=PROGRESS.currentSkin===key;
      let btn='КУПИТЬ',dis=false;
      if(eq){btn='✅ НАДЕТ';dis=true;}else if(owned)btn='НАДЕТЬ';else if(PROGRESS.coins<sk.cost){btn='МАЛО МОНЕТ';dis=true;}
      html+=`<div class="shop-item ${owned?'owned':''} ${eq?'equipped':''}"><div class="item-icon">👤</div><div class="item-name">${sk.name}</div><div class="item-desc">Цвет зомби</div><div class="item-price"><svg class="ico-sm"><use href="#icon-coin"/></svg> ${owned?(eq?'—':'Куплено'):sk.cost}</div><button class="item-btn ${eq?'equipped-btn':''}" ${dis?'disabled':''} onclick="handleSkin('${key}')">${btn}</button></div>`;
    }
    html+='</div>';
    body.innerHTML=html;
  }
}
function handleWeapon(key){
  if(PROGRESS.ownedWeapons.includes(key)){switchWeapon(key);playClickSound(500,0.05);}
  else{const w=WEAPONS[key];if(PROGRESS.coins>=w.cost){PROGRESS.coins-=w.cost;PROGRESS.ownedWeapons.push(key);saveProgress();playBuySound();switchWeapon(key);}else playErrorSound();}
  updateCoinsDisplay();renderShop('weapons');checkAchConditions();
}
function handleSkin(key){
  if(PROGRESS.ownedSkins.includes(key)){PROGRESS.currentSkin=key;saveProgress();playClickSound(500,0.05);}
  else{const sk=SKINS[key];if(PROGRESS.coins>=sk.cost){PROGRESS.coins-=sk.cost;PROGRESS.ownedSkins.push(key);PROGRESS.currentSkin=key;saveProgress();playBuySound();}else playErrorSound();}
  updateCoinsDisplay();renderShop('skins');checkAchConditions();
}
window.handleWeapon=handleWeapon;
window.handleSkin=handleSkin;

function hasAch(id){return !!PROGRESS.achievements[id];}
function unlockAch(id){if(hasAch(id)||!ACHIEVEMENTS[id])return;PROGRESS.achievements[id]=Date.now();saveProgress();showAchToast(ACHIEVEMENTS[id]);updateAchCount();}
function showAchToast(ach){
  let el=document.getElementById('achToast');
  if(!el){el=document.createElement('div');el.id='achToast';document.body.appendChild(el);}
  el.innerHTML=`<div class="toast-icon">${ach.icon}</div><div class="toast-content"><div class="toast-label">🏆 ДОСТИЖЕНИЕ</div><div class="toast-name">${ach.name}</div><div class="toast-desc">${ach.desc}</div></div>`;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),4000);
}
function updateAchCount(){
  const n=Object.keys(PROGRESS.achievements||{}).length;
  const total=Object.keys(ACHIEVEMENTS).length;
  const a=document.getElementById('achProgress');if(a)a.textContent=`${n}/${total}`;
  const b=document.getElementById('achCount');if(b)b.textContent=`${n}/${total}`;
}
function renderAchievements(){
  const grid=document.getElementById('achGrid');
  if(!grid)return;
  let html='';
  for(const id in ACHIEVEMENTS){
    const a=ACHIEVEMENTS[id];
    const un=hasAch(id);
    html+=`<div class="ach-card ${un?'unlocked':'locked'}"><div class="ach-icon">${a.icon}</div><div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div></div>${!un?'<div class="ach-lock">🔒</div>':''}</div>`;
  }
  grid.innerHTML=html;
  updateAchCount();
}
function checkAchConditions(){
  const r=PROGRESS.records;
  if(r.totalKills>=1)unlockAch('firstBlood');
  if(r.totalKills>=10)unlockAch('shooter');
  if(r.totalKills>=100)unlockAch('butcher');
  if(r.totalKills>=500)unlockAch('genocide');
  if(r.totalHeadshots>=10)unlockAch('sniper10');
  if(r.totalHeadshots>=100)unlockAch('sniper100');
  if(sessionStats.maxStreak>=5)unlockAch('streak');
  if(sessionStats.flameKills>=20)unlockAch('firestarter');
  if(sessionStats.tankKills>=10)unlockAch('tankKill');
  if(sessionStats.spiderKills>=20)unlockAch('spiderKill');
  if(PROGRESS.coins>=5000)unlockAch('rich');
  if(PROGRESS.ownedWeapons.length>=Object.keys(WEAPONS).length)unlockAch('collector');
  if(PROGRESS.ownedSkins.length>=Object.keys(SKINS).length)unlockAch('stylish');
  if(Object.values(PROGRESS.upgrades).every(v=>v>=5))unlockAch('upgraded');
  let ts=0;
  for(let i=0;i<=11;i++)if((PROGRESS.levels[i]?.stars||0)>=3)ts++;
  if(ts>=1)unlockAch('threeStars');
  if(ts>=5)unlockAch('perfection');
  if(ts>=11)unlockAch('legend');
}

function getPlayerName(){let n=localStorage.getItem('zombieshoot_name');if(!n){n='Игрок'+Math.floor(Math.random()*9000+1000);localStorage.setItem('zombieshoot_name',n);}return n;}
function updateBestScore(s){if(s>(PROGRESS.records.bestScore||0)){PROGRESS.records.bestScore=s;saveProgress();}}
function updateSurvivalRecord(mode,wave){if(!PROGRESS.records.survivalBest[mode]||wave>PROGRESS.records.survivalBest[mode]){PROGRESS.records.survivalBest[mode]=wave;saveProgress();}const best=Math.max(...Object.values(PROGRESS.records.survivalBest),0);const el=document.getElementById('survivalBest');if(el)el.textContent=best;}
function submitToLeaderboard(){if(!window.firebaseDB)return;const ref=firebaseDB.ref('leaderboard/survival').push();ref.set({name:getPlayerName(),score,wave,mode:survivalMode?survivalMode.name:'Кампания',level:currentLevel,time:Date.now()}).catch(()=>{});}
function fetchLeaderboard(cb){if(!window.firebaseDB){cb([]);return;}firebaseDB.ref('leaderboard/survival').orderByChild('score').limitToLast(20).once('value').then(snap=>{const arr=[];snap.forEach(ch=>arr.push(ch.val()));arr.reverse();cb(arr);}).catch(()=>cb([]));}
function renderRecords(tab='personal'){
  const body=document.getElementById('recordsBody');
  if(!body)return;
  if(tab==='personal'){
    const r=PROGRESS.records;
    const rows=[
      {l:'Лучший счёт',v:r.bestScore||0,e:'очков'},
      {l:'Лёгкий',v:r.survivalBest.easy||0,e:'волн'},
      {l:'Обычный',v:r.survivalBest.normal||0,e:'волн'},
      {l:'Сложный',v:r.survivalBest.hard||0,e:'волн'},
      {l:'Кошмар',v:r.survivalBest.nightmare||0,e:'волн'},
      {l:'Убийств',v:r.totalKills||0,e:''},
      {l:'Хедшотов',v:r.totalHeadshots||0,e:''},
      {l:'Игр',v:r.gamesPlayed||0,e:''}
    ];
    let html=`<div class="rec-head"><span>${getPlayerName()}</span><span>${new Date().toLocaleDateString('ru-RU')}</span></div>`;
    rows.forEach((row,i)=>{html+=`<div class="rec-row"><div class="rec-rank">${i+1}</div><div class="rec-name">${row.l}</div><div class="rec-value">${row.v}</div><div class="rec-extra">${row.e}</div></div>`;});
    body.innerHTML=html;
  }else{
    body.innerHTML='<div class="rec-empty">ЗАГРУЗКА...</div>';
    fetchLeaderboard(arr=>{
      if(!arr.length){body.innerHTML='<div class="rec-empty">Пока нет записей.</div>';return;}
      let html='<div class="rec-head"><span>ТОП-20</span><span>SCORE</span></div>';
      arr.forEach((r,i)=>{const cls=i===0?'top1':i===1?'top2':i===2?'top3':'';html+=`<div class="rec-row ${cls}"><div class="rec-rank">#${i+1}</div><div class="rec-name">${r.name}</div><div class="rec-extra">Волна ${r.wave} · ${r.mode}</div><div class="rec-value">${r.score}</div></div>`;});
      body.innerHTML=html;
    });
  }
}
function markTutStep(id){const s=tutorialState?.steps.find(s=>s.id===id);if(s&&!s.done){s.done=true;updateTutorialHUD();}}
function updateTutorialHUD(){
  const el=document.getElementById('tutorialHUD');
  if(!el||!tutorialState)return;
  const list=tutorialState.steps.map(s=>`<div class="tut-step ${s.done?'done':''}"><span class="tut-check">${s.done?'✅':'⬜'}</span><span class="tut-text">${s.text}</span></div>`).join('');
  el.innerHTML=`<div class="tut-title">🎓 ТРЕНИРОВКА</div>${list}`;
}

// ============ УПРАВЛЕНИЕ ============
function setupControls(){
  document.addEventListener('keydown',e=>{
    const k=e.code;
    if(k==='KeyW')keys.w=true;
    if(k==='KeyA')keys.a=true;
    if(k==='KeyS')keys.s=true;
    if(k==='KeyD')keys.d=true;
    if(k==='KeyR')reload();
    if(k==='KeyE')pickupLoot();
    if(k==='KeyQ')useMedkit();
    if(k==='KeyG')throwPlayerGrenade();
    if(k==='KeyF'){if(flashlight)flashlight.visible=!flashlight.visible;}
    if(k==='Digit1')switchWeapon('pistol');
    if(k==='Digit2')switchWeapon('rifle');
    if(k==='Digit3')switchWeapon('shotgun');
    if(k==='Digit4')switchWeapon('sniper');
    if(k==='Digit5')switchWeapon('dualPistols');
    if(k==='Digit6')switchWeapon('flamethrower');
    if(k==='Escape'){
      if(isGameActive){
        isGameActive=false;
        stopHorrorAmbient();stopDynamicMusic();
        document.getElementById('hud').style.display='none';
        document.getElementById('tutorialHUD').style.display='none';
        document.getElementById('menu').style.display='flex';
        renderer.domElement.style.display='none';
        if(document.pointerLockElement)document.exitPointerLock();
      }
    }
    if(k==='Space'){e.preventDefault();jump();}
  });
  document.addEventListener('keyup',e=>{
    const k=e.code;
    if(k==='KeyW')keys.w=false;
    if(k==='KeyA')keys.a=false;
    if(k==='KeyS')keys.s=false;
    if(k==='KeyD')keys.d=false;
  });
  document.addEventListener('mousemove',e=>{
    if(!isGameActive)return;
    if(document.pointerLockElement===renderer.domElement){
      if(e.movementX!==0||e.movementY!==0){
        yaw-=e.movementX*MOUSE_SENSITIVITY;
        pitch-=e.movementY*MOUSE_SENSITIVITY;
        pitch=clamp(pitch,-Math.PI/2+0.1,Math.PI/2-0.1);
        if(tutorialState&&!tutorialState.looked&&(Math.abs(e.movementX)>3||Math.abs(e.movementY)>3)){tutorialState.looked=true;markTutStep('look');}
      }
    }
  });
  document.addEventListener('mousedown',e=>{
    if(!isGameActive)return;
    if(e.button===0){isMouseDown=true;if(!document.pointerLockElement)renderer.domElement.requestPointerLock();shoot();}
    if(e.button===2){e.preventDefault();throwPlayerGrenade();}
  });
  document.addEventListener('mouseup',e=>{if(e.button===0)isMouseDown=false;});
  document.addEventListener('contextmenu',e=>{if(isGameActive)e.preventDefault();});
}
function initMobileControls(){
  if(!isMobile)return;
  const jz=document.getElementById('joystickZone');
  const base=document.getElementById('joystickBase');
  const knob=document.getElementById('joystickKnob');
  const lookZone=document.getElementById('mobileControls');
  if(jz&&base&&knob){
    jz.addEventListener('touchstart',e=>{const t=e.changedTouches[0];joystickActive=true;joystickTouchId=t.identifier;joystickStartX=t.clientX;joystickStartY=t.clientY;base.style.display='block';base.style.left=t.clientX+'px';base.style.top=t.clientY+'px';},{passive:true});
    jz.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===joystickTouchId){joystickDeltaX=t.clientX-joystickStartX;joystickDeltaY=t.clientY-joystickStartY;const max=50,d=Math.hypot(joystickDeltaX,joystickDeltaY);if(d>max){joystickDeltaX=(joystickDeltaX/d)*max;joystickDeltaY=(joystickDeltaY/d)*max;}knob.style.transform=`translate(calc(-50% + ${joystickDeltaX}px), calc(-50% + ${joystickDeltaY}px))`;}}},{passive:true});
    jz.addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===joystickTouchId){joystickActive=false;joystickTouchId=null;joystickDeltaX=0;joystickDeltaY=0;base.style.display='none';knob.style.transform='translate(-50%, -50%)';}}},{passive:true});
  }
  const bind=(id,action)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('touchstart',e=>{e.preventDefault();action();el.classList.add('pressed');},{passive:false});el.addEventListener('touchend',e=>{e.preventDefault();el.classList.remove('pressed');},{passive:false});};
  bind('btnShoot',()=>shoot());
  bind('btnReload',()=>reload());
  bind('btnJump',()=>jump());
  bind('btnMedkit',()=>useMedkit());
  bind('btnGrenade',()=>throwPlayerGrenade());
  bind('btnPickup',()=>pickupLoot());
  bind('btnWeapon',()=>{const list=PROGRESS.ownedWeapons;const i=list.indexOf(currentWeapon);switchWeapon(list[(i+1)%list.length]);});
  if(lookZone){
    lookZone.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.clientX>window.innerWidth*0.5&&!joystickActive){lookTouchId=t.identifier;lookLastX=t.clientX;lookLastY=t.clientY;}}},{passive:true});
    lookZone.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===lookTouchId){yaw-=(t.clientX-lookLastX)*0.005;pitch-=(t.clientY-lookLastY)*0.005;pitch=clamp(pitch,-Math.PI/2+0.1,Math.PI/2-0.1);lookLastX=t.clientX;lookLastY=t.clientY;if(tutorialState&&!tutorialState.looked){tutorialState.looked=true;markTutStep('look');}}}},{passive:true});
    lookZone.addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===lookTouchId)lookTouchId=null;}},{passive:true});
  }
}
window.addEventListener('resize',()=>{
  if(!camera)return;
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  if(composer)composer.setSize(innerWidth,innerHeight);
});
window.addEventListener('load',()=>{
  document.querySelectorAll('.screen').forEach(s=>s.style.display='none');
  document.getElementById('menu').style.display='flex';
  init();
});
