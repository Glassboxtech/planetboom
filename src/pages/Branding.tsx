import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Type, Image } from 'lucide-react';
import { toast } from 'sonner';

export default function Branding() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name);
      setLogoUrl(settings.logo_url || '');
      setPrimaryColor(settings.primary_color || '');
      setAccentColor(settings.accent_color || '');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        app_name: appName,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        accent_color: accentColor,
      });
      toast.success('Branding updated successfully');
    } catch {
      toast.error('Failed to update branding');
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Branding" requireSuperAdmin>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Branding" subtitle="Customize your app's identity" requireSuperAdmin>
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              App Identity
            </CardTitle>
            <CardDescription>Set your organization name and logo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name</Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g., Youth Check-In"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">Enter a URL to your logo image</p>
            </div>
            {logoUrl && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Image className="w-4 h-4 text-muted-foreground" />
                <img src={logoUrl} alt="Logo preview" className="w-10 h-10 object-contain rounded" />
                <span className="text-sm text-muted-foreground">Logo preview</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>Customize the primary and accent colors (HSL format: "220 75% 55%")</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color (HSL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="220 75% 55%"
                  />
                  <div
                    className="w-10 h-10 rounded-md border border-border flex-shrink-0"
                    style={{ backgroundColor: `hsl(${primaryColor})` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color (HSL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    placeholder="160 55% 42%"
                  />
                  <div
                    className="w-10 h-10 rounded-md border border-border flex-shrink-0"
                    style={{ backgroundColor: `hsl(${accentColor})` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending}
          className="gradient-warm"
        >
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Save Changes
        </Button>
      </div>
    </AppLayout>
  );
}
