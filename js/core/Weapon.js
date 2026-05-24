import { WEAPONS } from '../config.js';

export class Weapon {
  constructor(type = 'pistol', playerRef) {
    this.type = type;
    this.stats = WEAPONS[type];
    this.lastShot = 0;
    this.recoil = 0;
    this.animFrame = 0;
    this.player = playerRef; // Ссылка на игрока для списания патронов
  }

  canShoot() {
    const now = performance.now();
    return now - this.lastShot >= this.stats.fireRate && 
           this.player && this.player.ammo >= this.stats.ammoCost;
  }

  shoot() {
    if (!this.canShoot()) return null;
    this.lastShot = performance.now();
    this.recoil = 15;
    
    // ✅ Списываем патроны у игрока
    if (this.player) {
      this.player.ammo -= this.stats.ammoCost;
    }
    
    return this.stats;
  }

  update(dt) {
    if (this.recoil > 0) {
      this.recoil -= dt * 30;
      if (this.recoil < 0) this.recoil = 0;
    }
    this.animFrame += dt;
  }

  switchTo(type) {
    this.type = type;
    this.stats = WEAPONS[type];
    this.recoil = 0;
  }
}
