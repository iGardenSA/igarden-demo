'use client';

import { useEffect, useState } from 'react';
import { registerSupabaseAuthTokenProvider, supabaseAuth } from '../lib/supabase-auth';

export function useSupabaseAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    registerSupabaseAuthTokenProvider();

    if (!supabaseAuth) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabaseAuth.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUserEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string) {
    if (!supabaseAuth) return;
    const { error } = await supabaseAuth.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabaseAuth) return;
    await supabaseAuth.auth.signOut();
  }

  return {
    configured: Boolean(supabaseAuth),
    userEmail,
    loading,
    signedIn:  Boolean(userEmail),
    signInWithEmail,
    signOut,
  };
}
