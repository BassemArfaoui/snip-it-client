import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, UserDto } from './admin.service';
import { AuthService } from '../auth.service';
import { ChangeDetectorRef } from '@angular/core';

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
        <table *ngIf="!loading && users && users.length > 0" class="w-full text-left">
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
        <div *ngIf="!loading && (!users || users.length === 0)" class="text-text-muted">No users found.</div>
      </section>

      <!-- Content moderation removed: moderation is done per-item in lists -->
    </main>
  `
})
export class AdminComponent implements OnInit {
  users: UserDto[] = [];
  loading = false;
  username: string | null = null;
  role: string | null = null;

  // content moderation removed — controls are available per-item in lists

  constructor(private admin: AdminService, private auth: AuthService, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.username = this.auth.getUsername();
    this.role = this.auth.getUserRole();
    // Prefer client-side role check, but server is authoritative — attempt load if token exists
    const token = this.auth.getAccessToken();
    const isClientAdmin = !!(this.role && this.role.toString().toLowerCase() === 'admin');
    if (!token) {
      this.users = [];
      this.loading = false;
      return;
    }
    // Attempt to load users; server will return 403 if not allowed
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    console.log('Admin: requesting users...');
    this.admin.listUsers().subscribe({
      next: (u) => {
        console.log('Admin: users response', u);
        // Support wrapped responses (e.g., { data: [...] }) and plain arrays
        if (Array.isArray(u)) {
          this.users = u as UserDto[];
        } else if ((u as any)?.data && Array.isArray((u as any).data)) {
          this.users = (u as any).data as UserDto[];
        } else {
          // Fallback: try common fields
          this.users = (u as any).items || (u as any).users || [];
        }
        this.loading = false;
        // ensure UI updates
        try { this.cd.detectChanges(); } catch (e) { /* ignore */ }
      },
      error: (err) => {
        console.error('Admin: users error', err);
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

  // moderation helpers removed
}
