import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, collection, query, where, orderBy, getDocs, Timestamp  } from '@angular/fire/firestore';

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
  landlord_id: string;
}

@Component({
  selector: 'app-my-flats',
  imports: [
    MatIconModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './my-flats.component.html',
  styleUrl: './my-flats.component.css'
})
export class MyFlatsComponent {
  userId: string | null = null;
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

  constructor(private firestore: Firestore,) { }

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
        flat.imageUrl = "https://cdngeneral.point2homes.com/dmslivecafe/3/1652463/20230203_231230669_iOS(20250312114430897).jpg?width=360&quality=80";
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
    
  }

  async messageFlat(id: string) {
    
  }
}