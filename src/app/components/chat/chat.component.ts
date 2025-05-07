import { Component } from '@angular/core';
import { Database, ref, onValue, get, push, set } from '@angular/fire/database';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { timestamp } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  messageForm: FormGroup;
  user: User| null = null;
  lastMessage: string = '';
  lastSender: string = '';
  lastMessageRef: any;

  constructor(
    private db: Database,
    private fb: FormBuilder,
    private auth: AuthService
  ) {
    this.messageForm = this.fb.group(
      {
        message: ['', Validators.required]
      }
    )
  }

  ngOnInit() {
    // Set up the messages reference
    this.lastMessageRef = ref(this.db, 'chats/chatOne');

    // Listen for new messages
    onValue(this.lastMessageRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastMessageObject = data.lastMessage.split(":")
        this.lastSender = lastMessageObject[0];
        this.lastMessage = lastMessageObject[1];
      }
    });

    this.auth.getCurrentUser().then(async user => {
      if (user) {
        this.user = user;
      } else {
        console.log('No user is logged in.');
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });
  }

  async onSubmit() {
    if (this.messageForm.valid) {
      const { message } = this.messageForm.value;

      // Push the new message to the database
      await set(ref(this.db, 'chats/chatOne'), {
        lastMessage: `${this.user?.displayName}: ${message}`,
        timestamp: Date.now(),
        title: "Chat test"
      });

      console.log(this.lastMessage)
      console.log(this.user);

      // Reset the form
      this.messageForm.reset();
    }
  }
}
