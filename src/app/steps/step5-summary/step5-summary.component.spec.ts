import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step5SummaryComponent } from './step5-summary.component';
import { FormsModule } from '@angular/forms';

describe('Step5SummaryComponent', () => {
  let component: Step5SummaryComponent;
  let fixture: ComponentFixture<Step5SummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step5SummaryComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(Step5SummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the summary component', () => {
    expect(component).toBeTruthy();
  });

  it('should alert if trying to save template with empty name', () => {
    spyOn(window, 'alert');
    component.templateName = '';
    component.onSaveTemplate();
    expect(window.alert).toHaveBeenCalledWith('Please enter a template name.');
  });

  it('should emit finish only with valid template name', () => {
    spyOn(window, 'alert');
    spyOn(component.finish, 'emit');
    component.templateName = '';
    component.onFinish();
    expect(component.finish.emit).not.toHaveBeenCalled();

    component.templateName = 'Final Template';
    component.onFinish();
    expect(component.finish.emit).toHaveBeenCalled();
  });

  it('should emit restart on restart button click', () => {
    spyOn(component.restart, 'emit');
    component.onRestart();
    expect(component.restart.emit).toHaveBeenCalled();
  });
});