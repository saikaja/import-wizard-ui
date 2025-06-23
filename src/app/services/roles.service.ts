// src/app/services/roles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private allowed: string[] = [];

  async load() {
    const cfg = await firstValueFrom(
      this.http.get<{allowedRoles: string[]}>('assets/roles.json')
    );
    this.allowed = cfg.allowedRoles.map(r => r.toLowerCase());
  }

  isAllowed(role: string): boolean {
    return this.allowed.includes(role?.toLowerCase());
  }

  getAllowedList(): string {
    return this.allowed.join(', ');
  }

  constructor(private http: HttpClient) {}
}
