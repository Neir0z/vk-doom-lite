import { MAP, RENDER } from '../config.js';

export class Minimap {
  constructor() {
    this.size = RENDER.minimapSize;
    this.scale = this.size / (MAP[0].length * RENDER.mapScale);
  }

  draw(ctx, player, enemies) {
    const padding = 10;
    const x = ctx.canvas.width - this.size - padding;
    const y = padding;

    // Фон
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, this.size, this.size);

    // Стены
    ctx.fillStyle = '#4a4a6a';
    for (let row = 0; row < MAP.length; row++) {
      for (let col = 0; col < MAP[row].length; col++) {
        if (MAP[row][col] === 1) {
          ctx.fillRect(
            x + col * RENDER.mapScale * this.scale,
            y + row * RENDER.mapScale * this.scale,
            RENDER.mapScale * this.scale,
            RENDER.mapScale * this.scale
          );
        }
      }
    }

    // Враги (красные точки)
    ctx.fillStyle = '#ef4444';
    for (const enemy of enemies) {
      if (enemy.active) {
        const ex = x + (enemy.x * this.scale);
        const ey = y + (enemy.y * this.scale);
        ctx.beginPath();
        ctx.arc(ex, ey, enemy.isBoss ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Игрок (зелёная стрелка по направлению)
    const px = x + (player.x * this.scale);
    const py = y + (player.y * this.scale);
    const arrowLen = 8;
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(player.angle) * arrowLen, py + Math.sin(player.angle) * arrowLen);
    ctx.moveTo(px + Math.cos(player.angle + 2.5) * arrowLen/2, py + Math.sin(player.angle + 2.5) * arrowLen/2);
    ctx.moveTo(px + Math.cos(player.angle - 2.5) * arrowLen/2, py + Math.sin(player.angle - 2.5) * arrowLen/2);
    ctx.fill();

    // Рамка
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, this.size, this.size);
  }
}
