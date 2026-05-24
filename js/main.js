console.log('🎮 Starting...');

// Импорты
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

console.log('✅ All modules loaded');

// Скрыть лоадер сразу
const loader = document.getElementById('loader');
const ui = document.getElementById('ui');
const canvas = document.getElementById('game');

if (loader) loader.classList.add('hidden');
if (ui) ui.classList.remove('hidden');

console.log('✓ UI shown');

// Простой тест
if (canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  ctx.font = '20px monospace';
  ctx.fillText('CANVAS WORKS!', 50, 50);
  console.log('✓ Canvas works');
}

// Теперь полная инициализация
try {
  const raycaster = new Raycaster(canvas);
  const input = new InputManager();
  const audio = new SoundManager();
  const wallTex = AssetGenerator.createWallTexture();
  const particles = new ParticleEffects();
  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  const weapon = new Weapon('pistol', player);
  const minimap = new Minimap();
  const enemies = [];
  
  console.log('✓ Game objects created');
  
  // Запуск игры
  let gameState = 'playing';
  let lastTime = 0;
  
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;
    
    // Очистка
    raycaster.render(timestamp, player, wallTex);
    
    // Простое движение
    player.update(dt, input);
    
    // Миникарта
    minimap.draw(canvas.getContext('2d'), player, enemies);
    
    requestAnimationFrame(gameLoop);
  }
  
  requestAnimationFrame(gameLoop);
  console.log('🎮 GAME STARTED!');
  
} catch (error) {
  console.error('❌ Error:', error);
}
