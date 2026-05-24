console.log('🎮 main.js loaded!');
console.log('📦 Loading config...');

import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';

console.log('✅ Config loaded:', { GAME, RENDER });

async function bootstrap() {
  console.log('✅ Bootstrap started');
  
  const canvas = document.getElementById('game');
  const ui = document.getElementById('ui');
  const loader = document.getElementById('loader');
  
  if (loader) loader.classList.add('hidden');
  if (ui) ui.classList.remove('hidden');
  
  // Тест
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('Config loaded! MAP size: ' + MAP.length + 'x' + MAP[0].length, 10, 30);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
