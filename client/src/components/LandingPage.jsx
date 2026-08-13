import React from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Wrench,
  ShieldCheck,
  Calendar,
  Sparkles,
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Plus
} from 'lucide-react';
import Logo from './Logo';

export default function LandingPage({ onOpenAuth, onExplore, onRequestRepair, onOpenAi, onEvents }) {
  return (
    <div style={{ width: '100%', padding: '8px 0 24px', color: '#2D1B11', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @media (max-width: 960px) {
          .hero-top-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .hero-top-grid > div:last-child {
            align-items: flex-start !important;
          }
          .hero-top-grid > div:last-child p {
            text-align: left !important;
          }
          .hero-mid-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .showcase-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .showcase-cards-grid > div {
            height: auto !important;
            min-height: 280px !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ── TOP HERO GRID (Headline & Overview) ── */}
      <div className="hero-top-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 0.65fr)', gap: 32, alignItems: 'flex-start', marginBottom: 28, width: '100%', boxSizing: 'border-box' }}>

        {/* Left Column: Bold, Clean Headline */}
        <div>
          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 300,
            lineHeight: 1.08,
            letterSpacing: '-0.025em',
            textTransform: 'uppercase',
            color: '#2D1B11',
            margin: '0 0 18px 0'
          }}>
            <span style={{ color: '#CB4D22', fontWeight: 400 }}>// </span>
            EXPERT DEVICE REPAIRS, VERIFIED LOCAL WORKSHOPS & COMMUNITY REPAIR CAFÉS
          </h1>

          {/* Sub-brand Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <Logo size={26} />
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#CB4D22'
            }}>
              Repair, don't replace
            </span>
          </div>
        </div>

        {/* Right Column: 3 Indicator Squares & Clear Human Description */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 8, width: '100%', boxSizing: 'border-box' }}>
          {/* 3 Status Squares */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, background: '#CB4D22', borderRadius: 1 }} />
            <span style={{ width: 8, height: 8, background: '#CB4D22', borderRadius: 1 }} />
            <span style={{ width: 8, height: 8, background: '#EAE0D6', borderRadius: 1 }} />
          </div>

          <p style={{
            fontSize: 12.5,
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#7A6458',
            textAlign: 'right',
            maxWidth: 340,
            margin: 0
          }}>
            Repair your smartphones, laptops, and home appliances with verified local technicians in Dhaka. Compare transparent price quotes, get instant AI diagnostics, or join free community repair meetups.
          </p>
        </div>

      </div>

      {/* ── MID SECTION (Divider + Primary Action + 3 Visual Cards) ── */}
      <div className="hero-mid-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: 28, alignItems: 'flex-start', marginBottom: 36, width: '100%', boxSizing: 'border-box' }}>

        {/* Left Column: Overview, CTA & Feature Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>

          {/* Hairline Divider & Subtitle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, alignItems: 'center', paddingTop: 12, borderTop: '1px solid #EAE0D6' }}>
            <div style={{ height: 1, background: '#EAE0D6' }} />
            <p style={{ fontSize: 12.5, fontWeight: 400, lineHeight: 1.5, color: '#7A6458', margin: 0 }}>
              Get upfront competitive quotes from certified technicians, free diagnostic tools, and 100% payment protection.
            </p>
          </div>

          {/* Action Row: Primary Action Button + Status Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <button
              onClick={onRequestRepair}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#CB4D22',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 2,
                padding: '11px 20px',
                fontSize: 13.5,
                fontWeight: 600,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 8px rgba(203, 77, 34, 0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#B33F19'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#CB4D22'}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Submit a Repair Request</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: '#7A6458' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#CB4D22' }}>▪</span> VERIFIED SHOPS
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#CB4D22' }}>▪</span> ESCROW PROTECTED
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#CB4D22' }}>▪</span> DHAKA METRO
              </span>
            </div>
          </div>

          {/* 3 Feature Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 4, width: '100%', boxSizing: 'border-box' }}>
            {[
              {
                title: 'AI Fault Diagnostics',
                desc: 'Upload a photo or describe defects for instant diagnosis & estimated repair costs.',
                action: onOpenAi
              },
              {
                title: 'Verified Local Workshops',
                desc: 'Browse certified technicians in Gulshan, Banani, Mohakhali, Dhanmondi & Uttara.',
                action: onExplore
              },
              {
                title: 'Protected Escrow & QR Token',
                desc: 'Your payment stays safely locked until you inspect your fixed device and scan the QR code.',
                action: onRequestRepair
              },
            ].map((card, i) => (
              <div
                key={i}
                onClick={card.action}
                style={{
                  background: '#FDFBF9',
                  border: '1px solid #EAE0D6',
                  borderRadius: 2,
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 125,
                  cursor: 'pointer',
                  minWidth: 0,
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#CB4D22';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#EAE0D6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#2D1B11', marginBottom: 5, lineHeight: 1.3 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 400, lineHeight: 1.4, color: '#7A6458' }}>
                    {card.desc}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 2,
                    background: '#F5EBE6',
                    color: '#CB4D22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right 3 Visual Showcase Cards (Identical Sizing, Balanced Alignment & Zero Overflow) */}
        <div className="showcase-cards-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 1fr)', 
          gap: 10, 
          alignItems: 'center',
          position: 'relative',
          paddingTop: 6,
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          
          {/* Card 1: AI Diagnostics Preview (Left Card) */}
          <div 
            onClick={onOpenAi}
            style={{ 
              height: 375, 
              borderRadius: 2, 
              background: '#1E1511',
              border: '1px solid #EAE0D6',
              boxShadow: '0 12px 28px rgba(45, 27, 17, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px 14px',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#CB4D22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#EAE0D6';
            }}
          >
            <div>
              {/* Category Tag Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  background: '#2E1E17', 
                  border: '1px solid rgba(203, 77, 34, 0.35)', 
                  padding: '2px 6px', 
                  borderRadius: 2 
                }}>
                  <Sparkles size={11} style={{ color: '#CB4D22' }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#F5EBE6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AI Diagnostics
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 10 }}>
                Instant Fault Analysis
              </div>

              {/* Sample AI Result Strip Widget */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(234, 224, 214, 0.14)', 
                borderRadius: 2, 
                padding: '10px 10px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 6 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#F5EBE6', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Samsung Microwave
                  </span>
                  <span style={{ fontSize: 9.5, color: '#4ADE80', fontWeight: 600, flexShrink: 0 }}>
                    ● 96% Match
                  </span>
                </div>

                <div style={{ 
                  background: '#2E1A12', 
                  border: '1px solid rgba(203, 77, 34, 0.35)', 
                  color: '#F5A67A', 
                  fontSize: 10.5, 
                  fontWeight: 600, 
                  padding: '2px 6px', 
                  borderRadius: 2,
                  width: 'fit-content',
                  lineHeight: 1.2
                }}>
                  Burnt Waveguide Plate
                </div>

                <div style={{ fontSize: 10.5, color: '#B3A195', paddingTop: 2 }}>
                  Est. Cost: <strong style={{ color: '#FFFFFF' }}>৳600 – ৳900</strong>
                </div>
              </div>
            </div>

            {/* Bottom White Box Action */}
            <div style={{ 
              background: '#FFFFFF',
              border: '1px solid #EAE0D6',
              borderRadius: 2,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#1E1511',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              marginTop: 10
            }}>
              <span>Try Free Scan</span>
              <ArrowUpRight size={13} style={{ color: '#CB4D22' }} />
            </div>
          </div>

          {/* Card 2: Verified Dhaka Workshops (CENTER HERO ELEVATED CARD) */}
          <div 
            style={{ 
              height: 440, 
              borderRadius: 2, 
              background: '#FFFFFF',
              border: '1px solid #EAE0D6',
              boxShadow: '0 24px 48px -10px rgba(45, 27, 17, 0.18)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px 14px',
              zIndex: 20,
              transform: 'translateY(-12px)',
              boxSizing: 'border-box'
            }}
          >
            {/* Workshop Badge Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 8 }}>
                <div style={{ 
                  height: 22,
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 5, 
                  background: '#EBF8EE', 
                  border: '1px solid rgba(36, 138, 61, 0.25)', 
                  padding: '0 7px', 
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ width: 5, height: 5, background: '#248A3D', borderRadius: '50%', flexShrink: 0 }} />
                  <span style={{ fontSize: 9.5, color: '#248A3D', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>
                    Verified Workshop
                  </span>
                </div>

                <div style={{ 
                  height: 22,
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  background: '#FFF7ED', 
                  border: '1px solid rgba(194, 65, 12, 0.2)', 
                  padding: '0 7px', 
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box'
                }}>
                  <Star size={10} fill="#C95100" color="#C95100" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#C95100', lineHeight: 1 }}>4.9 (128)</span>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1E1511', margin: '0 0 3px 0', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Master Rafiq Precision Lab
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#7A6458', marginBottom: 10 }}>
                <MapPin size={12} style={{ color: '#CB4D22', flexShrink: 0 }} />
                <span>Mohakhali C/A • 0.4 km away</span>
              </div>

              {/* Specialization Tag Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {['Appliances', 'Soldering', 'Micro-Circuits', '24h Fast Turn'].map((tag, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      fontSize: 10, 
                      background: '#FDFBF9', 
                      border: '1px solid #EAE0D6', 
                      color: '#2D1B11', 
                      padding: '2px 6px', 
                      borderRadius: 2, 
                      fontWeight: 600 
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Trust Value Props List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, borderTop: '1px solid #F0EAE4', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#2D1B11' }}>
                  <ShieldCheck size={13} style={{ color: '#248A3D', flexShrink: 0 }} />
                  <span>Licensed & Verified Master Technician</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#2D1B11' }}>
                  <ShieldCheck size={13} style={{ color: '#CB4D22', flexShrink: 0 }} />
                  <span>100% Escrow Guarantee Protected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, color: '#2D1B11' }}>
                  <Clock size={13} style={{ color: '#7A6458', flexShrink: 0 }} />
                  <span>Starting from ৳300 (Free Diagnostic)</span>
                </div>
              </div>
            </div>

            {/* Bottom Button inside Card */}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #F0EAE4' }}>
              <button
                onClick={onExplore}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: '#1E1511',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '9px 12px',
                  borderRadius: 2,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#CB4D22'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#1E1511'}
              >
                <span>Browse Dhaka Workshops</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          {/* Card 3: Community Repair Cafés (Right Card - Identical Size to Left Card) */}
          <div 
            onClick={onEvents || onExplore}
            style={{ 
              height: 375, 
              borderRadius: 2, 
              background: '#1E1511',
              border: '1px solid #EAE0D6',
              boxShadow: '0 12px 28px rgba(45, 27, 17, 0.14)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '16px 14px',
              color: '#FFFFFF',
              cursor: 'pointer',
              boxSizing: 'border-box',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.borderColor = '#CB4D22';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#EAE0D6';
            }}
          >
            <div>
              {/* Category Tag Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 4, 
                  background: '#2E1E17', 
                  border: '1px solid rgba(203, 77, 34, 0.35)', 
                  padding: '2px 6px', 
                  borderRadius: 2 
                }}>
                  <Calendar size={11} style={{ color: '#CB4D22' }} />
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: '#F5EBE6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Community Events
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 10 }}>
                Free Repair Cafés
              </div>

              {/* Sample Event Card Widget */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(234, 224, 214, 0.14)', 
                borderRadius: 2, 
                padding: '10px 10px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 6 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <span style={{ fontSize: 11, color: '#F5EBE6', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    BRACU Merul Badda
                  </span>
                  <span style={{ fontSize: 9.5, color: '#F5A67A', fontWeight: 600, flexShrink: 0 }}>
                    ● Free Fixes
                  </span>
                </div>

                <div style={{ 
                  background: '#1C2E1F', 
                  border: '1px solid rgba(74, 222, 128, 0.3)', 
                  color: '#4ADE80', 
                  fontSize: 10.5, 
                  fontWeight: 600, 
                  padding: '2px 6px', 
                  borderRadius: 2,
                  width: 'fit-content',
                  lineHeight: 1.2
                }}>
                  Friday • 2:00–7:00 PM
                </div>

                <div style={{ fontSize: 10.5, color: '#B3A195', paddingTop: 2 }}>
                  RSVPs: <strong style={{ color: '#FFFFFF' }}>28 Confirmed</strong>
                </div>
              </div>
            </div>

            {/* Bottom White Box Action */}
            <div style={{ 
              background: '#FFFFFF',
              border: '1px solid #EAE0D6',
              borderRadius: 2,
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              fontWeight: 600,
              color: '#1E1511',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
              marginTop: 10
            }}>
              <span>View Meetups</span>
              <ArrowUpRight size={13} style={{ color: '#CB4D22' }} />
            </div>
          </div>

        </div>

      </div>

      {/* ── FOOTER BAR ── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderTop: '1px solid #EAE0D6', 
        paddingTop: 18, 
        marginTop: 28,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.06em',
        color: '#7A6458'
      }}>
        <div>© 2026 REPAIRHUB • REPAIR, DON'T REPLACE</div>
        <div>COMMUNITY & CIRCULAR ELECTRONICS NETWORK</div>
      </div>

    </div>
  );
}
