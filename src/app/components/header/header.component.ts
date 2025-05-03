import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationEnd  } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { Subscription, filter } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterModule, MatIconModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  private subscription: Subscription = new Subscription();
  pageName: string = "";

  constructor(private router: Router, private authService: AuthService) {
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
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    // Clean up the subscription
    this.subscription.unsubscribe();
  }
}
