import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoaded: boolean; // NEW: tracks if profile fetch completed
  isAdmin: boolean;
  isCreator: boolean;
  isSponsor: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false); // NEW
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isSponsor, setIsSponsor] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    setProfile(data);
    setIsProfileLoaded(true); // Mark profile as loaded (even if null = no profile yet)
    return data;
  };

  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    const isAdminResult = data === true;
    setIsAdmin(isAdminResult);
    return isAdminResult;
  };

  const checkCreatorStatus = async (userId: string, userIsAdmin: boolean) => {
    // Admins automatically have creator privileges
    if (userIsAdmin) {
      setIsCreator(true);
      return;
    }
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'quest_creator'
    });
    setIsCreator(data === true);
  };

  const checkSponsorStatus = async (userId: string) => {
    const { data } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'sponsor'
    });
    setIsSponsor(data === true);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setIsProfileLoaded(false); // Reset before fetching
          setTimeout(async () => {
            fetchProfile(session.user.id);
            const userIsAdmin = await checkAdminStatus(session.user.id);
            checkCreatorStatus(session.user.id, userIsAdmin);
            checkSponsorStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsProfileLoaded(true); // No user = profile loading complete (null)
          setIsAdmin(false);
          setIsCreator(false);
          setIsSponsor(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setIsProfileLoaded(false); // Reset before fetching
        fetchProfile(session.user.id).then(() => {
          setIsLoading(false);
        });
        checkAdminStatus(session.user.id).then(userIsAdmin => {
          checkCreatorStatus(session.user.id, userIsAdmin);
        });
        checkSponsorStatus(session.user.id);
      } else {
        setIsProfileLoaded(true);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/my-quests`
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsCreator(false);
    setIsSponsor(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isProfileLoaded,
      isAdmin,
      isCreator,
      isSponsor,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
