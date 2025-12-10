import { Component, inject, Input, signal } from '@angular/core';
import { switchMap } from 'rxjs';
import { Participant } from '../../../models/event.model';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MockService } from '../../../services/mock-events.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [],
  templateUrl: './event-detail.component.html',
})
export class EventDetailComponent {
  @Input() set eventId(id: number) {
    this._eventId.set(id);
  }
  private _eventId = signal<number>(0);
  private service = inject(MockService);

  participants = toSignal(
    toObservable(this._eventId).pipe(switchMap((id) => this.service.getParticipants(id))),
    { initialValue: [] }
  );
  newParticipant = signal<Participant>({ name: '', email: '', role: 'attendee' });
}
