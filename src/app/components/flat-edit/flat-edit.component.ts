import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-flat-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './flat-edit.component.html',
  styleUrl: './flat-edit.component.css'
})
export class FlatEditComponent implements OnInit {
  flatForm: FormGroup;
  flatId: string = '';
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private firestore: Firestore,
    private router: Router
  ) {
    this.flatForm = this.fb.group({
      street_name: ['', Validators.required],
      street_number: ['', Validators.required],
      rent_price: ['', Validators.required],
      area_size: ['', Validators.required],
      city: ['', Validators.required],
      year_built: ['', Validators.required],
      has_ac: [false],
      date_available: ['', Validators.required],
      landlord_firstname: [''],
      landlord_lastname: [''],
      landlord_email: [''],
      imageUrl: ['']
    });
  }

  async ngOnInit() {
    this.flatId = this.route.snapshot.paramMap.get('id') || '';
    if (this.flatId) {
      const flatRef = doc(this.firestore, 'flats', this.flatId);
      const flatSnap = await getDoc(flatRef);
      const flat = flatSnap.data();
      if (flat) {
        this.flatForm.patchValue({
          street_name: flat['street_name'] || '',
          street_number: flat['street_number'] || '',
          rent_price: flat['rent_price'] || '',
          area_size: flat['area_size'] || '',
          city: flat['city'] || '',
          year_built: flat['year_built'] || '',
          has_ac: flat['has_ac'] || false,
          date_available: flat['date_available'] ? flat['date_available'].toDate().toISOString().substring(0, 10) : '',
          landlord_firstname: flat['landlord_firstname'] || '',
          landlord_lastname: flat['landlord_lastname'] || '',
          landlord_email: flat['landlord_email'] || '',
          imageUrl: flat['images'] || ''
        });
        this.imagePreview = flat['images'] || '';
      }
    }
  }

  onImageChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.flatForm.patchValue({ imageUrl: this.imagePreview });
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (this.flatForm.valid && this.flatId) {
      const flatRef = doc(this.firestore, 'flats', this.flatId);
      const formValue = this.flatForm.value;
      await updateDoc(flatRef, {
        street_name: formValue.street_name,
        street_number: formValue.street_number,
        rent_price: formValue.rent_price,
        area_size: formValue.area_size,
        city: formValue.city,
        year_built: formValue.year_built,
        has_ac: formValue.has_ac,
        date_available: formValue.date_available,
        landlord_firstname: formValue.landlord_firstname,
        landlord_lastname: formValue.landlord_lastname,
        landlord_email: formValue.landlord_email,
        images: formValue.imageUrl
      });
      this.router.navigate(['/flat-details', this.flatId]);
    }
  }
}
