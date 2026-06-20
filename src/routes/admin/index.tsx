import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '#/lib/supabase'
import { 
  ShieldAlert, Settings, Users, Calendar, Plus, Edit, Lock,
  ShieldCheck, Loader2, Search, QrCode, LogOut, Trash2,
  MapPin, Link as LinkIcon, AlertTriangle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { CustomSelect } from '#/components/CustomSelect'
import { Scanner } from '@yudiel/react-qr-scanner'

type BranchConfig = {
  name: string;
  address: string;
  mapsUrl: string;
}

type BeltConfig = {
  name: string;
  required_days: number;
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'scanner' | 'events' | 'settings'>('members')
  const [loading, setLoading] = useState(true)
  const [appAlert, setAppAlert] = useState<{message: string, isConfirm?: boolean, onConfirm?: () => void} | null>(null)
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false)
  
  // Members State
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [feeFilter, setFeeFilter] = useState('All')
  const [remarkFilter, setRemarkFilter] = useState('All')
  
  // Create Member Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [savingMember, setSavingMember] = useState(false)
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'student',
    belt: 'White',
    address: '',
    branch: 'XMF Main HQ',
    date_of_joining: new Date().toISOString().split('T')[0],
    date_of_leaving: '',
    achievements: '',
    instructor_remarks_color: 'green',
    instructor_remarks: '',
    actual_fee: 0,
    fee_detail: '',
    due_date: '',
    pending_amount: 0,
    photo_url: ''
  })

  // Edit Member Modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'student',
    belt: 'White',
    member_status: 'Active',
    fee_status: 'Paid',
    instructor_remarks: '',
    address: '',
    branch: 'XMF Main HQ',
    date_of_joining: '',
    date_of_leaving: '',
    achievements: '',
    instructor_remarks_color: 'green',
    actual_fee: 0,
    fee_detail: '',
    due_date: '',
    pending_amount: 0,
    photo_url: ''
  })
  const [expandedSection, setExpandedSection] = useState<'personal' | 'club' | 'financials'>('personal')

  // Events State
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    target_belt: 'All',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    fee: 0
  })
  const [eventRegistrations, setEventRegistrations] = useState<Record<string, any[]>>({})
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  // Edit Event State
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editEventForm, setEditEventForm] = useState({
    title: '',
    description: '',
    target_belt: 'All',
    date: '',
    time: '',
    fee: 0
  })

  // Settings State
  const [branches, setBranches] = useState<BranchConfig[]>([
    { name: "XMF Main HQ", address: "123 Main St", mapsUrl: "" },
    { name: "Northside Dojo", address: "456 North Ave", mapsUrl: "" },
    { name: "Downtown Club", address: "789 Down Blvd", mapsUrl: "" }
  ])
  const [belts, setBelts] = useState<BeltConfig[]>([
    { name: "White", required_days: 30 },
    { name: "Yellow", required_days: 30 },
    { name: "Orange", required_days: 30 },
    { name: "Green", required_days: 30 },
    { name: "Blue", required_days: 30 },
    { name: "Purple", required_days: 30 },
    { name: "Brown", required_days: 30 },
    { name: "Black", required_days: 30 }
  ])
  const [newBranch, setNewBranch] = useState<BranchConfig>({ name: '', address: '', mapsUrl: '' })
  const [newBelt, setNewBelt] = useState<BeltConfig>({ name: '', required_days: 30 })

  useEffect(() => {
    const data = localStorage.getItem('xmf_member')
    if (!data) {
      navigate({ to: '/login' })
      return
    }
    const parsed = JSON.parse(data)
    
    if (parsed.role !== 'admin') {
      navigate({ to: `/member/${parsed.member_id}` })
      return
    }
    
    setAdmin(parsed)
    loadMembers()
    loadSettings()
    loadEvents()
  }, [navigate])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global').single()
      if (data) {
        if (data.branches) setBranches(data.branches)
        if (data.belts) {
          // migrate old string[] belts if necessary
          if (typeof data.belts[0] === 'string') {
            setBelts(data.belts.map((b: string) => ({ name: b, required_days: 30 })))
          } else {
            setBelts(data.belts)
          }
        }
      }
    } catch (e) {
      console.warn("Settings table might not exist yet", e)
    }
  }

  const saveSettings = async (newBranches: BranchConfig[], newBelts: BeltConfig[]) => {
    try {
      await supabase.from('app_settings').upsert({
        id: 'global',
        branches: newBranches,
        belts: newBelts
      })
    } catch (e) {
      console.error("Failed to save settings", e)
    }
  }

  const handleAddBranch = () => {
    if (!newBranch.name.trim()) return
    const updated = [...branches, { ...newBranch, name: newBranch.name.trim() }]
    setBranches(updated)
    setNewBranch({ name: '', address: '', mapsUrl: '' })
    saveSettings(updated, belts)
  }
  const handleRemoveBranch = (bName: string) => {
    const updated = branches.filter(x => x.name !== bName)
    setBranches(updated)
    saveSettings(updated, belts)
  }

  const handleAddBelt = () => {
    if (!newBelt.name.trim()) return
    const updated = [...belts, { ...newBelt, name: newBelt.name.trim() }]
    setBelts(updated)
    setNewBelt({ name: '', required_days: 30 })
    saveSettings(branches, updated)
  }
  const handleRemoveBelt = (bName: string) => {
    const updated = belts.filter(x => x.name !== bName)
    setBelts(updated)
    saveSettings(branches, updated)
  }

  const loadMembers = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setMembers(data)
    setLoading(false)
  }

  const loadEvents = async () => {
    setLoadingEvents(true)
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    if (data) setEvents(data)
    setLoadingEvents(false)
  }

  const loadEventRegistrations = async (eventId: string) => {
    const { data } = await supabase
      .from('event_registrations')
      .select('*, members(name, belt, phone)')
      .eq('event_id', eventId)
    
    if (data) {
      setEventRegistrations(prev => ({...prev, [eventId]: data}))
    }
  }

  const handleToggleEventResponses = (eventId: string) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null)
    } else {
      setExpandedEventId(eventId)
      if (!eventRegistrations[eventId]) {
        loadEventRegistrations(eventId)
      }
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`).toISOString()
      const { error } = await supabase.from('events').insert([{
        title: eventForm.title,
        description: eventForm.description,
        target_belt: eventForm.target_belt,
        date: eventDateTime,
        fee_breakup: { total: eventForm.fee }
      }])
      
      if (error) throw error
      
      setAppAlert({ message: 'Event created successfully!' })
      setShowCreateEventModal(false)
      loadEvents()
      setEventForm({
        title: '', description: '', target_belt: 'All', date: new Date().toISOString().split('T')[0], time: '10:00', fee: 0
      })
    } catch (err: any) {
      setAppAlert({ message: 'Error creating event: ' + err.message })
    }
  }

  const handleEditEventClick = (evt: any) => {
    setEditingEventId(evt.id)
    const evtDate = new Date(evt.date)
    setEditEventForm({
      title: evt.title || '',
      description: evt.description || '',
      target_belt: evt.target_belt || 'All',
      date: evtDate.toISOString().split('T')[0],
      time: evtDate.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      fee: evt.fee_breakup?.total || 0
    })
    setShowEditEventModal(true)
  }

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const eventDateTime = new Date(`${editEventForm.date}T${editEventForm.time}`).toISOString()
      const { error } = await supabase.from('events').update({
        title: editEventForm.title,
        description: editEventForm.description,
        target_belt: editEventForm.target_belt,
        date: eventDateTime,
        fee_breakup: { total: editEventForm.fee }
      }).eq('id', editingEventId)
      
      if (error) throw error
      
      setAppAlert({ message: 'Event updated successfully!' })
      setShowEditEventModal(false)
      loadEvents()
    } catch (err: any) {
      setAppAlert({ message: 'Error updating event: ' + err.message })
    }
  }

  const handleDeleteEvent = (id: string) => {
    setAppAlert({
      message: 'Are you sure you want to delete this event? This will also remove all registrations.',
      isConfirm: true,
      onConfirm: async () => {
        const { error } = await supabase.from('events').delete().eq('id', id)
        if (error) {
          setAppAlert({ message: 'Failed to delete event: ' + error.message })
        } else {
          setAppAlert({ message: 'Event deleted successfully.' })
          loadEvents()
        }
      }
    })
  }

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMember(true)

    try {
      if (!memberForm.phone) {
        setAppAlert({ message: 'Phone number is mandatory.' })
        setSavingMember(false)
        return
      }

      if (memberForm.phone.length !== 10 || isNaN(Number(memberForm.phone))) {
        setAppAlert({ message: 'Phone number must be exactly 10 digits.' })
        setSavingMember(false)
        return
      }
  
      const { data: existing } = await supabase
          .from('members')
          .select('id')
          .eq('phone', memberForm.phone)
          .maybeSingle()
        
        if (existing) {
          setAppAlert({ message: 'This phone number is already registered to another member.' })
          setSavingMember(false)
          return
        }

      // 1. Generate new ID
      const { data: latestMembers } = await supabase
        .from('members')
        .select('member_id')
        .order('member_id', { ascending: false })
        .limit(1)

      let newIdStr = 'XC260001'
      if (latestMembers && latestMembers.length > 0 && latestMembers[0].member_id.startsWith('XC26')) {
        const lastId = latestMembers[0].member_id
        const numPart = parseInt(lastId.replace('XC26', ''), 10)
        newIdStr = `XC26${String(numPart + 1).padStart(4, '0')}`
      }

      // 2. Insert
      const { error } = await supabase
        .from('members')
        .insert([{
          member_id: newIdStr,
          role: memberForm.role,
          name: memberForm.name,
          phone: memberForm.phone || null,
          email: memberForm.email || null,
          belt: memberForm.belt,
          pattern_hash: '048526', // Default 'X' pattern
          member_status: 'Active',
          fee_status: 'Paid',
          address: memberForm.address || null,
          branch: memberForm.branch || 'XMF Main HQ',
          date_of_joining: memberForm.date_of_joining || null,
          date_of_leaving: memberForm.date_of_leaving || null,
          achievements: memberForm.achievements || null,
          instructor_remarks_color: memberForm.instructor_remarks_color || 'green',
          instructor_remarks: memberForm.instructor_remarks || null,
          actual_fee: memberForm.actual_fee || 0,
          fee_detail: memberForm.fee_detail || null,
          due_date: memberForm.due_date || null,
          pending_amount: memberForm.pending_amount || 0,
          photo_url: memberForm.photo_url || null
        }])

      if (error) {
        console.error(error)
        setAppAlert({ message: 'Failed to create member: ' + error.message })
      } else {
        setShowCreateModal(false)
        setMemberForm({ 
          name: '', phone: '', email: '', role: 'student', belt: 'White', 
          address: '', branch: 'XMF Main HQ', date_of_joining: new Date().toISOString().split('T')[0], 
          date_of_leaving: '', achievements: '', instructor_remarks_color: 'green', instructor_remarks: '',
          actual_fee: 0, fee_detail: '', due_date: '', pending_amount: 0, photo_url: ''
        })
        loadMembers()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingMember(false)
    }
  }

  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (m.name && m.name.toLowerCase().includes(q)) || 
      (m.member_id && m.member_id.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q));
      
    const matchesFee = feeFilter === 'All' || m.fee_status === feeFilter;
    const matchesRemark = remarkFilter === 'All' || m.instructor_remarks_color === remarkFilter.toLowerCase();
    
    return matchesSearch && matchesFee && matchesRemark;
  })

  const handleEditClick = (member: any) => {
    setEditingMemberId(member.id)
    
    setEditForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      role: member.role || 'student',
      belt: member.belt || 'White',
      member_status: member.member_status || 'Active',
      fee_status: member.fee_status || 'Paid',
      instructor_remarks: member.instructor_remarks || '',
      address: member.address || '',
      branch: member.branch || 'XMF Main HQ',
      date_of_joining: member.date_of_joining ? member.date_of_joining.split('T')[0] : '',
      date_of_leaving: member.date_of_leaving ? member.date_of_leaving.split('T')[0] : '',
      achievements: member.achievements || '',
      instructor_remarks_color: member.instructor_remarks_color || 'green',
      actual_fee: member.actual_fee || 0,
      fee_detail: member.fee_detail || '',
      due_date: member.due_date ? member.due_date.split('T')[0] : '',
      pending_amount: member.pending_amount || 0,
      photo_url: member.photo_url || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMember(true)
    try {
      if (!editForm.phone) {
        setAppAlert({ message: 'Phone number is mandatory.' })
        setSavingMember(false)
        return
      }

      if (editForm.phone.length !== 10 || isNaN(Number(editForm.phone))) {
        setAppAlert({ message: 'Phone number must be exactly 10 digits.' })
        setSavingMember(false)
        return
      }
  
      const { data: existing } = await supabase
          .from('members')
          .select('id')
          .eq('phone', editForm.phone)
          .neq('id', editingMemberId)
          .maybeSingle()
        
        if (existing) {
          setAppAlert({ message: 'This phone number is already registered to another member.' })
          setSavingMember(false)
          return
        }

      const { error } = await supabase
        .from('members')
        .update({
          name: editForm.name,
          phone: editForm.phone || null,
          email: editForm.email || null,
          role: editForm.role,
          belt: editForm.belt,
          member_status: editForm.member_status,
          fee_status: editForm.fee_status,
          instructor_remarks: editForm.instructor_remarks || null,
          address: editForm.address || null,
          branch: editForm.branch || null,
          date_of_joining: editForm.date_of_joining || null,
          date_of_leaving: editForm.date_of_leaving || null,
          achievements: editForm.achievements || null,
          instructor_remarks_color: editForm.instructor_remarks_color || 'green',
          actual_fee: editForm.actual_fee || 0,
          fee_detail: editForm.fee_detail || null,
          due_date: editForm.due_date || null,
          pending_amount: editForm.pending_amount || 0,
          photo_url: editForm.photo_url || null
        })
        .eq('id', editingMemberId)

      if (error) {
        setAppAlert({ message: 'Failed to update member: ' + error.message })
      } else {
        setShowEditModal(false)
        loadMembers()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingMember(false)
    }
  }

  const handleResetPatternClick = () => {
    if (!editingMemberId) return
    setAppAlert({
      message: "Are you sure you want to reset this user's pattern to the default 'X'?",
      isConfirm: true,
      onConfirm: async () => {
        setSavingMember(true)
        try {
          const { error } = await supabase
            .from('members')
            .update({ pattern_hash: '048526' })
            .eq('id', editingMemberId)

          if (error) {
            setAppAlert({ message: 'Failed to reset pattern: ' + error.message })
          } else {
            setAppAlert({ message: 'Pattern successfully reset to default "X".' })
          }
        } catch (err) {
          console.error(err)
        } finally {
          setSavingMember(false)
        }
      }
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
    window.dispatchEvent(new Event('auth_change'))
    navigate({ to: '/login' })
  }

  if (!admin) return null

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-7xl mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Command <span className="brand-gradient bg-clip-text text-transparent">Center</span></h1>
          </div>
          <p className="text-muted-foreground font-medium">Logged in as {admin.name} (Admin)</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('members')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'members' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4" /> Members
          </button>
          <button 
            onClick={() => setActiveTab('scanner')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'scanner' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <QrCode className="w-4 h-4" /> App Scanner
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'events' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <Calendar className="w-4 h-4" /> Events
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'settings' ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          
          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text" 
                    placeholder="Search by Name, XC-ID, or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CustomSelect 
                    value={feeFilter}
                    onChange={(val) => setFeeFilter(val)}
                    options={[{label: 'All Fees', value: 'All'}, {label: 'Paid', value: 'Paid'}, {label: 'Pending', value: 'Pending'}]}
                  />
                  <CustomSelect 
                    value={remarkFilter}
                    onChange={(val) => setRemarkFilter(val)}
                    options={[
                      {label: 'All Remarks', value: 'All'}, 
                      {label: 'Green', value: 'Green'}, 
                      {label: 'Yellow', value: 'Yellow'}, 
                      {label: 'Red', value: 'Red'}
                    ]}
                  />
                </div>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl uppercase hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="w-4 h-4" /> New Member
                </button>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="glass-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest font-black text-muted-foreground">
                        <tr>
                          <th className="px-6 py-4">Member ID</th>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Belt / Role</th>
                          <th className="px-6 py-4">Fees & Status</th>
                          <th className="px-6 py-4">Remark</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredMembers.map(m => (
                          <tr key={m.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-primary">
                              <button 
                                onClick={() => navigate({ to: `/member/${m.member_id}` })}
                                className="hover:underline cursor-pointer flex items-center gap-2"
                              >
                                {m.member_id}
                                <span className="p-1 bg-white/5 rounded"><ExternalLink className="w-3 h-3" /></span>
                              </button>
                            </td>
                            <td className="px-6 py-4 font-bold">{m.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold">{m.belt}</span>
                                {m.role === 'admin' && <span className="text-[10px] text-red-400 uppercase tracking-widest">Admin</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-start gap-1">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${m.member_status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                  {m.member_status}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${m.fee_status === 'Paid' ? 'text-green-500' : 'text-red-500 bg-red-500/10'}`}>
                                  {m.fee_status === 'Paid' ? 'Paid' : `₹${m.pending_amount || 0} Due`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`w-3 h-3 rounded-full ${m.instructor_remarks_color === 'red' ? 'bg-red-500' : m.instructor_remarks_color === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'}`} title={m.instructor_remarks} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleEditClick(m)}
                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white inline-block"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredMembers.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground font-medium">No members found.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SCANNER TAB */}
          {activeTab === 'scanner' && (
            <div className="glass-card p-12 text-center border-white/5 animate-in fade-in slide-in-from-bottom-4">
               {isScanning ? (
                 <div className="max-w-sm mx-auto">
                   <div className="aspect-square overflow-hidden rounded-2xl border-4 border-primary/30 mb-6 bg-black relative">
                     <Scanner 
                       onScan={(result) => {
                         if (result && result.length > 0) {
                           const text = result[0].rawValue;
                           const match = text.match(/XC\d{6}/i);
                           if (match) {
                             setIsScanning(false)
                             navigate({ to: `/member/${match[0].toUpperCase()}` })
                           } else {
                             setIsScanning(false)
                             setAppAlert({ message: "Invalid QR Code: No XMF Member ID found in the code. Scanned: " + text })
                           }
                         }
                       }} 
                       onError={(error) => {
                         console.error("Scanner Error:", error);
                         setAppAlert({ message: `Camera error: ${error.message || 'Check permissions'}` });
                         setIsScanning(false);
                       }}
                     />
                   </div>
                   <button 
                     onClick={() => setIsScanning(false)}
                     className="px-6 py-3 bg-red-500/10 text-red-500 font-black tracking-widest text-xs rounded-xl uppercase hover:bg-red-500/20 transition-colors"
                   >
                     Cancel Scan
                   </button>
                 </div>
               ) : (
                 <>
                   <QrCode className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                   <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">In-App Scanner</h2>
                   <p className="text-muted-foreground max-w-md mx-auto">Use this module to scan physical student NFC/QR cards to instantly log attendance and pull up Full Profiles.</p>
                   <button 
                     onClick={() => setIsScanning(true)}
                     className="mt-8 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-xs rounded-xl uppercase hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                   >
                     Activate Scanner
                   </button>
                 </>
               )}
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                 <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" /> Event Management</h3>
                 <button 
                   onClick={() => setShowCreateEventModal(true)}
                   className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-black tracking-widest text-[10px] rounded-xl uppercase hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-primary/20"
                 >
                   <Plus className="w-4 h-4" /> Create Event
                 </button>
               </div>

               {loadingEvents ? (
                 <div className="flex justify-center p-12">
                   <Loader2 className="w-8 h-8 text-primary animate-spin" />
                 </div>
               ) : events.length === 0 ? (
                 <div className="glass-card p-12 text-center border-white/5">
                   <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                   <h2 className="text-xl font-black uppercase tracking-tighter mb-2">No Events Scheduled</h2>
                   <p className="text-muted-foreground max-w-md mx-auto">Create workshops, gradings, and tracking sessions.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-6">
                   {events.map((evt) => (
                     <div key={evt.id} className="glass-card overflow-hidden border-white/5 transition-all hover:border-primary/30">
                       <div className="p-6">
                         <div className="flex justify-between items-start mb-4">
                           <div>
                             <h4 className="text-xl font-black uppercase tracking-tight">{evt.title}</h4>
                             <p className="text-sm text-muted-foreground mt-1">{evt.description}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleEditEventClick(evt)}
                               className="p-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                             >
                               <Edit className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDeleteEvent(evt.id)}
                               className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                           <div>
                             <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1">Date</p>
                             <p className="text-sm font-bold">{new Date(evt.date).toLocaleDateString()}</p>
                           </div>
                           <div>
                             <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1">Time</p>
                             <p className="text-sm font-bold">{new Date(evt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                           </div>
                           <div>
                             <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1">Target Belt</p>
                             <p className="text-sm font-bold text-primary">{evt.target_belt}</p>
                           </div>
                           <div>
                             <p className="text-[10px] font-black tracking-widest uppercase text-muted-foreground mb-1">Entry Fee</p>
                             <p className="text-sm font-bold">₹{evt.fee_breakup?.total || 0}</p>
                           </div>
                         </div>

                         <div className="border-t border-white/5 pt-4">
                           <button 
                             onClick={() => handleToggleEventResponses(evt.id)}
                             className="w-full flex items-center justify-between text-sm font-bold tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
                           >
                             <span className="flex items-center gap-2"><Users className="w-4 h-4" /> View Registrations ({eventRegistrations[evt.id]?.length || 0})</span>
                             {expandedEventId === evt.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                           </button>

                           {expandedEventId === evt.id && (
                             <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                               {!eventRegistrations[evt.id] ? (
                                 <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                               ) : eventRegistrations[evt.id].length === 0 ? (
                                 <p className="text-center text-muted-foreground text-sm py-4">No registrations yet.</p>
                               ) : (
                                 <div className="space-y-2">
                                   {eventRegistrations[evt.id].map((reg: any) => (
                                     <div key={reg.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                       <div>
                                         <p className="font-bold text-sm uppercase">{reg.members?.name}</p>
                                         <p className="text-xs text-muted-foreground font-mono">{reg.members?.phone}</p>
                                       </div>
                                       <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black tracking-widest uppercase text-primary">
                                         {reg.members?.belt}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> System Settings</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Branches CRUD */}
                 <div className="glass-card p-6">
                   <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 border-b border-white/10 pb-2">Manage Branches</h4>
                   <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                     {branches.map(b => (
                       <div key={b.name} className="flex flex-col gap-2 p-3 bg-white/5 rounded-xl border border-white/5 group relative">
                         <div className="flex items-center justify-between">
                           <span className="font-bold text-sm">{b.name}</span>
                           <button 
                             onClick={() => handleRemoveBranch(b.name)}
                             className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all absolute top-2 right-2"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                         <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                           <MapPin className="w-3 h-3" /> {b.address || 'No Address'}
                         </div>
                         <div className="text-[10px] text-primary flex items-center gap-1 truncate">
                           <LinkIcon className="w-3 h-3" /> {b.mapsUrl || 'No Maps Link'}
                         </div>
                       </div>
                     ))}
                   </div>
                   <div className="space-y-2">
                     <input 
                       value={newBranch.name}
                       onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                       placeholder="Branch Name"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                     />
                     <input 
                       value={newBranch.address}
                       onChange={e => setNewBranch({...newBranch, address: e.target.value})}
                       placeholder="Full Address"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                     />
                     <input 
                       value={newBranch.mapsUrl}
                       onChange={e => setNewBranch({...newBranch, mapsUrl: e.target.value})}
                       placeholder="Google Maps URL"
                       className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                     />
                     <button 
                       onClick={handleAddBranch}
                       className="w-full py-2 mt-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-1 transition-all"
                     >
                       <Plus className="w-4 h-4" /> Add Branch
                     </button>
                   </div>
                 </div>

                 {/* Belts CRUD */}
                 <div className="glass-card p-6">
                   <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-4 border-b border-white/10 pb-2">Manage Belts</h4>
                   <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2">
                     {belts.map(b => (
                       <div key={b.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                         <div>
                           <span className="font-bold text-sm block">{b.name}</span>
                           <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{b.required_days} Days Required</span>
                         </div>
                         <button 
                           onClick={() => handleRemoveBelt(b.name)}
                           className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <input 
                       value={newBelt.name}
                       onChange={e => setNewBelt({...newBelt, name: e.target.value})}
                       placeholder="New Belt Level..."
                       className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                     />
                     <input 
                       type="number"
                       value={newBelt.required_days}
                       onChange={e => setNewBelt({...newBelt, required_days: parseInt(e.target.value) || 30})}
                       placeholder="Days"
                       className="w-24 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                     />
                     <button 
                       onClick={handleAddBelt}
                       className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1 transition-all"
                     >
                       <Plus className="w-4 h-4" /> Add
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE MEMBER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative my-auto">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Create New Member</h3>
            <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-6 border-b border-white/10 pb-4">
              ID Auto-Generated • Default Pattern: 'X' (048526)
            </p>
            
            <form onSubmit={handleCreateMember} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Full Name</label>
                <input 
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({...memberForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Phone <span className="text-red-500">*</span></label>
                  <input 
                    required
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="10-digit number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Email</label>
                  <input 
                    type="email"
                    value={memberForm.email}
                    onChange={(e) => setMemberForm({...memberForm, email: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Profile Photo Link</label>
                <input 
                  type="url"
                  value={memberForm.photo_url}
                  onChange={(e) => setMemberForm({...memberForm, photo_url: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">System Role</label>
                  <CustomSelect 
                    value={memberForm.role}
                    onChange={(val) => setMemberForm({...memberForm, role: val})}
                    options={[{label: 'Student', value: 'student'}, {label: 'Administrator', value: 'admin'}]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Starting Belt</label>
                  <CustomSelect 
                    value={memberForm.belt}
                    onChange={(val) => setMemberForm({...memberForm, belt: val})}
                    options={belts.map(b => ({label: b.name, value: b.name}))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Address</label>
                  <input 
                    value={memberForm.address}
                    onChange={(e) => setMemberForm({...memberForm, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Physical Address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Branch</label>
                  <CustomSelect 
                    value={memberForm.branch}
                    onChange={(val) => setMemberForm({...memberForm, branch: val})}
                    options={branches.map(b => ({label: b.name, value: b.name}))}
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/5">
                <h4 className="text-xs font-black tracking-widest uppercase mb-4 text-primary">Financials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Actual Fee (₹)</label>
                    <input 
                      type="number"
                      value={memberForm.actual_fee}
                      onChange={(e) => setMemberForm({...memberForm, actual_fee: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Fee Detail (Reason)</label>
                    <input 
                      value={memberForm.fee_detail}
                      onChange={(e) => setMemberForm({...memberForm, fee_detail: e.target.value})}
                      placeholder="e.g. Monthly Fee"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Due Date</label>
                    <input 
                      type="date"
                      value={memberForm.due_date}
                      onChange={(e) => setMemberForm({...memberForm, due_date: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Pending Amount (₹)</label>
                    <input 
                      type="number"
                      value={memberForm.pending_amount}
                      onChange={(e) => setMemberForm({...memberForm, pending_amount: parseInt(e.target.value) || 0})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {savingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* EDIT MEMBER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative my-auto">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Edit Member</h3>
                       <form onSubmit={handleUpdateMember} className="space-y-4">
              {/* Personal Details Accordion */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedSection(expandedSection === 'personal' ? null as any : 'personal')}
                >
                  <h4 className="font-bold text-sm tracking-widest uppercase">Personal Details</h4>
                  {expandedSection === 'personal' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {expandedSection === 'personal' && (
                  <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Full Name</label>
                      <input 
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Phone <span className="text-red-500">*</span></label>
                        <input 
                          required
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                          placeholder="10-digit number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Email</label>
                        <input 
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Profile Photo Link</label>
                      <input 
                        type="url"
                        value={editForm.photo_url}
                        onChange={(e) => setEditForm({...editForm, photo_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Address</label>
                      <input 
                        value={editForm.address}
                        onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        placeholder="Physical Address"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Club Info Accordion */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedSection(expandedSection === 'club' ? null as any : 'club')}
                >
                  <h4 className="font-bold text-sm tracking-widest uppercase">Club Information</h4>
                  {expandedSection === 'club' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {expandedSection === 'club' && (
                  <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">System Role</label>
                        <CustomSelect 
                          value={editForm.role}
                          onChange={(val) => setEditForm({...editForm, role: val})}
                          options={[{label: 'Student', value: 'student'}, {label: 'Administrator', value: 'admin'}]}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Belt</label>
                        <CustomSelect 
                          value={editForm.belt}
                          onChange={(val) => setEditForm({...editForm, belt: val})}
                          options={belts.map(b => ({label: b.name, value: b.name}))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Member Status</label>
                        <CustomSelect 
                          value={editForm.member_status}
                          onChange={(val) => setEditForm({...editForm, member_status: val})}
                          options={[{label: 'Active', value: 'Active'}, {label: 'Inactive', value: 'Inactive'}]}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Branch</label>
                        <CustomSelect 
                          value={editForm.branch}
                          onChange={(val) => setEditForm({...editForm, branch: val})}
                          options={branches.map(b => ({label: b.name, value: b.name}))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Date of Joining</label>
                        <input 
                          type="date"
                          value={editForm.date_of_joining}
                          onChange={(e) => setEditForm({...editForm, date_of_joining: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Date of Leaving</label>
                        <input 
                          type="date"
                          value={editForm.date_of_leaving}
                          onChange={(e) => setEditForm({...editForm, date_of_leaving: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Achievements</label>
                      <textarea 
                        value={editForm.achievements}
                        onChange={(e) => setEditForm({...editForm, achievements: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold resize-none h-16"
                        placeholder="Gold medal in 2024 Nationals..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Financials & Remarks Accordion */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all">
                <div 
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedSection(expandedSection === 'financials' ? null as any : 'financials')}
                >
                  <h4 className="font-bold text-sm tracking-widest uppercase">Financials & Report</h4>
                  {expandedSection === 'financials' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                {expandedSection === 'financials' && (
                  <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Actual Fee (₹)</label>
                        <input 
                          type="number"
                          value={editForm.actual_fee}
                          onChange={(e) => setEditForm({...editForm, actual_fee: parseInt(e.target.value) || 0})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Fee Detail (Reason)</label>
                        <input 
                          value={editForm.fee_detail}
                          onChange={(e) => setEditForm({...editForm, fee_detail: e.target.value})}
                          placeholder="e.g. Monthly Fee"
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Due Date</label>
                        <input 
                          type="date"
                          value={editForm.due_date}
                          onChange={(e) => setEditForm({...editForm, due_date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Fee Status</label>
                        <CustomSelect 
                          value={editForm.fee_status}
                          onChange={(val) => setEditForm({...editForm, fee_status: val})}
                          options={[{label: 'Paid', value: 'Paid'}, {label: 'Pending', value: 'Pending'}]}
                        />
                      </div>
                    </div>
                    
                    {editForm.fee_status === 'Pending' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Pending Amount (₹)</label>
                        <input 
                          type="number"
                          value={editForm.pending_amount}
                          onChange={(e) => setEditForm({...editForm, pending_amount: parseInt(e.target.value) || 0})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Instructor Report</label>
                        <div className="flex gap-2">
                          <button 
                            type="button" 
                            onClick={() => setEditForm({...editForm, instructor_remarks_color: 'red'})}
                            className={`w-4 h-4 rounded-full border-2 ${editForm.instructor_remarks_color === 'red' ? 'bg-red-500 border-white' : 'bg-red-500/50 border-transparent'}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => setEditForm({...editForm, instructor_remarks_color: 'yellow'})}
                            className={`w-4 h-4 rounded-full border-2 ${editForm.instructor_remarks_color === 'yellow' ? 'bg-yellow-500 border-white' : 'bg-yellow-500/50 border-transparent'}`}
                          />
                          <button 
                            type="button" 
                            onClick={() => setEditForm({...editForm, instructor_remarks_color: 'green'})}
                            className={`w-4 h-4 rounded-full border-2 ${editForm.instructor_remarks_color === 'green' ? 'bg-green-500 border-white' : 'bg-green-500/50 border-transparent'}`}
                          />
                        </div>
                      </div>
                      <textarea 
                        value={editForm.instructor_remarks}
                        onChange={(e) => setEditForm({...editForm, instructor_remarks: e.target.value})}
                        className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none transition-all font-bold resize-none h-24 ${editForm.instructor_remarks_color === 'red' ? 'focus:border-red-500/50 text-red-100' : editForm.instructor_remarks_color === 'yellow' ? 'focus:border-yellow-500/50 text-yellow-100' : 'focus:border-green-500/50 text-green-100'}`}
                        placeholder="Grade assessment and remarks..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 pb-2">
                <button
                  type="button"
                  onClick={handleResetPatternClick}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black tracking-widest text-[10px] rounded-xl transition-all uppercase border border-red-500/20 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3 h-3" /> Reset Pattern to Default 'X'
                </button>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5 mt-2">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingMember}
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {savingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative my-auto">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Create New Event</h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Event Title <span className="text-red-500">*</span></label>
                <input 
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  placeholder="e.g. Summer Grading 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Description</label>
                <textarea 
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold resize-none h-20"
                  placeholder="Details about the event..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Time <span className="text-red-500">*</span></label>
                  <input 
                    type="time"
                    required
                    value={eventForm.time}
                    onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Target Belt</label>
                  <CustomSelect 
                    value={eventForm.target_belt}
                    onChange={(val) => setEventForm({...eventForm, target_belt: val})}
                    options={[{label: 'All Belts', value: 'All'}, ...belts.map(b => ({label: b.name, value: b.name}))]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Entry Fee (₹)</label>
                  <input 
                    type="number"
                    value={eventForm.fee}
                    onChange={(e) => setEventForm({...eventForm, fee: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {showEditEventModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative my-auto">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-6">Edit Event</h3>
            
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Event Title <span className="text-red-500">*</span></label>
                <input 
                  required
                  value={editEventForm.title}
                  onChange={(e) => setEditEventForm({...editEventForm, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  placeholder="e.g. Summer Grading 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Description</label>
                <textarea 
                  value={editEventForm.description}
                  onChange={(e) => setEditEventForm({...editEventForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold resize-none h-20"
                  placeholder="Details about the event..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date"
                    required
                    value={editEventForm.date}
                    onChange={(e) => setEditEventForm({...editEventForm, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Time <span className="text-red-500">*</span></label>
                  <input 
                    type="time"
                    required
                    value={editEventForm.time}
                    onChange={(e) => setEditEventForm({...editEventForm, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Target Belt</label>
                  <CustomSelect 
                    value={editEventForm.target_belt}
                    onChange={(val) => setEditEventForm({...editEventForm, target_belt: val})}
                    options={[{label: 'All Belts', value: 'All'}, ...belts.map(b => ({label: b.name, value: b.name}))]}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Entry Fee (₹)</label>
                  <input 
                    type="number"
                    value={editEventForm.fee}
                    onChange={(e) => setEditEventForm({...editEventForm, fee: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5 mt-4">
                <button 
                  type="button"
                  onClick={() => setShowEditEventModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APP ALERT MODAL */}
      {appAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in">
          <div className="glass-card w-full max-w-sm p-6 border-primary/20 bg-background/95 shadow-2xl relative">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className={`w-12 h-12 mb-4 ${appAlert.isConfirm ? 'text-primary' : 'text-red-500'}`} />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{appAlert.isConfirm ? 'Confirm Action' : 'Notification'}</h3>
              <p className="text-sm font-medium text-muted-foreground mb-6">{appAlert.message}</p>
              
              <div className="flex gap-3 w-full">
                {appAlert.isConfirm ? (
                  <>
                    <button onClick={() => setAppAlert(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase">Cancel</button>
                    <button onClick={() => { setAppAlert(null); appAlert.onConfirm && appAlert.onConfirm(); }} className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20">Confirm</button>
                  </>
                ) : (
                  <button onClick={() => setAppAlert(null)} className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20">Dismiss</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
