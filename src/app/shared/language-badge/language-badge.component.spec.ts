import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageBadgeComponent } from './language-badge.component';

describe('LanguageBadgeComponent', () => {
  let component: LanguageBadgeComponent;
  let fixture: ComponentFixture<LanguageBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct classes for typescript', () => {
    component.language = 'typescript';
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('bg-blue-100');
    expect(classes).toContain('text-blue-800');
  });

  it('should return correct classes for javascript', () => {
    component.language = 'javascript';
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('bg-yellow-100');
    expect(classes).toContain('text-yellow-800');
  });

  it('should return default classes for unknown language', () => {
    component.language = 'unknown';
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('bg-gray-100');
    expect(classes).toContain('text-gray-800');
  });

  it('should handle case insensitive language names', () => {
    component.language = 'TypeScript';
    const classes = component.getBadgeClasses();
    
    expect(classes).toContain('bg-blue-100');
  });
});
