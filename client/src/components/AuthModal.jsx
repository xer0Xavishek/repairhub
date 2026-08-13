import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  Wrench, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Phone,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

// Custom Map Marker Icons for Location Picker
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
  React.useEffect(() => {
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

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister]       = useState(false);
  const [loginRole, setLoginRole]         = useState('User'); // 'User' | 'Admin'
  const [activeRole, setActiveRole]       = useState('Customer'); // 'Customer', 'Technician'
  
  // Technician sub-type
  const [technicianType, setTechnicianType] = useState('workshop'); // 'workshop' or 'freelance'
  
  // Basic fields
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  
  // Technician specific fields
  const [businessName, setBusinessName]   = useState('');
  const [startingRate, setStartingRate]   = useState(300);
  const [category, setCategory]           = useState('Electronics');

  // Location & Address
  const [address, setAddress]             = useState('BRAC University Main Campus, Merul Badda, Dhaka');
  const [selectedLatLng, setSelectedLatLng] = useState([23.7712, 90.4255]); // Default: Merul Badda

  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);

  if (!isOpen) return null;

  const getStrength = (pwd) => {
    if (!pwd) return null;
    if (pwd.length < 6)  return { label: 'Too short', pct: 25, color: 'var(--apple-red)' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
      return { label: 'Strong', pct: 100, color: '#34C759' };
    return { label: 'Fair', pct: 60, color: '#FF9500' };
  };

  const strength = getStrength(password);

  const handleSelectPreset = (preset) => {
    setSelectedLatLng(preset.latLng);
    setAddress(preset.address);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && password.length < 6) { 
      setError('Password must be at least 6 characters in length.'); 
      return; 
    }
    setLoading(true);
    try {
      if (isRegister) {
        const payload = {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          role: activeRole === 'Customer' ? 'requester' : activeRole === 'Technician' ? 'repairer' : 'admin',
          technicianType: activeRole === 'Technician' ? technicianType : undefined,
          address: address.trim(),
          coordinates: [selectedLatLng[1], selectedLatLng[0]], // [lon, lat] for GeoJSON
          latLng: selectedLatLng,
          businessName: activeRole === 'Technician' ? (businessName.trim() || `${name}'s ${technicianType === 'freelance' ? 'Mobile Repair' : 'Workshop'}`) : undefined,
          categories: activeRole === 'Technician' ? [category] : undefined,
          startingRate: activeRole === 'Technician' ? Number(startingRate) : undefined,
        };

        const res = await axios.post('/api/auth/register', payload);
        if (res.data.success) {
          const roleDisplay = payload.role === 'requester' ? 'Customer' : payload.role === 'repairer' ? 'Repairer' : 'Admin';
          const d = {
            ...res.data.data,
            role: roleDisplay,
            phone: payload.phone,
            latLng: selectedLatLng,
            address: address.trim(),
            technicianType: payload.technicianType,
            businessName: payload.businessName,
            startingRate: payload.startingRate,
          };
          sessionStorage.setItem('repairhub_token', d.token);
          sessionStorage.setItem('repairhub_user', JSON.stringify(d));
          localStorage.setItem('repairhub_token', d.token);
          localStorage.setItem('repairhub_user', JSON.stringify(d));
          onAuthSuccess(d);
          onClose();
        }
      } else {
        const loginPayload = {
          email: email.trim(),
          password,
          requiredRole: loginRole === 'Admin' ? 'admin' : undefined,
          loginRole: loginRole.toLowerCase(),
        };
        const res = await axios.post('/api/auth/login', loginPayload);
        if (res.data.success) {
          const raw = res.data.data;
          const roleDisplay = raw.role === 'requester' ? 'Customer' : raw.role === 'repairer' ? 'Repairer' : raw.role === 'admin' ? 'Admin' : raw.role;
          const d = {
            ...raw,
            role: roleDisplay,
          };
          sessionStorage.setItem('repairhub_token', d.token);
          sessionStorage.setItem('repairhub_user', JSON.stringify(d));
          localStorage.setItem('repairhub_token', d.token);
          localStorage.setItem('repairhub_user', JSON.stringify(d));
          onAuthSuccess(d);
          onClose();
        }
      }
    } catch (err) {
      const backendMsg = err.response?.data?.message;
      if (backendMsg) {
        setError(backendMsg);
      } else if (isRegister) {
        setError('Account creation failed. Please check your inputs and try again.');
      } else {
        setError('Authentication error. Invalid email or password.');
      }
    } finally { setLoading(false); }
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
          maxWidth: isRegister ? 540 : 440, 
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
              <Sparkles size={11} /> Unified Identity & Access
            </span>
          </div>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: 'var(--apple-label)', letterSpacing: '-0.02em', margin: '4px 0 2px' }}>
            {isRegister 
              ? (activeRole === 'Customer' ? 'Create Customer Account' : technicianType === 'workshop' ? 'Register Repair Workshop' : 'Register Freelance Fixer')
              : (loginRole === 'Admin' ? 'Admin Gateway Sign In' : 'Welcome to repairhub')}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
            {isRegister 
              ? (activeRole === 'Customer' 
                  ? 'Book repairs, request quotes, and participate in community repair cafés.' 
                  : technicianType === 'workshop'
                  ? 'Register your workshop storefront and lab pinned to the Dhaka repair map.'
                  : 'Offer mobile and freelance repair services across Dhaka communities.')
              : (loginRole === 'Admin'
                  ? 'Sign in to access platform governance, dispute escrow vault, and moderation.'
                  : 'Sign in to access your repair orders, protected vault, and active workbench.')}
          </p>
        </div>

        {/* Dynamic Mode Tabs: User vs Admin on Sign In; Role Selector on Registration */}
        {!isRegister ? (
          <div style={{ background: '#EAEAEE', padding: 3, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 16 }}>
            {[
              { id: 'User', label: 'User Sign In', icon: <User size={13} /> },
              { id: 'Admin', label: 'Admin Sign In', icon: <Shield size={13} /> },
            ].map((tab) => {
              const isSel = loginRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLoginRole(tab.id);
                    setError('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: 9,
                    border: 'none',
                    background: isSel ? '#FFFFFF' : 'transparent',
                    color: isSel ? 'var(--apple-label)' : 'var(--apple-secondary)',
                    fontWeight: isSel ? 700 : 500,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ background: '#EAEAEE', padding: 3, borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 16 }}>
            {[
              { id: 'Customer', label: 'Customer', icon: <User size={13} /> },
              { id: 'Workshop', label: 'Workshop', icon: <Building size={13} /> },
              { id: 'Freelance', label: 'Freelancer', icon: <Wrench size={13} /> },
            ].map((tab) => {
              const isSel = activeRole === 'Customer' 
                ? tab.id === 'Customer' 
                : (technicianType === 'workshop' ? tab.id === 'Workshop' : tab.id === 'Freelance');
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (tab.id === 'Customer') {
                      setActiveRole('Customer');
                    } else if (tab.id === 'Workshop') {
                      setActiveRole('Technician');
                      setTechnicianType('workshop');
                      if (!businessName) setBusinessName(`${name ? name + "'s" : 'Precision'} Repair Lab`);
                    } else {
                      setActiveRole('Technician');
                      setTechnicianType('freelance');
                      if (!businessName) setBusinessName(`${name ? name : 'Freelance'} Mobile Fixer`);
                    }
                    setError('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '7px 6px',
                    borderRadius: 9,
                    border: 'none',
                    background: isSel ? '#FFFFFF' : 'transparent',
                    color: isSel ? 'var(--apple-label)' : 'var(--apple-secondary)',
                    fontWeight: isSel ? 700 : 500,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: isSel ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}



        {/* Error Alert */}
        {error && (
          <div style={{ display: 'flex', gap: 8, background: '#FFEBE9', border: '1px solid #FFCDD2', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: 'var(--apple-red)', fontSize: 13, alignItems: 'center' }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {isRegister && (
            <div style={{ display: 'grid', gridTemplateColumns: activeRole === 'Technician' ? '1fr 1fr' : '1fr', gap: 10 }}>
              <div>
                <label className="label">{activeRole === 'Technician' ? 'Technician Full Name' : 'Full Name'}</label>
                <input className="input" type="text" required placeholder="e.g. Avishek Biswas" value={name} onChange={e => setName(e.target.value)} />
              </div>
              {activeRole === 'Technician' && (
                <div>
                  <label className="label">{technicianType === 'workshop' ? 'Workshop Business Name' : 'Freelance Title'}</label>
                  <input className="input" type="text" required placeholder="e.g. Badda Precision Lab" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {isRegister && activeRole === 'Technician' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="label">Primary Repair Category</label>
                <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                  {['Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Base Diagnostic Fee (৳)</label>
                <input className="input" type="number" min="100" max="2000" step="50" value={startingRate} onChange={e => setStartingRate(e.target.value)} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isRegister ? '1fr 1fr' : '1fr', gap: 10 }}>
            <div>
              <label className="label">Email Address</label>
              <input 
                className="input" 
                type="email" 
                required 
                placeholder={!isRegister && loginRole === 'Admin' ? 'admin@repairhub.com' : 'you@example.com'} 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>

            {isRegister && (
              <div>
                <label className="label">Contact / Phone Number</label>
                <input className="input" type="tel" placeholder="017XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                {isRegister && strength && (
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
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
          </div>

          {/* Interactive Location Picker for Registration */}
          {isRegister && activeRole !== 'Admin' && (
            <div style={{ background: '#F5F5F7', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--apple-border)', marginTop: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} style={{ color: activeRole === 'Customer' ? 'var(--apple-blue)' : technicianType === 'workshop' ? '#34C759' : '#FF9500' }} />
                  {activeRole === 'Customer' 
                    ? 'Home / Pickup Location (Click to Pin)' 
                    : technicianType === 'workshop'
                    ? 'Workshop Physical Location (Pinned on Map)'
                    : 'Freelance Base Area (Click to Pin)'}
                </label>
                <span className={`badge ${activeRole === 'Customer' ? 'badge-blue' : technicianType === 'workshop' ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 10.5 }}>
                  📍 {selectedLatLng[0]}, {selectedLatLng[1]}
                </span>
              </div>

              {/* Privacy Notice for Customers vs Public Notice for Workshops */}
              {activeRole === 'Customer' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#0058B0', background: '#EBF5FF', padding: '5px 8px', borderRadius: 8, marginBottom: 8 }}>
                  <ShieldCheck size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Private & Encrypted:</strong> Visible <em>only</em> to your assigned technician upon quote acceptance.</span>
                </div>
              ) : technicianType === 'workshop' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#1B6B4A', background: '#E8FAE8', padding: '5px 8px', borderRadius: 8, marginBottom: 8 }}>
                  <Building size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Public Map Pin:</strong> Workshop will appear with custom pin for local customer bookings.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#C95100', background: '#FFF4E5', padding: '5px 8px', borderRadius: 8, marginBottom: 8 }}>
                  <Zap size={13} style={{ flexShrink: 0 }} />
                  <span><strong>Mobile On-Demand:</strong> You will be notified for home visits and repair requests in this radius.</span>
                </div>
              )}

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
              <div style={{ height: 130, width: '100%', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--apple-border)', position: 'relative' }}>
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
                    icon={activeRole === 'Customer' ? customerPinIcon : workshopPinIcon}
                  />
                  <ChangeMapView coords={selectedLatLng} />
                </MapContainer>
                
                <div style={{ position: 'absolute', bottom: 4, left: 6, zIndex: 1000, pointerEvents: 'none', background: 'rgba(255,255,255,0.92)', padding: '2px 6px', borderRadius: 980, fontSize: 10, fontWeight: 600, color: 'var(--apple-secondary)' }}>
                  Click map to adjust pin location
                </div>
              </div>

              {/* Street Address */}
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  required
                  placeholder={activeRole === 'Customer' ? "e.g. House 12, Road 4, Merul Badda, Dhaka" : "e.g. Kha 224 Pragati Sarani, Merul Badda, Dhaka"}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  style={{ background: '#FFFFFF', fontSize: 12.5, padding: '7px 12px' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14, borderRadius: 980, marginTop: 4, opacity: loading ? 0.6 : 1 }}
          >
            {loading 
              ? 'Securing session…' 
              : isRegister 
              ? (activeRole === 'Customer' 
                  ? 'Create Customer Account' 
                  : (technicianType === 'workshop' ? 'Register & Pin Workshop on Map' : 'Register as Freelance Fixer')) 
              : (loginRole === 'Admin' ? 'Sign In as Administrator' : 'Sign In')}
          </button>
        </form>

        {/* Toggle Mode */}
        {(!isRegister && loginRole === 'Admin') ? null : (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--apple-secondary)', marginTop: 14, marginBottom: 0 }}>
            {isRegister ? 'Already registered? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-blue)', fontWeight: 600, fontSize: 13 }}
            >
              {isRegister ? 'Sign In' : 'Create an Account'}
            </button>
          </p>
        )}

      </div>
    </div>
  );
}
