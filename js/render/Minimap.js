import { MAP, RENDER } from '../config.js';

export class Minimap {
  constructor() {
    this.size = 80;
    this.padding = 8;
    this.cellSize = this.size / (MAP[0].length * RENDER.mapScale) * 64;
  }

  draw(ctx, player, enemies) {
    const x = ctx.canvas.width - this.size - this.padding;
    const y = this.padding;

    // Фон
    ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
    ctx.fillRect(x, y, this.size, this.size);

    // Стены
    ctx.fillStyle = '#4a4a6a';
    for (let r = 0; r < MAP.length; r++) {
      for (let c = 0; c < MAP[r].length; c++) {
        if (MAP[r][c] === 1) {
          ctx.fillRect(
            x + c * this.cellSize,
            y + r * this.cellSize,
            this.cellSize,
            this.cellSize
          );
        }
      }
    }

    // Враги
    ctx.fillStyle = '#ef4444';
    for (const e of enemies) {
      if (e.active) {
        const ex = x + (e.x / RENDER.mapScale) * this.cellSize;
        const ey = y + (e.y / RENDER.mapScale) * this.cellSize;
        ctx.beginPath();
        ctx.arc(ex, ey, e.isBoss ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Игрок
    const px = x + (player.x / RENDER.mapScale) * this.cellSize;
    const py = y + (player.y / RENDER.mapScale) * this.cellSize;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Стрелка направления
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 6, py + Math.sin(player.angle) * 6);
    ctx.stroke();

    // Рамка
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.size, this.size);
  }
}
