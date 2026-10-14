// The demo's one-click apply of MANTA's suggestions: one commit, so the gate runs once.
//   offer        Run by gate.yml after MANTA posts: when its review holds suggestions on the pull request's
//                head commit, add one comment under it: a callout and a checkbox that applies them all.
//   apply <dir>  Run by apply-fixes.yml once that box is ticked: write every suggestion into the checkout in
//                <dir> (the pull request's branch), commit it as the person who ticked, and push.
// Pure Node; reads and writes GitHub through fetch with GITHUB_TOKEN. It runs no code from the pull request:
// it only replaces the lines each suggestion names.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;
const PR = process.env.PR;
const BOT = 'github-actions[bot]';
const GOLDEN = 'golden/upload-documents'; // its review is pre-run and kept as it is
const marker = (sha) => '<!-- manta-apply-all ' + sha + ' -->';

async function api(path, init = {}) {
  const r = await fetch('https://api.github.com/repos/' + REPO + path, {
    ...init,
    headers: { authorization: 'Bearer ' + TOKEN, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28', ...(init.body ? { 'content-type': 'application/json' } : {}) },
  });
  if (!r.ok) throw new Error(init.method + ' ' + path + ': GitHub answered ' + r.status + ' ' + (await r.text()));
  return r.status === 204 ? null : r.json();
}

/** MANTA's suggestions made on `sha`: each a file, its first and last line there (the original_ fields, which
 *  never go stale), and the lines to put in their place. */
async function suggestionsOn(sha) {
  const comments = await api('/pulls/' + PR + '/comments?per_page=100');
  const found = [];
  for (const c of comments) {
    if (c.user?.login !== BOT || c.original_commit_id !== sha || c.side !== 'RIGHT') continue;
    // MANTA's fence is three backticks or more, longer than any run inside it.
    const m = /^(`{3,})suggestion\n([\s\S]*?)^\1$/m.exec(c.body);
    if (!m) continue;
    const text = m[2].replace(/\n$/, '');
    found.push({ path: c.path, start: c.original_start_line ?? c.original_line, end: c.original_line, lines: m[2] === '' ? [] : text.split('\n'), rule: /^\*\*([^*]+)\*\*/.exec(c.body)?.[1] });
  }
  return found;
}

const offerBody = (n, sha) =>
  '> [!TIP]\n> **One click applies all ' + n + ' of MANTA\'s suggested fixes.** Tick the box below: they go into one commit, made in your name, and the gate runs once on it.\n\n' +
  '- [ ] **Apply all ' + n + ' suggested fixes**\n\n' + marker(sha);

async function offer() {
  const sha = process.env.HEAD_SHA;
  const suggestions = await suggestionsOn(sha);
  if (!suggestions.length) return console.log('No suggestions from MANTA on ' + sha + ': nothing to offer.');
  const issueComments = await api('/issues/' + PR + '/comments?per_page=100');
  if (issueComments.some((c) => c.body.includes(marker(sha)))) return console.log('Already offered for ' + sha + '.');
  // A comment, not an edit to MANTA's review: ticking a box in a review starts no workflow, a comment's does.
  await api('/issues/' + PR + '/comments', { method: 'POST', body: JSON.stringify({ body: offerBody(suggestions.length, sha) }) });
  console.log('Offered to apply ' + suggestions.length + ' suggestions on ' + sha + '.');
}

async function apply(dir) {
  const commentId = process.env.COMMENT_ID;
  const comment = await api('/issues/comments/' + commentId);
  const offered = /<!-- manta-apply-all ([0-9a-f]{40}) -->/.exec(comment.body)?.[1];
  const pr = await api('/pulls/' + PR);
  // The offer becomes a note saying what happened.
  const say = (text) => api('/issues/comments/' + commentId, { method: 'PATCH', body: JSON.stringify({ body: '> [!NOTE]\n> ' + text + '\n\n' + (offered ? marker(offered) : '') }) });
  if (pr.head.ref === GOLDEN) return say("The golden pull request's fixes are pre-run and kept as they are: nothing applied.");
  if (!offered || pr.head.sha !== offered) return say('The branch has moved since these fixes were offered: nothing applied.');
  const suggestions = await suggestionsOn(offered);
  if (!suggestions.length) return say("MANTA's suggestions are gone from this pull request: nothing applied.");
  // Bottom to top within each file, so an earlier replacement never shifts a later one's lines.
  const byFile = Map.groupBy(suggestions, (s) => s.path);
  for (const [path, list] of byFile) {
    const file = join(dir, path);
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const s of list.sort((a, b) => b.start - a.start)) lines.splice(s.start - 1, s.end - s.start + 1, ...s.lines);
    writeFileSync(file, lines.join('\n'));
  }
  const sender = process.env.SENDER;
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'inherit' });
  git('config', 'user.name', sender);
  git('config', 'user.email', process.env.SENDER_ID + '+' + sender + '@users.noreply.github.com');
  const rules = [...new Set(suggestions.map((s) => s.rule).filter(Boolean))].join(', ');
  git('commit', '-am', "Apply MANTA's suggested fixes" + (rules ? ' (' + rules + ')' : ''));
  git('push', 'origin', 'HEAD:' + pr.head.ref);
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  await say('**Applied all ' + suggestions.length + " of MANTA's suggested fixes** in " + commit + ', ticked by @' + sender + '. The gate runs once on it.');
  console.log('Applied ' + suggestions.length + ' suggestions in ' + commit + '.');
}

const [mode, dir] = process.argv.slice(2);
if (mode === 'offer') await offer();
else if (mode === 'apply') await apply(dir);
else throw new Error('apply-fixes.mjs takes offer, or apply <dir>.');
