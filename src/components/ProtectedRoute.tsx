import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredUserType?: 'client' | 'vendor';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredUserType,
  redirectTo = '/'
}) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
            navigate(redirectTo);
            return;
          }

          const dbUserType = data?.user_type;
          setUserType(dbUserType);

          // Check if user has required role
          if (requiredUserType && dbUserType !== requiredUserType) {
            toast.error(`Access denied. This area is for ${requiredUserType}s only.`);
            // Redirect to appropriate dashboard
            if (dbUserType === 'client') {
              navigate('/dashboard');
            } else if (dbUserType === 'vendor') {
              navigate('/vendor-dashboard');
            } else {
              navigate(redirectTo);
            }
          }
        } catch (error) {
          console.error('Error verifying user role:', error);
          toast.error('Authentication error');
          navigate(redirectTo);
        } finally {
          setCheckingRole(false);
        }
      };

      fetchUserType();
    } else if (!loading && !user) {
      navigate(redirectTo);
    } else if (!loading) {
      setCheckingRole(false);
    }
  }, [user, loading, requiredUserType, navigate, redirectTo]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredUserType && userType !== requiredUserType) {
    return null;
  }

  return <>{children}</>;
};