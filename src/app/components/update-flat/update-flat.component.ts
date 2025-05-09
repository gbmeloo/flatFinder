import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { Firestore, getDoc, doc, updateDoc, Timestamp } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { User } from 'firebase/auth';

export interface Flat {
  city: string;
  street_name: string;
  street_number: string;
  rent_price: number;
  area_size: number;
  has_ac: boolean;
  year_built: number;
  date_available: Timestamp;
}

@Component({
  selector: 'app-update-flat',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CommonModule,
    FormsModule
  ],
  animations: [
    trigger('formResize', [
      state('collapsed', style({
        height: '0px',
        opacity: 0,
        overflow: 'hidden',
        padding: '0px'
      })),
      state('expanded', style({
        height: '*',
        opacity: 1,
        overflow: 'hidden',
        padding: '*'
      })),
      transition('collapsed <=> expanded', [
        style({ overflow: 'hidden' }),
        animate('300ms ease')
      ])
    ])
  ],
  templateUrl: './update-flat.component.html',
  styleUrl: './update-flat.component.css'
})
export class UpdateFlatComponent {

  flatId: string = '';
  imageURL: string = '';

  user: User | null = null;
  updateFlatForm: FormGroup;
  selectedFiles: FileList | null = null;
  updateError: string | null = null;
  updateSuccess: string | null = null;
  loading: boolean = false;
  isMobile: boolean = false; // Track if the screen is mobile size

  constructor(
    private fb: FormBuilder, 
    private route: ActivatedRoute,
    private firestore: Firestore,
    private notificationService: NotificationService,
    private auth: AuthService,
  ){
    
    this.updateFlatForm = this.fb.group(
      {
        city: [ '', [ Validators.required, Validators.minLength(2) ], ],
        street_number: [ '', [ Validators.required, Validators.minLength(2) ], ],
        street_name: [ '',  Validators.required ],
        rent_price: [ '',  Validators.required ],
        area_size: [ '',  Validators.required ],
        date_available: [ '',  Validators.required ],
        year_built: [ '',  Validators.required ],
        has_ac: [ '' ],
        images: [ '' ]
      }
    );
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenWidth();
  }

  checkScreenWidth(): void {
    this.isMobile = window.innerWidth <= 768; // You can adjust the breakpoint as needed
  }

  ngOnInit() {
    this.auth.getCurrentUser().then(user => {
      if (user) {
        this.user = user;
        this.flatId = this.route.snapshot.paramMap.get('id') || '';
        if (this.flatId) {
          this.getFlatData(this.flatId);
        }
      } else {
        console.log("User not logged in.")
      }
    })
  }

  async getFlatData(flat_id: string) {
    if (!this.user?.uid) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }
  
    try {
      const flatsDoc = await getDoc(doc(this.firestore, 'flats', flat_id));
      if (flatsDoc.exists()) {
        const flatData = flatsDoc.data();
        this.imageURL = flatData['images'] || '';
        this.updateFlatForm.patchValue({
          city: flatData['city'] || '',
          street_number: flatData['street_number'] || '',
          street_name: flatData['street_name'] || '',
          rent_price: flatData['rent_price'] || '',
          area_size: flatData['area_size'] || '',
          date_available: flatData['date_available'].toDate().toLocaleDateString('en-CA') || '',
          year_built: flatData['year_built'] || '',
          has_ac: flatData['has_ac'] || ''
        });
      } else {
        console.error('Flat document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching flat data:', error);
    }
  }

  getErrorMessage(controlName: string): string {
    let control = this.updateFlatForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Must be at least ${requiredLength} characters long`;
    }

    return '';
  }

  async onFileSelected(event: any) {
    this.loading = true;
    try {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();  
        reader.onload = async () => {
          const newImgUrl = reader.result as string;  
          this.imageURL = newImgUrl;  
          const uploadedUrl = await this.uploadImages(file);  
          const updateData = {
            images: newImgUrl
          };
          await updateDoc(doc(this.firestore, 'flats', this.flatId), updateData);
  
          this.notificationService.showNotification(
            'Flat image updated successfully',
            'Close',
            5000,
            ['success-snackbar']
          );  
          this.updateError = null;
        };
  
        reader.readAsDataURL(file);
      }
    } catch (error) {
      this.notificationService.showNotification(
        'Error updating flat image. Please try again. ' + error,
        'Close',
        5000,
        ['error-snackbar'],
        this.isMobile ? 'bottom' : 'top',
        this.isMobile ? 'center' : 'right'
      );
      this.updateSuccess = null;
    } finally {
      setTimeout(() => {
        this.updateSuccess = null;
        this.updateError = null;
        this.loading = false;
      }, 3000);
    }
  }

  async onSubmit() {
    this.updateError = null; // Clear any previous error message
    this.updateSuccess = null; // Clear any previous success message
    this.loading = true;

    if (!this.user) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }

    if (this.updateFlatForm.valid) {
      try {
        const update: Flat = this.updateFlatForm.value;
        const updateData = {
          city: update.city,
          street_name: update.street_name,
          street_number: update.street_number,
          rent_price: update.rent_price,
          area_size: update.area_size,
          has_ac: update.has_ac,
          year_built: update.year_built,
          date_available: Timestamp.fromDate(new Date(update.date_available.toString())),
          landlord_id: this.user?.uid,
          updatedAt: new Date().toISOString()
        };
        await updateDoc(doc(this.firestore, 'flats', this.flatId), updateData);
        this.notificationService.showNotification(
          'Flat updated successfully',
          'Close',
          5000,
          ['error-snackbar'], // Custom class for error
        );
        this.updateError = null; // Clear any previous error message
        console.log('Flat is updated');
      } catch (error) {
        this.notificationService.showNotification(
          'Error updateing flat. Please try again.' + error,
          'Close',
          5000,
          ['error-snackbar'], // Custom class for error
          this.isMobile ? 'bottom' : 'top', // Adjust position based on screen size
          this.isMobile ? 'center' : 'right' // Adjust position based on screen size
        );
        this.updateSuccess = null;
      } finally {
        this.loading = false;
        setTimeout(() => {
          this.updateSuccess = null; // Clear success message after 3 seconds
          this.updateError = null; // Clear error message after 3 seconds
        }, 3000);
      }
    }
  }

  async uploadImages(files: FileList): Promise<string[]> {
    const storage = getStorage();
    const urls: string[] = [];
  
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileRef = ref(storage, `flats/${Date.now()}_${file.name}`);
      console.log(fileRef);
  
      // Upload file
      const snapshot = await uploadBytes(fileRef, file);
      console.log(snapshot);
  
      // Get URL
      const url = await getDownloadURL(snapshot.ref);
      console.log(url);
      urls.push(url);
    }
  
    return urls;
  }
}
