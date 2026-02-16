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

/** Stats for a single field: added vs removed (e.g. min/max/durchschnitt or counts) */
export type FeldStatsValue = number | { [key: string]: number | FeldStatsValue };

export interface FeldDiff {
  hinzugefügt?: Record<string, FeldStatsValue>;
  entfernt?: Record<string, FeldStatsValue>;
}

export interface DiffAnzahl {
  gesamt_vorher: number;
  gesamt_nachher: number;
  hinzugefügt: number;
  entfernt: number;
}

export interface DiffStats {
  felder: Record<string, FeldDiff>;
  anzahl: DiffAnzahl;
}

export interface SignificantAssignment {
  ma: string;
  spalten_namen: string[];
}

export interface Assessment {
  score: "akzeptiere" | "prüfen" | "ablehnen";
  assessment: string;
  short_assessment: string;
  significant_assignments: SignificantAssignment[];
}

export interface DiffsResponse {
  nachher: object[];
  vorher: object[];
  stats: DiffStats;
  assessment: Assessment;
}