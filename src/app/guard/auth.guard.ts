import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  async canActivate(): Promise<boolean> {
    const localToken = this.authService.isLoggedIn()
    if (localToken) {
      this.authService.getCurrentUser()
      .then((user) => {
        if (user) {
          const googleToken = user.accessToken;
          return googleToken === localToken ? true : false;
        } else {
          console.log('User not found. Redirecting to login page.');
          this.router.navigate(['/login']);
          Promise.resolve(false);
          return false;
        }
      })
      .catch((error) => {
        console.error('Error fetching current user:', error);
        this.router.navigate(['/login']);
        Promise.resolve(false);
        return false;
      });
      return true;
    } else {
      console.log('User is not logged in. Redirecting to login page.');
      Promise.resolve(false);
      this.router.navigate(['/login']);
    }
    return false;
  }
    
}