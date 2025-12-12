import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'snip-it-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  credentials = signal({
    email: '',
    password: ''
  });

  remember = signal(true);

  get email(): string {
    return this.credentials().email;
  }
  set email(value: string) {
    this.credentials.update(c => ({ ...c, email: value }));
  }

  get password(): string {
    return this.credentials().password;
  }
  set password(value: string) {
    this.credentials.update(c => ({ ...c, password: value }));
  }

  onSubmit(): void {
    const creds = this.credentials();
    // Replace this with real login logic when ready
    console.log('Logging in with', creds, 'remember', this.remember);
  }
}
