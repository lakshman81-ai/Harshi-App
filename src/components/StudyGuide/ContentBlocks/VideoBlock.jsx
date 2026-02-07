import React, { memo, useState } from 'react';
import { Play, Check } from 'lucide-react';

const cn = (...classes) => classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

/**
 * VideoBlock Component
 * Renders embedded video content with optional mark as watched button
 *
 * @param {Object} props
 * @param {Object} props.content - Content object { title, text (video URL), videoUrl }
 * @param {boolean} props.darkMode - Dark mode flag
 * @param {Function} props.onWatched - Callback when video is marked as watched
 */
const VideoBlock = memo(({ content, darkMode, onWatched }) => {
  const [watched, setWatched] = useState(false);

  // Extract video URL from content
  const videoUrl = content?.videoUrl || content?.text || '';
  const title = content?.title || 'Video';

  // Convert YouTube URL to embed URL
  const getEmbedUrl = (url) => {
    if (!url) return '';

    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Handle already embedded URL
    if (url.includes('youtube.com/embed/')) {
      return url;
    }

    // Return original URL for other video sources
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  const handleMarkWatched = () => {
    setWatched(true);
    onWatched?.();
  };

  if (!embedUrl) return null;

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden border",
        darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      )}
    >
      {/* Video Title */}
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center gap-2",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}
      >
        <Play
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

      {/* Video Embed */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          src={embedUrl}
          title={title}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Mark as Watched Button */}
      <div
        className={cn(
          "px-4 py-3 border-t",
          darkMode ? "border-slate-700" : "border-slate-200"
        )}
      >
        <button
          onClick={handleMarkWatched}
          disabled={watched}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            watched
              ? "bg-emerald-100 text-emerald-700 cursor-default"
              : darkMode
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          )}
        >
          {watched ? (
            <>
              <Check className="w-4 h-4" />
              Watched
            </>
          ) : (
            "Mark as Watched"
          )}
        </button>
      </div>
    </div>
  );
});

VideoBlock.displayName = 'VideoBlock';

export default VideoBlock;
