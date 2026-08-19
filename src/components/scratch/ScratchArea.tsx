import React, { useRef, useEffect, useState } from 'react';
import { useFileUrl } from '@/hooks/useFileUrl';

interface ScratchAreaProps {
  coverImage?: string;
  resultImage?: string;
  onComplete: () => void;
  isAutoRevealing?: boolean;
}

export function ScratchArea({ coverImage, resultImage, onComplete, isAutoRevealing }: ScratchAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedPercentage, setScratchedPercentage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  const coverUrl = useFileUrl(coverImage);
  const resultUrl = useFileUrl(resultImage);

  const SCRATCH_THRESHOLD = 50; // Reveal everything after 50%

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !coverUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverUrl;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-out';
    };
  }, [coverUrl]);

  useEffect(() => {
    if (isAutoRevealing && !isFinished) {
      revealAll();
    }
  }, [isAutoRevealing]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    
    // Calculate scale factor if canvas is resized by CSS
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isFinished) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPointerPos(e);
    
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    checkPercentage();
  };

  const checkPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) transparentCount++;
    }

    const percentage = (transparentCount / (pixels.length / 4)) * 100;
    setScratchedPercentage(percentage);

    if (percentage > SCRATCH_THRESHOLD && !isFinished) {
      revealAll();
    }
  };

  const revealAll = () => {
    setIsFinished(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Fade out animation simulation
    canvas.style.transition = 'opacity 0.5s ease-out';
    canvas.style.opacity = '0';
    
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <div className="relative aspect-[4/3] w-full max-w-md mx-auto overflow-hidden rounded-2xl border-4 border-primary/20 bg-surface shadow-2xl">
      {/* Background Result */}
      <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
        {resultUrl ? (
          <img src={resultUrl} alt="Resultado" className="max-w-full max-h-full object-contain animate-in zoom-in duration-500" />
        ) : (
          <div className="space-y-2 animate-pulse">
            <div className="size-20 mx-auto bg-primary/10 rounded-full" />
            <div className="h-4 w-32 bg-primary/5 rounded mx-auto" />
          </div>
        )}
      </div>

      {/* Scratch Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 size-full touch-none cursor-crosshair z-10"
        onMouseDown={() => setIsDrawing(true)}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onMouseMove={scratch}
        onTouchStart={() => setIsDrawing(true)}
        onTouchEnd={() => setIsDrawing(false)}
        onTouchMove={scratch}
      />
      
      {/* Percentage Indicator (Optional) */}
      {!isFinished && scratchedPercentage > 5 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary border border-primary/20">
          REVELANDO {Math.round(scratchedPercentage)}%
        </div>
      )}
    </div>
  );
}
