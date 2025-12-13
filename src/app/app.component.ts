import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { isLoggedIn, logout } from './auth.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'client';
  // expose the signal to the template so it can be read as `isLoggedIn()`
  isLoggedIn = isLoggedIn;
  constructor(private router: Router) {}

  // convenience wrapper used by the template — clears auth and navigates
  handleLogout() {
    logout();
    // ensure we return to the login page after clearing tokens/state
    this.router.navigate(['/login']);
  }
}
