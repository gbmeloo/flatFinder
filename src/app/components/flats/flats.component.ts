import { Component, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, query, orderBy, getDocs, Timestamp, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';
import { ChatService } from '../../services/chat.service';
import { Router, RouterOutlet  } from '@angular/router';
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
  favorite: boolean;
  landlord_id: string;
  landlord_name: string;
}

export interface chk {
  value: string;
  checked: boolean;
}

@Component({
  selector: 'app-flats',
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule,
    RouterOutlet
  ],
  standalone: true,
  templateUrl: './flats.component.html',
  styleUrl: './flats.component.css'
})
export class FlatsComponent {
  showFilter: boolean = true;
  isMobile: boolean = false; // Track if the screen is mobile size
  
  user: User | null = null;
  allflats: Flat[] = [];

  filteredFlats: Flat[] = [];
  sortingClicked: string[] = [];
  isAce_City: number = 0;
  isAce_Price: number = 0;
  isAce_Area: number = 0;

  filterCityList: chk[] = [
    { value: 'toronto', checked: false },
    { value: 'vancouver', checked: false },
    { value: 'calgary', checked: false },
    { value: 'montreal', checked: false },
    { value: 'ottawa', checked: false }
  ];
  filterCity: string = '';

  minPriceLimit: number = 0;
  maxPriceLimit: number = 5000;
  minPrice: number = this.minPriceLimit;
  maxPrice: number = this.maxPriceLimit;
  trackPriceLeft = '0%';
  trackPriceWidth = '100%';

  minAreaLimit: number = 1;
  maxAreaLimit: number = 1000;
  minArea: number = this.minAreaLimit;
  maxArea: number = this.maxAreaLimit;
  trackAreaLeft = '0%';
  trackAreaWidth = '100%';

  favoriteFilter: boolean = false;

  constructor(
    private firestore: Firestore,
    private auth: AuthService,
    private chatService: ChatService,
    private router: Router,
    private notification: NotificationService
  ) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint as needed
    this.showFilter = !this.isMobile;
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  ngOnInit() {
    this.checkScreenWidth();
    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.getAllFlats(this.user?.uid);
      } else {
        console.log("User not logged in.")
      }
    })
  }

  async getAllFlats(uid: string) {  
    try {
      const users = collection(this.firestore, 'users');
      const u = query(users);
      const queryUsers = await getDocs(u);

      let favorites: string[] = [];
      if(uid) {
        const currentUserDoc = queryUsers.docs.find(doc => doc.id === uid);
        const urrentUser = currentUserDoc ? currentUserDoc.data() : null;
        if(urrentUser != null) 
          favorites = urrentUser["favorites"];
      }

      const flats = collection(this.firestore, 'flats');
      const q = query(
        flats,
        orderBy('city', 'asc'),
        orderBy('rent_price', 'asc'),
        orderBy('area_size', 'asc')
      );
      const queryAll = await getDocs(q);
      
      const flatsmap = queryAll.docs.map(doc => doc.data());
      const prices = flatsmap.map(flat => flat["rent_price"]);
      this.minPriceLimit = Math.min(...prices);
      this.maxPriceLimit = Math.max(...prices);
      this.minPrice = this.minPriceLimit;
      this.maxPrice = this.maxPriceLimit;
      this.onPriceRangeChange();
      
      const areas = flatsmap.map(flat => flat["area_size"]);
      this.minAreaLimit = Math.min(...areas);
      this.maxAreaLimit = Math.max(...areas);
      this.minArea = this.minAreaLimit;
      this.maxArea = this.maxAreaLimit;
      this.onAreaRangeChange();

      queryAll.forEach((f) => {
        let flat: Flat = f.data() as Flat;
        flat.id = f.id;
        const firestoreDate: Timestamp = flat.date_available;
        const jsDate = firestoreDate.toDate();
        flat.date_available_display = jsDate.toLocaleDateString('en-CA');
        flat.imageUrl = flat.images
        flat.favorite = favorites.includes(flat.id)? true: false;
        
        const landlordDoc = queryUsers.docs.find(doc => doc.id === flat.landlord_id);
        const landlord = landlordDoc ? landlordDoc.data() : null;
        if(landlord != null) {
          flat.landlord_name =`${String(landlord["firstName"] ?? '')} ${String(landlord["lastName"] ?? '')}`;
        }

        this.allflats.push(flat);
        this.filteredFlats.push(flat);
      });
    } catch (error) {
      console.error('Error fetching my flats data:', error);
    }
  }

  onFilterCityChecked(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    this.filterCityList[index].checked = input.checked;
    this.onFilter();
  }

  onPriceRangeChange() {
    if (this.minPrice > this.maxPrice) {
      [this.minPrice, this.maxPrice] = [this.maxPrice, this.minPrice];
    }
  
    const total = this.maxPriceLimit - this.minPriceLimit;
    const leftPercent = ((this.minPrice - this.minPriceLimit) / total) * 100;
    const widthPercent = ((this.maxPrice - this.minPrice) / total) * 100;
  
    this.trackPriceLeft = `${leftPercent}%`;
    this.trackPriceWidth = `${widthPercent}%`;

    this.onFilter();
  }

  onAreaRangeChange() {
    if (this.minArea > this.maxArea) {
      [this.minArea, this.maxArea] = [this.maxArea, this.minArea];
    }
  
    const total = this.maxAreaLimit - this.minAreaLimit;
    const leftPercent = ((this.minArea - this.minAreaLimit) / total) * 100;
    const widthPercent = ((this.maxArea - this.minArea) / total) * 100;
  
    this.trackAreaLeft = `${leftPercent}%`;
    this.trackAreaWidth = `${widthPercent}%`;

    this.onFilter();
  }

  onFilterFavorite() {
    this.favoriteFilter = !this.favoriteFilter;
    this.onFilter();
  }

  async onSort(field: string) {
    try {
      if (!this.sortingClicked.includes(field)) {
        this.sortingClicked.push(field);
      }

      switch (field) {
        case 'city':
          if(!this.isMobile) 
            this.isAce_City = this.isAce_City == 1 ? -1 : 1;
          else {
            this.isAce_City = this.isAce_City === 0 ? 1 : (this.isAce_City === 1 ? -1 : 0);

            if(this.isMobile && this.isAce_City === 0) {
              this.sortingClicked = this.sortingClicked.filter(item => item !== field);
            }      
          }
          break;    
        case 'rent_price':
          if(!this.isMobile)
            this.isAce_Price = this.isAce_Price == 1 ? -1 : 1;
          else {
            this.isAce_Price = this.isAce_Price === 0 ? 1 : (this.isAce_Price === 1 ? -1 : 0);

            if(this.isMobile && this.isAce_Price === 0) {
              this.sortingClicked = this.sortingClicked.filter(item => item !== field);
            }      
          }
          break;    
        case 'area_size':
          if(!this.isMobile)
            this.isAce_Area = this.isAce_Area == 1 ? -1 : 1;
          else {
            this.isAce_Area = this.isAce_Area === 0 ? 1 : (this.isAce_Area === 1 ? -1 : 0);

            if(this.isMobile && this.isAce_Area === 0) {
              this.sortingClicked = this.sortingClicked.filter(item => item !== field);
            }      
          }
          break;
      }

      await this.onFilter();
    } catch (error) {
      console.error('Error sorting flats data:', error);
    }
  }

  async onClearSort() {
    try {
      this.sortingClicked = [];
      this.isAce_City = 0;
      this.isAce_Price = 0;
      this.isAce_Area = 0;
      await this.onFilter();
    } catch (error) {
      console.error('Error clearing sort value:', error);
    }
  }

  async onFilter() {
    try {
      this.filteredFlats = this.allflats;

      this.filterCityList.forEach(ck => {
        if(ck.checked) {
          let city = ck.value.toLocaleLowerCase();
          this.filteredFlats = this.filteredFlats.filter(flat => flat.city?.toLowerCase().includes(city));
        }
      });

      if(this.filterCity.length > 0) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.city?.toLowerCase().includes(this.filterCity.toLocaleLowerCase()));
      }

      if(this.minPrice != Infinity && this.minPrice != null) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price >= this.minPrice);
      }
      
      if(this.maxPrice != Infinity && this.maxPrice != null) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price <= this.maxPrice);
      }
      
      if(this.minArea != Infinity && this.minArea != null) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size >= this.minArea);
      }
      
      if(this.maxArea != Infinity && this.maxArea != null) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size <= this.maxArea);
      }

      if(this.favoriteFilter) {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.favorite == true);
      }
      else {
        this.filteredFlats = this.filteredFlats.filter(flat => flat.favorite == true || flat.favorite == false);
      }

      this.filteredFlats.sort((a, b) => {
        let result = 0;
        
        if(this.isAce_City != 0) {
          result = a.city.localeCompare(b.city) * this.isAce_City;
          if (result !== 0) return result;
        }
      
        if(this.isAce_Price != 0) {
          result = (a.rent_price - b.rent_price) * this.isAce_Price;
          if (result !== 0) return result;
        }
      
        if(this.isAce_Area != 0) {
          return (a.area_size - b.area_size) * this.isAce_Area;
        }

        return result;
      });
    } catch (error) {
      console.error('Error filtering data:', error);
    }
  }

  async onClearFilter() {
    try {
      this.filterCityList.forEach(item => item.checked = false);
      this.filterCity = '';
      this.favoriteFilter = false;

      this.minPrice = this.minPriceLimit;
      this.maxPrice = this.maxPriceLimit;
      this.onPriceRangeChange();

      this.minArea = this.minAreaLimit;
      this.maxArea = this.maxAreaLimit;
      this.onAreaRangeChange();

      await this.onFilter();
    } catch (error) {
      console.error('Error clearing sort value:', error);
    }
  }

  async viewFlat(flatId: string) {
    this.router.navigate(['/flat-details', flatId]);
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
      if (!this.user) {
        console.error('User is not logged in.');
        return;
      }
  
      const userDocRef = collection(this.firestore, 'users');
      const userRef = doc(userDocRef, this.user?.uid);
  
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
    } catch (error) {
      console.error('Error adding flat to favorites:', error);
    }
  }
}
