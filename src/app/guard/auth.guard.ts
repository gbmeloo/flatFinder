import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = sessionStorage.getItem('idToken');
    if (token) {
      // Allow access if the token exists
      return true;
    }
    // Redirect to the login page if no token is found
    this.router.navigate(['/login']);
    return false;
  }
}