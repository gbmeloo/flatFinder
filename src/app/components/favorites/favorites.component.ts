import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc, updateDoc  } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

export interface Flat {
  id: string;
  city: string;
  street_name: string;
  street_number: string;
  rent_price: number;
  area_size: number;
  has_ac: boolean;
  year_built: number;
  date_available: Timestamp;
  date_available_display: string;
  imageUrl: string;
  images: string;
  landlord_id: string;
  landlord_name: string;
  landlord_email: string;
}

@Component({
  selector: 'app-flats',
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent {
  user: User | null = null;
  favoritesFlats: string[] = [];
  userId: string | null = null;
  allflats: Flat[] =[];

  filteredFlats: Flat[] = [];
  sortingClicked: string[] = [];
  isAce_City = true;
  isAce_Price = true;
  isAce_Area = true;
  filterCity: string = '';
  minPrice: number = Infinity;
  maxPrice: number = Infinity;
  minArea: number = Infinity;
  maxArea: number = Infinity;

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private chatService: ChatService,
    private router: Router,
    private notification: NotificationService
  ) { }

  ngOnInit() {

    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
      } else {
        console.log("User not logged in.")
      }
    })



    const token = localStorage.getItem('idToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userId = decodedToken.user_id;
  
        if (this.userId) {
          this.getAllFlats();
        } else {
          console.error('User ID is null or undefined.');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.error('No token found in sessionStorage.');
    }
  }

  async getAllFlats(): Promise<Flat[]> {  
    try {
      if (!this.userId) {
        throw new Error('User ID is null or undefined.');
      }
      const userDocRef = doc(this.firestore, 'users', this.userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites: string[] = userData['favorites'] || [];
        this.favoritesFlats.push(...favorites);
        this.favoritesFlats = favorites
      } else {
        alert('User document does not exist.');
        return [];
      }

      const users = collection(this.firestore, 'users');
      const u = query(users);
      const queryUsers = await getDocs(u);

      const flats = collection(this.firestore, 'flats');
      const q = query(
        flats,
        orderBy('city', 'asc'),
        orderBy('rent_price', 'asc'),
        orderBy('area_size', 'asc')
      );
      const queryAll = await getDocs(q);
      queryAll.forEach((f) => {
        let flat: Flat = f.data() as Flat;
        flat.id = f.id;
        const firestoreDate: Timestamp = flat.date_available;
        const jsDate = firestoreDate.toDate();
        flat.date_available_display = jsDate.toLocaleDateString('en-CA');
        flat.imageUrl = flat.images;
        
        const landlordDoc = queryUsers.docs.find(doc => doc.id === flat.landlord_id);
        const landlord = landlordDoc ? landlordDoc.data() : null;
        if(landlord != null) {
          flat.landlord_name =`${String(landlord["firstName"] ?? '')} ${String(landlord["lastName"] ?? '')}`;
          flat.landlord_email = String(landlord["email"] ?? '');
          
        }
        else {
          flat.landlord_name = "";
          flat.landlord_email = "";
        }

        this.favoritesFlats.forEach(flat => {

        })
        
        for (let i: number = 0; i < this.favoritesFlats.length; i++) {
          if (this.favoritesFlats[i] == flat.id) {
            console.log(flat);
            this.allflats.push(flat);
            this.filteredFlats.push(flat);
          }
      }
        
      });
    } catch (error) {
      console.error('Error fetching my flats data:', error);
      return [];
    }
    return this.allflats;
  }

  async onSort(field: string) {
    try {
      if (!this.sortingClicked.includes(field)) {
        this.sortingClicked.push(field);
      }

      switch (field) {
        case 'city':
          this.isAce_City = !this.isAce_City;
          break;    
        case 'rent_price':
          this.isAce_Price = !this.isAce_Price;
          break;    
        case 'area_size':
          this.isAce_Area = !this.isAce_Area;
          break;
      }

      await this.onFilter();
    } catch (error) {
      console.error('Error sorting flats data:', error);
    }
  }

  async onFilter() {
    try {
      let haveFilter = false;
      this.filteredFlats = this.allflats;

      if(this.filterCity.length > 0) {
        haveFilter = true;
        this.filteredFlats = this.filteredFlats.filter(flat => flat.city?.toLowerCase().includes(this.filterCity.toLocaleLowerCase()));
      }

      if(this.minPrice != Infinity && this.minPrice != null) {
        haveFilter = true;
        this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price >= this.minPrice);
      }
      
      if(this.maxPrice != Infinity && this.maxPrice != null) {
        haveFilter = true;
        this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price <= this.maxPrice);
      }
      
      if(this.minArea != Infinity && this.minArea != null) {
        haveFilter = true;
        this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size >= this.minArea);
      }
      
      if(this.maxArea != Infinity && this.maxArea != null) {
        haveFilter = true;
        this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size <= this.maxArea);
      }

      let direction = this.isAce_City ? 1 : -1;
      this.filteredFlats.sort((a, b) => a.city.localeCompare(b.city) * direction);

      direction = this.isAce_Price ? 1 : -1;
      this.filteredFlats.sort((a, b) => (a.rent_price - b.rent_price) * direction);

      direction = this.isAce_Area ? 1 : -1;
      this.filteredFlats.sort((a, b) => (a.area_size - b.area_size) * direction);
    } catch (error) {
      console.error('Error filtering data:', error);
    }
  }

  async messageFlat(flatId: string, landlordId: string, street: string, userId: string) {
    if (userId === landlordId) {
      this.notification.showNotification(
        "Cannot start a conversation with yourself",
        "Dimiss",
        10000
      )
      return;
    }
    const chatId = await this.chatService.startNewChat(flatId, landlordId, street, userId);
    if (chatId) {
      // Redirect to the chat component with the chat ID
      this.router.navigate(['/chat', chatId]);
    } else {
      console.error('Failed to start or retrieve chat.');
    }
  }

  async favoriteFlat(id: string) {
    try {
      if (!this.userId) {
        console.error('User is not logged in.');
        return;
      }
  
      const userDocRef = collection(this.firestore, 'users');
      const userRef = doc(userDocRef, this.userId);
  
      // Fetch the user's current data
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData['favorites'] || [];
  
        // Check if the flat is already in the favorites
        if (!favorites.includes(id)) {
          favorites.push(id);
  
          // Update the user's document with the new favorites array
          await updateDoc(userRef, { favorites });
          console.log(`Flat with ID ${id} added to favorites.`);
        } else {
          console.log(`Flat with ID ${id} is already in favorites.`);
        }
      } else {
        console.error('User document does not exist.');
      }
  }
 catch (error: any) {
  console.error('Error adding flat to favorites:', error);
}
}
}