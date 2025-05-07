import { Injectable } from '@angular/core';
import { Database, ref, onValue, set, get, push, query, orderByKey, limitToLast } from '@angular/fire/database';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private lastMessageSubject = new BehaviorSubject<{ sender: string, message: string } | null>(null);
  lastMessage$ = this.lastMessageSubject.asObservable();

  constructor(private db: Database) {}

  listenForMessages(chatId: string) {
    const chatRef = ref(this.db, `chats/${chatId}`);
    onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const [sender, message] = data.lastMessage.split(/:(.+)/);
        this.lastMessageSubject.next({ sender, message });
      }
    });
  }

  async sendMessage(chatId: string, sender: string, message: string) {
    const chatRef = ref(this.db, `chats/${chatId}`);
    await set(chatRef, {
      lastMessage: `${sender}: ${message}`,
      timestamp: Date.now(),
      title: "Chat test"
    });
    const messageRef = ref(this.db, `messages/${chatId}`);
    await push(messageRef, {
      message: message,
      name: sender,
      timestamp: Date.now()
    })
  }

  async getLastTenMessages(chatId: string): Promise<any[]> {
    const messagesRef = ref(this.db, `messages/${chatId}`);
    const messagesQuery = query(messagesRef, orderByKey(), limitToLast(10));
  
    const snapshot = await get(messagesQuery);
    const messages = snapshot.val();
  
    if (messages) {
      return Object.entries(messages).map(
        ([key, value]) => ({ 
          id: key, ...(typeof value === 'object' && value !== null ? value : {}) 
        }));
    } else {
      return [];
    }
  }
}