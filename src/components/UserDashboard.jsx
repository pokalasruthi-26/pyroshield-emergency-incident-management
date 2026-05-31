import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Flame, Activity, Clock, CheckCircle, Wifi, Compass } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { mockDb, DEFAULT_MAP_CENTER } from '../services/mockDbService';
import OneTapEmergency from './OneTapEmergency';
import ReportForm from './ReportForm';
import MapComponent from './MapComponent';

const UserDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // Geolocation & Mapping States
  const [isMapSelectActive, setIsMapSelectActive] = useState(false);
  const [reportingLocation, setReportingLocation] = useState({
    lat: DEFAULT_MAP_CENTER[0],
    lng: DEFAULT_MAP_CENTER[1],
    address: "Times Square Plaza, New York, NY 10036"
  });

  const [isOnline, setIsOnline] = useState(true);
  const [syncAlert, setSyncAlert] = useState(null);
  const [userName, setUserName] = useState('Civilian');
  
  const navigate = useNavigate();

  // Load and refresh reports from Supabase (or mockDb sandbox fallback)
  const refreshReports = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const allInc = mockDb.getIncidents();
      setIncidents(allInc);
      setMyIncidents(allInc); // In sandbox, show all
      setUserName("Sandbox Reporter");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Query public profile name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();
      if (profile) setUserName(profile.name);

      // Query all incidents for Map pins
      const { data: allIncidents } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });
      setIncidents(allIncidents || []);

      // Query only MY incidents for the tracker
      const { data: userIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('reporter_id', session.user.id)
        .order('created_at', { ascending: false });
      
      // We also query status logs for each incident's timeline
      const incidentsWithTimeline = await Promise.all(
        (userIncidents || []).map(async (inc) => {
          const { data: logs } = await supabase
            .from('status_logs')
            .select('*')
            .eq('incident_id', inc.id)
            .order('updated_at', { ascending: true });
          
          return {
            ...inc,
            timeline: logs || []
          };
        })
      );

      setMyIncidents(incidentsWithTimeline);
    } catch (err) {
      console.error("Error loading user incidents:", err);
    }
  }, []);

  useEffect(() => {
    refreshReports();
  }, [refreshReports]);

  // Sync offline data when connection toggles back online
  const handleToggleNetwork = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);

    if (nextState) {
      const syncCount = mockDb.syncOfflineReports();
      if (syncCount > 0) {
        setSyncAlert(`📶 Connection restored! Synchronized ${syncCount} offline incident reports to database.`);
        setTimeout(() => setSyncAlert(null), 5000);
      }
      refreshReports();
    }
  };

  const handleLocationChange = useCallback((newLoc) => {
    setReportingLocation(newLoc);
  }, []);

  const handleSubmitReport = async (data) => {
    if (data.justUpdateCoords) {
      setReportingLocation({
        lat: data.lat,
        lng: data.lng,
        address: data.address
      });
      return;
    }

    if (!isSupabaseConfigured) {
      const res = mockDb.submitIncident(data, isOnline);
      refreshReports();
      setIsMapSelectActive(false);
      return res;
    }

    try {
      if (!isOnline) {
        // Save in offline queue
        const res = mockDb.submitIncident(data, false);
        setSyncAlert(`📶 Offline Save: You are offline. Report cached in local queue.`);
        setTimeout(() => setSyncAlert(null), 4000);
        refreshReports();
        return res;
      }

      // Online Save: Insert into Supabase 'incidents' table
      const { data: newIncident, error } = await supabase
        .from('incidents')
        .insert({
          description: data.description,
          latitude: data.lat,
          longitude: data.lng,
          address: data.address,
          image_url: data.image_url,
          priority: data.priority,
          reporter_id: data.reporter_id,
          reporter_name: data.name,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial timeline log inside 'status_logs'
      await supabase
        .from('status_logs')
        .insert({
          incident_id: newIncident.id,
          status: 'active',
          message: `🚨 Emergency incident filed by civilian ${data.name}. Auto-Priority evaluation tagged as ${data.priority.toUpperCase()}.`
        });

      refreshReports();
      setIsMapSelectActive(false);
      
      // Auto open detailed timeline for the newly submitted alert
      setSelectedIncident(newIncident);
      setSyncAlert("🔥 Emergency Report filed successfully! First responders notified.");
      setTimeout(() => setSyncAlert(null), 5000);

      return { success: true, incident: newIncident };
    } catch (err) {
      console.error("Supabase insert failed:", err);
      alert("Database error: " + err.message);
      return { success: false };
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  overflowY: 'auto'
}}>
      
      {/* Header Bar */}
      <header className="nav-header">
        <div className="brand">
          <Flame size={28} className="brand-icon" />
          <span>PYROSHIELD Civilian Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {localStorage.getItem('bypass_supabase') === 'true' && (
            <button
              onClick={() => {
                localStorage.removeItem('bypass_supabase');
                window.location.reload();
              }}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                color: 'var(--color-medium)',
                borderColor: 'var(--color-medium)',
                background: 'rgba(255, 159, 28, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ⚠️ Sandbox Mode (Reconnect Live DB)
            </button>
          )}
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Welcome, <strong style={{ color: '#fff' }}>{userName}</strong>
          </div>
          
          <button 
            className="btn-secondary"
            onClick={handleLogout}
            style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--color-high)', borderColor: 'rgba(255,51,102,0.3)' }}
          >
            <LogOut size={14} style={{ marginRight: '4px' }} />
            Exit Portal
          </button>
        </div>
      </header>

      {/* Connection notification badges */}
      {syncAlert && (
        <div className="notification-ticker" style={{
          position: 'fixed', top: '80px', right: '40px', zIndex: 9999, maxWidth: '420px',
          background: 'rgba(19, 23, 34, 0.95)', border: '1px solid var(--accent-blue)', boxShadow: 'var(--shadow-neon)',
          fontSize: '0.82rem', lineHeight: 1.3
        }}>
          <span>{syncAlert}</span>
        </div>
      )}

      {/* Grid Dashboard */}
      <main className="dashboard-grid">
        
        {/* Left Side: Submit Panel & Tracker */}
        <section className="panel-left">
          
          <OneTapEmergency 
            onSubmitEmergency={handleSubmitReport}
            isOnline={isOnline}
          />
          
          <ReportForm 
            currentLocation={reportingLocation}
            onToggleMapSelect={setIsMapSelectActive}
            isMapSelectActive={isMapSelectActive}
            onSubmitReport={handleSubmitReport}
            isOnline={isOnline}
            toggleNetworkStatus={handleToggleNetwork}
          />

        </section>

        {/* Right Side: Map & Submitted Track List */}
        <section className="panel-right" style={{ display: 'grid', gridTemplateRows: '1fr 220px', gap: '20px' }}>
          
          {/* Map view */}
          <div className="glass-panel" style={{ padding: '4px', overflow: 'hidden' }}>
            <MapComponent 
              incidents={incidents}
              onSelectIncident={setSelectedIncident}
              selectedIncident={selectedIncident}
              reportingLocation={reportingLocation}
              onLocationChange={handleLocationChange}
              isReportingMode={isMapSelectActive}
            />
          </div>

          {/* User Submitted tracking panel */}
          <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', overflow: 'hidden' }}>
            
            {/* Tracking Feeds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Reported Alerts ({myIncidents.length})
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {myIncidents.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px' }}>
                    You have not submitted any incident reports. Use the panic button or form to report.
                  </span>
                ) : (
                  myIncidents.map(inc => (
                    <div 
                      key={inc.id}
                      className={`incident-list-item ${inc.priority} ${selectedIncident && selectedIncident.id === inc.id ? 'active-selection' : ''}`}
                      style={{ padding: '10px 12px' }}
                      onClick={() => setSelectedIncident(inc)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '2px' }}>
                        <span>Report #{inc.id.substring(0,8)}</span>
                        <span className={`pulse-badge ${inc.priority}`} style={{ fontSize: '0.6rem', padding: '1px 4px', animation: 'none' }}>
                          {inc.status.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Progress Timeline tracker */}
            <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {selectedIncident ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#fff', fontFamily: 'Outfit' }}>
                      Track Status: Incident #{selectedIncident.id.substring(0,8)}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Compass size={12} />
                      {selectedIncident.address}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.75rem' }}>
                    {selectedIncident.timeline && selectedIncident.timeline.length > 0 ? (
                      <div className="timeline-container" style={{ gap: '10px' }}>
                        {selectedIncident.timeline.slice().reverse().map((log, idx) => (
                          <div key={idx} className="timeline-item">
                            <div className={`timeline-dot ${idx === 0 ? 'active' : ''} ${log.status === 'resolved' ? 'completed' : ''}`} style={{ width: '16px', height: '16px', fontSize: '8px' }}>
                              ✔
                            </div>
                            <div className="timeline-content">
                              <span style={{ color: idx === 0 ? '#fff' : 'var(--text-secondary)', fontWeight: 600 }}>{log.message}</span>
                              <div className="timeline-time" style={{ fontSize: '0.65rem' }}>
                                {new Date(log.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        No logs compiled. Responders will add updates shortly.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', gap: '6px' }}>
                  <Clock size={24} />
                  <span>Select any of your reports on the left to track response dispatches in real-time.</span>
                </div>
              )}
            </div>

          </div>
        </section>

      </main>
    </div>
  );
};

export default UserDashboard;
