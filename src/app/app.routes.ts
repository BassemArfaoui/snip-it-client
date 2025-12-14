import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './auth.guard';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: 'dashboard', component: HomeComponent, canActivate: [AuthGuard] },
	{ path: '**', redirectTo: 'login' }
];
