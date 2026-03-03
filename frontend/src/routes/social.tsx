import { createFileRoute } from '@tanstack/react-router'
import { Youtube, Instagram, Twitter, Send, Globe, ArrowUpRight, Zap } from 'lucide-react'

export const Route = createFileRoute('/social')({
  component: SocialPage,
})

const socials = [
  {
    name: "YouTube",
    handle: "@xmfclub_official",
    icon: <Youtube className="w-6 h-6" />,
    color: "hover:bg-[#FF0000]/10 hover:border-[#FF0000]/30",
    textColor: "group-hover:text-[#FF0000]",
    link: "https://youtube.com",
    stats: "Subscribers"
  },
  {
    name: "Instagram",
    handle: "@xmf.club",
    icon: <Instagram className="w-6 h-6" />,
    color: "hover:bg-[#E1306C]/10 hover:border-[#E1306C]/30",
    textColor: "group-hover:text-[#E1306C]",
    link: "https://instagram.com",
    stats: "Followers"
  },
  {
    name: "X / Twitter",
    handle: "xmfclub",
    icon: <Twitter className="w-6 h-6" />,
    color: "hover:bg-white/5 hover:border-white/30",
    textColor: "group-hover:text-white",
    link: "https://x.com",
    stats: "Updates"
  },
  {
    name: "Telegram",
    handle: "xmfclub_community",
    icon: <Send className="w-6 h-6" />,
    color: "hover:bg-[#26A5E4]/10 hover:border-[#26A5E4]/30",
    textColor: "group-hover:text-[#26A5E4]",
    link: "https://telegram.org",
    stats: "Community"
  }
];

function SocialPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-2xl mx-auto text-center">
        <header className="mb-16">
          <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/10">
            <Zap className="w-12 h-12 text-primary fill-current" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase">
            XMF <span className="text-primary">SOCIAL</span>
          </h1>
          <p className="text-muted-foreground font-medium">
            Join the community and stay updated with the latest training content.
          </p>
        </header>

        <div className="space-y-4 mb-20">
          {socials.map((social, i) => (
            <a
              key={i}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center justify-between p-6 glass-card transition-all duration-300 ${social.color}`}
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl bg-white/5 transition-colors ${social.textColor}`}>
                  {social.icon}
                </div>
                <div className="text-left">
                  <h3 className="font-black text-sm uppercase tracking-widest mb-1">{social.name}</h3>
                  <p className="text-xs text-muted-foreground font-bold tracking-tight">{social.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-right">
                  <span className="text-[10px] font-black tracking-widest text-primary uppercase">{social.stats}</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </a>
          ))}
        </div>

        <section className="glass-card p-10 border-primary/20 bg-primary/5">
          <h2 className="text-2xl font-black mb-4 tracking-tight uppercase italic">"The journey is better together."</h2>
          <p className="text-sm text-muted-foreground mb-8 font-medium">
            Get exclusive training tips, behind-the-scenes footage, and early access to new curriculum modules by following our handles.
          </p>
          <button className="px-8 py-3 bg-primary text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
            Subscribe to Newsletter
          </button>
        </section>

        <footer className="mt-20 pt-10 border-t border-white/5 flex items-center justify-center gap-4 text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase">xmfclub.com</span>
        </footer>
      </div>
    </div>
  )
}
