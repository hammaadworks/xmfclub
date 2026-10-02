import jsPDF from 'jspdf';
import JSZip from 'jszip';
import QRCode from 'qrcode';
import { buildCredentialUrl, CANONICAL_CREDENTIAL_BASE_URL } from './credentialToken';
import { decodeCrockford } from './crockford';

export interface LayoutOptions {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  paddingX: number;
  paddingY: number;
  qrSize: number;
  circleRadius: number;
  startX: number;
  startY: number;
}

/**
 * Standard A4 (210mm x 297mm) 32-label sticker sheet layout (4 columns x 8 rows).
 * Optimized to make full, generous use of the entire A4 page:
 * - 4 columns x 8 rows filling 192mm x 272mm
 * - App-style primary crimson red circular border (#DC2626) around each badge
 * - Generous breathing room/spacing between the QR code and the circular border
 * - Minimal clutter: numbers and subtitles dropped for clean aesthetics
 */
export const DEFAULT_LAYOUT: LayoutOptions = {
  columns: 4,
  rows: 8,
  cellWidth: 48,
  cellHeight: 35,
  paddingX: 1,
  paddingY: 0,
  qrSize: 20,
  circleRadius: 17,
  startX: 7.5, // 4 * 48 + 3 * 1 = 195mm -> leaves (210 - 195) / 2 = 7.5mm margins on left/right
  startY: 9, // 8 * 35 = 280mm -> leaves 9mm top margin and 8mm bottom margin
};

export async function generateQrBatchPdf(
  tokens: string[],
  batchNumber: number,
  baseUrl: string = CANONICAL_CREDENTIAL_BASE_URL,
  layout: LayoutOptions = DEFAULT_LAYOUT
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const batchNumStr = batchNumber.toString().padStart(5, '0');
  const itemsPerPage = layout.columns * layout.rows;

  // Guarantee strict ascending Crockford Base32 order (00 -> 0Z, 10 -> 1Z)
  const sortedTokens = [...tokens].sort((a, b) => {
    const valA = decodeCrockford(a);
    const valB = decodeCrockford(b);
    if (valA !== -1 && valB !== -1) return valA - valB;
    return a.localeCompare(b);
  });

  let index = 0;
  for (const token of sortedTokens) {
    if (index > 0 && index % itemsPerPage === 0) {
      doc.addPage();
    }

    const pageIndex = index % itemsPerPage;
    const col = pageIndex % layout.columns;
    const row = Math.floor(pageIndex / layout.columns);

    // Draw single styled micro-header line on the first item of each page per requirement:
    // "style the header a bit also add https://www.xmfclub.com plus add contact 8884503703 - Master Farhan. you can make the delimiters better, let it be small size but styled good also remember the the batch start adn end must be correct (example 00000 - 0000Z)"
    if (pageIndex === 0) {
      const pageStartToken = sortedTokens[index] || '';
      const pageEndIndex = Math.min(index + itemsPerPage - 1, sortedTokens.length - 1);
      const pageEndToken = sortedTokens[pageEndIndex] || '';

      const sep = '  •  ';
      const headerFontSize = 6.4;
      doc.setFontSize(headerFontSize);

      interface HeaderSpan {
        text: string;
        style: 'normal' | 'bold';
        color: [number, number, number];
      }

      const spans: HeaderSpan[] = [
        { text: 'xmfclub', style: 'bold', color: [220, 38, 38] }, // App Crimson
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: `BATCH #${batchNumStr}`, style: 'bold', color: [17, 24, 39] },
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: `${pageStartToken} – ${pageEndToken}`, style: 'bold', color: [17, 24, 39] },
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: '32 official badges', style: 'normal', color: [75, 85, 99] },
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: 'https://www.xmfclub.com', style: 'normal', color: [220, 38, 38] },
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: '8884503703 - Master Farhan', style: 'bold', color: [17, 24, 39] },
        { text: sep, style: 'normal', color: [156, 163, 175] },
        { text: 'a4 sheet', style: 'normal', color: [107, 114, 128] },
      ];

      // Measure total width to center perfectly
      let totalWidth = 0;
      for (const span of spans) {
        doc.setFont('helvetica', span.style);
        totalWidth += doc.getTextWidth(span.text);
      }

      let currentX = (210 - totalWidth) / 2;
      const headerY = 6.2;

      for (const span of spans) {
        doc.setFont('helvetica', span.style);
        doc.setTextColor(span.color[0], span.color[1], span.color[2]);
        doc.text(span.text, currentX, headerY);
        currentX += doc.getTextWidth(span.text);
      }
    }

    const cellX = layout.startX + col * (layout.cellWidth + layout.paddingX);
    const cellY = layout.startY + row * (layout.cellHeight + layout.paddingY);
    const centerX = cellX + layout.cellWidth / 2;
    const centerY = cellY + layout.cellHeight / 2;

    // 1. Draw circular badge with App-Style Primary Crimson Red Border (#DC2626)
    // and white circular fill
    doc.setDrawColor(220, 38, 38); // App primary red
    doc.setLineWidth(0.5); // Crisp, distinct badge border
    doc.setFillColor(255, 255, 255);
    doc.circle(centerX, centerY, layout.circleRadius, 'FD');

    const url = buildCredentialUrl('qrc', token, baseUrl);

    // 2. High resolution QR code data URL (fill module square, margin 0)
    const qrDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 0,
      width: 450,
      color: {
        dark: '#111827', // App dark card contrast
        light: '#FFFFFF',
      },
    });

    // 3. Center QR code inside the circular border
    const qrX = centerX - layout.qrSize / 2;
    const qrY = centerY - layout.qrSize / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, layout.qrSize, layout.qrSize);

    // 4. Print scrap-aisle human reference alongside badge (outside circular border)
    // Sits in the vertical trim aisle and gets trimmed off when badges are punched/cut
    const seqNum = (pageIndex + 1).toString().padStart(2, '0');
    const aisleX = centerX + layout.circleRadius + 2.8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(160, 160, 160);
    doc.text(`#${seqNum}`, aisleX, centerY - 1.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(110, 110, 110);
    doc.text(token, aisleX, centerY + 2.0);

    index++;
  }

  return doc.output('blob');
}

/**
 * Generates a full ZIP archive containing:
 * - qrc-batch-XXXXX.pdf: printable A4 sticker sheet with app-styled circular QR badges
 * - index.html: self-contained offline viewer displaying all 32 QR badges
 * - svg/: individual SVG files for all 32 badges
 * - png/: individual PNG files for all 32 badges
 * - tokens.csv: spreadsheet manifest of tokens and URLs
 * - manifest.json: structured JSON metadata
 */
export async function generateQrBatchZip(
  tokens: string[],
  batchNumber: number,
  baseUrl: string = CANONICAL_CREDENTIAL_BASE_URL,
  layout: LayoutOptions = DEFAULT_LAYOUT
): Promise<Blob> {
  const zip = new JSZip();
  const batchNumStr = batchNumber.toString().padStart(5, '0');
  const folderName = `qrc-batch-${batchNumStr}`;
  const root = zip.folder(folderName);

  if (!root) throw new Error('Failed to create zip folder');

  // Guarantee strict ascending Crockford Base32 order (00 -> 0Z, 10 -> 1Z)
  const sortedTokens = [...tokens].sort((a, b) => {
    const valA = decodeCrockford(a);
    const valB = decodeCrockford(b);
    if (valA !== -1 && valB !== -1) return valA - valB;
    return a.localeCompare(b);
  });

  // 1. Generate and embed the printable PDF sticker sheet directly inside the ZIP!
  const pdfBlob = await generateQrBatchPdf(sortedTokens, batchNumber, baseUrl, layout);
  const pdfArrayBuffer = await pdfBlob.arrayBuffer();
  root.file(`qrc-batch-${batchNumStr}.pdf`, pdfArrayBuffer);

  const svgFolder = root.folder('svg');
  const pngFolder = root.folder('png');

  interface ItemData {
    token: string;
    sequence: string;
    url: string;
    svgString: string;
    pngDataUrl: string;
  }

  const items: ItemData[] = [];
  const csvRows: string[] = ['Index,Sequence,Token,URL'];

  for (let i = 0; i < sortedTokens.length; i++) {
    const token = sortedTokens[i];
    const seqNum = (batchNumber * 32 + i + 1).toString().padStart(4, '0');
    const seq = `#${seqNum}`;
    const url = buildCredentialUrl('qrc', token, baseUrl);

    // Generate SVG string
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
    });
    if (svgFolder) {
      svgFolder.file(`${token}.svg`, svgString);
    }

    // Generate PNG Data URL
    const pngDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 512,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    });
    if (pngFolder) {
      const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
      pngFolder.file(`${token}.png`, base64Data, { base64: true });
    }

    items.push({
      token,
      sequence: seq,
      url,
      svgString,
      pngDataUrl,
    });

    csvRows.push(`${i + 1},"${seq}","${token}","${url}"`);
  }

  // Include tokens.csv
  root.file('tokens.csv', csvRows.join('\n'));

  // Include manifest.json
  root.file(
    'manifest.json',
    JSON.stringify(
      {
        batchNumber,
        batchNumberPadded: batchNumStr,
        quantity: sortedTokens.length,
        pdfFileName: `qrc-batch-${batchNumStr}.pdf`,
        startToken: sortedTokens[0] || '',
        endToken: sortedTokens[sortedTokens.length - 1] || '',
        generatedAt: new Date().toISOString(),
        baseUrl,
        tokens: items.map((item, idx) => ({
          index: idx + 1,
          token: item.token,
          sequence: item.sequence,
          url: item.url,
        })),
      },
      null,
      2
    )
  );

  // Generate self-contained, offline HTML viewer styled with app theme colors
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XMF QR Badges - Batch #${batchNumStr}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #09090b;
      color: #fafafa;
      padding: 32px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .title-group h1 {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #dc2626;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .title-group p {
      color: #a1a1aa;
      font-size: 13px;
      margin-top: 4px;
    }
    .badge-pill {
      display: inline-block;
      background: rgba(220, 38, 38, 0.15);
      color: #dc2626;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }
    .actions {
      display: flex;
      gap: 10px;
    }
    button, .btn {
      background: #dc2626;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      transition: background 0.2s;
    }
    button:hover, .btn:hover {
      background: #b91c1c;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #fafafa;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .card {
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: border-color 0.2s, transform 0.2s;
    }
    .card:hover {
      border-color: rgba(220, 38, 38, 0.5);
      transform: translateY(-2px);
    }
    .qr-wrapper {
      background: white;
      padding: 16px;
      border-radius: 50%;
      border: 3px solid #dc2626;
      margin-bottom: 14px;
      width: 144px;
      height: 144px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.25);
    }
    .qr-wrapper svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    .token-text {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #fafafa;
      margin-bottom: 4px;
    }
    .seq-text {
      font-size: 11px;
      color: #71717a;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .card-footer {
      width: 100%;
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 10px;
    }
    .url-link {
      color: #dc2626;
      font-size: 11px;
      text-decoration: none;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 140px;
    }
    .url-link:hover {
      text-decoration: underline;
    }
    .download-links {
      display: flex;
      gap: 6px;
    }
    .download-links a {
      color: #a1a1aa;
      font-size: 10px;
      text-decoration: none;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.05);
    }
    .download-links a:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    @media print {
      body {
        background: white !important;
        color: black !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      header {
        border-bottom: 1px solid #ddd;
        margin-bottom: 12px;
        padding-bottom: 8px;
      }
      .title-group h1 {
        color: #dc2626 !important;
        font-size: 16px;
      }
      .grid {
        grid-template-columns: repeat(4, 1fr) !important;
        gap: 8px !important;
      }
      .card {
        background: white !important;
        border: none !important;
        padding: 6px !important;
        page-break-inside: avoid;
      }
      .qr-wrapper {
        border: 2px solid #dc2626 !important;
        border-radius: 50% !important;
        width: 100px !important;
        height: 100px !important;
        padding: 12px !important;
        margin-bottom: 6px;
      }
      .token-text {
        color: black !important;
        font-size: 12px;
      }
      .seq-text {
        color: #555 !important;
        font-size: 9px;
      }
      .card-footer {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="title-group">
        <h1>XMF Martial Arts Club <span class="badge-pill">Batch #${batchNumStr}</span></h1>
        <p>32 Official Member Credentials • Tokens: ${sortedTokens[0]} – ${sortedTokens[sortedTokens.length - 1]} • https://www.xmfclub.com • Contact: 8884503703 - Master Farhan</p>
      </div>
      <div class="actions no-print">
        <a href="qrc-batch-${batchNumStr}.pdf" download="qrc-batch-${batchNumStr}.pdf" class="btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download PDF Sheet
        </a>
        <button class="btn-secondary" onclick="window.print()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Print Sheet
        </button>
        <button class="btn-secondary" onclick="copyAllLinks()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy All Links
        </button>
      </div>
    </header>

    <div class="grid">
      ${items
        .map(
          (item) => `
      <div class="card">
        <div class="qr-wrapper">
          ${item.svgString}
        </div>
        <div class="token-text">${item.token}</div>
        <div class="seq-text">${item.sequence}</div>
        <div class="card-footer no-print">
          <a class="url-link" href="${item.url}" target="_blank" title="${item.url}">Open Link</a>
          <div class="download-links">
            <a href="svg/${item.token}.svg" download="${item.token}.svg">SVG</a>
            <a href="png/${item.token}.png" download="${item.token}.png">PNG</a>
          </div>
        </div>
      </div>`
        )
        .join('')}
    </div>
  </div>

  <script>
    function copyAllLinks() {
      const links = ${JSON.stringify(items.map((i) => i.url))}.join('\\n');
      navigator.clipboard.writeText(links).then(() => {
        alert('Copied 32 credential URLs to clipboard!');
      }).catch(err => {
        prompt('Copy URLs manually:', links);
      });
    }
  </script>
</body>
</html>`;

  root.file('index.html', htmlContent);

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Backward compatibility alias for generateQrBatchZip
 */
export const generateQrBatchSvgZip = generateQrBatchZip;
