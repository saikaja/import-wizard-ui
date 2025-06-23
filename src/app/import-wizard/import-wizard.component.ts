import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Step1DataImportComponent } from '../steps/step1-data-import/step1-data-import.component';
import { Step2FileHandlingComponent } from '../steps/step2-file-handling/step2-file-handling.component';
import { Step3MapColumnsComponent } from '../steps/step3-map-columns/step3-map-columns.component';
import { Step4ProcessImportComponent } from '../steps/step4-process-import/step4-process-import.component';
import { Step5SummaryComponent } from '../steps/step5-summary/step5-summary.component';

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  imports: [
    CommonModule,
    Step1DataImportComponent,
    Step2FileHandlingComponent,
    Step3MapColumnsComponent,
    Step4ProcessImportComponent,
    Step5SummaryComponent
  ],
  templateUrl: './import-wizard.component.html',
  styleUrls: ['./import-wizard.component.scss']
})
export class ImportWizardComponent {
  currentStep = 1;
  selectedImportMethod: 'new' | 'existing' = 'new';

  goToStep(step: number) {
    this.currentStep = step;
  }

  onStep1Next(method: 'new' | 'existing') {
    this.selectedImportMethod = method;
    this.nextStep();
  }

  nextStep() {
    if (this.currentStep < 5) this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }
}