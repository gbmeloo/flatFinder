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
    try {
      const user = await this.auth.getCurrentUser();
      if (user) {
        console.log(user.emailVerified);
        if (!user.emailVerified) {
          this.notification.showNotification('Logging out due to lack of email verification. Please verify your email address.', 'Dismiss', 5000, ['error']);
          setTimeout(() => {
            this.auth.logout();
          }, 1000);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  }

}