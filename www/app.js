// ============================================================================
// SANCTUM CHESS — THE CRYSTALLINE REALM CHESS SET (HIGH-DETAIL BLUEPRINT EDITION)
// Matches the exact anatomy of "The Crystalline Realm Chess Set" Blueprint
// & Macro Board Render while maintaining 120 FPS via shared geometry caching.
// ============================================================================

class CrystalAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.8;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
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
    gain.connect(this.masterGain || this.ctx.destination);
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
    gain.connect(this.masterGain || this.ctx.destination);
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
    subGain.connect(this.masterGain || this.ctx.destination);
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
      g.connect(this.masterGain || this.ctx.destination);
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
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.29);
    });
  }
}

const audio = new CrystalAudioEngine();

// --- CONSTANTS & ENGINE STATE ---
const TILE_SIZE = 2.15;
const BOARD_OFFSET = (TILE_SIZE * 7) / 2;
const ORBIT_MAX_DISTANCE = 80;
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
let aiDifficulty = 2;
let activeCameraKey = 'orbit';
let redoStack = [];
let lastMove = null; // {from,to}
let moveHistory = []; // SAN strings
let mobileLayoutActive = false;
const CLOCK_OPTIONS_MINUTES = [3, 5, 10];
let selectedClockMinutes = 10;
let clockState = createClockState(selectedClockMinutes);
let lastClockDisplay = '';
let ambientLight = null;
let fittedTopDistance = 0;
let isAnimating = false;
let selectedSquare = null;
let legalMovesForSelected = [];
let pendingPromotionMove = null;
let currentSuggestedMove = null;

// Three.js Scene Graph & Post-Processing
let scene, camera, renderer, composer, bloomPass, vignettePass, controls, clock, raycaster, mouse;
let environmentGroup, boardGroup, piecesGroup, highlightsGroup, hintGroup, fxGroup;
let sanctumReliefMesh = null;
const sanctumCandleLights = [];
let sanctumDustMotes = null;
let sanctumDustBaseData = null;

const SANCTUM_WIDTH = 72;
const SANCTUM_HEIGHT = 48;
const SANCTUM_DISPLACEMENT_SCALE = 8.5;

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
let texStarFlare;

const CAMERA_VIEWS = {
  orbit:     { pos: new THREE.Vector3(12.2, 9.2, 15.6),  target: new THREE.Vector3(0, 1.4, 0) },
  white:     { pos: new THREE.Vector3(0, 9.6, 18.2),     target: new THREE.Vector3(0, 1.2, 0) },
  black:     { pos: new THREE.Vector3(0, 9.6, -18.2),    target: new THREE.Vector3(0, 1.2, 0) },
  top:       { pos: new THREE.Vector3(0, 25.5, 0.01),    target: new THREE.Vector3(0, 0, 0) },
  cathedral: { pos: new THREE.Vector3(-15.5, 6.4, 15.2), target: new THREE.Vector3(0, 2.2, 0) }
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

  // Neutral dark gradient (no colored flares) so crystal reflections stay clean.
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#0a0e1a');
  grad.addColorStop(0.45, '#141a2a');
  grad.addColorStop(0.52, '#181d2c');
  grad.addColorStop(1, '#05070c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

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

function initMaterials() {
  const envMap = createPrismaticEnvMap();
  scene.environment = envMap;

  texStarFlare = createStarFlareTexture();
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
    emissiveIntensity: 0.20,
    roughness: 0.30,
    metalness: 0.80,
    envMap,
    envMapIntensity: 1.5
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

  // --- BOARD MATERIALS (100% Solid Opaque Crystal & Obsidian Tiles) ---
  matGlowingDiamondTile = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    map: diamondTileTex,
    emissive: 0x38bdf8,
    emissiveMap: diamondTileTex,
    emissiveIntensity: 0.12,
    roughness: 0.14,
    metalness: 0.12,
    envMap,
    envMapIntensity: 1.35,
    transparent: false
  });

  matObsidianMirrorTile = new THREE.MeshStandardMaterial({
    color: 0x090c14,
    map: obsidianTex,
    roughness: 0.10,
    metalness: 0.48,
    envMap,
    envMapIntensity: 1.6,
    transparent: false
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
// CELESTIAL GOTHIC TEMPLE SANCTUM (2.5D DISPLACED RELIEF + PBR + DYNAMIC LIGHTS)
// ============================================================================
function buildEnvironmentAndBoard() {
  environmentGroup = new THREE.Group();
  boardGroup = new THREE.Group();
  scene.add(environmentGroup);
  scene.add(boardGroup);

  const texLoader = new THREE.TextureLoader();
  const maxAniso = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;

  const configureTex = (tex) => {
    tex.anisotropy = Math.min(8, maxAniso);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  };

  const diffuseTex   = configureTex(texLoader.load('./assets/sanctum_diffuse.png'));
  const normalTex    = configureTex(texLoader.load('./assets/sanctum_normal.png'));
  const roughnessTex = configureTex(texLoader.load('./assets/sanctum_roughness.png'));

  // --------------------------------------------------------------------------
  // SURROUNDING 3D STANDING CATHEDRAL ROTUNDA / VAULTED SANCTUM WALLS
  // Uses the 360 equirectangular cathedral artwork (sanctum_pano.jpg) mapped onto
  // an architectural rotunda dome + environment map so standing pillars, Gothic
  // stained-glass windows, and vaulted arches rise all around the courtyard!
  // --------------------------------------------------------------------------
  texLoader.load(
    './assets/sanctum_pano.jpg',
    panoTex => {
      panoTex.mapping = THREE.EquirectangularReflectionMapping;
      panoTex.anisotropy = Math.min(8, maxAniso);
      scene.environment = panoTex;

      // Full-height 360 Cathedral Rotunda Cylinder + Vaulted Dome so the standing
      // marble pillars, Gothic arches, stained glass windows, and royal-blue banners
      // rise vertically around the courtyard in crystal-clear 3D space (no horizon seam!)
      // Keep the camera inside the panoramic sanctum even at maximum zoom-out.
      const domeGeo = new THREE.SphereGeometry(100, 96, 64);
      const pos = domeGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        if (y < 0) {
          // Flatten lower hemisphere into a level cathedral floor at y = -0.32
          const t = Math.min(1.0, Math.abs(y) / 14.0);
          y = -t * 4.5;
        } else {
          // Tall vertical cathedral walls & Gothic vaulted ceiling
          y *= 0.95;
        }
        pos.setXYZ(i, x, y, z);
      }
      domeGeo.computeVertexNormals();

      const domeMat = new THREE.MeshBasicMaterial({
        map: panoTex,
        side: THREE.BackSide,
        fog: false
      });
      const sanctumDome = new THREE.Mesh(domeGeo, domeMat);
      sanctumDome.position.set(0, 4.2, 0);
      sanctumDome.rotation.y = -Math.PI * 0.5; // Align main altar directly to North (-Z)
      environmentGroup.add(sanctumDome);
    },
    undefined,
    () => {}
  );

  // --------------------------------------------------------------------------
  // STEP 2: Perfectly flat Sanctum Courtyard Floor & Stepped Dais Plinth
  // The floor is a single 4-vertex plane at a constant height. No displacement,
  // no subdivided vertices, no hidden height variation.
  // --------------------------------------------------------------------------
  const sanctumGeo = new THREE.PlaneGeometry(SANCTUM_WIDTH, SANCTUM_HEIGHT, 1, 1);
  if (sanctumGeo.attributes.uv) {
    sanctumGeo.setAttribute('uv2', new THREE.BufferAttribute(sanctumGeo.attributes.uv.array, 2));
  }

  const sanctumMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: diffuseTex,
    emissive: 0xffffff,
    emissiveMap: diffuseTex,
    emissiveIntensity: 0.10, // marble detail, not a light source
    normalMap: normalTex,
    normalScale: new THREE.Vector2(0.18, 0.18), // subtle veining only
    roughnessMap: roughnessTex,
    roughness: 0.62, // polished marble, not a mirror
    metalness: 0.0, // marble is dielectric
    aoMap: roughnessTex,
    aoMapIntensity: 0.30,
    envMap: scene.environment,
    envMapIntensity: 0.55, // restrained reflections
    transparent: true
  });

  // Only fade the outer edge into the rotunda walls; the surface stays physically flat.
  sanctumMat.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphamap_fragment>',
      `
      #include <alphamap_fragment>
      vec2 borderUV = smoothstep(vec2(0.02), vec2(0.16), vUv) * smoothstep(vec2(0.02), vec2(0.16), vec2(1.0) - vUv);
      diffuseColor.a *= (borderUV.x * borderUV.y);
      `
    );
  };

  sanctumReliefMesh = new THREE.Mesh(sanctumGeo, sanctumMat);
  sanctumReliefMesh.rotation.x = -Math.PI / 2;
  sanctumReliefMesh.position.set(0, -0.24, 0);
  sanctumReliefMesh.receiveShadow = true;
  environmentGroup.add(sanctumReliefMesh);

  // Solid obsidian plinth + a thin, symmetrical gold frame + 64 coplanar tiles.
  const boardSpan = TILE_SIZE * 8;
  const boardPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(boardSpan + 0.72, 0.18, boardSpan + 0.72),
    matGoldFiligree
  );
  boardPlinth.position.y = -0.17;
  boardPlinth.receiveShadow = true;
  boardGroup.add(boardPlinth);

  const slabMain = new THREE.Mesh(
    new THREE.BoxGeometry(boardSpan + 0.42, 0.18, boardSpan + 0.42),
    matChiseledObsidianSlab
  );
  slabMain.position.y = -0.155; // offset from the floor plane to avoid any coplanar overlap
  slabMain.receiveShadow = true;
  boardGroup.add(slabMain);

  // Tiles are exactly TILE_SIZE so they meet edge-to-edge with no gaps or overlaps,
  // and every tile shares the same height and plane.
  const tileGeo = new THREE.BoxGeometry(TILE_SIZE, 0.18, TILE_SIZE);
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const isLight = (r + f) % 2 === 1;
      const sq = String.fromCharCode(97 + f) + (r + 1);
      const pos = squareToWorld(sq);

      const tile = new THREE.Mesh(tileGeo, isLight ? matGlowingDiamondTile : matObsidianMirrorTile);
      tile.position.set(pos.x, -0.06, pos.z);
      tile.receiveShadow = true;
      tile.userData = { square: sq, isLight };
      boardGroup.add(tile);
      tileMeshes[sq] = tile;
    }
  }

  // --------------------------------------------------------------------------
  // STEP 3A: Flickering Warm Candle & Brazier PointLights (#ffaa44, decay: 2)
  // Placed at the exact 3D coordinates of the braziers & sconces in sanctum_diffuse.png
  // --------------------------------------------------------------------------
  sanctumCandleLights.length = 0;
  const candleSpecs = [
    // South foreground grand braziers flanking the lower stairs
    { x: -8.2,  y: 3.8, z: 15.6, baseIntensity: 1.45, dist: 22 },
    { x:  8.2,  y: 3.8, z: 15.6, baseIntensity: 1.45, dist: 22 },
    // North altar candelabras & upper stair sconces
    { x: -12.0, y: 4.2, z: -13.2, baseIntensity: 1.25, dist: 20 },
    { x:  12.0, y: 4.2, z: -13.2, baseIntensity: 1.25, dist: 20 },
    { x: -7.5,  y: 5.8, z: -18.5, baseIntensity: 1.35, dist: 22 },
    { x:  7.5,  y: 5.8, z: -18.5, baseIntensity: 1.35, dist: 22 },
    // Inner sanctum perimeter sconces along left & right marble colonnades
    { x: -18.6, y: 2.8, z: -5.2, baseIntensity: 1.15, dist: 19 },
    { x: -18.6, y: 2.8, z:  4.6, baseIntensity: 1.15, dist: 19 },
    { x:  18.6, y: 2.8, z: -5.2, baseIntensity: 1.15, dist: 19 },
    { x:  18.6, y: 2.8, z:  4.6, baseIntensity: 1.15, dist: 19 },
    // Outer upper balcony sconces
    { x: -27.5, y: 6.8, z: -0.5, baseIntensity: 1.05, dist: 20 },
    { x:  27.5, y: 6.8, z: -0.5, baseIntensity: 1.05, dist: 20 }
  ];

  candleSpecs.forEach((spec, idx) => {
    const pLight = new THREE.PointLight(0xffaa44, spec.baseIntensity, spec.dist, 2);
    pLight.position.set(spec.x, spec.y, spec.z);
    environmentGroup.add(pLight);

    // Subtle warm flame core sprite at each brazier/sconce so UnrealBloomPass catches the live flame
    const flameMat = new THREE.SpriteMaterial({
      map: texStarFlare,
      color: 0xffbb55,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const flameSprite = new THREE.Sprite(flameMat);
    flameSprite.position.set(spec.x, spec.y - 0.35, spec.z);
    flameSprite.scale.set(1.25, 1.25, 1);
    environmentGroup.add(flameSprite);

    sanctumCandleLights.push({
      light: pLight,
      sprite: flameSprite,
      baseIntensity: spec.baseIntensity,
      seed: idx * 3.17 + Math.random() * 5.0
    });
  });

  // --------------------------------------------------------------------------
  // STEP 3B: Cool Celestial Directional / Spot Lights (#88bbff) from Corner Windows
  // Casting subtle cross-shadows across the chessboard
  // --------------------------------------------------------------------------
  const windowLightNW = new THREE.SpotLight(0x88bbff, 1.25, 90, Math.PI / 3.0, 0.6, 1.5);
  windowLightNW.position.set(-32, 20, -20);
  windowLightNW.target.position.set(0, 0, 0);
  windowLightNW.castShadow = true;
  windowLightNW.shadow.mapSize.set(1024, 1024);
  windowLightNW.shadow.camera.near = 10;
  windowLightNW.shadow.camera.far = 75;
  windowLightNW.shadow.bias = -0.0005;
  environmentGroup.add(windowLightNW);
  environmentGroup.add(windowLightNW.target);

  const windowLightNE = new THREE.SpotLight(0x88bbff, 1.15, 90, Math.PI / 3.0, 0.6, 1.5);
  windowLightNE.position.set(32, 20, -20);
  windowLightNE.target.position.set(0, 0, 0);
  windowLightNE.castShadow = true;
  windowLightNE.shadow.mapSize.set(1024, 1024);
  windowLightNE.shadow.camera.near = 10;
  windowLightNE.shadow.camera.far = 75;
  windowLightNE.shadow.bias = -0.0005;
  environmentGroup.add(windowLightNE);
  environmentGroup.add(windowLightNE.target);

  // Secondary fill directional lights from SE/SW corner windows
  const windowFillSW = new THREE.DirectionalLight(0x88bbff, 0.45);
  windowFillSW.position.set(-30, 15, 20);
  environmentGroup.add(windowFillSW);

  const windowFillSE = new THREE.DirectionalLight(0x88bbff, 0.45);
  windowFillSE.position.set(30, 15, 20);
  environmentGroup.add(windowFillSE);

  // --------------------------------------------------------------------------
  // STEP 3C: Floating Golden Dust Motes / Embers around Perimeter Pillars
  // --------------------------------------------------------------------------
  const moteCount = 320;
  const motePositions = new Float32Array(moteCount * 3);
  sanctumDustBaseData = [];

  for (let i = 0; i < moteCount; i++) {
    // Concentrate around the perimeter colonnades, stairs, and braziers (radius 10..31)
    const angle = Math.random() * Math.PI * 2;
    const radiusX = 11.5 + Math.random() * 21.0;
    const radiusZ = 9.5 + Math.random() * 13.0;
    const x = Math.cos(angle) * radiusX;
    const y = 0.2 + Math.random() * 11.5;
    const z = Math.sin(angle) * radiusZ;

    motePositions[i * 3]     = x;
    motePositions[i * 3 + 1] = y;
    motePositions[i * 3 + 2] = z;

    sanctumDustBaseData.push({
      baseX: x,
      baseZ: z,
      speedY: 0.28 + Math.random() * 0.45,
      swayAmp: 0.25 + Math.random() * 0.45,
      swayFreq: 0.6 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2
    });
  }

  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));

  const moteMat = new THREE.PointsMaterial({
    color: 0xffcc66,
    map: texStarFlare,
    size: 0.42,
    transparent: true,
    opacity: 0.78,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  sanctumDustMotes = new THREE.Points(moteGeo, moteMat);
  environmentGroup.add(sanctumDustMotes);
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
  highlightLastMove();
  highlightCheck();
  updateStatusUI();
  updateUndoRedoButtons();
  renderMoveHistory();
}

function clearSelectionHighlights() {
  while (highlightsGroup.children.length > 0) {
    highlightsGroup.remove(highlightsGroup.children[0]);
  }
}

function highlightLastMove() {
  if (!lastMove) return;
  [lastMove.from, lastMove.to].forEach(sq => {
    const pos = squareToWorld(sq);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.0, 32),
      new THREE.MeshBasicMaterial({ color: 0x7ef8d6, side: THREE.DoubleSide, transparent: true, opacity: 0.35 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.02, pos.z);
    highlightsGroup.add(ring);
  });
}

function highlightCheck() {
  if (!chess.in_check()) return;
  // find king square
  const turn = chess.turn();
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (p && p.type === 'k' && p.color === turn) {
        const sq = String.fromCharCode(97 + f) + (8 - r);
        const pos = squareToWorld(sq);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.6, 0.85, 32),
          new THREE.MeshBasicMaterial({ color: 0xff5555, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(pos.x, 0.03, pos.z);
        highlightsGroup.add(ring);
      }
    }
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
  updateChessClock();
  if (clockState.flaggedColor) return;
  if (isAnimating) return;
  if (!clockState.started) startChessClock(chess.turn());
  isAnimating = true;
  redoStack = [];
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

  lastMove = { from: result.from, to: result.to };
  moveHistory.push(result.san);
  redoStack = [];
  renderMoveHistory();
  switchChessClock(chess.turn());

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
  updateChessClock();
  syncBoardWithEngine();
  isAnimating = false;

  if (!clockState.flaggedColor && !chess.game_over() && gameMode === 'ai' && chess.turn() === 'b') {
    setTimeout(() => {
      if (!updateChessClock() || clockState.flaggedColor) return;
      const aiMove = computeBestMoveForCurrentTurn(aiDifficulty);
      if (!updateChessClock() || clockState.flaggedColor) return;
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
        const tableRow = p.color === 'w' ? r : 7 - r;
        const val = PIECE_WEIGHTS[p.type] + POSITIONAL_TABLE[tableRow][f];
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
  const best = computeBestMoveForCurrentTurn(Math.min(4, aiDifficulty + 1));
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

  document.getElementById('hint-text').textContent =
    `Best Move: ${best.from.toUpperCase()} --> ${best.to.toUpperCase()}`;
  document.getElementById('hint-banner').classList.add('visible');
}

// ============================================================================
// INTERACTION & CAMERA CONTROLS
// ============================================================================
function onBoardClick(event) {
  updateChessClock();
  if (clockState.flaggedColor) return;
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
    if (!clockState.started) startChessClock(chess.turn());
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

function renderMoveHistory() {
  const list = document.getElementById('move-list');
  if (!list) return;
  list.innerHTML = '';
  for (let i = 0; i < moveHistory.length; i += 2) {
    const li = document.createElement('li');
    const num = document.createElement('span');
    num.className = 'mv-num';
    num.textContent = (i / 2 + 1) + '.';
    li.appendChild(num);
    const w = document.createElement('span');
    w.className = 'mv-white';
    w.textContent = moveHistory[i] || '';
    li.appendChild(w);
    if (moveHistory[i + 1]) {
      const b = document.createElement('span');
      b.className = 'mv-black';
      b.textContent = moveHistory[i + 1];
      li.appendChild(b);
    }
    list.appendChild(li);
  }
  list.scrollTop = list.scrollHeight;
}

function updateUndoRedoButtons() {
  const u = document.getElementById('btn-undo');
  const r = document.getElementById('btn-redo');
  if (u) u.disabled = chess.history().length === 0;
  if (r) r.disabled = redoStack.length === 0;
}

function createClockState(minutes = 10) {
  const duration = minutes * 60 * 1000;
  return {
    whiteMs: duration,
    blackMs: duration,
    activeColor: 'w',
    started: false,
    lastTickAt: null,
    flaggedColor: null
  };
}

function getClockMilliseconds(color) {
  return color === 'w' ? clockState.whiteMs : clockState.blackMs;
}

function setClockMilliseconds(color, value) {
  if (color === 'w') clockState.whiteMs = Math.max(0, value);
  else clockState.blackMs = Math.max(0, value);
}

function formatClock(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function renderChessClocks(force = false) {
  const whiteValue = document.getElementById('clock-white-value');
  const blackValue = document.getElementById('clock-black-value');
  const whiteChip = document.getElementById('clock-white');
  const blackChip = document.getElementById('clock-black');
  if (!whiteValue || !blackValue || !whiteChip || !blackChip) return;

  const whiteText = formatClock(clockState.whiteMs);
  const blackText = formatClock(clockState.blackMs);
  const displayKey = `${whiteText}|${blackText}|${clockState.activeColor}|${clockState.flaggedColor}|${clockState.started}`;
  if (!force && displayKey === lastClockDisplay) return;
  lastClockDisplay = displayKey;

  whiteValue.textContent = whiteText;
  blackValue.textContent = blackText;
  whiteValue.dateTime = `PT${Math.ceil(clockState.whiteMs / 1000)}S`;
  blackValue.dateTime = `PT${Math.ceil(clockState.blackMs / 1000)}S`;
  whiteChip.classList.toggle('active', !clockState.flaggedColor && clockState.activeColor === 'w');
  blackChip.classList.toggle('active', !clockState.flaggedColor && clockState.activeColor === 'b');
  whiteChip.classList.toggle('flagged', clockState.flaggedColor === 'w');
  blackChip.classList.toggle('flagged', clockState.flaggedColor === 'b');

  const selector = document.getElementById('clock-control');
  if (selector) {
    selector.value = String(selectedClockMinutes);
    selector.disabled = clockState.started || Boolean(clockState.flaggedColor);
  }
}

function startChessClock(color = chess.turn()) {
  if (clockState.started || clockState.flaggedColor) return;
  clockState.started = true;
  clockState.activeColor = color;
  clockState.lastTickAt = performance.now();
  renderChessClocks(true);
}

function pauseChessClock() {
  clockState.activeColor = null;
  clockState.lastTickAt = null;
  renderChessClocks(true);
}

function handleClockFlagFall(color) {
  if (!color || clockState.flaggedColor) return;
  clockState.flaggedColor = color;
  clockState.activeColor = null;
  clockState.lastTickAt = null;
  showClockTimeout(color);
  renderChessClocks(true);
  saveGame();
}

function showClockTimeout(color) {
  const loser = color === 'w' ? 'Sylvan Diamond' : 'Draconic Smoky Quartz';
  const winner = color === 'w' ? 'Draconic Smoky Quartz' : 'Sylvan Diamond';
  const badge = document.getElementById('state-badge');
  if (badge) {
    badge.textContent = 'Timeout';
    badge.classList.add('alert');
  }
  document.getElementById('gameover-title').textContent = 'TIME OUT';
  document.getElementById('gameover-subtitle').textContent = `${loser} ran out of time. ${winner} wins.`;
  document.getElementById('gameover-modal').classList.add('open');
}

function updateChessClock(now = performance.now()) {
  if (clockState.flaggedColor) return false;
  if (chess.game_over()) {
    pauseChessClock();
    return false;
  }
  if (!clockState.started || !clockState.activeColor || clockState.lastTickAt === null) {
    renderChessClocks();
    return true;
  }

  const elapsed = Math.max(0, now - clockState.lastTickAt);
  clockState.lastTickAt = now;
  const nextRemaining = Math.max(0, getClockMilliseconds(clockState.activeColor) - elapsed);
  setClockMilliseconds(clockState.activeColor, nextRemaining);
  if (nextRemaining <= 0) {
    handleClockFlagFall(clockState.activeColor);
    return false;
  }
  renderChessClocks();
  return true;
}

function switchChessClock(color) {
  if (!updateChessClock() || clockState.flaggedColor) return false;
  if (chess.game_over()) {
    pauseChessClock();
    return false;
  }
  if (!clockState.started) startChessClock(color);
  clockState.activeColor = color;
  clockState.lastTickAt = performance.now();
  renderChessClocks(true);
  return true;
}

function alignChessClockAfterHistoryChange() {
  updateChessClock();
  if (!clockState.started || clockState.flaggedColor) return;
  clockState.activeColor = chess.turn();
  clockState.lastTickAt = performance.now();
  renderChessClocks(true);
}

function resetChessClock() {
  clockState = createClockState(selectedClockMinutes);
  lastClockDisplay = '';
  renderChessClocks(true);
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

  if (clockState.flaggedColor) {
    badgeEl.textContent = 'Timeout';
    badgeEl.classList.add('alert');
  }
  renderChessClocks();
}

function computeTopViewDistance() {
  const width = Math.max(1, renderer ? renderer.domElement.clientWidth : window.innerWidth);
  const height = Math.max(1, renderer ? renderer.domElement.clientHeight : window.innerHeight);
  const boardSpan = TILE_SIZE * 8 + 2.5;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const aspect = camera.aspect || (width / height);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const distW = (boardSpan / 2) / Math.tan(hFov / 2);
  const distH = (boardSpan / 2) / Math.tan(vFov / 2);
  return Math.max(distW, distH) * 1.06;
}

function updateTopViewPreset() {
  fittedTopDistance = computeTopViewDistance();
  CAMERA_VIEWS.top.pos.set(0, fittedTopDistance, 0.01);
  CAMERA_VIEWS.top.target.set(0, 0, 0);
}

function applyControlsForView(viewKey) {
  if (!controls) return;
  // Lock polar angle & zoom distance so camera orbits/tilts smoothly around the board
  // and showcases the standing 3D Gothic Cathedral walls & stained-glass windows.
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.enablePan = false;

  if (mobileLayoutActive && viewKey === 'top') {
    controls.enabled = true;
    controls.enableRotate = false;
    controls.enableZoom = true;
    fittedTopDistance = computeTopViewDistance();
    controls.minDistance = Math.max(8, fittedTopDistance * 0.45);
    // Never clamp below the computed full-board fit; allow a little further zoom-out.
    controls.maxDistance = fittedTopDistance * 1.1;
    controls.target.set(0, 0, 0);
  } else if (mobileLayoutActive) {
    controls.enabled = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.minDistance = 8.5;
    controls.maxDistance = ORBIT_MAX_DISTANCE;
  } else {
    const isFreeOrbit = viewKey === 'orbit';
    controls.enabled = isFreeOrbit;
    controls.enableRotate = isFreeOrbit;
    controls.enableZoom = isFreeOrbit;
    controls.minDistance = 8.5;
    controls.maxDistance = ORBIT_MAX_DISTANCE;
  }
}

function setTopViewLighting(isTop) {
  document.documentElement.classList.toggle('top-view', isTop);
  if (scene && scene.fog) scene.fog.density = isTop ? 0.002 : 0.0045;
  if (renderer) renderer.toneMappingExposure = isTop ? 1.15 : 1.05;
  if (ambientLight) ambientLight.intensity = isTop ? 0.88 : 0.65;
  if (vignettePass && vignettePass.uniforms && vignettePass.uniforms['darkness']) {
    vignettePass.uniforms['darkness'].value = isTop ? 0.45 : 0.92;
  }
}

function setCameraView(viewKey) {
  const preset = CAMERA_VIEWS[viewKey];
  if (!preset) return;
  activeCameraKey = viewKey;

  document.querySelectorAll('.cam-toggle').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cam === viewKey);
  });

  if (mobileLayoutActive && viewKey === 'top') {
    updateTopViewPreset();
  }
  applyControlsForView(viewKey);
  setTopViewLighting(viewKey === 'top');

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

  updateChessClock(typeof now === 'number' ? now : performance.now());
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

  // Animate flickering warm candle & brazier PointLights (sine + multi-harmonic noise wave)
  for (let i = 0; i < sanctumCandleLights.length; i++) {
    const c = sanctumCandleLights[i];
    const s = c.seed;
    const wave =
      Math.sin(elapsed * 5.8 + s) * 0.14 +
      Math.sin(elapsed * 13.7 + s * 2.1) * 0.08 +
      Math.cos(elapsed * 23.3 + s * 0.7) * 0.05;
    c.light.intensity = c.baseIntensity * (1.0 + wave);
    if (c.sprite) {
      const sc = 1.28 + wave * 0.45;
      c.sprite.scale.set(sc, sc, 1);
      c.sprite.material.opacity = Math.min(1.0, Math.max(0.55, 0.84 + wave * 0.5));
    }
  }

  // Drift golden dust motes / embers slowly upward around the perimeter pillars
  if (sanctumDustMotes && sanctumDustBaseData) {
    const posAttr = sanctumDustMotes.geometry.attributes.position;
    const arr = posAttr.array;
    for (let i = 0; i < sanctumDustBaseData.length; i++) {
      const d = sanctumDustBaseData[i];
      let y = arr[i * 3 + 1] + d.speedY * dt;
      if (y > 12.0) y = 0.2;
      arr[i * 3]     = d.baseX + Math.sin(elapsed * d.swayFreq + d.phase) * d.swayAmp;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = d.baseZ + Math.cos(elapsed * d.swayFreq * 0.85 + d.phase) * d.swayAmp;
    }
    posAttr.needsUpdate = true;
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

  if (composer) {
    composer.render(dt);
  } else {
    renderer.render(scene, camera);
  }
}

function resizeGameViewport() {
  if (!renderer || !camera) return;
  const container = document.getElementById('canvas-container');
  const width = Math.max(1, container.clientWidth || window.innerWidth);
  const height = Math.max(1, container.clientHeight || window.innerHeight);
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  if (isMobile !== mobileLayoutActive) {
    mobileLayoutActive = isMobile;
    activeCameraKey = isMobile ? 'top' : 'orbit';
    camTransition = null;
    document.querySelectorAll('.cam-toggle').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cam === activeCameraKey);
    });
  }

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  if (composer) {
    composer.setSize(width, height);
  }
  if (bloomPass && bloomPass.resolution) {
    bloomPass.resolution.set(width, height);
  }

  if (mobileLayoutActive && activeCameraKey === 'top') {
    updateTopViewPreset();
    camera.position.copy(CAMERA_VIEWS.top.pos);
    camera.lookAt(CAMERA_VIEWS.top.target);
  }
  applyControlsForView(activeCameraKey);
  setTopViewLighting(activeCameraKey === 'top');
  if (controls) controls.update();
}

function initApp() {
  const container = document.getElementById('canvas-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);
  scene.fog = new THREE.FogExp2(0x06080f, 0.0045);

  const initW = Math.max(1, container.clientWidth || window.innerWidth);
  const initH = Math.max(1, container.clientHeight || window.innerHeight);

  camera = new THREE.PerspectiveCamera(40, initW / initH, 0.1, 220);
  camera.position.copy(CAMERA_VIEWS.orbit.pos);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false
  });
  renderer.setSize(initW, initH);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // --------------------------------------------------------------------------
  // STEP 4: Post-Processing (EffectComposer + High-Threshold UnrealBloomPass + Vignette)
  // --------------------------------------------------------------------------
  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
    composer = new THREE.EffectComposer(renderer);
    composer.setPixelRatio?.(Math.min(window.devicePixelRatio, 1.5));
    composer.setSize(initW, initH);

    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // High threshold (0.91) so ONLY candle flames, sunlit corner windows, and specular gold highlights glow
    bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(initW, initH),
      0.24, // strength: glow only the hottest highlights, never the floor
      0.40, // radius
      0.94  // threshold
    );
    composer.addPass(bloomPass);

    if (THREE.ShaderPass && THREE.VignetteShader) {
      vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
      vignettePass.uniforms['offset'].value = 0.98;
      vignettePass.uniforms['darkness'].value = 0.92;
      composer.addPass(vignettePass);
    }
  }

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.autoRotate = false;
  controls.enablePan = false;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minDistance = 8.5;
  controls.maxDistance = ORBIT_MAX_DISTANCE;
  controls.target.copy(CAMERA_VIEWS.orbit.target);
  renderer.domElement.style.touchAction = 'none';

  controls.addEventListener('start', () => {
    camTransition = null;
  });

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  ambientLight = new THREE.AmbientLight(0x4a5578, 0.58);
  scene.add(ambientLight);

  const celestialKey = new THREE.DirectionalLight(0xe0f2fe, 0.85);
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

  const amberRim = new THREE.DirectionalLight(0xfbbf24, 0.48);
  amberRim.position.set(-16, 14, -10);
  scene.add(amberRim);

  const amethystRim = new THREE.DirectionalLight(0xc084fc, 0.42);
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
    renderer.domElement.setPointerCapture?.(e.pointerId);
  });
  renderer.domElement.addEventListener('pointerup', e => {
    const distance = Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y);
    if (distance < 8) {
      onBoardClick(e);
    } else if (mobileLayoutActive || e.pointerType === 'touch') {
      // A piece drag is interpreted as the same legal select-then-move flow as taps.
      onBoardClick({ clientX: downPt.x, clientY: downPt.y });
      onBoardClick(e);
    }
  });
  renderer.domElement.addEventListener('pointercancel', () => {
    downPt = { x: 0, y: 0 };
  });

  window.addEventListener('resize', resizeGameViewport);
  window.visualViewport?.addEventListener('resize', resizeGameViewport);
  resizeGameViewport();

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
        const aiMove = computeBestMoveForCurrentTurn(aiDifficulty);
        if (aiMove) executeAnimatedMove(aiMove);
      }, 200);
    }
  });

  document.getElementById('btn-undo').addEventListener('click', () => {
    updateChessClock();
    if (isAnimating || clockState.flaggedColor) return;
    clearHintVisuals();
    const undone = [];
    if (gameMode === 'ai') {
      const m2 = chess.undo(); if (m2) undone.push(m2);
      const m1 = chess.undo(); if (m1) undone.push(m1);
    } else {
      const m = chess.undo(); if (m) undone.push(m);
    }
    if (undone.length) {
      redoStack.push(undone.reverse());
    }
    lastMove = null;
    syncBoardWithEngine();
    alignChessClockAfterHistoryChange();
    saveGame();
    updateUndoRedoButtons();
  });

  document.getElementById('btn-redo').addEventListener('click', () => {
    updateChessClock();
    if (isAnimating || clockState.flaggedColor) return;
    const undone = redoStack.pop();
    if (!undone) return;
    undone.forEach(m => chess.move(m));
    syncBoardWithEngine();
    alignChessClockAfterHistoryChange();
    saveGame();
    updateUndoRedoButtons();
  });

  const resetMatch = () => {
    if (isAnimating) return;
    clearHintVisuals();
    chess.reset();
    moveHistory = [];
    redoStack = [];
    lastMove = null;
    resetChessClock();
    document.getElementById('gameover-modal').classList.remove('open');
    localStorage.removeItem('sanctum-chess-save');
    syncBoardWithEngine();
  };

  document.getElementById('btn-reset').addEventListener('click', resetMatch);

  document.getElementById('btn-resign').addEventListener('click', () => {
    updateChessClock();
    if (isAnimating || chess.game_over() || clockState.flaggedColor) return;
    const loser = chess.turn() === 'w' ? 'Sylvan Diamond' : 'Draconic Smoky Quartz';
    const winner = chess.turn() === 'w' ? 'Draconic Smoky Quartz' : 'Sylvan Diamond';
    pauseChessClock();
    document.getElementById('gameover-title').textContent = 'RESIGNATION';
    document.getElementById('gameover-subtitle').textContent = `${loser} resigns. ${winner} triumphs.`;
    document.getElementById('gameover-modal').classList.add('open');
  });
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
        let move = legalMovesForSelected.find(
          m => m.to === pendingPromotionMove.to && m.promotion === promo
        );
        if (!move) {
          const isCap = !!chess.get(pendingPromotionMove.to);
          move = { ...pendingPromotionMove, promotion: promo, flags: isCap ? 'cp' : 'p' };
        }
        pendingPromotionMove = null;
        executeAnimatedMove(move);
      }
    });
  });

  requestAnimationFrame(animate);
}

window.addEventListener('DOMContentLoaded', () => { initApp(); setTimeout(setupExtraControls, 50); });

// ============================================================================
// EXTRA CONTROLS, SAVE/LOAD, HAPTICS
// ============================================================================
function setupExtraControls() {
  const diffSel = document.getElementById('difficulty');
  if (diffSel) {
    diffSel.value = String(aiDifficulty);
    diffSel.addEventListener('change', () => {
      aiDifficulty = parseInt(diffSel.value, 10) || 2;
    });
  }

  const clockControl = document.getElementById('clock-control');
  if (clockControl) {
    clockControl.value = String(selectedClockMinutes);
    clockControl.addEventListener('change', () => {
      const requested = parseInt(clockControl.value, 10);
      if (!CLOCK_OPTIONS_MINUTES.includes(requested) || clockState.started || clockState.flaggedColor) {
        renderChessClocks(true);
        return;
      }
      selectedClockMinutes = requested;
      clockState = createClockState(selectedClockMinutes);
      lastClockDisplay = '';
      renderChessClocks(true);
      saveGame();
    });
  }

  const volSlider = document.getElementById('volume-slider');
  if (volSlider) {
    volSlider.addEventListener('input', () => {
      audio.setVolume(parseFloat(volSlider.value));
    });
    audio.setVolume(parseFloat(volSlider.value));
  }

  const histToggle = document.getElementById('btn-toggle-history');
  if (histToggle) {
    histToggle.addEventListener('click', () => {
      const panel = document.getElementById('history-panel');
      if (window.matchMedia('(max-width: 768px)').matches) {
        panel.classList.toggle('expanded');
      } else {
        panel.classList.toggle('collapsed');
      }
    });
  }

  const btnPgn = document.getElementById('btn-export-pgn');
  if (btnPgn) {
    btnPgn.addEventListener('click', () => {
      const pgn = chess.pgn();
      const blob = new Blob([pgn], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sanctum-chess.pgn';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const btnSave = document.getElementById('btn-save-game');
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      saveGame();
      alert('Game saved.');
    });
  }

  const btnLoad = document.getElementById('btn-load-game');
  if (btnLoad) {
    btnLoad.addEventListener('click', () => {
      if (loadGame()) alert('Game loaded.');
      else alert('No saved game found.');
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('promo-modal').classList.remove('open');
      document.getElementById('gameover-modal').classList.remove('open');
    }
  });

  document.addEventListener('visibilitychange', () => {
    updateChessClock();
    if (document.hidden) saveGame();
  });
  window.addEventListener('pagehide', () => {
    updateChessClock();
    saveGame();
  });

  const nav = document.querySelector('.m3-bottom-nav');
  const navHint = document.getElementById('nav-scroll-hint');
  const navDock = document.getElementById('nav-dock');
  const navToggle = document.getElementById('btn-nav-toggle');
  let updateNavScrollHint = () => {};

  if (nav && navHint) {
    updateNavScrollHint = () => {
      const collapsed = Boolean(navDock && navDock.classList.contains('collapsed'));
      const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth);
      const showHint = !collapsed && maxScroll > 2 && nav.scrollLeft < maxScroll - 2;
      navHint.classList.toggle('visible', showHint);
      navHint.setAttribute('aria-hidden', String(!showHint));
      navHint.tabIndex = showHint ? 0 : -1;
    };

    navHint.addEventListener('click', () => {
      const remaining = nav.scrollWidth - nav.clientWidth - nav.scrollLeft;
      const step = Math.max(120, nav.clientWidth * 0.8);
      nav.scrollBy({ left: Math.min(step, remaining), behavior: 'smooth' });
    });
    nav.addEventListener('scroll', updateNavScrollHint, { passive: true });
    window.addEventListener('resize', updateNavScrollHint);
    window.addEventListener('load', updateNavScrollHint, { once: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateNavScrollHint);
    }
    if (window.ResizeObserver) {
      const navResizeObserver = new ResizeObserver(updateNavScrollHint);
      navResizeObserver.observe(nav);
    }
    updateNavScrollHint();
  }

  // Collapsible menu: the board stays visible while the controls rest in a small tab.
  if (nav && navDock && navToggle) {
    const NAV_COLLAPSED_KEY = 'sanctum-chess-nav-collapsed';
    const toggleIcon = navToggle.querySelector('.nav-toggle-icon');
    const toggleLabel = navToggle.querySelector('.nav-toggle-label');

    const setNavCollapsed = (collapsed, persist) => {
      navDock.classList.toggle('collapsed', collapsed);
      navToggle.setAttribute('aria-expanded', String(!collapsed));
      const label = collapsed ? 'Menu' : 'Hide';
      const action = collapsed ? 'Expand menu' : 'Collapse menu';
      if (toggleIcon) toggleIcon.textContent = collapsed ? 'menu' : 'keyboard_arrow_down';
      if (toggleLabel) toggleLabel.textContent = label;
      navToggle.title = action;
      navToggle.setAttribute('aria-label', action);
      if (persist) {
        try {
          localStorage.setItem(NAV_COLLAPSED_KEY, collapsed ? '1' : '0');
        } catch (error) {
          // Persistence is optional; collapse still works without storage.
        }
      }
      updateNavScrollHint();
    };

    navToggle.addEventListener('click', () => {
      setNavCollapsed(!navDock.classList.contains('collapsed'), true);
    });

    let storedCollapsed = null;
    try {
      storedCollapsed = localStorage.getItem(NAV_COLLAPSED_KEY);
    } catch (error) {
      storedCollapsed = null;
    }
    const startsCollapsed = storedCollapsed === null
      ? window.matchMedia('(max-width: 768px)').matches
      : storedCollapsed === '1';
    setNavCollapsed(startsCollapsed, false);
  }

  loadGame();
}

function saveGame() {
  try {
    updateChessClock();
    const data = {
      fen: chess.fen(),
      moveHistory: moveHistory,
      mode: gameMode,
      difficulty: aiDifficulty,
      clockMinutes: selectedClockMinutes,
      clock: {
        whiteMs: clockState.whiteMs,
        blackMs: clockState.blackMs,
        activeColor: clockState.activeColor,
        started: clockState.started,
        flaggedColor: clockState.flaggedColor,
        savedAt: Date.now()
      }
    };
    localStorage.setItem('sanctum-chess-save', JSON.stringify(data));
    const Prefs = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
    if (Prefs) Prefs.set({ key: 'sanctum-chess-save', value: JSON.stringify(data) });
  } catch (e) {}
}

function loadGame() {
  try {
    let raw = localStorage.getItem('sanctum-chess-save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    chess.load(data.fen);
    moveHistory = data.moveHistory || [];
    gameMode = data.mode || gameMode;
    aiDifficulty = data.difficulty || aiDifficulty;
    const minutes = parseInt(data.clockMinutes, 10);
    selectedClockMinutes = CLOCK_OPTIONS_MINUTES.includes(minutes) ? minutes : 10;
    if (data.clock) {
      clockState = {
        whiteMs: Math.max(0, Number(data.clock.whiteMs) || 0),
        blackMs: Math.max(0, Number(data.clock.blackMs) || 0),
        activeColor: data.clock.activeColor === 'w' || data.clock.activeColor === 'b' ? data.clock.activeColor : null,
        started: Boolean(data.clock.started),
        lastTickAt: null,
        flaggedColor: data.clock.flaggedColor === 'w' || data.clock.flaggedColor === 'b' ? data.clock.flaggedColor : null
      };
      if (clockState.started && clockState.activeColor && !clockState.flaggedColor && !chess.game_over()) {
        const offlineElapsed = Math.max(0, Date.now() - (Number(data.clock.savedAt) || Date.now()));
        setClockMilliseconds(clockState.activeColor, getClockMilliseconds(clockState.activeColor) - offlineElapsed);
        clockState.lastTickAt = performance.now();
      }
    } else {
      clockState = createClockState(selectedClockMinutes);
    }
    lastClockDisplay = '';
    if (chess.game_over()) pauseChessClock();
    lastMove = null;
    redoStack = [];
    syncBoardWithEngine();
    renderMoveHistory();
    renderChessClocks(true);
    if (clockState.flaggedColor) showClockTimeout(clockState.flaggedColor);
    if (clockState.started && clockState.activeColor && getClockMilliseconds(clockState.activeColor) <= 0) {
      handleClockFlagFall(clockState.activeColor);
    }
    return true;
  } catch (e) {
    return false;
  }
}

function hapticLight() {
  try {
    const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
    if (H) H.impact({ style: 'LIGHT' });
  } catch (e) {}
}

const _origFinishTurn = finishTurn;
finishTurn = function() {
  _origFinishTurn();
  saveGame();
  hapticLight();
};
