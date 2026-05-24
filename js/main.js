import { GAME, PLAYER, SHOP, WAVES, RENDER, MAP, WEAPONS, ENEMY_TYPES } from './config.js';
import { InputManager } from './core/Input.js';
import { Player } from './core/Player.js';
import { Raycaster } from './render/Raycaster.js';
import { SoundManager } from './audio/SoundManager.js';
import { WaveManager } from './core/WaveManager.js';
import { Enemy3D } from './core/Enemy3D.js';
import { Weapon } from './core/Weapon.js';
import { Minimap } from './render/Minimap.js';
import { AssetGenerator } from './render/AssetGenerator.js';
import { ParticleEffects } from './render/ParticleEffects.js';

async function bootstrap() {
  console.log('🎮 Starting bootstrap...');
  
  try {
    // 1. Инициализация
    const canvas = document.getElementById('game');
    if (!canvas) throw new Error('Canvas not found');
    
    console.log('✓ Canvas found');
    
    const raycaster = new Raycaster(canvas);
    const input = new InputManager();
    const audio = new SoundManager();

    document.addEventListener('pointerdown', () => audio.init(), { once: true });
    
    console.log('✓ Core systems initialized');

    // 2. Ассеты
    const wallTex = AssetGenerator.createWallTexture();
    const particles = new ParticleEffects();
    
    console.log('✓ Assets generated');

    // 3. Игровые объекты
    const player = new Player(7.5 * RENDER.mapScale, 4.5 * RENDER.mapScale);
    const weapon = new Weapon('pistol', player);
    const minimap = new Minimap();
    const enemies = [];
    
    console.log('✓ Game objects created');

    // 4. Состояние
    let gameState = 'playing';
    let damageFlash = 0;
    let stepTimer = 0;
    let currentWeapon = 'pistol';
    let hasShotgun = false;
    let hasMachinegun = false;

    // 5. UI
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

    console.log('✓ UI elements found');

    // 6. Рекорд
    let highScore = 0;
    try {
      if (window.vkBridge) {
        const data = await window.vkBridge.send('VKWebAppStorageGet', { keys: ['doom_highscore'] });
        if (data.keys && data.keys[0]) {
          highScore = parseInt(data.keys[0].value) || 0;
        }
      }
    } catch (e) {
      console.warn('VK storage error:', e);
    }
    
    const highscoreEl = document.getElementById('highscore-display');
    if (highscoreEl) highscoreEl.textContent = highScore;

    // 7. Функции
    function updateHUD() {
      if (ui.health) ui.health.textContent = Math.floor(player.health);
      if (ui.ammo) ui.ammo.textContent = player.ammo;
      if (ui.money) ui.money.textContent = player.score;
      if (ui.wave) ui.wave.textContent = WAVES.startEnemies + (waveManager.wave - 1) * WAVES.increasePerWave;
    }

    function handleWeaponSwitch(e) {
      if (gameState !== 'playing') return;
      if (e.key === '1') { currentWeapon = 'pistol'; weapon.switchTo('pistol'); }
      if (e.key === '2' && hasShotgun) { currentWeapon = 'shotgun'; weapon.switchTo('shotgun'); }
      if (e.key === '3' && hasMachinegun) { currentWeapon = 'machinegun'; weapon.switchTo('machinegun'); }
    }
    window.addEventListener('keydown', handleWeaponSwitch);

    // 8. Волны
    const waveManager = new WaveManager(() => {
      let mx, my, attempts = 0;
      do {
        mx = Math.floor(Math.random() * MAP[0].length);
        my = Math.floor(Math.random() * MAP.length);
        attempts++;
      } while ((MAP[my][mx] !== 0 || Math.hypot(mx * RENDER.mapScale - player.x, my * RENDER.mapScale - player.y) < 200) && attempts < 100);

      if (attempts < 100) {
        let typeKey = 'grunt';
        const w = waveManager.wave;
        
        if (w > 0 && w % WAVES.bossEvery === 0 && enemies.filter(e => e.active && e.isBoss).length === 0) {
          typeKey = 'boss';
        } else if (w > 3) {
          const rand = Math.random();
          typeKey = rand > 0.7 ? 'tank' : (rand > 0.4 ? 'fast' : 'grunt');
        }
        
        const enemyTex = AssetGenerator.createEnemySprite(typeKey, 0);
        enemies.push(new Enemy3D(mx * RENDER.mapScale, my * RENDER.mapScale, typeKey, enemyTex));
      }
    });

    console.log('✓ Wave manager created');

    // 9. Магазин
    function openShop() {
      gameState = 'shop';
      ui.shopMoney.textContent = player.score;
      if (ui.shopModal) ui.shopModal.showModal();
    }

    function closeShop() {
      gameState = 'playing';
      if (ui.shopModal) ui.shopModal.close();
      waveManager.nextWave();
    }

    if (ui.btnHealth) {
      ui.btnHealth.addEventListener('click', () => {
        if (player.score >= SHOP.healthCost) {
          player.score -= SHOP.healthCost;
          player.health = Math.min(PLAYER.maxHealth, player.health + SHOP.healthAmount);
          updateHUD();
          ui.shopMoney.textContent = player.score;
          audio.playPickup();
        }
      });
    }

    if (ui.btnAmmo) {
      ui.btnAmmo.addEventListener('click', () => {
        if (player.score >= SHOP.ammoCost) {
          player.score -= SHOP.ammoCost;
          player.ammo = Math.min(PLAYER.maxAmmo, player.ammo + SHOP.ammoAmount);
          updateHUD();
          ui.shopMoney.textContent = player.score;
          audio.playPickup();
        }
      });
    }

    if (ui.btnNext) ui.btnNext.addEventListener('click', closeShop);
    if (ui.btnRestart) ui.btnRestart.addEventListener('click', () => location.reload());

    // 10. Стрельба
    function shootRaycast() {
      const stats = weapon.shoot();
      if (!stats) return;

      if (stats.sound === 'shotgun') audio.playShotgun();
      else if (stats.sound === 'machinegun') audio.playMachinegun();
      else audio.playShoot();

      particles.emit(
        player.x + Math.cos(player.angle) * 20,
        player.y + Math.sin(player.angle) * 20,
        'sparks', 6
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
            particles.emit(hitEnemy.x, hitEnemy.y, 'blood', 20);
            particles.emit(hitEnemy.x, hitEnemy.y, 'fire', 8);
            audio.playExplosion();
          } else {
            particles.emit(hitEnemy.x, hitEnemy.y, 'blood', 8);
            audio.playHurt();
          }
        }
      }
    }

    async function endGame() {
      gameState = 'gameover';
      const finalWaveEl = document.getElementById('final-wave');
      if (finalWaveEl) finalWaveEl.textContent = waveManager.wave;
      if (ui.overModal) ui.overModal.showModal();
      
      if (player.score > highScore) {
        highScore = player.score;
        if (highscoreEl) highscoreEl.textContent = highScore;
        try {
          if (window.vkBridge) {
            await window.vkBridge.send('VKWebAppStorageSet', { key: 'doom_highscore', value: highScore.toString() });
          }
        } catch (e) {
          console.warn('VK save error:', e);
        }
      }
    }

    // 11. Игровой цикл
    let lastTime = 0;
    function gameLoop(timestamp) {
      const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
      lastTime = timestamp;

      if (gameState === 'playing') {
        player.update(dt, input);
        weapon.update(dt);

        if (input.isShooting()) {
          shootRaycast();
          input.resetShoot();
        }

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

        const activeEnemies = [];
        for (const enemy of enemies) {
          if (enemy.active) {
            if (enemy.update(dt, player)) {
              damageFlash = 1.0;
              audio.playHurt();
              player.takeDamage(enemy.damage);
            }
            activeEnemies.push(enemy);
          }
        }

        particles.update(dt);

        if (damageFlash > 0) damageFlash -= dt * 4;

        waveManager.update(dt);
        updateHUD();

        if (waveManager.checkWaveComplete(activeEnemies.length)) {
          openShop();
        }

        if (player.health <= 0 && gameState === 'playing') {
          endGame();
        }
      }

      // Рендер
      const ctx = raycaster.ctx;
      raycaster.render(timestamp, player, wallTex);

      enemies.sort((a, b) => 
        Math.hypot(b.x - player.x, b.y - player.y) - Math.hypot(a.x - player.x, a.y - player.y)
      );
      for (const enemy of enemies) {
        if (enemy.active) enemy.draw(ctx, player);
      }

      particles.draw(ctx);

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

      minimap.draw(ctx, player, enemies);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(WEAPONS[currentWeapon].name + ' | 🔫 ' + player.ammo, 10, ctx.canvas.height - 10);
      ctx.shadowBlur = 0;

      if (damageFlash > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, ' + Math.min(0.5, damageFlash) + ')';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      requestAnimationFrame(gameLoop);
    }

    // Запуск
    console.log('✓ Starting game...');
    waveManager.startWave();
    
    setTimeout(() => {
      console.log('✓ Hiding loader...');
      const loader = document.getElementById('loader');
      const ui = document.getElementById('ui');
      
      if (loader) loader.classList.add('hidden');
      if (ui) ui.classList.remove('hidden');
      
      console.log('✓ Starting game loop...');
      requestAnimationFrame(gameLoop);
      console.log('🎮 DOOM-LITE STARTED SUCCESSFULLY!');
    }, 800);
    
  } catch (error) {
    console.error('❌ Bootstrap error:', error);
    const loader = document.getElementById('loader');
    if (loader) {
      loader.innerHTML = '<p style="color:#ef4444;padding:20px">Ошибка: ' + error.message + '</p>';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
