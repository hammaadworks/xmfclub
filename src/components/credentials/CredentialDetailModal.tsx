import { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Radio,
  ExternalLink,
  Copy,
  Check,
  User,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Trash2,
  Download,
  Edit2,
  Save,
} from 'lucide-react';
import QRCode from 'qrcode';
import { buildCredentialUrl, CANONICAL_CREDENTIAL_BASE_URL } from '#/lib/credentialToken';

export interface CredentialDetailItem {
  id: string;
  token: string;
  type: 'qrc' | 'tag';
  status: 'free' | 'assigned' | 'deleted';
  batch_id?: string | null;
  batch_number?: number | null;
  physical_uid?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  assignedMember?: {
    member_id: string;
    name: string;
    role: string;
    belt: string;
    branch: string;
    photo_url?: string | null;
    assigned_at?: string;
    assignment_id?: string;
  } | null;
}

interface CredentialDetailModalProps {
  credential: CredentialDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignToMember: (cred: CredentialDetailItem) => void;
  onUnassign: (credId: string, assignmentId?: string) => Promise<void>;
  onRetire: (credId: string, reason: string) => Promise<void>;
  onRestore: (credId: string) => Promise<void>;
  onUpdatePhysicalUid: (credId: string, uid: string) => Promise<void>;
  onDeleteCredential: (credId: string) => Promise<void>;
}

export function CredentialDetailModal({
  credential,
  isOpen,
  onClose,
  onAssignToMember,
  onUnassign,
  onRetire,
  onRestore,
  onUpdatePhysicalUid,
  onDeleteCredential,
}: CredentialDetailModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Edit Physical UID state
  const [editingUid, setEditingUid] = useState(false);
  const [uidInput, setUidInput] = useState('');

  // Retire dialog state
  const [retiring, setRetiring] = useState(false);
  const [retireReason, setRetireReason] = useState<string>('damaged');

  useEffect(() => {
    if (!isOpen || !credential) return;

    let isMounted = true;
    setEditingUid(false);
    setRetiring(false);
    setUidInput(credential.physical_uid || '');

    if (credential.type === 'qrc') {
      const url = buildCredentialUrl('qrc', credential.token, CANONICAL_CREDENTIAL_BASE_URL);
      QRCode.toDataURL(url, { margin: 1, width: 400 })
        .then((data) => {
          if (isMounted) setQrDataUrl(data);
        })
        .catch(console.error);
    } else {
      setQrDataUrl('');
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, credential]);

  if (!isOpen || !credential) return null;

  const resolutionUrl = buildCredentialUrl(credential.type, credential.token, CANONICAL_CREDENTIAL_BASE_URL);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resolutionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `xmf-${credential.type}-${credential.token}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSaveUid = async () => {
    setLoadingAction(true);
    try {
      await onUpdatePhysicalUid(credential.id, uidInput.trim());
      setEditingUid(false);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUnassignClick = async () => {
    if (!confirm(`Are you sure you want to unassign credential ${credential.token} from ${credential.assignedMember?.name}?`)) {
      return;
    }
    setLoadingAction(true);
    try {
      await onUnassign(credential.id, credential.assignedMember?.assignment_id);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleConfirmRetire = async () => {
    setLoadingAction(true);
    try {
      await onRetire(credential.id, retireReason);
      setRetiring(false);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRestoreClick = async () => {
    setLoadingAction(true);
    try {
      await onRestore(credential.id);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirm(`Permanently delete unassigned credential ${credential.token} from the database?`)) {
      return;
    }
    setLoadingAction(true);
    try {
      await onDeleteCredential(credential.id);
      onClose();
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              credential.type === 'qrc' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
            }`}>
              {credential.type === 'qrc' ? <QrCode className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                {credential.type === 'qrc' ? 'QR Code Badge' : 'NFC Wristband Tag'}
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                Batch #{credential.batch_number !== undefined && credential.batch_number !== null
                  ? credential.batch_number.toString().padStart(5, '0')
                  : 'Manual / Single'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Main Visual Display */}
          <div className="flex flex-col items-center text-center">
            {credential.type === 'qrc' ? (
              <div className="relative group">
                <div className="w-48 h-48 bg-white rounded-2xl p-3 shadow-xl flex items-center justify-center border-4 border-white/10">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={credential.token} className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-20 h-20 text-neutral-400 animate-pulse" />
                  )}
                </div>
                {qrDataUrl && (
                  <button
                    onClick={handleDownloadQr}
                    className="mt-3 px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 mx-auto transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download High-Res PNG
                  </button>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-blue-500/10 border-2 border-blue-500/30 flex flex-col items-center justify-center p-4">
                <Radio className="w-16 h-16 text-blue-400 mb-2 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">NFC Chip</span>
                {credential.physical_uid && (
                  <span className="font-mono text-[10px] text-muted-foreground mt-1">
                    UID: {credential.physical_uid}
                  </span>
                )}
              </div>
            )}

            {/* Monospace Token Badge */}
            <div className="mt-4 flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Crockford Token</span>
              <span className="font-mono text-3xl font-black tracking-widest text-white mt-0.5">
                {credential.token}
              </span>
            </div>
          </div>

          {/* Canonical Resolution URL Box */}
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-bold uppercase tracking-wider text-[10px]">
                Production Resolution Link (Mandatory)
              </span>
              <a
                href={resolutionUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                Test Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={resolutionUrl}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white/90 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors shrink-0"
                title="Copy URL"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Physical Chip UID Edit Section */}
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                Physical Chip UID (Hardware Serial)
              </span>
              {!editingUid && (
                <button
                  onClick={() => setEditingUid(true)}
                  className="text-primary hover:underline flex items-center gap-1 font-semibold text-[11px]"
                >
                  <Edit2 className="w-3 h-3" /> Edit UID
                </button>
              )}
            </div>

            {editingUid ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="e.g. 04:A3:91:72:8C:11:02"
                  value={uidInput}
                  onChange={(e) => setUidInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                  autoFocus
                />
                <button
                  onClick={handleSaveUid}
                  disabled={loadingAction}
                  className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg flex items-center gap-1 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => {
                    setEditingUid(false);
                    setUidInput(credential.physical_uid || '');
                  }}
                  className="px-2.5 py-1.5 bg-white/10 text-white font-bold text-xs rounded-lg shrink-0"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="font-mono text-xs text-white">
                {credential.physical_uid ? (
                  <span className="text-blue-400 font-bold">{credential.physical_uid}</span>
                ) : (
                  <span className="text-muted-foreground italic">No hardware UID recorded</span>
                )}
              </p>
            )}
          </div>

          {/* Retire with Reason Dialog */}
          {retiring && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-sm text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Select Retirement Reason
                </h5>
                <button onClick={() => setRetiring(false)} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Retired badges will display a &quot;Badge Retired&quot; screen if scanned.
              </p>
              <select
                value={retireReason}
                onChange={(e) => setRetireReason(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="damaged">damaged (Physical damage / wear &amp; tear)</option>
                <option value="printing_error">printing_error (Ink bleed / defective print)</option>
                <option value="misaligned">misaligned (Cut defect)</option>
                <option value="chip_failure">chip_failure (NFC IC / antenna burnt)</option>
                <option value="other">other (Lost / stolen / administrative)</option>
              </select>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRetiring(false)}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRetire}
                  disabled={loadingAction}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md"
                >
                  Confirm Retire
                </button>
              </div>
            </div>
          )}

          {/* Current Assignment Status Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Status &amp; Linkage</h4>

            {credential.status === 'assigned' && credential.assignedMember ? (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-black uppercase flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Currently Assigned
                  </span>
                  {credential.assignedMember.assigned_at && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Assigned: {new Date(credential.assignedMember.assigned_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white text-lg overflow-hidden shrink-0">
                    {credential.assignedMember.photo_url ? (
                      <img
                        src={credential.assignedMember.photo_url}
                        alt={credential.assignedMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      credential.assignedMember.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-white text-base truncate">
                      {credential.assignedMember.name}
                    </h5>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono text-primary font-bold">{credential.assignedMember.member_id}</span>
                      <span>•</span>
                      <span>{credential.assignedMember.belt} Belt</span>
                      <span>•</span>
                      <span className="truncate">{credential.assignedMember.branch}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <a
                    href={`/member/${credential.assignedMember.member_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                  >
                    View Member Profile <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleUnassignClick}
                    disabled={loadingAction}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {loadingAction ? 'Processing...' : 'Unassign Badge'}
                  </button>
                </div>
              </div>
            ) : credential.status === 'deleted' ? (
              <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-300 text-xs font-black uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />
                    Retired / Disabled
                  </span>
                  {credential.rejection_reason && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Reason: {credential.rejection_reason}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  This credential has been retired and will resolve to a &quot;Retired Badge&quot; screen if scanned.
                </p>
                <button
                  onClick={handleRestoreClick}
                  disabled={loadingAction}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restore Credential to Available
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-black uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Available (Unassigned)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This badge is ready to be handed to a member. When scanned before assignment, it shows an &quot;Unassigned Badge&quot; confirmation screen.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onAssignToMember(credential)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Assign to Member Now
                  </button>
                  <button
                    onClick={() => setRetiring(true)}
                    disabled={loadingAction}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-yellow-400 rounded-xl transition-colors border border-white/5"
                    title="Mark as damaged or retired"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    disabled={loadingAction}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-red-400 rounded-xl transition-colors border border-white/5"
                    title="Delete unassigned credential from database"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
