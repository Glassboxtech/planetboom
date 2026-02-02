import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Info } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    if (!isLoading && user) {
      // If user just signed in and has an invite token, process it
      if (inviteToken) {
        acceptInvitation(inviteToken);
      } else {
        navigate('/');
      }
    }
  }, [user, isLoading, navigate, inviteToken]);

  const acceptInvitation = async (token: string) => {
    try {
      const { data: { session } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getSession());
      
      if (!session?.access_token) {
        navigate('/');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/accept-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ inviteToken: token }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success(`Invitation accepted! You've been assigned the ${result.role?.replace('_', ' ')} role.`);
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to process invitation');
    }
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signUp(email, password, fullName, inviteToken || undefined);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please check your email to verify your account.');
      navigate('/login');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>
            {inviteToken
              ? 'Complete your signup to accept the invitation'
              : 'Sign up to start managing attendance'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inviteToken && (
            <Alert className="mb-4">
              <Info className="w-4 h-4" />
              <AlertDescription>
                You're signing up with an invitation. Your role will be assigned after email verification.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full gradient-warm" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <span>Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
