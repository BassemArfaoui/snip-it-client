import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDto } from './admin.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'snip-it-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold">Admin Console</h2>
        <div *ngIf="username" class="text-sm text-text-muted">Signed in as {{ username }} ({{ role }})</div>
      </div>

      <section class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6">
        <h3 class="text-lg font-semibold mb-3">Users</h3>
        <div *ngIf="loading" class="text-text-muted">Loading users...</div>
        <table *ngIf="!loading" class="w-full text-left">
          <thead>
            <tr class="text-sm text-text-muted border-b">
              <th class="py-2">ID</th>
              <th class="py-2">Username</th>
              <th class="py-2">Email</th>
              <th class="py-2">Role</th>
              <th class="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let u of users" class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="py-2">{{ u.id }}</td>
              <td class="py-2">{{ u.username }}</td>
              <td class="py-2">{{ u.email }}</td>
              <td class="py-2">{{ u.role }}</td>
              <td class="py-2 space-x-2">
                <button class="btn-primary" (click)="promote(u)">Promote</button>
                <button class="btn-secondary" (click)="demote(u)">Demote</button>
                <button class="btn-danger" (click)="ban(u)">Ban</button>
                <button class="btn-ghost" (click)="unban(u)">Unban</button>
                <button class="btn-ghost" (click)="deleteUser(u)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 class="text-lg font-semibold mb-3">Content moderation</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">Post ID</label>
            <input [(ngModel)]="postId" class="input" placeholder="Post ID" />
            <div class="mt-2">
              <button class="btn-primary mr-2" (click)="deletePost()">Delete Post</button>
              <button class="btn-secondary" (click)="restorePost()">Restore Post</button>
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1">Comment ID</label>
            <input [(ngModel)]="commentId" class="input" placeholder="Comment ID" />
            <div class="mt-2">
              <button class="btn-primary mr-2" (click)="deleteComment()">Delete Comment</button>
              <button class="btn-secondary" (click)="restoreComment()">Restore Comment</button>
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1">Solution ID</label>
            <input [(ngModel)]="solutionId" class="input" placeholder="Solution ID" />
            <div class="mt-2">
              <button class="btn-primary" (click)="deleteSolution()">Delete Solution</button>
            </div>
          </div>

          <div>
            <label class="block text-sm mb-1">Issue ID</label>
            <input [(ngModel)]="issueId" class="input" placeholder="Issue ID" />
            <div class="mt-2">
              <button class="btn-primary mr-2" (click)="deleteIssue()">Delete Issue</button>
              <button class="btn-secondary" (click)="restoreIssue()">Restore Issue</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class AdminComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  username: string | null = null;
  role: string | null = null;

  postId: number | null = null;
  commentId: number | null = null;
  solutionId: number | null = null;
  issueId: number | null = null;

  constructor(private admin: AdminService, private auth: AuthService) {}

  ngOnInit(): void {
    this.username = this.auth.getUsername();
    this.role = this.auth.getUserRole();
    // if not admin, redirect away (defensive)
    if (!this.role || this.role.toLowerCase() !== 'admin') {
      // don't throw — admin guard should prevent this, but handle gracefully
      this.users = [];
      this.loading = false;
      return;
    }
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.admin.listUsers().subscribe({
      next: (u) => { this.users = u; this.loading = false; },
      error: (err) => {
        // If backend responds 403, clear and stop
        if (err?.status === 403) {
          this.users = [];
        }
        this.loading = false;
      }
    });
  }

  promote(u: UserDto) { this.admin.promote(u.id).subscribe(() => this.loadUsers()); }
  demote(u: UserDto) { this.admin.demote(u.id).subscribe(() => this.loadUsers()); }
  ban(u: UserDto) { this.admin.banUser(u.id).subscribe(() => this.loadUsers()); }
  unban(u: UserDto) { this.admin.unbanUser(u.id).subscribe(() => this.loadUsers()); }
  deleteUser(u: UserDto) { this.admin.deleteUser(u.id).subscribe(() => this.loadUsers()); }

  deletePost() { if (this.postId) this.admin.deletePost(this.postId).subscribe(() => this.postId = null); }
  restorePost(){ if (this.postId) this.admin.restorePost(this.postId).subscribe(() => this.postId = null); }

  deleteComment(){ if (this.commentId) this.admin.deleteComment(this.commentId).subscribe(() => this.commentId = null); }
  restoreComment(){ if (this.commentId) this.admin.restoreComment(this.commentId).subscribe(() => this.commentId = null); }

  deleteSolution(){ if (this.solutionId) this.admin.deleteSolution(this.solutionId).subscribe(() => this.solutionId = null); }

  deleteIssue(){ if (this.issueId) this.admin.deleteIssue(this.issueId).subscribe(() => this.issueId = null); }
  restoreIssue(){ if (this.issueId) this.admin.restoreIssue(this.issueId).subscribe(() => this.issueId = null); }
}
