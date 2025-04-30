import { Routes } from '@angular/router';
import { FlatsComponent } from './components/flats/flats.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/flats'
    },
    {
        path: '/flats',
        component: FlatsComponent
    },
    {
        path: '/login',
        component: LoginComponent
    },
    {
        path: '/register',
        component: RegisterComponent
    }
];
