import { MAP, RENDER } from '../config.js';

export class Raycaster {
  constructor(canvas, weaponImg) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = RENDER.numRays;
    this.height = Math.floor(this.width * 0.6);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
    this.zBuffer = new Array(this.width).fill(0);
    this.weaponImg = weaponImg;
  }

  render(time, player, wallTex) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, h / 2, w, h / 2);

    for (let x = 0; x < w; x++) {
      const rayAngle = (player.angle - RENDER.fov / 2.0) + (x / w) * RENDER.fov;
      const eyeX = Math.cos(rayAngle);
      const eyeY = Math.sin(rayAngle);

      let mapX = Math.floor(player.x / RENDER.mapScale);
      let mapY = Math.floor(player.y / RENDER.mapScale);

      const deltaDistX = Math.abs(1 / eyeX);
      const deltaDistY = Math.abs(1 / eyeY);
      
      let stepX;
      let stepY;
      let sideDistX;
      let sideDistY;

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

      if (side === 0) {
        dist = (mapX - player.x / RENDER.mapScale + (1 - stepX) / 2) / eyeX;
      } else {
        dist = (mapY - player.y / RENDER.mapScale + (1 - stepY) / 2) / eyeY;
      }

      this.zBuffer[x] = dist * RENDER.mapScale;

      const perpDist = dist * Math.cos(rayAngle - player.angle);
      const lineHeight = Math.floor(h / perpDist);

      let drawStart = Math.floor(-lineHeight / 2 + h / 2);
      if (drawStart < 0) drawStart = 0;
      let drawEnd = Math.floor(lineHeight / 2 + h / 2);
      if (drawEnd >= h) drawEnd = h - 1;

      const shade = Math.max(0.2, 1 - dist / RENDER.maxDepth);
      
      if (side === 0) {
        const r = Math.floor(110 * shade);
        const g = Math.floor(110 * shade);
        const b = Math.floor(150 * shade);
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      } else {
        const r = Math.floor(130 * shade);
        const g = Math.floor(130 * shade);
        const b = Math.floor(170 * shade);
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      }
      
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }

    this._drawWeapon(ctx, time, player.isShooting);
  }

  _drawWeapon(ctx, time, isFiring) {
    const bobX = Math.sin(time * 0.005) * 4;
    const bobY = Math.abs(Math.cos(time * 0.005)) * 6;
    const recoil = isFiring ? 24 : 0;
    const cx = this.width / 2 + bobX;
    const cy = this.height + bobY - recoil;
    
    if (this.weaponImg && this.weaponImg.complete) {
      ctx.drawImage(this.weaponImg, cx - 32, cy - 64, 64, 64);
    } else {
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(cx - 12, cy - 60, 24, 50);
    }
  }
}
