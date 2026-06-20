import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { 
  User, Calendar, Trophy, Settings, LogOut, Award, 
  MapPin, Phone, Mail, FileText, Activity, ShieldCheck 
} from 'lucide-react'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const [member, setMember] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'roadmap' | 'settings'>('profile')
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])

  useEffect(() => {
    const data = localStorage.getItem('xmf_member')
    if (!data) {
      navigate({ to: '/login' })
      return
    }
    const parsed = JSON.parse(data)
    setMember(parsed)

    // Admin redirection check
    if (parsed.role === 'admin') {
      navigate({ to: '/admin' })
      return
    }

    // Fetch attendance
    const fetchAttendance = async () => {
      const { data: logs } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', parsed.id)
        .order('timestamp', { ascending: false })
      
      if (logs) setAttendanceLogs(logs)
    }

    fetchAttendance()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
    navigate({ to: '/login' })
  }

  if (!member) return null // or a loading spinner

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-0 left-0 w-1/2 h-[500px] bg-accent/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / Profile Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 border-primary/20 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-primary/30 relative bg-black/50">
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">{member.name}</h2>
            <p className="text-muted-foreground font-mono text-sm tracking-widest text-primary mb-4">{member.member_id}</p>
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-widest">{member.belt} Belt</span>
            </div>

            <div className="w-full space-y-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button 
                onClick={() => setActiveTab('attendance')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
              >
                <Calendar className="w-4 h-4" /> Attendance
              </button>
              <button 
                onClick={() => setActiveTab('roadmap')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
              >
                <Trophy className="w-4 h-4" /> Roadmap
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-gradient-to-r from-primary to-accent text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-4 mt-8 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Student Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-6">
                  <h4 className="text-xs font-black tracking-[0.2em] text-primary uppercase border-b border-white/5 pb-4">Personal Info</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {member.phone || 'Not provided'}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {member.email || 'Not provided'}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> {member.address || 'Not provided'}
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                      <Activity className="w-4 h-4 text-muted-foreground" /> Blood: {member.blood_group || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-6 border-primary/20 bg-primary/5">
                  <h4 className="text-xs font-black tracking-[0.2em] text-primary uppercase border-b border-primary/10 pb-4">Private Club Data</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Fee Status</p>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-black tracking-widest uppercase ${member.fee_status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
                          {member.fee_status || 'Pending'}
                        </p>
                        {member.pending_amount > 0 && (
                          <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                            ₹{member.pending_amount} Due
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Instructor Remarks</p>
                      <p className="text-sm font-medium text-foreground italic border-l-2 border-primary pl-4">
                        {member.instructor_remarks || 'No remarks yet. Keep training hard.'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Join Date</p>
                      <p className="text-sm font-mono">{new Date(member.date_of_joining).toLocaleDateString()}</p>
                    </div>
                    {member.achievements && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1 text-primary">Achievements</p>
                        <p className="text-sm font-medium text-foreground italic border-l-2 border-primary pl-4">
                          {member.achievements}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Attendance Record</h3>
              <div className="glass-card p-8 text-center">
                <div className="text-6xl font-black text-primary mb-2">{attendanceLogs.length}</div>
                <p className="text-sm uppercase tracking-widest font-bold text-muted-foreground">Total Sessions Attended</p>
              </div>

              <div className="glass-card overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/5">
                  <h4 className="text-xs font-black tracking-[0.2em] uppercase">Recent Scans</h4>
                </div>
                <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                  {attendanceLogs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground font-medium">No attendance logged yet. Scan your ID at the front desk.</div>
                  ) : (
                    attendanceLogs.map((log) => (
                      <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/20 text-primary rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ROADMAP TAB */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Path to Black Belt</h3>
              <div className="glass-card p-8 text-center border-primary/20">
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="text-lg font-black uppercase tracking-widest mb-2">Curriculum Locked</h4>
                <p className="text-muted-foreground text-sm font-medium mb-6">
                  Access to full belt syllabus videos and detailed grade roadmaps is currently unavailable in the pilot demo.
                </p>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-[10px] rounded-xl uppercase hover:scale-105 transition-transform"
                >
                  Request Early Access
                </button>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Security & Settings</h3>
              
              <div className="glass-card p-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-6">
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-sm mb-1">Pattern Lock</h4>
                    <p className="text-xs text-muted-foreground font-medium">Update your 3x3 pattern sequence used for login.</p>
                  </div>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                    className="px-4 py-2 bg-white/10 text-white font-bold tracking-widest text-[10px] rounded-lg uppercase hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Change Pattern
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-sm mb-1">NFC Card ID</h4>
                    <p className="text-xs text-muted-foreground font-medium">Request a replacement if your physical card is lost.</p>
                  </div>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                    className="px-4 py-2 bg-red-500/10 text-red-500 font-bold tracking-widest text-[10px] rounded-lg uppercase hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    Report Lost
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
