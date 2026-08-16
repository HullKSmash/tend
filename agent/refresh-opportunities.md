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

````
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
````

If a section is empty, write "None".
