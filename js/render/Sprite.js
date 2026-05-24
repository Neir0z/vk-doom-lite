export class Sprite {
  constructor(x, y, texture) {
    this.x = x;
    this.y = y;
    this.texture = texture;
    this.active = true;
    this.width = 128;
    this.height = 128;
  }

  draw(ctx, player) {
    if (!this.active) return;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Не рисуем если слишком далеко
    if (dist > 1000 || dist < 10) return;

    const spriteAngle = Math.atan2(dy, dx) - player.angle;
    let angle = spriteAngle;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;

    // Не рисуем если за спиной
    if (Math.abs(angle) > Math.PI / 2.5) return;

    // Размер на экране
    const screenH = (400 / (dist / 64));
    const screenW = screenH;
    
    const screenX = (0.5 + angle / (Math.PI / 3)) * 320;
    const screenY = 100;

    const drawX = Math.floor(screenX - screenW / 2);
    const drawY = Math.floor(screenY - screenH / 2);

    // Рисуем КРАСНЫЙ КРУГ (чтобы точно было видно)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(screenX, screenY, screenW / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Чёрные глаза
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(screenX - 10, screenY - 5, 5, 0, Math.PI * 2);
    ctx.arc(screenX + 10, screenY - 5, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}
