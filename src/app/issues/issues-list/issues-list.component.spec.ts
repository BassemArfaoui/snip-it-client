import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { IssuesListComponent } from './issues-list.component';
import { IssuesService } from '../../services/issues.service';
import { AuthService } from '../../auth.service';
import { of, throwError } from 'rxjs';

describe('IssuesListComponent', () => {
  let component: IssuesListComponent;
  let fixture: ComponentFixture<IssuesListComponent>;
  let issuesService: jasmine.SpyObj<IssuesService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const issuesServiceSpy = jasmine.createSpyObj('IssuesService', ['getIssues']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getAccessToken']);

    await TestBed.configureTestingModule({
      imports: [
        IssuesListComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule
      ],
      providers: [
        { provide: IssuesService, useValue: issuesServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    issuesService = TestBed.inject(IssuesService) as jasmine.SpyObj<IssuesService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    fixture = TestBed.createComponent(IssuesListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load issues on init', () => {
    const mockIssues = [
      {
        id: 1,
        content: 'Test issue',
        language: 'typescript',
        solutions_count: 5,
        is_resolved: false,
        likesCount: 10,
        dislikesCount: 2,
        created_at: '2025-12-20T10:00:00Z',
        author: { id: 1, username: 'testuser' }
      }
    ];

    issuesService.getIssues.and.returnValue(of(mockIssues));
    authService.getAccessToken.and.returnValue('test-token');

    component.ngOnInit();

    expect(issuesService.getIssues).toHaveBeenCalled();
    expect(component.issues).toEqual(mockIssues);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading issues fails', () => {
    issuesService.getIssues.and.returnValue(throwError(() => new Error('Failed to load')));
    authService.getAccessToken.and.returnValue(null);

    component.loadIssues();

    expect(component.error).toBe('Failed to load issues. Please try again.');
    expect(component.loading).toBeFalse();
  });

  it('should check authentication status', () => {
    issuesService.getIssues.and.returnValue(of([]));
    authService.getAccessToken.and.returnValue('test-token');
    
    component.ngOnInit();
    
    expect(component.isAuthenticated).toBeTrue();
  });

  it('should format date correctly', () => {
    const now = new Date();
    const justNow = now.toISOString();
    
    expect(component.formatDate(justNow)).toBe('Just now');
  });
});
