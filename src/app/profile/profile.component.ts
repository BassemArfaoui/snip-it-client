import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, ProfileSummary, Post, Issue, LeaderBoardUser, ContributionDay, StreakStats, UpdateProfilePayload, UpdatePasswordPayload } from '../services/profile.service';
import { getUserId, updateUsername } from '../auth.store';

type ProfileDetail = ProfileSummary & { email?: string; imageProfile?: string | null };
interface Badge {
  id?: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userId: number = 1;
  profile: ProfileDetail | null = null;
  activeTab: string = 'posts';
  isOwnProfile = false;
  
  // Tab data
  posts: Post[] = [];
  issues: Issue[] = [];
  savedPosts: Post[] = [];
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
  passwordForm: FormGroup;
  editLoading = false;
  editError = '';
  editSuccess = '';
  showPasswordModal = false;
  passwordLoading = false;
  passwordError = '';
  passwordSuccess = '';
  showEmailVerificationPrompt = false;

  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      username: ['', [Validators.minLength(3)]],
      email: ['', [Validators.email]],
      imageProfile: ['']
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(8)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.userId = id ? parseInt(id, 10) : 1;
      const currentUserId = getUserId();
      this.isOwnProfile = !!currentUserId && currentUserId === this.userId;
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
        this.error = 'Failed to load profile. Please try again.';
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
      case 'saved':
        this.loadSavedPosts();
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
    this.profileService.getUserPosts(this.userId).subscribe({
      next: (data) => this.posts = data,
      error: (err) => console.error('Posts error:', err)
    });
  }

  loadIssues(): void {
    this.profileService.getUserIssues(this.userId).subscribe({
      next: (data) => this.issues = data,
      error: (err) => console.error('Issues error:', err)
    });
  }

  loadSavedPosts(): void {
    this.profileService.getSavedPosts(this.userId).subscribe({
      next: (data) => this.savedPosts = data,
      error: (err) => console.error('Saved posts error:', err)
    });
  }

  loadBadges(): void {
    this.profileService.getBadges(this.userId).subscribe({
      next: (data) => this.badges = data,
      error: (err) => console.error('Badges error:', err)
    });
  }

  loadLeaderboard(): void {
    this.leaderboardLoading = true;
    this.profileService.getLeaderBoard(this.userId).subscribe({
      next: (data) => {
        this.leaderboard = data;
        this.leaderboardLoading = false;
      },
      error: (err) => {
        console.error('Leaderboard error:', err);
        this.leaderboardLoading = false;
      }
    });
  }

  loadContributionGraph(): void {
    this.graphLoading = true;
    this.profileService.getContributionGraph(this.userId).subscribe({
      next: (data) => {
        this.contributionGraph = data || [];
        this.graphWeeks = this.buildGraphWeeks(this.contributionGraph);
        this.graphLoading = false;
      },
      error: (err) => {
        console.error('Contribution graph error:', err);
        this.graphLoading = false;
      }
    });
  }

  loadStreak(): void {
    this.streakLoading = true;
    this.profileService.getStreak(this.userId).subscribe({
      next: (data) => {
        this.streak = data;
        this.streakLoading = false;
      },
      error: (err) => {
        console.error('Streak error:', err);
        this.streakLoading = false;
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
        this.editLoading = false;
      },
      error: (err) => {
        this.editError = err?.error?.message || 'Failed to update profile';
        this.editLoading = false;
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

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  openPasswordModal(): void {
    this.passwordError = '';
    this.passwordSuccess = '';
    this.passwordForm.reset();
    this.showPasswordModal = true;
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
  }

  submitPasswordUpdate(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.value;
    const payload: UpdatePasswordPayload = { currentPassword, newPassword };

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.profileService.updatePassword(payload).subscribe({
      next: (res) => {
        this.passwordSuccess = res.message || 'Password updated successfully';
        this.passwordLoading = false;
        if (res.requiresEmailVerification) {
          setTimeout(() => {
            this.showPasswordModal = false;
            this.showEmailVerificationPrompt = true;
          }, 2000);
        }
      },
      error: (err) => {
        this.passwordError = err?.error?.message || 'Failed to update password';
        this.passwordLoading = false;
      }
    });
  }

  goToEmailVerification(): void {
    // Save email to localStorage for pre-fill on verify page
    if (this.profile?.email) {
      localStorage.setItem('pendingVerificationEmail', this.profile.email);
    }
    window.location.href = '/verify-email';
  }
}
