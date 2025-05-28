import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlatEditComponent } from './flat-edit.component';

describe('FlatEditComponent', () => {
  let component: FlatEditComponent;
  let fixture: ComponentFixture<FlatEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlatEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlatEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
