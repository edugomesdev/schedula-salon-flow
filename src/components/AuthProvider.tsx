import { useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
// Import AuthContext and useAuth from the central location
import { AuthContext, AuthContextType } from '@/lib/auth'; // Assuming AuthContextType is also in lib/auth.ts or correctly typed there
import { supabaseBrowser } from '@/integrations/supabase/browserClient';
import { useToast } from '@/components/ui/use-toast';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null); // Add user state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabaseBrowser.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabaseBrowser.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthContextType = { // Ensure value matches AuthContextType
    session,
    user, // Provide user state
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth is already defined in and imported from '@/lib/auth', so no need to export here.
// AuthContext is also imported from '@/lib/auth'.
