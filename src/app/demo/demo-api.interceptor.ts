// src/app/demo/demo-api.interceptor.ts
//
// Demo mode only (`npm run build:demo`). Answers every API call in the browser
// with sample data so the wizard can be clicked through without the .NET API.
// Nothing here is used by the normal development or production builds.

import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import * as XLSX from 'xlsx';

import { environment } from '../../environments/environment';
import type { CategoryHierarchyDto, SectionColumnDto } from '../services/category-hierarchy.service';
import type { ImportMaster } from '../services/import-master.service';
import type { ImportUserInputDto } from '../models/import-user-input-dto';

// ─── Sample data ────────────────────────────────────────────────────

const col = (columnId: number, dbColumnName: string, displayName: string): SectionColumnDto => ({
  columnId, sectionId: 1, columnName: dbColumnName, displayName,
  dataType: 'string', dbColumnName, isIdentifier: dbColumnName === 'Email'
});

const USER_COLUMNS: SectionColumnDto[] = [
  col(1, 'FirstName',  'First Name'),
  col(2, 'LastName',   'Last Name'),
  col(3, 'EmployeeId', 'Employee ID'),
  col(4, 'Email',      'Email'),
  col(5, 'Role',       'Role'),
  col(6, 'Printer',    'Printer'),
  col(7, 'Activate',   'Activate'),
  col(8, 'Comments',   'Comments')
];

const HIERARCHY: CategoryHierarchyDto[] = [{
  categoryId: 1,
  name: 'Users',
  description: 'User accounts',
  sections: [{
    sectionId: 1, categoryId: 1, sectionName: 'Basic Information',
    sectionDescription: 'Core account details', isActive: true, columns: USER_COLUMNS
  }]
}];

const ALLOWED_ROLES = ['view', 'edit', 'delete', 'admin'];
const REQUIRED: Record<string, string> = {
  FirstName: 'First Name', LastName: 'Last Name', Email: 'Email', Role: 'Role', Printer: 'Printer'
};

// Rows placed in downloaded templates. A few are deliberately wrong so that
// validation (step 4) and duplicate detection (step 5) have something to show.
const SAMPLE_ROWS: Record<string, string>[] = [
  { FirstName: 'Priya',  LastName: 'Sharma',  EmployeeId: 'E1042', Email: 'priya.sharma@northwind.example',  Role: 'admin',   Printer: 'TOR-3F-01', Activate: 'true',  Comments: '' },
  { FirstName: 'Marcus', LastName: 'Lee',     EmployeeId: 'E1043', Email: 'marcus.lee@northwind.example',    Role: 'edit',    Printer: 'TOR-3F-01', Activate: 'true',  Comments: '' },
  { FirstName: 'Aisha',  LastName: 'Khan',    EmployeeId: 'E1044', Email: 'aisha.khan@northwind.example',    Role: 'view',    Printer: 'TOR-2F-02', Activate: 'true',  Comments: 'New hire' },
  { FirstName: 'Daniel', LastName: 'Okafor',  EmployeeId: 'E1045', Email: 'daniel.okafor@northwind',         Role: 'edit',    Printer: 'TOR-2F-02', Activate: 'true',  Comments: '' },
  { FirstName: 'Sofia',  LastName: 'Rossi',   EmployeeId: 'E1046', Email: 'sofia.rossi@northwind.example',   Role: 'manager', Printer: 'TOR-3F-01', Activate: 'true',  Comments: '' },
  { FirstName: 'Tom',    LastName: 'Nguyen',  EmployeeId: 'E1047', Email: 'tom.nguyen@northwind.example',    Role: 'view',    Printer: 'MTL-1F-01', Activate: 'false', Comments: 'Rehire' },
  { FirstName: 'Emma',   LastName: 'Walsh',   EmployeeId: 'E1048', Email: 'emma.walsh@northwind.example',    Role: 'view',    Printer: '',          Activate: 'true',  Comments: '' },
  { FirstName: 'Liam',   LastName: 'Patel',   EmployeeId: 'E1049', Email: 'liam.patel@northwind.example',    Role: 'delete',  Printer: 'MTL-1F-01', Activate: 'true',  Comments: '' }
];

// Emails already "in the database", so importing them fails as a duplicate.
const existingEmails = new Set(['tom.nguyen@northwind.example']);
let userCount = 1284;

const HISTORY_FILES = [
  'users_q3_onboarding.xlsx', 'toronto_office_users.xlsx', 'new_hires_sept.xlsx',
  'contractors_2025.xlsx', 'printer_assignments.xlsx', 'montreal_team.xlsx',
  'summer_interns.xlsx', 'role_updates_aug.xlsx'
];
const history: ImportMaster[] = Array.from({ length: 23 }, (_, i) => ({
  importId: 100 - i,
  fileName: HISTORY_FILES[i % HISTORY_FILES.length],
  status: i % 5 === 2 ? 'Failure' : 'Success',
  submittedAt: new Date(Date.UTC(2025, 8, 26, 14, 20) - i * 2.3 * 86_400_000) as any
}));
let nextImportId = 101;

const templates: { templateId: number; name: string; createdAt: string; headers: string[] }[] = [
  { templateId: 1, name: 'Standard Onboarding', createdAt: '2025-09-02T15:00:00Z',
    headers: ['First Name', 'Last Name', 'Email', 'Role', 'Printer'] }
];

// Queued imports "processed" by a pretend background job a few seconds later.
interface Job { id: number; fileName: string; inputs: ImportUserInputDto[]; startedAt: number; done: boolean; }
const jobs = new Map<number, Job>();
const JOB_MS = 4000;

function settleJobs(): void {
  for (const job of jobs.values()) {
    if (job.done || Date.now() - job.startedAt < JOB_MS) continue;
    job.done = true;
    let failed = 0;
    for (const u of job.inputs) {
      const email = (u.email ?? '').trim().toLowerCase();
      if (existingEmails.has(email)) { failed++; continue; }
      existingEmails.add(email);
      userCount++;
    }
    history.unshift({
      importId: job.id,
      fileName: job.fileName,
      status: failed ? 'Failure' : 'Success',
      submittedAt: new Date(job.startedAt).toISOString() as any
    });
  }
}

function jobStatus(job: Job): string {
  const age = Date.now() - job.startedAt;
  return age < 1500 ? 'Queued' : age < JOB_MS ? 'Processing' : 'Completed';
}

// ─── Helpers ────────────────────────────────────────────────────────

function workbookBlob(headers: string[], rows: Record<string, string>[]): Blob {
  const byDisplay = new Map(USER_COLUMNS.map(c => [c.displayName, c.dbColumnName]));
  const data = [headers, ...rows.map(r => headers.map(h => r[byDisplay.get(h) ?? ''] ?? ''))];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), 'Import');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function validateRows(file: File, mappings: Record<string, string>) {
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headerRow = (raw[0] || []).map(c => String(c).trim());
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: headerRow, range: 1, defval: '' });

  const seen = new Set<string>();
  return rows.map((r, row) => {
    const v: Record<string, string> = {};
    for (const [hdr, db] of Object.entries(mappings)) v[db] = String(r[hdr] ?? '').trim();

    const errors: string[] = [];
    const members = new Set<string>();
    const fail = (member: string, msg: string) => { errors.push(msg); members.add(member); };

    for (const [db, label] of Object.entries(REQUIRED)) {
      if (!v[db]) fail(db, `${label} is required.`);
    }
    if (v['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v['Email'])) {
      fail('Email', `'${v['Email']}' is not a valid email address.`);
    }
    const email = (v['Email'] ?? '').toLowerCase();
    if (email && seen.has(email)) fail('Email', 'Email appears more than once in this file.');
    if (email) seen.add(email);
    if (v['Role'] && !ALLOWED_ROLES.includes(v['Role'].toLowerCase())) {
      fail('Role', `Role '${v['Role']}' is not allowed. Allowed roles: ${ALLOWED_ROLES.join(', ')}.`);
    }
    if (v['Activate'] && !['true', 'false'].includes(v['Activate'].toLowerCase())) {
      fail('Activate', 'Activate must be true or false.');
    }
    if (v['LocationCode'] && v['LocationCode'].length !== 4) {
      fail('LocationCode', 'Location must be a 4-character code.');
    }

    return {
      row, isValid: errors.length === 0, errors,
      rawValues: v, parsedValues: v, memberNames: Array.from(members)
    };
  });
}

const localDate = (d: any) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

// ─── Interceptor ────────────────────────────────────────────────────

@Injectable()
export class DemoApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.startsWith(environment.apiUrl)) return next.handle(req);

    settleJobs();
    const url = new URL(req.urlWithParams, window.location.origin);
    const path = url.pathname.slice(new URL(environment.apiUrl, window.location.origin).pathname.length)
      .replace(/^\/+/, '').toLowerCase();
    const q = url.searchParams;
    const ok = (body: any, ms = 350) =>
      of(new HttpResponse({ status: 200, body, url: req.url })).pipe(delay(ms));

    // Auth
    if (path === 'auth/login') {
      return ok({ token: 'demo-token', expiration: new Date(Date.now() + 3_600_000).toISOString() });
    }

    // Step 1: categories, templates
    if (path === 'categoryhierarchy') return ok(HIERARCHY);
    if (path === 'template/download') {
      const ids = q.getAll('columnIds').map(Number);
      const headers = USER_COLUMNS.filter(c => ids.includes(c.columnId)).map(c => c.displayName);
      return ok(workbookBlob(headers, SAMPLE_ROWS));
    }
    if (path === 'savetemplate' && req.method === 'GET') {
      return ok(templates.map(({ headers, ...t }) => t));
    }
    if (path === 'savetemplate' && req.method === 'POST') {
      const { name, headers } = req.body as { name: string; headers: string[] };
      const existing = templates.find(t => t.name.toLowerCase() === name.toLowerCase());
      const tpl = existing ?? { templateId: templates.length + 1, name, createdAt: '', headers };
      Object.assign(tpl, { headers, createdAt: new Date().toISOString() });
      if (!existing) templates.push(tpl);
      return ok({ templateId: tpl.templateId, name: tpl.name, createdAt: tpl.createdAt });
    }
    const dl = path.match(/^savetemplate\/(\d+)\/download$/);
    if (dl) {
      const tpl = templates.find(t => t.templateId === Number(dl[1]));
      if (tpl) return ok(workbookBlob(tpl.headers, SAMPLE_ROWS));
    }

    // Step 4: validation, queueing
    if (path === 'importvalidation/validaterows') {
      const form = req.body as FormData;
      const file = form.get('file') as File;
      const mappings = JSON.parse(String(form.get('mappings') || '{}'));
      return from(validateRows(file, mappings)).pipe(
        delay(700),
        map(body => new HttpResponse({ status: 200, body, url: req.url }))
      );
    }
    if (path === 'users/count') return ok(userCount);
    if (path === 'importresult/enqueue-users') {
      const inputs = req.body as ImportUserInputDto[];
      const id = nextImportId++;
      jobs.set(id, { id, fileName: q.get('fileName') || 'upload.xlsx', inputs, startedAt: Date.now(), done: false });
      return ok({ queued: inputs.length, importMasterId: id }, 500);
    }
    const st = path.match(/^importresult\/status\/(\d+)$/);
    if (st) {
      const job = jobs.get(Number(st[1]));
      if (job) return ok({ importMasterId: job.id, status: jobStatus(job) });
    }
    if (path === 'importresult/users') {
      const inputs = req.body as ImportUserInputDto[];
      return ok(inputs.map(u => {
        const email = (u.email ?? '').trim().toLowerCase();
        const dup = existingEmails.has(email);
        if (!dup) { existingEmails.add(email); userCount++; }
        return { email: u.email, inserted: !dup, errorMessage: dup ? 'Email already exists' : undefined };
      }));
    }

    // History
    if (path === 'importmaster/log') {
      const m = req.body as ImportMaster;
      history.unshift({ ...m, importId: nextImportId++, submittedAt: new Date().toISOString() as any });
      return ok(null);
    }
    if (path === 'importmaster/paged') {
      const page = Math.max(1, Number(q.get('pageNumber')) || 1);
      const size = Math.max(1, Number(q.get('pageSize')) || 5);
      const from = q.get('from'), to = q.get('to'), status = q.get('status');
      const rows = history.filter(h =>
        (!status || h.status === status) &&
        (!from || localDate(h.submittedAt) >= from) &&
        (!to || localDate(h.submittedAt) <= to));
      return ok({
        totalCount: rows.length, pageSize: size, currentPage: page,
        imports: rows.slice((page - 1) * size, page * size)
      });
    }

    return throwError(() => new HttpErrorResponse({
      status: 404, statusText: 'Not available in demo mode', url: req.url
    })).pipe(delay(200));
  }
}
