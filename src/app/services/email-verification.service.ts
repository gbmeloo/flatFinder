import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class EmailVerificationService {
  constructor(private auth: AuthService) {}

  async isEmailVerified(): Promise<boolean> {
    try {
      const user = await this.auth.getCurrentUser();
      return user?.emailVerified || false;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }
}