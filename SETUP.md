# Setting up the demo PC

A step-by-step setup of a Windows PC to present the demo from, ending in a dry run of all six scenes. Plan
on about an hour the first time, most of it downloads. Everything here is typed into **PowerShell in Windows
Terminal** (Start → "Terminal"). Lines in code blocks are typed as shown; **Expect** says what you should see.

The presenter's runbook is [DEMO.md](DEMO.md). This page gets the PC ready to follow it.

---

## Part 1 · Install the tools

1. See what the PC already has:
   ```
   node --version
   git --version
   gh --version
   ```
   **Expect** Node `v20` or later. A "not recognized" error means that tool is missing.

2. Install whatever is missing (skip the lines for tools you have):
   ```
   winget install --id OpenJS.NodeJS.LTS -e
   winget install --id Git.Git -e
   winget install --id GitHub.cli -e
   ```
   Then **close Terminal and open it again**, so it finds the new tools. If `winget` is blocked or asks for an
   administrator, use the installers from nodejs.org (LTS), git-scm.com and cli.github.com, or ask IT.

3. Let PowerShell run npm, then allow long file paths in Git:
   ```
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   git config --global core.longpaths true
   ```
   Answer `Y` if asked. (Without the first line, `npm` stops with "running scripts is disabled on this system".)

## Part 2 · Sign in to GitHub

Sign in as **tyler-maddox-gdit**. That account owns the repo: it can read MANTA's private repository, which
`npm ci` installs from, and it is an admin, which `npm run demo -- reset` needs to move `main` back.

1. ```
   gh auth login
   ```
   Choose **GitHub.com** → **HTTPS** → **Yes** (authenticate Git with your GitHub credentials) → **Login with
   a web browser**. Copy the one-time code, press Enter, sign in as tyler-maddox-gdit in the browser, paste the
   code.

2. Make Git (and so npm) use that sign-in:
   ```
   gh auth setup-git
   gh auth status
   ```
   **Expect** `Logged in to github.com account tyler-maddox-gdit`, marked `Active account: true`. If another
   account is active: `gh auth switch -u tyler-maddox-gdit`.

## Part 3 · Get the demo

1. Use a short folder: long paths under `node_modules` trouble Windows.
   ```
   mkdir C:\demo
   cd C:\demo
   gh repo clone tyler-maddox-gdit/MANTA-demo
   cd MANTA-demo
   ```

2. Install the site and MANTA (several minutes; MANTA comes from its private repository, pinned at `v1.2`):
   ```
   npm ci
   ```
   **Expect** it to end with `added … packages`. "Repository not found" or "Authentication failed" for
   `tyler-maddox-gdit/MANTA` means Part 2 step 2 did not take: run `gh auth setup-git` again.

3. Install the browser MANTA scans with (about 100 MB):
   ```
   npm run install-browser-gdit
   ```
   **Expect** it to end with `Chromium is ready for MANTA.` It sets GDIT's network up for the download
   (`--use-system-ca`, Node 22.15 or later) and installs through MANTA's own Playwright, so it always
   installs the browser build MANTA looks for. Never `npx playwright install` and never copy browsers into
   `ms-playwright` by hand: another Playwright installs another build, and every scan then fails with
   `Executable doesn't exist at …`.
   Behind a corporate proxy, also set `$env:HTTPS_PROXY = "http://<proxy>:<port>"` in the same window.

4. Check everything:
   ```
   npm run demo -- status
   ```
   **Expect** every line `ok` and the last line **Ready.** Each `FIX` line says what to do.

There is no separate MANTA checkout to make: `npx manta` and the Workbench (`npm run demo -- workbench`) both
run the MANTA that `npm ci` installed.

## Part 4 · Finish the GitHub setup (once, from this PC or the Mac)

The repo's secrets, deploy key and ruleset were set on 2026-10-13, all but one: **`MANTA_READ_TOKEN`**, which
lets the workflows install MANTA. GitHub lets no script create it, so it is yours. Until it exists every
workflow run fails at `npm ci`: scene 3's live PR check stays red for the wrong reason and scene 4 has no
nightly to show.

1. ```
   npm run demo -- setup-github
   ```
   Every stage that is done says ✓. At **MANTA_READ_TOKEN**, answer `y`: it opens GitHub's token page and lists
   the settings (resource owner tyler-maddox-gdit, only the MANTA repository, Contents read-only, 1 year).
   Generate the token, copy it, paste it at the prompt (nothing shows as you paste), then type its expiry date.

2. It wrote the expiry date into DEMO.md. Commit it and move the story tag to the new commit:
   ```
   git commit -am "DEMO.md: the read token's expiry date"
   git push origin main
   git tag -f story/main main
   git push -f origin story/main
   ```

3. Prove the workflows now run. Start a nightly and watch it:
   ```
   gh workflow run nightly.yml -R tyler-maddox-gdit/MANTA-demo --ref main
   gh run watch -R tyler-maddox-gdit/MANTA-demo
   ```
   Pick the newest **Nightly** run. **Expect** every step green, the Sign in path replayed, ending on
   `/account`.

4. The push in step 2 also started the **Baseline** workflow on `main`. Check it with
   `gh run list -R tyler-maddox-gdit/MANTA-demo -w Baseline` (then `gh run view <number> --log` on the newest). If it committed a new baseline, CI measured the
   site differently from the Mac: the story tags then need refreshing (DEMO.md, "Refreshing what was done", the
   story tags) before the demo, or the gate's Tolerated count will not match the badge.

## Part 5 · Dry run of every scene (about 30 minutes)

This is the real thing: scene 3 opens a live pull request and starts a nightly on GitHub, and the reset at the
end closes it. Open **two Terminal tabs**, both in `C:\demo\MANTA-demo` (Ctrl+Shift+T opens a tab; `cd
C:\demo\MANTA-demo` in it). Call them **tab 1** and **tab 2**.

**Start clean** (tab 2):
```
npm run demo -- reset
```
**Expect** `[DONE] Reset: main at story/main, …` and Scene 1's cue. It force-pushes `main` and the feature
branch to their tags; that is how every rehearsal starts.

**Scene 1** — nothing to type: the slide.

**Scene 2** — the developer's gate:
```
npm run demo -- scene 2                          (tab 2: checks out the feature branch)
npm run dev                                      (tab 1: leave it running)
npx manta gate --base http://localhost:5173      (tab 2)
```
**Expect** the scan's steps, then `New 3 ✗ P1 2 · P2 1`, `Tolerated 27`, the three violations on
`/status?upload=BP-2026-10882` (`#upload-close`, `#upload-file`, `#upload-hint`) and
`Gate failed: 3 new violations at or above minor.  exit 1`. Try Ctrl+clicking the `Report` link; whether it
opens is one of the things to note.

**Scene 3** — the pull request (tab 2):
```
npm run demo -- scene 3
```
**Expect** two lines: the live PR's link and the golden PR's link (the fallback). Open the live PR. On its
**Checks** tab, watch **MANTA gate** run (about a minute and a half) and end red. On the **Conversation** tab:
MANTA's comment with its table of the three new violations, a comment headed **Pre-run AI fixes**, the code
scanning alerts, and MANTA's review, `3 suggested fixes from MANTA.`. Then, in the green Tip right under MANTA's review,
tick **Apply all 3 suggested fixes**, and wait about half a minute for the commit. **Expect** the gate to run again and turn
green, and MANTA's comment to say `passed: no new violations`. Never tick the admin's "Merge without waiting" box,
and never press anything on the golden PR.

**Scene 4** — the nightly (tab 2):
```
npm run demo -- scene 4
```
It prints a `gh run view <number> … --web` line: type that line. **Expect** the browser to open the latest green
Nightly run, its Scan log showing the Sign in path ending on `/account`.

**Scene 5** — QA in the Workbench:
```
Ctrl+C                                           (tab 1: stop the dev server)
npm run build                                    (tab 1)
npm run preview                                  (tab 1: leave it running)
npm run demo -- workbench nightly                (tab 2)
```
Open http://127.0.0.1:3508/ in the browser, then the **Nightly** run's report. Try each thing DEMO.md's scene 5
lists: add an issue on the account page; a verdict on an issue; **Rescan** the Pending badge's contrast issue on
`/status` (it needs the preview in tab 1); attest a criterion; open a criterion's checklist; the Pages dialog's
**Focus order** column on the upload page.

**Scene 6** — release: back on the Workbench's run list, press **Export** on the Nightly run. **Expect** the ACR
draft (`.docx`) and the USPS defects export to download and open in Word.

**Finish** — Ctrl+C in both tabs, then (tab 2):
```
npm run demo -- reset
npm run demo -- status
```
The reset closes the live PR and undoes what the Workbench wrote into the snapshots. **Expect** **Ready.**

## Part 6 · Report back

Write what happened into a comment on [MANTA issue #812](https://github.com/tyler-maddox-gdit/MANTA/issues/812):
for anything that failed, the command and the exact error text (copy it from Terminal). Also note how long
`npm ci` and the first gate took, and whether the `Report` link opened.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| `npm` : "running scripts is disabled on this system" | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or type `npm.cmd` in place of `npm`. |
| `npm ci`: "Repository not found" / "Authentication failed" for `tyler-maddox-gdit/MANTA` | `gh auth status` must show tyler-maddox-gdit active; then `gh auth setup-git` and `npm ci` again. |
| `npm ci`: `EPERM` | A file in `node_modules` is in use, so `npm ci` cannot delete it. Stop anything running from this folder (Ctrl+C on `npm run dev`, `npm run preview`, `npm run demo -- workbench`) and close editors open on it. Then `Get-Process node -ErrorAction SilentlyContinue`: if any are listed, `Stop-Process -Name node` (this also stops a MANTA GUI started from another folder). Run `npm ci` again. Still failing: `Remove-Item node_modules -Recurse -Force`, then `npm ci`; a file `Remove-Item` cannot delete names what holds it. |
| `npm ci`: `ENAMETOOLONG`, "Filename too long" | Clone under `C:\demo`, run `git config --global core.longpaths true`, and try again. Antivirus scanning `node_modules` makes `npm ci` slow, not fail. |
| `npm run install-browser-gdit`: "unable to get local issuer certificate" | The network re-signs HTTPS with a company certificate Node does not trust, and the script's `--use-system-ca` did not cover it. Check `node --version` is 22.15 or later. Failing that, `npm config get cafile`: if it names a file, `$env:NODE_EXTRA_CA_CERTS = "<that file>"` (or the `.pem` IT gives you), then install again. Last resort, for that one download only: `$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"`, install, close the window. |
| A scan or the Workbench: `Executable doesn't exist at …\ms-playwright\chromium_headless_shell-<build>\…` | The browser was installed by another Playwright version than MANTA's. Run `npm run install-browser-gdit` in this folder. |
| `npm run install-browser-gdit` hangs or fails | The network blocks the download: set `$env:HTTPS_PROXY`, or ask IT to allow Playwright's download hosts. `npm run demo -- status` says when Chromium is missing. |
| The gate: "could not load" `localhost:5173` | `npm run dev` is not running in tab 1. Or gate the built site instead: `npm run build`, `npm run preview`, `npx manta gate --base http://localhost:4173`. |
| Scene 3: no **Pre-run AI fixes** comment or review on the live PR | The PR's branch is not the story's (`npm run demo -- reset`, then scene 2 and 3 again), or the gate job failed before posting: open its log under **Checks**. On stage, show the golden PR instead. |
| The Workbench: port 3508 in use | `npm run demo -- workbench nightly --port 3600`, then open http://127.0.0.1:3600/. |
| `reset`: "The working tree has changes" | `npm run demo -- reset --force` discards them. |
| `reset`: the push to `main` is rejected | gh is signed in as an account that is not a repo admin: `gh auth switch -u tyler-maddox-gdit`. |
| Every workflow run fails at `npm ci` | `MANTA_READ_TOKEN` is missing or expired: Part 4. |
| Pushes and pull requests start no workflow run at all (a manual `gh workflow run` does) | Turn Actions off and on: repo **Settings → Actions → General → Disable actions → Save**, then **Allow all actions and reusable workflows → Save**. This fixed it on 2026-10-13. |
| Anything else | Note the exact text for #812. During a demo, each scene's **If it goes wrong** in DEMO.md is the fallback. |
