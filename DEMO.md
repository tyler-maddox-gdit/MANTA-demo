# The demo runbook

MANTA across the software lifecycle, shown on the Benefits Portal demo site in three stages that stand on their
own: **Dev** (the developer's gate and MANTA's AI skills), **DevOps** (the pull request gate) and **QA** (the
Workbench). Each stage is set up by one command, whatever ran before it, so show any of them, in any order. The
story below runs them Dev → DevOps → QA, the order the lifecycle runs, about 25 minutes, ending on the tester;
the slide, [presentation/index.html](presentation/index.html), moves left to right through the same three. What to
say at each beat, and what every finding is, is in [SCRIPT.md](SCRIPT.md).

Every stage runs without an AI key. Where the audience sees AI output that was produced earlier, say
**"pre-run"** out loud; never describe pre-run output as live.

The words in `code` are typed. `npm run demo -- stage <name>` sets a stage up and prints the same lines as
this page. To set up the PC you present from, follow [SETUP.md](SETUP.md) first: it ends with a dry run of
every stage.

---

## Day-of checklist

Do these before the audience arrives, in this order.

- [ ] The PC was set up with [SETUP.md](SETUP.md), and its dry run went through every stage.
- [ ] The night before: `npm run demo -- reset` ran once. (After a DevOps rehearsal, `status` is rightly
      **Not ready** until `reset` runs: a live PR is open and origin's feature branch is a commit ahead.)
- [ ] `npm run demo -- status` ends with **Ready.**: both story branches at their tags, no open live PR, a clean
      working tree, both snapshots listing a run token, `gh` signed in, Node 20 or later.
- [ ] `gh auth status` shows you signed in as a collaborator on `tyler-maddox-gdit/MANTA-demo`.
- [ ] The repo secret `MANTA_SECRET_DEMO_PW` is set (Settings → Secrets and variables → Actions).
- [ ] The repo secret `MANTA_READ_TOKEN` has not expired. It expires on: **2099-01-01** (see "Setup Tyler does once").
- [ ] Chromium is installed: `npm run install-browser-gdit`.
- [ ] `npm run dev` opens the site at http://localhost:5173. Stop it again (Ctrl+C).
- [ ] The golden PR is open (its link is in `npm run demo -- status`).
- [ ] The Actions tab shows last night's **Nightly** run green (spoken to in the DevOps stage).
- [ ] A browser is signed in to GitHub, with two tabs ready: the repo's pull requests, and the golden PR.
- [ ] The slide is open in a browser tab: `presentation/index.html`. **Next stage** or `→` moves it on.
- [ ] The terminal font is large and the theme is light.

---

## The slide

`presentation/index.html` is one page: the lifecycle as a pipeline (Plan, Develop, Integrate, Test, Release),
MANTA's part at every stage, and the three demo stages as groups over it. **Next stage** cycles all → Development →
DevOps → QA and release; any stage is clickable; `→`, `←`, `0`, `1`, `2`, `3` work; and `#qa`, `#devops`, `#dev` on the
URL open a stage directly, which is what each `stage` command prints. Show it with everything lit for the
opening, then light the stage you are about to demo.

---

## The story

One upload dialog, three seats, in the order the lifecycle runs. The same three defects every time; what
changes is what MANTA puts in front of each person.

**Opening, on the slide, everything lit (2 min).** "A developer builds an upload dialog for the Benefits
Portal. It ships with three defects: a file field with no label, a close button with no name, hint text too
faint to read. Today we follow that one dialog through three seats: the developer's laptop, the pull request,
and the tester's Workbench. Where you see AI output I will say **pre-run**: no AI runs on this laptop today."
Light Development.

**Development, the developer's seat (6 min).** Red gate, the AI skills, green gate. Lands on: fixed before
anyone else saw it, by a developer who never read WCAG.

**DevOps, the reviewer's seat (8 min).** The rewind, said plainly: the gate on the laptop is a courtesy, and
say this developer pushed the dialog as it was. The same three on the pull request, the fixes where the
reviewer lives, one click, green. Lands on: policy, not a person.

**QA and release, the tester's seat (8 min).** The handoff: the site behind the Workbench is the build the
nightly scanned last night, defects and all. The scan from the browser, the verdicts, then the turn: three
defects the machine found and fixed, and here is the fourth, the one no rule fires on. The ACR drafted from
the run. Lands on: the scan is evidence, the tester is the judgment, the paperwork is drafted from both.

**Close, on the slide, everything lit (1 min).** "One dialog, three seats, one record."

The rewind and the handoff are true of the mechanics: `stage devops` discards any local fix and pushes the
branch as tagged, and `stage qa` builds that same branch, so the launcher finds the three defects and a rescan
of them still fails.

---

## Stage · Development: the developer's gate (about 6 min)

**Setup.**
```
npm run demo -- stage dev
```
It puts the feature branch, `feature/upload-documents`, in the working tree, clean, with no local runs. A
**branch** is a line of work kept apart from the main code until it is ready.

**1 · The gate.** Type:
```
npm run dev        (in a second terminal; leave it running)
npx manta gate --base http://localhost:5173
```
**See.** MANTA's step stream as it scans each page, then the terminal summary: **New 3** (P1 2 · P2 1),
**Fixed 0**, **Tolerated** with the same number as the README's badge, the three new violations listed on
`/status?upload=BP-2026-10882`, and the last line `Gate failed: 3 new violations at or above minor.  exit 1`.
- "Accessibility is part of the definition of done: before anyone wrote a line of this dialog, a WCAG checklist
  was its acceptance criteria, and this is the check the developer runs against it."
- "The developer runs MANTA on their own machine, against the site as it runs on their laptop. This is the
  **gate**: a scan compared against the saved list of the problems we already know about, the baseline. It
  passes or fails the change, the way a unit test does. Legacy debt tolerated, new debt blocked."
- "The upload dialog added three new problems: a file field with no label, a close button with no name, and hint
  text too faint to read. The developer learns that now, before the pull request does."
- "Now: this developer is not an accessibility specialist. `button-name`, `label`, `color-contrast`: what do
  they do about it?"

**2 · The AI skills.** Type:
```
npm run demo -- fix
```
**See.** A **pre-run** header naming the run and the model; MANTA's `cluster` line (the findings grouped by one
upstream cause each); then each proposal: the cause in a sentence, the rules and elements it covers, and the
edit as the source file and line with the line before and after; then the `fix` line naming the patch, `git
apply`, and the diff summary: `Status.jsx` and `styles.css`.
- "MANTA's AI skills, **pre-run** on this run: no AI runs on this laptop today. With a key or the Claude command
  line here, the same command runs them live, in a minute or two."
- "**cluster** groups the findings by cause: the two icon-only buttons are one pattern, one fix. **fix** writes
  the edit to the exact line that wrote the element, in the project's own conventions; the contrast fix goes
  to the stylesheet. The patch is applied; nothing is committed. The developer reads the diff."

**3 · Green.** Type:
```
npx manta gate --base http://localhost:5173
```
**See.** `New 0`, **Fixed 2** (the refresh button's old debt went with the same pattern), Tolerated down by two,
and `Gate passed`, `exit 0`.
- "Fixed before anyone else saw it, by a developer who never read WCAG. The count only goes down; the pull
  request will come in green."

**If it goes wrong.** The dev server will not start: in the second terminal run `npm run build` then
`npm run preview`, and gate the preview build instead: `npx manta gate --base http://localhost:4173`. `fix`
says the patch does not apply: `npm run demo -- stage dev` starts the stage over. The second gate still fails:
read what it names; `git diff` shows what was applied.

**Live.** On a machine with the `claude` command line, `npm run demo -- fix --live` runs the cluster and fix
skills over the gate's run through MANTA's `claude-code` provider and applies the patch they write (a minute or
two). Say "the skills ran here". Their wording differs from run to run.

---

## Stage · DevOps: the pull request gate (about 8 min)

The one live GitHub Action of the demo: the gate runs on a pull request, MANTA posts what it found and the
fixes, the fixes are applied from the pull request's Conversation tab, and the gate goes green.

**Setup.**
```
npm run demo -- stage devops
```
It puts the feature branch back at its tag, closes any live PR from an earlier rehearsal, pushes the branch,
opens the live PR and prints its link and the golden PR's (the fallback). The browser is signed in to GitHub,
with the golden PR open in a background tab.

**1 · The pull request.** Open the live PR's link (**Conversation** tab). The checks area shows a yellow dot:
running.
- "Now rewind. The gate on the laptop is a courtesy; not every developer runs it. Say this one pushed the dialog
  as it was." (`stage devops` did exactly that: it discarded the fix and pushed the branch as tagged.)
- "A developer built an upload dialog and opened a **pull request**: how a change asks to join the main code.
  The team reviews it, and automated checks run on it."
- "A **pull request check** is one of those results, a green tick or a red cross beside the change. MANTA's gate
  is a required one: while it is red, this change cannot merge."

**2 · Watch the gate run** (about a minute and a half). **Checks** tab → **MANTA gate**; expand the **Gate** step
as it goes. It ends `Gate failed: 3 new violations at or above minor`.
- "On GitHub's machines: install, build the site, scan the page this change touches, compare against the
  **baseline**, the accessibility debt the main code already has, committed to the repository. The badge on the
  README counts it. Legacy debt tolerated, new debt blocked: a ratchet, the number can go down, never up."

**3 · What MANTA posted.** Back to **Conversation** (refresh if it has not updated). Point at each, in order:
- The red **MANTA gate** check, marked **Required**: "Blocked: it cannot merge."
- MANTA's comment, `MANTA gate · failed: 3 new violations at or above minor`: "New 3, Tolerated 6. The old debt
  is tolerated, the new debt is not, and each one names the source file and line that wrote it."
- The comment headed **Pre-run AI fixes**: "These fixes are **pre-run**: MANTA's AI wrote them ahead of time, on a
  snapshot of this same branch, because this repository has no AI key today. With a key, this job writes them
  itself, in the run you just watched."
- The alerts from **github-advanced-security** on the changed lines, and the second red check, **Code scanning
  results / MANTA**: "The same findings also go to GitHub's code scanning, in SARIF, the format code scanners
  share. Accessibility lands in the Security tab beside every other scanner, tracked the same way."
- Skip GitHub's long "Code Scanning has recently been set up" comment if it is there: it comes once, on the first
  pull request.

**4 · Apply the fixes, in one click.** MANTA's review, `3 suggested fixes from MANTA.`, shows each suggestion on its
lines in the Conversation tab: the close button's name and the file field's label in `Status.jsx`, the hint colour
in `styles.css`. Read one aloud (the close button's `aria-label="Close"`).
- "Each suggestion is an edit to the exact source line that wrote the element. The contrast fix goes to the
  stylesheet, where the colour is set, not to the page."

Right under the review, a comment with a green **Tip**: "One click applies all 3 of MANTA's suggested fixes", and
under it the box **☐ Apply all 3 suggested fixes**. Tick it. Within about half a minute a commit appears, "Apply
MANTA's suggested fixes (…)", made in your name, and the tip turns into a **Note**: "Applied all 3 of MANTA's
suggested fixes in …". (The demo's **Apply fixes** workflow does it: it writes the three suggestions into one
commit, so the gate runs once. Committing them one by one with **Commit suggestion** works too, but each commit
starts the gate again.)
- "MANTA changed nothing. A person with write access accepted three fixes, with one click, in one commit."

**5 · Green** (about a minute and a half). The gate runs again on the new commit. The check turns green, MANTA's
comment rewrites itself to `MANTA gate · passed: no new violations`, and the code scanning alerts show as fixed.
- "Policy, not a person. New debt cannot merge; legacy debt can only shrink. And this time it was fixed before
  it ever landed."
- "And every night, on its own, the same scanner signs in to the site with a password kept as a secret and scans
  the account page no pull request touches, with the rules that press keys and walk the focus. Last night's run
  is in the Actions tab." (Open it if there is time: **Nightly**, the **Scan** step, the Sign in path ending on
  `/account`, the `manta-nightly` artifact QA opens in the Workbench.)

Never press **Merge**, and never tick **Merge without waiting for requirements to be met (bypass rules)**, which
appears because you are an admin. The next `stage devops` or `reset` closes this pull request; never `git pull`
the feature branch after the apply (the next stage puts it back).

**If it goes wrong.** The gate takes over about three minutes, or the suggestions never appear: switch to the
golden PR tab. "This is the same change, with MANTA's fixes posted ahead of time: **pre-run**." Show its comment
and review, and press nothing there. The re-run comes back red: "it measures every push; here is what it found",
read the comment, and move on. No green nightly to show: skip it, or start one the day before:
`gh workflow run nightly.yml -R tyler-maddox-gdit/MANTA-demo --ref main`.

**With an AI key.** When the repo secret `ANTHROPIC_API_KEY` is set ("Setup Tyler does once", item 6), there is no
Pre-run comment: the gate job runs MANTA's fix skill itself (a minute or two longer) and posts its own suggestions.
Say "the fix skill ran in this job and posted these itself". Their wording differs from run to run.

---

## Stage · QA and release: the Workbench (about 8 min)

**Setup.**
```
npm run demo -- stage qa
```
It puts the feature branch (the upload dialog) in the working tree, builds the site, then runs the preview on
http://localhost:4173 and MANTA's Workbench on the **nightly snapshot** (a real nightly run, downloaded and
committed, with its AI notes **pre-run** afterwards) together, until Ctrl+C. The Workbench runs from the MANTA
`npm ci` installed; no MANTA checkout is needed.

**Type.** Nothing more. Open http://127.0.0.1:3508/.

**See, in order.**
1. **The launcher.** Paste the site's pages, one per line (`http://localhost:4173/`, `/apply`, `/status`,
   `/signin`, `/status?upload=BP-2026-10882`), pick the conformance level, press **Start**. One row per page,
   the current step, then the report. "A scan launched from the browser: no command line, and the same scan
   core the command line and the pipeline run."
2. **The Nightly run** (the run list, then its report): the plain-language notes beside each issue, the summary
   and the adjudications, all **pre-run** by MANTA's AI skills on this snapshot. Add an issue on the account
   page; give a verdict on an issue; **Rescan** the Pending badge's contrast issue on `/status` (still
   failing; it reloads the page from the preview); attest a criterion; open a criterion's checklist.
3. **Focus order.** The Pages dialog's **Focus order** column on `/status?upload=BP-2026-10882`: the numbered
   stops walk out of the open dialog into the page behind it.
4. **Export** on the Nightly run: the ACR draft (a Word document) and the USPS defects export.

**Say.**
- "The dialog reaches test. The site behind the Workbench is the build the nightly scanned last night, defects and
  all, so you can see how a tester meets them."
- "The scan is evidence; the human is the judgment. QA adds what no rule can see, decides what the scan could
  only flag, and re-measures a fix on the spot."
- "Everything QA does is recorded on the run itself: who decided what, and when. The record is the run."
- "Three defects the machine found and the machine fixed. Here is the fourth. No rule fires on a dialog that lets
  focus walk out of it. MANTA recorded the walk; QA judges it against
  WCAG 2.4.3, Focus Order, with the checklist."
- "The conformance paperwork comes from the same run QA just worked in: an ACR, the accessibility conformance
  report a buyer asks for, drafted from the evidence; nothing retyped. The verdicts and attestations QA made a
  minute ago are in it."

**If it goes wrong.** The Workbench will not start: open `demo-data\nightly\reports\index.html` from disk. It
is read-only (no verdicts or rescans), but every finding and the Focus order picture are there. Port 3508 in
use: `npm run demo -- stage qa --port 3600`. The export dialog fails: open the committed ACR draft in
`demo-data\nightly\reports\`.

---

## Resetting between demos

```
npm run demo -- reset
```

It refuses when the working tree has changes; `npm run demo -- reset --force` discards them. A reset moves
`main` and `feature/upload-documents` back to their story tags, closes every open pull request from
`feature/upload-documents`, force-pushes both branches, restores `demo-data/` (undoing every verdict, added
issue, rescan and attestation made in the Workbench), removes the local `reports/`, `run-records/` and `ci-run/`
folders and checks out `main`. The golden PR and its branch are never touched.

A stage command does the local part of this on its own (the working tree, the snapshots, the local runs, the
feature branch), so between stages nothing else is needed. `reset` is for `main`, origin and the night before.

On GitHub a reset costs one closed pull request, two force pushes and one Baseline run on `main` (which
commits nothing, since the baseline has not changed). Pull request numbers climb by one per rehearsal; the
golden PR's number never changes.

---

## Refreshing a snapshot

A snapshot is a committed copy of one MANTA run (`reports/`, `run-records/`, `sites/`) under `demo-data/`.
Refresh one after MANTA or the site changes, then commit it to `main` and move the story tags (see the last
section).

- **From a workflow run's artifact:** `npm run demo -- snapshot nightly <run id> --artifact manta-nightly`
  (or `snapshot pr <run id>` for a gate run's `manta-run`).
- **From this folder's last local run:** `npm run demo -- snapshot pr` copies the root `reports/`,
  `run-records/` and `sites/`.
- **To look at a CI run without committing it:** `npm run demo -- ci-run [<run id>]` downloads it into
  `ci-run/` and prints the Workbench command.

The command prints the run tokens it copied. See `demo-data/README.md` for how each snapshot is made. The
`pr` snapshot is also what `npm run demo -- fix` prints and applies: its `cluster-*.json`, `fix-proposals-*.json`
and `fix-*.patch` must come from a run of `feature/upload-documents` at its tag, or the patch will not apply.

---

## Setup Tyler does once

The repository, its branches, tags, snapshots and golden PR were built on 2026-10-11/13. The account-level
setup is `npm run demo -- setup-github`, run from any checkout with `gh` signed in as `tyler-maddox-gdit` (a repo
admin). It is pure Node, so it runs on Windows or a Mac. Each stage looks first and skips what is already there,
so it is safe to run again: when the read token expires, or to make a fresh deploy key.

1. **Actions** enabled. If pushes and pull requests never start a run but a manual run does, turn Actions off
   and on again (SETUP.md, Troubleshooting). That happened once, on 2026-10-13: the repo was created empty.
2. **`MANTA_READ_TOKEN`** (repo secret): a fine-grained personal access token, resource owner
   `tyler-maddox-gdit`, repository access **only** `MANTA`, permission **Contents: read-only**. It lets `npm ci`
   install MANTA from its private repository. GitHub lets no script create one: the stage opens the page, lists
   the settings, and `gh` takes the token at a hidden prompt. MANTA_READ_TOKEN expires: 2099-01-01 (the stage
   writes the date here). Until it exists every workflow run fails at `npm ci`.
3. **`MANTA_SECRET_DEMO_PW`** (repo secret): `benefits-demo`, the demo site's sign-in password. The nightly's
   Sign in path types it; without it the path is held and the nightly warns. Set 2026-10-13.
4. **`MANTA_DEMO_DEPLOY_KEY`** (repo secret) and the deploy key **baseline job** with write access: generated by
   `ssh-keygen`, the public half added as a deploy key, the private half only in the secret. Set 2026-10-13.
5. **The ruleset `main`** on the default branch: the check **MANTA gate** (the gate workflow's job) required,
   force pushes blocked, bypassed by **Repository admin** (so `npm run demo -- reset` can force-push `main`;
   present signed in as `tyler-maddox-gdit`) and **Deploy keys** (so the Baseline workflow can commit the
   baseline). Created 2026-10-13.
6. **Optional, the pivot: `ANTHROPIC_API_KEY`** (repo secret). With it set, the gate also proposes fixes for
   the new violations (`--skills cluster,fix --scope new`) and the nightly runs the full AI pass; the live PR
   then gets its own suggestions. Say "the fix skill ran in this job and posted these itself". Remove the
   secret to go back to the pre-run story. Nothing else changes. On the laptop, the pivot is
   `npm run demo -- fix --live` with the `claude` command line installed.

**Refreshing what was done** — the commands, should a snapshot or the golden PR ever need remaking:

- The baseline: on `main`, `npm run build`, `npm run preview`, `npx manta baseline --base http://localhost:4173`, `node .github/scripts/badge.mjs`, commit `.manta/`.
- The pr snapshot: on `feature/upload-documents`, build and preview, `npx manta gate --base http://localhost:4173`, then `npm run demo -- fix --live` (or, from a MANTA checkout, `node $MANTA/node_modules/tsx/dist/cli.mjs $MANTA/ai/cli.ts --skills cluster,fix --scope new --provider claude-code`), `git checkout -- src` to undo the applied patch, then `npm run demo -- snapshot pr` and commit `demo-data/pr` to `main`.
- The nightly snapshot: on `golden/upload-documents` (the dialog exists there; `main` lists the page but has no dialog), build and preview, `MANTA_SECRET_DEMO_PW=benefits-demo npx manta scan --base http://localhost:4173 --extended --paths 5d1e7a42 --name Nightly`, then the full pass (`--skills cluster,fix,explain,summary,adjudicate,acr --provider claude-code`), then `npm run demo -- snapshot nightly` and commit to `main`. A CI-made one works the same: `gh workflow run nightly.yml --ref golden/upload-documents`, then `npm run demo -- snapshot nightly <run id> --artifact manta-nightly` and the pass over it.
- The story tags, after any commit to `main` (the stage commands run the `demo/demo.mjs` of the branch they check out, so the feature branch must carry `main`'s): `git rebase main feature/upload-documents`, `git tag -f story/main main`, `git tag -f story/feature feature/upload-documents`, `git push -f origin main feature/upload-documents story/main story/feature`. The golden branch stays where it is unless its PR is being remade.
- The golden PR's post: `GITHUB_REPOSITORY=tyler-maddox-gdit/MANTA-demo GITHUB_TOKEN=$(gh auth token) npx manta post --pr <n> --run <token>` from the repo root with the pr snapshot's `reports/` copied to `reports/`. Never close the PR, never push to its branch, never press Commit suggestion.

The repo is public: the workflows, the golden PR and the committed snapshots are visible to anyone.
