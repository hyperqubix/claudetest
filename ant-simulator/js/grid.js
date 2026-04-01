import { CONFIG } from './config.js';

export class Grid {
  constructor() {
    this.size = CONFIG.GRID_SIZE;
    this._cells = Array.from({ length: this.size }, (_, x) =>
      Array.from({ length: this.size }, (_, y) => ({
        isNest: x === CONFIG.NEST.x && y === CONFIG.NEST.y,
        hasFood: false,
      }))
    );
  }

  inBounds(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  isNest(x, y) {
    return x === CONFIG.NEST.x && y === CONFIG.NEST.y;
  }

  hasFood(x, y) {
    return this._cells[x][y].hasFood;
  }

  /** Returns true if food was placed successfully */
  placeFood(x, y) {
    if (!this.isNest(x, y) && !this._cells[x][y].hasFood) {
      this._cells[x][y].hasFood = true;
      return true;
    }
    return false;
  }

  takeFood(x, y) {
    this._cells[x][y].hasFood = false;
  }

  countFood() {
    let n = 0;
    for (let x = 0; x < this.size; x++)
      for (let y = 0; y < this.size; y++)
        if (this._cells[x][y].hasFood) n++;
    return n;
  }

  /** Returns array of [nx, ny] tuples for orthogonal neighbors */
  neighbors(x, y) {
    return [[-1, 0], [1, 0], [0, -1], [0, 1]]
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => this.inBounds(nx, ny));
  }
}
