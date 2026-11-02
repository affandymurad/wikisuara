/**
 * Storage manager for Wikisuara
 * - localStorage: profiles, languages, words, current step, preferences
 * - IndexedDB: audio recording Blobs (PCM/WAV)
 */

const STORAGE_KEYS = {
  PROFILES: 'ws_profiles',
  ACTIVE_PROFILE_ID: 'ws_active_profile_id',
  LANGUAGES: 'ws_languages',
  ACTIVE_LANGUAGE_ID: 'ws_active_language_id',
  WORDS: 'ws_words',
  STEP: 'ws_current_step',
};

// Default initial state
export const DEFAULT_PROFILES = [
  { id: 'prof_default', name: '', romanization: '', isDefault: true },
];

export const DEFAULT_WORDS = [];
export const DEFAULT_LANGUAGES = [];

/**
 * LocalStorage helpers
 */
export function getStoredProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveStoredProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage', e);
  }
}

export function getStoredActiveProfileId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID) || 'prof_default';
  } catch {
    return 'prof_default';
  }
}

export function saveStoredActiveProfileId(id) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  } catch (e) {
    console.error('Failed to save active profile ID', e);
  }
}

// Languages seeded by older versions (no profileId); dropped so the list starts empty
const LEGACY_SEED_QIDS = { id: 'Q9240', en: 'Q1860', ms: 'Q9237', bew: 'Q33014', fr: 'Q150' };

export function getStoredLanguages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LANGUAGES);
    if (!raw) return DEFAULT_LANGUAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LANGUAGES;
    return parsed
      .filter((l) => l.profileId || LEGACY_SEED_QIDS[l.id] !== l.qid)
      .map((l) => (l.profileId ? l : { ...l, profileId: 'prof_default' }));
  } catch {
    return DEFAULT_LANGUAGES;
  }
}

export function saveStoredLanguages(languages) {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGES, JSON.stringify(languages));
  } catch (e) {
    console.error('Failed to save languages to localStorage', e);
  }
}

export function getStoredActiveLanguageId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_LANGUAGE_ID) || '';
  } catch {
    return '';
  }
}

export function saveStoredActiveLanguageId(id) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_LANGUAGE_ID, id);
  } catch (e) {
    console.error('Failed to save active language ID', e);
  }
}

export function getStoredWords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORDS);
    if (!raw) return DEFAULT_WORDS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WORDS;
  } catch {
    return DEFAULT_WORDS;
  }
}

export function saveStoredWords(words) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  } catch (e) {
    console.error('Failed to save words to localStorage', e);
  }
}

export function getStoredStep() {
  try {
    const val = parseInt(localStorage.getItem(STORAGE_KEYS.STEP) || '1', 10);
    return val >= 1 && val <= 6 ? val : 1;
  } catch {
    return 1;
  }
}

export function saveStoredStep(step) {
  try {
    localStorage.setItem(STORAGE_KEYS.STEP, String(step));
  } catch (e) {
    console.error('Failed to save step to localStorage', e);
  }
}

/**
 * Clear all localStorage data for Wikisuara
 */
export function clearAllLocalStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.error('Failed to clear localStorage', e);
  }
}

/**
 * IndexedDB for Audio Blobs
 */
const DB_NAME = 'WikiSuaraDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save an audio recording into IndexedDB
 * @param {string} id Word ID or unique recording key
 * @param {Blob} blob Raw or WAV blob
 * @param {number} duration Duration in seconds
 * @returns {Promise<void>}
 */
export async function idbSaveRecording(id, blob, duration = 0) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item = {
      id,
      blob,
      duration,
      size: blob.size,
      updatedAt: Date.now(),
    };
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve a single recording from IndexedDB
 * @param {string} id
 * @returns {Promise<{ id: string, blob: Blob, duration: number, size: number } | null>}
 */
export async function idbGetRecording(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all recordings from IndexedDB
 * @returns {Promise<Record<string, { id: string, blob: Blob, duration: number, size: number }>>}
 */
export async function idbGetAllRecordings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const map = {};
      (req.result || []).forEach((item) => {
        map[item.id] = item;
      });
      resolve(map);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a single recording from IndexedDB
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function idbDeleteRecording(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all recordings from IndexedDB
 * @returns {Promise<void>}
 */
export async function idbClearAllRecordings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
