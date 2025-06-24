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

  // validation requires these fields
  private readonly REQUIRED_DB_FIELDS = [
    'FirstName',
    'LastName',
    'Email',
    'Role',
    'Printer'
  ];

  // from your hierarchy service
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

  // *** revert Company → CompanyId for validation ***
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
        const serviceCols: SectionColumnDto[] = hierarchies
          .flatMap(c => c.sections)
          .flatMap(s => s.columns)
          .filter(c => this.USER_DB_FIELDS.includes(c.dbColumnName));

        this.expectedMapping = {};
        serviceCols.forEach(c => {
          this.expectedMapping[c.displayName] = c.dbColumnName;
        });
        this.MANUAL_FIELDS.forEach(m => {
          this.expectedMapping[m.displayName] = m.dbColumnName;
        });

        const allDbNames = [
          ...serviceCols.map(c => c.dbColumnName),
          ...this.MANUAL_FIELDS.map(m => m.dbColumnName)
        ];
        this.databaseFields = Array.from(new Set(allDbNames));

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

  isMatched(header: string): boolean {
    return !!this.mappings[header];
  }

  isRequiredMapping(header: string): boolean {
    const db = this.mappings[header];
    return this.REQUIRED_DB_FIELDS.includes(db);
  }

  areRequiredMatched(): boolean {
    const chosen = Object.values(this.mappings);
    return this.REQUIRED_DB_FIELDS.every(req => chosen.includes(req));
  }

  onNext(): void {
    if (!this.areRequiredMatched()) return;
    this.mappingSvc.setMappings(this.mappings);
    this.next.emit();
  }

  onBack(): void {
    this.back.emit();
  }
}
