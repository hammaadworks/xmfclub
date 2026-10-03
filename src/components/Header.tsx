import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Calendar,
  LogOut,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  User,
  UserPlus,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [member, setMember] = useState<any>(null)

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
    window.addEventListener('auth_change', handleAuthChange)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('storage', handleAuthChange)
      window.removeEventListener('auth_change', handleAuthChange)
    }
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-[background-color,border-color,padding,box-shadow] duration-300 ease-out border-b print:hidden ${
        isScrolled
          ? 'bg-background border-white/10 py-4 shadow-xl'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 relative z-50">
          <button
            className="lg:hidden w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform duration-200 ease-out shadow-lg shadow-primary/20"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="font-black text-white tracking-tighter text-lg leading-none">
              X
            </span>
          </button>

          <Link to="/" className="hidden lg:flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-200 ease-out shadow-lg shadow-primary/20">
              <span className="font-black text-white tracking-tighter text-lg leading-none">
                X
              </span>
            </div>
            <span className="font-black tracking-tighter text-xl uppercase group-hover:text-primary transition-colors">
              XMFCLUB
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            to="/"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase active:text-primary"
          >
            Home
          </Link>
          <Link
            to="/training"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Training
          </Link>
          <Link
            to="/events"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Events
          </Link>
          <Link
            to="/resources"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Resources
          </Link>
          <Link
            to="/store"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Store
          </Link>
          <Link
            to="/hall-of-fame"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Hall of Fame
          </Link>
          <Link
            to="/connect"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase"
          >
            Connect
          </Link>
          <Link
            to="/xmform"
            className="text-xs font-black tracking-widest hover:text-primary transition-colors uppercase text-primary-light"
          >
            Register
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {member ? (
            <div className="flex items-center gap-2">
              {member.role === 'admin' ? (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary-light font-black tracking-widest text-[10px] rounded-full uppercase transition-all flex items-center gap-1.5 shadow-sm"
                  title="Admin Command Center"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Admin</span>
                </Link>
              ) : null}

              <Link
                to="/member/$memberId"
                params={{ memberId: member.member_id }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black tracking-widest text-[10px] rounded-full uppercase transition-all flex items-center gap-1.5"
                title={`Logged in as ${member.name} (${member.member_id})`}
              >
                <User className="w-3.5 h-3.5 text-primary-light" />
                <span>{member.name.split(' ')[0]}</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('xmf_member')
                  window.dispatchEvent(new Event('auth_change'))
                  setMember(null)
                  setIsOpen(false)
                  window.location.href = '/login'
                }}
                className="p-2 sm:px-3 sm:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 hover:text-red-300 font-black tracking-widest text-[10px] rounded-full uppercase transition-all flex items-center gap-1.5 active:scale-95"
                title="Sign Out of Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-full uppercase shadow-md shadow-primary/20 transition-colors duration-150"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-background/95 backdrop-blur-xl transition-opacity duration-300 lg:hidden overflow-y-auto z-40 pt-28 pb-10 ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-start min-h-full gap-6 px-6 max-w-sm mx-auto">
          {/* Mobile Auth Profile Card */}
          {member ? (
            <div className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light font-black text-sm">
                  {member.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black uppercase text-white truncate">
                    {member.name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-primary-light font-bold">
                      {member.member_id}
                    </span>
                    <span className="text-white/20">•</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">
                      {member.role || 'Student'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <Link
                  to="/member/$memberId"
                  params={{ memberId: member.member_id }}
                  onClick={() => setIsOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  My Pass
                </Link>
                {member.role === 'admin' ? (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary-light text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('xmf_member')
                      window.dispatchEvent(new Event('auth_change'))
                      setMember(null)
                      setIsOpen(false)
                      window.location.href = '/login'
                    }}
                    className="py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                )}
              </div>

              {member.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('xmf_member')
                    window.dispatchEvent(new Event('auth_change'))
                    setMember(null)
                    setIsOpen(false)
                    window.location.href = '/login'
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out of Dojo
                </button>
              )}
            </div>
          ) : (
            <div className="w-full">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
              >
                <User className="w-4 h-4" />
                Member Portal Login
              </Link>
            </div>
          )}

          <nav className="flex flex-col items-center justify-start w-full gap-5 pt-2 border-t border-white/10">
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
          <SidebarLink
            to="/xmform"
            icon={<UserPlus size={20} />}
            label="Register / Intake"
            onClick={() => setIsOpen(false)}
          />
        </nav>
        </div>
      </div>
    </header>
  )
}

export function SidebarLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
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
