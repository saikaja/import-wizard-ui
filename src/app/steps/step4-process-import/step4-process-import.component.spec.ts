import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step4ProcessImportComponent } from './step4-process-import.component';
import { FormsModule } from '@angular/forms';

describe('Step4ProcessImportComponent', () => {
  let component: Step4ProcessImportComponent;
  let fixture: ComponentFixture<Step4ProcessImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step4ProcessImportComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step4ProcessImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should mark rows as valid/invalid on validate', () => {
    component.validateRecords();
    const errors = component.records.map(r => r.error);
    expect(errors).toContain('Missing Vendor Number');
    expect(errors).toContain('');
  });

  it('should enable submit only with valid and selected rows', () => {
    component.validateRecords();
    component.records[0].selected = true; // valid
    component.records[1].selected = true; // invalid
    expect(component.canSubmit()).toBeTrue();
  });

  it('should emit next on submit if valid records selected', () => {
    spyOn(component.next, 'emit');
    component.validateRecords();
    component.records[0].selected = true;
    component.onSubmit();
    expect(component.next.emit).toHaveBeenCalled();
  });

  it('should emit back on back click', () => {
    spyOn(component.back, 'emit');
    component.onBack();
    expect(component.back.emit).toHaveBeenCalled();
  });
});