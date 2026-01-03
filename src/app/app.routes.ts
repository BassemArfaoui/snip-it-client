import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AuthGuard } from './auth.guard';
import { AdminComponent } from './admin/admin.component';
import { AdminGuard } from './admin/admin.guard';
import { GitHubCallbackComponent } from './github-callback/github-callback.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: 'auth-success', component: GitHubCallbackComponent },
	{ path: 'dashboard', component: HomeComponent, canActivate: [AuthGuard] },
	{ path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
	{ path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
	{ path: '**', redirectTo: 'login' }
];
