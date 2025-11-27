import { Link } from 'react-router-dom';
import { useState } from 'react';

// Import logo - Vite will handle this at build time
// If the file doesn't exist, the build will fail, but we can handle runtime errors
let logoUrl: string | null = null;

try {
  // Use Vite's import with ?url suffix to get the URL
  // This works if logo.png exists in src/assets/
  logoUrl = new URL('../assets/logo.png', import.meta.url).href;
} catch {
  // If import fails, logoUrl stays null and we'll show text only
  logoUrl = null;
}

export function Logo() {
  const [imageError, setImageError] = useState(false);
  const [hasLogo, setHasLogo] = useState(logoUrl !== null);

  // If logo URL is available, try to load it
  // If it fails to load, fall back to text
  const showImage = hasLogo && logoUrl && !imageError;

  return (
    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
      {showImage && logoUrl && (
        <img 
          src={logoUrl} 
          alt="CampMate logo" 
          // Changed from h-10 to h-16 to match navbar height
          // w-auto ensures aspect ratio is maintained
          className="h-20 w-auto object-contain"
          onError={() => {
            setImageError(true);
            setHasLogo(false);
          }}
        />
      )}
      {/* Increased text size from text-lg to text-2xl to match larger logo */}
      <span className="font-bold text-2xl text-green-700">
        CampMate
      </span>
    </Link>
  );
}