import type { MetadataRoute } from 'next';

/** Installable PWA (mobile-first, CLAUDE.md section 1). Icons are added with the brand assets. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EBike DMS',
    short_name: 'EBike DMS',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f766e',
    icons: [],
  };
}
