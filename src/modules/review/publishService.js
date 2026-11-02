import { generateUniqueFileNames } from '../../lib/filename.js';
import { createZip, downloadBlob } from '../../lib/zip.js';

/**
 * Prepare published items with formatted unique filenames
 * @param {Array<{ id: string, text: string }>} words
 * @param {Record<string, { id: string, blob: Blob, duration: number, size: number }>} recordings
 * @param {Set<string>} selectedIds
 * @param {Object} profile
 * @param {Object} language
 * @returns {Array<Object>}
 */
export function preparePublishList(words, recordings, selectedIds, profile, language) {
  const eligibleWords = words.filter(
    (w) => selectedIds.has(w.id) && Boolean(recordings[w.id])
  );

  const itemsToName = eligibleWords.map((w) => ({
    id: w.id,
    word: w.text,
    wordRoman: w.romanization || '',
    qid: language?.qid || '',
    code: language?.code || '',
    level: language?.level || 'N',
    speaker: profile?.name || '',
    speakerRoman: profile?.romanization || '',
  }));

  const filenameMap = generateUniqueFileNames(itemsToName);

  return eligibleWords.map((w, index) => {
    const rec = recordings[w.id];
    const filename = filenameMap.get(w.id);

    return {
      index: index + 1,
      id: w.id,
      word: w.text,
      wordRoman: w.romanization || '',
      filename,
      blob: rec.blob,
      duration: rec.duration || 0,
      size: rec.size || rec.blob.size,
      speaker: (profile?.name || '').trim(),
      speakerRoman: (profile?.romanization || '').trim(),
      level: language?.level || 'N',
      language: language?.name || '',
      qid: language?.qid || '',
      code: language?.code || '',
    };
  });
}

/**
 * Download all WAV files as a ZIP archive
 */
export async function downloadAllAsZip(publishItems, onProgress) {
  const files = publishItems.map((item) => ({
    filename: item.filename,
    blob: item.blob,
  }));

  const zipBlob = await createZip(files, onProgress);
  downloadBlob(zipBlob, `wikisuara-${Date.now()}.zip`);
}
