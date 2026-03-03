import { createFileRoute } from '@tanstack/react-router'
import { Trophy, Star, Award, Medal, Users, Quote } from 'lucide-react'

export const Route = createFileRoute('/achievements')({
  component: AchievementsPage,
})

const winners = [
  { name: "Rahul S.", achievement: "National Gold - Bo-Staff", year: "2024", category: "Martial Arts" },
  { name: "Ananya K.", achievement: "State Silver - Taekwondo", year: "2023", category: "Martial Arts" },
  { name: "Vikram M.", achievement: "Elite Level - Calisthenics", year: "2024", category: "Performance" },
];

const testimonials = [
  { 
    name: "Dr. Aris V.", 
    role: "Professional Athlete", 
    text: "The discipline I learned at XMF transformed my approach to physical training. It's not just a club, it's a brotherhood of excellence." 
  },
  { 
    name: "Sanjay Gupta", 
    role: "Tech Executive", 
    text: "As a busy professional, the modular training allows me to stay at my peak without wasting hours. The Bo-Staff training is a masterclass in focus." 
  }
];

function AchievementsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">
            Hall of <span className="text-primary">Fame</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Celebrating the elite students who embody the XMF spirit of discipline and victory.
          </p>
        </header>

        {/* Hall of Fame Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {winners.map((winner, i) => (
            <div key={i} className="glass-card p-8 group hover:border-primary/50 transition-all text-center">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  <Medal className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-[10px] font-black text-white">
                  {winner.year}
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">{winner.name}</h3>
              <p className="text-primary font-black text-xs tracking-[0.2em] mb-4">{winner.achievement}</p>
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 inline-block text-[10px] font-bold text-muted-foreground uppercase">
                {winner.category}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Wall */}
        <section className="mb-32">
          <h2 className="text-center text-xs font-black tracking-[0.4em] text-primary uppercase mb-16">Community Voices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {testimonials.map((t, i) => (
              <div key={i} className="relative p-10 rounded-3xl bg-white/2 border border-white/5 italic">
                <Quote className="absolute top-6 left-6 w-12 h-12 text-primary/10 -z-10" />
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wider">{t.name}</h4>
                    <p className="text-xs text-primary font-bold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Gold Medals', val: '45+' },
            { label: 'Active Students', val: '500+' },
            { label: 'Years Legacy', val: '12+' },
            { label: 'Elite Trainers', val: '15' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 glass-card">
              <div className="text-3xl font-black text-primary mb-2">{stat.val}</div>
              <div className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">{stat.label}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
