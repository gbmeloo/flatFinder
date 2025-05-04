import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private snackBar: MatSnackBar) {}

  showNotification(message: string, action: string = 'Dismiss', duration: number = 3000, panelClass: string[] = []) {
    const config = new MatSnackBarConfig();
    config.duration = duration;
    config.panelClass = panelClass; // This is the crucial part
    config.verticalPosition = 'top'; // Optional: Set vertical position
    config.horizontalPosition = 'right'; // Optional: Set horizontal position
    this.snackBar.open(message, action, config);
  }
}