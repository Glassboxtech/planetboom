import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;

    if (settings.primary_color) {
      root.style.setProperty('--primary', settings.primary_color);
      root.style.setProperty('--ring', settings.primary_color);
      root.style.setProperty('--sidebar-primary', settings.primary_color);
      root.style.setProperty('--sidebar-ring', settings.primary_color);
    }

    if (settings.accent_color) {
      root.style.setProperty('--accent', settings.accent_color);
      root.style.setProperty('--success', settings.accent_color);
    }

    return () => {
      // Clean up inline styles on unmount so defaults take over
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--success');
    };
  }, [settings]);

  return <>{children}</>;
}
