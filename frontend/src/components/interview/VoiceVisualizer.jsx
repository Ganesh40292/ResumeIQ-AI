import React, { useEffect, useRef } from 'react';

export default function VoiceVisualizer({ isActive, stream }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let dataArray = [];
    let bufferLength = 0;

    // Web Audio setup if actual stream is passed
    if (stream) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
      } catch (err) {
        console.error('Failed to initialize AudioContext visualizer', err);
      }
    }

    let phase = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas with deep transparent slate
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';

      if (isActive) {
        phase += 0.12;
        
        // Draw 3 layers of waves for depth (similar to Siri / Google wave)
        const waveCount = 3;
        const colors = [
          'rgba(99, 102, 241, 0.7)',  // indigo
          'rgba(16, 185, 129, 0.4)',  // emerald
          'rgba(139, 92, 246, 0.2)'   // violet
        ];

        // Gather real volume data if available
        let amplitude = 15;
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / bufferLength;
          amplitude = Math.max(8, (average / 128) * (height / 2.5));
        } else {
          // Simulated heartbeat amplitude
          amplitude = 12 + Math.sin(phase * 1.5) * 4;
        }

        for (let w = 0; w < waveCount; w++) {
          ctx.beginPath();
          ctx.strokeStyle = colors[w];
          
          const speed = (w + 1) * 0.4;
          const frequency = 0.015 - (w * 0.003);
          const offset = w * Math.PI * 0.5;

          for (let x = 0; x < width; x++) {
            // Sine wave calculation aligned to canvas center
            const y = (height / 2) + Math.sin(x * frequency + phase * speed + offset) * amplitude * Math.sin((x / width) * Math.PI);
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      } else {
        // Draw flat baseline if inactive
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)'; // slate-500 light
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [isActive, stream]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={60}
      className="w-full h-[60px] block rounded-xl"
    />
  );
}
