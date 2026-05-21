/**
 * Playwright spec manager for Evyasys.
 *
 * Manages tests/e2e/{storyId}.spec.ts files tied to stories across three commands:
 *   CreateSubtask → scaffoldSpec  (initial spec from QA task TC list)
 *   StartQa       → loadPassedTests (retest: which TCs to skip)
 *   FinishQa      → updateOutcomes (mark passed TCs as skip-on-retest)
 *
 * Block formats (agent → hook communication):
 *   <!-- EVYASPEC [...]       -->  in CreateSubtask output
 *   <!-- EVYATCRESULTS [...] -->  in FinishQa output
 *   <!-- EVYABUGS [...]       -->  in FinishQa output
 */
const fs   = require('fs');
const path = require('path');

const SPEC_DIR = 'tests/e2e';

function specPath(repoRoot, storyId) {
  return path.join(repoRoot, SPEC_DIR, `${storyId}.spec.ts`);
}

/**
 * Create (or overwrite) the Playwright spec file.
 * @param {string} repoRoot
 * @param {string} storyId
 * @param {Array<{id:string, ac:string, title:string, type?:string}>} testCases
 * @returns {string} absolute path to the created spec
 */
function scaffoldSpec(repoRoot, storyId, testCases) {
  const outPath = specPath(repoRoot, storyId);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const byAc = {};
  for (const tc of testCases) {
    const ac = tc.ac || 'General';
    if (!byAc[ac]) byAc[ac] = [];
    byAc[ac].push(tc);
  }

  const today = new Date().toISOString().split('T')[0];
  const lines = [
    `// Evyasys — auto-generated Playwright spec`,
    `// Story:     ${storyId}`,
    `// Generated: ${today}`,
    `// Refresh:   /evyasys:StartQa ${storyId}`,
    `// Outcomes:  /evyasys:FinishQa ${storyId}`,
    ``,
    `import { test, expect } from '@playwright/test';`,
    ``,
  ];

  for (const [ac, tcs] of Object.entries(byAc)) {
    lines.push(`test.describe('${ac.replace(/'/g, "\\'")}', () => {`);
    lines.push(``);
    for (const tc of tcs) {
      const safeName = tc.title.replace(/'/g, "\\'");
      lines.push(`  test('${tc.id}: ${safeName}', async ({ page }) => {`);
      lines.push(`    // TODO: implement using data-testid / ARIA role locators`);
      lines.push(`    // EVYA:${tc.id}:PENDING`);
      lines.push(`  });`);
      lines.push(``);
    }
    lines.push(`});`);
    lines.push(``);
  }

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  return outPath;
}

/**
 * Mark passed TCs as skip-on-retest by replacing their PENDING marker.
 * @param {string} repoRoot
 * @param {string} storyId
 * @param {Array<{id:string, status:string, date?:string}>} outcomes
 */
function updateOutcomes(repoRoot, storyId, outcomes) {
  const outPath = specPath(repoRoot, storyId);
  if (!fs.existsSync(outPath)) return;

  let content = fs.readFileSync(outPath, 'utf8');
  const today = new Date().toISOString().split('T')[0];

  for (const { id, status, date } of outcomes) {
    if (status !== 'PASSED') continue;
    const passDate = date || today;
    content = content.replace(
      new RegExp(`(\\s*// TODO: implement.*\\n\\s*)(// EVYA:${id}:PENDING)`, 's'),
      `\n    test.skip(true, 'PASSED on ${passDate} — skip on retest');\n    // EVYA:${id}:PASSED:${passDate}`
    );
    // If the PENDING marker appears alone (already-edited spec)
    content = content.replace(
      new RegExp(`// EVYA:${id}:PENDING`),
      `// EVYA:${id}:PASSED:${passDate}`
    );
  }

  fs.writeFileSync(outPath, content, 'utf8');
}

/**
 * Return already-passed TCs from the spec file.
 * Used by StartQa to identify retest-skippable TCs.
 * @returns {Array<{id:string, passedDate:string}>}
 */
function loadPassedTests(repoRoot, storyId) {
  const outPath = specPath(repoRoot, storyId);
  if (!fs.existsSync(outPath)) return [];
  const content = fs.readFileSync(outPath, 'utf8');
  const passed = [];
  const re = /\/\/ EVYA:(TC-\d+):PASSED:([0-9-]+)/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    passed.push({ id: m[1], passedDate: m[2] });
  }
  return passed;
}

// ── Block parsers (agent → hook communication) ────────────────────────────────

function _parseJsonBlock(text, tag) {
  if (!text) return { data: null, cleanedOutput: text };
  const re = new RegExp(`<!--\\s*${tag}\\s*([\\s\\S]*?)-->`, 'i');
  const m  = text.match(re);
  if (!m) return { data: null, cleanedOutput: text };
  try {
    const data = JSON.parse(m[1].trim());
    const cleanedOutput = text.replace(re, '').trim();
    return { data, cleanedOutput };
  } catch {
    return { data: null, cleanedOutput: text };
  }
}

/** Parse <!-- EVYASPEC [...] --> from CreateSubtask output. */
function parseSpecBlock(text) {
  const { data: testCases, cleanedOutput } = _parseJsonBlock(text, 'EVYASPEC');
  return { testCases, cleanedOutput };
}

/** Parse <!-- EVYATCRESULTS [...] --> from FinishQa output. */
function parseResultsBlock(text) {
  const { data: outcomes, cleanedOutput } = _parseJsonBlock(text, 'EVYATCRESULTS');
  return { outcomes, cleanedOutput };
}

/** Parse <!-- EVYABUGS [...] --> from FinishQa output. */
function parseBugsBlock(text) {
  const { data: bugs, cleanedOutput } = _parseJsonBlock(text, 'EVYABUGS');
  return { bugs, cleanedOutput };
}

module.exports = {
  specPath,
  scaffoldSpec,
  updateOutcomes,
  loadPassedTests,
  parseSpecBlock,
  parseResultsBlock,
  parseBugsBlock,
};
