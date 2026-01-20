import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IssueDetailsComponent } from './issue-details.component';
import { IssuesService } from '../../services/issues.service';
import { SolutionsService } from '../../services/solutions.service';
import { VotesService } from '../../services/votes.service';
import { AuthService } from '../../auth.service';
import { of } from 'rxjs';

describe('IssueDetailsComponent', () => {
  let component: IssueDetailsComponent;
  let fixture: ComponentFixture<IssueDetailsComponent>;
  let issuesService: jasmine.SpyObj<IssuesService>;
  let solutionsService: jasmine.SpyObj<SolutionsService>;
  let votesService: jasmine.SpyObj<VotesService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const issuesServiceSpy = jasmine.createSpyObj('IssuesService', ['getIssueById', 'deleteIssue']);
    const solutionsServiceSpy = jasmine.createSpyObj('SolutionsService', [
      'getSolutionsForIssue',
      'createSolution',
      'updateSolution',
      'deleteSolution',
      'acceptSolution'
    ]);
    const votesServiceSpy = jasmine.createSpyObj('VotesService', ['vote']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken', 'getUserId']);

    await TestBed.configureTestingModule({
      imports: [
        IssueDetailsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: IssuesService, useValue: issuesServiceSpy },
        { provide: SolutionsService, useValue: solutionsServiceSpy },
        { provide: VotesService, useValue: votesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: '1' })
          }
        }
      ]
    }).compileComponents();

    issuesService = TestBed.inject(IssuesService) as jasmine.SpyObj<IssuesService>;
    solutionsService = TestBed.inject(SolutionsService) as jasmine.SpyObj<SolutionsService>;
    votesService = TestBed.inject(VotesService) as jasmine.SpyObj<VotesService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(IssueDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load issue details on init', () => {
    const mockIssue = {
      id: 1,
      content: 'Test issue',
      language: 'typescript',
      solutions_count: 5,
      is_resolved: false,
      likesCount: 10,
      dislikesCount: 2,
      created_at: '2025-12-20T10:00:00Z',
      author: { id: 1, username: 'testuser' }
    };

    issuesService.getIssueById.and.returnValue(of(mockIssue));
    solutionsService.getSolutionsForIssue.and.returnValue(of([]));
    authService.getAccessToken.and.returnValue('test-token');
    authService.getUserId.and.returnValue(1);

    component.ngOnInit();

    expect(issuesService.getIssueById).toHaveBeenCalledWith(1);
    expect(component.issue).toEqual(mockIssue);
  });

  it('should check if user is issue owner', () => {
    component.issue = {
      id: 1,
      content: 'Test',
      language: 'typescript',
      solutions_count: 0,
      is_resolved: false,
      likesCount: 0,
      dislikesCount: 0,
      created_at: '2025-12-20T10:00:00Z',
      author: { id: 1, username: 'testuser' }
    };
    component.currentUserId = 1;

    expect(component.isIssueOwner()).toBeTrue();

    component.currentUserId = 2;
    expect(component.isIssueOwner()).toBeFalse();
  });

  it('should toggle solution form', () => {
    expect(component.showSolutionForm).toBeFalse();
    
    component.toggleSolutionForm();
    expect(component.showSolutionForm).toBeTrue();
    
    component.toggleSolutionForm();
    expect(component.showSolutionForm).toBeFalse();
  });
});
