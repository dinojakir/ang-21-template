import { Routes } from '@angular/router';
import { EventsListComponent } from './pages/events-list/events-list.component';

export const routes: Routes = [
  { path: '**', component: EventsListComponent },
];
