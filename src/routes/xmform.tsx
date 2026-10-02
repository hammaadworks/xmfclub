import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  UserPlus, Users, Search, Camera, 
  CheckCircle2, AlertCircle, Edit2, Trash2, Undo2, 
  ChevronLeft, ChevronRight, X, Loader2, ArrowRight, 
  Phone, Calendar, User, Eye, RefreshCw, Sparkles, ShieldCheck
} from 'lucide-react'
import { supabase } from '#/lib/supabase'
import { compressImage } from '#/lib/image'
import { CustomSelect } from '#/components/CustomSelect'
import { CredentialAssignmentModal } from '#/components/credentials/CredentialAssignmentModal';

import { calculateTenure } from '#/lib/utils'
import { normalizeCrockford } from '#/lib/crockford'
import { computeNextMemberId } from '#/lib/idGenerator'

export const Route = createFileRoute('/xmform')({
  component: XMFormPage,
})

interface StudentMember {
  member_id: string;

  name: string;
  dob?: string | null;
  age?: number | null;
  phone?: string | null;
  email?: string | null;
  belt?: string | null;
  branch?: string | null;
  address?: string | null;
  pin_code?: string | null;
  photo_url?: string | null;
  role?: string;
  member_status?: string;
  password?: string;
  date_of_joining?: string | null;
  is_reviewed?: boolean;
  is_deleted?: boolean;
  created_at?: string;
}

const DEFAULT_BELTS = [
  'White', 'Yellow', 'Orange', 'Green', 
  'Blue', 'Purple', 'Brown', 'Red', 'Black'
];

const DEFAULT_BRANCHES = [
  'XMF Main HQ',
  'XMF North Dojo',
  'XMF South Arena',
  'XMF East Studio'
];

function XMFormPage() {
  const [activeTab, setActiveTab] = useState<'intake' | 'directory'>('intake');
  
  // Belts and Branches from app_settings
  const [belts, setBelts] = useState<string[]>(DEFAULT_BELTS);
  const [branches, setBranches] = useState<string[]>(DEFAULT_BRANCHES);

  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [dateOfJoining, setDateOfJoining] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [belt, setBelt] = useState('White');
  const [branch, setBranch] = useState('XMF Main HQ');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Auth state for Admin-only capabilities
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('xmf_member');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const canManageCredentials = currentUser?.role === 'admin' || currentUser?.role === 'volunteer';

  // Custom / VIP ID state (Admin-only feature)
  const [isCustomId, setIsCustomId] = useState(false);
  const [customSuffix, setCustomSuffix] = useState('');
  const [customIdStatus, setCustomIdStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Status & Validation
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdStudent, setCreatedStudent] = useState<StudentMember | null>(null);

  // Directory State
  const [students, setStudents] = useState<StudentMember[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [directoryCredentials, setDirectoryCredentials] = useState<{ [memberId: string]: { id: string, type: string, token: string }[] }>({});
  const [isCredentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialModalTarget, setCredentialModalTarget] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBelt, setFilterBelt] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterReview, setFilterReview] = useState<'All' | 'Pending' | 'Reviewed'>('All');
  const [filterStatus, setFilterStatus] = useState<'Active' | 'Deleted' | 'All'>('Active');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentMember | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    dob: '',
    age: '' as number | '',
    date_of_joining: '',
    belt: 'White',
    branch: 'XMF Main HQ',
    phone: '',
    address: '',
    pin_code: '',
    photo_url: '',
    is_reviewed: false,
  });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Soft-Delete Undo Toast
  const [undoToast, setUndoToast] = useState<{
    show: boolean;
    studentId: string;
    studentName: string;
  }>({ show: false, studentId: '', studentName: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Load Settings (belts, branches) and initial student count on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle();
        if (data) {
          if (data.branches && Array.isArray(data.branches)) {
            setBranches(data.branches.map((b: { name: string } | string) => typeof b === 'string' ? b : b.name));
          }
          if (data.belts && Array.isArray(data.belts)) {
            setBelts(data.belts.map((b: { name: string } | string) => typeof b === 'string' ? b : b.name));
          }
        }
      } catch (err) {
        console.warn('Could not load app settings, using defaults', err);
      }
    }
    loadSettings();
    fetchStudents();
  }, []);

  // Fetch Directory Students
  const fetchStudents = async () => {
    setLoadingDirectory(true);
    try {

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);

      // Fetch active credentials for all students
      const { data: credsData } = await supabase
        .from('credential_assignments')
        .select('member_id, credential_id, credentials(token, type)')
        .is('unassigned_at', null);

      if (credsData) {
        const credMap: Record<string, { id: string, type: string, token: string }[]> = {};
        credsData.forEach((row: any) => {
          if (!credMap[row.member_id]) credMap[row.member_id] = [];
          credMap[row.member_id].push({
            id: row.credential_id,
            type: row.credentials.type,
            token: row.credentials.token
          });
        });
        setDirectoryCredentials(credMap);
      }

    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'directory') {
      fetchStudents();
    }
  }, [activeTab]);

  // Compute Age from DOB
  const handleDobChange = (dobVal: string) => {
    setDob(dobVal);
    if (!dobVal) return;
    const birthDate = new Date(dobVal);
    const today = new Date();
    if (isNaN(birthDate.getTime())) return;

    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge >= 0) {
      setAge(calculatedAge);
    }
  };

  // Helper to Title Case names
  const formatName = (str: string): string => {
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Live Phone Duplicate Check
  const handlePhoneBlur = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      try {
        const { data } = await supabase
          .from('members')
          .select('member_id, name')
          .eq('phone', cleanPhone)
          .eq('is_deleted', false)
          .limit(1);

        if (data && data.length > 0) {
          setPhoneWarning(`Student "${data[0].name}" (${data[0].member_id}) is already registered with this phone number.`);
        } else {
          setPhoneWarning(null);
        }
      } catch {
        setPhoneWarning(null);
      }
    } else {
      setPhoneWarning(null);
    }
  };

  // Image Selection Handler
  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Live Availability Checker for Custom / VIP ID
  const checkCustomIdAvailability = async (suffixVal: string, dateVal: string) => {
    if (!suffixVal || suffixVal.trim().length !== 2) {
      setCustomIdStatus({ checking: false });
      return;
    }
    const { valid, normalized, error } = normalizeCrockford(suffixVal);
    if (!valid) {
      setCustomIdStatus({ checking: false, available: false, message: error });
      return;
    }

    setCustomIdStatus({ checking: true });
    try {
      const d = new Date(dateVal || Date.now());
      const yearSuffix = !isNaN(d.getTime()) ? String(d.getFullYear()).slice(-2) : String(new Date().getFullYear()).slice(-2);
      const candidateId = `XMF${yearSuffix}${normalized}`;

      const { data, error: qErr } = await supabase
        .from('members')
        .select('member_id, name')
        .eq('member_id', candidateId)
        .limit(1);

      if (qErr) throw qErr;

      if (data && data.length > 0) {
        setCustomIdStatus({ 
          checking: false, 
          available: false, 
          message: `Taken (${data[0].name})` 
        });
      } else {
        setCustomIdStatus({ 
          checking: false, 
          available: true, 
          message: 'Available' 
        });
      }
    } catch {
      setCustomIdStatus({ checking: false });
    }
  };

  const handleCustomSuffixChange = (val: string) => {
    const clean = val.toUpperCase().replace(/[^0-9A-Z]/g, '');
    setCustomSuffix(clean);
    if (clean.length === 2) {
      checkCustomIdAvailability(clean, dateOfJoining);
    } else {
      setCustomIdStatus({ checking: false });
    }
  };

  // Generate Deterministic Crockford Base32 ID: XMF + YY + ZZ
  // Sequential starts from 01 (1). Custom/VIP can be 00 or any unallocated 2-char Crockford code.
  // Soft-deleted members are included so deleted IDs stay permanently reserved.
  const generateStudentId = async (
    joiningDateStr?: string, 
    customSuffixVal?: string
  ): Promise<string> => {
    let yearSuffix = String(new Date().getFullYear()).slice(-2);
    if (joiningDateStr) {
      const d = new Date(joiningDateStr);
      if (!isNaN(d.getTime())) {
        yearSuffix = String(d.getFullYear()).slice(-2);
      }
    }
    const prefix = `XMF${yearSuffix}`;

    try {
      const { data, error } = await supabase
        .from('members')
        .select('member_id')
        .like('member_id', `${prefix}%`);

      if (error) {
        console.warn('Error querying existing IDs, falling back to 01:', error);
      }

      const existingIds = (data || []).map(row => row.member_id).filter(Boolean);

      return computeNextMemberId({
        joiningDate: joiningDateStr,
        customSuffix: customSuffixVal,
        existingIds,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      return `${prefix}01`;
    }
  };

  // Upload compressed photo to Supabase Storage bucket
  const uploadPhoto = async (file: File, studentId: string): Promise<string | null> => {
    try {
      const compressedBlob = await compressImage(file, 800, 0.82);
      const ext = compressedBlob.type === 'image/webp' ? 'webp' : 'jpg';
      const fileName = `${studentId}_${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('member-photos')
        .upload(fileName, compressedBlob, {
          contentType: compressedBlob.type || 'image/webp',
          upsert: true,
        });

      if (error) {
        console.warn('Supabase storage upload error:', error.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('member-photos')
        .getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.warn('Image compression/upload failed, skipping photo upload:', err);
    }
    return null;
  };

  // Submit New Student Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedName = formatName(name);
    if (!formattedName) {
      setErrorMsg('Student name is required.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }

    setSubmitting(true);

    try {
      const requestedSuffix = (isAdmin && isCustomId && customSuffix.trim()) 
        ? customSuffix.trim() 
        : undefined;

      const newStudentId = await generateStudentId(dateOfJoining, requestedSuffix);
      let photoUrl: string | null = null;

      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile, newStudentId);
      }

      const newStudentPayload = {
        member_id: newStudentId,
        name: formattedName,
        dob: dob || null,
        age: age !== '' ? Number(age) : null,
        belt: belt || 'White',
        branch: branch || 'XMF Main HQ',
        phone: cleanPhone,
        address: address.trim() || null,
        pin_code: pinCode.trim() || null,
        photo_url: photoUrl,
        role: 'student',
        member_status: 'Active',
        password: '12345', // Standard default password
        date_of_joining: dateOfJoining || new Date().toISOString().split('T')[0],
        is_reviewed: false,
        is_deleted: false,
      };

      const { data, error } = await supabase
        .from('members')
        .insert([newStudentPayload])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const newlyCreated: StudentMember = data || { ...newStudentPayload, id: newStudentId };
      setCreatedStudent(newlyCreated);
      setStudents(prev => [newlyCreated, ...prev]);

      // Reset form fields
      setName('');
      setDob('');
      setAge('');
      setDateOfJoining(new Date().toISOString().split('T')[0]);
      setIsCustomId(false);
      setCustomSuffix('');
      setCustomIdStatus({ checking: false });
      setBelt(belts[0] || 'White');
      setBranch(branches[0] || 'XMF Main HQ');
      setPhone('');
      setAddress('');
      setPinCode('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhoneWarning(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register student.';
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Soft Delete Handler
  const handleSoftDelete = async (student: StudentMember) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_deleted: true })
        .eq('member_id', student.member_id);

      if (error) throw error;

      // Optimistic update
      setStudents(prev =>
        prev.map(s => s.member_id === student.member_id ? { ...s, is_deleted: true } : s)
      );

      // Trigger undo toast
      setUndoToast({
        show: true,
        studentId: student.member_id,
        studentName: student.name,
      });

      // Auto-hide toast after 7s
      setTimeout(() => {
        setUndoToast(prev => prev.studentId === student.member_id ? { ...prev, show: false } : prev);
      }, 7000);
    } catch (err) {
      console.error('Error soft-deleting student:', err);
    }
  };

  // Undo Soft Delete
  const handleUndoDelete = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_deleted: false })
        .eq('member_id', studentId);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s => s.member_id === studentId ? { ...s, is_deleted: false } : s)
      );
      setUndoToast({ show: false, studentId: '', studentName: '' });
    } catch (err) {
      console.error('Error restoring student:', err);
    }
  };

  // Open Edit Modal
  const openEditModal = (student: StudentMember) => {
    setEditingStudent(student);
    setEditFormError(null);
    setEditForm({
      name: student.name || '',
      dob: student.dob || '',
      age: student.age ?? '',
      date_of_joining: student.date_of_joining ? student.date_of_joining.split('T')[0] : '',
      belt: student.belt || 'White',
      branch: student.branch || 'XMF Main HQ',
      phone: student.phone || '',
      address: student.address || '',
      pin_code: student.pin_code || '',
      photo_url: student.photo_url || '',
      is_reviewed: student.is_reviewed ?? false,
    });
    setEditPhotoFile(null);
    setEditPhotoPreview(student.photo_url || null);
  };

  // Toggle Review / Verified Status directly (Admin Only)
  const handleToggleReview = async (student: StudentMember) => {
    if (!isAdmin) {
      return;
    }
    const updatedStatus = !student.is_reviewed;
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_reviewed: updatedStatus })
        .eq('member_id', student.member_id);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s => s.member_id === student.member_id ? { ...s, is_reviewed: updatedStatus } : s)
      );
    } catch (err) {
      console.error('Error toggling review status:', err);
    }
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditFormError(null);

    const formattedName = formatName(editForm.name);
    if (!formattedName) {
      setEditFormError('Student name is required.');
      return;
    }

    const cleanPhone = editForm.phone.trim().replace(/\D/g, '');
    if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setEditFormError('Please enter a valid 10-digit mobile number starting with 6-9.');
      return;
    }

    setSavingEdit(true);

    try {
      let finalPhotoUrl = editForm.photo_url;
      if (editPhotoFile) {
        const uploaded = await uploadPhoto(editPhotoFile, editingStudent.member_id);
        if (uploaded) finalPhotoUrl = uploaded;
      }

      const updates = {
        name: formattedName,
        dob: editForm.dob || null,
        age: editForm.age !== '' ? Number(editForm.age) : null,
        date_of_joining: editForm.date_of_joining || null,
        belt: editForm.belt,
        branch: editForm.branch,
        phone: cleanPhone || null,
        address: editForm.address.trim() || null,
        pin_code: editForm.pin_code.trim() || null,
        photo_url: finalPhotoUrl || null,
        is_reviewed: isAdmin ? editForm.is_reviewed : editingStudent.is_reviewed,
      };

      const { error } = await supabase
        .from('members')
        .update(updates)
        .eq('member_id', editingStudent.member_id);

      if (error) throw error;

      // Optimistic update
      setStudents(prev =>
        prev.map(s => s.member_id === editingStudent.member_id ? { ...s, ...updates } : s)
      );
      setEditingStudent(null);
    } catch (err) {
      console.error('Error saving edits:', err);
      const message = err instanceof Error ? err.message : 'Failed to update student details.';
      setEditFormError(message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filtered & Paginated Students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Status filter
      if (filterStatus === 'Active' && student.is_deleted) return false;
      if (filterStatus === 'Deleted' && !student.is_deleted) return false;

      // Review filter
      if (filterReview === 'Pending' && student.is_reviewed) return false;
      if (filterReview === 'Reviewed' && !student.is_reviewed) return false;

      // Belt filter
      if (filterBelt !== 'All' && student.belt !== filterBelt) return false;

      // Branch filter
      if (filterBranch !== 'All' && student.branch !== filterBranch) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesId = student.member_id.toLowerCase().includes(q);
        const matchesPhone = student.phone ? student.phone.includes(q) : false;
        const matchesBranch = student.branch ? student.branch.toLowerCase().includes(q) : false;
        const matchesAddress = student.address ? student.address.toLowerCase().includes(q) : false;

        return matchesName || matchesId || matchesPhone || matchesBranch || matchesAddress;
      }

      return true;
    });
  }, [students, filterStatus, filterReview, filterBelt, filterBranch, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  return (
    <>
    <div className="min-h-screen bg-background pt-28 pb-20 px-4 sm:px-6 md:px-8 text-foreground selection:bg-primary/20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header & Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-primary-light font-black text-xs tracking-widest uppercase mb-1">
              <UserPlus className="w-4 h-4" aria-hidden="true" /> Volunteer Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Student Intake & Roster
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Deterministic roll numbers, instant photo compression, and real-time student registry.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl max-w-fit" role="tablist" aria-label="Volunteer Hub Views">
            <button
              type="button"
              role="tab"
              id="tab-intake"
              aria-selected={activeTab === 'intake'}
              aria-controls="panel-intake"
              onClick={() => setActiveTab('intake')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors duration-150 ${
                activeTab === 'intake'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              New Entry
            </button>
            <button
              type="button"
              role="tab"
              id="tab-directory"
              aria-selected={activeTab === 'directory'}
              aria-controls="panel-directory"
              onClick={() => setActiveTab('directory')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors duration-150 ${
                activeTab === 'directory'
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              All Students ({students.length})
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INTAKE FORM                                                       */}
        {/* ========================================================================= */}
        {activeTab === 'intake' && (
          <div id="panel-intake" role="tabpanel" aria-labelledby="tab-intake" className="space-y-8">
            
            {/* Success Celebration Card */}
            {createdStudent && (
              <div className="glass-card p-6 sm:p-8 rounded-3xl border-primary/40 bg-primary/5 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-primary/20 text-primary-light rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-light">Student Enrolled Successfully</span>
                <h2 className="text-4xl sm:text-5xl font-mono font-black text-white my-3 tracking-widest">
                  {createdStudent.member_id}
                </h2>
                <p className="text-base font-bold text-white mb-1">{createdStudent.name}</p>
                <p className="text-xs text-muted-foreground">
                  Belt: <span className="text-primary-light font-bold">{createdStudent.belt}</span> • Branch: {createdStudent.branch} • Member Since: <span className="text-white font-mono font-bold">{calculateTenure(createdStudent.date_of_joining)}</span> ({createdStudent.date_of_joining || 'Today'})
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCreatedStudent(null)}
                    className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Another Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedStudent(null);
                      setActiveTab('directory');
                    }}
                    className="px-6 py-3 bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/20 transition-colors duration-150 border border-white/10 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View In Directory
                  </button>
                </div>
              </div>
            )}

            {/* Registration Form Card */}
            <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary-light" />
                  Student Intake Details
                </h2>
                <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">
                  Format: <span className="text-primary-light font-bold">XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}01</span>
                </span>
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-3" role="alert">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Column 1: Personal Details */}
                <div className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label htmlFor="student-name" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                      Full Name <span className="text-primary-light">*</span>
                    </label>
                    <input
                      id="student-name"
                      name="student-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      aria-required="true"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-150 text-white placeholder:text-muted-foreground"
                    />
                  </div>

                  {/* DOB & Age Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="student-dob" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Date of Birth
                      </label>
                      <input
                        id="student-dob"
                        name="student-dob"
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => handleDobChange(e.target.value)}
                        aria-label="Date of Birth"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="student-age" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                        Age (Years)
                      </label>
                      <input
                        id="student-age"
                        name="student-age"
                        type="number"
                        inputMode="numeric"
                        placeholder="e.g. 18"
                        min="3"
                        max="100"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        aria-label="Age in years"
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Date of Joining */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="student-doj" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Date of Joining <span className="text-primary-light">*</span>
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Tenure: <span className="text-primary-light font-mono font-bold">{calculateTenure(dateOfJoining)}</span>
                      </span>
                    </div>
                    <input
                      id="student-doj"
                      name="student-doj"
                      type="date"
                      value={dateOfJoining}
                      onChange={(e) => setDateOfJoining(e.target.value)}
                      required
                      aria-required="true"
                      aria-label="Date of Joining"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Determines ID prefix: <strong className="text-primary-light font-mono">XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}##</strong>
                    </p>
                  </div>

                  {/* Custom / VIP ID Allocation (Admin Only) */}
                  {isAdmin && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="custom-id-toggle" className="flex items-center gap-2 cursor-pointer">
                          <input
                            id="custom-id-toggle"
                            type="checkbox"
                            checked={isCustomId}
                            onChange={(e) => {
                              setIsCustomId(e.target.checked);
                              if (!e.target.checked) {
                                setCustomSuffix('');
                                setCustomIdStatus({ checking: false });
                              }
                            }}
                            className="w-4 h-4 rounded bg-white/10 border-white/20 text-primary focus:ring-primary accent-primary"
                          />
                          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Assign Custom / VIP ID
                          </span>
                        </label>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary-light border border-primary/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      </div>

                      {isCustomId && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-muted-foreground px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                              XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}
                            </span>
                            <input
                              type="text"
                              maxLength={2}
                              placeholder="e.g. ZZ"
                              value={customSuffix}
                              onChange={(e) => handleCustomSuffixChange(e.target.value)}
                              className="w-20 h-10 font-mono text-center text-sm font-bold uppercase bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                            />
                            {customIdStatus.checking && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                              </span>
                            )}
                            {!customIdStatus.checking && customIdStatus.available === true && (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Available
                              </span>
                            )}
                            {!customIdStatus.checking && customIdStatus.available === false && (
                              <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> {customIdStatus.message || 'Taken'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            2-character Crockford Base32 (0-9, A-Z excluding I, L, O, U). E.g. <strong className="text-white">00</strong>, <strong className="text-white">77</strong>, <strong className="text-white">99</strong>, <strong className="text-white">ZZ</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Phone */}
                  <div className="space-y-2">
                    <label htmlFor="student-phone" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" aria-hidden="true" /> Phone Number <span className="text-primary-light">*</span>
                    </label>
                    <input
                      id="student-phone"
                      name="student-phone"
                      type="tel"
                      inputMode="numeric"
                      aria-label="Phone Number"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      onBlur={handlePhoneBlur}
                      required
                      aria-required="true"
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white placeholder:text-muted-foreground"
                    />
                    {phoneWarning && (
                      <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mt-1" role="status">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {phoneWarning}
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <label htmlFor="student-address" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                      Residential Address
                    </label>
                    <textarea
                      id="student-address"
                      name="student-address"
                      rows={2}
                      placeholder="Street, Area, City"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      aria-label="Residential Address"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white placeholder:text-muted-foreground resize-none"
                    />
                  </div>

                  {/* PIN Code / Postal Code */}
                  <div className="space-y-2">
                    <label htmlFor="student-pincode" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                      PIN Code (Postal Code)
                    </label>
                    <input
                      id="student-pincode"
                      name="student-pincode"
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="e.g. 560001"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/[^0-9A-Za-z -]/g, ''))}
                      aria-label="PIN Code"
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-primary transition-colors duration-150 text-white placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Column 2: Club Details & Photo */}
                <div className="space-y-6">
                  {/* Belt & Branch */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="student-belt" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                        Belt Level
                      </label>
                      <CustomSelect
                        id="student-belt"
                        aria-label="Belt Level"
                        value={belt}
                        onChange={(val: string) => setBelt(val)}
                        options={belts.map(b => ({ label: `${b} Belt`, value: b }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="student-branch" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                        Branch
                      </label>
                      <CustomSelect
                        id="student-branch"
                        aria-label="Branch"
                        value={branch}
                        onChange={(val: string) => setBranch(val)}
                        options={branches.map(br => ({ label: br, value: br }))}
                      />
                    </div>
                  </div>

                  {/* Photo Upload with Live Compression Preview */}
                  <div className="space-y-2">
                    <label htmlFor="student-photo" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                      <span>Student Photo</span>
                      <span className="text-[10px] text-muted-foreground lowercase">auto-compressed to ~100kb</span>
                    </label>

                    <input
                      id="student-photo"
                      aria-label="Upload student photo"
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoSelect(file);
                      }}
                    />

                    {photoPreview ? (
                      <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center group">
                        <img
                          src={photoPreview}
                          alt="Student Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors duration-150"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-sm transition-colors duration-150"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="student-photo-trigger"
                        aria-label="Upload student photo"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-44 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/5 hover:bg-white/10 transition-colors duration-150 flex flex-col items-center justify-center cursor-pointer p-4 text-center group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary-light transition-colors duration-150 flex items-center justify-center mb-2" aria-hidden="true">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          Tap to take photo / upload
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1">
                          Camera active on mobile & tablet
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-muted-foreground">
                  {isAdmin && isCustomId && customSuffix.trim().length === 2 ? (
                    <>Assigning VIP ID: <strong className="text-primary-light font-mono">XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}{customSuffix.trim().toUpperCase()}</strong></>
                  ) : (
                    <>Student will be assigned next consecutive Crockford ID <strong className="text-primary-light font-mono">XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}##</strong>.</>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 active:scale-95 transition-colors duration-150 shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Student...
                    </>
                  ) : (
                    <>
                      Complete Intake <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DIRECTORY & ROSTER                                                */}
        {/* ========================================================================= */}
        {activeTab === 'directory' && (
          <div id="panel-directory" role="tabpanel" aria-labelledby="tab-directory" className="space-y-6">
            
            {/* Search and Filters Bar */}
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <label htmlFor="directory-search" className="sr-only">Search Students</label>
                  <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="directory-search"
                    name="directory-search"
                    type="text"
                    aria-label="Search students by name, roll number, phone, or branch"
                    placeholder="Search by name, ID (XMF2601), phone, or branch..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-primary text-white placeholder:text-muted-foreground transition-colors duration-150"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors duration-150"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchStudents}
                  disabled={loadingDirectory}
                  className="px-4 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-white transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDirectory ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label htmlFor="filter-belt" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Belt</label>
                  <CustomSelect
                    id="filter-belt"
                    aria-label="Filter by Belt"
                    value={filterBelt}
                    onChange={(val: string) => {
                      setFilterBelt(val);
                      setCurrentPage(1);
                    }}
                    options={[{ label: 'All Belts', value: 'All' }, ...belts.map(b => ({ label: b, value: b }))]}
                  />
                </div>

                <div>
                  <label htmlFor="filter-branch" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Branch</label>
                  <CustomSelect
                    id="filter-branch"
                    aria-label="Filter by Branch"
                    value={filterBranch}
                    onChange={(val: string) => {
                      setFilterBranch(val);
                      setCurrentPage(1);
                    }}
                    options={[{ label: 'All Branches', value: 'All' }, ...branches.map(b => ({ label: b, value: b }))]}
                  />
                </div>

                <div>
                  <label htmlFor="filter-review" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Review</label>
                  <CustomSelect
                    id="filter-review"
                    aria-label="Filter by Review Status"
                    value={filterReview}
                    onChange={(val: string) => {
                      setFilterReview(val as 'All' | 'Pending' | 'Reviewed');
                      setCurrentPage(1);
                    }}
                    options={[
                      { label: 'All Reviews', value: 'All' },
                      { label: 'Pending Review', value: 'Pending' },
                      { label: 'Reviewed', value: 'Reviewed' },
                    ]}
                  />
                </div>

                <div>
                  <label htmlFor="filter-status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Status</label>
                  <CustomSelect
                    id="filter-status"
                    aria-label="Filter by Status"
                    value={filterStatus}
                    onChange={(val: string) => {
                      setFilterStatus(val as 'Active' | 'Deleted' | 'All');
                      setCurrentPage(1);
                    }}
                    options={[
                      { label: 'Active Only', value: 'Active' },
                      { label: 'Deleted Only', value: 'Deleted' },
                      { label: 'All Records', value: 'All' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Students List */}
            {loadingDirectory ? (
              <div className="py-20 text-center glass-card rounded-3xl border border-white/10">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-light mb-3" />
                <p className="text-xs uppercase font-black tracking-widest text-muted-foreground">Loading Roster...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 text-center glass-card rounded-3xl border border-white/10">
                <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-bold uppercase tracking-wider text-white">No students found</p>
                <p className="text-xs text-muted-foreground mt-1">Adjust search query or filter options.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-hidden rounded-3xl border border-white/10 glass-card">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="py-4 px-6">Student</th>
                        <th className="py-4 px-6">ID</th>
                        <th className="py-4 px-6">Belt</th>
                        <th className="py-4 px-6">Branch</th>
                        <th className="py-4 px-6">Phone</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs">
                      {paginatedStudents.map((student) => (
                        <tr key={student.member_id} className={`contain-card hover:bg-white/5 transition-colors duration-150 ${student.is_deleted ? 'opacity-40 line-through' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              {student.photo_url ? (
                                <img
                                  src={student.photo_url}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-white/10 text-primary-light font-black flex items-center justify-center border border-white/10">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-white text-sm">{student.name}</p>
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                  <span>Age: {student.age ?? 'N/A'}</span>
                                  <span>•</span>
                                  <span>Joined: {student.date_of_joining ? student.date_of_joining.split('T')[0] : 'Recent'}</span>
                                  <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary-light rounded text-[9px] font-mono font-bold">
                                    {calculateTenure(student.date_of_joining)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold text-primary-light tracking-wider">
                            {student.member_id}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-white">
                              {student.belt || 'White'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {student.branch}
                          </td>
                          <td className="py-4 px-6 font-mono text-white">
                            {student.phone || 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            {student.is_deleted ? (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400">
                                Deleted
                              </span>
                            ) : isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleToggleReview(student)}
                                title="Click to toggle verification status (Admin)"
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                                  student.is_reviewed
                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                }`}
                              >
                                {student.is_reviewed ? 'Verified' : 'Pending'}
                              </button>
                            ) : (
                              <span
                                title="Only Admins can verify students"
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  student.is_reviewed
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {student.is_reviewed ? 'Verified' : 'Pending'}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1">
                              {(directoryCredentials[student.member_id] || []).map(c => (
                                <span key={c.id} className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${c.type === 'qrc' ? 'bg-primary/20 text-primary-light' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {c.type === 'qrc' ? 'QRC' : 'TAG'}: {c.token}
                                </span>
                              ))}
                              {canManageCredentials && (
                                <button 
                                  onClick={() => {
                                    setCredentialModalTarget(student.member_id);
                                    setCredentialModalOpen(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                  + Assign
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!student.is_deleted && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(student)}
                                    className="p-2 hover:bg-white/10 text-muted-foreground hover:text-white rounded-lg transition-colors duration-150"
                                    title="Edit Student"
                                    aria-label={`Edit ${student.name}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSoftDelete(student)}
                                    className="p-2 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded-lg transition-colors duration-150"
                                    title="Soft Delete"
                                    aria-label={`Delete ${student.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {student.is_deleted && (
                                <button
                                  type="button"
                                  onClick={() => handleUndoDelete(student.member_id)}
                                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors duration-150"
                                >
                                  <Undo2 className="w-3 h-3" /> Restore
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {paginatedStudents.map((student) => (
                    <div
                      key={student.member_id}
                      className={`contain-card glass-card p-5 rounded-2xl border border-white/10 space-y-4 ${
                        student.is_deleted ? 'opacity-40 line-through' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-white/10 text-primary-light font-black text-lg flex items-center justify-center border border-white/10">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-white text-base leading-tight">{student.name}</h3>
                            <p className="font-mono text-primary-light font-black text-xs tracking-wider mt-0.5">
                              {student.member_id}
                            </p>
                          </div>
                        </div>

                        {student.is_deleted ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-400">
                            Deleted
                          </span>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleToggleReview(student)}
                            title="Click to toggle verification status (Admin)"
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all duration-150 active:scale-95 cursor-pointer ${
                              student.is_reviewed
                                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                            }`}
                          >
                            {student.is_reviewed ? 'Verified' : 'Pending'}
                          </button>
                        ) : (
                          <span
                            title="Only Admins can verify students"
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              student.is_reviewed
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {student.is_reviewed ? 'Verified' : 'Pending'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-2 border-t border-white/5">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Belt</span>
                          <span className="text-white font-bold">{student.belt || 'White'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Branch</span>
                          <span className="text-white truncate block">{student.branch}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Phone</span>
                          <span className="font-mono text-white">{student.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Age</span>
                          <span className="text-white">{student.age ? `${student.age} yrs` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Joined</span>
                          <span className="font-mono text-white text-[11px]">{student.date_of_joining ? student.date_of_joining.split('T')[0] : 'Recent'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 block">Member Since</span>
                          <span className="text-primary-light font-mono font-bold text-[11px]">{calculateTenure(student.date_of_joining)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2">
                        {!student.is_deleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEditModal(student)}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-150"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSoftDelete(student)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-150"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUndoDelete(student.member_id)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-150"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-muted-foreground font-medium">
                    Showing <span className="text-white font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                    <span className="text-white font-bold">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> of{' '}
                    <span className="text-primary-light font-bold">{filteredStudents.length}</span> students
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <label htmlFor="page-size-select" className="text-xs">Per page:</label>
                      <select
                        id="page-size-select"
                        name="page-size-select"
                        aria-label="Students per page"
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none transition-colors duration-150"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Previous Page"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="px-3 text-xs font-mono text-white" aria-live="polite">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        aria-label="Next Page"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* EDIT MODAL                                                               */}
        {/* ========================================================================= */}
        {editingStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="edit-student-title">
            <div className="glass-card max-w-xl w-full rounded-3xl border border-white/20 p-6 sm:p-8 space-y-6 relative my-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-primary-light font-bold uppercase tracking-widest">
                    {editingStudent.member_id}
                  </span>
                  <h3 id="edit-student-title" className="text-xl font-black uppercase text-white">Edit Student Details</h3>
                </div>
                <button
                  type="button"
                  aria-label="Close edit modal"
                  onClick={() => setEditingStudent(null)}
                  className="p-2 text-muted-foreground hover:text-white rounded-xl hover:bg-white/5 transition-colors duration-150"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                {editFormError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2.5" role="alert">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</label>
                  <input
                    id="edit-name"
                    name="edit-name"
                    type="text"
                    aria-label="Full Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    aria-required="true"
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-medium text-white focus:outline-none focus:border-primary transition-colors duration-150"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="edit-dob" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Date of Birth</label>
                    <input
                      id="edit-dob"
                      name="edit-dob"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={editForm.dob}
                      aria-label="Date of Birth"
                      onChange={(e) => {
                        const newDob = e.target.value;
                        let newAge = editForm.age;
                        if (newDob) {
                          const birth = new Date(newDob);
                          const today = new Date();
                          let calc = today.getFullYear() - birth.getFullYear();
                          const m = today.getMonth() - birth.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calc--;
                          if (calc >= 0) newAge = calc;
                        }
                        setEditForm({ ...editForm, dob: newDob, age: newAge });
                      }}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary transition-colors duration-150"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-age" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Age</label>
                    <input
                      id="edit-age"
                      name="edit-age"
                      type="number"
                      aria-label="Age in years"
                      value={editForm.age}
                      onChange={(e) => setEditForm({ ...editForm, age: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                      className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary transition-colors duration-150"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="edit-doj" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" /> Date of Joining
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      Tenure: <span className="text-primary-light font-mono font-bold">{calculateTenure(editForm.date_of_joining)}</span>
                    </span>
                  </div>
                  <input
                    id="edit-doj"
                    name="edit-doj"
                    type="date"
                    value={editForm.date_of_joining}
                    aria-label="Date of Joining"
                    onChange={(e) => setEditForm({ ...editForm, date_of_joining: e.target.value })}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary transition-colors duration-150"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="edit-belt" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Belt</label>
                    <CustomSelect
                      id="edit-belt"
                      aria-label="Edit Belt Level"
                      value={editForm.belt}
                      onChange={(val: string) => setEditForm({ ...editForm, belt: val })}
                      options={belts.map(b => ({ label: b, value: b }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="edit-branch" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Branch</label>
                    <CustomSelect
                      id="edit-branch"
                      aria-label="Edit Branch"
                      value={editForm.branch}
                      onChange={(val: string) => setEditForm({ ...editForm, branch: val })}
                      options={branches.map(b => ({ label: b, value: b }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</label>
                  <input
                    id="edit-phone"
                    name="edit-phone"
                    type="tel"
                    inputMode="numeric"
                    aria-label="Phone Number"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '') })}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary transition-colors duration-150"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-address" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Residential Address</label>
                  <textarea
                    id="edit-address"
                    name="edit-address"
                    rows={2}
                    value={editForm.address}
                    aria-label="Residential Address"
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary resize-none transition-colors duration-150"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="edit-pincode" className="text-xs font-black uppercase tracking-widest text-muted-foreground">PIN Code</label>
                  <input
                    id="edit-pincode"
                    name="edit-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="e.g. 560001"
                    value={editForm.pin_code}
                    aria-label="PIN Code"
                    onChange={(e) => setEditForm({ ...editForm, pin_code: e.target.value.replace(/[^0-9A-Za-z -]/g, '') })}
                    className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none focus:border-primary transition-colors duration-150"
                  />
                </div>

                {/* Review / Verification Status */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <span className="text-xs font-bold text-white block">Verification Status</span>
                    <span className="text-[10px] text-muted-foreground">Mark student intake as verified by instructor</span>
                  </div>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, is_reviewed: !prev.is_reviewed }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer ${
                        editForm.is_reviewed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {editForm.is_reviewed ? 'Verified' : 'Pending Review'}
                    </button>
                  ) : (
                    <span
                      title="Only Admins can change verification status"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${
                        editForm.is_reviewed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {editForm.is_reviewed ? 'Verified' : 'Pending Review'}
                    </span>
                  )}
                </div>

                {/* Photo Update */}
                <div className="space-y-2">
                  <label htmlFor="edit-photo" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Photo</label>
                  <input
                    id="edit-photo"
                    name="edit-photo"
                    aria-label="Change student photo"
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditPhotoFile(file);
                        const reader = new FileReader();
                        reader.onload = (re) => setEditPhotoPreview(re.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="flex items-center gap-4">
                    {editPhotoPreview ? (
                      <img src={editPhotoPreview} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-white/20" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-2.5 bg-primary text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors duration-150 flex items-center gap-2"
                  >
                    {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SOFT-DELETE UNDO TOAST BANNER                                             */}
        {/* ========================================================================= */}
        {undoToast.show && (
          <div className="fixed bottom-6 right-6 z-50 bg-black/90 text-white border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-300" role="status" aria-live="polite">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">{undoToast.studentName}</span> ({undoToast.studentId}) was marked as deleted.
            </div>
            <button
              type="button"
              onClick={() => handleUndoDelete(undoToast.studentId)}
              className="px-3 py-1.5 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors duration-150 flex items-center gap-1.5"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              type="button"
              aria-label="Dismiss undo notification"
              onClick={() => setUndoToast({ show: false, studentId: '', studentName: '' })}
              className="text-muted-foreground hover:text-white p-1 transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
      {credentialModalTarget && (
        <CredentialAssignmentModal 
          isOpen={isCredentialModalOpen}
          onClose={() => { setCredentialModalOpen(false); setCredentialModalTarget(null); }}
          memberId={credentialModalTarget}
          onAssigned={() => {}}
        />
      )}
    </>
  );
}
