import { SurveyData } from '../types/survey';
import { createClient } from '@supabase/supabase-js';
import { getFromLocalStorage, saveToLocalStorage } from './localStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABLE_NAME = 'surveys';
const STORAGE_BUCKET = 'survey-photos';

export async function uploadSurveyPhoto(photoBlob: Blob): Promise<string> {
  const filename = `survey_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, photoBlob, {
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
  photoBlob?: Blob
): Promise<SurveyData> {
  try {
    let photoUrl: string | null = null;
    if (photoBlob) {
      photoUrl = await uploadSurveyPhoto(photoBlob);
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ ...survey, photo_url: photoUrl }])
      .select();

    if (error) {
      throw new Error('Failed to save survey');
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

    return data;
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
