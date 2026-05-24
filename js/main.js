import { GAME, PLAYER, ENEMY, SHOP, WAVES, RENDER, MAP } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Raycaster } from './render/Raycaster.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';

async function bootstrap() {
  const canvas = document.getElementById('game');
  const raycaster = new Raycaster(canvas);
  const input = new InputManager();
  const audio = new SoundManager();

  document.addEventListener('pointerdown', () => audio.init(), { once: true });

  // Спавн игрока в безопасной точке (центр карты)
  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  const enemies = [];

  const waveManager = new WaveManager(() => {
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(Math.random() * MAP[0].length);
      my = Math.floor(Math.random() * MAP.length);
      attempts++;
    } while ((MAP[my][mx] !== 0 || Math.hypot(mx * RENDER.mapScale - player.x, my * RENDER.mapScale - player.y) < 150) && attempts < 50);

    if (attempts < 50) {
      enemies.push({ x: mx * RENDER.mapScale, y: my * RENDER.mapScale, active: true });
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
      const data = await window.vkBridge.send('VKWebAppStorageGet', { keys: [VK.storageKey] });
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
    enemies.length = 0; // Очищаем массив врагов для новой волны
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

  setInterval(() => {
    if (gameState === 'shop') {
      ui.btnHealth.disabled = player.score < SHOP.healthCost;
      ui.btnAmmo.disabled = player.score < SHOP.ammoCost;
    }
  }, 200);

  async function endGame() {
    gameState = 'gameover';
    ui.finalWave.textContent = waveManager.wave;
    ui.overModal.showModal();
    if (player.score > highScore) {
      highScore = player.score;
      try {
        if (window.vkBridge) await window.vkBridge.send('VKWebAppStorageSet', { key: VK.storageKey, value: highScore.toString() });
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
        const data = player.shoot();
        if (data) {
          audio.playShoot();
          // Логика попадание будет добавлена в Шаге 7 вместе с 3D-спрайтами врагов
          input.resetShoot();
        }
      }

      waveManager.update(dt);
      updateHUD();

      // Проверка завершения волны (пока без рендера врагов, просто по таймеру/спавну)
      if (waveManager.checkWaveComplete(enemies.filter(e => e.active).length)) {
        openShop();
      }
    }

    // Рендер FPS вида
    raycaster.render(timestamp, player);

    requestAnimationFrame(gameLoop);
  }

  waveManager.startWave();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(` DOOM MODE: Raycasting Active | Step 6`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
