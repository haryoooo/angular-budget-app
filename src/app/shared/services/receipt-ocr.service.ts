import { Injectable } from '@angular/core';
import { ReceiptImageService } from './receipt-image.service';
import { ReceiptParserService } from './receipt-parser.service';
import {
  ReceiptScanJson,
  ReceiptValidationResult,
} from '@models/receipt-scan.model';

export interface ReceiptOcrOutcome {
  json: ReceiptScanJson;
  validation: ReceiptValidationResult;
}

@Injectable({ providedIn: 'root' })
export class ReceiptOcrService {
  constructor(
    private imageService: ReceiptImageService,
    private parser: ReceiptParserService
  ) {}

  /**
   * Resize image → OCR (eng + Indonesian) → structured JSON + validation.
   */
  async scanReceiptImage(
    file: File,
    onProgress?: (percent: number, status: string) => void
  ): Promise<ReceiptOcrOutcome> {
    onProgress?.(0, 'Preparing image for OCR…');
    const { blob, width, height } = await this.imageService.prepareImageForOcr(file);

    onProgress?.(15, 'Loading OCR…');
    const { createWorker } = await import('tesseract.js');

    const worker = await createWorker('eng+ind', 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'recognizing text' && m.progress != null) {
          const p = 15 + Math.round(m.progress * 80);
          onProgress?.(p, 'Reading text…');
        }
      },
    });

    let rawText = '';
    try {
      // PSM 4 = single column (typical thermal struk) — keeps line breaks so each row keeps its own price.
      // PSM 3 often merges the column into one line → only the last amount survives parsing.
      // preserve_interword_spaces helps qty / name / amount columns. Typings omit these — pass as Record.
      const result = await worker.recognize(blob, {
        tessedit_pageseg_mode: '4',
        preserve_interword_spaces: '1',
      } as Record<string, string>);
      rawText = result.data.text ?? '';
    } finally {
      await worker.terminate();
    }

    onProgress?.(98, 'Parsing receipt…');
    const json = this.parser.buildScanJson(rawText, width, height);
    const validation = this.parser.validatePurchaseReceipt(rawText, json.items);
    onProgress?.(100, 'Done');

    return { json, validation };
  }
}
