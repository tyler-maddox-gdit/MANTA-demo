# .manta/

What MANTA's gate reads and writes in this repo.

- `config.json` — written by hand. The pages every MANTA command scans (paths, joined to `--base`), the ruleset (`tags`, `extended`), the gate's floor (`failOn`) and the stylesheets a source fix may edit (`styles`). `npx manta gate`, `npx manta baseline` and `npx manta scan --base` all read it, so the gate and the nightly scan one page list.
- `baseline.json` — written by `npx manta baseline`, never by hand. The violations `main` tolerates, per page: their exact keys and a count per rule. The Baseline workflow rewrites and commits it after every push to `main`; a pull request is gated against its own copy, so accepting new debt is a visible change to this file. It first appears after the Baseline workflow's first run.
- `badge.svg` — drawn by the Baseline workflow from `baseline.json` (the total tolerated count) and committed beside it. The README shows it.
