// Angular modules
import { Routes } from '@angular/router';

import { authGuards } from './guards/authGuards';

export const routes: Routes = [
  // Auth routes (only accessible when NOT authenticated)
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes),
  },
  
  // Protected routes (require authentication)
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuards],
  },
  {
    path: 'home/transactions',
    loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent),
    canActivate: [authGuards],
  },
  {
    path: 'home/receipt-scan',
    loadComponent: () => import('./pages/receipt-scan/receipt-scan.component').then(m => m.ReceiptScanComponent),
    canActivate: [authGuards],
  },
  {
    path: 'chart',
    loadComponent: () => import('./pages/chart/chart.component').then(m => m.ChartComponent),
    canActivate: [authGuards],
  },
  {
    path: 'wallet',
    loadComponent: () => import('./pages/wallet/wallet.component').then(m => m.WalletComponent),
    canActivate: [authGuards],
  },
  {
    path: 'user',
    loadComponent: () => import('./pages/user/user.component').then(m => m.UserComponent),
    canActivate: [authGuards],
  },
  
  // Default redirect - let the guards handle the logic
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  },
  
  // 404 catch-all route (must be last)
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];