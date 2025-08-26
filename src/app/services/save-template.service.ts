// src/app/services/save-template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ← Add this:
import { environment } from '../../environments/environment';

export interface SaveTemplateDto {
  templateId: number;
  name:       string;
  createdAt:  string;
}

@Injectable({ providedIn: 'root' })
export class SaveTemplateService {
  private readonly base = `${environment.apiUrl}/SaveTemplate`;

  constructor(private http: HttpClient) {}

  /** List all saved templates */
  getAll(): Observable<SaveTemplateDto[]> {
    return this.http.get<SaveTemplateDto[]>(this.base);
  }

  /** Save (or overwrite) a template by name + header list */
  save(name: string, headers: string[]): Observable<SaveTemplateDto> {
    return this.http.post<SaveTemplateDto>(this.base, { name, headers });
  }

  /** Download the persisted .xlsx */
  download(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/download`, { responseType: 'blob' });
  }
}
