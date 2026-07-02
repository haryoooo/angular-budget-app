import { NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';

import { PageLayoutComponent } from '@layouts/page-layout/page-layout.component';
import { ReceiptLineItem, ReceiptScanJson } from '@models/receipt-scan.model';
import { ReceiptOcrService } from '@services/receipt-ocr.service';
import { StoreService } from '@services/store.service';
import { TransactionService } from '@services/transaction.service';
import { formatMoney } from '@helpers/moneyFormatter.helper';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-receipt-scan',
  templateUrl: './receipt-scan.component.html',
  styleUrls: ['./receipt-scan.component.scss'],
  standalone: true,
  imports: [PageLayoutComponent, NgIf, NgFor, ToastModule],
  providers: [MessageService],
})
export class ReceiptScanComponent implements OnInit, OnDestroy {
  public processing = false;
  public progress = 0;
  public progressLabel = '';
  public scanJson: ReceiptScanJson | null = null;
  public editableItems: ReceiptLineItem[] = [];
  public showRawJson = false;
  public isGuest = this.storeService.isGuest();
  /** Object URL for the photo the user picked (shown next to the digital struk). */
  public receiptPhotoUrl: string | null = null;

  constructor(
    private receiptOcr: ReceiptOcrService,
    private transactionService: TransactionService,
    private storeService: StoreService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // No wallet selected yet - nothing to save the scanned receipt against
    if (!this.isGuest && !this.transactionService._stateWallet.value) {
      this.toast('warn', 'No wallet selected', 'Please select or create a wallet first.');
      this.router.navigateByUrl('/wallet', { replaceUrl: true });
      return;
    }

    setTimeout(() => this.storeService.isLoading.set(false), 300);
  }

  ngOnDestroy(): void {
    this.revokeReceiptPhoto();
  }

  onPickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !file.type.startsWith('image/')) {
      this.toast('warn', 'Invalid file', 'Please choose an image (JPEG, PNG, WebP).');
      return;
    }
    void this.runOcr(file);
  }

  private async runOcr(file: File): Promise<void> {
    this.processing = true;
    this.progress = 0;
    this.progressLabel = '';
    this.scanJson = null;
    this.editableItems = [];
    this.setReceiptPhoto(file);
    this.cdr.detectChanges();

    try {
      const { json, validation } = await this.receiptOcr.scanReceiptImage(
        file,
        (pct, status) => {
          this.progress = pct;
          this.progressLabel = status;
          this.cdr.markForCheck();
        }
      );

      this.scanJson = json;

      if (!validation.ok) {
        this.toast('warn', 'Not a valid receipt', validation.reason ?? 'Try another image.');
        return;
      }

      if (json.items.length === 0) {
        this.toast(
          'warn',
          'Could not read items',
          'No product lines with prices were found. Open “OCR text” below to see what was read.'
        );
        return;
      }

      this.editableItems = json.items.map((i) => ({ ...i }));
      this.toast('success', 'Receipt scanned', 'Review the lines below, then add to your budget.');
    } catch (e) {
      console.error(e);
      this.toast(
        'error',
        'Scan failed',
        e instanceof Error ? e.message : 'Could not process this image.'
      );
    } finally {
      this.processing = false;
      this.cdr.detectChanges();
    }
  }

  updateItemName(index: number, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    const row = this.editableItems[index];
    if (!row) return;
    row.name = v;
  }

  updateItemQty(index: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const q = Math.max(1, parseInt(raw.replace(/\D/g, ''), 10) || 1);
    const row = this.editableItems[index];
    if (!row) return;
    row.qty = q;
    row.unitPrice = Math.round(row.lineTotal / row.qty);
    this.cdr.detectChanges();
  }

  /** Line total (matches the amount column on the struk). */
  updateItemLineTotal(index: number, event: Event): void {
    const raw = (event.target as HTMLInputElement).value.replace(/[.,\s]/g, '');
    const n = Math.max(0, parseInt(raw, 10) || 0);
    const row = this.editableItems[index];
    if (!row) return;
    row.lineTotal = n;
    row.unitPrice = row.qty > 0 ? Math.round(row.lineTotal / row.qty) : 0;
    this.cdr.detectChanges();
  }

  removeItem(index: number): void {
    if (index < 0 || index >= this.editableItems.length) return;
    this.editableItems.splice(index, 1);
    this.cdr.detectChanges();
  }

  getJsonPreview(): string {
    if (!this.scanJson) return '';
    return JSON.stringify(
      {
        items: this.editableItems.map((i) => ({
          qty: i.qty,
          name: i.name,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
        })),
        resizedWidth: this.scanJson.resizedWidth,
        resizedHeight: this.scanJson.resizedHeight,
      },
      null,
      2
    );
  }

  async addTransactions(): Promise<void> {
    const valid = this.editableItems.filter(
      (i) => i.name.trim().length > 0 && i.lineTotal > 0
    );
    if (valid.length === 0) {
      this.toast('warn', 'Nothing to add', 'Fix or remove empty lines.');
      return;
    }

    this.processing = true;
    this.cdr.detectChanges();

    try {
      for (const item of valid) {
        const ts = moment().format('YYYY-MM-DD HH:mm:ss');
        await this.transactionService.setLatestTransactions(
          {
            type: 'expense',
            date: moment().format('dddd, MMMM D, YYYY'),
            month: moment().month() + 1,
            desc: `${item.name.trim()} (×${item.qty})`,
            amount: item.lineTotal,
            lastUpdate: ts,
            createdAt: ts,
          },
          this.isGuest
        );
      }

      this.toast('success', 'Added', `${valid.length} expense(s) saved.`);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e) {
      console.error(e);
      this.toast('error', 'Save failed', 'Could not save transactions.');
    } finally {
      this.processing = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigateByUrl('/home', { replaceUrl: true });
  }

  formatRp(n: number): string {
    return formatMoney(n);
  }

  /** Same style as many thermal struk: comma thousands (e.g. 30,000). */
  formatReceiptAmount(n: number): string {
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  clearScan(): void {
    this.revokeReceiptPhoto();
    this.scanJson = null;
    this.editableItems = [];
    this.cdr.detectChanges();
  }

  private setReceiptPhoto(file: File): void {
    this.revokeReceiptPhoto();
    this.receiptPhotoUrl = URL.createObjectURL(file);
  }

  private revokeReceiptPhoto(): void {
    if (this.receiptPhotoUrl) {
      URL.revokeObjectURL(this.receiptPhotoUrl);
      this.receiptPhotoUrl = null;
    }
  }

  private toast(severity: string, summary: string, detail: string): void {
    this.messageService.add({
      severity: severity.toLowerCase(),
      summary,
      detail,
    });
  }
}
