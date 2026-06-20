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
}

export function CustomSelect({ value, onChange, options, placeholder = "Select..." }: Props) {
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
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold cursor-pointer flex items-center justify-between"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
              className={`px-4 py-3 text-sm cursor-pointer hover:bg-white/5 font-bold transition-colors ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-foreground'}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
