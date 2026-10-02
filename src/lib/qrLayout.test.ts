import { describe, it, expect } from 'vitest';
import { DEFAULT_LAYOUT, generateQrBatchPdf, generateQrBatchZip } from './qrLayout';
import { calculateBatchTokens } from './credentialToken';
import JSZip from 'jszip';

describe('qrLayout', () => {
  it('DEFAULT_LAYOUT stays strictly within A4 boundaries (210 x 297 mm)', () => {
    const a4Width = 210;
    const a4Height = 297;

    // Width check
    const totalGridWidth =
      DEFAULT_LAYOUT.columns * DEFAULT_LAYOUT.cellWidth +
      (DEFAULT_LAYOUT.columns - 1) * DEFAULT_LAYOUT.paddingX;
    const rightMargin = a4Width - (DEFAULT_LAYOUT.startX + totalGridWidth);

    expect(DEFAULT_LAYOUT.startX).toBeGreaterThanOrEqual(7);
    expect(rightMargin).toBeGreaterThanOrEqual(7);
    expect(DEFAULT_LAYOUT.startX + totalGridWidth).toBeLessThan(a4Width);

    // Height check (8 rows)
    const totalGridHeight =
      DEFAULT_LAYOUT.rows * DEFAULT_LAYOUT.cellHeight +
      (DEFAULT_LAYOUT.rows - 1) * DEFAULT_LAYOUT.paddingY;
    const bottomMargin = a4Height - (DEFAULT_LAYOUT.startY + totalGridHeight);

    expect(DEFAULT_LAYOUT.startY).toBeGreaterThanOrEqual(9);
    expect(bottomMargin).toBeGreaterThanOrEqual(7.5);
    expect(DEFAULT_LAYOUT.startY + totalGridHeight).toBeLessThan(a4Height);

    // Verify 2.5 cm (25mm) NFC chip fits inside the circular border
    const circleDiameter = DEFAULT_LAYOUT.circleRadius * 2;
    expect(circleDiameter).toBeGreaterThanOrEqual(25); // >= 2.5 cm (34mm provides 4.5mm perimeter margin)

    // Verify calibrated QR code (20mm) inside 34mm enclosure provides comfortable quiet zone
    expect(DEFAULT_LAYOUT.qrSize).toBe(20);
    const halfDiag = (DEFAULT_LAYOUT.qrSize / 2) * Math.SQRT2;
    const cornerClearance = DEFAULT_LAYOUT.circleRadius - halfDiag;
    expect(cornerClearance).toBeGreaterThanOrEqual(2.5); // ~2.86mm breathing room at the closest corners
  });

  it('generateQrBatchPdf creates a non-empty PDF blob for 32 tokens', async () => {
    const { tokens } = calculateBatchTokens(0);
    const pdfBlob = await generateQrBatchPdf(tokens, 0, 'https://xmfclub.com');

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.size).toBeGreaterThan(1000);
    expect(pdfBlob.type).toContain('pdf');
  });

  it('generateQrBatchZip creates a zip containing index.html, SVGs, PNGs, and tokens.csv', async () => {
    const { tokens } = calculateBatchTokens(0);
    const zipBlob = await generateQrBatchZip(tokens, 0, 'https://xmfclub.com');

    expect(zipBlob).toBeInstanceOf(Blob);
    expect(zipBlob.size).toBeGreaterThan(1000);

    // Unzip in memory to verify contents
    const zip = await JSZip.loadAsync(zipBlob);
    const folder = zip.folder('qrc-batch-00000');
    expect(folder).not.toBeNull();

    const indexHtml = await folder!.file('index.html')?.async('string');
    expect(indexHtml).toContain('XMF QR Badges - Batch #00000');
    expect(indexHtml).toContain(tokens[0]);
    expect(indexHtml).toContain('window.print()');

    const csv = await folder!.file('tokens.csv')?.async('string');
    expect(csv).toContain(tokens[0]);
    expect(csv).toContain(tokens[31]);

    const manifest = await folder!.file('manifest.json')?.async('string');
    expect(manifest).toBeDefined();
    const manifestJson = JSON.parse(manifest!);
    expect(manifestJson.quantity).toBe(32);
    expect(manifestJson.startToken).toBe(tokens[0]);
    expect(manifestJson.endToken).toBe(tokens[31]);

    // Check SVG and PNG files
    const firstSvg = await folder!.file(`svg/${tokens[0]}.svg`)?.async('string');
    expect(firstSvg).toContain('<svg');

    const firstPng = await folder!.file(`png/${tokens[0]}.png`)?.async('uint8array');
    expect(firstPng?.length).toBeGreaterThan(100);

    // Check PDF file inside zip
    const pdfInZip = await folder!.file('qrc-batch-00000.pdf')?.async('uint8array');
    expect(pdfInZip).toBeDefined();
    expect(pdfInZip?.length).toBeGreaterThan(1000);
  });

  it('guarantees tokens are sorted ascending even if provided in reverse order (e.g. Z first)', async () => {
    const { tokens } = calculateBatchTokens(1); // Batch 1: '000010' to '00001Z'
    const reversed = [...tokens].reverse(); // Starts with '00001Z'
    expect(reversed[0]).toBe('00001Z');
    expect(reversed[31]).toBe('000010');

    const zipBlob = await generateQrBatchZip(reversed, 1, 'https://xmfclub.com');
    const zip = await JSZip.loadAsync(zipBlob);
    const folder = zip.folder('qrc-batch-00001');
    const manifest = await folder!.file('manifest.json')?.async('string');
    const manifestJson = JSON.parse(manifest!);

    expect(manifestJson.startToken).toBe('000010');
    expect(manifestJson.endToken).toBe('00001Z');
    expect(manifestJson.tokens[0].token).toBe('000010');
    expect(manifestJson.tokens[31].token).toBe('00001Z');
  });
});
