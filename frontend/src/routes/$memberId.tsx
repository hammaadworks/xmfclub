import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '#/lib/supabase'
import { 
  Trophy, Award, Calendar, Shield, CheckCircle2, 
  Lock, Zap, Info, ShieldCheck, Activity
} from 'lucide-react'

export const Route = createFileRoute('/$memberId')({
  component: MemberScanProfile,
})

function MemberScanProfile() {
  const { memberId } = Route.useParams()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [attendanceLogged, setAttendanceLogged] = useState(false)

  useEffect(() => {
    // Check if the viewer is an admin
    const authData = localStorage.getItem('xmf_member')
    if (authData) {
      const parsed = JSON.parse(authData)
      if (parsed.role === 'admin') {
        setIsAdmin(true)
      }
    }

    // Fetch member
    const fetchMember = async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('member_id', memberId.toUpperCase())
        .single()
      
      if (data) {
        setProfile(data)
      }
      setLoading(false)
    }

    fetchMember()
  }, [memberId])

  const handleMarkAttendance = async () => {
    if (!profile) return
    const { error } = await supabase
      .from('attendance')
      .insert([{ member_id: profile.id }])
    
    if (!error) {
      setAttendanceLogged(true)
    } else {
      alert("Failed to log attendance")
    }
  }

  const handleResetPattern = async () => {
    if (!profile) return
    if (confirm(`Are you sure you want to reset the pattern for ${profile.name} to the default 'X' pattern?`)) {
      const { error } = await supabase
        .from('members')
        .update({ pattern_hash: '048526' })
        .eq('id', profile.id)
      
      if (error) {
        alert("Failed to reset pattern: " + error.message)
      } else {
        alert("Pattern reset successfully to default 'X'.")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
          <Info className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Profile Not Found</h1>
        <p className="text-muted-foreground max-w-xs">No active student profile matches the ID: {memberId}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
      
      <div className="max-w-xl mx-auto px-6 space-y-10">
        
        {/* PUBLIC HEADER */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-3xl bg-primary/20 flex items-center justify-center border-2 border-primary/50 overflow-hidden mx-auto shadow-2xl shadow-primary/20 bg-black/50">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <Trophy className="w-16 h-16 text-primary" />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white border-4 border-background">
              <Shield className="w-5 h-5 fill-current" />
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">
              {profile.name}
            </h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black tracking-widest text-primary uppercase">
                <Zap className="w-3 h-3 fill-current" />
                {profile.belt} Belt
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${profile.member_status === 'Active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {profile.member_status}
              </div>
            </div>
          </div>
        </div>

        {/* PUBLIC STATS */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black tracking-widest text-muted-foreground uppercase px-2">Public Details</h3>
          <div className="glass-card p-6 border-white/5">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Blood Group</p>
                <p className="text-sm font-black">{profile.blood_group || 'N/A'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Branch</p>
                <p className="text-sm font-black">{profile.branch || 'Main HQ'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Joined</p>
                <p className="text-sm font-black">{new Date(profile.date_of_joining).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Member ID</p>
                <p className="text-sm font-mono font-bold text-primary">{profile.member_id}</p>
              </div>
              {profile.achievements && (
                <div className="col-span-2 mt-2 pt-4 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1 flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> Achievements
                  </p>
                  <p className="text-sm font-medium">{profile.achievements}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECURE AREA: ADMIN ONLY */}
        {!isAdmin ? (
          <div className="p-8 rounded-3xl bg-white/2 border border-white/5 text-center space-y-6 opacity-80 mt-12">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h4 className="font-black uppercase tracking-tight">Private Details Locked</h4>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Only authorized staff can view fee status and log attendance.</p>
            </div>
          </div>
        ) : (
          <section className="space-y-4 mt-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-black tracking-widest text-primary uppercase">Admin Scanner Dashboard</h3>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Staff Auth
              </span>
            </div>
            
            <div className="glass-card p-6 border-primary/20 bg-primary/5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Fee Status</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-xl font-black uppercase ${profile.fee_status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
                      {profile.fee_status || 'Unknown'}
                    </p>
                    {profile.pending_amount > 0 && (
                      <span className="text-xs font-bold text-red-400">
                        (₹{profile.pending_amount} Due)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Contact</p>
                  <p className="text-sm font-mono">{profile.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleMarkAttendance}
              disabled={attendanceLogged}
              className={`w-full py-5 font-black tracking-widest text-[12px] rounded-2xl uppercase flex items-center justify-center gap-3 transition-all ${
                attendanceLogged 
                  ? 'bg-green-500/20 text-green-500 border border-green-500/30 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary to-accent text-white hover:scale-[1.02] shadow-lg shadow-primary/20'
              }`}
            >
              {attendanceLogged ? (
                <><CheckCircle2 className="w-5 h-5" /> Attendance Logged</>
              ) : (
                <><Calendar className="w-5 h-5" /> Mark Today's Attendance</>
              )}
            </button>

            <button 
              onClick={handleResetPattern}
              className="w-full mt-4 py-4 font-black tracking-widest text-[10px] rounded-2xl uppercase flex items-center justify-center gap-3 transition-all bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
            >
              <Lock className="w-4 h-4" /> Reset Pattern to Default 'X'
            </button>
          </section>
        )}

      </div>
    </div>
  )
}
