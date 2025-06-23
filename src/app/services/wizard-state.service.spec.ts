import { TestBed } from '@angular/core/testing';

import { WizardStateService } from './wizard-state.service';

describe('WizardStateService', () => {
  let service: WizardStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WizardStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
