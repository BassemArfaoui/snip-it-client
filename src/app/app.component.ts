import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { isLoggedIn, logout, username, setAuthService, getUsername } from './auth.store';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'client';
  // expose the signals to the template
  isLoggedIn = isLoggedIn;
  username = username;
  
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    // Provide AuthService to auth store
    setAuthService(this.authService);
    
    // Initialize username from token if logged in
    if (this.isLoggedIn()) {
      const user = getUsername();
      this.username.set(user);
    }
  }

  // convenience wrapper used by the template — clears auth and navigates
  handleLogout() {
    logout();
    // ensure we return to the login page after clearing tokens/state
    this.router.navigate(['/login']);
  }
}
