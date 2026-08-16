# Weekly Opportunity Refresh Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the version-controlled pieces of a weekly agent that researches a curated list of Bay Area environmental orgs and opens a PR proposing changes to `public/data.json`.

**Architecture:** Pure validation logic (`scripts/lib/validate.mjs`) is unit-tested in isolation and wrapped by a CLI (`scripts/validate-data.mjs`) that gates every run. A curated allowlist (`agent/sources.json`) is the agent's input; a prose runbook (`agent/refresh-opportunities.md`) is the agent's instructions. Scheduling the cloud agent is a post-merge operational step. The site itself (React/Vite) is unchanged — the data model stays a static JSON file.

**Tech Stack:** Node 24 built-in test runner (`node --test`) + `node:assert/strict` — no new dependencies. Plain ESM `.mjs` scripts, separate from the app's TypeScript/ESLint pipeline. OpenStreetMap Nominatim for geocoding (already used by `src/utils/geo.ts`).

Reference spec: `docs/superpowers/specs/2026-08-16-weekly-opportunity-refresh-agent-design.md`

---

## File Structure

**Create:**
- `scripts/lib/validate.mjs` — pure validation logic + schema constants (`validateData`, `validateSources`). No I/O; fully unit-testable.
- `scripts/lib/validate.test.mjs` — unit tests for the pure logic.
- `agent/sources.json` — curated org allowlist, seeded from the 12 current orgs.
- `scripts/lib/sources.test.mjs` — asserts the real `agent/sources.json` is well-formed.
- `scripts/validate-data.mjs` — CLI wrapper: reads `public/data.json` + `agent/sources.json`, prints errors, exits non-zero on failure.
- `scripts/validate-data.test.mjs` — spawns the CLI against good/bad fixtures, checks exit codes.
- `agent/refresh-opportunities.md` — the runbook the cloud agent follows each week.

**Modify:**
- `package.json` — add `validate` and `test` npm scripts.

**Untouched:** all of `src/`, `public/data.json` (validated, not edited by this plan).

---

## Task 1: Validation logic + unit tests

**Files:**
- Create: `scripts/lib/validate.mjs`
- Test: `scripts/lib/validate.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/validate.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/lib/validate.test.mjs`
Expected: FAIL — cannot find module `./validate.mjs` (not created yet).

- [ ] **Step 3: Write the implementation**

Create `scripts/lib/validate.mjs`:

```js
// Pure validation logic for Tend opportunity data. No file I/O — see
// scripts/validate-data.mjs for the CLI wrapper. Plain ESM (.mjs) so it runs
// under `node --test` without the app's TypeScript build.
//
// Schema mirrors the Opportunity type in src/types.ts. Keep the unions below
// in sync with that file if the app's types change.

export const TAG_IDS = ['trails', 'habitat', 'cleanup', 'wildlife', 'water', 'education'];
export const COMMITMENTS = ['one-time', 'weekly', 'monthly', 'flexible'];
export const DAYS = ['weekdays', 'weekends', 'either'];

export const REQUIRED_KEYS = [
  'id', 'title', 'org', 'tags', 'commitment', 'days',
  'city', 'state', 'zip', 'lat', 'lng',
  'duration', 'description', 'fullDescription', 'nextSteps',
];
export const OPTIONAL_KEYS = ['website', 'eventDate'];
const ALLOWED_KEYS = new Set([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

// Coarse Bay Area bounding box — a sanity check, not precise geofencing.
export const LAT_BOUNDS = [36.5, 39.0];
export const LNG_BOUNDS = [-123.5, -121.0];

const ID_PATTERN = /^opp-\d{3,}$/;
const URL_PATTERN = /^https?:\/\//;
const STRING_FIELDS = ['title', 'org', 'city', 'state', 'zip', 'duration', 'description', 'fullDescription', 'nextSteps'];

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Validate an array of opportunities. Returns { valid, errors } where errors is
// an array of human-readable strings (empty when valid).
export function validateData(data) {
  const errors = [];
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['top-level value is not an array'] };
  }

  const seenIds = new Set();
  data.forEach((entry, i) => {
    const where = `entry ${i}`;
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`${where}: not an object`);
      return;
    }

    for (const key of Object.keys(entry)) {
      if (!ALLOWED_KEYS.has(key)) errors.push(`${where}: unknown key "${key}"`);
    }
    for (const key of REQUIRED_KEYS) {
      if (!(key in entry)) errors.push(`${where}: missing required key "${key}"`);
    }

    if ('id' in entry) {
      if (!isNonEmptyString(entry.id) || !ID_PATTERN.test(entry.id)) {
        errors.push(`${where}: id "${entry.id}" does not match opp-NNN`);
      } else if (seenIds.has(entry.id)) {
        errors.push(`${where}: duplicate id "${entry.id}"`);
      } else {
        seenIds.add(entry.id);
      }
    }

    for (const key of STRING_FIELDS) {
      if (key in entry && !isNonEmptyString(entry[key])) {
        errors.push(`${where}: "${key}" must be a non-empty string`);
      }
    }

    if ('tags' in entry) {
      if (!Array.isArray(entry.tags) || entry.tags.length === 0) {
        errors.push(`${where}: tags must be a non-empty array`);
      } else {
        for (const tag of entry.tags) {
          if (!TAG_IDS.includes(tag)) errors.push(`${where}: invalid tag "${tag}"`);
        }
      }
    }

    if ('commitment' in entry && !COMMITMENTS.includes(entry.commitment)) {
      errors.push(`${where}: invalid commitment "${entry.commitment}"`);
    }
    if ('days' in entry && !DAYS.includes(entry.days)) {
      errors.push(`${where}: invalid days "${entry.days}"`);
    }

    if ('lat' in entry) {
      const v = entry.lat;
      if (typeof v !== 'number' || Number.isNaN(v) || v < LAT_BOUNDS[0] || v > LAT_BOUNDS[1]) {
        errors.push(`${where}: lat ${v} out of bounds ${LAT_BOUNDS.join('..')}`);
      }
    }
    if ('lng' in entry) {
      const v = entry.lng;
      if (typeof v !== 'number' || Number.isNaN(v) || v < LNG_BOUNDS[0] || v > LNG_BOUNDS[1]) {
        errors.push(`${where}: lng ${v} out of bounds ${LNG_BOUNDS.join('..')}`);
      }
    }

    if ('website' in entry && !(isNonEmptyString(entry.website) && URL_PATTERN.test(entry.website))) {
      errors.push(`${where}: website must be an http(s) URL`);
    }
    if ('eventDate' in entry && !isNonEmptyString(entry.eventDate)) {
      errors.push(`${where}: eventDate must be a non-empty string when present`);
    }
  });

  return { valid: errors.length === 0, errors };
}

// Validate the curated source allowlist (agent/sources.json).
export function validateSources(data) {
  const errors = [];
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['top-level value is not an array'] };
  }
  data.forEach((entry, i) => {
    const where = `source ${i}`;
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      errors.push(`${where}: not an object`);
      return;
    }
    if (!isNonEmptyString(entry.org)) errors.push(`${where}: org must be a non-empty string`);
    if (!(isNonEmptyString(entry.url) && URL_PATTERN.test(entry.url))) {
      errors.push(`${where}: url must be an http(s) URL`);
    }
    if (!Array.isArray(entry.defaultTags) || entry.defaultTags.length === 0) {
      errors.push(`${where}: defaultTags must be a non-empty array`);
    } else {
      for (const tag of entry.defaultTags) {
        if (!TAG_IDS.includes(tag)) errors.push(`${where}: invalid tag "${tag}"`);
      }
    }
  });
  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/lib/validate.test.mjs`
Expected: PASS — all 12 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/validate.mjs scripts/lib/validate.test.mjs
git commit -m "Add opportunity data validation logic with tests"
```

---

## Task 2: Seed the curated source allowlist

**Files:**
- Create: `agent/sources.json`
- Test: `scripts/lib/sources.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/sources.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/lib/sources.test.mjs`
Expected: FAIL — `agent/sources.json` does not exist (ENOENT).

- [ ] **Step 3: Create the source allowlist**

Create `agent/sources.json`:

```json
[
  { "org": "Bay Area Ridge Trail Council", "url": "https://ridgetrail.org/volunteer-2/", "defaultTags": ["trails"] },
  { "org": "East Bay Regional Park District", "url": "https://www.ebparks.org/volunteer", "defaultTags": ["trails", "habitat"] },
  { "org": "Golden Gate Bird Alliance", "url": "https://goldengatebirdalliance.org/volunteer/", "defaultTags": ["wildlife", "habitat"] },
  { "org": "Golden Gate National Parks Conservancy", "url": "https://www.parksconservancy.org/volunteer/community-volunteer-programs", "defaultTags": ["habitat", "trails"] },
  { "org": "Grassroots Ecology", "url": "https://www.grassrootsecology.org/calendar", "defaultTags": ["habitat", "education"] },
  { "org": "Marin County Open Space District", "url": "https://www.parks.marincounty.gov/discoverlearn/volunteer", "defaultTags": ["trails", "habitat"] },
  { "org": "One Tam / Tamalpais Lands Collaborative", "url": "https://www.onetam.org/volunteer", "defaultTags": ["habitat", "trails"] },
  { "org": "Peninsula Open Space Trust", "url": "https://openspacetrust.org/volunteer/", "defaultTags": ["habitat", "trails"] },
  { "org": "SF Rec & Parks", "url": "https://sfrecpark.org/780/Volunteer-Programs", "defaultTags": ["trails", "habitat"] },
  { "org": "Save the Bay", "url": "https://savesfbay.org/calendar/", "defaultTags": ["habitat", "water"] },
  { "org": "Surfrider Foundation SF Chapter", "url": "https://sf.surfrider.org/programs/beach-cleanups", "defaultTags": ["cleanup", "water"] },
  { "org": "The Marine Mammal Center", "url": "https://www.marinemammalcenter.org/get-involved/volunteer/sausalito", "defaultTags": ["wildlife"] }
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/lib/sources.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add agent/sources.json scripts/lib/sources.test.mjs
git commit -m "Add curated source allowlist seeded from current orgs"
```

---

## Task 3: CLI wrapper + npm scripts

**Files:**
- Create: `scripts/validate-data.mjs`
- Test: `scripts/validate-data.test.mjs`
- Modify: `package.json` (add `validate` and `test` scripts)

- [ ] **Step 1: Write the failing test**

Create `scripts/validate-data.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/validate-data.test.mjs`
Expected: FAIL — `scripts/validate-data.mjs` does not exist, so the CLI cannot run and `r.status` is non-zero for the "valid data" case (or the process errors).

- [ ] **Step 3: Write the CLI**

Create `scripts/validate-data.mjs`:

```js
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
```

- [ ] **Step 4: Add npm scripts**

In `package.json`, replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "validate": "node scripts/validate-data.mjs",
    "test": "node --test scripts/"
  },
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test scripts/validate-data.test.mjs`
Expected: PASS — all 3 CLI tests pass.

- [ ] **Step 6: Verify the CLI passes on the real committed data**

Run: `npm run validate`
Expected: prints `OK public/data.json (22 opportunities)` and `OK agent/sources.json (12 sources)`, exit 0.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS — every `*.test.mjs` under `scripts/` (validate, sources, CLI) passes.

- [ ] **Step 8: Commit**

```bash
git add scripts/validate-data.mjs scripts/validate-data.test.mjs package.json
git commit -m "Add validate-data CLI and npm scripts"
```

---

## Task 4: Write the agent runbook

**Files:**
- Create: `agent/refresh-opportunities.md`

This task has no unit test — the artifact is prose instructions the cloud agent follows. Verification is the self-review checklist in Step 2.

- [ ] **Step 1: Write the runbook**

Create `agent/refresh-opportunities.md`:

```markdown
# Runbook: Weekly Opportunity Refresh

You are a scheduled agent for the **Tend** volunteer-finder site. Each run you
research a curated list of Bay Area environmental organizations and open a pull
request proposing changes to `public/data.json`. A human reviews and merges;
never merge your own PR.

## Scope (do not exceed)

- Region: San Francisco Bay Area only.
- Causes: the six existing tags only — `trails`, `habitat`, `cleanup`,
  `wildlife`, `water`, `education`.
- Sources: only the URLs in `agent/sources.json`. No open web search, no orgs
  outside that file.

## Data contract

Every opportunity in `public/data.json` must match the `Opportunity` type in
`src/types.ts`. Required fields: `id`, `title`, `org`, `tags`, `commitment`,
`days`, `city`, `state`, `zip`, `lat`, `lng`, `duration`, `description`,
`fullDescription`, `nextSteps`. Optional: `website`, `eventDate`. Never add other
fields (e.g. `distance` is runtime-only). Allowed values:

- `commitment`: `one-time` | `weekly` | `monthly` | `flexible`
- `days`: `weekdays` | `weekends` | `either`
- `tags`: any of the six tag ids above (array, at least one)

## Procedure

1. **Load state.** Read `public/data.json` and `agent/sources.json`.
2. **Fetch sources.** For each source `url`, fetch the page and extract the
   volunteer opportunities currently listed. If a source is unreachable, skip it
   and record it under "Sources skipped" in the PR body — do not fail the run.
3. **Normalize** each candidate into the data contract. Seed `tags` from the
   source's `defaultTags`, then adjust to the specific opportunity. Map schedule
   language to the allowed `commitment` and `days` values.
4. **Coordinates.**
   - If the org/city already appears in `public/data.json`, reuse those exact
     `lat`/`lng`.
   - Only for a genuinely new venue/city, geocode with OpenStreetMap Nominatim:
     `https://nominatim.openstreetmap.org/search?format=json&q=<place>&limit=1&countrycodes=us`
     (send a `User-Agent` header, e.g. `Tend-VolunteerFinder/1.0`). List every
     geocoded coordinate under "New-location coordinates (flagged)" in the PR.
   - If geocoding returns no result, do NOT invent coordinates. Drop the
     candidate and list it under "Could not geocode".
5. **Deduplicate** against existing entries by normalized `org` + `title`. Skip
   candidates that already exist.
6. **Prune (flag, do not silently delete).** Identify existing entries that are
   likely stale: a one-time opportunity whose `eventDate` has clearly passed, or
   a `website` that returns a non-2xx / unreachable response. Propose these for
   removal and list them under "Pruned (flagged)".
7. **Assign ids.** New entries get sequential `opp-NNN` ids continuing from the
   current maximum (zero-padded to at least 3 digits).
8. **Validate before proposing.** Write the updated `public/data.json`, then run
   `npm run validate` and `npm run build`. If either fails, fix the data or
   abort — never open a PR with a failing validate or build.
9. **Open the PR.** Create a branch `refresh/YYYY-MM-DD`, commit, and open a PR
   against `main` titled `Refresh volunteer data — <Month D, YYYY>`. Never merge
   it yourself.

## Dry-run mode

If invoked with a dry-run instruction, perform steps 1–8 but stop before step 9:
print the PR summary (below) to output instead of creating a branch or PR. Use
this to exercise the pipeline against the live source pages without side effects.

## PR body format

```
## Weekly refresh — <Month D, YYYY>

### Added (N)
- <org> — <title> — source: <url>

### Pruned (flagged) (N)
- <id> <org> — <title> — reason: <passed event date | dead link>

### New-location coordinates (flagged) (N)
- <org> — <title> — <lat>, <lng> (geocoded from "<place>")

### Could not geocode (N)
- <org> — <title> — <place>

### Sources skipped (N)
- <org> — <url> — <reason>
```

If a section is empty, write "None".
```

- [ ] **Step 2: Self-review the runbook**

Confirm the runbook: (a) names only the six tags and Bay Area scope; (b) covers all 8 procedure steps plus PR creation; (c) states coordinates are reused when possible and flagged when geocoded; (d) forbids self-merge; (e) requires `npm run validate` + `npm run build` before opening a PR. Fix any gap inline.

- [ ] **Step 3: Commit**

```bash
git add agent/refresh-opportunities.md
git commit -m "Add weekly opportunity refresh runbook"
```

---

## Task 5: Final verification

**Files:** none (verification only).

- [ ] **Step 1: Validate the committed data and sources**

Run: `npm run validate`
Expected: `OK public/data.json (22 opportunities)` and `OK agent/sources.json (12 sources)`, exit 0.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: all `scripts/` tests pass (validate logic, sources, CLI).

- [ ] **Step 3: Confirm the app still builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed — this plan added only `.mjs`/`.json`/`.md` files outside the TypeScript/ESLint surface, so the app is unaffected.

- [ ] **Step 4: Confirm no unintended changes to app data**

Run: `git diff --stat main -- public/data.json src`
Expected: no output — `public/data.json` and `src/` are unchanged by this plan.

---

## Task 6: Schedule the cloud agent (post-merge, operational)

**Not a code change.** Do this only after the PR from Tasks 1–5 is merged to
`main`, so the cloud agent reads the runbook and sources from `main`. Requires
scheduled cloud agents to be enabled on the account.

- [ ] **Step 1: Create the weekly routine**

Use the `schedule` skill (or the account's scheduled-agents UI) to create a
recurring cloud agent:
- **Schedule:** weekly, **Monday 06:00 America/Los_Angeles**.
- **Repo/branch:** this repo, `main`.
- **Prompt:** "Follow the runbook at `agent/refresh-opportunities.md`."

- [ ] **Step 2: Verify with a manual trigger**

Trigger the routine once manually (or run the runbook in dry-run mode) and
confirm it produces a sensible PR / summary. Adjust the runbook or
`agent/sources.json` via normal PRs if needed.

**Fallback if scheduled cloud agents are unavailable:** skip Task 6. The runbook
can be run on demand in a local Claude Code session ("Follow
`agent/refresh-opportunities.md`") — same behavior, manual trigger.

---

## Notes

- **No new dependencies.** Tests use Node 24's built-in `node --test` and
  `node:assert/strict`. The `.mjs` scripts are outside the app's TypeScript build
  and ESLint globs, so they need no config changes.
- **Keep in sync:** if `src/types.ts` unions ever change, update the constants at
  the top of `scripts/lib/validate.mjs` to match.
