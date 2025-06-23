import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ImportSummaryService, FailedRecord } from '../../services/import-summary.service';

@Component({
  selector: 'app-step5-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './step5-summary.component.html'
})
export class Step5SummaryComponent implements OnInit {
  @Output() restart = new EventEmitter<void>();
  @Output() finish  = new EventEmitter<void>();

  // summary data
  total = 0;
  successful = 0;
  failed = 0;
  failedRecords: FailedRecord[] = [];

  // modal state
  showModal = false;
  modalErrors: string[] = [];

  // ——— Save-template panel state ———
  templateName = '';
  permission   = 'public';

  constructor(private summarySvc: ImportSummaryService) {}

  ngOnInit(): void {
    const { total, successful, failed, failedRecords } = this.summarySvc.getSummary();
    this.total = total;
    this.successful = successful;
    this.failed = failed;
    this.failedRecords = failedRecords;
  }

  openErrors(rec: FailedRecord): void {
    this.modalErrors = rec.errors;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  /** Mock Save Template */
  onSaveTemplate(): void {
    if (!this.templateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    alert(`Template '${this.templateName}' saved as "${this.permission}".`);
  }

  onRestart(): void {
    this.restart.emit();
  }

  onFinish(): void {
    if (!this.templateName.trim()) {
      alert('Please enter a template name before finishing.');
      return;
    }
    this.finish.emit();
  }

  onDownload(): void {
    alert('Downloading results…');
  }
}
