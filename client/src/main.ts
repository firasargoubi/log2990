import { provideHttpClient } from '@angular/common/http';
import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { Routes, provideRouter, withHashLocation } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { environment } from './environments/environment';
import { EditionPageComponent } from '@app/pages/edition-page/edition-page.component';
import { CreatePageComponent } from '@app/pages/create-page/create-page.component';
import { WaitingPageComponent } from '@app/pages/waiting-page/waiting-page.component';

if (environment.production) {
    enableProdMode();
}


const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'edit/:id', component: EditionPageComponent},
    { path: 'edit', component: EditionPageComponent },
    { path: 'join', component: EditionPageComponent },
    { path: 'material', component: MaterialPageComponent },
    {path:'admin', component: AdminPageComponent},
    {path:'create', component: CreatePageComponent},
    {path: 'waiting', component: WaitingPageComponent},
    { path: '**', redirectTo: '/home' },
];

bootstrapApplication(AppComponent, {
    providers: [provideHttpClient(), provideRouter(routes, withHashLocation()), provideAnimations(), provideAnimationsAsync()],
})