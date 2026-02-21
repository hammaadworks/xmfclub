import { authClient } from '#/lib/auth-client'
import { Link } from '@tanstack/react-router'
import { LogOut, User } from 'lucide-react'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="h-10 w-24 bg-white/5 animate-pulse rounded-xl" />
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
          {session.user.image ? (
            <img src={session.user.image} alt="" className="h-6 w-6 rounded-full" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs font-bold tracking-tight text-foreground hidden sm:inline">
            {session.user.name?.split(' ')[0].toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => {
            void authClient.signOut()
          }}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive transition-all cursor-pointer"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    )
  }

  return (
    <Link
      to="/demo/better-auth"
      className="px-6 py-2.5 text-xs font-black tracking-[0.2em] bg-primary text-white rounded-xl hover:scale-105 transition-transform uppercase inline-flex items-center shadow-lg shadow-primary/20"
    >
      Join Club
    </Link>
  )
}
