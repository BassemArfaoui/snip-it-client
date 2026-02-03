import { Routes } from '@angular/router';
import { LoginPageComponent } from './login-page/login-page.component';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { AuthGuard } from './auth.guard';
import { AdminComponent } from './admin/admin.component';
import { AdminGuard } from './admin/admin.guard';
import { GitHubCallbackComponent } from './github-callback/github-callback.component';
import { IssuesListComponent } from './issues/issues-list/issues-list.component';
import { IssueDetailsComponent } from './issues/issue-details/issue-details.component';
import { CreateIssueComponent } from './issues/create-issue/create-issue.component';
import { EditIssueComponent } from './issues/edit-issue/edit-issue.component';
import { CreatePostComponent } from './posts/create-post/create-post.component';
import { PostDetailsComponent } from './posts/post-details/post-details.component';
import { CollectionsListComponent } from './collections/collections-list/collections-list.component';
import { CollectionDetailComponent } from './collections/collection-detail/collection-detail.component';
import { SnippetsListComponent } from './private-snippets/snippets-list/snippets-list.component';
import { SnippetDetailComponent } from './private-snippets/snippet-detail/snippet-detail.component';

export const routes: Routes = [
	{ path: '', component: DashboardComponent, canActivate: [AuthGuard] },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'signup', component: SignupPageComponent },
	{ path: 'verify-email', component: VerifyEmailComponent },
	{ path: 'forgot-password', component: ForgotPasswordComponent },
	{ path: 'reset-password', component: ResetPasswordComponent },
	{ path: 'auth-success', component: GitHubCallbackComponent },
	{ path: 'dashboard', pathMatch: 'full', redirectTo: '' },
	{ path: 'posts/new', component: CreatePostComponent, canActivate: [AuthGuard] },
	{ path: 'posts/:id', component: PostDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'admin', component: AdminComponent, canActivate: [AuthGuard, AdminGuard] },
	{ path: 'profile/:id', component: ProfileComponent, canActivate: [AuthGuard] },
	{ path: 'issues/new', component: CreateIssueComponent, canActivate: [AuthGuard] },
	{ path: 'issues/:id/edit', component: EditIssueComponent, canActivate: [AuthGuard] },
	{ path: 'issues/:id', component: IssueDetailsComponent },
	{ path: 'issues', component: IssuesListComponent },

	
	// Collections Routes
	{ path: 'collections', component: CollectionsListComponent, canActivate: [AuthGuard] },
	{ path: 'collections/share/:token', component: CollectionDetailComponent },
	{ path: 'collections/:id', component: CollectionDetailComponent, canActivate: [AuthGuard] },
	
	// Private Snippets Routes
	{ path: 'snippets', component: SnippetsListComponent, canActivate: [AuthGuard] },
	{ path: 'snippets/:id', component: SnippetDetailComponent, canActivate: [AuthGuard] },
	{ path: '**', redirectTo: '' }
];
