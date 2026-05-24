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
    this.state = 'idle'; // idle, chase, attack, dead
    this.animFrame = 0;
  }

  update(dt, player) {
    if (!this.active || this.state === 'dead') return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Преследование
    if (dist > 40 && dist < 400) {
      this.state = 'chase';
      const nx = dx / dist;
      const ny = dy / dist;
      
      const newX = this.x + nx * this.speed * dt;
      const newY = this.y + ny * this.speed * dt;
      
      // Простая коллизия
      if (!this._checkWall(newX, this.y)) this.x = newX;
      if (!this._checkWall(this.x, newY)) this.y = newY;
      
      this.animFrame += dt * 5;
    }

    // Атака
    if (dist < 50) {
      this.state = 'attack';
      const now = performance.now();
      if (now - this.lastAttack > 1000) {
        player.takeDamage(this.damage);
        this.lastAttack = now;
      }
    } else {
      this.state = 'idle';
    }
  }

  _checkWall(x, y) {
    const mx = Math.floor(x / 64);
    const my = Math.floor(y / 64);
    // Простая проверка границ массива MAP
    if (typeof MAP !== 'undefined' && my >= 0 && my < MAP.length && mx >= 0 && mx < MAP[0].length) {
      return MAP[my][mx] === 1;
    }
    return false;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.active = false;
      this.state = 'dead';
      return true;
    }
    return false;
  }

  draw(ctx, player, zBuffer) {
    if (this.state === 'dead') {
      // Мертвый враг — рисуем лежащим (меньше высота)
      const origHeight = this.height;
      this.height = 32;
      super.draw(ctx, player, zBuffer);
      this.height = origHeight;
    } else {
      super.draw(ctx, player, zBuffer);
      
      // Полоска здоровья над головой
      if (this.health < this.maxHealth) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const screenH = (RENDER.numRays / dist) * 0.8;
        const screenX = (0.5 + (Math.atan2(dy, dx) - player.angle) / RENDER.fov) * RENDER.numRays;
        const screenY = (RENDER.numRays * 0.6) / 2 - screenH / 2 - 10;

        ctx.fillStyle = '#000';
        ctx.fillRect(screenX - 15, screenY, 30, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(screenX - 15, screenY, 30 * (this.health / this.maxHealth), 4);
      }
    }
  }
}
