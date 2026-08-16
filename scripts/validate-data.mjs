#!/usr/bin/env node
// CLI wrapper: validate public/data.json (or a path passed as argv[2]) and the
// curated source list agent/sources.json. Exits non-zero on any error so the
// weekly agent aborts before opening a PR. Paths are resolved from the current
// working directory (run from the repo root).

import { readFileSync } from 'node:fs';
import { validateData, validateSources } from './lib/validate.mjs';

function loadJson(path) {
  try {
    return { data: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (err) {
    return { error: `${path}: ${err.message}` };
  }
}

function report(label, path, result) {
  if (result.error) {
    console.error(`FAIL ${result.error}`);
    return false;
  }
  const { valid, errors } = result.check;
  if (!valid) {
    console.error(`FAIL ${path}:`);
    for (const e of errors) console.error(`  - ${e}`);
    return false;
  }
  console.log(`OK ${path} (${result.data.length} ${label})`);
  return true;
}

const dataPath = process.argv[2] || 'public/data.json';

const dataLoad = loadJson(dataPath);
if (!dataLoad.error) dataLoad.check = validateData(dataLoad.data);

const sourcesLoad = loadJson('agent/sources.json');
if (!sourcesLoad.error) sourcesLoad.check = validateSources(sourcesLoad.data);

const dataOk = report('opportunities', dataPath, dataLoad);
const sourcesOk = report('sources', 'agent/sources.json', sourcesLoad);

process.exit(dataOk && sourcesOk ? 0 : 1);
