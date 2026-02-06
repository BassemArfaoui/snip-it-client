import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { BaseAuthComponent } from '../shared/base-auth.component';
import { CountdownService } from '../shared/countdown.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent extends BaseAuthComponent implements OnInit, OnDestroy {
  emailForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    router: Router,
    countdownService: CountdownService
  ) {
    super(router, countdownService);
  }

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get email() {
    return this.emailForm.get('email');
  }

  onSubmit(): void {
    if (!this.emailForm.valid || this.loading) return;

    this.loading = true;
    this.error = null;

    const { email } = this.emailForm.value;

    this.authService.forgotPassword({ email }).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.startCountdown(3, '/login');
      },
      error: (_err: unknown) => {
        this.loading = false;
        this.success = true;
        this.startCountdown(3, '/login');
      }
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}
