import React, { useState, useEffect } from 'react';
import { IonContent, IonButton, IonText, IonImg } from '@ionic/react';

interface PhotoPreviewProps {
  file: Blob | File;
  latitude: number;
  longitude: number;
  address: string;
  takenAt: Date;
  onRetake: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ file, latitude, longitude, address, takenAt, onRetake }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <IonContent>
      {objectUrl && (
        <IonImg src={objectUrl} alt="Preview" style={{ width: '100%', height: 'auto', marginTop: '10px' }} />
      )}
      <IonButton expand="block" onClick={onRetake} style={{ marginTop: '10px' }}>
        재촬영
      </IonButton>
    </IonContent>
  );
};

export default PhotoPreview;
