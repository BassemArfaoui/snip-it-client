import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, ProfileSummary, ContributionDay, UpdateProfilePayload } from '../services/profile.service';
import { AuthService } from '../auth.service';
import { AdminService } from '../admin/admin.service';
import { getUserId, updateUsername } from '../auth.store';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ContributionGraphComponent } from './components/contribution-graph/contribution-graph.component';
import { DailyStreakComponent } from './components/daily-streak/daily-streak.component';
import { BadgesListComponent } from './components/badges-list/badges-list.component';
import { FeedComponent } from './components/feed/feed.component';
import { GlobalLeaderboardComponent } from './components/global-leaderboard/global-leaderboard.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';

type ProfileDetail = ProfileSummary & { email?: string; imageProfile?: string | null; role?: string };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ProfileCardComponent, ContributionGraphComponent, DailyStreakComponent, BadgesListComponent, FeedComponent, GlobalLeaderboardComponent, ProfileEditComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userId: number = 1;
  profile = signal<ProfileDetail | null>(null);
  activeTab = signal<'posts' | 'issues'>('posts');
  isOwnProfile = signal(false);
  @ViewChild(ProfileCardComponent) profileCard?: ProfileCardComponent;

  showGraphCard = signal(false);
  showStreakCard = signal(false);
  showLeaderboardCard = signal(false);
  showEditModal = signal(false);
  showPasswordModal = signal(false);
  imagePreview = signal<string | null>(null);
  editForm: FormGroup;
  followLoading = signal(false);

  // open/close handlers for the "Change Password" button (stub for now)
  openPasswordModal(): void {
    if (!this.profile()) return;
    this.showPasswordModal.set(true);
    console.log('[ProfileComponent] openPasswordModal');
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  loading = signal(false);
  error = signal('');

  // Use plain strings for these errors (code assigns strings directly)
  postsError = '';
  issuesError = '';

  // Missing state from the merge
  // make this a signal so template usage like isAdminViewer() works
  isAdminViewer = signal(false);
  posts: any[] = [];
  issues: any[] = [];
  badges: any[] = [];
  badgesError = '';
  leaderboard: any[] = [];
  leaderboardLoading = false;
  leaderboardError = '';
  contributionGraph: ContributionDay[] = [];
  graphWeeks: ContributionDay[][] = [];
  graphLoading = false;
  graphError = '';
  streak: any = null;
  streakLoading = false;
  streakError = '';
  openPostMenuId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private auth: AuthService,
    private adminService: AdminService,
    private profileService: ProfileService,
  ) {
    this.editForm = this.fb.group({
      username: ['', [Validators.minLength(3)]],
      email: ['', [Validators.email]],
      imageProfile: ['']
    });

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.userId = id ? parseInt(id, 10) : 1;
      const currentUserId = getUserId();
      this.isOwnProfile.set(!!currentUserId && currentUserId === this.userId);
      const role = this.auth.getUserRole?.() ?? null;
      this.isAdminViewer.set(!!role && typeof role === 'string' && role.toLowerCase() === 'admin');
      this.activeTab.set('posts');
    });
    console.log('[ProfileComponent] ngOnInit userId=', this.userId, 'isOwnProfile=', this.isOwnProfile());
  }

  switchTab(tab: 'posts' | 'issues'): void {
    this.activeTab.set(tab);
    this.loadTabData(tab);
    console.log('[ProfileComponent] switchTab ->', tab);
  }

  loadTabData(tab: 'posts' | 'issues' | 'badges' | 'leaderboard' | 'overview'): void {
    switch(tab) {
      case 'posts':
      case 'issues':
        break;
      case 'badges':
        break;
      case 'leaderboard':
        this.showLeaderboardCard.set(true);
        break;
      case 'overview':
      default:
        // overview data (contribution graph, streak) are handled by their child components
        break;
    }
  }

  loadOverviewData(): void {
    this.loadContributionGraph();
    this.loadStreak();
  }

  loadPosts(): void {
    this.postsError = '';
    this.profileService.getUserPosts(this.userId).subscribe({
      next: (data) => {
        this.posts = data || [];
        this.postsError = '';
      },
      error: (err) => {
        console.error('Posts error:', err);
        this.posts = [];
        const status = err?.status;
        if (status === 404) {
          this.postsError = 'User not found';
        } else if (status === 403) {
          this.postsError = 'Access denied';
        } else {
          this.postsError = err?.error?.message || 'Failed to load posts';
        }
      }
    });
  }

  // Admin actions for posts/issues
  togglePostMenu(postId: number) {
    this.openPostMenuId = this.openPostMenuId === postId ? null : postId;
  }

  adminDeletePost(postId: number) {
    // optimistic: mark deleted locally and update counts
    this.adminDeleteLocal(postId);
    this.adminService?.deletePost?.(postId)?.subscribe({
      // keep optimistic UI on success so deleted posts remain visible for restore
      next: () => { this.openPostMenuId = null; },
      // if server returns error, reload from server to restore consistency
      error: () => this.loadPosts(),
    });
  }

  // local quick remove (optimistic)
  adminDeleteLocal(postId: number) {
    const idx = this.posts.findIndex(p => p.id === postId);
    if (idx === -1) return;
    const now = new Date().toISOString();
    this.posts[idx] = { ...this.posts[idx], isDeleted: true, deletedAt: now } as any;

    const p = this.profile();
    if (p) {
      this.profile.set({ ...p, posts: Math.max(0, (p.posts || 0) - 1) } as ProfileDetail);
    }
  }

  adminRestorePost(postId: number) {
    // optimistic: mark restored locally
    this.adminRestoreLocal(postId);
    this.adminService?.restorePost?.(postId)?.subscribe({
      // ensure the local post is un-deleted and keep it visible
      next: () => {
        const idx = this.posts.findIndex(p => p.id === postId);
        if (idx !== -1) {
          this.posts[idx] = { ...this.posts[idx], isDeleted: false, deletedAt: null } as any;
        }
        this.openPostMenuId = null;
        // reload authoritative data from server to ensure DB state is reflected
        this.loadPosts();
      },
      // if server returns error, revert optimistic change and reload
      error: () => {
        const idx = this.posts.findIndex(p => p.id === postId);
        if (idx !== -1) {
          const now = new Date().toISOString();
          this.posts[idx] = { ...this.posts[idx], isDeleted: true, deletedAt: now } as any;
        }
        this.loadPosts();
      },
    });
  }

  adminRestoreLocal(postId: number) {
    const idx = this.posts.findIndex(p => p.id === postId);
    if (idx === -1) return;
    this.posts[idx] = { ...this.posts[idx], isDeleted: false, deletedAt: null } as any;

    const p = this.profile();
    if (p) {
      this.profile.set({ ...p, posts: (p.posts || 0) + 1 } as ProfileDetail);
    }
  }

  // Issues admin actions (mirror posts behaviour)
  adminDeleteIssue(issueId: number) {
    this.adminDeleteLocalIssue(issueId);
    this.adminService?.deleteIssue?.(issueId)?.subscribe({
      next: () => { this.openPostMenuId = null; },
      error: () => this.loadIssues(),
    });
  }

  adminDeleteLocalIssue(issueId: number) {
    const idx = this.issues.findIndex(i => i.id === issueId);
    if (idx === -1) return;
    const now = new Date().toISOString();
    this.issues[idx] = { ...this.issues[idx], isDeleted: true, deletedAt: now } as any;

    const p = this.profile();
    if (p) {
      this.profile.set({ ...p, issues: Math.max(0, (p.issues || 0) - 1) } as ProfileDetail);
    }
  }

  adminRestoreIssue(issueId: number) {
    this.adminRestoreLocalIssue(issueId);
    this.adminService?.restoreIssue?.(issueId)?.subscribe({
      next: () => {
        const idx = this.issues.findIndex(i => i.id === issueId);
        if (idx !== -1) {
          this.issues[idx] = { ...this.issues[idx], isDeleted: false, deletedAt: null } as any;
        }
        this.openPostMenuId = null;
        this.loadIssues();
      },
      error: () => {
        const idx = this.issues.findIndex(i => i.id === issueId);
        if (idx !== -1) {
          const now = new Date().toISOString();
          this.issues[idx] = { ...this.issues[idx], isDeleted: true, deletedAt: now } as any;
        }
        this.loadIssues();
      }
    });
  }

  adminRestoreLocalIssue(issueId: number) {
    const idx = this.issues.findIndex(i => i.id === issueId);
    if (idx === -1) return;
    this.issues[idx] = { ...this.issues[idx], isDeleted: false, deletedAt: null } as any;

    const p = this.profile();
    if (p) {
      this.profile.set({ ...p, issues: (p.issues || 0) + 1 } as ProfileDetail);
    }
  }

  loadIssues(): void {
    this.issuesError = '';
    this.profileService.getUserIssues(this.userId).subscribe({
      next: (data) => {
        this.issues = data || [];
        this.issuesError = '';
      },
      error: (err) => {
        console.error('Issues error:', err);
        this.issues = [];
        const status = err?.status;
        if (status === 404) {
          this.issuesError = 'User not found';
        } else if (status === 403) {
          this.issuesError = 'Access denied';
        } else {
          this.issuesError = err?.error?.message || 'Failed to load issues';
        }
      }
    });
  }

  loadBadges(): void {
    this.badgesError = '';
    this.profileService.getBadges(this.userId).subscribe({
      next: (data) => {
        this.badges = data || [];
        this.badgesError = '';
      },
      error: (err) => {
        console.error('Badges error:', err);
        this.badges = [];
        this.badgesError = err?.error?.message || 'Failed to load badges';
      }
    });
  }

  loadLeaderboard(): void {
    this.leaderboardLoading = true;
    this.leaderboardError = '';
    this.profileService.getLeaderBoard(this.userId).subscribe({
      next: (data) => {
        this.leaderboard = data || [];
        this.leaderboardLoading = false;
        this.leaderboardError = '';
      },
      error: (err) => {
        console.error('Leaderboard error:', err);
        this.leaderboard = [];
        this.leaderboardLoading = false;
        this.leaderboardError = err?.error?.message || 'Failed to load leaderboard';
      }
    });
  }

  loadContributionGraph(): void {
    this.graphLoading = true;
    this.graphError = '';
    this.profileService.getContributionGraph(this.userId).subscribe({
      next: (data) => {
        this.contributionGraph = data || [];
        this.graphWeeks = this.buildGraphWeeks(this.contributionGraph);
        this.graphLoading = false;
        this.graphError = '';
      },
      error: (err) => {
        console.error('Contribution graph error:', err);
        this.contributionGraph = [];
        this.graphWeeks = [];
        this.graphLoading = false;
        const status = err?.status;
        if (status === 404) {
          this.graphError = 'User not found';
        } else {
          this.graphError = err?.error?.message || 'Failed to load contribution graph';
        }
      }
    });
  }

  loadStreak(): void {
    this.streakLoading = true;
    this.streakError = '';
    this.profileService.getStreak(this.userId).subscribe({
      next: (data) => {
        this.streak = data;
        this.streakLoading = false;
        this.streakError = '';
      },
      error: (err) => {
        console.error('Streak error:', err);
        this.streak = null;
        this.streakLoading = false;
        const status = err?.status;
        if (status === 404) {
          this.streakError = 'User not found';
        } else {
          this.streakError = err?.error?.message || 'Failed to load streak data';
        }
      }
    });
  }

  toggleGraph(): void {
    this.showGraphCard.set(!this.showGraphCard());
  }

  toggleStreak(): void {
    this.showStreakCard.set(!this.showStreakCard());
  }

  toggleLeaderboard(): void {
    this.showLeaderboardCard.set(!this.showLeaderboardCard());
  }

  openEditModal(): void {
    if (!this.profile()) return;
    const p = this.profile()!;
    this.editForm.patchValue({
      username: p.username || '',
      email: p.email || '',
      imageProfile: ''
    });
    this.imagePreview.set(p.imageProfile || null);
    this.showEditModal.set(true);
    console.log('[ProfileComponent] openEditModal profile=', this.profile());
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    console.log('[ProfileComponent] closeEditModal');
  }


  onProfileSaved(res: any): void {
    if (!this.profile()) return;
    const p = this.profile()!;
    const updated: ProfileDetail = {
      ...p,
      username: res.username ?? p.username,
      email: res.email ?? p.email,
      imageProfile: res.imageProfile ?? p.imageProfile,
    };
    this.profile.set(updated);
    this.imagePreview.set(updated.imageProfile || null);
    setTimeout(() => this.closeEditModal(), 200);
    console.log('[ProfileComponent] onProfileSaved, updated profile=', this.profile());
  }

  onProfileLoaded(profile: ProfileDetail): void {
    this.profile.set(profile);
    this.loading.set(false);
    console.log('[ProfileComponent] onProfileLoaded received profile=', profile);
  }


  onFollowChange(payload: { isFollowing: boolean; followers: number }): void {
    if (!this.profile()) return;
    const p = this.profile()!;
    this.profile.set({ ...p, isFollowing: payload.isFollowing, followers: payload.followers });
    console.log('[ProfileComponent] onFollowChange', payload);
  }

  loadProfile(): void {
    this.profileCard?.loadProfile();
    console.log('[ProfileComponent] loadProfile called, delegating to profileCard');
  }

  // helper used by buildGraphWeeks call in loadContributionGraph
  private buildGraphWeeks(days: ContributionDay[]): ContributionDay[][] {
    // naive grouping into weeks (keep existing behavior)
    const weeks: ContributionDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }
}
