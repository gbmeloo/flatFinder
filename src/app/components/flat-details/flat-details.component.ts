import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FlatService } from '../../services/flat.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { getDoc, doc, Firestore, collection, query, getDocs } from '@angular/fire/firestore';

@Component({
  selector: 'app-flat-details',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, CommonModule],
  templateUrl: './flat-details.component.html',
  styleUrls: ['./flat-details.component.css']
})
export class FlatDetailsComponent implements OnInit {
  flatForm: FormGroup;
  flat: any;
  editMode = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private flatService: FlatService,
    private firestore: Firestore
  ) {
    this.flatForm = this.fb.group({
      address: ['', Validators.required],
      price: ['', Validators.required],
      measurements: ['', Validators.required],
      city: ['', Validators.required],
      dateAvailable: ['', Validators.required],
      contactNumber: ['', Validators.required],
      landlord_firstname: [''],
      landlord_lastname: [''],
      landlord_email: [''],
    });

  }

  ngOnInit() {
    const flatId = this.route.snapshot.paramMap.get('id');
    if (flatId) {
      this.fetchFlatDetails(flatId);
    }
  }

  enableEdit() {
    this.editMode = true;
  }

  onSubmit() {
    if (this.flatForm.valid && this.flat) {
     
      this.editMode = false;
    }
  }

  async fetchFlatDetails(flatId: string) {

      const users = collection(this.firestore, 'users');
            const u = query(users);
            const queryUsers = await getDocs(u);

    const flatRef = doc(this.firestore, 'flats', flatId);
    await getDoc(flatRef).then(data => {
      this.flat = data.data();
      this.flat.imageUrl = this.flat.images;
      const landlordDoc = queryUsers.docs.find(doc => doc.id === this.flat.landlord_id);
      const landlord = landlordDoc ? landlordDoc.data() : null;
      if(landlord != null) {
        this.flat. landlord_firstname =`${String(landlord["firstName"] ?? '')}`;
        this.flat. landlord_lastname =`${String(landlord["lastName"] ?? '')}`;
        
        this.flat.landlord_email = String(landlord["email"] ?? '');
      }
      else {
        this.flat.landlord_firstname = "";
        this.flat.landlord_lastname = "";
        this.flat.landlord_email = "";
      }

      console.log('Flat details:', this.flat);
      this.flatForm.patchValue({
        address: this.flat.address,
        price: this.flat.price,
        measurements: this.flat.measurements,
        city: this.flat.city,
        dateAvailable: this.flat.dateAvailable,
        contactNumber: this.flat.contactNumber
      });
    }).catch(error => {
      console.error('Error fetching flat details:', error);
    });
  }

}