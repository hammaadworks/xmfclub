import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Zap,
  Swords,
  Dumbbell,
  Target,
  Trophy,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Users,
  Star,
  Play
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* 1. TRUST: Hero Section with Social Proof */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/10 blur-[140px] rounded-full -z-10" />
        
        {/* Visual Filler: Background Image Overlay */}
        <div className="absolute inset-0 opacity-10 -z-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=2000&auto=format&fit=crop" 
            className="w-full h-full object-cover" 
            alt="Training Background"
          />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-primary mb-10 animate-fade-in uppercase">
            <Trophy className="w-3 h-3 fill-current" />
            <span>EST. 2012 • 45+ NATIONAL GOLD MEDALS</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter uppercase italic">
            FORCE <br />
            <span className="text-primary">MULTIPLIED.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            From Middle School Champions to Elite Professionals. Master the art of discipline through our modular training system.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-lg">
            <Link 
              to="/training/curriculum"
              className="w-full sm:flex-1 px-10 py-5 bg-primary text-white font-black tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-primary/30 uppercase"
            >
              Build Your Plan <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white font-black tracking-widest text-xs rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase flex items-center justify-center gap-3">
              <Play className="w-4 h-4 fill-current" /> Watch Intro
            </button>
          </div>

          {/* Quick Trust Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 opacity-60">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">500+</span>
              <span className="text-[10px] font-black tracking-widest uppercase">Students</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">12yr</span>
              <span className="text-[10px] font-black tracking-widest uppercase">Legacy</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">45</span>
              <span className="text-[10px] font-black tracking-widest uppercase">Golds</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">Elite</span>
              <span className="text-[10px] font-black tracking-widest uppercase">Faculty</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SALES: The Alacarte Hook (Conversion Focused) */}
      <section className="py-24 px-6 relative overflow-hidden bg-primary/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-primary/20 shadow-2xl group">
             <img 
              src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" 
              alt="Curriculum Preview"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-12">
                <div className="text-3xl font-black text-white uppercase italic leading-tight">
                  Stop Paying For <br />
                  <span className="text-primary text-4xl">Filler Content.</span>
                </div>
             </div>
          </div>
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 text-primary font-black text-xs tracking-widest uppercase">
              <Zap className="w-4 h-4 fill-current" /> The Alacarte System
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic">
              YOU CHOOSE THE <br />
              <span className="text-primary">CURRICULUM.</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
              XMFCLUB is built on modularity. Why pay for a full martial arts course when you only want to master Bo-Staff strikes? Or Calisthenics upper-body strength? 
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><ChevronRight className="w-4 h-4" /></div>
                2-Level Nesting Choice
              </li>
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><ChevronRight className="w-4 h-4" /></div>
                Pay Per Module
              </li>
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><ChevronRight className="w-4 h-4" /></div>
                Lifetime Access
              </li>
            </ul>
            <Link 
              to="/training/curriculum"
              className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black font-black tracking-widest text-xs rounded-2xl hover:bg-primary hover:text-white hover:scale-105 transition-all shadow-xl uppercase"
            >
              Go to Curriculum <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE: Bento Grid for Brand Expansion */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black tracking-[0.4em] text-muted-foreground uppercase mb-4">Explore the Universe</h2>
          <h3 className="text-4xl font-black tracking-tighter uppercase italic">The XMF <span className="text-primary">Lifestyle</span></h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          {/* Hall of Fame Tile */}
          <Link to="/achievements" className="md:col-span-8 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1200&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40" 
              alt="Achievements"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-10 flex flex-col justify-end">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2">Hall of Fame</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Celebrate the winners</p>
            </div>
          </Link>

          {/* Store Tile */}
          <Link to="/store" className="md:col-span-4 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40" 
              alt="Store"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-10 flex flex-col justify-end">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2">The Store</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Elite gear & Merch</p>
            </div>
          </Link>

          {/* Events Tile */}
          <Link to="/events" className="md:col-span-6 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer">
             <div className="absolute inset-0 p-10 flex flex-col justify-end bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <h4 className="text-3xl font-black text-white uppercase italic mb-2">Events</h4>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest">Workshops & Seminars</p>
             </div>
          </Link>

          {/* Connect Tile */}
          <Link to="/social" className="md:col-span-6 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer">
             <div className="absolute inset-0 p-10 flex flex-col justify-end bg-white/5 group-hover:bg-white/10 transition-colors">
                <h4 className="text-3xl font-black text-white uppercase italic mb-2">Connect</h4>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Join 10k+ Athletes online</p>
             </div>
          </Link>
        </div>
      </section>

      {/* Philosophy Section (Final Trust) */}
      <section className="py-24 px-6 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-5 pointer-events-none">
          <ShieldCheck className="w-96 h-96 text-primary" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-10 italic uppercase tracking-tight">"Discipline is the only <span className="text-primary">Short-cut.</span>"</h2>
          <p className="text-muted-foreground text-xl font-medium leading-relaxed mb-12">
            We don't sell memberships; we build character. XMFCLUB is the culmination of 12 years of martial arts heritage, re-engineered for the modern world.
          </p>
          <div className="flex items-center justify-center gap-12 grayscale opacity-40">
             {/* Mock Partner Logos */}
             <span className="text-sm font-black tracking-widest uppercase">Amazon Affiliate</span>
             <span className="text-sm font-black tracking-widest uppercase">Decathlon Partner</span>
             <span className="text-sm font-black tracking-widest uppercase">XMF Legacy</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 text-center">
        <div className="flex justify-center gap-8 mb-8">
          <Link to="/about" className="text-[10px] font-black tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">Mission</Link>
          <Link to="/training/curriculum" className="text-[10px] font-black tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">Training</Link>
          <Link to="/contact" className="text-[10px] font-black tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors">Contact</Link>
        </div>
        <p className="text-muted-foreground text-[10px] font-black tracking-[0.3em] uppercase">
          &copy; {new Date().getFullYear()} XMFCLUB. BUILT FOR THE ELITE.
        </p>
      </footer>
    </div>
  )
}
