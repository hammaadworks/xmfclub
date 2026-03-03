import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Zap
} from 'lucide-react'

export const Route = createFileRoute('/demo/booking')({
  component: DemoBookingPage,
})

const TIME_SLOTS = [
  '06:00 AM', '07:00 AM', '08:00 AM', '05:00 PM', '06:00 PM', '07:00 PM'
];

function DemoBookingPage() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: 'General Fitness'
  });

  const nextStep = () => setStep(prev => prev + 1);
  
  if (step === 4) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase italic tracking-tight">Booking <span className="text-primary">Confirmed.</span></h1>
            <p className="text-muted-foreground font-medium">
              Your demo session has been scheduled. We've sent a confirmation to <span className="text-white font-bold">{formData.email}</span>.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-left">
            <div className="flex items-center gap-4 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="font-bold uppercase tracking-widest text-sm">{selectedDate}</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-bold uppercase tracking-widest text-sm">{selectedTime}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">
            See you at the club!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
        {/* Left: Content */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] tracking-[0.3em] uppercase">
              <Zap className="w-3 h-3 fill-current" /> Path to Excellence
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
              BOOK A <br /> <span className="text-primary">DEMO.</span>
            </h1>
            <p className="text-muted-foreground text-xl font-medium leading-relaxed max-w-lg">
              Experience the energy of XMFCLUB firsthand. Schedule a trial session with our head trainers and see why we're Karnataka's elite martial arts community.
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black uppercase italic text-white/90">Expert Guidance</h4>
                <p className="text-muted-foreground text-sm font-medium mt-1">Talk to Farhan Khan XMF or our senior black belts about your fitness goals.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-black uppercase italic text-white/90">Instant Support</h4>
                <p className="text-muted-foreground text-sm font-medium mt-1">Get immediate answers to your questions about our Alacarte system.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="lg:col-span-7">
          <div className="glass-card p-10 border-white/10 rounded-[3rem] shadow-2xl relative">
            {/* Step Indicators */}
            <div className="flex gap-2 mb-12">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-white/5'}`} 
                />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <h3 className="text-3xl font-black uppercase italic tracking-tight">Select a <span className="text-primary">Date.</span></h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {['Oct 24', 'Oct 25', 'Oct 26', 'Oct 27', 'Oct 28', 'Oct 29'].map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-6 rounded-3xl border transition-all text-center group ${
                        selectedDate === date 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white/2 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="block text-xs font-black tracking-widest uppercase opacity-60 mb-1">Thu</span>
                      <span className="text-lg font-black italic">{date}</span>
                    </button>
                  ))}
                </div>
                <button 
                  disabled={!selectedDate}
                  onClick={nextStep}
                  className="w-full py-6 bg-primary text-white font-black tracking-widest text-xs rounded-2xl disabled:opacity-30 hover:bg-primary/90 transition-all uppercase flex items-center justify-center gap-3"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <h3 className="text-3xl font-black uppercase italic tracking-tight">Select <span className="text-primary">Time.</span></h3>
                <div className="grid grid-cols-2 gap-4">
                  {TIME_SLOTS.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`p-6 rounded-3xl border transition-all text-center group ${
                        selectedTime === time 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white/2 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <Clock className={`w-4 h-4 mx-auto mb-2 ${selectedTime === time ? 'text-white' : 'text-primary'}`} />
                      <span className="text-lg font-black italic">{time}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="px-8 py-6 bg-white/5 text-white font-black tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Back</button>
                  <button 
                    disabled={!selectedTime}
                    onClick={nextStep}
                    className="flex-1 py-6 bg-primary text-white font-black tracking-widest text-xs rounded-2xl disabled:opacity-30 hover:bg-primary/90 transition-all uppercase flex items-center justify-center gap-3"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                <h3 className="text-3xl font-black uppercase italic tracking-tight">Your <span className="text-primary">Details.</span></h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="text" 
                          placeholder="Bruce Lee"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-white/20 focus:border-primary focus:bg-primary/5 transition-all outline-none"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="tel" 
                          placeholder="+91 98765 43210"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-white/20 focus:border-primary focus:bg-primary/5 transition-all outline-none"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input 
                        type="email" 
                        placeholder="warrior@xmfclub.com"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold placeholder:text-white/20 focus:border-primary focus:bg-primary/5 transition-all outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="px-8 py-6 bg-white/5 text-white font-black tracking-widest text-xs rounded-2xl hover:bg-white/10 transition-all uppercase">Back</button>
                  <button 
                    disabled={!formData.name || !formData.email || !formData.phone}
                    onClick={nextStep}
                    className="flex-1 py-6 bg-primary text-white font-black tracking-widest text-xs rounded-2xl disabled:opacity-30 hover:bg-primary/90 transition-all uppercase flex items-center justify-center gap-3"
                  >
                    Confirm Booking <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
