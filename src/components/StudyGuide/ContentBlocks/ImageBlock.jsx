import React, { memo, useState } from 'react';
import { Image as ImageIcon, ZoomIn, X } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * ImageBlock Component
 * Renders image content with optional lightbox zoom
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text (image URL or description), imageUrl }
 * @param {boolean} props.darkMode - Dark mode flag
 */
const ImageBlock = memo(({ content, darkMode }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = content?.imageUrl || content?.text || '';
  const title = content?.title || '';
  const description = content?.description || '';

  if (!imageUrl || imageError) {
    return (
      <div
        className={cn(
          "rounded-2xl p-6 border text-center",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        <ImageIcon
          className={cn(
            "w-12 h-12 mx-auto mb-2 opacity-50",
            darkMode ? "text-slate-500" : "text-slate-400"
          )}
        />
        <p
          className={cn(
            "text-sm",
            darkMode ? "text-slate-400" : "text-slate-500"
          )}
        >
          {imageError ? 'Image failed to load' : 'No image available'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "rounded-2xl overflow-hidden border",
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
        )}
      >
        {/* Image Title */}
        {title && (
          <div
            className={cn(
              "px-4 py-3 border-b flex items-center gap-2",
              darkMode ? "border-slate-700" : "border-slate-200"
            )}
          >
            <ImageIcon
              className={cn(
                "w-5 h-5",
                darkMode ? "text-slate-400" : "text-slate-600"
              )}
            />
            <span
              className={cn(
                "font-medium",
                darkMode ? "text-white" : "text-slate-800"
              )}
            >
              {title}
            </span>
          </div>
        )}

        {/* Image Container */}
        <div
          className="relative group cursor-pointer"
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={imageUrl}
            alt={title || 'Study content'}
            className="w-full h-auto"
            onError={() => setImageError(true)}
          />
          {/* Zoom overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
              <ZoomIn className="w-6 h-6 text-slate-700" />
            </div>
          </div>
        </div>

        {/* Description */}
        {description && (
          <div
            className={cn(
              "px-4 py-3 border-t",
              darkMode ? "border-slate-700" : "border-slate-200"
            )}
          >
            <p
              className={cn(
                "text-sm",
                darkMode ? "text-slate-400" : "text-slate-600"
              )}
            >
              {description}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageUrl}
            alt={title || 'Study content'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
});

ImageBlock.displayName = 'ImageBlock';

export default ImageBlock;
