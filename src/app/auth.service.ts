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

export interface ApiResponse<T> {
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; 

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
    // Accept both string and number IDs
    if (typeof id === 'number') return id;
    if (typeof id === 'string') return parseInt(id, 10) || null;
    return null;
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
  verifyEmail(request: VerifyEmailRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/verify-email`, request).pipe(
      tap((response) => {
        // Extract tokens from wrapped response
        const responseData = response.data || response as any;
        if (responseData.tokens) {
          this.setTokens(responseData.tokens);
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
  login(request: LoginRequest): Observable<ApiResponse<TokenResponse>> {
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/login`, request).pipe(
      tap((response) => {
        // Extract tokens from wrapped response (backend wraps in {data: tokens, message: 'success'})
        const tokens = response.data || response as any;
        this.setTokens(tokens);
      })
    );
  }

  /**
   * Refresh access and refresh tokens
   */
  refresh(): Observable<ApiResponse<TokenResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return this.http.post<ApiResponse<TokenResponse>>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        // Extract tokens from wrapped response
        const tokens = response.data || response as any;
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
    console.log('Storing tokens:', tokens);
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
    localStorage.removeItem('redirectUrl');
    this.accessTokenSubject.next(null);
  }

  /**
   * Clear expired session data
   */
  clearExpiredSession(): void {
    this.logout();
  }

  /**
   * Check if user is authenticated (has valid, non-expired access token)
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    // Check if token is expired (with 5 minute buffer)
    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return false;

    const expiryTime = decoded.exp * 1000; // Convert to ms
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    return now < (expiryTime - bufferMs);
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
