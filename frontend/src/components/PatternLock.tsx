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

  const handlePointerMove = (e: React.PointerEvent | React.TouchEvent | any) => {
    if (!isDrawing) return;
    
    // Get coordinates
    let clientX, clientY;
    if ('touches' in e) {
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

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      onComplete(pattern);
      // Brief timeout to let the user see their completed pattern before clearing
      setTimeout(() => setPattern([]), 600); 
    }
  };

  useEffect(() => {
    const handleUp = () => handlePointerUp();
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDrawing, pattern]);

  return (
    <div 
      className="relative w-64 h-64 mx-auto select-none touch-none bg-background rounded-xl p-2 border shadow-sm"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onTouchMove={handlePointerMove}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full relative z-10">
        {dots.map((index) => {
          const isSelected = pattern.includes(index);
          return (
            <div
              key={index}
              data-index={index}
              className="relative flex items-center justify-center w-full h-full cursor-pointer"
              onPointerDown={(e) => {
                // Prevent drag
                e.preventDefault();
                handlePointerDown(index);
              }}
              onTouchStart={(e) => {
                handlePointerDown(index);
              }}
            >
              {/* Hitbox area */}
              <div 
                className="absolute w-12 h-12 rounded-full z-0" 
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
