import { GAME, PLAYER, ENEMY, SHOP, WAVES, RENDER, MAP } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Raycaster } from './render/Raycaster.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';
import { Enemy3D } from './core/Enemy3D.js';
import { TextureGenerator } from './render/Textures.js';

async function bootstrap() {
  // 1. Инициализация Canvas и движка
  const canvas = document.getElementById('game');
  const raycaster = new Raycaster(canvas);
  const input = new InputManager();
  const audio = new SoundManager();

  // Активация звука по клику
  document.addEventListener('pointerdown', () => audio.init(), { once: true });

  // Генерация текстур
  const enemyTex = TextureGenerator.createEnemy();

  // 2. Создание Игрока (старт в безопасной точке 7,4)
  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  
  const enemies = [];
  let damageFlash = 0; // Для красного экрана при уроне

  // 3. Управление волнами
  const waveManager = new WaveManager(() => {
    let mx, my, attempts = 0;
    // Ищем свободную клетку для спавна
    do {
      mx = Math.floor(Math.random() * MAP[0].length);
      my = Math.floor(Math.random() * MAP.length);
      attempts++;
    } while (
      (MAP[my][mx] !== 0 || Math.hypot(mx * RENDER.mapScale - player.x, my * RENDER.mapScale - player.y) < 200) && 
      attempts < 100
    );

    if (attempts < 100) {
      enemies.push(new Enemy3D(mx * RENDER.mapScale, my * RENDER.mapScale, enemyTex));
    }
  });

  let gameState = 'playing'; // playing, shop, gameover

  // 4. UI Элементы
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

  // 5. Логика игры
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

  // Покупки
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

  // Обновление кнопок магазина
  setInterval(() => {
    if (gameState === 'shop') {
      ui.btnHealth.disabled = player.score < SHOP.healthCost;
      ui.btnAmmo.disabled = player.score < SHOP.ammoCost;
    }
  }, 200);

  // 🔫 Стрельба (Упрощенная и быстрая версия)
  function shootRaycast() {
    const data = player.shoot();
    if (!data) return;

    audio.playShoot();
    
    // Ищем ближайшего врага в центре прицела
    let nearestEnemy = null;
    let nearestDist = 15; // Дальность выстрела (в клетках)

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > nearestDist * RENDER.mapScale) continue; // Слишком далеко
      
      // Проверка угла (в прицеле ли?)
      const angleToEnemy = Math.atan2(dy, dx);
      let angleDiff = angleToEnemy - player.angle;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

      // Если угол маленький, значит смотрим на врага
      if (Math.abs(angleDiff) < 0.2) {
        nearestEnemy = enemy;
        nearestDist = dist / RENDER.mapScale; // Обновляем дистанцию
      }
    }

    // Попадание
    if (nearestEnemy) {
      if (nearestEnemy.takeDamage(PLAYER.bulletDamage)) {
        player.score += 10; // Очки за убийство
        audio.playExplosion();
      } else {
        audio.playHurt(); // Звук попадания по мясу
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

  // 🎮 ГЛАВНЫЙ ЦИКЛ
  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'playing') {
      // 1. Обновление игрока
      player.update(dt, input);

      // 2. Стрельба
      if (input.isShooting()) {
        shootRaycast();
        input.resetShoot();
      }

      // 3. Обновление врагов
      const activeEnemies = [];
      for (const enemy of enemies) {
        if (enemy.active) {
          // Если враг ударил игрока, включаем красный экран
          if (enemy.update(dt, player)) {
             damageFlash = 1; // Максимальная яркость вспышки
          }
          activeEnemies.push(enemy);
        }
      }

      // 4. Затухание красной вспышки
      if (damageFlash > 0) damageFlash -= dt * 3;

      // 5. Управление волнами
      waveManager.update(dt);
      updateHUD();

      if (waveManager.checkWaveComplete(activeEnemies.length)) {
        openShop();
      }

      if (player.health <= 0) endGame();
    }

    // 🎨 РЕНДЕРИНГ
    const ctx = raycaster.ctx;
    
    // Рисуем 3D мир
    raycaster.render(timestamp, player);

    // Рисуем врагов (Спрайты) поверх стен
    // Сортировка от дальнего к ближнему (Painter's Algorithm)
    enemies.sort((a, b) => {
      const distA = Math.hypot(a.x - player.x, a.y - player.y);
      const distB = Math.hypot(b.x - player.x, b.y - player.y);
      return distB - distA;
    });

    for (const enemy of enemies) {
      if (enemy.active) {
        enemy.draw(ctx, player, raycaster.zBuffer);
      }
    }

    // 🩸 Эффект урона (Красная виньетка поверх всего)
    if (damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.6, damageFlash)})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    requestAnimationFrame(gameLoop);
  }

  // Запуск первой волны
  waveManager.startWave();

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(` DOOM-LITE v${GAME.version} | Step 7: FPS Action Ready`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
