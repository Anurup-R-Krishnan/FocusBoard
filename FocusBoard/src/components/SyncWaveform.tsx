import React, { useEffect, useRef } from 'react';

interface SyncWaveformProps {
  isActive: boolean;
  isDistracted: boolean;
}

const SyncWaveform: React.FC<SyncWaveformProps> = ({ isActive, isDistracted }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const draw = () => {
      // Resize handling logic could be added here, but for now assume fixed container
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      
      // Styling based on state
      const baseColor = isDistracted ? '255, 59, 48' : '47, 88, 205'; // Red or Blue
      
      // Draw multiple lines for "thick" waveform effect
      const lines = 3;
      for (let j = 0; j < lines; j++) {
        ctx.beginPath();
        const amplitude = isActive ? (isDistracted ? 15 : 10) : 2; 
        const frequency = isDistracted ? 0.2 : 0.05;
        const speed = isDistracted ? 0.5 : 0.1;
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(${baseColor}, ${1 - (j * 0.3)})`;

        for (let i = 0; i < width; i++) {
            // Composite Sine Wave
            const y = centerY + 
                Math.sin(i * frequency + t * speed + j) * amplitude * Math.sin(i * 0.01) +
                Math.sin(i * 0.1 + t * 2) * (amplitude * 0.2); 
            
            if (i === 0) ctx.moveTo(i, y);
            else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }

      t += 1;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, isDistracted]);

  return (
    <canvas 
      ref={canvasRef} 
      width={200} 
      height={60} 
      className="w-full h-full rounded-lg"
      aria-label="Team Focus Waveform"
      role="img"
    />
  );
};

export default SyncWaveform;