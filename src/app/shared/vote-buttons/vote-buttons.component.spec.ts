import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoteButtonsComponent } from './vote-buttons.component';

describe('VoteButtonsComponent', () => {
  let component: VoteButtonsComponent;
  let fixture: ComponentFixture<VoteButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoteButtonsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VoteButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit LIKE when like button is clicked', () => {
    spyOn(component.vote, 'emit');
    
    component.onLike();
    
    expect(component.vote.emit).toHaveBeenCalledWith('LIKE');
  });

  it('should emit DISLIKE when dislike button is clicked', () => {
    spyOn(component.vote, 'emit');
    
    component.onDislike();
    
    expect(component.vote.emit).toHaveBeenCalledWith('DISLIKE');
  });

  it('should display correct like count', () => {
    component.likesCount = 42;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('42');
  });

  it('should display correct dislike count', () => {
    component.dislikesCount = 5;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('5');
  });

  it('should not emit when disabled', () => {
    component.disabled = true;
    fixture.detectChanges();
    
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBeTrue();
    expect(buttons[1].disabled).toBeTrue();
  });
});
