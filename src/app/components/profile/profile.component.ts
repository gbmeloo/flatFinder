import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';

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

  constructor(private fb: FormBuilder, private auth: Auth, private firestore: Firestore) {
    const _date = new Date();
    _date.setDate(_date.getDate() - 1);
    this.max_date = _date.toISOString().split('T')[0]; 

    this.profileForm = this.fb.group(
      {
        firstName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        lastName: [ '', [ Validators.required, Validators.minLength(2) ], ],
        birth_date: [ '',  Validators.required ],
        email: [ '',  [ Validators.required, Validators.email ] ]
      }
    );
    this.getUsers();
  }
  
  async getUsers() {
    const uuid = sessionStorage.getItem('uid');
    if(uuid) {
      const users = await getDoc(doc(this.firestore, 'users', uuid));
      if (users.exists()) {
        const userData = users.data();
        console.log(userData);

        this.profileForm.patchValue({
          firstName: userData["firstName"] || '',
          lastName: userData["lastName"] || '',
          birth_date: userData["birth_date"] || '',
          email: userData["email"] || '',
        });
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
      return `It must be at least ${requiredLength} characters long`;
    }

    return '';
  }

  async onSubmit() {
      if (this.profileForm.valid) {
        try {
          const uuid = sessionStorage.getItem('uid');
          if(uuid) {
            const { firstName, lastName, email, birth_date } = this.profileForm.value;
            const updateData = {
              firstName,
              lastName,
              email,
              birth_date,
              updatedAt: new Date().toISOString()
            };
            const userRef = doc(this.firestore, 'users', uuid);
            await updateDoc(userRef, updateData);
          }
        } catch (error) {
          console.error('Error registering user:', error);
        }
      }
    }
}
