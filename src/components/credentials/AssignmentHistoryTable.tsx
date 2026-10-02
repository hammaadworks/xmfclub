import { useState, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  QrCode,
  Radio,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { buildCredentialUrl, CANONICAL_CREDENTIAL_BASE_URL } from '#/lib/credentialToken';

export interface AssignmentRecord {
  id: string;
  credential_id: string;
  member_id: string;
  assigned_by: string | null;
  assigned_at: string;
  unassigned_at: string | null;
  created_at: string;
  credentialToken: string;
  credentialType: 'qrc' | 'tag';
  memberName: string;
  memberBelt: string;
  memberBranch: string;
  memberPhoto?: string | null;
}

interface AssignmentHistoryTableProps {
  assignments: AssignmentRecord[];
  onUnassign: (credentialId: string, assignmentId: string) => Promise<void>;
}

export function AssignmentHistoryTable({ assignments, onUnassign }: AssignmentHistoryTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'returned'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'qrc' | 'tag'>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [unassigningId, setUnassigningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      // Status filter
      if (statusFilter === 'active' && a.unassigned_at !== null) return false;
      if (statusFilter === 'returned' && a.unassigned_at === null) return false;

      // Type filter
      if (typeFilter !== 'all' && a.credentialType !== typeFilter) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = a.memberName.toLowerCase().includes(q);
        const matchesId = a.member_id.toLowerCase().includes(q);
        const matchesToken = a.credentialToken.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesToken) return false;
      }

      return true;
    });
  }, [assignments, statusFilter, typeFilter, search]);

  const handleCopyLink = (type: 'qrc' | 'tag', token: string) => {
    const url = buildCredentialUrl(type, token, CANONICAL_CREDENTIAL_BASE_URL);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleUnassignClick = async (credId: string, assignmentId: string, memberName: string) => {
    if (!confirm(`Unassign credential from ${memberName}?`)) return;
    setUnassigningId(assignmentId);
    try {
      await onUnassign(credId, assignmentId);
    } finally {
      setUnassigningId(null);
    }
  };

  const activeCount = assignments.filter((a) => !a.unassigned_at).length;
  const returnedCount = assignments.filter((a) => a.unassigned_at).length;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="glass-card p-4 border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search audit log by member name, ID, or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:border-primary/50 text-white placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
          >
            <option value="all">All Assignments ({assignments.length})</option>
            <option value="active">Active Now ({activeCount})</option>
            <option value="returned">Returned / Historical ({returnedCount})</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="qrc">QR Badges</option>
            <option value="tag">NFC Tags</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Credential Token</th>
                <th className="py-3.5 px-4">Member Name &amp; ID</th>
                <th className="py-3.5 px-4">Assigned At</th>
                <th className="py-3.5 px-4">Unassigned At</th>
                <th className="py-3.5 px-4">Staff / Log ID</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground font-sans">
                    No assignment audit records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => {
                  const isActive = !record.unassigned_at;

                  return (
                    <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Status */}
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-bold text-[10px]">
                            <Clock className="w-2.5 h-2.5" />
                            Returned
                          </span>
                        )}
                      </td>

                      {/* Credential */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded ${
                            record.credentialType === 'qrc' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {record.credentialType === 'qrc' ? <QrCode className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                          </span>
                          <span className="font-bold text-white tracking-widest text-sm">
                            {record.credentialToken}
                          </span>
                        </div>
                      </td>

                      {/* Member */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                            {record.memberPhoto ? (
                              <img src={record.memberPhoto} alt={record.memberName} className="w-full h-full object-cover" />
                            ) : (
                              record.memberName.charAt(0)
                            )}
                          </div>
                          <div className="min-w-0">
                            <a
                              href={`/member/${record.member_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-white hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[160px]"
                            >
                              {record.memberName}
                              <ExternalLink className="w-3 h-3 opacity-40 shrink-0" />
                            </a>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                              <span className="text-primary font-bold">{record.member_id}</span>
                              <span>•</span>
                              <span>{record.memberBelt}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Date */}
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(record.assigned_at).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Unassigned Date */}
                      <td className="py-3 px-4">
                        {record.unassigned_at ? (
                          <span className="text-neutral-400">
                            {new Date(record.unassigned_at).toLocaleString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-blue-400 font-bold font-sans text-[11px]">
                            Currently In Use
                          </span>
                        )}
                      </td>

                      {/* Staff / Log ID */}
                      <td className="py-3 px-4 text-muted-foreground text-[10px]">
                        {record.assigned_by ? (
                          <span className="font-bold text-white/70">{record.assigned_by}</span>
                        ) : (
                          <span>System</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopyLink(record.credentialType, record.credentialToken)}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"
                            title="Copy Canonical URL"
                          >
                            {copiedToken === record.credentialToken ? (
                              <Check className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isActive && (
                            <button
                              onClick={() => handleUnassignClick(record.credential_id, record.id, record.memberName)}
                              disabled={unassigningId === record.id}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {unassigningId === record.id ? 'Unassigning...' : 'Unassign'}
                            </button>
                          )}
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
  );
}
