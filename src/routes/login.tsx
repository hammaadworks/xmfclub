import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { PatternLock } from '#/components/PatternLock';
import { supabase } from '#/lib/supabase';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [pattern, setPattern] = useState<number[]>([]);
  const [step, setStep] = useState<'identifier' | 'pattern'>('identifier');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setStep('pattern');
    setError('');
  };

  const handlePatternComplete = async (drawnPattern: number[]) => {
    setPattern(drawnPattern);
    setLoading(true);
    setError('');

    const patternStr = drawnPattern.join('');

    // Query the custom members table directly
    const { data, error: signInError } = await supabase
      .from('members')
      .select('*')
      .eq('member_id', identifier.trim().toUpperCase())
      .eq('pattern_hash', patternStr)
      .single();

    if (signInError || !data) {
      setError('Invalid ID or pattern. Please try again.');
      setPattern([]);
      setLoading(false);
      return;
    }

    // Success! Store member session locally without the hash
    const { pattern_hash, ...safeData } = data;
    localStorage.setItem('xmf_member', JSON.stringify(safeData));
    if (safeData.role === 'admin') {
      navigate({ to: '/admin' });
    } else {
      navigate({ to: `/member/${safeData.member_id}` });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-2xl shadow-xl border">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-muted-foreground mt-2">
            {step === 'identifier' 
              ? 'Enter your Member ID' 
              : 'Draw your secure pattern'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {step === 'identifier' ? (
          <form onSubmit={handleIdentifierSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="e.g. XC260001"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-full text-lg"
              disabled={!identifier.trim()}
            >
              Next
            </button>
          </form>
        ) : (
          <div className="flex flex-col items-center space-y-8">
            <div className="text-center text-xl font-mono tracking-widest text-primary font-bold">
              {identifier}
            </div>
            
            <PatternLock 
              onComplete={handlePatternComplete} 
              error={!!error} 
            />

            <div className="flex justify-between w-full">
              <button 
                onClick={() => setStep('identifier')}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                Back
              </button>
              
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('showContactModal'));
                }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground h-10 px-4 py-2 underline underline-offset-4"
              >
                Forgot Pattern?
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
            className="text-sm font-bold tracking-wide text-muted-foreground hover:text-primary transition-colors underline underline-offset-4 uppercase"
          >
            Not a member? Join the Club
          </button>
        </div>
      </div>
    </div>
  );
}
