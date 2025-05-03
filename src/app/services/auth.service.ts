import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(this.isTokenValid());

  // Observable to track login state
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(private auth: Auth) {}

  // Check if the token is valid
  isTokenValid(): boolean {
    const token = sessionStorage.getItem('idToken');
    if (!token) return false;

    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedToken.exp > currentTime;
    } catch (error) {
      console.error('Invalid token:', error);
      this.logout();
      return false;
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password)
        .then(async (userCredential) => {
          
          const idToken = await userCredential.user.getIdToken();
          const decodedToken = jwtDecode(idToken);
          console.log('ID Token:', idToken);
          console.log('Decoded Token:', decodedToken);
          sessionStorage.setItem('idToken', idToken);
          
          this.loggedIn.next(true);
          return Promise.resolve();
        });
    } catch (error) {
      return Promise.reject('Login failed');
    }
  }

  // Log out the user and notify subscribers
  logout(): void {
    
    sessionStorage.removeItem('idToken');
    this.loggedIn.next(false); // Notify subscribers
  }
}