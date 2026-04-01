import { CONFIG } from './config.js';

export class FoodSpawner {
  constructor(grid) {
    this.grid = grid;
    this._timer = 0;
  }

  update(dtMs) {
    this._timer += dtMs;
    if (this._timer < CONFIG.FOOD_SPAWN_INTERVAL_MS) return;
    this._timer -= CONFIG.FOOD_SPAWN_INTERVAL_MS;
    if (this.grid.countFood() < CONFIG.MAX_FOOD_ON_GROUND) {
      this._spawnRandom();
    }
  }

  /** Immediately place `count` food items (used for initial seeding) */
  spawnBatch(count) {
    for (let i = 0; i < count; i++) {
      this._spawnRandom();
    }
  }

  _spawnRandom() {
    const size = this.grid.size;
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);
      if (this.grid.placeFood(x, y)) return;
    }
  }
}
