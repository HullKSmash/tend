import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const goodEntry = {
  id: 'opp-001', title: 'T', org: 'O', tags: ['trails'],
  commitment: 'monthly', days: 'weekends', city: 'Oakland', state: 'CA',
  zip: '94605', lat: 37.76, lng: -122.15, duration: '4 hrs',
  description: 'd', fullDescription: 'f', nextSteps: 'n',
};

function writeTmp(contents) {
  const dir = mkdtempSync(join(tmpdir(), 'tend-'));
  const p = join(dir, 'data.json');
  writeFileSync(p, contents);
  return p;
}

function runCli(path) {
  return spawnSync('node', ['scripts/validate-data.mjs', path], { encoding: 'utf8' });
}

test('CLI exits 0 on valid data', () => {
  const r = runCli(writeTmp(JSON.stringify([goodEntry])));
  assert.equal(r.status, 0, r.stderr);
});

test('CLI exits 1 on invalid data', () => {
  const r = runCli(writeTmp(JSON.stringify([{ id: 'bad' }])));
  assert.equal(r.status, 1);
});

test('CLI exits 1 on malformed JSON', () => {
  const r = runCli(writeTmp('{ not json'));
  assert.equal(r.status, 1);
});
