import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSources } from './validate.mjs';

test('agent/sources.json is well-formed and covers the seeded orgs', () => {
  const sources = JSON.parse(readFileSync('agent/sources.json', 'utf8'));
  const { valid, errors } = validateSources(sources);
  assert.equal(valid, true, errors.join('; '));
  assert.equal(sources.length, 12);
});
