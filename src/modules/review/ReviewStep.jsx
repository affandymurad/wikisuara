import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import PublishPanel from './PublishPanel.jsx';
import { preparePublishList } from './publishService.js';
import './review.css';

export default function ReviewStep() {
  const { words, recordings, activeProfile, activeLanguage, showToast } = useApp();
  const { t } = useT();

  // Words that actually have recordings
  const recordedWords = useMemo(() => {
    return words.filter((w) => Boolean(recordings[w.id]));
  }, [words, recordings]);

  // Selected for publish state (default: all recorded words are checked)
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set(recordedWords.map((w) => w.id));
  });

  // Keep selectedIds in sync if recordedWords change
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set();
      recordedWords.forEach((w) => {
        if (prev.has(w.id) || prev.size === 0) {
          next.add(w.id);
        }
      });
      return next;
    });
  }, [recordedWords]);

  // Active audio player selection
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayAllActive, setIsPlayAllActive] = useState(false);
  const [showPublishPanel, setShowPublishPanel] = useState(false);

  const audioRef = useRef(null);
  const playAllIndexRef = useRef(0);

  const activeWord = recordedWords[activeIndex] || null;
  const activeRecording = activeWord ? recordings[activeWord.id] : null;

  // Toggle selection
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === recordedWords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(recordedWords.map((w) => w.id)));
    }
  };

  // Single audio playback
  const handlePlayCurrent = useCallback(() => {
    if (!activeRecording?.blob) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const url = URL.createObjectURL(activeRecording.blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(url);
    };

    audio.play();
  }, [activeRecording]);

  const handleStopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPlayAllActive(false);
  };

  // "Putar semua" sequential playback for checked recordings
  const playNextInSequence = useCallback((list, idx) => {
    if (idx >= list.length) {
      setIsPlayAllActive(false);
      setIsPlaying(false);
      return;
    }

    playAllIndexRef.current = idx;
    const targetWord = list[idx];
    const rec = recordings[targetWord.id];
    if (!rec?.blob) {
      playNextInSequence(list, idx + 1);
      return;
    }

    // Set active item for visual feedback
    const wordIdx = recordedWords.findIndex((w) => w.id === targetWord.id);
    if (wordIdx !== -1) setActiveIndex(wordIdx);

    const url = URL.createObjectURL(rec.blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.onended = () => {
      URL.revokeObjectURL(url);
      // Short pause between words
      setTimeout(() => {
        playNextInSequence(list, idx + 1);
      }, 300);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      playNextInSequence(list, idx + 1);
    };

    audio.play();
  }, [recordings, recordedWords]);

  const handleTogglePlayAll = () => {
    if (isPlayAllActive) {
      handleStopPlayback();
    } else {
      const selectedWords = recordedWords.filter((w) => selectedIds.has(w.id));
      if (selectedWords.length === 0) {
        showToast('Pilih minimal 1 rekaman untuk diputar.', 'warn');
        return;
      }
      setIsPlayAllActive(true);
      playNextInSequence(selectedWords, 0);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Publish list data
  const publishItems = useMemo(() => {
    return preparePublishList(words, recordings, selectedIds, activeProfile, activeLanguage);
  }, [words, recordings, selectedIds, activeProfile, activeLanguage]);

  const isQidFilled = Boolean(activeLanguage?.qid?.trim() && activeLanguage?.code?.trim());
  const canPublish = isQidFilled && publishItems.length > 0;

  const handlePublishClick = () => {
    if (!canPublish) {
      showToast(t('revPublishDisabledReason'), 'warn');
      return;
    }
    setShowPublishPanel(true);
    // Smooth scroll down to publish table
    setTimeout(() => {
      document.getElementById('publish-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  if (recordedWords.length === 0) {
    return (
      <Card eyebrow={t('revEyebrow')} title={t('revTitle')} stepNumber={6} showNext={false}>
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          {t('revNoRecordings')}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card
        eyebrow={t('revEyebrow')}
        title={t('revTitle')}
        lead={t('revLead')}
        stepNumber={6}
        showNext={false}
        customActions={
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={!canPublish}
            title={!canPublish ? t('revPublishDisabledReason') : ''}
            className="btn-primary text-sm py-2.5 px-6 shadow-md cursor-pointer"
          >
            <span>{t('revPublishBtn')}</span>
            <span>✓</span>
          </button>
        }
      >
        <div className="space-y-6">
          {/* Validation warning if QID is missing */}
          {!isQidFilled && (
            <div className="alert-warning">
              <svg className="w-5 h-5 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>{t('revPublishDisabledReason')}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Checkbox list with Select All (col 6) */}
            <div className="lg:col-span-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm flex flex-col h-[460px]">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--line)]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAllCheckbox"
                    checked={selectedIds.size === recordedWords.length && recordedWords.length > 0}
                    onChange={handleSelectAll}
                    className="accent-[var(--brand)] w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="selectAllCheckbox" className="text-xs font-bold text-[var(--ink)] cursor-pointer">
                    {selectedIds.size === recordedWords.length ? t('revUnselectAll') : t('revSelectAll')}
                  </label>
                </div>
                <span className="text-xs text-[var(--muted)] font-mono font-bold">
                  {selectedIds.size} / {recordedWords.length} terpilih
                </span>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {recordedWords.map((w, idx) => {
                  const isChecked = selectedIds.has(w.id);
                  const isSelectedForPlay = idx === activeIndex;
                  const rec = recordings[w.id];

                  return (
                    <div
                      key={w.id}
                      onClick={() => setActiveIndex(idx)}
                      className={`review-item flex items-center justify-between gap-3 p-2.5 rounded-xl border text-sm cursor-pointer ${
                        isSelectedForPlay
                          ? 'active'
                          : 'border-[var(--line)] bg-[var(--surface)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(w.id);
                          }}
                          className="accent-[var(--brand)] w-4 h-4 cursor-pointer flex-none"
                        />
                        <span className="font-semibold text-[var(--ink)] truncate">
                          {w.text}
                          {w.romanization && <span className="font-medium text-[var(--muted)]"> ({w.romanization})</span>}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
                        <span>{rec?.duration?.toFixed(1)}s</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Audio Player & Sequential Player (col 6) */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                  {t('revPlayerTitle')}
                </div>

                <div
                  className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] my-3 max-w-full truncate"
                  title={activeWord?.text}
                >
                  {activeWord?.text}
                </div>

                <div className="text-xs font-mono text-[var(--brand-text)] mb-6 font-bold">
                  {activeRecording?.duration?.toFixed(2)} detik · {((activeRecording?.size || 0) / 1024).toFixed(1)} KB
                </div>

                {/* Player button */}
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={isPlaying ? handleStopPlayback : handlePlayCurrent}
                    className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white grid place-items-center text-xl shadow-lg shadow-[rgba(45,79,156,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                </div>

                {/* Prev / Next item */}
                <div className="flex items-center justify-between w-full pt-4 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeIndex > 0) setActiveIndex(activeIndex - 1);
                    }}
                    disabled={activeIndex === 0}
                    className="icon-btn text-xs py-1.5 px-3"
                  >
                    ← Sebelumnya
                  </button>

                  <span className="text-xs font-mono text-[var(--muted)]">
                    {activeIndex + 1} / {recordedWords.length}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeIndex < recordedWords.length - 1) setActiveIndex(activeIndex + 1);
                    }}
                    disabled={activeIndex >= recordedWords.length - 1}
                    className="icon-btn text-xs py-1.5 px-3"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>

              {/* Play All button */}
              <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-4 flex items-center justify-between gap-3">
                <div className="text-xs font-medium text-[var(--ink)]">
                  Dengarkan seluruh rekaman yang dicentang secara otomatis:
                </div>
                <button
                  type="button"
                  onClick={handleTogglePlayAll}
                  className={`icon-btn text-xs py-2 px-4 flex-none font-bold ${
                    isPlayAllActive ? 'bg-[var(--brand)] text-white' : ''
                  }`}
                >
                  {isPlayAllActive ? t('revStopPlayAllBtn') : `▶ ${t('revPlayAllBtn')}`}
                </button>
              </div>

              {/* Publish info box */}
              <div className="p-4 rounded-xl border border-[color-mix(in_srgb,var(--brand-2)_20%,var(--line))] bg-[color-mix(in_srgb,var(--soft)_60%,var(--surface))] text-xs text-[var(--muted)]">
                {t('revPublishHint')}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* When Publish is triggered, show WAV File List Panel */}
      {showPublishPanel && (
        <PublishPanel
          publishItems={publishItems}
          onClose={() => setShowPublishPanel(false)}
        />
      )}
    </div>
  );
}
