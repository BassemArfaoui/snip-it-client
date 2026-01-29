import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AuthGuard } from './auth.guard';
import { GitHubCallbackComponent } from './github-callback/github-callback.component';
import { IssuesListComponent } from './issues/issues-list/issues-list.component';
import { IssueDetailsComponent } from './issues/issue-details/issue-details.component';
import { CreateIssueComponent } from './issues/create-issue/create-issue.component';
import { EditIssueComponent } from './issues/edit-issue/edit-issue.component';
import { CreatePostComponent } from './posts/create-post/create-post.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'login' },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: 'auth-success', component: GitHubCallbackComponent },
	{ path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
	{ path: 'posts/new', component: CreatePostComponent, canActivate: [AuthGuard] },
	{ path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
	{ path: 'issues/new', component: CreateIssueComponent, canActivate: [AuthGuard] },
	{ path: 'issues/:id/edit', component: EditIssueComponent, canActivate: [AuthGuard] },
	{ path: 'issues/:id', component: IssueDetailsComponent },
	{ path: 'issues', component: IssuesListComponent },
	{ path: '**', redirectTo: 'login' }
];
