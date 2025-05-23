import { Routes } from '@angular/router';
import { FlatsComponent } from './components/flats/flats.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginAuthGuard } from './guard/login-auth.guard';
import { ProfileComponent } from './components/profile/profile.component';
import { AuthGuard } from './guard/auth.guard';
import { AddFlatComponent } from './components/add-flat/add-flat.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { EmailVerifiedGuard } from './guard/email-verified.guard';
import { MyFlatsComponent } from './components/my-flats/my-flats.component';
import { FlatDetailsComponent } from './components/flat-details/flat-details.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { ChatComponent } from './components/chat/chat.component';
import { UpdateFlatComponent } from './components/update-flat/update-flat.component';

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
    },
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'reset-password',
        component: ResetPasswordComponent
    },
    {
        path: 'my-flats',
        component: MyFlatsComponent,
        canActivate: [AuthGuard]
    },
    {

        path: 'flat-details/:id',
        component: FlatDetailsComponent,
        canActivate: [AuthGuard]
    }, 
    {
        path: 'favorites',
        component: FavoritesComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'chat',
        component: ChatComponent,
        canActivate: [AuthGuard]
    },
    { 
        path: 'chat/:chatId', 
        component: ChatComponent,
        canActivate: [AuthGuard]
    },
    {

        path: 'update-flat/:id',
        component: UpdateFlatComponent,
        canActivate: [AuthGuard]
    }, 
];
