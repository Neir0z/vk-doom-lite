export const IS_DEV = new URLSearchParams(window.location.search).has('dev');

export const GAME = { title: 'DOOM-LITE', version: '0.2.0', targetFPS: 60 };

export const PLAYER = {
  speed: 220,
  rotSpeed: 3.2,
  health: 100,
  maxAmmo: 30,
  fireRate: 200,
  bulletDamage: 35,
};

export const ENEMY = { spawnInterval: 2000, speed: 80, health: 60, damage: 12 };

export const SHOP = { healthCost: 50, healthAmount: 50, ammoCost: 30, ammoAmount: 15 };
export const WAVES = { startEnemies: 3, increasePerWave: 2, rewardPerKill: 10 };

//  Настройки рейкастинга
export const RENDER = {
  fov: Math.PI / 3,      // 60 градусов
  numRays: 320,          // Ширина рендера (ретро-разрешение)
  mapScale: 64,          // Размер клетки в игровых единицах
  maxDepth: 18,          // Дальность прорисовки стен
};

// 1 = стена, 0 = пол
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
