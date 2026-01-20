import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IssuesService } from '../../services/issues.service';

@Component({
  selector: 'app-create-issue',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './create-issue.component.html'
})
export class CreateIssueComponent implements OnInit {
  issueForm!: FormGroup;
  submitting = false;
  error: string | null = null;
  imagePreview: string | null = null;
  imageData: string | null = null;
  readonly maxUploadSize = 2 * 1024 * 1024; // 2MB
  readonly maxImageDimension = 1024; // pixels

  languages = [
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'C#',
    'go',
    'Rust',
    'PHP',
    'Ruby',
    'C++'
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private issuesService: IssuesService
  ) {}

  ngOnInit() {
    this.issueForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
      language: ['', Validators.required]
    });
  }

  get content() {
    return this.issueForm.get('content');
  }

  get language() {
    return this.issueForm.get('language');
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    if (file.size > this.maxUploadSize) {
      this.error = 'Image is too large. Please select a file under 2 MB.';
      return;
    }

    this.error = null;
    this.resizeImage(file)
      .then((dataUrl) => {
        this.imageData = dataUrl;
        this.imagePreview = dataUrl;
      })
      .catch(() => {
        this.error = 'Could not process image. Please try a smaller image.';
      });
  }

  removeImage(): void {
    this.imagePreview = null;
    this.imageData = null;
  }

  private resizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > this.maxImageDimension || height > this.maxImageDimension) {
            if (width > height) {
              height = (height / width) * this.maxImageDimension;
              width = this.maxImageDimension;
            } else {
              width = (width / height) * this.maxImageDimension;
              height = this.maxImageDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onSubmit() {
    if (this.issueForm.invalid) {
      Object.keys(this.issueForm.controls).forEach(key => {
        this.issueForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;

    const requestData = {
      ...this.issueForm.value,
      imageUrl: this.imageData || undefined
    };

    this.issuesService.createIssue(requestData).subscribe({
      next: (issue) => {
        this.router.navigate(['/issues', issue.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Failed to create issue. Please try again.';
        console.error('Error creating issue:', err);
      }
    });
  }
}
