import React, { useState, useEffect } from 'react';
import { X, Mail, LogOut, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

export default function AuthModal({ onClose, onShowToast, user, onUserChange }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim() || !supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;
      setSentMessage(`Magic sign-in link sent to ${email.trim()}! Check your inbox.`);
      onShowToast('Magic link sent');
    } catch (err) {
      alert(`Sign in failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      alert(`Google sign in failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
      onUserChange(null);
      onShowToast('Signed out. Local cache active.');
      onClose();
    } catch (err) {
      alert(`Sign out failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-l)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-base)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--accent)" />
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em'
              }}
            >
              {user ? 'Account & Sync' : 'Sign In to Cloud Sync'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              color: 'var(--text-dim)',
              padding: '6px',
              borderRadius: 'var(--radius-s)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isSupabaseConfigured ? (
            <div
              style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '14px',
                fontSize: '12px',
                color: 'var(--text-body)',
                lineHeight: '1.6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                <AlertCircle size={15} color="var(--accent)" />
                <span>Supabase Keys Pending</span>
              </div>
              <p style={{ margin: 0 }}>
                CodeOrbit is actively using <strong>local IndexedDB</strong>. To enable cloud sync across phone and laptop from anywhere, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment.
              </p>
            </div>
          ) : user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontSize: '14px'
                  }}
                >
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent)', marginTop: '2px' }}>
                    <CheckCircle size={11} />
                    <span>Cloud Sync Active (RLS Protected)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                style={{
                  minHeight: '44px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '10px 16px',
                  color: 'var(--danger)',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                Sign in to sync your DSA & OOPs revision notes seamlessly between your phone and laptop from anywhere.
              </p>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  minHeight: '44px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-m)',
                  padding: '10px 16px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Email Magic Link Form */}
              <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-dim)',
                      marginBottom: '6px'
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-m)',
                      padding: '10px 12px',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    minHeight: '44px',
                    background: 'var(--accent)',
                    color: '#000000',
                    border: 'none',
                    borderRadius: 'var(--radius-m)',
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Mail size={15} />
                  <span>{loading ? 'Sending link...' : 'Send Magic Link'}</span>
                </button>
              </form>

              {sentMessage && (
                <div
                  style={{
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-m)',
                    padding: '10px 12px',
                    fontSize: '12px',
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <CheckCircle size={14} />
                  <span>{sentMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

