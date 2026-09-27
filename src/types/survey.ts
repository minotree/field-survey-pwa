export interface SurveyData {
  id?: string;
  created_at?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  address: string;
  original_photo_path?: string;
  stamped_photo_path?: string;
  taken_at: string;
  review_status?: 'pending' | 'approved' | 'rejected';
  review_note?: string;
  linked_site_id?: string;
  created_by?: string;
  updated_at?: string;
}
