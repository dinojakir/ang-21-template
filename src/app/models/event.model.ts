export interface Participant {
  name: string;
  email: string;
  role: 'attendee' | 'speaker' | 'organizer';
}

export interface Event {
  id: number;
  date: Date;
  place: string;
  status: 'planned' | 'canceled' | 'completed';
  participants: Participant[];
}

export type EventStatus = Event['status'];