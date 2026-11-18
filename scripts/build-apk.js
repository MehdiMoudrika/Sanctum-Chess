const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const { version } = require(path.join(root, 'package.json'));
const gradleFile = path.join(androidDir, 'app', 'build.gradle');
const gradleText = fs.readFileSync(gradleFile, 'utf8');
const versionName = gradleText.match(/versionName\s+"([^"]+)"/);

if (!versionName || versionName[1] !== version) {
  throw new Error(
    `Version mismatch: package.json is ${version}, android/app/build.gradle is ${versionName ? versionName[1] : 'missing'}. ` +
    'Update both versionName and versionCode before building.'
  );
}

const env = { ...process.env };
if (!env.ANDROID_HOME && env.LOCALAPPDATA) {
  const defaultSdk = path.join(env.LOCALAPPDATA, 'Android', 'Sdk');
  if (fs.existsSync(defaultSdk)) env.ANDROID_HOME = defaultSdk;
}
if (!env.ANDROID_SDK_ROOT && env.ANDROID_HOME) env.ANDROID_SDK_ROOT = env.ANDROID_HOME;

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run('npx', ['cap', 'sync', 'android'], root);
run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug'], androidDir);

const source = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const destination = path.join(root, `Sanctum-Chess-v${version}-debug.apk`);
fs.copyFileSync(source, destination);
console.log(`\nVersioned APK created: ${destination}`);
