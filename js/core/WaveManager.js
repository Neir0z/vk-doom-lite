export class WaveManager {
  constructor(spawnEnemyFn) {
    this.spawnEnemyFn = spawnEnemyFn;
    this.wave = 1;
    this.totalEnemies = 3;
    this.spawnedEnemies = 0;
    this.spawnTimer = 0;
    this.isSpawning = false;
  }

  startWave() {
    this.totalEnemies = 3 + (this.wave - 1) * 2; // 3, 5, 7...
    this.spawnedEnemies = 0;
    this.isSpawning = true;
    console.log(`🌊 Wave ${this.wave} started! Enemies: ${this.totalEnemies}`);
  }

  update(dt) {
    if (!this.isSpawning) return;

    this.spawnTimer += dt;
    // Спавним врага каждую секунду
    if (this.spawnTimer > 1.0) {
      this.spawnEnemyFn();
      this.spawnedEnemies++;
      this.spawnTimer = 0;

      if (this.spawnedEnemies >= this.totalEnemies) {
        this.isSpawning = false; // Все враги на карте, ждем пока умрут
      }
    }
  }

  checkWaveComplete(aliveEnemiesCount) {
    if (this.isSpawning) return false; // Ещё спавним
    if (aliveEnemiesCount === 0 && this.spawnedEnemies === this.totalEnemies) {
      return true; // Волна пройдена!
    }
    return false;
  }

  nextWave() {
    this.wave++;
    this.startWave();
  }
}
