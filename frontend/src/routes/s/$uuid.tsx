import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Award, 
  Calendar, 
  Shield, 
  CheckCircle2, 
  Video,
  Clock,
  ExternalLink,
  Lock,
  Zap,
  Info
} from 'lucide-react'
import { fetchApi } from '../../lib/api'

export const Route = createFileRoute('/s/$uuid')({
  component: StudentMicrositePage,
})

interface StudentProfile {
  full_name: string;
  belt_rank: string;
  created_at: string;
  role: string;
  is_active: boolean;
  // Private data (only for auth scans)
  email?: string;
  fee_status?: string;
  payment_history?: any[];
  internal_notes?: string;
}

function StudentMicrositePage() {
  const { uuid } = Route.useParams();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticatedScan, setIsAuthenticatedScan] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        // We attempt to fetch the profile. 
        // The backend endpoint /users/rfid/:uuid will return 
        // public or private data based on the JWT in the header.
        const data = await fetchApi(`/users/rfid/${uuid}`);
        setProfile(data.profile);
        setIsAuthenticatedScan(data.is_authenticated);
      } catch (error) {
        console.error('Failed to load student profile:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [uuid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
          <Info className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase italic mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground max-w-xs">The student profile associated with this card could not be found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-hidden relative">
       {/* Background kinetic pattern */}
       <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
       
       <div className="max-w-xl mx-auto px-6 pt-24 space-y-10">
          {/* Header Card (Public) */}
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-3xl bg-primary/20 flex items-center justify-center border-2 border-primary/50 overflow-hidden mx-auto shadow-2xl shadow-primary/20">
                <Trophy className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white border-4 border-background">
                <Shield className="w-5 h-5 fill-current" />
              </div>
            </div>
            
            <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2">
                {profile.full_name}
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-primary uppercase">
                <Zap className="w-3 h-3 fill-current" />
                {profile.belt_rank || 'White Belt'}
              </div>
            </div>
          </div>

          {/* Achievements / Gamification (Public) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Accomplishments</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="glass-card p-6 border-white/5 space-y-4">
                  <Award className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-black uppercase italic text-sm">Iron Will</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-1">30 Day Streak</p>
                  </div>
               </div>
               <div className="glass-card p-6 border-white/5 space-y-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-black uppercase italic text-sm">Grading Alpha</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight mt-1">Pass 100%</p>
                  </div>
               </div>
            </div>
          </section>

          {/* Training Media Timeline (Public) */}
          <section className="space-y-6">
            <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Training Pulse</h3>
            <div className="space-y-4">
               {[1, 2].map((i) => (
                 <div key={i} className="glass-card overflow-hidden border-white/5">
                   <div className="aspect-video bg-white/5 flex items-center justify-center relative">
                     <Video className="w-12 h-12 text-white/20" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Sparring Session • 2 days ago</span>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </section>

          {/* Secure Layer (Only for Auth Scans) */}
          {!isAuthenticatedScan ? (
            <div className="p-8 rounded-[2rem] bg-white/2 border border-white/5 text-center space-y-6 opacity-60 grayscale">
              <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h4 className="font-black uppercase italic tracking-tight">Private Details Locked</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Login via the XMF app to view full profile</p>
              </div>
            </div>
          ) : (
            <section className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">Management Dashboard</h3>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase">Staff Access</span>
               </div>
               
               <div className="space-y-4">
                  {/* Fee Status */}
                  <div className="glass-card p-6 border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Payment Status</span>
                      <h4 className="text-xl font-black uppercase italic">Current</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Next Invoice</span>
                      <h4 className="text-sm font-black uppercase italic text-white/90">Nov 24, 2026</h4>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="glass-card p-6 border-white/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Internal Coaching Notes</span>
                    </div>
                    <p className="text-xs text-white/70 font-medium leading-relaxed italic">
                      "Student is making great progress on Bo-Staff fundamentals. Needs more focus on lower-body stability during jumping kicks."
                    </p>
                  </div>
                  
                  <button className="w-full py-5 bg-white/5 text-white font-black tracking-widest text-[10px] rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase flex items-center justify-center gap-3">
                    <ExternalLink className="w-4 h-4" /> Open Full Admin Suite
                  </button>
               </div>
            </section>
          )}

          {/* Bottom Branding */}
          <footer className="pt-10 text-center opacity-30">
             <span className="text-[10px] font-black tracking-[0.4em] uppercase">XMFCLUB SECURE ID</span>
          </footer>
       </div>
    </div>
  );
}
