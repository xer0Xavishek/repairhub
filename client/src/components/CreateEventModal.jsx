import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Plus, CheckCircle2, Navigation, Crosshair, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Apple-styled Orange Pin for Community Events
const pinIcon = L.divIcon({
  className: 'custom-event-picker-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #FF9500;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(255, 149, 0, 0.4);
      border: 2px solid #FFFFFF;
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Component to handle map clicks and move pin
function LocationPickerHandler({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
    },
  });

  return position ? <Marker position={position} icon={pinIcon} /> : null;
}

// Helper to recenter map programmatically
function ChangeMapView({ coords }) {
  const map = useMap();
  React.useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
}

const PRESET_HUBS = [
  { name: 'BRACU Merul Badda', address: 'BRAC University Main Campus, Merul Badda, Dhaka', latLng: [23.7712, 90.4255] },
  { name: 'Dhanmondi Lake', address: 'Dhanmondi Lake Park Amphitheater, Road 8/A, Dhaka', latLng: [23.7465, 90.3752] },
  { name: 'Gulshan 2', address: 'Gulshan Youth Club Grounds, Gulshan 2, Dhaka', latLng: [23.7895, 90.4172] },
  { name: 'Banani', address: 'Banani Community Center, Road 11, Dhaka', latLng: [23.7937, 90.4066] },
  { name: 'Mohakhali', address: 'Mohakhali Wireless Community Hall, Dhaka', latLng: [23.7781, 90.3995] },
  { name: 'Uttara Sector 3', address: 'Friends Club Ground, Sector 3, Uttara, Dhaka', latLng: [23.8699, 90.3995] },
  { name: 'Mirpur 10', address: 'Mirpur 10 Community Ground, Dhaka', latLng: [23.8070, 90.3685] },
  { name: 'Bashundhara R/A', address: 'Block D Central Park, Bashundhara R/A, Dhaka', latLng: [23.8150, 90.4280] },
];

export default function CreateEventModal({ isOpen, onClose, onEventCreated, currentUser }) {
  const isWorkshop = (currentUser?.role === 'Repairer' || currentUser?.role === 'repairer' || currentUser?.role === 'admin' || currentUser?.role === 'organizer') && currentUser?.technicianType !== 'freelance';

  const [formData, setFormData] = useState({
    title: '',
    date: '2026-09-12',
    time: '11:00 AM – 05:00 PM',
    venue: 'BRAC University Main Campus, Merul Badda, Dhaka',
    capacity: 25,
    categories: ['Electronics', 'Home Appliances'],
  });

  const [selectedLatLng, setSelectedLatLng] = useState([23.7712, 90.4255]); // Default: BRAC University Merul Badda
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleCategoryToggle = (cat) => {
    if (formData.categories.includes(cat)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter((c) => c !== cat),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, cat],
      });
    }
  };

  const handleSelectPreset = (preset) => {
    setSelectedLatLng(preset.latLng);
    setFormData((prev) => ({
      ...prev,
      venue: preset.address,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isWorkshop) {
      setErrorMessage('Only verified repair workshops can host community repair cafes. Customers and freelance fixers are not eligible.');
      return;
    }

    const token = localStorage.getItem('repairhub_token');
    const newEvent = {
      _id: `ev_${Date.now()}`,
      title: formData.title,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      latLng: selectedLatLng,
      capacity: Number(formData.capacity) || 25,
      currentRsvps: 1,
      categories: formData.categories.length > 0 ? formData.categories : ['General Repair'],
      userStatus: 'Attending (Organizer)',
      waitlist: [],
    };

    if (token) {
      try {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title,
            description: `Community repair session organized by ${currentUser?.businessName || currentUser?.name || 'Verified Workshop'}`,
            date: formData.date,
            startTime: formData.time.split('–')[0]?.trim() || '10:00 AM',
            endTime: formData.time.split('–')[1]?.trim() || '04:00 PM',
            venueName: formData.venue,
            capacity: Number(formData.capacity) || 25,
            categoriesHandled: formData.categories,
            coordinates: [selectedLatLng[1], selectedLatLng[0]],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.message || 'Failed to create event');
          return;
        }
      } catch (err) {
        console.warn('[Create Event Network Notice]:', err.message);
      }
    }

    setIsSuccess(true);
    if (onEventCreated) onEventCreated(newEvent);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1500);
  };

  const availableCategories = ['Electronics', 'Home Appliances', 'Clothing', 'Bicycles', 'Furniture', 'Small Motors', 'Other'];

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: 30, paddingBottom: 30 }}>
      <div 
        className="card-elevated" 
        style={{ 
          width: '100%', 
          maxWidth: 580, 
          maxHeight: '92vh',
          overflowY: 'auto',
          padding: '24px 28px', 
          background: 'var(--apple-white)' 
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, borderBottom: '1px solid var(--apple-border)', paddingBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-orange">Community Organizer Engine</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-label)', margin: '4px 0 2px' }}>
              Host a Community Repair Café
            </h3>
            <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
              Choose a location on the interactive map and set up free open repair sessions.
            </p>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 980 }}>
            <X size={17} />
          </button>
        </div>

        {errorMessage && (
          <div style={{ background: '#FFF0F0', border: '1px solid #FFD1D1', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#D32F2F', fontWeight: 600 }}>
            {errorMessage}
          </div>
        )}

        {isSuccess ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E8FAE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={30} style={{ color: '#34C759' }} />
            </div>
            <h4 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>Repair Café Published!</h4>
            <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: 0 }}>
              Pinned to <strong>[{selectedLatLng[0]}, {selectedLatLng[1]}]</strong> on the interactive map and shared with the Dhaka community.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Badda Fix-It & Electronics Clinic"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Event Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Max Attendee Capacity</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Interactive Location Picker Section */}
            <div style={{ background: '#F5F5F7', padding: '14px', borderRadius: 14, border: '1px solid var(--apple-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={14} style={{ color: '#FF9500' }} />
                  Choose Location on Map (Click to Pin)
                </label>
                <span className="badge badge-orange" style={{ fontSize: 11 }}>
                  📍 {selectedLatLng[0]}, {selectedLatLng[1]}
                </span>
              </div>

              {/* Quick Preset Hub Chips */}
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--apple-secondary)', display: 'block', marginBottom: 5 }}>
                  Quick Hub Presets:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {PRESET_HUBS.map((hub) => {
                    const isSelected = selectedLatLng[0] === hub.latLng[0] && selectedLatLng[1] === hub.latLng[1];
                    return (
                      <button
                        type="button"
                        key={hub.name}
                        onClick={() => handleSelectPreset(hub)}
                        style={{
                          padding: '3px 9px',
                          borderRadius: 980,
                          fontSize: 11,
                          fontWeight: isSelected ? 600 : 500,
                          border: isSelected ? '1px solid #FF9500' : '1px solid #D2D2D7',
                          background: isSelected ? '#FFF4E5' : '#FFFFFF',
                          color: isSelected ? '#C95100' : 'var(--apple-label)',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {hub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mini Leaflet Map */}
              <div style={{ height: 180, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--apple-border)', position: 'relative' }}>
                <MapContainer
                  center={selectedLatLng}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPickerHandler position={selectedLatLng} setPosition={setSelectedLatLng} />
                  <ChangeMapView coords={selectedLatLng} />
                </MapContainer>
                
                <div style={{ position: 'absolute', bottom: 6, left: 8, zIndex: 1000, pointerEvents: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', padding: '2px 8px', borderRadius: 980, fontSize: 10.5, fontWeight: 600, color: 'var(--apple-secondary)' }}>
                  Click anywhere to place the pin
                </div>
              </div>

              {/* Venue Address Input */}
              <div style={{ marginTop: 10 }}>
                <label className="label" style={{ marginBottom: 4 }}>Venue Address & Room / Hall Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BRAC University Main Campus, Auditorium Plaza, Merul Badda"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="input"
                  style={{ background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div>
              <label className="label">Volunteer Repair Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
                {availableCategories.map((cat) => {
                  const isSelected = formData.categories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 980,
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 500,
                        border: isSelected ? '1px solid #FF9500' : '1px solid var(--apple-border)',
                        background: isSelected ? '#FFF4E5' : '#F5F5F7',
                        color: isSelected ? '#C95100' : 'var(--apple-label)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '11px',
                fontSize: 14,
                borderRadius: 980,
                marginTop: 4,
                gap: 6
              }}
            >
              <Plus size={16} /> Publish Repair Café Event
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
