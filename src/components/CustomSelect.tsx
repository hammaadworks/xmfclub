import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

type Option = {
  label: string;
  value: string;
}

type Props = {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  id?: string;
  'aria-label'?: string;
}

export function CustomSelect({ value, onChange, options, placeholder = "Select...", id, 'aria-label': ariaLabel }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        type="button"
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || placeholder}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-left focus:outline-none focus:border-primary/50 transition-colors duration-150 font-bold cursor-pointer flex items-center justify-between text-white"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div 
          role="listbox"
          aria-label={ariaLabel || placeholder}
          className="absolute top-full mt-2 w-full bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95"
        >
          {options.map((opt) => (
            <div 
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(opt.value);
                  setIsOpen(false);
                }
              }}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/5 font-bold transition-colors duration-150 ${value === opt.value ? 'bg-primary/20 text-primary-light' : 'text-foreground'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
