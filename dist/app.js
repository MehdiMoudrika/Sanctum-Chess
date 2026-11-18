// ============================================================================
// SANCTUM CHESS — THE CRYSTALLINE REALM CHESS SET (HIGH-DETAIL BLUEPRINT EDITION)
// Matches the exact anatomy of "The Crystalline Realm Chess Set" Blueprint
// & Macro Board Render while maintaining 120 FPS via shared geometry caching.
// ============================================================================

class CrystalAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSelect(isWhite) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = isWhite ? 987.77 : 659.25;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.14);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  playCrystalGlide(duration = 0.22) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + duration * 0.65);
    osc.frequency.exponentialRampToValueAtTime(340, now + duration);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playCrystalShatter() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(150, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.32);
    subGain.gain.setValueAtTime(0.32, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.35);

    for (let i = 0; i < 10; i++) {
      const delay = 0.01 + Math.random() * 0.32;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      const freq = 1600 + Math.random() * 3200;
      osc.frequency.setValueAtTime(freq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, now + delay + 0.07);

      g.gain.setValueAtTime(0.065 * (1 - delay), now + delay);
      g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    }
  }

  playHintChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [659.25, 987.77, 1318.51].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.07, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.29);
    });
  }
}

const audio = new CrystalAudioEngine();

// --- CONSTANTS & ENGINE STATE ---
const TILE_SIZE = 2.15;
const BOARD_OFFSET = (TILE_SIZE * 7) / 2;
const chess = new Chess();

// Per-Piece Sculpted GLB vs. Procedural Fallback Toggle (Strict Rule #3)
const USE_GLB = {
  king: true,
  queen: true,
  rook: true,
  bishop: true,
  knight: true,
  pawn: true
};

const PIECE_TYPE_TO_KEY = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn'
};

const GLB_SPECS = {
  king:   { url: './assets/models/king.glb?v=120fps',   targetHeight: 3.35, flarePos: [-0.52, 3.18, 0.14], flareScale: 1.15 },
  queen:  { url: './assets/models/queen.glb?v=120fps',  targetHeight: 3.05, flarePos: [-0.48, 2.85, 0.14], flareScale: 0.95 },
  rook:   { url: './assets/models/rook.glb?v=120fps',   targetHeight: 2.52, flarePos: [0, 2.55, 0],        flareScale: 0.75 },
  bishop: { url: './assets/models/bishop.glb?v=120fps', targetHeight: 2.75, flarePos: [-0.38, 2.65, 0.15], flareScale: 0.75 },
  knight: { url: './assets/models/knight.glb?v=120fps', targetHeight: 2.55, flarePos: null,                flareScale: 0 },
  pawn:   { url: './assets/models/pawn.glb?v=120fps',   targetHeight: 1.98, flarePos: null,                flareScale: 0 }
};

const loadedGLBTemplates = {};

let gameMode = 'ai';
let activeCameraKey = 'orbit';
let isAnimating = false;
let selectedSquare = null;
let legalMovesForSelected = [];
let pendingPromotionMove = null;
let currentSuggestedMove = null;

// Three.js Scene Graph
let scene, camera, renderer, controls, clock, raycaster, mouse;
let environmentGroup, boardGroup, piecesGroup, highlightsGroup, hintGroup, fxGroup;

const tileMeshes = {};
const pieceObjects = {};
const activeShards = [];
const activeRipples = [];
const activeParticles = [];

let camTransition = null;

// Materials
let matMilkyQuartz, matPrismaticDiamond, matAmethystGem, matGoldFiligree, matSpunGlassWings;
let matDraconicAmber, matFireDiamond, matRubyAmberGem, matBronzeFiligree, matDragonWingAmber;
let matGlowingDiamondTile, matObsidianMirrorTile, matChiseledObsidianSlab;
let texStarFlare, texPrismaticCaustic;

const CAMERA_VIEWS = {
  orbit:     { pos: new THREE.Vector3(11.8, 10.4, 14.8), target: new THREE.Vector3(0, 0.8, 0) },
  white:     { pos: new THREE.Vector3(0, 11.4, 18.0),    target: new THREE.Vector3(0, 0.7, 0) },
  black:     { pos: new THREE.Vector3(0, 11.4, -18.0),   target: new THREE.Vector3(0, 0.7, 0) },
  top:       { pos: new THREE.Vector3(0, 25.5, 0.01),    target: new THREE.Vector3(0, 0, 0) },
  cathedral: { pos: new THREE.Vector3(-15.2, 7.8, 14.2), target: new THREE.Vector3(0, 1.1, 0) }
};

function squareToWorld(sq) {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10) - 1;
  const x = file * TILE_SIZE - BOARD_OFFSET;
  const z = (7 - rank) * TILE_SIZE - BOARD_OFFSET;
  return new THREE.Vector3(x, 0, z);
}

// ============================================================================
// PROCEDURAL TEXTURES
// ============================================================================
function createPrismaticEnvMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#090d18');
  grad.addColorStop(0.45, '#121829');
  grad.addColorStop(0.52, '#231934');
  grad.addColorStop(1, '#040508');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  const flares = [
    { x: 70,  y: 60,  r: 55, c0: '#ffffff', c1: 'rgba(56, 189, 248, 0)' },
    { x: 165, y: 80,  r: 65, c0: '#fde047', c1: 'rgba(249, 115, 22, 0)' },
    { x: 260, y: 50,  r: 70, c0: '#ffffff', c1: 'rgba(192, 132, 252, 0)' },
    { x: 355, y: 75,  r: 60, c0: '#fb7185', c1: 'rgba(56, 189, 248, 0)' },
    { x: 445, y: 65,  r: 55, c0: '#a7f3d0', c1: 'rgba(168, 85, 247, 0)' }
  ];
  flares.forEach(f => {
    const rad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.r);
    rad.addColorStop(0, f.c0);
    rad.addColorStop(0.4, f.c0);
    rad.addColorStop(1, f.c1);
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function createGlowingDiamondTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 170);
  rad.addColorStop(0, '#ffffff');
  rad.addColorStop(0.55, '#e6f4ff');
  rad.addColorStop(0.88, '#b8d8f8');
  rad.addColorStop(1, '#7ea8d8');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.strokeStyle = 'rgba(140, 195, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 22, 212, 212);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.8;
  ctx.save();
  ctx.translate(128, 128);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 92);
    ctx.moveTo(-26, 54);
    ctx.lineTo(0, 88);
    ctx.lineTo(26, 54);
    ctx.stroke();
  }
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function createObsidianVeinedTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#07080d';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(185, 205, 235, 0.15)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    let x = Math.random() * 256;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < 256) {
      y += 22;
      x += (Math.random() - 0.5) * 34;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

function createStarFlareTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const rad = ctx.createRadialGradient(64, 64, 1, 64, 64, 58);
  rad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  rad.addColorStop(0.2, 'rgba(255, 240, 200, 0.85)');
  rad.addColorStop(0.5, 'rgba(165, 220, 255, 0.25)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 128, 128);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.0;
  ctx.save();
  ctx.translate(64, 64);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-60, 0);
    ctx.lineTo(60, 0);
    ctx.stroke();
    ctx.rotate(Math.PI / 3);
  }
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

function createRainbowCausticTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(16, 16, 112, 112);
  grad.addColorStop(0, 'rgba(59, 130, 246, 0)');
  grad.addColorStop(0.2, 'rgba(56, 189, 248, 0.55)');
  grad.addColorStop(0.4, 'rgba(74, 222, 128, 0.6)');
  grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.75)');
  grad.addColorStop(0.8, 'rgba(244, 63, 94, 0.65)');
  grad.addColorStop(1, 'rgba(168, 85, 247, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(64, 64, 52, 22, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function initMaterials() {
  const envMap = createPrismaticEnvMap();
  scene.environment = envMap;

  texStarFlare = createStarFlareTexture();
  texPrismaticCaustic = createRainbowCausticTexture();
  const diamondTileTex = createGlowingDiamondTileTexture();
  const obsidianTex = createObsidianVeinedTexture();

  // --- WHITE HOST: MILKY QUARTZ, PRISMATIC ICE DIAMOND, AMETHYST GEMS & GOLD FILIGREE ---
  matMilkyQuartz = new THREE.MeshPhysicalMaterial({
    color: 0xf5f3ff,
    emissive: 0x2e1f47,
    emissiveIntensity: 0.24,
    roughness: 0.11,
    metalness: 0.10,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMap,
    envMapIntensity: 2.2
  });

  matPrismaticDiamond = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.35,
    roughness: 0.03,
    metalness: 0.25,
    clearcoat: 1.0,
    envMap,
    envMapIntensity: 3.0,
    flatShading: true,
    transparent: true,
    opacity: 0.9
  });

  matAmethystGem = new THREE.MeshPhysicalMaterial({
    color: 0xa855f7,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.85,
    roughness: 0.06,
    metalness: 0.22,
    clearcoat: 1.0,
    envMap,
    envMapIntensity: 2.5,
    flatShading: true
  });

  matGoldFiligree = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0x854d0e,
    emissiveIntensity: 0.35,
    roughness: 0.18,
    metalness: 0.92,
    envMap,
    envMapIntensity: 2.2
  });

  matSpunGlassWings = new THREE.MeshPhysicalMaterial({
    color: 0xe0f2fe,
    emissive: 0xc084fc,
    emissiveIntensity: 0.38,
    roughness: 0.04,
    metalness: 0.18,
    clearcoat: 1.0,
    envMap,
    envMapIntensity: 2.8,
    transparent: true,
    opacity: 0.78,
    side: THREE.DoubleSide
  });

  // --- BLACK/AMBER HOST: SMOKY GOLDEN QUARTZ, FIRE DIAMOND & BRONZE-GOLD FILIGREE ---
  matDraconicAmber = new THREE.MeshPhysicalMaterial({
    color: 0xd97706,
    emissive: 0x451a03,
    emissiveIntensity: 0.28,
    roughness: 0.07,
    metalness: 0.38,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMap,
    envMapIntensity: 2.8
  });

  matFireDiamond = new THREE.MeshPhysicalMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.55,
    roughness: 0.03,
    metalness: 0.35,
    clearcoat: 1.0,
    envMap,
    envMapIntensity: 3.1,
    flatShading: true,
    transparent: true,
    opacity: 0.92
  });

  matRubyAmberGem = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.95,
    roughness: 0.06,
    metalness: 0.3,
    clearcoat: 1.0,
    flatShading: true
  });

  matBronzeFiligree = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0x78350f,
    emissiveIntensity: 0.4,
    roughness: 0.16,
    metalness: 0.94,
    envMap,
    envMapIntensity: 2.4
  });

  matDragonWingAmber = new THREE.MeshPhysicalMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.42,
    roughness: 0.06,
    metalness: 0.45,
    clearcoat: 1.0,
    envMap,
    envMapIntensity: 2.7,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide
  });

  // --- BOARD MATERIALS ---
  matGlowingDiamondTile = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: diamondTileTex,
    emissive: 0xdbeafe,
    emissiveMap: diamondTileTex,
    emissiveIntensity: 0.55,
    roughness: 0.08,
    metalness: 0.15,
    envMap,
    envMapIntensity: 1.6
  });

  matObsidianMirrorTile = new THREE.MeshStandardMaterial({
    color: 0x080a10,
    map: obsidianTex,
    roughness: 0.05,
    metalness: 0.55,
    envMap,
    envMapIntensity: 2.2
  });

  matChiseledObsidianSlab = new THREE.MeshStandardMaterial({
    color: 0x0b0e16,
    map: obsidianTex,
    roughness: 0.22,
    metalness: 0.48,
    envMap,
    envMapIntensity: 1.7,
    flatShading: true
  });
}

// ============================================================================
// ENVIRONMENT & CHISELED OBSIDIAN BOARD
// ============================================================================
function buildEnvironmentAndBoard() {
  environmentGroup = new THREE.Group();
  boardGroup = new THREE.Group();
  scene.add(environmentGroup);
  scene.add(boardGroup);

  const boardSpan = TILE_SIZE * 8;
  const slabMain = new THREE.Mesh(
    new THREE.BoxGeometry(boardSpan + 2.4, 0.85, boardSpan + 2.4),
    matChiseledObsidianSlab
  );
  slabMain.position.y = -0.52;
  slabMain.receiveShadow = true;
  environmentGroup.add(slabMain);

  const edgeCount = 32;
  const halfSpan = (boardSpan + 2.35) / 2;
  const rockGeo = new THREE.DodecahedronGeometry(0.75, 0);
  for (let i = 0; i < edgeCount; i++) {
    const t = (i / edgeCount) * 4;
    const side = Math.floor(t);
    const frac = (t % 1) * 2 - 1;
    const chip = new THREE.Mesh(rockGeo, matChiseledObsidianSlab);

    if (side === 0) chip.position.set(frac * halfSpan, -0.58, halfSpan);
    else if (side === 1) chip.position.set(halfSpan, -0.58, frac * halfSpan);
    else if (side === 2) chip.position.set(frac * halfSpan, -0.58, -halfSpan);
    else chip.position.set(-halfSpan, -0.58, frac * halfSpan);

    chip.scale.set(1.4 + (i % 3) * 0.4, 0.52, 0.9 + (i % 2) * 0.4);
    chip.rotation.set((i * 0.7) % 1, (i * 1.3) % 3, (i * 0.4) % 1);
    environmentGroup.add(chip);
  }

  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.985, 0.24, TILE_SIZE * 0.985);
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLight = (r + f) % 2 === 1;
      const sq = String.fromCharCode(97 + f) + (r + 1);
      const pos = squareToWorld(sq);

      const tile = new THREE.Mesh(tileGeo, isLight ? matGlowingDiamondTile : matObsidianMirrorTile);
      tile.position.set(pos.x, -0.12, pos.z);
      tile.receiveShadow = true;
      tile.userData = { square: sq, isLight };
      boardGroup.add(tile);
      tileMeshes[sq] = tile;
    }
  }

  // Rainbow Prismatic Caustic Flares across the obsidian edges & tiles
  const causticPositions = [
    [-7.8, 0.01,  8.9, 1.9, 0.4],
    [-4.2, 0.01,  8.8, 1.6, -0.3],
    [ 2.5, 0.01,  8.9, 1.8, 0.8],
    [-8.9, 0.01,  4.5, 1.7, 1.1],
    [-8.8, 0.01, -2.2, 2.0, -0.6],
    [-5.5, 0.01,  5.5, 1.5, 0.2],
    [ 6.2, 0.01,  7.5, 1.6, -0.5],
    [-2.0, 0.01,  3.2, 1.4, 0.9]
  ];
  const causticGeo = new THREE.PlaneGeometry(1.5, 1.5);
  causticPositions.forEach(([x, y, z, s, rot]) => {
    const caustic = new THREE.Mesh(
      causticGeo,
      new THREE.MeshBasicMaterial({
        map: texPrismaticCaustic,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    caustic.rotation.x = -Math.PI / 2;
    caustic.rotation.z = rot;
    caustic.position.set(x, y, z);
    caustic.scale.set(s, s, 1);
    environmentGroup.add(caustic);
  });

  // Distant Crystal Forest Spires & Gothic Vaulting
  const clusterCount = 18;
  for (let i = 0; i < clusterCount; i++) {
    const angle = (i / clusterCount) * Math.PI * 2;
    const dist = 25 + (i % 3) * 5;
    const cx = Math.cos(angle) * dist;
    const cz = Math.sin(angle) * dist;

    const cluster = new THREE.Group();
    cluster.position.set(cx, -3.5, cz);
    cluster.lookAt(0, 0, 0);

    const h = 11 + (i % 4) * 4.5;
    const spireMat = cx < 0 ? matDraconicAmber : matPrismaticDiamond;

    const mainCrystal = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.15, h, 6), spireMat);
    mainCrystal.position.y = h * 0.5;
    cluster.add(mainCrystal);

    for (let j = 0; j < 3; j++) {
      const sh = h * (0.42 + j * 0.14);
      const subCrystal = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.65, sh, 5), spireMat);
      subCrystal.position.set((j - 1) * 1.1, sh * 0.45, 0.6);
      subCrystal.rotation.z = (j - 1) * 0.22;
      subCrystal.rotation.x = 0.12;
      cluster.add(subCrystal);
    }

    if (i % 3 === 0) {
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(dist * 0.68, 0.18, 6, 20, Math.PI * 0.45),
        matChiseledObsidianSlab
      );
      arch.position.set(0, 16, 0);
      arch.rotation.y = Math.PI / 2;
      cluster.add(arch);
    }

    environmentGroup.add(cluster);
  }

  // Celestial Starfield
  const starCount = 260;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 14 + Math.random() * 34;
    const theta = Math.random() * Math.PI * 2;
    starPos[i * 3] = Math.cos(theta) * r;
    starPos[i * 3 + 1] = -2 + Math.random() * 22;
    starPos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xdbeafe,
    size: 0.22,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  environmentGroup.add(new THREE.Points(starGeo, starMat));
}

// ============================================================================
// BLUEPRINT-ACCURATE 3D SCULPTURE HELPERS
// ============================================================================

function addSpectralFlareSprite(parentGroup, x, y, z, scale = 0.85) {
  const spriteMat = new THREE.SpriteMaterial({
    map: texStarFlare,
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, y, z);
  sprite.scale.set(scale, scale, 1);
  parentGroup.add(sprite);
}

/**
 * Multi-layered Feathered Wings (for Pegasus/Griffin Knight) or 4-Wing Fairy Wings (for Sylvan Queen)
 */
function createDetailedWings(wingMat, diamondMat, mode = 'fairy') {
  const wingGroup = new THREE.Group();
  wingGroup.name = 'animWings';

  const leftSide = new THREE.Group();
  leftSide.name = 'leftWing';
  const rightSide = new THREE.Group();
  rightSide.name = 'rightWing';

  if (mode === 'fairy') {
    // 4-Wing Sylvan Fairy Configuration (2 tall upper wings + 2 lower teardrop wings)
    for (let side of [-1, 1]) {
      const target = side === 1 ? leftSide : rightSide;
      // Upper Primary Wing
      const upper = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.55, 5), wingMat);
      upper.scale.set(1.0, 1.0, 0.18);
      upper.position.set(side * 0.55, 0.48, -0.1);
      upper.rotation.z = -side * 0.62;
      upper.rotation.y = -side * 0.25;
      target.add(upper);

      // Crystal Vein Rib along upper edge
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 1.48, 5), diamondMat);
      rib.position.set(side * 0.52, 0.56, -0.09);
      rib.rotation.z = -side * 0.58;
      target.add(rib);

      // Lower Secondary Fairy Wing
      const lower = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.05, 5), wingMat);
      lower.scale.set(1.0, 1.0, 0.18);
      lower.position.set(side * 0.45, -0.15, -0.12);
      lower.rotation.z = -side * 1.15;
      target.add(lower);
    }
  } else {
    // Multi-Tiered Feathered Pegasus/Dragon Wings (7 overlapping crystal feather blades per wing)
    for (let side of [-1, 1]) {
      const target = side === 1 ? leftSide : rightSide;
      for (let f = 0; f < 6; f++) {
        const len = 1.35 - f * 0.14;
        const feather = new THREE.Mesh(new THREE.ConeGeometry(0.11, len, 4), f % 2 === 0 ? wingMat : diamondMat);
        feather.scale.set(1.0, 1.0, 0.35);
        const angle = 0.38 + f * 0.16;
        feather.position.set(side * (0.35 + f * 0.08), 0.45 - f * 0.12, -0.08 - f * 0.03);
        feather.rotation.z = -side * angle;
        feather.rotation.x = -0.18;
        target.add(feather);
      }
    }
  }

  wingGroup.add(leftSide);
  wingGroup.add(rightSide);
  return wingGroup;
}

/**
 * Loads any piece enabled in `USE_GLB` via THREE.GLTFLoader, auto-centers and scales
 * via THREE.Box3 so its height, base pedestal alignment, and footprint match our
 * procedural pieces, computes smooth vertex normals, and refreshes the board.
 */
function loadEnabledGLBModels() {
  if (!THREE.GLTFLoader) {
    console.warn('THREE.GLTFLoader not found; using procedural fallback meshes.');
    return;
  }

  const loader = new THREE.GLTFLoader();
  Object.keys(USE_GLB).forEach(pieceKey => {
    if (!USE_GLB[pieceKey]) return;
    const spec = GLB_SPECS[pieceKey];
    if (!spec) return;

    loader.load(
      spec.url,
      gltf => {
        const rawModel = gltf.scene;

        // Traverse child meshes and ensure smooth vertex normals for crystal refraction
        rawModel.traverse(child => {
          if (child.isMesh && child.geometry) {
            child.geometry.computeVertexNormals();
          }
        });

        // Compute bounding box to auto-center X/Z and align base bottom at y = 0.22 (on pedestal)
        const box = new THREE.Box3().setFromObject(rawModel);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxHoriz = Math.max(size.x, size.z, 0.001);
        const targetH = spec.targetHeight - 0.22;
        const scaleH = targetH / Math.max(size.y, 0.001);
        const scaleFootprint = (TILE_SIZE * 0.78) / maxHoriz;
        const uniformScale = Math.min(scaleH, scaleFootprint * 1.15);

        rawModel.scale.setScalar(uniformScale);

        // Recompute scaled bounds so base sits flush on top of our ornate filigree pedestal
        const scaledBox = new THREE.Box3().setFromObject(rawModel);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        rawModel.position.set(
          -scaledCenter.x,
          0.22 - scaledBox.min.y,
          -scaledCenter.z
        );

        const wrapper = new THREE.Group();
        wrapper.add(rawModel);
        loadedGLBTemplates[pieceKey] = wrapper;

        console.log(`[GLB Loaded] ${pieceKey} -> scale=${uniformScale.toFixed(3)}`);
        syncBoardWithEngine();
      },
      undefined,
      err => {
        console.warn(`[GLB Fallback] Could not load ${spec.url}; using procedural mesh.`, err);
      }
    );
  });
}

/**
 * Builds each piece matching the exact blueprint ("THE CRYSTALLINE REALM CHESS SET")
 * and the macro board render. Uses sculpted GLB if `USE_GLB[pieceKey]` is true and loaded,
 * otherwise preserves and uses the procedural mesh fallback.
 */
function createFantasyPieceMesh(type, color) {
  const isWhite = color === 'w';
  const quartzMat   = isWhite ? matMilkyQuartz      : matDraconicAmber;
  const crystalMat  = isWhite ? matPrismaticDiamond : matFireDiamond;
  const gemMat      = isWhite ? matAmethystGem      : matRubyAmberGem;
  const filigreeMat = isWhite ? matGoldFiligree     : matBronzeFiligree;
  const wingMat     = isWhite ? matSpunGlassWings   : matDragonWingAmber;

  const group = new THREE.Group();
  // Orient every piece so White faces -Z (toward Black) and Black faces +Z (toward White)
  const figure = new THREE.Group();
  figure.rotation.y = isWhite ? Math.PI : 0;
  group.add(figure);

  // ==========================================================================
  // ORNATE PEDESTAL BASE WITH GOLD FILIGREE & 4 INSET AMETHYST/AMBER GEMS
  // ==========================================================================
  const baseBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.86, 0.18, 16), quartzMat);
  baseBottom.position.y = 0.09;
  baseBottom.castShadow = true;
  baseBottom.receiveShadow = true;
  figure.add(baseBottom);

  const filigreeBand = new THREE.Mesh(new THREE.TorusGeometry(0.76, 0.045, 8, 24), filigreeMat);
  filigreeBand.rotation.x = Math.PI / 2;
  filigreeBand.position.y = 0.2;
  figure.add(filigreeBand);

  const baseTop = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.76, 0.18, 16), quartzMat);
  baseTop.position.y = 0.28;
  figure.add(baseTop);

  // 4 Amethyst / Ruby-Amber Filigree Gems around the pedestal rim
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const rimGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), gemMat);
    rimGem.position.set(Math.cos(a) * 0.77, 0.2, Math.sin(a) * 0.77);
    figure.add(rimGem);
  }

  // ==========================================================================
  // SCULPTED GLB MESH BRANCH (When enabled in USE_GLB & loaded)
  // ==========================================================================
  const pieceKey = PIECE_TYPE_TO_KEY[type];
  if (pieceKey && USE_GLB[pieceKey] && loadedGLBTemplates[pieceKey]) {
    const spec = GLB_SPECS[pieceKey];
    const glbInstance = loadedGLBTemplates[pieceKey].clone(true);
    glbInstance.traverse(child => {
      if (child.isMesh) {
        child.material = quartzMat;
        child.castShadow = true;
        child.receiveShadow = false;
        // Disable expensive per-triangle CPU raycasting on the sculpted mesh
        child.raycast = () => {};
      }
    });
    figure.add(glbInstance);

    // Lightweight 8-sided proxy cylinder for instant (<0.01ms) click/tap raycasting
    const h = spec ? spec.targetHeight : 2.4;
    const hitbox = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.78, h, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })
    );
    hitbox.position.y = h * 0.5;
    figure.add(hitbox);

    if (spec && spec.flarePos) {
      addSpectralFlareSprite(
        figure,
        spec.flarePos[0],
        spec.flarePos[1],
        spec.flarePos[2],
        spec.flareScale
      );
    }

    group.userData = {
      type,
      color,
      isGLB: true,
      phase: Math.random() * Math.PI * 2
    };
    return group;
  }

  // ==========================================================================
  // 6. PAWN: DISCIPLINED CRYSTAL GOBLIN (Armored Stance, Pointed Ears, Spear & Kite Shield)
  // ==========================================================================
  if (type === 'p') {
    // Two Armored Legs / Greaves in wide combat stance
    for (let s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.48, 8), quartzMat);
      leg.position.set(s * 0.2, 0.56, 0);
      leg.rotation.z = -s * 0.12;
      figure.add(leg);
    }

    // Armored Torso & Gold Filigree Belt/Cuirass
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.56, 8), quartzMat);
    torso.position.set(0, 1.02, 0);
    figure.add(torso);

    const belt = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 6, 12), filigreeMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.82;
    figure.add(belt);

    const chestGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), gemMat);
    chestGem.position.set(0, 1.08, 0.25);
    figure.add(chestGem);

    // Shoulder Pauldrons
    for (let s of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 5), crystalMat);
      pauldron.position.set(s * 0.34, 1.24, 0);
      pauldron.rotation.z = -s * 1.1;
      figure.add(pauldron);
    }

    // Furrowed Goblin Head + Long Horizontal Pointed Goblin Ears
    const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), quartzMat);
    head.position.set(0, 1.52, 0.04);
    figure.add(head);

    for (let s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.44, 4), quartzMat);
      ear.position.set(s * 0.36, 1.56, 0.02);
      ear.rotation.z = -s * 1.25;
      figure.add(ear);
    }

    // Right Arm + Tall Diamond-Bladed Spear
    const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.42, 6), quartzMat);
    rightArm.position.set(0.38, 1.05, 0.14);
    rightArm.rotation.x = 0.5;
    figure.add(rightArm);

    const spearGroup = new THREE.Group();
    spearGroup.position.set(0.44, 1.22, 0.25);
    spearGroup.rotation.x = 0.12;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.65, 6), filigreeMat);
    spearGroup.add(shaft);
    const spearTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), crystalMat);
    spearTip.scale.set(0.7, 2.1, 0.4);
    spearTip.position.y = 0.95;
    spearGroup.add(spearTip);
    figure.add(spearGroup);

    // Left Arm + Faceted Diamond Kite Shield with Gold Frame & Central Amethyst Boss
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.38, 1.02, 0.26);
    shieldGroup.rotation.y = -0.35;
    shieldGroup.rotation.x = -0.12;

    const shieldBody = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), crystalMat);
    shieldBody.scale.set(0.85, 1.35, 0.22);
    shieldGroup.add(shieldBody);

    const shieldRim = new THREE.Mesh(new THREE.OctahedronGeometry(0.41, 0), filigreeMat);
    shieldRim.scale.set(0.88, 1.38, 0.12);
    shieldGroup.add(shieldRim);

    const shieldGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), gemMat);
    shieldGem.position.z = 0.08;
    shieldGroup.add(shieldGem);
    figure.add(shieldGroup);

  // ==========================================================================
  // 5. ROOK: SANCTUM MILKY-QUARTZ TOWER (Spiral Staircase, Base Shards, Gothic Door & Summit Gem)
  // ==========================================================================
  } else if (type === 'r') {
    // Cylindrical Milky Quartz Tower Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.58, 1.68, 16), quartzMat);
    shaft.position.y = 1.18;
    figure.add(shaft);

    // Gothic Pointed Portal Doorway at the front base
    const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.55, 0.14), filigreeMat);
    portalFrame.position.set(0, 0.65, 0.54);
    figure.add(portalFrame);
    const portalGem = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.48, 4), gemMat);
    portalGem.position.set(0, 0.66, 0.58);
    figure.add(portalGem);

    // 6 Pointed Amethyst/Quartz Crystal Shards sprouting around the base of the tower
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const h = 0.45 + (i % 2) * 0.22;
      const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.12, h, 5), i % 2 === 0 ? gemMat : crystalMat);
      shard.position.set(Math.cos(a) * 0.58, 0.35 + h * 0.4, Math.sin(a) * 0.58);
      shard.rotation.z = -Math.cos(a) * 0.22;
      shard.rotation.x = Math.sin(a) * 0.22;
      figure.add(shard);
    }

    // External Spiral Staircase wrapping 1.25 turns up the outside of the tower
    const stairSteps = 16;
    for (let i = 0; i < stairSteps; i++) {
      const t = i / stairSteps;
      const ang = t * Math.PI * 2.2 + 0.5;
      const r = 0.56 - t * 0.06;
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.14), filigreeMat);
      step.position.set(Math.cos(ang) * r, 0.52 + t * 1.32, Math.sin(ang) * r);
      step.rotation.y = -ang;
      figure.add(step);
    }

    // Flared Crown Battlement Collar + 8 Crenellated Merlons
    const crownCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.48, 0.26, 16), quartzMat);
    crownCollar.position.y = 2.08;
    figure.add(crownCollar);

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.26, 0.18), quartzMat);
      merlon.position.set(Math.cos(a) * 0.52, 2.32, Math.sin(a) * 0.52);
      merlon.rotation.y = -a;
      figure.add(merlon);
    }

    // Central Glowing Amethyst/Fire Crystal Prism rising from the summit of the Rook
    const summitCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gemMat);
    summitCrystal.scale.set(0.85, 1.65, 0.85);
    summitCrystal.position.y = 2.48;
    summitCrystal.name = 'floatingCrown';
    figure.add(summitCrystal);

  // ==========================================================================
  // 4. KNIGHT: WINGED GRIFFIN / PEGASUS (4 Legs, Jeweled Breastplate, Feathered Wings & Tail)
  // ==========================================================================
  } else if (type === 'n') {
    // 2 Planted Hind Legs on Pedestal
    for (let s of [-1, 1]) {
      const hindLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.72, 8), quartzMat);
      hindLeg.position.set(s * 0.22, 0.68, -0.22);
      hindLeg.rotation.x = 0.28;
      figure.add(hindLeg);
    }

    // Rearing Equine/Draconic Barrel Torso + Jeweled Golden Chestplate
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.95, 10), quartzMat);
    body.position.set(0, 1.18, -0.04);
    body.rotation.x = -0.52;
    figure.add(body);

    const chestArmor = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.055, 6, 12, Math.PI), filigreeMat);
    chestArmor.position.set(0, 1.38, 0.14);
    chestArmor.rotation.x = 0.35;
    figure.add(chestArmor);

    const breastGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), gemMat);
    breastGem.position.set(0, 1.36, 0.36);
    figure.add(breastGem);

    // 2 Rearing Bent Forelegs with Hooves/Claws
    for (let s of [-1, 1]) {
      const foreUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.48, 8), quartzMat);
      foreUpper.position.set(s * 0.24, 1.42, 0.36);
      foreUpper.rotation.x = -0.85;
      figure.add(foreUpper);

      const foreLower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), crystalMat);
      foreLower.position.set(s * 0.24, 1.26, 0.56);
      foreLower.rotation.x = 0.55;
      figure.add(foreLower);
    }

    // Sweeping Flowing Crystal Tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 6), crystalMat);
    tail.position.set(0, 0.78, -0.52);
    tail.rotation.x = -2.35;
    figure.add(tail);

    // Arched Neck, Sculpted Head, Snout & Crystal Mane/Horns
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.75, 10), quartzMat);
    neck.position.set(0, 1.76, 0.18);
    neck.rotation.x = 0.22;
    figure.add(neck);

    const head = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.68, 6), quartzMat);
    head.position.set(0, 2.12, 0.38);
    head.rotation.x = 1.25;
    figure.add(head);

    for (let s of [-1, 1]) {
      const earHorn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.38, 4), crystalMat);
      earHorn.position.set(s * 0.14, 2.34, 0.16);
      earHorn.rotation.x = -0.45;
      figure.add(earHorn);
    }

    // Multi-Tiered Feathered Pegasus / Dragon Wings
    const wings = createDetailedWings(wingMat, crystalMat, 'feathered');
    wings.position.set(0, 1.48, -0.05);
    figure.add(wings);

  // ==========================================================================
  // 3. BISHOP: ARCANE CRYSTAL MAGE (Hooded Robes, Shoulder Crystal Clusters & Ornate Quartz Staff)
  // ==========================================================================
  } else if (type === 'b') {
    // Layered Flowing Mage Robes + Gold Filigree Stole
    const robeOuter = new THREE.Mesh(new THREE.ConeGeometry(0.56, 1.75, 12), quartzMat);
    robeOuter.position.y = 1.18;
    figure.add(robeOuter);

    const robeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.55, 0.08), filigreeMat);
    robeTrim.position.set(0, 1.12, 0.34);
    robeTrim.rotation.x = -0.24;
    figure.add(robeTrim);

    // Dramatic Clusters of Sharp Crystal Shards Sprouting from Both Shoulders (Blueprint #3)
    for (let s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        const shard = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.52 - k * 0.08, 5), k === 1 ? gemMat : crystalMat);
        shard.position.set(s * (0.34 + k * 0.08), 1.88 + (2 - k) * 0.06, -0.04);
        shard.rotation.z = -s * (0.55 + k * 0.25);
        figure.add(shard);
      }
    }

    // Sculpted Mage Head + Pointed Arcane Cowl / Hood
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), quartzMat);
    head.position.set(0, 2.08, 0.04);
    figure.add(head);

    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.56, 8), gemMat);
    hood.position.set(0, 2.24, -0.02);
    hood.rotation.x = -0.15;
    figure.add(hood);

    // Left Hand Holding Tall Ornate Quartz Staff with Levitating Amethyst Crystal
    const staffGroup = new THREE.Group();
    staffGroup.position.set(-0.44, 1.38, 0.18);
    const staffShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.15, 8), filigreeMat);
    staffGroup.add(staffShaft);

    const staffCradle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.035, 6, 12, Math.PI * 1.4), crystalMat);
    staffCradle.position.y = 1.18;
    staffCradle.rotation.z = Math.PI * 0.3;
    staffGroup.add(staffCradle);

    const staffGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), gemMat);
    staffGem.scale.set(0.8, 1.5, 0.8);
    staffGem.position.y = 1.22;
    staffGem.name = 'floatingCrown';
    staffGroup.add(staffGem);
    figure.add(staffGroup);

    addSpectralFlareSprite(figure, -0.44, 2.62, 0.18, 0.72);

  // ==========================================================================
  // 2. QUEEN: SYLVAN FAIRY SORCERESS (4 Fairy Wings, Jeweled Bodice, Flowing Gown & Scepter)
  // ==========================================================================
  } else if (type === 'q') {
    // Sweeping Split-Skirt Sylvan Gown + Sculpted Waist & Bodice
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.55, 14), quartzMat);
    skirt.position.y = 1.08;
    figure.add(skirt);

    const waistBelt = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 6, 16), filigreeMat);
    waistBelt.rotation.x = Math.PI / 2;
    waistBelt.position.y = 1.58;
    figure.add(waistBelt);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.19, 0.56, 10), quartzMat);
    torso.position.y = 1.86;
    figure.add(torso);

    const chestJewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), gemMat);
    chestJewel.position.set(0, 1.92, 0.22);
    figure.add(chestJewel);

    // Graceful Arms
    for (let s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.65, 8), quartzMat);
      arm.position.set(s * 0.34, 1.72, 0.08);
      arm.rotation.z = -s * 0.35;
      figure.add(arm);
    }

    // Sorceress Head + Jeweled Tiara Diadem
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 12), quartzMat);
    head.position.y = 2.34;
    figure.add(head);

    const tiara = new THREE.Group();
    tiara.position.y = 2.52;
    tiara.name = 'floatingCrown';
    for (let i = -2; i <= 2; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.32 - Math.abs(i) * 0.05, 4), i === 0 ? gemMat : filigreeMat);
      spike.position.set(i * 0.08, 0.08, 0.08);
      spike.rotation.z = -i * 0.18;
      tiara.add(spike);
    }
    figure.add(tiara);

    // 4-Wing Translucent Spun-Glass Fairy Wings (Blueprint #2)
    const fairyWings = createDetailedWings(wingMat, crystalMat, 'fairy');
    fairyWings.position.set(0, 1.92, -0.12);
    figure.add(fairyWings);

    // Left Hand Holding Lotus Crystal Scepter
    const scepterGroup = new THREE.Group();
    scepterGroup.position.set(-0.48, 1.55, 0.16);
    scepterGroup.rotation.z = 0.15;
    const scepterRod = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.65, 8), filigreeMat);
    scepterGroup.add(scepterRod);
    const scepterBloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), crystalMat);
    scepterBloom.position.y = 0.9;
    scepterGroup.add(scepterBloom);
    figure.add(scepterGroup);

    addSpectralFlareSprite(figure, -0.58, 2.45, 0.16, 0.95);

  // ==========================================================================
  // 1. KING: REGAL ELVEN LORD (White Blueprint #1) / ANCIENT DRACONIC DEITY (Amber Board Render)
  // ==========================================================================
  } else if (type === 'k') {
    if (isWhite) {
      // --- WHITE KING: REGAL ELVEN LORD (Matches Blueprint #1 to the letter) ---
      // Armored Greaves & Long Flowing Royal Tunic/Cloak
      for (let s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.85, 8), quartzMat);
        leg.position.set(s * 0.2, 0.72, 0.05);
        figure.add(leg);
      }

      const royalCloak = new THREE.Mesh(new THREE.ConeGeometry(0.64, 2.05, 12), quartzMat);
      royalCloak.position.set(0, 1.32, -0.06);
      figure.add(royalCloak);

      // Gold & Amethyst Filigree Cuirass Armor
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.78, 10), quartzMat);
      torso.position.set(0, 1.68, 0.04);
      figure.add(torso);

      const chestFiligree = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), filigreeMat);
      chestFiligree.scale.set(1.1, 1.3, 0.45);
      chestFiligree.position.set(0, 1.72, 0.24);
      figure.add(chestFiligree);

      const coreAmethyst = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), gemMat);
      coreAmethyst.position.set(0, 1.74, 0.34);
      figure.add(coreAmethyst);

      // HUGE 7-SHARD PRISMATIC DIAMOND HALO FAN BEHIND SHOULDERS (Signature Blueprint #1 Feature!)
      const crystalFan = new THREE.Group();
      crystalFan.position.set(0, 2.05, -0.16);
      for (let i = -3; i <= 3; i++) {
        const len = 1.25 - Math.abs(i) * 0.12;
        const shard = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.17, len, 5), crystalMat);
        const angle = i * 0.26;
        shard.position.set(Math.sin(angle) * 0.48, Math.cos(angle) * 0.45, -Math.abs(i) * 0.02);
        shard.rotation.z = -angle;
        crystalFan.add(shard);
      }
      figure.add(crystalFan);

      // Regal Elven Head + 5-Spire Golden Crown
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), quartzMat);
      head.position.set(0, 2.32, 0.06);
      figure.add(head);

      const goldCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.21, 0.22, 8), filigreeMat);
      goldCrown.position.set(0, 2.52, 0.06);
      figure.add(goldCrown);

      // Left Hand Holding Tall Golden-Hilted Prismatic Diamond Spear-Staff
      const staffGroup = new THREE.Group();
      staffGroup.position.set(-0.56, 1.58, 0.18);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.55, 8), filigreeMat);
      staffGroup.add(shaft);

      const guard = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 8), filigreeMat);
      guard.position.y = 1.25;
      staffGroup.add(guard);

      const diamondBlade = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), crystalMat);
      diamondBlade.scale.set(0.75, 2.2, 0.45);
      diamondBlade.position.y = 1.52;
      staffGroup.add(diamondBlade);
      figure.add(staffGroup);

      addSpectralFlareSprite(figure, -0.56, 3.12, 0.18, 1.15);

    } else {
      // --- BLACK/AMBER KING: ANCIENT DRACONIC DEITY COILED AROUND FLUTED QUARTZ PILLAR ---
      const flutedPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 2.25, 14), quartzMat);
      flutedPillar.position.y = 1.42;
      figure.add(flutedPillar);

      // Coiled Golden Dragon Spiraling Around the Pillar
      const coilPoints = [];
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        const ang = t * Math.PI * 4.5;
        const r = 0.53 - t * 0.05;
        coilPoints.push(new THREE.Vector3(Math.cos(ang) * r, 0.52 + t * 1.98, Math.sin(ang) * r));
      }
      const coilCurve = new THREE.CatmullRomCurve3(coilPoints);
      const dragonBody = new THREE.Mesh(new THREE.TubeGeometry(coilCurve, 32, 0.135, 7, false), filigreeMat);
      figure.add(dragonBody);

      // Fierce Sculpted Dragon Head, Open Jaws & Swept Horns at Pillar Summit
      const dragonHead = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 6), quartzMat);
      dragonHead.position.set(0, 2.86, 0.26);
      dragonHead.rotation.x = Math.PI * 0.38;
      figure.add(dragonHead);

      for (let i = -2; i <= 2; i++) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.62 - Math.abs(i) * 0.08, 4), crystalMat);
        horn.position.set(i * 0.11, 3.12, -0.12);
        horn.rotation.x = -0.55;
        horn.rotation.z = -i * 0.22;
        figure.add(horn);
      }

      addSpectralFlareSprite(figure, 0, 3.25, 0, 1.25);
    }
  }

  group.userData = {
    type,
    color,
    phase: Math.random() * Math.PI * 2
  };

  return group;
}

// ============================================================================
// BOARD SYNC, HIGHLIGHTS & SHATTER PHYSICS
// ============================================================================
function syncBoardWithEngine() {
  Object.keys(pieceObjects).forEach(sq => {
    piecesGroup.remove(pieceObjects[sq]);
    delete pieceObjects[sq];
  });

  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (p) {
        const sq = String.fromCharCode(97 + f) + (8 - r);
        const pos = squareToWorld(sq);
        const mesh = createFantasyPieceMesh(p.type, p.color);
        mesh.position.copy(pos);
        mesh.userData.square = sq;
        piecesGroup.add(mesh);
        pieceObjects[sq] = mesh;
      }
    }
  }

  clearSelectionHighlights();
  updateStatusUI();
}

function clearSelectionHighlights() {
  while (highlightsGroup.children.length > 0) {
    highlightsGroup.remove(highlightsGroup.children[0]);
  }
}

function clearHintVisuals() {
  while (hintGroup.children.length > 0) {
    hintGroup.remove(hintGroup.children[0]);
  }
  currentSuggestedMove = null;
  document.getElementById('hint-banner').classList.remove('visible');
}

function showHighlightsForSquare(sq) {
  clearSelectionHighlights();
  const pos = squareToWorld(sq);

  const selRing = new THREE.Mesh(
    new THREE.RingGeometry(0.74, 0.94, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    })
  );
  selRing.rotation.x = -Math.PI / 2;
  selRing.position.set(pos.x, 0.03, pos.z);
  highlightsGroup.add(selRing);

  legalMovesForSelected.forEach(move => {
    const targetPos = squareToWorld(move.to);
    const isCapture = move.flags.includes('c') || move.flags.includes('e');

    const marker = new THREE.Mesh(
      isCapture ? new THREE.RingGeometry(0.68, 0.95, 6) : new THREE.RingGeometry(0.22, 0.46, 24),
      new THREE.MeshBasicMaterial({
        color: isCapture ? 0xfb7185 : 0x7ef8d6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(targetPos.x, 0.04, targetPos.z);
    highlightsGroup.add(marker);
  });
}

function spawnLandingRipple(worldPos, isWhite) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.5, 32),
    new THREE.MeshBasicMaterial({
      color: isWhite ? 0xc084fc : 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(worldPos.x, 0.04, worldPos.z);
  fxGroup.add(ring);
  activeRipples.push({ mesh: ring, scale: 1.0, life: 1.0 });
}

function spawnCrystalSparkles(worldPos, isWhite, count = 8) {
  const geo = new THREE.OctahedronGeometry(0.07, 0);
  const colorHex = isWhite ? 0xd8b4fe : 0xfde047;
  for (let i = 0; i < count; i++) {
    const spark = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9 })
    );
    spark.position.set(
      worldPos.x + (Math.random() - 0.5) * 0.7,
      0.2 + Math.random() * 0.5,
      worldPos.z + (Math.random() - 0.5) * 0.7
    );
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 2.4,
      0.9 + Math.random() * 1.8,
      (Math.random() - 0.5) * 2.4
    );
    fxGroup.add(spark);
    activeParticles.push({ mesh: spark, vel, life: 1.0 });
  }
}

const sharedShardGeo1 = new THREE.OctahedronGeometry(0.19, 0);
const sharedShardGeo2 = new THREE.TetrahedronGeometry(0.22, 0);

function shatterCrystalPieceAt(worldPos, capturedColor, strikeDir) {
  const isWhite = capturedColor === 'w';
  const baseShell = isWhite ? matPrismaticDiamond : matDraconicAmber;
  const baseCore = isWhite ? matAmethystGem : matRubyAmberGem;

  for (let i = 0; i < 30; i++) {
    const geo = i % 2 === 0 ? sharedShardGeo1 : sharedShardGeo2;
    const shard = new THREE.Mesh(geo, i % 4 === 0 ? baseCore : baseShell);
    shard.scale.set(
      0.5 + Math.random() * 1.1,
      0.4 + Math.random() * 1.2,
      0.5 + Math.random() * 1.1
    );

    shard.position.set(
      worldPos.x + (Math.random() - 0.5) * 0.65,
      0.35 + Math.random() * 1.8,
      worldPos.z + (Math.random() - 0.5) * 0.65
    );

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 9.5 + strikeDir.x * 6.0,
      3.8 + Math.random() * 7.2,
      (Math.random() - 0.5) * 9.5 + strikeDir.z * 6.0
    );

    const rotVel = new THREE.Vector3(
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18,
      (Math.random() - 0.5) * 18
    );

    fxGroup.add(shard);
    activeShards.push({ mesh: shard, vel, rotVel, life: 1.0 });
  }

  spawnLandingRipple(worldPos, isWhite);
  spawnCrystalSparkles(worldPos, isWhite, 18);
  audio.playCrystalShatter();
}

function executeAnimatedMove(moveObj) {
  if (isAnimating) return;
  isAnimating = true;
  clearSelectionHighlights();
  clearHintVisuals();
  selectedSquare = null;
  legalMovesForSelected = [];

  const fromSq = moveObj.from;
  const toSq = moveObj.to;
  const attackerMesh = pieceObjects[fromSq];
  const isCapture = moveObj.flags.includes('c') || moveObj.flags.includes('e');

  let capturedSq = toSq;
  if (moveObj.flags.includes('e')) {
    capturedSq = toSq[0] + fromSq[1];
  }
  const defenderMesh = isCapture ? pieceObjects[capturedSq] : null;

  const startPos = squareToWorld(fromSq);
  const endPos = squareToWorld(toSq);
  const moveVec = new THREE.Vector3().subVectors(endPos, startPos);
  const moveDir = moveVec.clone().normalize();

  const result = chess.move(moveObj);
  if (!result) {
    isAnimating = false;
    return;
  }

  const isWhite = result.color === 'w';

  if (!isCapture) {
    audio.playCrystalGlide(0.22);
    const duration = 240;
    const t0 = performance.now();

    let rookMesh = null, rookStart = null, rookEnd = null;
    if (result.flags.includes('k') || result.flags.includes('q')) {
      const rank = isWhite ? '1' : '8';
      const rFrom = result.flags.includes('k') ? 'h' + rank : 'a' + rank;
      const rTo = result.flags.includes('k') ? 'f' + rank : 'd' + rank;
      rookMesh = pieceObjects[rFrom];
      rookStart = squareToWorld(rFrom);
      rookEnd = squareToWorld(rTo);
    }

    function stepMove(now) {
      const p = Math.min(1, (now - t0) / duration);
      const ease = 1 - Math.pow(1 - p, 3);

      if (attackerMesh) {
        attackerMesh.position.lerpVectors(startPos, endPos, ease);
        const peakHeight = result.piece === 'n' ? 2.2 : 0.65;
        attackerMesh.position.y = Math.sin(p * Math.PI) * peakHeight;

        const tilt = Math.sin(p * Math.PI) * 0.14;
        attackerMesh.rotation.x = moveDir.z * tilt;
        attackerMesh.rotation.z = -moveDir.x * tilt;
      }

      if (rookMesh && rookStart && rookEnd) {
        rookMesh.position.lerpVectors(rookStart, rookEnd, ease);
      }

      if (p < 1) {
        requestAnimationFrame(stepMove);
      } else {
        if (attackerMesh) {
          attackerMesh.rotation.x = 0;
          attackerMesh.rotation.z = 0;
        }
        spawnLandingRipple(endPos, isWhite);
        finishTurn();
      }
    }
    requestAnimationFrame(stepMove);

  } else {
    audio.playCrystalGlide(0.2);
    const totalDur = 410;
    const t0 = performance.now();
    let shattered = false;

    const preStrikePos = endPos.clone().addScaledVector(moveDir, -0.95);

    function stepAttack(now) {
      const p = Math.min(1, (now - t0) / totalDur);

      if (attackerMesh) {
        if (p < 0.45) {
          const sub = p / 0.45;
          const ease = 1 - Math.pow(1 - sub, 2);
          attackerMesh.position.lerpVectors(startPos, preStrikePos, ease);
          attackerMesh.position.y = Math.sin(sub * Math.PI * 0.5) * 1.1;
        } else if (p < 0.65) {
          const sub = (p - 0.45) / 0.2;
          attackerMesh.position.copy(preStrikePos).addScaledVector(moveDir, -0.25 * sub);
          attackerMesh.position.y = 1.1 + 0.55 * sub;
          attackerMesh.rotation.x = -moveDir.z * 0.32 * sub;
          attackerMesh.rotation.z = moveDir.x * 0.32 * sub;
        } else {
          const sub = (p - 0.65) / 0.35;
          const ease = 1 - Math.pow(1 - sub, 3);
          attackerMesh.position.lerpVectors(preStrikePos, endPos, ease);
          attackerMesh.position.y = Math.max(0, 1.65 * (1 - sub * 1.4));
          attackerMesh.rotation.x = 0;
          attackerMesh.rotation.z = 0;

          if (!shattered && sub >= 0.3) {
            shattered = true;
            if (defenderMesh) {
              const defPos = defenderMesh.position.clone();
              piecesGroup.remove(defenderMesh);
              delete pieceObjects[capturedSq];
              shatterCrystalPieceAt(defPos, isWhite ? 'b' : 'w', moveDir);
            }
          }
        }
      }

      if (p < 1) {
        requestAnimationFrame(stepAttack);
      } else {
        finishTurn();
      }
    }
    requestAnimationFrame(stepAttack);
  }
}

function finishTurn() {
  syncBoardWithEngine();
  isAnimating = false;

  if (!chess.game_over() && gameMode === 'ai' && chess.turn() === 'b') {
    setTimeout(() => {
      const aiMove = computeBestMoveForCurrentTurn(2);
      if (aiMove) executeAnimatedMove(aiMove);
    }, 180);
  }
}

// ============================================================================
// SUGGESTED BEST MOVE ENGINE
// ============================================================================
const PIECE_WEIGHTS = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const POSITIONAL_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 15, 15, 10, 10,  5],
  [-5, 5, 15, 22, 22, 15,  5, -5],
  [-5, 5, 20, 32, 32, 20,  5, -5],
  [-5, 5, 20, 32, 32, 20,  5, -5],
  [-5, 5, 15, 22, 22, 15,  5, -5],
  [5, 10, 10, -12, -12, 10, 10, 5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

function evaluatePosition(game, perspectiveColor) {
  if (game.in_checkmate()) {
    return game.turn() === perspectiveColor ? -99999 : 99999;
  }
  if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
    return 0;
  }

  const b = game.board();
  let total = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = b[r][f];
      if (p) {
        const val = PIECE_WEIGHTS[p.type] + POSITIONAL_TABLE[r][f];
        total += p.color === perspectiveColor ? val : -val;
      }
    }
  }
  return total;
}

function minimaxSearch(game, depth, alpha, beta, isMaximizing, perspectiveColor) {
  if (depth === 0 || game.game_over()) {
    return evaluatePosition(game, perspectiveColor);
  }

  const moves = game.moves({ verbose: true });
  moves.sort((a, b) => (b.captured ? 12 : 0) - (a.captured ? 12 : 0));

  if (isMaximizing) {
    let best = -Infinity;
    for (const m of moves) {
      game.move(m);
      const val = minimaxSearch(game, depth - 1, alpha, beta, false, perspectiveColor);
      game.undo();
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      game.move(m);
      const val = minimaxSearch(game, depth - 1, alpha, beta, true, perspectiveColor);
      game.undo();
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function computeBestMoveForCurrentTurn(depth = 3) {
  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  const perspective = chess.turn();
  let bestMove = legalMoves[0];
  let bestScore = -Infinity;

  legalMoves.sort((a, b) => (b.captured ? 15 : 0) - (a.captured ? 15 : 0));

  for (const move of legalMoves) {
    chess.move(move);
    const score = minimaxSearch(chess, depth - 1, -Infinity, Infinity, false, perspective);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

const PIECE_NAMES = {
  p: 'Crystal Goblin',
  n: 'Winged Pegasus',
  b: 'Arcane Mage',
  r: 'Sanctum Tower',
  q: 'Sylvan Sorceress',
  k: 'Regal Monarch'
};

function suggestBestMove() {
  if (isAnimating || chess.game_over()) return;
  if (gameMode === 'ai' && chess.turn() === 'b') return;

  clearHintVisuals();
  const best = computeBestMoveForCurrentTurn(3);
  if (!best) return;

  currentSuggestedMove = best;
  audio.playHintChime();

  const fromPos = squareToWorld(best.from);
  const toPos = squareToWorld(best.to);

  const fromRing = new THREE.Mesh(
    new THREE.RingGeometry(0.74, 0.96, 32),
    new THREE.MeshBasicMaterial({
      color: 0x7ef8d6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
  );
  fromRing.rotation.x = -Math.PI / 2;
  fromRing.position.set(fromPos.x, 0.05, fromPos.z);
  hintGroup.add(fromRing);

  const toRing = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.96, 32),
    new THREE.MeshBasicMaterial({
      color: 0x7ef8d6,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
  );
  toRing.rotation.x = -Math.PI / 2;
  toRing.position.set(toPos.x, 0.05, toPos.z);
  hintGroup.add(toRing);

  const midPos = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
  midPos.y = 2.6;
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(fromPos.x, 0.4, fromPos.z),
    midPos,
    new THREE.Vector3(toPos.x, 0.4, toPos.z)
  );
  const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.075, 8, false);
  const tubeMat = new THREE.MeshBasicMaterial({
    color: 0x7ef8d6,
    transparent: true,
    opacity: 0.88
  });
  hintGroup.add(new THREE.Mesh(tubeGeo, tubeMat));

  selectedSquare = best.from;
  legalMovesForSelected = chess.moves({ square: best.from, verbose: true });

  const pieceLabel = PIECE_NAMES[best.piece] || 'Piece';
  const actionTag = best.captured ? `shatters ${PIECE_NAMES[best.captured]}` : `to ${best.to.toUpperCase()}`;
  document.getElementById('hint-text').textContent =
    `Best Move: ${pieceLabel} ${best.from.toUpperCase()} → ${best.to.toUpperCase()} (${actionTag})`;
  document.getElementById('hint-banner').classList.add('visible');
}

// ============================================================================
// INTERACTION & CAMERA CONTROLS
// ============================================================================
function onBoardClick(event) {
  if (isAnimating || chess.game_over()) return;
  if (gameMode === 'ai' && chess.turn() === 'b') return;

  const rect = renderer.domElement.getBoundingClientRect();
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;

  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const targets = [...Object.values(tileMeshes), ...piecesGroup.children];
  const hits = raycaster.intersectObjects(targets, true);

  if (hits.length === 0) {
    selectedSquare = null;
    legalMovesForSelected = [];
    clearSelectionHighlights();
    return;
  }

  let obj = hits[0].object;
  while (obj && !obj.userData.square && obj.parent) {
    obj = obj.parent;
  }
  const clickedSq = obj ? obj.userData.square : null;
  if (!clickedSq) return;

  const validMoves = legalMovesForSelected.filter(m => m.to === clickedSq);
  if (selectedSquare && validMoves.length > 0) {
    if (validMoves[0].flags.includes('p')) {
      pendingPromotionMove = { from: selectedSquare, to: clickedSq };
      document.getElementById('promo-modal').classList.add('open');
      return;
    }
    executeAnimatedMove(validMoves[0]);
    return;
  }

  const piece = chess.get(clickedSq);
  if (piece && piece.color === chess.turn()) {
    selectedSquare = clickedSq;
    legalMovesForSelected = chess.moves({ square: clickedSq, verbose: true });
    audio.playSelect(piece.color === 'w');
    showHighlightsForSquare(clickedSq);
  } else {
    selectedSquare = null;
    legalMovesForSelected = [];
    clearSelectionHighlights();
  }
}

function updateStatusUI() {
  const turn = chess.turn();
  const gemEl = document.getElementById('turn-gem');
  const turnTextEl = document.getElementById('turn-label');
  const badgeEl = document.getElementById('state-badge');

  if (turn === 'w') {
    gemEl.className = 'crystal-indicator diamond';
    turnTextEl.textContent = "Sylvan Diamond's Turn";
  } else {
    gemEl.className = 'crystal-indicator quartz';
    turnTextEl.textContent = gameMode === 'ai' ? 'Draconic Quartz AI...' : "Draconic Quartz's Turn";
  }

  if (chess.in_checkmate()) {
    badgeEl.textContent = 'Checkmate';
    badgeEl.classList.add('alert');
    const winner = turn === 'w' ? 'Draconic Smoky Quartz' : 'Sylvan Diamond';
    document.getElementById('gameover-title').textContent = 'CHECKMATE';
    document.getElementById('gameover-subtitle').textContent =
      `${winner} triumphs across the Obsidian Sanctuary.`;
    document.getElementById('gameover-modal').classList.add('open');
  } else if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) {
    badgeEl.textContent = 'Draw';
    badgeEl.classList.add('alert');
    document.getElementById('gameover-title').textContent = 'ETHEREAL DRAW';
    document.getElementById('gameover-subtitle').textContent =
      'The match concludes in an unbreakable crystal stalemate.';
    document.getElementById('gameover-modal').classList.add('open');
  } else if (chess.in_check()) {
    badgeEl.textContent = 'Check';
    badgeEl.classList.add('alert');
  } else {
    badgeEl.textContent = `Move ${Math.floor(chess.history().length / 2) + 1}`;
    badgeEl.classList.remove('alert');
  }

  const history = chess.history({ verbose: true });
  document.getElementById('btn-undo').disabled = history.length === 0;

  let quartzShattered = 0;
  let diamondShattered = 0;
  history.forEach(m => {
    if (m.captured) {
      if (m.color === 'w') quartzShattered++;
      else diamondShattered++;
    }
  });

  document.getElementById('diamond-captures').textContent = quartzShattered;
  document.getElementById('quartz-captures').textContent = diamondShattered;
}

function setCameraView(viewKey) {
  const preset = CAMERA_VIEWS[viewKey];
  if (!preset) return;
  activeCameraKey = viewKey;

  document.querySelectorAll('.cam-toggle').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cam === viewKey);
  });

  // Lock camera controls when any fixed view is chosen; enable free orbit only in 'orbit' mode
  const isFreeOrbit = viewKey === 'orbit';
  if (controls) {
    controls.enabled = isFreeOrbit;
    controls.enableRotate = isFreeOrbit;
    controls.enablePan = isFreeOrbit;
    controls.enableZoom = isFreeOrbit;
  }

  camTransition = {
    startPos: camera.position.clone(),
    endPos: preset.pos.clone(),
    startTarget: controls.target.clone(),
    endTarget: preset.target.clone(),
    startTime: performance.now(),
    duration: 280
  };
}

// ============================================================================
// 120 FPS MAIN RENDER & ANIMATION LOOP
// ============================================================================
function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min(0.033, clock.getDelta());
  const elapsed = clock.getElapsedTime();

  for (const sq in pieceObjects) {
    const piece = pieceObjects[sq];
    const phase = piece.userData.phase;

    const crown = piece.getObjectByName('floatingCrown');
    if (crown) {
      crown.rotation.y += dt * 1.4;
    }

    const wings = piece.getObjectByName('animWings');
    if (wings) {
      const flap = Math.sin(elapsed * 2.6 + phase) * 0.1;
      const lw = wings.getObjectByName('leftWing');
      const rw = wings.getObjectByName('rightWing');
      if (lw) lw.rotation.y = flap;
      if (rw) rw.rotation.y = -flap;
    }

    if (!isAnimating) {
      if (selectedSquare && sq === selectedSquare) {
        piece.position.y = 0.28 + Math.sin(elapsed * 5.0) * 0.07;
      } else {
        piece.position.y = Math.sin(elapsed * 2.0 + phase) * 0.025 + 0.025;
      }
    }
  }

  highlightsGroup.children.forEach((ring, idx) => {
    ring.rotation.z += dt * (idx === 0 ? 1.0 : -1.4);
  });

  for (let i = activeShards.length - 1; i >= 0; i--) {
    const s = activeShards[i];
    s.vel.y -= 24.0 * dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.mesh.rotation.x += s.rotVel.x * dt;
    s.mesh.rotation.y += s.rotVel.y * dt;
    s.mesh.rotation.z += s.rotVel.z * dt;

    if (s.mesh.position.y < 0.08) {
      s.mesh.position.y = 0.08;
      s.vel.y *= -0.42;
      s.vel.x *= 0.72;
      s.vel.z *= 0.72;
    }

    s.life -= dt * 0.55;
    if (s.life < 0.35) {
      const scaleFade = Math.max(0.01, s.life / 0.35);
      s.mesh.scale.multiplyScalar(scaleFade);
    }
    if (s.life <= 0) {
      fxGroup.remove(s.mesh);
      activeShards.splice(i, 1);
    }
  }

  for (let i = activeRipples.length - 1; i >= 0; i--) {
    const r = activeRipples[i];
    r.scale += dt * 4.2;
    r.life -= dt * 1.8;
    r.mesh.scale.set(r.scale, r.scale, 1);
    r.mesh.material.opacity = Math.max(0, r.life);
    if (r.life <= 0) {
      fxGroup.remove(r.mesh);
      activeRipples.splice(i, 1);
    }
  }

  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.mesh.position.addScaledVector(p.vel, dt);
    p.life -= dt * 1.6;
    p.mesh.material.opacity = Math.max(0, p.life);
    if (p.life <= 0) {
      fxGroup.remove(p.mesh);
      activeParticles.splice(i, 1);
    }
  }

  if (camTransition) {
    const nowTime = typeof now === 'number' ? now : performance.now();
    const t = Math.min(1, Math.max(0, (nowTime - camTransition.startTime) / camTransition.duration));
    const ease = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(camTransition.startPos, camTransition.endPos, ease);
    controls.target.lerpVectors(camTransition.startTarget, camTransition.endTarget, ease);
    camera.lookAt(controls.target);
    if (t >= 1) {
      camTransition = null;
      if (activeCameraKey === 'orbit') {
        controls.update();
      }
    }
  } else if (activeCameraKey === 'orbit') {
    controls.update();
  } else {
    const lockedPreset = CAMERA_VIEWS[activeCameraKey];
    if (lockedPreset) {
      camera.position.copy(lockedPreset.pos);
      camera.lookAt(lockedPreset.target);
    }
  }

  renderer.render(scene, camera);
}

function initApp() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);
  scene.fog = new THREE.FogExp2(0x06080f, 0.015);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.copy(CAMERA_VIEWS.orbit.pos);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.autoRotate = false;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 8.0;
  controls.maxDistance = 36;
  controls.target.copy(CAMERA_VIEWS.orbit.target);

  controls.addEventListener('start', () => {
    camTransition = null;
  });

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  scene.add(new THREE.AmbientLight(0x4a5578, 1.1));

  const celestialKey = new THREE.DirectionalLight(0xe0f2fe, 1.65);
  celestialKey.position.set(12, 24, 14);
  celestialKey.castShadow = true;
  celestialKey.shadow.mapSize.set(1024, 1024);
  celestialKey.shadow.camera.near = 6;
  celestialKey.shadow.camera.far = 55;
  const d = 11.5;
  celestialKey.shadow.camera.left = -d;
  celestialKey.shadow.camera.right = d;
  celestialKey.shadow.camera.top = d;
  celestialKey.shadow.camera.bottom = -d;
  celestialKey.shadow.bias = -0.0005;
  scene.add(celestialKey);

  const amberRim = new THREE.DirectionalLight(0xfbbf24, 1.35);
  amberRim.position.set(-16, 14, -10);
  scene.add(amberRim);

  const amethystRim = new THREE.DirectionalLight(0xc084fc, 1.15);
  amethystRim.position.set(16, 12, -12);
  scene.add(amethystRim);

  initMaterials();
  buildEnvironmentAndBoard();

  piecesGroup = new THREE.Group();
  highlightsGroup = new THREE.Group();
  hintGroup = new THREE.Group();
  fxGroup = new THREE.Group();
  scene.add(piecesGroup);
  scene.add(highlightsGroup);
  scene.add(hintGroup);
  scene.add(fxGroup);

  syncBoardWithEngine();
  loadEnabledGLBModels();

  let downPt = { x: 0, y: 0 };
  renderer.domElement.addEventListener('pointerdown', e => {
    downPt = { x: e.clientX, y: e.clientY };
  });
  renderer.domElement.addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) < 6) {
      onBoardClick(e);
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  document.querySelectorAll('.cam-toggle').forEach(btn => {
    btn.addEventListener('click', () => setCameraView(btn.dataset.cam));
  });

  document.getElementById('btn-suggest').addEventListener('click', suggestBestMove);

  document.getElementById('btn-play-suggested').addEventListener('click', () => {
    if (currentSuggestedMove && !isAnimating) {
      executeAnimatedMove(currentSuggestedMove);
    }
  });

  document.getElementById('btn-dismiss-hint').addEventListener('click', clearHintVisuals);

  document.getElementById('btn-mode').addEventListener('click', () => {
    gameMode = gameMode === 'ai' ? '2p' : 'ai';
    document.getElementById('mode-icon').textContent = gameMode === 'ai' ? 'smart_toy' : 'group';
    document.getElementById('mode-label').textContent = gameMode === 'ai' ? 'vs AI' : '2P Local';
    updateStatusUI();
    if (gameMode === 'ai' && chess.turn() === 'b' && !chess.game_over()) {
      setTimeout(() => {
        const aiMove = computeBestMoveForCurrentTurn(2);
        if (aiMove) executeAnimatedMove(aiMove);
      }, 200);
    }
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    if (isAnimating) return;
    clearHintVisuals();
    if (gameMode === 'ai') {
      chess.undo();
      chess.undo();
    } else {
      chess.undo();
    }
    syncBoardWithEngine();
  });

  const resetMatch = () => {
    if (isAnimating) return;
    clearHintVisuals();
    chess.reset();
    document.getElementById('gameover-modal').classList.remove('open');
    syncBoardWithEngine();
  };

  document.getElementById('btn-reset').addEventListener('click', resetMatch);
  document.getElementById('btn-modal-new').addEventListener('click', resetMatch);
  document.getElementById('btn-modal-inspect').addEventListener('click', () => {
    document.getElementById('gameover-modal').classList.remove('open');
  });

  document.getElementById('btn-audio').addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    document.getElementById('audio-icon').textContent = audio.enabled ? 'volume_up' : 'volume_off';
    document.getElementById('btn-audio').classList.toggle('active', audio.enabled);
  });

  document.querySelectorAll('.promo-card').forEach(card => {
    card.addEventListener('click', () => {
      const promo = card.dataset.promo;
      document.getElementById('promo-modal').classList.remove('open');
      if (pendingPromotionMove) {
        const move = legalMovesForSelected.find(
          m => m.to === pendingPromotionMove.to && m.promotion === promo
        ) || { ...pendingPromotionMove, promotion: promo, flags: 'p' };
        pendingPromotionMove = null;
        executeAnimatedMove(move);
      }
    });
  });

  requestAnimationFrame(animate);
}

window.addEventListener('DOMContentLoaded', initApp);
