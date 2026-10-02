// src/services/surveyService.ts
import { SurveyData, SurveyLocationRow } from '../types/survey';
import { supabase } from './supabase';

const TABLE_NAME = 'survey_locations';
const STORAGE_BUCKET = 'survey-photos';
const SIGNED_URL_EXPIRATION = 60 * 60; // 1시간

/**
 * WebP 처리된 이미지를 Supabase Storage에 업로드합니다.
 */
export async function uploadSurveyPhoto(photoBlob: Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, photoBlob, {
      contentType: 'image/webp', // WebP MIME 타입 지정
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('사진 업로드 실패:', error);
    throw new Error('현장 사진 업로드에 실패했습니다.');
  }

  return data.path;
}

/**
 * 새로운 조사 내역을 Supabase Storage 및 DB(survey_locations)에 저장합니다.
 */
export async function saveSurvey(
  survey: Omit<SurveyData, 'id' | 'created_at'>,
  stampedPhotoBlob?: Blob
): Promise<SurveyData> {
  try {
    let stampedPhotoUrl: string | null = null;

    if (stampedPhotoBlob) {
      // .webp 확장자로 Storage 경로 생성
      const fileName = `representative/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.webp`;
      stampedPhotoUrl = await uploadSurveyPhoto(stampedPhotoBlob, fileName);
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
      throw new Error(`Supabase 저장 오류: ${error.message}`);
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Supabase로부터 유효한 응답을 받지 못했습니다.');
    }

    const savedRow = data[0];

    // 저장 성공 후 Signed URL 생성하여 SurveyData 형태로 반환
    let photoUrl: string | undefined = undefined;
    if (savedRow.stamped_photo_path) {
      const { data: signedData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(savedRow.stamped_photo_path, SIGNED_URL_EXPIRATION);
      photoUrl = signedData?.signedUrl;
    }

    return {
      id: savedRow.id,
      facility_name: savedRow.facility_name,
      latitude: savedRow.latitude,
      longitude: savedRow.longitude,
      accuracy: savedRow.accuracy,
      address: savedRow.address,
      memo: savedRow.review_note,
      photo_url: photoUrl,
      created_at: savedRow.created_at,
    };
  } catch (error) {
    console.error('Error saving survey:', error);
    throw error;
  }
}

/**
 * Supabase에서 '오늘(00:00:00 시점 기준)' 등록된 조사 내역만 가져옵니다.
 */
export async function getTodaySurveys(): Promise<SurveyData[]> {
  try {
    // 오늘 자정 시각(00:00:00.000) 구하기
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .gte('created_at', todayStart.toISOString()) // 오늘 자정 이후 작성건
      .order('created_at', { ascending: false });   // 최신순 정렬

    if (error) {
      console.error('Supabase DB 조회 오류:', error);
      throw error;
    }

    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Storage 서명된 URL (Signed URL) 병렬 변환 처리
    const surveys: SurveyData[] = await Promise.all(
      data.map(async (row) => {
        let photoUrl: string | undefined = undefined;

        if (row.stamped_photo_path) {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(row.stamped_photo_path, SIGNED_URL_EXPIRATION);

          if (!signedUrlError && signedUrlData?.signedUrl) {
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
      })
    );

    return surveys;
  } catch (error) {
    console.error('Error fetching today surveys:', error);
    return [];
  }
}

// 기존 전체 불러오기 호환용 (필요 시)
export const getSurveys = getTodaySurveys;