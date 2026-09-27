import { SurveyData, SurveyLocationRow } from '../types/survey';
import { supabase } from './supabase';

const TABLE_NAME = 'survey_locations';
const STORAGE_BUCKET = 'survey-photos';
const SIGNED_URL_EXPIRATION = 60 * 60; // 1 hour

export async function uploadSurveyPhoto(photoBlob: Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, photoBlob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error('Failed to upload survey photo');
  }

  return data.path;
}

export async function saveSurvey(
  survey: Omit<SurveyData, 'id' | 'created_at'>,
  stampedPhotoBlob?: Blob
): Promise<SurveyData> {
  try {
    let stampedPhotoUrl: string | null = null;

    if (stampedPhotoBlob) {
      stampedPhotoUrl = await uploadSurveyPhoto(stampedPhotoBlob, `representative/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`);
    }

    const surveyLocationRow: SurveyLocationRow = {
      facility_name: survey.facility_name,
      latitude: survey.latitude,
      longitude: survey.longitude,
      accuracy: survey.accuracy,
      address: survey.address,
      stamped_photo_path: stampedPhotoUrl,
      review_note: survey.memo,
      taken_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([surveyLocationRow])
      .select();

    if (error) {
      throw new Error('Failed to save survey');
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid data received from Supabase');
    }

    const savedSurvey = data[0];
    saveToLocalStorage(savedSurvey);
    return savedSurvey;
  } catch (error) {
    console.error('Error saving survey:', error);
    throw error;
  }
}

export async function getSurveys(): Promise<SurveyData[]> {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase DB 조회 오류, 로컬 캐시를 반환합니다:', error);
      return getFromLocalStorage();
    }

    if (!data || !Array.isArray(data)) {
      throw new Error('Invalid data received from Supabase');
    }

    const surveys: SurveyData[] = await Promise.all(data.map(async (row) => {
      let photoUrl: string | undefined = undefined;

      if (row.stamped_photo_path) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(row.stamped_photo_path, SIGNED_URL_EXPIRATION);

        if (!signedUrlError && signedUrlData && signedUrlData.signedUrl) {
          photoUrl = signedUrlData.signedUrl;
        }
      }

      return {
        id: row.id,
        facility_name: row.facility_name,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy: row.accuracy,
        address: row.address,
        memo: row.review_note,
        photo_url: photoUrl,
        created_at: row.created_at,
      };
    }));

    return surveys;
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return getFromLocalStorage();
  }
}

function saveToLocalStorage(record: SurveyData) {
  try {
    const existing = getFromLocalStorage();
    const updated = [record, ...existing.filter((item) => item.id !== record.id)];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('로컬 스토리지 저장 실패:', e);
  }
}

function getFromLocalStorage(): SurveyData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const LOCAL_STORAGE_KEY = 'survey_data';
