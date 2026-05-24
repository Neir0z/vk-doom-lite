import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Raycaster } from './render/Raycaster.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';
import { Enemy3D } from './core/Enemy3D.js';
import { Weapon } from './core/Weapon.js';
import { Minimap } from './render/Minimap.js';

async function bootstrap() {
  // 1. Инициализация ядра
  const canvas = document.getElementById('game');
  const raycaster = new Raycaster(canvas);
  const input = new InputManager();
  const audio = new SoundManager();

  document.addEventListener('pointerdown', () => audio.init(), { once: true });
  
  // 2. Игровые объекты
  const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
  const weapon = new Weapon('pistol');
  const minimap = new Minimap();
  const enemies = [];
  const particles = [];
  
  // 3. Состояние игры
  let gameState = 'playing'; // playing, shop, gameover
  let damageFlash = 0;
  let stepTimer = 0;
  let currentWeapon = 'pistol';
  let hasShotgun = false;
  let hasMachinegun = false;

  // 4. UI элементы
  const ui = {
    health: document.getElementById('hud-health'),
    ammo: document.getElementById('hud-ammo'),
    money: document.getElementById('hud-money'),
    wave: document.getElementById('hud-wave'),
    shopModal: document.getElementById('modal-shop'),
    shopMoney: document.getElementById('shop-money'),
    btnHealth: document.getElementById('btn-buy-health'),
    btnAmmo: document.getElementById('btn-buy-ammo'),
    btnNext: document.getElementById('btn-next-wave'),
    overModal: document.getElementById('modal-over'),
    finalWave: document.getElementById('final-wave'),
    btnRestart: document.getElementById('btn-restart')
  };

  // 5. Загрузка рекорда VK
  let highScore = 0;
  try {
    if (window.vkBridge) {
      const data = await window.vkBridge.send('VKWebAppStorageGet', { keys: ['doom_highscore'] });
      if (data.keys?.[0]) highScore = parseInt(data.keys[0].value) || 0;
    }
  } catch {}
  document.getElementById('highscore-display').textContent = highScore;

  // 6. Вспомогательные функции
  function updateHUD() {
    if (ui.health) ui.health.textContent = Math.floor(player.health);
    if (ui.ammo) ui.ammo.textContent = player.ammo;
    if (ui.money) ui.money.textContent = player.score;
    if (ui.wave) ui.wave.textContent = WAVES.startEnemies + (waveManager.wave - 1) * WAVES.increasePerWave;
  }

  function spawnParticles(x, y, count, color, speed) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: 0.3 + Math.random() * 0.5,
        color,
        size: 2 + Math.random() * 4
      });
    }
  }

  function handleWeaponSwitch(e) {
    if (gameState !== 'playing') return;
    if (e.key === '1') { currentWeapon = 'pistol'; weapon.switchTo('pistol'); }
    if (e.key === '2' && hasShotgun) { currentWeapon = 'shotgun'; weapon.switchTo('shotgun'); }
    if (e.key === '3' && hasMachinegun) { currentWeapon = 'machinegun'; weapon.switchTo('machinegun'); }
  }
  window.addEventListener('keydown', handleWeaponSwitch);

  // 7. Управление волнами и спавном
  const waveManager = new WaveManager(() => {
    let mx, my, attempts = 0;
    do {
      mx = Math.floor(Math.random() * MAP[0].length);
      my = Math.floor(Math.random() * MAP.length);
      attempts++;
    } while ((MAP[my][mx] !== 0 || Math.hypot(mx * RENDER.mapScale - player.x, my * RENDER.mapScale - player.y) < 200) && attempts < 100);

    if (attempts < 100) {
      let type = ENEMY_TYPES.grunt;
      const w = waveManager.wave;
      
      // Босс каждые 5 волн
      if (w > 0 && w % WAVES.bossEvery === 0 && enemies.filter(e => e.active && e.isBoss).length === 0) {
        type = ENEMY_TYPES.boss;
      } else if (w > 3) {
        // Случайные улучшенные враги
        const rand = Math.random();
        type = rand > 0.7 ? ENEMY_TYPES.tank : (rand > 0.4 ? ENEMY_TYPES.fast : ENEMY_TYPES.grunt);
      }
      
      enemies.push(new Enemy3D(mx * RENDER.mapScale, my * RENDER.mapScale, type.key || 'grunt'));
    }
  });

  // 8. Магазин
  function openShop() {
    gameState = 'shop';
    ui.shopMoney.textContent = player.score;
    ui.shopModal.showModal();

    ui.btnHealth.disabled = player.score < SHOP.healthCost;
    ui.btnAmmo.disabled = player.score < SHOP.ammoCost;

    // Динамические кнопки оружия
    document.querySelectorAll('.shop-weapon-btn').forEach(b => b.remove());
    const shopContent = ui.shopModal.querySelector('.modal__content');

    if (!hasShotgun && player.score >= SHOP.shotgunCost) {
      const btn = document.createElement('button');
      btn.className = 'shop-item shop-weapon-btn';
      btn.innerHTML = `<span class="shop-icon">🔫</span><span class="shop-desc">Дробовик</span><span class="shop-price">${SHOP.shotgunCost} 💰</span>`;
      btn.onclick = () => {
        if (player.score >= SHOP.shotgunCost) {
          player.score -= SHOP.shotgunCost;
          hasShotgun = true; currentWeapon = 'shotgun'; weapon.switchTo('shotgun');
          audio.playPickup(); openShop();
        }
      };
      shopContent.insertBefore(btn, ui.btnNext);
    }
    if (!hasMachinegun && player.score >= SHOP.machinegunCost) {
      const btn = document.createElement('button');
      btn.className = 'shop-item shop-weapon-btn';
      btn.innerHTML = `<span class="shop-icon">🔫</span><span class="shop-desc">Автомат</span><span class="shop-price">${SHOP.machinegunCost} 💰</span>`;
      btn.onclick = () => {
        if (player.score >= SHOP.machinegunCost) {
          player.score -= SHOP.machinegunCost;
          hasMachinegun = true; currentWeapon = 'machinegun'; weapon.switchTo('machinegun');
          audio.playPickup(); openShop();
        }
      };
      shopContent.insertBefore(btn, ui.btnNext);
    }
  }

  function closeShop() {
    gameState = 'playing';
    ui.shopModal.close();
    waveManager.nextWave();
  }

  ui.btnHealth.addEventListener('click', () => {
    if (player.score >= SHOP.healthCost) {
      player.score -= SHOP.healthCost;
      player.health = Math.min(PLAYER.maxHealth, player.health + SHOP.healthAmount);
      updateHUD(); ui.shopMoney.textContent = player.score;
      audio.playPickup();
    }
  });

  ui.btnAmmo.addEventListener('click', () => {
    if (player.score >= SHOP.ammoCost) {
      player.score -= SHOP.ammoCost;
      player.ammo = Math.min(PLAYER.maxAmmo, player.ammo + SHOP.ammoAmount);
      updateHUD(); ui.shopMoney.textContent = player.score;
      audio.playPickup();
    }
  });

  ui.btnNext.addEventListener('click', closeShop);
  ui.btnRestart.addEventListener('click', () => location.reload());

  // 9. Стрельба (Raycast + Spread + Pellets)
  function shootRaycast() {
    const stats = weapon.shoot();
    if (!stats) return;

    // Звук
    if (stats.sound === 'shotgun') audio.playShotgun();
    else if (stats.sound === 'machinegun') audio.playMachinegun();
    else audio.playShoot();

    // Вспышка выстрела
    spawnParticles(
      player.x + Math.cos(player.angle) * 20,
      player.y + Math.sin(player.angle) * 20,
      6, stats.color, 100
    );

    const pellets = stats.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      const spread = (Math.random() - 0.5) * stats.spread;
      const rayAngle = player.angle + spread;
      
      let hitEnemy = null;
      let hitDist = stats.range * RENDER.mapScale;

      for (const enemy of enemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > hitDist) continue;

        const angleToEnemy = Math.atan2(dy, dx);
        let angleDiff = angleToEnemy - rayAngle;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;

        if (Math.abs(angleDiff) < 0.25) {
          hitEnemy = enemy;
          hitDist = dist;
        }
      }

      if (hitEnemy) {
        if (hitEnemy.takeDamage(stats.damage)) {
          player.score += hitEnemy.score;
          spawnParticles(hitEnemy.x, hitEnemy.y, 25, hitEnemy.color, 200);
          audio.playExplosion();
        } else {
          spawnParticles(hitEnemy.x, hitEnemy.y, 8, '#ffffff', 120);
          audio.playHurt();
        }
      }
    }
  }

  async function endGame() {
    gameState = 'gameover';
    document.getElementById('final-wave').textContent = waveManager.wave;
    ui.overModal.showModal();
    
    if (player.score > highScore) {
      highScore = player.score;
      document.getElementById('highscore-display').textContent = highScore;
      try {
        if (window.vkBridge) await window.vkBridge.send('VKWebAppStorageSet', { key: 'doom_highscore', value: highScore.toString() });
      } catch {}
    }
  }

  // 10. Главный цикл
  let lastTime = 0;
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.04); // Стабилизация физики
    lastTime = timestamp;

    if (gameState === 'playing') {
      player.update(dt, input);
      weapon.update(dt);

      if (input.isShooting()) {
        shootRaycast();
        input.resetShoot();
      }

      // Звуки шагов
      const move = input.getMovement();
      if (Math.abs(move.move) > 0.1) {
        stepTimer += dt;
        if (stepTimer > 0.35) {
          audio.playStep();
          stepTimer = 0;
        }
      } else {
        stepTimer = Math.max(stepTimer - dt, 0.1);
      }

      // Обновление врагов
      const activeEnemies = [];
      for (const enemy of enemies) {
        if (enemy.active) {
          if (enemy.update(dt, player)) {
            damageFlash = 1.0;
            audio.playHurt();
          }
          activeEnemies.push(enemy);
        }
      }

      // Частицы
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Затухание урона
      if (damageFlash > 0) damageFlash -= dt * 4;

      waveManager.update(dt);
      updateHUD();

      if (waveManager.checkWaveComplete(activeEnemies.length)) {
        openShop();
      }

      if (player.health <= 0) endGame();
    }

    // --- РЕНДЕРИНГ ---
    const ctx = raycaster.ctx;
    raycaster.render(timestamp, player);

    // Спрайты врагов (сортировка от дальнего к ближнему)
    enemies.sort((a, b) => Math.hypot(b.x-player.x, b.y-player.y) - Math.hypot(a.x-player.x, a.y-player.y));
    for (const enemy of enemies) {
      if (enemy.active) enemy.draw(ctx, player);
    }

    // Прицел
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;
    ctx.strokeStyle = gameState === 'playing' ? '#0f0' : '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy); ctx.lineTo(cx - 3, cy);
    ctx.moveTo(cx + 3, cy); ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy - 3);
    ctx.moveTo(cx, cy + 3); ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    // Частицы
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Миникарта
    minimap.draw(ctx, player, enemies);

    // Текст оружия
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`${WEAPONS[currentWeapon].name} | 🔫 ${player.ammo}`, 10, ctx.canvas.height - 10);
    ctx.shadowBlur = 0;

    // Красная виньетка урона
    if (damageFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${Math.min(0.5, damageFlash)})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    requestAnimationFrame(gameLoop);
  }

  // Запуск
  waveManager.startWave();
  setTimeout(() => {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('ui').classList.remove('hidden');
    requestAnimationFrame(gameLoop);
    console.log(`🎮 DOOM-LITE v${GAME.version} | POLISHED & LOADED`);
  }, 800);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
else bootstrap();
