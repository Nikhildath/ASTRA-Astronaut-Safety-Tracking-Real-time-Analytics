import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GameAudio } from './audio';

/* ─────────────────────────────────────────────────────────────
   Tuning constants
   ───────────────────────────────────────────────────────────── */

const PLAYER_MODEL_URL = `${import.meta.env.BASE_URL}models/player_fighter/scene.gltf`;
const ENEMY_MODEL_URL = `${import.meta.env.BASE_URL}models/enemy_alien/scene.gltf`;

/** The models are authored nose-towards +Z, the game flies nose-towards -Z. */
const PLAYER_MODEL_YAW = Math.PI;
const ENEMY_MODEL_YAW = Math.PI;

const PLAYER_LENGTH = 7;
const ENEMY_LENGTH = 10;
const PLAYER_HIT_RADIUS = 2.4;

const BASE_SPEED = 44;
const BOOST_SPEED = 96;
const PITCH_RATE = 1.5;
const YAW_RATE = 1.1;
const ROLL_RATE = 2.2;
const LASER_SPEED = 320;
const ENEMY_LASER_SPEED = 150;
const FIRE_COOLDOWN = 0.135;
/** Long enough to cross the whole lock envelope: shots used to die mid-flight. */
const PLAYER_LASER_LIFE = 2.8;
const ENEMY_LASER_LIFE = 2.2;

/** Collectible coin trails. */
const COIN_POOL = 160;
const COIN_VALUE = 25;
const COIN_MAGNET = 26;
const COIN_PICKUP_RADIUS = 8;

/** Automatic target lock: acquire a raider ahead, then the guns track it. */
const LOCK_CONE = 0.5; // cos of the half-angle the nose must cover to acquire
const LOCK_BREAK_CONE = 0.2; // looser, so a lock survives a bit of manoeuvring
const LOCK_RANGE = 470;
const LOCK_BREAK_RANGE = 560;
const LOCK_TIME = 0.4;
const HOMING_TURN = 3.6; // radians per second a locked shot may steer

const ROCKS = 130;

/** Cinematic beats: a kill briefly drops into slow motion and punches the camera in. */
const KILL_SLOWMO = 0.22;
const KILL_SLOWMO_RECOVER = 5.5;
const KILL_CAM_TIME = 0.5;
const CHAIN_WINDOW = 3.2;
const PARTICLE_CAPACITY = 1400;

/** Discoverable worlds: fly to one, dive in, fight on its surface, break orbit. */
const PLANET_RADIUS_MIN = 115;
const PLANET_RADIUS_MAX = 215;
const PLANET_SPAWN_MIN = 520;
const PLANET_SPAWN_MAX = 800;
const PLANET_MAX = 2;
/** Seconds of surface combat before the squadron extracts. */
const PLANET_SURVIVE = 30;
const PLANET_BONUS = 600;
const RIDGES = 30;
const PLANET_ENTRY_RANGE = 1.45; // trigger distance as a multiple of the planet radius

export type GameState = 'loading' | 'ready' | 'running' | 'paused' | 'over';

export type GameStats = {
  score: number;
  kills: number;
  hull: number;
  energy: number;
  wave: number;
  time: number;
  boosting: boolean;
  enemies: number;
  coins: number;
  combo: number;
  /** Raiders destroyed back-to-back inside the chain window. */
  chain: number;
  /** 1 right after a kill, decaying to 0 — drives the kill banner and letterbox. */
  killFlash: number;
  /** 1 right after taking hull damage, decaying to 0 — drives the damage vignette. */
  damageFlash: number;
  /** 0–1 lock-on progress against the current target. */
  lock: number;
  locked: boolean;
  /** 'space' during the chase, 'planet' while fighting on a surface. */
  realm: 'space' | 'planet';
  /** Name of the world you are on, or the one you are closing on. */
  worldName: string;
  /** 0–1 closeness to an enterable world. */
  worldPrompt: number;
  /** 0–1 surface-survival objective progress. */
  worldProgress: number;
  /** 0–1 flash driving the re-entry / extraction card. */
  worldFlash: number;
  worldLabel: string;
  worlds: number;
  /** Raiders currently pressing the attack (nose on you, guns hot). */
  attackers: number;
  /** True while the hull is patching itself back up. */
  regen: boolean;
};

export type GameCallbacks = {
  onState: (state: GameState) => void;
  onStats: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  onError: (message: string) => void;
  onLoadingProgress?: (progress: number, stepText: string) => void;
};

/* ─────────────────────────────────────────────────────────────
   Small helpers
   ───────────────────────────────────────────────────────────── */

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, -1);
/** Shortest distance from a point to the segment a→b (swept-shot collision). */
function distanceToSegment(point: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const apx = point.x - a.x;
  const apy = point.y - a.y;
  const apz = point.z - a.z;
  const lengthSq = abx * abx + aby * aby + abz * abz;
  const t = lengthSq > 0 ? Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / lengthSq)) : 0;
  const dx = apx - abx * t;
  const dy = apy - aby * t;
  const dz = apz - abz * t;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

const LASER_AXIS = new THREE.Vector3(0, 0, 1);
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();

/** Dispose a subtree's geometry, materials and any textures those materials hold. */
function disposeObject(root: THREE.Object3D) {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    const list = Array.isArray(material) ? material : material ? [material] : [];
    for (const mat of list) {
      for (const value of Object.values(mat as unknown as Record<string, unknown>)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      mat.dispose();
    }
  });
}

function glowTexture(inner: string, outer: string, size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.35, outer);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** White-on-transparent lock brackets, tinted per lock state by the sprite material. */
function lockReticleTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const radius = size * 0.33;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = size * 0.026;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate((Math.PI / 2) * i + Math.PI / 4);
      ctx.beginPath();
      ctx.arc(0, 0, radius, -0.44, 0.44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(radius * 0.66, 0);
      ctx.lineTo(radius * 0.82, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(c, c, size * 0.016, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Procedural equirectangular nebula used as the cinematic skybox + PBR environment. */
function spaceBackdropTexture() {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#03040b';
    ctx.fillRect(0, 0, w, h);

    const clouds = [
      { x: 0.2, y: 0.4, r: 0.3, color: [88, 40, 190] },
      { x: 0.32, y: 0.55, r: 0.22, color: [0, 150, 190] },
      { x: 0.63, y: 0.35, r: 0.26, color: [150, 30, 140] },
      { x: 0.78, y: 0.62, r: 0.3, color: [30, 70, 180] },
      { x: 0.5, y: 0.15, r: 0.32, color: [20, 40, 90] },
      { x: 0.05, y: 0.75, r: 0.24, color: [110, 30, 90] },
    ];

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) {
      const base = clouds[i % clouds.length];
      const cx = (base.x + (Math.random() - 0.5) * 0.42) * w;
      const cy = (base.y + (Math.random() - 0.5) * 0.42) * h;
      const radius = base.r * w * (0.35 + Math.random() * 0.8);
      const [r, g, b] = base.color;
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const alpha = 0.05 + Math.random() * 0.09;
      gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
      gradient.addColorStop(0.45, `rgba(${r * 0.7},${g * 0.6},${b},${alpha * 0.45})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dust lane / milky band
    const band = ctx.createLinearGradient(0, h * 0.3, w, h * 0.75);
    band.addColorStop(0, 'rgba(30,60,120,0)');
    band.addColorStop(0.5, 'rgba(90,120,220,0.1)');
    band.addColorStop(1, 'rgba(30,60,120,0)');
    ctx.fillStyle = band;
    ctx.fillRect(0, h * 0.3, w, h * 0.45);

    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3200; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 1.35;
      const tint = Math.random();
      const c =
        tint > 0.9 ? '255,220,190' : tint > 0.78 ? '190,220,255' : tint > 0.66 ? '255,255,255' : '210,225,255';
      ctx.fillStyle = `rgba(${c},${0.25 + Math.random() * 0.75})`;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/* ─────────────────────────────────────────────────────────────
   Discoverable worlds
   ───────────────────────────────────────────────────────────── */

export type PlanetPalette = {
  id: string;
  name: string;
  /** Surface blob colours, darkest → lightest. */
  surface: string[];
  atmosphere: number;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  fog: number;
  ground: number;
  accent: number;
};

const PLANET_PALETTES: PlanetPalette[] = [
  {
    id: 'khepri',
    name: 'KHEPRI-9',
    surface: ['#3a1206', '#8c3b12', '#d1802f', '#f3cf8d'],
    atmosphere: 0xff9a4d,
    skyTop: '#12060a',
    skyMid: '#5c1f0c',
    skyHorizon: '#e8913c',
    fog: 0x3a1708,
    ground: 0x8a5230,
    accent: 0xffb066,
  },
  {
    id: 'niflheim',
    name: 'NIFLHEIM',
    surface: ['#0d2233', '#2f6f92', '#9fd8ea', '#eaf7ff'],
    atmosphere: 0x9fe8ff,
    skyTop: '#04101c',
    skyMid: '#1d5a7a',
    skyHorizon: '#bfeaff',
    fog: 0x2b4b60,
    ground: 0x9fc4d8,
    accent: 0xd8fbff,
  },
  {
    id: 'aurelia',
    name: 'AURELIA',
    surface: ['#07231a', '#1d6b47', '#5ec08a', '#d9f7c4'],
    atmosphere: 0x8dffc0,
    skyTop: '#03140f',
    skyMid: '#0f4a3a',
    skyHorizon: '#8fe6b8',
    fog: 0x0b2a20,
    ground: 0x4e7f5c,
    accent: 0xb6ffcf,
  },
  {
    id: 'nyx',
    name: 'NYX-77',
    surface: ['#150a26', '#44207a', '#8f4bd6', '#e2b8ff'],
    atmosphere: 0xc07bff,
    skyTop: '#06030f',
    skyMid: '#2a1150',
    skyHorizon: '#b06bff',
    fog: 0x1b0b33,
    ground: 0x5b3f8f,
    accent: 0xdaa8ff,
  },
];

/** Blobby, cratered surface map for a world seen from orbit. */
function planetSurfaceTexture(palette: PlanetPalette) {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = palette.surface[1];
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 240; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const radius = rand(18, 180);
      const pick = Math.random();
      const color = palette.surface[pick > 0.62 ? 2 : pick > 0.3 ? 1 : 0];
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `${color}${pick > 0.6 ? 'cc' : '88'}`);
      gradient.addColorStop(0.55, `${color}44`);
      gradient.addColorStop(1, `${color}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crater rings
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      const radius = rand(6, 34);
      ctx.strokeStyle = `${palette.surface[0]}88`;
      ctx.lineWidth = rand(1, 3);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `${palette.surface[0]}55`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar caps / haze
    const cap = ctx.createLinearGradient(0, 0, 0, h);
    cap.addColorStop(0, `${palette.surface[3]}aa`);
    cap.addColorStop(0.18, `${palette.surface[3]}00`);
    cap.addColorStop(0.82, `${palette.surface[3]}00`);
    cap.addColorStop(1, `${palette.surface[3]}88`);
    ctx.fillStyle = cap;
    ctx.fillRect(0, 0, w, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Equirectangular sky for surface combat: horizon burn, haze bands, low sun. */
function planetSkyTexture(palette: PlanetPalette) {
  const w = 1600;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(0.42, palette.skyMid);
    gradient.addColorStop(0.64, palette.skyHorizon);
    gradient.addColorStop(0.75, palette.skyMid);
    gradient.addColorStop(1, palette.skyTop);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Low sun burning through the haze
    const sx = w * rand(0.24, 0.76);
    const sy = h * 0.6;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.28);
    glow.addColorStop(0, 'rgba(255,255,255,0.95)');
    glow.addColorStop(0.18, `${palette.surface[3]}dd`);
    glow.addColorStop(0.5, `${palette.surface[2]}55`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const y = h * rand(0.42, 0.78);
      const cx = Math.random() * w;
      const radius = w * rand(0.08, 0.34);
      const haze = ctx.createRadialGradient(cx, y, 0, cx, y, radius);
      haze.addColorStop(0, `${palette.surface[2]}33`);
      haze.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haze;
      ctx.beginPath();
      ctx.ellipse(cx, y, radius, radius * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Tiling cloud sea that scrolls beneath the ship on a planet surface. */
function cloudSeaTexture(palette: PlanetPalette) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let i = 0; i < 90; i++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const radius = rand(18, 86);
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `${palette.surface[2]}${i % 3 === 0 ? 'aa' : '66'}`);
      gradient.addColorStop(0.55, `${palette.surface[2]}22`);
      gradient.addColorStop(1, `${palette.surface[2]}00`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

/* ─────────────────────────────────────────────────────────────
   GPU particle pool (trails, sparks, explosions, warp flashes)
   ───────────────────────────────────────────────────────────── */

type Particle = {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
  drag: number;
  alpha: number;
};

class ParticlePool {
  readonly points: THREE.Points;
  private alive: Particle[] = [];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private texture: THREE.Texture;

  constructor(capacity: number) {
    this.positions = new Float32Array(capacity * 3);
    this.colors = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    this.alphas = new Float32Array(capacity);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setDrawRange(0, 0);

    this.texture = glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0.4)');

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.texture },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (420.0 / max(1.0, -mv.z));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vColor, 1.0) * tex.a * vAlpha;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
  }

  spawn(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    color: THREE.ColorRepresentation,
    size: number,
    life: number,
    drag = 1.4,
    alpha = 1,
  ) {
    if (this.alive.length >= this.positions.length / 3) return;
    this.alive.push({
      pos: pos.clone(),
      vel: vel.clone(),
      life,
      maxLife: life,
      size,
      color: new THREE.Color(color),
      drag,
      alpha,
    });
  }

  burst(
    pos: THREE.Vector3,
    color: THREE.ColorRepresentation,
    count: number,
    speed: number,
    size: number,
    life: number,
    spread = 1,
  ) {
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      const v = dir.multiplyScalar(rand(speed * 0.25, speed));
      v.y *= spread;
      this.spawn(pos, v, color, rand(size * 0.5, size), rand(life * 0.5, life), 1.1, 1);
    }
  }

  update(dt: number) {
    for (let i = this.alive.length - 1; i >= 0; i--) {
      const p = this.alive[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.alive[i] = this.alive[this.alive.length - 1];
        this.alive.pop();
        continue;
      }
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
    }

    const count = this.alive.length;
    for (let i = 0; i < count; i++) {
      const p = this.alive[i];
      const t = p.life / p.maxLife;
      this.positions[i * 3] = p.pos.x;
      this.positions[i * 3 + 1] = p.pos.y;
      this.positions[i * 3 + 2] = p.pos.z;
      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;
      this.sizes[i] = p.size * (0.4 + t * 0.9);
      this.alphas[i] = Math.min(1, t * 1.6) * p.alpha;
    }

    this.geometry.setDrawRange(0, count);
    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aColor as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (this.geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true;
  }

  clear() {
    this.alive.length = 0;
    this.geometry.setDrawRange(0, 0);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

/* ─────────────────────────────────────────────────────────────
   Entity types
   ───────────────────────────────────────────────────────────── */

type Enemy = {
  root: THREE.Group;
  hp: number;
  maxHp: number;
  vel: THREE.Vector3;
  fireTimer: number;
  age: number;
  radius: number;
  orbit: number;
  speed: number;
  trailTimer: number;
  warp: number;
  /** 'attack' runs the player down, 'break' peels off, 'circle' stalks at range. */
  mode: 'attack' | 'break' | 'circle';
  modeTimer: number;
  /** 0.7–1 — how tight this pilot holds its aim and how long its bursts are. */
  aggression: number;
  /** Seconds of muzzle charge left before a burst; telegraphs the shot. */
  charge: number;
  burst: number;
  burstTimer: number;
  strafe: number;
};

type Laser = {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  hostile: boolean;
  /** Radians per second this shot may steer toward `target`; 0 for dumb fire. */
  homing: number;
  target: Enemy | null;
};

type Dying = {
  root: THREE.Object3D;
  vel: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
  maxLife: number;
};

type Coin = {
  pos: THREE.Vector3;
  active: boolean;
  spin: number;
  bob: number;
};

type Rock = {
  pos: THREE.Vector3;
  rot: THREE.Euler;
  spin: THREE.Vector3;
  scale: number;
};

type Planet = {
  root: THREE.Group;
  radius: number;
  palette: PlanetPalette;
};

/* ─────────────────────────────────────────────────────────────
   Engine
   ───────────────────────────────────────────────────────────── */

export class SpaceChaseEngine {
  private mount: HTMLElement;
  private cb: GameCallbacks;
  private audio = new GameAudio();

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private clock = new THREE.Clock();
  private particles: ParticlePool;

  private player = new THREE.Group();
  private playerModel: THREE.Object3D | null = null;
  private enemyTemplate: THREE.Object3D | null = null;
  private shipGlow: THREE.Sprite | null = null;

  private enemies: Enemy[] = [];
  private lasers: Laser[] = [];
  private rocks: Rock[] = [];
  private rockMesh: THREE.InstancedMesh;
  private flashLight: THREE.PointLight;
  private shockwaves: { mesh: THREE.Mesh; life: number; maxLife: number; grow: number }[] = [];

  private laserGeo: THREE.CylinderGeometry;
  private laserGlowGeo: THREE.CylinderGeometry;
  private playerLaserMat: THREE.MeshBasicMaterial;
  private playerLaserGlowMat: THREE.MeshBasicMaterial;
  private enemyLaserMat: THREE.MeshBasicMaterial;
  private enemyLaserGlowMat: THREE.MeshBasicMaterial;
  private lockReticle: THREE.Sprite | null = null;
  private lockTarget: Enemy | null = null;
  private lockProgress = 0;

  private spaceBackdrop: THREE.Texture;
  private stars: THREE.Points;
  private sunSprite: THREE.Sprite;
  private hemiLight: THREE.HemisphereLight;
  private accentLight: THREE.DirectionalLight;
  private rockMat: THREE.MeshStandardMaterial;

  private planets: Planet[] = [];
  private planetGroup = new THREE.Group();
  private planetTimer = 4;
  private nearPlanet: Planet | null = null;
  private worldPrompt = 0;
  private realm: 'space' | 'planet' = 'space';
  private realmPalette: PlanetPalette | null = null;
  private realmTimer = 0;
  private worlds = 0;
  private worldBonus = 0;
  private skyTexture: THREE.Texture | null = null;
  private cloudTexture: THREE.Texture | null = null;
  private cloudSea: THREE.Mesh;
  private ridgeGroup = new THREE.Group();
  private ridgeMesh: THREE.InstancedMesh;
  private transition: { phase: 'enter' | 'exit'; t: number; duration: number; applied: boolean } | null = null;
  private pendingPalette: PlanetPalette | null = null;
  private worldFlash = 0;
  private worldLabel = '';

  private dying: Dying[] = [];
  private timeScale = 1;
  private zoomPunch = 0;
  private cinematicTimer = 0;
  private cinematicFocus = new THREE.Vector3();
  private killChain = 0;
  private chainTimer = 0;
  private killFlash = 0;
  private damageFlash = 0;

  private coins: Coin[] = [];
  private coinMesh: THREE.InstancedMesh;
  private coinGeo: THREE.TorusGeometry;
  private coinMat: THREE.MeshStandardMaterial;
  private coinTimer = 2;
  private coinsBanked = 0;
  private coinScore = 0;
  private coinCombo = 0;
  private comboTimer = 0;

  private keys = new Set<string>();
  private mouseDown = false;
  private touchSteer = new THREE.Vector2();
  private touchFire = false;
  private touchBoost = false;
  private touchRoll = 0;

  private state: GameState = 'loading';
  private disposed = false;
  private raf = 0;
  private resizeObserver: ResizeObserver;

  private hull = 100;
  /** Seconds of quiet before the hull starts patching itself back up. */
  private regenTimer = 0;
  private energy = 100;
  private kills = 0;
  private elapsed = 0;
  private waveNumber = 1;
  private boosting = false;
  private boostLocked = false;
  private fireTimer = 0;
  private hitCooldown = 0;
  private shake = 0;
  private speed = BASE_SPEED;
  private angular = new THREE.Vector3();
  private trailTimer = 0;
  private hudTimer = 0;
  private spawnTimer = 0;
  private cameraLook = new THREE.Vector3();
  private cameraUp = new THREE.Vector3(0, 1, 0);
  private dummy = new THREE.Object3D();

  constructor(mount: HTMLElement, cb: GameCallbacks) {
    this.mount = mount;
    this.cb = cb;

    const width = mount.clientWidth || 960;
    const height = mount.clientHeight || 560;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    mount.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(74, width / height, 0.1, 6000);
    this.camera.position.set(0, 3, 14);

    // ── Space backdrop ────────────────────────────────────
    this.spaceBackdrop = spaceBackdropTexture();
    this.scene.background = this.spaceBackdrop;
    this.scene.backgroundIntensity = 0.9;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const env = pmrem.fromEquirectangular(this.spaceBackdrop).texture;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.85;
    pmrem.dispose();

    const starCount = 2600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const dir = new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize();
      dir.multiplyScalar(rand(700, 2100));
      starPositions[i * 3] = dir.x;
      starPositions[i * 3 + 1] = dir.y;
      starPositions[i * 3 + 2] = dir.z;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starTex = glowTexture('rgba(255,255,255,1)', 'rgba(190,220,255,0.5)', 64);
    this.stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 7,
        map: starTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        color: 0xbfd8ff,
      }),
    );
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.sunSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture('rgba(255,255,240,1)', 'rgba(255,210,140,0.65)', 256),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.sunSprite.position.set(1500, 620, -1900);
    this.sunSprite.scale.setScalar(760);
    this.scene.add(this.sunSprite);

    // ── Lighting: dramatic sun + cold fill ────────────────
    this.hemiLight = new THREE.HemisphereLight(0x4a5d8f, 0x05060c, 0.6);
    this.scene.add(this.hemiLight);
    const sunLight = new THREE.DirectionalLight(0xfff2d8, 3.6);
    sunLight.position.set(140, 90, -160);
    this.scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x3f7fff, 1.4);
    fill.position.set(-120, -40, 80);
    this.scene.add(fill);
    this.accentLight = new THREE.DirectionalLight(0xa855f7, 1.1);
    this.accentLight.position.set(0, 60, 140);
    this.scene.add(this.accentLight);

    this.flashLight = new THREE.PointLight(0xffb066, 0, 300, 2);
    this.scene.add(this.flashLight);

    // ── Target lock reticle ───────────────────────────────
    this.lockReticle = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: lockReticleTexture(),
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    this.lockReticle.visible = false;
    this.lockReticle.renderOrder = 20;
    this.scene.add(this.lockReticle);

    // ── Coin trails ───────────────────────────────────────
    this.coinGeo = new THREE.TorusGeometry(1.25, 0.34, 8, 20);
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffc02e,
      emissive: 0xff9500,
      emissiveIntensity: 2.4,
      metalness: 0.95,
      roughness: 0.22,
    });
    this.coinMesh = new THREE.InstancedMesh(this.coinGeo, this.coinMat, COIN_POOL);
    this.coinMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.coinMesh.frustumCulled = false;
    this.dummy.scale.setScalar(0);
    this.dummy.updateMatrix();
    for (let i = 0; i < COIN_POOL; i++) {
      this.coinMesh.setMatrixAt(i, this.dummy.matrix);
      this.coins.push({ pos: new THREE.Vector3(), active: false, spin: 0, bob: 0 });
    }
    this.scene.add(this.coinMesh);


    // ── Asteroids ────────────────────────────────────────
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const positions = rockGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(positions, i);
      v.multiplyScalar(rand(0.78, 1.18));
      positions.setXYZ(i, v.x, v.y, v.z);
    }
    rockGeo.computeVertexNormals();
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x7a7f8c,
      roughness: 0.95,
      metalness: 0.15,
      flatShading: true,
    });
    this.rockMesh = new THREE.InstancedMesh(rockGeo, this.rockMat, ROCKS);
    this.rockMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.rockMesh.frustumCulled = false;
    this.scene.add(this.rockMesh);
    for (let i = 0; i < ROCKS; i++) {
      const rock: Rock = {
        pos: new THREE.Vector3(),
        rot: new THREE.Euler(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2)),
        spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.4, 0.4), rand(-0.4, 0.4)),
        scale: 2,
      };
      this.placeRock(rock, true);
      this.rocks.push(rock);
    }
    this.syncRockMatrices();

    // ── Planet-surface layer (hidden until you dive in) ──
    this.cloudSea = new THREE.Mesh(
      new THREE.PlaneGeometry(4600, 4600),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    );
    this.cloudSea.rotation.x = -Math.PI / 2;
    this.cloudSea.visible = false;
    this.scene.add(this.cloudSea);

    // Distant ridge line that puts a horizon under the fight on a surface.
    const ridgeGeo = new THREE.IcosahedronGeometry(1, 0);
    ridgeGeo.translate(0, 0.45, 0);
    this.ridgeMesh = new THREE.InstancedMesh(
      ridgeGeo,
      new THREE.MeshStandardMaterial({ color: 0x2a2a33, roughness: 1, metalness: 0, flatShading: true }),
      RIDGES,
    );
    this.ridgeMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    this.ridgeMesh.frustumCulled = false;
    this.ridgeMesh.visible = false;
    this.ridgeGroup.add(this.ridgeMesh);
    this.scene.add(this.ridgeGroup);

    this.scene.add(this.planetGroup);
    this.spawnPlanet();
    this.spawnPlanet();

    // ── Player ship container + engine glow ──────────────
    this.scene.add(this.player);
    this.player.position.set(0, 0, 0);
    const exhaustTex = glowTexture('rgba(210,250,255,1)', 'rgba(0,190,255,0.7)', 128);
    this.shipGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: exhaustTex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        color: 0x66eaff,
      }),
    );
    this.shipGlow.position.set(0, 0, PLAYER_LENGTH * 0.42);
    this.shipGlow.scale.setScalar(2.8);
    this.player.add(this.shipGlow);

    // ── Particle systems ─────────────────────────────────
    this.particles = new ParticlePool(PARTICLE_CAPACITY);
    this.scene.add(this.particles.points);

    // ── Lasers ───────────────────────────────────────────
    this.laserGeo = new THREE.CylinderGeometry(0.075, 0.075, 3.4, 6, 1, true);
    this.laserGeo.rotateX(Math.PI / 2);
    this.laserGlowGeo = new THREE.CylinderGeometry(0.26, 0.26, 4.6, 6, 1, true);
    this.laserGlowGeo.rotateX(Math.PI / 2);

    this.playerLaserMat = new THREE.MeshBasicMaterial({
      color: 0x9ffcff,
      transparent: true,
      opacity: 1,
      toneMapped: false,
    });
    this.playerLaserGlowMat = new THREE.MeshBasicMaterial({
      color: 0x2bd9ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    this.enemyLaserMat = new THREE.MeshBasicMaterial({
      color: 0xffd7a3,
      transparent: true,
      opacity: 1,
      toneMapped: false,
    });
    this.enemyLaserGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff5a1f,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    // ── Post-processing (bloom) ──────────────────────────
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.85, 0.6, 0.72);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(mount);

    this.bindEvents();
    this.animate();
    void this.loadModels();
  }

  /* ─── Loading ─────────────────────────────────────────── */

  private async loadModels() {
    this.cb.onState('loading');
    this.cb.onLoadingProgress?.(15, 'INITIALIZING THREE.JS WEBGL RENDER CONTEXT...');
    try {
      const loader = new GLTFLoader();
      let p1 = 0;
      let p2 = 0;
      const updateProg = (step: string) => {
        const total = Math.min(95, Math.round(20 + (p1 + p2) * 37));
        this.cb.onLoadingProgress?.(total, step);
      };

      const [playerGltf, enemyGltf] = await Promise.all([
        loader.loadAsync(
          PLAYER_MODEL_URL,
          (xhr) => {
            if (xhr.lengthComputable && xhr.total > 0) {
              p1 = xhr.loaded / xhr.total;
              updateProg('STREAMING FIGHTER AIRFRAME & PBR CERAMIC MESH...');
            }
          }
        ),
        loader.loadAsync(
          ENEMY_MODEL_URL,
          (xhr) => {
            if (xhr.lengthComputable && xhr.total > 0) {
              p2 = xhr.loaded / xhr.total;
              updateProg('DECODING ALIEN BIO-MECHANICAL ENEMY HULL...');
            }
          }
        ),
      ]);
      if (this.disposed) return;

      this.cb.onLoadingProgress?.(96, 'COMPILING SHADER PIPELINE & STARFIELD BUFFERS...');
      this.enemyTemplate = enemyGltf.scene;

      const playerShip = this.prepareModel(playerGltf.scene, PLAYER_LENGTH, PLAYER_MODEL_YAW);
      this.playerModel = playerShip;
      this.player.add(playerShip);

      this.cb.onLoadingProgress?.(100, 'ALL FLIGHT SYSTEMS NOMINAL // READY');
      this.state = 'ready';
      this.cb.onState('ready');
    } catch (err) {
      console.error('Failed to load spacecraft models', err);
      this.cb.onError('Could not load the spacecraft models.');
    }
  }

  /** Scale/centre a model and orient its nose along local -Z. */
  private prepareModel(source: THREE.Object3D, targetLength: number, yaw: number) {
    const model = source;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = targetLength / Math.max(size.x, size.y, size.z, 0.001);
    model.scale.multiplyScalar(scale);
    model.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.sub(center);

    const holder = new THREE.Group();
    holder.add(model);
    holder.rotation.y = yaw;
    return holder;
  }

  /* ─── Public lifecycle ───────────────────────────────── */

  start() {
    if (this.state !== 'ready' && this.state !== 'paused') return;
    this.audio.unlock();
    this.audio.startEngine();
    this.playerModelOrientationReset();
    this.state = 'running';
    this.cameraLook.copy(this.player.position).add(new THREE.Vector3(0, 0, -26));
    this.clock.getDelta();
    this.cb.onState('running');
  }

  private playerModelOrientationReset() {
    if (this.playerModel) this.playerModel.rotation.y = PLAYER_MODEL_YAW;
  }

  pause() {
    if (this.state !== 'running') return;
    this.resetTouchInput();
    this.dropLock();
    this.timeScale = 1;
    this.state = 'paused';
    this.audio.setThrottle(0);
    this.audio.stopEngine();
    this.cb.onState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    this.audio.unlock();
    this.audio.startEngine();
    this.state = 'running';
    this.clock.getDelta();
    this.cb.onState('running');
  }

  restart() {
    this.clearEntities();
    this.resetTouchInput();
    this.dropLock();
    this.hull = 100;
    this.energy = 100;
    this.kills = 0;
    this.elapsed = 0;
    this.waveNumber = 1;
    this.timeScale = 1;
    this.zoomPunch = 0;
    this.cinematicTimer = 0;
    this.killChain = 0;
    this.chainTimer = 0;
    this.killFlash = 0;
    this.damageFlash = 0;
    this.speed = BASE_SPEED;
    this.boostLocked = false;
    this.fireTimer = 0;
    this.spawnTimer = 0.4;
    this.hitCooldown = 0;
    this.regenTimer = 0;
    this.shake = 0;
    this.player.visible = true;
    this.player.position.set(0, 0, 0);
    this.player.quaternion.identity();
    this.playerModelOrientationReset();
    this.angular.set(0, 0, 0);
    this.cameraLook.set(0, 0, -20);
    this.camera.position.set(0, 3, 14);
    this.particles.clear();
    this.resetCoins();
    this.rocks.forEach(rock => this.placeRock(rock, true));
    this.syncRockMatrices();
    this.resetWorld();

    this.audio.unlock();
    this.audio.startEngine();
    this.state = 'running';
    this.clock.getDelta();
    this.cb.onState('running');
    this.emitStats();
  }

  setMuted(muted: boolean) {
    this.audio.setMuted(muted);
  }

  /* ─── Touch input (virtual stick + buttons) ──────────── */

  setTouchSteer(x: number, y: number) {
    this.touchSteer.set(
      THREE.MathUtils.clamp(x, -1, 1),
      THREE.MathUtils.clamp(y, -1, 1),
    );
  }

  setTouchFire(active: boolean) {
    this.touchFire = active;
  }

  setTouchBoost(active: boolean) {
    this.touchBoost = active;
  }

  setTouchRoll(direction: number) {
    this.touchRoll = THREE.MathUtils.clamp(direction, -1, 1);
  }

  private resetTouchInput() {
    this.touchSteer.set(0, 0);
    this.touchFire = false;
    this.touchBoost = false;
    this.touchRoll = 0;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.unbindEvents();
    this.audio.stopEngine();
    this.clearEntities();
    this.particles.dispose();
    this.laserGeo.dispose();
    this.laserGlowGeo.dispose();
    this.playerLaserMat.dispose();
    this.playerLaserGlowMat.dispose();
    this.enemyLaserMat.dispose();
    this.enemyLaserGlowMat.dispose();
    if (this.lockReticle) {
      const material = this.lockReticle.material as THREE.SpriteMaterial;
      material.map?.dispose();
      material.dispose();
    }
    this.rockMesh.geometry.dispose();
    (this.rockMesh.material as THREE.Material).dispose();
    this.coinGeo.dispose();
    this.coinMat.dispose();
    this.shockwaves.forEach(w => {
      w.mesh.geometry.dispose();
      (w.mesh.material as THREE.Material).dispose();
    });
    this.skyTexture?.dispose();
    this.cloudTexture?.dispose();
    this.scene.traverse(obj => disposeObject(obj));
    if (this.enemyTemplate) disposeObject(this.enemyTemplate);
    if (this.playerModel) disposeObject(this.playerModel);
    if (this.scene.background instanceof THREE.Texture) this.scene.background.dispose();
    if (this.scene.environment) this.scene.environment.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  /* ─── Events ─────────────────────────────────────────── */

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.state === 'running') this.pause();
      else if (this.state === 'paused') this.resume();
      return;
    }
    if (this.state === 'running' && e.code === 'KeyF') {
      this.enterPlanet();
      return;
    }
    if (this.state === 'running' && (e.code === 'Space' || e.code.startsWith('Arrow'))) {
      e.preventDefault();
    }
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  private onBlur = () => {
    this.keys.clear();
    this.mouseDown = false;
    this.resetTouchInput();
    if (this.state === 'running') this.pause();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button === 0) this.mouseDown = true;
  };

  private onPointerUp = () => {
    this.mouseDown = false;
  };

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  /* ─── Render loop ────────────────────────────────────── */

  private animate = () => {
    this.raf = requestAnimationFrame(this.animate);
    if (this.disposed) return;
    const realDt = Math.min(this.clock.getDelta(), 0.05);
    const dt = realDt * this.timeScale;

    if (this.state === 'running') {
      this.timeScale += (1 - this.timeScale) * (1 - Math.exp(-KILL_SLOWMO_RECOVER * realDt));
      this.update(dt, realDt);
    } else if (this.state === 'over') {
      this.particles.update(dt);
      this.updateShockwaves(dt);
      this.shake *= Math.exp(-dt * 3);
      this.updateCamera(dt, true);
    } else if (this.state === 'ready') {
      this.particles.update(dt);
      this.updateIdleCamera(dt);
    }

    this.composer.render();
  };

  private update(dt: number, realDt = dt) {
    this.elapsed += dt;
    this.waveNumber = 1 + Math.floor(this.elapsed / 22);

    this.updateLock(dt);
    this.updatePlayer(dt);
    this.updateEnemies(dt);
    this.updateLasers(dt);
    this.updateCoins(dt);
    this.updateDying(dt);
    this.updateAsteroids(dt);
    this.updateWorld(dt, realDt);
    this.particles.update(dt);
    this.updateShockwaves(dt);
    this.updateCamera(dt, false);

    this.killFlash = Math.max(0, this.killFlash - realDt / 1.05);
    this.damageFlash = Math.max(0, this.damageFlash - realDt / 0.65);
    if (this.chainTimer > 0) {
      this.chainTimer -= realDt;
      if (this.chainTimer <= 0) this.killChain = 0;
    }
    if (this.cinematicTimer > 0) this.cinematicTimer = Math.max(0, this.cinematicTimer - realDt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.enemies.length < this.targetEnemyCount()) {
      this.spawnEnemy();
      this.spawnTimer = 0.65;
    }

    this.shake *= Math.exp(-dt * 5.5);
    this.hudTimer -= realDt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitStats();
    }
    this.audio.setThrottle(this.boosting ? 1 : this.speed / BOOST_SPEED);
  }

  private updateIdleCamera(dt: number) {
    const t = this.clock.elapsedTime * 0.22;
    this.camera.position.set(Math.sin(t) * 12, 3.4 + Math.sin(t * 0.7) * 1.2, Math.cos(t) * 12);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    if (this.playerModel) {
      this.playerModel.rotation.y = PLAYER_MODEL_YAW + Math.sin(performance.now() * 0.0004) * 0.22;
    }
    if (this.shipGlow) {
      this.shipGlow.scale.setScalar(4 + Math.sin(performance.now() * 0.006) * 0.5);
    }
    this.particles.update(dt);
  }

  /* ─── Player ─────────────────────────────────────────── */

  private updatePlayer(dt: number) {
    const k = this.keys;
    const keyPitch = (k.has('ArrowUp') || k.has('KeyW') ? 1 : 0) - (k.has('ArrowDown') || k.has('KeyS') ? 1 : 0);
    const keyYaw = (k.has('ArrowLeft') || k.has('KeyA') ? 1 : 0) - (k.has('ArrowRight') || k.has('KeyD') ? 1 : 0);
    const keyRoll = (k.has('KeyQ') ? 1 : 0) - (k.has('KeyE') ? 1 : 0);
    // Stick: x right-positive, y up-positive. Keyboard yaw is left-positive.
    const pitchInput = THREE.MathUtils.clamp(keyPitch + this.touchSteer.y, -1, 1);
    const yawInput = THREE.MathUtils.clamp(keyYaw - this.touchSteer.x, -1, 1);
    const rollInput = THREE.MathUtils.clamp(keyRoll + this.touchRoll, -1, 1);

    const smooth = 1 - Math.exp(-6 * dt);
    this.angular.x += (pitchInput * PITCH_RATE - this.angular.x) * smooth;
    this.angular.y += (yawInput * YAW_RATE - this.angular.y) * smooth;
    this.angular.z += (rollInput * ROLL_RATE + yawInput * 0.75 - this.angular.z) * smooth;

    const delta = _q1.setFromEuler(
      new THREE.Euler(this.angular.x * dt, this.angular.y * dt, this.angular.z * dt, 'XYZ'),
    );
    this.player.quaternion.multiply(delta).normalize();

    // Boost + energy
    const wantsBoost = k.has('ShiftLeft') || k.has('ShiftRight') || this.touchBoost;
    if (this.energy <= 1) this.boostLocked = true;
    if (this.energy > 28) this.boostLocked = false;
    this.boosting = wantsBoost && !this.boostLocked;
    if (this.boosting) {
      this.energy = Math.max(0, this.energy - 34 * dt);
    } else {
      this.energy = Math.min(100, this.energy + 17 * dt);
    }

    const targetSpeed = this.boosting ? BOOST_SPEED : BASE_SPEED;
    this.speed += (targetSpeed - this.speed) * (1 - Math.exp(-2.4 * dt));

    const forward = _v1.copy(FORWARD).applyQuaternion(this.player.quaternion);
    this.player.position.addScaledVector(forward, this.speed * dt);

    // Engine exhaust + trail particles
    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = this.boosting ? 0.012 : 0.028;
      const world = this.toWorld(new THREE.Vector3(0, 0, PLAYER_LENGTH * 0.44));
      const back = forward.clone().multiplyScalar(-rand(6, 22) - this.speed * 0.25);
      back.x += rand(-2.5, 2.5);
      back.y += rand(-2.5, 2.5);
      back.z += rand(-2.5, 2.5);
      this.particles.spawn(
        world,
        back,
        this.boosting ? 0x9ff4ff : 0x3fc8ff,
        this.boosting ? rand(1.6, 3.4) : rand(1.0, 2.2),
        rand(0.22, 0.5),
        2.4,
        0.9,
      );
    }

    if (this.shipGlow) {
      this.shipGlow.scale.setScalar((this.boosting ? 4.4 : 2.9) + Math.sin(performance.now() * 0.02) * 0.25);
      (this.shipGlow.material as THREE.SpriteMaterial).color.setHex(this.boosting ? 0xbdf8ff : 0x39c9ff);
    }

    // Weapon
    this.fireTimer -= dt;
    if ((k.has('Space') || this.mouseDown || this.touchFire) && this.fireTimer <= 0) {
      this.fireTimer = FIRE_COOLDOWN;
      this.firePlayerLasers();
    }

    if (this.hitCooldown > 0) this.hitCooldown -= dt;

    // Nanite patching: five quiet seconds and the hull starts sealing itself,
    // which makes a long furball survivable without making damage free.
    if (this.state === 'running') {
      if (this.regenTimer > 0) {
        this.regenTimer -= dt;
      } else if (this.hull < 100) {
        this.hull = Math.min(100, this.hull + 6 * dt);
      }
    }

    if (Math.abs(this.player.position.x) > 4000 || Math.abs(this.player.position.y) > 4000 || Math.abs(this.player.position.z) > 4000) {
      this.player.position.multiplyScalar(0.2);
    }
  }

  private firePlayerLasers() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const target = this.lockProgress >= 1 ? this.lockTarget : null;
    const offsets = [
      new THREE.Vector3(-1.6, 0.05, -2.6),
      new THREE.Vector3(1.6, 0.05, -2.6),
    ];
    for (const offset of offsets) {
      const origin = this.toWorld(offset);
      const dir = target ? this.leadDirection(target, origin) : forward.clone();
      this.spawnLaser(origin, dir, false, target ? HOMING_TURN : 0, target);
    }
    this.shake = Math.min(1, this.shake + 0.16);
    const muzzle = this.toWorld(new THREE.Vector3(0, 0, -PLAYER_LENGTH * 0.42));
    this.particles.spawn(muzzle, forward.clone().multiplyScalar(30), 0xbffcff, 4, 0.1, 4, 1);
    this.audio.laser();
  }

  /* ─── Target lock ────────────────────────────────────── */

  /**
   * Lead the target so the shot meets it where it will be, not where it is.
   * The raiders flee and jink, so a straight-ahead shot almost always misses.
   */
  private leadDirection(target: Enemy, origin: THREE.Vector3) {
    const pos = target.root.position;
    let flight = origin.distanceTo(pos) / LASER_SPEED;
    for (let i = 0; i < 3; i++) {
      const predicted = _v2.copy(pos).addScaledVector(target.vel, flight);
      flight = origin.distanceTo(predicted) / LASER_SPEED;
    }
    return _v2.copy(pos).addScaledVector(target.vel, flight).sub(origin).normalize();
  }

  private dropLock() {
    this.lockTarget = null;
    this.lockProgress = 0;
    if (this.lockReticle) this.lockReticle.visible = false;
  }

  private updateLock(dt: number) {
    const forward = _v2.copy(FORWARD).applyQuaternion(this.player.quaternion);

    if (this.lockTarget && !this.enemies.includes(this.lockTarget)) this.dropLock();

    // Hold the lock while the raider stays roughly ahead and in range.
    if (this.lockTarget) {
      const toTarget = _v1.subVectors(this.lockTarget.root.position, this.player.position);
      const distance = toTarget.length();
      const facing = distance > 0.001 ? forward.dot(toTarget.divideScalar(distance)) : 1;
      if (distance > LOCK_BREAK_RANGE || facing < LOCK_BREAK_CONE) this.dropLock();
    }

    // Otherwise pick the raider nearest to the nose cone.
    if (!this.lockTarget) {
      let best: Enemy | null = null;
      let bestScore = Infinity;
      for (const enemy of this.enemies) {
        if (enemy.warp < 0.35) continue;
        const toEnemy = _v1.subVectors(enemy.root.position, this.player.position);
        const distance = toEnemy.length();
        if (distance > LOCK_RANGE || distance < 0.001) continue;
        const facing = forward.dot(toEnemy.divideScalar(distance));
        if (facing < LOCK_CONE) continue;
        const score = distance * (1.7 - facing);
        if (score < bestScore) {
          bestScore = score;
          best = enemy;
        }
      }
      if (best) {
        this.lockTarget = best;
        this.lockProgress = 0;
      }
    }

    if (this.lockTarget) {
      this.lockProgress = Math.min(1, this.lockProgress + dt / LOCK_TIME);
    } else {
      this.lockProgress = Math.max(0, this.lockProgress - dt * 3);
    }

    const reticle = this.lockReticle;
    if (!reticle) return;
    if (!this.lockTarget) {
      reticle.visible = false;
      return;
    }

    const distance = this.player.position.distanceTo(this.lockTarget.root.position);
    const locked = this.lockProgress >= 1;
    const pulse = 1 + Math.sin(performance.now() * 0.012) * 0.05;
    reticle.visible = true;
    reticle.position.copy(this.lockTarget.root.position);
    reticle.scale.setScalar((6 + distance * 0.075) * pulse * (0.68 + this.lockProgress * 0.32));
    const material = reticle.material as THREE.SpriteMaterial;
    material.opacity = 0.35 + this.lockProgress * 0.65;
    material.color.setHex(locked ? 0xffb020 : 0x40e0ff);
    material.rotation += dt * (locked ? 0.5 : 2.6);
  }

  /* ─── Lasers ─────────────────────────────────────────── */

  private spawnLaser(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    hostile: boolean,
    homing = 0,
    target: Enemy | null = null,
  ) {
    const mesh = new THREE.Mesh(this.laserGeo, hostile ? this.enemyLaserMat : this.playerLaserMat);
    mesh.position.copy(origin);
    mesh.quaternion.setFromUnitVectors(LASER_AXIS, dir);
    const glow = new THREE.Mesh(
      this.laserGlowGeo,
      hostile ? this.enemyLaserGlowMat : this.playerLaserGlowMat,
    );
    mesh.add(glow);
    this.scene.add(mesh);
    this.lasers.push({
      mesh,
      vel: dir.clone().multiplyScalar(hostile ? ENEMY_LASER_SPEED : LASER_SPEED),
      life: hostile ? ENEMY_LASER_LIFE : PLAYER_LASER_LIFE,
      hostile,
      homing,
      target,
    });
  }

  private updateLasers(dt: number) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.life -= dt;

      // Locked shots steer toward their target so the player only has to keep
      // the reticle roughly ahead, not solve the raider's jinking by hand.
      const homingTarget = laser.homing > 0 ? laser.target : null;
      if (homingTarget) {
        if (!this.enemies.includes(homingTarget)) {
          laser.homing = 0;
          laser.target = null;
        } else {
          const speed = laser.vel.length();
          const current = _v1.copy(laser.vel).divideScalar(speed || 1);
          const desired = _v2.copy(homingTarget.root.position).sub(laser.mesh.position).normalize();
          const angle = current.angleTo(desired);
          if (angle > 1e-4) {
            const axis = new THREE.Vector3().crossVectors(current, desired);
            if (axis.lengthSq() < 1e-6) axis.copy(UP);
            current.applyAxisAngle(axis.normalize(), Math.min(angle, laser.homing * dt)).normalize();
            laser.vel.copy(current).multiplyScalar(speed);
            laser.mesh.quaternion.setFromUnitVectors(LASER_AXIS, current);
          }
        }
      }

      // Swept collision: at 250 units/s a shot can move further per frame than
      // a target is wide, so test the whole travel segment, not just the endpoint.
      const previous = _v1.copy(laser.mesh.position);
      laser.mesh.position.addScaledVector(laser.vel, dt);
      let dead = laser.life <= 0;

      if (!dead && laser.hostile) {
        if (distanceToSegment(this.player.position, previous, laser.mesh.position) < PLAYER_HIT_RADIUS + 1.2) {
          this.damagePlayer(7, laser.mesh.position);
          dead = true;
        }
      } else if (!dead) {
        for (const enemy of this.enemies) {
          if (distanceToSegment(enemy.root.position, previous, laser.mesh.position) < enemy.radius + 2) {
            this.hitEnemy(enemy, laser.mesh.position);
            dead = true;
            break;
          }
        }
        if (!dead) {
          for (const rock of this.rocks) {
            if (distanceToSegment(rock.pos, previous, laser.mesh.position) < rock.scale + 1.2) {
              this.destroyRock(rock, laser.mesh.position);
              dead = true;
              break;
            }
          }
        }
      }

      if (dead) {
        this.scene.remove(laser.mesh);
        this.lasers.splice(i, 1);
      }
    }
  }

  /* ─── Asteroids ──────────────────────────────────────── */

  private placeRock(rock: Rock, aroundPlayer: boolean) {
    const dir = new THREE.Vector3(rand(-1, 1), rand(-0.55, 0.55), rand(-1, 1)).normalize();
    const distance = rand(95, 340);
    rock.pos.copy(this.player.position).addScaledVector(dir, aroundPlayer ? distance : distance * 1.4);
    // On a surface the same debris reads as floating spires and mesas.
    rock.scale = rand(2, 11) * (this.realm === 'planet' ? 2.4 : 1);
    rock.rot.set(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));
  }

  private syncRockMatrices() {
    const matrix = this.dummy;
    for (let i = 0; i < this.rocks.length; i++) {
      const rock = this.rocks[i];
      matrix.position.copy(rock.pos);
      matrix.rotation.copy(rock.rot);
      matrix.scale.setScalar(rock.scale);
      matrix.updateMatrix();
      this.rockMesh.setMatrixAt(i, matrix.matrix);
    }
    this.rockMesh.instanceMatrix.needsUpdate = true;
  }

  private updateAsteroids(dt: number) {
    const matrix = this.dummy;
    for (let i = 0; i < this.rocks.length; i++) {
      const rock = this.rocks[i];
      rock.rot.x += rock.spin.x * dt;
      rock.rot.y += rock.spin.y * dt;
      rock.rot.z += rock.spin.z * dt;

      if (rock.pos.distanceToSquared(this.player.position) > 420 * 420) {
        this.placeRock(rock, true);
      }

      matrix.position.copy(rock.pos);
      matrix.rotation.copy(rock.rot);
      matrix.scale.setScalar(rock.scale);
      matrix.updateMatrix();
      this.rockMesh.setMatrixAt(i, matrix.matrix);

      if (
        this.hitCooldown <= 0 &&
        rock.pos.distanceTo(this.player.position) < rock.scale * 0.85 + PLAYER_HIT_RADIUS
      ) {
        this.damagePlayer(14, rock.pos, true);
        this.particles.burst(rock.pos, 0x9aa4b5, 22, 26, 2.4, 0.6);
        const push = rock.pos.clone().sub(this.player.position).normalize().multiplyScalar(55);
        rock.pos.add(push);
      }
    }
    this.rockMesh.instanceMatrix.needsUpdate = true;
  }

  private destroyRock(rock: Rock, at: THREE.Vector3) {
    this.particles.burst(at, 0xb9a894, 40, 32, 3.2, 0.8);
    this.particles.burst(at, 0x6b7280, 18, 16, 4.5, 1.0);
    this.placeRock(rock, true);
  }

  /* ─── Enemies ────────────────────────────────────────── */

  private targetEnemyCount() {
    // Snowball from a duel into a full squadron: 2 raiders, up to 6 on screen.
    return Math.min(6, 2 + Math.floor(this.waveNumber / 2));
  }

  /** Enemy lead: aim where the player will be, so flying straight is a mistake. */
  private leadShot(enemy: Enemy, playerVel: THREE.Vector3, distance: number) {
    return _v2
      .copy(this.player.position)
      .addScaledVector(playerVel, distance / ENEMY_LASER_SPEED)
      .sub(enemy.root.position)
      .normalize();
  }

  private spawnEnemy() {
    if (!this.enemyTemplate) return;

    const model = this.prepareModel(this.enemyTemplate.clone(true), ENEMY_LENGTH, ENEMY_MODEL_YAW);
    const root = new THREE.Group();
    root.add(model);

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const angle = rand(-0.95, 0.95);
    const spawnDir = forward
      .clone()
      .applyAxisAngle(UP, angle)
      .add(new THREE.Vector3(rand(-0.2, 0.2), rand(-0.3, 0.3), rand(-0.2, 0.2)))
      .normalize();
    root.position.copy(this.player.position).addScaledVector(spawnDir, rand(175, 245));
    root.scale.setScalar(0.05);

    this.scene.add(root);
    this.enemies.push({
      root,
      hp: Math.min(9, 3 + Math.floor(this.waveNumber / 2)),
      maxHp: Math.min(9, 3 + Math.floor(this.waveNumber / 2)),
      vel: spawnDir.clone().multiplyScalar(12),
      fireTimer: rand(1.4, 2.6),
      age: 0,
      radius: ENEMY_LENGTH * 0.42,
      orbit: Math.random() > 0.5 ? 1 : -1,
      speed: Math.min(72, 48 + this.waveNumber * 2.4),
      trailTimer: 0,
      warp: 0,
      mode: 'circle',
      modeTimer: rand(1.2, 2.8),
      aggression: rand(0.7, 1),
      charge: 0,
      burst: 0,
      burstTimer: 0,
      strafe: Math.random() > 0.5 ? 1 : -1,
    });

    this.particles.burst(root.position, 0x7fd6ff, 34, 40, 3, 0.55);
    this.particles.burst(root.position, 0xa855f7, 20, 24, 4, 0.7);
    this.audio.warp();
  }

  private updateEnemies(dt: number) {
    const playerVel = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(this.player.quaternion)
      .multiplyScalar(this.speed);
    // How many raiders may come nose-on at once: the duel grows into a furball.
    const attackSlots = Math.min(3, this.waveNumber < 3 ? 1 : this.waveNumber < 7 ? 2 : 3);
    let pressed = 0;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.age += dt;
      enemy.fireTimer -= dt;
      enemy.warp = Math.min(1, enemy.warp + dt * 2.4);
      enemy.root.scale.setScalar(THREE.MathUtils.lerp(0.05, 1, 1 - Math.pow(1 - enemy.warp, 3)));

      const toPlayer = _v1.subVectors(this.player.position, enemy.root.position);
      const distance = toPlayer.length();
      const dirToPlayer = toPlayer.clone().normalize();
      const side = new THREE.Vector3().crossVectors(dirToPlayer, UP);
      if (side.lengthSq() < 0.001) side.set(1, 0, 0);
      side.normalize();

      // A raider alternates between running you down, peeling off, and stalking
      // at range — so the fight is a dogfight, not a shooting gallery.
      enemy.modeTimer -= dt;
      if (enemy.mode === 'attack') {
        if (enemy.modeTimer <= 0 || distance < 55) {
          enemy.mode = 'break';
          enemy.modeTimer = rand(1.3, 2.4);
        }
      } else if (enemy.mode === 'break') {
        if (enemy.modeTimer <= 0) {
          enemy.mode = 'circle';
          enemy.modeTimer = rand(0.9, 2.2);
        }
      } else if (pressed < attackSlots && enemy.modeTimer <= 0 && distance < 620) {
        enemy.mode = 'attack';
        enemy.modeTimer = rand(3.4, 5.2);
        enemy.charge = rand(0.35, 0.6);
        enemy.fireTimer = rand(0.5, 1.2);
      }
      if (enemy.mode === 'attack') pressed += 1;

      let desiredDir: THREE.Vector3;
      let throttle: number;
      if (enemy.mode === 'attack') {
        // Cut the corner on where the player is going, not where it is.
        const intercept = this.player.position
          .clone()
          .addScaledVector(playerVel, (distance / LASER_SPEED) * 0.85)
          .sub(enemy.root.position)
          .normalize();
        desiredDir = intercept
          .addScaledVector(side, enemy.strafe * 0.16 + Math.sin(enemy.age * 2.1) * 0.1)
          .normalize();
        throttle = distance > 340 ? 1.3 : 1.04;
      } else if (enemy.mode === 'break') {
        desiredDir = dirToPlayer
          .clone()
          .multiplyScalar(-1)
          .addScaledVector(side, Math.sin(enemy.age * 3.6 + enemy.orbit))
          .add(new THREE.Vector3(0, Math.cos(enemy.age * 2.4) * 0.45, 0))
          .normalize();
        throttle = 1.22;
      } else {
        // Stalk: hold a ring around the player, weaving, waiting for a slot.
        const ring = 260;
        const tangent = new THREE.Vector3()
          .crossVectors(dirToPlayer, UP)
          .normalize()
          .multiplyScalar(enemy.orbit);
        desiredDir = tangent
          .multiplyScalar(0.9)
          .addScaledVector(dirToPlayer, ((ring - distance) / ring) * 0.9)
          .add(new THREE.Vector3(0, Math.sin(enemy.age * 1.7 + enemy.orbit) * 0.14, 0))
          .normalize();
        throttle = 0.82;
      }

      enemy.vel.lerp(desiredDir.multiplyScalar(enemy.speed * throttle), 1 - Math.exp(-3 * dt));
      enemy.root.position.addScaledVector(enemy.vel, dt);

      // Attackers hold their nose on you; everyone else flies where they look.
      const hunting = enemy.mode === 'attack';
      const moveDir = enemy.vel.lengthSq() > 1 ? enemy.vel.clone().normalize() : dirToPlayer;
      const lookMatrix = new THREE.Matrix4().lookAt(
        enemy.root.position,
        enemy.root.position.clone().add(hunting ? dirToPlayer : moveDir),
        UP,
      );
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);
      enemy.root.quaternion.slerp(targetQuat, 1 - Math.exp(-(hunting ? 4.2 : 2.6) * dt));

      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(enemy.root.quaternion);
      const muzzle = enemy.root.position.clone().addScaledVector(forward, enemy.radius * 0.8);

      // Head-on merge: ramming hurts both ships.
      if (distance < enemy.radius + PLAYER_HIT_RADIUS + 2) {
        this.damagePlayer(13, enemy.root.position);
        this.particles.burst(enemy.root.position, 0xffb066, 26, 30, 3, 0.5);
        enemy.hp -= 2;
        enemy.mode = 'break';
        enemy.modeTimer = rand(1.2, 2);
        if (enemy.hp <= 0) this.killEnemy(enemy);
        continue;
      }

      // Guns: a telegraphed charge, then a burst that leads the player's flight.
      if (hunting) {
        const aim = this.leadShot(enemy, playerVel, distance);
        const onNose = forward.dot(dirToPlayer);
        if (enemy.burst > 0) {
          enemy.burstTimer -= dt;
          if (enemy.burstTimer <= 0) {
            const spread = 0.003 + (1 - enemy.aggression) * 0.012 + distance * 0.00003;
            const jitter = new THREE.Vector3(rand(-spread, spread), rand(-spread, spread), rand(-spread, spread));
            this.spawnLaser(muzzle, aim.add(jitter).normalize(), true);
            this.particles.spawn(muzzle, aim.clone().multiplyScalar(30), 0xffb070, 5, 0.12, 3, 1);
            this.audio.enemyLaser();
            enemy.burst -= 1;
            enemy.burstTimer = 0.11;
          }
        } else if (enemy.charge > 0) {
          enemy.charge -= dt;
          if (Math.random() < 0.7) {
            this.particles.spawn(
              muzzle,
              forward.clone().multiplyScalar(rand(2, 8)),
              0xff7a3c,
              rand(0.7, 1.5),
              0.16,
              2,
              0.9,
            );
          }
          if (enemy.charge <= 0) {
            enemy.burst = enemy.aggression > 0.88 ? 4 : 3;
            enemy.burstTimer = 0;
          }
        } else if (enemy.fireTimer <= 0 && distance < 300 && onNose > 0.86) {
          enemy.charge = rand(0.28, 0.48);
          enemy.fireTimer = Math.max(0.9, 2.1 - this.waveNumber * 0.09) + rand(0, 0.5);
        }
      }

      // Engine trail
      enemy.trailTimer -= dt;
      if (enemy.trailTimer <= 0) {
        enemy.trailTimer = 0.05;
        const back = forward.clone().multiplyScalar(-1);
        const exhaust = enemy.root.position.clone().addScaledVector(back, enemy.radius * 0.8);
        this.particles.spawn(
          exhaust,
          back.multiplyScalar(rand(8, 18)).add(new THREE.Vector3(rand(-2, 2), rand(-2, 2), rand(-2, 2))),
          0xff7a3c,
          rand(1.2, 2.4),
          rand(0.2, 0.45),
          2,
          0.8,
        );
      }
    }
  }

  private hitEnemy(enemy: Enemy, at: THREE.Vector3) {
    enemy.hp -= 1;
    this.particles.burst(at, 0xffffff, 18, 30, 2.4, 0.28);
    this.particles.burst(at, 0xffd9a0, 26, 22, 2.6, 0.4);
    this.flashLight.position.copy(at);
    this.flashLight.intensity = 220;
    this.flashLight.color.setHex(0xffe3a8);
    this.shake = Math.min(1, this.shake + 0.08);
    this.audio.hitEnemy();
    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    } else if (Math.random() < 0.45) {
      // A raider that takes a hit snaps off and runs for a beat before re-engaging.
      enemy.mode = 'break';
      enemy.modeTimer = rand(0.7, 1.5);
      enemy.burst = 0;
      enemy.charge = 0;
    }
  }

  /* ─── Coins ──────────────────────────────────────────── */

  private spawnCoinTrail() {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.player.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.player.quaternion);
    const start = this.player.position.clone().addScaledVector(forward, rand(95, 145));
    const count = Math.floor(rand(8, 15));
    const lateral = rand(-14, 14);
    const amplitude = rand(4, 13);
    const phase = rand(0, Math.PI * 2);

    let placed = 0;
    for (let i = 0; i < count && placed < count; i++) {
      const coin = this.coins.find(c => !c.active);
      if (!coin) break;
      coin.active = true;
      coin.spin = rand(0, Math.PI * 2);
      coin.bob = rand(0, Math.PI * 2);
      coin.pos
        .copy(start)
        .addScaledVector(forward, i * 11)
        .addScaledVector(right, lateral + Math.sin(phase + i * 0.55) * amplitude)
        .addScaledVector(up, Math.sin(phase + i * 0.35) * 5);
      placed += 1;
    }
  }

  private updateCoins(dt: number) {
    if (this.coinTimer > 0) {
      this.coinTimer -= dt;
      if (this.coinTimer <= 0) {
        this.spawnCoinTrail();
        this.coinTimer = rand(2.6, 4.2);
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.coinCombo = 0;
    }

    const matrix = this.dummy;

    for (let i = 0; i < this.coins.length; i++) {
      const coin = this.coins[i];
      if (!coin.active) continue;

      coin.spin += dt * 2.2;
      const distance = coin.pos.distanceTo(this.player.position);

      // Magnet: nearby coins drift into the ship so lining up a trail feels good.
      if (distance < COIN_MAGNET) {
        coin.pos.lerp(this.player.position, 1 - Math.exp(-6 * dt));
      }

      if (distance < COIN_PICKUP_RADIUS) {
        coin.active = false;
        this.coinCombo = Math.min(9, this.coinCombo + 1);
        this.comboTimer = 2.6;
        this.coinsBanked += 1;
        this.coinScore += COIN_VALUE * (1 + Math.floor(this.coinCombo / 3));
        this.energy = Math.min(100, this.energy + 2.5);
        this.particles.burst(coin.pos, 0xffd166, 14, 16, 1.6, 0.35);
        this.particles.burst(coin.pos, 0xfff4cc, 8, 10, 2.2, 0.25);
        this.audio.coin(this.coinCombo - 1);
      } else if (distance > 620) {
        coin.active = false;
      }

      if (!coin.active) {
        matrix.position.copy(coin.pos);
        matrix.rotation.set(0, 0, 0);
        matrix.scale.setScalar(0);
      } else {
        matrix.position.copy(coin.pos);
        matrix.position.y += Math.sin(coin.bob + this.elapsed * 2) * 0.6;
        matrix.rotation.set(0, 0, coin.spin);
        matrix.scale.setScalar(1);
      }
      matrix.updateMatrix();
      this.coinMesh.setMatrixAt(i, matrix.matrix);
    }

    this.coinMesh.instanceMatrix.needsUpdate = true;
  }

  private resetCoins() {
    this.coins.forEach(coin => {
      coin.active = false;
    });
    this.coinTimer = 2;
    this.coinsBanked = 0;
    this.coinScore = 0;
    this.coinCombo = 0;
    this.comboTimer = 0;
    const matrix = this.dummy;
    matrix.position.set(0, 0, 0);
    matrix.rotation.set(0, 0, 0);
    matrix.scale.setScalar(0);
    matrix.updateMatrix();
    for (let i = 0; i < COIN_POOL; i++) this.coinMesh.setMatrixAt(i, matrix.matrix);
    this.coinMesh.instanceMatrix.needsUpdate = true;
  }

  private killEnemy(enemy: Enemy) {
    const at = enemy.root.position.clone();
    this.particles.burst(at, 0xfff1c4, 90, 74, 3.4, 1.0);
    this.particles.burst(at, 0xff8a3d, 70, 52, 4.6, 1.3);
    this.particles.burst(at, 0xff3d1f, 45, 32, 5.5, 1.6);
    this.addShockwave(at, 0xffa857, 1.5);
    this.addShockwave(at, 0xffffff, 0.55);
    this.flashLight.position.copy(at);
    this.flashLight.intensity = 1400;
    this.flashLight.color.setHex(0xffa764);
    this.shake = Math.min(1.4, this.shake + 0.55);

    // The hull tumbles away in pieces instead of blinking out of existence.
    // Geometry and materials are shared with the template, so the clone is
    // simply detached rather than disposed.
    this.dying.push({
      root: enemy.root,
      vel: enemy.vel.clone().multiplyScalar(0.4).add(new THREE.Vector3(rand(-14, 14), rand(-14, 14), rand(-14, 14))),
      spin: new THREE.Vector3(rand(-5, 5), rand(-4, 4), rand(-7, 7)),
      life: 0.6,
      maxLife: 0.6,
    });
    this.enemies = this.enemies.filter(e => e !== enemy);

    this.kills += 1;
    this.audio.explosion();

    // ── Cinematic beat ──────────────────────────────────
    this.killChain += 1;
    this.chainTimer = CHAIN_WINDOW;
    this.killFlash = 1;
    this.timeScale = KILL_SLOWMO;
    this.zoomPunch = 1;
    this.cinematicFocus.copy(at);
    this.cinematicTimer = KILL_CAM_TIME;
    // Kills pay for the next boost, so chaining raiders is the aggressive line.
    this.energy = Math.min(100, this.energy + 12);

    // Instant replacement – the endless chase never lets up.
    this.spawnTimer = 0.25;
    if (this.enemies.length < this.targetEnemyCount()) this.spawnEnemy();
  }

  private updateDying(dt: number) {
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const wreck = this.dying[i];
      wreck.life -= dt;
      const t = 1 - Math.max(0, wreck.life) / wreck.maxLife;
      wreck.root.position.addScaledVector(wreck.vel, dt);
      wreck.root.rotation.x += wreck.spin.x * dt;
      wreck.root.rotation.y += wreck.spin.y * dt;
      wreck.root.rotation.z += wreck.spin.z * dt;
      wreck.root.scale.setScalar(Math.max(0.02, 1 - t * t));

      this.particles.spawn(
        wreck.root.position,
        new THREE.Vector3(rand(-6, 6), rand(-6, 6), rand(-6, 6)),
        t < 0.5 ? 0xffb066 : 0x7a7f8c,
        rand(1.2, 2.6),
        rand(0.25, 0.5),
        2,
        0.5,
      );

      if (wreck.life <= 0) {
        this.scene.remove(wreck.root);
        this.dying.splice(i, 1);
      }
    }
  }

  private addShockwave(at: THREE.Vector3, color: number, grow = 1) {
    const geometry = new THREE.RingGeometry(1.6, 2.1, 48);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(at);
    mesh.quaternion.copy(this.camera.quaternion);
    this.scene.add(mesh);
    this.shockwaves.push({ mesh, life: 0.75, maxLife: 0.75, grow });
  }

  private updateShockwaves(dt: number) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const wave = this.shockwaves[i];
      wave.life -= dt;
      const t = 1 - wave.life / wave.maxLife;
      wave.mesh.scale.setScalar(1 + t * 26 * wave.grow);
      wave.mesh.quaternion.copy(this.camera.quaternion);
      (wave.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - t));
      if (wave.life <= 0) {
        this.scene.remove(wave.mesh);
        wave.mesh.geometry.dispose();
        (wave.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }
    this.flashLight.intensity *= Math.exp(-dt * 6);
  }

  /* ─── Discoverable worlds ────────────────────────────── */

  private spawnPlanet() {
    if (this.planets.length >= PLANET_MAX) return;
    const palette = PLANET_PALETTES[Math.floor(Math.random() * PLANET_PALETTES.length)];
    const radius = rand(PLANET_RADIUS_MIN, PLANET_RADIUS_MAX);

    const root = new THREE.Group();
    const surface = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      new THREE.MeshStandardMaterial({
        map: planetSurfaceTexture(palette),
        roughness: 0.94,
        metalness: 0.03,
      }),
    );
    root.add(surface);

    const atmosphere = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0.3)', 256),
        color: palette.atmosphere,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    atmosphere.scale.setScalar(3.15);
    root.add(atmosphere);

    if (Math.random() > 0.45) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.5, 2.45, 96),
        new THREE.MeshBasicMaterial({
          color: palette.atmosphere,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      ring.rotation.set(rand(1.15, 1.5), rand(0, Math.PI), 0);
      root.add(ring);
    }

    // Appear ahead of the nose (not on top of it) so a world is something you spot.
    const forward = FORWARD.clone().applyQuaternion(this.player.quaternion);
    const dir = forward
      .clone()
      .applyAxisAngle(UP, rand(-0.6, 0.6))
      .add(new THREE.Vector3(rand(-0.12, 0.12), rand(-0.26, 0.2), 0))
      .normalize();
    root.position
      .copy(this.player.position)
      .addScaledVector(dir, rand(PLANET_SPAWN_MIN, PLANET_SPAWN_MAX) + radius);
    root.scale.setScalar(radius);
    root.rotation.set(rand(-0.4, 0.4), rand(0, Math.PI * 2), rand(-0.35, 0.35));

    this.planetGroup.add(root);
    this.planets.push({ root, radius, palette });
  }

  private removePlanet(planet: Planet) {
    this.planetGroup.remove(planet.root);
    disposeObject(planet.root);
    this.planets = this.planets.filter(p => p !== planet);
  }

  /** Dive into the nearest world. Safe to call from the HUD button. */
  enterPlanet() {
    if (this.state !== 'running' || this.realm !== 'space' || this.transition) return;
    if (!this.nearPlanet || this.worldPrompt < 0.15) return;
    this.pendingPalette = this.nearPlanet.palette;
    this.transition = { phase: 'enter', t: 0, duration: 1.8, applied: false };
    this.worldLabel = `ENTERING ${this.nearPlanet.palette.name}`;
    this.timeScale = 0.3;
    this.zoomPunch = 1;
    this.worldFlash = 0;
    this.audio.warp();
  }

  private leavePlanet() {
    if (this.realm !== 'planet' || this.transition) return;
    this.transition = { phase: 'exit', t: 0, duration: 1.6, applied: false };
    this.worldLabel = 'BREAKING ORBIT';
    this.timeScale = 0.3;
    this.zoomPunch = 1;
    this.worlds += 1;
    this.worldBonus += PLANET_BONUS;
    this.hull = Math.min(100, this.hull + 15);
    this.particles.burst(this.player.position, 0xffffff, 60, 70, 3.2, 0.7);
    this.audio.warp();
  }

  /** Swap the whole environment between deep space and a planet surface. */
  private applyRealm(palette: PlanetPalette | null) {
    const cloudMat = this.cloudSea.material as THREE.MeshBasicMaterial;

    if (palette) {
      this.realm = 'planet';
      this.realmPalette = palette;
      this.realmTimer = 0;

      this.skyTexture?.dispose();
      this.skyTexture = planetSkyTexture(palette);
      this.scene.background = this.skyTexture;
      this.scene.backgroundIntensity = 1;
      this.scene.fog = new THREE.FogExp2(palette.fog, 0.0012);

      this.stars.visible = false;
      this.sunSprite.visible = false;
      this.planetGroup.visible = false;

      this.cloudTexture?.dispose();
      this.cloudTexture = cloudSeaTexture(palette);
      cloudMat.map = this.cloudTexture;
      cloudMat.color.setHex(palette.accent);
      cloudMat.opacity = 0.5;
      cloudMat.needsUpdate = true;
      this.cloudSea.visible = true;
      this.buildRidges(palette);
      this.ridgeMesh.visible = true;
      this.ridgeGroup.visible = true;
      this.cloudSea.position.set(
        this.player.position.x,
        this.player.position.y - 300,
        this.player.position.z,
      );

      this.rockMat.color.setHex(palette.ground);
      this.hemiLight.color.setHex(palette.atmosphere);
      this.hemiLight.groundColor.setHex(palette.fog);
      this.hemiLight.intensity = 1;
      this.accentLight.color.setHex(palette.accent);
      this.accentLight.intensity = 2.6;
      this.scene.environmentIntensity = 1.15;

      // A squadron is already scrambling on the surface.
      this.enemies.forEach(enemy => this.scene.remove(enemy.root));
      this.enemies = [];
      this.dropLock();
      this.spawnTimer = 0.5;
      this.coinTimer = 0.8;
      this.spawnEnemy();
      this.spawnEnemy();
    } else {
      this.realm = 'space';
      this.realmPalette = null;
      this.realmTimer = 0;

      this.scene.fog = null;
      this.scene.background = this.spaceBackdrop;
      this.scene.backgroundIntensity = 0.9;
      this.skyTexture?.dispose();
      this.skyTexture = null;

      // Break away from the world we just left so its prompt does not re-fire.
      [...this.planets]
        .filter(planet => planet.root.position.distanceTo(this.player.position) < 1600)
        .forEach(planet => this.removePlanet(planet));
      this.planetTimer = Math.min(this.planetTimer, 2.5);

      this.stars.visible = true;
      this.sunSprite.visible = true;
      this.planetGroup.visible = true;
      this.cloudSea.visible = false;
      this.ridgeGroup.visible = false;
      this.ridgeMesh.visible = false;

      this.rockMat.color.setHex(0x7a7f8c);
      this.hemiLight.color.setHex(0x4a5d8f);
      this.hemiLight.groundColor.setHex(0x05060c);
      this.hemiLight.intensity = 0.6;
      this.accentLight.color.setHex(0xa855f7);
      this.accentLight.intensity = 1.1;
      this.scene.environmentIntensity = 0.85;
    }
  }

  private updateWorld(dt: number, realDt: number) {
    if (this.transition) {
      const tr = this.transition;
      tr.t += realDt;
      const half = tr.duration * 0.45;
      if (!tr.applied && tr.t >= half) {
        tr.applied = true;
        this.applyRealm(tr.phase === 'enter' ? this.pendingPalette : null);
        this.pendingPalette = null;
      }
      this.worldFlash =
        tr.t < half
          ? Math.min(1, tr.t / half)
          : Math.max(0, 1 - (tr.t - half) / Math.max(0.01, tr.duration - half));
      if (tr.t >= tr.duration) {
        this.transition = null;
        this.worldFlash = 0;
        this.worldLabel = '';
      }
    }

    if (this.realm === 'planet') {
      this.realmTimer += dt;
      this.ridgeGroup.position.set(
        this.player.position.x,
        this.player.position.y - 240,
        this.player.position.z,
      );
      this.cloudSea.position.set(
        this.player.position.x,
        this.player.position.y - 300,
        this.player.position.z,
      );
      const map = (this.cloudSea.material as THREE.MeshBasicMaterial).map;
      if (map) map.offset.set(this.player.position.x / 1200, this.player.position.z / 1200);
      this.worldPrompt = 0;
      this.nearPlanet = null;
      if (!this.transition && this.realmTimer >= PLANET_SURVIVE) this.leavePlanet();
      return;
    }

    let prompt = 0;
    let nearest: Planet | null = null;
    const stale: Planet[] = [];
    for (const planet of this.planets) {
      planet.root.rotation.y += dt * 0.035;
      const distance = planet.root.position.distanceTo(this.player.position);
      const trigger = planet.radius * PLANET_ENTRY_RANGE;
      const closeness = THREE.MathUtils.clamp(
        1 - (distance - trigger) / (planet.radius * 1.6),
        0,
        1,
      );
      if (closeness > prompt) {
        prompt = closeness;
        nearest = planet;
      }
      if (distance > 4200) stale.push(planet);
    }
    for (const planet of stale) this.removePlanet(planet);

    this.worldPrompt += (prompt - this.worldPrompt) * (1 - Math.exp(-7 * dt));
    this.nearPlanet = nearest;

    this.planetTimer -= dt;
    if (this.planetTimer <= 0 && this.planets.length < PLANET_MAX) {
      this.spawnPlanet();
      this.planetTimer = rand(3, 7);
    }
  }

  /** Scatter a jagged ring of mesas around the ship for a surface horizon. */
  private buildRidges(palette: PlanetPalette) {
    const material = this.ridgeMesh.material as THREE.MeshStandardMaterial;
    material.color.setHex(palette.ground).multiplyScalar(0.32);
    for (let i = 0; i < RIDGES; i++) {
      const angle = (i / RIDGES) * Math.PI * 2 + rand(-0.09, 0.09);
      const radius = rand(540, 1020);
      const height = rand(90, 250);
      const width = rand(70, 190);
      this.dummy.position.set(Math.cos(angle) * radius, rand(-70, 40), Math.sin(angle) * radius);
      this.dummy.rotation.set(rand(-0.12, 0.12), rand(0, Math.PI * 2), rand(-0.12, 0.12));
      this.dummy.scale.set(width, height, width);
      this.dummy.updateMatrix();
      this.ridgeMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.ridgeMesh.instanceMatrix.needsUpdate = true;
  }

  private resetWorld() {
    this.transition = null;
    this.pendingPalette = null;
    this.worldFlash = 0;
    this.worldLabel = '';
    this.worldPrompt = 0;
    this.nearPlanet = null;
    this.realmTimer = 0;
    this.worlds = 0;
    this.worldBonus = 0;
    if (this.realm === 'planet') this.applyRealm(null);
    while (this.planets.length) this.removePlanet(this.planets[0]);
    this.spawnPlanet();
    this.spawnPlanet();
    this.planetTimer = 4;
  }

  /* ─── Damage / game over ─────────────────────────────── */

  private damagePlayer(amount: number, at: THREE.Vector3, asteroid = false) {
    if (this.state !== 'running' || this.hitCooldown > 0) return;
    this.hull = Math.max(0, this.hull - amount);
    this.hitCooldown = asteroid ? 0.9 : 0.18;
    this.regenTimer = 5;
    this.shake = Math.min(1.6, this.shake + (asteroid ? 0.8 : 0.3));
    this.damageFlash = 1;
    this.particles.burst(at, asteroid ? 0xb0bac9 : 0xff8a3d, 18, 26, 2.6, 0.5);
    this.audio.hit();
    this.flashLight.position.copy(at);
    this.flashLight.intensity = 260;
    this.flashLight.color.setHex(0xff5a3c);
    if (this.hull <= 0) this.gameOver();
  }

  private gameOver() {
    if (this.state === 'over') return;
    this.state = 'over';
    this.timeScale = 1;
    this.cinematicTimer = 0;
    this.resetTouchInput();
    this.dropLock();
    const at = this.player.position.clone();
    this.particles.burst(at, 0xfff4d6, 120, 80, 4.2, 1.1);
    this.particles.burst(at, 0xff7a2f, 90, 55, 5.6, 1.6);
    this.particles.burst(at, 0x66e0ff, 40, 70, 3.6, 1.0);
    this.addShockwave(at, 0xffc16b);
    this.flashLight.position.copy(at);
    this.flashLight.intensity = 1600;
    this.shake = 2;
    this.player.visible = false;
    this.audio.explosion(true);
    this.audio.gameOver();
    this.audio.stopEngine();
    this.emitStats();
    this.cb.onGameOver(this.snapshot());
  }

  /* ─── Camera ─────────────────────────────────────────── */

  private updateCamera(dt: number, dead: boolean) {
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.player.quaternion);

    const distance = (this.boosting ? 13.4 : 11.2) - this.zoomPunch * 2.4;
    const height = this.boosting ? 3.5 : 2.9;
    const targetPos = this.player.position
      .clone()
      .addScaledVector(forward, -distance)
      .addScaledVector(up, height);

    const follow = 1 - Math.exp(-7 * dt);
    this.camera.position.lerp(targetPos, follow);

    const lookTarget = this.player.position
      .clone()
      .addScaledVector(forward, 26)
      .addScaledVector(up, 1.2);
    this.cameraLook.lerp(lookTarget, 1 - Math.exp(-9 * dt));

    // Snap the eye toward the kill for a beat, so the explosion fills the frame.
    if (this.cinematicTimer > 0) {
      const urgency = Math.min(1, this.cinematicTimer / KILL_CAM_TIME);
      this.cameraLook.lerp(this.cinematicFocus, 1 - Math.exp(-6 * urgency * dt * 4));
    }

    this.cameraUp.lerp(up, 1 - Math.exp(-4 * dt)).normalize();
    this.camera.up.copy(this.cameraUp);

    const shake = dead ? this.shake * 0.6 : this.shake;
    this.camera.position.x += rand(-1, 1) * shake * 0.35;
    this.camera.position.y += rand(-1, 1) * shake * 0.35;
    this.camera.position.z += rand(-1, 1) * shake * 0.35;
    this.camera.lookAt(this.cameraLook);

    const targetFov = (this.boosting ? 89 : 74) - this.zoomPunch * 10;
    this.camera.fov += (targetFov - this.camera.fov) * (1 - Math.exp(-6 * dt));
    this.camera.updateProjectionMatrix();
    this.zoomPunch *= Math.exp(-dt * 4.5);
  }

  /* ─── State helpers ──────────────────────────────────── */

  private toWorld(local: THREE.Vector3) {
    return local.clone().applyQuaternion(this.player.quaternion).add(this.player.position);
  }

  private snapshot(): GameStats {
    return {
      score: this.kills * 100 + this.coinScore + Math.floor(this.elapsed * 10) + this.worldBonus,
      kills: this.kills,
      hull: this.hull,
      energy: this.energy,
      wave: this.waveNumber,
      time: this.elapsed,
      boosting: this.boosting,
      enemies: this.enemies.length,
      coins: this.coinsBanked,
      combo: this.coinCombo,
      chain: this.killChain,
      killFlash: this.killFlash,
      damageFlash: this.damageFlash,
      lock: this.lockProgress,
      locked: this.lockProgress >= 1 && Boolean(this.lockTarget),
      realm: this.realm,
      worldName: this.realmPalette?.name ?? this.nearPlanet?.palette.name ?? '',
      worldPrompt: this.worldPrompt,
      worldProgress: this.realm === 'planet' ? Math.min(1, this.realmTimer / PLANET_SURVIVE) : 0,
      worldFlash: this.worldFlash,
      worldLabel: this.worldLabel,
      worlds: this.worlds,
      attackers: this.enemies.filter(enemy => enemy.mode === 'attack').length,
      regen: this.hull < 99.5 && this.regenTimer <= 0,
    };
  }

  private emitStats() {
    this.cb.onStats(this.snapshot());
  }

  private clearEntities() {
    this.enemies.forEach(enemy => this.scene.remove(enemy.root));
    this.enemies = [];
    this.dying.forEach(wreck => this.scene.remove(wreck.root));
    this.dying = [];
    this.lasers.forEach(laser => this.scene.remove(laser.mesh));
    this.lasers = [];
    this.shockwaves.forEach(wave => {
      this.scene.remove(wave.mesh);
      wave.mesh.geometry.dispose();
      (wave.mesh.material as THREE.Material).dispose();
    });
    this.shockwaves = [];
  }

  private resize() {
    const width = this.mount.clientWidth || 960;
    const height = this.mount.clientHeight || 560;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.composer.setSize(width, height);
    this.bloom.setSize(width, height);
  }
}
