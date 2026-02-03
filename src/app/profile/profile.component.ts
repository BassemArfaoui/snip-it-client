import { Component, OnInit, ViewChild } from '@angular/core';
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
  profile: ProfileDetail | null = null;
  activeTab: 'posts' | 'issues' = 'posts';
  isOwnProfile = false;
  @ViewChild(ProfileCardComponent) profileCard?: ProfileCardComponent;

  showGraphCard = false;
  showStreakCard = false;
  showLeaderboardCard = false;
  showEditModal = false;
  imagePreview: string | null = null;
  editForm: FormGroup;
  followLoading = false;

  loading: boolean = false;
  error: string = '';
  postsError: string = '';
  issuesError: string = '';
  
  

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
      this.isOwnProfile = !!currentUserId && currentUserId === this.userId;
      this.activeTab = 'posts';
    });
    console.log('[ProfileComponent] ngOnInit userId=', this.userId, 'isOwnProfile=', this.isOwnProfile);
  }

  switchTab(tab: 'posts' | 'issues'): void {
    this.activeTab = tab;
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
        this.showLeaderboardCard = true;
        break;
      case 'overview':
      default:
        // overview data (contribution graph, streak) are handled by their child components
        break;
    }
  }



  toggleGraph(): void {
    this.showGraphCard = !this.showGraphCard;
  }

  toggleStreak(): void {
    this.showStreakCard = !this.showStreakCard;
  }

  toggleLeaderboard(): void {
    this.showLeaderboardCard = !this.showLeaderboardCard;
  }

  openEditModal(): void {
    if (!this.profile) return;
    this.editForm.patchValue({
      username: this.profile.username || '',
      email: this.profile.email || '',
      imageProfile: ''
    });
    this.imagePreview = this.profile.imageProfile || null;
    this.showEditModal = true;
    console.log('[ProfileComponent] openEditModal profile=', this.profile);
  }

  closeEditModal(): void {
    this.showEditModal = false;
    console.log('[ProfileComponent] closeEditModal');
  }


  onProfileSaved(res: any): void {
    if (!this.profile) return;
    this.profile = {
      ...this.profile,
      username: res.username ?? this.profile.username,
      email: res.email ?? this.profile.email,
      imageProfile: res.imageProfile ?? this.profile.imageProfile,
    };
    this.imagePreview = this.profile.imageProfile || null;
    setTimeout(() => this.closeEditModal(), 200);
    console.log('[ProfileComponent] onProfileSaved, updated profile=', this.profile);
  }

  onProfileLoaded(profile: ProfileDetail): void {
    this.profile = profile;
    this.loading = false;
    console.log('[ProfileComponent] onProfileLoaded received profile=', profile);
  }


  onFollowChange(payload: { isFollowing: boolean; followers: number }): void {
    if (!this.profile) return;
    this.profile.isFollowing = payload.isFollowing;
    this.profile.followers = payload.followers;
    console.log('[ProfileComponent] onFollowChange', payload);
  }

  loadProfile(): void {
    this.profileCard?.loadProfile();
    console.log('[ProfileComponent] loadProfile called, delegating to profileCard');
  }

}
