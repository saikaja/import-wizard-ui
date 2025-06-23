import { Injectable } from '@angular/core';

export interface FailedRecord {
  firstName: string;
  errors: string[];
}

export interface ImportSummary {
  total: number;
  successful: number;
  failed: number;
  failedRecords: FailedRecord[];
}

@Injectable({ providedIn: 'root' })
export class ImportSummaryService {
  private summary: ImportSummary = {
    total: 0,
    successful: 0,
    failed: 0,
    failedRecords: []
  };

  setSummary(s: ImportSummary) {
    this.summary = s;
  }

  getSummary(): ImportSummary {
    return this.summary;
  }
}
