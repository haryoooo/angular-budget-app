// delete-modal.component.ts
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-modal',
  template: `
    <div class="delete-modal">
      <h2 mat-dialog-title>Delete Transaction</h2>
      <mat-dialog-content>
        Are you sure you want to delete this transaction?
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-button color="warn" (click)="onConfirm()">Delete</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-modal {
      padding: 20px;
    }
    mat-dialog-actions {
      margin-top: 20px;
    }
  `]
})
export class DeleteModalComponent {
  constructor(public dialogRef: MatDialogRef<DeleteModalComponent>) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}