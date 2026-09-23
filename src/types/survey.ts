export interface SurveyData {
  id?: string;
  created_at?: string;
  facility_name: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  photo_url?: string;
  memo?: string;
  surveyor?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface WatermarkOptions {
  address: string;
  latitude: number;
  longitude: number;
  timestamp?: Date;
  facilityName?: string;
  surveyor?: string;
}

export interface GeocodingResult {
  address: string;
  roadAddress?: string;
  raw?: unknown;
}
