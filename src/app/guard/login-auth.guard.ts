import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoginAuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('idToken');
    if (token) {
      // If the user is logged in, redirect to the flats page
      this.router.navigate(['/flats']);
      return false;
    }
    // Allow access to the login page if no token is found
    return true;
  }
}