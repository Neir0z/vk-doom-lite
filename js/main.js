console.log('🎮 main.js loaded!');

async function bootstrap() {
  console.log('✅ Bootstrap started');
  
  const canvas = document.getElementById('game');
  const ui = document.getElementById('ui');
  const loader = document.getElementById('loader');
  
  console.log('Canvas:', canvas);
  console.log('UI:', ui);
  console.log('Loader:', loader);
  
  if (loader) loader.classList.add('hidden');
  if (ui) ui.classList.remove('hidden');
  
  console.log('✅ Game should be visible now');
  
  // Простой тестовый рендер
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f0';
    ctx.font = '20px monospace';
    ctx.fillText('IT WORKS!', 50, 50);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
