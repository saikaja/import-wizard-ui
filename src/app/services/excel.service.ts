// src/app/services/excel.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcelService {
  private headersSubject = new BehaviorSubject<string[]>([]);
  headers$ = this.headersSubject.asObservable();

  private rowsSubject = new BehaviorSubject<Record<string, any>[]>([]);
  rows$ = this.rowsSubject.asObservable();

  /**
   * Reads the first sheet, extracts the header row and
   * then the subsequent rows as objects keyed by those headers.
   */
  parseFile(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb   = XLSX.read(data, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];

          // 1) extract headers
          const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const headerRow = (raw[0] || []).map(cell => String(cell).trim());
          this.headersSubject.next(headerRow);

          // 2) parse rows into objects
          const rawObjects = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
            header: headerRow,
            range: 1,
            defval: ''
          });

          // now TS knows rawObjects is an array of objects
          const dataRows = rawObjects.map(row => ({
            ...row,
            selected: false,
            error:     ''
          }));

          this.rowsSubject.next(dataRows);
          resolve(headerRow);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
}
