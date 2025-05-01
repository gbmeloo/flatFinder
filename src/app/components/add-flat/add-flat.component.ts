import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-flat',
  imports: [FormsModule],
  templateUrl: './add-flat.component.html',
  styleUrl: './add-flat.component.css'
})
export class AddFlatComponent {
  city: string = '';
  rent_price: number = 0;
  area_size: number = 0;
  imageUrl: string = '';
  has_ac: boolean = false;
  date_available: Date = new Date();
  street_number: number = 0;
  street_name: string = '';
  year_built: number = 0;
  landlord_id: string = '';

  flats: any[] = [];

  addFlat() {
    const flat = {
      landlord_id: this.landlord_id,
      city: this.city,
      rent_price: this.rent_price,
      area_size: this.area_size,
      imageUrl: this.imageUrl,
      has_ac: this.has_ac,
      date_available: this.date_available,
      street_number: this.street_number,
      street_name: this.street_name,
      year_built: this.year_built
    };
    this.flats.push(flat);
    console.log(this.flats);
}
}
