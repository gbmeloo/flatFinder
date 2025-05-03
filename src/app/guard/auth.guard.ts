import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    if (state.url === '/login') {
      return true;
    }

    const token = localStorage.getItem('idToken');

    if (!token) {
      await this.router.navigate(['/login']);
      return false;
    }

    try {
      const decoded: any = jwtDecode(token);
      const isExpired = decoded.exp * 1000 <= Date.now();

      if (isExpired) {
        localStorage.removeItem('idToken');
        await this.router.navigate(['/login']);
        return false;
      }

      return true;
    } catch (e) {
      console.error('Invalid token:', e);
      localStorage.removeItem('idToken');
      await this.router.navigate(['/login']);
      return false;
    }
  }
}