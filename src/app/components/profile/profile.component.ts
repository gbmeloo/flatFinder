import { Component } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators, 
  ValidatorFn,
  AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Auth, updatePassword, updateEmail, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EmailVerificationService } from '../../services/email-verification.service';
import { NotificationService } from '../../services/notification.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule
  ],
  animations: [
    trigger('formResize', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        padding: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '*'
      })),
      transition('collapsed <=> expanded', [
        style({ overflow: 'hidden' }),
        animate('300ms ease')
      ])
    ])
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  email: string = '';
  max_date: string = "";
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  userId: string | null = null;
  showPasswordFields: boolean = false;
  showEmailFields: boolean = false;
  updateError: string | null = null;
  updateSuccess: string | null = null;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private auth: Auth, 
    private firestore: Firestore,
    private emailVerificationService: EmailVerificationService,
    private notificationService: NotificationService) {
    const _date = new Date();
    _date.setDate(_date.getDate() - 1);
    this.max_date = _date.toISOString().split('T')[0];

    this.profileForm = this.fb.group(
      {
        firstName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        lastName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        birth_date: [ '',  Validators.required ]
      }
    );

    this.passwordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    const token = localStorage.getItem('idToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userId = decodedToken.user_id;
  
        if (this.userId) {
          this.getUserInfo();
        } else {
          console.error('User ID is null or undefined.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.error('No token found in sessionStorage.');
    }
  }


  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible = !this.confirmPasswordVisible;
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  };

  
  async getUserInfo() {
    if (!this.userId) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }
  
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', this.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.profileForm.patchValue({
          firstName: userData['firstName'] || '',
          lastName: userData['lastName'] || '',
          birth_date: userData['birth_date'] || '',
        });
        this.email = userData['email'] || '';
      } else {
        console.error('User document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  getErrorMessage(controlName: string): string {
    let control = this.profileForm.get(controlName);

    // If not found in profileForm, try passwordForm
    if (!control) {
      control = this.passwordForm.get(controlName);
    }


    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Must be at least ${requiredLength} characters long`;
    }
    if (control?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one number, and one special character';
    }
    if ((controlName === 'password') && this.passwordForm.hasError('passwordrequired')) {
      return 'This field is required';
    }
    if (control?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one number, and one special character';
    }
    if (controlName === 'confirmPassword' && this.passwordForm.hasError('mismatch')) {
      return 'Passwords do not match';
    }

    return '';
  }

  async onSubmit() {
    this.updateError = null; // Clear any previous error message
    this.updateSuccess = null; // Clear any previous success message
    const isVerified = await this.emailVerificationService.isEmailVerified();
    if (!isVerified) {
      this.notificationService.showNotification(
        'Please verify your email before updating your profile.',
        'Close',
        5000,
        ['error-snackbar'], // Custom class for error
      );
      return;
    }
    this.loading = true;

    try {
      if (this.profileForm.valid && this.userId) {
        const { firstName, lastName, email, birth_date } = this.profileForm.value;
        const updateData = {
          firstName,
          lastName,
          email,
          birth_date,
          updatedAt: new Date().toISOString(),
        };
    
        try {
          await updateDoc(doc(this.firestore, 'users', this.userId), updateData);
          this.updateSuccess = 'Profile updated successfully';
          this.updateError = null; // Clear any previous error message
          console.log('Profile updated');
        } catch (error) {
          this.updateError = "Error updating profile. Please try again.";
          this.updateSuccess = null;
        }
      }
      if (this.passwordForm.valid && this.passwordForm.dirty) {
        const { password } = this.passwordForm.value;
        try {
          if (this.auth.currentUser && password) {
            await updatePassword(this.auth.currentUser, password);
            console.log('Password updated');
            this.passwordForm.reset(); // Clear password fields after update
          }
        } catch (error) {
          console.error('Error updating password:', error);
        }
      }
    } finally {
      this.loading = false;
      this.showPasswordFields = false; // Hide password fields after submission
      this.passwordForm.reset(); // Clear password fields after update
      setTimeout(() => {
        this.updateSuccess = null; // Clear success message after 3 seconds
        this.updateError = null; // Clear error message after 3 seconds
      }, 3000);
    }
  }
}