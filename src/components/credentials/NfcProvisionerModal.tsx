import { useEffect, useState } from 'react';
import { X, Radio, CheckCircle, Smartphone } from 'lucide-react';
import { supabase } from '#/lib/supabase';
import { buildCredentialUrl, calculateBatchTokens } from '#/lib/credentialToken';

export function NfcProvisionerModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [hasWebNFC, setHasWebNFC] = useState(false);
  const [step, setStep] = useState<'init' | 'writing' | 'success' | 'fallback'>('init');
  const [error, setError] = useState('');
  const [currentToken, setCurrentToken] = useState('');
  const [manualUid, setManualUid] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setHasWebNFC(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(hasWebNFC ? 'init' : 'fallback');
      setError('');
      setManualUid('');
      setCurrentToken('');
    }
  }, [isOpen, hasWebNFC]);

  const generateOrGetFreeTag = async () => {
    // See if there's a free tag
    const { data: freeTag } = await supabase.from('credentials')
      .select('*').eq('type', 'tag').eq('status', 'free').order('token', { ascending: true }).limit(1).maybeSingle();
      
    if (freeTag) return freeTag.token;

    // Generate a new batch of 32 tags
    const { data: batches } = await supabase.from('credential_batches').select('batch_number').eq('type', 'tag');
    const nextNum = batches && batches.length > 0 ? Math.max(...batches.map(b => b.batch_number)) + 1 : 0;
    
    const batchInfo = calculateBatchTokens(nextNum);
    
    const { data: batch } = await supabase.from('credential_batches').insert({
      batch_number: nextNum,
      type: 'tag',
      quantity: 32,
      start_token: batchInfo.startToken,
      end_token: batchInfo.endToken,
    }).select().single();

    if (batch) {
      const creds = batchInfo.tokens.map(t => ({
        batch_id: batch.id,
        type: 'tag',
        token: t,
        status: 'free'
      }));
      await supabase.from('credentials').insert(creds);
    }
    
    return batchInfo.startToken;
  };

  const handleStartWriting = async () => {
    try {
      setStep('writing');
      setError('');
      const token = await generateOrGetFreeTag();
      setCurrentToken(token);

      const targetUrl = buildCredentialUrl('tag', token);
      
      const ndef = new (window as any).NDEFReader();
      await ndef.write({
        records: [{ recordType: 'url', data: targetUrl }]
      });

      // Simple implementation: wait for read back or just assume success if write didn't throw
      // In a real app we would read back to verify the UID and content.
      
      setStep('success');
    } catch (e: any) {
      setError(e.message || "Failed to write NFC tag.");
      setStep('init');
    }
  };

  const handleManualFallback = async () => {
    if (!manualUid.trim()) {
      setError("Please enter the UID from your NFC Reader app.");
      return;
    }
    
    try {
      setStep('writing');
      const token = await generateOrGetFreeTag();
      setCurrentToken(token);
      
      // Update the credential with the physical UID just for auditing
      await supabase.from('credentials').update({ physical_uid: manualUid.trim() }).eq('token', token).eq('type', 'tag');
      
      setStep('success');
    } catch (e: any) {
      setError(e.message || "Failed to process manual tag.");
      setStep('fallback');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {step === 'init' && (
          <>
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-6">
              <Smartphone className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Tap to Write</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Hold a blank NFC tag near the back of your Android device and tap start.
            </p>
            {error && <p className="text-red-500 mb-4 text-sm bg-red-500/10 p-2 rounded">{error}</p>}
            <button 
              onClick={handleStartWriting}
              className="w-full py-4 bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Start Writing
            </button>
          </>
        )}

        {step === 'fallback' && (
          <>
            <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mb-6">
              <Radio className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Manual Provisioning</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Web NFC is not supported on this device. Please scan the tag using a standard NFC Reader app, copy its UID, and paste it here.
            </p>
            {error && <p className="text-red-500 mb-4 text-sm bg-red-500/10 p-2 rounded">{error}</p>}
            <input 
              type="text"
              placeholder="Paste UID here (e.g. 04:A3:...)"
              value={manualUid}
              onChange={e => setManualUid(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 mb-4 text-center focus:outline-none focus:border-blue-500/50 uppercase"
            />
            <button 
              onClick={handleManualFallback}
              className="w-full py-4 bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Register Tag
            </button>
          </>
        )}

        {step === 'writing' && (
          <div className="py-12 flex flex-col items-center">
            <Radio className="w-16 h-16 text-blue-500 animate-ping mb-4" />
            <p className="text-lg font-bold">Scanning...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 flex flex-col items-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-green-500">Success!</h2>
            <p className="text-muted-foreground mb-4">Tag programmed successfully.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-full mb-8">
              <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Assigned Token</p>
              <p className="text-xl font-mono tracking-widest text-white">{currentToken}</p>
            </div>
            <button 
              onClick={() => { setStep(hasWebNFC ? 'init' : 'fallback'); setManualUid(''); }}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-sm rounded-xl hover:bg-white/10 transition-all"
            >
              Provision Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
