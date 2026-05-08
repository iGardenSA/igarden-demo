'use client';

import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { useDemoAuth } from './DemoAuthContext';
import { Sprout, Lock, User, Languages } from 'lucide-react';

const C = {
  forest: '#0F3D2E', forestDark: '#08291E', forestLight: '#1A5D45',
  lime: '#7CB342', limeLight: '#9BCB5E',
  cream: '#FAFAF7', creamDark: '#F0EFE8',
  ink: '#1F2937', inkSoft: '#4B5563', muted: '#9CA3AF',
  border: '#E5E1D8', warn: '#D97706', danger: '#B91C1C',
};

export function LoginScreen() {
  const { t, locale, setLocale, dir } = useI18n();
  const { signIn } = useDemoAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = signIn(username, password, remember);
    if (!result.ok) {
      setError(t.login.invalidCredentials);
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: 14,
    background: '#fff',
    boxSizing: 'border-box',
    direction: dir,
    textAlign: dir === 'rtl' ? 'right' : 'left',
  };

  return (
    <div dir={dir} lang={locale} style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${C.forest} 0%, ${C.forestDark} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      fontFamily: locale === 'ar'
        ? "'Tajawal', 'Segoe UI', system-ui, sans-serif"
        : "'Segoe UI', system-ui, -apple-system, sans-serif",
      color: C.ink,
    }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}>
        {/* Brand bar */}
        <div style={{ background: C.forest, color: '#fff', padding: '22px 24px', borderBottom: `4px solid ${C.lime}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(124,179,66,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sprout size={26} color={C.limeLight} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.01em' }}>{t.login.title}</div>
              <div style={{ fontSize: 12, color: C.limeLight, opacity: 0.85, marginTop: 2 }}>{t.login.subtitle}</div>
            </div>
          </div>
        </div>

        {/* Language picker */}
        <div style={{ padding: '14px 24px 0', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          <Languages size={14} color={C.muted} />
          <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{t.login.languageLabel}:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['ar', 'en'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                style={{
                  padding: '4px 12px',
                  background: locale === l ? C.forest : '#fff',
                  color:      locale === l ? '#fff'   : C.inkSoft,
                  border: `1px solid ${locale === l ? C.forest : C.border}`,
                  borderRadius: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {l === 'ar' ? t.login.arabic : t.login.english}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: C.forest, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>
            {t.login.formTitle}
          </div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.forest, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={13} /> {t.login.usernameLabel}
            </div>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t.login.usernamePlaceholder}
              style={inputStyle}
              required
            />
          </label>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.forest, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={13} /> {t.login.passwordLabel}
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.login.passwordPlaceholder}
              style={inputStyle}
              required
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: C.inkSoft, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: C.lime, width: 14, height: 14, cursor: 'pointer' }}
            />
            {t.login.rememberMe}
          </label>

          {error && (
            <div role="alert" style={{ marginBottom: 14, padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 12, color: C.danger, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: C.forest,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all .15s',
            }}
          >
            {loading ? t.common.loading : t.login.signInBtn}
          </button>

          {/* Demo credentials hint */}
          <div style={{ marginTop: 18, padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 11, color: '#92400E', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>🔑 {t.login.demoCredentials}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.login.demoUsername}</div>
            <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.login.demoPassword}</div>
            <div style={{ marginTop: 8, fontSize: 10, lineHeight: 1.6, opacity: 0.85 }}>{t.login.demoHint}</div>
          </div>
        </form>

        {/* Footer */}
        <div style={{ background: C.cream, padding: '12px 24px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted, lineHeight: 1.6, textAlign: 'center' }}>
          {t.login.productionNote}
        </div>
      </div>
    </div>
  );
}
