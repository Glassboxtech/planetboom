import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Palette, Type, Upload, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Branding() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name);
      setLogoUrl(settings.logo_url || '');
      setPrimaryColor(settings.primary_color || '');
      setAccentColor(settings.accent_color || '');
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeLogo = () => setLogoUrl('');

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
      <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-3 space-y-6">
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
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative group">
                      <img
                        src={logoUrl}
                        alt="Logo preview"
                        className="w-16 h-16 object-contain rounded-lg border border-border bg-muted p-1"
                      />
                      <button
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {logoUrl ? 'Replace' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>
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

        {/* Preview Column */}
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your branding will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="rounded-xl border border-border overflow-hidden"
                style={{ backgroundColor: 'hsl(220 20% 97%)' }}
              >
                {/* Preview Header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ background: `linear-gradient(135deg, hsl(${primaryColor || '220 75% 55%'}), hsl(${primaryColor || '220 75% 55%'} / 0.8))` }}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded bg-white/20 p-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                      {appName?.[0] || 'A'}
                    </div>
                  )}
                  <span className="text-white font-semibold text-sm truncate">
                    {appName || 'Your App'}
                  </span>
                </div>

                {/* Preview Body */}
                <div className="p-4 space-y-3">
                  {/* Nav items */}
                  <div className="space-y-1">
                    <div
                      className="text-xs font-medium px-2 py-1.5 rounded text-white"
                      style={{ backgroundColor: `hsl(${primaryColor || '220 75% 55%'})` }}
                    >
                      Dashboard
                    </div>
                    <div className="text-xs px-2 py-1.5 rounded text-gray-600">History</div>
                    <div className="text-xs px-2 py-1.5 rounded text-gray-600">Consent Forms</div>
                  </div>

                  {/* Stats preview */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <div className="text-[10px] text-gray-500">Members</div>
                      <div
                        className="text-lg font-bold"
                        style={{ color: `hsl(${primaryColor || '220 75% 55%'})` }}
                      >
                        24
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <div className="text-[10px] text-gray-500">Checked In</div>
                      <div
                        className="text-lg font-bold"
                        style={{ color: `hsl(${accentColor || '160 55% 42%'})` }}
                      >
                        18
                      </div>
                    </div>
                  </div>

                  {/* Button preview */}
                  <div
                    className="text-center text-xs text-white py-2 rounded-md font-medium"
                    style={{ backgroundColor: `hsl(${accentColor || '160 55% 42%'})` }}
                  >
                    Check In
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
