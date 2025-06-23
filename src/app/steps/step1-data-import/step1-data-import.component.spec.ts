import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1DataImportComponent } from './step1-data-import.component';

describe('Step1DataImportComponent', () => {
  let component: Step1DataImportComponent;
  let fixture: ComponentFixture<Step1DataImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step1DataImportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Step1DataImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
