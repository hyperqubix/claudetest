import { CONFIG } from './config.js';
import { Grid } from './grid.js';
import { Ant } from './ant.js';
import { FoodSpawner } from './food.js';
import { Renderer } from './renderer.js';

class AntSimulator {
  constructor() {
    this._grid = new Grid();
    this._ants = Array.from({ length: CONFIG.NUM_ANTS }, () => new Ant(this._grid));
    this._foodSpawner = new FoodSpawner(this._grid);
    this._renderer = new Renderer();
    this._foodCollected = 0;
    this._lastTimestamp = null;

    // Seed the world with some initial food
    this._foodSpawner.spawnBatch(6);

    // Build static geometry
    this._renderer.buildGround(this._grid);

    // UI element references
    this._ui = {
      ants: document.getElementById('stat-ants'),
      foodGround: document.getElementById('stat-food-ground'),
      foodCollected: document.getElementById('stat-food-collected'),
    };
    this._ui.ants.textContent = CONFIG.NUM_ANTS;

    this._tick = this._tick.bind(this);
    requestAnimationFrame(this._tick);
  }

  _tick(timestamp) {
    if (this._lastTimestamp === null) this._lastTimestamp = timestamp;
    // Cap delta to avoid large jumps after tab switching
    const dt = Math.min(timestamp - this._lastTimestamp, 100);
    this._lastTimestamp = timestamp;

    this._foodSpawner.update(dt);

    for (const ant of this._ants) {
      if (ant.update(dt)) this._foodCollected++;
    }

    this._renderer.syncFood(this._grid);
    this._renderer.syncAnts(this._ants);
    this._renderer.render(timestamp);

    this._ui.foodGround.textContent = this._grid.countFood();
    this._ui.foodCollected.textContent = this._foodCollected;

    requestAnimationFrame(this._tick);
  }
}

new AntSimulator();
