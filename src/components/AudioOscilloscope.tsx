import React, { useEffect, useRef } from 'react';

interface AudioOscilloscopeProps {
  analyserNode: AnalyserNode | null;
  isListening: boolean;
  thresholdDb: number;
  currentDb: number;
  targetFreq: number;
  isToneActive: boolean;
  pulseHistory: { type: '.' | '-'; timestamp: number }[];
}

export const AudioOscilloscope: React.FC<AudioOscilloscopeProps> = ({
  analyserNode,
  isListening,
  thresholdDb,
  currentDb,
  targetFreq,
  isToneActive,
  pulseHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 128;
    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.fillStyle = '#020617'; // slate-950
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (isListening && analyserNode) {
        analyserNode.getByteTimeDomainData(timeData);
        analyserNode.getByteFrequencyData(freqData);

        // Draw Frequency Spectrum Bars - Electric Blue Theme
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (freqData[i] / 255) * (height * 0.7);
          ctx.fillStyle = isToneActive ? `rgba(59, 130, 246, 0.6)` : `rgba(30, 58, 138, 0.3)`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        // Draw Waveform Line
        ctx.lineWidth = 2;
        ctx.strokeStyle = isToneActive ? '#60a5fa' : '#3b82f6'; // Bright electric blue
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let wx = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const wy = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(wx, wy);
          } else {
            ctx.lineTo(wx, wy);
          }
          wx += sliceWidth;
        }
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Threshold Line
        const normalizedThreshold = (thresholdDb + 60) / 60; // 0 to 1
        const threshY = height - normalizedThreshold * height;

        ctx.strokeStyle = '#ef4444'; // Red threshold line
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, threshY);
        ctx.lineTo(width, threshY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label threshold
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px monospace';
        ctx.fillText(`TRIGGER ${thresholdDb} dB`, 10, threshY - 4);
      } else {
        // Idle state wave placeholder
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SIGNAL DECODER STANDBY — CLICK "START LIVE LISTENING"', width / 2, height / 2 - 10);
      }

      // Draw Ticker Tape Pulse History at bottom of oscilloscope
      const tickerHeight = 28;
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.fillRect(0, height - tickerHeight, width, tickerHeight);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(0, height - tickerHeight, width, tickerHeight);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('PULSE TRACE:', 6, height - 10);

      // Draw last 22 pulses
      let px = 85;
      const recent = pulseHistory.slice(-22);
      recent.forEach((p) => {
        if (p.type === '.') {
          ctx.fillStyle = '#60a5fa'; // electric blue dot
          ctx.beginPath();
          ctx.arc(px, height - 14, 4, 0, Math.PI * 2);
          ctx.fill();
          px += 14;
        } else if (p.type === '-') {
          ctx.fillStyle = '#3b82f6'; // electric blue dash
          ctx.fillRect(px, height - 17, 12, 6);
          px += 18;
        }
      });

      // Target frequency readout
      ctx.fillStyle = '#60a5fa';
      ctx.font = '11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`TARGET: ${targetFreq} Hz | SIGNAL: ${Math.round(currentDb)} dB`, width - 10, 16);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyserNode, isListening, thresholdDb, currentDb, targetFreq, isToneActive, pulseHistory]);

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
      <canvas
        ref={canvasRef}
        width={600}
        height={180}
        className="w-full h-44 block object-cover"
      />
      {isToneActive && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-sm bg-blue-600/30 border border-blue-500 text-blue-400 text-xs font-mono font-bold flex items-center gap-2 animate-pulse uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          TONE ACTIVE
        </div>
      )}
    </div>
  );
};
