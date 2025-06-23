// File: src/app/steps/step4-process-import/step4-process-import.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { ExcelService } from '../../services/excel.service';
import { MappingService } from '../../services/mapping.service';
import { FileStoreService } from '../../services/file-store.service';
import { ImportSummaryService } from '../../services/import-summary.service';
import type { ImportSummary, FailedRecord } from '../../services/import-summary.service';

interface ServerRowValidation {
  row: number;
  isValid: boolean;
  errors: string[];
  rawValues: Record<string, string>;
  parsedValues: Record<string, string>;
  memberNames: string[];
}

@Component({
  selector: 'app-step4-process-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step4-process-import.component.html'
})
export class Step4ProcessImportComponent implements OnInit, OnDestroy {
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  headers: string[] = [];
  records: Array<Record<string, any> & {
    selected: boolean;
    error: string;
    errorFields: string[];
  }> = [];

  mappings: Record<string, string> = {};
  validated = false;
  validationMessage = '';

  // Existing modal for cell-level errors
  showModal = false;
  modalErrors: string[] = [];

  // New: modal for invalid-selection warning
  invalidSelectionModal = false;
  invalidSelectedRows: number[] = [];

  private subs = new Subscription();

  constructor(
    private excelService: ExcelService,
    private mappingSvc: MappingService,
    private fileStore: FileStoreService,
    private http: HttpClient,
    private summarySvc: ImportSummaryService
  ) {}

  ngOnInit() {
    this.subs.add(
      this.mappingSvc.mappings$.subscribe(m => (this.mappings = m))
    );
    this.subs.add(
      this.excelService.headers$.subscribe(h => (this.headers = h))
    );
    this.subs.add(
      this.excelService.rows$.subscribe(raw => {
        this.records = raw.map(r => ({
          ...r,
          selected: false,
          error: '',
          errorFields: []
        }));
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  validateRecords() {
    console.log('🔔 validateRecords() called – mappings:', this.mappings);

    const file = this.fileStore.getFile();
    if (!file) {
      this.validationMessage =
        '⚠️ No Excel file found. Please upload your file in Step 2.';
      return;
    }

    this.validationMessage = 'Validation started…';
    this.validated = false;

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('mappings', JSON.stringify(this.mappings));

    console.log(
      '➡️ Posting FormData:',
      { fileName: file.name, mappings: this.mappings }
    );

    this.http
      .post<ServerRowValidation[]>(
        `${environment.apiUrl}/ImportValidation/validateRows`,
        form
      )
      .subscribe(
        results => {
          console.log('✅ server returned rows:', results);

          this.records = this.records.map((r, i) => {
            const srv = results.find(x => x.row === i);
            if (!srv) return r;

            const errorText = srv.errors.join('; ');
            const errorHeaders = new Set<string>();

            for (const prop of srv.memberNames) {
              if (prop === 'CompanyName') {
                const hdr = Object.entries(this.mappings)
                  .find(([h, p]) => p === 'CompanyId')?.[0];
                if (hdr) errorHeaders.add(hdr);
              } else {
                const hdr = Object.entries(this.mappings)
                  .find(([h, p]) => p === prop)?.[0];
                if (hdr) errorHeaders.add(hdr);
              }
            }

            return {
              ...r,
              error: errorText,
              errorFields: Array.from(errorHeaders)
            };
          });

          this.validationMessage = 'Validation complete.';
          this.validated = true;
        },
        () => {
          console.error('❌ Validation API call failed');
          this.validationMessage = 'Validation failed.';
        }
      );
  }

  isRowValid(r: any): boolean {
    return !r.error && r.errorFields.length === 0;
  }

  canSubmit(): boolean {
    return this.records.some(r => r.selected);
  }

  onSubmit() {
    // nothing selected → do nothing
    if (!this.canSubmit()) {
      return;
    }

    // compute invalid row numbers from the full table
    this.invalidSelectedRows = this.records
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.selected && !this.isRowValid(r))
      .map(({ idx }) => idx + 1); // +1 for human-friendly numbering

    // if any invalid, show the warning and bail
    if (this.invalidSelectedRows.length) {
      this.invalidSelectionModal = true;
      return;
    }

    // all good → build summary and proceed
    const firstHdr = Object.keys(this.mappings).find(
      h => this.mappings[h] === 'FirstName'
    )!;

    const selected = this.records.filter(r => r.selected);
    const failedRecords: FailedRecord[] = selected
      .filter(r => !this.isRowValid(r))
      .map(r => ({
        firstName: r[firstHdr],
        errors: r.error
          .split(';')
          .map(e => e.trim())
          .filter(Boolean)
      }));

    const summary: ImportSummary = {
      total: selected.length,
      successful: selected.filter(r => this.isRowValid(r)).length,
      failed: failedRecords.length,
      failedRecords
    };

    this.summarySvc.setSummary(summary);
    this.next.emit();
  }

  onBack() {
    this.back.emit();
  }

  openErrorModal(r: { error: string }) {
    this.modalErrors = r.error
      .split(';')
      .map(e => e.trim())
      .filter(Boolean);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  /** Close the invalid-selection warning */
  closeInvalidSelectionModal() {
    this.invalidSelectionModal = false;
  }

  getErrorCount(r: { error: string }): number {
    return r.error
      .split(';')
      .map(e => e.trim())
      .filter(Boolean).length;
  }

  isCellInvalid(record: { errorFields: string[] }, hdr: string): boolean {
    return record.errorFields.includes(hdr);
  }
}
