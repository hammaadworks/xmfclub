import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { MessageSquare, Send, Phone, Mail, MapPin, Zap } from 'lucide-react'

export const Route = createFileRoute('/contact')({
  component: ContactPage,
})

function ContactPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const phoneNumber = '918310428923'
    const fullMessage = `Hi XMFCLUB, my name is ${name}. ${message}`
    const encodedMessage = encodeURIComponent(fullMessage)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-primary/5 blur-[150px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto">
        <header className="mb-20 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">
            GET IN <span className="text-primary">TOUCH</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Have questions about our curriculum or training programs? Send us a direct message on WhatsApp.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-8 border-primary/20">
              <h3 className="text-xs font-black tracking-[0.3em] text-primary uppercase mb-8 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Contact Details
              </h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/10">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">WhatsApp / Call</h4>
                    <p className="text-muted-foreground font-medium">+91 8310428923</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/10">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Email</h4>
                    <p className="text-muted-foreground font-medium">hello@xmfclub.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/10">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-widest mb-1">Location</h4>
                    <p className="text-muted-foreground font-medium">Bangalore, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium italic leading-relaxed text-muted-foreground">
                "We typically respond within an hour during training sessions. Ready to push your limits?"
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handleWhatsAppSubmit} className="glass-card p-10 space-y-8 border-white/10">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black tracking-widest text-muted-foreground uppercase px-1">Your Name</label>
                  <input 
                    required
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black tracking-widest text-muted-foreground uppercase px-1">How can we help?</label>
                  <textarea 
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="I want to learn more about the Bo-Staff workshop..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-medium resize-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-primary text-white font-black tracking-[0.2em] text-xs rounded-xl flex items-center justify-center gap-3 uppercase hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" /> Send on WhatsApp
              </button>
              
              <p className="text-center text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                Clicking send will open WhatsApp in a new tab.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
