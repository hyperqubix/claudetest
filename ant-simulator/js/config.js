export const CONFIG = Object.freeze({
  GRID_SIZE: 20,
  NUM_ANTS: 8,
  ANT_STEP_MS: 280,
  FOOD_SPAWN_INTERVAL_MS: 2200,
  MAX_FOOD_ON_GROUND: 14,
  NEST: { x: 10, y: 10 },

  VOXEL_SIZE: 0.92,
  TILE_HEIGHT: 0.5,
  FOOD_SIZE: 0.30,
  ANT_SIZE: 0.22,

  // Smooth movement: half-life in ms
  LERP_HALF_LIFE_MS: 55,

  COLORS: {
    SKY: 0x7ec8e3,
    GROUND_A: 0x8B7355,
    GROUND_B: 0x7A6548,
    NEST: 0xFFD700,
    FOOD: 0xFF3333,
    ANT: 0x1a1a1a,
    ANT_WITH_FOOD: 0xFF8C00,
  },
});
