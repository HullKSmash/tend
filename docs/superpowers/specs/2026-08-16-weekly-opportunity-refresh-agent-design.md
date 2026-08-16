# Weekly Opportunity Refresh Agent — Design

**Date:** 2026-08-16
**Status:** Approved design, pending implementation plan

## Summary

A scheduled cloud Claude agent runs every **Monday at 6:00am PT**, researches a
curated list of trusted Bay Area environmental organizations, and opens a **pull
request** against `main` proposing changes to `public/data.json` (new
opportunities, plus flags for stale entries). A human reviews and merges the PR;
Vercel deploys on merge. Nothing reaches the live site without a human merge.

## Context

Tend is a static React + Vite + TypeScript site deployed on Vercel. All
volunteer opportunities live in `public/data.json` (currently 22 opportunities
across 12 organizations) and are fetched at runtime by `src/App.tsx`. Each entry
conforms to the `Opportunity` type in `src/types.ts`. The data was previously
moved to `public/data.json` specifically to support a weekly refresh workflow;
this spec defines that workflow.

The site filters opportunities by distance: `src/utils/filters.ts` computes the
haversine distance from the user's location to each opportunity's `lat`/`lng`.
Every opportunity therefore requires valid coordinates or it cannot appear in a
radius search.

## Goals

- Keep `public/data.json` fresh without manual research each week.
- Preserve data quality via a human review gate (PR merge) before publishing.
- Make the agent's behavior transparent and editable through version-controlled
  files rather than hidden configuration.

## Non-Goals (YAGNI)

- No expansion of scope: region stays SF Bay Area, categories stay the six
  existing environmental tags (`trails`, `habitat`, `cleanup`, `wildlife`,
  `water`, `education`). No schema changes.
- No open web crawling — only the curated source list is consulted.
- No auto-merge / auto-publish. A human always merges.
- No backend or database — the data model remains a static JSON file.

## Operating Model

**Cloud agent → PR.** A scheduled cloud Claude agent (a Claude Code routine on a
weekly cron) performs the run and opens a PR. The human reviewer approves content
by merging.

**Dependency:** this requires scheduled cloud agents to be enabled on the
account. If unavailable, the fallback is a locally triggered run (user kicks it
off on demand) using the identical runbook and source list; only the trigger
differs.

## New Files

All committed to the repo so behavior is reviewable and editable via git.

### `agent/sources.json`
The curated allowlist — the single knob for adding/removing organizations.
Seeded from the 12 organizations already present in `public/data.json`:

| Organization | Volunteer URL |
| --- | --- |
| Bay Area Ridge Trail Council | https://ridgetrail.org/volunteer-2/ |
| East Bay Regional Park District | https://www.ebparks.org/volunteer |
| Golden Gate Bird Alliance | https://goldengatebirdalliance.org/volunteer/ |
| Golden Gate National Parks Conservancy | https://www.parksconservancy.org/volunteer/community-volunteer-programs |
| Grassroots Ecology | https://www.grassrootsecology.org/calendar |
| Marin County Open Space District | https://www.parks.marincounty.gov/discoverlearn/volunteer |
| One Tam / Tamalpais Lands Collaborative | https://www.onetam.org/volunteer |
| Peninsula Open Space Trust | https://openspacetrust.org/volunteer/ |
| SF Rec & Parks | https://sfrecpark.org/780/Volunteer-Programs |
| Save the Bay | https://savesfbay.org/calendar/ |
| Surfrider Foundation SF Chapter | https://sf.surfrider.org/programs/beach-cleanups |
| The Marine Mammal Center | https://www.marinemammalcenter.org/get-involved/volunteer/sausalito |

Proposed shape (per entry): `{ "org": string, "url": string, "defaultTags": TagId[] }`.
`defaultTags` seeds tag suggestions for that org's opportunities; the agent may
still adjust per opportunity.

### `agent/refresh-opportunities.md`
The runbook the cloud agent follows each run (see "Run Procedure" below). Editing
agent behavior means editing this file through a normal PR.

### `scripts/validate-data.mjs`
A validator run before any PR is opened. It confirms `public/data.json`:
- is valid JSON and an array;
- every entry matches the `Opportunity` schema (required fields present, correct
  types, `commitment`/`days`/`tags` values within their allowed unions);
- `id` values are unique and follow the `opp-NNN` pattern;
- `lat`/`lng` are numbers within plausible Bay Area bounds (a coarse sanity
  check, not exact validation).

Exit non-zero on any failure so the run aborts before opening a PR.

## Run Procedure (what the runbook instructs each week)

1. **Load state.** Read `public/data.json` and `agent/sources.json`.
2. **Fetch sources.** For each source URL, fetch the volunteer/calendar page and
   extract the opportunities currently listed.
3. **Normalize** each candidate into the `Opportunity` schema:
   - Text fields (`title`, `org`, `description`, `fullDescription`,
     `nextSteps`, `website`, `duration`, `city`/`state`/`zip`).
   - `tags` from the org's `defaultTags`, adjusted to the specific opportunity.
   - `commitment` and `days` mapped to their allowed union values.
   - **Coordinates:** if the org/city already exists in `public/data.json`,
     **reuse** those `lat`/`lng`. Only for a genuinely new venue/city, geocode
     the location with **OpenStreetMap Nominatim** (the same service the
     frontend already uses in `src/utils/geo.ts`) and **flag** the result in the
     PR for human verification.
4. **Deduplicate** against existing entries by normalized `org` + `title`. Skip
   candidates that already exist.
5. **Prune (flag).** Identify existing entries that are likely stale:
   - a one-time opportunity whose event date has clearly passed, or
   - a `website` that returns a dead link (non-2xx / unreachable).
   These are proposed for removal in the PR and called out explicitly — not
   removed silently.
6. **Assign IDs.** New entries get sequential `opp-NNN` ids continuing from the
   current maximum.
7. **Validate.** Write the updated `public/data.json`, then run
   `node scripts/validate-data.mjs` and `npm run build`. If either fails, fix or
   abort — do not open a PR with a failing build.
8. **Open PR.** Title includes the run date. Body contains a summary table with
   three sections — **Added**, **Pruned (flagged)**, **New-location coordinates
   (flagged)** — each row linking the source URL it came from.

## Guardrails

- Curated sources only; no open web search.
- New coordinates and dead-link prunes are **flagged**, never silently trusted.
- The PR never auto-merges, and the build must pass before the PR is opened.
- Behavior changes flow through git (the runbook and source list are files).

## Data Flow

```
Monday 6am PT (cron)
  → cloud agent reads data.json + sources.json
  → fetch each source URL
  → normalize + dedup + geocode-new + flag-stale
  → write data.json → validate-data.mjs + npm run build
  → open PR (Added / Pruned / Flagged)
  → [human] review + merge
  → Vercel deploys from main
```

## Error Handling

- **A source is unreachable:** skip it, note it in the PR body, continue with the
  rest. One dead site does not fail the run.
- **Geocoding fails for a new location:** do not invent coordinates; omit that
  candidate and list it under "could not geocode" in the PR for manual handling.
- **Validation or build fails:** abort before opening a PR; surface the error.
- **No changes found:** open no PR (or open a short "no changes this week" note —
  to be decided in the implementation plan).

## Testing

- `scripts/validate-data.mjs` unit-tested against known-good and known-bad
  fixtures (missing field, bad union value, duplicate id, out-of-bounds coord).
- A dry-run mode for the runbook that produces the PR summary without opening a
  PR, so the pipeline can be exercised locally against the live source pages.

## Open Questions for the Implementation Plan

- Exact PR body format and whether to post a "no changes" PR.
- Whether `scripts/validate-data.mjs` should also run as a pre-existing CI check
  on all PRs (defense in depth), independent of the agent.
