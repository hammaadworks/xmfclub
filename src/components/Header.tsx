import { Link, useNavigate } from '@tanstack/react-router'
import { Menu, X, User, Trophy, Calendar, ShoppingBag, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [member, setMember] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    
    // Check auth
    const authData = localStorage.getItem('xmf_member')
    if (authData) setMember(JSON.parse(authData))

    // Listen for auth changes if we implement a custom event later
    const handleAuthChange = () => {
      const updated = localStorage.getItem('xmf_member')
      setMember(updated ? JSON.parse(updated) : null)
    }
    window.addEventListener('storage', handleAuthChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('storage', handleAuthChange)
    }
  }, [])

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${
        isScrolled 
          ? 'bg-background border-white/10 py-4 shadow-xl' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 relative z-50">
          <button 
            className="lg:hidden w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center transform hover:rotate-12 transition-all shadow-lg shadow-primary/20"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="font-black text-white tracking-tighter text-lg leading-none">X</span>
          </button>
          
          <Link to="/" className="hidden lg:flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all shadow-lg shadow-primary/20">
              <span className="font-black text-white tracking-tighter text-lg leading-none">X</span>
            </div>
            <span className="font-black tracking-tighter text-xl uppercase group-hover:text-primary transition-colors">XMFCLUB</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link to="/" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase active:text-primary">Home</Link>
          <Link to="/training" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Training</Link>
          <Link to="/events" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Events</Link>
          <Link to="/resources" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Resources</Link>
          <Link to="/store" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Store</Link>
          <Link to="/hall-of-fame" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Hall of Fame</Link>
          <Link to="/connect" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Connect</Link>
        </nav>

        <div className="flex items-center gap-4">
          {member ? (
            <div className="flex items-center gap-3">
              <Link 
                to={member.role === 'admin' ? '/admin' : `/member/${member.member_id}`}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black tracking-widest text-[10px] rounded-full uppercase transition-all flex items-center gap-2"
              >
                {member.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {member.name.split(' ')[0]}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link 
                to="/login"
                className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-black tracking-widest text-[10px] rounded-full border border-primary/20 uppercase transition-all"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-background transition-all duration-500 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-8 px-6">
          <SidebarLink 
            to="/" 
            icon={<Trophy size={20} />} 
            label="Home" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/training" 
            icon={<User size={20} />} 
            label="Training" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/events" 
            icon={<Calendar size={20} />} 
            label="Events" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/resources" 
            icon={<BookOpen size={20} />} 
            label="Resources" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/store" 
            icon={<ShoppingBag size={20} />} 
            label="Store" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/hall-of-fame" 
            icon={<Trophy size={20} />} 
            label="Hall of Fame" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/connect" 
            icon={<MessageSquare size={20} />} 
            label="Connect" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="w-full h-px bg-white/10 my-4" />
          
          {member ? (
            <Link 
              to={member.role === 'admin' ? '/admin' : `/member/${member.member_id}`}
              onClick={() => setIsOpen(false)}
              className="w-full max-w-sm py-4 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              {member.role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {member.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
            </Link>
          ) : (
            <div className="w-full max-w-sm space-y-4">
              <Link 
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center py-4 bg-primary/10 text-primary border border-primary/20 font-black tracking-widest text-xs rounded-xl uppercase hover:bg-primary/20 transition-all"
              >
                Member Login
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function SidebarLink({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className="flex items-center gap-4 text-2xl font-black uppercase tracking-tighter hover:text-primary transition-colors group w-full max-w-sm"
    >
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      {label}
    </Link>
  )
}
