import { useState, useMemo } from 'react';
import { X, Search, User, QrCode, Radio, AlertTriangle } from 'lucide-react';
import { supabase } from '#/lib/supabase';

export interface AssignableMember {
  member_id: string;
  name: string;
  role: string;
  belt: string;
  branch: string;
  phone?: string;
  photo_url?: string | null;
  assignedBadgesCount?: number;
}

interface AssignMemberModalProps {
  credential: {
    id: string;
    token: string;
    type: 'qrc' | 'tag';
  } | null;
  members: AssignableMember[];
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignMemberModal({
  credential,
  members,
  isOpen,
  onClose,
  onAssigned,
}: AssignMemberModalProps) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members.slice(0, 40);
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.member_id.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        m.belt.toLowerCase().includes(q)
    );
  }, [members, search]);

  if (!isOpen || !credential) return null;

  const handleAssign = async (memberId: string) => {
    setLoading(true);
    setError('');

    try {
      // 1. Update credential status to assigned
      const { error: updErr } = await supabase
        .from('credentials')
        .update({ status: 'assigned' })
        .eq('id', credential.id);

      if (updErr) throw updErr;

      // 2. Insert new assignment record
      const { error: insErr } = await supabase
        .from('credential_assignments')
        .insert({
          credential_id: credential.id,
          member_id: memberId,
        });

      if (insErr) throw insErr;

      onAssigned();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to assign credential.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              Assign Credential
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${
                credential.type === 'qrc' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {credential.type === 'qrc' ? <QrCode className="w-3 h-3" /> : <Radio className="w-3 h-3" />}
                {credential.type === 'qrc' ? 'QR Badge' : 'NFC Tag'}
              </span>
              <span className="font-mono text-sm font-black tracking-widest text-white">
                {credential.token}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-black/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search member by name, ID (e.g. XMF26...), phone or belt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No matching members found.</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/[0.08] transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center font-bold text-white text-sm shrink-0 overflow-hidden">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-white truncate group-hover:text-primary transition-colors">
                      {member.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-mono text-primary font-bold">{member.member_id}</span>
                      <span>•</span>
                      <span>{member.belt}</span>
                      <span>•</span>
                      <span className="truncate">{member.branch}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAssign(member.member_id)}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground font-black uppercase tracking-wider text-xs rounded-lg transition-all shrink-0 disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filteredMembers.length} active members</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
