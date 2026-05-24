export class Particle {
  constructor(x, y, vx, vy, life, color, size) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.active = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, color, speed, size, spread = Math.PI * 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * spread;
      const vel = speed * (0.5 + Math.random() * 0.5);
      const vx = Math.cos(angle) * vel;
      const vy = Math.sin(angle) * vel;
      const life = 0.3 + Math.random() * 0.4;
      this.particles.push(new Particle(x, y, vx, vy, life, color, size));
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.update(dt);
      return p.active;
    });
  }

  draw(ctx) {
    for (const p of this.particles) p.draw(ctx);
  }

  clear() {
    this.particles = [];
  }
}
