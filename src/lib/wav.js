/**
 * Audio decoder and PCM 16-bit mono WAV encoder for Wikisuara
 * Supports direct Float32Array PCM encoding and AudioBuffer encoding.
 */

let sharedAudioContext = null;

export function getSharedAudioContext() {
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
}

/**
 * Encode raw Float32Array mono PCM samples into authentic 16-bit PCM mono WAV format.
 * This is 100% reliable across all browsers without container codec issues.
 * @param {Float32Array} monoSamples
 * @param {number} sampleRate e.g. 44100 or 48000
 * @returns {Blob} Blob of type audio/wav
 */
export function pcmSamplesToWavBlob(monoSamples, sampleRate = 44100) {
  const numChannels = 1; // mono
  const length = monoSamples.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = length * blockAlign;
  const bufferByteLength = 44 + dataByteLength;

  const arrayBuffer = new ArrayBuffer(bufferByteLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteLength, true); // file length - 8
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // NumChannels (1 = mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteLength, true); // Subchunk2Size

  // Write PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, monoSamples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Encode AudioBuffer into authentic 16-bit PCM mono WAV format
 * @param {AudioBuffer} audioBuffer
 * @returns {Blob} Blob of type audio/wav
 */
export function audioBufferToWavBlob(audioBuffer) {
  const length = audioBuffer.length;
  const numInputChannels = audioBuffer.numberOfChannels;
  const monoSamples = new Float32Array(length);

  if (numInputChannels === 1) {
    monoSamples.set(audioBuffer.getChannelData(0));
  } else {
    const channelData = [];
    for (let c = 0; c < numInputChannels; c++) {
      channelData.push(audioBuffer.getChannelData(c));
    }
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let c = 0; c < numInputChannels; c++) {
        sum += channelData[c][i];
      }
      monoSamples[i] = sum / numInputChannels;
    }
  }

  return pcmSamplesToWavBlob(monoSamples, audioBuffer.sampleRate);
}

/**
 * Decode recorded Blob into AudioBuffer, with fallback handling
 * @param {Blob} blob
 * @returns {Promise<AudioBuffer>}
 */
export async function decodeAudioBlob(blob) {
  const ctx = getSharedAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const arrayBuffer = await blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(
      arrayBuffer,
      (buf) => resolve(buf),
      (err) => reject(new Error('Gagal mendekode audio: ' + (err?.message || err || 'format tidak didukung')))
    );
  });
}

/**
 * Convert any audio source (Blob or Float32Array samples) to standard WAV
 * @param {Blob|Float32Array} input
 * @param {number} [sampleRate]
 * @returns {Promise<{ wavBlob: Blob, duration: number, sampleRate: number, size: number }>}
 */
export async function convertRawBlobToWav(input, sampleRate = 44100) {
  if (input instanceof Float32Array) {
    const wavBlob = pcmSamplesToWavBlob(input, sampleRate);
    const duration = input.length / sampleRate;
    return {
      wavBlob,
      duration,
      sampleRate,
      size: wavBlob.size,
    };
  }

  // If already WAV blob, or another container blob
  const audioBuffer = await decodeAudioBlob(input);
  const wavBlob = audioBufferToWavBlob(audioBuffer);
  return {
    wavBlob,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
    size: wavBlob.size,
  };
}
