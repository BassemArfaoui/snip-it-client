import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AuthGuard } from './auth.guard';
import { GitHubCallbackComponent } from './github-callback/github-callback.component';
import { CollectionsListComponent } from './collections/collections-list/collections-list.component';
import { CollectionDetailComponent } from './collections/collection-detail/collection-detail.component';
import { SnippetsListComponent } from './private-snippets/snippets-list/snippets-list.component';
import { SnippetDetailComponent } from './private-snippets/snippet-detail/snippet-detail.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: 'auth-success', component: GitHubCallbackComponent },
	{ path: 'dashboard', component: HomeComponent, canActivate: [AuthGuard] },
	{ path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
	
	// Collections Routes
	{ path: 'collections', component: CollectionsListComponent, canActivate: [AuthGuard] },
	{ path: 'collections/share/:token', component: CollectionDetailComponent },
	{ path: 'collections/:id', component: CollectionDetailComponent, canActivate: [AuthGuard] },
	
	// Private Snippets Routes
	{ path: 'snippets', component: SnippetsListComponent, canActivate: [AuthGuard] },
	{ path: 'snippets/:id', component: SnippetDetailComponent, canActivate: [AuthGuard] },
	
	{ path: '**', redirectTo: 'login' }
];
