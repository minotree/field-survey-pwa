import React, { useState, useCallback } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonText } from '@ionic/react';
import MapView from '../components/MapView';
import CameraCapture from '../components/CameraCapture';
import PhotoPreview from '../components/PhotoPreview';
import { reverseGeocode } from '../services/geocoding';
import { getCurrentPosition } from '../services/geolocation';
import { Coordinates, SurveyData } from '../types/survey';
import { saveSurvey } from '../services/surveyService';

const SurveyPage: React.FC = () => {
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState<Date>(new Date());
  const [surveyDescription, setSurveyDescription] = useState<string>('');

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

  const handleSaveSurvey = useCallback(async () => {
    if (!coordinates || !address || !capturedFile) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    const surveyData: Omit<SurveyData, 'id' | 'created_at'> = {
      description: surveyDescription,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: address,
      taken_at: takenAt.toISOString(),
    };

    try {
      await saveSurvey(surveyData, capturedFile);
      alert('서베이가 성공적으로 저장되었습니다.');
      setCapturedFile(null);
      setSurveyDescription('');
    } catch (error) {
      alert('서베이 저장에 실패했습니다.');
    }
  }, [coordinates, address, capturedFile, surveyDescription]);

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
          <div>
            <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
              촬영된 파일: {capturedFile.name}
            </IonText>
            <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
              주소: {address || '주소를 불러오는 중...'}
            </IonText>
            <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
              GPS: {coordinates ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}` : 'GPS를 불러오는 중...'}
            </IonText>
            <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
              촬영일시: {takenAt.toLocaleString()}
            </IonText>
            <IonText style={{ textAlign: 'center', marginTop: '10px' }}>
              서베이 설명:
            </IonText>
            <textarea
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
              style={{ width: '100%', height: '100px', marginTop: '10px' }}
            />
            <IonButton expand="block" onClick={handleSaveSurvey} style={{ marginTop: '10px' }}>
              서베이 저장
            </IonButton>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SurveyPage;
