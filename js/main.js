import { GAME, PLAYER, ENEMY } from './config.js';
import { InputManager } from './core/Input.js';
import { TextureGenerator } from './render/Textures.js';
import { Player } from './core/Player.js';
import { World } from './core/World.js';
import { Bullet } from './core/Bullet.js';
import { Enemy } from './core/Enemy.js';
import { ParticleSystem } from './core/ParticleSystem.js';
import { SoundManager } from './audio/SoundManager.js';

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
  const enemies = [];
  const particles = new ParticleSystem();
  const audio = new SoundManager();
  
  let isGameOver = false;
  let spawnTimer = 0;
  let isFiring = false; // Для визуальной вспышки

  const hudHealth = document.getElementById('hud-health');
  const hudAmmo = document.getElementById('hud-ammo');
  const hudScore = document.getElementById('hud-score');
  const modalMenu = document.getElementById('modal-menu');
  const modalTitle = document.getElementById('modal-title');
  const modalScore = document.getElementById('modal-score');

  const updateHUD = () => {
    hudHealth.textContent = `❤️ ${player.health}`;
    hudAmmo.textContent = `🔫 ${player.ammo}`;
    hudScore.textContent = `💀 ${player.score}`;
    
    if (player.health < 30) {
      hudHealth.style.color = '#ef4444';
      hudHealth.style.animation = 'pulse 0.5s infinite';
    } else {
      hudHealth.style.color = '';
      hudHealth.style.animation = '';
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(1.1); } }
    .screen-shake { animation: shake 0.1s; }
    @keyframes shake { 0% { transform: translate(1px, 1px); } 25% { transform: translate(-1px, -1px); } 50% { transform: translate(1px, -1px); } 75% { transform: translate(-1px, 1px); } 100% { transform: translate(1px, 1px); } }
  `;
  document.head.appendChild(style);

  function spawnEnemy() {
    let ex, ey, dist;
    do {
      ex = 50 + Math.random() * (window.innerWidth - 100);
      ey = 50 + Math.random() * (window.innerHeight - 100);
      const dx = ex - player.x;
      const dy = ey - player.y;
      dist = Math.sqrt(dx*dx + dy*dy);
    } while (dist < 200);

    enemies.push(new Enemy(ex, ey));
  }

  function checkCollisions() {
    // 1. Пули vs Враги
    for (let b = bullets.length - 1; b >= 0; b--) {
      const bullet = bullets[b];
      if (!bullet.active) continue;

      for (let e = enemies.length - 1; e >= 0; e--) {
        const enemy = enemies[e];
        if (!enemy.active) continue;

        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bullet.radius + enemy.radius) {
          bullet.active = false;
          audio.playExplosion(); // 🔊 Звук взрыва
          
          if (enemy.takeDamage(PLAYER.bulletDamage)) {
            player.score++;
            particles.emit(enemy.x, enemy.y, 15, '#ef4444', 100, 4);
            enemies.splice(e, 1);
          }
          break;
        }
      }
    }

    // 2. Враги vs Игрок
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < player.radius + enemy.radius) {
        player.takeDamage(ENEMY.damage);
        audio.playHurt(); // 🔊 Звук урона
        canvas.classList.add('screen-shake');
        setTimeout(() => canvas.classList.remove('screen-shake'), 100);
        
        if (player.health <= 0 && !isGameOver) {
          isGameOver = true;
          modalTitle.textContent = 'GAME OVER';
          modalScore.textContent = `Счёт: ${player.score}`;
          modalMenu.showModal();
        }
      }
    }
  }

  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (!isGameOver) {
      // --- UPDATE ---
      player.update(dt, input, world);

      if (input.isShooting()) {
        const bulletData = player.shoot();
        if (bulletData) {
          bullets.push(new Bullet(bulletData.x, bulletData.y, bulletData.angle));
          particles.emit(bulletData.x, bulletData.y, 5, '#fbbf24', 80, 3, Math.PI / 4);
          audio.playShoot(); // 🔊 Звук выстрела
          isFiring = true;
          setTimeout(() => isFiring = false, 60); // Вспышка на 60мс
          input.resetShoot();
        }
      }

      bullets.forEach(b => b.update(dt, world));
      enemies.forEach(e => e.update(dt, player));
      particles.update(dt);

      checkCollisions();
      updateHUD();

      spawnTimer += dt;
      if (spawnTimer > (ENEMY.spawnInterval / 1000)) {
        spawnEnemy();
        spawnTimer = 0;
      }
    }

    // --- RENDER ---
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    const camX = -player.x + window.innerWidth / 2;
    const camY = -player.y + window.innerHeight / 2;
    ctx.translate(camX, camY);

    world.draw(ctx, textures.wall);

    for (const b of bullets) b.draw(ctx, textures.bullet);
    for (const e of enemies) e.draw(ctx, textures.enemy);

    // Игрок + Вспышка
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(textures.player, -16, -16, 32, 32);
    
    //  Вспышка дула
    if (isFiring) {
      ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(20, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(22, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    particles.draw(ctx);
    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // Активация звука по первому клику (требование браузеров)
  document.addEventListener('pointerdown', () => audio.init(), { once: true });
  document.getElementById('btn-restart').addEventListener('click', () => location.reload());

  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🔊 Шаг 4: Звуковой синтезатор и вспышки активны!`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
