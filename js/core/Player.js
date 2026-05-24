import { PLAYER, MAP, RENDER } from '../config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0; // Направление взгляда в радианах
    this.speed = PLAYER.speed;
    this.rotSpeed = PLAYER.rotSpeed;
    this.health = PLAYER.health;
    this.ammo = PLAYER.maxAmmo;
    this.score = 0;
    this.lastShot = 0;
    this.isShooting = false;
  }

  update(dt, input) {
    const { move, rot } = input.getMovement();

    // Поворот камеры
    this.angle += rot * this.rotSpeed * dt;

    // Движение вперед/назад
    if (move !== 0) {
      const dx = Math.cos(this.angle) * move * this.speed * dt;
      const dy = Math.sin(this.angle) * move * this.speed * dt;

      // Проверка коллизий со стенами (по сетке карты)
      if (!this._isWall(this.x + dx, this.y)) this.x += dx;
      if (!this._isWall(this.x, this.y + dy)) this.y += dy;
    }
  }

  _isWall(x, y) {
    const mx = Math.floor(x / RENDER.mapScale);
    const my = Math.floor(y / RENDER.mapScale);
    if (my < 0 || my >= MAP.length || mx < 0 || mx >= MAP[0].length) return true;
    return MAP[my][mx] === 1;
  }

  canShoot() {
    const now = performance.now();
    if (now - this.lastShot < PLAYER.fireRate || this.ammo <= 0) return false;
    this.lastShot = now;
    this.ammo--;
    return true;
  }

  shoot() {
    if (!this.canShoot()) return null;
    this.isShooting = true;
    setTimeout(() => this.isShooting = false, 100);
    return { x: this.x, y: this.y, angle: this.angle };
  }

  takeDamage(amount) { this.health = Math.max(0, this.health - amount); }
  addAmmo(amount) { this.ammo = Math.min(PLAYER.maxAmmo, this.ammo + amount); }
}
