import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '../lib/i18n.js';

export default function AboutModal({ onClose }) {
  const { t } = useT();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl anim-rise"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 id="about-title" className="text-xl font-extrabold text-[var(--ink)]">
            {t('aboutTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('aboutClose')}
            className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--muted)]">
          <p>{t('aboutP1')}</p>
          <p>{t('aboutP2')}</p>
          <p>{t('aboutP3')}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-primary text-xs py-2 px-4 cursor-pointer">
            {t('aboutClose')}
          </button>
        </div>
      </div>
    </div>
  , document.body);
}
