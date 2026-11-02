import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  getStoredProfiles,
  saveStoredProfiles,
  getStoredActiveProfileId,
  saveStoredActiveProfileId,
  getStoredLanguages,
  saveStoredLanguages,
  getStoredActiveLanguageId,
  saveStoredActiveLanguageId,
  getStoredWords,
  saveStoredWords,
  getStoredStep,
  saveStoredStep,
  idbGetAllRecordings,
  idbSaveRecording,
  idbDeleteRecording,
  idbClearAllRecordings,
  clearAllLocalStorage,
  DEFAULT_PROFILES,
  DEFAULT_WORDS,
  DEFAULT_LANGUAGES,
} from './storage.js';
import { needsRomanization } from '../lib/script.js';
import { convertRawBlobToWav } from '../lib/wav.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Step state (1-6)
  const [step, setStepState] = useState(getStoredStep);

  // Profiles
  const [profiles, setProfiles] = useState(getStoredProfiles);
  const [activeProfileId, setActiveProfileIdState] = useState(getStoredActiveProfileId);

  // Languages
  // Every language belongs to one speaker profile (language.profileId)
  const [allLanguages, setLanguages] = useState(getStoredLanguages);
  const [activeLanguageId, setActiveLanguageIdState] = useState(getStoredActiveLanguageId);

  // Words list
  const [words, setWords] = useState(getStoredWords);

  // Audio Recordings (IndexedDB synced)
  // map: { [wordId]: { id, blob (wav), duration, size } }
  const [recordings, setRecordings] = useState({});
  const [isRecordingsLoaded, setIsRecordingsLoaded] = useState(false);

  // Device check status
  const [micStatus, setMicStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied'
  const [hasTestedMic, setHasTestedMic] = useState(false);

  // Toast / notification message
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Sync step changes to storage
  const setStep = useCallback((newStep) => {
    const clamped = Math.max(1, Math.min(6, newStep));
    setStepState(clamped);
    saveStoredStep(clamped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Load recordings from IndexedDB on initial mount
  useEffect(() => {
    let mounted = true;
    idbGetAllRecordings()
      .then((records) => {
        if (mounted) {
          setRecordings(records);
          setIsRecordingsLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Error loading recordings from IndexedDB:', err);
        if (mounted) setIsRecordingsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveStoredProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    saveStoredLanguages(allLanguages);
  }, [allLanguages]);

  useEffect(() => {
    saveStoredWords(words);
  }, [words]);

  // Active profile
  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  }, [profiles, activeProfileId]);

  const setActiveProfileId = useCallback((id) => {
    setActiveProfileIdState(id);
    saveStoredActiveProfileId(id);
  }, []);

  const addProfile = useCallback((name, romanization = '') => {
    const cleanName = (name || '').trim();
    if (!cleanName) return null;
    const newProf = {
      id: `prof_${Date.now()}`,
      name: cleanName,
      romanization: (romanization || '').trim(),
      isDefault: false,
    };
    setProfiles((prev) => [...prev, newProf]);
    setActiveProfileId(newProf.id);
    return newProf;
  }, [setActiveProfileId]);

  // `patch` is { name?, romanization? }; raw values are kept while typing (consumers trim)
  const updateProfile = useCallback((id, patch) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  }, []);

  const deleteProfile = useCallback(
    (id) => {
      const target = profiles.find((p) => p.id === id);
      if (!target || profiles.length <= 1) {
        return false;
      }
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setLanguages((prev) => prev.filter((l) => l.profileId !== id));
      if (activeProfileId === id) {
        const remaining = profiles.filter((p) => p.id !== id);
        setActiveProfileId(remaining[0].id);
      }
      return true;
    },
    [profiles, activeProfileId, setActiveProfileId]
  );

  // Languages of the active speaker profile only
  const languages = useMemo(
    () => allLanguages.filter((l) => l.profileId === activeProfile.id),
    [allLanguages, activeProfile.id]
  );

  const activeLanguage = useMemo(() => {
    return languages.find((l) => l.id === activeLanguageId) || languages[0] || null;
  }, [languages, activeLanguageId]);

  const setActiveLanguageId = useCallback((id) => {
    setActiveLanguageIdState(id);
    saveStoredActiveLanguageId(id);
  }, []);

  const addLanguage = useCallback((lang) => {
    const newLang = {
      id: `lang_${Date.now()}`,
      profileId: activeProfile.id,
      name: lang.name.trim(),
      nativeName: lang.nativeName?.trim() || lang.name.trim(),
      qid: lang.qid.trim().toUpperCase(),
      code: lang.code.trim().toLowerCase(),
      level: lang.level || 'N',
    };
    setLanguages((prev) => [...prev, newLang]);
    setActiveLanguageId(newLang.id);
    return newLang;
  }, [activeProfile.id, setActiveLanguageId]);

  const updateLanguage = useCallback((id, updates) => {
    setLanguages((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

  const deleteLanguage = useCallback(
    (id) => {
      setLanguages((prev) => prev.filter((l) => l.id !== id));
      if (activeLanguageId === id) {
        setActiveLanguageId('');
      }
      return true;
    },
    [activeLanguageId, setActiveLanguageId]
  );

  // Words management: one entry at a time from the form; duplicates (same text) are ignored.
  // Returns 'added' | 'duplicate' | 'empty'.
  const addWord = useCallback((text, romanization = '') => {
    const cleanText = (text || '').trim();
    if (!cleanText) return 'empty';
    if (words.some((w) => w.text.toLowerCase() === cleanText.toLowerCase())) return 'duplicate';
    setWords((prev) => [
      ...prev,
      {
        id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        text: cleanText,
        romanization: (romanization || '').trim(),
      },
    ]);
    return 'added';
  }, [words]);

  const removeWord = useCallback((id) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
    // Also remove associated recording
    idbDeleteRecording(id).catch(console.error);
    setRecordings((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearWords = useCallback(async () => {
    setWords([]);
    await idbClearAllRecordings().catch(console.error);
    setRecordings({});
  }, []);

  // Save Audio: supports direct WAV blob, Float32Array PCM samples, or raw container blob
  const saveRecording = useCallback(async (wordId, audioInput, explicitDuration = null) => {
    try {
      let wavBlob;
      let duration = explicitDuration;
      let size;
      let sampleRate = 44100;

      if (audioInput instanceof Blob && audioInput.type === 'audio/wav') {
        wavBlob = audioInput;
        size = wavBlob.size;
        duration = explicitDuration || 0.5;
      } else if (audioInput instanceof Float32Array) {
        const res = await convertRawBlobToWav(audioInput, sampleRate);
        wavBlob = res.wavBlob;
        duration = res.duration;
        size = res.size;
        sampleRate = res.sampleRate;
      } else {
        const res = await convertRawBlobToWav(audioInput);
        wavBlob = res.wavBlob;
        duration = res.duration;
        size = res.size;
        sampleRate = res.sampleRate;
      }

      // Duration check: if too short (< 0.2s), return error
      if (duration < 0.2) {
        return { success: false, error: 'too_short' };
      }

      await idbSaveRecording(wordId, wavBlob, duration);
      setRecordings((prev) => ({
        ...prev,
        [wordId]: {
          id: wordId,
          blob: wavBlob,
          duration,
          size,
          sampleRate,
          updatedAt: Date.now(),
        },
      }));
      return { success: true, duration, size };
    } catch (err) {
      console.error('Failed to convert and save recording:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const deleteRecording = useCallback(async (wordId) => {
    await idbDeleteRecording(wordId).catch(console.error);
    setRecordings((prev) => {
      const next = { ...prev };
      delete next[wordId];
      return next;
    });
  }, []);

  // Reset everything to defaults
  const resetAllData = useCallback(async () => {
    clearAllLocalStorage();
    await idbClearAllRecordings().catch(console.error);
    setProfiles(DEFAULT_PROFILES);
    setActiveProfileIdState(DEFAULT_PROFILES[0].id);
    setLanguages(DEFAULT_LANGUAGES);
    setActiveLanguageIdState('');
    setWords(DEFAULT_WORDS);
    setRecordings({});
    setStepState(1);
    setMicStatus('prompt');
    setHasTestedMic(false);
  }, []);

  // Step Validation logic
  const canGoNext = useCallback(
    (stepNum) => {
      switch (stepNum) {
        case 1: // Profil: Speaker name required (+ romanization when non-Latin)
          return (
            Boolean(activeProfile?.name?.trim()) &&
            !needsRomanization(activeProfile.name, activeProfile.romanization)
          );
        case 2: // Bahasa: an active language with QID & code
          return Boolean(activeLanguage?.qid?.trim() && activeLanguage?.code?.trim());
        case 3: // Cek Perangkat: Can proceed if tested or permission checked
          return true;
        case 4: // Daftar Kata: Must have at least 1 word
          return words.length > 0;
        case 5: // Rekam: Must have at least 1 recorded word
          return Object.keys(recordings).length > 0;
        case 6: // Tinjau
          return true;
        default:
          return true;
      }
    },
    [activeProfile, activeLanguage, words, recordings]
  );

  // A saved step may no longer be reachable (e.g. data was cleared): fall back to the first blocked step
  useEffect(() => {
    if (!isRecordingsLoaded) return; // step 5 depends on recordings loaded from IndexedDB
    for (let n = 1; n < step; n++) {
      if (!canGoNext(n)) {
        setStepState(n);
        saveStoredStep(n);
        return;
      }
    }
  }, [step, canGoNext, isRecordingsLoaded]);

  const value = {
    step,
    setStep,
    canGoNext,
    // Profiles
    profiles,
    activeProfileId,
    activeProfile,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    // Languages
    languages,
    activeLanguageId,
    activeLanguage,
    setActiveLanguageId,
    addLanguage,
    updateLanguage,
    deleteLanguage,
    // Words
    words,
    addWord,
    removeWord,
    clearWords,
    // Audio Recordings
    recordings,
    isRecordingsLoaded,
    saveRecording,
    deleteRecording,
    // Microphone Status
    micStatus,
    setMicStatus,
    hasTestedMic,
    setHasTestedMic,
    // System
    resetAllData,
    toast,
    showToast,
    hideToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
