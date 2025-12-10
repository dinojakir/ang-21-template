import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Event, EventStatus, Participant } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class MockService {
  private events: Event[] = this.generateMockData(5000);

  private generateMockData(count: number): Event[] {
    const statuses: EventStatus[] = ['planned', 'canceled', 'completed'];

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      place: ['Berlin', 'München', 'Hamburg', 'Köln'][Math.floor(Math.random() * 4)],
      status: statuses[Math.floor(Math.random() * 3)],
      participants: Array.from({ length: Math.floor(Math.random() * 8) + 3 }, () => ({
        name: `Participant ${Math.random().toString(36).substring(7)}`,
        email: `email${Math.random().toString(36).substring(7)}@example.com`,
        role: ['attendee', 'speaker', 'organizer'][
          Math.floor(Math.random() * 3)
        ] as Participant['role'],
      })),
    }));
  }

  getEvents(
    page: number,
    size: number,
    sort?: { field: string; dir: 'asc' | 'desc' },
    filter?: { status?: EventStatus; place?: string }
  ): Observable<{ data: Event[]; total: number }> {
    let data = [...this.events];

    if (filter?.status) {
      data = data.filter((e) => e.status === filter.status);
    }
    if (filter?.place) {
      data = data.filter((e) => e.place.includes(filter.place!));
    }
    if (sort) {
      data.sort((a, b) => {
        const valA = sort.field === 'date' ? a.date.getTime() : a[sort.field as keyof Event];
        const valB = sort.field === 'date' ? b.date.getTime() : b[sort.field as keyof Event];
        return (sort.dir === 'asc' ? 1 : -1) * (valA > valB ? 1 : valA < valB ? -1 : 0);
      });
    }
    const total = data.length;
    data = data.slice((page - 1) * size, page * size);

    return of({ data, total }).pipe(delay(Math.random() * 200 + 100));
  }

  getParticipants(eventId: number): Observable<Participant[]> {
    const event = this.events.find((e) => e.id === eventId);

    return of(event?.participants ?? []).pipe(delay(Math.random() * 200 + 100));
  }

  addEvent(newEvent: Omit<Event, 'id' | 'participants'>): Observable<Event> {
    const id = this.events.length + 1;
    const event: Event = { ...newEvent, id, participants: [] };

    this.events.push(event);

    return of(event).pipe(delay(200));
  }

  updateEvent(id: number, updates: Partial<Event>): Observable<Event> {
    const index = this.events.findIndex((e) => e.id === id);

    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };

      return of(this.events[index]).pipe(delay(200));
    }

    return of(null as any).pipe(delay(200));
  }

  deleteParticipant(eventId: number, participantIndex: number): Observable<void> {
    const event = this.events.find((e) => e.id === eventId);

    if (event) {
      event.participants.splice(participantIndex, 1);
    }

    return of(void 0).pipe(delay(200));
  }

  addParticipant(eventId: number, participant: Participant): Observable<Participant> {
    const event = this.events.find((e) => e.id === eventId);

    if (event) {
      event.participants.push(participant);
    }

    return of(participant).pipe(delay(200));
  }
}
