/**
 * Script detection helpers.
 * A text "needs romanization" when it contains letters outside the Latin script
 * (e.g. Cyrillic, Greek, Arabic, Han). Digits, spaces and punctuation are neutral.
 */
const NON_LATIN_REGEX = /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u;

export function hasNonLatin(text) {
  return NON_LATIN_REGEX.test(text || '');
}

/** Why the romanization is not acceptable: 'required' (empty) | 'notLatin' (has non-Latin letters) | null (ok or not needed). */
export function romanizationIssue(text, romanization) {
  if (!hasNonLatin(text)) return null;
  const roman = (romanization || '').trim();
  if (!roman) return 'required';
  return hasNonLatin(roman) ? 'notLatin' : null;
}

/** True when the text is non-Latin and its romanization is missing or not written in Latin letters. */
export function needsRomanization(text, romanization) {
  return romanizationIssue(text, romanization) !== null;
}

/** "Иван (Ivan)" for non-Latin text with a romanization, otherwise the text as-is. */
export function withRomanization(text, romanization) {
  const clean = (text || '').trim();
  const roman = (romanization || '').trim();
  return hasNonLatin(clean) && roman ? `${clean} (${roman})` : clean;
}
