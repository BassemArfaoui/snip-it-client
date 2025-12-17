import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProfileService, ProfileSummary, Post, Issue, LeaderBoardUser } from '../services/profile.service';

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
  activeTab: string = 'overview';
  
  // Tab data
  posts: Post[] = [];
  issues: Issue[] = [];
  savedPosts: Post[] = [];
  badges: any[] = [];
  leaderboard: LeaderBoardUser[] = [];
  contributionGraph: any = null;
  streak: any = null;

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
    this.profileService.getContributionGraph(this.userId).subscribe({
      next: (data) => this.contributionGraph = data,
      error: (err) => console.error('Contribution graph error:', err)
    });

    this.profileService.getStreak(this.userId).subscribe({
      next: (data) => this.streak = data,
      error: (err) => console.error('Streak error:', err)
    });
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
    this.profileService.getLeaderBoard(this.userId).subscribe({
      next: (data) => this.leaderboard = data,
      error: (err) => console.error('Leaderboard error:', err)
    });
  }
}
