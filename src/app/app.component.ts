import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  // convenience for template-driven demo/testing
  logout = logout;
}
