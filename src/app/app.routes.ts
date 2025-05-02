import { Routes } from '@angular/router';
import { FlatsComponent } from './components/flats/flats.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginAuthGuard } from './guard/login-auth.guard';
import { AuthGuard } from './guard/auth.guard';
import { AddFlatComponent } from './components/add-flat/add-flat.component';


export const routes: Routes = [
    {
        path: '',
        redirectTo: '/flats', 
        pathMatch: 'full'
    },
    {
        path: 'flats',
        component: FlatsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'login',
        component: LoginComponent,
        canActivate: [LoginAuthGuard] // Ensure this guard is imported and provided in your module
    },
    {
        path: 'register',
        component: RegisterComponent,
        canActivate: [LoginAuthGuard]
    },
    {
        path: 'add-flat',
        component: AddFlatComponent,
        canActivate: [AuthGuard]
    }
];
