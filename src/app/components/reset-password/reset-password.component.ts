import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  imports: [
    MatIconModule, 
    ReactiveFormsModule, 
    CommonModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  loading: boolean = false;
  resetError: string | null = null;
  resetSuccess: string | null = null;

  resetPasswordForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ])
  });

  constructor(private auth: AuthService) {}

  get emailControl() {
    return this.resetPasswordForm.get('email')!;
  }

  getEmailErrorMessage() {
    if (this.emailControl.hasError('required')) {
      return 'You must enter a value';
    }
    return this.emailControl.hasError('email') ? 'Not a valid email' : '';
  }

  onSubmit() {
    this.loading = true;
    if (this.resetPasswordForm.valid) {
      const email = this.emailControl.value ?? '';
      this.auth.resetPassword(email)
        .then(() => {
          // Password reset email sent successfully
          this.resetSuccess = 'If this email is registered, a password reset link has been sent.';
          this.resetError = null; // Reset any previous error message
        }).catch((error) => {
          // Handle error
          console.error('Error sending password reset email:', error);
          this.resetError = 'Failed to send password reset email. Please try again.';
        }) .finally(() => {
          this.loading = false;
          setTimeout(() => {
            this.resetSuccess = null;
            this.resetError = null;
          }, 5000);
        });
    }
  }
}
