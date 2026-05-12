import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { authService } from '../../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);

  const buildUser = useCallback((authUser, profileData) => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      email: authUser.email,
      name: profileData?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
      type: profileData?.account_type || null,
      avatar: profileData?.avatar_url || authUser.user_metadata?.avatar_url || null,
      company: profileData?.company_name || null,
      isEmailVerified: profileData?.is_email_verified || false,
      isPhoneVerified: profileData?.is_phone_verified || false,
      isIdVerified: profileData?.is_id_verified || false,
    };
  }, []);

  const loadUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      return;
    }
    
    // Set basic user info immediately to avoid blocking UI
    setUser(buildUser(authUser, null));

    try {
      const profileData = await authService.getProfile(authUser.id);
      if (profileData) {
        setProfile(profileData);
        setUser(buildUser(authUser, profileData));
      }
    } catch (err) {
      console.error('[AuthContext] Failed to load user profile:', err);
    }
  }, [buildUser]);

  const initializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout to prevent permanent loading screen
    const timeoutId = setTimeout(() => {
      if (isMounted && !initializedRef.current) {
        console.warn('[AuthContext] Auth initialization timed out - forcing load');
        setLoading(false);
      }
    }, 5000);

    async function handleSession(session, event = 'INITIAL') {
      if (!isMounted) return;
      
      console.log(`[AuthContext] Handling session (${event})`);
      const authUser = session?.user ?? null;
      
      if (authUser) {
        // Set basic user info immediately
        setUser(buildUser(authUser, null));
        
        // Clear loading state as soon as we have a session
        if (!initializedRef.current) {
          setLoading(false);
          initializedRef.current = true;
          clearTimeout(timeoutId);
        }

        // Fetch full profile in background
        loadUserProfile(authUser);
      } else {
        setUser(null);
        setProfile(null);
        if (!initializedRef.current) {
          setLoading(false);
          initializedRef.current = true;
          clearTimeout(timeoutId);
        }
      }
    }

    // 1. Get initial session proactively
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!initializedRef.current) handleSession(session, 'GET_SESSION');
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        handleSession(session, event);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [loadUserProfile, buildUser]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/signup/account-type`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  }, []);

  const signup = useCallback(async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { 
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/signup/account-type`
       },
    });
    if (error) throw error;
    return data;
  }, []);

  const verifyEmail = useCallback(async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    if (error) throw error;
    
    // Once verified, we should ensure profile exists
    if (data.user) {
      await authService.ensureProfile(data.user);
      await loadUserProfile(data.user);
    }
    return data;
  }, [loadUserProfile]);

  const resendOtp = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/settings`,
    });
    if (error) throw error;
  }, []);

  const completeSignup = useCallback(async (accountType) => {
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !authUser) throw userError || new Error('No authenticated user');

    await authService.ensureProfile(authUser);
    const updatedProfile = await authService.setAccountType(authUser.id, accountType);
    
    setProfile(updatedProfile);
    setUser(buildUser(authUser, updatedProfile));
    return updatedProfile;
  }, [buildUser]);

  const switchRole = useCallback(async (newRole) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const updatedProfile = await authService.setAccountType(authUser.id, newRole);
    setProfile(updatedProfile);
    setUser(prev => prev ? { ...prev, type: newRole } : prev);
  }, []);

  const updateUserProfile = useCallback(async (updates) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No authenticated user');
    const updatedProfile = await authService.updateProfile(authUser.id, updates);
    setProfile(updatedProfile);
    setUser(buildUser(authUser, updatedProfile));
    return updatedProfile;
  }, [buildUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isNewGoogleUser,
    login,
    loginWithGoogle,
    signup,
    verifyEmail,
    resendOtp,
    resetPassword,
    completeSignup,
    switchRole,
    updateUserProfile,
    logout,
  }), [user, profile, loading, isNewGoogleUser, login, loginWithGoogle, signup, completeSignup, switchRole, updateUserProfile, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
