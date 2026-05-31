import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, AlertOctagon, XCircle } from 'lucide-react';

const OneTapEmergency = ({ onSubmitEmergency, isOnline }) => {
  const [isCounting, setIsCounting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isCounting) {
      setCountdown(3);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Defer component updates outside of this React state-updater rendering phase
            setTimeout(() => {
              setIsCounting(false);
              triggerEmergency();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCounting]);

  const handlePanicClick = () => {
    if (isCounting) return;
    setIsCounting(true);
  };

  const cancelEmergency = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsCounting(false);
  };

  const triggerEmergency = () => {
    // Generate simulated user current GPS location around DEFAULT_MAP_CENTER with slight offset
    const lat = 40.730610 + (Math.random() - 0.5) * 0.015;
    const lng = -73.935242 + (Math.random() - 0.5) * 0.015;

    onSubmitEmergency({
      description: "🚨 ONE-TAP PANIC SIGNAL: Active fire incident reported via instant emergency action button. Immediate response requested!",
      lat,
      lng,
      address: "GPS Broadcast Sector - Auto Located",
      priority: "high",
      image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80", // Fire scene
      name: "Emergency Beacon User",
      email: "emergency.beacon@nyfd.gov"
    });
  };

  return (
    <div className="glass-panel emergency-button-wrapper" style={{ flexShrink: 0 }}>
      {!isCounting ? (
        <>
          <button 
            className="panic-button"
            onClick={handlePanicClick}
            aria-label="One-tap emergency panic button"
          >
            <ShieldAlert size={36} style={{ marginBottom: '6px' }} />
            PANIC
          </button>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <h4 style={{ color: 'var(--color-high)', marginBottom: '4px', fontSize: '0.95rem' }}>One-Tap Dispatch</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', maxWidth: '240px', lineHeight: 1.3 }}>
              Sends your current GPS coordinates to command center immediately.
            </p>
          </div>
        </>
      ) : (
        <div className="cancel-countdown">
          <div 
            className="panic-button" 
            style={{ 
              background: '#d90429', 
              boxShadow: '0 0 45px rgba(217, 4, 41, 0.9)', 
              animation: 'pulse-critical 1s infinite'
            }}
          >
            <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>{countdown}</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Triggering</span>
          </div>
          
          <button 
            className="btn-secondary" 
            onClick={cancelEmergency}
            style={{ 
              marginTop: '10px', 
              padding: '6px 14px', 
              fontSize: '0.8rem',
              color: 'var(--color-high)',
              borderColor: 'var(--color-high)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <XCircle size={14} />
            Cancel Dispatch
          </button>
          
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Broadcasting in {countdown}s...
          </span>
        </div>
      )}
    </div>
  );
};

export default OneTapEmergency;
