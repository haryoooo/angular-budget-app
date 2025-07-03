import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal-delete',
  templateUrl: './modal-delete.component.html',
  styleUrls: ['./modal-delete.component.scss'],
  standalone: true,
})
export class ModalDeleteComponent {
  @Input() isModalOpen: boolean = false;
  @Input() isSubmitted: boolean = false;
  @Input() queryId: any = this.route.snapshot.queryParams['id'];

  @Output() openModal = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirmTransaction = new EventEmitter<void>();
}
