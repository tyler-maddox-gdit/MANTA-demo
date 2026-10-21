# demo-data/

Committed **snapshot runs**: each folder is one MANTA run with its artifacts, laid out as a `--data-dir`
(`reports/`, `run-records/`, `sites/`), so MANTA's Workbench opens it offline:

```
npm run demo -- workbench <name>       (nightly or pr; runs the MANTA that npm ci installed)
```

Every AI artifact in a snapshot is gated on its run's token: it belongs to that run and cannot sit beside a
fresh scan. What a snapshot shows as AI output is **pre-run**.

- **`pr/`** — a gated run of `feature/upload-documents` with `cluster` and `fix --scope new` added on the Mac:
  `gate-<token>.json`, the fix proposals with source edits for the upload dialog's three new defects and the
  refresh button's old debt, and `reports/fix-<token>.patch`. The Gate workflow posts these fixes onto the live PR as
  pre-run suggestions when the repo has no AI key (the DevOps stage), `npm run demo -- fix` prints and applies them
  (the Dev stage), and the golden PR was posted from this run.
- **`nightly/`** — one nightly run of `golden/upload-documents`, made on the Mac as CI makes it (`--extended`, the Sign in path replayed to
  `/account`, the upload page included), with `cluster,fix,explain,summary,adjudicate,acr` added on the Mac
  afterwards. The QA stage opens it.

Both are filled by `npm run demo -- snapshot <name> [<run id>]` (DEMO.md, "Refreshing a snapshot" and
"Setup Tyler does once"); until then this folder holds only this file.

The Workbench writes into a snapshot as QA works (attestations, added issues, verdicts, rescans).
`npm run demo -- reset` restores both folders to what is committed.

`ci-run/` at the repo root (gitignored) is where `npm run demo -- ci-run` downloads a workflow run's artifact
to look at without committing it.
