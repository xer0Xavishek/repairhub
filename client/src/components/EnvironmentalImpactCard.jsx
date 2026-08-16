import React, { useState, useEffect } from 'react';
import { Leaf, Zap, Recycle, Award, Globe, User } from 'lucide-react';

export default function EnvironmentalImpactCard({ currentUser }) {
  const [activeScope, setActiveScope] = useState('user'); // 'user' | 'global'
  const [userImpact, setUserImpact] = useState(null);
  const [globalImpact, setGlobalImpact] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImpactData() {
      // 1. Fetch global impact
      try {
        const gRes = await fetch('/api/impact/global');
        const gData = await gRes.json();
        if (isMounted && gData?.success && gData?.data) {
          setGlobalImpact(gData.data);
        }
      } catch (err) {
        console.warn('[EnvironmentalImpactCard] Global impact fetch error:', err);
      }

      // 2. Fetch user impact if authenticated
      const token =
        currentUser?.token ||
        sessionStorage.getItem('repairhub_token') ||
        localStorage.getItem('repairhub_token');

      if (token) {
        try {
          const uRes = await fetch('/api/impact/user', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const uData = await uRes.json();
          if (isMounted && uData?.success && uData?.data) {
            setUserImpact(uData.data);
          }
        } catch (err) {
          console.warn('[EnvironmentalImpactCard] User impact fetch error:', err);
        }
      }
    }

    loadImpactData();
    window.addEventListener('repairhub:repair_status_updated', loadImpactData);
    return () => {
      isMounted = false;
      window.removeEventListener('repairhub:repair_status_updated', loadImpactData);
    };
  }, [currentUser]);

  // Determine active dataset
  const isGlobal = activeScope === 'global';
  const data = isGlobal ? globalImpact : userImpact;

  // Formatted metric values with sensible fallbacks
  const co2Saved =
    data?.totalCo2SavedKg != null
      ? Number(data.totalCo2SavedKg).toFixed(1)
      : isGlobal
      ? (globalImpact?.totalCo2SavedKg != null ? Number(globalImpact.totalCo2SavedKg).toFixed(1) : '0.0')
      : '0.0';

  const wasteDiverted =
    data?.totalWasteDivertedKg != null
      ? Number(data.totalWasteDivertedKg).toFixed(1)
      : isGlobal
      ? (globalImpact?.totalWasteDivertedKg != null ? Number(globalImpact.totalWasteDivertedKg).toFixed(1) : '0.0')
      : '0.0';

  const treesCount =
    data?.treesEquivalent != null
      ? data.treesEquivalent
      : (Number(co2Saved) / 21.77).toFixed(1);

  const energyKwh =
    data?.energySavedKwh != null
      ? data.energySavedKwh
      : (Number(co2Saved) * 5.28).toFixed(0);

  const completedCount = isGlobal
    ? globalImpact?.totalRepairsCompleted || 0
    : userImpact?.completedRepairsCount || 0;

  const moneySaved =
    data?.moneySavedEstimated != null
      ? Number(data.moneySavedEstimated).toLocaleString()
      : (completedCount * 3500).toLocaleString();

  // Dynamic Badge calculation
  let badgeText = 'Tier 1 Circular Contributor';
  if (isGlobal) {
    const totalRepairs = globalImpact?.totalRepairsCompleted || 0;
    badgeText = `${totalRepairs} Community Repair${totalRepairs !== 1 ? 's' : ''} Completed`;
  } else if (userImpact?.badges && userImpact.badges.length > 0) {
    const highestBadge = userImpact.badges[userImpact.badges.length - 1];
    badgeText = `${highestBadge.icon || '🌱'} ${highestBadge.title}`;
  } else if (userImpact?.completedRepairsCount > 0) {
    badgeText = 'Tier 1 First Fix Pioneer 🌱';
  } else {
    badgeText = 'Circular Member';
  }

  return (
    <div className="card" id="environmental-impact-card" style={{ padding: '24px 28px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: 0 }}>
              Circular Impact
            </h2>

            {/* Scope Toggle: My Impact vs Community */}
            <div
              style={{
                display: 'inline-flex',
                background: '#F5EBE6',
                padding: 3,
                borderRadius: 6,
                gap: 2,
              }}
            >
              <button
                type="button"
                id="impact-scope-user-btn"
                onClick={() => setActiveScope('user')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: activeScope === 'user' ? 700 : 500,
                  color: activeScope === 'user' ? '#CB4D22' : '#7A6458',
                  background: activeScope === 'user' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: activeScope === 'user' ? '0 1px 3px rgba(45,27,17,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <User size={12} />
                My Impact
              </button>

              <button
                type="button"
                id="impact-scope-global-btn"
                onClick={() => setActiveScope('global')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  fontSize: 11.5,
                  fontWeight: activeScope === 'global' ? 700 : 500,
                  color: activeScope === 'global' ? '#248A3D' : '#7A6458',
                  background: activeScope === 'global' ? '#FFFFFF' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: activeScope === 'global' ? '0 1px 3px rgba(45,27,17,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Globe size={12} />
                Community
              </button>
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: '4px 0 0' }}>
            {activeScope === 'user'
              ? 'Estimated lifetime resource and environmental savings from choosing repair over replacement.'
              : 'Cumulative platform-wide resource and carbon reductions across all RepairHub community repairs.'}
          </p>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        {[
          {
            icon: <Leaf size={18} style={{ color: '#248A3D' }} />,
            bg: '#EBF8EE',
            value: `${co2Saved} kg`,
            label: 'CO₂ Avoided',
            note: `≈ ${treesCount} trees planted`,
          },
          {
            icon: <Recycle size={18} style={{ color: '#CB4D22' }} />,
            bg: '#F5EBE6',
            value: `${wasteDiverted} kg`,
            label: 'E-Waste Saved',
            note: 'Diverted from landfill',
          },
          {
            icon: <Zap size={18} style={{ color: '#C95100' }} />,
            bg: '#FFF4E5',
            value: `${energyKwh} kWh`,
            label: 'Embodied Energy',
            note: 'Manufacturing avoided',
          },
          {
            icon: <Award size={18} style={{ color: '#7B3F96' }} />,
            bg: '#F7EFFC',
            value: `৳${moneySaved}`,
            label: 'Net Money Saved',
            note: 'vs purchasing new items',
          },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              background: '#FDFBF9',
              border: '1px solid #EAE0D6',
              borderRadius: 2,
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 2,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              {item.icon}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--apple-label)',
                lineHeight: 1.1,
              }}
            >
              {item.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--apple-label)', marginTop: 4 }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--apple-secondary)', marginTop: 2 }}>
              {item.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
