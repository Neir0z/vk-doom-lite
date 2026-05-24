export class Sprite {
  constructor(x, y, texture) {
    this.x = x;
    this.y = y;
    this.texture = texture;
    this.active = true;
    this.width = 128;
    this.height = 128;
  }

  draw(ctx, player, zBuffer) {
    if (!this.active) return;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy); // Дистанция в пикселях
    
    // Видимость: если слишком далеко или слишком близко (за спиной)
    if (dist > 1200 || dist < 10) return; // 1200px ~ 18 клеток

    const spriteAngle = Math.atan2(dy, dx) - player.angle;
    let angle = spriteAngle;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;

    if (Math.abs(angle) > Math.PI / 2.5) return;

    // Размер спрайта
    const screenH = (320 / (dist / 64)) * 1.5; // Масштабируем относительно клетки
    const screenW = screenH * (this.width / this.height);
    
    const screenX = (0.5 + angle / (Math.PI / 3)) * 320;
    const screenY = 100 + screenH / 4;

    const drawX = Math.floor(screenX - screenW / 2);
    const drawY = Math.floor(screenY - screenH / 2);

    // ✅ ПРОВЕРКА Z-BUFFER (теперь единицы совпадают: пиксели vs пиксели)
    const bufferIndex = Math.floor(screenX);
    if (bufferIndex >= 0 && bufferIndex < zBuffer.length) {
      if (dist > zBuffer[bufferIndex]) return; // Стена ближе спрайта
    }

    // Рисуем
    if (this.texture) {
      ctx.drawImage(this.texture, drawX, drawY, screenW, screenH);
    } else {
      // Красный шар-заглушка
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenW / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(screenX - screenW/6, screenY - screenH/8, screenW/8, 0, Math.PI * 2);
      ctx.arc(screenX + screenW/6, screenY - screenH/8, screenW/8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(screenX - screenW/6, screenY - screenH/8, screenW/16, 0, Math.PI * 2);
      ctx.arc(screenX + screenW/6, screenY - screenH/8, screenW/16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
