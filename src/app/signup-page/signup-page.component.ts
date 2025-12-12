import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'snip-it-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent {
  profile = signal({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  acceptTerms = signal(false);

  get name(): string {
    return this.profile().name;
  }
  set name(value: string) {
    this.profile.update((current) => ({ ...current, name: value }));
  }

  get email(): string {
    return this.profile().email;
  }
  set email(value: string) {
    this.profile.update((current) => ({ ...current, email: value }));
  }

  get password(): string {
    return this.profile().password;
  }
  set password(value: string) {
    this.profile.update((current) => ({ ...current, password: value }));
  }

  get confirm(): string {
    return this.profile().confirm;
  }
  set confirm(value: string) {
    this.profile.update((current) => ({ ...current, confirm: value }));
  }

  get termsAccepted(): boolean {
    return this.acceptTerms();
  }
  set termsAccepted(value: boolean) {
    this.acceptTerms.set(value);
  }

  onSubmit(): void {
    // Replace this with real signup logic when ready
    console.log('Registering', this.profile(), 'terms accepted', this.acceptTerms());
  }
}
