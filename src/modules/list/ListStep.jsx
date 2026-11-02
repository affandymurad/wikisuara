import { useState, useRef } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { hasNonLatin, romanizationIssue } from '../../lib/script.js';
import './list.css';

export default function ListStep() {
  const { words, addWord, removeWord, clearWords, showToast } = useApp();
  const { t } = useT();

  const [wordInput, setWordInput] = useState('');
  const [romanInput, setRomanInput] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const wordRef = useRef(null);

  const isNonLatin = hasNonLatin(wordInput);
  const romanIssue = romanizationIssue(wordInput, romanInput);

  // Add exactly one word/phrase from the form; the Latin reading is required for non-Latin scripts
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    const issue = romanizationIssue(wordInput, romanInput);
    if (issue) {
      showToast(issue === 'notLatin' ? t('romanNotLatin') : t('listRomanRequired'), 'warn');
      return;
    }
    const result = addWord(wordInput, isNonLatin ? romanInput : '');
    if (result === 'duplicate') {
      showToast(t('listWordDuplicate'), 'warn');
      return;
    }
    showToast(t('listWordAdded', { word: wordInput.trim() }), 'success');
    setWordInput('');
    setRomanInput('');
    wordRef.current?.focus();
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
      lead={t('listLead')}
      stepNumber={4}
      nextDisabled={words.length === 0}
    >
      <div className="space-y-4">
        {/* Top Control Bar: Total count and Clear all */}
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

        {/* New word form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 space-y-3"
        >
          <div>
            <label htmlFor="wordInput" className="block text-sm font-bold text-[var(--ink)] mb-1.5">
              {t('listWordLabel')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="wordInput"
                ref={wordRef}
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder={t('listWordPlaceholder')}
                className="flex-1 text-base font-semibold"
                autoComplete="off"
              />
              <button type="submit" className="btn-primary text-sm py-2.5 px-5 cursor-pointer">
                + {t('listAddWordBtn')}
              </button>
            </div>
          </div>

          {/* Romanization: only shown (and required) when the word has non-Latin letters */}
          {isNonLatin && (
            <div>
              <label htmlFor="romanInput" className="block text-sm font-bold text-[var(--ink)] mb-1">
                {t('listRomanLabel')}
              </label>
              <div className="text-xs text-[var(--muted)] mb-2">{t('listRomanHint')}</div>
              <input
                id="romanInput"
                type="text"
                value={romanInput}
                onChange={(e) => setRomanInput(e.target.value)}
                placeholder={t('listRomanPlaceholder')}
                className="w-full text-base font-semibold"
                aria-required="true"
                aria-invalid={romanIssue === 'notLatin'}
                autoComplete="off"
              />
              {romanIssue === 'notLatin' && (
                <div role="alert" className="mt-1.5 text-xs font-semibold text-[var(--danger)]">{t('romanNotLatin')}</div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span>{t('listFormHint')}</span>
            <span>{t('listDuplicateIgnored')}</span>
          </div>
        </form>

        {/* Chips: show and remove only */}
        <div className="word-chip-container">
          {words.length === 0 && (
            <span className="text-sm text-[var(--muted)] px-1 py-0.5">{t('listEmptyState')}</span>
          )}
          {words.map((item) => (
            <span key={item.id} className="word-chip">
              <span>
                {item.text}
                {item.romanization && (
                  <span className="opacity-80 font-medium"> ({item.romanization})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeWord(item.id)}
                className="chip-remove"
                title={t('listDeleteItem')}
                aria-label={`Hapus ${item.text}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
