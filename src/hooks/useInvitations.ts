import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  email: string;
  role: 'super_admin' | 'admin';
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function useInvitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isSuperAdmin } = useAuth();

  const fetchInvitations = useCallback(async () => {
    if (!isSuperAdmin) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
    } else {
      setInvitations(data as Invitation[]);
    }
    setIsLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const sendInvitation = useCallback(async (email: string, role: 'super_admin' | 'admin', invitedBy: string) => {
    const { data, error } = await supabase
      .from('invitations')
      .insert({ email, role, invited_by: invitedBy })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create invitation');
      return null;
    }

    setInvitations((prev) => [data as Invitation, ...prev]);
    
    // Generate invite URL
    const inviteUrl = `${window.location.origin}/signup?invite=${data.token}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(inviteUrl);
    toast.success('Invitation link copied to clipboard!');
    
    return data as Invitation;
  }, []);

  const deleteInvitation = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete invitation');
      return false;
    }

    setInvitations((prev) => prev.filter((i) => i.id !== id));
    toast.success('Invitation deleted');
    return true;
  }, []);

  return {
    invitations,
    isLoading,
    sendInvitation,
    deleteInvitation,
    refetch: fetchInvitations,
  };
}
