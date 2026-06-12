import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const riderIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/857/857681.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

export function UniversalMap({ center, markerTitle, onMapClick, riderPos, restPos }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('g_maps_key') || '');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (apiKey) {
      const scriptId = 'google-maps-api-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.onload = () => setGoogleLoaded(true);
        document.head.appendChild(script);
      } else if (window.google) {
        setGoogleLoaded(true);
      }
    } else {
      setGoogleLoaded(false);
    }
  }, [apiKey]);

  useEffect(() => {
    if (googleLoaded && mapRef.current && window.google) {
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: center[0], lng: center[1] },
          zoom: 13,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] }
          ]
        });

        new window.google.maps.Marker({
          position: { lat: center[0], lng: center[1] },
          map,
          title: markerTitle || 'Your Location',
        });

        if (restPos) {
          new window.google.maps.Marker({
            position: { lat: restPos[0], lng: restPos[1] },
            map,
            icon: 'https://cdn-icons-png.flaticon.com/32/857/857681.png',
            title: 'Restaurant',
          });
        }

        if (riderPos) {
          new window.google.maps.Marker({
            position: { lat: riderPos[0], lng: riderPos[1] },
            map,
            icon: 'https://cdn-icons-png.flaticon.com/32/2972/2972185.png',
            title: 'Delivery Rider',
          });
        }

        if (onMapClick) {
          map.addListener('click', (e) => {
            onMapClick([e.latLng.lat(), e.latLng.lng()]);
          });
        }
      } catch (err) {
        console.error('Google Map failed to init:', err);
      }
    }
  }, [googleLoaded, center, riderPos, restPos]);

  const saveApiKey = (newKey) => {
    localStorage.setItem('g_maps_key', newKey);
    setApiKey(newKey);
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: '999', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input 
          type="password" 
          placeholder="Google Maps API Key..." 
          style={{ background: 'var(--bg-primary)', color: 'white', border: '1px solid var(--border-color)', outline: 'none', padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px' }}
          defaultValue={apiKey}
          onBlur={(e) => saveApiKey(e.target.value)}
        />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {googleLoaded ? '🟢 Google Map active' : '⚪ Using Leaflet'}
        </span>
      </div>

      {googleLoaded ? (
        <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
      ) : (
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker position={center}><Popup>{markerTitle || 'Selected Location'}</Popup></Marker>
          {restPos && <Marker position={restPos} icon={restaurantIcon}><Popup>Restaurant</Popup></Marker>}
          {riderPos && <Marker position={riderPos} icon={riderIcon}><Popup>Rider is on the way</Popup></Marker>}
          {onMapClick && <ClickMapHelper onMapClick={onMapClick} />}
        </MapContainer>
      )}
    </div>
  );
}

function ClickMapHelper({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick([e.latlng.lat, e.latlng.lng]); } });
  return null;
}
