import { PLAYER } from '../config.js';

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.speed = PLAYER.bulletSpeed;
    this.damage = PLAYER.bulletDamage;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.life = 2; // секунды жизни пули
    this.active = true;
  }

  update(dt, world) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;

    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Столкновение со стенами
    if (world.checkCollision(this.x, this.y, this.radius)) {
      this.active = false;
    }

    // Границы мира
    if (this.x < 0 || this.x > world.width || this.y < 0 || this.y > world.height) {
      this.active = false;
    }
  }

  draw(ctx, bulletTex) {
    ctx.drawImage(bulletTex, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    
    // Свечение пули
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}