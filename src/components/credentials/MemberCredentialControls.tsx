import { useState, useEffect } from 'react';
import { 
  QrCode, Radio, Trash2, Edit2, Check, X, Plus, Search, 
  ShieldAlert, Loader2, ExternalLink, Smartphone, AlertCircle, CheckCircle2,
  Copy 
} from 'lucide-react';
import { supabase } from '#/lib/supabase';
import { normalizeCrockford } from '#/lib/crockford';
import { formatAndValidateHexUid, autoFormatHexInput } from '#/lib/uidFormatter';
import { buildCredentialUrl } from '#/lib/credentialToken';
import { Scanner } from '@yudiel/react-qr-scanner';

export interface MemberCredentialItem {
  id: string;              // credentials.id (UUID)
  assignmentId: string;    // credential_assignments.id (UUID)
  token: string;           // 6-char Crockford Base32
  type: 'qrc' | 'tag';
  status: 'free' | 'assigned' | 'deleted';
  physical_uid: string | null; // e.g. "04:A3:2B:1C:88:5D:80"
  assigned_at: string;
}

export interface MemberCredentialControlsProps {
  memberId: string;
  memberName: string;
  assignedQrcs: MemberCredentialItem[];
  assignedTags: MemberCredentialItem[];
  onChanged: () => void;
}

export function MemberCredentialControls({
  memberId,
  memberName,
  assignedQrcs,
  assignedTags,
  onChanged,
}: MemberCredentialControlsProps) {
  // Linking Drawer State: null | 'qrc' | 'tag'
  const [activeLinkType, setActiveLinkType] = useState<'qrc' | 'tag' | null>(null);

  // QR Link Tabs: 'free' | 'camera' | 'manual'
  const [qrTab, setQrTab] = useState<'free' | 'camera' | 'manual'>('free');
  // NFC Link Tabs: 'free' | 'webnfc' | 'manual'
  const [nfcTab, setNfcTab] = useState<'free' | 'webnfc' | 'manual'>('free');

  // Inventory & Free tokens state
  const [freeTokens, setFreeTokens] = useState<{ id: string; token: string; type: string }[]>([]);
  const [loadingFree, setLoadingFree] = useState(false);
  const [freeSearch, setFreeSearch] = useState('');

  // Selected or typed inputs
  const [selectedFreeToken, setSelectedFreeToken] = useState('');
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [physicalUidInput, setPhysicalUidInput] = useState('');

  // Inline UID Edit State
  const [editingCredId, setEditingCredId] = useState<string | null>(null);
  const [editUidValue, setEditUidValue] = useState('');
  const [savingInlineUid, setSavingInlineUid] = useState(false);

  // Unlink Audit Modal State
  const [unlinkingCred, setUnlinkingCred] = useState<MemberCredentialItem | null>(null);
  const [unlinkingLoading, setUnlinkingLoading] = useState(false);

  // Feedback & Processing State
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Web NFC State
  const [hasWebNFC, setHasWebNFC] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);

  // Copied URL feedback
  const [copiedTokenKey, setCopiedTokenKey] = useState<string | null>(null);

  const handleCopyUrl = (type: 'qrc' | 'tag', token: string) => {
    const url = buildCredentialUrl(type, token);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      const key = `${type}-${token}`;
      setCopiedTokenKey(key);
      setTimeout(() => {
        setCopiedTokenKey((prev) => (prev === key ? null : prev));
      }, 2000);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasWebNFC(true);
    }
  }, []);

  // Fetch free credentials when link drawer opens
  useEffect(() => {
    if (!activeLinkType) return;
    loadFreeCredentials(activeLinkType);
    setErrorMessage(null);
    setSuccessMessage(null);
    setManualTokenInput('');
    setPhysicalUidInput('');
    setSelectedFreeToken('');
  }, [activeLinkType]);

  const loadFreeCredentials = async (type: 'qrc' | 'tag') => {
    setLoadingFree(true);
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('id, token, type')
        .eq('type', type)
        .eq('status', 'free')
        .order('token', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading free credentials:', error);
      } else {
        setFreeTokens(data || []);
        if (data && data.length > 0) {
          setSelectedFreeToken(data[0].token);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFree(false);
    }
  };

  // Central Anti-Hijack Guard & Assignment Executor
  const executeAssignment = async (
    tokenCandidate: string,
    type: 'qrc' | 'tag',
    physicalUid?: string | null
  ) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const { valid, normalized, error: crockfordErr } = normalizeCrockford(tokenCandidate);
    if (!valid || normalized.length !== 6) {
      setErrorMessage(crockfordErr || 'Token must be a valid 6-character Crockford Base32 code.');
      return;
    }

    // Validate Physical UID if provided for NFC Tag
    let formattedUid: string | null = null;
    if (type === 'tag' && physicalUid && physicalUid.trim()) {
      const uidCheck = formatAndValidateHexUid(physicalUid);
      if (!uidCheck.valid) {
        setErrorMessage(uidCheck.error || 'Invalid Physical Hex UID.');
        return;
      }
      formattedUid = uidCheck.formatted;
    }

    setProcessing(true);

    try {
      // 1. Strict Inventory Check
      const { data: cred, error: credErr } = await supabase
        .from('credentials')
        .select('id, token, type, status, physical_uid')
        .eq('token', normalized)
        .eq('type', type)
        .maybeSingle();

      if (credErr || !cred) {
        setErrorMessage('Token not found in inventory. Please generate or register it in Credentials Hub first.');
        setProcessing(false);
        return;
      }

      // 2. Anti-Hijack Guard: Check if actively assigned to another member
      const { data: activeAssign } = await supabase
        .from('credential_assignments')
        .select('id, member_id, members(name, member_id)')
        .eq('credential_id', cred.id)
        .is('unassigned_at', null)
        .maybeSingle();

      if (activeAssign) {
        const assignedToName = (activeAssign.members as any)?.name || 'another member';
        const assignedToId = (activeAssign.members as any)?.member_id || activeAssign.member_id;
        
        if (assignedToId === memberId) {
          setErrorMessage(`Token [${normalized}] is already linked to this member (${memberName}).`);
        } else {
          setErrorMessage(`Token [${normalized}] is already assigned to ${assignedToName} (${assignedToId}). Unlink it from their profile first.`);
        }
        setProcessing(false);
        return;
      }

      // 3. Update Credential Status & Physical UID
      const credUpdatePayload: { status: string; physical_uid?: string | null } = {
        status: 'assigned',
      };
      if (formattedUid) {
        credUpdatePayload.physical_uid = formattedUid;
      }

      const { error: updErr } = await supabase
        .from('credentials')
        .update(credUpdatePayload)
        .eq('id', cred.id);

      if (updErr) {
        setErrorMessage(`Failed to update credential: ${updErr.message}`);
        setProcessing(false);
        return;
      }

      // 4. Insert active assignment
      const { error: insErr } = await supabase
        .from('credential_assignments')
        .insert({
          credential_id: cred.id,
          member_id: memberId,
          assigned_at: new Date().toISOString(),
        });

      if (insErr) {
        setErrorMessage(`Failed to assign credential to member: ${insErr.message}`);
        setProcessing(false);
        return;
      }

      // Success
      setSuccessMessage(`Successfully linked ${type === 'qrc' ? 'QR Badge' : 'NFC Tag'} [${normalized}] to ${memberName}!`);
      setActiveLinkType(null);
      setManualTokenInput('');
      setPhysicalUidInput('');
      onChanged();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during credential linking.');
    } finally {
      setProcessing(false);
    }
  };

  // Inline UID Save
  const handleSaveInlineUid = async (credId: string) => {
    if (!editUidValue.trim()) {
      setErrorMessage('Physical UID cannot be empty.');
      return;
    }

    const check = formatAndValidateHexUid(editUidValue);
    if (!check.valid) {
      setErrorMessage(check.error || 'Invalid Physical Hex UID format.');
      return;
    }

    setSavingInlineUid(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase
        .from('credentials')
        .update({ physical_uid: check.formatted })
        .eq('id', credId);

      if (error) {
        setErrorMessage(`Failed to update UID: ${error.message}`);
      } else {
        setEditingCredId(null);
        setEditUidValue('');
        onChanged();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating Physical UID.');
    } finally {
      setSavingInlineUid(false);
    }
  };

  // Unlink Credential with Audit Action
  const handleConfirmUnlink = async (action: 'free' | 'retire') => {
    if (!unlinkingCred) return;

    setUnlinkingLoading(true);
    setErrorMessage(null);

    try {
      // 1. Close active assignment
      const { error: closeErr } = await supabase
        .from('credential_assignments')
        .update({ unassigned_at: new Date().toISOString() })
        .eq('id', unlinkingCred.assignmentId);

      if (closeErr) {
        setErrorMessage(`Error closing assignment: ${closeErr.message}`);
        setUnlinkingLoading(false);
        return;
      }

      // 2. Update Credential Status
      if (action === 'free') {
        await supabase
          .from('credentials')
          .update({ status: 'free' })
          .eq('id', unlinkingCred.id);
      } else {
        await supabase
          .from('credentials')
          .update({ status: 'deleted', rejection_reason: 'damaged/lost' })
          .eq('id', unlinkingCred.id);
      }

      setSuccessMessage(`Successfully unlinked token [${unlinkingCred.token}] (${action === 'free' ? 'returned to free lot' : 'retired as damaged/lost'}).`);
      setUnlinkingCred(null);
      onChanged();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error unlinking credential.');
    } finally {
      setUnlinkingLoading(false);
    }
  };

  // Web NFC Tag Provision & Read
  const handleWebNfcTap = async () => {
    if (!selectedFreeToken) {
      setErrorMessage('Please select a free tag token first.');
      return;
    }

    try {
      setNfcScanning(true);
      setErrorMessage(null);

      const targetUrl = buildCredentialUrl('tag', selectedFreeToken);
      const ndef = new (window as any).NDEFReader();

      // Start scan to read serial number
      await ndef.scan();
      ndef.onreading = async (event: any) => {
        const serial = event.serialNumber;
        if (serial) {
          const autoFormatted = autoFormatHexInput(serial);
          setPhysicalUidInput(autoFormatted);
        }
      };

      // Write target URL to tag
      await ndef.write({
        records: [{ recordType: 'url', data: targetUrl }]
      });

      // Execute assignment
      await executeAssignment(selectedFreeToken, 'tag', physicalUidInput || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'NFC write operation cancelled or failed.');
    } finally {
      setNfcScanning(false);
    }
  };

  const filteredFreeTokens = freeTokens.filter(t => 
    t.token.toLowerCase().includes(freeSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Global Alerts inside Controls */}
      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-red-400/70 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessMessage(null)} 
            className="text-emerald-400/70 hover:text-emerald-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ACTIVE CREDENTIALS SECTION */}
      <div className="space-y-4">
        {/* QR Badges Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Assigned QR Badges ({assignedQrcs.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveLinkType(activeLinkType === 'qrc' ? null : 'qrc')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                activeLinkType === 'qrc'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Link QR Badge
            </button>
          </div>

          {assignedQrcs.length === 0 ? (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-muted-foreground">
              No QR badges linked yet. Click "+ Link QR Badge" to assign one.
            </div>
          ) : (
            <div className="space-y-2">
              {assignedQrcs.map((badge) => (
                <div
                  key={badge.assignmentId}
                  className="p-3 rounded-xl bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary-light shrink-0">
                        <QrCode className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-mono text-sm font-black text-white tracking-widest">
                          {badge.token}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Active pass
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl('qrc', badge.token)}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                        title="Copy pass URL to clipboard"
                      >
                        {copiedTokenKey === `qrc-${badge.token}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                      <a
                        href={buildCredentialUrl('qrc', badge.token)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Preview QR Code Pass"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setUnlinkingCred(badge)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Unlink QR Badge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Pass URL Display */}
                  <div className="pt-1.5 border-t border-primary/10 flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-muted-foreground/80 shrink-0">Pass Link:</span>
                    <span className="text-primary-light font-bold truncate select-all">
                      {buildCredentialUrl('qrc', badge.token)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NFC Tags Header */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Assigned NFC Tags ({assignedTags.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveLinkType(activeLinkType === 'tag' ? null : 'tag')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                activeLinkType === 'tag'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Link NFC Tag
            </button>
          </div>

          {assignedTags.length === 0 ? (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center text-xs text-muted-foreground">
              No NFC tags linked yet. Click "+ Link NFC Tag" to assign a wristband or card.
            </div>
          ) : (
            <div className="space-y-2">
              {assignedTags.map((tag) => (
                <div
                  key={tag.assignmentId}
                  className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Radio className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-mono text-sm font-black text-white tracking-widest">
                          {tag.token}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          NFC Smart Tag
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCredId(editingCredId === tag.id ? null : tag.id);
                          setEditUidValue(tag.physical_uid || '');
                        }}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-blue-400" />
                        {editingCredId === tag.id ? 'Cancel' : 'Edit UID'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnlinkingCred(tag)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Unlink NFC Tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Physical Hardware UID Display & Inline Editor */}
                  {editingCredId === tag.id ? (
                    <div className="pt-2 border-t border-blue-500/10 flex items-center gap-2 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="UID (e.g. 04:A3:2B:1C:88:5D:80)"
                        value={editUidValue}
                        onChange={(e) => setEditUidValue(autoFormatHexInput(e.target.value))}
                        className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-1.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-blue-400"
                        maxLength={23}
                      />
                      <button
                        type="button"
                        disabled={savingInlineUid}
                        onClick={() => handleSaveInlineUid(tag.id)}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1"
                      >
                        {savingInlineUid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-blue-500/10 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground font-mono">Hardware UID:</span>
                      <span className="font-mono font-bold text-blue-300">
                        {tag.physical_uid || <em className="text-muted-foreground/60 not-italic">None recorded</em>}
                      </span>
                    </div>
                  )}

                  {/* Target URL Bar */}
                  <div className="pt-1.5 border-t border-blue-500/10 flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-muted-foreground/80 shrink-0">NFC Link:</span>
                    <span className="text-blue-300 font-bold truncate select-all flex-1 min-w-0">
                      {buildCredentialUrl('tag', tag.token)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl('tag', tag.token)}
                        className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors flex items-center gap-1 font-sans text-[10px] font-bold uppercase cursor-pointer"
                        title="Copy NFC URL"
                      >
                        {copiedTokenKey === `tag-${tag.token}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <a
                        href={buildCredentialUrl('tag', tag.token)}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                        title="Open NFC target URL"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER: LINK NEW QR BADGE                                                */}
      {/* ========================================================================= */}
      {activeLinkType === 'qrc' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/30 space-y-4 animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-center justify-between border-b border-primary/20 pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Link QR Badge to {memberName}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveLinkType(null)}
              className="p-1 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs: Free Lot | Camera Scan | Manual */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setQrTab('free')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                qrTab === 'free' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Free Lot
            </button>
            <button
              type="button"
              onClick={() => setQrTab('camera')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                qrTab === 'camera' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Scan Camera
            </button>
            <button
              type="button"
              onClick={() => setQrTab('manual')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                qrTab === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Enter Token
            </button>
          </div>

          {/* TAB 1: FREE LOT */}
          {qrTab === 'free' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter available free tokens..."
                  value={freeSearch}
                  onChange={(e) => setFreeSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {loadingFree ? (
                <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading free inventory...
                </div>
              ) : filteredFreeTokens.length === 0 ? (
                <div className="p-4 rounded-xl bg-white/5 text-center text-xs text-muted-foreground">
                  No free QR badges in inventory. Generate a new batch in Credentials Hub.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredFreeTokens.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={processing}
                      onClick={() => executeAssignment(item.token, 'qrc')}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all flex items-center justify-between group cursor-pointer text-left"
                    >
                      <span className="font-mono text-xs font-bold text-white tracking-widest">
                        {item.token}
                      </span>
                      <span className="text-[10px] uppercase font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Assign
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAMERA SCANNER */}
          {qrTab === 'camera' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Point your camera at the physical badge QR code. It will be verified and linked instantly.
              </p>
              <div className="overflow-hidden rounded-2xl border border-white/20 aspect-video max-w-sm mx-auto bg-black relative">
                <Scanner
                  onScan={(detectedCodes) => {
                    const raw = detectedCodes[0]?.rawValue;
                    if (raw && !processing) {
                      // Parse from URL (/qrc/XXXXXX) or raw token
                      const urlMatch = raw.match(/\/qrc\/([0-9A-HJ-KM-NP-TV-Z]{6})/i);
                      if (urlMatch) {
                        executeAssignment(urlMatch[1], 'qrc');
                        return;
                      }
                      if (/^[0-9A-HJ-KM-NP-TV-Z]{6}$/i.test(raw)) {
                        executeAssignment(raw, 'qrc');
                        return;
                      }
                      setErrorMessage(`Unrecognized QR code format: ${raw}`);
                    }
                  }}
                  onError={(err) => {
                    console.error('Scanner error:', err);
                    setErrorMessage(`Camera error: ${err.message || 'Check camera permissions'}`);
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL TOKEN */}
          {qrTab === 'manual' && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                Crockford Base32 Token (6 characters)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 000000"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-white uppercase focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  disabled={processing || manualTokenInput.trim().length !== 6}
                  onClick={() => executeAssignment(manualTokenInput, 'qrc')}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: LINK NEW NFC TAG                                                 */}
      {/* ========================================================================= */}
      {activeLinkType === 'tag' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/30 space-y-4 animate-in fade-in zoom-in-98 duration-150">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Link NFC Tag to {memberName}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setActiveLinkType(null)}
              className="p-1 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs: Free Lot + UID | Web NFC Tap | Manual */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setNfcTab('free')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                nfcTab === 'free' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Free Lot
            </button>
            <button
              type="button"
              onClick={() => setNfcTab('webnfc')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                nfcTab === 'webnfc' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Tap Tag
            </button>
            <button
              type="button"
              onClick={() => setNfcTab('manual')}
              className={`py-1.5 text-center text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                nfcTab === 'manual' ? 'bg-blue-500 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              }`}
            >
              Manual
            </button>
          </div>

          {/* NFC TAB 1: FREE LOT + UID */}
          {nfcTab === 'free' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Select Free Tag Token
                </label>
                {loadingFree ? (
                  <div className="py-2 text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /> Loading tags...
                  </div>
                ) : freeTokens.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/5 text-center text-xs text-muted-foreground">
                    No free NFC tags available in inventory. Generate a new batch in Credentials Hub.
                  </div>
                ) : (
                  <select
                    value={selectedFreeToken}
                    onChange={(e) => setSelectedFreeToken(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    {freeTokens.map((t) => (
                      <option key={t.id} value={t.token} className="bg-zinc-900 text-white">
                        {t.token} (Free)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Physical Hex UID (4-byte or 7-byte)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 04:A3:2B:1C:88:5D:80"
                  value={physicalUidInput}
                  onChange={(e) => setPhysicalUidInput(autoFormatHexInput(e.target.value))}
                  maxLength={23}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-blue-400"
                />
                <span className="text-[10px] text-muted-foreground">
                  Automatically inserts colons as you type (4-byte or 7-byte). Optional.
                </span>
              </div>

              <button
                type="button"
                disabled={processing || !selectedFreeToken}
                onClick={() => executeAssignment(selectedFreeToken, 'tag', physicalUidInput)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Assign Tag [{selectedFreeToken}]
              </button>
            </div>
          )}

          {/* NFC TAB 2: TAP TAG (WEB NFC) */}
          {nfcTab === 'webnfc' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
                <Smartphone className="w-7 h-7" />
              </div>

              {hasWebNFC ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Hold a blank NFC tag to the back of your Android phone. We will write the club URL and capture the hardware UID in 1 tap.
                  </p>

                  <div className="space-y-1 text-left max-w-xs mx-auto">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Tag Token to Write:
                    </label>
                    <select
                      value={selectedFreeToken}
                      onChange={(e) => setSelectedFreeToken(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-blue-400"
                    >
                      {freeTokens.map((t) => (
                        <option key={t.id} value={t.token} className="bg-zinc-900 text-white">
                          {t.token}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={nfcScanning || processing || !selectedFreeToken}
                    onClick={handleWebNfcTap}
                    className="w-full max-w-xs mx-auto py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  >
                    {nfcScanning ? (
                      <>
                        <Radio className="w-4 h-4 animate-ping text-white" />
                        Scanning for Tag...
                      </>
                    ) : (
                      'Activate NFC Reader'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-muted-foreground space-y-1">
                    <p className="font-bold text-white">Web NFC is not supported on this browser/OS.</p>
                    <p>To program NFC tags with Web NFC, use Google Chrome on Android. On desktop, please use the "Free Lot" or "Manual" tab to input the UID.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                      Physical Hex UID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 04:A3:2B:1C:88:5D:80"
                      value={physicalUidInput}
                      onChange={(e) => setPhysicalUidInput(autoFormatHexInput(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={processing || !selectedFreeToken}
                    onClick={() => executeAssignment(selectedFreeToken, 'tag', physicalUidInput)}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors"
                  >
                    Assign Tag [{selectedFreeToken}]
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NFC TAB 3: MANUAL TOKEN & UID */}
          {nfcTab === 'manual' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Crockford Base32 Token (6 characters)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 000001"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-sm font-bold text-white uppercase focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                  Physical Hex UID (4-byte or 7-byte)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 04:A3:2B:1C:88:5D:80"
                  value={physicalUidInput}
                  onChange={(e) => setPhysicalUidInput(autoFormatHexInput(e.target.value))}
                  maxLength={23}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 font-mono text-xs text-white uppercase focus:outline-none focus:border-blue-400"
                />
              </div>

              <button
                type="button"
                disabled={processing || manualTokenInput.trim().length !== 6}
                onClick={() => executeAssignment(manualTokenInput, 'tag', physicalUidInput)}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Link Tag
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNLINK AUDIT CONFIRMATION MODAL                                           */}
      {/* ========================================================================= */}
      {unlinkingCred && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full rounded-2xl border border-white/20 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-black uppercase tracking-wider text-white">
                  Unlink Credential
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setUnlinkingCred(null)}
                className="p-1 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              You are unlinking <strong className="text-white font-mono">{unlinkingCred.token}</strong> ({unlinkingCred.type === 'qrc' ? 'QR Badge' : 'NFC Tag'}) from <strong className="text-white">{memberName}</strong>.
            </p>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={unlinkingLoading}
                onClick={() => handleConfirmUnlink('free')}
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                {unlinkingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Return to Pool as Free
              </button>
              <button
                type="button"
                disabled={unlinkingLoading}
                onClick={() => handleConfirmUnlink('retire')}
                className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                Mark Damaged / Lost (Retire)
              </button>
              <button
                type="button"
                disabled={unlinkingLoading}
                onClick={() => setUnlinkingCred(null)}
                className="w-full py-2 text-xs text-muted-foreground hover:text-white text-center font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
