import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PostsService, type CreatePostRequest } from '../../services/posts.service';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './create-post.component.html',
})
export class CreatePostComponent implements OnInit {
  postForm!: FormGroup;
  submitting = false;
  error: string | null = null;

  languages = [
    'TypeScript',
    'JavaScript',
    'Python',
    'Java',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Ruby',
    'C++',
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly postsService: PostsService,
  ) {}

  ngOnInit() {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      snippetLanguage: ['', Validators.required],
      snippetTitle: [''],
      snippetContent: ['', [Validators.required, Validators.minLength(1)]],
      githubLink: [''],
    });
  }

  get title() {
    return this.postForm.get('title');
  }

  get description() {
    return this.postForm.get('description');
  }

  get snippetLanguage() {
    return this.postForm.get('snippetLanguage');
  }

  get snippetContent() {
    return this.postForm.get('snippetContent');
  }

  onSubmit() {
    if (this.postForm.invalid) {
      Object.keys(this.postForm.controls).forEach((key) => {
        this.postForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;

    const raw = this.postForm.value as any;
    const request: CreatePostRequest = {
      title: String(raw.title).trim(),
      description: String(raw.description).trim(),
      snippetLanguage: String(raw.snippetLanguage).trim(),
      snippetContent: String(raw.snippetContent),
      snippetTitle: raw.snippetTitle ? String(raw.snippetTitle).trim() : undefined,
      githubLink: raw.githubLink ? String(raw.githubLink).trim() : undefined,
    };

    this.postsService.createPost(request).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.submitting = false;
        this.error = 'Failed to create post. Please try again.';
      },
    });
  }
}
