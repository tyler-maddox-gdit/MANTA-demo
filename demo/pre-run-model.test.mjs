import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { recordedRemarks, startPreRunModel } from './pre-run-model.mjs';
import { tokensIn } from './snapshot-run.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS = join(ROOT, 'demo-data', 'release', 'reports');
const acr = JSON.parse(readFileSync(join(REPORTS, 'acr-' + tokensIn(REPORTS).at(-1) + '.json'), 'utf8'));

test('recordedRemarks takes the judged criteria of the release ACR, without the scan notes MANTA appended', () => {
  const remarks = recordedRemarks(acr);
  assert.deepEqual([...remarks.keys()].sort(), ['1.1.1', '1.4.11', '1.4.3', '2.4.1', '2.4.4', '3.3.2', '4.1.2']);
  for (const text of remarks.values()) {
    assert.ok(text.length > 0 && text.length <= 600, text.length);
    assert.doesNotMatch(text, /[\r\n]/);
    assert.doesNotMatch(text, /could not look on/);
  }
  assert.match(acr.criteria.find((c) => c.id === '2.4.1').remark, /skip-link-works could not look on 1 of 37 scans/);
  assert.match(remarks.get('2.4.1'), /collapsible block\.$/);
});

test('the pre-run model answers the probe, and the acr skill’s call with the recorded remarks for the criteria it asked about', async () => {
  const remarks = recordedRemarks(acr);
  const model = await startPreRunModel(remarks, { thinkingMs: 0 });
  try {
    assert.equal(model.env.ANTHROPIC_BASE_URL, model.origin);
    const probe = await fetch(model.origin + '/v1/models/claude-opus-5');
    assert.equal(probe.status, 200);

    const asked = ['1.4.3', '2.4.1'];
    const prompt = 'Draft.\n\n## Input\n\n```json\n' + JSON.stringify({ criteria: asked.map((criterionId) => ({ criterionId })) }, null, 2) + '\n```\n\n## Reply schema\n\n```json\n{}\n```';
    const res = await fetch(model.origin + '/v1/messages', { method: 'POST', body: JSON.stringify({ model: 'claude-opus-5', messages: [{ role: 'user', content: prompt }] }) });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.stop_reason, 'end_turn');
    assert.equal(body.model, 'claude-opus-5');
    assert.deepEqual(JSON.parse(body.content[0].text), { remarks: asked.map((criterionId) => ({ criterionId, text: remarks.get(criterionId) })) });

    const other = await fetch(model.origin + '/v1/messages', { method: 'POST', body: JSON.stringify({ model: 'claude-opus-5', messages: [{ role: 'user', content: '```json\n{"clusters":[]}\n```' }] }) });
    assert.equal(other.status, 400);
    const unknown = await fetch(model.origin + '/v1/messages', { method: 'POST', body: JSON.stringify({ model: 'claude-opus-5', messages: [{ role: 'user', content: '```json\n{"criteria":[{"criterionId":"2.4.3"}]}\n```' }] }) });
    assert.equal(unknown.status, 400);
    assert.match((await unknown.json()).error.message, /2\.4\.3/);
  } finally {
    model.close();
  }
});
