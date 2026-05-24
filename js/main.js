import { GAME, PLAYER } from './config.js';
import { InputManager } from './core/Input.js';
import { TextureGenerator } from './render/Textures.js';
import { Player } from './core/Player.js';
import { World } from './core/World.js';

async function bootstrap() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false }); // оптимизация

  // 1. Настройка размера и DPI
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

  // 2. Текстуры
  const textures = {
    player: TextureGenerator.createPlayer(),
    wall: TextureGenerator.createWall('#3a3a5c', 'bricks'),
  };

  // 3. Игровые объекты
  const input = new InputManager(canvas);
  const world = new World(window.innerWidth, window.innerHeight);
  const player = new Player(window.innerWidth / 2, window.innerHeight / 2);

  // 4. UI элементы
  const hudHealth = document.getElementById('hud-health');
  const hudAmmo = document.getElementById('hud-ammo');
  const hudScore = document.getElementById('hud-score');
  const updateHUD = () => {
    hudHealth.textContent = `❤️ ${player.health}`;
    hudAmmo.textContent = `🔫 ${player.ammo}`;
    hudScore.textContent = `💀 ${player.score}`;
  };

  // 5. Игровой цикл
  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // защита от скачков dt
    lastTime = timestamp;

    // --- UPDATE ---
    player.update(dt, input, world);
    updateHUD();

    // --- RENDER ---
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height); // очистка

    // Камера следует за игроком (простая привязка к центру)
    ctx.save();
    // Смещение камеры, чтобы игрок был в центре
    const camX = -player.x + window.innerWidth / 2;
    const camY = -player.y + window.innerHeight / 2;
    ctx.translate(camX, camY);

    world.draw(ctx, textures.wall);

    // Игрок (с поворотом)
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.drawImage(textures.player, -16, -16, 32, 32);
    ctx.restore();

    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // 6. Запуск
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🎮 ${GAME.title} v${GAME.version} | Шаг 1: Движение + Коллизии`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();