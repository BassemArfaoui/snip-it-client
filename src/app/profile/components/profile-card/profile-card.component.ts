import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProfileSummary, ProfileService } from '../../../services/profile.service';
import { SubscriptionService } from '../../../services/subscription.service';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile-card.component.html',
  // styleUrls: ['./profile-card.component.css']
})
export class ProfileCardComponent implements OnChanges {
  @Input() userId!: number;
  @Input() isOwnProfile: boolean = false;
  @Input() isFollowing: boolean = false;
  @Input() followLoading: boolean = false;
  @Input() isAdminViewer: boolean = false;

  @Output() profileLoaded = new EventEmitter<any>();
  @Output() followChange = new EventEmitter<any>();
  @Output() edit = new EventEmitter<void>();
  @Output() passwordRequested = new EventEmitter<void>();

  // profile loaded from the server, used by the template
  profile: ProfileSummary | null = null;

  internalFollowLoading = signal(false);

  loading = signal(false);
  error = signal('');

  constructor(private subscriptionService: SubscriptionService, private profileService: ProfileService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId'] && this.userId && !this.profile) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    if (!this.userId) return;
    this.loading.set(true);
    this.error.set('');
    console.log('[ProfileCard] loadProfile start userId=', this.userId);
    this.profileService.getProfile(this.userId).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading.set(false);
        this.error.set('');
        console.log('[ProfileCard] loadProfile success profile=', data);
        this.profileLoaded.emit(data);
      },
      error: (err) => {
        console.error('[ProfileCard] Profile load error:', err);
        this.loading.set(false);
        const status = err?.status;
        this.error.set(status === 404 ? 'User not found' : err?.error?.message || 'Failed to load profile');
      }
    });
  }

  handleFollow(): void {
    if (!this.userId || this.internalFollowLoading() || !this.profile) return;
    this.internalFollowLoading.set(true);
    const currentlyFollowing = this.isFollowing;
    const action = currentlyFollowing ? this.subscriptionService.unfollow(this.userId) : this.subscriptionService.follow(this.userId);
    action.subscribe({
      next: (res) => {
        const newFollowing = !currentlyFollowing;
        const followers = res.followers ?? (this.profile ? this.profile.followers : 0);
        this.internalFollowLoading.set(false);
        this.followChange.emit({ isFollowing: newFollowing, followers });
      },
      error: (err) => {
        console.error('Follow/unfollow failed:', err);
        this.internalFollowLoading.set(false);
        alert(err?.error?.message || 'Failed to update follow status');
      }
    });
  }
}
