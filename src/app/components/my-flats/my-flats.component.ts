import { Component, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, collection, query, where, orderBy, getDocs, Timestamp, deleteDoc, doc  } from '@angular/fire/firestore';
import { trigger, state, style, transition, animate } from '@angular/animations';
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

export interface chk {
  value: string;
  checked: boolean;
}

@Component({
  selector: 'app-my-flats',
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    CommonModule,
    FormsModule,
  ],
  animations: [
    trigger('formResize', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        padding: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '*'
      })),
      transition('collapsed <=> expanded', [
        style({ overflow: 'hidden' }),
        animate('300ms ease')
      ])
    ])
  ],
  templateUrl: './my-flats.component.html',
  styleUrl: './my-flats.component.css'
})
export class MyFlatsComponent {
  showFilter: boolean = true;
  isMobile: boolean = false; // Track if the screen is mobile size
  
  user: User | null = null;
  deleteError: string | null = null;
  deleteSuccess: string | null = null;
  loading: boolean = false;
  myflats: Flat[] =[];

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

  constructor(
    private firestore: Firestore, 
    private auth: AuthService,
    private chatService: ChatService,
    private router: Router,
    private notificationService: NotificationService
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
        this.getMyFlats(this.user?.uid);
      } else {
        console.log("User not logged in.")
      }
    })
  }

  async getMyFlats(uid: string) {
    if (!uid) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }
  
    try {
      const flats = collection(this.firestore, 'flats');
      const q = query(flats, 
        where('landlord_id', '==', uid),
        orderBy('city', 'asc'),
        orderBy('rent_price', 'asc'),
        orderBy('area_size', 'asc')
      );
      const queryByUid = await getDocs(q);
      
      const flatsmap = queryByUid.docs.map(doc => doc.data());
      const prices = flatsmap.map(flat => flat["rent_price"]);
      this.minPriceLimit = Math.min(...prices);
      this.maxPriceLimit = Math.max(...prices);
      this.minPrice = this.minPriceLimit == Infinity ? 0 : this.minPriceLimit;
      this.maxPrice = this.maxPriceLimit == -Infinity ? 5000 : this.maxPriceLimit;
      this.onPriceRangeChange();
      
      const areas = flatsmap.map(flat => flat["area_size"]);
      this.minAreaLimit = Math.min(...areas);
      this.maxAreaLimit = Math.max(...areas);
      this.minArea = this.minAreaLimit == Infinity ? 0 : this.minAreaLimit;
      this.maxArea = this.maxAreaLimit == -Infinity ? 1000 : this.maxAreaLimit;
      this.onAreaRangeChange();

      queryByUid.forEach((f) => {
        let flat: Flat = f.data() as Flat;
        flat.id = f.id;
        const firestoreDate: Timestamp = flat.date_available;
        const jsDate = firestoreDate.toDate();
        flat.date_available_display = jsDate.toLocaleDateString('en-CA');
        flat.imageUrl = flat.images;
        this.myflats.push(flat);
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
      let haveFilter = false;
      this.filteredFlats = this.myflats;

      this.filterCityList.forEach(ck => {
        if(ck.checked) {
          haveFilter = true;
          let city = ck.value.toLocaleLowerCase();
          this.filteredFlats = this.filteredFlats.filter(flat => flat.city?.toLowerCase().includes(city));
        }
      });

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

  async editFlat(id: string) {
    this.router.navigate(['/update-flat', id]);
  }

  async deleteFlat(id: string) {
    const confirmed = confirm('Are you sure you want to delete this flat?');
    if (!confirmed) return;

    try {
      const del = doc(this.firestore, 'flats', id);
      await deleteDoc(del);
      this.filteredFlats = this.filteredFlats.filter(flat => flat.id !== id);
      this.myflats = this.myflats.filter(flat => flat.id !== id);
      this.notificationService.showNotification(
        'Flat deleted successfully',
        'Close',
        5000,
        ['error-snackbar'], // Custom class for error
      );
      this.deleteError = null; // Clear any previous error message
      console.log('Flat is deleted');
    } catch (error) {
      this.notificationService.showNotification(
        'Error insering new flat. Please try again.' + error,
        'Close',
        5000,
        ['error-snackbar'], // Custom class for error
        this.isMobile ? 'bottom' : 'top', // Adjust position based on screen size
        this.isMobile ? 'center' : 'right' // Adjust position based on screen size
      );
      this.deleteSuccess = null;
    } finally {
      this.loading = false;
      setTimeout(() => {
        this.deleteSuccess = null; // Clear success message after 3 seconds
        this.deleteError = null; // Clear error message after 3 seconds
      }, 3000);
    }
  }

  async messageFlat(flatId: string, landlordId: string, street: string, userId: string) {
    const chatId = await this.chatService.startNewChat(flatId, landlordId, street, userId);
    if (chatId) {
      // Redirect to the chat component with the chat ID
      this.router.navigate(['/chat', chatId]);
    } else {
      console.error('Failed to start or retrieve chat.');
    }
  }
}