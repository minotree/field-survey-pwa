import React, { useState, useEffect, useRef } from 'react';
import { IonContent, IonText } from '@ionic/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapView: React.FC = () => {
  const [center, setCenter] = useState<L.LatLng>({ lat: 37.5665, lng: 126.9780 });
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

  return (
    <IonContent>
      <div id="map" style={{ height: '55vh' }} />
      <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
        Latitude: {center.lat.toFixed(6)}, Longitude: {center.lng.toFixed(6)}
      </IonText>
    </IonContent>
  );
};

export default MapView;
