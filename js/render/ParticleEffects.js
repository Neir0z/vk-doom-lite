export class ParticleEffects {
  constructor() { this.particles = []; }

  emit(x, y, type, count = 10) {
    const configs = {
      blood: { color: ['#dc2626', '#991b1b', '#7f1d1d'], speed: 120, life: 0.6, size: [2,5], gravity: 50 },
      fire:  { color: ['#fbbf24', '#f59e0b', '#ef4444'], speed: 80, life: 0.4, size: [3,6], gravity: -30 },
      smoke: { color: ['#6b7280', '#4b5563', '#374151'], speed: 40, life: 1.2, size: [4,8], gravity: -15 },
      sparks:{ color: ['#fde047', '#ffffff', '#f59e0b'], speed: 200, life: 0.3, size: [1,3], gravity: 150 }
    };
    const cfg = configs[type] || configs.blood;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = cfg.speed * (0.5 + Math.random());
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: cfg.life * (0.8 + Math.random() * 0.4),
        maxLife: cfg.life,
        color: cfg.color[Math.floor(Math.random() * cfg.color.length)],
        size: cfg.size[0] + Math.random() * (cfg.size[1] - cfg.size[0]),
        gravity: cfg.gravity,
        type
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      
      if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (1-alpha)), 0, Math.PI*2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() { this.particles = []; }
}
