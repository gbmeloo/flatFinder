import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { User } from 'firebase/auth';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ScreenSizeService } from '../../services/screen-size.service';

export interface Message {
  id: string,
  message: string,
  name: string,
  timestamp: number,
  sentByMe?: boolean; // Add this property
}

@Component({
  selector: 'app-chat',
  imports: [
    ReactiveFormsModule, 
    MatIconModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  @ViewChild('messagesWrapper') private messagesWrapper!: ElementRef;

  private shouldScrollToBottom: boolean = false;
  messages: Message[] = [];
  userChats: { id: string; title: string; lastMessage: string }[] = [];
  messageForm: FormGroup;
  user: User | null = null;
  messageIDCounter: number = 1;
  chatId: string | null = null; 
  lastMessage: string = '';
  lastSender: string = '';
  chatActive: boolean = false;
  isMobile: boolean = false;
  showChatsMenu: boolean = true;
  private messageSub?: Subscription;
  private screenSizeSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private screenSizeService: ScreenSizeService
  ) {
    this.messageForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  ngOnInit() {
     // Subscribe to screen size changes
     this.screenSizeSub = this.screenSizeService.isMobile$.subscribe(isMobile => {
      this.isMobile = isMobile;
      if (!isMobile) {
        this.showChatsMenu = true; // Always show chats menu on larger screens
      }
    });

    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.chatService.getUserChats(user.uid).then(chats => {
          this.userChats = chats;
          this.chatService.listenToAllUserChats(user.uid);
        });
  
       
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
      // Ensure chatId is set and load the chat
    this.route.params.subscribe(params => {
      const chatId = params['chatId'];
      if (chatId) {
        this.chatId = chatId; // Set chatId
        this.loadChat(chatId); // Load the chat by chatId
      }
    });
  }

  ngAfterViewChecked() {
    // Automatically scroll to the bottom if needed
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  loadChat(chatId: string) {
    this.messages = []; // Clear previous messages
  
    // Unsubscribe from previous listener if any
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  
  }

  switchChat(chatId: string) {
    this.chatId = chatId;
    this.loadChat(chatId);
    if (this.isMobile) {
      this.showChatsMenu = false; // Switch to chat view on mobile
    }
  }

  goBackToChatsMenu() {
    this.showChatsMenu = true; // Go back to chats menu on mobile
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      this.messagesWrapper.nativeElement.scrollTop = this.messagesWrapper.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Failed to scroll to bottom:', err);
    }
  }

  async onSubmit() {
    if (this.messageForm.valid && this.user) {
      const { message } = this.messageForm.value;
      if (!this.chatId) return;
  
      await this.chatService.sendMessage(this.chatId, this.user.displayName || 'Unknown', message);
      
      this.messageForm.reset();
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    // Unsubscribe from observables to prevent memory leaks
    if (this.screenSizeSub) {
      this.screenSizeSub.unsubscribe();
    }
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

}