import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Flame, Shield, ShieldAlert, Activity } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { mockDb } from '../services/mockDbService';
import MapComponent from './MapComponent';
import FireDeptDashboard from './FireDeptDashboard';
import AdminPanel from './AdminPanel';

const AdminDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const [dispatchAnimationIncidentId, setDispatchAnimationIncidentId] = useState(null);
  const [syncAlert, setSyncAlert] = useState(null);
  const [activeTab, setActiveTab] = useState('operations');
  const [userName, setUserName] = useState('Commander');

  const navigate = useNavigate();

  const refreshDatabase = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIncidents(mockDb.getIncidents());
      setUsers(mockDb.getUsers());
      setUserName('Sandbox Commander');
      return;
    }

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single();

        if (profile) setUserName(profile.name);
      }

      /* =========================
         INCIDENT FETCH
      ========================== */

      const { data: incidents, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Fetched incidents:', incidents);
      console.log('Fetch error:', error);

      if (error) throw error;

      const incsWithTimeline = await Promise.all(
        (incidents || []).map(async (inc) => {
          const { data: logs, error: logError } = await supabase
  .from('status_logs')
  .select('*')
  .eq('incident_id', inc.id);
  console.log("Incident ID:", inc.id);
console.log("Timeline:", logs);

console.log("Current Incident:", inc.id);
console.log("All Logs:", logs);
console.log("Incident:", inc.id);
console.log("Logs:", logs);
console.log("Log Error:", logError);
          return {
            ...inc,
            timeline: logs || [],
            location: {
              lat: inc.latitude,
              lng: inc.longitude,
              address: inc.address
            }
          };
        })
      );

      setIncidents(incsWithTimeline);
      if (selectedIncident) {
  const updatedIncident = incsWithTimeline.find(
    (i) => i.id === selectedIncident.id
  );

  if (updatedIncident) {
    setSelectedIncident(updatedIncident);
  }
}

      /* =========================
         USERS FETCH
      ========================== */

      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profError) throw profError;

      setUsers(profiles || []);
    } catch (err) {
      console.error('Admin dashboard database load failed:', err);
    }
  }, []);

  useEffect(() => {
    refreshDatabase();
  }, [refreshDatabase]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshDatabase();
    }, 5000);

    return () => clearInterval(refreshInterval);
  }, [refreshDatabase]);

  const activeUnrespondedCount = incidents.filter(
    (i) => i.status === 'active' && i.priority === 'high'
  ).length;

  const handleDispatchEngine = async (incidentId) => {
    if (!isSupabaseConfigured) {
      const res = mockDb.dispatchEngine(incidentId);

      refreshDatabase();

      if (res.success) {
        setSelectedIncident(res.incident);
        setDispatchAnimationIncidentId(incidentId);
      }

      return;
    }

    try {
      const { error: incError } = await supabase
        .from('incidents')
        .update({ status: 'in-progress' })
        .eq('id', incidentId);

      if (incError) throw incError;

      await supabase.from('status_logs').insert({
        incident_id: incidentId,
        status: 'in-progress',
        message:
          '🚨 Dispatch Alert: Station 17 dispatched Engine Truck with active rescue crew. ETA 4 mins.'
      });

      await refreshDatabase();

      const updatedInc = incidents.find((i) => i.id === incidentId);

      if (updatedInc) setSelectedIncident(updatedInc);

      setDispatchAnimationIncidentId(incidentId);
    } catch (err) {
      console.error('Dispatch engine write failed:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleArrivalComplete = async (incidentId) => {
    if (!isSupabaseConfigured) {
      mockDb.updateIncidentStatus(
        incidentId,
        'on-scene',
        '🚒 Responders on scene. Hooking water plugs and venting structures.'
      );

      refreshDatabase();

      setDispatchAnimationIncidentId(null);

      setSyncAlert(
        '🚒 Engine Truck arrived on location! Rescue crew engaging active hazard.'
      );

      setTimeout(() => setSyncAlert(null), 5000);

      return;
    }

    try {
      const { error: incError } = await supabase
        .from('incidents')
        .update({ status: 'on-scene' })
        .eq('id', incidentId);

      if (incError) throw incError;

      await supabase.from('status_logs').insert({
        incident_id: incidentId,
        status: 'on-scene',
        message:
          '🚒 Rescue Team has arrived on scene. Establishing operational command.'
      });

      setDispatchAnimationIncidentId(null);

      setSyncAlert(
        `🚒 Engine Truck has arrived at Incident #${incidentId.substring(
          0,
          8
        )}!`
      );

      setTimeout(() => setSyncAlert(null), 5000);

      await refreshDatabase();
    } catch (err) {
      console.error('Arrival update failed:', err);
    }
  };

  const handleUpdateStatus = async (
    incidentId,
    status,
    logMessage
  ) => {
    let standardMessage = `Incident state transitioned to ${status.toUpperCase()}.`;

    if (logMessage) {
      standardMessage = logMessage;
    } else {
      switch (status) {
        case 'on-scene':
          standardMessage =
            '🚒 Crew on location. Deploying water hoses.';
          break;

        case 'under-control':
          standardMessage =
            '🔥 Active flames isolated. Primary venting underway.';
          break;

        case 'resolved':
          standardMessage =
            '✔ All fire cores extinguished. Operational clear.';
          break;

        default:
          break;
      }
    }

    if (!isSupabaseConfigured) {
      mockDb.updateIncidentStatus(
        incidentId,
        status,
        logMessage
      );

      refreshDatabase();

      return;
    }

    try {
      const { error: incError } = await supabase
        .from('incidents')
        .update({ status })
        .eq('id', incidentId);

      if (incError) throw incError;

      await supabase.from('status_logs').insert({
        incident_id: incidentId,
        status,
        message: standardMessage
      });

      if (status === 'resolved') {
        const target = incidents.find(
          (i) => i.id === incidentId
        );

        if (target && target.reporter_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('trust_score')
            .eq('id', target.reporter_id)
            .single();

          if (profile) {
            const nextScore = Math.min(
              100,
              profile.trust_score + 5
            );

            await supabase
              .from('profiles')
              .update({ trust_score: nextScore })
              .eq('id', target.reporter_id);
          }
        }
      }

      await refreshDatabase();

      const updated = incidents.find(
        (i) => i.id === incidentId
      );

      if (updated) setSelectedIncident(updated);
    } catch (err) {
      console.error('Incident state save failed:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleSpamAction = async (incidentId) => {
    if (!isSupabaseConfigured) {
      mockDb.markAsSpam(incidentId);

      refreshDatabase();

      setSyncAlert(
        '⚠️ False Alarm recorded. Reporter penalized.'
      );

      setTimeout(() => setSyncAlert(null), 4000);

      return;
    }

    try {
      const { error: incError } = await supabase
        .from('incidents')
        .update({
          status: 'resolved',
          priority: 'low'
        })
        .eq('id', incidentId);

      if (incError) throw incError;

      await supabase.from('status_logs').insert({
        incident_id: incidentId,
        status: 'resolved',
        message:
          '⚠️ Admin Audit: Report flagged as false alarm/malicious spam. Dispatched response recalled.'
      });

      const target = incidents.find(
        (i) => i.id === incidentId
      );

      if (target && target.reporter_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('trust_score')
          .eq('id', target.reporter_id)
          .single();

        if (profile) {
          const penalizedScore = Math.max(
            0,
            profile.trust_score - 30
          );

          await supabase
            .from('profiles')
            .update({ trust_score: penalizedScore })
            .eq('id', target.reporter_id);
        }
      }

      setSyncAlert(
        '⚠️ Malicious alert audit penalty logged. Reporter Trust Score deducted by 30.'
      );

      setTimeout(() => setSyncAlert(null), 5000);

      await refreshDatabase();

      setSelectedIncident(null);
    } catch (err) {
      console.error('Spam write penalty failed:', err);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',

        /* FIXED */
        minHeight: '100vh',
        height: 'auto',

        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Header */}
      <header className="nav-header">
        <div className="brand">
          <Flame size={28} className="brand-icon" />
          <span>PYROSHIELD Commander Control</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          {localStorage.getItem('bypass_supabase') ===
            'true' && (
            <button
              onClick={() => {
                localStorage.removeItem(
                  'bypass_supabase'
                );

                window.location.reload();
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: 'var(--color-medium)',
                borderColor: 'var(--color-medium)',
                background:
                  'rgba(255, 159, 28, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚠️ Sandbox Mode (Reconnect Live DB)
            </button>
          )}

          {activeUnrespondedCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-high)',
                fontSize: '0.8rem',
                fontWeight: 700,
                background:
                  'rgba(255, 51, 102, 0.15)',
                padding: '6px 12px',
                borderRadius: '50px',
                animation:
                  'glow-pulse 1.2s infinite',
                border:
                  '1px solid var(--color-high)'
              }}
            >
              <ShieldAlert size={14} />
              <span>
                {activeUnrespondedCount}{' '}
                UNRESPONDED HIGH ALERTS
              </span>
            </div>
          )}

          <nav className="nav-roles">
            <button
              className={`role-tab ${
                activeTab === 'operations'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('operations')
              }
            >
              <Activity size={16} />
              Operations Center
            </button>

            <button
              className={`role-tab ${
                activeTab === 'admin-control'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('admin-control')
              }
            >
              <Shield size={16} />
              System Config
            </button>
          </nav>

          <button
            className="btn-secondary"
            onClick={handleLogout}
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              color: 'var(--color-high)',
              borderColor:
                'rgba(255,51,102,0.3)'
            }}
          >
            <LogOut
              size={14}
              style={{ marginRight: '4px' }}
            />
            Exit Command
          </button>
        </div>
      </header>

      {/* Notification */}
      {syncAlert && (
        <div
          className="notification-ticker"
          style={{
            position: 'fixed',
            top: '80px',
            right: '40px',
            zIndex: 9999,
            maxWidth: '425px',
            background:
              'rgba(19, 23, 34, 0.95)',
            border:
              '1px solid var(--accent-blue)',
            boxShadow: 'var(--shadow-neon)',
            fontSize: '0.82rem',
            lineHeight: 1.3
          }}
        >
          <span>{syncAlert}</span>
        </div>
      )}

      {/* Main */}
      <main
        className="dashboard-grid"
        style={{
          gridTemplateColumns: '1fr',

          /* FIXED */
          height: 'auto',
          minHeight: '100vh',

          overflow: 'visible'
        }}
      >
        {activeTab === 'operations' ? (
          <div
            style={{
              display: 'grid',

              /* FIXED */
              gridTemplateRows: '420px auto',

              gap: '20px',

              height: 'auto',

              overflow: 'visible'
            }}
          >
            {/* MAP */}
            <div
              className="glass-panel"
              style={{
                padding: '4px',

                /* FIXED */
                overflow: 'visible'
              }}
            >
              <MapComponent
                incidents={incidents}
                onSelectIncident={
                  setSelectedIncident
                }
                selectedIncident={
                  selectedIncident
                }
                reportingLocation={null}
                onLocationChange={null}
                isReportingMode={false}
                dispatchAnimationIncidentId={
                  dispatchAnimationIncidentId
                }
                onArrivalComplete={
                  handleArrivalComplete
                }
              />
            </div>

            {/* DASHBOARD */}
            <div
              style={{
                flex: 1,

                /* FIXED */
                overflow: 'visible',

                height: 'auto'
              }}
            >
              <FireDeptDashboard
                incidents={incidents}
                onSelectIncident={
                  setSelectedIncident
                }
                selectedIncident={
                  selectedIncident
                }
                onUpdateStatus={
                  handleUpdateStatus
                }
                onDispatchEngine={
                  handleDispatchEngine
                }
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,

              /* FIXED */
              overflow: 'visible',

              height: 'auto'
            }}
          >
            <AdminPanel
              incidents={incidents}
              users={users}
              onUserUpdate={refreshDatabase}
              onSpamAction={handleSpamAction}
              onRefreshData={refreshDatabase}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;