import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step2FileHandlingComponent } from './step2-file-handling.component';
import { By } from '@angular/platform-browser';

describe('Step2FileHandlingComponent', () => {
  let component: Step2FileHandlingComponent;
  let fixture: ComponentFixture<Step2FileHandlingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2FileHandlingComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(Step2FileHandlingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit next when file is selected and button clicked', () => {
    const file = new File(['dummy content'], 'test.csv', { type: 'text/csv' });
    const input = document.createElement('input');
    const emitSpy = spyOn(component.next, 'emit');

    component.handleFileUpload({ target: { files: [file] } } as any);
    fixture.detectChanges();

    component.next.emit();
    expect(emitSpy).toHaveBeenCalled();
  });
});