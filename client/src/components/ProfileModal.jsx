import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Building, 
  Wrench, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ShieldCheck, 
  Sparkles,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// Custom Pin Markers for Profile Map Picker
const customerPinIcon = L.divIcon({
  className: 'custom-auth-customer-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #0071E3;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0, 113, 227, 0.4);
      border: 2px solid #FFFFFF;
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const workshopPinIcon = L.divIcon({
  className: 'custom-auth-workshop-marker',
  html: `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #34C759;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(52, 199, 89, 0.4);
      border: 2px solid #FFFFFF;
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function LocationPickerHandler({ position, setPosition, icon }) {
  useMapEvents({
    click(e) {
      setPosition([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
    },
  });

  return position ? <Marker position={position} icon={icon} /> : null;
}

function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 14, { animate: true });
    }
  }, [coords, map]);
  return null;
}

const PRESET_HUBS = [
  { name: 'BRACU Merul Badda', address: 'Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212', latLng: [23.7712, 90.4255] },
  { name: 'Dhanmondi', address: 'Road 8/A, Dhanmondi, Dhaka 1209', latLng: [23.7465, 90.3752] },
  { name: 'Gulshan 1 & 2', address: 'Gulshan Avenue, Dhaka 1212', latLng: [23.7895, 90.4172] },
  { name: 'Banani', address: 'Road 11, Banani, Dhaka 1213', latLng: [23.7937, 90.4066] },
  { name: 'Mohakhali', address: 'Mohakhali C/A, Wireless Gate, Dhaka 1212', latLng: [23.7781, 90.3995] },
  { name: 'Uttara', address: 'Sector 3, Jashimuddin Ave, Uttara, Dhaka', latLng: [23.8699, 90.3995] },
  { name: 'Mirpur 10', address: 'Mirpur 10 Circle, Dhaka 1216', latLng: [23.8070, 90.3685] },
  { name: 'Bashundhara', address: 'Block C, Bashundhara R/A, Dhaka', latLng: [23.8150, 90.4280] },
];

export default function ProfileModal({ isOpen, onClose, currentUser, onProfileUpdated }) {
  const [name, setName]                   = useState('');
  const [phone, setPhone]                 = useState('');
  const [address, setAddress]             = useState('');
  const [selectedLatLng, setSelectedLatLng] = useState([23.7712, 90.4255]);
  
  // Technician specific fields
  const [businessName, setBusinessName]   = useState('');
  const [category, setCategory]           = useState('Electronics');
  const [startingRate, setStartingRate]   = useState(300);
  const [technicianType, setTechnicianType] = useState('workshop');

  // Security / Password
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);

  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [successMsg, setSuccessMsg]       = useState('');

  const isRepairer = currentUser?.role === 'Repairer' || currentUser?.role === 'repairer';
  const isAdmin    = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
  const isCustomer = !isRepairer && !isAdmin;

  // Initialize fields on open
  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || 'BRAC University Main Campus, Merul Badda, Dhaka');
      
      const coords = currentUser.location?.coordinates 
        ? [currentUser.location.coordinates[1], currentUser.location.coordinates[0]] // [lat, lng]
        : currentUser.latLng || [23.7712, 90.4255];
      setSelectedLatLng(coords);

      if (isRepairer) {
        setBusinessName(currentUser.businessName || '');
        setCategory(currentUser.categories?.[0] || 'Electronics');
        setStartingRate(currentUser.startingRate || currentUser.priceRangeMin || 300);
        setTechnicianType(currentUser.technicianType || 'workshop');
      }

      setError('');
      setSuccessMsg('');
      setPassword('');
    }
  }, [currentUser, isOpen, isRepairer]);

  if (!isOpen || !currentUser) return null;

  const handleSelectPreset = (preset) => {
    setSelectedLatLng(preset.latLng);
    setAddress(preset.address);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      coordinates: [selectedLatLng[1], selectedLatLng[0]], // [longitude, latitude]
      password: password ? password : undefined,
    };

    if (isRepairer) {
      payload.businessName = businessName.trim();
      payload.categories = [category];
      payload.startingRate = Number(startingRate);
      payload.technicianType = technicianType;
    }

    try {
      const token = localStorage.getItem('repairhub_token');
      const res = await axios.put('/api/auth/profile', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.success) {
        const updatedUser = {
          ...currentUser,
          ...res.data.data,
          role: currentUser.role, // preserve role formatting
        };
        localStorage.setItem('repairhub_user', JSON.stringify(updatedUser));
        onProfileUpdated(updatedUser);
        setSuccessMsg('Profile and location details updated successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      // Fallback for mock demo accounts
      if (currentUser._id?.startsWith('demo_') || currentUser._id?.startsWith('user_') || currentUser._id?.startsWith('rep_') || currentUser._id?.startsWith('admin_')) {
        const updatedUser = {
          ...currentUser,
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          latLng: selectedLatLng,
          location: {
            type: 'Point',
            coordinates: [selectedLatLng[1], selectedLatLng[0]],
            address: address.trim(),
          },
          businessName: isRepairer ? businessName.trim() : undefined,
          categories: isRepairer ? [category] : undefined,
          startingRate: isRepairer ? Number(startingRate) : undefined,
          technicianType: isRepairer ? technicianType : undefined,
        };
        localStorage.setItem('repairhub_user', JSON.stringify(updatedUser));
        onProfileUpdated(updatedUser);
        setSuccessMsg('Profile and map pin saved successfully!');
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }
      setError(err.response?.data?.message || 'Failed to update profile. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ alignItems: 'flex-start', paddingTop: 24, paddingBottom: 24 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="card-elevated"
        style={{ 
          width: '100%', 
          maxWidth: 560, 
          maxHeight: '94vh',
          overflowY: 'auto',
          padding: '28px 30px', 
          position: 'relative', 
          background: 'var(--apple-white)' 
        }}
      >
        {/* Close Button */}
        <button onClick={onClose} className="btn-ghost" style={{ position: 'absolute', top: 16, right: 16, padding: '6px 8px', borderRadius: 980 }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span className="badge badge-blue">
              <User size={11} /> Profile & Settings
            </span>
            <span className={`badge ${isAdmin ? 'badge-purple' : isRepairer ? 'badge-green' : 'badge-neutral'}`}>
              {currentUser.role} Account
            </span>
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--apple-label)', letterSpacing: '-0.02em', margin: '4px 0 2px' }}>
            Edit Personal & Location Details
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
            Update your verified phone number, street address, and exact location pin on the map.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ display: 'flex', gap: 8, background: '#FFEBE9', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: 'var(--apple-red)', fontSize: 13, alignItems: 'center' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ display: 'flex', gap: 8, background: '#E8FAE8', border: '1px solid #C8E6C9', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: '#1B6B4A', fontSize: 13, alignItems: 'center' }}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Basic Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="label">Full Name</label>
              <input className="input" type="text" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Registered Email</label>
              <input className="input" type="email" disabled value={currentUser.email || ''} style={{ background: '#F0F0F2', color: 'var(--apple-secondary)', cursor: 'not-allowed' }} />
            </div>
          </div>

          {/* Contact Phone Number */}
          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Phone size={12} style={{ color: 'var(--apple-blue)' }} /> Contact / Phone Number
            </label>
            <input 
              className="input" 
              type="tel" 
              placeholder="e.g. +880 1711-234567" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
            />
          </div>

          {/* Role-Specific: Technician Details */}
          {isRepairer && (
            <div style={{ background: '#F5F5F7', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--apple-border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Workshop & Service Profile
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Business / Workshop Name</label>
                  <input className="input" type="text" required value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Primary Repair Category</label>
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    {['Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label">Base Diagnostic Fee (৳)</label>
                  <input className="input" type="number" min="100" max="2000" step="50" value={startingRate} onChange={e => setStartingRate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Operating Model</label>
                  <select className="input" value={technicianType} onChange={e => setTechnicianType(e.target.value)}>
                    <option value="workshop">Physical Storefront Workshop</option>
                    <option value="freelance">Freelance Mobile Fixer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map Location Pin Picker */}
          {!isAdmin && (
            <div style={{ background: '#F5F5F7', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--apple-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} style={{ color: isCustomer ? 'var(--apple-blue)' : '#34C759' }} />
                  {isCustomer ? 'Home / Pickup Location (Click Pin on Map)' : 'Workshop Physical Location (Pinned on Map)'}
                </label>
                <span className={`badge ${isCustomer ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: 10.5 }}>
                  📍 {selectedLatLng[0]}, {selectedLatLng[1]}
                </span>
              </div>

              {/* Quick Preset Hub Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {PRESET_HUBS.map((hub) => {
                  const isSelected = selectedLatLng[0] === hub.latLng[0] && selectedLatLng[1] === hub.latLng[1];
                  return (
                    <button
                      type="button"
                      key={hub.name}
                      onClick={() => handleSelectPreset(hub)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 980,
                        fontSize: 10.5,
                        fontWeight: isSelected ? 600 : 500,
                        border: isSelected ? '1px solid var(--apple-blue)' : '1px solid #D2D2D7',
                        background: isSelected ? 'var(--apple-blue-light)' : '#FFFFFF',
                        color: isSelected ? 'var(--apple-blue)' : 'var(--apple-label)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {hub.name}
                    </button>
                  );
                })}
              </div>

              {/* Mini Map */}
              <div style={{ height: 140, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--apple-border)', position: 'relative' }}>
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
                  <LocationPickerHandler
                    position={selectedLatLng}
                    setPosition={setSelectedLatLng}
                    icon={isCustomer ? customerPinIcon : workshopPinIcon}
                  />
                  <ChangeMapView coords={selectedLatLng} />
                </MapContainer>
                
                <div style={{ position: 'absolute', bottom: 4, left: 6, zIndex: 1000, pointerEvents: 'none', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 980, fontSize: 10, fontWeight: 600, color: 'var(--apple-secondary)' }}>
                  Click anywhere on the map to reposition your pin
                </div>
              </div>

              {/* Street Address */}
              <div style={{ marginTop: 8 }}>
                <label className="label" style={{ fontSize: 11 }}>Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  style={{ background: '#FFFFFF', fontSize: 12.5, padding: '7px 12px' }}
                />
              </div>
            </div>
          )}

          {/* Security & Password */}
          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} style={{ color: 'var(--apple-tertiary)' }} /> Change Password (Leave blank to keep current)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="New password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-tertiary)', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', padding: '11px', borderRadius: 980 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2, justifyContent: 'center', padding: '11px', borderRadius: 980, gap: 6 }}
            >
              <Save size={14} /> {loading ? 'Saving Changes…' : 'Save Profile & Location'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
