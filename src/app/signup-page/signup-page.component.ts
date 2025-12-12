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

  onSubmit(): void {
    // Replace this with real signup logic when ready
    console.log('Registering', this.profile(), 'terms accepted', this.acceptTerms());
  }
}
