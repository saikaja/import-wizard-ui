// src/app/services/mapping.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * A simple alias for your header→DB‐field map
 * E.g. { '1 name': 'FirstName', 'Last Name': 'LastName', … }
 */
export type HeaderMapping = Record<string,string>;

@Injectable({
  providedIn: 'root'
})
export class MappingService {
  // internal subject that holds the current mapping
  private mappingSubject = new BehaviorSubject<HeaderMapping>({});

  /** Observable stream of the current header→DB mapping */
  public mappings$: Observable<HeaderMapping> =
    this.mappingSubject.asObservable();

  /**
   * Set a new mapping. Call this from Step 3 when the user clicks “Next”.
   * @param mappings A Record<header, dbField>
   */
  setMappings(mappings: HeaderMapping): void {
    // spread to ensure we don’t hold a reference to the caller’s object
    this.mappingSubject.next({ ...mappings });
  }

  /**
   * Clear out any existing mapping (e.g. if you restart the wizard).
   */
  resetMappings(): void {
    this.mappingSubject.next({});
  }

  /**
   * Synchronously get the current mapping value.
   * Useful if you need to pull the map outside of an Observable chain.
   */
  getMappings(): HeaderMapping {
    return this.mappingSubject.getValue();
  }
}
