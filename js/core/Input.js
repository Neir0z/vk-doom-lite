import { CONTROLS } from '../config.js';

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.touch = { x: 0, y: 0, active: false };
    this.shootPressed = false;
    
    this._bindKeyboard();
    this._bindTouch();
  }

 _bindKeyboard() {
  window.addEventListener('keydown', (e) => {
    // Используем e.code (физическая клавиша), а не e.key (символ)
    // Это работает при любой раскладке!
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.add('up');
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.add('down');
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.add('left');
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.add('right');
    if (e.code === 'Space') this.shootPressed = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.delete('up');
    if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.delete('down');
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.delete('left');
    if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.delete('right');
    if (e.code === 'Space') this.shootPressed = false;
  });
}

  _bindTouch() {
    const joystick = document.getElementById('joystick');
    const stick = joystick.querySelector('.joystick__stick');
    const baseRect = joystick.getBoundingClientRect();
    const center = { x: baseRect.left + baseRect.width/2, y: baseRect.top + baseRect.height/2 };
    const maxDist = baseRect.width / 2 - 20;

    const updateStick = (clientX, clientY) => {
      const dx = clientX - center.x;
      const dy = clientY - center.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      if (dist < CONTROLS.touch.joystickDeadZone) {
        this.touch.x = 0; this.touch.y = 0; this.touch.active = false;
        stick.style.transform = `translate(-50%, -50%)`;
        return;
      }
      
      this.touch.active = true;
      const clampedDist = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      this.touch.x = Math.cos(angle) * (clampedDist / maxDist);
      this.touch.y = Math.sin(angle) * (clampedDist / maxDist);
      
      stick.style.transform = `translate(calc(-50% + ${this.touch.x * maxDist}px), calc(-50% + ${this.touch.y * maxDist}px))`;
    };

    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      updateStick(t.clientX, t.clientY);
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      updateStick(t.clientX, t.clientY);
    }, { passive: false });

    const resetJoystick = () => {
      this.touch.x = 0; this.touch.y = 0; this.touch.active = false;
      stick.style.transform = `translate(-50%, -50%)`;
    };
    joystick.addEventListener('touchend', resetJoystick);
    joystick.addEventListener('touchcancel', resetJoystick);

    // Кнопка стрельбы
    const shootBtn = document.getElementById('btn-shoot');
    shootBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.shootPressed = true; }, { passive: false });
    shootBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.shootPressed = false; }, { passive: false });
    shootBtn.addEventListener('mousedown', () => this.shootPressed = true);
    shootBtn.addEventListener('mouseup', () => this.shootPressed = false);
    shootBtn.addEventListener('mouseleave', () => this.shootPressed = false);
  }

  getMovement() {
    let dx = 0, dy = 0;
    
    // Клавиатура
    if (this.keys.has(CONTROLS.keyboard.move.left)) dx -= 1;
    if (this.keys.has(CONTROLS.keyboard.move.right)) dx += 1;
    if (this.keys.has(CONTROLS.keyboard.move.up)) dy -= 1;
    if (this.keys.has(CONTROLS.keyboard.move.down)) dy += 1;
    
    // Тач-джойстик (приоритет)
    if (this.touch.active) {
      dx = this.touch.x;
      dy = this.touch.y;
    }
    
    // Нормализация диагоналей
    const len = Math.sqrt(dx*dx + dy*dy);
    return len > 0 ? { x: dx/len, y: dy/len } : { x: 0, y: 0 };
  }

  isShooting() {
    return this.shootPressed;
  }

  resetShoot() {
    this.shootPressed = false;
  }
}
