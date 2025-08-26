import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx'; // npm i xlsx
import { ImportMasterService, ImportMaster } from '../services/import-master.service';

@Component({
  selector: 'app-import-history',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './import-history.component.html'
})
export class ImportHistoryComponent implements OnInit {
  imports: ImportMaster[] = [];
  totalCount = 0;
  pageSize = 5;
  currentPage = 1;
  totalPages = 1;

  // Filters (dates as 'YYYY-MM-DD', status single-select)
  filterForm = this.fb.group({
    from: [''],
    to: [''],
    status: [''] // '', 'Success', 'Failure'
  });

  // --- Totals modal state ---
  showTotalsModal = false;
  totalsLoading = false;
  totalsError: string | null = null;
  totals = { success: 0, failure: 0, overall: 0 };

  // --- Download state (optional UI disable if you want) ---
  downloading = false;

  constructor(
    private importMasterService: ImportMasterService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  private buildOpts() {
    const { from, to, status } = this.filterForm.value;
    const opts: any = {};
    if (from)   opts.from = from!;
    if (to)     opts.to = to!;
    if (status) opts.status = status!;
    return opts;
  }

  loadPage(page: number): void {
    const opts = this.buildOpts();
    this.importMasterService.getPagedImports(page, this.pageSize, opts)
      .subscribe((response) => {
        this.imports = response.imports;
        this.totalCount = response.totalCount;
        this.currentPage = response.currentPage;
        this.pageSize = response.pageSize;
        this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
      });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.loadPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  // Trigger a new search with current filters
  search(): void {
    const f = this.filterForm.value.from;
    const t = this.filterForm.value.to;
    if (f && t && f > t) {
      // swap if inverted
      this.filterForm.patchValue({ from: t, to: f });
    }
    this.loadPage(1);
  }

  // Clear filters and reload
  clear(): void {
    this.filterForm.reset({ from: '', to: '', status: '' });
    this.loadPage(1);
  }

  // -------- Totals popup (overall, ignores current filters) --------
  openTotals(): void {
    this.showTotalsModal = true;
    this.totalsLoading = true;
    this.totalsError = null;

    const success$ = this.importMasterService.getPagedImports(1, 1, { status: 'Success' });
    const failure$ = this.importMasterService.getPagedImports(1, 1, { status: 'Failure' });

    forkJoin([success$, failure$]).subscribe({
      next: ([succ, fail]) => {
        this.totals.success = succ.totalCount || 0;
        this.totals.failure = fail.totalCount || 0;
        this.totals.overall = this.totals.success + this.totals.failure;
        this.totalsLoading = false;
      },
      error: (err) => {
        this.totalsLoading = false;
        this.totalsError = 'Could not load totals.';
        console.error(err);
      }
    });
  }

  closeTotals(): void {
    this.showTotalsModal = false;
  }

  // ================== DOWNLOAD EXCEL ==================
  // Creates a workbook with two sheets:
  //  - "Success": File Name, Submitted At, Status
  //  - "Failure": File Name, Submitted At, Status, Reason ("Email already exists")
  // Scope: exports ALL rows under the current filters (not just the current page).
  async downloadExcel(): Promise<void> {
    try {
      this.downloading = true;

      // 1) Gather all rows that match current filters (page through backend)
      const rows = await this.gatherAllRows();

      // 2) Split by status
      const success = rows.filter(r => (r.status || '').toLowerCase() === 'success'.toLowerCase());
      const failure = rows.filter(r => (r.status || '').toLowerCase() === 'failure'.toLowerCase());

      // 3) Map to flat objects for Excel
      const fmt = (d: any) => {
        const dt = new Date(d as any);
        return isNaN(dt.getTime())
          ? ''
          : dt.toLocaleString('en-CA', { hour12: false });
      };

      const successRows = success.map(r => ({
        'File Name': r.fileName,
        'Submitted At': fmt(r.submittedAt),
        'Status': r.status
      }));

      const failureRows = failure.map(r => ({
        'File Name': r.fileName,
        'Submitted At': fmt(r.submittedAt),
        'Status': r.status,
        'Reason': 'Email already exists'
      }));

      // Ensure headers present even if no data
      const successRowsWithHeader = successRows.length ? successRows : [{
        'File Name': '',
        'Submitted At': '',
        'Status': ''
      }];

      const failureRowsWithHeader = failureRows.length ? failureRows : [{
        'File Name': '',
        'Submitted At': '',
        'Status': '',
        'Reason': ''
      }];

      // 4) Build workbook and download
      const wb = XLSX.utils.book_new();
      const wsSuccess = XLSX.utils.json_to_sheet(successRowsWithHeader);
      const wsFailure = XLSX.utils.json_to_sheet(failureRowsWithHeader);
      XLSX.utils.book_append_sheet(wb, wsSuccess, 'Success');
      XLSX.utils.book_append_sheet(wb, wsFailure, 'Failure');

      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const filename = `ImportHistory_${yyyy}${mm}${dd}.xlsx`;

      XLSX.writeFile(wb, filename);
    } catch (e) {
      console.error('Download failed', e);
      alert('Could not build the Excel file.');
    } finally {
      this.downloading = false;
    }
  }

  // Fetch ALL rows for the current filter by paging the backend.
  // Uses pageSize=100 for decent throughput; adjust if needed.
  private gatherAllRows(): Promise<ImportMaster[]> {
    const opts = this.buildOpts();
    const PAGE = 100;

    return new Promise((resolve, reject) => {
      this.importMasterService.getPagedImports(1, PAGE, opts).subscribe({
        next: (first) => {
          const total = first.totalCount || 0;
          const pages = Math.ceil(total / PAGE);
          if (pages <= 1) {
            resolve(first.imports || []);
            return;
          }

          const requests = [];
          for (let p = 2; p <= pages; p++) {
            requests.push(this.importMasterService.getPagedImports(p, PAGE, opts));
          }

          forkJoin(requests).subscribe({
            next: (rest) => {
              const all = rest.reduce((arr, r) => arr.concat(r.imports || []), first.imports || []);
              resolve(all);
            },
            error: reject
          });
        },
        error: reject
      });
    });
  }
}
