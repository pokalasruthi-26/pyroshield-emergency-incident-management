import React, { useState } from 'react';
import {
  Flame,
  Truck,
  CheckCircle,
  Clock,
  ShieldAlert,
  Compass,
  Plus
} from 'lucide-react';

const FireDeptDashboard = ({
  incidents = [],
  onSelectIncident,
  selectedIncident,
  onUpdateStatus,
  onDispatchEngine
}) => {

  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customComment, setCustomComment] = useState('');

  // =========================
  // NORMALIZE STATUS
  // =========================

  const normalizeStatus = (status) => {

    if (!status) return 'active';

    switch (status.toLowerCase()) {

      case 'dispatched':
        return 'in-progress';

      case 'on_scene':
        return 'on-scene';

      case 'under_control':
        return 'under-control';

      default:
        return status.toLowerCase();
    }
  };

  // =========================
  // METRICS
  // =========================

  const activeFires = incidents.filter(
    inc => normalizeStatus(inc.status) === 'active'
  ).length;

  const dispatchCount = incidents.filter(
    inc =>
      normalizeStatus(inc.status) === 'in-progress' ||
      normalizeStatus(inc.status) === 'on-scene'
  ).length;

  const resolvedCount = incidents.filter(
    inc => normalizeStatus(inc.status) === 'resolved'
  ).length;

  const criticalCount = incidents.filter(
    inc =>
      inc.priority === 'high' &&
      normalizeStatus(inc.status) !== 'resolved'
  ).length;

  // =========================
  // FILTER INCIDENTS
  // =========================

  const filteredIncidents = incidents.filter((inc) => {

    const normalizedStatus = normalizeStatus(inc.status);

    const statusMatch =
      statusFilter === 'all' ||
      normalizedStatus === statusFilter;

    const priorityMatch =
      priorityFilter === 'all' ||
      inc.priority === priorityFilter;

    return statusMatch && priorityMatch;
  });

  // =========================
  // DISPATCH
  // =========================

  const handleDispatch = (incidentId) => {

    if (onDispatchEngine) {
      onDispatchEngine(incidentId);
    }
  };

  // =========================
  // STATUS UPDATE
  // =========================

  const handleStatusChange = (status) => {

    if (!selectedIncident) return;

    onUpdateStatus(
      selectedIncident.id,
      status,
      customComment.trim() || null
    );

    setCustomComment('');
  };

  // =========================
  // ADD COMMENT
  // =========================

  const handleAddComment = (e) => {

    e.preventDefault();

    if (!customComment.trim()) return;

    if (!selectedIncident) return;

    onUpdateStatus(
      selectedIncident.id,
      selectedIncident.status,
      customComment.trim()
    );

    setCustomComment('');
  };

  // =========================
  // STATUS BADGES
  // =========================

  const getStatusBadge = (status) => {

    switch (status) {

      case 'active':
        return (
          <span
            className="pulse-badge high"
            style={{
              border: 'none',
              animation: 'none'
            }}
          >
            ACTIVE ALERT
          </span>
        );

      case 'in-progress':
        return (
          <span
            className="pulse-badge medium"
            style={{
              border: 'none',
              animation: 'none',
              background: 'rgba(255,159,28,0.15)',
              color: 'var(--color-medium)'
            }}
          >
            DISPATCHED
          </span>
        );

      case 'on-scene':
        return (
          <span
            className="pulse-badge"
            style={{
              background: 'rgba(0,180,216,0.15)',
              color: 'var(--status-on-scene)',
              border: '1px solid var(--status-on-scene)'
            }}
          >
            ON SCENE
          </span>
        );

      case 'under-control':
        return (
          <span
            className="pulse-badge"
            style={{
              background: 'rgba(58,134,200,0.15)',
              color: 'var(--status-under-control)',
              border: '1px solid var(--status-under-control)'
            }}
          >
            UNDER CONTROL
          </span>
        );

      case 'resolved':
        return (
          <span
            className="pulse-badge"
            style={{
              background: 'rgba(16,185,129,0.15)',
              color: 'var(--status-resolved)',
              border: '1px solid var(--status-resolved)'
            }}
          >
            RESOLVED
          </span>
        );

      default:
        return null;
    }
  };

  return (

    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '40px'
      }}
    >

      {/* =========================
          METRICS
      ========================== */}

      <div
        className="metrics-row"
        style={{ flexShrink: 0 }}
      >

        <div
          className="glass-panel metric-card"
          style={{
            borderLeft: '4px solid var(--color-high)'
          }}
        >
          <div
            className="metric-val"
            style={{
              color: 'var(--color-high)'
            }}
          >
            {activeFires}
          </div>

          <div className="metric-label">
            Active Alerts
          </div>
        </div>

        <div
          className="glass-panel metric-card"
          style={{
            borderLeft: '4px solid var(--color-medium)'
          }}
        >
          <div
            className="metric-val"
            style={{
              color: 'var(--color-medium)'
            }}
          >
            {dispatchCount}
          </div>

          <div className="metric-label">
            Dispatched Crews
          </div>
        </div>

        <div
          className="glass-panel metric-card"
          style={{
            borderLeft: '4px solid var(--status-resolved)'
          }}
        >
          <div
            className="metric-val"
            style={{
              color: 'var(--status-resolved)'
            }}
          >
            {resolvedCount}
          </div>

          <div className="metric-label">
            Resolved Incidents
          </div>
        </div>

        <div
          className="glass-panel metric-card"
          style={{
            borderLeft: '4px solid var(--color-high)'
          }}
        >
          <div
            className="metric-val"
            style={{
              color:
                criticalCount > 0
                  ? 'var(--color-high)'
                  : 'var(--text-secondary)'
            }}
          >
            {criticalCount}
          </div>

          <div className="metric-label">
            Critical Highs
          </div>
        </div>
      </div>

      {/* =========================
          MAIN GRID
      ========================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          gap: '20px',
          alignItems: 'start',
          overflow: 'visible'
        }}
      >

        {/* =========================
            LEFT PANEL
        ========================== */}

        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            overflow: 'visible',
            position: 'relative',
            zIndex: 9999
          }}
        >

          <div>

            <h4
              style={{
                fontSize: '1rem',
                marginBottom: '10px'
              }}
            >
              Active Fire Feeds
            </h4>

            {/* FILTERS */}

            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexDirection: 'column'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  gap: '4px'
                }}
              >

                {/* STATUS FILTER */}

                <select
                  className="form-select"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    flex: 1,
                    position: 'relative',
                    zIndex: 999999
                  }}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >

                  <option value="all">
                    All States
                  </option>

                  <option value="active">
                    Active Alerts
                  </option>

                  <option value="in-progress">
                    Dispatched
                  </option>

                  <option value="on-scene">
                    On Scene
                  </option>

                  <option value="under-control">
                    Under Control
                  </option>

                  <option value="resolved">
                    Resolved
                  </option>

                </select>

                {/* PRIORITY FILTER */}

                <select
                  className="form-select"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    flex: 1,
                    position: 'relative',
                    zIndex: 999999
                  }}
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(e.target.value)
                  }
                >

                  <option value="all">
                    All Threat Levels
                  </option>

                  <option value="high">
                    High Priority
                  </option>

                  <option value="medium">
                    Medium Priority
                  </option>

                  <option value="low">
                    Low Priority
                  </option>

                </select>
              </div>
            </div>
          </div>

          {/* INCIDENT LIST */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '700px'
            }}
          >

            {filteredIncidents.length === 0 ? (

              <div
                style={{
                  textAlign: 'center',
                  padding: '30px 10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem'
                }}
              >
                No incidents match active filters.
              </div>

            ) : (

              filteredIncidents.map((inc) => (

                <div
                  key={inc.id}
                  className={`incident-list-item ${inc.priority}`}
                  onClick={() => onSelectIncident(inc)}
                  style={{
                    cursor: 'pointer',
                    border:
                      selectedIncident &&
                      selectedIncident.id === inc.id
                        ? '1px solid var(--color-high)'
                        : ''
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >

                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                    >
                      Incident #{inc.id}
                    </span>

                    <span
                      className={`pulse-badge ${inc.priority}`}
                      style={{
                        animation: 'none',
                        fontSize: '0.65rem',
                        padding: '1px 5px'
                      }}
                    >
                      {inc.priority}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '8px'
                    }}
                  >
                    {inc.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)'
                    }}
                  >

                    <span>
                      {new Date(
                        inc.created_at
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    <span style={{ fontWeight: 600 }}>
                      {normalizeStatus(
                        inc.status
                      ).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* =========================
            RIGHT PANEL
        ========================== */}

        <div
          className="glass-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto'
          }}
        >

          {selectedIncident ? (

            <>
              {/* HEADER */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom:
                    '1px solid var(--card-border)',
                  paddingBottom: '15px'
                }}
              >

                <div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '4px'
                    }}
                  >

                    <h3
                      style={{
                        fontSize: '1.4rem',
                        fontFamily: 'Outfit'
                      }}
                    >
                      Incident Detail #{selectedIncident.id}
                    </h3>

                    {getStatusBadge(
                      normalizeStatus(
                        selectedIncident.status
                      )
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--accent-blue)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >

                    <Compass size={14} />

                    {selectedIncident.location?.address || 'Unknown'}

                  </p>
                </div>

                {normalizeStatus(
                  selectedIncident.status
                ) === 'active' && (

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--color-high)'
                    }}
                  >

                    <ShieldAlert size={20} />

                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      UNRESPONDED ALERT
                    </span>
                  </div>
                )}
              </div>

              {/* BODY */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 2fr',
                  gap: '20px'
                }}
              >

                {/* LEFT */}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}
                >

                  <div
                    style={{
                      padding: '15px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      border: '1px solid var(--card-border)',
                      fontSize: '0.9rem',
                      lineHeight: 1.4
                    }}
                  >

                    <strong
                      style={{
                        display: 'block',
                        marginBottom: '6px'
                      }}
                    >
                      Reporter Description
                    </strong>

                    {selectedIncident.description}

                  </div>

                  {selectedIncident.image_url && (

                    <img
                      src={selectedIncident.image_url}
                      alt="Incident"
                      style={{
                        width: '100%',
                        maxHeight: '220px',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                  )}

                  {/* CONTROLS */}

                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(11,13,17,0.5)',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)'
                    }}
                  >

                    <h5
                      style={{
                        marginBottom: '12px'
                      }}
                    >
                      Rescue Dispatch Controls
                    </h5>

                    {normalizeStatus(
                      selectedIncident.status
                    ) === 'active' ? (

                      <button
                        className="btn-primary"
                        style={{
                          width: '100%',
                          justifyContent: 'center'
                        }}
                        onClick={() =>
                          handleDispatch(selectedIncident.id)
                        }
                      >

                        <Truck size={18} />

                        Dispatch Engine Truck

                      </button>

                    ) : (

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >

                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}
                        >

                          <button
                            className="btn-secondary"
                            onClick={() =>
                              handleStatusChange('in-progress')
                            }
                          >
                            Dispatched
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={() =>
                              handleStatusChange('on-scene')
                            }
                          >
                            On Scene
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={() =>
                              handleStatusChange('under-control')
                            }
                          >
                            Under Control
                          </button>

                          <button
                            className="btn-secondary"
                            onClick={() =>
                              handleStatusChange('resolved')
                            }
                          >
                            Resolve Alert
                          </button>
                        </div>

                        {/* CREW LOG */}

                        <form
                          onSubmit={handleAddComment}
                          style={{
                            display: 'flex',
                            gap: '8px'
                          }}
                        >

                          <input
                            type="text"
                            className="form-input"
                            placeholder="Add Crew Log..."
                            value={customComment}
                            onChange={(e) =>
                              setCustomComment(
                                e.target.value
                              )
                            }
                          />

                          <button
                            type="submit"
                            className="btn-secondary"
                          >

                            <Plus size={14} />

                            Log

                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT */}

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}
                >

                  <h5>
                    Incident Logs Timeline
                  </h5>

                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: '8px',
                      border: '1px solid var(--card-border)',
                      maxHeight: '380px',
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >

                    {selectedIncident.timeline &&
                    selectedIncident.timeline.length > 0 ? (

                      selectedIncident.timeline
                        .slice()
                        .reverse()
                        .map((log, idx) => (

                          <div key={idx}>

                            <div
                              style={{
                                fontWeight: 600,
                                marginBottom: '4px'
                              }}
                            >
                              {log.message}
                            </div>

                            <div
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--text-muted)'
                              }}
                            >
                              {new Date(
                                log.updated_at
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        ))

                    ) : (

                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        No logs compiled.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </>

          ) : (

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                gap: '10px'
              }}
            >

              <Clock
                size={40}
                style={{ opacity: 0.6 }}
              />

              <p>
                Select an incident from Operations Feed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FireDeptDashboard;

