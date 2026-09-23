import React, { useRef, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonLoading,
  IonToast,
} from '@ionic/react';
import { applyWatermark, WatermarkResult } from '../../services/watermarker';
import { WatermarkOptions } from '../../types/survey';

interface CameraWatermarkProps {
  isOpen: boolean;
  options: WatermarkOptions;
  onClose: () => void;
  onPhotoReady: (result: WatermarkResult) => void;
}

export const CameraWatermarkModal: React.FC<CameraWatermarkProps> = ({
  isOpen,
  options,
  onClose,
  onPhotoReady,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<WatermarkResult | null>(null);

  const handleCaptureTrigger = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 사진에 주소, 위도, 경도, 촬영일시 합성 실행
      const result = await applyWatermark(file, options);
      setPreviewResult(result);
      setToastMessage('현장 메타데이터가 사진에 성공적으로 합성되었습니다.');
    } catch (err) {
      console.error('워터마크 합성 실패:', err);
      setToastMessage(err instanceof Error ? err.message : '사진 합성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPhoto = () => {
    if (previewResult) {
      onPhotoReady(previewResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreviewResult(null);
    onClose();
  };

  return (
    <>
      {/* iOS Safari 및 Android Chrome 표준 카메라 캡처 인풋 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>현장 사진 촬영</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleClose}>취소</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
            {previewResult ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700 }}>합성 사진 미리보기</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                    주소, 위/경도, 촬영시각이 사진 하단에 합성되었습니다.
                  </p>
                </div>

                <div
                  style={{
                    flex: 1,
                    width: '100%',
                    maxHeight: '65vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000000',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={previewResult.dataUrl}
                    alt="합성된 현장 사진"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '65vh',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '16px' }}>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="medium"
                    style={{ flex: 1 }}
                    onClick={handleCaptureTrigger}
                  >
                    다시 촬영
                  </IonButton>
                  <IonButton
                    expand="block"
                    color="success"
                    style={{ flex: 1 }}
                    onClick={handleConfirmPhoto}
                  >
                    이 사진 사용
                  </IonButton>
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '80%',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: '#e0f2fe',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    fontSize: '48px',
                  }}
                >
                  📷
                </div>
                <h2 style={{ margin: '0 0 8px', fontWeight: 700 }}>현장 시설 사진 촬영</h2>
                <p style={{ color: '#666', fontSize: '14px', maxWidth: '280px', lineHeight: 1.5 }}>
                  현재 보정된 시설 위치의 <strong>주소, 좌표, 촬영시각</strong>이 사진에 자동으로 합성됩니다.
                </p>

                <div
                  style={{
                    margin: '16px 0',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                    fontSize: '13px',
                    width: '100%',
                    maxWidth: '340px',
                  }}
                >
                  <div><strong>📍 적용 주소:</strong> {options.address}</div>
                  <div style={{ marginTop: '4px' }}>
                    <strong>🌐 적용 좌표:</strong> {options.latitude.toFixed(6)}, {options.longitude.toFixed(6)}
                  </div>
                </div>

                <IonButton
                  expand="block"
                  size="large"
                  style={{ width: '100%', maxWidth: '340px', marginTop: '16px' }}
                  onClick={handleCaptureTrigger}
                >
                  카메라 열기 / 사진 선택
                </IonButton>
              </div>
            )}
          </div>

          <IonLoading isOpen={loading} message="사진에 현장 정보 합성 중..." />
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage || ''}
            duration={2500}
            onDidDismiss={() => setToastMessage(null)}
          />
        </IonContent>
      </IonModal>
    </>
  );
};
