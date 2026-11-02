import { useState } from 'react';
import { useT } from '../../lib/i18n.js';
import { withRomanization } from '../../lib/script.js';
import { BABEL_LEVELS } from '../../lib/languages.js';
import { useApp } from '../../state/AppContext.jsx';
import { downloadBlob } from '../../lib/zip.js';
import { downloadAllAsZip } from './publishService.js';

export default function PublishPanel({ publishItems, onClose }) {
  const { t, lang: uiLang } = useT();
  const { showToast, deleteRecording, activeProfile, activeLanguage } = useApp();

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const describe = (item) => {
    const level = BABEL_LEVELS.find((b) => b.code === item.level) || BABEL_LEVELS[0];
    return t('pubDescription', {
      word: withRomanization(item.word, item.wordRoman),
      language: item.language,
      code: item.code,
      speaker: withRomanization(item.speaker, item.speakerRoman),
      level: level.code,
      levelTitle: uiLang === 'id' ? level.titleId : level.titleEn,
    });
  };

  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [copiedDescIndex, setCopiedDescIndex] = useState(null);

  // Clear: delete every recording in the list
  const handleClear = async () => {
    await Promise.all(publishItems.map((item) => deleteRecording(item.id)));
    setIsConfirmingClear(false);
    showToast(t('pubCleared'), 'info');
    onClose?.();
  };

  const handleCopyDescription = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDescIndex(index);
      setTimeout(() => setCopiedDescIndex(null), 2000);
    });
  };

  // Copy single filename
  const handleCopySingle = (filename, index) => {
    navigator.clipboard.writeText(filename).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  // Download the file list as a PDF report
  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      // Loaded on demand: the PDF library is large
      const { downloadFileListPdf } = await import('../../lib/pdfExport.js');
      await downloadFileListPdf({
        items: publishItems.map((item) => ({ ...item, description: describe(item) })),
        profile: activeProfile,
        language: activeLanguage,
        uiLang,
        t,
      });
    } catch (err) {
      console.error('PDF creation failed:', err);
      showToast('Gagal membuat PDF: ' + err.message, 'error');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Download single file
  const handleDownloadSingle = (item) => {
    downloadBlob(item.blob, item.filename);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    setZipProgress(0);
    try {
      await downloadAllAsZip(publishItems, (p) => setZipProgress(p));
    } catch (err) {
      console.error('ZIP creation failed:', err);
      showToast('Gagal membuat ZIP: ' + err.message, 'error');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="step-card mt-8 anim-rise" id="publish-panel">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <div className="eyebrow">{t('pubPanelTitle')}</div>
          <h3 className="text-2xl font-extrabold text-[var(--ink)] mt-1">
            {publishItems.length} Berkas WAV Siap Diunduh
          </h3>
          <p className="text-sm text-[var(--muted)] mt-1 max-w-2xl">
            {t('pubPanelDesc')}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="icon-btn text-xs py-1.5 px-3"
          >
            ✕ Tutup Panel
          </button>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 my-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Download ZIP */}
          <button
            type="button"
            onClick={handleDownloadAllZip}
            disabled={isZipping || publishItems.length === 0}
            className="btn-primary text-xs py-2 px-4 shadow-md"
          >
            <svg className="w-4 h-4 flex-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>
              {isZipping ? `${t('pubZipPreparing')} (${zipProgress}%)` : t('pubDownloadZipBtn')}
            </span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isPdfLoading || publishItems.length === 0}
            className="icon-btn text-xs py-2 px-3.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 18 15 15" />
            </svg>
            <span>{isPdfLoading ? t('pubPdfPreparing') : t('pubPdfBtn')}</span>
          </button>
        </div>

        {/* Clear list */}
        {isConfirmingClear ? (
          <div className="flex items-center gap-1.5 text-xs bg-[var(--surface)] p-1 rounded-lg border border-[var(--danger)]">
            <span className="font-bold text-[var(--danger)] px-1">{t('pubClearConfirm')}</span>
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded bg-[var(--danger)] text-white font-bold cursor-pointer"
            >
              {t('pubClearYes')}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmingClear(false)}
              className="px-1.5 py-0.5 rounded hover:bg-[var(--soft)] text-[var(--muted)] cursor-pointer"
            >
              {t('pubClearCancel')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingClear(true)}
            disabled={publishItems.length === 0}
            className="icon-btn text-xs py-2 px-3 text-[var(--danger)]"
          >
            🗑 {t('pubClearBtn')}
          </button>
        )}
      </div>

      {/* Clean Table */}
      <div className="clean-table-container">
        <table className="clean-table">
          <thead>
            <tr>
              <th className="col-num">{t('pubColNo')}</th>
              <th>{t('pubColFileName')}</th>
              <th>Kata</th>
              <th>{t('pubColDescription')}</th>
              <th>{t('pubColDuration')}</th>
              <th>{t('pubColSize')}</th>
              <th className="text-right">{t('pubColAction')}</th>
            </tr>
          </thead>
          <tbody>
            {publishItems.map((item, idx) => {
              const isCopied = copiedIndex === idx;
              return (
                <tr key={item.id}>
                  <td className="col-num">{item.index}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="filename-cell text-[var(--ink)] font-semibold select-all">
                        {item.filename}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySingle(item.filename, idx)}
                        className="text-[11px] text-[var(--brand-text)] hover:underline flex-none cursor-pointer"
                        title={t('pubCopySingleName')}
                      >
                        {isCopied ? '✓' : '⧉'}
                      </button>
                    </div>
                  </td>
                  <td className="font-semibold text-sm text-[var(--ink)]">
                    {withRomanization(item.word, item.wordRoman)}
                  </td>
                  <td className="text-xs text-[var(--ink)] min-w-[220px]">
                    <div className="flex items-start gap-2">
                      <span className="select-all">{describe(item)}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyDescription(describe(item), idx)}
                        className="text-[11px] text-[var(--brand-text)] hover:underline flex-none cursor-pointer"
                        title={t('pubCopySingleName')}
                      >
                        {copiedDescIndex === idx ? '✓' : '⧉'}
                      </button>
                    </div>
                  </td>
                  <td className="tabular-nums text-xs text-[var(--muted)] font-mono">
                    {item.duration.toFixed(2)}s
                  </td>
                  <td className="tabular-nums text-xs text-[var(--muted)] font-mono">
                    {(item.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item)}
                      className="icon-btn text-xs py-1.5 px-3"
                    >
                      ↓ {t('pubDownloadSingle')}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Privacy note */}
      <div className="hint mt-6">
        <svg className="w-4 h-4 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <div>{t('pubStorageNotice')}</div>
      </div>
    </div>
  );
}
