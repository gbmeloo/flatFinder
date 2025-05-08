import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class EmailVerifiedGuard implements CanActivate {
  constructor(private auth: AuthService, private notification: NotificationService) {}


  async canActivate(): Promise<boolean> {
    const user = await this.auth.getCurrentUser();
    if (user) {
      if (!user.emailVerified) {
        this.notification.showNotification(
          'Logging out due to lack of email verification. Please verify your email address.',
          'Dismiss',
          5000,
          ['error']
        );
        setTimeout(() => {
          this.auth.logout();
        }, 1000);
        return false; // Block navigation
      }
    }
    return true; // Allow navigation
  }

}