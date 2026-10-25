#!/usr/bin/env node
// The demo script: resets the story, sets up each stage of the demo and prints what to type next.
// Pure Node, so it runs the same on Windows and macOS: it spawns git and gh, never a shell.
// Usage: npm run demo -- <command>   (or: node demo/demo.mjs <command>). `help` lists the commands.
// The cue strings below are the ones DEMO.md prints; change them in both places.
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { renderFixAnswer } from './fix-answer.mjs';
import { recordedRemarks, startPreRunModel, THINKING_MS } from './pre-run-model.mjs';
import { readRun, tokensIn } from './snapshot-run.mjs';

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
/** The developer's work note after the green gate (SCRIPT.md, Act 2); the release snapshot carries the same text, imported by its nightly. */
const NOTE_TEXT = 'On the way past the upload dialog: the Last updated grey and the refresh button\'s name.';
const NOTE_LINE = 'npx manta note "' + NOTE_TEXT + '"';
/** Where `manta note` writes; never committed here, so every stage and reset removes what a rehearsal wrote. */
const WORK_NOTES = join(ROOT, '.manta', 'work-notes');
/** The pids of the servers the last stage or `workbench` started, outside the repo so no git command sees the file. */
const SERVERS_FILE = join(tmpdir(), 'manta-demo-servers.json');
const SLIDE = 'presentation/index.html';
const PREVIEW_PORT = 4173;
const PREVIEW_ORIGIN = 'http://localhost:' + PREVIEW_PORT;
const workbenchLine = (name) => 'npm run demo -- workbench ' + name + '   (opens the Workbench on it; Ctrl+C stops it)';
const CUES = {
  qa: {
    title: 'Stage · QA: the backlog in the Workbench',
    type: [],
    next: 'Open http://127.0.0.1:' + WORKBENCH_PORT + '/. The site is main, before the upload change. Launcher: paste ' + PREVIEW_ORIGIN + '/,\n  press Start. Then the Nightly run: 33 open issues (27 on the five pages, 6 on /account), its AI notes (say "pre-run"), the five "Last\n  updated" lines, a verdict, add an issue, Rescan, a checklist. Ctrl+C stops both servers.',
  },
  devops: {
    title: 'Stage · DevOps: the pull request gate',
    type: [],
    next: 'Open the live PR. Checks → MANTA gate, watch it fail on 3 new (about 90 s). Conversation: the comment, the\n  Pre-run comment (say "pre-run"), the code scanning alerts, the review. In the green Tip under MANTA\'s review, tick\n  "Apply all 3 suggested fixes": one commit, the gate runs again and goes green. Never Merge. Fallback: the golden PR.',
  },
  dev: {
    title: 'Stage · Development: the developer\'s gate',
    type: ['npm run dev                 (in a second terminal; leave it running)', GATE_LINE + '      → New 3, Gate failed, exit 1', 'npm run demo -- fix         → the AI skills\' proposals (pre-run); answer y to apply the patch', GATE_LINE + '      → New 0, Fixed 7, passed, exit 0', NOTE_LINE, '                            → a work note over the 7 the gate fixed, for the tester\'s next nightly'],
    next: 'With the claude CLI on this machine, npm run demo -- fix --live runs the skills here instead.',
  },
  release: {
    slide: 'test',
    title: 'Stage · Release: the next night',
    type: [],
    next: 'Open http://127.0.0.1:' + WORKBENCH_PORT + '/. The site is the upload change with its fixes, as merged. The nightly series,\n  its newest date: 25 open issues (was 33). Open Changes: 33 → 25 open issues · 8 closed · 1 work note, the developer\'s, on the\n  seven; the account page\'s grey closed by the scan alone. Pages → Focus order on /status?upload=BP-2026-10882,\n  a verdict on 2.4.3, attest, Export → Draft ACR: the pre-run model on this PC answers from the recording in ' + THINKING_MS / 1000 + ' s (say "pre-run").\n  Ctrl+C stops both servers.',
  },
};
const STAGE_LIST = 'Stages: npm run demo -- stage qa | dev | devops | release   (any order; each sets itself up)';

function printCue(name) {
  const cue = CUES[name];
  console.log('\n' + cue.title + '   (slide: ' + SLIDE + '#' + (cue.slide ?? name) + ')');
  if (cue.type.length) {
    console.log('  Type:');
    for (const line of cue.type) console.log('    ' + line);
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
  stopLeftoverServers();
  // Detach first, so neither story branch is the checked-out one while it is moved.
  must('git', ['checkout', '--quiet', '--detach', MAIN.tag]);
  for (const { branch, tag } of [MAIN, FEATURE]) must('git', ['branch', '--force', branch, tag]);
  // Closed before the push: a force-push to an open pull request's branch starts a gate run that posts on it later.
  for (const pr of openPrs(FEATURE.branch)) must('gh', ['pr', 'close', String(pr.number), '-R', REPO, '--comment', 'Closed by the demo reset.']);
  must('git', ['push', '--force', 'origin', MAIN.branch + ':' + MAIN.branch, FEATURE.branch + ':' + FEATURE.branch]);
  must('git', ['checkout', '--quiet', MAIN.branch]);
  // Undo what the Workbench wrote into the snapshots: attestations, added issues, verdicts, rescans.
  must('git', ['checkout', '--', 'demo-data']);
  must('git', ['clean', '-fdx', '--quiet', 'demo-data']);
  for (const dir of ['reports', 'run-records', 'ci-run']) rmSync(join(ROOT, dir), { recursive: true, force: true });
  rmSync(WORK_NOTES, { recursive: true, force: true });
  const sites = join(ROOT, 'sites');
  if (existsSync(sites)) for (const f of readdirSync(sites)) if (f !== SITE_STORE) rmSync(join(sites, f), { recursive: true, force: true });
  console.log('[DONE] Reset: main at ' + MAIN.tag + ', ' + FEATURE.branch + ' at ' + FEATURE.tag + ', no live PR, snapshots restored.');
  console.log(STAGE_LIST);
}

/**
 * Every stage's starting state, whatever ran before: tracked files as committed (the dev stage's applied patch
 * and the Workbench's writes into the snapshots discarded), no local runs, the feature branch at its tag and
 * checked out. `main` is never touched; origin is never pushed to here.
 */
function prepare() {
  stopLeftoverServers();
  must('git', ['fetch', 'origin', '--prune', '--tags', '--force', '--quiet']);
  if (!revParse('refs/tags/' + FEATURE.tag + '^{commit}')) die('Tag ' + FEATURE.tag + ' is missing. Set the story tags first (DEMO.md, Setup Tyler does once).');
  const dirty = dirtyFiles();
  if (dirty.length) console.log('Discarding ' + dirty.length + ' local change(s): ' + dirty.map((l) => l.replace(/^\s*\S+\s+/, '')).join(', '));
  must('git', ['checkout', '--quiet', '--', '.']);
  must('git', ['clean', '-fdx', '--quiet', 'demo-data']);
  for (const dir of RUN_DIRS.filter((d) => d !== 'sites').concat('ci-run')) rmSync(join(ROOT, dir), { recursive: true, force: true });
  rmSync(WORK_NOTES, { recursive: true, force: true });
  const sites = join(ROOT, 'sites');
  if (existsSync(sites)) for (const f of readdirSync(sites)) if (f !== SITE_STORE) rmSync(join(sites, f), { recursive: true, force: true });
  // Detach first: git refuses to move the checked-out branch.
  must('git', ['checkout', '--quiet', '--detach']);
  must('git', ['branch', '--force', FEATURE.branch, FEATURE.tag]);
  must('git', ['checkout', '--quiet', FEATURE.branch]);
  console.log('[DONE] On ' + FEATURE.branch + ' at ' + FEATURE.tag + ', clean.');
}

async function stage(name, flags) {
  if (!CUES[name]) die('stage takes qa, dev, devops or release.');
  prepare();
  if (name === 'devops') {
    // Closed before the push: a force-push to an open pull request's branch starts a gate run that posts on it later.
    for (const pr of openPrs(FEATURE.branch)) must('gh', ['pr', 'close', String(pr.number), '-R', REPO, '--comment', 'Closed by the demo: the next rehearsal opens a new pull request.']);
    must('git', ['push', '--force', '--quiet', 'origin', FEATURE.branch + ':' + FEATURE.branch]);
    const r = run('gh', ['pr', 'create', '-R', REPO, '--base', MAIN.branch, '--head', FEATURE.branch, '--title', 'Upload documents', '--body', 'A Documents column and an upload dialog on /status. Opened live by the demo (stage devops).'], { capture: true });
    if (!r.ok) die('gh pr create failed: ' + r.stderr);
    const golden = openPrs(GOLDEN_BRANCH)[0]?.url;
    console.log('\nLive PR:              ' + r.stdout.split('\n').pop());
    console.log('Golden PR (fallback): ' + (golden ?? 'none open: see DEMO.md, Setup Tyler does once'));
    return printCue('devops');
  }
  if (name === 'qa') {
    // The backlog: main as it is, before the upload change.
    must('git', ['checkout', '--quiet', '--detach', MAIN.tag]);
    console.log('[DONE] On ' + MAIN.tag + ' (detached): the site before the upload change.');
    return await serveStage('qa', 'nightly', flags);
  }
  if (name === 'release') {
    // The next night: the upload change with the fixes the developer applied, as it merges.
    must('git', ['apply', prPatch()]);
    console.log('[DONE] The fixes applied to ' + FEATURE.branch + ': the site as it merges.');
    return await serveStage('release', 'release', flags);
  }
  printCue('dev');
}

/** Whether a process with this pid is running. */
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

/** Records this process and its servers, so the next stage can stop them if this one is left running. */
const recordServers = (children) => writeFileSync(SERVERS_FILE, JSON.stringify([process.pid, ...children.map((c) => c.pid)]));
const forgetServers = () => rmSync(SERVERS_FILE, { force: true });

/** Stops the preview and Workbench a previous stage or `workbench` left running, by the pids it recorded, so their ports are free here. */
function stopLeftoverServers() {
  let pids;
  try { pids = JSON.parse(readFileSync(SERVERS_FILE, 'utf8')); } catch { return; }
  forgetServers();
  const live = (Array.isArray(pids) ? pids : []).filter((pid) => Number.isInteger(pid) && pid !== process.pid && alive(pid));
  if (!live.length) return;
  console.log('Stopping the servers the last stage or workbench left running (pid ' + live.join(', ') + ').');
  for (const pid of live) try { process.kill(pid); } catch { /* gone since the check */ }
}

/** Whether nothing listens on 127.0.0.1:<port>. */
const portFree = (port) => new Promise((resolve) => {
  const probe = createServer();
  probe.once('error', () => resolve(false));
  probe.listen(port, '127.0.0.1', () => probe.close(() => resolve(true)));
});

/** The QA and release stages: the preview build on 4173 and the Workbench on a snapshot, both in this process until Ctrl+C. */
async function serveStage(name, snapshotName, flags) {
  const port = flags.port ?? WORKBENCH_PORT;
  for (const [p, what] of [[PREVIEW_PORT, 'the preview'], [port, 'the Workbench']]) {
    // A server stopped just now lets go of its port a moment later.
    for (let i = 0; i < 20 && !(await portFree(p)); i++) await new Promise((r) => setTimeout(r, 250));
    if (!(await portFree(p))) die('Port ' + p + ' is in use, so ' + what + ' cannot start. Stop what holds it' + (p === port ? ', or: npm run demo -- stage ' + name + ' --port ' + (port + 100) : '') + '.');
  }
  const vite = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!existsSync(vite)) die('vite is not installed here: run npm ci first.');
  const dataDir = join(ROOT, 'demo-data', snapshotName);
  if (!existsSync(join(dataDir, 'reports'))) die('No reports/ in ' + dataDir + ': see DEMO.md, Refreshing a snapshot.');
  if (!existsSync(join(MANTA_PKG, 'ui', 'cli.ts'))) die('MANTA is not installed here: run npm ci first.');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  must(process.execPath, [vite, 'build']);
  const model = await preRunModelFor(snapshotName, dataDir);
  printCue(name);
  // Only node is spawned (npm and vite are .cmd shims on Windows, which spawn cannot run without a shell).
  const children = [
    spawn(process.execPath, [vite, 'preview', '--port', String(PREVIEW_PORT)], { cwd: ROOT, stdio: 'inherit' }),
    spawn(process.execPath, [tsx, join(MANTA_PKG, 'ui', 'cli.ts'), String(port), '--data-dir', dataDir], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...model?.env } }),
  ];
  recordServers(children);
  const stop = () => { for (const c of children) if (c.exitCode === null && !c.killed) c.kill(); model?.close(); forgetServers(); };
  process.on('SIGINT', () => { stop(); process.exit(130); });
  process.on('exit', stop);
  for (const c of children) c.on('exit', (code) => { if (code) console.error('[ERROR] A server stopped (see above); the other was stopped too. Fix it and run the stage again.'); stop(); if (code) process.exitCode = code; });
}

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(question)).trim(); } finally { rl.close(); }
}

const TTY = process.stdout.isTTY === true;
const pause = (ms) => (TTY ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());
const cols = () => process.stdout.columns ?? 110;

/** What the project is, read from its own files: the frameworks and versions, the stylesheet, whether source stamping is on. */
function stackLine() {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const major = (name) => (pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '').replace(/^[\^~]/, '').split('.')[0];
  const config = JSON.parse(readFileSync(join(ROOT, '.manta', 'config.json'), 'utf8'));
  const vite = existsSync(join(ROOT, 'vite.config.js')) ? readFileSync(join(ROOT, 'vite.config.js'), 'utf8') : '';
  return [
    major('react') && 'React ' + major('react'),
    major('react-router-dom') && 'react-router ' + major('react-router-dom'),
    major('vite') && 'Vite ' + major('vite'),
    (config.styles ?? []).length && 'plain CSS in ' + config.styles.join(', '),
    /mantaSource/.test(vite) && 'source stamps on',
  ].filter(Boolean).join(' · ');
}

/** The fix skill's patch in the pr snapshot: what `fix` applies and what the release stage builds. */
function prPatch() {
  const pr = readRun('demo-data/pr/reports');
  if (!pr) die('demo-data/pr holds no run: see DEMO.md, Refreshing a snapshot.');
  return pr.patch;
}

async function fix(flags) {
  if (out('git', ['rev-parse', '--abbrev-ref', 'HEAD']) !== FEATURE.branch) die('fix runs on ' + FEATURE.branch + ': npm run demo -- stage dev first.');
  if (flags.live) return fixLive();
  const pr = readRun('demo-data/pr/reports');
  if (!pr) die('demo-data/pr holds no run: see DEMO.md, Refreshing a snapshot.');
  for (const block of renderFixAnswer(pr, { stack: stackLine(), width: Math.min(cols(), 100), color: TTY })) {
    for (const line of block.lines) console.log(line);
    await pause(block.pause);
  }
  const patch = pr.patch;
  const list = pr.proposals.proposals ?? [];
  const files = [...new Set(list.flatMap((p) => (p.edits ?? []).map((e) => e.file)))];
  if (!run('git', ['apply', '--check', patch], { capture: true }).ok) die('The patch does not apply: already applied? npm run demo -- stage dev starts over.');
  if (!/^y(es)?$/i.test(await ask('\nApply ' + (list.length === 1 ? 'this fix' : 'these ' + list.length + ' fixes') + '? [y/N] '))) {
    console.log('Nothing applied. The patch is at ' + patch + '\n');
    return;
  }
  must('git', ['apply', patch]);
  console.log('Applied to ' + (files.length > 1 ? files.slice(0, -1).join(', ') + ' and ' + files[files.length - 1] : files[0]) + '. Nothing committed.');
  must('git', ['--no-pager', 'diff', '--stat']);
  console.log('\nRun the gate again: ' + GATE_LINE + '\n');
}

function fixLive() {
  const reports = join(ROOT, 'reports');
  if (tokensIn(reports).length === 0) die('No run in reports/: run the gate first (' + GATE_LINE + ').');
  if (!run('claude', ['--version'], { capture: true }).ok) die('--live needs the claude CLI (MANTA\'s claude-code provider).');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  must(process.execPath, [tsx, join(MANTA_PKG, 'ai', 'cli.ts'), '--skills', 'cluster,fix', '--scope', 'new', '--provider', 'claude-code']);
  const patch = 'reports/fix-' + tokensIn(reports).pop() + '.patch';
  if (!existsSync(join(ROOT, patch))) die('The fix skill wrote no patch (' + patch + '): see its lines above.');
  must('git', ['apply', patch]);
  must('git', ['--no-pager', 'diff', '--stat']);
  console.log('\nRun the gate again: ' + GATE_LINE + '\n');
}

function snapshot(name, runId, flags) {
  if (!name || !/^[a-z0-9-]+$/.test(name)) die('snapshot takes a name: pr, nightly or release (lowercase letters, digits and hyphens).');
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
async function workbench(name = 'nightly', flags) {
  const dataDir = name === 'ci-run' ? join(ROOT, 'ci-run') : join(ROOT, 'demo-data', name);
  if (!existsSync(join(dataDir, 'reports'))) die('No reports/ in ' + dataDir + ': name a snapshot (nightly, release or pr) or ci-run.');
  if (!existsSync(join(MANTA_PKG, 'ui', 'cli.ts'))) die('MANTA is not installed here: run npm ci first.');
  const tsx = createRequire(join(MANTA_PKG, 'package.json')).resolve('tsx/cli');
  stopLeftoverServers();
  const model = await preRunModelFor(name, dataDir);
  console.log('Workbench on ' + dataDir + '. Open the URL below, then the run\'s report. Ctrl+C stops it.');
  const child = spawn(process.execPath, [tsx, join(MANTA_PKG, 'ui', 'cli.ts'), String(flags.port ?? WORKBENCH_PORT), '--data-dir', dataDir], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...model?.env } });
  recordServers([child]);
  const stop = () => { if (child.exitCode === null && !child.killed) child.kill(); model?.close(); forgetServers(); };
  process.on('SIGINT', () => { stop(); process.exit(130); });
  process.on('exit', stop);
  child.on('exit', (code) => { stop(); process.exitCode = code ?? 0; });
}

/**
 * The release snapshot's ACR, drafted on stage with no model on the PC. The committed draft is taken out of the
 * snapshot's newest run (its artifact and document, and the pass's acr entry in the run record), so the Export dialog
 * offers "Draft ACR"; the pre-run model is started holding the remarks that draft recorded, and the Workbench is
 * pointed at it, so the draft it makes is the same document (demo/pre-run-model.mjs). Any other snapshot: nothing,
 * and the dialog finds no provider. prepare() and reset put the committed draft back.
 */
async function preRunModelFor(snapshotName, dataDir) {
  if (snapshotName !== 'release') return undefined;
  const reports = join(dataDir, 'reports');
  const token = tokensIn(reports).at(-1);
  const acrPath = 'demo-data/' + snapshotName + '/reports/acr-' + token + '.json';
  // The recording is the committed draft: on disk it may already be gone, or be a draft this model answered.
  const acr = out('git', ['show', 'HEAD:' + acrPath]);
  if (!acr) die('No committed ' + acrPath + ': the release snapshot has no ACR to record (DEMO.md, Refreshing what was done).');
  for (const ext of ['json', 'docx']) rmSync(join(reports, 'acr-' + token + '.' + ext), { force: true });
  const records = join(dataDir, 'run-records');
  for (const f of readdirSync(records)) {
    const file = join(records, f);
    const record = JSON.parse(readFileSync(file, 'utf8'));
    if (record.token !== token) continue;
    for (const pass of record.passes ?? []) {
      pass.skills = pass.skills.filter((s) => s.id !== 'acr');
      pass.ai.skills = pass.ai.skills.filter((s) => s !== 'acr');
    }
    writeFileSync(file, JSON.stringify(record, null, 2));
  }
  const model = await startPreRunModel(recordedRemarks(JSON.parse(acr)));
  console.log('[DONE] The ACR taken out of the ' + snapshotName + ' snapshot; the pre-run model holds its remarks at ' + model.origin + ' (Export → Draft ACR, provider Anthropic API).');
  return model;
}

/** Whether the Chromium MANTA scans with is installed: MANTA's own Playwright launches it headless, as a scan does, and closes it. */
function chromiumInstalled() {
  try {
    const playwright = createRequire(join(MANTA_PKG, 'package.json')).resolve('playwright');
    const probe = 'require(' + JSON.stringify(playwright) + ').chromium.launch().then((b) => b.close()).then(() => process.exit(0), () => process.exit(1))';
    return spawnSync(process.execPath, ['-e', probe], { stdio: 'ignore', timeout: 60_000 }).status === 0;
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
    // A fresh clone has no local feature branch yet: the first stage's checkout makes it from origin's.
    else if (!local && remote === t) say(true, branch + ' on origin at ' + tag + ' (made locally by its first checkout)');
    else say(local === t && remote === t, branch + (local === t ? ' at ' : ' NOT at ') + tag + (remote === t ? ', origin too' : ', origin differs: run stage devops or reset'));
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
  for (const name of ['pr', 'nightly', 'release']) {
    const tokens = tokensIn(join(ROOT, 'demo-data', name, 'reports'));
    say(tokens.length > 0, 'demo-data/' + name + ': ' + (tokens.join(', ') || 'empty'));
  }
  console.log('Tools');
  const major = Number(process.versions.node.split('.')[0]);
  say(major >= 20, 'node ' + process.version + (major >= 20 ? '' : ' (20 or later needed)'));
  const installed = existsSync(join(MANTA_PKG, 'package.json'));
  say(installed, installed ? 'MANTA ' + JSON.parse(readFileSync(join(MANTA_PKG, 'package.json'), 'utf8')).version + ' installed' : 'MANTA not installed: run npm ci');
  const chromium = installed && chromiumInstalled();
  say(chromium, 'Chromium for scanning' + (chromium ? '' : ': run npm run install-browser-gdit'));
  const login = out('gh', ['api', 'user', '--jq', '.login']);
  const admin = login && out('gh', ['api', 'repos/' + REPO, '--jq', '.permissions.admin']) === 'true';
  say(Boolean(admin), login ? 'gh signed in as ' + login + (admin ? ', a repo admin' : ', not a repo admin: reset cannot force-push main. gh auth switch -u tyler-maddox-gdit') : 'gh is not signed in: gh auth login');
  console.log(ok ? '\nReady.' : '\nNot ready: fix the lines marked FIX.');
  process.exitCode = ok ? 0 : 1;
}

function help() {
  console.log(`MANTA demo — npm run demo -- <command>

  reset [--force]          Back to the start: story branches to their tags (force-pushed), live PRs closed,
                           snapshots restored, local runs removed. --force discards local changes.
  stage <name>             Set a stage up, whatever ran before, and print what to type next: qa, dev, devops,
         [--port n]        release. qa runs main's preview build and the Workbench on the nightly snapshot until
                           Ctrl+C; dev leaves the feature branch checked out, clean; devops opens the live PR;
                           release runs the feature branch with the fixes and the Workbench on the release snapshot.
  fix [--live]             The AI skills over the developer's run: pre-run from demo-data/pr, printed and
                           its patch applied. --live runs cluster and fix here through the claude CLI.
  snapshot <name> [run]    Copy a run into demo-data/<name>/: a workflow run's artifact when [run] is given
         [--artifact a]    (manta-run by default, or manta-nightly), else this folder's reports/, run-records/, sites/.
  ci-run [run]             Download a workflow run's artifact into ci-run/ (the latest nightly by default)
         [--artifact a]    and print the command that opens it in the Workbench.
  workbench [name]         The Workbench on demo-data/<name> (nightly by default, release or pr), or on ci-run.
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
  else if (argv[i] === '--live') flags.live = true;
  else if (argv[i] === '--artifact') flags.artifact = argv[++i];
  else if (argv[i] === '--port') flags.port = Number(argv[++i]);
  else if (argv[i].startsWith('--')) die('Unknown flag ' + argv[i] + '. Try: npm run demo -- help');
  else words.push(argv[i]);
}
const [command, a, b] = words;
switch (command) {
  case 'reset': reset(flags); break;
  case 'stage': await stage(a, flags); break;
  case 'fix': await fix(flags); break;
  case 'snapshot': snapshot(a, b, flags); break;
  case 'ci-run': ciRun(a, flags); break;
  case 'workbench': await workbench(a, flags); break;
  case 'status': status(); break;
  case 'setup-github': await import('./setup-github.mjs'); break;
  case 'help': case undefined: help(); break;
  default: die('Unknown command ' + command + '. Try: npm run demo -- help');
}
