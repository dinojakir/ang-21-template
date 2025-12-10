import { Component, effect, inject, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { GermanDatePipe } from '../../pipes/german-date.pipe';
import { Event, EventStatus } from '../../models/event.model';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MockService } from '../../services/mock-events.service';
import { EventFormDialogComponent } from './event-form-dialog/event-form-dialog.component';
import { BehaviorSubject, of } from 'rxjs';
import { EventDetailComponent } from './event-detail/event-detail.component';
import { combineLatestWith, debounceTime, switchMap } from 'rxjs/operators';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-events-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    EventDetailComponent,
    GermanDatePipe,
  ],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.scss'],
})
export class EventsListComponent {
  events = signal<Event[]>([]);
  statuses: EventStatus[] = ['planned', 'canceled', 'completed'];

  expandedEvent = signal<number | null>(null);

  filterPlace = signal('');
  filterStatus = signal<EventStatus | ''>('');
  filterFrom = signal<string | null>(null);
  filterTo = signal<string | null>(null);
  groupBy = signal<'' | 'status' | 'place'>('');
  search = signal('');
  sortField = signal<'date' | 'place'>('date');
  sortDir = signal<'asc' | 'desc'>('asc');

  page = signal(1);
  size = 25;
  total = signal(0);

  private dialog = inject(MatDialog);
  private params$ = new BehaviorSubject({});
  private service = inject(MockService);

  groupedEvents = toSignal(
    toObservable(this.events).pipe(
      combineLatestWith(toObservable(this.groupBy)),
      switchMap(([events, groupBy]) => {
        if (!groupBy) return of([]);

        const groups = events.reduce((acc, e) => {
          const key = e[groupBy as keyof Event] as string;
          if (!acc[key]) acc[key] = { events: [], sum: 0 };
          acc[key].events.push(e);
          acc[key].sum += e.participants.length;
          return acc;
        }, {} as Record<string, { events: Event[]; sum: number }>);

        return of(
          Object.entries(groups).map(([key, val]) => ({
            key,
            ...val,
          }))
        );
      })
    ),
    { initialValue: [] }
  );

  totalPages = () => Math.ceil(this.total() / this.size);

  constructor() {
    const saved = JSON.parse(localStorage.getItem('eventSettings') || '{}');

    this.sortField.set(saved.sortField ?? 'datum');
    this.sortDir.set(saved.sortDir ?? 'asc');
    this.filterStatus.set(saved.filterStatus ?? '');
    this.groupBy.set(saved.groupBy ?? '');

    // 2) Main event loading stream
    this.params$
      .pipe(
        debounceTime(300),
        switchMap(() => {
          const filter: any = {};

          if (this.filterStatus()) filter.status = this.filterStatus();
          if (this.filterPlace()) filter.ort = this.filterPlace();

          return this.service.getEvents(
            this.page(),
            this.size,
            { field: this.sortField(), dir: this.sortDir() },
            filter
          );
        })
      )
      .subscribe((res) => this.processResponse(res));

    // 3) Auto-save settings via effect
    effect(() => {
      this.saveSettings();

      this.sortField();
      this.sortDir();
      this.filterStatus();
      this.groupBy();
    });
  }

  exportToCsv() {
    const csv = this.events()
      .map(
        (e) =>
          `${new GermanDatePipe().transform(e.date)},${e.place},${e.status},${
            e.participants.length
          }`
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veranstaltungen.csv';
    a.click();
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(EventFormDialogComponent);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.service.addEvent(result).subscribe(() => this.updateParams());
      }
    });
  }

  nextPage() {
    this.page.update((p) => Math.min(p + 1, this.totalPages()));
  }

  prevPage() {
    this.page.update((p) => Math.max(p - 1, 1));
  }

  sort(field: 'date' | 'place') {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
    this.updateParams();
  }

  toggleDetail(id: number) {
    this.expandedEvent.set(this.expandedEvent() === id ? null : id);
  }

  updateEvent(id: number, updates: Partial<Event>) {
    this.service.updateEvent(id, updates).subscribe(() => this.updateParams());
  }

  private processResponse(res: any) {
    let data: Event[] = res.data;

    if (this.search()) {
      const searchLower = this.search().toLowerCase();

      data = data.filter(
        (e: Event) =>
          e.place.toLowerCase().includes(searchLower) ||
          e.status.toLowerCase().includes(searchLower) ||
          new Date(e.date).toLocaleDateString('de-DE').includes(searchLower)
      );
    }

    this.events.set(data);
    this.total.set(res.total);
  }

  private saveSettings() {
    localStorage.setItem(
      'eventSettings',
      JSON.stringify({
        sortField: this.sortField(),
        sortDir: this.sortDir(),
        filterStatus: this.filterStatus(),
        groupBy: this.groupBy(),
      })
    );
  }

  private updateParams() {
    this.page.set(1);
    this.params$.next({});
  }
}
