// import { CONTROLS } from '../config.js';

export class InputManager {
  constructor() {
    this.keys = new Set();
    this.touch = { x: 0, y: 0, active: false };
    this.shootPressed = false;
    this._bindKeyboard();
    this._bindTouch();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const k = e.code;
      if (k === 'KeyW' || k === 'ArrowUp') this.keys.add('up');
      if (k === 'KeyS' || k === 'ArrowDown') this.keys.add('down');
      if (k === 'KeyA' || k === 'ArrowLeft') this.keys.add('left');
      if (k === 'KeyD' || k === 'ArrowRight') this.keys.add('right');
      if (k === 'Space') this.shootPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = e.code;
      if (k === 'KeyW' || k === 'ArrowUp') this.keys.delete('up');
      if (k === 'KeyS' || k === 'ArrowDown') this.keys.delete('down');
      if (k === 'KeyA' || k === 'ArrowLeft') this.keys.delete('left');
      if (k === 'KeyD' || k === 'ArrowRight') this.keys.delete('right');
      if (k === 'Space') this.shootPressed = false;
    });
  }

  _bindTouch() {
    const joystick = document.getElementById('joystick');
    if (!joystick) return;
    const stick = joystick.querySelector('.joystick__stick');
    const maxDist = 40;

    const update = (cx, cy) => {
      const rect = joystick.getBoundingClientRect();
      const center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
      const dx = cx - center.x;
      const dy = cy - center.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 15) {
        this.touch.x = 0; this.touch.y = 0; this.touch.active = false;
        stick.style.transform = `translate(-50%, -50%)`;
        return;
      }
      this.touch.active = true;
      const clamped = Math.min(dist, maxDist);
      const angle = Math.atan2(dy, dx);
      this.touch.x = Math.cos(angle) * (clamped / maxDist);
      this.touch.y = Math.sin(angle) * (clamped / maxDist);
      stick.style.transform = `translate(calc(-50% + ${this.touch.x * maxDist}px), calc(-50% + ${this.touch.y * maxDist}px))`;
    };

    joystick.addEventListener('touchstart', e => { e.preventDefault(); update(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    joystick.addEventListener('touchmove', e => { e.preventDefault(); update(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    const reset = () => { this.touch.x = 0; this.touch.y = 0; this.touch.active = false; stick.style.transform = `translate(-50%, -50%)`; };
    joystick.addEventListener('touchend', reset);
    joystick.addEventListener('touchcancel', reset);

    const shootBtn = document.getElementById('btn-shoot');
    if (shootBtn) {
      shootBtn.addEventListener('touchstart', e => { e.preventDefault(); this.shootPressed = true; }, { passive: false });
      shootBtn.addEventListener('touchend', e => { e.preventDefault(); this.shootPressed = false; }, { passive: false });
    }
  }

  // Возвращает { move: 1/-1/0, rot: 1/-1/0 }
  getMovement() {
    let move = 0, rot = 0;
    if (this.keys.has('up')) move = 1;
    if (this.keys.has('down')) move = -1;
    if (this.keys.has('left')) rot = -1;
    if (this.keys.has('right')) rot = 1;

    if (this.touch.active) {
      move = -this.touch.y; // Вперед/Назад
      rot = this.touch.x;   // Влево/Вправо
    }
    return { move, rot };
  }

  isShooting() { return this.shootPressed; }
  resetShoot() { this.shootPressed = false; }
}
