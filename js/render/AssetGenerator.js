export class AssetGenerator {
  static createWallTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    // База
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, 64, 64);
    // Кирпичи
    ctx.fillStyle = '#1f1f2e';
    for (let y = 0; y < 64; y += 16) {
      const offset = (y / 16) % 2 === 0 ? 0 : 8;
      for (let x = offset; x < 64; x += 16) {
        ctx.fillRect(x + 1, y + 1, 14, 14);
      }
    }
    // Швы
    ctx.strokeStyle = '#3a3a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 64, 64);
    return c;
  }

  static createEnemySprite(type = 'grunt', frame = 0) {
    const c = document.createElement('canvas');
    const size = type === 'boss' ? 128 : 64;
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const s = size;

    // Тело (пульсация по кадрам)
    const breathe = Math.sin(frame * 0.8) * 2;
    const colors = { grunt: '#dc2626', fast: '#f59e0b', tank: '#7c3aed', boss: '#991b1b' };
    ctx.fillStyle = colors[type] || colors.grunt;
    ctx.beginPath();
    ctx.arc(s/2, s/2, s/2.5 + breathe, 0, Math.PI*2);
    ctx.fill();

    // Глаза (злые)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s/2 - s/6, s/2 - s/8, s/8, 0, Math.PI*2);
    ctx.arc(s/2 + s/6, s/2 - s/8, s/8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(s/2 - s/6, s/2 - s/8, s/16, 0, Math.PI*2);
    ctx.arc(s/2 + s/6, s/2 - s/8, s/16, 0, Math.PI*2);
    ctx.fill();

    // Детали босса
    if (type === 'boss') {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(s/2 - 4, s/2 + s/6, 8, 12);
      ctx.fillRect(s/2 - 20, s/2, 40, 6);
    }
    return c;
  }

  static createWeaponSprite() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    // Корпус
    ctx.fillStyle = '#374151';
    ctx.fillRect(20, 10, 24, 40);
    // Ствол
    ctx.fillStyle = '#111827';
    ctx.fillRect(28, 0, 8, 15);
    // Рукоять
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(22, 45, 20, 15);
    return c;
  }
}
