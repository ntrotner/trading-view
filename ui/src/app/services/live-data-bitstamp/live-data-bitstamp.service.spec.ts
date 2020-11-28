import { TestBed } from '@angular/core/testing';

import { LiveDataBitstampService } from './live-data-bitstamp.service';

describe('LiveDataBitstampService', () => {
  let service: LiveDataBitstampService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveDataBitstampService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
