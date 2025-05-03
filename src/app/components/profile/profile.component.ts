import { Component } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators, 
  ValidatorFn, 
  AbstractControlOptions, 
  AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Auth, updatePassword } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  profileForm: FormGroup;
  max_date: string = "";
  passwordVisible: boolean = false;
  confirmPasswordVisible: boolean = false;
  userId: string | null = null;
  isPasswordChanged: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private auth: Auth, private firestore: Firestore) {
    const _date = new Date();
    _date.setDate(_date.getDate() - 1);
    this.max_date = _date.toISOString().split('T')[0];

    const formOptions: AbstractControlOptions = { validators: this.passwordMatchValidator };

    this.profileForm = this.fb.group(
      {
        firstName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        lastName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        birth_date: [ '',  Validators.required ],
        email: [ '',  [ Validators.required, Validators.email ] ],
        password: [ '', [ 
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/) 
        ] ],
        confirmPassword: ['', [Validators.required]],
      },
      formOptions
    );

      // Track changes for password and confirmPassword fields
      this.profileForm.get('password')?.valueChanges.subscribe(() => {
        if (!this.isPasswordChanged) {
          this.isPasswordChanged = true;
        }
      });
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

    this.profileForm.get('password')?.valueChanges
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      if (!this.isPasswordChanged) {
        this.isPasswordChanged = true;
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
          email: userData['email'] || '',
        });
      } else {
        console.error('User document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.profileForm.get(controlName);

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
      return 'Must contain at least one uppercase letter, one number, and one special character';
    }
    if ((controlName === 'password' || controlName === 'newPassword') && this.profileForm.hasError('passwordrequired')) {
      return 'Please enter original password';
    }
    if (controlName === 'newPassword' && this.profileForm.hasError('samepassword')) {
      return 'New password must be different from the original password';
    }
    if (controlName === 'confirmNewPassword' && this.profileForm.hasError('mismatch')) {
      return 'New passwords do not match';
    }
    if (control?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one number, and one special character';
    }
    if (controlName === 'confirmPassword' && this.profileForm.hasError('mismatch')) {
      return 'Passwords do not match';
    }

    return '';
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      try {
        if(this.userId) {
          const { firstName, lastName, email, birth_date, password } = this.profileForm.value;
          const updateData = {
            firstName,
            lastName,
            email,
            birth_date,
            updatedAt: new Date().toISOString()
          };
          const userRef = doc(this.firestore, 'users', this.userId);
          await updateDoc(userRef, updateData);

          // Update password only if it was modified
          if (this.isPasswordChanged && password) {
            if (this.auth.currentUser) {
              await updatePassword(this.auth.currentUser, password);
              console.log('Password updated successfully');
            } else {
              console.error('No authenticated user found. Cannot update password.');
            }
          }
        }
      } catch (error) {
        console.error('Error registering user:', error);
      }
    } else {
      console.error('form is invalid');
    }
    
  }
}