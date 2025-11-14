import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrintTable } from './print-table';

describe('PrintTable', () => {
  let component: PrintTable;
  let fixture: ComponentFixture<PrintTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintTable],
    }).compileComponents();

    fixture = TestBed.createComponent(PrintTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
