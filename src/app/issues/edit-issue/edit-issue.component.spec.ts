import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { EditIssueComponent } from './edit-issue.component';
import { IssuesService } from '../../services/issues.service';
import { of } from 'rxjs';

describe('EditIssueComponent', () => {
  let component: EditIssueComponent;
  let fixture: ComponentFixture<EditIssueComponent>;
  let issuesService: jasmine.SpyObj<IssuesService>;

  beforeEach(async () => {
    const issuesServiceSpy = jasmine.createSpyObj('IssuesService', ['getIssueById', 'updateIssue']);

    await TestBed.configureTestingModule({
      imports: [
        EditIssueComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: IssuesService, useValue: issuesServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' })
          }
        }
      ]
    }).compileComponents();

    issuesService = TestBed.inject(IssuesService) as jasmine.SpyObj<IssuesService>;
    
    fixture = TestBed.createComponent(EditIssueComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load issue and populate form', () => {
    const mockIssue = {
      id: 1,
      content: 'Test issue content',
      language: 'typescript',
      solutions_count: 0,
      is_resolved: false,
      likesCount: 0,
      dislikesCount: 0,
      created_at: '2025-12-20T10:00:00Z',
      author: { id: 1, username: 'testuser' }
    };

    issuesService.getIssueById.and.returnValue(of(mockIssue));

    component.ngOnInit();

    expect(component.issueForm.get('content')?.value).toBe('Test issue content');
    expect(component.issueForm.get('language')?.value).toBe('typescript');
  });

  it('should update issue on valid form submission', () => {
    const mockIssue = {
      id: 1,
      content: 'Updated content',
      language: 'javascript',
      solutions_count: 0,
      is_resolved: false,
      likesCount: 0,
      dislikesCount: 0,
      created_at: '2025-12-20T10:00:00Z',
      author: { id: 1, username: 'testuser' }
    };

    issuesService.getIssueById.and.returnValue(of(mockIssue));
    issuesService.updateIssue.and.returnValue(of(mockIssue));

    component.ngOnInit();
    component.issueForm.patchValue({
      content: 'Updated content with enough length',
      language: 'javascript'
    });

    component.onSubmit();

    expect(issuesService.updateIssue).toHaveBeenCalled();
  });
});
