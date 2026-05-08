'use client';

// ─── Demo Auth Gate — Local-only ────────────────────────────────────
// Provides a simple username/password gate for the demo (demo / demo).
// Stores a flag in localStorage so the user stays signed in across reloads.
// In production this is replaced by Supabase Auth (Magic Link / SSO).
// ─────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY     = 'igarden_demo_auth_v1';
const DEMO_USERNAME   = 'demo';
const DEMO_PASSWORD   = 'demo';

interface DemoAuthValue {
  signedIn: boolean;
  username: string | null;
  signIn: (username: string, password: string, remember: boolean) => { ok: true } | { ok: false; reason: string };
  signOut: () => void;
  ready: boolean;
}

const Ctx = createContext<DemoAuthValue | null>(null);

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [ready, setReady]       = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.signedIn && typeof parsed.username === 'string') {
          setSignedIn(true);
          setUsername(parsed.username);
        }
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  function signIn(u: string, p: string, remember: boolean): { ok: true } | { ok: false; reason: string } {
    if (u.trim().toLowerCase() !== DEMO_USERNAME || p !== DEMO_PASSWORD) {
      return { ok: false, reason: 'invalid' };
    }
    setSignedIn(true);
    setUsername(u.trim().toLowerCase());
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ signedIn: true, username: u.trim().toLowerCase() })); } catch { /* ignore */ }
    }
    return { ok: true };
  }

  function signOut() {
    setSignedIn(false);
    setUsername(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  return (
    <Ctx.Provider value={{ signedIn, username, signIn, signOut, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDemoAuth(): DemoAuthValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDemoAuth must be used within DemoAuthProvider');
  return v;
}
