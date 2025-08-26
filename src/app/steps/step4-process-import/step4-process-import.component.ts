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
import { take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { ExcelService } from '../../services/excel.service';
import { MappingService } from '../../services/mapping.service';
import { FileStoreService } from '../../services/file-store.service';
import { ImportResultService } from '../../services/import-result.service';
import { UserService } from '../../services/UserService';
import { ImportSummaryService } from '../../services/import-summary.service';
import { ImportUserInputDto } from '../../models/import-user-input-dto';

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

  showModal = false;
  modalErrors: string[] = [];

  invalidSelectionModal = false;
  invalidSelectedRows: number[] = [];

  private subs = new Subscription();

  // Map DB field → ImportUserInputDto key
  private dbToInputMap: Record<string, keyof ImportUserInputDto> = {
    CompanyId:    'company',
    LocationCode: 'locationCode',
    FirstName:    'firstName',
    LastName:     'lastName',
    EmployeeId:   'employeeId',
    Email:        'email',
    Role:         'role',
    Printer:      'printer',
    Activate:     'activate',
    Comments:     'comments'
  };

  constructor(
    private excelService: ExcelService,
    private mappingSvc: MappingService,
    private fileStore: FileStoreService,
    private importResultSvc: ImportResultService,
    private userSvc: UserService,
    private summarySvc: ImportSummaryService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.subs.add(this.mappingSvc.mappings$.subscribe(m => (this.mappings = m)));
    this.subs.add(this.excelService.headers$.subscribe(h => (this.headers = h)));
    this.subs.add(
      this.excelService.rows$.subscribe(raw =>
        this.records = raw.map(r => ({
          ...r,
          selected: false,
          error: '',
          errorFields: []
        }))
      )
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  validateRecords(): void {
    const file = this.fileStore.getFile();
    if (!file) {
      this.validationMessage = '⚠️ No Excel file found. Please upload your file in Step 2.';
      return;
    }

    this.validationMessage = 'Validation started…';
    this.validated = false;

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('mappings', JSON.stringify(this.mappings));

    this.http.post<ServerRowValidation[]>(`${environment.apiUrl}/ImportValidation/validateRows`, form)
      .subscribe(
        results => {
          this.records = this.records.map((r, i) => {
            const srv = results.find(x => x.row === i);
            if (!srv) return r;

            const errorText = srv.errors.join('; ');
            const errorHeaders = new Set<string>();
            for (const prop of srv.memberNames) {
              const hdr = Object.entries(this.mappings).find(
                ([h, p]) =>
                  prop === 'CompanyName'
                    ? p === 'Company' || p === 'CompanyId'
                    : p === prop
              )?.[0];
              if (hdr) errorHeaders.add(hdr);
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
    return this.validated && this.records.some(r => r.selected);
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    this.invalidSelectedRows = this.records
      .map((r, idx) => ({ r, idx }))
      .filter(({ r }) => r.selected && !this.isRowValid(r))
      .map(({ idx }) => idx + 1);

    if (this.invalidSelectedRows.length) {
      this.invalidSelectionModal = true;
      return;
    }

    const selected = this.records.filter(r => r.selected);
    const inputs: ImportUserInputDto[] = selected.map(r => {
      const dto: any = {};
      for (const hdr of Object.keys(this.mappings)) {
        const dbField = this.mappings[hdr];
        const prop = this.dbToInputMap[dbField];
        if (!prop) continue;
        let val = r[hdr];
        if (prop === 'activate') {
          val = String(val).toLowerCase();
        }
        dto[prop] = val;
      }
      return dto as ImportUserInputDto;
    });

    // UI-only: stash the selected rows so Step 5 can show failure details later
    const selectedForUi = inputs.map(d => ({
      firstName: d.firstName ?? '',
      lastName:  d.lastName  ?? '',
      email:     (d.email ?? '').trim()
    }));
    sessionStorage.setItem('importSelectedRows', JSON.stringify(selectedForUi));

    // We still capture a baseline count for Step 5's "Refresh" button
    this.userSvc.getUserCount().pipe(take(1)).subscribe({
      next: dbCount => {
        const file = this.fileStore.getFile();
        const fileName = file?.name || 'unknown';

        // Enqueue only — the WebJob does the inserts
        this.importResultSvc.enqueueUsers(inputs, fileName).subscribe({
          next: res => {
            // Store a "queued" summary and move to Step 5 immediately
            this.summarySvc.setSummary({
              total: inputs.length,
              successful: 0,
              originalCount: dbCount,
              failed: 0,
              failedRecords: []
            });

            // Let Step 5 display a banner
            sessionStorage.setItem('importQueued', JSON.stringify({
              importMasterId: res.importMasterId,
              queued: res.queued
            }));

            // Seed an initial status so Step 5 shows a message right away
            sessionStorage.setItem('importStatus', 'Queued');

            this.next.emit();
          },
          error: err => {
            console.error('Enqueue API failed', err);
            alert('Could not queue your import. Please try again.');
          }
        });
      },
      error: err => {
        console.error('Could not get pre-import user count', err);
        alert('Unable to check current DB state. Please try again.');
      }
    });
  }

  onBack(): void {
    this.back.emit();
  }

  openErrorModal(r: { error: string }): void {
    this.modalErrors = r.error.split(';').map(e => e.trim()).filter(Boolean);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  closeInvalidSelectionModal(): void {
    this.invalidSelectionModal = false;
  }

  getErrorCount(r: { error: string }): number {
    return r.error.split(';').map(e => e.trim()).filter(Boolean).length;
  }

  isCellInvalid(record: { errorFields: string[] }, hdr: string): boolean {
    return record.errorFields.includes(hdr);
  }
}
