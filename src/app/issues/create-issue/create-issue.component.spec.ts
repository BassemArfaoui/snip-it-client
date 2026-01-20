import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreateIssueComponent } from './create-issue.component';
import { IssuesService } from '../../services/issues.service';
import { of, throwError } from 'rxjs';

describe('CreateIssueComponent', () => {
  let component: CreateIssueComponent;
  let fixture: ComponentFixture<CreateIssueComponent>;
  let issuesService: jasmine.SpyObj<IssuesService>;

  beforeEach(async () => {
    const issuesServiceSpy = jasmine.createSpyObj('IssuesService', ['createIssue']);

    await TestBed.configureTestingModule({
      imports: [
        CreateIssueComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: IssuesService, useValue: issuesServiceSpy }
      ]
    }).compileComponents();

    issuesService = TestBed.inject(IssuesService) as jasmine.SpyObj<IssuesService>;
    
    fixture = TestBed.createComponent(CreateIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.issueForm.get('content')?.value).toBe('');
    expect(component.issueForm.get('language')?.value).toBe('');
  });

  it('should validate content minimum length', () => {
    const contentControl = component.issueForm.get('content');
    
    contentControl?.setValue('short');
    expect(contentControl?.hasError('minlength')).toBeTrue();
    
    contentControl?.setValue('This is a valid content with more than 10 characters');
    expect(contentControl?.hasError('minlength')).toBeFalse();
  });

  it('should require language to be selected', () => {
    const languageControl = component.issueForm.get('language');
    
    expect(languageControl?.hasError('required')).toBeTrue();
    
    languageControl?.setValue('typescript');
    expect(languageControl?.hasError('required')).toBeFalse();
  });

  it('should not submit if form is invalid', () => {
    component.onSubmit();
    
    expect(issuesService.createIssue).not.toHaveBeenCalled();
  });

  it('should submit valid form', () => {
    const mockIssue = {
      id: 1,
      content: 'Test issue content that is long enough',
      language: 'typescript',
      solutions_count: 0,
      is_resolved: false,
      likesCount: 0,
      dislikesCount: 0,
      created_at: '2025-12-20T10:00:00Z',
      author: { id: 1, username: 'testuser' }
    };

    issuesService.createIssue.and.returnValue(of(mockIssue));

    component.issueForm.patchValue({
      content: 'Test issue content that is long enough',
      language: 'typescript'
    });

    component.onSubmit();

    expect(issuesService.createIssue).toHaveBeenCalled();
  });

  it('should handle error on submission', () => {
    issuesService.createIssue.and.returnValue(throwError(() => new Error('Failed')));

    component.issueForm.patchValue({
      content: 'Test issue content that is long enough',
      language: 'typescript'
    });

    component.onSubmit();

    expect(component.error).toBe('Failed to create issue. Please try again.');
    expect(component.submitting).toBeFalse();
  });
});
