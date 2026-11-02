/**
 * File naming conventions for Wikisuara
 * Specification:
 *   WS-{QID bahasa} ({kode bahasa})-{kemahiran}-{nama penutur}-{kata}.wav
 *
 * Rules:
 *   - "WS-" is fixed prefix (Wikisuara).
 *   - "{QID} ({code})" e.g. "Q33014 (bew)" with one space before parenthesis.
 *   - "{kemahiran}" = Babel proficiency level of the speaker (N, 5, 4, 3, 2, 1, 0), e.g. "WS-Q33014 (bew)-2-Affandy Murad-babe.wav".
 *   - Non-Latin speaker names / words get their Latin reading in parentheses, e.g. "Иван (Ivan)".
 *   - 4 parts separated by hyphen "-" with NO SPACES around it.
 *   - "nama penutur" = speaker name as-is (spaces preserved, e.g. "Affandy Murad").
 *   - "kata" = item text as-is, with forbidden characters removed: / \ : * ? " < > | and control characters.
 *     Parentheses and non-Latin characters are preserved.
 *   - Max total filename length: 200 characters (truncate word part if needed).
 *   - Duplicate filenames receive " (2)", " (3)", etc. before ".wav".
 */

import { withRomanization } from './script.js';

// Regex for forbidden characters in filenames: / \ : * ? " < > | and control characters
const FORBIDDEN_CHARS_REGEX = /[\/\\:\*\?"<>\|\x00-\x1F\x7F]/g;

/**
 * Sanitize word text according to Wikisuara rules
 * @param {string} word
 * @returns {string}
 */
export function sanitizeWord(word) {
  if (!word) return '';
  // Remove forbidden characters and trim outer whitespace
  return String(word).replace(FORBIDDEN_CHARS_REGEX, '').trim();
}

/**
 * Build a single filename
 * @param {Object} options
 * @param {string} options.qid Language Wikidata QID (e.g. "Q33014")
 * @param {string} options.code Language code (e.g. "bew")
 * @param {string} options.level Babel proficiency level (e.g. "2")
 * @param {string} options.speaker Speaker name (e.g. "Affandy Murad")
 * @param {string} [options.speakerRoman] Latin reading when the speaker name is non-Latin
 * @param {string} [options.wordRoman] Latin reading when the word is non-Latin
 * @param {string} options.word Word or phrase (e.g. "bayem")
 * @param {number} [options.duplicateIndex=1] 1 = no suffix, 2 = " (2)", etc.
 * @returns {string} Full filename with .wav extension
 */
export function buildFileName({ qid, code, level, speaker, speakerRoman, word, wordRoman, duplicateIndex = 1 }) {
  const cleanQid = (qid || '').trim();
  const cleanCode = (code || '').trim();
  const cleanLevel = (level || '').trim();
  const cleanSpeaker = sanitizeWord(withRomanization(speaker, speakerRoman));
  let cleanWord = sanitizeWord(withRomanization(word, wordRoman));

  // Part 1: WS-{QID} ({code})
  const langPart = `WS-${cleanQid} (${cleanCode})`;

  // Part 2: {kemahiran}-{nama penutur}
  const speakerPart = cleanLevel ? `${cleanLevel}-${cleanSpeaker}` : cleanSpeaker;

  // Suffix for duplicates: "" or " (2)"
  const suffix = duplicateIndex > 1 ? ` (${duplicateIndex})` : '';
  const extension = `${suffix}.wav`;

  // Total prefix before word: `${langPart}-${speakerPart}-`
  const prefix = `${langPart}-${speakerPart}-`;

  // Max length is 200 chars. Available length for cleanWord:
  const maxWordLength = Math.max(1, 200 - prefix.length - extension.length);

  if (cleanWord.length > maxWordLength) {
    cleanWord = cleanWord.slice(0, maxWordLength).trim();
  }

  return `${prefix}${cleanWord}${extension}`;
}

/**
 * Deduplicate a list of items and assign unique filenames
 * @param {Array<{ id: string, word: string, wordRoman?: string, qid: string, code: string, level?: string, speaker: string, speakerRoman?: string }>} items
 * @returns {Map<string, string>} Map of item.id -> unique filename
 */
export function generateUniqueFileNames(items) {
  const result = new Map();
  const counts = new Map();

  items.forEach((item) => {
    // Generate base filename with duplicateIndex = 1
    const base = buildFileName({
      ...item,
      duplicateIndex: 1,
    });

    const currentCount = counts.get(base) || 0;
    const nextCount = currentCount + 1;
    counts.set(base, nextCount);

    if (nextCount === 1) {
      result.set(item.id, base);
    } else {
      const uniqueName = buildFileName({
        ...item,
        duplicateIndex: nextCount,
      });
      result.set(item.id, uniqueName);
    }
  });

  return result;
}
