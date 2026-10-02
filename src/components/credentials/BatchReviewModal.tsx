import { useState, useEffect, useMemo } from 'react';
import { X, QrCode, Radio, Download, FolderArchive, FileSpreadsheet, Copy, Check, User } from 'lucide-react';
import QRCode from 'qrcode';
import { buildCredentialUrl, exportBatchCsv, CANONICAL_CREDENTIAL_BASE_URL } from '#/lib/credentialToken';
import { generateQrBatchPdf, generateQrBatchZip } from '#/lib/qrLayout';
import { decodeCrockford } from '#/lib/crockford';

export interface BatchItem {
  id: string;
  token: string;
  type: 'qrc' | 'tag';
  status: 'free' | 'assigned' | 'deleted';
  physical_uid?: string | null;
  assignedMember?: {
    member_id: string;
    name: string;
    belt: string;
    branch: string;
  } | null;
}

export interface BatchData {
  id: string;
  batch_number: number;
  type: 'qrc' | 'tag';
  quantity: number;
  start_token: string;
  end_token: string;
  created_at: string;
}

interface BatchReviewModalProps {
  batch: BatchData | null;
  items: BatchItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCredential: (item: BatchItem) => void;
}

export function BatchReviewModal({
  batch,
  items,
  isOpen,
  onClose,
  onSelectCredential,
}: BatchReviewModalProps) {
  const [qrThumbs, setQrThumbs] = useState<Record<string, string>>({});
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Guarantee strict ascending Crockford Base32 sequence for all items
  const sortedItems: BatchItem[] = useMemo(() => {
    return [...items].sort((a, b) => {
      const valA = decodeCrockford(a.token);
      const valB = decodeCrockford(b.token);
      if (valA !== -1 && valB !== -1) return valA - valB;
      return a.token.localeCompare(b.token);
    });
  }, [items]);

  useEffect(() => {
    if (!isOpen || !batch || batch.type !== 'qrc' || sortedItems.length === 0) return;

    let isMounted = true;
    const baseUrl = CANONICAL_CREDENTIAL_BASE_URL;

    // Generate mini QR previews for all 32 items in sorted order
    const generateThumbs = async () => {
      const thumbs: Record<string, string> = {};
      for (const item of sortedItems) {
        try {
          const url = buildCredentialUrl('qrc', item.token, baseUrl);
          thumbs[item.token] = await QRCode.toDataURL(url, { margin: 0, width: 120 });
        } catch (e) {
          console.error('Failed to generate thumb for', item.token, e);
        }
      }
      if (isMounted) setQrThumbs(thumbs);
    };

    generateThumbs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, batch, sortedItems]);

  if (!isOpen || !batch) return null;

  const freeCount = sortedItems.filter((i) => i.status === 'free').length;
  const assignedCount = sortedItems.filter((i) => i.status === 'assigned').length;
  const deletedCount = sortedItems.filter((i) => i.status === 'deleted').length;
  const assignedPercent = Math.round((assignedCount / (sortedItems.length || 1)) * 100);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const tokens = sortedItems.map((i) => i.token);
      const blob = await generateQrBatchPdf(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const tokens = sortedItems.map((i) => i.token);
      const blob = await generateQrBatchZip(tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrc-batch-${batch.batch_number.toString().padStart(5, '0')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Failed to generate ZIP archive');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleExportCsv = () => {
    const tokens = sortedItems.map((i) => i.token);
    const csvContent = exportBatchCsv(batch.type, tokens, batch.batch_number, CANONICAL_CREDENTIAL_BASE_URL);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.type}-batch-${batch.batch_number.toString().padStart(5, '0')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = (token: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildCredentialUrl(batch.type, token, CANONICAL_CREDENTIAL_BASE_URL);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-card border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                batch.type === 'qrc' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {batch.type === 'qrc' ? <QrCode className="w-3.5 h-3.5" /> : <Radio className="w-3.5 h-3.5" />}
                {batch.type === 'qrc' ? 'QR Batch' : 'NFC Tag Batch'}
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight text-white font-mono">
                Batch #{batch.batch_number.toString().padStart(5, '0')}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Tokens: <strong className="text-white">{batch.start_token}</strong> to <strong className="text-white">{batch.end_token}</strong> • Created: {new Date(batch.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {batch.type === 'qrc' && (
              <>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloadingPdf}
                  className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                  title="Download printable A4 sticker sheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  {downloadingPdf ? 'Generating...' : 'Print PDF'}
                </button>
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50"
                  title="Download ZIP package with index.html viewer, SVG, PNG & CSV"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-primary" />
                  {downloadingZip ? 'Packing...' : 'ZIP Viewer'}
                </button>
              </>
            )}

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
              title="Download CSV spreadsheet of tokens"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
              CSV
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-muted-foreground hover:text-white ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Stat Summary */}
        <div className="px-6 py-3 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-green-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              {freeCount} Available (Unassigned)
            </span>
            <span className="flex items-center gap-1.5 text-blue-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {assignedCount} Assigned
            </span>
            {deletedCount > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground font-bold">
                <span className="w-2 h-2 rounded-full bg-neutral-600" />
                {deletedCount} Retired
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-muted-foreground font-bold">{assignedPercent}% Assigned</span>
            <div className="w-36 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500"
                style={{ width: `${assignedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 32 Items Grid (Simulating 4 columns x 8 rows) */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sortedItems.map((item, idx) => {
              const seq = `#${(batch.batch_number * 32 + idx + 1).toString().padStart(4, '0')}`;
              const isAssigned = item.status === 'assigned';
              const isDeleted = item.status === 'deleted';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCredential(item)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center ${
                    isAssigned
                      ? 'bg-blue-500/5 border-blue-500/30 hover:border-blue-400 shadow-sm'
                      : isDeleted
                      ? 'bg-white/[0.02] border-white/5 opacity-50'
                      : 'bg-white/5 border-white/10 hover:border-primary/50 hover:bg-white/[0.08]'
                  }`}
                >
                  {/* Sequence Badge */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-2">
                    <span className="font-bold text-white/70">{seq}</span>
                    <button
                      onClick={(e) => handleCopyLink(item.token, e)}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-muted-foreground hover:text-white"
                      title="Copy resolution URL"
                    >
                      {copiedToken === item.token ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Visual Preview */}
                  <div className="w-20 h-20 bg-white rounded-lg p-1.5 mb-2.5 flex items-center justify-center shadow-inner">
                    {batch.type === 'qrc' ? (
                      qrThumbs[item.token] ? (
                        <img
                          src={qrThumbs[item.token]}
                          alt={item.token}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-neutral-400 animate-pulse" />
                      )
                    ) : (
                      <div className="w-full h-full bg-blue-50 rounded flex items-center justify-center text-blue-600">
                        <Radio className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Token Monospace */}
                  <span className="font-mono text-sm font-black tracking-widest text-white group-hover:text-primary transition-colors">
                    {item.token}
                  </span>

                  {/* Status Indicator */}
                  <div className="mt-2 w-full pt-2 border-t border-white/5">
                    {isAssigned ? (
                      <div className="flex flex-col items-center">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center gap-1 truncate max-w-full">
                          <User className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{item.assignedMember?.name || 'Assigned'}</span>
                        </span>
                        {item.assignedMember?.member_id && (
                          <span className="font-mono text-[9px] text-muted-foreground mt-0.5">
                            {item.assignedMember.member_id}
                          </span>
                        )}
                      </div>
                    ) : isDeleted ? (
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-bold">
                        Retired
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Available
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
          <span>Click any credential card to inspect full details, preview large QR, or assign to a member.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
