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
   
   flats = [{name: 'Flat 1', price: 100, imageUrl:"blank", location: "test", size: "10"},]
}
