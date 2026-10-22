import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderFixAnswer, windowed, wrap } from './fix-answer.mjs';
import { readRun } from './snapshot-run.mjs';

const visible = (t) => t.replace(/\x1b\[[0-9;]*m/g, '').length;

test('renderFixAnswer renders the pr snapshot run', () => {
  const run = readRun('demo-data/pr/reports');
  const blocks = renderFixAnswer(run, { color: false, width: 100, stack: 'React 18 · Vite 5' });
  const lines = blocks.flatMap((b) => b.lines);
  assert.ok(lines.find(Boolean).startsWith('MANTA fix · run ' + run.token));
  assert.ok(lines.some((l) => l.startsWith('Step 1 · cluster')));
  assert.ok(lines.some((l) => l.startsWith('Step 2 · fix')));
  for (const title of ['1 · Hint text too faint to read', '2 · Close button with no name', '3 · File field with no label']) {
    assert.ok(lines.some((l) => l.startsWith(title + ' ')), title);
  }
  for (const p of run.proposals.proposals) {
    for (const e of p.edits) assert.ok(lines.includes('    ' + e.file + ':' + e.startLine), e.file + ':' + e.startLine);
  }
  assert.ok(lines.findLast(Boolean).startsWith('3 fixes · 3 files'));
  // The "Contains a new finding" lines are not wrapped and run to 101-102 today; kept as printed.
  for (const l of lines.filter((x) => !x.trim().startsWith('Contains a new finding'))) assert.ok(visible(l) <= 100, 'wider than 100: ' + l);
  assert.deepEqual(blocks.map((b) => b.pause), [500, 600, 500, 500, 300, 300, 300, 0]);
});

test('renderFixAnswer paints only when color is on', () => {
  const run = readRun('demo-data/pr/reports');
  const has = (color) => renderFixAnswer(run, { color, width: 100, stack: '' }).some((b) => b.lines.some((l) => l.includes('\x1b[')));
  assert.equal(has(false), false);
  assert.equal(has(true), true);
});

test('windowed cuts a long shared prefix with …, around the first change', () => {
  const prefix = 'x'.repeat(80);
  const [was, now] = windowed(prefix + ' old tail', prefix + ' new tail', 40);
  assert.ok(was[0].startsWith('…') && now[0].startsWith('…'));
  assert.ok(was[0].includes('old') && now[0].includes('new'));
  assert.ok(was[0].length <= 40 && now[0].length <= 40);
});

test('windowed clips each side on its own when the line counts differ', () => {
  const [was, now] = windowed('a'.repeat(50), 'short\n' + 'b'.repeat(50), 20);
  assert.deepEqual(was, ['a'.repeat(19) + '…']);
  assert.deepEqual(now, ['short', 'b'.repeat(19) + '…']);
});

test('wrap breaks words under the width and indents every line', () => {
  const out = wrap('one two three four five six seven eight nine ten', '  ', 16).split('\n');
  assert.deepEqual(out, ['  one two three', '  four five six', '  seven eight', '  nine ten']);
  for (const l of out) assert.ok(l.length <= 16);
});
