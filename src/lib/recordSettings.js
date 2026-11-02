import { useState, useCallback } from 'react';

const STORAGE_KEY = 'ws_record_settings';

export const SILENCE_RANGE = { min: 500, max: 1500, step: 100, default: 1000 }; // ms

function readSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const silence = Number(parsed.silenceMs);
    return {
      silenceMs: silence >= SILENCE_RANGE.min && silence <= SILENCE_RANGE.max ? silence : SILENCE_RANGE.default,
      autoAdvance: parsed.autoAdvance === true,
    };
  } catch {
    return { silenceMs: SILENCE_RANGE.default, autoAdvance: false };
  }
}

/**
 * Recording preferences, kept in this browser only:
 * - silenceMs: pause after speech before the recorder stops by itself
 * - autoAdvance: after saving, move to the next unrecorded word and record again (hands-free)
 */
export function useRecordSettings() {
  const [settings, setSettings] = useState(readSettings);

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  return {
    silenceMs: settings.silenceMs,
    autoAdvance: settings.autoAdvance,
    setSilenceMs: (silenceMs) => update({ silenceMs }),
    setAutoAdvance: (autoAdvance) => update({ autoAdvance }),
  };
}
