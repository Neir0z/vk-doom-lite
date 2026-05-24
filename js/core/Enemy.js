import { ENEMY } from '../config.js';

export class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.speed = ENEMY.speed;
    this.health = ENEMY.health;
    this.maxHealth = ENEMY.health;
    this.active = true;
  }

  /** Преследование игрока */
  update(dt, player) {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Если далеко — идём к игроку
    if (dist > 0) {
      const nx = dx / dist; // Нормализованный вектор X
      const ny = dy / dist; // Нормализованный вектор Y
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
    }
  }

  /** Получение урона */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true; // Умер
    }
    return false; // Жив
  }

  /** Отрисовка */
  draw(ctx, tex) {
    if (!this.active) return;
    ctx.drawImage(tex, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    
    // Полоска здоровья
    const hpPct = this.health / this.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(this.x - 12, this.y - 24, 24, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(this.x - 12, this.y - 24, 24 * hpPct, 4);
  }
}
