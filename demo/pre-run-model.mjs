/**
 * The pre-run model: a stand-in for the Anthropic API on 127.0.0.1, for a demo PC with no model and no key.
 *
 * MANTA's Anthropic API provider reads ANTHROPIC_BASE_URL and ANTHROPIC_API_KEY from its environment, so a
 * Workbench started with both pointed here lists "Anthropic API" as available and sends it the acr skill's one
 * call. The answer is a recording: the remarks the real model wrote for the run's ACR, read back out of the
 * committed artifact (each judged criterion's remark, minus the scan note MANTA appends after the model's words),
 * for exactly the criteria the skill asked about. MANTA then validates the reply, writes the artifact and renders
 * the Word document as it would from a live answer. Another skill, or a criterion the recording lacks, is refused
 * with a 400, which the Export dialog reports as the acr skill failing.
 */

import { createServer } from 'node:http';

export const PRE_RUN_API_KEY = 'pre-run';
/** A live draft takes the model a while; the dialog shows "ACR running…" for this long before the answer. */
export const THINKING_MS = 6_000;
/** MANTA's own sentence after a remark (criterion-credit's scan notes), never the model's words. */
const SCAN_NOTE = /\s*\S+ could not look on \d+ of \d+ scans? \(.*?\); what it would have found is not shown\./g;

/** The model's remark for each criterion the acr skill asked about, from the ACR artifact it wrote: criterion id → text. */
export function recordedRemarks(acr) {
  const remarks = new Map();
  for (const c of acr.criteria) {
    if (c.evidence && c.evidence.outcome !== 'clean') remarks.set(c.id, c.remark.replace(SCAN_NOTE, '').trim());
  }
  return remarks;
}

/**
 * Starts the stand-in on a free port of 127.0.0.1 and resolves to its origin, the environment the Workbench needs to
 * send its ACR call here, and a function that stops it.
 */
export function startPreRunModel(remarks, { thinkingMs = THINKING_MS } = {}) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => handle(req, res, remarks, thinkingMs));
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const origin = 'http://127.0.0.1:' + server.address().port;
      resolve({ origin, env: { ANTHROPIC_BASE_URL: origin, ANTHROPIC_API_KEY: PRE_RUN_API_KEY }, close: () => server.close() });
    });
  });
}

function handle(req, res, remarks, thinkingMs) {
  // The provider's probe: the models GET, on the standard tier's model.
  if (req.method === 'GET' && req.url.startsWith('/v1/models/')) return json(res, 200, { type: 'model', id: decodeURIComponent(req.url.slice('/v1/models/'.length)) });
  if (req.method !== 'POST' || req.url !== '/v1/messages') return refuse(res, 404, 'not_found_error', 'The pre-run model answers only the Anthropic API calls MANTA makes, not ' + req.method + ' ' + req.url + '.');
  let body = '';
  req.setEncoding('utf8').on('data', (chunk) => (body += chunk)).on('end', () => {
    let request;
    try { request = JSON.parse(body); } catch { return refuse(res, 400, 'invalid_request_error', 'The request body is not JSON.'); }
    const asked = askedCriteria(request);
    if (!asked) return refuse(res, 400, 'invalid_request_error', 'The pre-run model holds only the ACR’s reply, and this is not the acr skill’s payload.');
    const missing = asked.filter((id) => !remarks.has(id));
    if (missing.length) return refuse(res, 400, 'invalid_request_error', 'The recording has no remark for ' + missing.join(', ') + ': this is not the run it was made on.');
    const reply = { remarks: asked.map((id) => ({ criterionId: id, text: remarks.get(id) })) };
    console.log('[pre-run model] The acr skill asked about ' + asked.length + ' criteria; answering from the recording in ' + thinkingMs / 1000 + ' s.');
    setTimeout(() => json(res, 200, message(request.model, reply)), thinkingMs);
  });
}

/** The criterion ids of the acr skill's payload, fenced as JSON in the prompt; undefined when the prompt carries no such payload. */
function askedCriteria(request) {
  const content = request?.messages?.[0]?.content;
  const fenced = /```json\n([\s\S]*?)\n```/.exec(typeof content === 'string' ? content : '');
  let payload;
  try { payload = fenced && JSON.parse(fenced[1]); } catch { return undefined; }
  if (!Array.isArray(payload?.criteria) || !payload.criteria.every((c) => typeof c?.criterionId === 'string')) return undefined;
  return payload.criteria.map((c) => c.criterionId);
}

/** A Messages API reply as the provider unwraps it: one text block holding the JSON, stopped at end_turn, the model as requested. */
function message(model, reply) {
  const text = JSON.stringify(reply);
  return {
    id: 'msg_pre_run',
    type: 'message',
    role: 'assistant',
    model,
    content: [{ type: 'text', text }],
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: Math.ceil(text.length / 4) },
  };
}

function refuse(res, status, type, text) {
  console.error('[pre-run model] ' + text);
  json(res, status, { type: 'error', error: { type, message: text } });
}

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(value));
}
