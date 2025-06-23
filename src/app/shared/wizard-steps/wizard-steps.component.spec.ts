import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardStepsComponent } from './wizard-steps.component';

describe('WizardStepsComponent', () => {
  let component: WizardStepsComponent;
  let fixture: ComponentFixture<WizardStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardStepsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WizardStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
