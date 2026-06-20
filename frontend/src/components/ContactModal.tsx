import { useEffect, useState } from 'react';
import { ShieldAlert, X, Phone, MessageCircle } from 'lucide-react';

export function ContactModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('showContactModal', handleOpen);
    return () => window.removeEventListener('showContactModal', handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl animate-fade-in text-center flex flex-col items-center">
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">
          Admin Action Required
        </h2>
        
        <p className="text-muted-foreground font-medium mb-8">
          Contact Master Farhan for more info / payments.
        </p>

        <div className="w-full flex flex-col gap-3">
          <a 
            href="tel:8884503703"
            className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-white/10 transition-colors border border-white/10"
          >
            <Phone className="w-4 h-4" />
            Call 8884503703
          </a>

          <a 
            href="https://wa.me/918884503703?text=Hi%20Master%20Farhan,%20I%20would%20like%20to%20know%20more%20about%20XMFCLUB."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white font-black uppercase tracking-widest text-sm rounded-xl hover:scale-105 transition-transform shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
