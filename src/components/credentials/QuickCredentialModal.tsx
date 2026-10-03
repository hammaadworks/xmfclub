import { X, ShieldCheck } from 'lucide-react';
import { 
  MemberCredentialControls, 
  type MemberCredentialItem 
} from './MemberCredentialControls';

export interface MemberForCredentialModal {
  member_id: string;
  name: string;
  belt?: string;
  photo_url?: string | null;
  assignedQrcs: MemberCredentialItem[];
  assignedTags: MemberCredentialItem[];
}

interface QuickCredentialModalProps {
  member: MemberForCredentialModal | null;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function QuickCredentialModal({
  member,
  isOpen,
  onClose,
  onChanged,
}: QuickCredentialModalProps) {
  if (!isOpen || !member) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-cred-title"
    >
      <div 
        className="w-full max-w-lg glass-card rounded-t-3xl sm:rounded-3xl border border-white/20 bg-background/95 p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[92vh] sm:max-h-[85vh] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Swipe handle indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto sm:hidden -mt-2 mb-2" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={member.name}
                className="w-11 h-11 rounded-2xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-primary/20 text-primary-light font-black flex items-center justify-center text-sm border border-primary/30">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 id="quick-cred-title" className="text-lg font-black uppercase text-white tracking-tight">
                  {member.name}
                </h3>
                {member.belt && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-white">
                    {member.belt}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-bold text-primary-light">
                  {member.member_id}
                </span>
                <span className="text-white/20">•</span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-primary" /> Credentials Manager
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
            title="Close modal"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Credential Controls Body */}
        <MemberCredentialControls
          memberId={member.member_id}
          memberName={member.name}
          assignedQrcs={member.assignedQrcs}
          assignedTags={member.assignedTags}
          onChanged={() => {
            onChanged();
          }}
        />
      </div>
    </div>
  );
}
