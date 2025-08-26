import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ImportUserInputDto } from '../models/import-user-input-dto';
import { ImportResultDto } from '../models/import-result-dto';

@Injectable({ providedIn: 'root' })
export class ImportResultService {
  constructor(private http: HttpClient) {}

  // Existing
  importUsers(inputs: ImportUserInputDto[]): Observable<ImportResultDto[]> {
    return this.http.post<ImportResultDto[]>(
      `${environment.apiUrl}/importresult/users`,
      inputs
    );
  }

  // Existing: enqueue-only
  enqueueUsers(
    inputs: ImportUserInputDto[],
    fileName?: string
  ): Observable<{ queued: number; importMasterId: number }> {
    const params = fileName ? { params: { fileName } } : {};
    return this.http.post<{ queued: number; importMasterId: number }>(
      `${environment.apiUrl}/importresult/enqueue-users`,
      inputs,
      params
    );
  }

  // NEW: status getter
  getImportStatus(importMasterId: number) {
    return this.http.get<{ importMasterId: number; status: string }>(
      `${environment.apiUrl}/importresult/status/${importMasterId}`
    );
  }
}
