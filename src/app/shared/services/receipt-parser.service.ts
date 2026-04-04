import { Injectable } from '@angular/core';
import {
  ReceiptLineItem,
  ReceiptScanJson,
  ReceiptValidationResult,
} from '@models/receipt-scan.model';

function parseMoneyToken(raw: string): number | null {
  let s = raw.replace(/Rp\.?\s*/gi, '').trim();
  if (!s) return null;

  if (/^\d{1,3}(\s+\d{3})+$/.test(s)) {
    const n = parseInt(s.replace(/\s+/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }

  if (/^\d{1,3}(,\d{3})+$/.test(s)) {
    const n = parseInt(s.replace(/,/g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }

  if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    const n = parseInt(s.replace(/\./g, ''), 10);
    return Number.isNaN(n) ? null : n;
  }

  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  }

  if (/^\d{2}$/.test(s)) {
    const n = parseInt(s, 10);
    if (n >= 50 && n <= 99) return n;
  }

  const compact = s.replace(/[.,\s]/g, '');
  if (/^\d+$/.test(compact)) {
    const n = parseInt(compact, 10);
    return Number.isNaN(n) ? null : n;
  }

  return null;
}

function normalizeReceiptLine(line: string): string {
  let s = line.replace(/\s+/g, ' ').trim();
  s = s.replace(/(\d{1,3})\s*\.\s*(\d{3})\s*$/i, '$1.$2');
  s = s.replace(/(\d{1,3})\s*,\s*(\d{3})\s*$/i, '$1,$2');
  s = s.replace(/(\d{1,3})\s+(\d{3})\s*$/i, (_, a: string, b: string) => {
    const merged = `${a}${b}`;
    return /^\d{4,}$/.test(merged) ? merged : `${a} ${b}`;
  });
  return s;
}

function preprocessOcrText(raw: string): string {
  let s = raw
    .normalize('NFKC')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/[，﹐٫]/g, ',')
    .replace(/[٬]/g, ',');
  s = s.replace(/[\uFF10-\uFF19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30)
  );
  s = s.replace(/(\d)\s*,\s*(?=\d{3}\b)/g, '$1,');
  s = s.replace(/(\d)\s*\.\s*(?=\d{3}\b)/g, '$1.');
  // Thermal struk often OCRs thousands as "30 000" — merge so price tokens match the receipt.
  s = s.replace(/\b(\d{1,3}(?:\s+\d{3})+)\b/g, (chunk) =>
    chunk.replace(/\s+/g, '')
  );
  // Common OCR: letter O between digits → 0 (e.g. "30.O00" or "3O000")
  s = s.replace(/(\d)[Oo](\d)/g, '$10$2');
  s = s.replace(/(\d)[Oo](\d)/g, '$10$2');
  s = s.replace(/[Oo](\d{3})\b/g, '0$1');
  return s;
}

const PRICE_TOKEN_FOR_SPLIT =
  '\\d{1,3}(?:,\\d{3})+|\\d{1,3}(?:\\.\\d{3})+|\\d{4,8}';

function splitMergedOcrLine(line: string): string[] {
  const s = line.trim();
  if (s.length < 12) {
    return [s];
  }
  // After a line total, the next struk line usually starts with qty (1–4 digits) + space.
  // Do not require a letter after qty — OCR often drops or garbles it.
  const splitRe = new RegExp(
    `(${PRICE_TOKEN_FOR_SPLIT})\\s+(?=\\d{1,4}\\s)`,
    'g'
  );
  const withBreaks = s.replace(splitRe, '$1\n');
  const parts = withBreaks
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : [s];
}

function looksLikeProductName(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return false;
  if (/[A-Za-z\u0080-\uFFFF]/.test(t)) return true;
  return (
    /[A-Za-z0-9].*[A-Za-z0-9]/i.test(t) &&
    !/^\d+$/.test(t.replace(/\s/g, ''))
  );
}

/**
 * Qty + name from the text before a line total / price hit.
 * Handles leading qty, `N x name`, `name N x`, and `name N` (qty before price, no x).
 * Trailing numeric qty uses 1–3 digits only to avoid mistaking years/codes for quantity.
 */
function parseQtyFromItemNameSegment(raw: string): { qty: number; name: string } {
  let qty = 1;
  let name = raw.trim();

  const leadingQty = name.match(/^(\d{1,4})\s+(.+)$/);
  if (
    leadingQty &&
    !/^[xX×]/.test(leadingQty[2].trim()) &&
    parseInt(leadingQty[1], 10) >= 1 &&
    parseInt(leadingQty[1], 10) <= 999 &&
    looksLikeProductName(leadingQty[2])
  ) {
    qty = parseInt(leadingQty[1], 10);
    name = leadingQty[2].trim();
  }

  const qtyPrefix = name.match(/^(\d{1,4})\s*[xX×]\s*(.+)$/);
  if (qtyPrefix) {
    qty = Math.max(1, parseInt(qtyPrefix[1], 10) || 1);
    name = qtyPrefix[2].trim();
  } else {
    const qtyMiddle = name.match(/^(.+?)\s+(\d{1,4})\s*[xX×]\s*$/i);
    if (qtyMiddle) {
      name = qtyMiddle[1].trim();
      qty = Math.max(1, parseInt(qtyMiddle[2], 10) || 1);
    } else {
      const qtyTrailing = name.match(/^(.+?)\s+(\d{1,3})\s*$/);
      if (qtyTrailing) {
        const n = parseInt(qtyTrailing[2], 10);
        const head = qtyTrailing[1].trim();
        if (
          n >= 1 &&
          n <= 999 &&
          head.length >= 2 &&
          looksLikeProductName(head)
        ) {
          name = head;
          qty = n;
        }
      }
    }
  }

  return { qty, name };
}

/** All plausible rupiah spans in reading order (handles OCR missing commas). */
interface PriceHit {
  start: number;
  end: number;
  amount: number;
  raw: string;
}

function isLikelyHeaderYear(amount: number, index: number): boolean {
  return amount >= 1900 && amount <= 2100 && index < 120;
}

/**
 * Find every money-like number left-to-right: comma/dot thousands first, then plain 4–7 digit
 * runs that do not overlap formatted spans (catches OCR that drops commas: 30000, 175000).
 */
function findAllPriceHits(oneLine: string): PriceHit[] {
  const hits: PriceHit[] = [];

  const add = (m: RegExpExecArray): void => {
    const ix = m.index ?? 0;
    const raw = m[0];
    const amount = parseMoneyToken(raw.replace(/\s/g, ''));
    if (amount == null || amount < 50) return;
    if (isLikelyHeaderYear(amount, ix)) return;
    hits.push({ start: ix, end: ix + raw.length, amount, raw });
  };

  const formatted = [
    /\d{1,3}(?:,\d{3})+(?:,\d{2})?/g,
    /\d{1,3}(?:\.\d{3})+(?:,\d{2})?/g,
  ];
  for (const re of formatted) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(oneLine)) !== null) {
      add(m);
    }
  }

  const covered = new Set<number>();
  for (const h of hits) {
    for (let p = h.start; p < h.end; p++) {
      covered.add(p);
    }
  }

  const plain = /\b\d{4,7}\b/g;
  let m: RegExpExecArray | null;
  plain.lastIndex = 0;
  while ((m = plain.exec(oneLine)) !== null) {
    let overlap = false;
    const from = m.index ?? 0;
    const to = from + m[0].length;
    for (let p = from; p < to; p++) {
      if (covered.has(p)) {
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      add(m);
    }
  }

  hits.sort((a, b) => a.start - b.start);
  return hits;
}

function extractLineAmountAndPrefix(line: string): {
  amount: number;
  namePart: string;
} | null {
  const lineNorm = normalizeReceiptLine(line);

  const hits = findAllPriceHits(lineNorm);
  if (hits.length > 0) {
    const last = hits[hits.length - 1]!;
    const namePart = lineNorm.slice(0, last.start).trim();
    if (namePart.length >= 2 && last.amount >= 50) {
      return { amount: last.amount, namePart };
    }
  }

  const tryPrice = (
    priceStr: string,
    cutIndex: number
  ): { amount: number; namePart: string } | null => {
    const lineTotalAmount = parseMoneyToken(priceStr);
    if (lineTotalAmount == null || lineTotalAmount < 50) return null;
    const namePart = lineNorm.slice(0, cutIndex).trim();
    if (namePart.length < 2) return null;
    return { amount: lineTotalAmount, namePart };
  };

  const priceAtEnd =
    lineNorm.match(
      /(?:Rp\.?\s*)?([\d]{1,3}(?:,\d{3})+|[\d]{1,3}(?:\.\d{3})+(?:,\d{2})?|\d{3,})(?:\s*)$/i
    ) || lineNorm.match(/(?:Rp\.?\s*)(\d[\d.,\s]*)\s*$/i);

  if (priceAtEnd) {
    const raw = priceAtEnd[1].replace(/\s+/g, '');
    const cut = priceAtEnd.index ?? lineNorm.length;
    const got = tryPrice(raw, cut);
    if (got) return got;
  }

  const parts = lineNorm.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    for (let take = 1; take <= 4 && take < parts.length; take++) {
      const tail = parts.slice(-take).join(' ');
      const head = parts.slice(0, -take).join(' ');
      const n =
        parseMoneyToken(tail.replace(/\s/g, '')) ?? parseMoneyToken(tail);
      if (n != null && n >= 50 && head.length >= 2) {
        return { amount: n, namePart: head };
      }
    }
  }

  return null;
}

function isNoiseNameSegment(s: string): boolean {
  const t = s.trim();
  if (t.length < 2) return true;
  // Old rule rejected short ALL-CAPS names (e.g. "ICE TEA"); thermal OCR often has no lowercase.
  if (t.length < 8 && !/[a-z\u0080-\uFFFF]/i.test(t) && !/\d/.test(t)) return true;
  return false;
}

function sumLineTotals(items: ReceiptLineItem[]): number {
  return items.reduce((acc, i) => acc + i.lineTotal, 0);
}

function countZeroAmountLines(items: ReceiptLineItem[]): number {
  return items.filter((i) => i.lineTotal <= 0).length;
}

/**
 * One row per price token: text before each match is qty + name for that line.
 */
function parseItemsByScanningPrices(ocrText: string): ReceiptLineItem[] {
  const oneLine = preprocessOcrText(ocrText)
    .replace(/\r\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hits = findAllPriceHits(oneLine);
  const items: ReceiptLineItem[] = [];
  let prevEnd = 0;

  for (const hit of hits) {
    const ix = hit.start;
    const priceStr = hit.raw;
    const rawName = oneLine
      .slice(prevEnd, ix)
      .replace(/^[-_\s.]+/, '')
      .trim();
    prevEnd = hit.end;

    const amount = hit.amount;
    if (amount < 50) continue;

    if (
      /^(sub\s*total|total|diskon|tax|ppn|pajak|grand\s*total|bayar|kembali)$/i.test(
        rawName.trim()
      ) ||
      /^subtotal$/i.test(rawName.trim())
    ) {
      continue;
    }

    if (rawName.length < 2 || isNoiseNameSegment(rawName)) continue;

    const parsed = parseQtyFromItemNameSegment(rawName);
    let name = parsed.name;
    const qty = parsed.qty;

    name = stripLeadingItemLabel(name.replace(/\s{2,}/g, ' ')).slice(0, 200);
    if (name.length < 2) continue;

    const unitPrice = qty > 1 ? Math.round(amount / qty) : amount;

    items.push({
      qty,
      name,
      unitPrice,
      lineTotal: amount,
    });
  }

  return expandIfSingleMergedLine(items, oneLine);
}

function stripLeadingItemLabel(s: string): string {
  return s.replace(/^(item|items|nama|qty)\s*[:\s]*/i, '').trim();
}

/**
 * OCR sometimes drops all prices except the last: one amount, name = "Mie… 1 Nasi… 7 Ice Tea".
 * Split only after a letter (end of a product word) before the next `qty + name` — not the first qty on the line.
 * If the full text actually contains one price per row, backfill every segment from findAllPriceHits.
 * Otherwise only the last segment keeps the single scanned amount.
 */
function expandIfSingleMergedLine(
  items: ReceiptLineItem[],
  oneLine: string
): ReceiptLineItem[] {
  if (items.length !== 1) return items;
  const row = items[0];
  const name = row.name;
  const re =
    /(?<=[A-Za-z\u0080-\uFFFF])\s+(?=\d{1,4}\s+[A-Za-z\u0080-\uFFFF])/g;
  const hits: number[] = [];
  let hm: RegExpExecArray | null;
  while ((hm = re.exec(name)) !== null) {
    hits.push(hm.index);
  }
  if (hits.length < 1) return items;

  const parts: string[] = [];
  parts.push(name.slice(0, hits[0]).trim());
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1] : name.length;
    parts.push(name.slice(hits[i], end).trim());
  }

  const out: ReceiptLineItem[] = [];
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    const parsed = parseQtyFromItemNameSegment(seg);
    let nm = parsed.name.replace(/\s{2,}/g, ' ').trim();
    const q = parsed.qty;
    if (i === 0) {
      nm = stripLeadingItemLabel(nm);
    }
    if (nm.length < 1) continue;
    out.push({
      qty: q,
      name: nm,
      unitPrice: 0,
      lineTotal: 0,
    });
  }
  if (out.length <= 1) return items;

  const allHits = findAllPriceHits(oneLine);
  if (allHits.length >= out.length) {
    for (let i = 0; i < out.length; i++) {
      const h = allHits[i];
      const r = out[i];
      if (!h || !r) continue;
      r.lineTotal = h.amount;
      r.unitPrice = r.qty > 1 ? Math.round(h.amount / r.qty) : h.amount;
    }
    return out;
  }

  const last = out[out.length - 1];
  if (last) {
    last.lineTotal = row.lineTotal;
    last.unitPrice =
      last.qty > 1 ? Math.round(row.lineTotal / last.qty) : row.lineTotal;
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class ReceiptParserService {
  parseLineItems(ocrText: string): ReceiptLineItem[] {
    const byScan = parseItemsByScanningPrices(ocrText);
    const byLines = this.parseItemsFromSplitLines(ocrText);

    const scanSum = sumLineTotals(byScan);
    const linesSum = sumLineTotals(byLines);
    const scanZeros = countZeroAmountLines(byScan);
    const lineZeros = countZeroAmountLines(byLines);

    // Line-split keeps one amount per struk row when OCR keeps newlines. Price-scan + expand can yield many 0s.
    if (byLines.length > 0) {
      if (byLines.length > byScan.length) {
        return byLines;
      }
      if (
        byLines.length === byScan.length &&
        (linesSum > scanSum || lineZeros < scanZeros)
      ) {
        return byLines;
      }
    }

    if (byScan.length > 0) {
      return byScan;
    }
    return byLines;
  }

  /** Line-oriented parse: prefer Tesseract’s line breaks, then split merged “one blob” text. */
  private parseItemsFromSplitLines(ocrText: string): ReceiptLineItem[] {
    const preprocessed = preprocessOcrText(ocrText);

    const parseChunkLines = (lines: string[]): ReceiptLineItem[] => {
      const items: ReceiptLineItem[] = [];
      for (const line of lines) {
        if (this.isNoiseLine(line)) continue;

        const extracted = extractLineAmountAndPrefix(line);
        if (!extracted) continue;

        const lineTotalAmount = extracted.amount;
        const parsed = parseQtyFromItemNameSegment(extracted.namePart);
        let namePart = parsed.name;
        const qty = parsed.qty;

        const name = stripLeadingItemLabel(
          namePart.replace(/\s{2,}/g, ' ')
        ).slice(0, 200);
        if (name.length < 2) continue;

        const unitPrice =
          qty > 1 ? Math.round(lineTotalAmount / qty) : lineTotalAmount;

        items.push({
          qty,
          name,
          unitPrice,
          lineTotal: lineTotalAmount,
        });
      }
      return items;
    };

    // 1) Keep each OCR line separate — collapsing \\n was hiding one price per row.
    const physicalLines = preprocessed
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => l.length >= 3);

    const fromPhysical = parseChunkLines(physicalLines);

    const oneLine = preprocessed
      .replace(/\r\n?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const mergedChunks = splitMergedOcrLine(oneLine);
    const fromMerged = parseChunkLines(mergedChunks);

    const score = (xs: ReceiptLineItem[]) =>
      xs.filter((i) => i.lineTotal > 0).length * 10000 + sumLineTotals(xs);

    if (fromPhysical.length === 0) return fromMerged;
    if (fromMerged.length === 0) return fromPhysical;
    return score(fromPhysical) >= score(fromMerged) ? fromPhysical : fromMerged;
  }

  validatePurchaseReceipt(
    fullText: string,
    items: ReceiptLineItem[]
  ): ReceiptValidationResult {
    const text = fullText.trim();

    if (/^https?:\/\//i.test(text)) {
      return { ok: false, reason: 'This does not look like a paper receipt.' };
    }

    if (items.length >= 1) {
      return { ok: true };
    }

    if (text.length < 20) {
      return {
        ok: false,
        reason:
          'Text from the image is too short. Please use a clearer photo of the receipt.',
      };
    }

    return {
      ok: false,
      reason:
        'Could not find product lines with prices. Try better lighting, hold the camera steady, or crop so each item line is readable.',
    };
  }

  buildScanJson(
    rawText: string,
    width: number,
    height: number
  ): ReceiptScanJson {
    const items = this.parseLineItems(rawText);
    return {
      items,
      rawText,
      resizedWidth: width,
      resizedHeight: height,
    };
  }

  private isNoiseLine(line: string): boolean {
    const l = line.toLowerCase().trim();
    const t = line.trim();
    if (t.length < 3) return true;
    if (t.length >= 8 && !/[a-z0-9]/i.test(t)) return true;
    if (
      /^(subtotal|total|diskon|discount|tax|ppn|pajak|grand\s*total|change|kembali|cash|tunai|visa|master|card|payment)\b/i.test(
        l
      )
    ) {
      return true;
    }
    if (/^page\s+\d/i.test(l)) return true;
    return false;
  }
}
