/**
 * PDF export of the WAV file list.
 * Visual format mirrors the Wikirekap PDF report: landscape A4, brand title band,
 * label/value details, summary tiles, grid table with running header and footer.
 * Roboto (Latin, Greek, Cyrillic, Vietnamese) is embedded; scripts outside the font
 * (e.g. Japanese, Arabic, Thai) are drawn through a canvas so they never break.
 */
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { BABEL_LEVELS } from './languages.js';

applyPlugin(jsPDF);

const PDF_COLORS = {
  brand: [45, 79, 156], ink: [12, 26, 54], muted: [82, 96, 128], line: [221, 228, 241],
  soft: [234, 239, 249], bg: [243, 246, 252], white: [255, 255, 255],
};

const BASE = import.meta.env.BASE_URL || '/';
const PDF_FONT_FILES = { normal: `${BASE}pdf-fonts/Roboto-Regular.ttf`, bold: `${BASE}pdf-fonts/Roboto-Bold.ttf` };
// Code points present in the embedded font; anything else goes through the canvas fallback
const PDF_GLYPH_RANGES = [[0x20,0x7E],[0xA0,0x2AF],[0x300,0x377],[0x37A,0x37F],[0x384,0x38A],[0x38C,0x38C],[0x38E,0x3A1],[0x3A3,0x3E1],[0x3F0,0x52F],[0x1E00,0x1F15],[0x1F18,0x1F1D],[0x1F20,0x1F45],[0x1F48,0x1F4D],[0x1F50,0x1F57],[0x1F59,0x1F59],[0x1F5B,0x1F5B],[0x1F5D,0x1F5D],[0x1F5F,0x1F7D],[0x1F80,0x1FB4],[0x1FB6,0x1FC4],[0x1FC6,0x1FD3],[0x1FD6,0x1FDB],[0x1FDD,0x1FEF],[0x1FF2,0x1FF4],[0x1FF6,0x1FFE],[0x2000,0x2027],[0x202F,0x205F],[0x20A0,0x20BE],[0x2100,0x2101],[0x2103,0x2103],[0x2105,0x2106],[0x2109,0x2109],[0x2113,0x2113],[0x2116,0x2117],[0x211E,0x2123],[0x2125,0x2126],[0x212A,0x212B],[0x212E,0x212E],[0x2132,0x2132],[0x213B,0x213B],[0x214D,0x214D],[0x214F,0x214F],[0x2191,0x2191],[0x2193,0x2193],[0x2202,0x2202],[0x2206,0x2206],[0x220F,0x220F],[0x2211,0x2212],[0x221A,0x221A],[0x221E,0x221E],[0x222B,0x222B],[0x2248,0x2248],[0x2260,0x2260],[0x2264,0x2265],[0x25CA,0x25CA]];

let pdfFontsPromise = null;

function hasUnsupportedGlyph(str) {
  for (const ch of String(str)) {
    const cp = ch.codePointAt(0);
    if (cp === 9 || cp === 10 || cp === 13) continue;
    if (!PDF_GLYPH_RANGES.some(([a, b]) => cp >= a && cp <= b)) return true;
  }
  return false;
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function loadPdfFonts() {
  if (!pdfFontsPromise) {
    pdfFontsPromise = Promise.all(Object.values(PDF_FONT_FILES).map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font ${url}: ${res.status}`);
      return arrayBufferToBase64(await res.arrayBuffer());
    })).then(([normal, bold]) => ({ normal, bold }))
      .catch((e) => { pdfFontsPromise = null; throw e; });
  }
  return pdfFontsPromise;
}

// Returns the font family in use: 'Roboto', or 'helvetica' if the font failed to load
async function registerPdfFonts(doc) {
  try {
    const f = await loadPdfFonts();
    doc.addFileToVFS('Roboto-Regular.ttf', f.normal);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFileToVFS('Roboto-Bold.ttf', f.bold);
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    return 'Roboto';
  } catch (e) {
    console.warn('PDF font failed to load, using the built-in font:', e);
    return 'helvetica';
  }
}

// Text outside the font is rendered to a canvas and placed as an image inside the cell
function drawCanvasCellText(doc, cell, lines) {
  const k = doc.internal.scaleFactor;
  const fontMm = cell.styles.fontSize / k;
  const lineMm = fontMm * (cell.styles.lineHeight || 1.15);
  const padL = cell.padding('left');
  const padT = cell.padding('top');
  const padR = cell.padding('right');
  const wMm = cell.width - padL - padR;
  const px = 8;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(wMm * px));
  canvas.height = Math.max(1, Math.round(lines.length * lineMm * px));
  const ctx = canvas.getContext('2d');
  const c = cell.styles.textColor;
  ctx.fillStyle = Array.isArray(c) ? `rgb(${c[0]},${c[1]},${c[2]})` : '#0c1a36';
  ctx.font = `${cell.styles.fontStyle === 'bold' ? '700 ' : '400 '}${fontMm * px}px "Segoe UI", "Noto Sans", "Noto Sans CJK JP", "Yu Gothic", "Hiragino Sans", "Malgun Gothic", "Microsoft YaHei", "Noto Sans Arabic", "Noto Sans Thai", sans-serif`;
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const w = ctx.measureText(line).width;
    ctx.save();
    ctx.translate(0, (i + 0.5) * lineMm * px);
    if (w > canvas.width) ctx.scale(canvas.width / w, 1);
    ctx.fillText(line, 0, 0);
    ctx.restore();
  });
  doc.addImage(canvas.toDataURL('image/png'), 'PNG', cell.x + padL, cell.y + padT, wMm, lines.length * lineMm);
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDuration(seconds) {
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${seconds.toFixed(1)}s`;
}

function utcOffsetLabel(date) {
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${hh}:${mm}`;
}

/**
 * @param {Object} opts
 * @param {Array} opts.items publish items (with .description, .filename, .word, .wordRoman, .duration, .size)
 * @param {Object} opts.profile active speaker profile
 * @param {Object} opts.language active language
 * @param {string} opts.uiLang 'id' | 'en'
 * @param {(key: string, vars?: Object) => string} opts.t translator
 */
export async function downloadFileListPdf({ items, profile, language, uiLang, t }) {
  const C = PDF_COLORS;
  const doc = new jsPDF({ orientation: 'landscape' });
  const pdfFont = await registerPdfFonts(doc);
  const canvasFallback = pdfFont === 'Roboto';

  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const M = 14;
  const contentW = pageW - M * 2;
  const TOP_NEXT = 22;
  const BOTTOM = pageH - 18;
  let yPos = 0;

  const text = (rgb) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const fill = (rgb) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const font = (style, size) => { doc.setFont(pdfFont, style); doc.setFontSize(size); };
  const ensureSpace = (needed) => {
    if (yPos + needed > BOTTOM) {
      doc.addPage();
      yPos = TOP_NEXT;
    }
  };

  const speakerName = profile.romanization?.trim()
    ? `${profile.name.trim()} (${profile.romanization.trim()})`
    : profile.name.trim();
  const level = BABEL_LEVELS.find((b) => b.code === language.level) || BABEL_LEVELS[0];
  const levelText = `${language.code}-${level.code} (${uiLang === 'id' ? level.titleId : level.titleEn})`;
  const languageText = `${language.name} (${language.code}, ${language.qid})`;

  // ---------- title band ----------
  fill(C.brand);
  doc.rect(0, 0, pageW, 32, 'F');
  font('bold', 21);
  text(C.white);
  doc.text('Wikisuara', M, 15);
  font('normal', 10.5);
  doc.text(t('pdfTitle'), M, 23.5);
  font('bold', 12);
  doc.text(language.name, pageW - M, 14, { align: 'right' });
  font('normal', 9.5);
  doc.text(`${language.code}-${level.code}`, pageW - M, 22, { align: 'right' });

  // ---------- details (two label/value columns) ----------
  const kv = (x, y, label, value, width) => {
    font('bold', 7.5);
    text(C.muted);
    doc.text(label.toUpperCase(), x, y);
    font('normal', 9.5);
    text(C.ink);
    const lines = doc.splitTextToSize(String(value), width);
    doc.text(lines, x, y + 4.8);
    return y + 4.8 + lines.length * 4.4 + 3.5;
  };

  const leftW = 150;
  const rightX = M + leftW + 10;
  const rightW = contentW - leftW - 10;
  let yl = 41;
  let yr = 41;
  yl = kv(M, yl, t('pdfSpeaker'), speakerName, leftW);
  yl = kv(M, yl, t('pdfLanguage'), languageText, leftW);
  yr = kv(rightX, yr, t('pdfLevel'), levelText, rightW);
  yr = kv(rightX, yr, t('pdfGenerated'), `${new Date().toLocaleString(uiLang === 'id' ? 'id-ID' : 'en-US', { dateStyle: 'long', timeStyle: 'short' })} (${utcOffsetLabel(new Date())})`, rightW);
  yPos = Math.max(yl, yr) + 1;

  // ---------- summary tiles ----------
  const totalDuration = items.reduce((sum, i) => sum + i.duration, 0);
  const totalSize = items.reduce((sum, i) => sum + i.size, 0);
  const tiles = [
    [String(items.length), t('pdfFiles')],
    [formatDuration(totalDuration), t('pdfTotalDuration')],
    [formatBytes(totalSize), t('pdfTotalSize')],
  ];
  const gap = 5;
  const tileW = (contentW - gap * (tiles.length - 1)) / tiles.length;
  ensureSpace(26);
  tiles.forEach(([value, label], i) => {
    const x = M + i * (tileW + gap);
    fill(C.soft);
    doc.roundedRect(x, yPos, tileW, 21, 3, 3, 'F');
    font('bold', 17);
    text(C.brand);
    doc.text(value, x + 5, yPos + 10.5);
    font('normal', 8.5);
    text(C.muted);
    doc.text(label, x + 5, yPos + 16.5);
  });
  yPos += 21 + 9;

  // ---------- section heading ----------
  ensureSpace(44);
  fill(C.brand);
  doc.roundedRect(M, yPos - 4.4, 1.6, 5.8, 0.8, 0.8, 'F');
  font('bold', 12.5);
  text(C.ink);
  doc.text(t('pubPanelTitle'), M + 4.5, yPos);
  yPos += 6;

  // ---------- table ----------
  const body = items.map((item) => [
    item.index,
    item.filename,
    item.wordRoman ? `${item.word} (${item.wordRoman})` : item.word,
    item.description,
    `${item.duration.toFixed(2)}s`,
    formatBytes(item.size),
  ]);

  doc.autoTable({
    theme: 'grid',
    styles: { font: pdfFont, fontSize: 8.5, cellPadding: 2.6, overflow: 'linebreak', halign: 'left', textColor: C.ink, lineColor: C.line, lineWidth: 0.2 },
    headStyles: { fillColor: C.brand, textColor: C.white, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: C.bg },
    margin: { top: TOP_NEXT, left: M, right: M, bottom: 18 },
    tableWidth: 'auto',
    head: [['#', t('pubColFileName'), t('pdfColWord'), t('pdfColDescription'), t('pubColDuration'), t('pubColSize')]],
    body,
    startY: yPos,
    columnStyles: {
      0: { cellWidth: 11, halign: 'right', textColor: C.muted },
      1: { cellWidth: 62 },
      2: { cellWidth: 34 },
      4: { cellWidth: 19, halign: 'right' },
      5: { cellWidth: 21, halign: 'right' },
    },
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didParseCell(data) {
      if (data.section === 'body') {
        data.cell.pdfCanvas = canvasFallback && hasUnsupportedGlyph(data.cell.raw);
      }
    },
    willDrawCell(data) {
      if (data.section === 'body' && data.cell.pdfCanvas) {
        data.cell.pdfLines = data.cell.text.slice();
        data.cell.text = [];
      }
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.cell.pdfLines) {
        drawCanvasCellText(doc, data.cell, data.cell.pdfLines);
      }
    },
  });
  yPos = doc.lastAutoTable.finalY + 8;

  // ---------- closing ----------
  ensureSpace(22);
  doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
  doc.setLineWidth(0.3);
  doc.line(M, yPos, pageW - M, yPos);
  yPos += 6;
  font('normal', 8.5);
  text(C.muted);
  const noteLines = doc.splitTextToSize(t('pdfNamingNote'), contentW);
  doc.text(noteLines, M, yPos);
  yPos += noteLines.length * 4.6;
  text(C.brand);
  doc.textWithLink('https://wikisuara.web.app', M, yPos, { url: 'https://wikisuara.web.app' });

  // ---------- running header + footer on every page ----------
  const totalPages = doc.internal.getNumberOfPages();
  const runningTitle = `Wikisuara  |  ${speakerName}  |  ${language.name}`;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) {
      font('normal', 8);
      text(C.muted);
      doc.text(doc.splitTextToSize(runningTitle, contentW)[0], M, 11);
      doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
      doc.setLineWidth(0.3);
      doc.line(M, 14, pageW - M, 14);
    }
    doc.setDrawColor(C.line[0], C.line[1], C.line[2]);
    doc.setLineWidth(0.3);
    doc.line(M, pageH - 13, pageW - M, pageH - 13);
    font('normal', 8);
    text(C.muted);
    doc.text(`Wikisuara  -  ${t('pdfGeneratedBy')}`, M, pageH - 8);
    doc.text(t('pdfPage', { p, n: totalPages }), pageW - M, pageH - 8, { align: 'right' });
  }

  const safe = (v) => String(v).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
  doc.save(`wikisuara-${safe(profile.romanization?.trim() || profile.name)}-${safe(language.code)}-${Date.now()}.pdf`);
}
