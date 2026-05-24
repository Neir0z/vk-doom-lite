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

// Лоадер
const loader = document.getElementById('loader');
const ui = document.getElementById('ui');
const progress = document.querySelector('.loader__progress');
const status = document.getElementById('loader__status');
const modList = document.getElementById('loader__modules');
let modCount = 0;
const totalMods = 11;

function logMod(name) {
  modCount++;
  if(progress) progress.style.width = (modCount/totalMods*100)+'%';
  if(status) status.textContent = 'Загрузка: '+name;
  if(modList) {
    const d = document.createElement('div');
    d.className = 'loader__module ok';
    d.textContent = name;
    modList.appendChild(d);
  }
}

logMod('Config'); import('./config.js').then(logMod.bind(null,'Config OK'));
logMod('Input'); import('./core/Input.js').then(logMod.bind(null,'Input OK'));
logMod('Player'); import('./core/Player.js').then(logMod.bind(null,'Player OK'));
logMod('Weapon'); import('./core/Weapon.js').then(logMod.bind(null,'Weapon OK'));
logMod('Raycaster'); import('./render/Raycaster.js').then(logMod.bind(null,'Raycaster OK'));
logMod('Minimap'); import('./render/Minimap.js').then(logMod.bind(null,'Minimap OK'));
logMod('Assets'); import('./render/AssetGenerator.js').then(logMod.bind(null,'Assets OK'));
logMod('Particles'); import('./render/ParticleEffects.js').then(logMod.bind(null,'Particles OK'));
logMod('Sound'); import('./audio/SoundManager.js').then(logMod.bind(null,'Sound OK'));
logMod('Waves'); import('./core/WaveManager.js').then(logMod.bind(null,'Waves OK'));
logMod('Enemies'); import('./core/Enemy3D.js').then(logMod.bind(null,'Enemies OK'));

// Инициализация игры
const canvas = document.getElementById('game');
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

let gameState = 'playing';
let damageFlash = 0;
let stepTimer = 0;
let currentWeapon = 'pistol';
let hasShotgun = false, hasMachinegun = false;

// UI
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
}

window.addEventListener('keydown', e => {
  if(gameState !== 'playing') return;
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
  gameState='shop';
  uiEls.shopMoney.textContent=player.score;
  if(uiEls.shopModal) uiEls.shopModal.showModal();
  if(uiEls.btnHealth) uiEls.btnHealth.disabled = player.score<SHOP.healthCost;
  if(uiEls.btnAmmo) uiEls.btnAmmo.disabled = player.score<SHOP.ammoCost;
}
function closeShop() {
  gameState='playing';
  if(uiEls.shopModal) uiEls.shopModal.close();
  waveManager.nextWave();
}
if(uiEls.btnHealth) uiEls.btnHealth.onclick = () => {
  if(player.score>=SHOP.healthCost) { player.score-=SHOP.healthCost; player.health=Math.min(PLAYER.maxHealth, player.health+SHOP.healthAmount); updateHUD(); uiEls.shopMoney.textContent=player.score; audio.playPickup(); }
};
if(uiEls.btnAmmo) uiEls.btnAmmo.onclick = () => {
  if(player.score>=SHOP.ammoCost) { player.score-=SHOP.ammoCost; player.ammo=Math.min(PLAYER.maxAmmo, player.ammo+SHOP.ammoAmount); updateHUD(); uiEls.shopMoney.textContent=player.score; audio.playPickup(); }
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
  gameState='gameover';
  if(uiEls.finalWave) uiEls.finalWave.textContent=waveManager.wave;
  if(uiEls.overModal) uiEls.overModal.showModal();
}

let lastTime = 0;
function gameLoop(ts) {
  const dt = Math.min((ts-lastTime)/1000, 0.04);
  lastTime = ts;

  if(gameState==='playing') {
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
    if(player.health<=0 && gameState==='playing') endGame();
  }

  const ctx = raycaster.ctx;
  raycaster.render(ts, player, wallTex);
  
  enemies.sort((a,b)=>Math.hypot(b.x-player.x,b.y-player.y)-Math.hypot(a.x-player.x,a.y-player.y));
  for(const e of enemies) if(e.active) e.draw(ctx, player);
  
  particles.draw(ctx);
  
  const cx=ctx.canvas.width/2, cy=ctx.canvas.height/2;
  ctx.strokeStyle=gameState==='playing'?'#0f0':'#555'; ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(cx-8,cy); ctx.lineTo(cx-3,cy); ctx.moveTo(cx+3,cy); ctx.lineTo(cx+8,cy);
  ctx.moveTo(cx,cy-8); ctx.lineTo(cx,cy-3); ctx.moveTo(cx,cy+3); ctx.lineTo(cx,cy+8);
  ctx.stroke();

  minimap.draw(ctx, player, enemies);

  ctx.fillStyle='#fff'; ctx.font='bold 11px monospace'; ctx.shadowColor='#000'; ctx.shadowBlur=3;
  ctx.fillText(WEAPONS[currentWeapon].name+' | 🔫 '+player.ammo, 8, ctx.canvas.height-8);
  ctx.shadowBlur=0;

  if(damageFlash>0) { ctx.fillStyle='rgba(255,0,0,'+Math.min(0.5,damageFlash)+')'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); }

  requestAnimationFrame(gameLoop);
}

// Запуск
if(loader) loader.classList.add('hidden');
if(ui) ui.classList.remove('hidden');
waveManager.startWave();
requestAnimationFrame(gameLoop);
console.log('🎮 GAME RUNNING');
