export class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.walls = [];
    this._generateLevel();
  }

  _generateLevel() {
    const m = 50; // отступ стен от краёв
    // Внешние границы
    this.walls.push({ x: 0, y: 0, w: this.width, h: m });
    this.walls.push({ x: 0, y: this.height - m, w: this.width, h: m });
    this.walls.push({ x: 0, y: 0, w: m, h: this.height });
    this.walls.push({ x: this.width - m, y: 0, w: m, h: this.height });

    // Случайные препятствия
    for (let i = 0; i < 5; i++) {
      const w = 40 + Math.random() * 30;
      const h = 40 + Math.random() * 30;
      this.walls.push({
        x: m + 50 + Math.random() * (this.width - w - m*2 - 100),
        y: m + 50 + Math.random() * (this.height - h - m*2 - 100),
        w, h
      });
    }
  }

  /** Проверка коллизии: круг vs прямоугольник */
  checkCollision(cx, cy, radius) {
    for (const wall of this.walls) {
      const closestX = Math.max(wall.x, Math.min(cx, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(cy, wall.y + wall.h));
      const dx = cx - closestX;
      const dy = cy - closestY;
      if (dx*dx + dy*dy < radius*radius) return true;
    }
    return false;
  }

  draw(ctx, wallTex) {
    for (const w of this.walls) {
      ctx.drawImage(wallTex, w.x, w.y, w.w, w.h);
      ctx.strokeStyle = '#1f1f2e';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.w, w.h);
    }
  }
}