import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initializeAuthState } from './app/auth.store';

// Initialize auth state from localStorage before the app starts
initializeAuthState();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
