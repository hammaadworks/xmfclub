import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { 
  User, Calendar, Trophy, Settings, LogOut, Award, 
  MapPin, Phone, Mail, FileText, Activity, ShieldCheck 
} from 'lucide-react'
import { supabase } from '#/lib/supabase'

export const Route = createFileRoute('/member/$memberId')({
  component: DashboardPage,
})

function DashboardPage() {
  const { memberId } = Route.useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'roadmap' | 'settings'>('profile')
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appAlert, setAppAlert] = useState<{message: string, isConfirm?: boolean, onConfirm?: () => void} | null>(null)
  const [attendanceLogged, setAttendanceLogged] = useState(false)
  const [beltConfig, setBeltConfig] = useState<any[]>([])

  useEffect(() => {
    const data = localStorage.getItem('xmf_member')
    if (!data) {
      navigate({ to: '/login' })
      return
    }
    const parsed = JSON.parse(data)
    
    // Check if it's an admin
    if (parsed.role === 'admin') {
      setIsAdmin(true)
    } else {
      // If student, they can only view their own profile
      if (parsed.member_id !== memberId.toUpperCase()) {
        navigate({ to: `/member/${parsed.member_id}` })
        return
      }
    }

    const fetchData = async () => {
      // Fetch member profile
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('member_id', memberId.toUpperCase())
        .single()

      if (memberData) {
        setMember(memberData)
        
        // Fetch app settings for belts
        const { data: appSettings } = await supabase.from('app_settings').select('*').eq('id', 'global').single()
        if (appSettings?.belts) {
          if (typeof appSettings.belts[0] === 'string') {
            setBeltConfig(appSettings.belts.map((b: string) => ({ name: b, required_days: 30 })))
          } else {
            setBeltConfig(appSettings.belts)
          }
        }

        // Fetch attendance
        const { data: logs } = await supabase
          .from('attendance')
          .select('*')
          .eq('member_id', memberData.id)
          .order('timestamp', { ascending: false })
        
        if (logs) {
          setAttendanceLogs(logs)
          const todayStr = new Date().toISOString().split('T')[0]
          if (logs.some((l: any) => l.timestamp.startsWith(todayStr))) {
            setAttendanceLogged(true)
          }
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [navigate, memberId])

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
    navigate({ to: '/login' })
  }

  const handleMarkAttendance = async () => {
    if (!member) return

    const todayStr = new Date().toISOString().split('T')[0]
    if (attendanceLogs.some(log => log.timestamp.startsWith(todayStr))) {
      setAppAlert({ message: "Attendance has already been logged today." })
      return
    }

    const { error } = await supabase
      .from('attendance')
      .insert([{ member_id: member.id, belt: member.belt }])
    
    if (!error) {
      setAttendanceLogged(true)
      const { data: logs } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', member.id)
        .order('timestamp', { ascending: false })
      if (logs) setAttendanceLogs(logs)
    } else {
      setAppAlert({ message: "Failed to log attendance" })
    }
  }

  const handleResetPatternClick = () => {
    if (!member) return
    setAppAlert({
      message: `Are you sure you want to reset the pattern for ${member.name} to the default 'X' pattern?`,
      isConfirm: true,
      onConfirm: async () => {
        const { error } = await supabase
          .from('members')
          .update({ pattern_hash: '048526' })
          .eq('id', member.id)
        
        if (error) {
          setAppAlert({ message: "Failed to reset pattern: " + error.message })
        } else {
          setAppAlert({ message: "Pattern reset successfully to default 'X'." })
        }
      }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!member) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
        <User className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Profile Not Found</h1>
      <p className="text-muted-foreground max-w-xs">No active student profile matches the ID: {memberId}</p>
    </div>
  )

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
        <div className="lg:col-span-9 relative">
          
          {isAdmin && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black tracking-widest text-primary uppercase">Admin Controls</h3>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-black uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Staff Auth
                </span>
              </div>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleMarkAttendance}
                  disabled={attendanceLogged}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl uppercase hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Calendar className="w-4 h-4" />
                  {attendanceLogged ? 'Attendance Logged' : 'Log Attendance'}
                </button>
                <button
                  onClick={handleResetPatternClick}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-500 border border-red-500/50 font-black tracking-widest text-xs rounded-xl uppercase hover:bg-red-500/30 transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Reset Pattern
                </button>
              </div>
            </div>
          )}

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
                    {member.fee_detail && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Fee Detail</p>
                        <p className="text-sm font-bold">{member.fee_detail}</p>
                      </div>
                    )}
                    {member.actual_fee > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Actual Fee</p>
                        <p className="text-sm font-bold">₹{member.actual_fee}</p>
                      </div>
                    )}
                    {member.due_date && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Due Date</p>
                        <p className="text-sm font-bold">{new Date(member.due_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Fee Status</p>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm font-black tracking-widest uppercase ${member.fee_status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
                          {member.fee_status || 'Pending'}
                        </p>
                        {member.fee_status === 'Pending' && member.pending_amount > 0 && (
                          <span className="text-xs font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                            ₹{member.pending_amount} Due
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Instructor Remarks</p>
                      <p className={`text-sm font-bold whitespace-pre-wrap p-4 rounded-xl border ${member.instructor_remarks_color === 'red' ? 'bg-red-500/10 border-red-500/30 text-red-100' : member.instructor_remarks_color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-100' : 'bg-green-500/10 border-green-500/30 text-green-100'}`}>
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
                        <p className="text-sm font-medium whitespace-pre-wrap text-foreground italic border-l-2 border-primary pl-4">
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
          {activeTab === 'attendance' && (() => {
            const currentBeltConfig = beltConfig.find(b => b.name === member?.belt)
            const requiredDays = currentBeltConfig?.required_days || 30
            // Fallback for old logs without a belt
            const currentBeltLogs = attendanceLogs.filter(log => log.belt === member?.belt || !log.belt)
            const blocks = Array.from({ length: requiredDays }, (_, i) => i)

            return (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Attendance Record</h3>
                  <div className="text-right">
                    <div className="text-2xl font-black text-primary">{attendanceLogs.length}</div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Lifetime Total</p>
                  </div>
                </div>

                {/* Belt Progress Calendar Grid */}
                <div className="glass-card p-6 md:p-8 text-center">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6">{member.belt} Belt Progress</h4>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {blocks.map(i => {
                      const isAttended = i < currentBeltLogs.length;
                      // logs are sorted newest first, so oldest is at the end
                      const log = isAttended ? currentBeltLogs[currentBeltLogs.length - 1 - i] : null;
                      const logDate = log ? new Date(log.timestamp).toLocaleDateString() : 'Pending';
                      
                      return (
                        <div 
                          key={i} 
                          title={logDate}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${isAttended ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]' : 'bg-white/5 border border-white/10 text-muted-foreground/30'}`}
                        >
                          {i + 1}
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-sm uppercase tracking-widest font-bold text-foreground">
                    <span className="text-primary">{currentBeltLogs.length}</span> / {requiredDays} Sessions Completed
                  </p>
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
                              {log.belt && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{log.belt} Belt</p>}
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
            )
          })()}

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
                    className="px-4 py-2 bg-white/10 text-white font-bold tracking-widest text-[10px] rounded-lg uppercase hover:bg-white/20 transition-colors border border-white/10"
                  >
                    Request Card
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {appAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in">
          <div className="glass-card p-8 w-full max-w-sm text-center border-primary/20 space-y-6 relative">
            <h4 className="text-lg font-black uppercase tracking-widest">Alert</h4>
            <p className="text-sm font-medium text-muted-foreground">{appAlert.message}</p>
            <div className="flex gap-4 justify-center pt-2">
              <button 
                onClick={() => setAppAlert(null)}
                className="px-6 py-3 bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl uppercase hover:bg-white/20 transition-colors flex-1"
              >
                {appAlert.isConfirm ? 'Cancel' : 'Dismiss'}
              </button>
              {appAlert.isConfirm && (
                <button 
                  onClick={() => {
                    appAlert.onConfirm?.()
                    setAppAlert(null)
                  }}
                  className="px-6 py-3 bg-primary text-white font-black tracking-widest text-[10px] rounded-xl uppercase hover:bg-primary/90 transition-colors flex-1"
                >
                  Confirm
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
