import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { authClient } from '../lib/auth-client'
import { 
  Zap, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  ChevronLeft
} from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || '/',
      mode: (search.mode as 'login' | 'signup') || 'signup',
    }
  },
})

function AuthPage() {
  const { redirect, mode } = useSearch({ from: '/auth' })
  const navigate = useNavigate()
  const { data: session } = authClient.useSession()
  
  const [isSignUp, setIsSignUp] = useState(mode === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If already logged in, redirect away
  useEffect(() => {
    if (session) {
      navigate({ to: redirect })
    }
  }, [session, navigate, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error: signUpError } = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: redirect
        })
        if (signUpError) {
          setError(signUpError.message || 'Sign up failed')
        }
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirect
        })
        if (signInError) {
          setError(signInError.message || 'Sign in failed')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <button 
            onClick={() => window.history.back()}
            className="self-start mb-8 flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground hover:text-primary transition-colors uppercase"
          >
            <ChevronLeft className="w-4 h-4" /> Go Back
          </button>
          
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-primary/20">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-center leading-none">
            {isSignUp ? 'JOIN THE' : 'WELCOME TO'} <br />
            <span className="text-primary text-5xl">XMFCLUB.</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium mt-4 text-center">
            {isSignUp 
              ? 'Create your elite profile and start your legacy.' 
              : 'Enter your credentials to access your dashboard.'}
          </p>
        </div>

        <div className="glass-card p-8 border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Password</label>
                {!isSignUp && (
                  <button type="button" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/30 font-bold"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-xs font-bold text-destructive leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-white font-black tracking-[0.2em] text-xs rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 uppercase disabled:opacity-50 disabled:grayscale"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Profile' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-xs font-bold text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
            >
              {isSignUp ? (
                <>Already have an account? <span className="text-primary">Sign In</span></>
              ) : (
                <>New to the club? <span className="text-primary">Create Account</span></>
              )}
            </button>
          </div>
        </div>

        <p className="mt-10 text-[9px] text-center text-muted-foreground font-bold uppercase tracking-[0.2em] leading-relaxed">
          By continuing, you agree to the <br /> 
          <span className="text-white">XMFCLUB Terms of Service</span> & <span className="text-white">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
