import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { 
  User, Calendar, Trophy, LogOut,
  MapPin, Phone, Mail, Activity, ShieldCheck, Trash2, Edit2, Save, X
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
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appAlert, setAppAlert] = useState<{message: string, isConfirm?: boolean, onConfirm?: () => void} | null>(null)
  const [attendanceLogged, setAttendanceLogged] = useState(false)
  const [beltConfig, setBeltConfig] = useState<any[]>([])

  // Events State
  const [events, setEvents] = useState<any[]>([])
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([])

  // Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editForm, setEditForm] = useState({ phone: '', email: '', address: '', blood_group: '' })

  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem('xmf_member')
    
    if (data) {
      const parsed = JSON.parse(data)
      // Check if it's an admin
      if (parsed.role === 'admin') {
        setIsAdmin(true)
        setIsOwner(true) // Admins have owner-level viewing rights
      } else if (parsed.member_id === memberId.toUpperCase()) {
        // If student is viewing their own profile
        setIsOwner(true)
      }
    }

    const fetchData = async () => {
      try {
        // Fetch member profile
        const { data: memberData, error: mError } = await supabase
          .from('members')
          .select('*')
          .eq('member_id', memberId.toUpperCase())
          .single()

        if (mError && mError.code !== 'PGRST116') {
          console.error("Error fetching member:", mError)
        }

        if (memberData) {
          setMember(memberData)
          setEditForm({
            phone: memberData.phone || '',
            email: memberData.email || '',
            address: memberData.address || '',
            blood_group: memberData.blood_group || ''
          })
          
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
          const { data: logs, error: lError } = await supabase
            .from('attendance')
            .select('*')
            .eq('member_id', memberData.id)
            .order('timestamp', { ascending: false })
          
          if (lError) {
            console.error("Error fetching logs:", lError)
          }

          if (logs) {
            setAttendanceLogs(logs)
            const todayStr = new Date().toLocaleDateString('en-CA')
            if (logs.some((l: any) => new Date(l.timestamp).toLocaleDateString('en-CA') === todayStr)) {
              setAttendanceLogged(true)
            }
          }

          // Fetch upcoming events
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true })
          if (eventsData) setEvents(eventsData)

          // Fetch event registrations
          const { data: regsData } = await supabase
            .from('event_registrations')
            .select('event_id')
            .eq('member_id', memberData.id)
          if (regsData) setRegisteredEventIds(regsData.map(r => r.event_id))
        }
      } catch (err) {
        console.error("Unhandled error in fetchData:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, memberId])

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
    navigate({ to: '/login' })
  }

  const handleMarkAttendance = async () => {
    if (!member) return

    const todayStr = new Date().toLocaleDateString('en-CA')
    if (attendanceLogs.some(log => new Date(log.timestamp).toLocaleDateString('en-CA') === todayStr)) {
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

  const handleDeleteAttendance = (logId: number) => {
    setAppAlert({
      message: "Are you sure you want to delete this attendance record?",
      isConfirm: true,
      onConfirm: async () => {
        const { error } = await supabase.from('attendance').delete().eq('id', logId)
        if (!error) {
          setAttendanceLogs(prev => prev.filter(l => l.id !== logId))
          const todayStr = new Date().toLocaleDateString('en-CA')
          setAttendanceLogged(attendanceLogs.filter(l => l.id !== logId).some(l => new Date(l.timestamp).toLocaleDateString('en-CA') === todayStr))
        } else {
          setAppAlert({ message: "Failed to delete log: " + error.message })
        }
      }
    })
  }

  const handleSaveInfo = async () => {
    const { error } = await supabase
      .from('members')
      .update(editForm)
      .eq('id', member.id)
    
    if (!error) {
      setMember({ ...member, ...editForm })
      setIsEditingInfo(false)
    } else {
      setAppAlert({ message: "Failed to save info: " + error.message })
    }
  }

  const handleRegisterEvent = async (eventId: string) => {
    if (!member) return
    const { error } = await supabase.from('event_registrations').insert([{
      event_id: eventId,
      member_id: member.id,
      status: 'Registered'
    }])
    
    if (!error) {
      setRegisteredEventIds(prev => [...prev, eventId])
      setAppAlert({ message: "Successfully registered for the event!" })
    } else {
      if (error.code === '23505') {
         setAppAlert({ message: "You are already registered for this event." })
      } else {
         setAppAlert({ message: "Failed to register: " + error.message })
      }
    }
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

  const currentBeltConfig = beltConfig.find(b => b.name === member.belt)
  const requiredDays = currentBeltConfig?.required_days || 30
  const currentBeltLogs = attendanceLogs.filter(log => log.belt === member.belt || !log.belt)
  const blocks = Array.from({ length: requiredDays }, (_, i) => i)

  const beltCounts = attendanceLogs.reduce((acc, log) => {
    const b = log.belt || 'Unknown';
    acc[b] = (acc[b] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 relative">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
      <div className="absolute top-0 left-0 w-1/2 h-[500px] bg-accent/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / Profile Card */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 border-primary/20 flex flex-col items-center text-center sticky top-24">
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
            
            {localStorage.getItem('xmf_member') && (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 relative space-y-12">
          
          {isAdmin && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
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
              </div>
            </div>
          )}

          {/* SECTION: PROFILE */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter border-b border-white/10 pb-4">
              {isOwner ? 'Student Details' : 'Public Profile'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Private Info: Only visible to Owner/Admin */}
              {isOwner ? (
                <>
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h4 className="text-xs font-black tracking-[0.2em] text-primary uppercase">Personal Info</h4>
                      {!isEditingInfo ? (
                        <button 
                          onClick={() => setIsEditingInfo(true)}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-bold uppercase"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setIsEditingInfo(false)
                              setEditForm({
                                phone: member.phone || '',
                                email: member.email || '',
                                address: member.address || '',
                                blood_group: member.blood_group || ''
                              })
                            }}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-bold uppercase"
                          >
                            <X className="w-3 h-3" /> Cancel
                          </button>
                          <button 
                            onClick={handleSaveInfo}
                            className="text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 font-bold uppercase"
                          >
                            <Save className="w-3 h-3" /> Save
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground">Phone</label>
                        {isEditingInfo ? (
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                            value={editForm.phone}
                            onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          />
                        ) : (
                          <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white/70">
                            {member.phone || 'Not provided'}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground">Email</label>
                        {isEditingInfo ? (
                          <input 
                            type="email" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                            value={editForm.email}
                            onChange={e => setEditForm({...editForm, email: e.target.value})}
                          />
                        ) : (
                          <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white/70">
                            {member.email || 'Not provided'}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground">Blood Group</label>
                        {isEditingInfo ? (
                          <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors"
                            value={editForm.blood_group}
                            onChange={e => setEditForm({...editForm, blood_group: e.target.value})}
                          />
                        ) : (
                          <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white/70">
                            {member.blood_group || 'Not provided'}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground">Address</label>
                        {isEditingInfo ? (
                          <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary transition-colors h-24"
                            value={editForm.address}
                            onChange={e => setEditForm({...editForm, address: e.target.value})}
                          />
                        ) : (
                          <div className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white/70 min-h-[3rem]">
                            {member.address || 'Not provided'}
                          </div>
                        )}
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
                </>
              ) : (
                <div className="glass-card p-6 md:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Member Since</p>
                      <p className="text-sm font-bold">{new Date(member.date_of_joining).toLocaleDateString()}</p>
                    </div>
                    {member.date_of_leaving && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-red-400/70 font-bold mb-1">Date of Leaving</p>
                        <p className="text-sm font-bold text-red-400">{new Date(member.date_of_leaving).toLocaleDateString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Branch</p>
                      <p className="text-sm font-bold">{member.branch || 'Headquarters'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Blood Group</p>
                      <p className="text-sm font-bold text-red-400">{member.blood_group || 'N/A'}</p>
                    </div>
                  </div>
                  {member.achievements && (
                    <div className="pt-6 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2 text-primary">Achievements</p>
                      <p className="text-sm font-medium whitespace-pre-wrap text-foreground italic border-l-2 border-primary pl-4">
                        {member.achievements}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION: ATTENDANCE */}
          {isOwner && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Attendance Record</h3>
                <div className="text-right">
                  <div className="text-2xl font-black text-primary">{attendanceLogs.length}</div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Lifetime Total</p>
                </div>
              </div>

              {Object.keys(beltCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(beltCounts).map(([b, count]) => (
                    <div key={b} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{b} Belt:</span>
                      <span className="text-sm font-bold text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="glass-card p-6 md:p-8 text-center">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6">{member.belt} Belt Progress</h4>
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {blocks.map(i => {
                    const isAttended = i < currentBeltLogs.length;
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
                    <div className="p-8 text-center text-muted-foreground font-medium">No attendance logged yet.</div>
                  ) : (
                    attendanceLogs.map((log) => (
                      <div key={log.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/20 text-primary rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{new Date(log.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            {log.belt && <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{log.belt} Belt</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs font-mono text-muted-foreground">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </div>
                          {isAdmin && (
                            <button 
                              onClick={() => handleDeleteAttendance(log.id)}
                              className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Attendance"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION: EVENTS */}
          {isOwner && events.some(e => !e.target_belt || e.target_belt === 'All' || e.target_belt === member.belt) && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter border-b border-white/10 pb-4">Featured Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map(event => {
                  const isRegistered = registeredEventIds.includes(event.id)
                  const eventDate = new Date(event.date)
                  const today = new Date()
                  eventDate.setHours(0, 0, 0, 0)
                  today.setHours(0, 0, 0, 0)
                  const isPast = eventDate < today
                  const isEligible = !event.target_belt || event.target_belt === 'All' || event.target_belt === member.belt
                  
                  if (!isEligible || (isPast && !isRegistered)) return null

                  return (
                    <div key={event.id} className="glass-card p-6 border-white/10 flex flex-col h-full hover:border-primary/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-primary/20 text-primary p-3 rounded-xl">
                          <Calendar className="w-6 h-6" />
                        </div>
                        {isRegistered && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Registered
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-lg font-black uppercase tracking-tight mb-2 line-clamp-2">{event.title}</h4>
                      
                      <div className="space-y-3 mb-6 mt-auto">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                          <Clock className="w-4 h-4 text-primary" />
                          {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                          <MapPin className="w-4 h-4 text-primary" />
                          {event.venue_map_url ? (
                            <a 
                              href={event.venue_map_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="hover:text-primary transition-colors hover:underline flex items-center gap-1"
                            >
                              {event.venue_name || 'Main HQ'}
                            </a>
                          ) : (
                            <span>{event.venue_name || 'Main HQ'}</span>
                          )}
                        </div>
                        {event.fee_breakup?.total > 0 && (
                          <div className="flex items-center gap-3 text-sm font-bold">
                            <span className="text-primary tracking-widest uppercase text-[10px]">Fee:</span> ₹{event.fee_breakup.total}
                          </div>
                        )}
                        {event.target_belt !== 'All' && (
                          <div className="flex items-center gap-3 text-sm font-bold">
                            <span className="text-primary tracking-widest uppercase text-[10px]">For:</span> {event.target_belt} Belts
                          </div>
                        )}
                      </div>
                      
                      {!isPast && (
                        <button 
                          onClick={() => handleRegisterEvent(event.id)}
                          disabled={isRegistered}
                          className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                            isRegistered 
                              ? 'bg-white/5 text-muted-foreground cursor-not-allowed' 
                              : 'bg-gradient-to-r from-primary to-accent text-white hover:scale-105 shadow-lg shadow-primary/20'
                          }`}
                        >
                          {isRegistered ? 'Registered' : 'Register Now'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SECTION: ROADMAP */}
          {isOwner && (
            <div className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tighter border-b border-white/10 pb-4">Path to Black Belt</h3>
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
