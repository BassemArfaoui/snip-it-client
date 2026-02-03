import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, ProfileSummary, Post, Issue, LeaderBoardUser, ContributionDay, StreakStats, UpdateProfilePayload } from '../services/profile.service';
import { SubscriptionService } from '../services/subscription.service';
import { AuthService } from '../auth.service';
import { AdminService } from '../admin/admin.service';
import { getUserId, updateUsername } from '../auth.store';

type ProfileDetail = ProfileSummary & { email?: string; imageProfile?: string | null; role?: string };
interface Badge {
  id?: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userId: number = 1;
  profile: ProfileDetail | null = null;
  activeTab: string = 'posts';
  isOwnProfile = false;
  isAdminViewer = false;
  openPostMenuId: number | null = null;
  
  // Tab data
  posts: Post[] = [];
  issues: Issue[] = [];
  badges: Badge[] = [];
  leaderboard: LeaderBoardUser[] = [];
  contributionGraph: ContributionDay[] = [];
  streak: StreakStats | null = null;

  showGraphCard = false;
  showStreakCard = false;
  showLeaderboardCard = false;
  showEditModal = false;
  imagePreview: string | null = null;
  newImageData: string | null = null;
  readonly maxUploadSize = 2 * 1024 * 1024; // 2MB client-side limit
  readonly maxImageDimension = 512; // pixels

  graphWeeks: { date: string; count: number; }[][] = [];
  graphLoading = false;
  streakLoading = false;
  leaderboardLoading = false;
  editForm: FormGroup;
  editLoading = false;
  editError = '';
  editSuccess = '';
  followLoading = false;

  loading: boolean = false;
  error: string = '';
  postsError: string = '';
  issuesError: string = '';
  badgesError: string = '';
  leaderboardError: string = '';
  graphError: string = '';
  streakError: string = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private subscriptionService: SubscriptionService,
    private fb: FormBuilder,
    private auth: AuthService,
    private adminService: AdminService,
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
      this.isOwnProfile = !!currentUserId && currentUserId === this.userId;
      const role = this.auth.getUserRole?.() ?? null;
      this.isAdminViewer = !!role && typeof role === 'string' && role.toLowerCase() === 'admin';
      this.activeTab = 'posts';
      this.loadProfile();
    });
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';
    
    this.profileService.getProfile(this.userId).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        this.editForm.patchValue({
          username: data.username || '',
          email: data.email || '',
          imageProfile: ''
        });
        this.imagePreview = data.imageProfile || null;
        this.newImageData = null;
        this.loadTabData(this.activeTab);
      },
      error: (err) => {
        const status = err?.status;
        if (status === 404) {
          this.error = 'User not found';
        } else {
          this.error = err?.error?.message || 'Failed to load profile. Please try again.';
        }
        this.loading = false;
        console.error('Profile error:', err);
      }
    });
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  loadTabData(tab: string): void {
    switch(tab) {
      case 'posts':
        this.loadPosts();
        break;
      case 'issues':
        this.loadIssues();
        break;
      case 'badges':
        this.loadBadges();
        break;
      case 'leaderboard':
        this.loadLeaderboard();
        break;
      case 'overview':
      default:
        this.loadOverviewData();
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
    if (this.profile) this.profile.posts = Math.max(0, (this.profile.posts || 0) - 1);
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
    if (this.profile) this.profile.posts = (this.profile.posts || 0) + 1;
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
    if (this.profile) this.profile.issues = Math.max(0, (this.profile.issues || 0) - 1);
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
    if (this.profile) this.profile.issues = (this.profile.issues || 0) + 1;
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
    this.showGraphCard = !this.showGraphCard;
    if (this.showGraphCard && this.contributionGraph.length === 0 && !this.graphLoading) {
      this.loadContributionGraph();
    }
  }

  toggleStreak(): void {
    this.showStreakCard = !this.showStreakCard;
    if (this.showStreakCard && !this.streak && !this.streakLoading) {
      this.loadStreak();
    }
  }

  toggleLeaderboard(): void {
    this.showLeaderboardCard = !this.showLeaderboardCard;
    if (this.showLeaderboardCard && this.leaderboard.length === 0 && !this.leaderboardLoading) {
      this.loadLeaderboard();
    }
  }

  openEditModal(): void {
    if (!this.profile) return;
    this.editError = '';
    this.editSuccess = '';
    this.editForm.patchValue({
      username: this.profile.username || '',
      email: this.profile.email || '',
      imageProfile: ''
    });
    this.imagePreview = this.profile.imageProfile || null;
    this.newImageData = null;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > this.maxUploadSize) {
      this.editError = 'Image is too large. Please select a file under 2 MB.';
      return;
    }

    this.editError = '';

    this.resizeImage(file)
      .then((dataUrl) => {
        this.newImageData = dataUrl;
        this.imagePreview = dataUrl;
      })
      .catch(() => {
        this.editError = 'Could not process image. Please try a smaller image.';
      });
  }

  private resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No canvas context'));
            return;
          }

          let { width, height } = img;
          const maxDim = this.maxImageDimension;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height >= width && height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }

  submitProfileUpdate(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { username, email } = this.editForm.value;
    const payload: UpdateProfilePayload = {};
    if (username && username.trim().length > 0) payload.username = username.trim();
    if (email && email.trim().length > 0) payload.email = email.trim();
    if (this.newImageData !== null) payload.imageProfile = this.newImageData;

    this.editLoading = true;
    this.editError = '';
    this.editSuccess = '';

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        if (this.profile) {
          this.profile = {
            ...this.profile,
            username: res.username ?? this.profile.username,
            email: res.email ?? this.profile.email,
            imageProfile: res.imageProfile ?? this.profile.imageProfile,
          };
          this.imagePreview = this.profile.imageProfile || null;
          this.newImageData = null;
          
          // Update username in auth store if it changed
          if (res.usernameChanged && res.username) {
            updateUsername(res.username);
          }
        }
        this.editSuccess = res.message || 'Profile updated successfully';
        this.editError = '';
        this.editLoading = false;
        setTimeout(() => this.closeEditModal(), 2000);
      },
      error: (err) => {
        const status = err?.status;
        if (status === 409) {
          this.editError = 'Username or email already taken';
        } else if (status === 400) {
          this.editError = err?.error?.message || 'Invalid profile data';
        } else if (status === 403) {
          this.editError = 'Access denied';
        } else if (status === 401) {
          this.editError = 'Please log in to update your profile';
        } else {
          this.editError = err?.error?.message || 'Failed to update profile. Please try again.';
        }
        this.editSuccess = '';
        this.editLoading = false;
        console.error('Update profile error:', err);
      }
    });
  }

  buildGraphWeeks(data: ContributionDay[]): { date: string; count: number; }[][] {
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 364);
    const counts = new Map<string, number>();
    data.forEach(entry => counts.set(entry.date.slice(0, 10), entry.count));

    const weeks: { date: string; count: number; }[][] = [];
    let currentWeek: { date: string; count: number; }[] = [];

    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      currentWeek.push({ date: iso, count: counts.get(iso) || 0 });

      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length) {
      weeks.push(currentWeek);
    }

    return weeks;
  }

  contributionColor(count: number): string {
    if (count === 0) return 'bg-gray-100 dark:bg-white/10';
    if (count <= 2) return 'bg-green-200 dark:bg-green-900/40';
    if (count <= 4) return 'bg-green-400 dark:bg-green-800/70';
    if (count <= 6) return 'bg-green-500 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-600';
  }

  formatDateLabel(date: string): string {
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  
  

  toggleFollow(): void {
    if (!this.profile || this.followLoading) return;

    this.followLoading = true;
    const isCurrentlyFollowing = this.profile.isFollowing;

    const action = isCurrentlyFollowing
      ? this.subscriptionService.unfollow(this.userId)
      : this.subscriptionService.follow(this.userId);

    action.subscribe({
      next: (response) => {
        if (this.profile) {
          this.profile.isFollowing = !isCurrentlyFollowing;
          this.profile.followers = response.followers;
        }
        this.followLoading = false;
      },
      error: (err) => {
        console.error('Follow/unfollow failed:', err);
        const status = err?.status;
        let errorMsg = 'Failed to update follow status';
        if (status === 401) {
          errorMsg = 'Please log in to follow users';
        } else if (status === 400) {
          errorMsg = err?.error?.message || 'Invalid request';
        } else if (status === 404) {
          errorMsg = 'User not found';
        }
        // Show error to user (you can add a toast notification here)
        alert(errorMsg);
        this.followLoading = false;
      }
    });
  }
}
