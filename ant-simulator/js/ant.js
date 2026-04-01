import { CONFIG } from './config.js';

let _nextId = 0;

export class Ant {
  constructor(grid) {
    this.id = _nextId++;
    this.grid = grid;
    this.x = CONFIG.NEST.x;
    this.y = CONFIG.NEST.y;
    this.hasFood = false;
    // Smooth visual position interpolated each frame
    this.vx = CONFIG.NEST.x;
    this.vy = CONFIG.NEST.y;
    this._stepAccum = 0;
  }

  /**
   * Advances the ant by dtMs milliseconds.
   * @returns {boolean} true if food was deposited at the nest this tick
   */
  update(dtMs) {
    // Frame-rate independent lerp toward grid position
    const alpha = Math.pow(0.5, dtMs / CONFIG.LERP_HALF_LIFE_MS);
    this.vx = this.x + (this.vx - this.x) * alpha;
    this.vy = this.y + (this.vy - this.y) * alpha;

    this._stepAccum += dtMs;
    if (this._stepAccum < CONFIG.ANT_STEP_MS) return false;
    this._stepAccum -= CONFIG.ANT_STEP_MS;
    return this._step();
  }

  _step() {
    if (this.hasFood) {
      this._moveTowardNest();
    } else {
      this._randomWalk();
    }

    // Pick up food on current cell
    if (!this.hasFood && this.grid.hasFood(this.x, this.y)) {
      this.hasFood = true;
      this.grid.takeFood(this.x, this.y);
    }

    // Deposit food when back at nest
    if (this.hasFood && this.grid.isNest(this.x, this.y)) {
      this.hasFood = false;
      return true;
    }
    return false;
  }

  _randomWalk() {
    const nbrs = this.grid.neighbors(this.x, this.y);
    const [nx, ny] = nbrs[Math.floor(Math.random() * nbrs.length)];
    this.x = nx;
    this.y = ny;
  }

  _moveTowardNest() {
    const dx = CONFIG.NEST.x - this.x;
    const dy = CONFIG.NEST.y - this.y;
    if (dx === 0 && dy === 0) return;
    // Move along the longer axis first
    if (Math.abs(dx) >= Math.abs(dy)) {
      this.x += Math.sign(dx);
    } else {
      this.y += Math.sign(dy);
    }
  }
}
