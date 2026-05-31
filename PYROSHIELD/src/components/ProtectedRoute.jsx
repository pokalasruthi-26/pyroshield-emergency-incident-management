import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase';
import { ShieldAlert, KeyRound } from 'lucide-react';

const ProtectedRoute = ({ children, requiredRole }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // If Supabase credentials are missing, bypass protection to allow running the app in mock mode
    if (!isSupabaseConfigured) {
      setAuthenticated(true);
      setUserRole(requiredRole || 'user'); // auto-fill role to prevent blocks
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setAuthenticated(false);
          setLoading(false);
          return;
        }

        // Fetch public profile to check role (tries 'profiles' then fallbacks to 'users')
        let userRoleFetched = null;
        let { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !profile) {
          // Fallback to query 'users' table
          const { data: userProfile, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          if (!userError && userProfile) {
            userRoleFetched = userProfile.role;
          }
        } else {
          userRoleFetched = profile.role;
        }

        if (!userRoleFetched) {
          // Fallback: Auto-create profile in database if missing
          try {
            const defaultRole = session.user.email.toLowerCase().includes('admin') ? 'admin' : 'user';
            const defaultName = session.user.email.split('@')[0];
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                name: defaultName,
                role: defaultRole,
                email: session.user.email,
                trust_score: 80
              })
              .select('role')
              .single();

            if (!insertError && newProfile) {
              userRoleFetched = newProfile.role;
            }
          } catch (insertErr) {
            console.error("Failed to auto-create profile:", insertErr);
          }
        }

        // Fallback 1: check local storage cached role
        if (!userRoleFetched) {
          userRoleFetched = localStorage.getItem(`profile_role_${session.user.id}`);
        }

        // Fallback 2: Check email format directly
        if (!userRoleFetched && session.user && session.user.email) {
          userRoleFetched = session.user.email.toLowerCase().includes('admin') ? 'admin' : 'user';
          localStorage.setItem(`profile_role_${session.user.id}`, userRoleFetched);
        }

        if (!userRoleFetched) {
          console.error("Error fetching user profile from profiles and users tables:", error);
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
          setUserRole(userRoleFetched);
        }
      } catch (err) {
        console.error("Auth verification failed:", err);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setAuthenticated(true);
        let userRoleFetched = null;
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          userRoleFetched = profile.role;
        } else {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (userProfile) userRoleFetched = userProfile.role;
        }

        if (!userRoleFetched) {
          try {
            const defaultRole = session.user.email.toLowerCase().includes('admin') ? 'admin' : 'user';
            const defaultName = session.user.email.split('@')[0];
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                name: defaultName,
                role: defaultRole,
                email: session.user.email,
                trust_score: 80
              })
              .select('role')
              .single();

            if (!insertError && newProfile) {
              userRoleFetched = newProfile.role;
            }
          } catch (insertErr) {
            console.error("Failed to auto-create profile in change handler:", insertErr);
          }
        }
        
        if (userRoleFetched) setUserRole(userRoleFetched);
      } else {
        setAuthenticated(false);
        setUserRole(null);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [requiredRole]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        gap: '15px'
      }}>
        <KeyRound size={48} className="animate-bounce" style={{ color: 'var(--accent-blue)', filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.4))' }} />
        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 600 }}>🔐 Establishing Secure Connection...</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verifying credentials with central emergency firewall.</p>
      </div>
    );
  }

  if (!authenticated) {
    // Redirect to login page and preserve original destination path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Role mismatch (e.g. standard civilian trying to break into admin room)
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div className="glass-panel" style={{ maxWidth: '450px', padding: '40px', border: '1px solid var(--color-high)' }}>
          <ShieldAlert size={56} style={{ color: 'var(--color-high)', marginBottom: '20px', marginInline: 'auto' }} />
          <h2 style={{ fontFamily: 'Outfit', marginBottom: '12px' }}>Access Revoked</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            Your account credentials lack administrative clearances for the Emergency Command Operations Center.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
