import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonText, IonButton } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCurrentPosition } from '../services/geolocation';

const MapView: React.FC = () => {
  const [center, setCenter] = useState<L.LatLng>({ lat: 37.5665, lng: 126.9780 });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('moveend', () => {
        const newCenter = mapRef.current!.getCenter();
        setCenter(newCenter);
      });
    }
  }, []);

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

  const handleGetCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      setCenter({ lat: position.latitude, lng: position.longitude });
      setAccuracy(position.accuracy);
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    handleGetCurrentLocation();
  }, []);

  return (
    <IonContent>
      <div id="map" style={{ height: '55vh' }} />
      <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
        Latitude: {center.lat.toFixed(6)}, Longitude: {center.lng.toFixed(6)}
      </IonText>
      {accuracy !== null && (
        <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
          Accuracy: ±{accuracy} m
        </IonText>
      )}
      <IonButton expand="block" onClick={handleGetCurrentLocation} style={{ marginTop: '10px' }}>
        현재 위치
      </IonButton>
    </IonContent>
  );
};

export default MapView;
