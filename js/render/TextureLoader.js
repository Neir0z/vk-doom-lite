export class TextureLoader {
  constructor() {
    this.cache = new Map();
    this.loaded = false;
  }

  async loadImage(url, key) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { this.cache.set(key, img); resolve(img); };
      img.onerror = reject;
      img.src = url;
    });
  }

  async loadSpriteSheet(url, key, frameWidth, frameHeight, frameCount) {
    const img = await this.loadImage(url, key);
    this.cache.set(`${key}_meta`, { frameWidth, frameHeight, frameCount });
    return img;
  }

  drawFrame(ctx, key, x, y, width, height, frameIndex = 0) {
    const img = this.cache.get(key);
    const meta = this.cache.get(`${key}_meta`);
    
    if (!img) {
      ctx.fillStyle = '#666';
      ctx.fillRect(x, y, width, height);
      return;
    }

    if (meta) {
      const sx = frameIndex * meta.frameWidth;
      ctx.drawImage(img, sx, 0, meta.frameWidth, meta.frameHeight, x, y, width, height);
    } else {
      ctx.drawImage(img, x, y, width, height);
    }
  }

  isReady() { return this.loaded; }
}
