import { ENEMY } from '../config.js';
import { Sprite } from '../render/Sprite.js';

export class Enemy3D extends Sprite {
  constructor(x, y, texture) {
    super(x, y, texture);
    this.health = ENEMY.health;
    this.maxHealth = ENEMY.health;
    this.speed = ENEMY.speed;
    this.damage = ENEMY.damage;
    this.lastAttack = 0;
    this.width = 128;  // Увеличили в 2 раза
    this.height = 128;
  }

  update(dt, player) {
    if (!this.active) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Преследование если далеко
    if (dist > 60) {
      const nx = dx / dist;
      const ny = dy / dist;
      
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
    }

    // Атака если близко
    if (dist < 60) {
      const now = performance.now();
      if (now - this.lastAttack > 1000) {
        player.takeDamage(this.damage);
        this.lastAttack = now;
        return true; // Нанес урон
      }
    }
    return false;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }
}
