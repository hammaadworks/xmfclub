import { createFileRoute } from '@tanstack/react-router'
import { FileText, Download, BookOpen, Search, Filter, Lock, Zap } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/resources')({
  component: ResourcesPage,
})

type Resource = {
  id: string;
  title: string;
  category: 'Technique' | 'Nutrition' | 'Manual' | 'Workout';
  description: string;
  type: 'PDF' | 'Guide' | 'Sheet';
  isPremium: boolean;
};

const resources: Resource[] = [
  {
    id: '1',
    title: 'Bo-Staff Fundamentals',
    category: 'Technique',
    description: 'A comprehensive guide to basic grips, stances, and the first 5 striking patterns.',
    type: 'PDF',
    isPremium: false,
  },
  {
    id: '2',
    title: 'Elite Nutrition Protocol',
    category: 'Nutrition',
    description: 'Fueling for high-intensity martial arts and calisthenics performance.',
    type: 'Guide',
    isPremium: true,
  },
  {
    id: '3',
    title: 'Calisthenics Progression Map',
    category: 'Workout',
    description: 'From zero to muscle-up. A step-by-step visual progression sheet.',
    type: 'Sheet',
    isPremium: false,
  },
  {
    id: '4',
    title: 'XMF Student Handbook',
    category: 'Manual',
    description: 'Our core philosophy, club rules, and grading syllabus for Taekwon-Do.',
    type: 'PDF',
    isPremium: false,
  },
  {
    id: '5',
    title: 'Advanced Kicking Mechanics',
    category: 'Technique',
    description: 'Biomechanics of explosive spinning and jumping kicks.',
    type: 'Guide',
    isPremium: true,
  }
];

function ResourcesPage() {
  const [filter, setFilter] = useState<string>('All');

  const filteredResources = filter === 'All' 
    ? resources 
    : resources.filter(r => r.category === filter);

  const categories = ['All', 'Technique', 'Nutrition', 'Manual', 'Workout'];

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16">
          <div className="flex items-center gap-3 text-primary font-black text-xs tracking-[0.3em] uppercase mb-4">
            <Zap className="w-4 h-4 fill-current" />
            Digital Vault
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">
            STUDENT <span className="text-primary">RESOURCES</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed">
            Access elite training materials, technique manuals, and performance guides designed to accelerate your progress.
          </p>
        </header>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${
                  filter === cat 
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH VAULT..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[10px] font-black tracking-widest uppercase focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div 
              key={resource.id} 
              className="group glass-card p-8 hover:border-primary/40 transition-all flex flex-col relative overflow-hidden"
            >
              {resource.isPremium && (
                <div className="absolute top-0 right-0 p-6">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className="mb-8 flex items-center justify-between">
                <div className="p-4 rounded-2xl bg-white/5 text-primary group-hover:scale-110 transition-transform duration-500">
                  {resource.type === 'PDF' ? <FileText className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-50 group-hover:opacity-100 transition-opacity">
                  {resource.type}
                </span>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-black tracking-widest text-primary uppercase mb-2">{resource.category}</div>
                <h3 className="text-xl font-black mb-4 tracking-tight uppercase group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">
                  {resource.description}
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between mt-auto">
                <button 
                  className={`flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase transition-all ${
                    resource.isPremium ? 'text-muted-foreground cursor-not-allowed' : 'text-primary hover:gap-3'
                  }`}
                  disabled={resource.isPremium}
                >
                  {resource.isPremium ? 'Member Exclusive' : (
                    <>
                      Download <Download className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <section className="mt-20 p-10 rounded-[2.5rem] bg-primary/5 border border-primary/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-3xl font-black mb-4 tracking-tight uppercase">Request a Guide?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto font-medium">
            Can't find what you are looking for? Let our elite trainers know what materials you need to aid your training.
          </p>
          <button className="px-8 py-4 bg-primary text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            Request Resource
          </button>
        </section>
      </div>
    </div>
  )
}
