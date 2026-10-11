# MANTA-demo

The words this repo uses for the demo itself. MANTA's own words (run, path, gate, baseline, Workbench) are
MANTA's glossary, in its `CONTEXT.md`.

## Demo site

The Benefits Portal: the React/Vite app under test, a citizen benefits portal for no real agency, with known
accessibility debt kept on purpose. Every debt element has a stable id so two scans find the same violations.

_Avoid_ "the app" or "the product": MANTA is the product; this is what it scans.

## Story

The ordered [scenes](#scene) of one demo, from a developer's terminal through a pull request and the nightly
to QA and release; also the two branches that hold it, `main` and `feature/upload-documents`.

_Avoid_ "script" for the story: a script is the `demo` command, or a path's Smart Script.

## Scene

One thing shown, about one to six minutes long, with its setup, what is typed, what is seen, what is said and
a fallback. `npm run demo -- scene <n>` sets one up. DEMO.md has one page per scene.

## Story tags

`story/main` and `story/feature`: the two tags that pin the story branches to rehearsed commits. A
[reset](#reset) moves the branches back to them; nothing else moves them but a deliberate refresh.

## Golden PR

The pull request from `golden/upload-documents` that holds MANTA's [pre-run](#pre-run) AI output — the
comment, the review's suggestions — posted once and never reset, closed or pushed to.

_Avoid_ "the demo PR": the live PR is the one scene 4 opens and a reset closes.

## Snapshot run

A committed MANTA run under `demo-data/`, laid out as a `--data-dir`: `pr` (the feature branch's gated run with
its fix) and `nightly` (a downloaded nightly run with its AI notes added afterwards).

_Avoid_ "fixture" or "recording": it is a real run, copied whole.

## Pre-run

AI output produced before the demo, from a [snapshot run](#snapshot-run), and shown as such — said out loud
every time it appears. Never presented as a live call.

## The pivot

Adding the repo secret `ANTHROPIC_API_KEY`: the same workflows then run MANTA's AI skills live, and the live PR
gets suggestions of its own. Removing it returns to the [pre-run](#pre-run) story. No file changes.

## Reset

`npm run demo -- reset`: one command back to scene 1 — story branches to their [tags](#story-tags), live PRs
closed, snapshots restored, local runs removed.
