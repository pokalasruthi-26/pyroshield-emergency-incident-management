import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DEFAULT_MAP_CENTER } from '../services/mockDbService';

const createPulsingIcon = (priority, status) => {
  let className = `map-pulse-marker ${priority}`;

  if (status === 'resolved') {
    className = 'map-pulse-marker resolved';
  }

  return L.divIcon({
    html: `<div class="${className}"></div>`,
    className: 'custom-map-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const MapComponent = ({
  incidents,
  onSelectIncident,
  selectedIncident,
  reportingLocation,
  onLocationChange,
  isReportingMode
}) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});
  const reportingMarkerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        center: DEFAULT_MAP_CENTER,
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap & CARTO',
          subdomains: 'abcd',
          maxZoom: 20
        }
      ).addTo(leafletMap.current);

      // Manual Pin Placement
      leafletMap.current.on('click', (e) => {
        if (!isReportingMode || !onLocationChange) return;

        onLocationChange({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        });
      });
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
      reportingMarkerRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Incident Markers
  useEffect(() => {
    if (!leafletMap.current) return;

    Object.keys(markersRef.current).forEach((id) => {
      const exists = incidents.find((inc) => inc.id === id);

      if (!exists) {
        leafletMap.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    incidents.forEach((inc) => {
      const lat = inc.location?.lat;
      const lng = inc.location?.lng;

      if (lat == null || lng == null) return;

      if (markersRef.current[inc.id]) {
        markersRef.current[inc.id].setLatLng([lat, lng]);
        markersRef.current[inc.id].setIcon(
          createPulsingIcon(inc.priority, inc.status)
        );
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPulsingIcon(inc.priority, inc.status)
        }).addTo(leafletMap.current);

        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 0.875rem;">
            <strong>Incident ${inc.id}</strong>
          </div>
        `);

        marker.on('click', () => {
          onSelectIncident(inc);
        });

        markersRef.current[inc.id] = marker;
      }
    });
  }, [incidents, onSelectIncident]);

  // Auto GPS Location + Manual Pin Marker
  useEffect(() => {
    if (!leafletMap.current || !reportingLocation) return;

    const { lat, lng } = reportingLocation;

    if (lat == null || lng == null) return;

    if (reportingMarkerRef.current) {
      reportingMarkerRef.current.setLatLng([lat, lng]);
    } else {
      reportingMarkerRef.current = L.marker([lat, lng], {
        icon: createPulsingIcon('live')
      })
        .addTo(leafletMap.current)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 0.875rem;">
            <strong>Your Live Position</strong>
          </div>
        `);
    }

    leafletMap.current.setView([lat, lng], 16);
  }, [reportingLocation]);

  // Focus selected incident
  useEffect(() => {
    if (!leafletMap.current || !selectedIncident) return;

    const lat =
      selectedIncident.location?.lat ?? selectedIncident.latitude;

    const lng =
      selectedIncident.location?.lng ?? selectedIncident.longitude;

    if (lat == null || lng == null) return;

    leafletMap.current.setView([lat, lng], 15);
  }, [selectedIncident]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default MapComponent;