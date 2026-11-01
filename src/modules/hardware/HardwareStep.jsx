import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { useMicrophone } from './useMicrophone.js';
import Waveform from './Waveform.jsx';
import './hardware.css';

export default function HardwareStep() {
  const { setMicStatus: setGlobalMicStatus, setHasTestedMic } = useApp();
  const { t } = useT();

  const {
    micStatus,
    isTesting,
    audioLevel,
    error,
    analyserNode,
    startMicTest,
    stopMicTest,
    requestPermission,
  } = useMicrophone();

  const handleToggleTest = async () => {
    if (isTesting) {
      stopMicTest();
    } else {
      const ok = await startMicTest();
      if (ok) {
        setHasTestedMic(true);
        setGlobalMicStatus('granted');
      }
    }
  };

  const handleRequestPermission = async () => {
    const ok = await requestPermission();
    if (ok) {
      setHasTestedMic(true);
      setGlobalMicStatus('granted');
    }
  };

  const isGranted = micStatus === 'granted';
  const isDenied = micStatus === 'denied';
  const isUnsupported = micStatus === 'unsupported';

  return (
    <Card
      eyebrow={t('hwEyebrow')}
      title={t('hwTitle')}
      lead={t('hwLead')}
      stepNumber={3}
    >
      <div className="space-y-6">
        {/* Permission Status Box */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl grid place-items-center text-white flex-none ${
                isGranted
                  ? 'bg-[var(--ok)]'
                  : isDenied
                  ? 'bg-[var(--danger)]'
                  : 'bg-[var(--warn)]'
              }`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--ink)]">
                {t('hwPermissionTitle')}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5 font-medium">
                {isGranted
                  ? t('hwPermGranted')
                  : isDenied
                  ? t('hwPermDenied')
                  : isUnsupported
                  ? t('hwNotSupported')
                  : t('hwPermPrompt')}
              </div>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="icon-btn text-xs py-2 px-4 w-full sm:w-auto"
            >
              {t('hwRequestPermBtn')}
            </button>
          </div>
        </div>

        {/* Permission Denied Assistance */}
        {isDenied && (
          <div className="alert-warning">
            <svg className="w-5 h-5 flex-none mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>{t('hwPermDeniedHelp')}</div>
          </div>
        )}

        {/* Live Audio Test and Waveform Canvas */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-[var(--ink)]">
                {t('hwTestingTitle')}
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                {t('hwTestInstruction')}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleTest}
              className={`${isTesting ? 'btn-danger' : 'btn-primary'} text-xs py-2 px-5`}
            >
              {isTesting ? t('hwStopTestBtn') : t('hwStartTestBtn')}
            </button>
          </div>

          {/* Waveform Canvas */}
          <Waveform analyserNode={analyserNode} isTesting={isTesting} />

          {/* Signal Level Indicator Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[var(--muted)] mb-1.5">
              <span>{t('hwLevelLabel')}</span>
              <span className="font-mono">{audioLevel}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[var(--soft)] border border-[var(--line)] overflow-hidden p-0.5">
              <div
                className="audio-meter-bar h-full rounded-full bg-gradient-to-r from-[var(--brand)] via-[var(--brand-2)] to-[var(--ok)]"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Error alert if any */}
        {error && (
          <div className="p-4 rounded-xl border border-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_8%,var(--surface))] text-[var(--danger)] text-sm font-semibold">
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}
