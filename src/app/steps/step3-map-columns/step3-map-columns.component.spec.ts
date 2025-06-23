import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step3MapColumnsComponent } from './step3-map-columns.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

describe('Step3MapColumnsComponent', () => {
  let component: Step3MapColumnsComponent;
  let fixture: ComponentFixture<Step3MapColumnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step3MapColumnsComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(Step3MapColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should show unmatched status initially', () => {
    const statusCells = fixture.debugElement.queryAll(By.css('td:last-child'));
    statusCells.forEach(cell => {
      expect(cell.nativeElement.textContent.trim()).toBe('Unmatched');
    });
  });

  it('should match status after selection', () => {
    component.mappings['Name'] = 'User Name';
    component.mappings['Vendor Number'] = 'Vendor Number';
    component.mappings['Account Enabled'] = 'Yes';
    fixture.detectChanges();

    const statusCells = fixture.debugElement.queryAll(By.css('td:last-child'));
    const statuses = statusCells.map(c => c.nativeElement.textContent.trim());
    expect(statuses).toContain('Matched');
  });

  it('should emit next event only if all mappings are filled', () => {
    spyOn(component.next, 'emit');

    component.mappings['Name'] = 'User Name';
    component.mappings['Vendor Number'] = 'Vendor Number';
    // Account Enabled intentionally left out
    component.onNext();
    expect(component.next.emit).not.toHaveBeenCalled();

    component.mappings['Account Enabled'] = 'Yes';
    component.onNext();
    expect(component.next.emit).toHaveBeenCalled();
  });

  it('should emit back event when Back is clicked', () => {
    spyOn(component.back, 'emit');
    component.onBack();
    expect(component.back.emit).toHaveBeenCalled();
  });
});