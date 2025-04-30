import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlatsComponent } from './flats.component';

describe('FlatsComponent', () => {
  let component: FlatsComponent;
  let fixture: ComponentFixture<FlatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
