import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IonContent, IonText, IonButton, IonLoading } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '../services/geolocation';
import { reverseGeocode } from '../services/geocoding';

interface Center {
  lat: number;
  lng: number;
}

const MapView: React.FC = () => {
  const [center, setCenter] = useState<Center>({ lat: 37.5665, lng: 126.9780 });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const mapRef = useRef<L.Map | null>(null);

  const handleGetCurrentLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      setCenter({ lat: position.latitude, lng: position.longitude });
      setAccuracy(position.accuracy);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('현재 위치를 가져오는 중 오류가 발생했습니다.');
      }
    }
  }, []);

  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const result = await reverseGeocode(lat, lng);
      setAddress(result.address);
    } catch (error) {
      console.error('주소 조회 중 오류가 발생했습니다:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('moveend', () => {
        const newCenter = mapRef.current!.getCenter();
        setCenter({ lat: newCenter.lat, lng: newCenter.lng });
        fetchAddress(newCenter.lat, newCenter.lng);
      });
    }
  }, [fetchAddress]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: center,
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      const marker = L.marker(center).addTo(mapRef.current);
      marker.bindPopup('Center Pin').openPopup();
    }
  }, [center]);

  useEffect(() => {
    handleGetCurrentLocation();
  }, [handleGetCurrentLocation]);

  return (
    <IonContent>
      <IonLoading isOpen={loading} message="주소 조회 중..." />
      <div id="map" style={{ height: '55vh' }} />
      <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
        Latitude: {center.lat.toFixed(6)}, Longitude: {center.lng.toFixed(6)}
      </IonText>
      {accuracy !== null && (
        <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
          Accuracy: ±{accuracy} m
        </IonText>
      )}
      {address && (
        <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
          Address: {address}
        </IonText>
      )}
      <IonButton expand="block" onClick={handleGetCurrentLocation} style={{ marginTop: '10px' }}>
        현재 위치
      </IonButton>
    </IonContent>
  );
};

export default MapView;
