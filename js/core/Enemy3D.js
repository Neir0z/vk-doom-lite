import { ENEMY_TYPES } from '../config.js';

export class Enemy3D {
  constructor(x, y, type, texture) {
    this.x = x;
    this.y = y;
    this.texture = texture;
    this.active = true;
    
    const stats = ENEMY_TYPES[type] || ENEMY_TYPES.grunt;
    this.type = type;
    this.health = stats.health;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.color = stats.color;
    this.score = stats.score;
    this.isBoss = stats.isBoss || false;
    this.lastAttack = 0;
    this.width = this.isBoss ? 180 : 128;
    this.height = this.isBoss ? 180 : 128;
    this.animOffset = Math.random() * 100;
  }

  update(dt, player) {
    if (!this.active) return false;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > (this.isBoss ? 80 : 60)) {
      const nx = dx / dist;
      const ny = dy / dist;
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
    }

    const attackRange = this.isBoss ? 100 : 60;
    if (dist < attackRange) {
      const now = performance.now();
      const attackCooldown = this.isBoss ? 1500 : 1000;
      if (now - this.lastAttack > attackCooldown) {
        this.lastAttack = now;
        return true;
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

  draw(ctx, player) {
    if (!this.active) return;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 1200 || dist < 10) return;

    const spriteAngle = Math.atan2(dy, dx) - player.angle;
    let angle = spriteAngle;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;

    if (Math.abs(angle) > Math.PI / 2.5) return;

    const breathe = Math.sin((performance.now() / 500) + this.animOffset) * 0.05;
    const sizeMult = this.isBoss ? 2.0 : 1.0;
    const screenH = (450 / (dist / 64)) * sizeMult * (1 + breathe);
    const screenW = screenH;
    
    const screenX = (0.5 + angle / (Math.PI / 3)) * 320;
    const screenY = 100 + (this.isBoss ? 20 : 0);

    if (this.texture) {
      ctx.drawImage(this.texture, screenX - screenW/2, screenY - screenH/2, screenW, screenH);
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenW / 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      const eyeSize = this.isBoss ? 12 : 6;
      const eyeOffset = this.isBoss ? 25 : 10;
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset, screenY - 5, eyeSize, 0, Math.PI * 2);
      ctx.arc(screenX + eyeOffset, screenY - 5, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(screenX - eyeOffset, screenY - 5, eyeSize/2, 0, Math.PI * 2);
      ctx.arc(screenX + eyeOffset, screenY - 5, eyeSize/2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.isBoss && this.health < this.maxHealth) {
      const barWidth = screenW * 0.8;
      const barHeight = 8;
      ctx.fillStyle = '#000';
      ctx.fillRect(screenX - barWidth/2, screenY - screenH/2 - 20, barWidth, barHeight);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(screenX - barWidth/2, screenY - screenH/2 - 20, barWidth * (this.health/this.maxHealth), barHeight);
    }
  }
}
