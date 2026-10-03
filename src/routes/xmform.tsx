import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useRef } from 'react'
import { 
  UserPlus, Users, Search, Camera, 
  CheckCircle2, AlertCircle, Edit2, Trash2, Undo2, 
  ChevronLeft, ChevronRight, X, Loader2, ArrowRight, 
  Phone, Calendar, User, RefreshCw, Sparkles, ShieldCheck,
  Copy, Check, Share2, Printer, LogIn, MapPin, Award, Droplet
} from 'lucide-react'
import { supabase } from '#/lib/supabase'
import { compressImage } from '#/lib/image'
import { CustomSelect } from '#/components/CustomSelect'
import { CredentialAssignmentModal } from '#/components/credentials/CredentialAssignmentModal'
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
  blood_group?: string | null;
  address?: string | null;
  pin_code?: string | null;
  photo_url?: string | null;
  role?: string;
  member_status?: string;
  fee_status?: string | null;
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

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const BELT_CONFIG: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  'White': { bg: 'bg-white/10', text: 'text-zinc-100', dot: 'bg-white', border: 'border-white/30' },
  'Yellow': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', dot: 'bg-yellow-400', border: 'border-yellow-500/40' },
  'Orange': { bg: 'bg-orange-500/20', text: 'text-orange-300', dot: 'bg-orange-500', border: 'border-orange-500/40' },
  'Green': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-500/40' },
  'Blue': { bg: 'bg-blue-500/20', text: 'text-blue-300', dot: 'bg-blue-500', border: 'border-blue-500/40' },
  'Purple': { bg: 'bg-purple-500/20', text: 'text-purple-300', dot: 'bg-purple-500', border: 'border-purple-500/40' },
  'Brown': { bg: 'bg-amber-900/30', text: 'text-amber-200', dot: 'bg-amber-700', border: 'border-amber-700/50' },
  'Red': { bg: 'bg-red-500/20', text: 'text-red-300', dot: 'bg-red-500', border: 'border-red-500/40' },
  'Black': { bg: 'bg-zinc-800', text: 'text-zinc-200', dot: 'bg-zinc-950 border border-zinc-500', border: 'border-zinc-700' },
};

function XMFormPage() {
  const [activeTab, setActiveTab] = useState<'intake' | 'directory'>('intake');
  
  // Belts and Branches from app_settings
  const [belts, setBelts] = useState<string[]>(DEFAULT_BELTS);
  const [branches, setBranches] = useState<string[]>(DEFAULT_BRANCHES);

  // Form State
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [belt, setBelt] = useState('White');
  const [branch, setBranch] = useState('XMF Main HQ');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Auth state for Admin & Volunteer capabilities
  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('xmf_member');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const isVolunteer = currentUser?.role === 'volunteer';
  const canAccessStudents = isAdmin || isVolunteer;
  const canManageCredentials = isAdmin || isVolunteer;

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
  const [copiedId, setCopiedId] = useState(false);

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
    blood_group: '',
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

  // Load Settings (belts, branches) on mount
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
    if (canAccessStudents) {
      fetchStudents();
    }
  }, [canAccessStudents]);

  // Fetch Directory Students (Admins & Volunteers only)
  const fetchStudents = async () => {
    if (!canAccessStudents) return;
    setLoadingDirectory(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        return;
      }
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
      if (canAccessStudents) {
        fetchStudents();
      } else {
        setActiveTab('intake');
      }
    }
  }, [activeTab, canAccessStudents]);

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
          setPhoneWarning(`Family phone linked: Also on file for ${data[0].name} (${data[0].member_id}). Sibling registration permitted.`);
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

      if (qErr) {
        setCustomIdStatus({ checking: false });
        return;
      }

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

  // Generate Crockford Base32 Member ID
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

  // Copy Member ID to Clipboard
  const handleCopyId = (id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Generate WhatsApp Share Link for the new student
  const getWhatsAppShareUrl = (student: StudentMember) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://xmfclub.com';
    const text = `🥋 *XMF Martial Arts Club Registration Confirmed!*\n\n` +
      `👤 *Student:* ${student.name}\n` +
      `🆔 *Member ID:* ${student.member_id}\n` +
      `🥋 *Belt Level:* ${student.belt || 'White Belt'}\n` +
      `📍 *Dojo Branch:* ${student.branch || 'XMF Main HQ'}\n` +
      (student.blood_group ? `🩸 *Blood Group:* ${student.blood_group}\n` : '') +
      `🔑 *Default Portal PIN:* 12345\n\n` +
      `Access your digital member pass & check-in profile here:\n${origin}/member/${student.member_id}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  // Submit New Student Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const formattedName = formatName(name);
    if (!formattedName) {
      setErrorMsg('Please enter the student\'s full name.');
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number (starting with 6, 7, 8, or 9).');
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
        blood_group: bloodGroup || null,
        phone: cleanPhone,
        address: address.trim() || null,
        pin_code: pinCode.trim() || null,
        photo_url: photoUrl,
        role: 'student',
        member_status: 'Active',
        fee_status: 'Pending',
        password: '12345',
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
        setErrorMsg(error.message);
        return;
      }

      const newlyCreated: StudentMember = data || { ...newStudentPayload };
      setCreatedStudent(newlyCreated);
      setStudents(prev => [newlyCreated, ...prev]);

      // Scroll smoothly to top for celebratory confirmation
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form fields
      setName('');
      setDob('');
      setAge('');
      setBloodGroup('');
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

  // Soft Delete Handler (Admins & Volunteers only)
  const handleSoftDelete = async (student: StudentMember) => {
    if (!canAccessStudents) return;
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_deleted: true })
        .eq('member_id', student.member_id);

      if (error) {
        console.error('Error soft-deleting student:', error);
        return;
      }

      setStudents(prev =>
        prev.map(s => s.member_id === student.member_id ? { ...s, is_deleted: true } : s)
      );

      setUndoToast({
        show: true,
        studentId: student.member_id,
        studentName: student.name,
      });

      setTimeout(() => {
        setUndoToast(prev => prev.studentId === student.member_id ? { ...prev, show: false } : prev);
      }, 7000);
    } catch (err) {
      console.error('Error soft-deleting student:', err);
    }
  };

  // Undo Soft Delete (Admins & Volunteers only)
  const handleUndoDelete = async (studentId: string) => {
    if (!canAccessStudents) return;
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_deleted: false })
        .eq('member_id', studentId);

      if (error) {
        console.error('Error restoring student:', error);
        return;
      }

      setStudents(prev =>
        prev.map(s => s.member_id === studentId ? { ...s, is_deleted: false } : s)
      );
      setUndoToast({ show: false, studentId: '', studentName: '' });
    } catch (err) {
      console.error('Error restoring student:', err);
    }
  };

  // Open Edit Modal (Admins & Volunteers only)
  const openEditModal = (student: StudentMember) => {
    if (!canAccessStudents) return;
    setEditingStudent(student);
    setEditFormError(null);
    setEditForm({
      name: student.name || '',
      dob: student.dob || '',
      age: student.age ?? '',
      date_of_joining: student.date_of_joining ? student.date_of_joining.split('T')[0] : '',
      belt: student.belt || 'White',
      branch: student.branch || 'XMF Main HQ',
      blood_group: student.blood_group || '',
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
    if (!isAdmin) return;
    const updatedStatus = !student.is_reviewed;
    try {
      const { error } = await supabase
        .from('members')
        .update({ is_reviewed: updatedStatus })
        .eq('member_id', student.member_id);

      if (error) {
        console.error('Error toggling review status:', error);
        return;
      }

      setStudents(prev =>
        prev.map(s => s.member_id === student.member_id ? { ...s, is_reviewed: updatedStatus } : s)
      );
    } catch (err) {
      console.error('Error toggling review status:', err);
    }
  };

  // Save Edit (Admins & Volunteers only)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccessStudents || !editingStudent) return;
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
        blood_group: editForm.blood_group || null,
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

      if (error) {
        console.error('Error saving edits:', error);
        setEditFormError(error.message || 'Failed to update student details.');
        return;
      }

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

  // Filtered & Paginated Students (Directory)
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (filterStatus === 'Active' && student.is_deleted) return false;
      if (filterStatus === 'Deleted' && !student.is_deleted) return false;

      if (filterReview === 'Pending' && student.is_reviewed) return false;
      if (filterReview === 'Reviewed' && !student.is_reviewed) return false;

      if (filterBelt !== 'All' && student.belt !== filterBelt) return false;
      if (filterBranch !== 'All' && student.branch !== filterBranch) return false;

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

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const activeBeltStyle = BELT_CONFIG[belt] || BELT_CONFIG['White'];

  return (
    <>
      <div className="min-h-screen bg-background pt-28 sm:pt-32 pb-20 px-4 sm:px-6 md:px-8 text-foreground selection:bg-primary/20">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-[11px] font-black tracking-widest uppercase">
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>XMF Official Student Enrollment</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                Member Intake Form
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                Join XMF Martial Arts Club. Complete your details below to generate your official Crockford Base32 Member ID and digital dojo pass.
              </p>
            </div>

            {/* Admin & Volunteer Roster Controls */}
            {canAccessStudents ? (
              <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase font-mono text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-light" />
                  <span>Logged in as <strong className="text-white capitalize">{currentUser?.role || 'Staff'}</strong></span>
                </div>
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl" role="tablist" aria-label="Registration Views">
                  <button
                    type="button"
                    role="tab"
                    id="tab-intake"
                    aria-selected={activeTab === 'intake'}
                    aria-controls="panel-intake"
                    onClick={() => setActiveTab('intake')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                      activeTab === 'intake'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Intake Form
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-directory"
                    aria-selected={activeTab === 'directory'}
                    aria-controls="panel-directory"
                    onClick={() => setActiveTab('directory')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-150 ${
                      activeTab === 'directory'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Roster ({students.length})
                  </button>
                </div>
              </div>
            ) : currentUser ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] uppercase font-mono text-muted-foreground shrink-0 self-start sm:self-end">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-light" />
                <span>Logged in as <strong className="text-white capitalize">{currentUser.role || 'Member'}</strong></span>
              </div>
            ) : null}
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: INTAKE & REGISTRATION FLOW                                        */}
          {/* ========================================================================= */}
          {activeTab === 'intake' && (
            <div id="panel-intake" role="tabpanel" aria-labelledby="tab-intake" className="space-y-8">
              
              {/* SUCCESS STATE: CELEBRATORY PASS PREVIEW */}
              {createdStudent ? (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  
                  {/* Top Success Banner */}
                  <div className="glass-card p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-3 relative overflow-hidden">
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400 block">
                      Enrollment Completed Successfully
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                      Welcome to XMF, {createdStudent.name}!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
                      Your athlete profile has been registered in the dojo roster. Save or share your official credential pass below.
                    </p>
                  </div>

                  {/* Digital Martial Arts Member Pass Card */}
                  <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-zinc-900/90 via-black to-zinc-950 p-6 sm:p-8 shadow-2xl overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Pass Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center font-black text-white text-sm shadow-md">
                          X
                        </div>
                        <div>
                          <div className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">Official Pass</div>
                          <div className="text-sm font-black uppercase tracking-wider text-white">XMF Martial Arts Club</div>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Student
                      </span>
                    </div>

                    {/* Pass Body */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 relative z-10 items-center">
                      
                      {/* Photo / Avatar */}
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl bg-black/50 flex items-center justify-center">
                          {createdStudent.photo_url ? (
                            <img
                              src={createdStudent.photo_url}
                              alt={createdStudent.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-primary/15 text-primary-light font-black text-4xl flex items-center justify-center">
                              {createdStudent.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                          {createdStudent.branch || 'Main HQ'}
                        </span>
                      </div>

                      {/* Main Details */}
                      <div className="md:col-span-2 space-y-4 text-left">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-1">
                            Athlete Member ID
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest">
                              {createdStudent.member_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(createdStudent.member_id)}
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold uppercase tracking-wider text-white transition-colors duration-150 flex items-center gap-1.5"
                              title="Copy Member ID"
                            >
                              {copiedId ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                            {createdStudent.name}
                          </h3>
                        </div>

                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Belt Badge */}
                          <div className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${BELT_CONFIG[createdStudent.belt || 'White']?.bg} ${BELT_CONFIG[createdStudent.belt || 'White']?.text} ${BELT_CONFIG[createdStudent.belt || 'White']?.border}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${BELT_CONFIG[createdStudent.belt || 'White']?.dot}`} />
                            <span>{createdStudent.belt || 'White'} Belt</span>
                          </div>

                          {/* Blood Group */}
                          {createdStudent.blood_group && (
                            <div className="px-3 py-1 rounded-xl text-xs font-mono font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5">
                              <Droplet className="w-3 h-3 text-red-400 fill-red-400" />
                              <span>{createdStudent.blood_group}</span>
                            </div>
                          )}

                          {/* Age */}
                          {createdStudent.age && (
                            <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-zinc-300">
                              {createdStudent.age} yrs
                            </div>
                          )}

                          {/* Member Since */}
                          <div className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-white/5 border border-white/10 text-muted-foreground">
                            Joined {createdStudent.date_of_joining || 'Today'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Portal Credentials Note */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <LogIn className="w-3.5 h-3.5 text-primary-light" />
                          Default Portal PIN: <strong className="font-mono text-primary-light text-sm tracking-wider">12345</strong>
                        </span>
                        <p className="text-[11px] text-muted-foreground">
                          Use this PIN with your Member ID to sign into your Student Portal and mark attendance.
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 sm:text-right">
                        <span>Review: <strong className="text-amber-400">Pending Dojo Verification</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                    {/* Share on WhatsApp */}
                    <a
                      href={getWhatsAppShareUrl(createdStudent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Send to WhatsApp</span>
                    </a>

                    {/* Go to Student Portal */}
                    <Link
                      to="/member/$memberId"
                      params={{ memberId: createdStudent.member_id }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Open Member Portal</span>
                    </Link>

                    {/* Print Pass */}
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-black text-xs uppercase tracking-wider transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print Summary</span>
                    </button>

                    {/* Register Another Student */}
                    <button
                      type="button"
                      onClick={() => setCreatedStudent(null)}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10 font-black text-xs uppercase tracking-wider transition-colors duration-150 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Enroll Another</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* REGISTRATION INTAKE FORM */
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {errorMsg && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs sm:text-sm flex items-start gap-3 animate-in fade-in" role="alert">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <strong className="font-bold uppercase tracking-wider block">Submission Error</strong>
                        <span>{errorMsg}</span>
                      </div>
                    </div>
                  )}

                  {/* SECTION 1: STUDENT DETAILS (WITH JOINING DATE FOR AUTO ID) */}
                  <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                          1. Student Details
                        </h2>
                        <p className="text-xs text-muted-foreground">Personal identification, medical safety, and joining date</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label htmlFor="student-name" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                          <span>Full Name <span className="text-primary-light">*</span></span>
                          <span className="text-[10px] text-muted-foreground/80 font-normal">First & Last Name</span>
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
                          className="w-full h-13 px-4 rounded-2xl bg-white/[0.04] border border-white/15 text-base sm:text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                        />
                      </div>

                      {/* DOB and Age Row */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Date of Birth */}
                        <div className="space-y-2">
                          <label htmlFor="student-dob" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-light" />
                            Date of Birth
                          </label>
                          <input
                            id="student-dob"
                            name="student-dob"
                            type="date"
                            max={new Date().toISOString().split('T')[0]}
                            value={dob}
                            onChange={(e) => handleDobChange(e.target.value)}
                            aria-label="Date of Birth"
                            className="w-full h-13 px-3 sm:px-4 rounded-2xl bg-white/[0.04] border border-white/15 text-sm font-medium text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                          />
                        </div>

                        {/* Age in Years */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label htmlFor="student-age" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                              Age (Years)
                            </label>
                            {age !== '' && (
                              <span className="hidden sm:inline-block text-[10px] font-mono font-bold text-primary-light">
                                Auto
                              </span>
                            )}
                          </div>
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
                            className="w-full h-13 px-4 rounded-2xl bg-white/[0.04] border border-white/15 text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                          />
                        </div>
                      </div>

                      {/* Blood Group Tactile Pill Grid */}
                      <div className="space-y-2 pt-1">
                        <label className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Droplet className="w-3.5 h-3.5 text-red-400" />
                            Blood Group <span className="text-[10px] text-muted-foreground/80 font-normal lowercase">(optional medical tag)</span>
                          </span>
                          {bloodGroup ? (
                            <span className="text-[10px] font-mono font-bold text-red-400 uppercase">
                              Selected: {bloodGroup}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-normal">
                              Tap to select
                            </span>
                          )}
                        </label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {BLOOD_GROUPS.map((bg) => {
                            const isSelected = bloodGroup === bg;
                            return (
                              <button
                                key={bg}
                                type="button"
                                onClick={() => setBloodGroup(isSelected ? '' : bg)}
                                className={`h-11 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center border cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-500 text-white border-red-400 shadow-md shadow-red-500/30 ring-1 ring-red-400 scale-[1.02]'
                                    : 'bg-white/[0.04] border-white/10 text-zinc-300 hover:bg-white/[0.08] hover:text-white'
                                }`}
                              >
                                {bg}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Date of Joining (Used for Auto Crockford ID Generation) */}
                      <div className="space-y-2 pt-1 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <label htmlFor="student-doj" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-light" />
                            Date of Joining <span className="text-primary-light">*</span>
                          </label>
                          <span className="text-[10px] text-muted-foreground">
                            Auto ID Prefix: <strong className="font-mono text-primary-light">XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}##</strong>
                            {' • '}<span className="text-white font-mono">{calculateTenure(dateOfJoining)}</span>
                          </span>
                        </div>
                        <input
                          id="student-doj"
                          name="student-doj"
                          type="date"
                          value={dateOfJoining}
                          onChange={(e) => {
                            setDateOfJoining(e.target.value);
                            if (isCustomId && customSuffix) {
                              checkCustomIdAvailability(customSuffix, e.target.value);
                            }
                          }}
                          required
                          aria-required="true"
                          aria-label="Date of Joining"
                          className="w-full h-13 px-4 rounded-2xl bg-white/[0.04] border border-white/15 text-sm font-medium text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: BELT RANK & DOJO BRANCH */}
                  <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5 relative z-20">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                          2. Belt Rank & Dojo Branch
                        </h2>
                        <p className="text-xs text-muted-foreground">Select your starting belt rank and home training dojo</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Belt Level */}
                      <div className="space-y-2 relative z-20">
                        <div className="flex items-center justify-between">
                          <label htmlFor="student-belt" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                            Belt Rank <span className="text-primary-light">*</span>
                          </label>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${activeBeltStyle.bg} ${activeBeltStyle.text} ${activeBeltStyle.border}`}>
                            {belt} Belt
                          </span>
                        </div>
                        <CustomSelect
                          id="student-belt"
                          aria-label="Belt Level"
                          value={belt}
                          onChange={(val: string) => setBelt(val)}
                          options={belts.map(b => ({ label: `${b} Belt`, value: b }))}
                        />
                      </div>

                      {/* Branch Dojo */}
                      <div className="space-y-2 relative z-10">
                        <label htmlFor="student-branch" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary-light" />
                          Dojo Branch <span className="text-primary-light">*</span>
                        </label>
                        <CustomSelect
                          id="student-branch"
                          aria-label="Branch Dojo"
                          value={branch}
                          onChange={(val: string) => setBranch(val)}
                          options={branches.map(br => ({ label: br, value: br }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: CONTACT & ADDRESS DETAILS */}
                  <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                          3. Contact & Address Details
                        </h2>
                        <p className="text-xs text-muted-foreground">Emergency communications and family records</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Mobile Phone */}
                      <div className="space-y-2">
                        <label htmlFor="student-phone" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-primary-light" />
                            Mobile Number <span className="text-primary-light">*</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 font-normal">Parent / Student Mobile</span>
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 px-2 py-1 rounded-lg bg-white/10 border border-white/10 text-xs font-mono font-bold text-zinc-300 pointer-events-none select-none">
                            +91
                          </div>
                          <input
                            id="student-phone"
                            name="student-phone"
                            type="tel"
                            inputMode="numeric"
                            aria-label="10-digit mobile number"
                            placeholder="98765 43210"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            onBlur={handlePhoneBlur}
                            required
                            aria-required="true"
                            className="w-full h-13 pl-16 pr-4 rounded-2xl bg-white/[0.04] border border-white/15 text-base sm:text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                          />
                        </div>
                        {phoneWarning && (
                          <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl text-xs flex items-center gap-2 mt-1" role="status">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-400" />
                            <span>{phoneWarning}</span>
                          </div>
                        )}
                      </div>

                      {/* Residential Address & PIN Code */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-2 space-y-2">
                          <label htmlFor="student-address" className="text-xs font-black tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                            Residential Address
                          </label>
                          <textarea
                            id="student-address"
                            name="student-address"
                            rows={2}
                            placeholder="Flat/House No., Street, Area, City"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            aria-label="Residential Address"
                            className="w-full p-4 rounded-2xl bg-white/[0.04] border border-white/15 text-base sm:text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="student-pincode" className="text-xs font-black tracking-widest uppercase text-muted-foreground">
                            PIN / Postal Code
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
                            className="w-full h-13 px-4 rounded-2xl bg-white/[0.04] border border-white/15 text-base sm:text-sm font-medium text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: STUDENT BADGE PHOTO */}
                  <div className="glass-card p-5 sm:p-7 rounded-3xl border border-white/10 space-y-5 relative z-10">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                            4. Official Pass Photo
                          </h2>
                          <p className="text-xs text-muted-foreground">Take a quick selfie or upload from gallery for your dojo pass</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-white/5 border border-white/10">
                        Auto-WebP ~100KB
                      </span>
                    </div>

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
                      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-primary/60 shadow-xl bg-black shrink-0">
                          <img
                            src={photoPreview}
                            alt="Student Badge Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-3 text-center sm:text-left flex-1">
                          <div>
                            <span className="text-xs font-bold text-emerald-400 flex items-center justify-center sm:justify-start gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Photo Attached
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              This image will be compressed and displayed on your student credential pass.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                            >
                              Retake / Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoFile(null);
                                setPhotoPreview(null);
                              }}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="student-photo-trigger"
                        aria-label="Upload student photo"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full min-h-[140px] rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-150 flex flex-col items-center justify-center cursor-pointer p-6 text-center group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-primary/20 text-muted-foreground group-hover:text-primary-light transition-all duration-150 flex items-center justify-center mb-3">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider text-white">
                          Tap to Take Photo or Choose File
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Camera active on mobile & tablet • Recommended portrait crop
                        </span>
                      </button>
                    )}
                  </div>

                  {/* SECTION 5: ADMIN VIP ID ALLOCATION (VISIBLE FOR ADMIN ONLY, IN THE LAST) */}
                  {isAdmin && (
                    <div className="glass-card p-5 sm:p-7 rounded-3xl border border-primary/30 bg-primary/5 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">
                            Custom / VIP ID Allocation
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary-light border border-primary/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Master Admin Only
                        </span>
                      </div>

                      <div className="space-y-3">
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
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Assign Custom / VIP Suffix
                          </span>
                        </label>

                        {isCustomId && (
                          <div className="space-y-2 pt-1 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-muted-foreground px-3 py-2 bg-white/10 rounded-xl border border-white/20">
                                XMF{String(new Date(dateOfJoining || Date.now()).getFullYear()).slice(-2)}
                              </span>
                              <input
                                type="text"
                                maxLength={2}
                                placeholder="00"
                                value={customSuffix}
                                onChange={(e) => handleCustomSuffixChange(e.target.value)}
                                className="w-20 h-10 font-mono text-center text-sm font-bold uppercase bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-primary"
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
                            <p className="text-[11px] text-muted-foreground">
                              2-character Crockford Base32 suffix (0-9, A-Z excluding I, L, O, U). E.g. <strong className="text-white">00</strong>, <strong className="text-white">77</strong>, <strong className="text-white">99</strong>, <strong className="text-white">ZZ</strong>.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUBMIT BUTTON SECTION */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/25 disabled:opacity-50 transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Generating Athlete Profile...</span>
                        </>
                      ) : (
                        <>
                          <span>Complete Registration & Issue Pass</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-muted-foreground text-center mt-3">
                      By submitting, student is enrolled with standard Crockford Base32 ID and default portal PIN <strong className="text-white font-mono">12345</strong>.
                    </p>
                  </div>

                </form>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: ROSTER & DIRECTORY (RESTRICTED TO ADMINS & VOLUNTEERS)             */}
          {/* ========================================================================= */}
          {activeTab === 'directory' && canAccessStudents && (
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
                      placeholder="Search by name, ID (e.g. XMF2601), phone, or branch..."
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
                          <th className="py-4 px-6">Credentials</th>
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
          {/* EDIT MODAL (ADMINS & VOLUNTEERS)                                          */}
          {/* ========================================================================= */}
          {editingStudent && canAccessStudents && (
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    <div className="space-y-2">
                      <label htmlFor="edit-blood-group" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Blood Group</label>
                      <CustomSelect
                        id="edit-blood-group"
                        value={editForm.blood_group}
                        onChange={(val: string) => setEditForm({ ...editForm, blood_group: val })}
                        options={[
                          { label: 'Not Specified', value: '' },
                          ...BLOOD_GROUPS.map(bg => ({ label: bg, value: bg }))
                        ]}
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

          {/* SOFT-DELETE UNDO TOAST BANNER */}
          {undoToast.show && canAccessStudents && (
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
