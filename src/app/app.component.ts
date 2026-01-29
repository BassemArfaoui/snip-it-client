import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { isLoggedIn, logout, username, userId, setAuthService, getUsername, getUserId } from './auth.store';
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
  userId = userId;

  isAuthRoute = false;
  profileMenuOpen = false;
  
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.isAuthRoute =
      this.router.url.startsWith('/login') ||
      this.router.url.startsWith('/signup') ||
      this.router.url.startsWith('/forgot-password');
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAuthRoute =
          event.urlAfterRedirects.startsWith('/login') ||
          event.urlAfterRedirects.startsWith('/signup') ||
          event.urlAfterRedirects.startsWith('/forgot-password');
      });

    // Provide AuthService to auth store
    setAuthService(this.authService);
    
    // Initialize username from token if logged in
    if (this.isLoggedIn()) {
      const user = getUsername();
      this.username.set(user);
      const id = getUserId();
      this.userId.set(id);
    }
  }

  // convenience wrapper used by the template — clears auth and navigates
  handleLogout() {
    logout();
    // ensure we return to the login page after clearing tokens/state
    this.router.navigate(['/login']);
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
}
