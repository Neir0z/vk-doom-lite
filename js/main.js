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

  // Генерация текстуры врага
  const enemyTex = TextureGenerator.createEnemy();

  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  const enemies = [];
  const particles = []; // Для крови

  const waveManager = new WaveManager(() => {
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(Math.random() * MAP[0].length);
      my = Math.floor(Math.random() * MAP.length);
      attempts++;
    } while ((MAP[my][mx] !== 0 || Math.hypot(mx * 64 - player.x, my * 64 - player.y) < 150) && attempts < 50);

    if (attempts < 50) {
      enemies.push(new Enemy3D(mx * 64, my * 64, enemyTex));
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

  // Стрельба Raycast
  function shootRaycast() {
    const data = player.shoot();
    if (!data) return;

    audio.playShoot();
    
    // Луч из центра экрана
    const rayAngle = player.angle;
    const eyeX = Math.cos(rayAngle);
    const eyeY = Math.sin(rayAngle);

    let dist = 0;
    let hitEnemy = null;
    let hitDist = Infinity;

    // Проверяем попадание во врагов
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const enemyDist = Math.sqrt(dx * dx + dy * dy);
      
      // Угол до врага
      const enemyAngle = Math.atan2(dy, dx);
      let angleDiff = enemyAngle - player.angle;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

      // Если враг в прицеле (узкий угол)
      if (Math.abs(angleDiff) < 0.1 && enemyDist < hitDist) {
        // Проверка: нет ли стены перед врагом
        let wallInWay = false;
        let testDist = 0;
        while (testDist < enemyDist) {
          const testX = player.x + eyeX * testDist;
          const testY = player.y + eyeY * testDist;
          const mx = Math.floor(testX / 64);
          const my = Math.floor(testY / 64);
          if (MAP[my][mx] === 1) {
            wallInWay = true;
            break;
          }
          testDist += 10;
        }
        
        if (!wallInWay) {
          hitEnemy = enemy;
          hitDist = enemyDist;
        }
      }
    }

    if (hitEnemy) {
      if (hitEnemy.takeDamage(PLAYER.bulletDamage)) {
        player.score += WAVES.rewardPerKill;
        audio.playExplosion();
        // Кровь
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: hitEnemy.x, y: hitEnemy.y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
            life: 0.5
          });
        }
      } else {
        audio.playHurt();
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

      // Обновление врагов
      for (const enemy of enemies) {
        enemy.update(dt, player);
      }

      // Частицы
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      waveManager.update(dt);
      updateHUD();

      if (waveManager.checkWaveComplete(enemies.filter(e => e.active).length)) {
        openShop();
      }

      if (player.health <= 0) endGame();
    }

    // Рендер
    raycaster.render(timestamp, player);
    
    // Рендер спрайтов (врагов) поверх стен
    const ctx = raycaster.ctx;
    // Сортируем врагов по дальности (дальние рисуем первыми)
    enemies.sort((a, b) => {
      const distA = Math.hypot(a.x - player.x, a.y - player.y);
      const distB = Math.hypot(b.x - player.x, b.y - player.y);
      return distB - distA;
    });
    
    for (const enemy of enemies) {
      enemy.draw(ctx, player, raycaster.zBuffer || []);
    }

    requestAnimationFrame(gameLoop);
  }

  waveManager.startWave();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(` DOOM: 3D Enemies + Shooting Active!`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
