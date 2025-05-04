import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  User,
  sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());
  private currentUserPromise: Promise<User | null> | null = null;

  constructor(private auth: Auth, private router: Router) { }

  // Check if the token is valid
  isLoggedIn(): boolean {
    const token = localStorage.getItem('idToken');
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const exp = decoded.exp;
      if (exp * 1000 <= Date.now()) {
        localStorage.removeItem('idToken');
        this.router.navigate(['/login']);
        return false;
      } else {
        return true;
      }
    } catch {
      return false;
    }
  }

  getCurrentUser(): Promise<User | null> {
    if (!this.currentUserPromise) {
      this.currentUserPromise = this.loadUserFromStorage();
    }
    return this.currentUserPromise;
  }
  
  private async loadUserFromStorage(): Promise<User | null> {
    const token = localStorage.getItem('idToken');
    if (!token) return null;
  
    // Example: call backend or decode JWT
    try {
      const decoded: any =  jwtDecode(token);
      return decoded;
    } catch (e){
      console.error('Error decoding token:', e);
      return null;
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('idToken', idToken);
      this.loggedIn.next(true);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Log out the user and notify subscribers
  async logout(): Promise<void> {
    try {
      await this.auth.signOut();
      localStorage.removeItem('idToken');
      this.loggedIn.next(false); // Notify subscribers
      this.router.navigate(['/login']); // Redirect to login page
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    sendPasswordResetEmail(this.auth, email)
      .then(() => {
        console.log('Password reset email sent successfully');
      }) .catch((error) => {
        console.error('Error sending password reset email:', error);
      });
  }

}