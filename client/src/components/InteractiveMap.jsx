import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Star, 
  Wrench, 
  Calendar, 
  ShieldCheck, 
  Navigation, 
  Filter, 
  Users, 
  Layers, 
  Compass, 
  ChevronRight,
  Phone,
  Clock,
  Search,
  CheckCircle2
} from 'lucide-react';

// Custom Ares-styled SVG Map Pin Icons
const createCustomIcon = (type, label) => {
  const isWorkshop = type === 'repairer';
  const bgColor = isWorkshop ? '#CB4D22' : '#2D1B11';
  const iconSvg = isWorkshop
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;

  return L.divIcon({
    className: 'custom-apple-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        background: ${bgColor};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid #FFFFFF;
        cursor: pointer;
      ">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
};

// Haversine Distance Formula (km) between two Lat/Lng points
function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Component to dynamically re-center map when selection changes
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      try {
        map.flyTo(center, zoom || 14, { duration: 1.2 });
      } catch (err) {
        console.warn('Map flyTo warning:', err?.message);
      }
    }
  }, [center, zoom, map]);
  return null;
}

export default function InteractiveMap({ 
  repairers = [], 
  events = [], 
  currentUser,
  onBookSlot, 
  onRequestQuote, 
  onRSVPEvent 
}) {
  // Default coordinates fallback for Dhaka
  const defaultDhaka = [23.7925, 90.4078];

  // Enhanced dataset with geo-coordinates and computed Haversine distance
  const enrichedRepairers = repairers.map((r, i) => {
    const coordsMap = [
      [23.7806, 90.4193], // Gulshan 1
      [23.7937, 90.4066], // Banani
      [23.7781, 90.3995], // Mohakhali
      [23.7509, 90.3871], // Dhanmondi
      [23.8699, 90.3995], // Uttara
    ];
    const latLng = r.latLng || coordsMap[i % coordsMap.length] || defaultDhaka;
    const computedKm = calculateHaversineKm(defaultDhaka[0], defaultDhaka[1], latLng[0], latLng[1]);
    return {
      ...r,
      latLng,
      computedDistanceKm: computedKm,
      displayDistance: `${computedKm.toFixed(1)} km`,
    };
  });

  const enrichedEvents = events.map((ev, i) => {
    const coordsMap = [
      [23.7712, 90.4255], // BRACU New Main Campus, Merul Badda
      [23.7895, 90.4172], // Gulshan Youth Club
      [23.7465, 90.3752], // Dhanmondi Lake Park
    ];
    const rawCoords = ev.latLng || (ev.location?.coordinates ? [ev.location.coordinates[1], ev.location.coordinates[0]] : null);
    const validLatLng = (Array.isArray(rawCoords) && rawCoords.length === 2 && !isNaN(rawCoords[0]) && !isNaN(rawCoords[1]))
      ? rawCoords
      : (coordsMap[i % coordsMap.length] || [23.7850, 90.4100]);

    const formattedDate = ev.date
      ? (typeof ev.date === 'string' && !ev.date.includes('T')
          ? ev.date
          : new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))
      : 'Upcoming Date';

    return {
      ...ev,
      title: ev.title || 'Community Repair Café',
      venue: ev.venue || ev.location?.venueName || 'Community Hub, Dhaka',
      address: ev.address || ev.location?.address || ev.venue || 'Dhaka, Bangladesh',
      date: formattedDate,
      time: ev.time || (ev.startTime ? `${ev.startTime} – ${ev.endTime || '04:00 PM'}` : '10:00 AM – 04:00 PM'),
      categories: Array.isArray(ev.categories) && ev.categories.length > 0 
        ? ev.categories 
        : (Array.isArray(ev.categoriesHandled) && ev.categoriesHandled.length > 0 ? ev.categoriesHandled : ['Electronics', 'Small Appliances', 'Bicycles']),
      currentRsvps: Number(ev.currentRsvps != null ? ev.currentRsvps : (ev.rsvps?.length || 0)),
      capacity: Number(ev.capacity || 25),
      latLng: validLatLng,
    };
  });

  const [selectedEntity, setSelectedEntity] = useState({
    type: 'repairer',
    data: enrichedRepairers[0] || null,
  });

  const [repairerReviews, setRepairerReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (selectedEntity?.type === 'repairer' && selectedEntity.data?._id) {
      const repId = selectedEntity.data._id;
      if (repId.length === 24) {
        setLoadingReviews(true);
        fetch(`/api/reviews/repairer/${repId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && Array.isArray(data.data)) {
              setRepairerReviews(data.data);
            } else {
              setRepairerReviews([]);
            }
          })
          .catch(() => setRepairerReviews([]))
          .finally(() => setLoadingReviews(false));
      } else {
        setRepairerReviews([]);
      }
    } else {
      setRepairerReviews([]);
    }
  }, [selectedEntity?.type, selectedEntity?.data?._id]);

  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [radiusKm, setRadiusKm] = useState(8);
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [showFilters, setShowFilters] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultDhaka);

  const categories = ['All', 'Electronics', 'Home Appliances', 'Furniture', 'Textiles & Clothing', 'Bicycles', 'Mechanical', 'Other'];

  const filteredRepairers = enrichedRepairers.filter((r) => {
    const matchesCategory = filterCategory === 'All' || (r.categories && r.categories.includes(filterCategory));
    const matchesDistance = (Number(r.computedDistanceKm) || 0) <= radiusKm;
    const matchesRating = !minRating || (Number(r.rating) || 0) >= minRating;
    const matchesPrice = !r.startingRate || (Number(r.startingRate) || 0) <= maxPrice;
    const sTerm = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !sTerm || 
      (r.businessName || '').toLowerCase().includes(sTerm) ||
      (r.name || '').toLowerCase().includes(sTerm) ||
      (r.address || '').toLowerCase().includes(sTerm);
    return matchesCategory && matchesDistance && matchesRating && matchesPrice && matchesSearch;
  });

  const filteredEvents = enrichedEvents.filter((e) => {
    const matchesCategory = !filterCategory || filterCategory === 'All' || (e.categories && e.categories.includes(filterCategory));
    const sTerm = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !sTerm || 
      (e.title || '').toLowerCase().includes(sTerm) || 
      (e.venue || '').toLowerCase().includes(sTerm);
    return matchesCategory && matchesSearch;
  });

  const handleSelectRepairer = (rep) => {
    if (!rep) return;
    setSelectedEntity({ type: 'repairer', data: rep });
    if (rep.latLng && Array.isArray(rep.latLng) && rep.latLng.length === 2 && !isNaN(rep.latLng[0]) && !isNaN(rep.latLng[1])) {
      setMapCenter(rep.latLng);
    }
  };

  const handleSelectEvent = (ev) => {
    if (!ev) return;
    setSelectedEntity({ type: 'event', data: ev });
    if (ev.latLng && Array.isArray(ev.latLng) && ev.latLng.length === 2 && !isNaN(ev.latLng[0]) && !isNaN(ev.latLng[1])) {
      setMapCenter(ev.latLng);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      
      {/* Top Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' }}>
          
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--apple-secondary)' }}>Category:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat) => {
                const isActive = filterCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className="nav-pill"
                    style={{
                      padding: '5px 12px',
                      borderRadius: 2,
                      fontSize: 12.5,
                      fontWeight: isActive ? 600 : 500,
                      background: isActive ? '#CB4D22' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#2D1B11',
                      border: isActive ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                      cursor: 'pointer'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search, Radius & Filter Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFFFFF',
              border: '1px solid #EAE0D6',
              borderRadius: 2,
              padding: '4px 10px',
              minWidth: 180,
            }}>
              <Search size={13} style={{ color: '#7A6458', flexShrink: 0 }} />
              <input 
                type="text"
                placeholder="Search workshop or café..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: 12,
                  color: '#2D1B11',
                  width: '100%',
                  background: 'transparent'
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#7A6458', padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            <label style={{ fontSize: 12.5, color: '#7A6458', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
              Radius: <strong style={{ color: '#2D1B11', minWidth: 42 }}>{radiusKm} km</strong>
              <input 
                type="range" 
                min={1} 
                max={15} 
                value={radiusKm} 
                onChange={(e) => setRadiusKm(+e.target.value)} 
                style={{ width: 80, accentColor: '#CB4D22' }} 
              />
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary"
              style={{ 
                padding: '5px 12px', 
                fontSize: 12, 
                gap: 6,
                background: showFilters ? '#F5EBE6' : '#FFFFFF',
                color: showFilters ? '#CB4D22' : '#2D1B11',
                borderColor: showFilters ? '#CB4D22' : '#EAE0D6'
              }}
            >
              <Filter size={13} /> Filters
            </button>
          </div>
        </div>

        {/* Extended Filter Drawer */}
        {showFilters && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EAE0D6', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: '#7A6458' }}>Minimum Rating:</span>
              {[0, 4.5, 4.8, 4.9].map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 2,
                    fontSize: 12,
                    fontWeight: minRating === r ? 600 : 500,
                    border: minRating === r ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                    background: minRating === r ? '#CB4D22' : '#FFFFFF',
                    color: minRating === r ? '#FFFFFF' : '#2D1B11',
                    cursor: 'pointer',
                  }}
                >
                  {r === 0 ? 'Any' : `★ ${r}+`}
                </button>
              ))}
            </div>

            <label style={{ fontSize: 12.5, color: '#7A6458', display: 'flex', alignItems: 'center', gap: 8 }}>
              Max Diagnostic Rate: <strong style={{ color: '#2D1B11' }}>৳{maxPrice}</strong>
              <input 
                type="range" 
                min={200} 
                max={1000} 
                step={100} 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(+e.target.value)} 
                style={{ width: 110, accentColor: '#CB4D22' }} 
              />
            </label>
          </div>
        )}
      </div>

      {/* Main Grid: Live Interactive Map + Detailed Inspector Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 18 }}>

        {/* Live Leaflet Map Container */}
        <div 
          className="card" 
          style={{ 
            padding: 0, 
            height: 520, 
            position: 'relative', 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Top Overlaid Status Badge */}
          <div style={{ 
            position: 'absolute', 
            top: 14, 
            left: 14, 
            zIndex: 1000, 
            display: 'flex', 
            gap: 8,
            pointerEvents: 'none'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(12px)',
              padding: '6px 14px',
              borderRadius: 980,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--apple-label)'
            }}>
              <Navigation size={13} style={{ color: '#CB4D22' }} />
              Dhaka Region · Leaflet OSM
            </div>

            <span className="badge badge-blue" style={{ backdropFilter: 'blur(12px)', background: 'rgba(235, 245, 255, 0.92)' }}>
              {filteredRepairers.length} Repairers
            </span>
            <span className="badge badge-orange" style={{ backdropFilter: 'blur(12px)', background: 'rgba(255, 244, 229, 0.92)' }}>
              {filteredEvents.length} Cafés
            </span>
          </div>

          {/* True React-Leaflet Map Instance */}
          <MapContainer
            center={mapCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', borderRadius: 16 }}
          >
            {/* Clean OpenStreetMap Tiles (100% Free, No Watermarks or API Keys Required) */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            <MapRecenter center={mapCenter} zoom={13} />

            {/* Radius Visualization Ring */}
            <Circle
              center={defaultDhaka}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#CB4D22',
                fillColor: '#CB4D22',
                fillOpacity: 0.06,
                weight: 1.5,
                dashArray: '4, 6',
              }}
            />

            {/* Repairer Markers */}
            {filteredRepairers.map((rep) => (
              <Marker
                key={rep._id}
                position={rep.latLng}
                icon={createCustomIcon('repairer', rep.businessName)}
                eventHandlers={{
                  click: () => handleSelectRepairer(rep),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 175 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 2 }}>
                      {rep.businessName}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--apple-secondary)', marginBottom: 6 }}>
                      {rep.address}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginBottom: 8 }}>
                      {Number(rep.reviewsCount) > 0 && Number(rep.rating) > 0 ? (
                        <span style={{ color: '#C95100', fontWeight: 600 }}>★ {Number(rep.rating).toFixed(1)} ({rep.reviewsCount})</span>
                      ) : (
                        <span style={{ color: 'var(--apple-tertiary)', fontWeight: 500 }}>Unrated (0)</span>
                      )}
                      <span style={{ color: '#CB4D22', fontWeight: 600 }}>From ৳{rep.startingRate}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {((currentUser?.role || '').toLowerCase() !== 'repairer') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onBookSlot) onBookSlot(rep);
                          }}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            background: '#CB4D22',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 2,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Book Slot
                        </button>
                      )}
                      {((currentUser?.role || '').toLowerCase() !== 'repairer') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRequestQuote) onRequestQuote(rep);
                          }}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            background: '#F5EBE6',
                            color: '#CB4D22',
                            border: '1px solid #CB4D22',
                            borderRadius: 2,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Quote
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Repair Cafe Markers */}
            {filteredEvents.map((ev) => {
              const liveEvent = enrichedEvents.find(e => e._id === ev._id) || ev;
              const isAttending = liveEvent.userStatus === 'Attending' || liveEvent.userStatus?.includes('Organizer');
              const isWaitlisted = liveEvent.userStatus?.includes('Waitlisted');
              const isFull = liveEvent.currentRsvps >= liveEvent.capacity;

              return (
                <Marker
                  key={ev._id}
                  position={ev.latLng}
                  icon={createCustomIcon('event', ev.title)}
                  eventHandlers={{
                    click: () => handleSelectEvent(liveEvent),
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 185 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 2 }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--apple-secondary)', marginBottom: 6 }}>
                        {ev.venue}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, marginBottom: 8 }}>
                        {isAttending ? (
                          <span className="badge badge-green" style={{ padding: '1px 6px', fontSize: 10.5 }}>✓ RSVP Confirmed</span>
                        ) : isWaitlisted ? (
                          <span className="badge badge-orange" style={{ padding: '1px 6px', fontSize: 10.5 }}>Waitlisted</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ padding: '1px 6px', fontSize: 10.5 }}>Community Café</span>
                        )}
                        <span style={{ color: 'var(--apple-secondary)' }}>{liveEvent.currentRsvps}/{liveEvent.capacity}</span>
                      </div>
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRSVPEvent) onRSVPEvent(ev._id);
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            background: isAttending ? '#FFEBE9' : isFull ? '#FFF4E5' : '#2D1B11',
                            color: isAttending ? '#D32F2F' : isFull ? '#C95100' : '#FFFFFF',
                            border: isAttending ? '1px solid #FFCDD2' : 'none',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isAttending ? 'Cancel Reservation' : isWaitlisted ? 'Leave Waitlist' : isFull ? 'Join Waitlist' : 'Reserve Free Pass'}
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Empty Filter State Overlay */}
          {filteredRepairers.length === 0 && (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid #EAE0D6',
              borderRadius: 4,
              padding: '10px 18px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12.5,
              color: '#2D1B11'
            }}>
              <span>No workshops found within {radiusKm} km.</span>
              <button
                onClick={() => {
                  setFilterCategory('All');
                  setRadiusKm(15);
                  setMinRating(0);
                  setMaxPrice(5000);
                }}
                style={{
                  background: '#CB4D22',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 2,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Selected Entity Inspector Sidebar */}
        <div className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', height: 520, overflowY: 'auto' }}>
          
          {selectedEntity?.type === 'repairer' && selectedEntity.data && (() => {
            const rep = selectedEntity.data;
            const reviewsTotal = repairerReviews.length;
            const hasReviews = reviewsTotal > 0;
            const computedAvg = hasReviews
              ? (repairerReviews.reduce((sum, r) => sum + (Number(r.averageRating || r.rating) || 0), 0) / reviewsTotal).toFixed(1)
              : (Number(rep.rating) > 0 && Number(rep.reviewsCount) > 0 ? Number(rep.rating).toFixed(1) : null);
            const displayCount = hasReviews ? reviewsTotal : (Number(rep.reviewsCount) || 0);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span className={rep.technicianType === 'freelance' ? 'badge badge-orange' : 'badge badge-green'}>
                      <ShieldCheck size={12} /> {rep.technicianType === 'freelance' ? 'Freelance Fixer' : 'Verified Workshop'}
                    </span>
                    {displayCount > 0 && computedAvg ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 13, fontWeight: 700, color: '#C95100' }}>
                        <Star size={13} style={{ fill: '#FF9500', color: '#FF9500' }} />
                        {computedAvg}
                        <span style={{ fontWeight: 400, color: 'var(--apple-tertiary)' }}>({displayCount})</span>
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 500, color: 'var(--apple-secondary)' }}>
                        <Star size={13} style={{ color: '#B8A898' }} />
                        <span>Unrated</span>
                        <span style={{ fontWeight: 400, color: 'var(--apple-tertiary)' }}>(0)</span>
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 4 }}>
                    {rep.businessName}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
                    Master Lead: {rep.name}
                  </p>
                </div>

                <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <MapPin size={15} style={{ color: '#CB4D22', flexShrink: 0, marginTop: 1 }} />
                    <span>{rep.address} <span style={{ color: 'var(--apple-tertiary)' }}>({rep.displayDistance || rep.distance})</span></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <Wrench size={15} style={{ color: '#CB4D22', flexShrink: 0, marginTop: 1 }} />
                    <span>Diagnostic base rate: <strong style={{ color: '#CB4D22' }}>৳{rep.startingRate}</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <Clock size={15} style={{ color: 'var(--apple-secondary)', flexShrink: 0, marginTop: 1 }} />
                    <span>Open Mon–Sat: 09:30 AM – 08:00 PM</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Authorized Specialties
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {rep.categories?.map((c, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: 12 }}>{c}</span>
                    ))}
                  </div>
                </div>

                {/* Customer Reviews Section */}
                <div style={{ marginTop: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Customer Reviews ({repairerReviews.length})
                    </div>
                  </div>

                  {loadingReviews ? (
                    <div style={{ fontSize: 12, color: 'var(--apple-secondary)', padding: '6px 0' }}>Loading reviews...</div>
                  ) : repairerReviews.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--apple-secondary)', background: '#FDFBF9', padding: '8px 10px', borderRadius: 4, border: '1px dashed #EAE0D6' }}>
                      No verified customer reviews yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                      {repairerReviews.map((rev) => (
                        <div key={rev._id} style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 4, padding: '6px 10px', fontSize: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, color: 'var(--apple-label)' }}>
                              {rev.requesterId?.name || rev.reviewerId?.name || 'Customer'}
                            </span>
                            <span style={{ color: '#FF9500', fontSize: 11 }}>
                              {'★'.repeat(Math.max(0, Math.min(5, Math.floor(Number(rev.averageRating || rev.rating) || 5))))}
                            </span>
                          </div>
                          {rev.comment && (
                            <p style={{ margin: 0, color: 'var(--apple-secondary)', fontSize: 11.5, fontStyle: 'italic' }}>
                              "{rev.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                  {((currentUser?.role || '').toLowerCase() === 'repairer') ? (
                    <div style={{ padding: '10px 14px', background: '#FFF4E5', border: '1px solid #FFE0B2', borderRadius: 4, fontSize: 12.5, color: '#C95100', textAlign: 'center', lineHeight: 1.4 }}>
                      Diagnostic booking and custom quote requests are reserved for customers
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => onBookSlot && onBookSlot(rep)} 
                        className="btn-primary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                      >
                        <Calendar size={15} /> Book diagnostic slot
                      </button>
                      <button 
                        onClick={() => onRequestQuote && onRequestQuote(rep)} 
                        className="btn-secondary" 
                        style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                      >
                        Request custom quote
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {selectedEntity?.type === 'event' && selectedEntity.data && (() => {
            const ev = (enrichedEvents.find(e => e._id === selectedEntity.data._id) || selectedEntity.data) || {};
            const isAttending = ev.userStatus === 'Attending' || (typeof ev.userStatus === 'string' && ev.userStatus.includes('Organizer'));
            const isWaitlisted = typeof ev.userStatus === 'string' && ev.userStatus.includes('Waitlisted');
            const isFull = (Number(ev.currentRsvps) || 0) >= (Number(ev.capacity) || 25);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="badge badge-orange">
                      <Users size={12} /> Community Fix-It Café
                    </span>
                    {isAttending ? (
                      <span className="badge badge-green" style={{ fontSize: 11 }}>✓ RSVP Confirmed</span>
                    ) : isWaitlisted ? (
                      <span className="badge badge-orange" style={{ fontSize: 11 }}>Waitlist Active</span>
                    ) : (
                      <span className="badge badge-neutral" style={{ fontSize: 11 }}>Open Pass</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 4 }}>
                    {ev.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0 }}>
                    Free Community Workshop
                  </p>
                </div>

                <div style={{ background: '#F5F5F7', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <Calendar size={15} style={{ color: 'var(--apple-orange)', flexShrink: 0, marginTop: 1 }} />
                    <span>{ev.date} · {ev.time}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <MapPin size={15} style={{ color: 'var(--apple-orange)', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{ fontWeight: 600 }}>{ev.venue}</div>
                      {ev.address && ev.address !== ev.venue && (
                        <div style={{ fontSize: 12, color: 'var(--apple-secondary)', marginTop: 2 }}>{ev.address}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--apple-label)' }}>
                    <Users size={15} style={{ color: 'var(--apple-orange)', flexShrink: 0, marginTop: 1 }} />
                    <span>{ev.currentRsvps}/{ev.capacity} Slots Claimed {isFull ? '(Waitlist Active)' : ''}</span>
                  </div>
                </div>

                {isAttending && (
                  <div style={{ background: '#E8FAE8', border: '1px solid #C8E6C9', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, color: '#2E7D32', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} style={{ color: '#34C759', flexShrink: 0 }} />
                    <span>Your RSVP pass is confirmed! Present your name at the entrance.</span>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Accepting Categories
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(Array.isArray(ev.categories) ? ev.categories : ['Electronics', 'Small Appliances', 'Bicycles']).map((c, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: 12 }}>{c}</span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  <button
                    onClick={() => onRSVPEvent && onRSVPEvent(ev._id)}
                    className={isAttending ? 'btn-secondary' : isFull ? 'btn-secondary' : 'btn-primary'}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      padding: '10px 16px', 
                      fontSize: 14,
                      background: isAttending ? '#FFEBE9' : isFull ? '#FFF4E5' : '#CB4D22',
                      color: isAttending ? '#D32F2F' : isFull ? '#C95100' : '#FFFFFF',
                      border: isAttending ? '1px solid #FFCDD2' : 'none',
                    }}
                  >
                    <Users size={15} /> {isAttending ? 'Cancel Reservation (Release Spot)' : isWaitlisted ? 'Leave Waitlist' : isFull ? 'Join Waitlist (Queue #1)' : 'Reserve Free Pass'}
                  </button>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
