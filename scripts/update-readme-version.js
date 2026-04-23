#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const readmePath = path.join(__dirname, '..', 'README.md');

const readme = fs.readFileSync(readmePath, 'utf8');
const pattern = /(rn-myid(?:\.git)?#v)\d+\.\d+\.\d+/g;
const updated = readme.replace(pattern, `$1${pkg.version}`);

if (updated === readme) {
  console.log(`[rn-myid] README already references v${pkg.version}, nothing to update`);
  process.exit(0);
}

fs.writeFileSync(readmePath, updated);
const matches = readme.match(pattern) || [];
console.log(`[rn-myid] README install snippets bumped to v${pkg.version} (${matches.length} occurrence${matches.length === 1 ? '' : 's'})`);
