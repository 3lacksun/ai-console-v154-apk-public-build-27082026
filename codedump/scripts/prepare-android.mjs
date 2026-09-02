import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const overlay = path.join(root, 'native', 'android-overlay');
const androidReleasePath = path.join(root, 'android-release.json');
const androidRelease = JSON.parse(fs.readFileSync(androidReleasePath, 'utf8'));
if (!Number.isInteger(androidRelease.versionCode) || androidRelease.versionCode < 1) {
  throw new Error('android-release.json must contain a positive integer versionCode.');
}
if (typeof androidRelease.versionName !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(androidRelease.versionName)) {
  throw new Error('android-release.json must contain a semantic versionName.');
}

function run(cmd, args, cwd = root) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
}
function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const a = path.join(src, entry.name), b = path.join(dst, entry.name);
    if (entry.isDirectory()) copyTree(a, b);
    else fs.copyFileSync(a, b);
  }
}
function patch(file, transform) {
  const before = fs.readFileSync(file, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`Expected patch did not change ${path.relative(root, file)}`);
  fs.writeFileSync(file, after);
}

if (!fs.existsSync(path.join(root, 'node_modules', '@capacitor', 'cli'))) {
  throw new Error('Dependencies are not installed. Run npm ci (or npm install) before android:prepare.');
}
if (fs.existsSync(androidDir)) fs.rmSync(androidDir, { recursive: true, force: true });
run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'add', 'android']);

copyTree(overlay, androidDir);
const generatedJava = path.join(androidDir, 'app', 'src', 'main', 'java', 'app', 'codedump', 'tool', 'MainActivity.java');
if (fs.existsSync(generatedJava)) fs.rmSync(generatedJava);

patch(path.join(androidDir, 'build.gradle'), text => {
  let out = text.replace(
    /classpath ['"]com\.android\.tools\.build:gradle:[^'"]+['"]/,
    "classpath 'com.android.tools.build:gradle:8.13.2'"
  );
  if (!out.includes('kotlin-gradle-plugin:2.3.20')) {
    out = out.replace(
      /classpath ['"]com\.android\.tools\.build:gradle:8\.13\.2['"]\s*/,
      match => `${match}        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.20'\n`
    );
  }
  return out;
});

patch(path.join(androidDir, 'app', 'build.gradle'), text => {
  let out = text;
  if (!out.includes("apply plugin: 'org.jetbrains.kotlin.android'")) {
    out = out.replace("apply plugin: 'com.android.application'", "apply plugin: 'com.android.application'\napply plugin: 'org.jetbrains.kotlin.android'");
  }
  if (!out.includes('androidx.documentfile:documentfile:1.1.0')) {
    out = out.replace(/dependencies \{\n/, "dependencies {\n    implementation 'androidx.documentfile:documentfile:1.1.0'\n");
  }
  if (!out.includes('sourceCompatibility JavaVersion.VERSION_21')) {
    out = out.replace(/android \{\n/, "android {\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_21\n        targetCompatibility JavaVersion.VERSION_21\n    }\n");
  }
  if (!out.includes("jvmTarget = '21'")) {
    out = out.replace(/android \{\n/, "android {\n    kotlinOptions {\n        jvmTarget = '21'\n    }\n");
  }
  out = out.replace(/versionCode\s+\d+/, `versionCode ${androidRelease.versionCode}`);
  out = out.replace(/versionName\s+["'][^"']+["']/, `versionName "${androidRelease.versionName}"`);
  if (!out.includes(`versionCode ${androidRelease.versionCode}`) || !out.includes(`versionName "${androidRelease.versionName}"`)) {
    throw new Error('Could not apply declared Android release metadata.');
  }
  return out;
});

const drawableDir = path.join(androidDir, 'app', 'src', 'main', 'res', 'drawable');
fs.mkdirSync(drawableDir, { recursive: true });
fs.copyFileSync(path.join(root, 'web', 'icons', 'icon-512.png'), path.join(drawableDir, 'code_dump_icon.png'));

run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'copy', 'android']);

console.log('Android project prepared with CodeDumpNative Kotlin bridge.');
