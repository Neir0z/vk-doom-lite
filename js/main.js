import { GAME, PLAYER, ENEMY, SHOP, WAVES, RENDER, MAP } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Raycaster } from './render/Raycaster.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';
import { Enemy3D } from './core/Enemy3D.js';
import { TextureGenerator } from './render/Textures.js';

async function bootstrap() {
  const canvas = document.getElementById('game');
  const raycaster = new Raycaster(canvas);
  const input = new InputManager();
  const audio = new SoundManager();

  document.addEventListener('pointerdown', () => audio.init(), { once: true });

  const enemyTex = TextureGenerator.createEnemy();

  // Старт игрока
  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  
  const enemies = [];
  let damageFlash = 0;

  const waveManager = new WaveManager(() => {
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(Math.random() * MAP[0].length);
      my = Math.floor(Math.random() * MAP.length);
      attempts++;
    } while (
      (MAP[my][mx] !== 0 || Math.hypot(mx * RENDER.mapScale - player.x, my * RENDER.mapScale - player.y) < 200) && 
      attempts < 100
    );

    if (attempts < 100) {
      const enemy = new Enemy3D(mx * RENDER.mapScale, my * RENDER.mapScale, enemyTex);
      enemies.push(enemy);
      console.log(`👹 Enemy spawned at (${mx}, ${my}) = (${enemy.x}, ${enemy.y})`);
    } else {
      console.warn('⚠️ Could not spawn enemy');
    }
  });

  let gameState = 'playing';

  const ui = {
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

  let highScore = 0;
  try {
    if (window.vkBridge) {
      const data = await window.vkBridge.send('VKWebAppStorageGet', { keys: ['doom_highscore'] });
      if (data.keys?.[0]) highScore = parseInt(data.keys[0].value) || 0;
    }
  } catch {}

  function updateHUD() {
    if (ui.health) ui.health.textContent = Math.floor(player.health);
    if (ui.ammo) ui.ammo.textContent = player.ammo;
    if (ui.money) ui.money.textContent = player.score;
    if (ui.wave) ui.wave.textContent = waveManager.wave;
  }

  function openShop() {
    gameState = 'shop';
    ui.shopMoney.textContent = player.score;
    ui.shopModal.showModal();
  }

  function closeShop() {
    gameState = 'playing';
    ui.shopModal.close();
    waveManager.nextWave();
  }

  ui.btnHealth.addEventListener('click', () => {
    if (player.score >= SHOP.healthCost) {
      player.score -= SHOP.healthCost;
      player.health = Math.min(100, player.health + SHOP.healthAmount);
      updateHUD(); ui.shopMoney.textContent = player.score;
      audio.playExplosion();
    }
  });

  ui.btnAmmo.addEventListener('click', () => {
    if (player.score >= SHOP.ammoCost) {
      player.score -= SHOP.ammoCost;
      player.addAmmo(SHOP.ammoAmount);
      updateHUD(); ui.shopMoney.textContent = player.score;
      audio.playExplosion();
    }
  });

  ui.btnNext.addEventListener('click', closeShop);
  ui.btnRestart.addEventListener('click', () => location.reload());

  function shootRaycast() {
    const data = player.shoot();
    if (!data) return;

    audio.playShoot();
    
    let nearestEnemy = null;
    let nearestDist = 15;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > nearestDist * RENDER.mapScale) continue;
      
      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - player.angle;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

      if (Math.abs(angleDiff) < 0.2) {
        nearestEnemy = enemy;
        nearestDist = dist / RENDER.mapScale;
      }
    }

    if (nearestEnemy) {
      if (nearestEnemy.takeDamage(PLAYER.bulletDamage)) {
        player.score += 10;
        audio.playExplosion();
        console.log('💀 Enemy killed!');
      } else {
        audio.playHurt();
        console.log(' Hit enemy!');
      }
    }
  }

  async function endGame() {
    gameState = 'gameover';
    ui.finalWave.textContent = waveManager.wave;
    ui.overModal.showModal();
    if (player.score > highScore) {
      highScore = player.score;
      try {
        if (window.vkBridge) await window.vkBridge.send('VKWebAppStorageSet', { key: 'doom_highscore', value: highScore.toString() });
      } catch {}
    }
  }

  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'playing') {
      player.update(dt, input);

      if (input.isShooting()) {
        shootRaycast();
        input.resetShoot();
      }

      const activeEnemies = [];
      for (const enemy of enemies) {
        if (enemy.active) {
          if (enemy.update(dt, player)) {
             damageFlash = 1;
          }
          activeEnemies.push(enemy);
        }
      }

      if (damageFlash > 0) damageFlash -= dt * 3;

      waveManager.update(dt);
      updateHUD();

      if (waveManager.checkWaveComplete(activeEnemies.length)) {
        console.log(`✅ Wave ${waveManager.wave} complete!`);
        openShop();
      }

      if (player.health <= 0) endGame();
    }

    const ctx = raycaster.ctx;
    
    raycaster.render(timestamp, player);

    // Рисуем врагов БЕЗ zBuffer
    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.draw(ctx, player); // Убрали zBuffer
      }
    }

    if (damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.6, damageFlash)})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    requestAnimationFrame(gameLoop);
  }

  waveManager.startWave();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🎮 DOOM-LITE Started | Enemies count: ${enemies.length}`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
