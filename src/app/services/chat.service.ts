import { Injectable } from '@angular/core';
import { Database, ref, onValue, set, get, push, query, orderByKey, limitToLast, update } from '@angular/fire/database';
import { onChildAdded } from 'firebase/database';
import { BehaviorSubject } from 'rxjs';

export interface Message {
  id: string,
  message: string,
  name: string,
  timestamp: number
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private lastMessageSubject = new BehaviorSubject<{ id: string, message: any, name: any, timestamp: any } | null>(null);
  lastMessage$ = this.lastMessageSubject.asObservable();
  private globalMessageSubject = new BehaviorSubject<{ chatId: string, message: Message } | null>(null);
  globalMessage$ = this.globalMessageSubject.asObservable();

  constructor(private db: Database) {}


  listenForMessages(chatId: string) {
    const messagesRef = ref(this.db, `messages/${chatId}`);
    onChildAdded(messagesRef, (snapshot) => {
      const message = snapshot.val();
      const id = snapshot.key;
      if (message && id) {
        this.lastMessageSubject.next({
          id,
          ...message
        });
      }
    });
  }

  listenToAllUserChats(userId: string) {
    this.getUserChats(userId).then(chats => {
      chats.forEach(chat => {
        const messagesRef = ref(this.db, `messages/${chat.id}`);
        onChildAdded(messagesRef, (snapshot) => {
          const message = snapshot.val();
          const id = snapshot.key;
          if (message && id) {
            this.globalMessageSubject.next({
              chatId: chat.id,
              message: {
                id,
                message: message.message,
                name: message.name,
                timestamp: message.timestamp
              }
            });
          }
        });
      });
    });
  }

  async sendMessage(chatId: string, sender: string, message: string) {
    const chatRef = ref(this.db, `chats/${chatId}`);

    const chatSnapshot = await get(chatRef);
    const chatData = chatSnapshot.val();

    const updatedChatData = {
      title: chatData?.title || 'Untitled Chat', // Keep title if exists, else fallback to default
      property: chatData?.property || '', // Keep property if exists, else fallback to empty string
      lastMessage: `${sender}: ${message}`,
      timestamp: Date.now()
    };

    await set(chatRef, updatedChatData);
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

  async startNewChat(flatId: string, landlordId: string, street: string, userId: string): Promise<string | null> {
    const checkPropertyRef = ref(this.db, `propertyChats/${flatId}`)
    const propertyChats = (await get(checkPropertyRef)).val();
    const userChats = (await (get(ref(this.db, `userChats/${userId}`)))).val();
    const landlordChats = (await (get(ref(this.db, `userChats/${landlordId}`)))).val();
    
    const propertyChatIds = propertyChats ? Object.keys(propertyChats) : [];
    const userChatIds = userChats ? Object.keys(userChats) : [];
    const landlordChatIds = landlordChats ? Object.keys(landlordChats) : [];

    const userChatSet = new Set(userChatIds);
    const landlordChatSet = new Set(landlordChatIds);

    const commonChatId = propertyChatIds.find(chatId =>
      userChatSet.has(chatId) && landlordChatSet.has(chatId)
    );

    if (commonChatId) {
      console.log(`Common chat ID found: ${commonChatId}`);
      // handle existing chat logic here
      return commonChatId;
    } else {

      const newChatKey = push(ref(this.db, 'chats'));
      update(ref(this.db, `chats/${newChatKey.key}`), {
        timestamp: Date.now(),
        property: flatId,
        title: street
      });
      update(ref(this.db, `members/${newChatKey.key}`), {
        [landlordId]: true,
        [userId]: true
      });
      // Pushing user to user chats collection
      update(ref(this.db, `userChats/${userId}`), {
        [newChatKey.key]: true
      })
      // Pushing landlord to user chats collection
      update(ref(this.db, `userChats/${landlordId}`), {
        [newChatKey.key]: true
      })
      update(ref(this.db, `propertyChats/${flatId}`), {
        [newChatKey.key]: true
      })
      return newChatKey.key;
    }    
  }

  async getUserChats(userId: string): Promise<{ id: string; title: string; lastMessage: string }[]> {
    const userChatsRef = ref(this.db, `userChats/${userId}`);
    const snapshot = await get(userChatsRef);
    const chats = snapshot.val();
  
    if (chats) {
      const chatDetails = await Promise.all(
        Object.keys(chats).map(async chatId => {
          const chatRef = ref(this.db, `chats/${chatId}`);
          const chatSnapshot = await get(chatRef);
          const chatData = chatSnapshot.val();
          return {
            id: chatId,
            title: chatData?.title || 'Untitled Chat',
            lastMessage: chatData?.lastMessage || 'No messages yet'
          };
        })
      );
      return chatDetails;
    } else {
      return [];
    }
  }
}