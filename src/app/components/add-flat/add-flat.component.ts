import { Component, HostListener } from '@angular/core';
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
import { Firestore, addDoc, collection, Timestamp } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService } from '../../services/notification.service';

export interface Flat {
  city: string;
  street_name: string;
  street_number: string;
  rent_price: number;
  area_size: number;
  has_ac: boolean;
  year_built: number;
  date_available: Timestamp;
  images: string[];
  landlord_id: string;
  createdAt: string;
}

@Component({
  selector: 'app-add-flat',
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
  templateUrl: './add-flat.component.html',
  styleUrl: './add-flat.component.css'
})
export class AddFlatComponent {
  addFlatForm: FormGroup;
  selectedFiles: FileList | null = null;
  userId: string | null = null;
  insertError: string | null = null;
  insertSuccess: string | null = null;
  loading: boolean = false;
  isMobile: boolean = false; // Track if the screen is mobile size

  constructor(
    private fb: FormBuilder, 
    private firestore: Firestore,
    private notificationService: NotificationService) {
    
    this.addFlatForm = this.fb.group(
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
    const token = localStorage.getItem('idToken');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.userId = decodedToken.user_id;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.error('No token found in sessionStorage.');
    }
  }

  getErrorMessage(controlName: string): string {
    let control = this.addFlatForm.get(controlName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.getError('minlength').requiredLength;
      return `Must be at least ${requiredLength} characters long`;
    }

    return '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = input.files;
    }
  }

  async onSubmit() {
    this.insertError = null; // Clear any previous error message
    this.insertSuccess = null; // Clear any previous success message
    this.loading = true;

    if (!this.userId) {
      console.error('User ID is null or undefined. Cannot fetch user data.');
      return;
    }

    if (this.addFlatForm.valid) {
      try {
        const insert: Flat = this.addFlatForm.value;
        const images = this.selectedFiles ? await this.uploadImages(this.selectedFiles) : [];
        const newFlat: Flat = {
          city: insert.city,
          street_name: insert.street_name,
          street_number: insert.street_number,
          rent_price: insert.rent_price,
          area_size: insert.area_size,
          has_ac: insert.has_ac,
          year_built: insert.year_built,
          date_available: Timestamp.fromDate(new Date(insert.date_available.toString())),
          images: images,
          landlord_id: this.userId,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(this.firestore, 'flats'), newFlat);
        this.notificationService.showNotification(
          'Profile inserted successfully',
          'Close',
          5000,
          ['error-snackbar'], // Custom class for error
        );
        this.insertError = null; // Clear any previous error message
        console.log('New flat is insered');
      } catch (error) {
        this.notificationService.showNotification(
          'Error insering new flat. Please try again.' + error,
          'Close',
          5000,
          ['error-snackbar'], // Custom class for error
          this.isMobile ? 'bottom' : 'top', // Adjust position based on screen size
          this.isMobile ? 'center' : 'right' // Adjust position based on screen size
        );
        this.insertSuccess = null;
      } finally {
        this.loading = false;
        this.addFlatForm.reset(); // Clear password fields after update
        setTimeout(() => {
          this.insertSuccess = null; // Clear success message after 3 seconds
          this.insertError = null; // Clear error message after 3 seconds
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
