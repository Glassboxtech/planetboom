import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInvitations } from '@/hooks/useInvitations';
import { useMembers } from '@/hooks/useMembers';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Copy, Trash2, Plus, MapPin, Users, Loader2, Map } from 'lucide-react';
import { toast } from 'sonner';
import { NeighborhoodMap } from '@/components/NeighborhoodMap';

export default function Admin() {
  const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
  const { invitations, sendInvitation, deleteInvitation } = useInvitations();
  const { neighborhoods, addNeighborhood, members } = useMembers();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'admin'>('admin');
  const [isInviting, setIsInviting] = useState(false);

  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [isAddingNeighborhood, setIsAddingNeighborhood] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    await sendInvitation(inviteEmail.trim(), inviteRole, user.id);
    setInviteEmail('');
    setIsInviting(false);
  };

  const handleAddNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeighborhood.trim()) return;

    setIsAddingNeighborhood(true);
    await addNeighborhood(
      newNeighborhood.trim(),
      newLat ? parseFloat(newLat) : undefined,
      newLng ? parseFloat(newLng) : undefined
    );
    setNewNeighborhood('');
    setNewLat('');
    setNewLng('');
    setIsAddingNeighborhood(false);
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/signup?invite=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  // Calculate neighborhood stats
  const neighborhoodStats = neighborhoods.map((n) => ({
    ...n,
    memberCount: members.filter((m) => m.neighborhood_id === n.id).length,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage invitations and neighborhoods
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="neighborhoods">Neighborhoods</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Member Density Map
                </CardTitle>
                <CardDescription>
                  Geographic distribution of youth members across neighborhoods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NeighborhoodMap neighborhoods={neighborhoodStats} />
                <div className="mt-4 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-blue-500/50 border border-blue-500" />
                    <span>Low density</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-orange-500/50 border border-orange-500" />
                    <span>Medium density</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-red-500/50 border border-red-500" />
                    <span>High density</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{members.length}</div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{neighborhoods.length}</div>
                  <p className="text-sm text-muted-foreground">Neighborhoods</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {neighborhoodStats.filter(n => n.latitude && n.longitude).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Mapped Areas</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {members.filter(m => m.type === 'regular').length}
                  </div>
                  <p className="text-sm text-muted-foreground">Regular Members</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="invitations" className="space-y-6">
            {/* Send Invitation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Invite New Admin
                </CardTitle>
                <CardDescription>
                  Send an invitation link to add new admins to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as 'super_admin' | 'admin')}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    disabled={!inviteEmail.trim() || isInviting}
                    className="gradient-warm"
                  >
                    {isInviting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Invitations List */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                {invitations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No invitations yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invitations.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">{inv.email}</TableCell>
                          <TableCell className="capitalize">
                            {inv.role.replace('_', ' ')}
                          </TableCell>
                          <TableCell>
                            {inv.accepted_at ? (
                              <span className="text-green-600">Accepted</span>
                            ) : new Date(inv.expires_at) < new Date() ? (
                              <span className="text-red-600">Expired</span>
                            ) : (
                              <span className="text-yellow-600">Pending</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(inv.expires_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            {!inv.accepted_at && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyInviteLink(inv.token)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteInvitation(inv.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="neighborhoods" className="space-y-6">
            {/* Add Neighborhood */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Add Neighborhood
                </CardTitle>
                <CardDescription>
                  Add new neighborhoods for member location tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddNeighborhood} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="neighborhoodName">Name *</Label>
                      <Input
                        id="neighborhoodName"
                        placeholder="e.g., Woodstock"
                        value={newNeighborhood}
                        onChange={(e) => setNewNeighborhood(e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-32 space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        placeholder="-33.9"
                        value={newLat}
                        onChange={(e) => setNewLat(e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-32 space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        placeholder="18.5"
                        value={newLng}
                        onChange={(e) => setNewLng(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={!newNeighborhood.trim() || isAddingNeighborhood}
                    className="gradient-warm"
                  >
                    {isAddingNeighborhood ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Neighborhood
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Neighborhood Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Neighborhoods Overview</CardTitle>
                <CardDescription>
                  Member distribution by neighborhood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {neighborhoodStats.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold">{n.name}</h3>
                      </div>
                      <p className="text-2xl font-bold">{n.memberCount}</p>
                      <p className="text-sm text-muted-foreground">members</p>
                      {n.latitude && n.longitude && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {n.latitude.toFixed(4)}, {n.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
