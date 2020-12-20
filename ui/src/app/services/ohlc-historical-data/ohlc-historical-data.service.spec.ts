import { TestBed } from '@angular/core/testing';

import { OhlcHistoricalDataService } from './ohlc-historical-data.service';

describe('OhlcHistoricalDataService', () => {
  let service: OhlcHistoricalDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OhlcHistoricalDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
