import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProfileService, ProfileSummary, Post, Issue, LeaderBoardUser, ContributionDay, StreakStats } from '../services/profile.service';
import { getUserId } from '../auth.store';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userId: number = 1;
  profile: ProfileSummary | null = null;
  activeTab: string = 'posts';
  isOwnProfile = false;
  
  // Tab data
  posts: Post[] = [];
  issues: Issue[] = [];
  savedPosts: Post[] = [];
  badges: any[] = [];
  leaderboard: LeaderBoardUser[] = [];
  contributionGraph: ContributionDay[] = [];
  streak: StreakStats | null = null;

  showGraphCard = false;
  showStreakCard = false;
  showLeaderboardCard = false;

  graphWeeks: { date: string; count: number; }[][] = [];
  graphLoading = false;
  streakLoading = false;
  leaderboardLoading = false;

  loading: boolean = false;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService
  ) {}

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
}
