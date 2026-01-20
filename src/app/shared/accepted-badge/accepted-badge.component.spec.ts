import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcceptedBadgeComponent } from './accepted-badge.component';

describe('AcceptedBadgeComponent', () => {
  let component: AcceptedBadgeComponent;
  let fixture: ComponentFixture<AcceptedBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptedBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptedBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display accepted solution text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Accepted Solution');
  });
});
