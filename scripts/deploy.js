/**
 * One-command permanent deployment script to https://sanctum-3d-chess.surge.sh
 * Usage: node scripts/deploy.js
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MODELS_SRC = path.join(ROOT, 'assets', 'models');
const MODELS_DST = path.join(DIST, 'assets', 'models');

const SURGE_DOMAIN = 'sanctum-3d-chess.surge.sh';
const SURGE_TOKEN = '6f8bb291544aba7b7b63e59341da6a54';

fs.mkdirSync(MODELS_DST, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js']) {
  fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
}
for (const file of ['sanctum_diffuse.png', 'sanctum_depth.png', 'sanctum_normal.png', 'sanctum_roughness.png', 'sanctum_pano.jpg']) {
  const srcPath = path.join(ROOT, 'assets', file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(DIST, 'assets', file));
  }
}
for (const file of fs.readdirSync(MODELS_SRC)) {
  if (file.endsWith('.glb')) {
    fs.copyFileSync(path.join(MODELS_SRC, file), path.join(MODELS_DST, file));
  }
}

console.log(`Deploying to https://${SURGE_DOMAIN} ...`);
execSync(`npx --yes surge "${DIST}" ${SURGE_DOMAIN} --token ${SURGE_TOKEN}`, { stdio: 'inherit' });
