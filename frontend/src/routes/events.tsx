import { createFileRoute } from '@tanstack/react-router'
import { Calendar, MapPin, Clock, ArrowUpRight, Zap } from 'lucide-react'

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

const events = [
  {
    title: "National Bo-Staff Workshop",
    date: "March 15, 2024",
    location: "Main HQ / Bangalore",
    type: "Workshop",
    status: "Upcoming",
    image: "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Calisthenics Meetup 2024",
    date: "April 05, 2024",
    location: "Outdoor Arena",
    type: "Community",
    status: "Registration Open",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop"
  }
];

function EventsPage() {
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">
            XMF <span className="text-primary">EVENTS</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl font-medium">
            Join our elite workshops, competitions, and seminars. Be part of the legacy.
          </p>
        </header>

        <div className="space-y-8">
          {events.map((event, i) => (
            <div key={i} className="group glass-card overflow-hidden flex flex-col md:flex-row hover:border-primary/40 transition-all cursor-pointer">
              <div className="md:w-1/3 relative h-64 md:h-auto overflow-hidden">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent md:bg-gradient-to-r" />
                <div className="absolute top-6 left-6 px-4 py-1.5 bg-primary text-white text-[10px] font-black tracking-widest uppercase rounded-full">
                  {event.status}
                </div>
              </div>
              
              <div className="p-10 md:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-primary text-xs font-black tracking-widest uppercase mb-4">
                  <Zap className="w-3 h-3 fill-current" />
                  {event.type}
                </div>
                <h3 className="text-3xl font-black mb-6 tracking-tight uppercase group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold uppercase">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold uppercase">{event.location}</span>
                  </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                  <button className="flex items-center gap-2 text-primary font-black text-xs tracking-[0.2em] uppercase group-hover:gap-4 transition-all">
                    Register Now <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
