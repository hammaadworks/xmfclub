import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  Instagram,
  MessageSquare,
  Minus,
  Phone,
  Play,
  Plus,
  Shield,
  ShieldCheck,
  Target,
  Trophy,
  X,
  Youtube,
  Zap,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: LandingPage })

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-white/5 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold tracking-tight uppercase italic group-hover:text-primary transition-colors">
          {question}
        </span>
        {isOpen ? (
          <Minus className="w-5 h-5 text-primary" />
        ) : (
          <Plus className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="mt-4 text-muted-foreground leading-relaxed animate-fade-in">
          {answer}
        </div>
      )}
    </div>
  )
}

function LandingPage() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white">
      {/* PIP Video Modal */}
      {isVideoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-10 w-10 h-10 bg-white/10 hover:bg-primary text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src="https://www.youtube.com/embed/pw2vKNpz7TE?autoplay=1"
              title="XMFCLUB Intro"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* 1. TRUST: Hero Section with Social Proof */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent rounded-full -z-10" />
        <div className="absolute top-0 right-1/4 translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 to-transparent rounded-full -z-10" />

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-[0.3em] text-primary mb-10 animate-fade-in uppercase">
            <Trophy className="w-3 h-3 fill-current" />
            <span>EST. 2012 • 45+ NATIONAL GOLD MEDALS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-9xl font-black mb-8 leading-[0.85] tracking-tighter uppercase italic break-words">
            XTREME FORCE <br />
            <span className="brand-gradient bg-clip-text text-transparent">
              MULTIPLIED.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
            From Middle School Champions to Elite Professionals. Master the art
            of discipline through our modular training system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full max-w-lg">
            <Link
              to="/login"
              className="w-full sm:flex-1 px-10 py-5 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-primary/30 uppercase cursor-pointer"
            >
              Join the Club <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsVideoOpen(true)}
              className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white font-black tracking-widest text-xs rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase flex items-center justify-center gap-3"
            >
              <Play className="w-4 h-4 fill-current" /> Watch Intro
            </button>
          </div>

          {/* Quick Trust Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 opacity-60">
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">250+</span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                Students
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">12yr</span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                Legacy
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">40+</span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                Golds
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-black italic">Elite</span>
              <span className="text-[10px] font-black tracking-widest uppercase">
                Faculty
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUNDER: Farhan Khan XMF */}
      <section className="py-24 px-6 bg-primary/5 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden border border-primary/20 shadow-2xl relative z-10">
              <img
                src="/farhan.jpeg"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-all duration-700 object-top"
                alt="Farhan Khan XMF"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-10 left-6 sm:left-10 right-6">
                <div className="text-white text-3xl sm:text-4xl font-black uppercase italic leading-none break-words">
                  Farhan <br />
                  <span className="text-primary text-4xl sm:text-5xl">Khan XMF</span>
                </div>
                <div className="text-primary font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-4">
                  Founder & Head Coach
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 to-transparent rounded-full -z-10" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/20 to-transparent rounded-full -z-10" />
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4">
                Meet Your Mentor
              </h2>
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none break-words">
                SHAPING THE <br />{' '}
                <span className="brand-gradient bg-clip-text text-transparent text-3xl sm:text-4xl md:text-5xl">
                  MODERN WARRIOR.
                </span>
              </h3>
            </div>

            <div className="space-y-6 text-muted-foreground font-medium text-lg leading-relaxed">
              <p>
                Farhan Khan XMF is a seasoned martial arts coach with over{' '}
                <span className="text-white font-bold">
                  9 years of experience
                </span>
                . A national instructor, he has trained students to achieve
                success at state and national levels.
              </p>
              <p>
                His approach blends discipline, fitness, and mental strength to
                build complete athletes. He holds a{' '}
                <span className="text-white font-bold">
                  Black Belt in ITF Taekwondo
                </span>{' '}
                and a{' '}
                <span className="text-white font-bold">
                  3rd Dan Black Belt in Karate (WFSKO)
                </span>
                .
              </p>
              <p>
                Farhan is an active MMA fighter and a member of the Taekwondo
                Association of Karnataka. He also claimed the{' '}
                <span className="text-white font-bold">
                  Bengaluru Bodybuilding 2024 Men's Physique Title
                </span>
                , proving his dedication to fitness.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { label: 'Experience', val: '9+ Years' },
                { label: 'Rank', val: '3rd Dan Black Belt' },
                { label: 'Title', val: "Bodybuilding '24" },
                { label: 'Specialty', val: 'MMA & Weapons' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10"
                >
                  <div className="text-[10px] font-black tracking-widest text-primary uppercase mb-1">
                    {stat.label}
                  </div>
                  <div className="text-lg sm:text-xl font-black italic uppercase text-white break-words">
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Socials: Youtube and Instagram Highlights */}
      <section className="py-24 px-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-accent/5 to-transparent rounded-full -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4">
              Join The Community
            </h2>
            <h3 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic break-words">
              WATCH. LEARN.{' '}
              <span className="brand-gradient bg-clip-text text-transparent">
                CONQUER.
              </span>
            </h3>
            <p className="mt-4 text-muted-foreground font-medium max-w-2xl mx-auto">
              Level up your skills with free tutorials, athlete highlights, and
              behind-the-scenes content on our official channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* YouTube Card */}
            <a
              href="https://www.youtube.com/@farhanxmf01"
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-card p-10 border-white/5 hover:border-[#FF0000]/50 transition-all flex flex-col items-center text-center cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#FF0000]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-2xl bg-[#FF0000]/10 flex items-center justify-center text-[#FF0000] mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-[#FF0000]/20">
                <Youtube className="w-10 h-10" />
              </div>
              <h4 className="text-3xl font-black uppercase italic mb-2">
                YouTube
              </h4>
              <p className="text-muted-foreground font-medium mb-8">
                @farhanxmf01
              </p>
              <div className="px-8 py-4 bg-white/5 rounded-xl font-bold text-xs tracking-widest uppercase border border-white/10 group-hover:bg-[#FF0000] group-hover:text-white transition-colors">
                Subscribe & Watch
              </div>
            </a>

            {/* Instagram Card */}
            <a
              href="https://instagram.com/farhanxmf01"
              target="_blank"
              rel="noopener noreferrer"
              className="group glass-card p-10 border-white/5 hover:border-[#E1306C]/50 transition-all flex flex-col items-center text-center cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#F56040]/5 to-[#833AB4]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#F56040]/10 to-[#833AB4]/10 flex items-center justify-center text-[#E1306C] mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-[#E1306C]/20">
                <Instagram className="w-10 h-10" />
              </div>
              <h4 className="text-3xl font-black uppercase italic mb-2">
                Instagram
              </h4>
              <p className="text-muted-foreground font-medium mb-8">
                @farhanxmf01
              </p>
              <div className="px-8 py-4 bg-white/5 rounded-xl font-bold text-xs tracking-widest uppercase border border-white/10 group-hover:bg-gradient-to-tr group-hover:from-[#F56040] group-hover:to-[#833AB4] group-hover:text-white transition-all">
                Follow & Engage
              </div>
            </a>
          </div>
        </div>
      </section>
      {/* 4. SALES: The Alacarte Hook (Conversion Focused) */}
      <section className="py-24 px-6 relative overflow-hidden bg-primary/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-primary/20 shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1656653121475-e33829581294?q=80&w=1000&auto=format&fit=crop"
              loading="lazy"
              decoding="async"
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
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none italic break-words">
              YOU CHOOSE THE <br />
              <span className="brand-gradient bg-clip-text text-transparent">
                CURRICULUM.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
              XMFCLUB is built on modularity. Why pay for a full martial arts
              course when you only want to master Bo-Staff strikes? Or
              Calisthenics upper-body strength?
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <ChevronRight className="w-4 h-4" />
                </div>
                2-Level Nesting Choice
              </li>
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <ChevronRight className="w-4 h-4" />
                </div>
                Pay Per Module
              </li>
              <li className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <ChevronRight className="w-4 h-4" />
                </div>
                Lifetime Access
              </li>
            </ul>
            <Link
              to="/training"
              className="inline-flex items-center gap-4 px-10 py-5 bg-white text-black font-black tracking-widest text-xs rounded-2xl hover:bg-gradient-to-r hover:from-primary hover:to-accent hover:text-white hover:scale-105 transition-all shadow-xl uppercase"
            >
              Go to Curriculum <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4">
            Transparency
          </h2>
          <h3 className="text-4xl font-black tracking-tighter uppercase italic">
            Frequently Asked{' '}
            <span className="brand-gradient bg-clip-text text-transparent">
              Questions
            </span>
          </h3>
        </div>

        <div className="space-y-2">
          <FAQItem
            question="Who can join XMFCLUB?"
            answer="XMFCLUB is designed for everyone—from middle school students and beginners to elite athletes and busy professionals. Our modular system allows you to start at your own level and pace."
          />
          <FAQItem
            question="What is the 'Alacarte' training system?"
            answer="Unlike traditional gyms with flat monthly fees, our Alacarte system lets you choose exactly what you want to learn. You only pay for the specific modules (like Bo-Staff, Calisthenics, or MMA strikes) that you want to master."
          />
          <FAQItem
            question="How does the member login work?"
            answer="We've completely eliminated passwords. Active members log in seamlessly using their Member ID and a personalized swipe pattern (just like unlocking your phone), ensuring fast and secure access."
          />
          <FAQItem
            question="Will there be content specific to my rank?"
            answer="Yes! Our system is continuously evolving. Very soon, events and digital vault resources will be tailored specifically to your Belt Level. You will unlock exclusive training breakdowns and elite tournaments as you rank up."
          />
          <FAQItem
            question="Do I need prior martial arts experience?"
            answer="Not at all. Most of our members start with zero experience. Our instructors break down every movement into fundamental steps, ensuring you build a solid foundation before advancing."
          />
          <FAQItem
            question="What are the training hours?"
            answer="We offer flexible morning and evening batches to accommodate students and working professionals. Check our curriculum page for specific module timings."
          />
          <FAQItem
            question="How do I start?"
            answer="The best way to start is by booking a trial session. Click the 'Join the Club' button below to get in touch with us via WhatsApp or Phone."
          />
        </div>
      </section>

      {/* 6. EXPLORE: Bento Grid for Brand Expansion */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-b bg-primary/5">
        <div className="text-center mb-16">
          <h2 className="text-xs font-black tracking-[0.4em] text-muted-foreground uppercase mb-4">
            Explore the Universe
          </h2>
          <h3 className="text-4xl font-black tracking-tighter uppercase italic">
            The XMF{' '}
            <span className="brand-gradient bg-clip-text text-transparent">
              Lifestyle
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
          {/* Hall of Fame Tile */}
          <Link
            to="/hall-of-fame"
            className="h-64 md:h-auto md:col-span-8 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1706374503312-7a4a4c030d2d?q=80&w=1200&auto=format&fit=crop"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40"
              alt="Achievements"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-10 flex flex-col justify-end">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2">
                Hall of Fame
              </h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Celebrate the winners
              </p>
            </div>
          </Link>

          {/* Store Tile */}
          <Link
            to="/store"
            className="h-64 md:h-auto md:col-span-4 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-40"
              alt="Store"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-10 flex flex-col justify-end">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2">
                The Store
              </h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Elite gear & Merch
              </p>
            </div>
          </Link>

          {/* Events Tile */}
          <Link
            to="/events"
            className="h-64 md:h-auto md:col-span-6 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40 mix-blend-overlay"
              alt="Events"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
            <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-primary/80 transition-colors">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2 relative z-10">
                Events
              </h4>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest relative z-10">
                Workshops & Seminars
              </p>
            </div>
          </Link>

          {/* Connect Tile */}
          <Link
            to="/connect"
            className="h-64 md:h-auto md:col-span-6 group glass-card relative overflow-hidden border-white/5 hover:border-primary/50 transition-all cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1555597408-26bc8e548a46?q=80&w=1000&auto=format&fit=crop"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-40"
              alt="Connect"
            />
            <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-primary/20 transition-colors">
              <h4 className="text-3xl font-black text-white uppercase italic mb-2 relative z-10">
                Connect
              </h4>
              <p className="text-xs font-bold text-gray-300 uppercase tracking-widest relative z-10">
                Join 10k+ Athletes online
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 7. MISSION: Core Values */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black tracking-[0.4em] text-primary uppercase mb-4">
              The Foundation
            </h2>
            <h3 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase italic break-words">
              Our{' '}
              <span className="brand-gradient bg-clip-text text-transparent">
                Mission
              </span>
            </h3>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
              From the heritage of Extreme Martial Arts (XMF) to the frontiers
              of human movement, we are here to build the next generation of
              high-performance individuals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-10 h-10" />,
                title: 'Discipline',
                desc: 'The root of all progress. We foster a mindset that thrives on consistency and hard work.',
              },
              {
                icon: <Target className="w-10 h-10" />,
                title: 'Precision',
                desc: 'Whether it is a Bo-Staff strike or a muscle-up, we focus on the minute details that separate the elite.',
              },
              {
                icon: <Zap className="w-10 h-10" />,
                title: 'Intensity',
                desc: 'Training with purpose. We push the boundaries of what you think is possible.',
              },
            ].map((v, i) => (
              <div
                key={i}
                className="group p-10 rounded-[2rem] bg-white/2 border border-white/5 hover:border-primary/30 transition-all"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h4 className="text-2xl font-black uppercase italic mb-4">
                  {v.title}
                </h4>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA: Join the Movement */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-r from-primary to-accent text-white border-y border-white/10">
        <div className="absolute top-0 right-0 p-24 opacity-10 pointer-events-none -rotate-12">
          <ShieldCheck className="w-96 h-96" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-10 italic uppercase tracking-tight leading-[0.85] break-words">
            CHOOSE YOUR PATH. <br />{' '}
            <span className="text-white/80">BUILD YOUR LEGACY.</span>
          </h2>
          <p className="text-white/80 text-xl font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            Ready to push your limits? Join 500+ athletes who have chosen the
            elite methodology of XMFCLUB.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/login"
              className="w-full sm:w-auto px-12 py-6 bg-white text-primary font-black tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl shadow-black/20 uppercase cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-current" /> Join the Club
            </Link>
            <Link
              to="/connect"
              className="w-full sm:w-auto px-12 py-6 bg-black/10 text-white font-black tracking-widest text-sm rounded-2xl border border-white/20 hover:bg-black/20 transition-all uppercase flex items-center justify-center gap-3"
            >
              <Phone className="w-5 h-5" /> Contact Us
            </Link>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-80">
            <span className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
              <CircleCheck className="w-4 h-4" /> Personalized Training
            </span>
            <span className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
              <CircleCheck className="w-4 h-4" /> Elite Mentorship
            </span>
            <span className="flex items-center gap-2 text-xs font-black tracking-widest uppercase">
              <CircleCheck className="w-4 h-4" /> Modular Learning
            </span>
            <p className="text-foreground text-[10px] font-black tracking-[0.3em] uppercase">
              &copy; {new Date().getFullYear()} XMFCLUB. BUILT FOR THE ELITE.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
