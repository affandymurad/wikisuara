import { useState, useRef, useCallback, useEffect } from 'react';
import { pcmSamplesToWavBlob } from '../../lib/wav.js';

// Auto-stop tuning: stop after this long a pause once speech has been heard
const SILENCE_MS = 1500;
const MIN_SPEECH_THRESHOLD = 0.004; // RMS floor (0..1), low so normal speech counts
const MAX_SPEECH_THRESHOLD = 0.02; // cap so a noisy start never demands shouting
const NOISE_CALIBRATION_MS = 300;
const LEAD_PADDING_S = 0.2; // silence kept before the voice when trimming
const TAIL_PADDING_S = 0.45; // kept after the voice so soft endings (e.g. "ng") aren't cut
const STOP_FLUSH_MS = 250; // keep capturing briefly after stop so the last buffer is delivered
const TARGET_PEAK = 0.9;
const MAX_GAIN = 60;

export function useRecorder({ onSilence } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // in seconds
  const [audioLevel, setAudioLevel] = useState(0); // 0-100 for live visual feedback
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const analyserRef = useRef(null);
  const pcmChunksRef = useRef([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const animFrameRef = useRef(null);
  const sampleRateRef = useRef(44100);
  const onSilenceRef = useRef(onSilence);
  const vadRef = useRef({});

  useEffect(() => {
    onSilenceRef.current = onSilence;
  }, [onSilence]);

  // Stop & clean up all hardware tracks and audio nodes
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch {}
      processorRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    cleanup();
    pcmChunksRef.current = [];
    vadRef.current = { threshold: MIN_SPEECH_THRESHOLD, noise: 0, noiseMs: 0, heard: false, lastVoice: 0, fired: false };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser ini tidak mendukung akses mikrofon getUserMedia.');
      return false;
    }

    try {
      // 1. Acquire microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          // AGC ramps up slowly on each new stream, making the start sound muffled.
          // Loudness is normalized after recording instead.
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      // 2. Initialize AudioContext
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;
      sampleRateRef.current = audioCtx.sampleRate || 44100;

      // 3. Audio Source
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // 4. Analyser node for live volume feedback
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;
      source.connect(analyser);

      // Live volume meter loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 64) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // 5. ScriptProcessor for direct uncompressed Float32Array PCM recording
      // Small buffer keeps the end of the recording from being lost on stop
      const bufferSize = 1024;
      const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputChannel = e.inputBuffer.getChannelData(0);
        // Clone samples into memory
        pcmChunksRef.current.push(new Float32Array(inputChannel));

        // Voice activity detection on this chunk
        const vad = vadRef.current;
        let sumSq = 0;
        for (let i = 0; i < inputChannel.length; i++) sumSq += inputChannel[i] * inputChannel[i];
        const rms = Math.sqrt(sumSq / inputChannel.length);
        const now = Date.now();
        const elapsed = now - startTimeRef.current;

        if (elapsed < NOISE_CALIBRATION_MS) {
          // Quietest chunk = noise floor, so speaking right after pressing record doesn't raise it
          vad.noise = vad.noiseMs === 0 ? rms : Math.min(vad.noise, rms);
          vad.noiseMs++;
          vad.threshold = Math.min(MAX_SPEECH_THRESHOLD, Math.max(MIN_SPEECH_THRESHOLD, vad.noise * 2.5));
          return;
        }
        if (rms > vad.threshold) {
          vad.heard = true;
          vad.lastVoice = now;
        } else if (vad.heard && !vad.fired && now - vad.lastVoice > SILENCE_MS) {
          vad.fired = true;
          onSilenceRef.current?.();
        }
      };

      source.connect(processor);
      // Connect to destination via silent gain to keep audio clock running in Chrome/Safari
      const muteGain = audioCtx.createGain();
      muteGain.gain.value = 0;
      processor.connect(muteGain);
      muteGain.connect(audioCtx.destination);

      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);

      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      cleanup();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Izin akses mikrofon ditolak oleh browser.');
      } else if (err.name === 'NotFoundError') {
        setError('Mikrofon tidak terdeteksi pada perangkat.');
      } else {
        setError(err.message || 'Gagal memulai perekaman audio.');
      }
      return false;
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      setIsRecording(false);

      // Short delay to ensure the last audio buffers are captured
      setTimeout(() => {
        const chunks = pcmChunksRef.current;
        const sampleRate = sampleRateRef.current || 44100;

        // Calculate total samples
        let totalSamples = 0;
        for (let i = 0; i < chunks.length; i++) {
          totalSamples += chunks[i].length;
        }

        if (totalSamples === 0) {
          cleanup();
          resolve(null);
          return;
        }

        // Merge all Float32Array chunks into a single continuous buffer
        const mergedSamples = new Float32Array(totalSamples);
        let offset = 0;
        for (let i = 0; i < chunks.length; i++) {
          mergedSamples.set(chunks[i], offset);
          offset += chunks[i].length;
        }

        // Trim leading/trailing silence (keep a small padding) and normalize loudness
        // Half the speech threshold so quiet word endings still count as voiced
        const threshold = (vadRef.current.threshold || MIN_SPEECH_THRESHOLD) * 0.5;
        const win = Math.max(1, Math.round(sampleRate * 0.02));
        const voiced = (start) => {
          let sq = 0;
          const end = Math.min(start + win, mergedSamples.length);
          for (let i = start; i < end; i++) sq += mergedSamples[i] * mergedSamples[i];
          return Math.sqrt(sq / (end - start)) > threshold;
        };
        let first = -1;
        let last = -1;
        for (let i = 0; i < mergedSamples.length; i += win) {
          if (voiced(i)) {
            if (first < 0) first = i;
            last = i + win;
          }
        }
        let samples = mergedSamples;
        if (first >= 0) {
          const lead = Math.round(sampleRate * LEAD_PADDING_S);
          const tail = Math.round(sampleRate * TAIL_PADDING_S);
          samples = mergedSamples.slice(Math.max(0, first - lead), Math.min(mergedSamples.length, last + tail));
        }

        let peak = 0;
        for (let i = 0; i < samples.length; i++) {
          const a = Math.abs(samples[i]);
          if (a > peak) peak = a;
        }
        if (first >= 0 && peak > 0.001 && peak < TARGET_PEAK) {
          const gain = Math.min(TARGET_PEAK / peak, MAX_GAIN);
          for (let i = 0; i < samples.length; i++) samples[i] *= gain;
        }

        const duration = samples.length / sampleRate;

        // Encode directly to authentic PCM 16-bit mono WAV!
        const wavBlob = pcmSamplesToWavBlob(samples, sampleRate);

        cleanup();

        resolve({
          blob: wavBlob,
          pcmSamples: samples,
          duration,
          sampleRate,
          size: wavBlob.size,
        });
      }, STOP_FLUSH_MS);
    });
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isRecording,
    recordingDuration,
    audioLevel,
    startRecording,
    stopRecording,
    error,
  };
}
