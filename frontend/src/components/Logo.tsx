import { Link } from 'react-router-dom';
import { useState } from 'react';

let logoUrl: string | null = null;
try {
  logoUrl = new URL('../assets/logo.png', import.meta.url).href;
} catch {
  logoUrl = null;
}

export function Logo() {
  const [imageError, setImageError] = useState(false);
  const [hasLogo] = useState(logoUrl !== null);
  const showImage = hasLogo && logoUrl && !imageError;

  return (
    <Link to="/explore" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      {showImage && logoUrl && (
        <img
          src={logoUrl}
          alt="CampMate"
          className="h-9 w-auto object-contain"
          onError={() => setImageError(true)}
        />
      )}
      <span className="font-display font-bold text-base text-brand-900">
        CampMate
      </span>
    </Link>
  );
}
