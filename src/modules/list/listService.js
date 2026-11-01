/**
 * Word list parsing & helpers
 */

/**
 * Parse raw text input into array of unique non-empty words
 * Handles # separation, newlines, and carriage returns
 * @param {string} raw
 * @returns {string[]}
 */
export function parseWordListInput(raw) {
  if (!raw) return [];
  const lines = raw.split(/[#\r\n;]+/);
  const seen = new Set();
  const result = [];

  for (const item of lines) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Parse an uploaded .txt file
 * @param {File} file
 * @returns {Promise<string[]>}
 */
export async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      resolve(parseWordListInput(text));
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file, 'utf-8');
  });
}
