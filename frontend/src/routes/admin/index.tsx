import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '#/lib/supabase'
import { 
  ShieldAlert, Settings, Users, Calendar, Plus, Edit, Lock,
  ShieldCheck, Loader2, Search, QrCode, LogOut, Trash2,
  MapPin, Link as LinkIcon
} from 'lucide-react'

type BranchConfig = {
  name: string;
  address: string;
  mapsUrl: string;
}

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const navigate = useNavigate()
  const [admin, setAdmin] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'members' | 'scanner' | 'events' | 'settings'>('members')
  const [loading, setLoading] = useState(true)
  
  // Members State
  const [members, setMembers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
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
    pending_amount: 0
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
    pending_amount: 0
  })

  // Settings State
  const [branches, setBranches] = useState<BranchConfig[]>([
    { name: "XMF Main HQ", address: "123 Main St", mapsUrl: "" },
    { name: "Northside Dojo", address: "456 North Ave", mapsUrl: "" },
    { name: "Downtown Club", address: "789 Down Blvd", mapsUrl: "" }
  ])
  const [belts, setBelts] = useState<string[]>(["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black"])
  const [newBranch, setNewBranch] = useState<BranchConfig>({ name: '', address: '', mapsUrl: '' })
  const [newBelt, setNewBelt] = useState('')

  useEffect(() => {
    const data = localStorage.getItem('xmf_member')
    if (!data) {
      navigate({ to: '/login' })
      return
    }
    const parsed = JSON.parse(data)
    
    if (parsed.role !== 'admin') {
      navigate({ to: '/dashboard' })
      return
    }
    
    setAdmin(parsed)
    loadMembers()
    loadSettings()
  }, [navigate])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global').single()
      if (data) {
        if (data.branches) setBranches(data.branches)
        if (data.belts) setBelts(data.belts)
      }
    } catch (e) {
      console.warn("Settings table might not exist yet", e)
    }
  }

  const saveSettings = async (newBranches: BranchConfig[], newBelts: string[]) => {
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
    if (!newBelt.trim()) return
    const updated = [...belts, newBelt.trim()]
    setBelts(updated)
    setNewBelt('')
    saveSettings(branches, updated)
  }
  const handleRemoveBelt = (b: string) => {
    const updated = belts.filter(x => x !== b)
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

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMember(true)

    try {
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
          pending_amount: memberForm.pending_amount || 0
        }])

      if (error) {
        console.error(error)
        alert('Failed to create member: ' + error.message)
      } else {
        setShowCreateModal(false)
        setMemberForm({ 
          name: '', phone: '', email: '', role: 'student', belt: 'White', 
          address: '', branch: 'XMF Main HQ', date_of_joining: new Date().toISOString().split('T')[0], 
          date_of_leaving: '', achievements: '', pending_amount: 0 
        })
        loadMembers()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingMember(false)
    }
  }

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.member_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      pending_amount: member.pending_amount || 0
    })
    setShowEditModal(true)
  }

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingMember(true)
    try {
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
          pending_amount: editForm.pending_amount || 0
        })
        .eq('id', editingMemberId)

      if (error) {
        alert('Failed to update member: ' + error.message)
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

  const handleResetPattern = async () => {
    if (!editingMemberId) return
    const confirmed = confirm("Are you sure you want to reset this user's pattern to the default 'X'?")
    if (!confirmed) return
    
    setSavingMember(true)
    try {
      const { error } = await supabase
        .from('members')
        .update({ pattern_hash: '048526' })
        .eq('id', editingMemberId)

      if (error) {
        alert('Failed to reset pattern: ' + error.message)
      } else {
        alert('Pattern successfully reset to default "X".')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingMember(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('xmf_member')
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
                    placeholder="Search by Name or XC-ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
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
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredMembers.map(m => (
                          <tr key={m.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-mono font-bold text-primary">{m.member_id}</td>
                            <td className="px-6 py-4 font-bold">{m.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold">{m.belt}</span>
                                {m.role === 'admin' && <span className="text-[10px] text-red-400 uppercase tracking-widest">Admin</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${m.member_status === 'Active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {m.member_status}
                              </span>
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
               <QrCode className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">In-App Scanner</h2>
               <p className="text-muted-foreground max-w-md mx-auto">Use this module to scan physical student NFC/QR cards to instantly log attendance and pull up Full Profiles.</p>
               <button 
                 onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                 className="mt-8 px-6 py-3 bg-white/10 text-white font-black tracking-widest text-xs rounded-xl uppercase hover:bg-white/20 transition-colors border border-white/20"
               >
                 Activate Scanner
               </button>
            </div>
          )}

          {/* EVENTS TAB */}
          {activeTab === 'events' && (
            <div className="glass-card p-12 text-center border-white/5 animate-in fade-in slide-in-from-bottom-4">
               <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
               <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Event Management</h2>
               <p className="text-muted-foreground max-w-md mx-auto">Create and manage upcoming workshops, gradings, and track student registrations.</p>
               <button 
                 onClick={() => window.dispatchEvent(new CustomEvent('showContactModal'))}
                 className="mt-8 px-6 py-3 bg-white/10 text-white font-black tracking-widest text-xs rounded-xl uppercase hover:bg-white/20 transition-colors border border-white/20"
               >
                 Launch Event Builder
               </button>
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
                       <div key={b} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
                         <span className="font-bold text-sm">{b}</span>
                         <button 
                           onClick={() => handleRemoveBelt(b)}
                           className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-all"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                   <div className="flex gap-2">
                     <input 
                       value={newBelt}
                       onChange={e => setNewBelt(e.target.value)}
                       placeholder="New Belt Level..."
                       className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Phone</label>
                  <input 
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({...memberForm, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Optional"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">System Role</label>
                  <select 
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({...memberForm, role: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Starting Belt</label>
                  <select 
                    value={memberForm.belt}
                    onChange={(e) => setMemberForm({...memberForm, belt: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    {belts.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <select 
                    value={memberForm.branch}
                    onChange={(e) => setMemberForm({...memberForm, branch: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
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
            
            <form onSubmit={handleUpdateMember} className="space-y-5">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Phone</label>
                  <input 
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Optional"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">System Role</label>
                  <select 
                    value={editForm.role}
                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Belt</label>
                  <select 
                    value={editForm.belt}
                    onChange={(e) => setEditForm({...editForm, belt: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    {belts.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Member Status</label>
                  <select 
                    value={editForm.member_status}
                    onChange={(e) => setEditForm({...editForm, member_status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Fee Status</label>
                  <select 
                    value={editForm.fee_status}
                    onChange={(e) => setEditForm({...editForm, fee_status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Fee Status</label>
                  <select 
                    value={editForm.fee_status}
                    onChange={(e) => setEditForm({...editForm, fee_status: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Pending Amount (₹)</label>
                  <input 
                    type="number"
                    value={editForm.pending_amount}
                    onChange={(e) => setEditForm({...editForm, pending_amount: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Address</label>
                  <input 
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                    placeholder="Physical Address"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Branch</label>
                  <select 
                    value={editForm.branch}
                    onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    {branches.map(b => (
                      <option key={b.name} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Instructor Remarks</label>
                <textarea 
                  value={editForm.instructor_remarks}
                  onChange={(e) => setEditForm({...editForm, instructor_remarks: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold resize-none h-16"
                  placeholder="Private notes..."
                />
              </div>

              <div className="pt-4 pb-2">
                <button
                  type="button"
                  onClick={handleResetPattern}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black tracking-widest text-[10px] rounded-xl transition-all uppercase border border-red-500/20 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3 h-3" /> Reset Pattern to Default 'X'
                </button>
              </div>

              <div className="flex gap-4 pt-4 border-t border-white/5">
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
    </div>
  )
}
