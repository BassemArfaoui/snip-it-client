import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '../services/profile.service';
import { SubscriptionService } from '../services/subscription.service';

const activatedRouteMock = {
  paramMap: of(convertToParamMap({ id: '1' }))
};

const profileServiceMock: jasmine.SpyObj<ProfileService> = jasmine.createSpyObj('ProfileService', [
  'getProfile',
  'getUserPosts',
  'getUserIssues',
  'getSavedPosts',
  'getBadges',
  'getLeaderBoard',
  'getContributionGraph',
  'getStreak'
]);

profileServiceMock.getProfile.and.returnValue(of({ username: 'test', email: 'test@example.com' } as any));
profileServiceMock.getUserPosts.and.returnValue(of([]));
profileServiceMock.getUserIssues.and.returnValue(of([]));
profileServiceMock.getSavedPosts.and.returnValue(of([]));
profileServiceMock.getBadges.and.returnValue(of([]));
profileServiceMock.getLeaderBoard.and.returnValue(of([]));
profileServiceMock.getContributionGraph.and.returnValue(of([]));
profileServiceMock.getStreak.and.returnValue(of({ current: 0, longest: 0 } as any));

const subscriptionServiceMock: Partial<SubscriptionService> = {};

describe('ProfileComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [
        { provide: ProfileService, useValue: profileServiceMock },
        { provide: SubscriptionService, useValue: subscriptionServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
