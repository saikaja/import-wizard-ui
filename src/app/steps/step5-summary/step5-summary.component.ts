import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

import { ImportSummaryService, FailedRecord, ImportSummary } from '../../services/import-summary.service';
import { ExcelService } from '../../services/excel.service';
import { SaveTemplateService } from '../../services/save-template.service';
import { UserService } from '../../services/UserService';
import { ImportResultService } from '../../services/import-result.service';

type ImportStatus = 'Queued' | 'Processing' | 'Completed' | 'Failed';

type SelectedRowForUi = {
  firstName: string;
  lastName: string;
  email: string;
};

@Component({
  selector: 'app-step5-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step5-summary.component.html'
})
export class Step5SummaryComponent implements OnInit {
  @Output() restart = new EventEmitter<void>();
  @Output() finish = new EventEmitter<void>();

  total = 0;
  originalCount = 0;
  successful = 0;
  failed = 0;
  failedRecords: FailedRecord[] = [];

  showModal = false;
  modalErrors: string[] = [];

  saveModalVisible = false;
  saveModalTitle = '';
  saveModalMessage = '';

  templateName = '';

  showSummary = false;

  // queued info + status
  queuedInfo: { importMasterId: number; queued: number } | null = null;
  status: ImportStatus = 'Queued';

  // controls when the details table appears
  detailsLoaded = false;

  constructor(
    private summarySvc: ImportSummaryService,
    private excelSvc: ExcelService,
    private saveTplSvc: SaveTemplateService,
    private userSvc: UserService,
    private importResultSvc: ImportResultService
  ) {}

  ngOnInit(): void {
    const s: ImportSummary = this.summarySvc.getSummary();
    this.total = s.total;
    this.originalCount = (s as any).originalCount || 0;
    this.successful = s.successful;
    this.failed = s.failed;
    this.failedRecords = s.failedRecords;

    // tolerant read of the handoff from Step 4
    const raw = sessionStorage.getItem('importQueued');
    if (raw) {
      try {
        const q = JSON.parse(raw) || {};
        const id = Number(q.importMasterId ?? q.importMasterID ?? q.id ?? q.ImportMasterId);
        const queued = Number(q.queued ?? q.Queued ?? 0);
        if (Number.isFinite(id)) {
          this.queuedInfo = { importMasterId: id, queued };
          const cached = (sessionStorage.getItem('importStatus') || '').trim();
          this.status = (this.normalizeStatus(cached) || 'Queued') as ImportStatus;
        }
      } catch {
        // ignore malformed JSON; banner simply won't render
      }
    }

    if (this.queuedInfo) this.showSummary = true;
  }

  // normalize API status values to our union type
  private normalizeStatus(val?: string | null): ImportStatus | '' {
    const v = (val ?? '').toString().trim().toLowerCase();
    if (v === 'queued' || v === 'queue') return 'Queued';
    if (v === 'processing' || v === 'inprogress' || v === 'in_progress') return 'Processing';
    if (v === 'completed' || v === 'complete' || v === 'done') return 'Completed';
    if (v === 'failed' || v === 'error') return 'Failed';
    return '';
  }

  // computed banner text (no need to manage a string field)
  get bannerText(): string {
    switch (this.status) {
      case 'Queued':
      case 'Processing':
        return 'Processing… The import will complete when the background job is running.';
      case 'Completed':
        return 'Completed. Click “Refresh counts” to update the numbers below.';
      case 'Failed':
        return 'Failed.';
      default:
        return 'Processing…';
    }
  }

  // Manual refresh of MASTER status (no polling)
  refreshStatus(): void {
    if (!this.queuedInfo) return;
    this.importResultSvc.getImportStatus(this.queuedInfo.importMasterId).subscribe({
      next: s => {
        const norm = this.normalizeStatus(s?.status);
        this.status = (norm || 'Queued') as ImportStatus;
        sessionStorage.setItem('importStatus', this.status);
      },
      error: _ => {
        console.warn('Status refresh failed');
      }
    });
  }

  // Count-diff based refresh
  refresh(): void {
    this.userSvc.getUserCount().subscribe({
      next: current => {
        const success = current - this.originalCount;
        this.successful = Math.max(0, success);
        this.failed = Math.max(0, this.total - this.successful);

        // If all rows accounted for, mark completed
        if (this.successful + this.failed >= this.total) {
          this.status = 'Completed';
          sessionStorage.setItem('importStatus', this.status);
        }
      },
      error: err => {
        console.error('Refresh failed', err);
        alert('Could not refresh status. Please try again.');
      }
    });
  }

  // Build per-row "failed" details without server calls (reason is always duplicate email)
  seeDetails(): void {
    this.failedRecords = [];
    this.detailsLoaded = true;

    const raw = sessionStorage.getItem('importSelectedRows');
    const rows: SelectedRowForUi[] = raw ? JSON.parse(raw) : [];

    const failCount = Math.max(0, this.failed);
    if (failCount === 0 || rows.length === 0) return;

    // Choose the last N rows to avoid always selecting the first ones
    const start = Math.max(0, rows.length - failCount);
    const slice = rows.slice(start);

    this.failedRecords = slice.map(r => ({
      firstName: r.firstName || r.email || '(unknown)',
      errors: ['Email already exists']
    })) as FailedRecord[];
  }

  openErrors(rec: FailedRecord): void {
    this.modalErrors = rec.errors;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSaveTemplate(): void {
    const name = this.templateName.trim();
    if (!name) {
      this.showSaveModal('Validation', 'Please enter a template name.');
      return;
    }

    this.excelSvc.headers$
      .pipe(take(1))
      .subscribe({
        next: headers => {
          this.saveTplSvc.save(name, headers).subscribe({
            next: tpl => {
              this.showSaveModal('Success', `Template '${tpl.name}' saved.`);
            },
            error: err => {
              console.error('Save template failed', err);
              this.showSaveModal('Error', 'Failed to save template.');
            }
          });
        },
        error: err => {
          console.error('Could not retrieve headers', err);
          this.showSaveModal('Error', 'Failed to get headers.');
        }
      });
  }

  private showSaveModal(title: string, message: string): void {
    this.saveModalTitle = title;
    this.saveModalMessage = message;
    this.saveModalVisible = true;
  }

  closeSaveModal(): void {
    this.saveModalVisible = false;
  }

  onRestart(): void {
    this.restart.emit();
  }

  onFinish(): void {
    const name = this.templateName.trim();
    if (!name) {
      this.showSaveModal('Validation', 'Please enter a template name before finishing.');
      return;
    }
    this.finish.emit();
  }

  onDownload(): void {
    alert('Downloading results…');
  }
}
