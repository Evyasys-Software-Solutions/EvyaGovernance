/**
 * Post-agent hook for evyasys-generate-release-note.
 *
 * 1. Parses the <!-- EVYARELEASE {...} --> block from agent output.
 * 2. Strips the block and saves clean markdown to .evyasys/releases/.
 * 3. Generates a branded PDF via scripts/lib/pdf-generator.js.
 * 4. Updates .evyasys/memory/release-notes.json with the release history entry.
 * 5. Optionally emails the PDF if email notification is configured.
 */
const fs   = require('fs');
const path = require('path');
const { runIntegration } = require('../../scripts/lib/dryrun');
const { loadConfig }     = require('../../scripts/lib/config');
const notify             = require('../../scripts/lib/notify-adapter');
const pdfGen             = require('../../scripts/lib/pdf-generator');

// ── Block parser ───────────────────────────────────────────────────────────────
function parseReleaseBlock(text) {
  if (!text) return { releaseData: null, cleanedOutput: text };
  const re = /<!--\s*EVYARELEASE\s*([\s\S]*?)-->/i;
  const m  = text.match(re);
  if (!m) return { releaseData: null, cleanedOutput: text };
  try {
    const releaseData    = JSON.parse(m[1].trim());
    const cleanedOutput  = text.replace(re, '').trim();
    return { releaseData, cleanedOutput };
  } catch {
    return { releaseData: null, cleanedOutput: text };
  }
}

// ── Release history ─────────────────────────────────────────────────────────────
function loadReleaseHistory(repoRoot) {
  const file = path.join(repoRoot, '.evyasys', 'memory', 'release-notes.json');
  if (!fs.existsSync(file)) return { releases: [] };
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return { releases: [] }; }
}

function saveReleaseHistory(repoRoot, history) {
  const dir  = path.join(repoRoot, '.evyasys', 'memory');
  const file = path.join(dir, 'release-notes.json');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(history, null, 2), 'utf8');
}

// ── Main hook ──────────────────────────────────────────────────────────────────
module.exports = async function (ctx) {
  const cfg      = await loadConfig({ ctx });

  const rawOutput = ctx.agentResult || '';

  // Parse and strip the EVYARELEASE block.
  // Note: story IDs may have been collected interactively by the agent (no ctx.args),
  // so we rely on the block itself rather than ctx.args for presence check.
  const { releaseData, cleanedOutput } = parseReleaseBlock(rawOutput);

  if (!releaseData) {
    const hasArgs = (ctx.args || []).length > 0;
    ctx.send(
      hasArgs
        ? '⚠️  No EVYARELEASE block found in agent output — PDF cannot be generated.\n' +
          'Ask the agent to re-run and output the structured block at the end.'
        : 'No story IDs provided. Usage: /evyasys:GenerateReleaseNote EVYA-1042 EVYA-1043 ...\n' +
          'Or run the command without arguments — the agent will ask you.'
    );
    return;
  }

  // Confirmation prompt before saving/generating anything.
  const releaseName = releaseData.releaseName || 'Release';
  const outputDir   = path.resolve(cfg.repoRoot, (cfg.releaseNotes && cfg.releaseNotes.outputDir) || '.evyasys/releases');
  const safeName    = releaseName.replace(/[^a-zA-Z0-9._\- ]/g, '_').replace(/\s+/g, '_');
  const date        = releaseData.releaseDate || new Date().toISOString().split('T')[0];
  const baseFile    = `${safeName}_${date}`;
  const mdPath      = path.join(outputDir, `${baseFile}.md`);
  const pdfPath     = path.join(outputDir, `${baseFile}.pdf`);

  const storyCount  = (releaseData.storyIds || []).length;
  const epicCount   = (releaseData.epicGroups || []).length;
  const notifyPart  = cfg.notificationTool !== 'none' ? ` + notify ${notify.toolLabel(cfg)}` : '';

  if (!(await ctx.confirm(
    `Generate PDF release notes for "${releaseName}" (${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'}, ${epicCount} epic${epicCount !== 1 ? 's' : ''})${notifyPart}?`
  ))) {
    ctx.send('Release note generation cancelled.');
    return;
  }

  // ── Save markdown ─────────────────────────────────────────────────────────────
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(mdPath, cleanedOutput || rawOutput, 'utf8');
  ctx.send(`Saved release notes (Markdown) → ${mdPath}`);

  // ── Generate PDF ──────────────────────────────────────────────────────────────
  if (cfg.dryRun) {
    ctx.send(`[dry-run] PDF would be generated → ${pdfPath}`);
  } else {
    try {
      const generated = await pdfGen.generate(cfg, releaseData, (msg) => ctx.send(msg));
      ctx.send(`PDF generated → ${generated}`);
    } catch (err) {
      ctx.send(`⚠️  PDF generation failed: ${err.message}\n` +
        'Markdown was saved successfully. Install pdfkit (npm install pdfkit) and retry.');
    }
  }

  // ── Update release history ────────────────────────────────────────────────────
  const history = loadReleaseHistory(cfg.repoRoot);
  history.releases = history.releases || [];
  history.releases.push({
    releaseName:   releaseData.releaseName,
    version:       releaseData.version || '',
    releaseDate:   date,
    storyIds:      releaseData.storyIds || [],
    storyCount,
    totalSP:       (releaseData.epicGroups || [])
                     .flatMap(e => e.stories || [])
                     .reduce((s, st) => s + (Number(st.storyPoints) || 0), 0),
    mdFile:        mdPath,
    pdfFile:       pdfPath,
  });
  // Keep only last 50 releases in memory
  if (history.releases.length > 50) history.releases = history.releases.slice(-50);
  saveReleaseHistory(cfg.repoRoot, history);
  ctx.send(`Release history updated → .evyasys/memory/release-notes.json`);

  // ── Notification ──────────────────────────────────────────────────────────────
  if (cfg.notificationTool !== 'none') {
    await notify.ensureCredentials(cfg);
    await runIntegration({
      name: `${cfg.notificationTool}:release-generated`, cfg,
      args: {
        storyId:  releaseName, storyCount,
        version:  releaseData.version,
        pdfFile:  pdfPath,
      },
      live: () => notify.send(cfg, {
        event:            'release-generated',
        storyId:          releaseName,
        storyCount,
        version:          releaseData.version    || '',
        pdfFile:          pdfPath,
        executiveSummary: releaseData.executiveSummary || '',
        epicGroups:       releaseData.epicGroups  || [],
        qualityGates:     releaseData.qualityGates || {},
        knownIssues:      releaseData.knownIssues  || [],
      }),
    }).catch((err) => {
      ctx.send(`⚠️  Notification failed: ${err.message}`);
    });
  }

  // ── Final summary ─────────────────────────────────────────────────────────────
  const sp = (releaseData.epicGroups || [])
    .flatMap(e => e.stories || [])
    .reduce((s, st) => s + (Number(st.storyPoints) || 0), 0);

  ctx.send(
    `✅  Release notes for **${releaseName}** complete.\n\n` +
    `  Stories: ${storyCount}  ·  Epics: ${epicCount}  ·  Story Points: ${sp}\n` +
    `  MD:  ${mdPath}\n` +
    `  PDF: ${pdfPath}\n\n` +
    `Share the PDF with stakeholders or attach it to your sprint review.`
  );
};
