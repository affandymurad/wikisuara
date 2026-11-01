import { useState, useRef } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { readTextFile } from './listService.js';
import './list.css';

export default function ListStep() {
  const { words, addWordsRaw, removeWord, clearWords, showToast } = useApp();
  const { t } = useT();

  const [currentInput, setCurrentInput] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Commit text into chips
  const commitCurrentText = (textToCommit) => {
    const raw = textToCommit || currentInput;
    if (!raw.trim()) return;
    const added = addWordsRaw(raw);
    setCurrentInput('');
    if (added > 0) {
      showToast(`${added} kata ditambahkan!`, 'success');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitCurrentText();
    } else if (e.key === 'Backspace' && !currentInput && words.length > 0) {
      // Remove last word on backspace if input is empty
      removeWord(words[words.length - 1].id);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text');
    if (text && (text.includes('\n') || text.includes(',') || text.includes('#'))) {
      e.preventDefault();
      const added = addWordsRaw(text);
      if (added > 0) {
        showToast(`${added} kata diimpor dari tempelan teks!`, 'success');
      }
      setCurrentInput('');
    }
  };

  const handleBlur = () => {
    if (currentInput.trim()) {
      commitCurrentText();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsedItems = await readTextFile(file);
      if (parsedItems.length === 0) {
        showToast('Berkas tidak berisi kata yang valid.', 'warn');
        return;
      }
      const added = addWordsRaw(parsedItems.join('\n'));
      showToast(`${added} kata berhasil diimpor dari ${file.name}!`, 'success');
    } catch {
      showToast('Gagal membaca berkas .txt', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = () => {
    clearWords();
    setIsConfirmingClear(false);
    showToast('Semua kata telah dihapus.', 'info');
  };

  return (
    <Card
      eyebrow={t('listEyebrow')}
      title={t('listTitle')}
      lead="Masukkan kata atau frasa yang ingin direkam (pisahkan dengan baris baru atau koma). Setiap kata akan otomatis menjadi chip yang dapat dihapus."
      stepNumber={4}
      nextDisabled={words.length === 0}
    >
      <div className="space-y-4">
        {/* Top Control Bar: Total count, Clear all, and Import txt */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[var(--ink)]">
              {t('listTotalItems')}
            </span>
            <span className="rounded-full bg-[var(--soft)] px-3 py-0.5 text-xs font-extrabold text-[var(--brand-text)] border border-[var(--line)]">
              {words.length} kata
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileChange}
              className="hidden"
              id="txtFileInput"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="icon-btn text-xs py-1.5 px-3"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{t('listImportTxtBtn')}</span>
            </button>

            {words.length > 0 && (
              <div>
                {isConfirmingClear ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-[var(--danger)]">Hapus semua?</span>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="px-2.5 py-1 rounded-md bg-[var(--danger)] text-white font-bold"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingClear(false)}
                      className="px-2 py-1 rounded-md border border-[var(--line)] bg-[var(--surface)]"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingClear(true)}
                    className="text-xs font-semibold text-[var(--danger)] hover:underline px-2 py-1"
                  >
                    {t('listClearBtn')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chip Input Container */}
        <div
          className="word-chip-container"
          onClick={() => inputRef.current?.focus()}
        >
          {/* Removable chips */}
          {words.map((item) => (
            <span key={item.id} className="word-chip">
              <span>{item.text}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  removeWord(item.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    removeWord(item.id);
                  }
                }}
                className="chip-remove"
                title={t('listDeleteItem')}
                aria-label={`Hapus ${item.text}`}
              >
                ×
              </span>
            </span>
          ))}

          {/* Inline input */}
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={handleBlur}
            placeholder={
              words.length === 0
                ? 'Ketik kata lalu tekan Enter atau koma (mis. bayem, alay, rumah)...'
                : 'Tambah kata lagi (Enter / koma)...'
            }
            className="word-chip-input"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-[var(--muted)] pt-1">
          <span>Tekan <strong>Enter</strong> atau <strong>koma (,)</strong> untuk membuat chip baru. Tempel teks banyak baris didukung langsung.</span>
          <span>{t('listDuplicateIgnored')}</span>
        </div>
      </div>
    </Card>
  );
}
