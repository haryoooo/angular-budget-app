/** One line from a purchase receipt (OCR → structured data). */
export interface ReceiptLineItem {
  qty: number;
  name: string;
  /**
   * Per-unit amount when the right column is a line total (qty × unit); otherwise same as line total.
   */
  unitPrice: number;
  /** Amount printed on the receipt for that row (often the right column). */
  lineTotal: number;
}

/** JSON payload produced from a scanned receipt image. */
export interface ReceiptScanJson {
  items: ReceiptLineItem[];
  rawText: string;
  resizedWidth: number;
  resizedHeight: number;
}

export interface ReceiptValidationResult {
  ok: boolean;
  reason?: string;
}
