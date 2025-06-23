// src/app/app.routes.ts

import { Routes } from '@angular/router';

import { LoginComponent }                 from './login/login.component';
import { ImportWizardComponent }          from './import-wizard/import-wizard.component';
import { Step1DataImportComponent }       from './steps/step1-data-import/step1-data-import.component';
import { Step2FileHandlingComponent }     from './steps/step2-file-handling/step2-file-handling.component';
import { Step3MapColumnsComponent }       from './steps/step3-map-columns/step3-map-columns.component';
import { Step4ProcessImportComponent }    from './steps/step4-process-import/step4-process-import.component';
import { Step5SummaryComponent }          from './steps/step5-summary/step5-summary.component';

export const routes: Routes = [
  // default → login
  { path: '',      redirectTo: 'login', pathMatch: 'full' },

  // authentication
  { path: 'login', component: LoginComponent },

  // the import‐wizard shell with child steps
  {
    path: 'wizard',
    component: ImportWizardComponent,
    children: [
      // when you hit /wizard → redirect to step1
      { path: '',      redirectTo: 'step1', pathMatch: 'full' },

      // individual step routes
      { path: 'step1', component: Step1DataImportComponent },
      { path: 'step2', component: Step2FileHandlingComponent },
      { path: 'step3', component: Step3MapColumnsComponent },
      { path: 'step4', component: Step4ProcessImportComponent },
      { path: 'step5', component: Step5SummaryComponent },
    ]
  },

  // catch‐all back to home
  { path: '**',    redirectTo: '' }
];
