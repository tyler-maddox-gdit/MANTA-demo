import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { readRun, tokensIn } from './snapshot-run.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('readRun reads the pr snapshot: token, patch on disk, gate, proposals and clusters', () => {
  const run = readRun('demo-data/pr/reports');
  assert.match(run.token, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(run.patch, 'demo-data/pr/reports/fix-' + run.token + '.patch');
  assert.ok(existsSync(join(ROOT, run.patch)));
  assert.ok(Array.isArray(run.gate.new));
  assert.ok(Array.isArray(run.proposals.proposals));
  assert.ok(Array.isArray(run.clusters.clusters));
});

test('readRun leaves a file the run lacks undefined: the nightly snapshot has no gate', () => {
  const run = readRun('demo-data/nightly/reports');
  assert.ok(run.token);
  assert.equal(run.gate, undefined);
});

test('readRun is undefined and tokensIn empty for a directory with no run', () => {
  assert.equal(readRun('demo-data/no-such-snapshot/reports'), undefined);
  assert.deepEqual(tokensIn(join(ROOT, 'demo-data', 'no-such-snapshot', 'reports')), []);
});
