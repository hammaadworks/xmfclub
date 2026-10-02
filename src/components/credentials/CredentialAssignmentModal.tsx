import { useEffect, useState } from 'react';
import { X, QrCode, Radio, Search, AlertTriangle } from 'lucide-react';
import { supabase } from '#/lib/supabase';

interface Credential {
  id: string;
  token: string;
  type: 'qrc' | 'tag';
  status: 'free' | 'assigned' | 'deleted';
}

export function CredentialAssignmentModal({ 
  memberId, 
  isOpen, 
  onClose,
  onAssigned
}: { 
  memberId: string; 
  isOpen: boolean; 
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'qrc' | 'tag'>('qrc');
  const [freeCredentials, setFreeCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFreeCredentials();
    }
  }, [isOpen, activeTab]);

  const loadFreeCredentials = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('status', 'free')
      .eq('type', activeTab)
      .order('token', { ascending: true })
      .limit(50);
      
    if (error) setError(error.message);
    else setFreeCredentials(data || []);
    setLoading(false);
  };

  const handleAssign = async (credId: string) => {
    setLoading(true);
    setError('');

    // Update credential status
    const { error: updErr } = await supabase
      .from('credentials')
      .update({ status: 'assigned' })
      .eq('id', credId);
      
    if (updErr) {
      setError(updErr.message);
      setLoading(false);
      return;
    }

    // Insert assignment
    const { error: insErr } = await supabase
      .from('credential_assignments')
      .insert({
        credential_id: credId,
        member_id: memberId,
      });

    if (insErr) {
      setError(insErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onAssigned();
    onClose();
  };

  if (!isOpen) return null;

  const filtered = freeCredentials.filter(c => c.token.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold uppercase tracking-widest text-primary">Assign Credential</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('qrc')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'qrc' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" /> QR Badge
          </button>
          <button
            onClick={() => setActiveTab('tag')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
              activeTab === 'tag' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4" /> NFC Tag
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by token (e.g. 000000)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <p className="text-center text-muted-foreground py-8 animate-pulse">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No free {activeTab === 'qrc' ? 'QR Badges' : 'NFC Tags'} found.</p>
          ) : (
            filtered.map(cred => (
              <div key={cred.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                <span className="font-mono text-lg tracking-widest text-white">{cred.token}</span>
                <button
                  onClick={() => handleAssign(cred.id)}
                  className="px-4 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg text-sm font-bold transition-colors"
                >
                  Assign
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
