import { WEAPONS } from '../config.js';

export class Weapon {
  constructor(type = 'pistol') {
    this.type = type;
    this.stats = WEAPONS[type];
    this.lastShot = 0;
    this.recoil = 0;
    this.animFrame = 0;
  }

  canShoot() {
    const now = performance.now();
    return now - this.lastShot >= this.stats.fireRate;
  }

  shoot() {
    if (!this.canShoot()) return null;
    this.lastShot = performance.now();
    this.recoil = 15;
    return this.stats;
  }

  update(dt) {
    // Возврат отдачи
    if (this.recoil > 0) {
      this.recoil -= dt * 30;
      if (this.recoil < 0) this.recoil = 0;
    }
    // Анимация покачивания
    this.animFrame += dt;
  }

  switchTo(type) {
    this.type = type;
    this.stats = WEAPONS[type];
    this.recoil = 0;
  }
}
