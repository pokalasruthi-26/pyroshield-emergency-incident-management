import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Flame, Lock, Mail, ShieldAlert, Send } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async (e) => {
  e.preventDefault();

  setErrorMessage(null);
  setLoading(true);

  try {
    localStorage.setItem('user_email', email);

    if (email.toLowerCase().includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    setErrorMessage('Login failed');
  } finally {
    setLoading(false);
  }
};

      

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      setErrorMessage(err.message || 'Google authentication failed');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'var(--bg-primary)'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '35px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-neon)',
        animation: 'slide-in 0.4s ease-out'
      }}>
        
        {/* Banner Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(255, 51, 102, 0.12)',
            padding: '12px',
            borderRadius: '50%',
            marginBottom: '12px',
            boxShadow: '0 0 20px var(--color-high-glow)'
          }}>
            <Flame size={32} className="brand-icon" />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', fontWeight: 800, textAlign: 'center' }}>
            PYROSHIELD Command
          </h2>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
            Emergency Incident Firewall
          </span>
        </div>

        {/* SandBox bypass reminder if credentials missing or explicitly bypassed */}
        {!isSupabaseConfigured && (
          <div style={{
            background: 'rgba(255, 159, 28, 0.1)',
            border: '1px solid rgba(255, 159, 28, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            color: 'var(--color-medium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '20px',
            lineHeight: 1.3
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>
                <strong>Sandbox Mode active:</strong> {localStorage.getItem('bypass_supabase') === 'true' ? 'Bypassing Supabase for rate-limit testing.' : 'Credentials not detected in `.env`.'} Access with any email (include "admin" for Admin view).
              </span>
            </div>
            {localStorage.getItem('bypass_supabase') === 'true' && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('bypass_supabase');
                  window.location.reload();
                }}
                style={{
                  background: 'rgba(255, 159, 28, 0.2)',
                  border: '1px solid var(--color-medium)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                  fontWeight: 600
                }}
              >
                Reconnect Live Supabase DB
              </button>
            )}
          </div>
        )}

        {/* Error Alert Display */}
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.12)',
            border: '1px solid rgba(255, 51, 102, 0.4)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: 'var(--color-high)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'glow-pulse 1.5s infinite'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="login-email">EMERGENCY OPERATIONS EMAIL</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="chief.miller@nyfd.gov"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="login-password">SECURE PIN / PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Google OAuth login button */}
            <button
              type="button"
              className="btn-secondary"
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                marginTop: '5px', 
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onClick={handleGoogleLogin}
              disabled={oauthLoading}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" style={{ marginRight: '8px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              {oauthLoading ? 'Connecting...' : 'Sign in with Google'}
            </button>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '5px' }}
              disabled={loading}
            >
              <Send size={16} />
              {loading ? 'Verifying Credentials...' : 'Authenticate'}
            </button>
          </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Need a civilian reporting profile? </span>
          <Link to="/signup" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Register Profile
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
