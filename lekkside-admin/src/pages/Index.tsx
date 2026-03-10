import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (!loading) {
        if (user) {
          // Check if user is an exhibitor
          if (user.user_metadata?.user_type === 'exhibitor') {
            try {
              const { data, error } = await supabase
                .from('exhibitors')
                .select('booth_id')
                .eq('user_id', user.id)
                .single();
              
              if (data?.booth_id) {
                navigate(`/exhibitor/dashboard/${data.booth_id}`);
                return;
              }
            } catch (error) {
              console.error('Error fetching exhibitor data:', error);
            }
          }
          
          // Default to admin dashboard for non-exhibitors
          navigate('/dashboard');
        } else {
          navigate('/auth');
        }
      }
    };

    checkUserRole();
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-primary-foreground font-semibold text-2xl">EC</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">EventCheck</h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
