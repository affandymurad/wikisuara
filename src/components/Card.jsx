import { useState } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { useT } from '../lib/i18n.js';

export default function Card({
  eyebrow,
  title,
  lead,
  stepNumber,
  children,
  onNext,
  nextDisabled = false,
  showPrev = true,
  showNext = true,
  customActions = null,
}) {
  const { step, setStep, canGoNext, resetAllData } = useApp();
  const { t } = useT();

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (step < 6 && canGoNext(step)) {
      setStep(step + 1);
    }
  };

  const [isConfirmingRestart, setIsConfirmingRestart] = useState(false);

  const handleRestart = () => {
    resetAllData();
    setIsConfirmingRestart(false);
  };

  return (
    <div className="step-card relative">
      {/* Top Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && (
            <h2 className="mt-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              {title}
            </h2>
          )}
          {lead && <p className="mt-1 text-sm md:text-base text-[var(--muted)] max-w-2xl">{lead}</p>}
        </div>

        {stepNumber && (
          <div
            className="hidden sm:grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white font-extrabold text-sm shadow-md"
            style={{ boxShadow: '0 4px 14px rgba(45, 79, 156, .28)' }}
          >
            {stepNumber}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body">{children}</div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3">
        <div>
          {isConfirmingRestart ? (
            <div className="flex items-center gap-1.5 text-xs bg-[var(--surface)] p-1 rounded-lg border border-[var(--danger)]">
              <span className="font-bold text-[var(--danger)] px-1">Mulai ulang semua?</span>
              <button
                type="button"
                onClick={handleRestart}
                className="px-2 py-0.5 rounded bg-[var(--danger)] text-white font-bold"
              >
                Ya, Reset
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingRestart(false)}
                className="px-1.5 py-0.5 rounded hover:bg-[var(--soft)] text-[var(--muted)]"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingRestart(true)}
              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--danger)] transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[color-mix(in_srgb,var(--danger)_8%,transparent)]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{t('btnRestart')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {customActions}

          {showPrev && step > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="icon-btn"
            >
              ← {t('btnPrev')}
            </button>
          )}

          {showNext && step < 6 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={nextDisabled || !canGoNext(step)}
              className="btn-primary"
            >
              <span>{t('btnNext')}</span>
              <span>→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
