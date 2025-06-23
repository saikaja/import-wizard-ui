// src/app/steps/step2-file-handling/step2-file-handling.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule }                           from '@angular/common';
import { FormsModule }                            from '@angular/forms';
import { ExcelService }                           from '../../services/excel.service';
import { FileStoreService }                       from '../../services/file-store.service';

@Component({
  selector: 'app-step2-file-handling',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step2-file-handling.component.html'
})
export class Step2FileHandlingComponent {
  @Input()  importMethod    = 'new' as 'new' | 'existing';
  @Output() next            = new EventEmitter<void>();
  @Output() back            = new EventEmitter<void>();

  uploadedFile: File | null = null;
  uploadedFileName         = '';
  isFileValid              = false;
  validationMessage        = '';

  constructor(
    private excelService: ExcelService,
    private fileStore: FileStoreService
  ) {}

  handleFileUpload(evt: Event): void {
    const file = (evt.target as HTMLInputElement).files?.[0] || null;
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx','csv'].includes(ext)) {
      this.uploadedFile      = null;
      this.uploadedFileName  = '';
      this.isFileValid       = false;
      this.validationMessage =
        '❌ Invalid file type. Please upload an .xlsx or .csv file.';
      return;
    }

    this.uploadedFile      = file;
    this.uploadedFileName  = file.name;
    this.isFileValid       = false;
    this.validationMessage = '🔄 Validating file…';

    this.excelService.parseFile(file)
      .then(headers => {
        const allBlank = headers.every(h => !h.trim());
        if (headers.length === 0 || allBlank) {
          this.isFileValid = false;
          this.validationMessage =
            '❌ No columns found. Please upload an Excel file with at least one header.';
        } else {
          this.isFileValid      = true;
          this.validationMessage = '✅ File looks good!';
          // store file for later steps
          this.fileStore.setFile(file);
        }
      })
      .catch(err => {
        console.error(err);
        this.isFileValid = false;
        this.validationMessage =
          '❌ Failed to parse file. Please try a different Excel file.';
      });
  }

  onNext(): void {
    if (this.uploadedFile && this.isFileValid) {
      this.next.emit();
    } else {
      this.validationMessage =
        '❌ Please upload a valid .xlsx or .csv file with at least one header before continuing.';
    }
  }

  onBack(): void {
    this.back.emit();
  }
}