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
   
   flats = [{name: 'Flat 1', price: 100, imageUrl:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRQlEg9QM7XyWgkhnfHvGltELrey0u26kyZ4A&s", location: "test", size: "10"},]
}
