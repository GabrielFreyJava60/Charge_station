export type StationStatus = 'NEW' | 'READY' | 'IN_USE' | 'OUT_OF_SERVICE' | 'TO_REMOVE';

export interface StationDto {
  stationId: string;
  name: string;
  lat?: number; // широта
  lng?: number; // долгота
  ports?: number;
  freePorts?: number;
  address?: string;
  status?: StationStatus;
}

