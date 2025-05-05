import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControlOptions, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../services/notification.service';
import { sendEmailVerification } from 'firebase/auth';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  passwordVisible: boolean = false; // Track password visibility
  passwordVisibleConfirm: boolean = false; // Track confirm password visibility
  isMobile: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private auth: Auth, 
    private firestore: Firestore,
    private notificationService: NotificationService) {
    const formOptions: AbstractControlOptions = { validators: this.passwordMatchValidator };

    this.registerForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        birth_date: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      formOptions
    );

    this.checkScreenWidth();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint as needed
  }

  passwordMatchValidator: ValidatorFn = (control: AbstractControl) => {
    const group = control as FormGroup;
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  };

  getErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Password must be at least ${requiredLength} characters long`;
    }
    if (control?.hasError('pattern')) {
      return 'Password must contain at least one uppercase letter, one number, and one special character';
    }
    if (controlName === 'confirmPassword' && this.registerForm.hasError('mismatch')) {
      return 'Passwords do not match';
    }

    return '';
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.passwordVisibleConfirm = !this.passwordVisibleConfirm;
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const { email, password, firstName, lastName, birth_date } = this.registerForm.value;
      try {
        await createUserWithEmailAndPassword(this.auth, email, password).then(async (userCredential) => {
          // Registration successful
          await sendEmailVerification(userCredential.user).then(() => {
            this.notificationService.showNotification(
              'Verification email sent. Please check your inbox.',
              'Close',
              5000,
              ['success-snackbar'], // Custom class for success
              this.isMobile ? 'bottom' : 'top', // Adjust position based on screen size
              this.isMobile ? 'center' : 'right' // Adjust position based on screen size
            );
          });
          const uuid = userCredential.user.uid;
          const userDoc = {
            firstName,
            lastName,
            birth_date,
            email,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(this.firestore, 'users', uuid), userDoc);
        });
        // Redirect user to login if registration is successful
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error registering user:', error);
      }

    }
  }
}
