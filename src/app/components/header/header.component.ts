import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd  } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ScreenSizeService } from '../../services/screen-size.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-header',
  imports: [RouterModule, MatIconModule, CommonModule],
  animations: [
    trigger('curtainAnimation', [
      state('void', style({ height: '*', opacity: 0 })),
      state('*', style({ height: '*', opacity: 1 })),
      transition(':enter', [
        style({ height: '0', opacity: 0 }),
        animate('200ms ease-out')
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isMobile: boolean = false;
  private subscription: Subscription = new Subscription();
  isExpanded: boolean = false;
  pageName: string = "";

  constructor(
    private router: Router, 
    private authService: AuthService, 
    private screenSizeService: ScreenSizeService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.pageName = event.urlAfterRedirects;
      });
  }

  ngOnInit(): void {
    // Subscribe to the login state
    this.subscription = this.authService.loggedIn.subscribe(
      (loggedIn) => (this.isLoggedIn = loggedIn)
    );

    // Subscribe to the isMobile state
    this.subscription.add(this.screenSizeService.isMobile$.subscribe(isMobile => {
      this.isMobile = isMobile;
    }));
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    // Clean up the subscription
    this.subscription.unsubscribe();
  }
}
