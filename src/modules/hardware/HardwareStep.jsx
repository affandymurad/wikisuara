import { useState, useEffect, useRef } from 'react';
import Card from '../../components/Card.jsx';
import { useApp } from '../../state/AppContext.jsx';
import { useT } from '../../lib/i18n.js';
import { useMicrophone } from './useMicrophone.js';
import Waveform from './Waveform.jsx';
import { useRecorder } from '../record/useRecorder.js';
import { useRecordSettings } from '../../lib/recordSettings.js';
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

  // Short test recording so the speaker can hear how a real recording will sound
  const TEST_SECONDS = 8; // upper limit; it normally stops by itself after you finish speaking
  const { silenceMs } = useRecordSettings();
  const finishTestRef = useRef(null);
  const testRec = useRecorder({ keepMicOpen: false, silenceMs, onSilence: () => finishTestRef.current?.() });
  const [testResult, setTestResult] = useState(null); // { url, hasVoice, rawPeak, noiseFloor }
  const testUrlRef = useRef(null);

  const clearTestResult = () => {
    if (testUrlRef.current) URL.revokeObjectURL(testUrlRef.current);
    testUrlRef.current = null;
    setTestResult(null);
  };

  const finishTestRecording = async () => {
    const result = await testRec.stopRecording();
    if (!result) return;
    testUrlRef.current = URL.createObjectURL(result.blob);
    setTestResult({
      url: testUrlRef.current,
      hasVoice: result.hasVoice,
      rawPeak: result.rawPeak,
      noiseFloor: result.noiseFloor,
    });
  };

  finishTestRef.current = finishTestRecording;

  const handleToggleTestRecording = async () => {
    if (testRec.isRecording) {
      await finishTestRecording();
      return;
    }
    clearTestResult();
    if (isTesting) stopMicTest(); // one microphone consumer at a time
    const ok = await testRec.startRecording();
    if (ok) {
      setHasTestedMic(true);
      setGlobalMicStatus('granted');
    }
  };

  // Stop by itself after TEST_SECONDS
  useEffect(() => {
    if (testRec.isRecording && testRec.recordingDuration >= TEST_SECONDS) {
      finishTestRecording();
    }
  }, [testRec.isRecording, testRec.recordingDuration]);

  useEffect(() => {
    return () => {
      if (testUrlRef.current) URL.revokeObjectURL(testUrlRef.current);
    };
  }, []);

  // Plain-language reading of the test recording
  const testFindings = testResult
    ? [
        !testResult.hasVoice
          ? { tone: 'warn', text: t('hwRecNoVoice') }
          : testResult.rawPeak < 0.05
          ? { tone: 'warn', text: t('hwRecTooQuiet') }
          : testResult.rawPeak > 0.98
          ? { tone: 'warn', text: t('hwRecTooLoud') }
          : { tone: 'ok', text: t('hwRecGood') },
        testResult.noiseFloor < 0.006
          ? { tone: 'ok', text: t('hwNoiseQuiet') }
          : testResult.noiseFloor < 0.02
          ? { tone: 'warn', text: t('hwNoiseModerate') }
          : { tone: 'warn', text: t('hwNoiseLoud') },
      ]
    : [];

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
              disabled={testRec.isRecording}
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

        {/* Test recording: hear how a real recording sounds */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-extrabold text-[var(--ink)]">{t('hwRecTestTitle')}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5 max-w-xl">{t('hwRecTestDesc')}</div>
            </div>
            <button
              type="button"
              onClick={handleToggleTestRecording}
              className={`${testRec.isRecording ? 'btn-danger' : 'btn-primary'} text-xs py-2 px-5 cursor-pointer`}
            >
              {testRec.isRecording
                ? `${t('hwRecTestStop')} (${Math.max(0, Math.ceil(TEST_SECONDS - testRec.recordingDuration))})`
                : t('hwRecTestStart')}
            </button>
          </div>

          {testRec.isRecording && (
            <div className="w-full h-3 rounded-full bg-[var(--soft)] border border-[var(--line)] overflow-hidden p-0.5">
              <div
                className="audio-meter-bar h-full rounded-full bg-gradient-to-r from-[var(--brand)] via-[var(--brand-2)] to-[var(--ok)]"
                style={{ width: `${testRec.audioLevel}%` }}
              />
            </div>
          )}

          {testResult && (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold text-[var(--muted)] mb-1.5">{t('hwRecTestPlayLabel')}</div>
                <audio controls src={testResult.url} className="w-full" />
              </div>
              <ul className="space-y-1.5">
                {testFindings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs font-semibold text-[var(--ink)]">
                    <span
                      className={`mt-1 h-2 w-2 rounded-full flex-none ${f.tone === 'ok' ? 'bg-[var(--ok)]' : 'bg-[var(--warn)]'}`}
                    />
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-[11.5px] text-[var(--muted)]">{t('hwRecTestHeadset')}</div>
          {testRec.error && <div className="text-xs font-semibold text-[var(--danger)]">{testRec.error}</div>}
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
