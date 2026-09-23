import { GeocodingResult } from '../types/survey';

/**
 * OpenStreetMap Nominatim API를 사용한 좌표 -> 한글 주소 변환 (Reverse Geocoding)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'ko',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      // Nominatim 반환 주소 중 유의미한 주소 포맷 구성
      const addr = data.address || {};
      const parts = [
        addr.province || addr.state || addr.city,
        addr.city_district || addr.district || addr.suburb || addr.town,
        addr.road ? `${addr.road} ${addr.house_number || ''}`.trim() : addr.neighbourhood,
        addr.village,
      ].filter(Boolean);

      const formattedAddress = parts.length > 0 ? parts.join(' ') : data.display_name;

      return {
        address: formattedAddress,
        roadAddress: addr.road ? `${addr.road} ${addr.house_number || ''}`.trim() : undefined,
        raw: data,
      };
    }

    return {
      address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      address: `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)} (주소 자동조회 불가)`,
    };
  }
}
