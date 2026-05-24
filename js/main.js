console.log('🎮 Loading all modules...');

import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';
console.log('✅ Config');

import { InputManager } from './core/Input.js';
console.log('✅ Input');

import { Player } from './core/Player.js';
console.log('✅ Player');

import { Weapon } from './core/Weapon.js';
console.log('✅ Weapon');

import { Raycaster } from './render/Raycaster.js';
console.log('✅ Raycaster');

import { Minimap } from './render/Minimap.js';
console.log('✅ Minimap');

import { AssetGenerator } from './render/AssetGenerator.js';
console.log('✅ Assets');

import { ParticleEffects } from './render/ParticleEffects.js';
console.log('✅ Particles');

import { SoundManager } from './audio/SoundManager.js';
console.log('✅ Sound');

import { WaveManager } from './core/WaveManager.js';
console.log('✅ Waves');

import { Enemy3D } from './core/Enemy3D.js';
console.log('✅ Enemies');

// Если дошли сюда - все импорты работают!
console.log('🎉 ALL MODULES LOADED!');

async function bootstrap() {
  const canvas = document.getElementById('game');
  const loader = document.getElementById('loader');
  const ui = document.getElementById('ui');
  
  if (loader) loader.classList.add('hidden');
  if (ui) ui.classList.remove('hidden');
  
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText('ALL SYSTEMS READY!', 10, 30);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
