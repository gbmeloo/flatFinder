import { Component } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControlOptions, ValidatorFn, AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, sendEmailVerification, updateEmail, updatePassword } from 'firebase/auth';

@Component({
  selector: 'app-profile',
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
  newPasswordVisible: boolean = false;
  newPasswordVisibleConfirm: boolean = false;

  constructor(private fb: FormBuilder, private auth: Auth, private firestore: Firestore) {
    const _date = new Date();
    _date.setDate(_date.getDate() - 1);
    this.max_date = _date.toISOString().split('T')[0]; 

    const formOptions: AbstractControlOptions = { validators: [this.passwordSameCheckValidator, this.passwordRequiredValidator, this.passwordMatchValidator] };
    this.profileForm = this.fb.group(
      {
        firstName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        lastName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        birth_date: [ '',  Validators.required ],
        email: [ '',  [ Validators.required, Validators.email ] ],
        password: [ '' ],
        newPassword: [
          '',
          [
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/),
          ],
        ],
        confirmNewPassword: [ '' ],
      },
      formOptions
    );
    this.getUsers();
  }
  
  passwordRequiredValidator: ValidatorFn = (control: AbstractControl) => {
    const password = control.get('password')?.value;
    const newPassword = control.get('newPassword')?.value;
    if (newPassword != "" && password == "") {
      return { passwordrequired: true };
    }
    return null;
  };

  passwordSameCheckValidator: ValidatorFn = (control: AbstractControl) => {
    const password = control.get('password')?.value;
    const newPassword = control.get('newPassword')?.value;
    if(password != "" && newPassword != "" && password == newPassword) {
      return { samepassword: true };
    }  
    return null;
  };

  passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const group = control as FormGroup;
    const newPassword = group.get('newPassword')?.value;
    const confirmNewPassword = group.get('confirmNewPassword')?.value;
    return newPassword === confirmNewPassword ? null : { mismatch: true };
  };

  async getUsers() {
    const idToken = sessionStorage.getItem('idToken');
    if(idToken) {
      const decodedToken: any = jwtDecode(idToken);
      const uuid: string = decodedToken.user_id;
      if(uuid) {
        const users = await getDoc(doc(this.firestore, 'users', uuid));
        if (users.exists()) {
          const userData = users.data();
          this.profileForm.patchValue({
            firstName: userData["firstName"] || '',
            lastName: userData["lastName"] || '',
            birth_date: userData["birth_date"] || '',
            email: userData["email"] || ''
          });
        }
      }    
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

    return '';
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
  
  toggleNewPasswordVisibility(): void {
    this.newPasswordVisible = !this.newPasswordVisible;
  }
  
  toggleConfirmNewPasswordVisibility(): void {
    this.newPasswordVisibleConfirm = !this.newPasswordVisibleConfirm;
  }

  async onSubmit() {
      if (this.profileForm.valid) {
        try {
          const idToken = sessionStorage.getItem('idToken');
          if(idToken) {
            const decodedToken: any = jwtDecode(idToken);
            const uuid: string = decodedToken.user_id;
            if(uuid) {
              const { firstName, lastName, email, birth_date, password, newPassword } = this.profileForm.value;
              const updateData = {
                firstName,
                lastName,
                email,
                birth_date,
                updatedAt: new Date().toISOString()
              };

              const userRef = doc(this.firestore, 'users', uuid);
              await updateDoc(userRef, updateData);

              const user = this.auth.currentUser;
              if (user && password && newPassword) {
                try {
                  const credential = EmailAuthProvider.credential(user.email!, password);
                  await reauthenticateWithCredential(user, credential);

                  if (newPassword && password != newPassword) {
                    await updatePassword(user, newPassword);
                  }
                }
                catch (error: any) {
                  console.error("Update Password failed:", error.message);
                  
                  // Handle specific Firebase Authentication error codes
                  switch (error.code) {
                    case "auth/user-not-found":
                      alert("No user found with this email. Please sign up.");
                      break;
                    case "auth/wrong-password":
                      alert("Incorrect password. Please try again.");
                      break;
                    case "auth/invalid-email":
                      alert("Invalid email format.");
                      break;
                    case "auth/user-disabled":
                      alert("This account has been disabled.");
                      break;
                    case "auth/invalid-credential":
                      alert("Incorrect password. Please try again.");
                      break;
                    case "auth/missing-password":
                      alert("Please enter the password.");
                      break;
                    default:
                      alert("Login failed: " + error.message);
                  }
                }
              }
              window.location.reload();
            }
          }
        } catch (error) {
          console.error('Error registering user:', error);
        }
      }
    }
}
