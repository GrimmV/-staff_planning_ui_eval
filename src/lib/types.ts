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
export type FeldStatsValue = number | string | { [key: string]: number | string | FeldStatsValue };

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

export interface RelevantChange {
  relevant_spalte: string;
  änderung: string;
  effect: "positiv" | "negativ" | "neutral";
}

export interface SignificantAssignment {
  ma: string;
  relevant_changes: RelevantChange[];
  effect: "positiv" | "negativ" | "neutral";
}

export interface StatisticsChange {
  relevant_feature: string;
  änderung: string;
  effect: "positiv" | "negativ" | "neutral";
}

export interface StatisticsSummary {
  relevant_changes: StatisticsChange[];
  effect: "positiv" | "negativ" | "neutral";
}

export interface Assessment {
  score: "akzeptieren" | "eher akzeptieren" | "eher ablehnen" | "ablehnen";
  assessment: string;
  short_assessment: string;
  änderungen: SignificantAssignment[];
  statistiken: StatisticsSummary;
}

export interface DiffsResponse {
  nachher: object[];
  vorher: object[];
  stats: DiffStats;
  assessment: Assessment;
}