import { GAME, PLAYER } from './config.js';
import { InputManager } from './core/Input.js';
import { TextureGenerator } from './render/Textures.js';

async function bootstrap() {
  // 1. Инициализация канваса
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  // 2. Генерация текстур
  const textures = {
    player: TextureGenerator.createPlayer(),
    enemy: TextureGenerator.createEnemy(),
    bullet: TextureGenerator.createBullet(),
    wall: TextureGenerator.createWall(),
  };

  // 3. Ввод
  const input = new InputManager(canvas);

  // 4. Игровой цикл (пока — пустой)
  let lastTime = 0;
  function gameLoop(timestamp) {
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Очистка
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Здесь будет: обновление логики → отрисовка

    requestAnimationFrame(gameLoop);
  }

  // 5. Запуск после минимальной загрузки
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🎮 ${GAME.title} v${GAME.version} запущен`);
  }, 800);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}