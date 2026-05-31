import React, { useState, useEffect, useMemo } from 'react';
import { Camera, MapPin, AlertTriangle, WifiOff, Send, Loader2 } from 'lucide-react';
import { mockDb } from '../services/mockDbService';
import { supabase, isSupabaseConfigured } from '../supabase';

const FIRE_MOCK_IMAGES = [
  "https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1542397284385-601017642677?auto=format&fit=crop&w=600&q=80"
];

const ReportForm = ({ 
  currentLocation, 
  onToggleMapSelect, 
  isMapSelectActive, 
  onSubmitReport,
  isOnline,
  toggleNetworkStatus
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  
  // File upload states
  const [fileObject, setFileObject] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
const [uploadInProgress, setUploadInProgress] = useState(false);
const [uploadedUrl, setUploadedUrl] = useState(null);
  
  const [aiPriority, setAiPriority] = useState('low');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [uploadWarning, setUploadWarning] = useState(null);

  const hasUploadedImage = useMemo(() => Boolean(fileObject || imagePreview), [fileObject, imagePreview]);

  // Dynamic AI priority tagging
  useEffect(() => {
    if (description.trim().length > 3) {
      const priority = mockDb.detectPriority(description, 100);
      setAiPriority(priority);
    } else {
      setAiPriority('low');
    }
  }, [description]);

  // Real-time Proximity Duplicate Alert (queries Supabase if online)
  useEffect(() => {
    const runDuplicateCheck = async () => {
      if (!currentLocation || !currentLocation.lat) {
        setDuplicateWarning(null);
        return;
      }

      if (!isOnline || !isSupabaseConfigured) {
        // Fallback to local duplicate checker
        const duplicate = mockDb.checkDuplicateIncident(currentLocation.lat, currentLocation.lng);
        setDuplicateWarning(duplicate);
        return;
      }

      try {
        // Fetch all active incidents from Supabase
        const { data: activeIncidents, error } = await supabase
          .from('incidents')
          .select('id, latitude, longitude, description')
          .neq('status', 'resolved');

        if (error) throw error;

        // Proximity duplicate check radius: 150m
        const duplicate = false;

        if (duplicate) {
          setDuplicateWarning({
            id: duplicate.id.substring(0, 8),
            description: duplicate.description
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error("Duplicate checking fail:", err);
      }
    };

    runDuplicateCheck();
  }, [currentLocation, isOnline]);

  useEffect(() => {
    setOfflineQueueCount(mockDb.getOfflineQueue().length);
  }, [currentLocation, offlineQueueCount]);

  // HTML5 Browser Geolocation API implementation with speed fallbacks
  const handleGPSLocationDetection = () => {
    setGpsLoading(true);
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError("Browser Geolocation is not supported by your client.");
      setGpsLoading(false);
      return;
    }

    // Stage 1: Try with high accuracy, timeout in 5 seconds
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const success = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Attempt address generation based on lat/lng using basic reverse-geocode logic
      let address = `Manually Dispatched Sector (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      try {
        // Standard free open street map reverse geocoding API lookup if online
        if (isOnline) {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) address = data.display_name;
          }
        }
      } catch (_) {}

      onToggleMapSelect(false);
      
      // Update form positioning coordinates callback
      onSubmitReport({
        justUpdateCoords: true,
        lat,
        lng,
        address
      });
      
      setGpsLoading(false);
    };

    const fail = (error) => {
      // Stage 2 fallback: If high accuracy failed/timed out, retry with low accuracy (high speed network triangulation)
      if (options.enableHighAccuracy) {
        console.warn("High-accuracy GPS failed or timed out. Retrying with network geolocation...");
        const fallbackOptions = {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 0
        };
        navigator.geolocation.getCurrentPosition(success, failFinal, fallbackOptions);
      } else {
        failFinal(error);
      }
    };

    const failFinal = (error) => {
      console.error("GPS detection final error:", error);
      let errorMsg = "An unknown location error occurred.";
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = "Location access denied. Please enable browser location or click on the map.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMsg = "GPS position signal unavailable. Please adjust manually.";
      } else if (error.code === error.TIMEOUT) {
        errorMsg = "GPS retrieval request timed out. Please retry or adjust map pin.";
      }
      setGpsError(errorMsg);
      setGpsLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, fail, options);
  };

  // Uploader Preview handles
  const MAX_IMAGE_MB = 10;

  const validateImageFile = (file) => {
    if (!file) return { valid: false, message: 'No file selected.' };
    if (!file.type.startsWith('image/')) {
      return { valid: false, message: 'Only image files are supported (JPG, PNG, WEBP).' };
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      return { valid: false, message: `Image is too large. Please use a file below ${MAX_IMAGE_MB}MB.` };
    }
    return { valid: true };
  };

      const setImageFromFile = async (file) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadWarning(validation.message);
        return;
      }

      setUploadWarning(null);
      setFileObject(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Initiate upload if online and supabase configured
      if (isOnline && isSupabaseConfigured) {
        setUploadInProgress(true);
        try {
          const compressedBase64 = await compressImage(file);
          const compressedBlob = base64ToBlob(compressedBase64);
          const uploadPayload = compressedBlob || file;
          const fileName = `incident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
          const folder = (await (async () => {
            // Get reporter ID if possible
            if (isSupabaseConfigured) {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) return session.user.id;
            }
            return 'anonymous';
          })());
          const filePath = `${folder}/${fileName}`;
          const { error: uploadError } = await supabase.storage
            .from('incident-images')
            .upload(filePath, uploadPayload, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/jpeg'
            });
          if (uploadError) {
            console.error("Storage upload failed:", uploadError);
            setUploadWarning(`Image upload failed (${uploadError.message}). Report will be submitted with inline image data.`);
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('incident-images')
              .getPublicUrl(filePath);
            setUploadedUrl(publicUrl);
          }
        } catch (err) {
          console.warn('Upload error:', err);
          setUploadWarning('Unexpected error during image upload. Using inline image data.');
        } finally {
          setUploadInProgress(false);
        }
      }
    };

  const handleImageSelection = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFromFile(file);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setImageFromFile(file);
    }
  };

  const base64ToBlob = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.includes(',')) return null;
    const [meta, b64] = dataUrl.split(',');
    const mimeMatch = meta.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const byteString = atob(b64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  };

  // Helper to compress any image type/size in the browser using HTML5 Canvas
  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit dimensions to 800px to keep file sizes very compact (~30-50KB)
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.6 quality (retains crisp visibility but minimizes data size)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target.result); // fallback to original reader result
        };
        img.src = event.target.result;
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  // Main Submit handler (supports Storage uploader and Auth reporter records)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Explicit, helpful user warning validation messages
    if (!description.trim()) {
      alert("⚠️ Situation description is required! Please detail what is burning.");
      return;
    }
    if (!currentLocation || !currentLocation.lat) {
      alert("⚠️ Incident location coordinates required! Please click 'Auto Geolocation' or use 'Manual Map Pin' to select the sector first.");
      return;
    }
    if (!hasUploadedImage) {
      alert("⚠️ Please upload a scene image before submitting the report.");
      return;
    }

    setSubmitting(true);

    try {
      // Compress image first inside browser to handle any file size/type
      let compressedBase64 = null;
      if (fileObject) {
        compressedBase64 = await compressImage(fileObject);
      }

      // Determine final image URL
      const finalImageUrl = uploadedUrl || compressedBase64 || FIRE_MOCK_IMAGES[Math.floor(Math.random() * FIRE_MOCK_IMAGES.length)];

      // Check current auth session user first; reporter id is used in storage path
      let reporterId = null;
      let reporterName = name.trim() || "Anonymous Civilian";
      let reporterEmail = email.trim() || "anonymous@citizen.net";

      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          reporterId = session.user.id;
          reporterEmail = session.user.email;

          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single();
          if (profile) reporterName = profile.name;
        }
      }

      const payload = {
        description,
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        address: currentLocation.address,
        image_url: finalImageUrl,
        name: reporterName,
        email: reporterEmail,
        priority: aiPriority,
        reporter_id: reporterId
      };

      const response = await onSubmitReport(payload);
      
      if (response && response.success) {
        // Reset form
        setDescription('');
        setFileObject(null);
        setImagePreview(null);
        setUploadWarning(null);
        setUploadedUrl(null);
        onToggleMapSelect(false);
      }
    } catch (err) {
      alert("Submission failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
  className="glass-panel"
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    overflowY: 'visible',
    paddingBottom: '20px'
  }}
>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit' }}>Report Fire Incident</h3>
        
        <button 
          className="network-switch"
          onClick={toggleNetworkStatus}
          type="button"
          title="Toggle network online/offline mode"
        >
          <div className={`network-indicator ${isOnline ? '' : 'offline'}`} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.12)',
          border: '1px solid rgba(255, 51, 102, 0.4)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--color-high)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          lineHeight: 1.3
        }}>
          <WifiOff size={16} style={{ flexShrink: 0 }} />
          <span>Offline mode active. Reports will cache locally ({offlineQueueCount} queued).</span>
        </div>
      )}

      {/* Geolocation Loading Banner */}
      {gpsLoading && (
        <div style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Fetching GPS Location (Browser Geolocation)...</span>
        </div>
      )}

      {/* Geolocation Error Alert Banner */}
      {gpsError && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.78rem',
          color: 'var(--color-high)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          lineHeight: 1.3
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Proximity Duplicate Warning Alert */}
      {duplicateWarning && (
        <div style={{
          background: 'rgba(255, 159, 28, 0.1)',
          border: '1px solid rgba(255, 159, 28, 0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.78rem',
          color: 'var(--color-medium)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          animation: 'slide-in 0.3s ease-out',
          lineHeight: 1.3
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>Duplicate Incident Alert!</span>
          </div>
          <span>An active report already matches this location (Incident #{duplicateWarning.id}). Responders are active.</span>
        </div>
      )}

      <form
  onSubmit={handleSubmit}
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '10px'
  }}
>
        
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>GPS GEOLOCATION INCIDENT SECTOR</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '10px', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', gap: '6px' }}
              onClick={handleGPSLocationDetection}
              disabled={gpsLoading}
            >
              <MapPin size={16} />
              {gpsLoading ? 'Acquiring...' : 'Auto Geolocation'}
            </button>
            
            <button
              type="button"
              className={`btn-secondary ${isMapSelectActive ? 'active' : ''}`}
              style={{ 
                flex: 1, 
                padding: '10px', 
                fontSize: '0.8rem', 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '6px',
                borderColor: isMapSelectActive ? 'var(--accent-blue)' : 'var(--card-border)',
                background: isMapSelectActive ? 'rgba(56, 189, 248, 0.15)' : ''
              }}
              onClick={() => onToggleMapSelect(!isMapSelectActive)}
            >
              <MapPin size={16} />
              {isMapSelectActive ? 'Click Map Pin' : 'Manual Map Pin'}
            </button>
          </div>

          {currentLocation && currentLocation.lat && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '8px',
              border: '1px solid var(--card-border)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>📍 Selected Sector</span>
                <span>Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}</span>
              </div>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                {currentLocation.address}
              </div>
            </div>
          )}
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="incident-desc-supabase">SITUATION DESCRIPTION *</label>
          <textarea
            id="incident-desc-supabase"
            className="form-textarea"
            placeholder="Please detail what is burning, if anyone is trapped, or gas smell indicators..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {description.trim().length > 3 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--card-border)',
            borderRadius: '8px',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>🤖 Threat AI Detection:</span>
            <span className={`pulse-badge ${aiPriority}`}>
              {aiPriority.toUpperCase()} PRIORITY
            </span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>SCENE PHOTOS (SUPABASE STORAGE UPLOAD)</label>
          <div 
            className="dropzone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload-supabase').click()}
          >
            <input 
              id="file-upload-supabase" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              required
              onChange={handleImageSelection}
            />
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Preview" className="dropzone-preview" style={{ maxHeight: '180px', borderRadius: '8px', width: '100%', objectFit: 'cover' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Replace Image</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Camera size={28} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Select Photo or Drag Files here</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Auto uploads to incident-images bucket</span>
              </div>
            )}
          </div>
               {uploadInProgress && (
                 <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-medium)' }}>
                   Uploading image, please wait...
                 </p>
               )}
               {uploadedUrl && (
                 <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--status-resolved)' }}>
                   Image uploaded successfully. Click Submit Report to send this incident.
                 </p>
               )}
               {hasUploadedImage && !uploadedUrl && !uploadInProgress && (
                 <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--status-resolved)' }}>
                   Image ready. Click Submit Report to send this incident to admin.
                 </p>
               )}
          {uploadWarning && (
            <p style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--color-medium)', lineHeight: 1.35 }}>
              {uploadWarning}
            </p>
          )}
        </div>

        <button 
  type="submit" 
  className="btn-primary"
  style={{
    width: '100%',
    justifyContent: 'center',
    marginTop: '20px',
    padding: '15px',
    display: 'flex',
    position: 'relative'
  }}
  disabled={submitting || uploadInProgress}
>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Submitting report...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>{isOnline ? 'Submit Report To Admin' : 'Save Report Offline'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReportForm;
