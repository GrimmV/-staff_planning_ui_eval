import type { Klient, Mitarbeiter } from '$lib/types';

export const mitarbeiter: Mitarbeiter = {
  id: '1',
  name: 'Niklas Hartmann',
  verfuegbar_bis: '21. März',
  zeitfenster: 'bis 13 Uhr',
  qualifikationen: ['Pflege', 'Diabetes'],
  klient_erfahrung: [
    { name: 'Julia Schmid', tage: 6 },
    { name: 'Jonas Huber', tage: 11 }
  ],
  schule_erfahrung: [
    { name: 'Meier-Schule', tage: 4 },
    { name: 'Müller-Schule', tage: 14 }
  ],
  schulen: {
    'Meier-Schule': 23,
    'Müller-Schule': 35
  }
};

export const klient: Klient = {
  id: '1',
  name: 'Sarah Meier',
  nicht_vertreten_bis: '25. März',
  anwesenheit: '7:40 bis 12:55 Uhr',
  qualifikationen: [],
  schule: 'Müller-Schule',
  prioritaet: 'Hoch'
};

export const alternativeKlienten: Klient[] = [
  {
    id: '2',
    name: 'Julia Schmid',
    nicht_vertreten_bis: '22. März',
    anwesenheit: '8:00 bis 12:00 Uhr',
    qualifikationen: ['Pflege'],
    schule: 'Meier-Schule',
    prioritaet: 'Mittel'
  },
  {
    id: '3',
    name: 'Jonas Huber',
    nicht_vertreten_bis: '23. März',
    anwesenheit: '9:15 bis 13:00 Uhr',
    qualifikationen: ['Diabetes', 'Erste Hilfe'],
    schule: 'Müller-Schule',
    prioritaet: 'Niedrig'
  },
  {
    id: '4',
    name: 'Jakob Maier',
    nicht_vertreten_bis: '24. März',
    anwesenheit: '7:45 bis 12:30 Uhr',
    qualifikationen: ['Pflege', 'Mobilitätstraining'],
    schule: 'Meier-Schule',
    prioritaet: 'Mittel'
  }
];

export const recommendations = [
  {
    mitarbeiter,
    klient,
    alternativeKlienten
  },
  {
    mitarbeiter,
    klient,
    alternativeKlienten
  }
];

