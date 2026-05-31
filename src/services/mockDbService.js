// Mock Database & Emergency Management API Engine

// Default metropolitan center coordinates (New York City area)
export const DEFAULT_MAP_CENTER = [40.730610, -73.935242];

// Initial mock data seeds
const SEED_INCIDENTS = [
  {
    id: "inc-101",
    description: "Structure fire reported in the commercial kitchen of a restaurant. Heavy black smoke pouring out from the back window.",
    location: {
      lat: 40.748440,
      lng: -73.985656,
      address: "Empire State Building District, New York, NY"
    },
    image_url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80",
    status: "resolved",
    priority: "high",
    reporter_id: "rep-001",
    reporter_name: "Sarah Jenkins",
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
    timeline: [
      { status: "active", message: "Emergency incident filed by Sarah Jenkins.", updated_at: new Date(Date.now() - 3 * 3600000).toISOString() },
      { status: "in-progress", message: "Station 4 dispatched Engine 2 and Ladder 1 to the scene.", updated_at: new Date(Date.now() - 2.8 * 3600000).toISOString() },
      { status: "on-scene", message: "Fire crews arrived on scene. Commencing primary search and setting up hose lines.", updated_at: new Date(Date.now() - 2.5 * 3600000).toISOString() },
      { status: "under-control", message: "Fire knock-down complete. Ventilation in progress. Under control.", updated_at: new Date(Date.now() - 1.5 * 3600000).toISOString() },
      { status: "resolved", message: "All hot spots extinguished. Scene turned back to owners. Responders returning.", updated_at: new Date(Date.now() - 1.0 * 3600000).toISOString() }
    ]
  },
  {
    id: "inc-102",
    description: "Minor vehicle engine fire on the shoulder of the expressway. Small flames visible from under the hood.",
    location: {
      lat: 40.712776,
      lng: -74.005974,
      address: "FDR Drive & Brooklyn Bridge Ramp, New York, NY"
    },
    image_url: "https://images.unsplash.com/photo-1608964395353-802308c33d24?auto=format&fit=crop&w=600&q=80",
    status: "in-progress",
    priority: "medium",
    reporter_id: "rep-002",
    reporter_name: "Marcus Aurelius",
    created_at: new Date(Date.now() - 40 * 60000).toISOString(), // 40 mins ago
    timeline: [
      { status: "active", message: "Vehicle fire reported by driver Marcus Aurelius.", updated_at: new Date(Date.now() - 40 * 60000).toISOString() },
      { status: "in-progress", message: "Engine 5 dispatched to FDR shoulder.", updated_at: new Date(Date.now() - 35 * 60000).toISOString() },
      { status: "on-scene", message: "Engine 5 on scene. Utilizing single line to extinguish engine compartment.", updated_at: new Date(Date.now() - 10 * 60000).toISOString() }
    ]
  },
  {
    id: "inc-103",
    description: "Brush fire detected in the corner of Central Park near the hiking trail. Spreading quickly over dry grass.",
    location: {
      lat: 40.782865,
      lng: -73.965355,
      address: "Central Park West, New York, NY"
    },
    image_url: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=600&q=80",
    status: "active",
    priority: "medium",
    reporter_id: "rep-003",
    reporter_name: "Elena Rostova",
    created_at: new Date(Date.now() - 10 * 60000).toISOString(), // 10 mins ago
    timeline: [
      { status: "active", message: "Brush fire reported by hiker Elena Rostova.", updated_at: new Date(Date.now() - 10 * 60000).toISOString() }
    ]
  }
];

const SEED_USERS = [
  { id: "rep-001", name: "Sarah Jenkins", email: "sarah.j@gmail.com", role: "public", trust_score: 95 },
  { id: "rep-002", name: "Marcus Aurelius", email: "marcus.a@philosophy.edu", role: "public", trust_score: 85 },
  { id: "rep-003", name: "Elena Rostova", email: "elena.r@hiker.org", role: "public", trust_score: 90 },
  { id: "rep-admin", name: "Commander Miller", email: "chief.miller@nyfd.gov", role: "fire-dept", trust_score: 100 }
];

// Helper to calculate distance in meters between two lat/lng points (Haversine Formula)
export function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simulated Database class
class MockDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("fd_incidents")) {
      localStorage.setItem("fd_incidents", JSON.stringify(SEED_INCIDENTS));
    }
    if (!localStorage.getItem("fd_users")) {
      localStorage.setItem("fd_users", JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem("fd_offline_queue")) {
      localStorage.setItem("fd_offline_queue", JSON.stringify([]));
    }
  }

  // INCIDENTS API
  getIncidents() {
    this.init();
    return JSON.parse(localStorage.getItem("fd_incidents"));
  }

  saveIncidents(incidents) {
    localStorage.setItem("fd_incidents", JSON.stringify(incidents));
  }

  // USERS API
  getUsers() {
    this.init();
    return JSON.parse(localStorage.getItem("fd_users"));
  }

  saveUsers(users) {
    localStorage.setItem("fd_users", JSON.stringify(users));
  }

  // Get active reporter or register a new one
  getOrCreateUser(name, email) {
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      user = {
        id: "rep-" + Math.floor(Math.random() * 10000),
        name,
        email,
        role: "public",
        trust_score: 80 // Default trust score
      };
      users.push(user);
      this.saveUsers(users);
    }
    return user;
  }

  // Smart Location/Duplicate Incident Proximity Check
  checkDuplicateIncident(lat, lng) {
    const incidents = this.getIncidents();
    // Proximity boundary is 150 meters
    const DUPLICATE_RADIUS_METERS = 150;
    
    // Find active or non-resolved incidents in proximity
    const duplicate = incidents.find(inc => {
      if (inc.status === "resolved") return false;
      const distance = getDistanceInMeters(
        lat, lng, 
        inc.location.lat, inc.location.lng
      );
      return distance <= DUPLICATE_RADIUS_METERS;
    });

    return duplicate || null;
  }

  // Smart AI Priority Detector based on text analysis
  detectPriority(description, reporterTrustScore = 80) {
    const desc = description.toLowerCase();
    
    // Core critical keywords triggers
    const highTriggers = ["trapped", "explosion", "gas leak", "chemical", "hospital", "school", "building fire", "people inside", "massive", "spreading fast", "commercial"];
    const mediumTriggers = ["smoke", "kitchen", "car fire", "vehicle", "brush", "spark", "electrical", "forest", "garage"];
    
    let score = 0;
    
    highTriggers.forEach(keyword => {
      if (desc.includes(keyword)) score += 3;
    });
    mediumTriggers.forEach(keyword => {
      if (desc.includes(keyword)) score += 1;
    });

    let detectedPriority = "low";
    if (score >= 3) {
      detectedPriority = "high";
    } else if (score >= 1) {
      detectedPriority = "medium";
    }

    // Trust Score adjustments (Spam mitigation)
    if (reporterTrustScore < 40) {
      // Degrade priority for spam-prone reporters
      if (detectedPriority === "high") detectedPriority = "medium";
      else if (detectedPriority === "medium") detectedPriority = "low";
    }

    return detectedPriority;
  }

  // SUBMIT INCIDENT
  submitIncident(data, isOnline = true) {
    const user = this.getOrCreateUser(data.name || "Anonymous", data.email || "anon@emergency.net");

    // Proximity duplicate check
    const duplicate = this.checkDuplicateIncident(data.lat, data.lng);
    if (duplicate && isOnline) {
      return { 
        success: false, 
        isDuplicate: true, 
        duplicateIncident: duplicate, 
        message: "This incident is already reported in this immediate area." 
      };
    }

    // AI Priority detection
    const priority = data.priority || this.detectPriority(data.description, user.trust_score);

    const newIncident = {
      id: "inc-" + Math.floor(100 + Math.random() * 900),
      description: data.description,
      location: {
        lat: data.lat,
        lng: data.lng,
        address: data.address || "Manually Dispatched Location"
      },
      image_url: data.image_url || "https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=600&q=80",
      status: "active",
      priority: priority,
      reporter_id: user.id,
      reporter_name: user.name,
      created_at: new Date().toISOString(),
      timeline: [
        { 
          status: "active", 
          message: `Emergency incident reported by ${user.name}. Auto-Priority evaluation determined priority: ${priority.toUpperCase()}.`, 
          updated_at: new Date().toISOString() 
        }
      ]
    };

    if (!isOnline) {
      // Save offline
      const queue = JSON.parse(localStorage.getItem("fd_offline_queue")) || [];
      queue.push(newIncident);
      localStorage.setItem("fd_offline_queue", JSON.stringify(queue));
      return { success: true, isOfflineSaved: true, incident: newIncident };
    }

    // Save online directly
    const incidents = this.getIncidents();
    incidents.unshift(newIncident);
    this.saveIncidents(incidents);

    // Dynamic Trust Score boost for successful reporting
    if (user.trust_score < 100) {
      const users = this.getUsers();
      const uIndex = users.findIndex(u => u.id === user.id);
      if (uIndex !== -1) {
        users[uIndex].trust_score = Math.min(100, users[uIndex].trust_score + 2);
        this.saveUsers(users);
      }
    }

    return { success: true, isOfflineSaved: false, incident: newIncident };
  }

  // OFFLINE QUEUE UTILS
  getOfflineQueue() {
    return JSON.parse(localStorage.getItem("fd_offline_queue")) || [];
  }

  syncOfflineReports() {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return 0;

    const incidents = this.getIncidents();
    // Filter duplicates and push to main database
    let syncCount = 0;
    queue.forEach(item => {
      // Recheck duplicate proximity in main database
      const isDuplicated = incidents.some(inc => {
        if (inc.status === "resolved") return false;
        return getDistanceInMeters(item.location.lat, item.location.lng, inc.location.lat, inc.location.lng) <= 150;
      });

      if (!isDuplicated) {
        // Sync up the timeline message to show offline submission timestamp
        item.timeline.push({
          status: item.status,
          message: "Report uploaded successfully after device regained internet connectivity.",
          updated_at: new Date().toISOString()
        });
        incidents.unshift(item);
        syncCount++;
      }
    });

    this.saveIncidents(incidents);
    localStorage.setItem("fd_offline_queue", JSON.stringify([]));
    return syncCount;
  }

  // STATUS UPDATER (Fire Department Official Access)
  updateIncidentStatus(incidentId, newStatus, customLogMessage = null) {
    const incidents = this.getIncidents();
    const index = incidents.findIndex(inc => inc.id === incidentId);
    if (index === -1) return { success: false, message: "Incident not found" };

    const oldStatus = incidents[index].status;
    incidents[index].status = newStatus;

    // Define standard timeline messaging based on state transitions
    let message = `Incident state transitioned from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}.`;
    if (customLogMessage) {
      message = customLogMessage;
    } else {
      switch (newStatus) {
        case "in-progress":
          message = "Emergency dispatch initiated. Crew is on route to target location.";
          break;
        case "on-scene":
          message = "First fire engine arrived on location. Command post established. Crew preparing active operations.";
          break;
        case "under-control":
          message = "Active flames knocked down. Fire isolated and venting procedures initiated.";
          break;
        case "resolved":
          message = "All active fires extinguished. Structural cooling completed. Rescue crew cleared standard dispatch.";
          break;
      }
    }

    incidents[index].timeline.push({
      status: newStatus,
      message: message,
      updated_at: new Date().toISOString()
    });

    this.saveIncidents(incidents);

    // If report was resolved and wasn't false alarm, reporter gets trust bonus
    if (newStatus === "resolved") {
      const reporterId = incidents[index].reporter_id;
      const users = this.getUsers();
      const uIndex = users.findIndex(u => u.id === reporterId);
      if (uIndex !== -1 && users[uIndex].trust_score < 100) {
        users[uIndex].trust_score = Math.min(100, users[uIndex].trust_score + 5);
        this.saveUsers(users);
      }
    }

    return { success: true, incident: incidents[index] };
  }

  // DISPATCH SIMULATED ENGINE
  dispatchEngine(incidentId, stationName = "Station 17") {
    const incidents = this.getIncidents();
    const index = incidents.findIndex(inc => inc.id === incidentId);
    if (index === -1) return { success: false };

    const dispatchTime = new Date().toISOString();
    incidents[index].status = "in-progress";
    incidents[index].timeline.push({
      status: "in-progress",
      message: `🚨 Dispatch Alert: Fire Dispatch dispatched Engine Truck from ${stationName} with 4 active responders. Estimated arrival in 4 minutes.`,
      updated_at: dispatchTime
    });

    this.saveIncidents(incidents);
    return { success: true, incident: incidents[index] };
  }

  // ADMIN ACTION: REMOVE REPORT / MARK SPAM
  markAsSpam(incidentId) {
    const incidents = this.getIncidents();
    const index = incidents.findIndex(inc => inc.id === incidentId);
    if (index === -1) return { success: false };

    const incident = incidents[index];
    const reporterId = incident.reporter_id;

    // Remove incident or mark as spam (we'll set status to resolved but flag it)
    incident.status = "resolved";
    incident.priority = "low";
    incident.timeline.push({
      status: "resolved",
      message: "⚠️ Admin Action: Report flagged as a false alarm / malicious spam. Dispatched response recalled.",
      updated_at: new Date().toISOString()
    });

    this.saveIncidents(incidents);

    // Severe reputation penalty for the user
    const users = this.getUsers();
    const uIndex = users.findIndex(u => u.id === reporterId);
    if (uIndex !== -1) {
      users[uIndex].trust_score = Math.max(0, users[uIndex].trust_score - 30);
      this.saveUsers(users);
    }

    return { success: true, userTrustScore: uIndex !== -1 ? users[uIndex].trust_score : null };
  }

  // ADMIN ACTION: MANAGE USER ROLE
  changeUserRole(userId, newRole) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return { success: false };

    users[index].role = newRole;
    this.saveUsers(users);
    return { success: true, user: users[index] };
  }
}

export const mockDb = new MockDatabase();
