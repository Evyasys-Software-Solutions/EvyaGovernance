/**
 * Anti-hallucination verifier.
 *
 * The LLM often claims facts that sound plausible but aren't true — "file X exists",
 * "function Y is used elsewhere", "this pattern is the BaseService pattern", "the
 * generated code compiles". This module lets the plugin fact-check those claims
 * against the actual codebase before finalising a review or committing changes.
 *
 * Usage (programmatic — from hooks):
 *   const v = require('./verifier');
 *   v.verifyFilePath(repoRoot, 'src/UserService.js')       → { ok, path }
 *   v.verifySymbolExists(repoRoot, 'BaseService')          → { ok, count, files: [] }
 *   v.verifyPatternMarker(repoRoot, 'extends BaseService', 'src/UserService.js')
 *   v.verifyCodeParses('src/foo.js')                        → { ok, error? }
 *   v.verifyClaimBatch(repoRoot, claims)                    → { ok, results: [], failed: [] }
 *
 * Usage (CLI — for the agent to invoke via Bash mid-run):
 *   node scripts/lib/verifier.js file <path>
 *   node scripts/lib/verifier.js symbol <name>
 *   node scripts/lib/verifier.js pattern <marker> <file>
 *   node scripts/lib/verifier.js parse <file>
 *   node scripts/lib/verifier.js batch <path/to/claims.json>
 *
 * All CLI commands exit 0 on PASS and 1 on FAIL and print a single-line JSON result.
 * That makes them safe to embed in shell pipelines and easy for the agent to parse.
 */
const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const { execSync } = require('child_process');

const JS_EXTS  = new Set(['.js', '.mjs', '.cjs']);
const MAX_GREP_FILES = 20;

// ── File existence ──────────────────────────────────────────────────────────────

function verifyFilePath(repoRoot, filePath) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    return { ok: false, error: 'empty path' };
  }
  if (filePath.includes('..') || path.isAbsolute(filePath)) {
    return { ok: false, error: 'unsafe path (contains .. or absolute)' };
  }
  const abs = path.join(repoRoot, filePath);
  return { ok: fs.existsSync(abs), path: filePath };
}

// ── Symbol existence (grep-based) ───────────────────────────────────────────────

/**
 * Look for a symbol (function, class, variable) anywhere in the repo. Uses
 * `git grep` if available (fast, respects .gitignore) or falls back to a
 * bounded recursive scan.
 */
function verifySymbolExists(repoRoot, symbol, opts = {}) {
  if (typeof symbol !== 'string' || symbol.length === 0) {
    return { ok: false, error: 'empty symbol' };
  }
  const wordBoundary = opts.exact !== false;
  const pattern      = wordBoundary ? `\\b${escapeRegex(symbol)}\\b` : escapeRegex(symbol);

  try {
    const out = execSync(
      `git grep --files-with-matches -E "${pattern}"`,
      { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    const files = out ? out.split('\n').slice(0, MAX_GREP_FILES) : [];
    return { ok: files.length > 0, count: files.length, files, method: 'git-grep' };
  } catch {
    // Not a git repo (or git grep failed). Fall back to bounded fs walk.
    return fsGrepFallback(repoRoot, pattern);
  }
}

function fsGrepFallback(repoRoot, patternStr) {
  const re    = new RegExp(patternStr);
  const found = [];
  const stack = [repoRoot];
  const SKIP  = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.evyasys']);
  const MAX_FILES = 2000;
  let scanned = 0;

  while (stack.length > 0 && found.length < MAX_GREP_FILES && scanned < MAX_FILES) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of entries) {
      if (SKIP.has(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile()) {
        scanned++;
        try {
          const body = fs.readFileSync(p, 'utf8');
          if (re.test(body)) {
            found.push(path.relative(repoRoot, p));
            if (found.length >= MAX_GREP_FILES) break;
          }
        } catch { /* binary or unreadable — skip */ }
      }
    }
  }
  return { ok: found.length > 0, count: found.length, files: found, method: 'fs-scan' };
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ── Pattern marker (does file X contain expected marker?) ───────────────────────

/**
 * Verify a file contains a specific marker (substring or regex) — used to
 * fact-check claims like "UserService extends BaseService".
 */
function verifyPatternMarker(repoRoot, marker, filePath, opts = {}) {
  const file = verifyFilePath(repoRoot, filePath);
  if (!file.ok) return { ok: false, error: file.error || 'file not found' };

  try {
    const body = fs.readFileSync(path.join(repoRoot, filePath), 'utf8');
    const matches = opts.regex
      ? new RegExp(marker).test(body)
      : body.includes(marker);
    return { ok: matches, marker, file: filePath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── JS/TS/Python code parse check ───────────────────────────────────────────────

/**
 * Verify a file's syntax is valid. Supports:
 *   .js / .mjs / .cjs  — `node --check`
 *   .ts / .tsx         — attempts `tsc --noEmit` if tsc is available (skips otherwise)
 *   .py                — attempts `python -m py_compile` if python is available (skips otherwise)
 * Returns `{ ok: true, skipped: true }` for unsupported extensions.
 */
function verifyCodeParses(filePath, contentOverride) {
  const ext = path.extname(filePath).toLowerCase();

  // Use a tmp file if content is passed inline (verifying LLM-generated code
  // before it's actually written to disk).
  const usingTmp = typeof contentOverride === 'string';
  const target   = usingTmp
    ? path.join(os.tmpdir(), `evya-verify-${process.pid}-${Date.now()}${ext}`)
    : filePath;
  if (usingTmp) fs.writeFileSync(target, contentOverride);

  try {
    if (JS_EXTS.has(ext)) {
      try {
        execSync(`node --check "${target}"`, { stdio: 'pipe' });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: (e.stderr || e.stdout || Buffer.from('')).toString().slice(0, 400).trim() };
      }
    }
    if (ext === '.ts' || ext === '.tsx') {
      return tryToolParse('tsc', ['--noEmit', target], 'typescript (tsc)');
    }
    if (ext === '.py') {
      return tryToolParse('python', ['-m', 'py_compile', target], 'python');
    }
    return { ok: true, skipped: true, reason: `no parser wired for ${ext}` };
  } finally {
    if (usingTmp) { try { fs.unlinkSync(target); } catch {} }
  }
}

function tryToolParse(tool, args, label) {
  try { execSync(`${tool} --version`, { stdio: 'pipe' }); }
  catch { return { ok: true, skipped: true, reason: `${label} not installed` }; }
  try {
    execSync([tool, ...args].join(' '), { stdio: 'pipe' });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e.stderr || e.stdout || Buffer.from('')).toString().slice(0, 400).trim() };
  }
}

// ── Batch verification ──────────────────────────────────────────────────────────

/**
 * Run a batch of claims. Each claim is `{ type, ...params }` where type is one
 * of `file`, `symbol`, `pattern`, `parse`. Returns aggregate + per-claim results.
 * The agent can use this at Phase 4 (self-review) to prove its claims cite real
 * things — a failed batch means at least one claim is a hallucination.
 */
function verifyClaimBatch(repoRoot, claims) {
  const results = claims.map(c => {
    switch (c.type) {
      case 'file':    return { claim: c, result: verifyFilePath(repoRoot, c.path) };
      case 'symbol':  return { claim: c, result: verifySymbolExists(repoRoot, c.name, { exact: c.exact }) };
      case 'pattern': return { claim: c, result: verifyPatternMarker(repoRoot, c.marker, c.path, { regex: c.regex }) };
      case 'parse':   return { claim: c, result: verifyCodeParses(c.path, c.content) };
      default:        return { claim: c, result: { ok: false, error: `unknown claim type: ${c.type}` } };
    }
  });
  const failed = results.filter(r => !r.result.ok);
  return { ok: failed.length === 0, results, failed, total: results.length, passed: results.length - failed.length };
}

module.exports = { verifyFilePath, verifySymbolExists, verifyPatternMarker, verifyCodeParses, verifyClaimBatch };

// ── CLI ─────────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const [,, cmd, ...args] = process.argv;
  const repoRoot = process.env.EVYA_REPO_ROOT || process.cwd();
  let result;
  try {
    switch (cmd) {
      case 'file':    result = verifyFilePath(repoRoot, args[0]);                    break;
      case 'symbol':  result = verifySymbolExists(repoRoot, args[0]);                break;
      case 'pattern': result = verifyPatternMarker(repoRoot, args[0], args[1]);      break;
      case 'parse':   result = verifyCodeParses(args[0]);                            break;
      case 'batch': {
        const claims = JSON.parse(fs.readFileSync(args[0], 'utf8'));
        result = verifyClaimBatch(repoRoot, claims);
        break;
      }
      default:
        process.stderr.write('Usage: verifier.js file|symbol|pattern|parse|batch <args>\n');
        process.exit(2);
    }
  } catch (err) {
    result = { ok: false, error: err.message };
  }
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(result.ok ? 0 : 1);
}
