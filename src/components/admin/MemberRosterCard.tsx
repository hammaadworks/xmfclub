import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  ShieldCheck, Edit, Trash2, Undo2, ExternalLink, 
  Copy, Check, QrCode, Radio, Plus 
} from 'lucide-react';
import type { MemberCredentialItem } from '#/components/credentials/MemberCredentialControls';

export interface MemberRosterItem {
  member_id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'student' | 'instructor' | 'volunteer' | 'admin';
  belt: string;
  branch: string;
  photo_url?: string | null;
  blood_group?: string;
  member_status: 'Active' | 'Inactive';
  fee_status: 'Paid' | 'Pending';
  pending_amount?: number;
  is_reviewed: boolean;
  is_deleted: boolean;
  instructor_remarks?: string;
  instructor_remarks_color?: string;
  assignedQrcs: MemberCredentialItem[];
  assignedTags: MemberCredentialItem[];
}

interface MemberRosterCardProps {
  member: MemberRosterItem;
  onEdit: (member: MemberRosterItem) => void;
  onToggleArchive: (member: MemberRosterItem) => void;
  onToggleReview: (member: MemberRosterItem) => void;
  onOpenCredentials: (member: MemberRosterItem) => void;
}

const BELT_COLOR_STYLES: Record<string, string> = {
  White: 'bg-white/10 text-white border-white/20',
  Yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Brown: 'bg-amber-800/20 text-amber-200 border-amber-800/30',
  Red: 'bg-red-500/20 text-red-300 border-red-500/30',
  Black: 'bg-zinc-800 text-zinc-100 border-zinc-600',
};

export function MemberRosterCard({
  member,
  onEdit,
  onToggleArchive,
  onToggleReview,
  onOpenCredentials,
}: MemberRosterCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(member.member_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const beltStyle = BELT_COLOR_STYLES[member.belt] || BELT_COLOR_STYLES['White'];

  return (
    <div 
      className={`glass-card p-4 rounded-2xl border transition-all space-y-3.5 ${
        member.is_deleted 
          ? 'opacity-60 bg-white/[0.02] border-white/5' 
          : 'border-white/10 hover:border-white/20 bg-background/60'
      }`}
    >
      {/* Top Header: Avatar, Name, Member ID, Belt */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.name}
              className="w-11 h-11 rounded-2xl object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-primary-light font-black flex items-center justify-center text-sm border border-white/10 shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-black text-sm text-white uppercase truncate">
                {member.name}
              </h4>
              {member.blood_group && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                  {member.blood_group}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <button
                type="button"
                onClick={handleCopyId}
                className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors"
                title="Click to copy Member ID"
              >
                <span>{member.member_id}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
              <span className="text-white/20">•</span>
              <span className="text-[10px] text-muted-foreground truncate">
                {member.branch}
              </span>
            </div>
          </div>
        </div>

        {/* Belt Badge */}
        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shrink-0 ${beltStyle}`}>
          {member.belt}
        </span>
      </div>

      {/* Status Pills Ribbon: Verification | Fees | Role */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Verification 1-Tap Toggle */}
          <button
            type="button"
            onClick={() => onToggleReview(member)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              member.is_reviewed
                ? 'bg-green-500/15 text-green-400 border border-green-500/25 hover:bg-green-500/25'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25'
            }`}
            title="Click to toggle verification status"
          >
            <ShieldCheck className="w-3 h-3" />
            {member.is_reviewed ? 'Verified' : 'Pending'}
          </button>

          {/* Fee Pill */}
          <span 
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
              member.fee_status === 'Paid'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {member.fee_status === 'Paid' ? 'Paid' : `₹${member.pending_amount || 0} Due`}
          </span>

          {/* Role badge if staff */}
          {member.role !== 'student' && (
            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 text-muted-foreground border border-white/10">
              {member.role}
            </span>
          )}
        </div>

        {/* Remarks indicator dot */}
        {member.instructor_remarks && (
          <div 
            className={`w-2.5 h-2.5 rounded-full ${
              member.instructor_remarks_color === 'red' 
                ? 'bg-red-500 shadow-sm shadow-red-500/50' 
                : member.instructor_remarks_color === 'yellow' 
                ? 'bg-yellow-400 shadow-sm shadow-yellow-400/50' 
                : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            }`} 
            title={member.instructor_remarks} 
          />
        )}
      </div>

      {/* Credentials Bar (Interactive Chips) */}
      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">
            Badges:
          </span>

          {/* QR Badges */}
          {member.assignedQrcs.map((qrc) => (
            <button
              key={qrc.id}
              type="button"
              onClick={() => onOpenCredentials(member)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 text-primary-light border border-primary/25 hover:bg-primary/25 transition-all font-mono text-[10px] font-black tracking-wider cursor-pointer"
              title="Click to manage QR credential"
            >
              <QrCode className="w-3 h-3 text-primary" />
              <span>{qrc.token}</span>
            </button>
          ))}

          {/* NFC Tags */}
          {member.assignedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onOpenCredentials(member)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25 transition-all font-mono text-[10px] font-black tracking-wider cursor-pointer"
              title={`Hardware UID: ${tag.physical_uid || 'None'}`}
            >
              <Radio className="w-3 h-3 text-blue-400" />
              <span>{tag.token}</span>
              {tag.physical_uid && (
                <span className="text-white/40 text-[9px] hidden min-[360px]:inline">
                  • {tag.physical_uid.slice(0, 5)}..
                </span>
              )}
            </button>
          ))}

          {/* Link Triggers when empty */}
          {member.assignedQrcs.length === 0 && (
            <button
              type="button"
              onClick={() => onOpenCredentials(member)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-muted-foreground hover:text-white text-[10px] font-bold uppercase transition-all"
            >
              <Plus className="w-2.5 h-2.5" /> QR
            </button>
          )}

          {member.assignedTags.length === 0 && (
            <button
              type="button"
              onClick={() => onOpenCredentials(member)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-muted-foreground hover:text-white text-[10px] font-bold uppercase transition-all"
            >
              <Plus className="w-2.5 h-2.5" /> NFC
            </button>
          )}
        </div>

        {/* Quick Link More Trigger */}
        {(member.assignedQrcs.length > 0 || member.assignedTags.length > 0) && (
          <button
            type="button"
            onClick={() => onOpenCredentials(member)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Manage all credentials"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5">
        <button
          type="button"
          onClick={() => navigate({ to: `/member/${member.member_id}` })}
          className="text-[11px] font-bold text-muted-foreground hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View Profile</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleArchive(member)}
            className={`p-2 rounded-xl transition-colors ${
              member.is_deleted
                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            }`}
            title={member.is_deleted ? 'Restore Member' : 'Archive Member'}
          >
            {member.is_deleted ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
