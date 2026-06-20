import { Link } from '@tanstack/react-router'
import { Home, AlertTriangle } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="relative flex flex-col items-center">
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full w-full h-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
          
          <h1 className="text-8xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-400 to-zinc-800 mb-2 font-display">
            404
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-zinc-300 mb-4 tracking-wide text-center">
            SIGNAL LOST
          </h2>
          
          <p className="text-zinc-500 max-w-md text-center mb-10 text-lg">
            The page you're looking for doesn't exist or has been moved. Let's get you back to training.
          </p>

          <Link
            to="/"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-all duration-300 ease-out bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-white hover:text-black hover:border-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          >
            <Home className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-1" />
            <span>Return to Base</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
