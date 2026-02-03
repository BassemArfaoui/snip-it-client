import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ProfileService, UpdateProfilePayload, ProfileSummary } from '../../../services/profile.service';
import { updateUsername } from '../../../auth.store';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-edit.component.html'
})
export class ProfileEditComponent implements OnChanges {
  @Input() profile: ProfileSummary | null = null;

  editForm: FormGroup;
  imagePreview: string | null = null;
  editError = '';
  editSuccess = '';
  editLoading = false;

  @Output() imageData = new EventEmitter<string>();
  @Output() saved = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private profileService: ProfileService, private fb: FormBuilder) {
    this.editForm = this.fb.group({
      username: ['', [Validators.minLength(3)]],
      email: ['', [Validators.email]],
      imageProfile: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['profile'] && this.profile) {
      this.editForm.patchValue({
        username: this.profile.username || '',
        email: this.profile.email || '',
        imageProfile: ''
      });
      this.imagePreview = this.profile.imageProfile || null;
      this.editError = '';
      this.editSuccess = '';
    }
  }

  onSubmit() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { username, email } = this.editForm.value;
    const payload: UpdateProfilePayload = {};
    if (username && username.trim().length > 0) payload.username = username.trim();
    if (email && email.trim().length > 0) payload.email = email.trim();
    if (this.imagePreview !== null) payload.imageProfile = this.imagePreview;

    this.editLoading = true;
    this.editError = '';
    this.editSuccess = '';

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.editSuccess = res.message || 'Profile updated successfully';
        this.editError = '';
        this.editLoading = false;
        if (res.usernameChanged && res.username) {
          updateUsername(res.username);
        }
        this.saved.emit(res);
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

  // File resize + emit data URL
  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const maxUploadSize = 2 * 1024 * 1024; // 2MB
    const maxImageDimension = 512;

    if (file.size > maxUploadSize) {
      this.editError = 'Image is too large. Please select a file under 2 MB.';
      return;
    }

    this.editError = '';

    try {
      const dataUrl = await this.resizeImage(file, maxImageDimension);
      this.imagePreview = dataUrl;
      this.imageData.emit(dataUrl);
    } catch (e) {
      this.editError = 'Could not process image. Please try a smaller image.';
    }
  }

  private resizeImage(file: File, maxImageDimension = 512): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('No canvas context'));

          let { width, height } = img;
          const maxDim = maxImageDimension;
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
          try {
            const data = canvas.toDataURL('image/jpeg', 0.75);
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Image load error'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  }
}
