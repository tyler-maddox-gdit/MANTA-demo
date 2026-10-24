# MANTA-demo

The words this repo uses for the demo itself. MANTA's own words (run, path, gate, baseline, Workbench) are
MANTA's glossary, in its `CONTEXT.md`.

## Demo site

The Benefits Portal: the React/Vite app under test, a citizen benefits portal for no real agency, with known
accessibility debt kept on purpose. Every debt element has a stable id so two scans find the same violations.

_Avoid_ "the app" or "the product": MANTA is the product; this is what it scans.

## Story

The one feature every [stage](#stage) shows, the upload dialog and its three defects, and the two branches that
hold it, `main` and `feature/upload-documents`.

_Avoid_ "script" for the story: a script is the `demo` command, or a path's Smart Script.

## Stage

One self-contained part of the demo, about three to eight minutes long: QA (the backlog in the Workbench, on
`main`), Dev (the developer's gate and the AI skills), DevOps (the pull request gate) or Release (the Workbench on
the change as it merges), each with its setup, what is typed, what is seen, what is said and a fallback.
`npm run demo -- stage <name>` sets one up, whatever ran before; stages are shown in any order, and the story in
DEMO.md runs them QA → Dev → DevOps → Release. DEMO.md has one page per stage. The slide (`presentation/index.html`) lights one at a time.

_Avoid_ "scene": the stages replaced the ordered scenes of the first version.

## Story tags

`story/main` and `story/feature`: the two tags that pin the story branches to rehearsed commits. A
[reset](#reset) moves the branches back to them; nothing else moves them but a deliberate refresh.

## Golden PR

The pull request from `golden/upload-documents` that holds MANTA's [pre-run](#pre-run) AI output — the
comment, the review's suggestions — posted once and never reset, closed or pushed to.

_Avoid_ "the demo PR": the live PR is the one the DevOps stage opens and a reset closes.

## Snapshot run

A committed MANTA data dir under `demo-data/`: `pr` (the feature branch's gated run with its fix), `nightly`
(the first date of the series `nightly`, a nightly run of `main` with its AI notes added afterwards) and `release`
(both dates of the series: the same on the change with the fixes applied, with the developer's work note over the
seven the gate fixed, imported from `.manta/work-notes/` by the scan).

_Avoid_ "fixture" or "recording": it is a real run, copied whole.

## Pre-run

AI output produced before the demo, from a [snapshot run](#snapshot-run), and shown as such — said out loud
every time it appears. Never presented as a live call.

## The pivot

Adding the repo secret `ANTHROPIC_API_KEY`: the same workflows then run MANTA's AI skills live, and the live PR
gets suggestions of its own. Removing it returns to the [pre-run](#pre-run) story. No file changes.

## Reset

`npm run demo -- reset`: one command back to the start — story branches to their [tags](#story-tags), live PRs
closed, snapshots restored, local runs removed.
