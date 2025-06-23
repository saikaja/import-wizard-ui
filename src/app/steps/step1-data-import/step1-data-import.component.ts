// src/app/steps/step1-data-import/step1-data-import.component.ts
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule }                             from '@angular/common';
import { FormsModule }                              from '@angular/forms';

import { CategoryHierarchyService } 
  from '../../services/category-hierarchy.service';
import type {
  CategoryHierarchyDto,
  CategoryDto,
  SectionHierarchyDto,
  SectionColumnDto
} from '../../services/category-hierarchy.service';
import { TemplateService } from '../../services/template.service';

export type ImportMethod = 'new' | 'existing';

@Component({
  selector: 'app-step1-data-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step1-data-import.component.html'
})
export class Step1DataImportComponent implements OnInit {
  @Output() next = new EventEmitter<ImportMethod>();

  // ─── STEP 1 STATE ──────────────────────────────────────────────
  categories:       CategoryDto[]                      = [];
  sections:         SectionHierarchyDto[]              = [];
  columnsBySection: Record<number, SectionColumnDto[]> = {};
  selectedColumns:  Record<number, SectionColumnDto[]> = {};
  private fullHierarchy: CategoryHierarchyDto[]        = [];

  importMethods = [
    { value: 'new',      label: 'New Import (Manual)' },
    { value: 'existing', label: 'Existing Template' }
  ];
  templates = ['Template A', 'Template B', 'Template C'];

  category!: number;
  importMethod: ImportMethod | '' = '';
  selectedTemplate = '';

  // ─── USER FIELDS ────────────────────────────────────────────────
  userFields:         SectionColumnDto[] = [];
  selectedUserFields: SectionColumnDto[] = [];
  private readonly mandatoryUserFields = new Set<string>([
    'FirstName', 'LastName', 'Email', 'Role', 'Printer'
  ]);

  // ─── CONFIRMATION MODAL STATE ───────────────────────────────────
  showConfirmModal = false;
  private pendingCategory?: number;
  private previousCategory?: number;

  constructor(
    private hierarchySvc: CategoryHierarchyService,
    private templateSvc:   TemplateService
  ) {}

  ngOnInit(): void {
    this.hierarchySvc.getAll().subscribe({
      next: hiers => {
        this.fullHierarchy = hiers;
        this.categories     = hiers.map(h => ({
          categoryId:  h.categoryId,
          name:        h.name,
          description: h.description
        }));
      },
      error: err => console.error('Could not load category hierarchy', err)
    });
  }

  /** template helper for required‐field star */
  isUserFieldMandatory(col: SectionColumnDto): boolean {
    return this.mandatoryUserFields.has(col.columnName);
  }

  /** have they already picked something in 1B? */
  private hasStep1BSelections(): boolean {
    if (this.importMethod === 'existing') {
      return !!this.selectedTemplate.trim();
    }
    if (this.isUsersCategory) {
      return this.selectedUserFields.length > 0;
    }
    return Object.values(this.selectedColumns).some(arr => arr.length > 0);
  }

  /**
   * Intercept radio click before the browser toggles it.
   * If 1B data exists, preventDefault() and show confirm modal.
   */
  onCategoryClick(event: MouseEvent, newCat: number): void {
    this.previousCategory = this.category;

    if (this.category && this.hasStep1BSelections()) {
      event.preventDefault();
      this.pendingCategory  = newCat;
      this.showConfirmModal = true;
    } else {
      this.applyCategory(newCat);
    }
  }

  /** user confirmed → clear 1A/1B and switch */
  onConfirmChange(): void {
    if (this.pendingCategory != null) {
      this.clearStep1State();
      this.applyCategory(this.pendingCategory);
    }
    this.hideModal();
  }

  /** user canceled → just hide modal (radio never toggled) */
  onCancelChange(): void {
    this.hideModal();
  }

  private hideModal(): void {
    this.showConfirmModal = false;
    this.pendingCategory  = undefined;
  }

  private applyCategory(catId: number): void {
    this.category = catId;
    this.loadSections();
  }

  private clearStep1State(): void {
    this.importMethod       = '';
    this.selectedTemplate   = '';
    this.selectedUserFields = [];
    this.selectedColumns    = {};
  }

  // ─── SECTION / COLUMN LOADING ────────────────────────────────────
  loadSections(): void {
    this.sections           = [];
    this.columnsBySection   = {};
    this.selectedColumns    = {};
    this.userFields         = [];
    this.selectedUserFields = [];

    if (!this.category) return;
    const found = this.fullHierarchy.find(h => h.categoryId === this.category);
    if (!found) return;

    if (this.isUsersCategory) {
      const basic = found.sections.find(
        s => s.sectionName.toLowerCase() === 'basic information'
      );
      this.userFields = basic ? basic.columns : [];
      return;
    }

    this.sections = found.sections.filter(s => s.isActive);
    for (const sec of this.sections) {
      this.columnsBySection[sec.sectionId] = sec.columns;
    }
  }

  get isUsersCategory(): boolean {
    const cat = this.categories.find(c => c.categoryId === this.category);
    return cat?.name.toLowerCase() === 'users';
  }

  // ─── MULTI‐SECTION TOGGLES ────────────────────────────────────────
  areAllColumnsSelected(sectionId: number): boolean {
    const all = this.columnsBySection[sectionId] || [];
    const sel = this.selectedColumns[sectionId]  || [];
    return all.length > 0 && sel.length === all.length;
  }
  isColumnSelected(sectionId: number, columnId: number): boolean {
    return (this.selectedColumns[sectionId] || [])
      .some(c => c.columnId === columnId);
  }
  toggleSectionGroup(sectionId: number, checked: boolean): void {
    this.selectedColumns[sectionId] = checked
      ? [...(this.columnsBySection[sectionId] || [])]
      : [];
  }
  toggleColumn(sectionId: number, col: SectionColumnDto, checked: boolean): void {
    const arr = this.selectedColumns[sectionId] || [];
    this.selectedColumns[sectionId] = checked
      ? arr.some(c => c.columnId === col.columnId) ? arr : [...arr, col]
      : arr.filter(c => c.columnId !== col.columnId);
  }

  // ─── USER‐DETAILS TOGGLES ────────────────────────────────────────
  allUserFieldsSelected(): boolean {
    return this.selectedUserFields.length === this.userFields.length;
  }
  toggleAllUserFields(checked: boolean): void {
    this.selectedUserFields = checked ? [...this.userFields] : [];
  }
  isUserFieldSelected(id: number): boolean {
    return this.selectedUserFields.some(c => c.columnId === id);
  }
  toggleUserField(col: SectionColumnDto, checked: boolean): void {
    const arr = this.selectedUserFields;
    this.selectedUserFields = checked
      ? arr.some(c => c.columnId === col.columnId) ? arr : [...arr, col]
      : arr.filter(c => c.columnId !== col.columnId);
  }

  // ─── IMPORT‐TYPE & VALIDATION ─────────────────────────────────────
  isExistingImport(): boolean { return this.importMethod === 'existing'; }
  isNewImport(): boolean      { return this.importMethod === 'new'; }
  isValid(): boolean {
    if (!this.category) return false;
    if (this.isUsersCategory && this.isNewImport()) {
      return this.selectedUserFields.length > 0;
    }
    return this.isNewImport()
      ? Object.values(this.selectedColumns).some(cols => cols.length > 0)
      : !!this.selectedTemplate.trim();
  }
  proceed(): void {
    if (this.isValid() && this.importMethod) {
      this.next.emit(this.importMethod);
    }
  }

  // ─── TEMPLATE DOWNLOAD ───────────────────────────────────────────
  downloadTemplate(): void {
    let columnIds: number[];
    if (this.isUsersCategory && this.isNewImport()) {
      columnIds = this.selectedUserFields.map(c => c.columnId);
    } else {
      columnIds = Object.values(this.selectedColumns)
        .flat()
        .map(c => c.columnId);
    }

    this.templateSvc.download(columnIds).subscribe({
      next: blob => {
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'template.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: err => console.error('Template download failed', err)
    });
  }
}
