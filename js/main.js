import { GAME, PLAYER, ENEMY, SHOP, WAVES } from './config.js';
import { InputManager } from './core/Input.js';
import { TextureGenerator } from './render/Textures.js';
import { Player } from './core/Player.js';
import { World } from './core/World.js';
import { Bullet } from './core/Bullet.js';
import { Enemy } from './core/Enemy.js';
import { ParticleSystem } from './core/ParticleSystem.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';

async function bootstrap() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

  // Настройка Canvas
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);
  };
  window.addEventListener('resize', resize);
  resize();

  const textures = {
    player: TextureGenerator.createPlayer(),
    enemy: TextureGenerator.createEnemy(),
    bullet: TextureGenerator.createBullet(),
    wall: TextureGenerator.createWall('#3a3a5c', 'bricks'),
  };

  const input = new InputManager(canvas);
  const audio = new SoundManager();
  document.addEventListener('pointerdown', () => audio.init(), { once: true });

  // Игровые объекты
  const world = new World(window.innerWidth, window.innerHeight);
  const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
  const bullets = [];
  const enemies = [];
  const particles = new ParticleSystem();

  // Менеджер волн
  const waveManager = new WaveManager(() => {
    // Спавн врага
    let ex, ey;
    do {
      ex = 50 + Math.random() * (window.innerWidth - 100);
      ey = 50 + Math.random() * (window.innerHeight - 100);
    } while (Math.hypot(ex - player.x, ey - player.y) < 200);
    enemies.push(new Enemy(ex, ey));
  });

  // Состояние игры
  let gameState = 'playing'; // playing, shop, gameover
  let isFiring = false;

  // UI Элементы
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
    highscore: document.getElementById('highscore-display'),
    btnRestart: document.getElementById('btn-restart')
  };

  // --- VK Bridge: Загрузка рекорда ---
  let highScore = 0;
  try {
    if (window.vkBridge) {
      const data = await window.vkBridge.send('VKWebAppStorageGet', { keys: ['doom_highscore'] });
      if (data.keys && data.keys[0]) highScore = parseInt(data.keys[0].value) || 0;
    }
  } catch (e) { console.warn('VK Load Error', e); }
  ui.highscore.textContent = highScore;

   function updateHUD() {
    if (ui.health) ui.health.textContent = player.health;
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

  // --- Обработчики Магазина ---
  ui.btnHealth.addEventListener('click', () => {
    if (player.score >= SHOP.healthCost) {
      player.score -= SHOP.healthCost;
      player.health = Math.min(100, player.health + SHOP.healthAmount);
      updateHUD();
      ui.shopMoney.textContent = player.score;
      audio.playExplosion(); // Звук покупки
    }
  });

  ui.btnAmmo.addEventListener('click', () => {
    if (player.score >= SHOP.ammoCost) {
      player.score -= SHOP.ammoCost;
      player.addAmmo(SHOP.ammoAmount);
      updateHUD();
      ui.shopMoney.textContent = player.score;
      audio.playExplosion();
    }
  });

  ui.btnNext.addEventListener('click', closeShop);
  
  // Обновляем доступность кнопок
  setInterval(() => {
    if (gameState === 'shop') {
      ui.btnHealth.disabled = player.score < SHOP.healthCost;
      ui.btnAmmo.disabled = player.score < SHOP.ammoCost;
    }
  }, 200);

  ui.btnRestart.addEventListener('click', () => location.reload());

  // --- Логика столкновений ---
  function checkCollisions() {
    // Пули vs Враги
    for (let b = bullets.length - 1; b >= 0; b--) {
      const bullet = bullets[b];
      if (!bullet.active) continue;

      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        if (!enemy.active) continue;

        if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < bullet.radius + enemy.radius) {
          bullet.active = false;
          audio.playExplosion();
          
          if (enemy.takeDamage(PLAYER.bulletDamage)) {
            player.score += WAVES.rewardPerKill;
            particles.emit(enemy.x, enemy.y, 15, '#ef4444', 100, 4);
            enemies.splice(e, 1);
          }
          break;
        }
      }
    }

    // Враги vs Игрок
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius) {
        player.takeDamage(ENEMY.damage);
        audio.playHurt();
        canvas.classList.add('screen-shake');
        setTimeout(() => canvas.classList.remove('screen-shake'), 100);
        
        if (player.health <= 0) endGame();
      }
    }
  }

  async function endGame() {
    gameState = 'gameover';
    ui.finalWave.textContent = waveManager.wave;
    ui.overModal.showModal();

    // Сохранение рекорда в VK
    if (player.score > highScore) {
      highScore = player.score;
      ui.highscore.textContent = highScore;
      try {
        if (window.vkBridge) {
          await window.vkBridge.send('VKWebAppStorageSet', { key: 'doom_highscore', value: highScore.toString() });
        }
      } catch (e) { console.warn('VK Save Error', e); }
    }
  }

  // --- ГЛАВНЫЙ ЦИКЛ ---
  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'playing') {
      player.update(dt, input, world);
      
      if (input.isShooting()) {
        const bulletData = player.shoot();
        if (bulletData) {
          bullets.push(new Bullet(bulletData.x, bulletData.y, bulletData.angle));
          particles.emit(bulletData.x, bulletData.y, 5, '#fbbf24', 80, 3, Math.PI / 4);
          audio.playShoot();
          isFiring = true;
          setTimeout(() => isFiring = false, 60);
          input.resetShoot();
        }
      }

      bullets.forEach(b => b.update(dt, world));
      enemies.forEach(e => e.update(dt, player));
      particles.update(dt);
      
      waveManager.update(dt);
      checkCollisions();

      // Проверка конца волны
      if (waveManager.checkWaveComplete(enemies.length)) {
        openShop();
      }

      updateHUD();
    }

    // --- РЕНДЕР ---
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-player.x + window.innerWidth / 2, -player.y + window.innerHeight / 2);

    world.draw(ctx, textures.wall);
    bullets.forEach(b => b.draw(ctx, textures.bullet));
    enemies.forEach(e => e.draw(ctx, textures.enemy));

    // Игрок + Вспышка
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(textures.player, -16, -16, 32, 32);
    if (isFiring) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
      ctx.beginPath(); ctx.arc(20, 0, 12, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(24, 0, 6, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();

    particles.draw(ctx);
    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // Старт игры
  waveManager.startWave();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(` DOOM-LITE v${GAME.version} | Step 5: Waves & Shop`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
