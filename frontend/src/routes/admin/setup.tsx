import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { fetchApi } from '../../lib/api'
import { authClient } from '../../lib/auth-client'
import { ShieldAlert, Zap, Key, CreditCard, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/admin/setup')({
  component: GenesisSetupPage,
})

function GenesisSetupPage() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()
  
  const [secret, setSecret] = useState('')
  const [rfidUuid, setRfidUuid] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-black uppercase italic mb-4">Unauthorized Access</h1>
        <p className="text-muted-foreground mb-8">You must be signed in to attempt the Genesis Protocol.</p>
        <button 
          onClick={() => navigate({ to: '/auth', search: { redirect: '/admin/setup', mode: 'login' }})}
          className="px-8 py-4 bg-primary text-white font-black tracking-widest text-xs rounded-xl uppercase"
        >
          Sign In
        </button>
      </div>
    )
  }

  const handleGenesis = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Need to grab the current token if possible, or BetterAuth's fetch wrapper handles it.
      // fetchApi sends the request. We assume we have a way to pass the JWT.
      // BetterAuth automatically attaches the session cookie, but our FastAPI expects a Bearer token.
      // For this demo, let's assume FastAPI gets the cookie OR we extract the token.
      // If FastAPI strictly uses Bearer, we might need authClient.getSession() logic or custom fetch.
      // Assuming fetchApi handles standard auth headers / cookies for now.

      const res = await fetchApi(`/users/genesis-admin?rfid_uuid=${rfidUuid}&secret=${secret}`, {
        method: 'POST',
      })
      
      setSuccess(true)
      setTimeout(() => {
        navigate({ to: '/admin' })
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Genesis sequence failed. Invalid secret.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-6 relative overflow-hidden flex flex-col items-center">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-destructive/10 blur-[120px] rounded-full -z-10" />

      <div className="w-full max-w-lg">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-destructive/20 text-destructive mb-6 shadow-2xl shadow-destructive/20 border border-destructive/30">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-4 text-destructive leading-none">
            GENESIS <span className="text-foreground">PROTOCOL.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            System bootstrapping. Promote your current account to Super Admin and link your physical master RFID.
          </p>
        </div>

        {success ? (
          <div className="glass-card p-12 border-primary/30 bg-primary/5 flex flex-col items-center text-center space-y-6">
            <CheckCircle2 className="w-20 h-20 text-primary" />
            <h2 className="text-2xl font-black uppercase italic">Access Granted</h2>
            <p className="text-muted-foreground text-sm font-medium">You are now a Super Admin. Redirecting to Dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleGenesis} className="glass-card p-8 border-white/5 space-y-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6 flex items-center gap-4">
              <img src={session.user.image || `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.name}`} className="w-12 h-12 rounded-full" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Current User</p>
                <p className="text-sm font-bold truncate">{session.user.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">System Secret</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter backend environment secret"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-destructive/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Master RFID UUID</label>
              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={rfidUuid}
                  onChange={(e) => setRfidUuid(e.target.value)}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-destructive/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                />
              </div>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1 ml-1">The physical NFC card to be linked as the Master Key.</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-xs font-bold text-destructive leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-destructive text-white font-black tracking-widest text-xs rounded-xl flex items-center justify-center gap-3 hover:bg-destructive/90 transition-all uppercase mt-8 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Execute Override <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
