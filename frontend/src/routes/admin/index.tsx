import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { fetchApi } from '../../lib/api'
import { authClient } from '../../lib/auth-client'
import { 
  ShieldAlert, 
  Settings, 
  Users, 
  LayoutGrid, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit,
  Loader2,
  Zap,
  ArrowRight
} from 'lucide-react'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
})

interface Module {
  id: string
  name: string
  category: string
  description: string
  price: number
  duration_weeks: number
  is_active: boolean
}

interface User {
  id: string
  full_name: string | null
  email: string
  role: string
  is_active: boolean
}

interface InventorySlot {
  id: string
  module_id: string
  trainer_id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  current_enrollment: number
  is_active: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function AdminDashboard() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = authClient.useSession()
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'modules' | 'inventory' | 'users'>('modules')
  
  // Data states
  const [modules, setModules] = useState<Module[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [inventory, setInventory] = useState<InventorySlot[]>([])
  
  // Module Form states
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [moduleForm, setModuleForm] = useState({
    name: '',
    category: 'martial-arts',
    description: '',
    price: 0,
    duration_weeks: 4,
    is_active: true
  })
  const [savingModule, setSavingModule] = useState(false)

  // Slot Form states
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [editingSlot, setEditingSlot] = useState<InventorySlot | null>(null)
  const [slotForm, setSlotForm] = useState({
    module_id: '',
    trainer_id: '',
    day_of_week: 0,
    start_time: '18:00',
    end_time: '19:00',
    max_capacity: 15,
    is_active: true
  })
  const [savingSlot, setSavingSlot] = useState(false)

  useEffect(() => {
    if (!sessionPending && !session) {
      navigate({ to: '/auth', search: { redirect: '/admin' } })
      return
    }

    if (session) {
      checkAdminStatus()
    }
  }, [session, sessionPending, navigate])

  const checkAdminStatus = async () => {
    try {
      // Fetch profile from backend to get the exact role
      const userProfile = await fetchApi('/users/me')
      if (userProfile.role === 'admin') {
        setIsAdmin(true)
        loadData()
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("Failed to verify admin status", error)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const loadData = async () => {
    try {
      const [mods, usersData, inv] = await Promise.all([
        fetchApi('/modules'),
        fetchApi('/users'),
        fetchApi('/inventory')
      ])
      setModules(mods)
      setUsers(usersData)
      setInventory(inv)
    } catch (error) {
      console.error("Failed to load data", error)
    }
  }

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingModule(true)
    try {
      if (editingModule) {
        await fetchApi(`/modules/${editingModule.id}`, {
          method: 'PUT',
          body: JSON.stringify(moduleForm)
        })
      } else {
        await fetchApi('/modules', {
          method: 'POST',
          body: JSON.stringify(moduleForm)
        })
      }
      await loadData()
      setShowModuleModal(false)
      setEditingModule(null)
    } catch (error) {
      console.error("Failed to save module", error)
      window.dispatchEvent(new CustomEvent('showContactModal'))
    } finally {
      setSavingModule(false)
    }
  }

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotForm.module_id || !slotForm.trainer_id) {
      window.dispatchEvent(new CustomEvent('showContactModal'))
      return
    }
    setSavingSlot(true)
    try {
      // format time properly if needed, but 'HH:MM' is fine for pydantic time
      const bodyStr = JSON.stringify({
        ...slotForm,
        start_time: slotForm.start_time.length === 5 ? slotForm.start_time + ':00' : slotForm.start_time,
        end_time: slotForm.end_time.length === 5 ? slotForm.end_time + ':00' : slotForm.end_time
      })
      if (editingSlot) {
        await fetchApi(`/inventory/${editingSlot.id}`, {
          method: 'PUT',
          body: bodyStr
        })
      } else {
        await fetchApi('/inventory', {
          method: 'POST',
          body: bodyStr
        })
      }
      await loadData()
      setShowSlotModal(false)
      setEditingSlot(null)
    } catch (error) {
      console.error("Failed to save slot", error)
      window.dispatchEvent(new CustomEvent('showContactModal'))
    } finally {
      setSavingSlot(false)
    }
  }

  const openNewModuleForm = () => {
    setEditingModule(null)
    setModuleForm({
      name: '',
      category: 'martial-arts',
      description: '',
      price: 0,
      duration_weeks: 4,
      is_active: true
    })
    setShowModuleModal(true)
  }

  const openEditModuleForm = (module: Module) => {
    setEditingModule(module)
    setModuleForm({
      name: module.name,
      category: module.category,
      description: module.description || '',
      price: module.price,
      duration_weeks: module.duration_weeks,
      is_active: module.is_active
    })
    setShowModuleModal(true)
  }

  const openNewSlotForm = () => {
    setEditingSlot(null)
    setSlotForm({
      module_id: modules.length > 0 ? modules[0].id : '',
      trainer_id: users.find(u => u.role === 'trainer' || u.role === 'admin')?.id || '',
      day_of_week: 0,
      start_time: '18:00',
      end_time: '19:00',
      max_capacity: 15,
      is_active: true
    })
    setShowSlotModal(true)
  }

  const openEditSlotForm = (slot: InventorySlot) => {
    setEditingSlot(slot)
    setSlotForm({
      module_id: slot.module_id,
      trainer_id: slot.trainer_id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time.slice(0, 5), // "HH:MM:SS" -> "HH:MM"
      end_time: slot.end_time.slice(0, 5),
      max_capacity: slot.max_capacity,
      is_active: slot.is_active
    })
    setShowSlotModal(true)
  }

  if (sessionPending || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-6" />
        <h1 className="text-3xl font-black uppercase italic mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">This portal is restricted to club administrators.</p>
        <button 
          onClick={() => navigate({ to: '/' })}
          className="px-8 py-4 bg-primary/10 text-primary border border-primary/20 font-black tracking-widest text-xs rounded-xl uppercase hover:bg-primary/20 transition-colors"
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 px-6 flex flex-col items-center">
      {/* Admin Header */}
      <div className="w-full max-w-6xl mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <Settings className="w-6 h-6" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center.</span></h1>
        </div>
        <p className="text-muted-foreground font-medium">Manage the A la Carte builder, schedules, and club operations.</p>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('modules')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'modules' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Curriculum
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'inventory' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <Calendar className="w-4 h-4" /> Schedule (Inventory)
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold tracking-widest text-xs uppercase ${activeTab === 'users' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <Users className="w-4 h-4" /> Members
          </button>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          
          {activeTab === 'modules' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase italic">Curriculum Modules</h2>
                <button 
                  onClick={openNewModuleForm}
                  className="px-6 py-3 bg-white text-black hover:bg-primary hover:text-white transition-colors font-black tracking-widest text-[10px] rounded-xl uppercase flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Module
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map(mod => (
                  <div key={mod.id} className={`glass-card p-6 border-white/10 flex flex-col justify-between ${!mod.is_active ? 'opacity-50' : ''}`}>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">{mod.category}</span>
                        {!mod.is_active && <span className="text-[8px] font-black uppercase tracking-widest bg-destructive/20 text-destructive px-2 py-0.5 rounded">Draft</span>}
                      </div>
                      <h3 className="text-xl font-black uppercase italic mb-2">{mod.name}</h3>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-2">{mod.description}</p>
                    </div>
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-lg font-black uppercase italic">₹{mod.price}</span>
                      <button 
                        onClick={() => openEditModuleForm(mod)}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {modules.length === 0 && (
                  <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-3xl">
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No modules defined.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase italic">Schedule Management</h2>
                <button 
                  onClick={openNewSlotForm}
                  className="px-6 py-3 bg-white text-black hover:bg-primary hover:text-white transition-colors font-black tracking-widest text-[10px] rounded-xl uppercase flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Time Slot
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map(slot => {
                  const mod = modules.find(m => m.id === slot.module_id)
                  const trainer = users.find(u => u.id === slot.trainer_id)
                  
                  return (
                    <div key={slot.id} className={`glass-card p-6 border-white/10 flex flex-col justify-between ${!slot.is_active ? 'opacity-50' : ''}`}>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{DAYS[slot.day_of_week]}</span>
                          {!slot.is_active && <span className="text-[8px] font-black uppercase tracking-widest bg-destructive/20 text-destructive px-2 py-0.5 rounded">Paused</span>}
                        </div>
                        <h3 className="text-xl font-black uppercase italic mb-1">{mod?.name || 'Unknown Module'}</h3>
                        <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase mb-4">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </p>
                        
                        <div className="space-y-2 mt-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Trainer:</span>
                            <span className="font-bold">{trainer?.full_name || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Capacity:</span>
                            <span className="font-bold">{slot.current_enrollment} / {slot.max_capacity}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex items-center justify-end pt-4 border-t border-white/10">
                        <button 
                          onClick={() => openEditSlotForm(slot)}
                          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                {inventory.length === 0 && (
                  <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-3xl">
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">No slots defined.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="glass-card p-12 text-center border-white/5">
               <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
               <h2 className="text-2xl font-black uppercase italic mb-2">Member Directory</h2>
               <p className="text-muted-foreground">Manage active students, roles, and RFID card linkages.</p>
               <div className="mt-8 inline-block px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-black tracking-widest uppercase text-white/50">
                 Coming Soon
               </div>
            </div>
          )}

        </div>
      </div>

      {/* Module Form Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative">
            <h3 className="text-2xl font-black uppercase italic mb-6">{editingModule ? 'Edit Module' : 'New Module'}</h3>
            
            <form onSubmit={handleModuleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Module Name</label>
                <input 
                  required
                  value={moduleForm.name}
                  onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  placeholder="e.g. Advanced Sparring"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Category</label>
                <select 
                  value={moduleForm.category}
                  onChange={(e) => setModuleForm({...moduleForm, category: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                >
                  <option value="martial-arts">Martial Arts</option>
                  <option value="calisthenics">Calisthenics</option>
                  <option value="boxing">Boxing</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Price (₹)</label>
                <input 
                  type="number"
                  required
                  value={moduleForm.price}
                  onChange={(e) => setModuleForm({...moduleForm, price: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Description</label>
                <textarea 
                  rows={3}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={moduleForm.is_active}
                    onChange={(e) => setModuleForm({...moduleForm, is_active: e.target.checked})}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-primary focus:ring-primary/50 focus:ring-offset-background"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Active (Visible in Builder)</span>
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingModule}
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20 flex items-center justify-center"
                >
                  {savingModule ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slot Form Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-lg p-8 border-primary/20 bg-background/90 shadow-2xl relative my-auto">
            <h3 className="text-2xl font-black uppercase italic mb-6">{editingSlot ? 'Edit Slot' : 'New Slot'}</h3>
            
            <form onSubmit={handleSlotSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Module</label>
                <select 
                  required
                  value={slotForm.module_id}
                  onChange={(e) => setSlotForm({...slotForm, module_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                >
                  <option value="" disabled>Select Module</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Trainer</label>
                <select 
                  required
                  value={slotForm.trainer_id}
                  onChange={(e) => setSlotForm({...slotForm, trainer_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                >
                  <option value="" disabled>Select Trainer</option>
                  {users.filter(u => u.role === 'admin' || u.role === 'trainer').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Day</label>
                  <select 
                    value={slotForm.day_of_week}
                    onChange={(e) => setSlotForm({...slotForm, day_of_week: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none"
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Max Capacity</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={slotForm.max_capacity}
                    onChange={(e) => setSlotForm({...slotForm, max_capacity: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({...slotForm, start_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">End Time</label>
                  <input 
                    type="time"
                    required
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({...slotForm, end_time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={slotForm.is_active}
                    onChange={(e) => setSlotForm({...slotForm, is_active: e.target.checked})}
                    className="w-4 h-4 rounded bg-white/10 border-white/20 text-primary focus:ring-primary/50 focus:ring-offset-background"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest">Active (Booking Enabled)</span>
                </label>
              </div>

              <div className="flex gap-4 pt-6 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingSlot}
                  className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-black tracking-widest text-[10px] rounded-xl transition-all uppercase shadow-lg shadow-primary/20 flex items-center justify-center"
                >
                  {savingSlot ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
