import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, updateProfile, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      const { firstName, lastName, dob, email, password } = this.registerForm.value;
      try {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

        await updateProfile(userCredential.user, {
          displayName: `${firstName} ${lastName}`
        });

        await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
          firstName,
          lastName,
          dob,
          email
        });

        this.router.navigate(['/login']);
      } catch (error) {
        alert('Registration failed: ' + (error as Error).message);
      }
    }
  }
}
