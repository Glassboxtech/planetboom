import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SiteSettings {
  id: string;
  app_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  favicon_url: string | null;
  foreground_color: string | null;
  muted_color: string | null;
  font_family: string | null;
}

export function useSiteSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SiteSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<SiteSettings, 'id'>>) => {
      if (!settings?.id) throw new Error('No settings found');
      const { error } = await supabase
        .from('site_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });

  return { settings, isLoading, updateSettings };
}
