import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  loggedIn = new BehaviorSubject<boolean>(this.isLoggedIn());

  constructor(private auth: Auth) {
    // Update login state after initialization
    this.loggedIn.next(this.isLoggedIn());
  }

  // Check if the token is valid
  isLoggedIn(): boolean {
    const token = localStorage.getItem('idToken');
    return !!token; // Check if the token exists
  }

  async getCurrentUser(): Promise<any> {
    try {
      const user = this.auth.currentUser;
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
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
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      sessionStorage.removeItem('idToken');
      this.loggedIn.next(false); // Notify subscribers
    }
  }
}