import { useState } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { BABEL_LEVELS } from '../../lib/languages.js';
import { lookupLanguage, validateLanguageEntry } from './languageService.js';
import './languages.css';

export default function LanguagesStep() {
  const {
    languages,
    activeLanguageId,
    activeLanguage,
    setActiveLanguageId,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    showToast,
  } = useApp();
  const { t, lang: currentUiLang } = useT();

  // Search & add new language state
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [formName, setFormName] = useState('');
  const [formQid, setFormQid] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formLevel, setFormLevel] = useState('N');

  // Deletion state without window.confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Handle Wikidata live search
  const handleSearchWikidata = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await lookupLanguage(searchQuery, currentUiLang);
      setSearchResults(results);
      if (results.length === 0) {
        showToast(t('langSearchEmpty'), 'info');
      }
    } catch {
      showToast('Gagal mencari di Wikidata', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setFormName(result.label || searchQuery);
    setFormQid(result.qid);
    setFormCode(result.code || '');
  };

  const handleSaveNewLanguage = (e) => {
    e.preventDefault();
    const entry = {
      name: formName.trim(),
      qid: formQid.trim().toUpperCase(),
      code: formCode.trim().toLowerCase(),
      level: formLevel,
    };

    const validation = validateLanguageEntry(entry);
    if (!validation.valid) {
      showToast(validation.error, 'warn');
      return;
    }

    addLanguage(entry);
    showToast(`Bahasa ${entry.name} (${entry.code}-${entry.level}) ditambahkan!`, 'success');
    // Reset form
    setIsAdding(false);
    setSearchQuery('');
    setSearchResults([]);
    setFormName('');
    setFormQid('');
    setFormCode('');
    setFormLevel('N');
  };

  const handleDeleteLanguage = (id, name) => {
    const success = deleteLanguage(id);
    if (success) {
      setConfirmDeleteId(null);
      showToast(`Bahasa ${name} telah dihapus.`, 'info');
    }
  };

  const isQidValid = Boolean(activeLanguage?.qid?.trim() && activeLanguage?.code?.trim());
  // With no saved language the add form is always open, so the step is never a blank page
  const showAddForm = isAdding || languages.length === 0;

  return (
    <Card
      eyebrow={t('langEyebrow')}
      title={t('langTitle')}
      lead={t('langLead')}
      stepNumber={2}
      nextDisabled={!isQidValid}
    >
      <div className="space-y-6">
        {/* Warning if QID/code missing */}
        {languages.length === 0 && (
          <div className="hint !my-0">
            <svg className="w-4 h-4 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <div>{t('langEmptyState')}</div>
          </div>
        )}
        {languages.length > 0 && !isQidValid && (
          <div className="alert-warning">
            <svg className="w-5 h-5 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>{t('langRequiredQidWarning')}</div>
          </div>
        )}

        {/* Section 1: Pick Active Recording Language (Tiles with Babel badges) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--ink)] uppercase tracking-wider">
              {t('langActiveSectionTitle')}
            </h3>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="icon-btn text-xs py-1.5 px-3"
              >
                + {t('langAddBtn')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map((l) => {
              const isSelected = l.id === activeLanguageId;
              const babel = BABEL_LEVELS.find((b) => b.code === l.level) || BABEL_LEVELS[0];
              const isConfirming = confirmDeleteId === l.id;

              return (
                <div
                  key={l.id}
                  onClick={() => setActiveLanguageId(l.id)}
                  className={`lang-tile group relative ${isSelected ? 'selected' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-extrabold text-[var(--ink)] leading-tight">
                        {l.name}
                      </div>
                      {l.nativeName && l.nativeName !== l.name && (
                        <div className="text-xs text-[var(--muted)] font-medium mt-0.5">
                          {l.nativeName}
                        </div>
                      )}
                    </div>

                    {/* Inline Delete Button (available if >1 language) */}
                    {(
                      <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--danger)] shadow-md text-[11px] animate-[pop_0.15s_ease-out]">
                            <button
                              type="button"
                              onClick={() => handleDeleteLanguage(l.id, l.name)}
                              className="px-2 py-0.5 rounded bg-[var(--danger)] text-white font-bold hover:opacity-90"
                            >
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 rounded hover:bg-[var(--soft)] text-[var(--muted)]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(l.id)}
                            className="h-6 w-6 rounded-md text-[var(--muted)] hover:text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] grid place-items-center text-xs font-bold transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                            title="Hapus bahasa ini"
                            aria-label={`Hapus bahasa ${l.name}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    {/* MediaWiki Babel Badge: e.g. id-N, en-3 */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="babel-badge font-mono font-extrabold text-[11px] px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: 'var(--soft)',
                          color: babel.color,
                          borderColor: 'color-mix(in srgb, currentColor 30%, var(--line))',
                        }}
                        title={`${l.code}-${babel.code}: ${currentUiLang === 'id' ? babel.descId : babel.descEn}`}
                      >
                        {l.code}-{babel.code}
                      </span>
                      <span className="font-mono text-[10.5px] text-[var(--muted)]">
                        {l.qid || 'Tanpa QID'}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-[var(--muted)] truncate max-w-[120px]" title={currentUiLang === 'id' ? babel.titleId : babel.titleEn}>
                      {currentUiLang === 'id' ? babel.titleId : babel.titleEn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Active Language Details & MediaWiki Babel Proficiency Selector */}
        {activeLanguage && (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--soft)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-text)]">
                  {t('langActiveNotice')}
                </span>
                <span className="text-base font-extrabold text-[var(--ink)]">{activeLanguage.name}</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--brand-text)] border border-[var(--line)]">
                  {activeLanguage.code}-{activeLanguage.level || 'N'}
                </span>
              </div>

              {(
                <div>
                  {confirmDeleteId === activeLanguage.id ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-bold text-[var(--danger)]">Yakin hapus?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLanguage(activeLanguage.id, activeLanguage.name)}
                        className="px-2 py-1 rounded bg-[var(--danger)] text-white font-bold"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 rounded border border-[var(--line)] bg-[var(--surface)]"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activeLanguage.id)}
                      className="text-xs font-bold text-[var(--danger)] hover:underline cursor-pointer"
                    >
                      Hapus Bahasa Ini
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  {t('langQidInput')}
                </label>
                <input
                  type="text"
                  value={activeLanguage.qid || ''}
                  onChange={(e) => updateLanguage(activeLanguage.id, { qid: e.target.value.trim().toUpperCase() })}
                  placeholder="Q9240"
                  className="font-mono text-sm uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  {t('langCodeInput')}
                </label>
                <input
                  type="text"
                  value={activeLanguage.code || ''}
                  onChange={(e) => updateLanguage(activeLanguage.id, { code: e.target.value.trim().toLowerCase() })}
                  placeholder="id"
                  className="font-mono text-sm lowercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                  Kemahiran Babel (MediaWiki)
                </label>
                <select
                  value={activeLanguage.level || 'N'}
                  onChange={(e) => updateLanguage(activeLanguage.id, { level: e.target.value })}
                  className="text-xs font-semibold"
                >
                  {BABEL_LEVELS.map((lvl) => (
                    <option key={lvl.code} value={lvl.code}>
                      {activeLanguage.code}-{lvl.code} : {currentUiLang === 'id' ? lvl.titleId : lvl.titleEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description of active Babel level */}
            {(() => {
              const activeBabel = BABEL_LEVELS.find((b) => b.code === activeLanguage.level) || BABEL_LEVELS[0];
              return (
                <div className="mt-3 pt-2.5 border-t border-[color-mix(in_srgb,var(--line)_70%,transparent)] text-xs text-[var(--muted)] leading-relaxed">
                  <strong className="text-[var(--ink)]">{activeLanguage.code}-{activeBabel.code} ({currentUiLang === 'id' ? activeBabel.titleId : activeBabel.titleEn}):</strong>{' '}
                  {currentUiLang === 'id' ? activeBabel.descId : activeBabel.descEn}
                </div>
              );
            })()}
          </div>
        )}

        {/* Section 3: Add Language Modal/Form with Wikidata lookup */}
        {showAddForm && (
          <div className="rounded-2xl border-2 border-[var(--brand)] bg-[var(--surface)] p-5 shadow-lg space-y-4 animate-[rise_0.2s_ease-out]">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <h3 className="font-extrabold text-base text-[var(--ink)]">{t('langAddBtn')}</h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-sm text-[var(--muted)] hover:text-[var(--ink)] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Wikidata search bar */}
            <div>
              <label className="block text-xs font-bold text-[var(--muted)] mb-1">
                Cari Bahasa di Wikidata (Otomatis)
              </label>
              <div className="text-[11px] text-[var(--muted)] mb-1.5">{t('langSearchHint')}</div>
              <form onSubmit={handleSearchWikidata} className="flex gap-2">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('langSearchPlaceholder')}
                  className="text-sm"
                />
                <button type="submit" disabled={isSearching} className="btn-primary text-xs py-2 px-4">
                  {isSearching ? t('langSearching') : 'Cari'}
                </button>
              </form>
            </div>

            {/* Wikidata suggestions */}
            {searchResults.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[var(--soft)] rounded-xl border border-[var(--line)]">
                {searchResults.map((res) => (
                  <div
                    key={res.qid}
                    onClick={() => handleSelectSearchResult(res)}
                    className="p-2.5 rounded-lg bg-[var(--surface)] hover:border-[var(--brand-2)] border border-transparent cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[var(--ink)]">{res.label}</span>
                      <span className="ml-2 font-mono text-[var(--brand-text)] font-semibold">({res.qid})</span>
                      {res.code && <span className="ml-1 text-[var(--muted)]">[{res.code}]</span>}
                      {res.description && (
                        <div className="text-[11px] text-[var(--muted)]">{res.description}</div>
                      )}
                    </div>
                    <span className="icon-btn text-[11px] py-1 px-2.5">Pilih</span>
                  </div>
                ))}
              </div>
            )}

            {/* Manual input / correction */}
            <form onSubmit={handleSaveNewLanguage} className="space-y-3 pt-2">
              <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">
                {t('langManualTitle')}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    {t('langNameInput')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Sundanese / Bahasa Sunda"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    Kemahiran Babel (MediaWiki)
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="text-xs font-semibold"
                  >
                    {BABEL_LEVELS.map((lvl) => (
                      <option key={lvl.code} value={lvl.code}>
                        {formCode || 'xx'}-{lvl.code} : {currentUiLang === 'id' ? lvl.titleId : lvl.titleEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    {t('langQidInput')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formQid}
                    onChange={(e) => setFormQid(e.target.value.toUpperCase())}
                    placeholder="Contoh: Q34002"
                    className="font-mono text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--ink)] mb-1">
                    {t('langCodeInput')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toLowerCase())}
                    placeholder="Contoh: su"
                    className="font-mono text-sm lowercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="icon-btn text-xs py-2 px-4"
                >
                  {t('langCancelBtn')}
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {t('langSaveBtn')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}
