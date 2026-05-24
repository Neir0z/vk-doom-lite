import { MAP, RENDER } from '../config.js';

export class Minimap {
  constructor() {
    this.size = 80; // ✅ Уменьшили с 120 до 80
    this.scale = this.size / (MAP[0].length * RENDER.mapScale);
  }

  draw(ctx, player, enemies) {
    const padding = 8;
    const x = ctx.canvas.width - this.size - padding;
    const y = padding;

    // Полупрозрачный фон
    ctx.fillStyle = 'rgba(10, 10, 26, 0.85)';
    ctx.fillRect(x, y, this.size, this.size);

    // Стены
    ctx.fillStyle = '#3a3a5c';
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

    // Враги (маленькие красные точки)
    ctx.fillStyle = '#ef4444';
    for (const enemy of enemies) {
      if (enemy.active) {
        const ex = x + (enemy.x * this.scale);
        const ey = y + (enemy.y * this.scale);
        ctx.beginPath();
        ctx.arc(ex, ey, enemy.isBoss ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ✅ ИГРОК (зелёная стрелка с направлением)
    const px = x + (player.x * this.scale);
    const py = y + (player.y * this.scale);
    
    // Тело игрока
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Стрелка направления
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + Math.cos(player.angle) * 8,
      py + Math.sin(player.angle) * 8
    );
    ctx.stroke();

    // Рамка
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, this.size, this.size);
  }
}
