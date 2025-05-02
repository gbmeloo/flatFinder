import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flats',
  imports: [CommonModule],
  templateUrl: './flats.component.html',
  styleUrl: './flats.component.css'
})
export class FlatsComponent {
   addToFavorites() {}
   
   flats = [{landlord_id: 'Joshua',
    city: 'city 1',
    rent_price: 100,
    area_size: 200,
    imageUrl: 'https://randomwordgenerator.com/img/picture-generator/54e5d2444253af14f1dc8460962e33791c3ad6e04e50744172287ad1954ec7_640.jpg',
    has_ac: true, 
    date_available: "2023-10-01",
    street_number: 505,
    street_name: "street A",
    year_built: 1999
  },]
}
