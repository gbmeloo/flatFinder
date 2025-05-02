import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { getAuth } from '@angular/fire/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

@Component({
  selector: 'app-add-flat',
  imports: [FormsModule, CommonModule],
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }



   
  async addFlat() {

    if(this.city === '') {alert('Please fill in all fields.'); return}
    else if (this.rent_price === 0) {alert('Please fill in all fields.'); return}
    else if (this.street_number === 0) {alert('Please fill in all fields.'); return}
    else if (this.street_name === '') {alert('Please fill in all fields.'); return}
    else if (this.imageUrl === '') {alert('Please fill in all fields.'); return}
    
    
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.landlord_id = user.uid
      } 

   

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
      year_built: this.year_built,
      flat_id: user.uid + "N"
    };
    this.flats.push(flat);
    console.log(this.flats);
}
}
}
