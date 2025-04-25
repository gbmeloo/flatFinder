import { Component } from '@angular/core';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {

  constructor(private firestore: Firestore, private auth: Auth) {}

  ngOnInit() {
    this.login();
  }

  login() {
    const email = 'user3@test.com';
    const password = '1234abcd';

    signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
        console.log('User logged in:', userCredential.user);
      })
      .catch((error) => {
        console.error('Error logging in:', error);
      });
  }
}
