import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  User,
  sendPasswordResetEmail,
  onAuthStateChanged
 } 
 from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  loggedIn = new BehaviorSubject<boolean>(false);

  constructor(private auth: Auth, private router: Router) { 
    this.listenToAuthStateChangesr();
  }

  // Check if the token is valid
  // Listen for authentication state changes
  private listenToAuthStateChangesr(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // User is signed in
        this.loggedIn.next(true);
      } else {
        // User is signed out
        this.loggedIn.next(false);
        console.log('User signed out');
        this.router.navigate(['/login']); // Redirect to login page
      }
    });
  }

  getCurrentUser(): Promise<User | null> {
    return new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        this.auth,
        (user) => {
          unsubscribe();
          resolve(user ? (user as User) : null);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      )
    })
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