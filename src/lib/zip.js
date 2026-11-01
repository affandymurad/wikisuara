import JSZip from 'jszip';

/**
 * Create a ZIP archive from a list of files
 * @param {Array<{ filename: string, blob: Blob }>} files
 * @param {Function} [onProgress] Optional callback (percent: number)
 * @returns {Promise<Blob>}
 */
export async function createZip(files, onProgress) {
  const zip = new JSZip();

  files.forEach(({ filename, blob }) => {
    zip.file(filename, blob);
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  return zipBlob;
}

/**
 * Trigger file download in browser and safely revoke object URL
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
