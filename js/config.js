export const IS_DEV = new URLSearchParams(window.location.search).has('dev');

export const GAME = { title: 'DOOM-LITE', version: '1.0.0', targetFPS: 60 };

// 🎮 Игрок
export const PLAYER = {
  speed: 200,
  rotSpeed: 3.0,
  health: 100,
  maxHealth: 100,
  maxAmmo: 50,
};

// 🔫 Оружие
export const WEAPONS = {
  pistol: {
    name: 'Пистолет',
    damage: 35,
    fireRate: 250,
    ammoCost: 1,
    range: 15,
    spread: 0.05,
    color: '#fbbf24',
    sound: 'shoot'
  },
  shotgun: {
    name: 'Дробовик',
    damage: 25,
    fireRate: 800,
    ammoCost: 2,
    range: 10,
    spread: 0.2,
    pellets: 5,
    color: '#ef4444',
    sound: 'shotgun'
  },
  machinegun: {
    name: 'Автомат',
    damage: 20,
    fireRate: 100,
    ammoCost: 1,
    range: 20,
    spread: 0.1,
    color: '#3b82f6',
    sound: 'machinegun'
  }
};

// 👾 Типы врагов
export const ENEMY_TYPES = {
  grunt: { health: 60, speed: 70, damage: 10, color: '#ef4444', score: 10 },
  fast: { health: 40, speed: 130, damage: 8, color: '#f59e0b', score: 15 },
  tank: { health: 150, speed: 40, damage: 20, color: '#7c3aed', score: 30 },
  boss: { health: 500, speed: 50, damage: 30, color: '#dc2626', score: 100, isBoss: true }
};

export const ENEMY = { 
  spawnInterval: 2000, 
  defaultType: 'grunt'
};

// 🛒 Магазин
export const SHOP = { 
  healthCost: 50, 
  healthAmount: 50, 
  ammoCost: 30,
  ammoAmount: 20,
  shotgunCost: 100,
  machinegunCost: 150
};

// 🌊 Волны
export const WAVES = { 
  startEnemies: 3,
  increasePerWave: 2,
  bossEvery: 5,
  rewardPerKill: 10
};

// 🗺️ Карта и рендер
export const RENDER = {
  fov: Math.PI / 3,
  numRays: 320,
  mapScale: 64,
  maxDepth: 20,
  minimapSize: 120
};

export const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,1,0,0,1,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,0,0,0,0,1,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export const VK = { storageKey: 'doom_highscore' };
