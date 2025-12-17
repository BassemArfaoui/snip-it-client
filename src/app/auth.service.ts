import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  fullName: string;
  imageProfile?: string;
  role?: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  message: string;
  tokens?: TokenResponse;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Adjust to your backend URL

  private accessTokenSubject = new BehaviorSubject<string | null>(this.getAccessToken());
  public accessToken$ = this.accessTokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeTokens();
  }

  /**
   * Decode JWT token payload (without signature verification)
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract username from access token
   */
  getUsername(): string | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;
    
    const decoded = this.decodeToken(accessToken);
    return decoded?.username || null;
  }

  /**
   * Extract numeric user id from access token
   */
  getUserId(): number | null {
    const accessToken = this.getAccessToken();
    if (!accessToken) return null;

    const decoded = this.decodeToken(accessToken);
    const id = decoded?.sub ?? decoded?.id ?? decoded?.userId;
    return typeof id === 'number' ? id : null;
  }

  /**
   * Initialize tokens from localStorage on service creation
   */
  private initializeTokens(): void {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken) {
      this.accessTokenSubject.next(accessToken);
    }
  }

  /**
   * Register a new user account
   */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request);
  }

  /**
   * Verify email with OTP code
   */
  verifyEmail(request: VerifyEmailRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-email`, request).pipe(
      tap((response) => {
        if (response.tokens) {
          this.setTokens(response.tokens);
        }
      })
    );
  }

  /**
   * Resend OTP code to email
   */
  resendOtp(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/resend-otp`, { email });
  }

  /**
   * Login with email/username and password (requires verified email)
   */
  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${this.apiUrl}/login`, request).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
      })
    );
  }

  /**
   * Refresh access and refresh tokens
   */
  refresh(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
      })
    );
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store tokens in localStorage and update the subject
   */
  private setTokens(tokens: TokenResponse): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.accessTokenSubject.next(tokens.accessToken);
  }

  /**
   * Clear tokens from localStorage (logout)
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessTokenSubject.next(null);
  }

  /**
   * Check if user is authenticated (has access token)
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Request password reset OTP
   */
  forgotPassword(request: ForgotPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, request);
  }

  /**
   * Reset password using link token (invalidates all refresh tokens)
   */
  resetPassword(request: ResetPasswordRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/reset-password`, request);
  }
}
