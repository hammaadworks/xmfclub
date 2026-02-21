import { createFileRoute } from '@tanstack/react-router'
import { Shield, Target, Zap, Swords, Heart, Users } from 'lucide-react'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  const values = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: 'Discipline',
      description: 'The root of all progress. We foster a mindset that thrives on consistency and hard work.'
    },
    {
      icon: <Target className="w-8 h-8 text-primary" />,
      title: 'Precision',
      description: 'Whether it is a Bo-Staff strike or a muscle-up, we focus on the minute details that separate the good from the elite.'
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: 'Intensity',
      description: 'Training with purpose. We push the boundaries of what you think is possible.'
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
            OUR <span className="text-primary">MISSION</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
            From the heritage of Extreme Martial Arts (XMF) to the frontiers of human movement, we are here to build the next generation of high-performance individuals.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20 items-center">
          <div className="glass-card p-10 border-primary/20">
            <h2 className="text-3xl font-bold mb-6">THE PHILOSOPHY</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              XMF-Extreme Martial Arts and Fitness was founded on the belief that martial arts is not just about combat, but about self-discovery and building character.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By blending traditional Taekwon-Do and Bo-Staff with modern Calisthenics, we've created a training system that develops both the warrior spirit and the athlete's body.
            </p>
          </div>
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 group">
             <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Swords className="w-20 h-20 text-white/50 group-hover:scale-110 transition-transform" />
             </div>
          </div>
        </section>

        <section className="mb-20">
          <h2 className="text-center text-xs font-black tracking-[0.3em] text-primary uppercase mb-12">Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-white/2 border border-white/5 hover:border-primary/30 transition-colors">
                <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                  {v.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-12 text-center bg-primary/10 border-primary/20">
          <Heart className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-black mb-6">JOIN THE MOVEMENT</h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto font-medium">
            Whether you are a middle school student, a busy professional, or a trainer looking for elite methodology, there is a place for you at XMFCLUB.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-10 py-4 bg-primary text-white font-black tracking-widest text-xs rounded-xl hover:scale-105 transition-transform uppercase">
              Become a Member
            </button>
            <button className="px-10 py-4 bg-white/5 text-white font-black tracking-widest text-xs rounded-xl border border-white/10 hover:bg-white/10 transition-colors uppercase">
              Contact Us
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
