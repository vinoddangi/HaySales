import React from 'react';
import { Heart, Share2 } from 'lucide-react';

interface ProductHeaderProps {
  imageUrl: string;
  title: string;
  isFav: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export const ProductHeader: React.FC<ProductHeaderProps> = ({
  imageUrl,
  title,
  isFav,
  onToggleFavorite,
  onShare,
}) => {
  return (
    <div className="relative h-64 w-full bg-m3-surface-container-highest">
      <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Top Floating Actions */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button
          onClick={onToggleFavorite}
          className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <Heart
            className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </button>
        <button
          onClick={onShare}
          className="rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
