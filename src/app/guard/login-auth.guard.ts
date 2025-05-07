import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class LoginAuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth: AuthService
  ) {}

  canActivate(): Promise<boolean> {
    return this.auth.getCurrentUser().then(user => {
      if (user) {
        this.router.navigate(['/']); // Redirect if user is logged in
        return false;
      } else {
        return true;
      }
    });
  }
}