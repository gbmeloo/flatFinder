import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateFlatComponent } from './update-flat.component';

describe('UpdateFlatComponent', () => {
  let component: UpdateFlatComponent;
  let fixture: ComponentFixture<UpdateFlatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateFlatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateFlatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
