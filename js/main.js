console.log('🎮 Loading...');

import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Weapon } from './core/Weapon.js';
import { Raycaster } from './render/Raycaster.js';
import { Minimap } from './render/Minimap.js';
import { AssetGenerator } from './render/AssetGenerator.js';
import { ParticleEffects } from './render/ParticleEffects.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';
import { Enemy3D } from './core/Enemy3D.js';
import { MusicGenerator } from './audio/MusicGenerator.js';

const loader = document.getElementById('loader');
const canvas = document.getElementById('game');
const music = new MusicGenerator();
let currentScreen = 'menu';
let gameStarted = false;

// Установить размер canvas сразу
if (canvas) {
  canvas.width = RENDER.numRays;
  canvas.height = Math.floor(RENDER.numRays * 0.6);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.display = 'block';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.zIndex = '1';
}

window.showScreen = function(screenName) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.add('hidden');
    s.style.display = 'none';
  });
  
  const target = document.getElementById('screen-' + screenName);
  if (target) {
    target.classList.remove('hidden');
    target.style.display = screenName === 'game' ? 'block' : 'flex';
    currentScreen = screenName;
    console.log('✓ Screen:', screenName);
  }
  
  if (screenName === 'game' && !gameStarted) startGame();
};

window.exitGame = function() {
  if (window.vkBridge) window.vkBridge.send('VKWebAppClose');
  else window.close();
};

window.buyItem = function(type, cost) {
  if (player.score >= cost) {
    player.score -= cost;
    if (type === 'health') player.health = Math.min(PLAYER.maxHealth, player.health + 50);
    if (type === 'ammo') player.ammo = Math.min(PLAYER.maxAmmo, player.ammo + 20);
    if (type === 'shotgun') { hasShotgun = true; currentWeapon = 'shotgun'; weapon.switchTo('shotgun'); }
    if (type === 'machinegun') { hasMachinegun = true; currentWeapon = 'machinegun'; weapon.switchTo('machinegun'); }
    const el = document.getElementById('shop-coins');
    if (el) el.textContent = player.score;
    audio.playPickup();
  } else alert('Недостаточно монет!');
};

function startGame() {
  console.log('🚀 Starting game...');
  gameStarted = true;
  currentScreen = 'game';
  
  // Скрыть меню, показать canvas и UI
  const menu = document.getElementById('screen-menu');
  if (menu) {
    menu.classList.add('hidden');
    menu.style.display = 'none';
  }
  
  if (canvas) {
    canvas.style.display = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '1';
  }
  
  const ui = document.getElementById('ui');
  if (ui) {
    ui.style.display = 'block';
    ui.style.position = 'fixed';
    ui.style.top = '0';
    ui.style.left = '0';
    ui.style.width = '100vw';
    ui.style.height = '100vh';
    ui.style.zIndex = '10';
    ui.style.pointerEvents = 'none';
  }
  
  // Элементы управления должны быть кликабельны
  const joystick = document.getElementById('joystick');
  const btnShoot = document.getElementById('btn-shoot');
  if (joystick) joystick.style.pointerEvents = 'auto';
  if (btnShoot) btnShoot.style.pointerEvents = 'auto';
  
  music.play();
  enemies.length = 0;
  player.health = PLAYER.maxHealth;
  player.ammo = PLAYER.maxAmmo;
  player.score = 0;
  player.x = 7.5 * RENDER.mapScale;
  player.y = 4.5 * RENDER.mapScale;
  player.angle = 0;
  weapon.switchTo('pistol');
  currentWeapon = 'pistol';
  hasShotgun = false;
  hasMachinegun = false;
  waveManager.startWave();
  updateHUD();
  console.log('✅ Game running! Canvas:', canvas ? 'visible' : 'null');
}

const raycaster = new Raycaster(canvas);
const input = new InputManager();
const audio = new SoundManager();
document.addEventListener('pointerdown', () => audio.init(), { once: true });

const wallTex = AssetGenerator.createWallTexture();
const particles = new ParticleEffects();
const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
const weapon = new Weapon('pistol', player);
const minimap = new Minimap();
const enemies = [];

let damageFlash = 0;
let stepTimer = 0;
let currentWeapon = 'pistol';
let hasShotgun = false, hasMachinegun = false;

const uiEls = {
  health: document.getElementById('hud-health'),
  ammo: document.getElementById('hud-ammo'),
  money: document.getElementById('hud-money'),
  wave: document.getElementById('hud-wave'),
  shopModal: document.getElementById('modal-shop'),
  shopMoney: document.getElementById('shop-money'),
  btnHealth: document.getElementById('btn-buy-health'),
  btnAmmo: document.getElementById('btn-buy-ammo'),
  btnNext: document.getElementById('btn-next-wave'),
  overModal: document.getElementById('modal-over'),
  finalWave: document.getElementById('final-wave'),
  btnRestart: document.getElementById('btn-restart')
};

function updateHUD() {
  if(uiEls.health) uiEls.health.textContent = Math.floor(player.health);
  if(uiEls.ammo) uiEls.ammo.textContent = player.ammo;
  if(uiEls.money) uiEls.money.textContent = player.score;
  if(uiEls.wave) uiEls.wave.textContent = WAVES.startEnemies + (waveManager.wave-1)*WAVES.increasePerWave;
  const shopCoins = document.getElementById('shop-coins');
  if(shopCoins) shopCoins.textContent = player.score;
}

window.addEventListener('keydown', e => {
  if(currentScreen !== 'game') return;
  if(e.key==='1') { currentWeapon='pistol'; weapon.switchTo('pistol'); }
  if(e.key==='2' && hasShotgun) { currentWeapon='shotgun'; weapon.switchTo('shotgun'); }
  if(e.key==='3' && hasMachinegun) { currentWeapon='machinegun'; weapon.switchTo('machinegun'); }
});

const waveManager = new WaveManager(() => {
  let mx, my, att = 0;
  do {
    mx = Math.floor(Math.random()*MAP[0].length);
    my = Math.floor(Math.random()*MAP.length);
    att++;
  } while((MAP[my][mx]!==0 || Math.hypot(mx*RENDER.mapScale-player.x, my*RENDER.mapScale-player.y)<200) && att<100);
  
  if(att<100) {
    let type = 'grunt';
    const w = waveManager.wave;
    if(w>0 && w%WAVES.bossEvery===0 && enemies.filter(e=>e.active&&e.isBoss).length===0) type='boss';
    else if(w>3) type = Math.random()>0.7?'tank':(Math.random()>0.4?'fast':'grunt');
    enemies.push(new Enemy3D(mx*RENDER.mapScale, my*RENDER.mapScale, type, AssetGenerator.createEnemySprite(type,0)));
  }
});

function openShop() {
  currentScreen='shop';
  if(uiEls.shopModal) {
    uiEls.shopMoney.textContent = player.score;
    uiEls.shopModal.showModal();
  }
  if(uiEls.btnHealth) uiEls.btnHealth.disabled = player.score<SHOP.healthCost;
  if(uiEls.btnAmmo) uiEls.btnAmmo.disabled = player.score<SHOP.ammoCost;
}

function closeShop() {
  currentScreen='game';
  if(uiEls.shopModal) uiEls.shopModal.close();
  waveManager.nextWave();
}

if(uiEls.btnHealth) uiEls.btnHealth.onclick = () => {
  if(player.score>=SHOP.healthCost) {
    player.score-=SHOP.healthCost;
    player.health=Math.min(PLAYER.maxHealth, player.health+SHOP.healthAmount);
    updateHUD();
    if(uiEls.shopMoney) uiEls.shopMoney.textContent=player.score;
    audio.playPickup();
  }
};

if(uiEls.btnAmmo) uiEls.btnAmmo.onclick = () => {
  if(player.score>=SHOP.ammoCost) {
    player.score-=SHOP.ammoCost;
    player.ammo=Math.min(PLAYER.maxAmmo, player.ammo+SHOP.ammoAmount);
    updateHUD();
    if(uiEls.shopMoney) uiEls.shopMoney.textContent=player.score;
    audio.playPickup();
  }
};

if(uiEls.btnNext) uiEls.btnNext.onclick = closeShop;
if(uiEls.btnRestart) uiEls.btnRestart.onclick = () => location.reload();

function shootRaycast() {
  const stats = weapon.shoot();
  if(!stats) return;
  if(stats.sound==='shotgun') audio.playShotgun();
  else if(stats.sound==='machinegun') audio.playMachinegun();
  else audio.playShoot();
  
  particles.emit(player.x+Math.cos(player.angle)*20, player.y+Math.sin(player.angle)*20, 'sparks', 6);
  
  const pellets = stats.pellets||1;
  for(let p=0; p<pellets; p++) {
    const spread = (Math.random()-0.5)*stats.spread;
    const rayAngle = player.angle+spread;
    let hit=null, hitDist=stats.range*RENDER.mapScale;
    for(const e of enemies) {
      if(!e.active) continue;
      const dx=e.x-player.x, dy=e.y-player.y, dist=Math.sqrt(dx*dx+dy*dy);
      if(dist>hitDist) continue;
      const ang=Math.atan2(dy,dx); let diff=ang-rayAngle;
      while(diff<-Math.PI) diff+=2*Math.PI; while(diff>Math.PI) diff-=2*Math.PI;
      if(Math.abs(diff)<0.25) { hit=e; hitDist=dist; }
    }
    if(hit) {
      if(hit.takeDamage(stats.damage)) {
        player.score+=hit.score;
        particles.emit(hit.x, hit.y, 'blood', 20);
        particles.emit(hit.x, hit.y, 'fire', 8);
        audio.playExplosion();
      } else {
        particles.emit(hit.x, hit.y, 'blood', 8);
        audio.playHurt();
      }
    }
  }
}

function endGame() {
  currentScreen='gameover';
  if(uiEls.finalWave) uiEls.finalWave.textContent=waveManager.wave;
  if(uiEls.overModal) uiEls.overModal.showModal();
}

let lastTime = 0;
function gameLoop(ts) {
  const dt = Math.min((ts-lastTime)/1000, 0.04);
  lastTime = ts;

  if(currentScreen==='game' && gameStarted) {
    player.update(dt, input);
    weapon.update(dt);
    if(input.isShooting()) { shootRaycast(); input.resetShoot(); }
    
    const mv = input.getMovement();
    if(Math.abs(mv.move)>0.1) { stepTimer+=dt; if(stepTimer>0.35){audio.playStep();stepTimer=0;} }
    else stepTimer=Math.max(stepTimer-dt, 0.1);

    const active=[];
    for(const e of enemies) {
      if(e.active) {
        if(e.update(dt, player)) { damageFlash=1; audio.playHurt(); player.takeDamage(e.damage); }
        active.push(e);
      }
    }
    particles.update(dt);
    if(damageFlash>0) damageFlash-=dt*4;
    waveManager.update(dt);
    updateHUD();
    if(waveManager.checkWaveComplete(active.length)) openShop();
    if(player.health<=0 && currentScreen==='game') endGame();
  }

  // ТЕСТОВЫЙ РЕНДЕРИНГ - красный квадрат
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Чёрный фон
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Красный квадрат для теста
      ctx.fillStyle = '#f00';
      ctx.fillRect(100, 100, 100, 100);
      
      // Текст
      ctx.fillStyle = '#0f0';
      ctx.font = '20px monospace';
      ctx.fillText('TEST: Canvas works!', 50, 50);
      
      if(gameStarted) {
        // Попробуем raycaster
        try {
          raycaster.render(ts, player, wallTex);
          ctx.fillStyle = '#fff';
          ctx.fillText('Raycaster OK', 50, 90);
        } catch(e) {
          ctx.fillStyle = '#f00';
          ctx.fillText('Raycaster ERROR: ' + e.message, 50, 90);
        }
        
        // Враги
        enemies.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
        for(const e of enemies) if(e.active) e.draw(ctx, player);
        particles.draw(ctx);
        
        const cx=canvas.width/2, cy=canvas.height/2;
        ctx.strokeStyle='#0f0'; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(cx-8,cy); ctx.lineTo(cx-3,cy); ctx.moveTo(cx+3,cy); ctx.lineTo(cx+8,cy);
        ctx.moveTo(cx,cy-8); ctx.lineTo(cx,cy-3); ctx.moveTo(cx,cy+3); ctx.lineTo(cx,cy+8);
        ctx.stroke();

        minimap.draw(ctx, player, enemies);

        ctx.fillStyle='#fff'; ctx.font='bold 11px monospace';
        ctx.fillText(WEAPONS[currentWeapon].name+' | '+player.ammo, 8, canvas.height-8);

        if(damageFlash>0) { ctx.fillStyle='rgba(255,0,0,0.3)'; ctx.fillRect(0,0,canvas.width,canvas.height); }
      }
    } else {
      console.error('❌ Cannot get 2D context!');
    }
  } else {
    console.error('❌ Canvas is null!');
  }

  requestAnimationFrame(gameLoop);
}

// Старт
setTimeout(() => {
  if(loader) loader.classList.add('hidden');
  showScreen('menu');
}, 800);

console.log('🎮 READY');
