export interface KlientErfahrung {
  name: string;
  tage: number;
}

export interface SchuleErfahrung {
  name: string;
  tage: number;
}

export interface Mitarbeiter {
  id: string;
  name: string;
  verfuegbar_bis: string;
  zeitfenster?: string;
  qualifikationen?: string[] | string;
  klient_erfahrung?: KlientErfahrung[];
  schule_erfahrung?: SchuleErfahrung[];
  schulen?: Record<string, number>;
}

export type Prioritaet = 'Niedrig' | 'Mittel' | 'Hoch' | string;

export interface Klient {
  id: string;
  name: string;
  nicht_vertreten_bis?: string;
  anwesenheit?: string;
  qualifikationen?: string[] | string;
  schule?: string;
  prioritaet?: Prioritaet;
}

export interface Zuordnung {
  fahrtzeit?: number | string;
}
export interface Recommendation {
  mitarbeiter: Mitarbeiter;
  klient: Klient;
  alternativeKlienten?: Klient[];
}
