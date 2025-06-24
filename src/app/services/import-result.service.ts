import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ImportUserInputDto } from '../models/import-user-input-dto';
import { ImportResultDto }     from '../models/import-result-dto';
import { Observable }          from 'rxjs';
import { environment }         from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImportResultService {
  constructor(private http: HttpClient) {}

  /** 
   * Now accepts the raw input DTO (company name + all fields).
   * Server will translate name→ID for us.
   */
  importUsers(inputs: ImportUserInputDto[]): Observable<ImportResultDto[]> {
    return this.http.post<ImportResultDto[]>(
      `${environment.apiUrl}/importresult/users`,
      inputs
    );
  }
}
