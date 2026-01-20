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

  languages = [
    'typescript',
    'javascript',
    'python',
    'java',
    'csharp',
    'go',
    'rust',
    'php',
    'ruby',
    'cpp'
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

  onSubmit() {
    if (this.issueForm.invalid) {
      Object.keys(this.issueForm.controls).forEach(key => {
        this.issueForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;

    this.issuesService.createIssue(this.issueForm.value).subscribe({
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
