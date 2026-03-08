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

    if (settings.foreground_color) {
      root.style.setProperty('--foreground', settings.foreground_color);
      root.style.setProperty('--card-foreground', settings.foreground_color);
    }

    if (settings.muted_color) {
      root.style.setProperty('--muted-foreground', settings.muted_color);
    }

    if (settings.font_family) {
      root.style.setProperty('--font-family', settings.font_family);
      root.style.fontFamily = `${settings.font_family}, ui-sans-serif, system-ui, sans-serif`;
    }

    // Favicon
    if (settings.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.favicon_url;
    }

    // Document title
    if (settings.app_name) {
      document.title = settings.app_name;
    }

    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--success');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card-foreground');
      root.style.removeProperty('--muted-foreground');
      root.style.removeProperty('--font-family');
      root.style.fontFamily = '';
    };
  }, [settings]);

  return <>{children}</>;
}
