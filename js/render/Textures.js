/**
 * Генерация простых текстур через Canvas.
 * Позже заменишь на свои спрайты, но сейчас — всё в коде.
 */
export class TextureGenerator {
  static createWall(color = '#4a4a6a', pattern = 'bricks') {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    
    // Базовый цвет
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    
    // Паттерн
    if (pattern === 'bricks') {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      for (let y = 0; y < 64; y += 16) {
        const offset = (y/16) % 2 === 0 ? 0 : 8;
        for (let x = offset; x < 64; x += 16) {
          ctx.strokeRect(x+1, y+1, 14, 14);
        }
      }
    } else if (pattern === 'metal') {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
      }
    }
    
    return c;
  }

  static createPlayer() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    
    // Тело
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(16, 16, 12, 0, Math.PI*2);
    ctx.fill();
    
    // "Дуло" — направление
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(16, 14, 12, 4);
    
    return c;
  }

  static createEnemy() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d');
    
    // Тело врага
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(16, 16, 11, 0, Math.PI*2);
    ctx.fill();
    
    // Злые глаза
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(12, 13, 3, 0, Math.PI*2);
    ctx.arc(20, 13, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(13, 13, 1.5, 0, Math.PI*2);
    ctx.arc(21, 13, 1.5, 0, Math.PI*2);
    ctx.fill();
    
    return c;
  }

  static createBullet() {
    const c = document.createElement('canvas');
    c.width = 12; c.height = 12;
    const ctx = c.getContext('2d');
    
    const grad = ctx.createRadialGradient(6,6,0, 6,6,6);
    grad.addColorStop(0, '#fbbf24');
    grad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(6, 6, 5, 0, Math.PI*2);
    ctx.fill();
    
    return c;
  }

  static createParticle(color = '#fbbf24') {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 8;
    const ctx = c.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI*2);
    ctx.fill();
    
    return c;
  }
}