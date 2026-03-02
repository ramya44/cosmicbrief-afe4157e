/**
 * Exports a chart SVG element as a PNG image with branding
 */

const BRANDING_HEIGHT = 60;
const SCALE_FACTOR = 2; // For retina quality
const BRAND_BG_COLOR = '#0f0f1a';
const BRAND_TEXT_COLOR = '#d4af37';

export type ShareResult =
  | { type: 'shared' }
  | { type: 'downloaded' }
  | { type: 'cancelled' }
  | { type: 'save-prompt'; imageUrl: string };

/**
 * Detect if running in an in-app browser (Instagram, Facebook, etc.)
 */
function isInAppBrowser(): boolean {
  const ua = navigator.userAgent || navigator.vendor || '';

  // Common in-app browser indicators
  const inAppIndicators = [
    'FBAN',      // Facebook App
    'FBAV',      // Facebook App Version
    'Instagram', // Instagram
    'Twitter',   // Twitter/X
    'Line',      // Line
    'KAKAOTALK', // KakaoTalk
    'Snapchat',  // Snapchat
    'Pinterest', // Pinterest
    'LinkedIn',  // LinkedIn
  ];

  return inAppIndicators.some(indicator => ua.includes(indicator));
}

/**
 * Check if Web Share API with files is supported
 */
function canShareFiles(): boolean {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  // Create a test file to check if file sharing is supported
  try {
    const testFile = new File(['test'], 'test.png', { type: 'image/png' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export async function exportChartAsImage(
  svgElement: SVGElement,
  chartName: string
): Promise<Blob> {
  // Get SVG dimensions
  const svgRect = svgElement.getBoundingClientRect();
  const width = svgRect.width * SCALE_FACTOR;
  const height = svgRect.height * SCALE_FACTOR;
  const totalHeight = height + (BRANDING_HEIGHT * SCALE_FACTOR);

  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true) as SVGElement;

  // Set explicit dimensions on the SVG
  clonedSvg.setAttribute('width', String(width));
  clonedSvg.setAttribute('height', String(height));

  // Ensure SVG has a background
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#0f172a');
  clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

  // Serialize SVG to string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Fix any namespace issues
  if (!svgString.includes('xmlns')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Create a data URL from the SVG
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // Create an image from the SVG
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill background
      ctx.fillStyle = BRAND_BG_COLOR;
      ctx.fillRect(0, 0, width, totalHeight);

      // Draw the SVG image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw branding section
      const brandingY = height;

      // Draw separator line
      ctx.strokeStyle = BRAND_TEXT_COLOR;
      ctx.lineWidth = 1 * SCALE_FACTOR;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(width * 0.2, brandingY + 10 * SCALE_FACTOR);
      ctx.lineTo(width * 0.8, brandingY + 10 * SCALE_FACTOR);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw branding text
      ctx.fillStyle = BRAND_TEXT_COLOR;
      ctx.font = `${16 * SCALE_FACTOR}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw sparkle and URL
      const brandY = brandingY + (BRANDING_HEIGHT * SCALE_FACTOR / 2) + 5 * SCALE_FACTOR;
      ctx.fillText('✧ cosmicbrief.com ✧', width / 2, brandY);

      // Draw chart name (smaller, above URL)
      ctx.font = `${11 * SCALE_FACTOR}px system-ui, -apple-system, sans-serif`;
      ctx.globalAlpha = 0.7;
      ctx.fillText(chartName, width / 2, brandY - 20 * SCALE_FACTOR);
      ctx.globalAlpha = 1;

      // Clean up
      URL.revokeObjectURL(svgUrl);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/png',
        1.0
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG image'));
    };

    img.src = svgUrl;
  });
}

export async function shareOrDownloadChart(
  svgElement: SVGElement,
  chartName: string,
  fileName: string
): Promise<ShareResult> {
  const blob = await exportChartAsImage(svgElement, chartName);
  const file = new File([blob], fileName, { type: 'image/png' });

  // Check if we're in an in-app browser (Instagram, Facebook, etc.)
  // These often don't support Web Share API properly
  const inApp = isInAppBrowser();

  // Try native share on mobile (if not in-app browser and file sharing is supported)
  if (!inApp && canShareFiles()) {
    try {
      await navigator.share({
        files: [file],
        title: `My ${chartName} | Cosmic Brief`,
        text: 'Check out my birth chart from Cosmic Brief!',
      });
      return { type: 'shared' };
    } catch (err) {
      // User cancelled
      if ((err as Error).name === 'AbortError') {
        return { type: 'cancelled' };
      }
      // Other error - fall through to alternatives
    }
  }

  // Check if we're on iOS (for save prompt fallback)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // On iOS in-app browsers or older iOS: show save prompt
  if (isIOS && (inApp || !canShareFiles())) {
    const imageUrl = URL.createObjectURL(blob);
    return { type: 'save-prompt', imageUrl };
  }

  // Desktop or Android fallback: download the image
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return { type: 'downloaded' };
}
