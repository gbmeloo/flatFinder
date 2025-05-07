import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { User } from 'firebase/auth';

export interface Message {
  message: string,
  name: string,
  timestamp: number
}

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  messageForm: FormGroup;
  user: User | null = null;
  lastMessage: string = '';
  lastSender: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private chatService: ChatService
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.chatService.listenForMessages('chatOne');
      } else {
        console.log('No user is logged in.');
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });

    this.chatService.lastMessage$.subscribe(message => {
      if (message) {
        this.lastSender = message.sender;
        this.lastMessage = message.message;
      }
    });

    this.chatService.getLastTenMessages("chatOne").then(lastTenMessages => {
      lastTenMessages.forEach(message => {
        this.messages.push({
          message: message.message,
          name: message.name,
          timestamp: message.timestamp
        });
      })
    });
  }

  async onSubmit() {
    if (this.messageForm.valid && this.user) {
      const { message } = this.messageForm.value;
      await this.chatService.sendMessage('chatOne', this.user.displayName || 'Unknown', message);
      this.messages.push({
        message: message,
        name: this.user.displayName ? this.user.displayName : '',
        timestamp: Date.now()
      })
      this.messageForm.reset();
    }
  }
}