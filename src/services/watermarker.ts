import { WatermarkOptions } from '../types/survey';

export interface WatermarkResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * 모바일 카메라 사진에 주소, 위도, 경도, 촬영시각을 시각적으로 합성하는 Canvas 엔진
 */
export async function applyWatermark(
  file: File | Blob,
  options: WatermarkOptions
): Promise<WatermarkResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진 파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지 디코딩에 실패했습니다.'));
      img.onload = () => {
        try {
          // 모바일 메모리 및 전송 속도 최적화를 위한 최대 해상도 조정 (Full HD 기준)
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;
          let { width, height } = img;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            if (width > height) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            } else {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas 2D context를 생성할 수 없습니다.');
          }

          // 1. 원본 이미지 렌더링
          ctx.drawImage(img, 0, 0, width, height);

          // 2. 워터마크 정보 준비
          const timestamp = options.timestamp || new Date();
          const dateStr = formatDateTime(timestamp);
          const latStr = `${options.latitude.toFixed(6)}°`;
          const lngStr = `${options.longitude.toFixed(6)}°`;

          const lines: string[] = [
            `📍 주소: ${options.address || '주소 정보 없음'}`,
            `🌐 좌표: 위도 ${latStr} / 경도 ${lngStr}`,
            `🕒 일시: ${dateStr}`,
          ];

          if (options.facilityName) {
            lines.unshift(`🏢 시설: ${options.facilityName}`);
          }
          if (options.surveyor) {
            lines.push(`👤 조사자: ${options.surveyor}`);
          }

          // 3. 해상도 비례 폰트 및 레이아웃 계산
          const baseFontSize = Math.max(18, Math.round(width * 0.024));
          const lineHeight = baseFontSize * 1.45;
          const padding = baseFontSize * 1.0;
          const bannerHeight = lines.length * lineHeight + padding * 2;

          // 4. 하단 반투명 검정 오버레이 배너
          ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
          ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

          // 상단 구분선 (포인트 색상)
          ctx.fillStyle = '#3880ff';
          ctx.fillRect(0, height - bannerHeight, width, Math.max(3, Math.round(baseFontSize * 0.12)));

          // 5. 텍스트 그리기
          ctx.fillStyle = '#ffffff';
          ctx.font = `600 ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          ctx.textBaseline = 'top';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;

          lines.forEach((line, index) => {
            const y = height - bannerHeight + padding + index * lineHeight;
            ctx.fillText(line, padding, y, width - padding * 2);
          });

          // 6. JPEG Blob 변환 (품질 85%)
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob 변환에 실패했습니다.'));
                return;
              }
              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              resolve({
                blob,
                dataUrl,
                width,
                height,
              });
            },
            'image/jpeg',
            0.85
          );
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
