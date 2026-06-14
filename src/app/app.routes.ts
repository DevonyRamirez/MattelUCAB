import { Routes } from '@angular/router';
import { LoginComponent } from './auth/pages/login/login.component';
import { LayoutComponent } from './dashboard/layout/layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: LayoutComponent,
    children: []
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
