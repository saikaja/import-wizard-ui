// src/app/services/template.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private base = `${environment.apiUrl}/Template`;

  constructor(private http: HttpClient) {}

  download(columnIds: number[]): Observable<Blob> {
    // build ?columnIds=8&columnIds=9&columnIds=10…
    let params = new HttpParams();
    columnIds.forEach(id => {
      params = params.append('columnIds', id.toString());
    });

    return this.http.get(`${this.base}/download`, {
      params,
      responseType: 'blob'
    });
  }
}
