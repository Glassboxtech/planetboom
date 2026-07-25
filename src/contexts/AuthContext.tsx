import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'super_admin' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  assignedNeighborhoodId: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, inviteToken?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [assignedNeighborhoodId, setAssignedNeighborhoodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role, neighborhood_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching user role:', error);
      else console.error('Failed to fetch user role');
      return { role: null as UserRole, neighborhoodId: null as string | null };
    }

    return {
      role: (data?.role as UserRole) ?? null,
      neighborhoodId: (data?.neighborhood_id as string | null) ?? null,
    };
  };

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const { role: userRole, neighborhoodId } = await fetchUserRole(session.user.id);
            setRole(userRole);
            setAssignedNeighborhoodId(neighborhoodId);
          }, 0);
        } else {
          setRole(null);
          setAssignedNeighborhoodId(null);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { role: userRole, neighborhoodId } = await fetchUserRole(session.user.id);
        setRole(userRole);
        setAssignedNeighborhoodId(neighborhoodId);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string, _inviteToken?: string) => {
    // Note: inviteToken is now handled separately via edge function after email verification
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return { error: error as Error };

    // Role assignment is now handled server-side via accept-invitation edge function
    // This happens after the user verifies their email and logs in
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setAssignedNeighborhoodId(null);
  };

  const value = {
    user,
    session,
    role,
    assignedNeighborhoodId,
    isLoading,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
