# demo-data/

Committed **snapshot runs**: each folder is a MANTA data dir (`reports/`, `run-records/`, `sites/`), one run or
the dates of one series with their artifacts, so MANTA's Workbench opens it offline:

```
npm run demo -- workbench <name>       (nightly, release or pr; runs the MANTA that npm ci installed)
```

Every AI artifact in a snapshot is gated on its run's token: it belongs to that run and cannot sit beside a
fresh scan. What a snapshot shows as AI output is **pre-run**.

- **`pr/`** — a gated run of `feature/upload-documents` with `cluster` and `fix --scope new` added live through the
  claude CLI (2026-10-21): `gate-<token>.json`, the fix proposals with source edits for the upload dialog's three
  new defects and the old debt that shares their causes (the footer's five "Last updated" lines, which share the
  hint's `--muted-bad` colour, and the refresh button), and `reports/fix-<token>.patch`. The Gate workflow posts these fixes onto the live PR as
  pre-run suggestions when the repo has no AI key (the DevOps stage), `npm run demo -- fix` prints and applies them
  (the Dev stage), and the golden PR was posted from this run.
- **`nightly/`** — the first date of the series `nightly`: one nightly run of `main` (the backlog, before the
  upload change: 27 on five pages), made on the Mac as CI makes it (`--extended --series nightly`, the Sign in
  path replayed to `/account`), with `cluster,fix,explain,summary,adjudicate,acr` added on the Mac afterwards
  (2026-10-24). The QA stage opens it.
- **`release/`** — the series' first date again and its second: a nightly run of `feature/upload-documents` with
  the `pr` snapshot's fix patch applied, the site as it merges (20 on five pages, and the upload dialog's focus
  order), scanned from a checkout holding the developer's `manta note` over the seven the gate fixed, so the
  series log `reports/issues-nightly.json` carries that work note and the date's Changes reads
  `33 → 25 open issues · 8 closed`. The Release stage opens it.

All three are filled by `npm run demo -- snapshot <name> [<run id>]` (DEMO.md, "Refreshing a snapshot" and
"Setup Tyler does once").

The Workbench writes into a snapshot as QA works (attestations, added issues, verdicts, rescans).
`npm run demo -- reset`, or any stage command, restores them to what is committed.

`ci-run/` at the repo root (gitignored) is where `npm run demo -- ci-run` downloads a workflow run's artifact
to look at without committing it.
