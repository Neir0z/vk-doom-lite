import { RENDER } from '../config.js';

export class Sprite {
  constructor(x, y, texture) {
    this.x = x;
    this.y = y;
    this.texture = texture;
    this.active = true;
    this.width = 64;  // Размер спрайта
    this.height = 64;
  }

  /** Отрисовка спрайта поверх 3D стен */
  draw(ctx, player, zBuffer) {
    if (!this.active) return;

    // Вектор от игрока к спрайту
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    
    // Расстояние до спрайта
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Проверка: спрайт должен быть в поле зрения
    if (dist > RENDER.maxDepth * RENDER.mapScale || dist < 0.1) return;

    // Угол между направлением игрока и спрайтом
    const spriteAngle = Math.atan2(dy, dx) - player.angle;
    
    // Нормализация угла (-PI до PI)
    let angle = spriteAngle;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    while (angle > Math.PI) angle -= 2 * Math.PI;

    // Если спрайт за спиной — не рисуем
    if (Math.abs(angle) > RENDER.fov / 1.5) return;

    // Размер спрайта на экране (чем дальше, тем меньше)
    const screenH = (RENDER.numRays / dist) * 0.8;
    const screenW = screenH * (this.width / this.height);
    
    // Позиция на экране
    const screenX = (0.5 + angle / RENDER.fov) * RENDER.numRays;
    const screenY = (RENDER.numRays * 0.6) / 2; // Центр по вертикали

    const drawX = Math.floor(screenX - screenW / 2);
    const drawY = Math.floor(screenY - screenH / 2);

    // Z-buffer проверка: рисуем только если спрайт ближе чем стена
    const bufferIndex = Math.floor(screenX);
    if (bufferIndex >= 0 && bufferIndex < zBuffer.length && dist > zBuffer[bufferIndex] * RENDER.mapScale) {
      return; // Стена ближе
    }

    // Рисуем спрайт
    if (this.texture) {
      ctx.drawImage(this.texture, drawX, drawY, screenW, screenH);
    } else {
      // Заглушка если нет текстуры (красный круг)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(screenX, screenY, screenW / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
