import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FileStoreService {
  private file: File | null = null;

  setFile(file: File): void {
    this.file = file;
  }

  getFile(): File | null {
    return this.file;
  }
}
