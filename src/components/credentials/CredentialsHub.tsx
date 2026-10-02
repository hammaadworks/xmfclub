import { useState, useEffect, useMemo } from 'react';
import { supabase } from '#/lib/supabase';
import {
  Download,
  QrCode,
  Radio,
  Cpu,
  FolderArchive,
  FileSpreadsheet,
  Search,
  Eye,
  Copy,
  Check,
  User,
  ExternalLink,
  RefreshCw,
  Plus,
  Layers,
  Sparkles,
  History,
  Trash2,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import {
  BATCH_SIZE,
  calculateBatchTokens,
  buildCredentialUrl,
  exportBatchCsv,
  CANONICAL_CREDENTIAL_BASE_URL,
} from '#/lib/credentialToken';
import { generateQrBatchPdf, generateQrBatchZip } from '#/lib/qrLayout';
import { NfcProvisionerModal } from './NfcProvisionerModal';
import { BatchReviewModal, type BatchData, type BatchItem } from './BatchReviewModal';
import { CredentialDetailModal, type CredentialDetailItem } from './CredentialDetailModal';
import { AssignMemberModal, type AssignableMember } from './AssignMemberModal';
import { RegisterCredentialModal } from './RegisterCredentialModal';
import { AssignmentHistoryTable, type AssignmentRecord } from './AssignmentHistoryTable';

interface RawCredential {
  id: string;
  type: 'qrc' | 'tag';
  token: string;
  status: 'free' | 'assigned' | 'deleted';
  batch_id: string | null;
  physical_uid: string | null;
  rejection_reason: string | null;
  created_at: string;
  credential_batches?: {
    id: string;
    batch_number: number;
    type: 'qrc' | 'tag';
    created_at: string;
  } | null;
  credential_assignments?: Array<{
    id: string;
    member_id: string;
    assigned_at: string;
    unassigned_at: string | null;
    members?: {
      member_id: string;
      name: string;
      role: string;
      belt: string;
      branch: string;
      photo_url: string | null;
    } | null;
  }>;
}

export function CredentialsHub() {
  const [stats, setStats] = useState({
    qrc: 0,
    tag: 0,
    freeQrc: 0,
    freeTag: 0,
    assignedQrc: 0,
    assignedTag: 0,
    totalAssigned: 0,
    totalFree: 0,
  });

  const [nextBatchNumber, setNextBatchNumber] = useState<{ qrc: number; tag: number }>({ qrc: 0, tag: 0 });
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [credentials, setCredentials] = useState<CredentialDetailItem[]>([]);
  const [members, setMembers] = useState<AssignableMember[]>([]);
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingQrcPdf, setGeneratingQrcPdf] = useState(false);
  const [generatingQrcZip, setGeneratingQrcZip] = useState(false);
  const [generatingTagBatch, setGeneratingTagBatch] = useState(false);

  // Active view tab: 3 Dedicated Tables
  const [activeTab, setActiveTab] = useState<'batches' | 'inventory' | 'history'>('batches');
  const [batchViewMode, setBatchViewMode] = useState<'cards' | 'table'>('cards');

  // Filters & Search for inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'qrc' | 'tag'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'assigned' | 'deleted'>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  // Modals state
  const [nfcModalOpen, setNfcModalOpen] = useState(false);
  const [reviewingBatch, setReviewingBatch] = useState<BatchData | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<CredentialDetailItem | null>(null);
  const [assigningCredential, setAssigningCredential] = useState<{ id: string; token: string; type: 'qrc' | 'tag' } | null>(null);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadStatsAndBatches(), loadCredentialsAndMembers(), loadAssignmentAuditLogs()]);
    setLoading(false);
  };

  const loadStatsAndBatches = async () => {
    const { data: batchesData } = await supabase
      .from('credential_batches')
      .select('id, batch_number, type, quantity, start_token, end_token, created_at')
      .order('batch_number', { ascending: false });

    if (batchesData) {
      setBatches(batchesData as BatchData[]);
      const qrcBatches = batchesData.filter((b) => b.type === 'qrc').map((b) => b.batch_number);
      const tagBatches = batchesData.filter((b) => b.type === 'tag').map((b) => b.batch_number);

      setNextBatchNumber({
        qrc: qrcBatches.length > 0 ? Math.max(...qrcBatches) + 1 : 0,
        tag: tagBatches.length > 0 ? Math.max(...tagBatches) + 1 : 0,
      });
    }
  };

  const loadCredentialsAndMembers = async () => {
    // Fetch members for lookup
    const { data: membersData } = await supabase
      .from('members')
      .select('member_id, name, role, belt, branch, phone, photo_url')
      .eq('is_deleted', false);

    const membersMap = new Map<string, any>();
    if (membersData) {
      membersData.forEach((m) => membersMap.set(m.member_id, m));
      setMembers(membersData as AssignableMember[]);
    }

    // Fetch credentials with batch and assignments
    const { data: credsData } = await supabase
      .from('credentials')
      .select(`
        id,
        type,
        token,
        status,
        batch_id,
        physical_uid,
        rejection_reason,
        created_at,
        credential_batches (
          id,
          batch_number,
          type,
          created_at
        ),
        credential_assignments (
          id,
          member_id,
          assigned_at,
          unassigned_at
        )
      `)
      .order('created_at', { ascending: false });

    if (credsData) {
      const formattedCreds: CredentialDetailItem[] = (credsData as unknown as RawCredential[]).map((c) => {
        const activeAssignment = c.credential_assignments?.find((a) => !a.unassigned_at);
        let assignedMember = null;

        if (activeAssignment?.member_id) {
          const memberObj = membersMap.get(activeAssignment.member_id);
          assignedMember = {
            member_id: activeAssignment.member_id,
            name: memberObj?.name || 'Member',
            role: memberObj?.role || 'student',
            belt: memberObj?.belt || 'White',
            branch: memberObj?.branch || 'HQ',
            photo_url: memberObj?.photo_url || null,
            assigned_at: activeAssignment.assigned_at,
            assignment_id: activeAssignment.id,
          };
        }

        return {
          id: c.id,
          type: c.type,
          token: c.token,
          status: c.status,
          batch_id: c.batch_id,
          batch_number: c.credential_batches?.batch_number ?? null,
          physical_uid: c.physical_uid,
          rejection_reason: c.rejection_reason,
          created_at: c.created_at,
          assignedMember,
        };
      });

      setCredentials(formattedCreds);

      // Compute statistics
      const qrcAll = formattedCreds.filter((c) => c.type === 'qrc');
      const tagAll = formattedCreds.filter((c) => c.type === 'tag');

      const freeQrc = qrcAll.filter((c) => c.status === 'free').length;
      const assignedQrc = qrcAll.filter((c) => c.status === 'assigned').length;
      const freeTag = tagAll.filter((c) => c.status === 'free').length;
      const assignedTag = tagAll.filter((c) => c.status === 'assigned').length;

      setStats({
        qrc: qrcAll.length,
        tag: tagAll.length,
        freeQrc,
        freeTag,
        assignedQrc,
        assignedTag,
        totalAssigned: assignedQrc + assignedTag,
        totalFree: freeQrc + freeTag,
      });
    }
  };

  const loadAssignmentAuditLogs = async () => {
    const { data: logsData } = await supabase
      .from('credential_assignments')
      .select(`
        id,
        credential_id,
        member_id,
        assigned_by,
        assigned_at,
        unassigned_at,
        created_at,
        credentials (
          token,
          type
        ),
        members (
          member_id,
          name,
          belt,
          branch,
          photo_url
        )
      `)
      .order('assigned_at', { ascending: false });

    if (logsData) {
      const records: AssignmentRecord[] = logsData.map((l: any) => ({
        id: l.id,
        credential_id: l.credential_id,
        member_id: l.member_id,
        assigned_by: l.assigned_by,
        assigned_at: l.assigned_at,
        unassigned_at: l.unassigned_at,
        created_at: l.created_at,
        credentialToken: l.credentials?.token || 'UNKNOWN',
        credentialType: l.credentials?.type || 'qrc',
        memberName: l.members?.name || 'Member',
        memberBelt: l.members?.belt || 'White',
        memberBranch: l.members?.branch || 'HQ',
        memberPhoto: l.members?.photo_url || null,
      }));
      setAssignmentLogs(records);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStatsAndBatches(), loadCredentialsAndMembers(), loadAssignmentAuditLogs()]);
    setRefreshing(false);
  };

  // Generate QR Batch
  const handleGenerateQRCBatch = async (mode: 'pdf' | 'zip') => {
    if (mode === 'pdf') setGeneratingQrcPdf(true);
    else setGeneratingQrcZip(true);

    const batchNum = nextBatchNumber.qrc;
    const batchInfo = calculateBatchTokens(batchNum);

    const { data: batch, error: batchErr } = await supabase
      .from('credential_batches')
      .insert({
        batch_number: batchNum,
        type: 'qrc',
        quantity: BATCH_SIZE,
        start_token: batchInfo.startToken,
        end_token: batchInfo.endToken,
      })
      .select()
      .single();

    if (batchErr || !batch) {
      alert('Failed to generate batch: ' + batchErr?.message);
      setGeneratingQrcPdf(false);
      setGeneratingQrcZip(false);
      return;
    }

    const creds = batchInfo.tokens.map((t) => ({
      batch_id: batch.id,
      type: 'qrc',
      token: t,
      status: 'free',
    }));

    await supabase.from('credentials').insert(creds);

    try {
      if (mode === 'pdf') {
        const pdfBlob = await generateQrBatchPdf(batchInfo.tokens, batchNum, CANONICAL_CREDENTIAL_BASE_URL);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrc-batch-${batchNum.toString().padStart(5, '0')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const zipBlob = await generateQrBatchZip(batchInfo.tokens, batchNum, CANONICAL_CREDENTIAL_BASE_URL);
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qrc-batch-${batchNum.toString().padStart(5, '0')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
      alert('Batch created in database, but automatic download failed. You can re-download it from the Batches list.');
    }

    await loadAllData();
    setGeneratingQrcPdf(false);
    setGeneratingQrcZip(false);
  };

  // Generate NFC Tag Batch
  const handleGenerateTagBatch = async () => {
    setGeneratingTagBatch(true);
    const batchNum = nextBatchNumber.tag;
    const batchInfo = calculateBatchTokens(batchNum);

    const { data: batch, error: batchErr } = await supabase
      .from('credential_batches')
      .insert({
        batch_number: batchNum,
        type: 'tag',
        quantity: BATCH_SIZE,
        start_token: batchInfo.startToken,
        end_token: batchInfo.endToken,
      })
      .select()
      .single();

    if (batchErr || !batch) {
      alert('Failed to generate NFC batch: ' + batchErr?.message);
      setGeneratingTagBatch(false);
      return;
    }

    const creds = batchInfo.tokens.map((t) => ({
      batch_id: batch.id,
      type: 'tag',
      token: t,
      status: 'free',
    }));

    await supabase.from('credentials').insert(creds);

    try {
      const csvContent = exportBatchCsv('tag', batchInfo.tokens, batchNum, CANONICAL_CREDENTIAL_BASE_URL);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tag-batch-${batchNum.toString().padStart(5, '0')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }

    await loadAllData();
    setGeneratingTagBatch(false);
  };

  // Unassign credential
  const handleUnassignCredential = async (credId: string) => {
    await supabase
      .from('credential_assignments')
      .update({ unassigned_at: new Date().toISOString() })
      .eq('credential_id', credId)
      .is('unassigned_at', null);

    await supabase
      .from('credentials')
      .update({ status: 'free' })
      .eq('id', credId);

    setSelectedCredential(null);
    await loadAllData();
  };

  // Retire credential with reason
  const handleRetireCredential = async (credId: string, reason: string) => {
    await supabase
      .from('credentials')
      .update({ status: 'deleted', rejection_reason: reason })
      .eq('id', credId);

    await supabase
      .from('credential_assignments')
      .update({ unassigned_at: new Date().toISOString() })
      .eq('credential_id', credId)
      .is('unassigned_at', null);

    setSelectedCredential(null);
    await loadAllData();
  };

  // Restore credential to available
  const handleRestoreCredential = async (credId: string) => {
    await supabase
      .from('credentials')
      .update({ status: 'free', rejection_reason: null })
      .eq('id', credId);

    setSelectedCredential(null);
    await loadAllData();
  };

  // Update physical UID
  const handleUpdatePhysicalUid = async (credId: string, uid: string) => {
    await supabase
      .from('credentials')
      .update({ physical_uid: uid || null })
      .eq('id', credId);

    await loadAllData();
  };

  // Delete single unassigned credential
  const handleDeleteCredential = async (credId: string) => {
    await supabase.from('credentials').delete().eq('id', credId);
    await loadAllData();
  };

  // Delete batch (only if 0 active assignments)
  const handleDeleteBatch = async (batch: BatchData) => {
    const batchItems = credentials.filter(
      (c) => c.batch_id === batch.id || c.batch_number === batch.batch_number
    );
    const assignedCount = batchItems.filter((i) => i.status === 'assigned').length;

    if (assignedCount > 0) {
      alert(`Cannot delete Batch #${batch.batch_number}: ${assignedCount} credentials in this batch are currently assigned to members. Please unassign them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete Batch #${batch.batch_number} and all its ${batchItems.length} credentials? This cannot be undone.`)) {
      return;
    }

    // 1. Delete credentials
    await supabase.from('credentials').delete().eq('batch_id', batch.id);
    // 2. Delete batch record
    await supabase.from('credential_batches').delete().eq('id', batch.id);

    await loadAllData();
  };

  const handleCopyLink = (type: 'qrc' | 'tag', token: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = buildCredentialUrl(type, token, CANONICAL_CREDENTIAL_BASE_URL);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Selected batch items lookup for review modal
  const selectedBatchItems = useMemo(() => {
    if (!reviewingBatch) return [];
    return credentials
      .filter((c) => c.batch_id === reviewingBatch.id || c.batch_number === reviewingBatch.batch_number)
      .sort((a, b) => a.token.localeCompare(b.token));
  }, [credentials, reviewingBatch]);

  // Filtered inventory credentials
  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (batchFilter !== 'all' && c.batch_number?.toString() !== batchFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesToken = c.token.toLowerCase().includes(q);
        const matchesMember = c.assignedMember?.name.toLowerCase().includes(q) || false;
        const matchesMemberId = c.assignedMember?.member_id.toLowerCase().includes(q) || false;
        const matchesUid = c.physical_uid?.toLowerCase().includes(q) || false;
        if (!matchesToken && !matchesMember && !matchesMemberId && !matchesUid) return false;
      }

      return true;
    });
  }, [credentials, typeFilter, statusFilter, batchFilter, searchQuery]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            Credentials Hub
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-mono font-bold tracking-widest">
              CROCKFORD BASE32
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Generate, inspect, provision, and assign physical QR Badges and NFC wristbands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRegisterModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-wider rounded-xl text-xs transition-all shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Single / VIP Token
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* QR Badges */}
        <div className="glass-card p-6 border-white/5 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-2xl rounded-full -z-10 group-hover:bg-primary/20 transition-all" />
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h3 className="font-bold uppercase tracking-wider text-xs">QR Badges</h3>
            </div>
            <span className="text-xs font-mono font-bold text-white/50">{stats.qrc} Total</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{stats.qrc}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-green-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {stats.freeQrc} Available
            </span>
            <span className="text-blue-400 font-bold">{stats.assignedQrc} Assigned</span>
          </div>
        </div>

        {/* NFC Tags */}
        <div className="glass-card p-6 border-white/5 space-y-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-2xl rounded-full -z-10 group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold uppercase tracking-wider text-xs">NFC Wristbands</h3>
            </div>
            <span className="text-xs font-mono font-bold text-white/50">{stats.tag} Total</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{stats.tag}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
            <span className="text-green-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {stats.freeTag} Available
            </span>
            <span className="text-blue-400 font-bold">{stats.assignedTag} Assigned</span>
          </div>
        </div>

        {/* Total Assigned */}
        <div className="glass-card p-6 border-white/5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Active on Members</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-blue-400">{stats.totalAssigned}</span>
            <span className="text-xs text-muted-foreground">
              of {stats.qrc + stats.tag} issued (
              {stats.qrc + stats.tag > 0 ? Math.round((stats.totalAssigned / (stats.qrc + stats.tag)) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{
                width: `${stats.qrc + stats.tag > 0 ? (stats.totalAssigned / (stats.qrc + stats.tag)) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Free Inventory */}
        <div className="glass-card p-6 border-white/5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-400" />
              <h3 className="font-bold uppercase tracking-wider text-xs">Available Stock</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-green-400">{stats.totalFree}</span>
            <span className="text-xs text-muted-foreground">ready to assign</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.freeQrc} QR stickers &bull; {stats.freeTag} NFC chips
          </p>
        </div>
      </div>

      {/* Generation Factories Grid (QR Factory & NFC Factory) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Factory Card */}
        <div className="glass-card p-6 border-white/5 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -z-10" />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-primary">
              <div className="bg-primary/20 p-3 rounded-2xl">
                <QrCode className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">QR Badge Factory</h3>
                <p className="text-xs text-muted-foreground">
                  32 badges per batch • Calibrated A4 layout (Zero cutoff on print)
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Batch:</span>
                <strong className="text-white font-bold">#{nextBatchNumber.qrc.toString().padStart(5, '0')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Size:</span>
                <span className="text-white">32 Badges (4 columns × 8 rows)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleGenerateQRCBatch('pdf')}
              disabled={generatingQrcPdf || generatingQrcZip}
              className="py-3.5 px-4 bg-primary text-primary-foreground font-black uppercase tracking-wider text-xs rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {generatingQrcPdf ? 'Generating PDF...' : 'Generate & Download PDF'}
            </button>

            <button
              onClick={() => handleGenerateQRCBatch('zip')}
              disabled={generatingQrcPdf || generatingQrcZip}
              className="py-3.5 px-4 bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/5"
              title="Generates batch and downloads ZIP with interactive index.html viewer, SVGs, PNGs, and CSV manifest"
            >
              <FolderArchive className="w-4 h-4 text-primary" />
              {generatingQrcZip ? 'Packing ZIP...' : 'Generate & Download ZIP'}
            </button>
          </div>
        </div>

        {/* NFC Factory Card */}
        <div className="glass-card p-6 border-white/5 flex flex-col justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -z-10" />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-400">
              <div className="bg-blue-500/20 p-3 rounded-2xl">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-white">NFC Tag Factory &amp; Provisioner</h3>
                <p className="text-xs text-muted-foreground">
                  Generate batches of 32 NFC tokens, export CSV for encoders, or write live tags.
                </p>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Batch:</span>
                <strong className="text-white font-bold">#{nextBatchNumber.tag.toString().padStart(5, '0')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Size:</span>
                <span className="text-white">32 NFC Tags</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGenerateTagBatch}
              disabled={generatingTagBatch}
              className="py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              title="Generate batch of 32 NFC tags and download CSV manifest for RFID writers"
            >
              <Plus className="w-4 h-4" />
              {generatingTagBatch ? 'Generating Batch...' : 'Generate Batch of 32 Tags'}
            </button>

            <button
              onClick={() => setNfcModalOpen(true)}
              className="py-3.5 px-4 bg-white/10 hover:bg-white/15 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
            >
              <Radio className="w-4 h-4 text-blue-400" />
              Launch Web NFC Tool
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Section Tabs: 3 Dedicated Tables */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
            {/* Table 1: Batches */}
            <button
              onClick={() => setActiveTab('batches')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'batches'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Batches Table ({batches.length})
            </button>

            {/* Table 2: Credentials Inventory */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'inventory'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              Credentials Inventory ({credentials.length})
            </button>

            {/* Table 3: Assignment Audit Log */}
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'history'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              Assignment Audit Log ({assignmentLogs.length})
            </button>
          </div>

          {activeTab === 'batches' && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setBatchViewMode('cards')}
                className={`p-1.5 rounded transition-colors ${batchViewMode === 'cards' ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white'}`}
                title="Grid Card View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setBatchViewMode('table')}
                className={`p-1.5 rounded transition-colors ${batchViewMode === 'table' ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white'}`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {loading && (
          <div className="glass-card p-6 flex items-center justify-center gap-3 text-muted-foreground animate-pulse text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Loading credentials inventory &amp; batch history...</span>
          </div>
        )}

        {/* TAB 1: BATCHES TABLE & REVIEW */}
        {activeTab === 'batches' && !loading && (
          <div className="space-y-4">
            {batches.length === 0 ? (
              <div className="glass-card p-12 text-center text-muted-foreground space-y-3">
                <Layers className="w-12 h-12 mx-auto opacity-30 text-primary" />
                <h4 className="text-base font-bold text-white uppercase tracking-wider">No batches generated yet</h4>
                <p className="text-xs max-w-sm mx-auto">
                  Click &quot;Generate &amp; Download PDF&quot; or &quot;Generate Batch of 32 Tags&quot; above to create your first batch!
                </p>
              </div>
            ) : batchViewMode === 'table' ? (
              /* Batches Table View */
              <div className="glass-card border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <th className="py-3.5 px-4">Batch Number</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Token Range</th>
                        <th className="py-3.5 px-4">Quantity</th>
                        <th className="py-3.5 px-4">Status &amp; Assignment</th>
                        <th className="py-3.5 px-4">Created Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-mono">
                      {batches.map((batch) => {
                        const batchItems = credentials.filter(
                          (c) => c.batch_id === batch.id || c.batch_number === batch.batch_number
                        );
                        const assignedCount = batchItems.filter((i) => i.status === 'assigned').length;
                        const freeCount = batchItems.filter((i) => i.status === 'free').length;
                        const assignedPercent = Math.round((assignedCount / (batchItems.length || 32)) * 100);

                        return (
                          <tr key={batch.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-bold text-white text-sm">
                              #{batch.batch_number.toString().padStart(5, '0')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                batch.type === 'qrc'
                                  ? 'bg-primary/20 text-primary border border-primary/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}>
                                {batch.type === 'qrc' ? <QrCode className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                                {batch.type === 'qrc' ? 'QR Badge' : 'NFC Tag'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {batch.start_token} &rarr; {batch.end_token}
                            </td>
                            <td className="py-3 px-4 text-white">
                              {batch.quantity || 32} Items
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px]">
                                  <span className="text-green-400 font-bold">{freeCount} Free</span>
                                  <span className="text-blue-400 font-bold">{assignedCount} Assigned ({assignedPercent}%)</span>
                                </div>
                                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full"
                                    style={{ width: `${assignedPercent}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground font-sans">
                              {new Date(batch.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setReviewingBatch(batch)}
                                  className="px-2.5 py-1 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" /> Review
                                </button>
                                {batch.type === 'qrc' ? (
                                  <>
                                    <button
                                      onClick={async () => {
                                        const tokens = batchItems.map((i) => i.token);
                                        const blob = await generateQrBatchPdf(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.pdf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      }}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                                      title="Download PDF"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const tokens = batchItems.map((i) => i.token);
                                        const blob = await generateQrBatchZip(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.zip`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      }}
                                      className="p-1.5 bg-white/5 hover:bg-white/10 text-primary rounded-lg transition-colors"
                                      title="Download ZIP with index.html viewer"
                                    >
                                      <FolderArchive className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const tokens = batchItems.map((i) => i.token);
                                      const csvContent = exportBatchCsv('tag', tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `tag-batch-${batch.batch_number.toString().padStart(5, '0')}.csv`;
                                      document.body.appendChild(a);
                                      a.click();
                                      document.body.removeChild(a);
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-green-400 rounded-lg transition-colors"
                                    title="Export CSV"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteBatch(batch)}
                                  className="p-1.5 bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded-lg transition-colors"
                                  title="Delete Batch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Batches Card Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batches.map((batch) => {
                  const batchItems = credentials.filter(
                    (c) => c.batch_id === batch.id || c.batch_number === batch.batch_number
                  );
                  const assignedCount = batchItems.filter((i) => i.status === 'assigned').length;
                  const freeCount = batchItems.filter((i) => i.status === 'free').length;
                  const assignedPercent = Math.round((assignedCount / (batchItems.length || 32)) * 100);

                  return (
                    <div
                      key={batch.id}
                      className="glass-card p-5 border-white/5 flex flex-col justify-between gap-4 hover:border-white/20 transition-all group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            batch.type === 'qrc'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {batch.type === 'qrc' ? <QrCode className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                            {batch.type === 'qrc' ? 'QR Batch' : 'NFC Tag Batch'}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {new Date(batch.created_at).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => handleDeleteBatch(batch)}
                              className="p-1 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded transition-colors"
                              title="Delete batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xl font-black font-mono text-white group-hover:text-primary transition-colors">
                            Batch #{batch.batch_number.toString().padStart(5, '0')}
                          </h4>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            Tokens: {batch.start_token} &rarr; {batch.end_token}
                          </p>
                        </div>

                        {/* Progress Bar of Assigned */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-green-400 font-bold">{freeCount} Available</span>
                            <span className="text-blue-400 font-bold">{assignedCount} Assigned ({assignedPercent}%)</span>
                          </div>
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-primary rounded-full transition-all duration-500"
                              style={{ width: `${assignedPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <button
                          onClick={() => setReviewingBatch(batch)}
                          className="w-full py-2.5 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review 32 Items
                        </button>

                        <div className="flex items-center gap-2">
                          {batch.type === 'qrc' ? (
                            <>
                              <button
                                onClick={async () => {
                                  const tokens = batchItems.map((i) => i.token);
                                  const blob = await generateQrBatchPdf(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5"
                                title="Download PDF sticker sheet"
                              >
                                <Download className="w-3 h-3" /> PDF
                              </button>
                              <button
                                onClick={async () => {
                                  const tokens = batchItems.map((i) => i.token);
                                  const blob = await generateQrBatchZip(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.zip`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                }}
                                className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5"
                                title="Download ZIP package with index.html viewer"
                              >
                                <FolderArchive className="w-3 h-3 text-primary" /> ZIP
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                const tokens = batchItems.map((i) => i.token);
                                const csvContent = exportBatchCsv('tag', tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `tag-batch-${batch.batch_number.toString().padStart(5, '0')}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 border border-white/5"
                            >
                              <FileSpreadsheet className="w-3 h-3 text-green-400" /> Export CSV
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL CREDENTIALS INVENTORY TABLE */}
        {activeTab === 'inventory' && !loading && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="glass-card p-4 border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by token, member name, ID, or physical chip UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-primary/50 text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="qrc">QR Badges</option>
                  <option value="tag">NFC Tags</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="free">Available (Unassigned)</option>
                  <option value="assigned">Assigned</option>
                  <option value="deleted">Retired</option>
                </select>

                {/* Batch Filter */}
                <select
                  value={batchFilter}
                  onChange={(e) => setBatchFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                >
                  <option value="all">All Batches</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.batch_number.toString()}>
                      Batch #{b.batch_number.toString().padStart(5, '0')} ({b.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="glass-card border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      <th className="py-3.5 px-4">Credential Token</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Physical Chip UID</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Assigned Member</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-mono">
                    {filteredCredentials.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground font-sans">
                          No credentials match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredCredentials.map((cred) => {
                        const isAssigned = cred.status === 'assigned';
                        const isDeleted = cred.status === 'deleted';

                        return (
                          <tr
                            key={cred.id}
                            className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                            onClick={() => setSelectedCredential(cred)}
                          >
                            {/* Token */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-white text-sm tracking-widest group-hover:text-primary transition-colors">
                                {cred.token}
                              </span>
                            </td>

                            {/* Type */}
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                cred.type === 'qrc'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {cred.type === 'qrc' ? <QrCode className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                                {cred.type === 'qrc' ? 'QR Badge' : 'NFC Tag'}
                              </span>
                            </td>

                            {/* Batch Number */}
                            <td className="py-3 px-4 text-muted-foreground">
                              {cred.batch_number !== null && cred.batch_number !== undefined
                                ? `#${cred.batch_number.toString().padStart(5, '0')}`
                                : 'VIP / Manual'}
                            </td>

                            {/* Physical Chip UID */}
                            <td className="py-3 px-4">
                              {cred.physical_uid ? (
                                <span className="text-blue-400 font-bold text-[11px] truncate max-w-[120px] block" title={cred.physical_uid}>
                                  {cred.physical_uid}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {isAssigned ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  Assigned
                                </span>
                              ) : isDeleted ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-bold text-[10px]" title={cred.rejection_reason || 'Retired'}>
                                  Retired {cred.rejection_reason && `(${cred.rejection_reason})`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-bold text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Available
                                </span>
                              )}
                            </td>

                            {/* Assigned Member */}
                            <td className="py-3 px-4 font-sans">
                              {cred.assignedMember ? (
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`/member/${cred.assignedMember.member_id}`}
                                    onClick={(e) => e.stopPropagation()}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-white hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[180px]"
                                  >
                                    {cred.assignedMember.name}
                                    <ExternalLink className="w-3 h-3 opacity-50" />
                                  </a>
                                  <span className="font-mono text-[10px] text-primary font-bold">
                                    {cred.assignedMember.member_id}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs italic font-sans">
                                  Unassigned — Ready
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => handleCopyLink(cred.type, cred.token, e)}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                                  title="Copy Canonical URL"
                                >
                                  {copiedToken === cred.token ? (
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {isAssigned ? (
                                  <button
                                    onClick={() => handleUnassignCredential(cred.id)}
                                    className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Unassign
                                  </button>
                                ) : !isDeleted ? (
                                  <button
                                    onClick={() => setAssigningCredential(cred)}
                                    className="px-2.5 py-1 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Assign
                                  </button>
                                ) : null}

                                <button
                                  onClick={() => setSelectedCredential(cred)}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                                  title="Inspect details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASSIGNMENT AUDIT LOG TABLE */}
        {activeTab === 'history' && !loading && (
          <AssignmentHistoryTable
            assignments={assignmentLogs}
            onUnassign={async (credId) => {
              await handleUnassignCredential(credId);
            }}
          />
        )}
      </div>

      {/* Batch Review Modal */}
      <BatchReviewModal
        batch={reviewingBatch}
        items={selectedBatchItems as BatchItem[]}
        isOpen={Boolean(reviewingBatch)}
        onClose={() => setReviewingBatch(null)}
        onSelectCredential={(item) => {
          const found = credentials.find((c) => c.id === item.id);
          if (found) setSelectedCredential(found);
        }}
      />

      {/* Credential Detail Modal */}
      <CredentialDetailModal
        credential={selectedCredential}
        isOpen={Boolean(selectedCredential)}
        onClose={() => setSelectedCredential(null)}
        onAssignToMember={(cred) => {
          setSelectedCredential(null);
          setAssigningCredential(cred);
        }}
        onUnassign={handleUnassignCredential}
        onRetire={handleRetireCredential}
        onRestore={handleRestoreCredential}
        onUpdatePhysicalUid={handleUpdatePhysicalUid}
        onDeleteCredential={handleDeleteCredential}
      />

      {/* Assign Member Modal */}
      <AssignMemberModal
        credential={assigningCredential}
        members={members}
        isOpen={Boolean(assigningCredential)}
        onClose={() => setAssigningCredential(null)}
        onAssigned={loadAllData}
      />

      {/* Register Single / VIP Credential Modal */}
      <RegisterCredentialModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onCreated={loadAllData}
      />

      {/* NFC Provisioner Modal */}
      <NfcProvisionerModal
        isOpen={nfcModalOpen}
        onClose={() => {
          setNfcModalOpen(false);
          loadAllData();
        }}
      />
    </div>
  );
}
