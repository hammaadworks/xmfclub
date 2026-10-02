import { useState, useEffect, useRef, useCallback } from 'react';
import { Delete } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PinPad({ onComplete, error }: PinPadProps) {
  const [pin, setPin] = useState<string>('');
  const pinRef = useRef<string>('');
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useEffect(() => {
    if (error) {
      // Small delay before clearing to show the error state briefly
      const t = setTimeout(() => {
        pinRef.current = '';
        setPin('');
      }, 500);
      return () => {
        clearTimeout(t);
      };
    }
  }, [error]);

  const handlePress = useCallback((num: string) => {
    if (pinRef.current.length < 5) {
      const newPin = pinRef.current + num;
      pinRef.current = newPin;
      setPin(newPin);
      if (newPin.length === 5) {
        onCompleteRef.current(newPin);
      }
    }
  }, []);

  const handleBackspace = useCallback(() => {
    if (pinRef.current.length > 0) {
      const newPin = pinRef.current.slice(0, -1);
      pinRef.current = newPin;
      setPin(newPin);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePress, handleBackspace]);

  const dots = Array.from({ length: 5 }).map((_, i) => (
    <div 
      key={i}
      className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
        i < pin.length 
          ? 'bg-primary border-primary scale-110' 
          : 'bg-transparent border-muted-foreground/30'
      } ${error ? 'bg-red-500 border-red-500 animate-pulse' : ''}`}
    />
  ));

  return (
    <div className="flex flex-col items-center space-y-8 select-none touch-none">
      <div className="flex space-x-4 mb-4">
        {dots}
      </div>
      
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-light hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty space for bottom-left */}
        <button
          onClick={() => handlePress('0')}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-light hover:bg-white/10 active:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          disabled={pin.length === 0}
          className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none disabled:opacity-30"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
