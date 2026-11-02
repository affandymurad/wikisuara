/**
 * Script detection helpers.
 * A text "needs romanization" when it contains letters outside the Latin script
 * (e.g. Cyrillic, Greek, Arabic, Han). Digits, spaces and punctuation are neutral.
 */
const NON_LATIN_REGEX = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

export function hasNonLatin(text) {
  return NON_LATIN_REGEX.test(text || '');
}

/** True when the text is non-Latin and the romanization is still missing. */
export function needsRomanization(text, romanization) {
  return hasNonLatin(text) && !(romanization || '').trim();
}

/** "Иван (Ivan)" for non-Latin text with a romanization, otherwise the text as-is. */
export function withRomanization(text, romanization) {
  const clean = (text || '').trim();
  const roman = (romanization || '').trim();
  return hasNonLatin(clean) && roman ? `${clean} (${roman})` : clean;
}
