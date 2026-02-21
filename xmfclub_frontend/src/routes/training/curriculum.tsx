import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  Dumbbell, 
  Swords, 
  Zap, 
  ChevronRight, 
  Check, 
  Plus, 
  Trash2,
  Info
} from 'lucide-react'

export const Route = createFileRoute('/training/curriculum')({
  component: CurriculumPage,
})

type Module = {
  id: string;
  name: string;
  description: string;
  price?: string; // Optional if we want to add pricing later
};

type Discipline = {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  modules: Module[];
};

const disciplines: Discipline[] = [
  {
    id: 'calisthenics',
    name: 'Calisthenics',
    icon: <Dumbbell className="w-6 h-6" />,
    description: 'Master bodyweight strength and fluid movement.',
    modules: [
      { id: 'cal-upper', name: 'Upper Body Strength', description: 'Push-ups, Pull-ups, and Dips progressions.' },
      { id: 'cal-core', name: 'Core Stability', description: 'Planks, L-sits, and Hollow body mastery.' },
      { id: 'cal-lower', name: 'Lower Body Power', description: 'Explosive squats and pistol progressions.' },
      { id: 'cal-skills', name: 'Static Skills', description: 'Handstands and Muscle-up techniques.' },
    ]
  },
  {
    id: 'martial-arts',
    name: 'Martial Arts',
    icon: <Swords className="w-6 h-6" />,
    description: 'Traditional discipline meets modern combat.',
    modules: [
      { id: 'ma-tkd-f', name: 'TKD Fundamentals', description: 'Basic stances, blocks, and strikes.' },
      { id: 'ma-tkd-k', name: 'Advanced Kicking', description: 'Spinning and jumping kick variations.' },
      { id: 'ma-bo', name: 'Bo-Staff Basics', description: 'Traditional weapon handling and patterns.' },
      { id: 'ma-spar', name: 'Combat Sparring', description: 'Reactive drills and tactical movement.' },
    ]
  },
  {
    id: 'boxing',
    name: 'Boxing',
    icon: <Zap className="w-6 h-6" />,
    description: 'Precision striking and elite conditioning.',
    modules: [
      { id: 'box-foot', name: 'Footwork & Agility', description: 'Movement patterns and ring control.' },
      { id: 'box-punch', name: 'Power Punching', description: 'Hook, Cross, and Uppercut mechanics.' },
      { id: 'box-def', name: 'Defense & Slips', description: 'Head movement and counter-striking.' },
    ]
  }
];

function CurriculumPage() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline>(disciplines[0]);
  const [cart, setCart] = useState<Module[]>([]);

  const toggleModule = (module: Module) => {
    setCart(prev => 
      prev.find(m => m.id === module.id) 
        ? prev.filter(m => m.id !== module.id)
        : [...prev, module]
    );
  };

  const isSelected = (moduleId: string) => cart.some(m => m.id === moduleId);

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
            BUILD YOUR <span className="text-primary">PLAN</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Select your disciplines and choose specific modules to create a personalized training program. Alacarte training, redefined.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Level 1: Disciplines */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-4 px-2">1. Choose Discipline</h3>
            {disciplines.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDiscipline(d)}
                className={`w-full p-6 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                  selectedDiscipline.id === d.id 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : 'bg-card border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl transition-colors ${selectedDiscipline.id === d.id ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}>
                    {d.icon}
                  </div>
                  <div>
                    <h4 className="font-bold tracking-widest uppercase text-sm">{d.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{d.description}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform ${selectedDiscipline.id === d.id ? 'translate-x-1' : 'opacity-0'}`} />
              </button>
            ))}
          </div>

          {/* Level 2: Modules */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-black tracking-widest text-muted-foreground uppercase mb-4 px-2">2. Select Modules</h3>
            <div className="grid grid-cols-1 gap-4">
              {selectedDiscipline.modules.map((m) => (
                <div
                  key={m.id}
                  onClick={() => toggleModule(m)}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    isSelected(m.id)
                      ? 'bg-primary/5 border-primary/50'
                      : 'bg-card border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                      <h4 className={`font-bold tracking-wide transition-colors ${isSelected(m.id) ? 'text-primary' : 'text-foreground'}`}>
                        {m.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected(m.id) ? 'bg-primary border-primary text-white' : 'border-white/20 text-transparent'
                    }`}>
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                  {!isSelected(m.id) && (
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary / Cart */}
          <div className="lg:col-span-3">
            <div className="sticky top-32 glass-card p-6 border-primary/20">
              <h3 className="text-xs font-black tracking-widest text-primary uppercase mb-6 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" />
                Your Selection
              </h3>
              
              {cart.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No modules selected yet.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {cart.map((m) => (
                    <div key={m.id} className="flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Module</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleModule(m); }}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold uppercase">Total Modules</span>
                  <span className="text-xl font-black text-primary">{cart.length}</span>
                </div>
                
                <button 
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-primary text-white font-black tracking-widest text-xs rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform uppercase shadow-lg shadow-primary/20"
                >
                  Confirm Program
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
