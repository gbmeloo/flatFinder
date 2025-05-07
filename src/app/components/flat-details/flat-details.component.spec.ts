import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlatDetailsComponent } from './flat-details.component';

describe('FlatDetailsComponent', () => {
  let component: FlatDetailsComponent;
  let fixture: ComponentFixture<FlatDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlatDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlatDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
