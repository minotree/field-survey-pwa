import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import MapView from '../components/MapView';
import CameraCapture from '../components/CameraCapture';
import PhotoPreview from '../components/PhotoPreview';
import { reverseGeocode } from '../services/geocoding';
import { getCurrentPosition } from '../services/geolocation';
import { Coordinates } from '../types/survey';

const SurveyPage: React.FC = () => {
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState<Date>(new Date());

  const handleCapture = (file: File) => {
    setCapturedFile(file);
    setTakenAt(new Date());
  };

  const handleGetCurrentLocation = useCallback(async () => {
    try {
      const position = await getCurrentPosition();
      setCoordinates(position);
      if (position) {
        const result = await reverseGeocode(position.latitude, position.longitude);
        setAddress(result.address);
      }
    } catch (error) {
      alert(error.message);
    }
  }, []);

  useEffect(() => {
    handleGetCurrentLocation();
  }, [handleGetCurrentLocation]);

  const handleRetake = () => {
    setCapturedFile(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Survey Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <MapView />
        {capturedFile ? (
          <PhotoPreview
            file={capturedFile}
            latitude={coordinates?.latitude || 0}
            longitude={coordinates?.longitude || 0}
            address={address || ''}
            takenAt={takenAt}
            onRetake={handleRetake}
          />
        ) : (
          <CameraCapture onCapture={handleCapture} />
        )}
        {capturedFile && (
          <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
            촬영된 파일: {capturedFile.name}
          </IonText>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SurveyPage;
