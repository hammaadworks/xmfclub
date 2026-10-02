import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

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
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={`relative w-full ${isOpen ? 'z-50' : 'z-auto'}`} ref={containerRef}>
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
          className="absolute top-full mt-2 w-full bg-[#141414] border border-white/15 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 divide-y divide-white/5"
        >
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button 
                type="button"
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-3 text-sm text-left cursor-pointer hover:bg-white/10 font-bold transition-colors duration-150 flex items-center justify-between ${
                  isSelected ? 'bg-primary/20 text-primary-light' : 'text-zinc-200'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-primary-light shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
