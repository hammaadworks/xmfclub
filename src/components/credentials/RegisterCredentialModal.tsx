import { useState } from 'react';
import { X, QrCode, Radio, AlertTriangle, Plus } from 'lucide-react';
import { supabase } from '#/lib/supabase';
import { normalizeCrockford } from '#/lib/crockford';

interface RegisterCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function RegisterCredentialModal({
  isOpen,
  onClose,
  onCreated,
}: RegisterCredentialModalProps) {
  const [type, setType] = useState<'qrc' | 'tag'>('qrc');
  const [tokenInput, setTokenInput] = useState('');
  const [physicalUid, setPhysicalUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = tokenInput.trim();
    if (!trimmed) {
      setError('Please enter a 6-character Crockford Base32 token.');
      return;
    }

    const { valid, normalized, error: normErr } = normalizeCrockford(trimmed);
    if (!valid || normalized.length !== 6) {
      setError(normErr || 'Token must be exactly 6 Douglas Crockford Base32 characters (0-9, A-Z excluding I, L, O, U).');
      return;
    }

    setLoading(true);

    try {
      // Check if token already exists for this type
      const { data: existing } = await supabase
        .from('credentials')
        .select('id, token')
        .eq('type', type)
        .eq('token', normalized)
        .maybeSingle();

      if (existing) {
        setError(`A ${type.toUpperCase()} credential with token "${normalized}" already exists in the system.`);
        setLoading(false);
        return;
      }

      // Insert new credential record
      const { error: insErr } = await supabase.from('credentials').insert({
        type,
        token: normalized,
        status: 'free',
        physical_uid: physicalUid.trim() || null,
      });

      if (insErr) throw insErr;

      onCreated();
      onClose();
      setTokenInput('');
      setPhysicalUid('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to register credential.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Register Single / VIP Credential
              </h3>
              <p className="text-xs text-muted-foreground">
                Add an individual custom or VIP Crockford token.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Credential Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('qrc')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  type === 'qrc'
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'text-muted-foreground hover:bg-white/5'
                }`}
              >
                <QrCode className="w-4 h-4" /> QR Badge
              </button>
              <button
                type="button"
                onClick={() => setType('tag')}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  type === 'tag'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-muted-foreground hover:bg-white/5'
                }`}
              >
                <Radio className="w-4 h-4" /> NFC Tag
              </button>
            </div>
          </div>

          {/* Token Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              6-Digit Crockford Token
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 000000 or VIP001"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-lg font-mono tracking-widest text-white uppercase focus:outline-none focus:border-primary/50"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Must be 6 valid Douglas Crockford characters (0-9, A-Z; I/L &rarr; 1, O &rarr; 0, U is rejected).
            </p>
          </div>

          {/* Physical Chip UID (optional for NFC tags) */}
          {type === 'tag' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Physical Chip UID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 04:A3:91:72:8C:11:02"
                value={physicalUid}
                onChange={(e) => setPhysicalUid(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Manufacturer silicon chip serial number read from NFC tools.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-wider text-xs rounded-xl transition-all shadow-md shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
