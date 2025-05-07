import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, collection, query, where, orderBy, getDocs, Timestamp, doc, getDoc, updateDoc  } from '@angular/fire/firestore';

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
  favoritesFlats: Flat[] = [];
  userId: string | null = null;

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

  constructor(private firestore: Firestore) { }

  ngOnInit() {
    const token = localStorage.getItem('idToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userId = decodedToken.user_id;
  
        if (this.userId) {
          this.favoriteFlats();
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

  async favoriteFlats(): Promise<void> {  
    if (this.userId) {
      const userDocRef = doc(this.firestore, 'users', this.userId);
      await getDoc(userDocRef).then(favoriteDoc => {
        const data = favoriteDoc.data();
        if (data) {
          console.log('User favorites:', data['favorites']);
          const favorites = data['favorites'] || [];
          favorites.forEach(async (flatId: string) => {
            const flatDocRef = doc(this.firestore, 'flats', flatId);
            const flatDoc = await getDoc(flatDocRef);
            if (flatDoc.exists()) {
              const flatData = flatDoc.data() as Flat;
              this.favoritesFlats.push(flatData);
            }
          });
          console.log('Favorites Flats:', this.favoritesFlats);
        } else {
          console.error('User document data is undefined.');
        }
      })
    }
  }

  // async onSort(field: string) {
  //   try {
  //     if (!this.sortingClicked.includes(field)) {
  //       this.sortingClicked.push(field);
  //     }

  //     switch (field) {
  //       case 'city':
  //         this.isAce_City = !this.isAce_City;
  //         break;    
  //       case 'rent_price':
  //         this.isAce_Price = !this.isAce_Price;
  //         break;    
  //       case 'area_size':
  //         this.isAce_Area = !this.isAce_Area;
  //         break;
  //     }

  //     await this.onFilter();
  //   } catch (error) {
  //     console.error('Error sorting flats data:', error);
  //   }
  // }

  // async onFilter() {
  //   try {
  //     let haveFilter = false;
  //     this.filteredFlats = this.allflats;

  //     if(this.filterCity.length > 0) {
  //       haveFilter = true;
  //       this.filteredFlats = this.filteredFlats.filter(flat => flat.city?.toLowerCase().includes(this.filterCity.toLocaleLowerCase()));
  //     }

  //     if(this.minPrice != Infinity && this.minPrice != null) {
  //       haveFilter = true;
  //       this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price >= this.minPrice);
  //     }
      
  //     if(this.maxPrice != Infinity && this.maxPrice != null) {
  //       haveFilter = true;
  //       this.filteredFlats = this.filteredFlats.filter(flat => flat.rent_price <= this.maxPrice);
  //     }
      
  //     if(this.minArea != Infinity && this.minArea != null) {
  //       haveFilter = true;
  //       this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size >= this.minArea);
  //     }
      
  //     if(this.maxArea != Infinity && this.maxArea != null) {
  //       haveFilter = true;
  //       this.filteredFlats = this.filteredFlats.filter(flat => flat.area_size <= this.maxArea);
  //     }

  //     let direction = this.isAce_City ? 1 : -1;
  //     this.filteredFlats.sort((a, b) => a.city.localeCompare(b.city) * direction);

  //     direction = this.isAce_Price ? 1 : -1;
  //     this.filteredFlats.sort((a, b) => (a.rent_price - b.rent_price) * direction);

  //     direction = this.isAce_Area ? 1 : -1;
  //     this.filteredFlats.sort((a, b) => (a.area_size - b.area_size) * direction);
  //   } catch (error) {
  //     console.error('Error filtering data:', error);
  //   }
  // }

}
