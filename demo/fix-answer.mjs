// The fix skill's answer over a snapshot run, rendered as the lines `npm run demo -- fix` prints. Pure: no I/O.

const firstSentence = (text) => (text.match(/^.*?[.!?](\s|$)/) ?? [text])[0].trim();
const clip = (text, n = 110) => (text.length > n ? text.slice(0, n - 1) + '…' : text);
/** The before and after lines of an edit, cut to the screen around the first change so a long line still shows what differs. */
export function windowed(before, after, max) {
  const ls = before.split('\n').map((l) => l.trim());
  const rs = after.split('\n').map((l) => l.trim());
  if (ls.length !== rs.length) return [ls.map((l) => clip(l, max)), rs.map((l) => clip(l, max))];
  const cut = (l, r) => {
    let p = 0;
    while (p < l.length && p < r.length && l[p] === r[p]) p++;
    if (Math.max(l.length, r.length) <= max) return [l, r];
    const start = Math.max(0, p - 30);
    const view = (t) => (start > 0 ? '…' : '') + t.slice(start, start + max - (start > 0 ? 2 : 1)) + (t.length > start + max - 1 ? '…' : '');
    return [view(l), view(r)];
  };
  const pairs = ls.map((l, i) => cut(l, rs[i]));
  return [pairs.map((x) => x[0]), pairs.map((x) => x[1])];
}
export function wrap(text, indent, width = 100) {
  const lines = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if (cur && visible(cur + ' ' + w) > width - indent.length) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) lines.push(cur);
  return lines.map((l) => indent + l).join('\n');
}

/** Visible width of a line: its ANSI colour codes count for nothing. */
const visible = (t) => t.replace(/\x1b\[[0-9;]*m/g, '').length;

/** ANSI painters, or plain text when `color` is off. */
function painters(color) {
  const paint = (code, text) => (color ? '\x1b[' + code + 'm' + text + '\x1b[0m' : text);
  return {
    bold: (t) => paint('1', t),
    dim: (t) => paint('2', t),
    red: (t) => paint('31', t),
    green: (t) => paint('32', t),
    cyan: (t) => paint('36', t),
  };
}

/** A section of the output in a rounded frame: the title on the top edge, each line padded to the right edge. */
function card(title, lines, width, { bold, dim }) {
  const inner = width - 4;
  return [
    dim('╭─ ') + bold(title) + dim(' ' + '─'.repeat(Math.max(1, width - 5 - title.length)) + '╮'),
    ...lines.flatMap((x) => x.split('\n')).map((l) => dim('│') + ' ' + l + ' '.repeat(Math.max(0, inner - visible(l))) + ' ' + dim('│')),
    dim('╰' + '─'.repeat(width - 2) + '╯'),
  ];
}

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const NOUN = { '#upload-close': 'close button', '#refresh': 'refresh button', '#upload-file': 'file field', '#upload-hint': 'hint text', '#last-updated': 'footer "Last updated" line' };
const noun = (selector) => NOUN[selector] ?? selector;

/** The developer's explanation of one proposal: a title, the problem as a user meets it, and the fix, from the rule and the edit itself. */
function explain(rule, targets, p) {
  const replacement = (p.edits ?? []).map((e) => e.replacement).join('\n');
  const [first, ...rest] = targets;
  switch (rule) {
    case 'button-name': {
      const labels = [...replacement.matchAll(/aria-label="([^"]+)"/g)].map((m) => '"' + m[1] + '"');
      return {
        title: cap(noun(first)) + ' with no name',
        problem: 'The ' + noun(first) + ' is an icon with no text, so a screen reader announces it as "button" and nothing else. A person who cannot see the icon has no way to know what it does.' + (rest.length ? ' The ' + rest.map(noun).join(' and ') + ' on the same page ' + (rest.length === 1 ? 'has' : 'have') + ' the same problem, for the same reason.' : ''),
        fix: /aria-label=\{label\}/.test(replacement)
          ? 'Every icon button goes through the shared IconButton component, which takes a label from each caller and drops it. One line in the component renders it as aria-label, so every icon button on the site gets its name.'
          : 'Give each icon button an accessible name with aria-label' + (labels.length ? ' (' + labels.join(', ') + ')' : '') + '. The SVG stays aria-hidden, so the label is the only thing announced.',
      };
    }
    case 'label': {
      const text = replacement.match(/<label[^>]*>([^<]+)<\/label>/)?.[1];
      return {
        title: cap(noun(first)) + ' with no label',
        problem: 'The ' + noun(first) + ' has no label. A screen reader announces it with no name, the hint under it is not connected to it, and clicking the words does nothing.',
        fix: 'Add a visible label' + (text ? ', "' + text + '",' : '') + ' tied to the field by its id' + (/className="field"/.test(replacement) ? ', in the wrapper the other form rows use' : '') + (/aria-describedby/.test(replacement) ? ', and point aria-describedby at the hint so the limits are read with the field.' : '.'),
      };
    }
    case 'color-contrast': {
      const ratios = [...(p.domSpec?.domInstruction ?? '').matchAll(/(\d+(?:\.\d+)?):1/g)].map((m) => m[1]).sort((x, y) => x - y).map((r) => r + ':1');
      const original = (p.edits ?? []).map((e) => e.original).join('\n');
      const hexes = (text) => [...text.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase());
      const hex = hexes(replacement).find((h) => !hexes(original).includes(h));
      const variable = hex && [...replacement.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{3,8})/gi)].find((m) => m[2].toLowerCase() === hex)?.[1];
      return {
        title: cap(noun(first)) + ' too faint to read',
        problem: 'The ' + noun(first) + ' is ' + (ratios[0] ?? 'under 4.5:1') + ' against its background; the minimum for text this size is 4.5:1. Hard to read with low vision, and on a dim screen hard for anyone.' + (rest.length ? ' The ' + rest.map(noun).join(' and ') + ' uses the same colour and fails the same way.' : ''),
        fix: 'Darken the ' + (variable ? 'shared colour ' + variable : 'colour') + (hex ? ' to ' + hex : '') + (ratios.length > 1 ? ' (' + ratios.at(-1) + ')' : '') + ' in the stylesheet, where it is set, so everything that uses it gets the fix.',
      };
    }
    default:
      return { title: cap(noun(first)) + ': ' + rule, problem: firstSentence(p.domSpec?.domInstruction ?? ''), fix: '' };
  }
}

const CLUSTER_KIND = { 'button-name': ['Icon buttons with no name', 'buttons'], 'link-name': ['Icon links with no name', 'links'], 'color-contrast': ['Text too faint to read', 'pieces of text'], label: ['Form fields with no label', 'fields'], 'image-alt': ['Images with no alt text', 'images'] };
const clusterKind = (c) => CLUSTER_KIND[c.ruleIds?.[0]] ?? [(c.ruleIds ?? []).join(', '), 'elements'];
/** One sentence, plain, for why a cluster is one problem: its elements share the same markup or style rule. */
function clusterWhy(c) {
  const [, things] = clusterKind(c);
  const where = c.fixTarget?.value ?? '';
  const code = c.ruleIds?.[0] === 'link-name' ? where.replace(/ — .*/, '') : where;
  return 'All ' + c.affectedElements + ' ' + things + ' trace back to the same place (' + clip(code, 60) + ').';
}

/**
 * The fix skill's answer over the developer's run, as the developer reads it: what it read, the stack and
 * conventions it found, then the clusters and each fix with the problem and the change in plain words and the diff
 * itself. This is the skill's own output from the pr snapshot, written ahead of time (DEMO.md says "pre-run" out
 * loud); `fix` prints it, then asks before applying the patch, so the gate can run again. With --live the skills
 * run here through the claude CLI instead.
 * `run` is readRun's result; `stack` the project line; `width` the screen width; `color` whether to paint ANSI.
 * Returns the output in blocks, in print order: each block's lines, then a pause of `pause` ms.
 */
export function renderFixAnswer(run, { stack, width, color }) {
  const { bold, dim, red, green, cyan } = painters(color);
  const { token, proposals, gate, clusters } = run;
  const blocks = [];
  let lines = [];
  const log = (text) => lines.push(...text.split('\n'));
  const flush = (pause) => { blocks.push({ lines, pause }); lines = []; };

  const prov = proposals.provenance ?? {};
  const impactOf = Object.fromEntries((gate.new ?? []).map((n) => [n.ruleId, n.impact]));
  const isNew = new Set((gate.new ?? []).map((n) => n.target));
  const pages = [...new Set((gate.new ?? []).map((n) => n.page))];
  const list = proposals.proposals ?? [];
  const files = [...new Set(list.flatMap((p) => (p.edits ?? []).map((e) => e.file)))];
  const inner = width - 4;
  const label = (name, text) => dim(name.padEnd(22)) + wrap(text, ' '.repeat(22), inner).trimStart();

  log('');
  log(bold('MANTA fix') + dim(' · run ' + token + ' · ' + (prov.model ?? 'model not recorded') + ' via ' + (prov.provider ?? 'an AI provider')));
  log('');
  flush(500);
  const conventions = [...new Set(list.flatMap((p) => p.conventionsDetected ?? []))].slice(0, 4);
  card('Reading', [
    label('The run', (gate.new ?? []).length + ' new violation' + ((gate.new ?? []).length === 1 ? '' : 's') + ' on ' + pages.join(', ') + ' · ' + (gate.tolerated ?? []).length + ' tolerated by the baseline'),
    label('The project', stack),
    ...conventions.map((c, i) => label(i === 0 ? 'Conventions found' : '', c)),
  ], width, { bold, dim }).forEach(log);
  flush(600);

  const lev = clusters.leverageSummary ?? {};
  const byId = Object.fromEntries((clusters.clusters ?? []).map((c) => [c.id, c]));
  const targetsOf = (c) => (c.members ?? []).map((m) => m.split('|::|')[2]);
  const heading = (step, title, note) => log('\n' + bold(step + ' · ' + title) + dim('   ' + note));
  heading('Step 1', 'cluster', 'group findings that share one cause');
  log('    ' + lev.totalViolations + ' findings in this run come down to ' + lev.clusters + ' shared causes and ' + lev.standalone + ' one-offs.');
  flush(500);
  const touched = (c) => targetsOf(c).some((t) => isNew.has(t));
  for (const c of [...(clusters.clusters ?? [])].sort((a, b) => Number(touched(b)) - Number(touched(a)))) {
    const fresh = targetsOf(c).filter((t) => isNew.has(t));
    const old = targetsOf(c).length - fresh.length;
    const [name] = clusterKind(c);
    log('');
    log('    ' + (fresh.length ? green('●') : dim('○')) + ' ' + bold(name) + dim(' · ' + c.affectedElements + ' elements · ' + c.ruleIds.join(', ') + ' · ' + c.worstImpact));
    if (fresh.length) {
      log(wrap(clusterWhy(c), '      ', width));
      log('      ' + green('Contains a new finding') + ' (' + [...new Set(fresh)].join(', ') + ') and ' + old + ' existing ' + (old === 1 ? 'one' : 'ones') + '. Fixing the cause clears all of them.');
    } else {
      log('      ' + dim('Existing debt in the baseline, no new finding. Left alone.'));
    }
  }
  flush(500);

  heading('Step 2', 'fix', 'write the change for each new finding');
  for (const [i, p] of list.entries()) {
    const part = (k) => [...new Set((p.members ?? []).map((m) => m.split('|::|')[k]))];
    const rules = part(1);
    const targets = part(2).sort((x, y) => Number(isNew.has(y)) - Number(isNew.has(x)));
    const e = explain(rules[0], targets, p);
    const right = rules.join(', ') + ' · ' + rules.map((r) => impactOf[r] ?? 'new').join(', ') + ' · ' + targets.join(', ');
    const left = (i + 1) + ' · ' + e.title;
    log('');
    log(bold(left) + dim(' '.repeat(Math.max(2, width - left.length - right.length)) + right));
    const c = p.scope === 'cluster' ? byId[p.scopeId] : undefined;
    const edits = (p.edits ?? []).filter((x) => x.replacement.trim() !== '').length;
    log(dim(wrap(c ? 'From cluster "' + clusterKind(c)[0] + '": fixes the new finding and its ' + (c.affectedElements - (c.members ?? []).filter((m) => isNew.has(m.split('|::|')[2])).length) + ' existing partners ' + (edits === 1 ? 'in one edit.' : 'in ' + edits + ' edits, one per element.') : 'Standalone: no other finding shares its cause.', '    ')));
    log(wrap(e.problem, '    ', width));
    if (e.fix) log(wrap('Fix: ' + e.fix, '    ', width));
    for (const edit of p.edits ?? []) {
      log('');
      log('    ' + cyan(edit.file + ':' + edit.startLine));
      const [was, now] = windowed(edit.original, edit.replacement, width - 6);
      for (const l of was) log('    ' + red('- ' + l));
      if (edit.replacement.trim() === '') log('    ' + dim('(line removed: the debt comment it carried is no longer true)'));
      else for (const l of now) log('    ' + green('+ ' + l));
    }
    flush(300);
  }
  log('');
  log(bold(list.length + ' fix' + (list.length === 1 ? '' : 'es')) + dim(' · ' + files.length + ' file' + (files.length === 1 ? '' : 's') + ' · ' + files.join(', ')));
  flush(0);
  return blocks;
}
