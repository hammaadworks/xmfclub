import { createFileRoute, Link } from '@tanstack/react-router'
import { 
  Zap, 
  ArrowRight, 
  MessageSquare, 
  Calendar,
  Users,
  ShieldCheck,
  Trophy
} from 'lucide-react'

export const Route = createFileRoute('/join')({
  component: JoinChoicePage,
})

function JoinChoicePage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black tracking-widest text-primary mb-6 uppercase">
            <Zap className="w-3 h-3 fill-current" />
            Unleash Your Best
          </div>
          <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase italic leading-[0.85]">
            JOIN THE <br /> <span className="text-primary">XMFCLUB.</span>
          </h1>
          <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Choose your path to excellence. Whether you're ready to master our curriculum or want to talk to a trainer first, your journey starts here.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Path A: Direct Enroll */}
          <Link 
            to="/training/curriculum"
            className="group glass-card p-10 border-white/5 hover:border-primary/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 fill-current" />
              </div>
              <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tight">Direct <span className="text-primary">Enroll.</span></h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                Build your custom training plan using our A la Carte system. Select your modules, choose your times, and start training immediately.
              </p>
              <ul className="space-y-3 mb-10 text-sm font-bold uppercase tracking-wider text-white/70">
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Full Customization</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Instant Profile Creation</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary" /> Choose Your Schedule</li>
              </ul>
            </div>
            <div className="w-full py-5 bg-primary text-white font-black tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 group-hover:bg-primary/90 transition-all uppercase">
              Start Building <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Path B: Book a Demo */}
          <Link 
            to="/demo/booking"
            className="group glass-card p-10 border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 mb-8 group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tight text-white/90">Book a <span className="text-white">Demo.</span></h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                Not sure where to start? Book a free trial session or speak with one of our head trainers to find the perfect discipline for you.
              </p>
              <ul className="space-y-3 mb-10 text-sm font-bold uppercase tracking-wider text-white/50">
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Free Trial Session</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Expert Consultation</li>
                <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4" /> Tour the Facility</li>
              </ul>
            </div>
            <div className="w-full py-5 bg-white/10 text-white font-black tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 group-hover:bg-white/20 transition-all uppercase">
              Schedule Now <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Social Proof Bar */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-40">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">500+ Active Members</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">Elite Faculty</span>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase">45+ National Golds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
