import { TestBed } from '@angular/core/testing';

import { DataTableExport } from './data-table-export';

describe('DataTableExport', () => {
  let service: DataTableExport;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataTableExport);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
