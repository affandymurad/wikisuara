import { useEffect, useRef } from 'react';

export default function Waveform({ analyserNode, isTesting }) {
  const canvasRef = useRef(null);
  const animIdRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isTesting || !analyserNode) {
      // Draw quiet baseline
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(82, 120, 208, 0.25)';
      ctx.lineWidth = 2;
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = analyserNode.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animIdRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient stroke
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#2d4f9c');
      gradient.addColorStop(0.5, '#5278d0');
      gradient.addColorStop(1, '#6d93e8');

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [analyserNode, isTesting]);

  return (
    <div className="w-full h-28 rounded-2xl bg-[var(--soft)] border border-[var(--line)] overflow-hidden flex items-center justify-center p-2 relative shadow-inner">
      <canvas
        ref={canvasRef}
        width={700}
        height={110}
        className="w-full h-full block"
      />
      {!isTesting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-semibold text-[var(--muted)]">
          Mikrofon belum diaktifkan untuk pengujian
        </div>
      )}
    </div>
  );
}
