  draw(ctx, player) {
    if (!this.active || !this.texture) return;
    const dx = this.x - player.x, dy = this.y - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 1200 || dist < 10) return;

    const angle = Math.atan2(dy, dx) - player.angle;
    let a = angle;
    while (a < -Math.PI) a += 2*Math.PI;
    while (a > Math.PI) a -= 2*Math.PI;
    if (Math.abs(a) > Math.PI/2.5) return;

    const screenH = (400 / (dist/64)) * (this.isBoss ? 1.8 : 1);
    const screenW = screenH;
    const screenX = (0.5 + a/(Math.PI/3)) * 320;
    const screenY = 100 + (this.isBoss ? 10 : 0);

    const bufIdx = Math.floor(screenX);
    if (bufIdx >= 0 && bufIdx < 320 && dist > (window.zBuffer?.[bufIdx] || 0)) return;

    ctx.drawImage(this.texture, screenX - screenW/2, screenY - screenH/2, screenW, screenH);

    // Полоска HP
    if (this.health < this.maxHealth) {
      const bw = screenW * 0.7, bh = 4;
      ctx.fillStyle = '#000';
      ctx.fillRect(screenX - bw/2, screenY - screenH/2 - 8, bw, bh);
      ctx.fillStyle = this.health/this.maxHealth > 0.3 ? '#22c55e' : '#ef4444';
      ctx.fillRect(screenX - bw/2, screenY - screenH/2 - 8, bw * (this.health/this.maxHealth), bh);
    }
  }
