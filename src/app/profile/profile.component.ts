import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService, ProfileSummary, ContributionDay, UpdateProfilePayload } from '../services/profile.service';
import { getUserId, updateUsername } from '../auth.store';
import { ProfileCardComponent } from './components/profile-card/profile-card.component';
import { ContributionGraphComponent } from './components/contribution-graph/contribution-graph.component';
import { DailyStreakComponent } from './components/daily-streak/daily-streak.component';
import { BadgesListComponent } from './components/badges-list/badges-list.component';
import { FeedComponent } from './components/feed/feed.component';
import { GlobalLeaderboardComponent } from './components/global-leaderboard/global-leaderboard.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';

type ProfileDetail = ProfileSummary & { email?: string; imageProfile?: string | null };

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ProfileCardComponent, ContributionGraphComponent, DailyStreakComponent, BadgesListComponent, FeedComponent, GlobalLeaderboardComponent, ProfileEditComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
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
  imagePreview = signal<string | null>(null);
  editForm: FormGroup;
  followLoading = signal(false);

  loading = signal(false);
  error = signal('');
  postsError = signal('');
  issuesError = signal('');
  
  

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder
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
      this.activeTab.set('posts');
    });
    console.log('[ProfileComponent] ngOnInit userId=', this.userId, 'isOwnProfile=', this.isOwnProfile);
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
    console.log('[ProfileComponent] openEditModal profile=', this.profile);
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
    console.log('[ProfileComponent] onProfileSaved, updated profile=', this.profile);
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

}
