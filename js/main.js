console.log('🎮 main.js loaded!');
console.log('📦 Loading config...');

import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';
console.log('✅ Config loaded');

console.log('📦 Loading InputManager...');
import { InputManager } from './core/Input.js';
console.log('✅ InputManager loaded');

async function bootstrap() {
  console.log('✅ Bootstrap started');
  
  const canvas = document.getElementById('game');
  const ui = document.getElementById('ui');
  const loader = document.getElementById('loader');
  
  if (loader) loader.classList.add('hidden');
  if (ui) ui.classList.remove('hidden');
  
  // Тест InputManager
  const input = new InputManager();
  console.log('Input created:', input);
  
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Input OK! Move: WASD', 10, 30);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
