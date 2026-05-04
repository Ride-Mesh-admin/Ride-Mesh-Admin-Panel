export interface CriticalAlert {
  title: string;
  description: string;
  /** When set, the critical banner shows this primary action */
  buttonLabel?: string;
  count?: number;
  sector?: string;
}
