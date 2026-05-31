import React, { useState } from 'react';
import { ShieldCheck, UserMinus, ToggleLeft, ToggleRight, Trash2, AlertOctagon, Heart, Zap, ShieldAlert } from 'lucide-react';
import { mockDb } from '../services/mockDbService';

const AdminPanel = ({ 
  incidents, 
  users, 
  onUserUpdate, 
  onSpamAction, 
  onRefreshData 
}) => {
  const [proximityLimit, setProximityLimit] = useState(150);

  // Stats calculations
  const totalReporters = users.filter(u => u.role === 'public').length;
  const avgTrustScore = Math.round(
    users.reduce((acc, user) => acc + user.trust_score, 0) / users.length
  );
  
  // Calculate fake report rates
  const spamCount = incidents.filter(inc => 
    inc.timeline.some(t => t.message.includes("flagged as a false alarm"))
  ).length;
  const falseAlarmRate = incidents.length > 0 ? ((spamCount / incidents.length) * 100).toFixed(1) : 0;

  // Toggle role switcher
  const handleToggleRole = (userId, currentRole) => {
    const nextRole = currentRole === 'public' ? 'fire-dept' : 'public';
    const response = mockDb.changeUserRole(userId, nextRole);
    if (response.success) {
      onRefreshData();
    }
  };

  const handleMarkSpam = (incidentId) => {
    if (confirm("Are you sure you want to flag this incident as a False Alarm? The submitting user will receive a -30 penalty to their Trust Score.")) {
      onSpamAction(incidentId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflowY: 'auto' }}>
      
      {/* Admin stats widgets */}
      <div className="metrics-row">
        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="metric-val" style={{ color: 'var(--accent-blue)' }}>{avgTrustScore}%</div>
          <div className="metric-label">Reputation Trust Index</div>
        </div>
        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--status-resolved)' }}>
          <div className="metric-val" style={{ color: 'var(--status-resolved)' }}>100%</div>
          <div className="metric-label">Security Uptime</div>
        </div>
        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--color-high)' }}>
          <div className="metric-val" style={{ color: 'var(--color-high)' }}>{falseAlarmRate}%</div>
          <div className="metric-label">False Alarm Rate</div>
        </div>
        <div className="glass-panel metric-card" style={{ borderLeft: '4px solid var(--color-medium)' }}>
          <div className="metric-val" style={{ color: 'var(--color-medium)' }}>{totalReporters}</div>
          <div className="metric-label font-bold">Registered Citizens</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Left Side: User list and trust index */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Civilian Trust Directory</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Monitor reporter credibility. Users with trust index &lt; 40 automatic downgraded in threat severity algorithms.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Email</th>
                  <th>Credibility</th>
                  <th>Assigned Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ 
                          width: '40px', 
                          background: 'rgba(255,255,255,0.05)', 
                          height: '6px', 
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${u.trust_score}%`, 
                            background: u.trust_score > 70 ? 'var(--status-resolved)' : u.trust_score > 40 ? 'var(--color-medium)' : 'var(--color-high)',
                            height: '100%' 
                          }} />
                        </div>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: 700, 
                          color: u.trust_score > 70 ? 'var(--status-resolved)' : u.trust_score > 40 ? 'var(--color-medium)' : 'var(--color-high)'
                        }}>
                          {u.trust_score}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleRole(u.id, u.role)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: u.role === 'fire-dept' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 600
                        }}
                        title="Click to toggle Role"
                      >
                        {u.role === 'fire-dept' ? (
                          <>
                            <ToggleRight size={20} style={{ color: 'var(--accent-blue)' }} />
                            <span>Crew</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={20} />
                            <span>Public</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Proximity Settings and Active Reports Audit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Settings Section */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ fontSize: '1.1rem' }}>Smart Command Settings</h4>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <label style={{ margin: 0 }}>PROXIMITY DUPLICATE LIMIT</label>
                <strong style={{ color: 'var(--accent-blue)' }}>{proximityLimit} meters</strong>
              </div>
              <input 
                type="range" 
                min="50" 
                max="500" 
                step="25"
                value={proximityLimit} 
                onChange={(e) => setProximityLimit(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.3 }}>
                Adjust boundary radius. New incident signals closer than this range to active flames automatically alert users as duplicates.
              </p>
            </div>
          </div>

          {/* Spam Audit Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Audit Active Alarms</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Mark fake or malicious prank calls. Submitting reporter score will suffer critical deduction.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {incidents.filter(i => i.status !== 'resolved').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No active incidents pending audit.
                </div>
              ) : (
                incidents.filter(i => i.status !== 'resolved').map(inc => (
                  <div 
                    key={inc.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Incident #{inc.id}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {inc.reporter_name}</span>
                      </div>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {inc.description}
                      </p>
                    </div>

                    <button 
                      className="btn-secondary"
                      style={{ 
                        padding: '6px 10px', 
                        borderColor: 'var(--color-high)',
                        color: 'var(--color-high)',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 51, 102, 0.05)'
                      }}
                      onClick={() => handleMarkSpam(inc.id)}
                      title="Flag False Alarm"
                    >
                      <ShieldAlert size={14} />
                      Flag Fake
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
