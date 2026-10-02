// src/services/watermarker.ts

export interface WatermarkOptions {
  address: string;
  latitude: number;
  longitude: number;
}

export interface WatermarkResult {
  dataUrl: string; // webp base64 이미지
  blob: Blob;      // 서버 업로드용 Blob 객체
  timestamp: string;
}

/**
 * 이미지를 $600\times600$ 크기의 WebP 포맷으로 변환 및 압축합니다. (워터마크 제외)
 */
export async function applyWatermark(
  imageFile: File | string,
  _options: WatermarkOptions,
  targetWidth = 600,
  targetHeight = 600
): Promise<WatermarkResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timestamp = new Date().toISOString();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      // 이미지 비율 유지하면서 $600\times600$ 캔버스에 중앙 정렬하여 그리기 (Crop & Center)
      const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
      const x = (targetWidth / 2) - (img.width / 2) * scale;
      const y = (targetHeight / 2) - (img.height / 2) * scale;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // WebP 형식으로 압축 변환 (품질 $0.85$)
      const dataUrl = canvas.toDataURL('image/webp', 0.85);

      // Base64를 서버 저장용 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              dataUrl,
              blob,
              timestamp,
            });
          } else {
            reject(new Error('WebP Blob 변환에 실패했습니다.'));
          }
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = (err) => reject(err);

    if (typeof imageFile === 'string') {
      img.src = imageFile;
    } else {
      img.src = URL.createObjectURL(imageFile);
    }
  });
}