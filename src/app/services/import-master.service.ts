import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ImportMaster {
  importId?: number;
  fileName: string;
  status: string;          // "Success" | "Failure"
  submittedAt?: Date;      // stored UTC on server
}

export interface PagedImportsResponse {
  totalCount: number;
  pageSize: number;
  currentPage: number;
  imports: ImportMaster[];
}

@Injectable({ providedIn: 'root' })
export class ImportMasterService {
  constructor(private http: HttpClient) {}

  logImport(importData: ImportMaster): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/importmaster/log`,
      importData
    );
  }

  // Optional filters: from/to are 'YYYY-MM-DD' (Toronto local), status is 'Success' | 'Failure'
  getPagedImports(
    pageNumber: number,
    pageSize: number,
    opts?: { from?: string; to?: string; status?: string }
  ): Observable<PagedImportsResponse> {
    const params = new URLSearchParams();
    params.set('pageNumber', String(pageNumber));
    params.set('pageSize', String(pageSize));
    if (opts?.from)   params.set('from', opts.from);
    if (opts?.to)     params.set('to', opts.to);
    if (opts?.status) params.set('status', opts.status);

    return this.http.get<PagedImportsResponse>(
      `${environment.apiUrl}/importmaster/paged?${params.toString()}`
    );
  }
}
