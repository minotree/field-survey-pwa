import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import MapView from '../components/MapView';
import CameraCapture from '../components/CameraCapture';

const SurveyPage: React.FC = () => {
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const handleCapture = (file: File) => {
    setCapturedFile(file);
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
        <CameraCapture onCapture={handleCapture} />
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
