import { MAP, RENDER } from '../config.js';

export class Minimap {
  constructor() {
    this.size = 50; // ✅ Уменьшил до 50px
    this.padding = 5;
    // Масштаб относительно внутреннего разрешения канваса (320x192)
    this.scale = this.size / (MAP[0].length * RENDER.mapScale) * (320 / 15); 
  }

  draw(ctx, player, enemies) {
    const x = ctx.canvas.width - this.size - this.padding;
    const y = this.padding;

    ctx.fillStyle = 'rgba(10, 10, 20, 0.7)';
    ctx.fillRect(x, y, this.size, this.size);

    // Стены
    ctx.fillStyle = '#3a3a5c';
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < MAP[r].length; c++) {
        if (MAP[r][c] === 1) {
          ctx.fillRect(
            x + c * RENDER.mapScale * this.scale,
            y + r * RENDER.mapScale * this.scale,
            RENDER.mapScale * this.scale,
            RENDER.mapScale * this.scale
          );
        }
      }
    }

    // Враги
    ctx.fillStyle = '#ef4444';
    for (const e of enemies) {
      if (e.active) {
        const ex = x + (e.x * this.scale);
        const ey = y + (e.y * this.scale);
        ctx.beginPath();
        ctx.arc(ex, ey, e.isBoss ? 3 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Игрок
    const px = x + (player.x * this.scale);
    const py = y + (player.y * this.scale);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 5, py + Math.sin(player.angle) * 5);
    ctx.stroke();

    // Рамка
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.size, this.size);
  }
}
