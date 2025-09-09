import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedUserTypes: ('client' | 'vendor')[];
  fallbackRoute?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedUserTypes,
  fallbackRoute = '/'
}) => {
  const { user, loading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      const fetchUserType = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user type:', error);
            toast.error('Failed to verify user permissions');
            return;
          }

          setUserType(data?.user_type || null);
        } catch (error) {
          console.error('Error:', error);
          toast.error('Authentication error');
        } finally {
          setCheckingRole(false);
        }
      };

      fetchUserType();
    } else if (!loading) {
      setCheckingRole(false);
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userType && !allowedUserTypes.includes(userType as 'client' | 'vendor')) {
    // Show error message for wrong account type
    toast.error(`Access denied. This area is for ${allowedUserTypes.join(' and ')} accounts only.`);
    
    // Redirect based on user type
    const redirectTo = userType === 'vendor' ? '/vendor-dashboard' : '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};