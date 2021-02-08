import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { BuysellComponent } from './buysell.component';

describe('BuysellComponent', () => {
  let component: BuysellComponent;
  let fixture: ComponentFixture<BuysellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuysellComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(BuysellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
