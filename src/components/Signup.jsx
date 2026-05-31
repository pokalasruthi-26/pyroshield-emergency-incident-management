import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase';
import { Flame, Lock, User, Mail, ShieldAlert, CheckSquare } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // default is civilian 'user'
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Form validations
    if (password.length < 6) {
      setErrorMessage("Emergency PIN / Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify PIN fields.");
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured) {
      // Sandbox mode bypass
      setTimeout(() => {
        setLoading(false);
        setSuccessMessage("Civilian registration successful (Sandbox Simulated). Redirecting...");
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }, 1000);
      return;
    }

    try {
      // Sign up inside Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            role: role // Sets metadata which public.profiles trigger extracts
          }
        }
      });

      if (error) throw error;

      setSuccessMessage("Registration completed! Please check email or authenticate directly.");
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error("Signup error:", err);
      const msg = err.message || "Registration operation failed.";
      setErrorMessage(
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span>{msg}</span>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('bypass_supabase', 'true');
              window.location.reload();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 600,
              alignSelf: 'flex-start',
              marginTop: '4px'
            }}
          >
            Switch to Sandbox Mode (Bypass Supabase)
          </button>
        </div>
      );
    } finally {
      setLoading(false);
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
        maxWidth: '440px',
        padding: '35px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-neon)',
        animation: 'slide-in 0.4s ease-out'
      }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(255, 51, 102, 0.12)',
            padding: '10px',
            borderRadius: '50%',
            marginBottom: '10px'
          }}>
            <Flame size={28} className="brand-icon" />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.45rem', fontWeight: 800, textAlign: 'center' }}>
            Register PyroShield Account
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '4px' }}>
            Establish Emergency Sector Clearance
          </span>
        </div>

        {/* Error notification banner */}
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
            gap: '8px'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success notification banner */}
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--status-resolved)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: 'var(--status-resolved)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckSquare size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="signup-name">YOUR FULL NAME</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Sarah Jenkins"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="signup-email">EMERGENCY NOTIFICATION EMAIL</label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="sarah.jenkins@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="signup-pass">SECURE PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-pass"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="signup-confirm">CONFIRM PIN</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-confirm"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>

          {/* Role selector slider / boxes - high utility for testing */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>ASSIGN SECURE ACCESS CLEARANCE (ROLE)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '0.8rem',
                  justifyContent: 'center',
                  background: role === 'user' ? 'rgba(56, 189, 248, 0.15)' : '',
                  borderColor: role === 'user' ? 'var(--accent-blue)' : 'var(--card-border)'
                }}
                onClick={() => setRole('user')}
              >
                Civilian Reporter
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '0.8rem',
                  justifyContent: 'center',
                  background: role === 'admin' ? 'rgba(255, 51, 102, 0.15)' : '',
                  borderColor: role === 'admin' ? 'var(--color-high)' : 'var(--card-border)'
                }}
                onClick={() => setRole('admin')}
              >
                Fire Admin Desk
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '5px' }}
            disabled={loading}
          >
            {loading ? 'Submitting Registry...' : 'Register Clearance'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <span>Already registered? </span>
          <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Log In here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Signup;
