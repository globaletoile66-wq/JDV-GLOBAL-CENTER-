'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

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
  updateProfile: (updates: Pick<Profile, 'first_name' | 'last_name' | 'full_name' | 'phone' | 'avatar_url' | 'country_id' | 'preferred_language_id' | 'preferred_currency_id' | 'timezone' | 'usage_type' | 'onboarding_completed'>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
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

  const loadProfile = useCallback(async (userId: string, requestId?: number) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (requestId !== undefined && requestId !== authRequestId.current) return;
      if (error || !data) {
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    } catch {
      // Do not keep another session's profile if this request fails.
      if (requestId === undefined || requestId === authRequestId.current) setProfile(null);
    }
  }, [supabase]);

  const checkSuperAdmin = useCallback(async (_userId: string, requestId?: number) => {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      if (requestId !== undefined && requestId !== authRequestId.current) return;
      setIsSuperAdmin(data === true);
    } catch {
      if (requestId === undefined || requestId === authRequestId.current) setIsSuperAdmin(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const applySession = async (s: Session | null) => {
      if (!mounted) return;
      const requestId = ++authRequestId.current;
      setSession(s);
      setUser(s?.user ?? null);

      if (!s?.user) {
        setProfile(null);
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      await Promise.all([
        loadProfile(s.user.id, requestId),
        checkSuperAdmin(s.user.id, requestId),
      ]);

      if (mounted) setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => applySession(s))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      void applySession(s);
    });

    return () => {
      mounted = false;
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
    setProfile(null);
    setIsSuperAdmin(false);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  const updateProfile = async (updates: Pick<Profile, 'first_name' | 'last_name' | 'full_name' | 'phone' | 'avatar_url' | 'country_id' | 'preferred_language_id' | 'preferred_currency_id' | 'timezone' | 'usage_type' | 'onboarding_completed'>) => {
    if (!user) throw new Error('Not authenticated');

    // Only allow user-editable profile fields. Identity, email and account status
    // must be changed through their dedicated trusted flows, never this helper.
    const editableFields = {
      first_name: updates.first_name,
      last_name: updates.last_name,
      full_name: updates.full_name,
      phone: updates.phone,
      avatar_url: updates.avatar_url,
      country_id: updates.country_id,
      preferred_language_id: updates.preferred_language_id,
      preferred_currency_id: updates.preferred_currency_id,
      timezone: updates.timezone,
      usage_type: updates.usage_type,
      onboarding_completed: updates.onboarding_completed,
    };
    const { error } = await supabase
      .from('profiles')
      .update({ ...editableFields, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    await loadProfile(user.id);
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
