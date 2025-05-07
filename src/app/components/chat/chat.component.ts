import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { User } from 'firebase/auth';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

export interface Message {
  id: string,
  message: string,
  name: string,
  timestamp: number
}

@Component({
  selector: 'app-chat',
  imports: [ReactiveFormsModule, MatIconModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  userChats: { id: string; title: string; lastMessage: string }[] = [];
  messageForm: FormGroup;
  user: User | null = null;
  messageIDCounter: number = 1;
  chatId: string | null = null; 
  lastMessage: string = '';
  lastSender: string = '';
  chatActive: boolean = false;
  private messageSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private chatService: ChatService,
    private route: ActivatedRoute,
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.chatService.getUserChats(user.uid).then(chats => {
          this.userChats = chats;
          this.chatService.listenToAllUserChats(user.uid); // 👈 Start global listener
        });
  
        // 👇 Global message listener for updating chat list
        this.chatService.globalMessage$.subscribe(update => {
          if (update) {
            const chat = this.userChats.find(c => c.id === update.chatId);
            if (chat) {
              chat.lastMessage = `${update.message.name}: ${update.message.message}`;
              this.userChats = [...this.userChats]; // force refresh
            }
          }
        });
      }
    });
    const chatId = this.route.snapshot.params['chatId']; // Access chatId once
      if (chatId) {
        this.loadChat(chatId); // Load the chat by chatId
      }   
  }

  loadChat(chatId: string) {
    this.messages = []; // Clear previous messages

    // Unsubscribe from previous listener if any
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }

    this.chatService.getLastTenMessages(chatId).then(lastTenMessages => {
      this.messages = lastTenMessages;
    });

    // Start listening to new messages
    this.chatService.listenForMessages(chatId);

    this.messageSub = this.chatService.lastMessage$.subscribe(newMessage => {
      if (newMessage && !this.messages.find(m => m.id === newMessage.id)) {
        this.messages.push(newMessage);

        const chat = this.userChats.find(chat => chat.id === chatId);
        if (chat) {
          chat.lastMessage = `${newMessage.name}: ${newMessage.message}`;
          this.userChats = [...this.userChats];
        }
      }
    });

    this.chatActive = true;
  }

  switchChat(chatId: string) {
    this.chatId = chatId;
    this.loadChat(chatId); // Load the selected chat
  }

  async onSubmit() {
    if (this.messageForm.valid && this.user) {
      const { message } = this.messageForm.value;
      if (!this.chatId) return;
  
      await this.chatService.sendMessage(this.chatId, this.user.displayName || 'Unknown', message);
      
      this.messageForm.reset();
    }
  }

}