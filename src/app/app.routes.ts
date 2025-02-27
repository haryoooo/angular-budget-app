// Angular modules
import { Routes } from '@angular/router';

export const routes : Routes = [
  {
    path         : 'auth',
    loadChildren : () => import('./pages/auth/auth.routes').then(m => m.routes),
  },
  {
    path          : 'home',
    loadComponent : () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  { path : '', redirectTo : '/home', pathMatch : 'full' },
  {
    path          : 'home/transactions',
    loadComponent : () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent),
  },
  { path : '', redirectTo : '/home/transactions', pathMatch : 'full' },
  {
    path          : 'chart',
    loadComponent : () => import('./pages/chart/chart.component').then(m => m.ChartComponent),
  },
  { path : '', redirectTo : '/chart', pathMatch : 'full' },
  {
    path          : 'wallet',
    loadComponent : () => import('./pages/wallet/wallet.component').then(m => m.WalletComponent),
  },
  { path : '', redirectTo : '/home', pathMatch : 'full' },
  { path : '', redirectTo : '/user', pathMatch : 'full' },
  {
    path          : '**',
    loadComponent : () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];