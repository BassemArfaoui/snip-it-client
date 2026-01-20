import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not display when isOpen is false', () => {
    component.isOpen = false;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed')).toBeNull();
  });

  it('should display when isOpen is true', () => {
    component.isOpen = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed')).toBeTruthy();
  });

  it('should emit confirm event when confirm button is clicked', () => {
    spyOn(component.confirm, 'emit');
    
    component.onConfirm();
    
    expect(component.confirm.emit).toHaveBeenCalled();
  });

  it('should emit cancel event when cancel button is clicked', () => {
    spyOn(component.cancel, 'emit');
    
    component.onCancel();
    
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it('should display custom title and message', () => {
    component.isOpen = true;
    component.title = 'Custom Title';
    component.message = 'Custom Message';
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Custom Title');
    expect(compiled.textContent).toContain('Custom Message');
  });
});
