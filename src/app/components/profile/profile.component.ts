import { Component, HostListener } from '@angular/core';
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
import { updatePassword, updateProfile, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { EmailVerificationService } from '../../services/email-verification.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';



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
  user: User | null = null;
  showPasswordFields: boolean = false;
  showEmailFields: boolean = false;
  updateError: string | null = null;
  updateSuccess: string | null = null;
  loading: boolean = false;
  isMobile: boolean = false; // Track if the screen is mobile size

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
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
        Validators.pattern( 
          /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"`~\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"`~\\|,.<>\/?]{8,}$/
        )
      ]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint as needed
  }

  ngOnChanges() {
    
  }

  ngOnInit() {
    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.getUserInfo();
      } else {
        console.log('No user is logged in.');
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });
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
    if (!this.user?.uid) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }
  
    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', this.user?.uid));
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
    // Removed email verification check
    // const isVerified = await this.emailVerificationService.isEmailVerified();
    // if (!isVerified) {
    //   this.notificationService.showNotification(
    //     'Please verify your email before updating your profile.',
    //     'Close',
    //     5000,
    //     ['error-snackbar'], // Custom class for error
    //   );
    //   return;
    // }
    this.loading = true;

    try {
      if (this.profileForm.valid && this.user?.uid) {
        const { firstName, lastName, birth_date } = this.profileForm.value;
        const updateData = {
          firstName,
          lastName,
          birth_date,
          updatedAt: new Date().toISOString(),
        };
    
        try {
          await updateDoc(doc(this.firestore, 'users', this.user?.uid), updateData);
          await updateProfile(this.user, {
            displayName: `${updateData.firstName} ${updateData.lastName}`
          });
          this.notificationService.showNotification(
            'Profile updated successfully',
            'Close',
            5000,
            ['error-snackbar'], // Custom class for error
          );
          this.updateError = null; // Clear any previous error message
          console.log('Profile updated');
        } catch (error) {
          this.notificationService.showNotification(
            'Error updating profile. Please try again.' + error,
            'Close',
            5000,
            ['error-snackbar'], // Custom class for error
            this.isMobile ? 'bottom' : 'top', // Adjust position based on screen size
            this.isMobile ? 'center' : 'right' // Adjust position based on screen size
          );
          this.updateSuccess = null;
        }
      }
      if (this.passwordForm.valid && this.passwordForm.dirty) {
        const { password } = this.passwordForm.value;
        try {
          if (this.user && password) {
            await updatePassword(this.user, password);
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