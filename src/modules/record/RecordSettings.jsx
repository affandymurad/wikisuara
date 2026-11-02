import { useT } from '../../lib/i18n.js';
import { SILENCE_RANGE } from '../../lib/recordSettings.js';

/** Recording preferences: pause length before auto-stop, and manual vs hands-free next word. */
export default function RecordSettings({ silenceMs, autoAdvance, onSilenceChange, onAutoAdvanceChange, modeLocked }) {
  const { t, lang } = useT();
  const seconds = (silenceMs / 1000).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', { minimumFractionDigits: 1 });

  const modes = [
    { value: false, label: t('recModeManual'), hint: t('recModeManualHint') },
    { value: true, label: t('recModeAuto'), hint: t('recModeAutoHint') },
  ];

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 space-y-4">
      <div className="text-sm font-extrabold text-[var(--ink)]">{t('recSettingsTitle')}</div>

      {/* Silence length before auto-stop */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <label htmlFor="silenceRange" className="text-xs font-bold text-[var(--ink)]">
            {t('recSilenceLabel')}
          </label>
          <span className="font-mono text-xs font-extrabold text-[var(--brand-text)] bg-[var(--soft)] px-2.5 py-0.5 rounded-full">
            {seconds} {t('recSilenceUnit')}
          </span>
        </div>
        <input
          id="silenceRange"
          type="range"
          min={SILENCE_RANGE.min}
          max={SILENCE_RANGE.max}
          step={SILENCE_RANGE.step}
          value={silenceMs}
          onChange={(e) => onSilenceChange(Number(e.target.value))}
          className="w-full accent-[var(--brand)] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-[var(--muted)] mt-0.5">
          <span>{(SILENCE_RANGE.min / 1000).toFixed(1)}</span>
          <span>{(SILENCE_RANGE.max / 1000).toFixed(1)}</span>
        </div>
        <div className="text-xs text-[var(--muted)] mt-1">{t('recSilenceHint')}</div>
      </div>

      {/* After a recording: manual vs automatic next word */}
      <div>
        <div className="text-xs font-bold text-[var(--ink)] mb-1.5">{t('recModeLabel')}</div>
        <div role="radiogroup" aria-label={t('recModeLabel')} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {modes.map((m) => {
            const selected = autoAdvance === m.value;
            return (
              <button
                key={String(m.value)}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={modeLocked}
                onClick={() => onAutoAdvanceChange(m.value)}
                className={`text-left rounded-xl border p-3 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-[var(--brand)] bg-[var(--soft)] shadow-[0_0_0_2px_var(--ring)]'
                    : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--soft)]'
                }`}
              >
                <div className="text-sm font-bold text-[var(--ink)]">{m.label}</div>
                <div className="text-[11.5px] text-[var(--muted)] mt-0.5 leading-snug">{m.hint}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
