'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  country_id: string | null;
  preferred_language_id: string | null;
  preferred_currency_id: string | null;
  timezone: string | null;
  usage_type: string | null;
  onboarding_completed: boolean;
  account_status: string;
}

type EditableProfileFields = Pick<Profile,
  | 'first_name'
  | 'last_name'
  | 'full_name'
  | 'phone'
  | 'avatar_url'
  | 'country_id'
  | 'preferred_language_id'
  | 'preferred_currency_id'
  | 'timezone'
  | 'usage_type'
  | 'onboarding_completed'
>;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<EditableProfileFields>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const authRequestId = useRef(0);
  const supabase = createClient();

  const loadProfile = useCallback(async (userId: string, requestId: number) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (requestId !== authRequestId.current) return;
      if (error || !data) {
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    } catch {
      if (requestId === authRequestId.current) setProfile(null);
    }
  }, [supabase]);

  const checkSuperAdmin = useCallback(async (requestId: number) => {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (requestId !== authRequestId.current) return;
      if (error) throw error;
      setIsSuperAdmin(data === true);
    } catch {
      if (requestId === authRequestId.current) setIsSuperAdmin(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;
      const requestId = ++authRequestId.current;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      // Clear session-scoped data immediately so the previous account is never
      // displayed while the new account's profile and role are loading.
      setProfile(null);
      setIsSuperAdmin(false);

      if (!nextSession?.user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      await Promise.all([
        loadProfile(nextSession.user.id, requestId),
        checkSuperAdmin(requestId),
      ]);

      if (mounted && requestId === authRequestId.current) setLoading(false);
    };

    void supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => applySession(currentSession))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    // Do not await Supabase queries inside onAuthStateChange: doing so can
    // deadlock the auth lock. Defer session work until the callback has returned.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession) => {
      setTimeout(() => { void applySession(nextSession); }, 0);
    });

    return () => {
      mounted = false;
      ++authRequestId.current;
      subscription.unsubscribe();
    };
  }, [loadProfile, checkSuperAdmin, supabase]);

  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : undefined,
      },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // The auth-state callback also clears this state; clearing immediately makes
    // the UI safe even if the callback is deferred.
    ++authRequestId.current;
    setSession(null);
    setUser(null);
    setProfile(null);
    setIsSuperAdmin(false);
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id, authRequestId.current);
  };

  const updateProfile = async (updates: Partial<EditableProfileFields>) => {
    const currentUserId = user?.id;
    if (!currentUserId) throw new Error('Not authenticated');
    const requestId = authRequestId.current;

    // Only allow user-editable profile fields. Never update identity, email or
    // account status through this helper.
    const editableFields = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    ) as Partial<EditableProfileFields>;

    if (Object.keys(editableFields).length === 0) return;

    const { error } = await supabase
      .from('profiles')
      .update({ ...editableFields, updated_at: new Date().toISOString() })
      .eq('id', currentUserId);
    if (error) throw error;

    // Do not refresh a profile if the active account changed during the update.
    if (requestId === authRequestId.current) {
      await loadProfile(currentUserId, requestId);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isSuperAdmin,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
