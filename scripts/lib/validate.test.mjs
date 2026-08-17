import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData, validateSources } from './validate.mjs';

const goodEntry = {
  id: 'opp-001',
  title: 'Trail Crew',
  org: 'East Bay Regional Park District',
  tags: ['trails'],
  commitment: 'monthly',
  days: 'weekends',
  city: 'Oakland',
  state: 'CA',
  zip: '94605',
  lat: 37.7617,
  lng: -122.1558,
  duration: '4 hrs/month',
  description: 'desc',
  fullDescription: 'full desc',
  nextSteps: 'register',
  website: 'https://www.ebparks.org/volunteer',
};

test('validateData accepts a well-formed array', () => {
  const { valid, errors } = validateData([goodEntry]);
  assert.equal(valid, true, errors.join('; '));
});

test('validateData rejects a non-array', () => {
  assert.equal(validateData({}).valid, false);
});

test('validateData rejects a missing required field', () => {
  const { id, ...rest } = goodEntry;
  const { valid, errors } = validateData([rest]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('missing required key "id"')));
});

test('validateData rejects a bad union value', () => {
  const { valid, errors } = validateData([{ ...goodEntry, commitment: 'yearly' }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('invalid commitment')));
});

test('validateData rejects an invalid tag', () => {
  const { valid, errors } = validateData([{ ...goodEntry, tags: ['sports'] }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('invalid tag')));
});

test('validateData rejects duplicate ids', () => {
  const { valid, errors } = validateData([goodEntry, goodEntry]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('duplicate id')));
});

test('validateData rejects a malformed id', () => {
  const { valid, errors } = validateData([{ ...goodEntry, id: 'x1' }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('opp-NNN')));
});

test('validateData rejects out-of-bounds coordinates', () => {
  const { valid, errors } = validateData([{ ...goodEntry, lat: 5, lng: 5 }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('out of bounds')));
});

test('validateData rejects a non-number coordinate distinctly from out-of-bounds', () => {
  const { valid, errors } = validateData([{ ...goodEntry, lat: '37.76' }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('lat must be a number')));
});

test('validateData rejects an unknown key (e.g. leaked distance)', () => {
  const { valid, errors } = validateData([{ ...goodEntry, distance: 3 }]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('unknown key "distance"')));
});

test('validateSources accepts a well-formed source list', () => {
  const { valid, errors } = validateSources([
    { org: 'Save the Bay', url: 'https://savesfbay.org/calendar/', defaultTags: ['habitat'] },
  ]);
  assert.equal(valid, true, errors.join('; '));
});

test('validateSources rejects a bad url and tag', () => {
  const { valid, errors } = validateSources([
    { org: 'X', url: 'not-a-url', defaultTags: ['nope'] },
  ]);
  assert.equal(valid, false);
  assert.ok(errors.some(e => e.includes('url must be')));
  assert.ok(errors.some(e => e.includes('invalid tag')));
});
