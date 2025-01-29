import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TileToolComponent } from './tile-tool.component';

describe('TileToolComponent', () => {
  let component: TileToolComponent;
  let fixture: ComponentFixture<TileToolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TileToolComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TileToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
