import { Component, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, collection, query, where, orderBy, getDocs, Timestamp, deleteDoc, doc  } from '@angular/fire/firestore';
import { trigger, state, style, transition, animate } from '@angular/animations';
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
  selector: 'app-my-flats',
  imports: [
    MatProgressSpinnerModule,
    MatIconModule,
    CommonModule,
    FormsModule
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
  userId: string | null = null;
  deleteError: string | null = null;
  deleteSuccess: string | null = null;
  loading: boolean = false;
  isMobile: boolean = false; // Track if the screen is mobile size

  myflats: Flat[] =[];
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

  constructor(private firestore: Firestore, private notificationService: NotificationService) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint as needed
  }

  ngOnInit() {
    const token = localStorage.getItem('idToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userId = decodedToken.user_id;
  
        if (this.userId) {
          this.getMyFlats();
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

  async getMyFlats() {
    if (!this.userId) {
      console.error('User ID is null or undefined. Cannot fetch my flats data.');
      return;
    }
  
    try {
      const flats = collection(this.firestore, 'flats');
      const q = query(flats, 
        where('landlord_id', '==', this.userId),
        orderBy('city', 'asc'),
        orderBy('rent_price', 'asc'),
        orderBy('area_size', 'asc')
      );
      const queryByUid = await getDocs(q);
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
      this.filteredFlats = this.myflats;

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

  async editFlat(event: any) {

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

  async messageFlat(id: string) {
    
  }
}