import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="demo" class="demo-banner" role="note">
      <strong>Demo mode</strong> · Runs on sample data in your browser; no real backend or client data.
      Download a template in step 1 to get a ready-made test file.
      <a href="https://github.com/saikaja/import-wizard-ui" target="_blank" rel="noreferrer">Source</a>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .demo-banner {
      padding: 8px 16px;
      background: #1f2937;
      color: #f9fafb;
      font: 13px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
      text-align: center;
    }
    .demo-banner a { color: #93c5fd; margin-left: 6px; }
  `]
})
export class AppComponent {
  demo = environment.demo;
}
