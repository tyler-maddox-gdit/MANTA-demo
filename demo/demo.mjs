#!/usr/bin/env node
// The demo script: resets the story, sets up each scene and prints what to type next.
// Pure Node, so it runs the same on Windows and macOS: it spawns git and gh, never a shell.
// Usage: npm run demo -- <command>   (or: node demo/demo.mjs <command>). `help` lists the commands.
// The cue strings below are the ones DEMO.md prints; change them in both places.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Constants ───────────────────────────────────────────────────────────────
const REPO = 'tyler-maddox-gdit/MANTA-demo';
const MAIN = { branch: 'main', tag: 'story/main' };
const FEATURE = { branch: 'feature/upload-documents', tag: 'story/feature' };
const GOLDEN_BRANCH = 'golden/upload-documents';
const NIGHTLY_WORKFLOW = 'nightly.yml';
const GATE_WORKFLOW = 'gate.yml';
const SIGN_IN_PATH = '5d1e7a42'; // the "Sign in" path in sites/http_localhost_4173.json
const SITE_STORE = 'http_localhost_4173.json'; // the one committed file under sites/
const ARTIFACTS = { 'manta-run': GATE_WORKFLOW, 'manta-nightly': NIGHTLY_WORKFLOW };
const RUN_DIRS = ['reports', 'run-records', 'sites']; // what a --data-dir holds
const DEV_ORIGIN = 'http://localhost:5173';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// MANTA as npm ci installed it: the Workbench (MANTA's reviewer GUI) runs from here, so no MANTA checkout is needed.
const MANTA_PKG = join(ROOT, 'node_modules', '@usps', '508-toolkit');
const WORKBENCH_PORT = 3508;

// ── The cues (DEMO.md says the same) ───────────────────────────────────────
const GATE_LINE = 'npx manta gate --base ' + DEV_ORIGIN;
const workbenchLine = (name) => 'npm run demo -- workbench ' + name + '   (opens the Workbench on it; Ctrl+C stops it)';
const CUES = {
  1: { title: 'Scene 1 · Conception (1 min)', type: [], next: 'Show the slide: a criterion row\'s checklist in the Workbench. Then: npm run demo -- scene 2' },
  2: { title: 'Scene 2 · The developer scans localhost (4 min)', type: ['npm run dev        (in a second terminal; leave it running)', GATE_LINE], next: 'Expect New 3 on /status?upload=BP-2026-10882 and "Gate failed", exit 1. Then: npm run demo -- scene 3' },
  3: { title: 'Scene 3 · The developer applies an AI fix (3 min)', type: ['git apply <patch>', GATE_LINE], next: 'Say: "This patch was pre-run from a snapshot of this branch." Expect New 0. Then: git checkout .   and   npm run demo -- scene 4' },
  4: { title: 'Scene 4 · The pull request (6 min)', type: [], next: 'Show the live PR (red check, the comment), then switch to the golden PR (pre-run). Then: npm run demo -- scene 5' },
  5: { title: 'Scene 5 · Nightly through login (3 min)', type: ['gh run watch <run> -R ' + REPO], next: 'Expect the Sign in path replayed, ending on /account. Then: npm run demo -- scene 6' },
  6: { title: 'Scene 6 · QA in the Workbench (5 min)', type: ['npm run build', 'npm run preview    (in this repo, a second terminal; Rescan reloads pages from localhost:4173)', workbenchLine('nightly')], next: 'Open the URL it prints, then the Nightly run\'s report. Then: npm run demo -- scene 7' },
  7: { title: 'Scene 7 · Release (2 min)', type: [], next: 'In the same Workbench, press Export on the Nightly run: the ACR draft (docx) and the USPS defects. The end.' },
};

function printCue(n, fill = {}) {
  const cue = CUES[n];
  console.log('\n' + cue.title);
  if (cue.type.length) {
    console.log('  Type:');
    for (const line of cue.type) console.log('    ' + line.replace(/<(\w+)>/g, (m, k) => fill[k] ?? m));
  }
  console.log('  ' + cue.next + '\n');
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function die(message) {
  console.error('[ERROR] ' + message);
  process.exit(1);
}

/** Runs a command in the repo root with no shell: its output to the terminal, or captured when `capture`. */
function run(cmd, args, { capture = false } = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, shell: false, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
  if (r.error?.code === 'ENOENT') die(cmd + ' is not installed, or not on PATH.');
  return { ok: r.status === 0, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() };
}

/** Runs a command and stops the script when it fails. */
function must(cmd, args) {
  if (!run(cmd, args).ok) die(cmd + ' ' + args.join(' ') + ' failed.');
}

/** A command's output, or undefined when it failed. */
function out(cmd, args) {
  const r = run(cmd, args, { capture: true });
  return r.ok ? r.stdout : undefined;
}

const revParse = (ref) => out('git', ['rev-parse', '--verify', '--quiet', ref]);
const dirtyFiles = () => (out('git', ['status', '--porcelain']) ?? '').split('\n').filter(Boolean);
const ghJson = (args) => {
  const text = out('gh', [...args, '-R', REPO]);
  return text ? JSON.parse(text) : undefined;
};
const openPrs = (head) => ghJson(['pr', 'list', '--head', head, '--state', 'open', '--json', 'number,url']) ?? [];

function requireClean(hint) {
  const dirty = dirtyFiles();
  if (dirty.length) die('The working tree has changes (' + dirty.length + ' files). ' + hint);
}

/** The run tokens a reports directory holds: one per agent-analysis file. */
function tokensIn(reportsDir) {
  if (!existsSync(reportsDir)) return [];
  return readdirSync(reportsDir)
    .map((f) => /^agent-analysis-(.+)\.json$/.exec(f)?.[1])
    .filter(Boolean)
    .sort();
}

function latestRun(workflow) {
  const runs = ghJson(['run', 'list', '--workflow', workflow, '--limit', '1', '--json', 'databaseId,status,conclusion,createdAt']);
  return runs?.[0];
}

function artifactOf(flags, fallback) {
  const name = flags.artifact ?? fallback;
  if (!(name in ARTIFACTS)) die('--artifact is one of ' + Object.keys(ARTIFACTS).join(', ') + '.');
  return name;
}

// ── Commands ────────────────────────────────────────────────────────────────
function reset(flags) {
  const dirty = dirtyFiles();
  if (dirty.length && !flags.force) die('The working tree has changes (' + dirty.length + ' files). Commit or discard them, or run reset --force to discard them.');
  must('git', ['fetch', 'origin', '--prune', '--tags', '--force']);
  for (const { tag } of [MAIN, FEATURE]) if (!revParse('refs/tags/' + tag + '^{commit}')) die('Tag ' + tag + ' is missing. Set the story tags first (DEMO.md, Setup Tyler does once).');
  if (dirty.length) {
    must('git', ['reset', '--hard', '--quiet']);
    must('git', ['clean', '-fd', '--quiet']);
  }
  // Detach first, so neither story branch is the checked-out one while it is moved.
  must('git', ['checkout', '--quiet', '--detach', MAIN.tag]);
  for (const { branch, tag } of [MAIN, FEATURE]) must('git', ['branch', '--force', branch, tag]);
  must('git', ['push', '--force', 'origin', MAIN.branch + ':' + MAIN.branch, FEATURE.branch + ':' + FEATURE.branch]);
  for (const pr of openPrs(FEATURE.branch)) must('gh', ['pr', 'close', String(pr.number), '-R', REPO, '--comment', 'Closed by the demo reset.']);
  must('git', ['checkout', '--quiet', MAIN.branch]);
  // Undo what the Workbench wrote into the snapshots: attestations, added issues, verdicts, rescans.
  must('git', ['checkout', '--', 'demo-data']);
  must('git', ['clean', '-fdx', '--quiet', 'demo-data']);
  for (const dir of ['reports', 'run-records', 'ci-run']) rmSync(join(ROOT, dir), { recursive: true, force: true });
  const sites = join(ROOT, 'sites');
  if (existsSync(sites)) for (const f of readdirSync(sites)) if (f !== SITE_STORE) rmSync(join(sites, f), { recursive: true, force: true });
  console.log('[DONE] Reset: main at ' + MAIN.tag + ', ' + FEATURE.branch + ' at ' + FEATURE.tag + ', no live PR, snapshots restored.');
  printCue(1);
}

function scene(n) {
  if (!CUES[n]) die('scene takes a number from 1 to 7.');
  if (n === 2) {
    requireClean('Run npm run demo -- reset first.');
    must('git', ['checkout', '--quiet', FEATURE.branch]);
    console.log('[DONE] On ' + FEATURE.branch + '.');
  }
  if (n === 3) {
    const reportsDir = join(ROOT, 'demo-data', 'pr', 'reports');
    const patch = existsSync(reportsDir) ? readdirSync(reportsDir).find((f) => /^fix-.+\.patch$/.test(f)) : undefined;
    if (!patch) console.log('[WARN] No fix-<token>.patch in demo-data/pr/reports: make the pr snapshot first (DEMO.md, Refreshing a snapshot).');
    return printCue(3, { patch: patch ? 'demo-data/pr/reports/' + patch : undefined });
  }
  if (n === 4) {
    requireClean('Type git checkout . first: the fix from scene 3 is still applied.');
    must('git', ['push', 'origin', FEATURE.branch + ':' + FEATURE.branch]);
    let live = openPrs(FEATURE.branch)[0]?.url;
    if (!live) {
      const r = run('gh', ['pr', 'create', '-R', REPO, '--base', MAIN.branch, '--head', FEATURE.branch, '--title', 'Upload documents', '--body', 'A Documents column and an upload dialog on /status. Opened live by the demo, scene 4.'], { capture: true });
      if (!r.ok) die('gh pr create failed: ' + r.stderr);
      live = r.stdout.split('\n').pop();
    }
    const golden = openPrs(GOLDEN_BRANCH)[0]?.url;
    // The nightly starts now so it has finished by scene 5.
    must('gh', ['workflow', 'run', NIGHTLY_WORKFLOW, '-R', REPO, '--ref', MAIN.branch]);
    console.log('\nLive PR:              ' + live);
    console.log('Golden PR (pre-run):  ' + (golden ?? 'none open: see DEMO.md, Setup Tyler does once'));
    console.log('Nightly started:      watched in scene 5.');
  }
  if (n === 5) {
    const latest = latestRun(NIGHTLY_WORKFLOW);
    if (!latest) console.log('[WARN] No nightly run found. Start one: gh workflow run ' + NIGHTLY_WORKFLOW + ' -R ' + REPO);
    else console.log('Latest nightly: run ' + latest.databaseId + ', ' + latest.status + (latest.conclusion ? ' (' + latest.conclusion + ')' : '') + ', started ' + latest.createdAt + '.');
    return printCue(5, { run: latest ? String(latest.databaseId) : undefined });
  }
  printCue(n);
}

function snapshot(name, runId, flags) {
  if (!name || !/^[a-z0-9-]+$/.test(name)) die('snapshot takes a name: pr or nightly (lowercase letters, digits and hyphens).');
  const dest = join(ROOT, 'demo-data', name);
  let src = ROOT;
  let tmp;
  if (runId) {
    const artifact = artifactOf(flags, 'manta-run');
    tmp = mkdtempSync(join(tmpdir(), 'manta-snapshot-'));
    must('gh', ['run', 'download', runId, '-R', REPO, '-n', artifact, '-D', tmp]);
    src = tmp;
  }
  if (!existsSync(join(src, 'reports'))) die('No reports/ in ' + src + ': nothing to snapshot.');
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const dir of RUN_DIRS) if (existsSync(join(src, dir))) cpSync(join(src, dir), join(dest, dir), { recursive: true });
  if (tmp) rmSync(tmp, { recursive: true, force: true });
  const tokens = tokensIn(join(dest, 'reports'));
  console.log('[DONE] demo-data/' + name + ' holds ' + tokens.length + ' run(s): ' + (tokens.join(', ') || 'none'));
  console.log('Commit it: git add demo-data/' + name + ' && git commit -m "Refresh the ' + name + ' snapshot"');
}

function ciRun(runId, flags) {
  const artifact = artifactOf(flags, 'manta-nightly');
  if (!runId) {
    const latest = latestRun(ARTIFACTS[artifact]);
    if (!latest) die('No ' + ARTIFACTS[artifact] + ' run found to download.');
    runId = String(latest.databaseId);
  }
  const dest = join(ROOT, 'ci-run');
  rmSync(dest, { recursive: true, force: true });
  must('gh', ['run', 'download', runId, '-R', REPO, '-n', artifact, '-D', dest]);
  const tokens = tokensIn(join(dest, 'reports'));
  console.log('[DONE] ci-run/ holds run ' + runId + "'s " + artifact + ': ' + (tokens.join(', ') || 'no run'));
  console.log('Open it in the Workbench: ' + workbenchLine('ci-run'));
}

/** The Workbench on one snapshot (demo-data/<name>) or on ci-run/, from the MANTA package npm ci installed. */
function workbench(name = 'nightly', flags) {
  const dataDir = name === 'ci-run' ? join(ROOT, 'ci-run') : join(ROOT, 'demo-data', name);
  if (!existsSync(join(dataDir, 'reports'))) die('No reports/ in ' + dataDir + ': name a snapshot (nightly or pr) or ci-run.');
  if (!existsSync(join(MANTA_PKG, 'ui', 'cli.ts'))) die('MANTA is not installed here: run npm ci first.');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  console.log('Workbench on ' + dataDir + '. Open the URL below, then the run\'s report. Ctrl+C stops it.');
  const r = spawnSync(process.execPath, [tsx, join(MANTA_PKG, 'ui', 'cli.ts'), String(flags.port ?? WORKBENCH_PORT), '--data-dir', dataDir], { cwd: ROOT, stdio: 'inherit', shell: false });
  process.exitCode = r.status ?? 0;
}

/** Whether the Chromium MANTA scans with is installed, asked of MANTA's own Playwright. */
function chromiumInstalled() {
  try {
    return existsSync(createRequire(join(MANTA_PKG, 'package.json'))('playwright').chromium.executablePath());
  } catch {
    return false;
  }
}

function status() {
  let ok = true;
  const say = (good, text) => {
    if (!good) ok = false;
    console.log((good ? '  ok    ' : '  FIX   ') + text);
  };
  if (!run('git', ['fetch', 'origin', '--prune', '--tags', '--force', '--quiet'], { capture: true }).ok) say(false, 'git fetch origin failed: the checks below read what this clone last fetched');
  console.log('Story branches');
  for (const { branch, tag } of [MAIN, FEATURE]) {
    const t = revParse('refs/tags/' + tag + '^{commit}');
    const local = revParse('refs/heads/' + branch);
    const remote = revParse('refs/remotes/origin/' + branch);
    if (!t) say(false, tag + ' is missing (set once, after the first baseline run)');
    else say(local === t && remote === t, branch + (local === t ? ' at ' : ' NOT at ') + tag + (remote === t ? ', origin too' : ', origin differs: run reset'));
  }
  say(Boolean(revParse('refs/remotes/origin/' + GOLDEN_BRANCH)), GOLDEN_BRANCH + ' on origin');
  console.log('Pull requests');
  const live = openPrs(FEATURE.branch);
  say(live.length === 0, live.length ? live.length + ' open live PR(s) from ' + FEATURE.branch + ': run reset' : 'no open live PR from ' + FEATURE.branch);
  const golden = openPrs(GOLDEN_BRANCH);
  say(golden.length > 0, golden.length ? 'golden PR open: ' + golden[0].url : 'no golden PR open');
  console.log('Working tree');
  const dirty = dirtyFiles();
  say(dirty.length === 0, dirty.length ? dirty.length + ' changed files:\n' + dirty.map((f) => '          ' + f).join('\n') : 'clean');
  console.log('Snapshots');
  for (const name of ['pr', 'nightly']) {
    const tokens = tokensIn(join(ROOT, 'demo-data', name, 'reports'));
    say(tokens.length > 0, 'demo-data/' + name + ': ' + (tokens.join(', ') || 'empty'));
  }
  console.log('Tools');
  const major = Number(process.versions.node.split('.')[0]);
  say(major >= 20, 'node ' + process.version + (major >= 20 ? '' : ' (20 or later needed)'));
  const installed = existsSync(join(MANTA_PKG, 'package.json'));
  say(installed, installed ? 'MANTA ' + JSON.parse(readFileSync(join(MANTA_PKG, 'package.json'), 'utf8')).version + ' installed' : 'MANTA not installed: run npm ci');
  say(installed && chromiumInstalled(), 'Chromium for scanning' + (installed && chromiumInstalled() ? '' : ': run npx playwright install chromium'));
  const login = out('gh', ['api', 'user', '--jq', '.login']);
  const admin = login && out('gh', ['api', 'repos/' + REPO, '--jq', '.permissions.admin']) === 'true';
  say(Boolean(admin), login ? 'gh signed in as ' + login + (admin ? ', a repo admin' : ', not a repo admin: reset cannot force-push main. gh auth switch -u tyler-maddox-gdit') : 'gh is not signed in: gh auth login');
  console.log(ok ? '\nReady.' : '\nNot ready: fix the lines marked FIX.');
  process.exitCode = ok ? 0 : 1;
}

function help() {
  console.log(`MANTA demo — npm run demo -- <command>

  reset [--force]          Back to scene 1: story branches to their tags (force-pushed), live PRs closed,
                           snapshots restored, local runs removed. --force discards local changes.
  scene <1-7>              Set up a scene and print what to type next.
  snapshot <name> [run]    Copy a run into demo-data/<name>/: a workflow run's artifact when [run] is given
         [--artifact a]    (manta-run by default, or manta-nightly), else this folder's reports/, run-records/, sites/.
  ci-run [run]             Download a workflow run's artifact into ci-run/ (the latest nightly by default)
         [--artifact a]    and print the command that opens it in the Workbench.
  workbench [name]         The Workbench on demo-data/<name> (nightly by default, or pr), or on ci-run.
         [--port n]        Port 3508 unless given.
  status                   The day-of check: branches against tags, open PRs, changes, snapshots, tools, gh.
  setup-github             The one-time GitHub setup: secrets, deploy key, ruleset (needs a repo admin).
  help                     This list.

Repo ${REPO} · sign-in path ${SIGN_IN_PATH} · Workbench port ${WORKBENCH_PORT}`);
}

// ── Arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--force') flags.force = true;
  else if (argv[i] === '--artifact') flags.artifact = argv[++i];
  else if (argv[i] === '--port') flags.port = Number(argv[++i]);
  else if (argv[i].startsWith('--')) die('Unknown flag ' + argv[i] + '. Try: npm run demo -- help');
  else words.push(argv[i]);
}
const [command, a, b] = words;
switch (command) {
  case 'reset': reset(flags); break;
  case 'scene': scene(Number(a)); break;
  case 'snapshot': snapshot(a, b, flags); break;
  case 'ci-run': ciRun(a, flags); break;
  case 'workbench': workbench(a, flags); break;
  case 'status': status(); break;
  case 'setup-github': await import('./setup-github.mjs'); break;
  case 'help': case undefined: help(); break;
  default: die('Unknown command ' + command + '. Try: npm run demo -- help');
}
