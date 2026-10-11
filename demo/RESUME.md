# Resume prompt

Paste everything below the line into a new Claude Code session started in this directory (a clone of `tyler-maddox-gdit/MANTA-demo`, or the local copy at `~/Projects/MANTA-demo`). It carries the state of the overnight build of 2026-10-10/11, so the session can finish it without re-deriving anything.

---

Finish building the MANTA-demo repo. MANTA's side is done and merged; this repo is built locally but not yet pushed. Work autonomously and report concisely at the end. Never add Co-Authored-By, "Generated with Claude Code" or session lines to any commit, PR or comment.

**Where things stand**

- MANTA (private, `tyler-maddox-gdit/MANTA`) is merged and tagged `v1`: the `manta` bin (`scan`, `gate`, `baseline`, `post`), the gate, the source stamp, source fixes, the `new` scope and the SARIF export. The map is issue #804 on that repo; read its Decisions-so-far before changing anything. Issue #812 (the Windows check) is Tyler's.
- This repo, `tyler-maddox-gdit/MANTA-demo`, exists on GitHub (public) but is **empty**: nothing has been pushed. `gh auth` has two accounts; use `gh auth token -u tyler-maddox-gdit` for pushes to this repo (the other account, `tyler-maddox`, has push access too).
- Local branches: `main` (the site, config, workflows, runbook, baseline and badge, `demo-data/pr`), `feature/upload-documents` and `golden/upload-documents` (the feature commit on top of main). Check `git log --all --oneline`: if `feature/upload-documents` is not on top of `main`'s newest commit, rebase it and point `golden/upload-documents` at the same commit.
- `demo-data/pr` is committed: the feature branch's gated run (New 3 on `/status?upload=BP-2026-10882`), its cluster and fix artifacts and `fix-<token>.patch`.
- The nightly run is **not** committed. Its files exist only in the previous session's temp scratchpad and may be gone. If `demo-data/nightly` is missing, remake it on `golden/upload-documents`: `npx playwright install chromium`, `npm run build`, `npm run preview &`, then `MANTA_SECRET_DEMO_PW=benefits-demo npx manta scan --base http://localhost:4173 --extended --paths 5d1e7a42 --name Nightly --no-nudge`, then the full AI pass over it from a MANTA checkout (`$MANTA/node_modules/.bin/tsx $MANTA/ai/cli.ts --skills cluster,fix,explain,summary,adjudicate,acr --provider claude-code`, adjudicate may time out at standard effort: rerun it alone with `--effort thorough`). Then `npm run demo -- snapshot nightly`, keep only that one run in `demo-data/nightly` (drop any other token's files and run record) and commit it on `main`. The claude-code provider runs on Tyler's subscription: at most 6 passes at standard effort in all; the earlier session used 3, so budget 3.
- DEMO.md's "Setup Tyler does once" section already says what is done and what is Tyler's. `demo/setup-wizard.sh` is the wizard for his part (read token, sign-in secret, deploy key, ruleset, golden PR). Do not fake any of it.

**To do, in order**

1. Make sure `demo-data/nightly` is committed on `main` (above). Check `npm run demo -- status` runs.
2. Set the story tags: `git tag -f story/main main` and `git tag -f story/feature feature/upload-documents`.
3. Push all three branches and both tags to `origin`. The workflows will start failing at `npm ci` until Tyler sets `MANTA_READ_TOKEN`; that is expected, say so in the report. Check whether the secrets exist (`gh secret list -R tyler-maddox-gdit/MANTA-demo`); if they do, watch the first gate and baseline runs and fix what breaks in the YAML.
4. Open the golden PR from `golden/upload-documents` onto `main` titled "Upload documents (golden PR — MANTA pre-run)", label `golden` (create the label), then post MANTA's output onto it once: copy `demo-data/pr/reports` to `reports/` and run `GITHUB_REPOSITORY=tyler-maddox-gdit/MANTA-demo GITHUB_TOKEN=$(gh auth token -u tyler-maddox-gdit) npx manta post --pr <n> --run <the pr snapshot's token>`. Never close this PR, push to its branch or press Commit suggestion. If the post fails, prepare its content as files in `demo-data/pr/post/` and say so.
5. Rehearse what can be rehearsed locally: scene 2 (`npx manta gate --base http://localhost:5173` against `npm run dev`), scene 3 (`git apply` of the patch), `npm run demo -- reset` only against a throwaway clone, never against the real remote.
6. Post one status comment on MANTA issue #804 (`gh issue comment 804 -R tyler-maddox-gdit/MANTA`): what is pushed, what ran, what failed and why, and exactly what Tyler must still do (run `bash demo/setup-wizard.sh`, the GDIT branding commit after he reviews the site, the Windows checklist on #812). Then stop.

Rules: pure Node in any script (the demo PC is Windows); keep branding neutral until Tyler adds GDIT himself; `npm run test:unit` in MANTA is never needed here.
