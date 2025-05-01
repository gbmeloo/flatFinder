import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-flat',
  imports: [FormsModule],
  templateUrl: './add-flat.component.html',
  styleUrl: './add-flat.component.css'
})
export class AddFlatComponent {
  name: string = '';
  location: string = '';
  price: number = 0;
  size: number = 0;
  imageUrl: string = '';

  flats: any[] = [];

  addFlat() {
    const flat = {
      name: this.name,
      location: this.location,
      price: this.price,
      size: this.size,
      imageUrl: this.imageUrl
    }
    this.flats.push(flat);
    console.log(this.flats);
}
}
