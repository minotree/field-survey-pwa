import { supabase } from './supabase';
import { SurveyData } from '../types/survey';

const STORAGE_BUCKET = 'survey-photos';
const TABLE_NAME = 'facility_surveys';
const LOCAL_STORAGE_KEY = 'cached_field_surveys';

/**
 * Supabase Storage에 워터마크 합성 사진 업로드
 */
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
    console.error('Supabase Storage upload error:', error);
    throw new Error(`사진 업로드 실패: ${error.message} (버킷 '${STORAGE_BUCKET}' 생성 여부를 확인해 주세요)`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * 현장 조사 데이터를 Supabase DB와 Storage에 저장
 */
export async function saveSurvey(
  survey: Omit<SurveyData, 'id' | 'created_at'>,
  photoBlob?: Blob
): Promise<SurveyData> {
  let photoUrl = survey.photo_url;

  // 사진이 있으면 Storage에 먼저 업로드
  if (photoBlob) {
    photoUrl = await uploadSurveyPhoto(photoBlob);
  }

  const recordToInsert = {
    ...survey,
    photo_url: photoUrl,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([recordToInsert])
    .select()
    .single();

  if (error) {
    console.error('Supabase DB insert error:', error);
    // 오프라인 또는 테이블 미생성 시 로컬 스토리지에 백업 저장
    const localId = `local_${Date.now()}`;
    const localRecord: SurveyData = {
      ...recordToInsert,
      id: localId,
    };
    saveToLocalStorage(localRecord);
    throw new Error(`DB 저장 실패: ${error.message} (로컬 임시 저장됨)`);
  }

  // 성공 시 로컬에도 동기화 캐시
  saveToLocalStorage(data);
  return data;
}

/**
 * 저장된 현장 조사 목록 조회
 */
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

    if (data && data.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }

    return getFromLocalStorage();
  } catch (err) {
    console.warn('네트워크 오류, 로컬 캐시를 반환합니다:', err);
    return getFromLocalStorage();
  }
}

// 오프라인 로컬 캐시 헬퍼
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
