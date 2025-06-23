// src/app/steps/step3-map-columns/step3-map-columns.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ExcelService } from '../../services/excel.service';
import { CategoryHierarchyService } from '../../services/category-hierarchy.service';
import { MappingService } from '../../services/mapping.service';
import type { SectionColumnDto } from '../../services/category-hierarchy.service';

@Component({
  selector: 'app-step3-map-columns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step3-map-columns.component.html'
})
export class Step3MapColumnsComponent implements OnInit, OnDestroy {
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  excelColumns: string[] = [];
  databaseFields: string[] = [];
  mappings: Record<string, string> = {};
  private expectedMapping: Record<string, string> = {};
  private subs = new Subscription();

  // Only these truly payload fields are required now
  private readonly REQUIRED_DB_FIELDS = [
    'FirstName',
    'LastName',
    'Email',
    'Role',
    'Printer'
  ];

  // Whitelist the fields coming from your hierarchy service
  private readonly USER_DB_FIELDS = [
    'FirstName',
    'LastName',
    'EmployeeId',
    'Email',
    'Role',
    'Printer',
    'Activate',
    'Comments'
  ];

  // Always include these two so they show up in the dropdown
  private readonly MANUAL_FIELDS = [
    { displayName: 'Company',  dbColumnName: 'CompanyId'   },
    { displayName: 'Location', dbColumnName: 'LocationCode' }
  ];

  constructor(
    private excelService: ExcelService,
    private hierarchySvc: CategoryHierarchyService,
    private mappingSvc: MappingService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.excelService.headers$.subscribe(rawHeaders => {
        this.excelColumns = rawHeaders
          .map(h => (typeof h === 'string' ? h.trim() : ''))
          .filter(h => !!h);

        if (this.excelColumns.length) {
          this.loadHierarchyAndAutoMap();
        } else {
          this.databaseFields = [];
          this.mappings = {};
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadHierarchyAndAutoMap(): void {
    this.subs.add(
      this.hierarchySvc.getAll().subscribe(hierarchies => {
        // 1) get service-driven columns
        const serviceCols: SectionColumnDto[] = hierarchies
          .flatMap(c => c.sections)
          .flatMap(s => s.columns)
          .filter(c => this.USER_DB_FIELDS.includes(c.dbColumnName));

        // 2) map displayName → dbColumnName
        this.expectedMapping = {};
        serviceCols.forEach(c => {
          this.expectedMapping[c.displayName] = c.dbColumnName;
        });
        // 3) add manual entries
        this.MANUAL_FIELDS.forEach(m => {
          this.expectedMapping[m.displayName] = m.dbColumnName;
        });

        // 4) dropdown options = union of both sets
        const allDbNames = [
          ...serviceCols.map(c => c.dbColumnName),
          ...this.MANUAL_FIELDS.map(m => m.dbColumnName)
        ];
        this.databaseFields = Array.from(new Set(allDbNames));

        // 5) auto-map exact matches
        this.mappings = {};
        this.excelColumns.forEach(header => {
          const db = this.expectedMapping[header];
          if (db) {
            this.mappings[header] = db;
          }
        });
      })
    );
  }

  /** Has this column been mapped? */
  isMatched(header: string): boolean {
    return !!this.mappings[header];
  }

  /** Is this a required payload field? */
  isRequiredMapping(header: string): boolean {
    const db = this.mappings[header];
    return this.REQUIRED_DB_FIELDS.includes(db);
  }

  /** All required payload fields must be mapped before Next */
  areRequiredMatched(): boolean {
    const chosen = Object.values(this.mappings);
    return this.REQUIRED_DB_FIELDS.every(req => chosen.includes(req));
  }

  onNext(): void {
    if (!this.areRequiredMatched()) {
      return; // or display a warning
    }
    this.mappingSvc.setMappings(this.mappings);
    this.next.emit();
  }

  onBack(): void {
    this.back.emit();
  }
}
