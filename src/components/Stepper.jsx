import { useApp } from '../state/AppContext.jsx';
import { useT } from '../lib/i18n.js';

export default function Stepper() {
  const { step, setStep, canGoNext } = useApp();
  const { t } = useT();

  const steps = [
    { num: 1, title: t('step1Title'), desc: t('step1Desc') },
    { num: 2, title: t('step2Title'), desc: t('step2Desc') },
    { num: 3, title: t('step3Title'), desc: t('step3Desc') },
    { num: 4, title: t('step4Title'), desc: t('step4Desc') },
    { num: 5, title: t('step5Title'), desc: t('step5Desc') },
    { num: 6, title: t('step6Title'), desc: t('step6Desc') },
  ];

  return (
    <nav aria-label="Alur langkah perekaman" className="w-full">
      {/* Mobile Horizontal Stepper */}
      <div className="lg:hidden mb-6 flex items-center justify-between gap-2 overflow-x-auto p-2 bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-sm">
        {steps.map((s) => {
          const isDone = s.num < step;
          const isActive = s.num === step;
          const isAccessible = s.num <= step || (s.num === step + 1 && canGoNext(step));

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => isAccessible && setStep(s.num)}
              disabled={!isAccessible}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--brand)] text-white shadow-sm'
                  : isDone
                  ? 'bg-[var(--soft)] text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--soft)_80%,var(--surface))]'
                  : 'text-[var(--muted)] opacity-50 cursor-not-allowed'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDone
                    ? 'bg-[var(--ok)] text-white'
                    : 'bg-[var(--line)] text-[var(--muted)]'
                }`}
              >
                {isDone ? '✓' : s.num}
              </span>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Stepper */}
      <div className="hidden lg:flex flex-col gap-3 sticky top-24">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-5 shadow-[var(--shadow-sm)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3 px-2">
            Langkah Perekaman
          </div>
          <ol className="flex flex-col gap-1.5">
            {steps.map((s) => {
              const isDone = s.num < step;
              const isActive = s.num === step;
              const isAccessible = s.num <= step || (s.num === step + 1 && canGoNext(step));

              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => isAccessible && setStep(s.num)}
                    disabled={!isAccessible}
                    className={`w-full text-left flex items-start gap-3.5 p-3 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[var(--soft)] to-[color-mix(in_srgb,var(--soft)_40%,var(--surface))] border border-[color-mix(in_srgb,var(--brand-2)_25%,var(--line))] shadow-sm'
                        : isAccessible
                        ? 'hover:bg-[var(--soft)] cursor-pointer'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {/* Circle badge */}
                    <div
                      className={`flex-none mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-[var(--brand)] to-[var(--brand-2)] text-white ring-4 ring-[var(--ring)] shadow-sm'
                          : isDone
                          ? 'bg-[var(--ok-bg)] text-[var(--ok)] border border-[var(--ok)]'
                          : 'bg-[var(--soft)] text-[var(--muted)] border border-[var(--line)]'
                      }`}
                    >
                      {isDone ? '✓' : s.num}
                    </div>

                    {/* Step Title & Description */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-[14px] font-bold leading-tight ${
                          isActive
                            ? 'text-[var(--brand-text)]'
                            : isDone
                            ? 'text-[var(--ink)]'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[12px] text-[var(--muted)] mt-0.5 leading-snug truncate">
                        {s.desc}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </nav>
  );
}
