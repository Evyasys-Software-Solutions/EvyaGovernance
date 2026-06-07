/**
 * PDF generator for Evyasys release notes.
 *
 * Requires pdfkit: npm install pdfkit
 * (pure Node.js — no browser, no external font deps)
 *
 * Entry point:
 *   const pdf = require('./pdf-generator');
 *   const filePath = await pdf.generate(cfg, releaseData);
 *
 * releaseData shape — matches the <!-- EVYARELEASE {...} --> block emitted by the agent.
 */
const fs   = require('fs');
const path = require('path');

// ── Constants ──────────────────────────────────────────────────────────────────
const A4_W    = 595.28;
const A4_H    = 841.89;
const MARGIN  = 50;
const CW      = A4_W - MARGIN * 2;   // 495.28 pt usable width
const HDR_H   = 38;                   // running header height (non-cover pages)
const FTR_H   = 28;                   // footer height

const C_BRAND_DEF = '#0078d4';
const C_DARK      = '#1a1a2e';
const C_BODY      = '#333333';
const C_MUTED     = '#666666';
const C_LINE      = '#e0e0e0';
const C_PASS      = '#16a34a';
const C_FAIL      = '#dc2626';
const C_NA        = '#6b7280';
const C_CARD_BG   = '#f0f7ff';
const C_TBL_HDR   = '#e8f0fe';
const C_WHITE     = '#ffffff';

// ── pdfkit loader (auto-installs if missing) ──────────────────────────────────
const { ensurePackage } = require('./ensure-package');

function getPDFDocument(log) {
  return ensurePackage('pdfkit', log);
}

// ── Low-level drawing helpers ──────────────────────────────────────────────────

function fillRect(doc, x, y, w, h, color) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function hLine(doc, y, x0 = MARGIN, x1 = A4_W - MARGIN, color = C_LINE, width = 0.5) {
  doc.save().moveTo(x0, y).lineTo(x1, y).lineWidth(width).strokeColor(color).stroke().restore();
}

function textAt(doc, str, x, y, opts = {}) {
  if (!str) return;
  doc.save()
    .font(opts.font || 'Helvetica')
    .fontSize(opts.size || 10)
    .fillColor(opts.color || C_BODY)
    .text(String(str), x, y, {
      width:    opts.width  || CW,
      align:    opts.align  || 'left',
      lineGap:  opts.lineGap || 2,
      ...opts.extra,
    })
    .restore();
}

// ── Running header (non-cover pages) ──────────────────────────────────────────
function drawRunningHeader(doc, releaseName, brandColor) {
  fillRect(doc, 0, 0, A4_W, HDR_H, brandColor);
  textAt(doc, releaseName, MARGIN, 12,
    { font: 'Helvetica-Bold', size: 11, color: C_WHITE, width: CW * 0.65 });
  textAt(doc, 'Evyasys · Release Notes', A4_W - MARGIN - 160, 14,
    { font: 'Helvetica', size: 9, color: 'rgba(255,255,255,0.7)', width: 150, align: 'right' });
  // Reset cursor to below header
  doc.y = HDR_H + 16;
}

// ── Footer (added to all non-cover pages after buffering) ─────────────────────
function drawFooter(doc, pageNum, totalPages, companyName, brandColor) {
  const y = A4_H - FTR_H;
  hLine(doc, y, MARGIN, A4_W - MARGIN, C_LINE, 0.5);
  textAt(doc, `Prepared by Evyasys · ${companyName}`, MARGIN, y + 7,
    { font: 'Helvetica', size: 8, color: C_MUTED, width: CW * 0.55 });
  textAt(doc, `Page ${pageNum} of ${totalPages}`, MARGIN, y + 7,
    { font: 'Helvetica', size: 8, color: C_MUTED, width: CW, align: 'right' });
}

// ── Section header (full-width color bar with white title) ─────────────────────
function sectionBar(doc, title, brandColor) {
  const y = doc.y + 6;
  fillRect(doc, MARGIN, y, CW, 28, brandColor);
  textAt(doc, title, MARGIN + 12, y + 7,
    { font: 'Helvetica-Bold', size: 12, color: C_WHITE, width: CW - 24 });
  doc.y = y + 34;
  doc.moveDown(0.4);
}

function subHeading(doc, title, color = C_DARK) {
  doc.moveDown(0.5);
  textAt(doc, title, MARGIN, doc.y, { font: 'Helvetica-Bold', size: 11, color });
  hLine(doc, doc.y + 2);
  doc.moveDown(0.7);
}

function bodyText(doc, text) {
  if (!text) return;
  textAt(doc, text, MARGIN, doc.y,
    { font: 'Helvetica', size: 10, color: C_BODY, width: CW });
  doc.moveDown(0.4);
}

function bulletItem(doc, text) {
  if (!text) return;
  textAt(doc, `• ${text}`, MARGIN + 10, doc.y,
    { font: 'Helvetica', size: 10, color: C_BODY, width: CW - 10 });
  doc.moveDown(0.25);
}

// ── Cover page ─────────────────────────────────────────────────────────────────
function drawCoverPage(doc, data, brandColor, companyName, cfg) {
  // Top colour band
  fillRect(doc, 0, 0, A4_W, 340, brandColor);

  // Logo (optional)
  if (cfg.releaseNotes && cfg.releaseNotes.logoPath) {
    const abs = path.isAbsolute(cfg.releaseNotes.logoPath)
      ? cfg.releaseNotes.logoPath
      : path.join(cfg.repoRoot, cfg.releaseNotes.logoPath);
    if (fs.existsSync(abs)) {
      try { doc.image(abs, MARGIN, 36, { fit: [72, 72] }); } catch (_) { /* skip */ }
    }
  }

  // Company name (top-right)
  textAt(doc, companyName, A4_W - MARGIN - 180, 52,
    { font: 'Helvetica', size: 12, color: 'rgba(255,255,255,0.7)', width: 170, align: 'right' });

  // Release name (large centred)
  textAt(doc, data.releaseName || 'Release Notes', MARGIN, 118,
    { font: 'Helvetica-Bold', size: 30, color: C_WHITE, width: CW, align: 'center' });

  // Version
  if (data.version) {
    textAt(doc, `Version ${data.version}`, MARGIN, 172,
      { font: 'Helvetica', size: 15, color: 'rgba(255,255,255,0.82)', width: CW, align: 'center' });
  }

  // Date
  textAt(doc, data.releaseDate || new Date().toISOString().split('T')[0], MARGIN, 204,
    { font: 'Helvetica', size: 12, color: 'rgba(255,255,255,0.65)', width: CW, align: 'center' });

  // Info card on white background
  fillRect(doc, MARGIN, 276, CW, 160, C_WHITE);
  doc.save().rect(MARGIN, 276, CW, 160).lineWidth(1).strokeColor(C_LINE).stroke().restore();

  const metaRows = [
    ['Prepared by',   data.preparedBy || 'QA Team'],
    ['Stories',       (data.storyIds || []).join(', ') || '—'],
    ['Epics covered', String((data.epicGroups || []).length)],
    ['Total SP',      String((data.epicGroups || []).flatMap(e => e.stories || []).reduce((s, st) => s + (Number(st.storyPoints) || 0), 0)) + ' story points'],
  ];
  let my = 292;
  for (const [label, value] of metaRows) {
    textAt(doc, label.toUpperCase(), MARGIN + 14, my,
      { font: 'Helvetica-Bold', size: 8, color: C_MUTED, width: 110 });
    textAt(doc, value, MARGIN + 130, my,
      { font: 'Helvetica', size: 10, color: C_DARK, width: CW - 144 });
    my += 32;
  }

  // Bottom band
  fillRect(doc, 0, A4_H - 44, A4_W, 44, brandColor);
  textAt(doc, 'Generated by Evyasys · EvyaGovernance', MARGIN, A4_H - 27,
    { font: 'Helvetica', size: 8, color: 'rgba(255,255,255,0.65)', width: CW, align: 'center' });
}

// ── Table of Contents page ─────────────────────────────────────────────────────
function drawToc(doc, data, brandColor, releaseName) {
  drawRunningHeader(doc, releaseName, brandColor);
  sectionBar(doc, 'Table of Contents', brandColor);

  const storyCount = (data.storyIds || []).length;
  const epicCount  = (data.epicGroups || []).length;

  const lines = [
    { text: '1.  Executive Summary',                                    indent: 0, bold: true },
    { text: `2.  What's in This Release  (${epicCount} epic${epicCount !== 1 ? 's' : ''}, ${storyCount} stor${storyCount !== 1 ? 'ies' : 'y'})`, indent: 0, bold: true },
    ...(data.epicGroups || []).map((eg, i) => ({
      text:   `2.${i + 1}   ${eg.epicTitle || eg.epicId}`,
      indent: 20, bold: false,
    })),
    { text: '3.  Quality Gate Summary',                                 indent: 0, bold: true },
    ...((data.knownIssues || []).length > 0
      ? [{ text: '4.  Known Issues & Limitations', indent: 0, bold: true }]
      : []),
    { text: '5.  Deployment Notes',                                     indent: 0, bold: true },
    { text: '6.  Rollback Procedure',                                   indent: 0, bold: true },
    { text: '7.  Appendix — Story & Work Item References',              indent: 0, bold: true },
  ];

  for (const l of lines) {
    textAt(doc, l.text, MARGIN + l.indent, doc.y,
      { font: l.bold ? 'Helvetica-Bold' : 'Helvetica', size: 10, color: l.bold ? C_DARK : C_BODY, width: CW - l.indent });
    doc.moveDown(0.5);
  }
}

// ── Story card ─────────────────────────────────────────────────────────────────
function drawStoryCard(doc, story, brandColor) {
  const changelog   = story.changelog   || [];
  const limitations = story.limitations || [];
  // Estimate card height
  const cardH = 46 + (story.summary ? 36 : 0) + changelog.length * 16 + limitations.length * 14 + (story.testOutcome ? 18 : 0);

  // Overflow guard
  if (doc.y + cardH + 20 > A4_H - FTR_H - 20) return null; // caller handles overflow

  const startY = doc.y;
  fillRect(doc, MARGIN, startY, CW, cardH, C_CARD_BG);
  fillRect(doc, MARGIN, startY, 4, cardH, brandColor); // left accent

  const ix = MARGIN + 14;
  const iw = CW - 28;
  let cy = startY + 10;

  // Story ID + title
  textAt(doc, `${story.id}  —  ${story.title}`, ix, cy,
    { font: 'Helvetica-Bold', size: 11, color: C_DARK, width: iw - 50 });
  if (story.storyPoints) {
    textAt(doc, `${story.storyPoints} SP`, A4_W - MARGIN - 48, cy,
      { font: 'Helvetica', size: 9, color: C_MUTED, width: 40, align: 'right' });
  }
  cy += 20;

  // Summary
  if (story.summary) {
    textAt(doc, story.summary, ix, cy,
      { font: 'Helvetica', size: 9.5, color: C_BODY, width: iw });
    cy += 28;
  }

  // Changelog
  if (changelog.length > 0) {
    textAt(doc, 'CHANGED', ix, cy,
      { font: 'Helvetica-Bold', size: 8, color: C_MUTED, width: 70 });
    cy += 13;
    for (const item of changelog) {
      textAt(doc, `• ${item}`, ix + 8, cy,
        { font: 'Helvetica', size: 9.5, color: C_BODY, width: iw - 8 });
      cy += 15;
    }
  }

  // Test outcome
  if (story.testOutcome) {
    textAt(doc, `✓  ${story.testOutcome}`, ix, cy,
      { font: 'Helvetica-Oblique', size: 9, color: C_PASS, width: iw });
    cy += 16;
  }

  doc.y = startY + cardH + 8;
  return cardH;
}

// ── Quality Gates table ────────────────────────────────────────────────────────
function drawQualityGates(doc, gates, brandColor) {
  sectionBar(doc, '3. Quality Gate Summary', brandColor);

  const gateRows = [
    ['Security',       gates.security       || 'N/A', 'Auth, input validation, PII handling'],
    ['Performance',    gates.performance     || 'N/A', 'Response time budgets and load scenarios'],
    ['Accessibility',  gates.accessibility   || 'N/A', 'Keyboard nav, ARIA labels, colour contrast'],
    ['Data Integrity', gates.dataIntegrity   || 'N/A', 'FK constraints, migration up/down verified'],
  ];

  // Column widths
  const c1 = CW * 0.23, c2 = CW * 0.15, c3 = CW * 0.62;
  const hdrY = doc.y;

  fillRect(doc, MARGIN, hdrY, CW, 24, C_TBL_HDR);
  textAt(doc, 'Gate',   MARGIN + 8, hdrY + 7, { font: 'Helvetica-Bold', size: 9, color: C_DARK, width: c1 });
  textAt(doc, 'Result', MARGIN + c1 + 8, hdrY + 7, { font: 'Helvetica-Bold', size: 9, color: C_DARK, width: c2 });
  textAt(doc, 'Scope',  MARGIN + c1 + c2 + 8, hdrY + 7, { font: 'Helvetica-Bold', size: 9, color: C_DARK, width: c3 });
  doc.y = hdrY + 28;

  for (const [gate, result, scope] of gateRows) {
    const ry = doc.y;
    const resultUpper  = String(result).toUpperCase();
    const resultColor  = resultUpper === 'PASS' ? C_PASS : resultUpper === 'FAIL' ? C_FAIL : C_NA;
    hLine(doc, ry - 1);
    textAt(doc, gate,   MARGIN + 8,          ry + 5, { font: 'Helvetica', size: 10, color: C_BODY, width: c1 });
    textAt(doc, result, MARGIN + c1 + 8,     ry + 5, { font: 'Helvetica-Bold', size: 10, color: resultColor, width: c2 });
    textAt(doc, scope,  MARGIN + c1 + c2 + 8, ry + 5, { font: 'Helvetica', size: 9, color: C_MUTED, width: c3 });
    doc.y = ry + 24;
  }
  doc.moveDown(0.6);
}

// ── Appendix ───────────────────────────────────────────────────────────────────
function drawAppendix(doc, data, brandColor) {
  sectionBar(doc, '7. Appendix — Story & Work Item References', brandColor);

  for (const eg of (data.epicGroups || [])) {
    subHeading(doc, `${eg.epicId}${eg.epicTitle ? ': ' + eg.epicTitle : ''}`, brandColor);
    for (const story of (eg.stories || [])) {
      textAt(doc, `${story.id}  ${story.title}`,
        MARGIN + 6, doc.y, { font: 'Helvetica-Bold', size: 10, color: C_DARK, width: CW - 12 });
      doc.moveDown(0.2);
      if (story.pmId) {
        textAt(doc, `Work Item: #${story.pmId}`, MARGIN + 16, doc.y,
          { font: 'Helvetica', size: 9, color: C_MUTED, width: CW - 20 });
        doc.moveDown(0.2);
      }
      textAt(doc, `.evyasys/board/**/${story.id}/${story.id}_TestPlan.md`, MARGIN + 16, doc.y,
        { font: 'Helvetica-Oblique', size: 9, color: C_MUTED, width: CW - 20 });
      doc.moveDown(0.5);
    }
  }
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Generate a PDF release notes document.
 *
 * @param {object} cfg        — Evyasys config (cfg.releaseNotes, cfg.project, cfg.repoRoot)
 * @param {object} data       — Structured release data from EVYARELEASE block
 * @returns {Promise<string>} — Absolute path to the generated PDF file
 */
async function generate(cfg, data, log) {
  const PDFDocument = getPDFDocument(log);

  const rn          = cfg.releaseNotes || {};
  const brandColor  = rn.brandColor  || C_BRAND_DEF;
  const companyName = rn.companyName || cfg.project.name || 'Evyasys';
  const outputDir   = path.resolve(cfg.repoRoot, rn.outputDir || '.evyasys/releases');
  const releaseName = data.releaseName || 'Release Notes';

  fs.mkdirSync(outputDir, { recursive: true });

  const safeName = releaseName.replace(/[^a-zA-Z0-9._\- ]/g, '_').replace(/\s+/g, '_');
  const date     = data.releaseDate || new Date().toISOString().split('T')[0];
  const fileName = `${safeName}_${date}.pdf`;
  const filePath = path.join(outputDir, fileName);

  const doc = new PDFDocument({
    size:    'A4',
    margins: { top: HDR_H + 8, bottom: FTR_H + 8, left: MARGIN, right: MARGIN },
    bufferPages: true,
    info: {
      Title:   releaseName,
      Author:  data.preparedBy || companyName,
      Subject: `Release Notes: ${(data.storyIds || []).join(', ')}`,
      Creator: 'Evyasys EvyaGovernance',
    },
  });

  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // ── 1. Cover page ────────────────────────────────────────────────────────────
  drawCoverPage(doc, data, brandColor, companyName, cfg);

  // ── 2. Table of Contents ─────────────────────────────────────────────────────
  doc.addPage();
  drawToc(doc, data, brandColor, releaseName);

  // ── 3. Executive Summary ─────────────────────────────────────────────────────
  doc.addPage();
  drawRunningHeader(doc, releaseName, brandColor);
  sectionBar(doc, '1. Executive Summary', brandColor);
  bodyText(doc, data.executiveSummary || 'No executive summary provided.');

  // ── 4. What's in This Release ────────────────────────────────────────────────
  doc.addPage();
  drawRunningHeader(doc, releaseName, brandColor);
  sectionBar(doc, "2. What's in This Release", brandColor);

  for (let ei = 0; ei < (data.epicGroups || []).length; ei++) {
    const eg = data.epicGroups[ei];
    subHeading(doc, `2.${ei + 1}  ${eg.epicTitle || eg.epicId}`, brandColor);

    for (const story of (eg.stories || [])) {
      // Overflow guard: mirrors drawStoryCard's cardH formula (summary + changelog + testOutcome)
      const estimatedH = 46 + (story.summary ? 36 : 0) + (story.changelog || []).length * 16 + (story.testOutcome ? 18 : 0) + 20;
      if (doc.y + estimatedH > A4_H - FTR_H - 30) {
        doc.addPage();
        drawRunningHeader(doc, releaseName, brandColor);
      }
      const drawn = drawStoryCard(doc, story, brandColor);
      // If card didn't fit (returned null), add page and retry
      if (drawn === null) {
        doc.addPage();
        drawRunningHeader(doc, releaseName, brandColor);
        drawStoryCard(doc, story, brandColor);
      }
    }
    doc.moveDown(0.5);
  }

  // ── 5. Quality Gates ─────────────────────────────────────────────────────────
  doc.addPage();
  drawRunningHeader(doc, releaseName, brandColor);
  drawQualityGates(doc, data.qualityGates || {}, brandColor);

  // ── 6. Known Issues ──────────────────────────────────────────────────────────
  if ((data.knownIssues || []).length > 0) {
    subHeading(doc, '4. Known Issues & Limitations', C_DARK);
    for (const issue of data.knownIssues) bulletItem(doc, issue);
    doc.moveDown(0.4);
  }

  // ── 7. Deployment Notes ───────────────────────────────────────────────────────
  subHeading(doc, '5. Deployment Notes', C_DARK);
  bodyText(doc, data.deploymentNotes || 'No deployment steps required.');

  // ── 8. Rollback ───────────────────────────────────────────────────────────────
  subHeading(doc, '6. Rollback Procedure', C_DARK);
  bodyText(doc, data.rollback || 'N/A — no rollback required for this release.');

  // ── 9. Appendix ───────────────────────────────────────────────────────────────
  doc.addPage();
  drawRunningHeader(doc, releaseName, brandColor);
  drawAppendix(doc, data, brandColor);

  // ── Add footers to all pages via buffered-page iteration ──────────────────────
  const range      = doc.bufferedPageRange();
  const totalPages = range.count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(range.start + i);
    if (i > 0) {
      // Non-cover pages: add footer (running header already drawn inline)
      drawFooter(doc, i + 1, totalPages, companyName, brandColor);
    }
    // Cover page: footer is the bottom band, skip standard footer
  }

  doc.flushPages();
  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generate };
