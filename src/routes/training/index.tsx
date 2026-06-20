import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Dumbbell, 
  Swords, 
  Zap, 
  ChevronRight, 
  Check, 
  Plus, 
  Trash2,
  Info,
  Clock,
  Calendar,
  ArrowRight,
  AlertCircle,
  Trophy,
  Loader2
} from 'lucide-react'
import { fetchApi } from '../../lib/api'

export const Route = createFileRoute('/training/')({
  component: CurriculumPage,
})

interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
}

interface InventorySlot {
  id: string;
  module_id: string;
  trainer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_enrollment: number;
  is_full: boolean;
}

const CATEGORIES = [
  { id: 'calisthenics', name: 'Calisthenics', icon: <Dumbbell className="w-5 h-5" />, desc: 'Strength & Flow' },
  { id: 'martial-arts', name: 'Martial Arts', icon: <Swords className="w-5 h-5" />, desc: 'Discipline & Combat' },
  { id: 'boxing', name: 'Boxing', icon: <Zap className="w-5 h-5" />, desc: 'Precision & Power' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CurriculumPage() {
  const navigate = useNavigate();
  const [modules, setModules] = useState<Module[]>([]);
  const [inventory, setInventory] = useState<InventorySlot[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, InventorySlot>>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Simulating data since backend is not fully connected yet
        setModules([
          { id: 'm1', name: 'Handstand Mastery', category: 'calisthenics', description: 'Perfect your handstand from scratch to one-arm.', price: 1500 },
          { id: 'm2', name: 'Muscle-Up Protocol', category: 'calisthenics', description: 'Strict rings and bar muscle-up training.', price: 2000 },
          { id: 'm3', name: 'Muay Thai Fundamentals', category: 'martial-arts', description: 'Striking, clinching, and sparring basics.', price: 2500 },
          { id: 'm4', name: 'Judo Throws', category: 'martial-arts', description: 'Learn to throw with perfect technique.', price: 2000 },
          { id: 'm5', name: 'Heavy Bag Workout', category: 'boxing', description: 'Power and endurance conditioning.', price: 1500 }
        ]);
        setInventory([
          { id: 'i1', module_id: 'm1', trainer_id: 't1', day_of_week: 1, start_time: '18:00', end_time: '19:00', max_capacity: 10, current_enrollment: 5, is_full: false },
          { id: 'i2', module_id: 'm1', trainer_id: 't1', day_of_week: 3, start_time: '19:00', end_time: '20:00', max_capacity: 10, current_enrollment: 10, is_full: true },
          { id: 'i3', module_id: 'm2', trainer_id: 't2', day_of_week: 2, start_time: '17:00', end_time: '18:00', max_capacity: 5, current_enrollment: 2, is_full: false },
          { id: 'i4', module_id: 'm3', trainer_id: 't3', day_of_week: 4, start_time: '18:00', end_time: '19:30', max_capacity: 15, current_enrollment: 12, is_full: false },
          { id: 'i5', module_id: 'm4', trainer_id: 't4', day_of_week: 5, start_time: '19:00', end_time: '20:30', max_capacity: 12, current_enrollment: 12, is_full: true },
          { id: 'i6', module_id: 'm5', trainer_id: 't5', day_of_week: 6, start_time: '10:00', end_time: '11:00', max_capacity: 20, current_enrollment: 5, is_full: false },
        ]);
      } catch (error) {
        console.error('Failed to load curriculum data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Component mounted
  }, []);

  const handleEnroll = async () => {
    if (selectedModules.length === 0) return;
    
    // Feature not fully implemented for MVP demo, show Contact Modal
    window.dispatchEvent(new CustomEvent('showContactModal'));
  };

  const toggleModule = (module: Module) => {
    setSelectedModules(prev => {
      const exists = prev.find(m => m.id === module.id);
      if (exists) {
        const next = prev.filter(m => m.id !== module.id);
        const newSlots = { ...selectedSlots };
        delete newSlots[module.id];
        setSelectedSlots(newSlots);
        return next;
      }
      return [...prev, module];
    });
  };

  const selectSlot = (moduleId: string, slot: InventorySlot) => {
    setSelectedSlots(prev => ({
      ...prev,
      [moduleId]: slot
    }));
  };

  const isModuleSelected = (moduleId: string) => selectedModules.some(m => m.id === moduleId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filteredModules = modules.filter(m => m.category === selectedCategory);
  const totalPrice = selectedModules.reduce((sum, m) => sum + m.price, 0);

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 text-primary font-black text-[10px] tracking-[0.3em] uppercase mb-4">
            <Zap className="w-3 h-3 fill-current" /> A la Carte Builder
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 tracking-tighter uppercase italic leading-none break-words">
            BUILD YOUR <span className="brand-gradient bg-clip-text text-transparent">LEGACY.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Personalize your training program. Choose exactly what you want to master, when you want to train.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Step 1: Categories */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-6 px-2">1. Select Discipline</h3>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full p-5 rounded-2xl border transition-all text-left group cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                      : 'bg-white/2 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${selectedCategory === cat.id ? 'bg-gradient-to-r from-primary to-accent text-white' : 'bg-white/5 text-muted-foreground'}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="font-bold tracking-widest uppercase text-xs">{cat.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-tight">{cat.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Modules */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-6 px-2">2. Choose Modules</h3>
            <div className="space-y-4">
              {filteredModules.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-white/10 rounded-3xl">
                  <p className="text-muted-foreground text-sm uppercase font-bold">Coming Soon to this category</p>
                </div>
              ) : (
                filteredModules.map((m) => (
                  <div key={m.id} className="space-y-4">
                    <div
                      onClick={() => toggleModule(m)}
                      className={`p-6 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden ${
                        isModuleSelected(m.id)
                          ? 'bg-primary/5 border-primary/50'
                          : 'bg-card border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between relative z-10">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`text-lg font-black uppercase italic transition-colors ${isModuleSelected(m.id) ? 'text-primary' : 'text-foreground'}`}>
                              {m.name}
                            </h4>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground tracking-widest uppercase">
                              ₹{m.price}/mo
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                            {m.description}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isModuleSelected(m.id) ? 'bg-primary border-primary text-white scale-110' : 'border-white/20 text-transparent'
                        }`}>
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Slots (Only if module is selected) */}
                    {isModuleSelected(m.id) && (
                      <div className="pl-6 animate-in slide-in-from-left-4 duration-300">
                        <h5 className="text-[10px] font-black tracking-widest text-primary uppercase mb-3 flex items-center gap-2">
                          <Clock className="w-3 h-3" /> Select Time Slot
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {inventory.filter(s => s.module_id === m.id).map((slot) => (
                            <button
                              key={slot.id}
                              disabled={slot.is_full}
                              onClick={() => selectSlot(m.id, slot)}
                              className={`p-4 rounded-2xl border text-left transition-all relative ${
                                selectedSlots[m.id]?.id === slot.id
                                  ? 'bg-gradient-to-r from-primary to-accent text-white border-primary'
                                  : slot.is_full
                                    ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                                    : 'bg-white/2 border-white/5 hover:border-primary/30'
                              }`}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                  {DAYS[slot.day_of_week]}
                                </span>
                                <span className="text-sm font-black italic">
                                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                                </span>
                              </div>
                              {slot.is_full && (
                                <span className="absolute top-2 right-2 text-[8px] font-black bg-destructive text-white px-1.5 py-0.5 rounded uppercase">
                                  Full
                                </span>
                              )}
                              {!slot.is_full && (
                                <span className="absolute top-2 right-2 text-[8px] font-black bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase">
                                  {slot.max_capacity - slot.current_enrollment} Left
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 4: Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 glass-card p-8 border-primary/20 rounded-[2.5rem] shadow-2xl shadow-primary/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black tracking-widest text-primary uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 fill-current" />
                  Your Program
                </h3>
                <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-primary/10 text-primary uppercase">
                  V1.0
                </span>
              </div>
              
              {selectedModules.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-muted-foreground opacity-30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Select a module <br /> to begin</p>
                </div>
              ) : (
                <div className="space-y-6 mb-10">
                  {selectedModules.map((m) => (
                    <div key={m.id} className="group flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black uppercase italic">{m.name}</span>
                        <button 
                          onClick={() => toggleModule(m)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {selectedSlots[m.id] ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                          <Calendar className="w-3 h-3" />
                          {DAYS[selectedSlots[m.id].day_of_week]} • {selectedSlots[m.id].start_time.slice(0, 5)}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-destructive uppercase animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Select Time Slot
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-8 border-t border-white/10">
                <div className="flex justify-between items-end mb-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Monthly</span>
                    <span className="text-4xl font-black italic uppercase leading-none">₹{totalPrice}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Items</span>
                    <span className="text-xl font-black italic">{selectedModules.length}</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling || selectedModules.length === 0 || selectedModules.some(m => !selectedSlots[m.id])}
                  className="w-full py-6 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-2xl disabled:opacity-30 disabled:grayscale hover:scale-[1.02] active:scale-95 transition-all uppercase shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
                >
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Confirm & Enroll <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <p className="mt-6 text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest leading-loose">
                  By enrolling, you agree to the <br /> 
                  <span className="text-white">XMFCLUB Membership Terms</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming Soon Callout */}
        <div className="mt-20 p-8 rounded-3xl border border-white/10 bg-white/5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50" />
          <h3 className="text-xl font-black uppercase tracking-widest text-primary mb-2 relative z-10">Advanced A La Carte Subscriptions Coming Soon</h3>
          <p className="text-muted-foreground text-sm font-medium max-w-xl mx-auto relative z-10">
            We are fine-tuning our billing engine to support custom multi-module memberships. You will soon be able to build your perfect schedule directly from the app!
          </p>
        </div>
      </div>
    </div>
  );
}
