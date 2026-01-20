import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IssuesService, IssueDetails } from '../../services/issues.service';

@Component({
  selector: 'app-edit-issue',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './edit-issue.component.html'
})
export class EditIssueComponent implements OnInit {
  issueForm!: FormGroup;
  issue: IssueDetails | null = null;
  loading = false;
  submitting = false;
  error: string | null = null;
  issueId!: number;

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
    private route: ActivatedRoute,
    private issuesService: IssuesService
  ) {}

  ngOnInit() {
    this.issueForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
      language: ['', Validators.required]
    });

    this.route.params.subscribe(params => {
      this.issueId = +params['id'];
      if (this.issueId) {
        this.loadIssue(this.issueId);
      }
    });
  }

  loadIssue(id: number) {
    this.loading = true;
    this.error = null;

    this.issuesService.getIssueById(id).subscribe({
      next: (issue) => {
        this.issue = issue;
        this.issueForm.patchValue({
          content: issue.content,
          language: issue.language
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load issue. Please try again.';
        this.loading = false;
        console.error('Error loading issue:', err);
      }
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

    this.issuesService.updateIssue(this.issueId, this.issueForm.value).subscribe({
      next: () => {
        this.router.navigate(['/issues', this.issueId]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Failed to update issue. Please try again.';
        console.error('Error updating issue:', err);
      }
    });
  }
}
