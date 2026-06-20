import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Home, Menu, X, Dumbbell, ShieldCheck, LayoutGrid, Calendar, Trophy, ShoppingBag, Zap, MessageSquare, BookOpen } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl border-b border-white/5 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-primary"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="text-2xl font-black tracking-tighter text-foreground font-heading">
            XMF<span className="text-primary">CLUB</span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          <Link to="/" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Home</Link>
          <Link to="/training" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Training</Link>
          <Link to="/events" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Events</Link>
          <Link to="/resources" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Resources</Link>
          <Link to="/store" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Store</Link>
          <Link to="/hall-of-fame" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Hall of Fame</Link>
          <Link to="/connect" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase">Connect</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase bg-primary text-primary-foreground px-4 py-2 rounded-md">Login</Link>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-card text-foreground shadow-2xl z-[60] transform transition-transform duration-500 ease-out border-r border-white/5 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-black tracking-tighter font-heading">
            XMF<span className="text-primary">CLUB</span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <SidebarLink 
            to="/" 
            icon={<Home size={20} />} 
            label="Home" 
            onClick={() => setIsOpen(false)} 
          />
          <SidebarLink 
            to="/training" 
            icon={<LayoutGrid size={20} />} 
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
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/2 flex flex-col gap-4">
          <Link to="/login" onClick={() => setIsOpen(false)} className="w-full bg-primary text-primary-foreground font-bold tracking-widest uppercase text-center py-3 rounded-lg hover:bg-primary/90 transition-colors">Login / Member Portal</Link>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ to, icon, label, onClick }: { to: string, icon?: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
      activeProps={{
        className: 'flex items-center gap-4 p-4 rounded-xl bg-primary/10 text-primary border border-primary/20',
      }}
    >
      {icon && <span className="group-hover:scale-110 transition-transform">{icon}</span>}
      <span className="font-bold tracking-widest text-sm uppercase">{label}</span>
    </Link>
  )
}
