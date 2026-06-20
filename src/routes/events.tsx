import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Calendar, MapPin, ArrowUpRight, Zap, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

const defaultImages = [
  "https://images.unsplash.com/photo-1512928735464-5cc10b1eb091?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop"
]

function EventsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*').order('date', { ascending: true })
      if (data) {
        setEvents(data)
      }
      setLoading(false)
    }
    fetchEvents()
  }, [])

  const handleRegisterClick = () => {
    const data = localStorage.getItem('xmf_member')
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.role === 'admin') {
        navigate({ to: '/admin' })
      } else {
        navigate({ to: `/member/${parsed.member_id}` })
      }
    } else {
      navigate({ to: '/login' })
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase break-words">
            XMF <span className="brand-gradient bg-clip-text text-transparent">EVENTS</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
            Join our elite workshops, competitions, and seminars. Be part of the legacy.
          </p>
        </header>

        <div className="mb-12 p-6 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center gap-6 justify-between text-center sm:text-left">
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-primary mb-1">XMFCLUB Members Only</h3>
            <p className="text-sm text-muted-foreground font-medium">
              XMF Events are strictly open to active XMFCLUB members only. Gain access to exclusive belt-level tournaments, specialized workshops, and live leaderboards.
            </p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
            className="whitespace-nowrap px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl uppercase hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            Become a Member
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-12 glass-card rounded-2xl border border-white/10">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">No Upcoming Events</h3>
            <p className="text-muted-foreground text-sm">Check back later for new workshops and gradings.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, i) => {
              const eventDate = new Date(event.date)
              const today = new Date()
              eventDate.setHours(0, 0, 0, 0)
              today.setHours(0, 0, 0, 0)
              const isPast = eventDate < today
              const status = isPast ? "Completed" : "Upcoming"
              const imgUrl = defaultImages[i % defaultImages.length]
              
              return (
                <div key={event.id} className="group glass-card overflow-hidden flex flex-col md:flex-row hover:border-primary/40 transition-all cursor-pointer">
                  <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
                    <img 
                      src={imgUrl} 
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent md:bg-gradient-to-r" />
                    <div className="absolute top-6 left-6 px-4 py-1.5 bg-gradient-to-r from-primary to-accent text-white text-[10px] font-black tracking-widest uppercase rounded-full">
                      {status}
                    </div>
                  </div>
                  
                  <div className="p-10 md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-primary text-xs font-black tracking-widest uppercase mb-4">
                      <Zap className="w-3 h-3 fill-current" />
                      Workshop
                    </div>
                    <h3 className="text-3xl font-black mb-2 tracking-tight uppercase group-hover:text-primary transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold uppercase">
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        {event.venue_map_url ? (
                          <a 
                            href={event.venue_map_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-sm font-bold uppercase hover:text-primary transition-colors hover:underline flex items-center gap-1"
                          >
                            {event.venue_name || 'Main HQ'} <ArrowUpRight className="w-3 h-3 opacity-50" />
                          </a>
                        ) : (
                          <span className="text-sm font-bold uppercase">{event.venue_name || 'Main HQ'}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                        Target: <span className="text-primary">{event.target_belt || 'All Belts'}</span>
                      </div>
                      <button 
                        onClick={handleRegisterClick}
                        className="flex items-center gap-2 text-primary font-black text-xs tracking-[0.2em] uppercase group-hover:gap-4 transition-all"
                      >
                        {isPast ? 'View Details' : 'Register Now'} <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Coming Soon Callout */}
        <div className="mt-20 p-8 rounded-3xl border border-white/10 bg-white/5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-50" />
          <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2 relative z-10">More Epic Events Coming Soon</h3>
          <p className="text-muted-foreground text-sm font-medium max-w-xl mx-auto relative z-10">
            We are scheduling a massive lineup of seminars, grading days, and inter-club tournaments for the upcoming quarter. Stay tuned for the official calendar drop!
          </p>
        </div>
      </div>
    </div>
  )
}
