import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AuthGuard } from './auth.guard';
import { PageOneComponent } from './pages/page-one/page-one.component';
import { PageTwoComponent } from './pages/page-two/page-two.component';
import { PageThreeComponent } from './pages/page-three/page-three.component';
import { PageFourComponent } from './pages/page-four/page-four.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'page1' },

	{ path: 'page1', component: PageOneComponent, canActivate: [AuthGuard] },
	{ path: 'page2', component: PageTwoComponent, canActivate: [AuthGuard] },
	{ path: 'page3', component: PageThreeComponent, canActivate: [AuthGuard] },
	{ path: 'page4', component: PageFourComponent, canActivate: [AuthGuard] },

	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: '**', redirectTo: 'page1' }
];
