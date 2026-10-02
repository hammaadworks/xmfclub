import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { 
  User, Calendar, Trophy, LogOut,
  MapPin, ShieldCheck, Trash2, Edit2, Save, Lock, Clock, QrCode, Radio, Plus,
  Check, Copy, Share2, Activity, Award, AlertCircle,
  Droplet, ArrowLeft, KeyRound, CheckCircle2, Phone, Mail, Home
} from 'lucide-react'
import QRCode from 'qrcode'
import { supabase } from '#/lib/supabase'
import { PinPad } from '#/components/PinPad'
import { calculateTenure } from '#/lib/utils'
import { CredentialAssignmentModal } from '#/components/credentials/CredentialAssignmentModal'

export const Route = createFileRoute('/member/$memberId')({
  component: DashboardPage,
})

const BELT_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string; accent: string }> = {
  'White': { bg: 'bg-white/10', text: 'text-zinc-100', dot: 'bg-white', border: 'border-white/30', accent: '#f4f4f5' },
  'Yellow': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400', border: 'border-yellow-500/40', accent: '#eab308' },
  'Orange': { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-500', border: 'border-orange-500/40', accent: '#f97316' },
  'Green': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-500/40', accent: '#10b981' },
  'Blue': { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-500', border: 'border-blue-500/40', accent: '#3b82f6' },
  'Purple': { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-500', border: 'border-purple-500/40', accent: '#a855f7' },
  'Brown': { bg: 'bg-amber-900/30', text: 'text-amber-200', dot: 'bg-amber-700', border: 'border-amber-700/50', accent: '#b45309' },
  'Red': { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-500', border: 'border-red-500/40', accent: '#ef4444' },
  'Black': { bg: 'bg-zinc-800', text: 'text-zinc-200', dot: 'bg-zinc-950 border border-zinc-500', border: 'border-zinc-700', accent: '#27272a' },
};

const DEFAULT_BELT_ORDER = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black'];

function DashboardPage() {
  const { memberId } = Route.useParams()
  const [member, setMember] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [canManageCredentials, setCanManageCredentials] = useState(false)
  
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [appAlert, setAppAlert] = useState<{message: string, isConfirm?: boolean, onConfirm?: () => void} | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [attendanceLogged, setAttendanceLogged] = useState(false)
  const [beltConfig, setBeltConfig] = useState<any[]>([])

  // Credentials & Events
  const [credentials, setCredentials] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([])
  const [isCredentialModalOpen, setCredentialModalOpen] = useState(false)

  // Active Tab for dashboard
  const [activeTab, setActiveTab] = useState<'attendance' | 'profile' | 'roadmap' | 'events'>('attendance')

  // QR Code Data URL for Pass
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copiedId, setCopiedId] = useState(false)

  // Edit Profile State
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
    address: '',
    pin_code: '',
    blood_group: ''
  })
  
  // PIN & Unlock Modals
  const [showPinModal, setShowPinModal] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [pinError, setPinError] = useState('')
  const [unlockError, setUnlockError] = useState('')

  // Trigger quick toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Copy Member ID
  const handleCopyId = (id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id)
      setCopiedId(true)
      triggerToast(`Member ID ${id} copied!`)
      setTimeout(() => setCopiedId(false), 2000)
    }
  }

  // Auth sync helper
  const syncAuthState = () => {
    try {
      const data = localStorage.getItem('xmf_member')
      if (data) {
        const parsed = JSON.parse(data)
        const staffRoles = ['admin', 'volunteer', 'instructor']
        const hasStaffRole = staffRoles.includes(parsed.role)
        setIsStaff(hasStaffRole)
        setIsAdmin(parsed.role === 'admin' || parsed.role === 'instructor')
        setCanManageCredentials(parsed.role === 'admin' || parsed.role === 'volunteer')

        if (hasStaffRole || parsed.member_id === memberId.toUpperCase()) {
          setIsOwner(true)
        } else {
          setIsOwner(false)
        }
      } else {
        setIsStaff(false)
        setIsAdmin(false)
        setIsOwner(false)
        setCanManageCredentials(false)
      }
    } catch {
      setIsStaff(false)
      setIsAdmin(false)
      setIsOwner(false)
      setCanManageCredentials(false)
    }
  }

  useEffect(() => {
    syncAuthState()
    const handleAuthChange = () => syncAuthState()
    window.addEventListener('auth_change', handleAuthChange)
    return () => window.removeEventListener('auth_change', handleAuthChange)
  }, [memberId])

  // Fetch Member & Related Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const normalizedId = memberId.toUpperCase()
        const { data: memberData, error: mError } = await supabase
          .from('members')
          .select('*')
          .eq('member_id', normalizedId)
          .maybeSingle()

        if (mError && mError.code !== 'PGRST116') {
          console.error("Error fetching member:", mError)
        }

        if (memberData) {
          setMember(memberData)
          setEditForm({
            phone: memberData.phone || '',
            email: memberData.email || '',
            address: memberData.address || '',
            pin_code: memberData.pin_code || '',
            blood_group: memberData.blood_group || ''
          })

          // Generate dynamic QR Code for digital pass
          try {
            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xmfclub.com'
            const profileUrl = `${origin}/member/${memberData.member_id}`
            const qrData = await QRCode.toDataURL(profileUrl, {
              width: 320,
              margin: 1,
              color: { dark: '#000000', light: '#ffffff' }
            })
            setQrCodeUrl(qrData)
          } catch (qrErr) {
            console.warn("Failed to generate QR code:", qrErr)
          }
          
          // Fetch app settings for belts
          const { data: appSettings } = await supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle()
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
            .eq('member_id', memberData.member_id)
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

          // Fetch assigned credentials
          const { data: creds } = await supabase
            .from('credential_assignments')
            .select('credential_id, credentials(token, type)')
            .eq('member_id', memberData.member_id)
            .is('unassigned_at', null)
          if (creds) {
            setCredentials(creds.map((c: any) => ({ ...c.credentials, id: c.credential_id })))
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
            .eq('member_id', memberData.member_id)
          if (regsData) setRegisteredEventIds(regsData.map(r => r.event_id))
        }
      } catch (err) {
        console.error("Unhandled error in fetchData:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [memberId])

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
    window.dispatchEvent(new Event('auth_change'))
    syncAuthState()
    triggerToast("Logged out of member session")
  }

  // In-Page Quick Unlock via PIN
  const handleQuickUnlock = (pinEntered: string) => {
    if (!member) return
    const expectedPin = member.password || '12345'
    if (pinEntered === expectedPin) {
      const session = {
        member_id: member.member_id,
        name: member.name,
        role: member.role || 'student',
        belt: member.belt
      }
      localStorage.setItem('xmf_member', JSON.stringify(session))
      window.dispatchEvent(new Event('auth_change'))
      setIsOwner(true)
      setShowUnlockModal(false)
      setUnlockError('')
      triggerToast(`Welcome back, ${member.name}! Portal unlocked.`)
    } else {
      setUnlockError("Incorrect 5-digit PIN. Try default: 12345")
    }
  }

  // Attendance logging
  const handleMarkAttendance = async () => {
    if (!member) return

    const todayStr = new Date().toLocaleDateString('en-CA')
    if (attendanceLogs.some(log => new Date(log.timestamp).toLocaleDateString('en-CA') === todayStr)) {
      setAppAlert({ message: "Attendance has already been logged today for this athlete." })
      return
    }

    const { error } = await supabase
      .from('attendance')
      .insert([{ member_id: member.member_id, belt: member.belt }])
    
    if (!error) {
      setAttendanceLogged(true)
      triggerToast(`Logged attendance for ${member.name} (${member.belt} Belt)`)
      const { data: logs } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', member.member_id)
        .order('timestamp', { ascending: false })
      if (logs) setAttendanceLogs(logs)
    } else {
      setAppAlert({ message: "Failed to log attendance: " + error.message })
    }
  }

  const handleDeleteAttendance = (logId: number) => {
    setAppAlert({
      message: "Are you sure you want to delete this attendance scan record?",
      isConfirm: true,
      onConfirm: async () => {
        const { error } = await supabase.from('attendance').delete().eq('id', logId)
        if (!error) {
          setAttendanceLogs(prev => prev.filter(l => l.id !== logId))
          const todayStr = new Date().toLocaleDateString('en-CA')
          setAttendanceLogged(attendanceLogs.filter(l => l.id !== logId).some(l => new Date(l.timestamp).toLocaleDateString('en-CA') === todayStr))
          triggerToast("Attendance scan removed")
        } else {
          setAppAlert({ message: "Failed to delete log: " + error.message })
        }
      }
    })
  }

  // Save edited info
  const handleSaveInfo = async () => {
    const { error } = await supabase
      .from('members')
      .update(editForm)
      .eq('member_id', member.member_id)
    
    if (!error) {
      setMember({ ...member, ...editForm })
      setIsEditingInfo(false)
      triggerToast("Profile records updated successfully!")
    } else {
      setAppAlert({ message: "Failed to save info: " + error.message })
    }
  }

  // Register for event
  const handleRegisterEvent = async (eventId: string) => {
    if (!member) return
    const { error } = await supabase.from('event_registrations').insert([{
      event_id: eventId,
      member_id: member.member_id,
      status: 'Registered'
    }])
    
    if (!error) {
      setRegisteredEventIds(prev => [...prev, eventId])
      triggerToast("Registered for event successfully!")
    } else {
      if (error.code === '23505') {
        setAppAlert({ message: "You are already registered for this event." })
      } else {
        setAppAlert({ message: "Failed to register: " + error.message })
      }
    }
  }

  // WhatsApp Share URL
  const getWhatsAppShareUrl = () => {
    if (!member) return '#'
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xmfclub.com'
    const text = `🥋 *XMF Martial Arts Club Athlete Pass*\n\n` +
      `👤 *Student:* ${member.name}\n` +
      `🆔 *Member ID:* ${member.member_id}\n` +
      `🥋 *Belt Level:* ${member.belt || 'White Belt'}\n` +
      `📍 *Dojo Branch:* ${member.branch || 'The IWAN Community'}\n` +
      (member.blood_group ? `🩸 *Blood Group:* ${member.blood_group}\n` : '') +
      `\n🔗 View digital member pass & training log:\n${origin}/member/${member.member_id}`
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">Loading Athlete Profile...</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-6">
        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center shadow-xl">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-red-400">Record Not Found</span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Profile Not Found</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            No active athlete in the XMF club directory matches ID: <strong className="font-mono text-white">{memberId}</strong>
          </p>
        </div>
        <Link
          to="/xmform"
          className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          Go to Intake Form
        </Link>
      </div>
    )
  }

  // Belt Progress Computations
  const currentBeltConfig = beltConfig.find(b => b.name === member.belt)
  const requiredDays = currentBeltConfig?.required_days || 30
  const currentBeltLogs = attendanceLogs.filter(log => log.belt === member.belt || !log.belt)
  const beltProgressPct = Math.min(100, Math.round((currentBeltLogs.length / requiredDays) * 100))
  const activeBeltStyle = BELT_CONFIG[member.belt] || BELT_CONFIG['White']
  const beltOrderList = beltConfig.length > 0 ? beltConfig.map(b => b.name) : DEFAULT_BELT_ORDER
  const currentBeltIdx = beltOrderList.indexOf(member.belt)

  const beltCounts = attendanceLogs.reduce((acc, log) => {
    const b = log.belt || 'Unknown'
    acc[b] = (acc[b] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <>
      <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-20 px-4 sm:px-6 lg:px-8 text-foreground selection:bg-primary/20 relative overflow-hidden">
        {/* Ambient Martial Arts Lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-10 w-80 h-80 bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/20 text-white text-xs font-bold shadow-2xl backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Breadcrumb & Status Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <Link 
                to="/xmform" 
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors"
                title="Back to Roster / Registration"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-primary-light">Athlete Profile</span>
                  <span className="text-white/20">•</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{member.branch || 'The IWAN Community'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>{member.name}</span>
                  <span className="text-xs font-mono font-normal text-muted-foreground px-2 py-0.5 rounded-lg bg-white/5 border border-white/10">
                    {member.member_id}
                  </span>
                </h1>
              </div>
            </div>

            {/* Quick Status / Session Info */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Verification Badge */}
              {member.is_reviewed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Dojo Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Dojo Review
                </span>
              )}

              {/* Staff / Logged In Indicator */}
              {isOwner && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary-light text-xs font-mono font-bold uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5" />
                  {isStaff ? (isAdmin ? 'Admin Auth' : 'Staff Auth') : 'Authenticated'}
                </span>
              )}
            </div>
          </div>

          {/* MAIN BALANCED 12-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN (4 COLS): OFFICIAL DIGITAL PASS & SECURITY                     */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              
              {/* OFFICIAL ATHLETE CREDENTIAL PASS CARD */}
              <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-zinc-900/90 via-black to-zinc-950 p-6 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-white text-sm shadow-md">
                      X
                    </div>
                    <div>
                      <div className="text-[9px] font-black tracking-widest uppercase text-muted-foreground">Digital Dojo Pass</div>
                      <div className="text-xs font-black uppercase tracking-wider text-white">XMF Martial Arts Club</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>

                {/* Card Body */}
                <div className="py-6 relative z-10 flex flex-col items-center text-center space-y-4">
                  {/* Photo with Belt Ring */}
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-black/60 flex items-center justify-center">
                    {member.photo_url ? (
                      <img 
                        src={member.photo_url} 
                        alt={member.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/20 text-primary-light font-black text-4xl flex items-center justify-center">
                        {member.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Floating Belt dot on photo */}
                    <span className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-black ${activeBeltStyle.dot}`} />
                  </div>

                  {/* Name & ID */}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      {member.name}
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg font-mono font-black text-primary-light tracking-widest">
                        {member.member_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(member.member_id)}
                        className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-muted-foreground hover:text-white transition-colors"
                        title="Copy Member ID"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Badges: Belt & Blood Group & Branch */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {/* Belt Pill */}
                    <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${activeBeltStyle.bg} ${activeBeltStyle.text} ${activeBeltStyle.border}`}>
                      <span className={`w-2 h-2 rounded-full ${activeBeltStyle.dot}`} />
                      <span>{member.belt} Belt</span>
                    </div>

                    {/* Blood Group */}
                    {member.blood_group && (
                      <div className="px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                        <Droplet className="w-3 h-3 text-red-400 fill-red-400" />
                        <span>{member.blood_group}</span>
                      </div>
                    )}

                    {/* Age */}
                    {member.age && (
                      <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                        {member.age} yrs
                      </div>
                    )}
                  </div>

                  {/* Dojo Branch Tag */}
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary-light" />
                    <span>{member.branch || 'The IWAN Community'}</span>
                  </p>

                  {/* Scannable Dojo Pass QR Code */}
                  {qrCodeUrl && (
                    <div className="w-full pt-4 border-t border-white/10 flex flex-col items-center space-y-2">
                      <div className="p-3 bg-white rounded-2xl shadow-xl">
                        <img 
                          src={qrCodeUrl} 
                          alt={`QR Code Pass for ${member.member_id}`} 
                          className="w-36 h-36 object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Scan for Instant Dojo Check-In
                      </span>
                    </div>
                  )}
                </div>

                {/* Pass Card Actions */}
                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10">
                  <a
                    href={getWhatsAppShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    Print Pass
                  </button>
                </div>
              </div>

              {/* SECURITY & PORTAL UNLOCK CARD */}
              <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-primary-light" />
                    Portal Security
                  </h3>
                  {isOwner && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400">Unlocked</span>
                  )}
                </div>

                {isOwner ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      You are signed into <strong className="text-white">{member.name}</strong>'s member portal with full access to attendance logs and profile editing.
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowPinModal(true)}
                        className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Change PIN
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Are you <strong className="text-white">{member.name}</strong>? Unlock your full attendance record, belt roadmap, and personal info using your 5-digit PIN.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUnlockModal(true)}
                      className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock With PIN Code
                    </button>
                  </div>
                )}
              </div>

              {/* PHYSICAL CREDENTIALS (NFC & RFID TOKENS) */}
              <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-primary-light" />
                    Physical Credentials
                  </h3>
                  {canManageCredentials && (
                    <button 
                      onClick={() => setCredentialModalOpen(true)}
                      className="px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-light text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                      title="Assign New Token"
                    >
                      <Plus className="w-3 h-3" /> Assign
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {credentials.length === 0 ? (
                    <div className="py-4 text-center space-y-1">
                      <p className="text-xs text-muted-foreground italic">No RFID/NFC wristbands assigned yet.</p>
                      {canManageCredentials && (
                        <p className="text-[11px] text-primary-light">Tap "+ Assign" to pair a smart tag.</p>
                      )}
                    </div>
                  ) : (
                    credentials.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-2 rounded-lg ${c.type === 'qrc' ? 'bg-primary/20 text-primary-light' : 'bg-blue-500/20 text-blue-400'}`}>
                            {c.type === 'qrc' ? <QrCode className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                              {c.type === 'qrc' ? 'QR Badge' : 'NFC Tag'}
                            </span>
                            <span className="text-xs font-mono font-bold text-white tracking-wider">
                              {c.token}
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN (7-8 COLS): TABS, ATTENDANCE, PROFILE, ROADMAP & EVENTS       */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* STAFF ADMIN QUICK ACTIONS BANNER */}
              {isAdmin && (
                <div className="glass-card p-5 rounded-3xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Staff Attendance Authorization
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mark {member.name}'s dojo session for today ({new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleMarkAttendance}
                    disabled={attendanceLogged}
                    className="py-3 px-5 rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider transition-all shrink-0 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                  >
                    <Calendar className="w-4 h-4" />
                    {attendanceLogged ? 'Attended Today' : 'Log Today\'s Attendance'}
                  </button>
                </div>
              )}

              {/* DASHBOARD NAVIGATION TABS */}
              <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl overflow-x-auto" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'attendance'}
                  onClick={() => setActiveTab('attendance')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                    activeTab === 'attendance'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Attendance & Sessions ({attendanceLogs.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                    activeTab === 'profile'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  Dojo Profile & Records
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'roadmap'}
                  onClick={() => setActiveTab('roadmap')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                    activeTab === 'roadmap'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  Path to Black Belt
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'events'}
                  onClick={() => setActiveTab('events')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-150 ${
                    activeTab === 'events'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Events ({events.length})
                </button>
              </div>

              {/* ========================================================================= */}
              {/* TAB 1: ATTENDANCE & TRAINING HUB                                          */}
              {/* ========================================================================= */}
              {activeTab === 'attendance' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Belt Progress Meter Hero */}
                  <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current Grading Status</span>
                        <h3 className="text-xl sm:text-2xl font-black uppercase text-white flex items-center gap-2">
                          <span>{member.belt} Belt Progression</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${activeBeltStyle.bg} ${activeBeltStyle.text} ${activeBeltStyle.border}`}>
                            Active Rank
                          </span>
                        </h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-3xl font-mono font-black text-primary-light">
                          {currentBeltLogs.length} <span className="text-sm font-normal text-muted-foreground">/ {requiredDays}</span>
                        </span>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Sessions for Next Grading
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-muted-foreground">Belt Progress</span>
                        <span className="text-white">{beltProgressPct}% Completed</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 shadow-md shadow-primary/30"
                          style={{ width: `${beltProgressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground pt-0.5">
                        <span>Rank Inception</span>
                        <span>
                          {currentBeltLogs.length >= requiredDays 
                            ? 'Ready for Belt Grading Exam!' 
                            : `${requiredDays - currentBeltLogs.length} sessions remaining`}
                        </span>
                      </div>
                    </div>

                    {/* Lifetime Stats Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">Lifetime</span>
                        <span className="text-xl font-mono font-black text-white">{attendanceLogs.length}</span>
                        <span className="text-[9px] text-muted-foreground block">total sessions</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">Current Belt</span>
                        <span className="text-xl font-mono font-black text-primary-light">{currentBeltLogs.length}</span>
                        <span className="text-[9px] text-muted-foreground block">{member.belt} sessions</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">Club Tenure</span>
                        <span className="text-xl font-mono font-black text-white">
                          {calculateTenure(member.date_of_joining) || 'Active'}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">since join date</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">Eligibility</span>
                        <span className={`text-xs font-black uppercase block mt-1 ${currentBeltLogs.length >= requiredDays ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {currentBeltLogs.length >= requiredDays ? 'Eligible' : 'In Training'}
                        </span>
                        <span className="text-[9px] text-muted-foreground block">for promotion</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive 30-Session Matrix */}
                  <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                          {member.belt} Belt Session Matrix
                        </h4>
                        <p className="text-xs text-muted-foreground">Each tile corresponds to an official verified dojo check-in</p>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
                        1 Session = 1 Dojo Class
                      </span>
                    </div>

                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 sm:gap-2.5 pt-2">
                      {Array.from({ length: requiredDays }, (_, i) => {
                        const isAttended = i < currentBeltLogs.length
                        const log = isAttended ? currentBeltLogs[currentBeltLogs.length - 1 - i] : null
                        const logDate = log ? new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Slot #${i + 1}`

                        return (
                          <div
                            key={i}
                            title={log ? `${logDate} - ${new Date(log.timestamp).toLocaleTimeString()}` : `Session ${i + 1} Pending`}
                            className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center font-mono text-xs font-bold transition-all select-none ${
                              isAttended
                                ? 'bg-primary text-white border border-primary shadow-md shadow-primary/20 scale-[1.02]'
                                : 'bg-white/[0.03] border border-white/10 text-zinc-500 hover:border-white/20'
                            }`}
                          >
                            <span className="text-[11px]">{i + 1}</span>
                            {isAttended && (
                              <span className="text-[8px] opacity-80 leading-none mt-0.5">
                                {logDate}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Belt History Breakdown (if multiple belts) */}
                  {Object.keys(beltCounts).length > 1 && (
                    <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Belt History Breakdown
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(beltCounts).map(([bName, count]) => {
                          const bStyle = BELT_CONFIG[bName] || BELT_CONFIG['White']
                          return (
                            <div 
                              key={bName}
                              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${bStyle.dot}`} />
                              <span className="text-xs font-black uppercase tracking-wider">{bName} Belt:</span>
                              <span className="text-xs font-mono font-bold">{count as number} sessions</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Attendance Scans Timeline */}
                  <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                    <div className="p-5 bg-white/[0.02] border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary-light" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          Recent Dojo Scans ({attendanceLogs.length})
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">Sorted by newest</span>
                    </div>

                    <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                      {attendanceLogs.length === 0 ? (
                        <div className="p-8 text-center space-y-2">
                          <Activity className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
                          <p className="text-xs text-muted-foreground">No attendance logged yet for this athlete.</p>
                          {isAdmin && (
                            <p className="text-[11px] text-primary-light">Use the "Log Today's Attendance" button above to record check-in.</p>
                          )}
                        </div>
                      ) : (
                        attendanceLogs.map((log) => {
                          const logBeltStyle = BELT_CONFIG[log.belt || member.belt] || BELT_CONFIG['White']
                          return (
                            <div 
                              key={log.id} 
                              className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-bold text-white">
                                    {new Date(log.timestamp).toLocaleDateString(undefined, { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase border ${logBeltStyle.bg} ${logBeltStyle.text} ${logBeltStyle.border}`}>
                                      {log.belt || member.belt} Belt
                                    </span>
                                    <span className="text-[10px] font-mono text-muted-foreground">
                                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttendance(log.id)}
                                  className="p-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors opacity-70 group-hover:opacity-100"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: DOJO PROFILE & RECORDS                                             */}
              {/* ========================================================================= */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Personal Contact Details Card */}
                  <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary-light" />
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                          Personal & Contact Information
                        </h4>
                      </div>

                      {isOwner && (
                        !isEditingInfo ? (
                          <button
                            type="button"
                            onClick={() => setIsEditingInfo(true)}
                            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingInfo(false)
                                setEditForm({
                                  phone: member.phone || '',
                                  email: member.email || '',
                                  address: member.address || '',
                                  pin_code: member.pin_code || '',
                                  blood_group: member.blood_group || ''
                                })
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-red-400 text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveInfo}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                            >
                              <Save className="w-3 h-3" /> Save Changes
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Mobile Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary-light" />
                          Mobile Number
                        </label>
                        {isEditingInfo ? (
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                            placeholder="e.g. 9876543210"
                            className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:outline-none focus:border-primary"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 font-mono text-sm text-white">
                            {member.phone ? `+91 ${member.phone}` : 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-primary-light" />
                          Email Address
                        </label>
                        {isEditingInfo ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="student@example.com"
                            className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:outline-none focus:border-primary"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-white">
                            {member.email || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Blood Group */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-red-400" />
                          Blood Group
                        </label>
                        {isEditingInfo ? (
                          <input
                            type="text"
                            value={editForm.blood_group}
                            onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value.toUpperCase() })}
                            placeholder="e.g. B+"
                            className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white uppercase focus:outline-none focus:border-primary"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 font-mono text-sm text-red-300 font-bold">
                            {member.blood_group || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* PIN / Postal Code */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                          PIN / Postal Code
                        </label>
                        {isEditingInfo ? (
                          <input
                            type="text"
                            value={editForm.pin_code}
                            onChange={(e) => setEditForm({ ...editForm, pin_code: e.target.value })}
                            placeholder="e.g. 560041"
                            className="w-full h-12 px-4 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:outline-none focus:border-primary"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 font-mono text-sm text-white">
                            {member.pin_code || 'Not provided'}
                          </div>
                        )}
                      </div>

                      {/* Residential Address */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                          <Home className="w-3.5 h-3.5 text-primary-light" />
                          Residential Address
                        </label>
                        {isEditingInfo ? (
                          <textarea
                            rows={2}
                            value={editForm.address}
                            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            placeholder="Address details"
                            className="w-full p-4 rounded-xl bg-white/[0.04] border border-white/15 text-sm text-white focus:outline-none focus:border-primary resize-none"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 text-sm text-white">
                            {member.address || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Private Club & Billing Records Card */}
                  <div className="glass-card p-6 sm:p-7 rounded-3xl border border-primary/20 bg-primary/5 space-y-6">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-4">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <h4 className="text-sm font-black uppercase tracking-wider text-white">
                          Official Club & Membership Records
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-primary-light uppercase">XMF Registered</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Membership Joining Date */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                          Date of Joining
                        </span>
                        <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                          <span>{member.date_of_joining ? new Date(member.date_of_joining).toLocaleDateString() : 'N/A'}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-primary/20 text-primary-light border border-primary/30">
                            {calculateTenure(member.date_of_joining)}
                          </span>
                        </div>
                      </div>

                      {/* Fee Status */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                          Fee Status
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black uppercase tracking-wider ${member.fee_status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {member.fee_status || 'Pending'}
                          </span>
                          {member.pending_amount > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              ₹{member.pending_amount} Due
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Due Date & Detail (if present) */}
                      {member.due_date && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                            Next Due Date
                          </span>
                          <p className="text-sm font-mono text-white">
                            {new Date(member.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Fee Detail (if present) */}
                      {member.fee_detail && (
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                            Fee Plan
                          </span>
                          <p className="text-sm font-bold text-white">{member.fee_detail}</p>
                        </div>
                      )}
                    </div>

                    {/* Instructor Remarks */}
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        Head Instructor Remarks
                      </span>
                      <div className={`p-4 rounded-2xl border text-sm font-medium leading-relaxed ${
                        member.instructor_remarks_color === 'red'
                          ? 'bg-red-500/10 border-red-500/30 text-red-200'
                          : member.instructor_remarks_color === 'yellow'
                          ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      }`}>
                        {member.instructor_remarks || 'Student is currently training under regular curriculum guidelines. Maintain consistent dojo practice.'}
                      </div>
                    </div>

                    {/* Achievements */}
                    {member.achievements && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5" />
                          Dojo Honors & Achievements
                        </span>
                        <p className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-sm text-zinc-200 italic">
                          "{member.achievements}"
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: PATH TO BLACK BELT ROADMAP                                         */}
              {/* ========================================================================= */}
              {activeTab === 'roadmap' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-primary-light">Curriculum & Grading Ranks</span>
                        <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                          Path to Black Belt
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        Rank {currentBeltIdx >= 0 ? currentBeltIdx + 1 : 1} of {beltOrderList.length}
                      </span>
                    </div>

                    {/* Belt Stepper Timeline */}
                    <div className="space-y-3">
                      {beltOrderList.map((bName, idx) => {
                        const isCurrent = bName === member.belt
                        const isCompleted = currentBeltIdx > idx
                        const bStyle = BELT_CONFIG[bName] || BELT_CONFIG['White']

                        return (
                          <div
                            key={bName}
                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                              isCurrent
                                ? 'bg-primary/15 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary'
                                : isCompleted
                                ? 'bg-white/[0.02] border-white/10 opacity-70'
                                : 'bg-black/30 border-white/5 opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : isCurrent
                                  ? 'bg-primary text-white'
                                  : 'bg-white/5 text-muted-foreground'
                              }`}>
                                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                              </div>
                              <div>
                                <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                  <span>{bName} Belt</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-primary text-white">
                                      CURRENT RANK
                                    </span>
                                  )}
                                </span>
                                <p className="text-[11px] text-muted-foreground">
                                  {isCompleted ? 'Rank Achieved & Verified' : isCurrent ? `${currentBeltLogs.length}/${requiredDays} sessions completed` : 'Upcoming Grading Tier'}
                                </p>
                              </div>
                            </div>

                            <span className={`w-3.5 h-3.5 rounded-full border ${bStyle.dot}`} />
                          </div>
                        )
                      })}
                    </div>

                    {/* Video Syllabus Locked Box */}
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                      <Trophy className="w-8 h-8 text-primary mx-auto" />
                      <h5 className="text-sm font-black uppercase tracking-wider text-white">
                        Digital Video Syllabus
                      </h5>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Official kata and kumite technique video libraries are accessible to enrolled athletes during active semesters.
                      </p>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Request Syllabus Access
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: EVENTS & TOURNAMENTS                                               */}
              {/* ========================================================================= */}
              {activeTab === 'events' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-primary-light">Competitions & Seminars</span>
                      <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                        Featured Dojo Events
                      </h4>
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {events.length} Upcoming
                    </span>
                  </div>

                  {events.length === 0 ? (
                    <div className="glass-card p-12 text-center rounded-3xl border border-white/10 space-y-2">
                      <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                      <h5 className="text-sm font-bold uppercase tracking-wider text-white">No Upcoming Events</h5>
                      <p className="text-xs text-muted-foreground">Check back soon for new club championships and belt gradings.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {events.map((event) => {
                        const isRegistered = registeredEventIds.includes(event.id)
                        const eventDate = new Date(event.date)
                        const today = new Date()
                        eventDate.setHours(0, 0, 0, 0)
                        today.setHours(0, 0, 0, 0)
                        const isPast = eventDate < today
                        const isEligible = !event.target_belt || event.target_belt === 'All' || event.target_belt === member.belt

                        if (!isEligible || (isPast && !isRegistered)) return null

                        return (
                          <div 
                            key={event.id}
                            className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5 hover:border-primary/40 transition-all group"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary-light flex items-center justify-center">
                                  <Calendar className="w-5 h-5" />
                                </div>
                                {isRegistered && (
                                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> Registered
                                  </span>
                                )}
                              </div>

                              <h5 className="text-base sm:text-lg font-black uppercase text-white tracking-tight group-hover:text-primary-light transition-colors line-clamp-2">
                                {event.title}
                              </h5>

                              <div className="space-y-1.5 text-xs text-muted-foreground font-medium">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-primary-light" />
                                  <span>
                                    {new Date(event.date).toLocaleDateString(undefined, { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric', 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-primary-light" />
                                  {event.venue_map_url ? (
                                    <a
                                      href={event.venue_map_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-zinc-200 hover:text-primary transition-colors underline"
                                    >
                                      {event.venue_name || 'Main HQ Dojo'}
                                    </a>
                                  ) : (
                                    <span>{event.venue_name || 'Main HQ Dojo'}</span>
                                  )}
                                </div>
                                {event.fee_breakup?.total > 0 && (
                                  <div className="flex items-center gap-2 pt-1 font-mono font-bold text-white">
                                    <span className="text-[10px] uppercase text-muted-foreground">Entry Fee:</span>
                                    <span>₹{event.fee_breakup.total}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {!isPast && (
                              <button
                                type="button"
                                onClick={() => handleRegisterEvent(event.id)}
                                disabled={isRegistered}
                                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                                  isRegistered
                                    ? 'bg-white/5 text-muted-foreground border border-white/10 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary-dark text-white shadow-primary/20 active:scale-95'
                                }`}
                              >
                                {isRegistered ? 'Registration Confirmed' : 'Register for Event'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

        </div>
      </div>

      {/* QUICK PIN UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card bg-zinc-950 border border-white/20 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-primary/20 text-primary-light rounded-2xl flex items-center justify-center mx-auto border border-primary/30">
              <KeyRound className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Unlock Member Portal
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter {member.name}'s 5-digit PIN code to access your full attendance logs and records.
              </p>
            </div>

            {unlockError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold animate-in fade-in">
                {unlockError}
              </div>
            )}

            <PinPad 
              onComplete={handleQuickUnlock}
              error={unlockError}
            />

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowUnlockModal(false)
                  setUnlockError('')
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-card bg-zinc-950 border border-white/20 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 bg-primary/20 text-primary-light rounded-2xl flex items-center justify-center mx-auto border border-primary/30">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Set New PIN Code
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter a 5-digit numeric PIN to secure your portal login.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold animate-in fade-in">
                {pinError}
              </div>
            )}

            <PinPad 
              onComplete={async (pin) => {
                const { error } = await supabase
                  .from('members')
                  .update({ password: pin })
                  .eq('member_id', member.member_id)
                  
                if (!error) {
                  setPinError('')
                  setShowPinModal(false)
                  triggerToast("PIN code updated successfully!")
                } else {
                  setPinError("Failed to update PIN: " + error.message)
                }
              }} 
              error={pinError} 
            />

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false)
                  setPinError('')
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM / ALERT MODAL */}
      {appAlert && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card bg-zinc-950 border border-white/10 p-6 rounded-3xl max-w-sm w-full text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-primary-light" />
            </div>
            <p className="text-sm font-medium text-white">{appAlert.message}</p>
            <div className="flex justify-center gap-3 pt-2">
              {appAlert.isConfirm ? (
                <>
                  <button 
                    type="button"
                    onClick={() => setAppAlert(null)}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      appAlert.onConfirm && appAlert.onConfirm()
                      setAppAlert(null)
                    }}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-red-600/20"
                  >
                    Confirm Delete
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => setAppAlert(null)}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-primary/20"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIAL ASSIGNMENT MODAL (STAFF ONLY) */}
      <CredentialAssignmentModal 
        isOpen={isCredentialModalOpen}
        onClose={() => setCredentialModalOpen(false)}
        memberId={member.member_id}
        onAssigned={() => {
          window.location.reload()
        }}
      />
    </>
  )
}
