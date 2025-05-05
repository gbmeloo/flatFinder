import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService {
  private isMobileSubject = new BehaviorSubject<boolean>(false)
  isMobile$ = this.isMobileSubject.asObservable();

  constructor() { 
    this.checkScreenWidth();
    window.addEventListener('resize', () => {
      this.checkScreenWidth();
    });
  }

  private checkScreenWidth(): void {
    this.isMobileSubject.next(window.innerWidth <= 768);
  }
}
