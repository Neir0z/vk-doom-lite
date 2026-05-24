import { PLAYER } from '../config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = PLAYER.speed;
    this.health = PLAYER.health;
    this.ammo = PLAYER.maxAmmo;
    this.score = 0;
    this.lastShot = 0;
    this.angle = 0; // направление взгляда в радианах
  }

  /** Обновление позиции с учётом dt и коллизий */
  update(dt, input, world) {
    const move = input.getMovement();
    let dx = move.x * this.speed * dt;
    let dy = move.y * this.speed * dt;

    // Обновляем угол поворота при движении
    if (Math.abs(move.x) > 0.1 || Math.abs(move.y) > 0.1) {
      this.angle = Math.atan2(move.y, move.x);
    }

    // Проверка коллизий по осям (чтобы не застревать в углах)
    if (!world.checkCollision(this.x + dx, this.y, this.radius)) {
      this.x += dx;
    }
    if (!world.checkCollision(this.x, this.y + dy, this.radius)) {
      this.y += dy;
    }

    // Жёсткие границы мира
    this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y));
  }

  /** Проверяет перезарядку и наличие патронов */
  canShoot() {
    const now = performance.now();
    if (now - this.lastShot < PLAYER.fireRate || this.ammo <= 0) return false;
    this.lastShot = now;
    this.ammo--;
    return true;
  }

  /** Возвращает данные для спавна пули или null */
  shoot() {
    if (!this.canShoot()) return null;
    return {
      x: this.x + Math.cos(this.angle) * 20,
      y: this.y + Math.sin(this.angle) * 20,
      angle: this.angle
    };
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  addAmmo(amount) {
    this.ammo = Math.min(PLAYER.maxAmmo, this.ammo + amount);
  }
}
