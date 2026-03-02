import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ChartSaveModalProps {
  imageUrl: string;
  onClose: () => void;
}

export const ChartSaveModal = ({ imageUrl, onClose }: ChartSaveModalProps) => {
  // Clean up blob URL when modal closes
  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-midnight border border-gold/30 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h3 className="text-cream font-display text-lg">Save Your Chart</h3>
          <button
            onClick={onClose}
            className="text-cream-muted hover:text-cream transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="p-4 bg-gold/10 border-b border-gold/20">
          <p className="text-cream text-sm text-center">
            <strong>Long press</strong> the image below to save it to your photos, then share to Instagram or other apps.
          </p>
        </div>

        {/* Image */}
        <div className="p-4 flex justify-center overflow-auto max-h-[60vh]">
          <img
            src={imageUrl}
            alt="Birth Chart"
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: '50vh' }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gold/20">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
