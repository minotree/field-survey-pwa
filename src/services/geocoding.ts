import { GeocodingResult } from '../types/survey';

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ko`;
  const response = await fetch(url, {
    headers: {
      'Accept-Language': 'ko',
    },
  });

  if (!response.ok) {
    throw new Error('Geocoding failed');
  }

  const data = await response.json();
  return {
    address: data.display_name,
    roadAddress: data.address.road,
    raw: data,
  };
}
