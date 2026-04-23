#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const REQUIRED_KEYS = [
  'NSCameraUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
];

function findConsumerIosDir() {
  // When installed into a consumer, cwd is typically the consumer root.
  // When running inside the library itself (e.g., CI), skip the check.
  const cwd = process.cwd();
  const libraryPackageJson = path.join(__dirname, '..', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(libraryPackageJson, 'utf8'));
    if (pkg.name === 'rn-myid' && cwd.endsWith('react-native-myid')) {
      return null;
    }
  } catch {
    // ignore
  }

  const iosDir = path.join(cwd, 'ios');
  if (!fs.existsSync(iosDir)) return null;
  return iosDir;
}

function findInfoPlists(iosDir) {
  const entries = fs.readdirSync(iosDir, { withFileTypes: true });
  const plists = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'Pods' || entry.name === 'build') continue;
    const candidate = path.join(iosDir, entry.name, 'Info.plist');
    if (fs.existsSync(candidate)) plists.push(candidate);
  }
  return plists;
}

function checkPlist(plistPath) {
  const contents = fs.readFileSync(plistPath, 'utf8');
  const missing = REQUIRED_KEYS.filter((key) => !contents.includes(`<key>${key}</key>`));
  return missing;
}

function main() {
  const iosDir = findConsumerIosDir();
  if (!iosDir) return;

  const plists = findInfoPlists(iosDir);
  if (plists.length === 0) return;

  const warnings = [];
  for (const plist of plists) {
    const missing = checkPlist(plist);
    if (missing.length > 0) {
      warnings.push({ plist, missing });
    }
  }

  if (warnings.length === 0) return;

  console.warn('');
  console.warn('┌─────────────────────────────────────────────────────────────────┐');
  console.warn('│  rn-myid — missing iOS Info.plist keys                         │');
  console.warn('└─────────────────────────────────────────────────────────────────┘');
  for (const { plist, missing } of warnings) {
    console.warn(`  ${plist}`);
    for (const key of missing) {
      console.warn(`    ✗ ${key}`);
    }
  }
  console.warn('');
  console.warn('  MyID SDK needs camera, microphone and photo-library permissions.');
  console.warn('  Add the missing <key>...</key><string>...</string> pairs to Info.plist');
  console.warn('  or App Store submission and runtime prompts will fail.');
  console.warn('');
}

try {
  main();
} catch (err) {
  // Never fail install over a warning.
  console.warn('[react-native-myid] postinstall-check skipped:', err.message);
}
