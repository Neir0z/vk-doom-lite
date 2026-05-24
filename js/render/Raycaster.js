import { MAP, RENDER } from '../config.js';

export class Raycaster {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = RENDER.numRays;
    this.height = Math.floor(this.width * 0.6);
    
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
    
    this.zBuffer = new Array(this.width).fill(0);
  }

  render(time, player, wallTex) {
    const ctx = this.ctx;
    const { width, height } = this;

    // Небо и пол
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height / 2);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, height / 2, width, height / 2);

    for (let x = 0; x < width; x++) {
      const rayAngle = (player.angle - RENDER.fov / 2.0) + (x / width) * RENDER.fov;
      const eyeX = Math.cos(rayAngle);
      const eyeY = Math.sin(rayAngle);

      let mapX = Math.floor(player.x / RENDER.mapScale);
      let mapY = Math.floor(player.y / RENDER.mapScale);

      const deltaDistX = Math.abs(1 / eyeX);
      const deltaDistY = Math.abs(1 / eyeY);
      let stepX, stepY, sideDistX, sideDistY;

      if (eyeX < 0) {
        stepX = -1;
        sideDistX = (player.x / RENDER.mapScale - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - player.x / RENDER.mapScale) * deltaDistX;
      }
      
      if (eyeY < 0) {
        stepY = -1;
        sideDistY = (player.y / RENDER.mapScale - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - player.y / RENDER.mapScale) * deltaDistY;
      }

      let hit = false;
      let side = 0;
      let dist = 0;

      // DDA Algorithm
      while (!hit && dist < RENDER.maxDepth) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (mapY < 0 || mapY >= MAP.length || mapX < 0 || mapX >= MAP[0].length) {
          hit = true;
          dist = RENDER.maxDepth;
        } else if (MAP[mapY][mapX] > 0) {
          hit = true;
        }
      }

      // Calculate distance
      if (side === 0) {
        dist = (mapX - player.x / RENDER.mapScale + (1 - stepX) / 2) / eyeX;
      } else {
        dist = (mapY - player.y / RENDER.mapScale + (1 - stepY) / 2) / eyeY;
      }

      // Z-Buffer в пикселях
      this.zBuffer[x] = dist * RENDER.mapScale;

      const perpDist = dist * Math.cos(rayAngle - player.angle);
      const lineHeight = Math.floor(height / perpDist);

      let drawStart = Math.floor(-lineHeight / 2 + height / 2);
      if (drawStart < 0) drawStart = 0;
      let drawEnd = Math.floor(lineHeight / 2 + height / 2);
      if (drawEnd >= height) drawEnd = height - 1;

      // Отрисовка стены
      const shade = Math.max(0.2, 1 - dist / RENDER.maxDepth);
      
      if (wallTex && side === 0) {
        // Текстурированная стена (вертикальная грань)
        const texX = Math.floor((player.y / RENDER.mapScale) * 64) % 64;
        ctx.globalAlpha = shade;
        ctx.drawImage(wallTex, texX, 0, 1, 64, x, drawStart, 1, drawEnd - drawStart);
        ctx.globalAlpha = 1;
      } else if (wallTex) {
        // Текстурированная стена (горизонтальная грань, темнее)
        const texX = Math.floor((player.x / RENDER.mapScale) * 64) % 64;
        ctx.globalAlpha = shade * 0.8;
        ctx.drawImage(wallTex, texX, 0, 1, 64, x, drawStart, 1, drawEnd - drawStart);
        ctx.globalAlpha = 1;
      } else {
        // Заглушка без текстуры
        const baseColor = side === 1 ? [130, 130, 170] : [110, 110, 150];
        ctx.fillStyle = `rgb(${Math.floor(baseColor[0] * shade)}, ${Math.floor(baseColor[1] * shade)}, ${Math.floor(baseColor[2] * shade)})`;
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
      }
    }

    // Оружие
    this._drawWeapon(ctx, time, player.isShooting);
  }

  _drawWeapon(ctx, time, isFiring) {
    const bobX = Math.sin(time * 0.005) * 3;
    const bobY = Math.abs(Math.cos(time * 0.005)) * 5;
    const recoil = isFiring ? 15 : 0;
    const cx = this.width / 2 + bobX;
    const cy = this.height + bobY - recoil;

    // Ствол
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(cx - 12, cy - 90, 24, 90);
    // Рукоять
    ctx.fillStyle = '#222';
    ctx.fillRect(cx - 8, cy - 40, 16, 40);

    // Вспышка выстрела
    if (isFiring) {
      ctx.fillStyle = `rgba(255, 200, 50, ${0.7 + Math.random() * 0.3})`;
      ctx.beginPath();
      ctx.arc(cx, cy - 95, 12 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, cy - 95, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
