import { searchWikidataLanguage } from '../../lib/wikidata.js';

export async function lookupLanguage(query, lang = 'id') {
  return await searchWikidataLanguage(query, lang);
}

export function validateLanguageEntry(lang) {
  if (!lang.name?.trim()) {
    return { valid: false, error: 'Nama bahasa wajib diisi.' };
  }
  if (!lang.qid?.trim()) {
    return { valid: false, error: 'QID Wikidata wajib diisi (mis. Q9240).' };
  }
  if (!lang.code?.trim()) {
    return { valid: false, error: 'Kode bahasa wajib diisi (mis. id, en).' };
  }
  return { valid: true };
}
