// src/app/services/category-hierarchy.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OptionsDto {
  type:     string;
  required: boolean;
  maxLength?: number;
  minLength?: number;
  format?:    string;
  regex?:     string;
  default?:   string;
}

export interface SectionColumnDto {
  columnId:     number;
  sectionId:    number;
  columnName:   string;
  displayName:  string;
  dataType:     string;
  dbColumnName: string;
  isIdentifier: boolean;
  options?:     OptionsDto;
}

export interface CategorySectionDto {
  sectionId:          number;
  categoryId:         number;
  sectionName:        string;
  sectionDescription: string;
  isActive:           boolean;
}

export interface SectionHierarchyDto extends CategorySectionDto {
  columns: SectionColumnDto[];
}

export interface CategoryDto {
  categoryId:  number;
  name:        string;
  description: string;
}

export interface CategoryHierarchyDto extends CategoryDto {
  sections: SectionHierarchyDto[];
}

@Injectable({ providedIn: 'root' })
export class CategoryHierarchyService {
  private base = `${environment.apiUrl}/CategoryHierarchy`;

  constructor(private http: HttpClient) {}

  /** GET /api/CategoryHierarchy */
  getAll(): Observable<CategoryHierarchyDto[]> {
    return this.http.get<CategoryHierarchyDto[]>(this.base);
  }
}
