import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResolvedBadgeComponent } from './resolved-badge.component';

describe('ResolvedBadgeComponent', () => {
  let component: ResolvedBadgeComponent;
  let fixture: ComponentFixture<ResolvedBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResolvedBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResolvedBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display resolved badge when isResolved is true', () => {
    component.isResolved = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Resolved');
  });

  it('should display unresolved badge when isResolved is false', () => {
    component.isResolved = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Unresolved');
  });
});
