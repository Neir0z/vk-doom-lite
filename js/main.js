import { GAME, PLAYER } from './config.js';
import { InputManager } from './core/Input.js';
import { TextureGenerator } from './render/Textures.js';
import { Player } from './core/Player.js';
import { World } from './core/World.js';
import { Bullet } from './core/Bullet.js';
import { ParticleSystem } from './core/ParticleSystem.js';

async function bootstrap() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });

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
  const world = new World(window.innerWidth, window.innerHeight);
  const player = new Player(window.innerWidth / 2, window.innerHeight / 2);
  const bullets = [];
  const particles = new ParticleSystem();

  const hudHealth = document.getElementById('hud-health');
  const hudAmmo = document.getElementById('hud-ammo');
  const hudScore = document.getElementById('hud-score');
  const updateHUD = () => {
    hudHealth.textContent = `❤️ ${player.health}`;
    hudAmmo.textContent = `🔫 ${player.ammo}`;
    hudScore.textContent = `💀 ${player.score}`;
    
    // Визуальная индикация низкого здоровья
    if (player.health < 30) {
      hudHealth.style.color = '#ef4444';
      hudHealth.style.animation = 'pulse 0.5s infinite';
    } else {
      hudHealth.style.color = '';
      hudHealth.style.animation = '';
    }
  };

  // CSS-анимация для пульсации
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.1); }
    }
  `;
  document.head.appendChild(style);

  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    // --- UPDATE ---
    player.update(dt, input, world);

    // Стрельба
    if (input.isShooting()) {
      const bulletData = player.shoot();
      if (bulletData) {
        bullets.push(new Bullet(bulletData.x, bulletData.y, bulletData.angle));
        // Эффект выстрела
        particles.emit(
          bulletData.x, bulletData.y,
          5, '#fbbf24', 80, 3, Math.PI / 4
        );
        // Отдача камеры (просто тряска)
        canvas.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)`;
        setTimeout(() => canvas.style.transform = '', 50);
        input.resetShoot();
      }
    }

    // Обновление пуль
    bullets.forEach(b => b.update(dt, world));
    bullets.length = bullets.filter(b => b.active).length;

    // Частицы
    particles.update(dt);
    updateHUD();

    // --- RENDER ---
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const camX = -player.x + window.innerWidth / 2;
    const camY = -player.y + window.innerHeight / 2;
    ctx.translate(camX, camY);

    world.draw(ctx, textures.wall);

    // Пули
    for (const b of bullets) b.draw(ctx, textures.bullet);

    // Игрок
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(textures.player, -16, -16, 32, 32);
    ctx.restore();

    // Частицы
    particles.draw(ctx);

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🔥 Шаг 2: Стрельба активирована! Пробел/тап для огня.`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
