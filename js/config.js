export const IS_DEV = new URLSearchParams(window.location.search).has('dev');

export const GAME = {
  title: 'DOOM-LITE',
  version: '0.1.0',
  targetFPS: 60,
};

export const PLAYER = {
  speed: 180,        // пикселей в секунду
  health: 100,
  maxAmmo: 30,
  fireRate: 150,     // мс между выстрелами
  bulletSpeed: 400,
  bulletDamage: 25,
};

export const ENEMY = {
  spawnInterval: 2000, // мс между появлениями
  speed: 60,
  health: 50,
  damage: 10,
  chaseRange: 300,
};

export const CONTROLS = {
  keyboard: {
    move: { up: 'w', down: 's', left: 'a', right: 'd' },
    shoot: ' ',
  },
  touch: {
    joystickDeadZone: 15, // пикселей
    shootButtonSize: 72,
  },
};

export const VK = {
  appId: null, // Заполнишь после создания приложения
  storageKey: 'doom_lite_save',
};