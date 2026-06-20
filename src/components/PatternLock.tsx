import React, { useState, useRef, useEffect } from 'react';
import { cn } from '#/lib/utils';

interface PatternLockProps {
  onComplete: (pattern: number[]) => void;
  error?: boolean;
}

export function PatternLock({ onComplete, error }: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 9 dots (0-8)
  const dots = Array.from({ length: 9 }, (_, i) => i);

  const handlePointerDown = (index: number) => {
    setIsDrawing(true);
    setPattern([index]);
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent | TouchEvent) => {
      if (!isDrawing) return;
      
      let clientX, clientY;
      if (e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const element = document.elementFromPoint(clientX, clientY);
      if (element && element.hasAttribute('data-index')) {
        const index = parseInt(element.getAttribute('data-index')!, 10);
        if (!pattern.includes(index)) {
          setPattern((prev) => [...prev, index]);
        }
      }
    };

    const handleUp = () => {
      if (isDrawing) {
        setIsDrawing(false);
        onComplete(pattern);
        setTimeout(() => setPattern([]), 600); 
      }
    };

    if (isDrawing) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
      window.addEventListener('touchcancel', handleUp);
    }

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
    };
  }, [isDrawing, pattern]);

  return (
    <div 
      className="relative w-full max-w-[320px] aspect-square mx-auto select-none touch-none bg-background rounded-xl p-4 sm:p-6 border shadow-sm"
      ref={containerRef}
      onPointerDown={(e) => {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (element && element.hasAttribute('data-index')) {
          setIsDrawing(true);
          setPattern([parseInt(element.getAttribute('data-index')!, 10)]);
        }
      }}
      onTouchStart={(e) => {
        const element = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
        if (element && element.hasAttribute('data-index')) {
          setIsDrawing(true);
          setPattern([parseInt(element.getAttribute('data-index')!, 10)]);
        }
      }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-2 sm:gap-6 w-full h-full relative z-10">
        {dots.map((index) => {
          const isSelected = pattern.includes(index);
          return (
            <div
              key={index}
              data-index={index}
              className="relative flex items-center justify-center w-full h-full cursor-pointer"
              onPointerDown={(e) => {
                e.preventDefault();
              }}
            >
              {/* Hitbox area - smaller so they have to touch near the middle */}
              <div 
                className="absolute w-8 h-8 rounded-full z-0" 
                data-index={index}
              />
              {/* Visual dot */}
              <div 
                className={cn(
                  "w-5 h-5 rounded-full transition-all duration-200 z-10 pointer-events-none",
                  isSelected 
                    ? (error ? "bg-red-500 scale-150 shadow-md" : "bg-primary scale-150 shadow-md") 
                    : "bg-muted-foreground/30",
                )} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
