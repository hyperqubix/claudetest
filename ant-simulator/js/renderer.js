import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';

const GRID_CENTER_X = (CONFIG.GRID_SIZE - 1) / 2;
const GRID_CENTER_Z = (CONFIG.GRID_SIZE - 1) / 2;
const TILE_TOP = CONFIG.TILE_HEIGHT;
const FOOD_BASE_Y = TILE_TOP + CONFIG.FOOD_SIZE / 2 + 0.05;
const ANT_BASE_Y = TILE_TOP + CONFIG.ANT_SIZE / 2 + 0.02;

export class Renderer {
  constructor() {
    this._scene = new THREE.Scene();
    this._foodMeshes = new Map(); // "x,y" -> THREE.Mesh
    this._antMeshes = new Map();  // ant.id -> THREE.Mesh

    this._initRenderer();
    this._initCamera();
    this._initLights();
    this._initControls();

    window.addEventListener('resize', () => this._onResize());
  }

  _initRenderer() {
    this._webgl = new THREE.WebGLRenderer({ antialias: true });
    this._webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._webgl.setSize(window.innerWidth, window.innerHeight);
    this._webgl.shadowMap.enabled = true;
    this._webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('canvas-container').appendChild(this._webgl.domElement);

    this._scene.background = new THREE.Color(CONFIG.COLORS.SKY);
    this._scene.fog = new THREE.FogExp2(CONFIG.COLORS.SKY, 0.018);
  }

  _initCamera() {
    this._camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this._camera.position.set(GRID_CENTER_X, 22, GRID_CENTER_Z + 18);
    this._camera.lookAt(GRID_CENTER_X, 0, GRID_CENTER_Z);
  }

  _initLights() {
    this._scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.0);
    sun.position.set(GRID_CENTER_X + 10, 30, GRID_CENTER_Z + 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.near = 1; sc.far = 80;
    sc.left = -16; sc.right = 26; sc.top = 26; sc.bottom = -16;
    this._scene.add(sun);
  }

  _initControls() {
    this._controls = new OrbitControls(this._camera, this._webgl.domElement);
    this._controls.target.set(GRID_CENTER_X, 0, GRID_CENTER_Z);
    this._controls.enableDamping = true;
    this._controls.dampingFactor = 0.08;
    this._controls.maxPolarAngle = Math.PI / 2.1;
    this._controls.minDistance = 5;
    this._controls.maxDistance = 55;
    this._controls.update();
  }

  /** Build static ground tiles. Call once after construction. */
  buildGround(grid) {
    const v = CONFIG.VOXEL_SIZE;
    const gGround = new THREE.BoxGeometry(v, CONFIG.TILE_HEIGHT, v);
    const matA = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.GROUND_A });
    const matB = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.GROUND_B });
    const matNest = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.NEST });

    for (let x = 0; x < grid.size; x++) {
      for (let y = 0; y < grid.size; y++) {
        const isNest = grid.isNest(x, y);
        const mat = isNest ? matNest : (x + y) % 2 === 0 ? matA : matB;
        const mesh = new THREE.Mesh(gGround, mat);
        mesh.position.set(x, CONFIG.TILE_HEIGHT / 2, y);
        mesh.receiveShadow = true;
        this._scene.add(mesh);
      }
    }
  }

  /**
   * Diff food meshes against current grid state, adding/removing as needed.
   * Call each frame before render().
   */
  syncFood(grid) {
    const alive = new Set();

    for (let x = 0; x < grid.size; x++) {
      for (let y = 0; y < grid.size; y++) {
        if (!grid.hasFood(x, y)) continue;
        const key = `${x},${y}`;
        alive.add(key);
        if (!this._foodMeshes.has(key)) {
          this._addFoodMesh(x, y, key);
        }
      }
    }

    for (const key of this._foodMeshes.keys()) {
      if (!alive.has(key)) this._removeFoodMesh(key);
    }
  }

  _addFoodMesh(x, y, key) {
    const geo = new THREE.BoxGeometry(CONFIG.FOOD_SIZE, CONFIG.FOOD_SIZE, CONFIG.FOOD_SIZE);
    const mat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.FOOD });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, FOOD_BASE_Y, y);
    mesh.castShadow = true;
    this._scene.add(mesh);
    this._foodMeshes.set(key, mesh);
  }

  _removeFoodMesh(key) {
    const mesh = this._foodMeshes.get(key);
    this._scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    this._foodMeshes.delete(key);
  }

  /**
   * Update ant meshes to match current ant state.
   * Ants use visual interpolated positions (vx, vy) from ant.update().
   * Call each frame before render().
   */
  syncAnts(ants) {
    for (const ant of ants) {
      if (!this._antMeshes.has(ant.id)) {
        this._addAntMesh(ant.id);
      }
      const mesh = this._antMeshes.get(ant.id);
      mesh.position.set(ant.vx, ANT_BASE_Y, ant.vy);
      mesh.material.color.setHex(
        ant.hasFood ? CONFIG.COLORS.ANT_WITH_FOOD : CONFIG.COLORS.ANT
      );
    }
  }

  _addAntMesh(id) {
    const s = CONFIG.ANT_SIZE;
    const geo = new THREE.BoxGeometry(s, s * 0.6, s * 1.4);
    const mat = new THREE.MeshLambertMaterial({ color: CONFIG.COLORS.ANT });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this._scene.add(mesh);
    this._antMeshes.set(id, mesh);
  }

  /**
   * Animate food bobbing and render the scene.
   * @param {number} totalMs - elapsed time in ms (from requestAnimationFrame timestamp)
   */
  render(totalMs) {
    for (const [key, mesh] of this._foodMeshes) {
      const [x, y] = key.split(',').map(Number);
      const bob = Math.sin(totalMs * 0.0022 + x * 1.37 + y * 0.71) * 0.055;
      mesh.position.y = FOOD_BASE_Y + bob;
    }
    this._controls.update();
    this._webgl.render(this._scene, this._camera);
  }

  _onResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._webgl.setSize(window.innerWidth, window.innerHeight);
  }
}
