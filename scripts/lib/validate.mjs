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
