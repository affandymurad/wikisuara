import { useState, useEffect, useRef, useCallback } from 'react';

export function useMicrophone() {
  const [micStatus, setMicStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [error, setError] = useState(null);

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check initial permissions API if supported
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' })
        .then((permissionStatus) => {
          setMicStatus(permissionStatus.state);
          permissionStatus.onchange = () => {
            setMicStatus(permissionStatus.state);
          };
        })
        .catch(() => {
          // Fallback if permission query is not supported
        });
    }
  }, []);

  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setIsTesting(false);
    setAudioLevel(0);
  }, []);

  const startMicTest = useCallback(async () => {
    setError(null);
    stopMicTest();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      setError('MediaDevices / getUserMedia tidak didukung pada browser ini.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMicStatus('granted');

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsTesting(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute average volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      return true;
    } catch (err) {
      console.warn('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicStatus('denied');
        setError('Izin mikrofon ditolak.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Mikrofon tidak ditemukan pada perangkat Anda.');
      } else {
        setError('Gagal mengakses mikrofon: ' + err.message);
      }
      return false;
    }
  }, [stopMicTest]);

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    return await startMicTest();
  }, [startMicTest]);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, [stopMicTest]);

  return {
    micStatus,
    isTesting,
    audioLevel,
    error,
    analyserNode: analyserRef.current,
    startMicTest,
    stopMicTest,
    requestPermission,
  };
}
