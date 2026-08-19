import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { throttle } from 'lodash-es';
import { useFileUrl } from '@/hooks/useFileUrl';

interface ScratchAreaProps {
  coverImage?: string | null;
  resultImage?: string | null;
  onComplete: () => void;
  isAutoRevealing?: boolean;
  isWinner?: boolean;
}

export function ScratchArea({ 
  coverImage, 
  resultImage, 
  onComplete, 
  isAutoRevealing,
  isWinner 
}: ScratchAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const coverUrl = useFileUrl(coverImage);
  const resultUrl = useFileUrl(resultImage);

  const SCRATCH_THRESHOLD = 45; // Slightly lower threshold for better UX
  const BRUSH_SIZE = 80; // Larger brush size as requested by user

  // Initialize Canvas with cover image and premium effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !coverUrl) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;
    img.onload = () => {
      // Clear and draw cover
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add Premium Shine Overlay
      ctx.globalCompositeOperation = 'source-atop';
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Set for scratching
      ctx.globalCompositeOperation = 'destination-out';
    };
  }, [coverUrl]);

  // Handle Auto-Reveal
  useEffect(() => {
    if (isAutoRevealing && !isFinished) {
      revealAll();
    }
  }, [isAutoRevealing]);

  const checkPercentage = useCallback(
    throttle(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparentCount = 0;

      // Sample every 4th pixel for performance
      for (let i = 0; i < pixels.length; i += 16) {
        if (pixels[i + 3] === 0) transparentCount++;
      }

      const totalSamples = pixels.length / 16;
      const percentage = (transparentCount / totalSamples) * 100;
      setScratchedPercentage(percentage);

      if (percentage > SCRATCH_THRESHOLD && !isFinished) {
        revealAll();
      }
    }, 200),
    [isFinished]
  );

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e && 'touches' in e && e.touches[0] ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = e && 'touches' in e && e.touches[0] ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isFinished) return;
    setIsDrawing(true);
    // Initial scratch at start point
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isFinished) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPointerPos(e);
    
    ctx.lineWidth = BRUSH_SIZE;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Haptic Feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }

    checkPercentage();
  };

  const revealAll = () => {
    if (isFinished) return;
    setIsFinished(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Smooth reveal animation
    canvas.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), filter 0.8s ease-out';
    canvas.style.opacity = '0';
    canvas.style.filter = 'blur(10px)';
    
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-[4/3] w-full max-w-[min(450px,92vw)] mx-auto overflow-hidden rounded-3xl border-4 border-primary/20 bg-surface shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] group/scratch select-none"
      style={{
        perspective: '1000px'
      }}
    >
      {/* Background Result Layer */}
      <div className="absolute inset-0 flex items-center justify-center bg-surface-2 overflow-hidden">
        <AnimatePresence mode="wait">
          {resultUrl ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative size-full flex items-center justify-center"
            >
              <img 
                src={resultUrl} 
                alt="Resultado" 
                className="size-full object-cover drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]" 
              />
              
              {/* Shine effect for winners */}
              {isWinner && (
                <motion.div
                  animate={{ 
                    left: ['-100%', '200%'],
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear",
                    repeatDelay: 1
                  }}
                  className="absolute top-0 w-20 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg]"
                />
              )}
            </motion.div>
          ) : (
            <div className="space-y-4 animate-pulse">
              <div className="size-24 mx-auto bg-primary/5 rounded-full border border-primary/10 flex items-center justify-center">
                <div className="size-16 bg-primary/10 rounded-full" />
              </div>
              <div className="h-4 w-40 bg-primary/5 rounded-full mx-auto" />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Scratch Layer */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 size-full touch-none cursor-crosshair z-10 transition-opacity duration-700"
        onMouseDown={handleStart}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseMove={draw}
        onTouchStart={handleStart}
        onTouchEnd={() => setIsDrawing(false)}
        onTouchMove={draw}
      />
      
      {/* Decorative Border Glow */}
      <div className="absolute inset-0 pointer-events-none border border-primary/10 rounded-[1.4rem] z-20 group-hover/scratch:border-primary/30 transition-colors" />

      {/* Particle Overlay (CSS Based for efficiency) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-15">
        <div className="absolute inset-[-100%] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-[pulse_4s_infinite]" />
      </div>

      {/* UX Indicators */}
      {!isFinished && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          {scratchedPercentage > 2 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-primary border border-primary/30 uppercase tracking-widest"
            >
              {Math.round(scratchedPercentage)}% revelado
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
