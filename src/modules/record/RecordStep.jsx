import { useState, useRef, useEffect, useCallback } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { useRecorder } from './useRecorder.js';
import { useRecordShortcuts } from './recordShortcuts.js';
import './record.css';

export default function RecordStep() {
  const { words, recordings, saveRecording, deleteRecording, showToast, setStep } = useApp();
  const { t } = useT();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingWordId, setPlayingWordId] = useState(null);
  const audioPlayerRef = useRef(null);

  const finishRef = useRef(null);
  const {
    isRecording,
    recordingDuration,
    audioLevel,
    startRecording,
    stopRecording,
    error: recError,
  } = useRecorder({ onSilence: () => finishRef.current?.(true) });

  const currentWord = words[currentIndex] || null;
  const currentRecording = currentWord ? recordings[currentWord.id] : null;

  const recordedCount = words.filter((w) => Boolean(recordings[w.id])).length;
  const totalCount = words.length;

  // Stop, save and mark the word as recorded. Never moves to another word.
  const isFinishingRef = useRef(false);
  const finishRecording = useCallback(async (auto = false) => {
    if (!currentWord || isFinishingRef.current) return;
    isFinishingRef.current = true;
    try {
      const result = await stopRecording();
      if (!result || !result.blob) return;
      const saved = await saveRecording(currentWord.id, result.blob, result.duration);
      if (!saved.success) {
        if (saved.error === 'too_short') {
          showToast(t('recTooShortWarning'), 'warn');
        } else {
          showToast('Gagal memproses audio WAV: ' + saved.error, 'error');
        }
      } else {
        showToast(
          `Rekaman "${currentWord.text}" tersimpan${auto ? ' otomatis' : ''} (${saved.duration.toFixed(1)}s)`,
          'success'
        );
      }
    } finally {
      isFinishingRef.current = false;
    }
  }, [currentWord, stopRecording, saveRecording, showToast, t]);

  useEffect(() => {
    finishRef.current = finishRecording;
  }, [finishRecording]);

  // Toggle record logic
  const handleToggleRecord = useCallback(async () => {
    if (!currentWord) return;

    if (isRecording) {
      await finishRecording(false);
    } else {
      // Stop any playback first
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setPlayingWordId(null);
      }
      const ok = await startRecording();
      if (!ok) {
        showToast('Gagal mengaktifkan mikrofon. Periksa izin mikrofon Anda.', 'error');
      }
    }
  }, [currentWord, isRecording, finishRecording, startRecording, showToast]);

  const handleNextWord = useCallback(() => {
    if (isRecording) return;
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, words.length, isRecording]);

  const handlePrevWord = useCallback(() => {
    if (isRecording) return;
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, isRecording]);

  // Hook shortcuts: Space to record/stop, Arrows for navigation
  useRecordShortcuts({
    onToggleRecord: handleToggleRecord,
    onNextWord: handleNextWord,
    onPrevWord: handlePrevWord,
    enabled: Boolean(currentWord),
  });

  // Play audio helper
  const handlePlayAudio = (wordId, blob) => {
    if (!blob) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1;
    audioPlayerRef.current = audio;
    setPlayingWordId(wordId);

    audio.onended = () => {
      setPlayingWordId(null);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => {
      setPlayingWordId(null);
      URL.revokeObjectURL(url);
    };
    audio.play();
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  if (words.length === 0) {
    return (
      <Card eyebrow={t('recEyebrow')} title={t('recTitle')} stepNumber={5}>
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Belum ada kata dalam daftar. Silakan kembali ke Langkah 4 untuk menambahkan kata.
        </div>
      </Card>
    );
  }

  return (
    <Card
      eyebrow={t('recEyebrow')}
      title={t('recTitle')}
      lead={t('recLead')}
      stepNumber={5}
      nextDisabled={recordedCount === 0}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
        {/* Left Panel: Word List with status & controls (col 5) */}
        <div className="lg:col-span-5 min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm flex flex-col max-h-[420px] lg:max-h-[560px]">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[var(--line)]">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              {t('recItemListTitle')}
            </span>
            <span className="font-mono text-xs font-extrabold text-[var(--brand-text)] bg-[var(--soft)] px-2.5 py-0.5 rounded-full">
              {recordedCount} / {totalCount}
            </span>
          </div>

          {/* List items scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
            {words.map((w, idx) => {
              const isSelected = idx === currentIndex;
              const hasRec = Boolean(recordings[w.id]);
              const isPlaying = playingWordId === w.id;

              return (
                <div
                  key={w.id}
                  onClick={() => {
                    if (!isRecording) setCurrentIndex(idx);
                  }}
                  className={`rec-word-item flex items-center justify-between gap-2 p-2.5 rounded-xl border text-sm cursor-pointer ${
                    isSelected
                      ? 'active'
                      : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-full text-[10px] font-bold grid place-items-center flex-none ${
                        hasRec
                          ? 'bg-[var(--ok)] text-white'
                          : 'bg-[var(--soft)] text-[var(--muted)]'
                      }`}
                    >
                      {hasRec ? '✓' : idx + 1}
                    </span>
                    <span className="font-semibold text-[var(--ink)] truncate">
                      {w.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-none" onClick={(e) => e.stopPropagation()}>
                    {hasRec && (
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(w.id, recordings[w.id]?.blob)}
                        className={`p-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          isPlaying
                            ? 'bg-[var(--brand)] text-white'
                            : 'hover:bg-[var(--soft)] text-[var(--brand-text)]'
                        }`}
                        title="Putar rekaman"
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                    )}
                    {hasRec && (
                      <button
                        type="button"
                        onClick={() => {
                          deleteRecording(w.id);
                          showToast(`Audio "${w.text}" dihapus`, 'info');
                        }}
                        className="p-1 rounded-md text-[11px] text-[var(--muted)] hover:text-[var(--danger)] cursor-pointer"
                        title={t('recDeleteAudioBtn')}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Active recording console with BIG WORD (col 7) */}
        <div className="lg:col-span-7 min-w-0 flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8 shadow-sm flex flex-col items-center justify-center text-center min-h-[380px] relative">
            {/* Top Index & Status */}
            <div className="w-full flex items-center justify-between text-xs text-[var(--muted)] font-semibold mb-6">
              <span className="font-mono">
                Kata ke-{currentIndex + 1} dari {totalCount}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isRecording
                    ? 'bg-red-50 text-[var(--danger)] border border-red-300 animate-pulse'
                    : currentRecording
                    ? 'bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok)]'
                    : 'bg-[var(--soft)] text-[var(--muted)]'
                }`}
              >
                {isRecording ? '● SEDANG MEREKAM...' : currentRecording ? t('recStatusRecorded') : t('recStatusUnrecorded')}
              </span>
            </div>

            {/* Big Word Display */}
            <div className="my-auto py-6">
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--ink)] select-all"
                style={{ wordBreak: 'break-word' }}
              >
                {currentWord?.text}
              </div>

              {/* Dynamic volume / duration feedback */}
              {isRecording ? (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="font-mono text-sm font-bold text-[var(--danger)]">
                    Durasi: {recordingDuration.toFixed(1)} detik
                  </div>
                  {/* Live Audio Meter Bar */}
                  <div className="w-48 h-2 rounded-full bg-[var(--soft)] border border-[var(--line)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--brand)] to-[var(--danger)] transition-all duration-75 rounded-full"
                      style={{ width: `${Math.max(5, audioLevel)}%` }}
                    />
                  </div>
                </div>
              ) : currentRecording ? (
                <div className="mt-3 text-xs font-mono font-bold text-[var(--brand-text)]">
                  Durasi: {currentRecording.duration?.toFixed(2)} detik · {(currentRecording.size / 1024).toFixed(1)} KB
                </div>
              ) : null}
            </div>

            {/* Recording Controls */}
            <div className="w-full flex flex-col items-center gap-4 mt-6">
              {/* Record Button */}
              <button
                type="button"
                onClick={handleToggleRecord}
                className={`px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-3 transition-all cursor-pointer shadow-lg ${
                  isRecording
                    ? 'bg-[var(--danger)] text-white rec-btn-pulse shadow-[rgba(220,53,69,0.35)]'
                    : 'btn-primary'
                }`}
              >
                <span
                  className={`h-4 w-4 rounded-full ${
                    isRecording ? 'bg-white' : 'bg-red-400'
                  }`}
                />
                <span>{isRecording ? t('recStopBtn') : currentRecording ? t('recReRecordBtn') : t('recStartBtn')}</span>
                {isRecording && (
                  <span className="font-mono font-bold text-xs bg-black/20 px-2 py-0.5 rounded-md">
                    {recordingDuration.toFixed(1)}s
                  </span>
                )}
              </button>

              {/* Prev / Next controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 w-full pt-4 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={handlePrevWord}
                  disabled={currentIndex === 0 || isRecording}
                  className="icon-btn text-xs py-2 px-3"
                >
                  ← {t('recPrevWordBtn')}
                </button>

                {currentRecording && (
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(currentWord.id, currentRecording.blob)}
                    className="icon-btn text-xs py-2 px-4"
                  >
                    ▶ {t('recPlayBtn')}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNextWord}
                  disabled={currentIndex >= words.length - 1 || isRecording}
                  className="icon-btn text-xs py-2 px-3"
                >
                  {t('recNextWordBtn')} →
                </button>
              </div>
            </div>
          </div>

          {/* Shortcuts Legend */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
            <span className="font-bold text-[var(--ink)]">{t('recShortcutsTitle')}</span>
            <div className="flex flex-wrap gap-2">
              <span className="bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--line)] font-mono">
                {t('recShortcutSpace')}
              </span>
              <span className="bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--line)] font-mono">
                {t('recShortcutRight')}
              </span>
            </div>
          </div>

          {/* Error Banner with helpful recovery */}
          {recError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-2">
              <div className="font-bold text-sm">Perekaman Gagal: {recError}</div>
              <div>
                Pastikan izin mikrofon telah diberikan di peramban. Anda dapat membuka <strong>Langkah 3 (Cek Perangkat)</strong> untuk menguji mikrofon terlebih dahulu.
              </div>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-danger text-xs py-1.5 px-3 mt-1"
              >
                Ke Langkah 3 (Cek Perangkat) →
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
