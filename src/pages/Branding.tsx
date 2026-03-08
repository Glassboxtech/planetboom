import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Palette, Type, Upload, X, Eye, Globe, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Raleway',
  'Source Sans 3',
  'DM Sans',
  'Space Grotesk',
  'Sora',
];

export default function Branding() {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [foregroundColor, setForegroundColor] = useState('');
  const [mutedColor, setMutedColor] = useState('');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [uploading, setUploading] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name);
      setLogoUrl(settings.logo_url || '');
      setFaviconUrl(settings.favicon_url || '');
      setPrimaryColor(settings.primary_color || '');
      setAccentColor(settings.accent_color || '');
      setForegroundColor(settings.foreground_color || '');
      setMutedColor(settings.muted_color || '');
      setFontFamily(settings.font_family || 'Inter');
    }
  }, [settings]);

  const uploadFile = async (
    file: File,
    prefix: string,
    setUrl: (url: string) => void,
    setLoading: (v: boolean) => void,
    maxSize = 2
  ) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be under ${maxSize}MB`);
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setUrl(publicUrl);
      toast.success(`${prefix === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, 'logo', setLogoUrl, setUploading);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file, 'favicon', setFaviconUrl, setUploadingFavicon, 1);
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        app_name: appName,
        logo_url: logoUrl || null,
        favicon_url: faviconUrl || null,
        primary_color: primaryColor,
        accent_color: accentColor,
        foreground_color: foregroundColor || null,
        muted_color: mutedColor || null,
        font_family: fontFamily,
      });
      toast.success('Branding updated successfully');
    } catch {
      toast.error('Failed to update branding');
    }
  };

  // Load Google Font for preview
  useEffect(() => {
    if (fontFamily && fontFamily !== 'Inter') {
      const id = `gfont-${fontFamily.replace(/\s+/g, '-')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [fontFamily]);

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
          {/* App Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                App Identity
              </CardTitle>
              <CardDescription>Set your organization name, logo and favicon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="appName">App Name</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g., Youth Check-In"
                />
              </div>

              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <div className="relative group">
                      <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-border bg-muted p-1" />
                      <button onClick={() => setLogoUrl('')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                      {logoUrl ? 'Replace' : 'Upload Logo'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Favicon
                </Label>
                <div className="flex items-center gap-3">
                  {faviconUrl ? (
                    <div className="relative group">
                      <img src={faviconUrl} alt="Favicon" className="w-10 h-10 object-contain rounded-md border border-border bg-muted p-0.5" />
                      <button onClick={() => setFaviconUrl('')} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-md border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input ref={faviconInputRef} type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={handleFaviconUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}>
                      {uploadingFavicon ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      {faviconUrl ? 'Replace' : 'Upload Favicon'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, ICO, SVG up to 1MB · Shows in browser tab</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography
              </CardTitle>
              <CardDescription>Choose the font used across the app</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select value={fontFamily} onValueChange={setFontFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily }}>
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>Customize theme colors (HSL format: "220 75% 55%")</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="220 75% 55%" />
                    <div className="w-10 h-10 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: `hsl(${primaryColor})` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input id="accentColor" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} placeholder="160 55% 42%" />
                    <div className="w-10 h-10 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: `hsl(${accentColor})` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="foregroundColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input id="foregroundColor" value={foregroundColor} onChange={(e) => setForegroundColor(e.target.value)} placeholder="222 47% 11%" />
                    <div className="w-10 h-10 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: `hsl(${foregroundColor || '222 47% 11%'})` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mutedColor">Muted Text Color</Label>
                  <div className="flex gap-2">
                    <Input id="mutedColor" value={mutedColor} onChange={(e) => setMutedColor(e.target.value)} placeholder="215 16% 47%" />
                    <div className="w-10 h-10 rounded-md border border-border flex-shrink-0" style={{ backgroundColor: `hsl(${mutedColor || '215 16% 47%'})` }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={updateSettings.isPending} className="gradient-warm">
            {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
                style={{ backgroundColor: 'hsl(220 20% 97%)', fontFamily: `${fontFamily}, sans-serif` }}
              >
                {/* Browser Tab Preview */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded text-[10px] text-gray-600 flex-1 max-w-[160px]">
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="" className="w-3 h-3 object-contain" />
                    ) : (
                      <Globe className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="truncate">{appName || 'Your App'}</span>
                  </div>
                </div>

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
                  <div className="space-y-1">
                    <div
                      className="text-xs font-medium px-2 py-1.5 rounded text-white"
                      style={{ backgroundColor: `hsl(${primaryColor || '220 75% 55%'})` }}
                    >
                      Dashboard
                    </div>
                    <div className="text-xs px-2 py-1.5 rounded" style={{ color: `hsl(${mutedColor || '215 16% 47%'})` }}>History</div>
                    <div className="text-xs px-2 py-1.5 rounded" style={{ color: `hsl(${mutedColor || '215 16% 47%'})` }}>Consent Forms</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <div className="text-[10px]" style={{ color: `hsl(${mutedColor || '215 16% 47%'})` }}>Members</div>
                      <div className="text-lg font-bold" style={{ color: `hsl(${primaryColor || '220 75% 55%'})` }}>24</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-2 bg-white">
                      <div className="text-[10px]" style={{ color: `hsl(${mutedColor || '215 16% 47%'})` }}>Checked In</div>
                      <div className="text-lg font-bold" style={{ color: `hsl(${accentColor || '160 55% 42%'})` }}>18</div>
                    </div>
                  </div>

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
