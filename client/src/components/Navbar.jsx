import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  Shield, 
  ChevronDown, 
  Sparkles, 
  User, 
  Building, 
  Zap, 
  MapPin, 
  QrCode, 
  Clock, 
  ShieldCheck,
  Award,
  ArrowRight,
  Settings,
  MessageSquare,
  Camera
} from 'lucide-react';
import Logo from './Logo';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  setIsAiOpen, 
  onOpenCopilot,
  onOpenVision,
  setIsSearchOpen, 
  currentUser, 
  onOpenAuth, 
  onLogout,
  onOpenProfile,
  onOpenScanner,
  unreadCount = 0,
  onOpenRecentChat,
}) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const isAdmin    = currentUser?.role === 'Admin' || currentUser?.role === 'admin';
  const isRepairer = currentUser?.role === 'Repairer' || currentUser?.role === 'repairer';
  const isCustomer = currentUser && !isAdmin && !isRepairer;
  const isFreelance = currentUser?.technicianType === 'freelance';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavLink = ({ tab, label, tabs }) => {
    const matchTabs = tabs || [tab];
    const isActive  = matchTabs.some(t => activeTab === t || activeTab.startsWith(t));
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`nav-pill ${isActive ? 'active' : ''}`}
      >
        {label}
      </button>
    );
  };

  const getRoleBadge = () => {
    if (isAdmin) return { label: 'System Admin', color: 'badge-purple', icon: <Shield size={11} /> };
    if (isRepairer) {
      return isFreelance 
        ? { label: 'Freelance Fixer', color: 'badge-orange', icon: <Zap size={11} /> }
        : { label: 'Certified Workshop', color: 'badge-green', icon: <Building size={11} /> };
    }
    return { label: 'Verified Customer', color: 'badge-blue', icon: <ShieldCheck size={11} /> };
  };

  const roleInfo = getRoleBadge();

  return (
    <header 
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(253, 251, 249, 0.92)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: '1px solid #EAE0D6',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', height: 62, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', boxSizing: 'border-box' }}>

        {/* Boxed Brand Logo & Name */}
        <button
          onClick={() => setActiveTab(isAdmin ? 'admin' : isRepairer ? 'workspace' : isCustomer ? 'dashboard' : 'home')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            background: '#FFFFFF', 
            border: '1px solid #EAE0D6', 
            borderRadius: 2, 
            padding: '5px 12px',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(45, 27, 17, 0.04)'
          }}
        >
          <Logo size={22} />
          <span style={{ 
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700, 
            fontSize: 13, 
            color: '#2D1B11', 
            letterSpacing: '-0.02em',
            textTransform: 'lowercase'
          }}>
            repairhub<span style={{ color: '#CB4D22' }}>.ai</span>
          </span>
        </button>

        {/* Outlined Nav Buttons with Arrow */}
        <nav style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
        }}>
          {!isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('explore')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 2,
                  background: activeTab === 'explore' ? '#F5EBE6' : '#FFFFFF',
                  border: activeTab === 'explore' ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                  color: activeTab === 'explore' ? '#CB4D22' : '#2D1B11',
                  fontSize: 12,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Workshops</span>
                <span style={{ fontSize: 11, color: '#CB4D22' }}>↗</span>
              </button>

              <button
                onClick={() => setActiveTab('events')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 2,
                  background: activeTab === 'events' ? '#F5EBE6' : '#FFFFFF',
                  border: activeTab === 'events' ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                  color: activeTab === 'events' ? '#CB4D22' : '#2D1B11',
                  fontSize: 12,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Repair Cafés</span>
                <span style={{ fontSize: 11, color: '#CB4D22' }}>↗</span>
              </button>

              <button
                onClick={() => setActiveTab('guides')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 2,
                  background: activeTab === 'guides' ? '#F5EBE6' : '#FFFFFF',
                  border: activeTab === 'guides' ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                  color: activeTab === 'guides' ? '#CB4D22' : '#2D1B11',
                  fontSize: 12,
                  fontWeight: 400,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>DIY Guides</span>
                <span style={{ fontSize: 11, color: '#CB4D22' }}>↗</span>
              </button>

              {currentUser && (
                <button
                  onClick={() => setActiveTab(isRepairer ? 'workspace' : 'dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 12px',
                    borderRadius: 2,
                    background: activeTab === 'dashboard' || activeTab === 'workspace' ? '#F5EBE6' : '#FFFFFF',
                    border: activeTab === 'dashboard' || activeTab === 'workspace' ? '1px solid #CB4D22' : '1px solid #EAE0D6',
                    color: activeTab === 'dashboard' || activeTab === 'workspace' ? '#CB4D22' : '#2D1B11',
                    fontSize: 12,
                    fontWeight: 400,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <span>{isRepairer ? 'Workshop Workspace' : 'Command Vault'}</span>
                  {unreadCount > 0 && (
                    <span style={{
                      background: '#E63946',
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 10,
                      padding: '1px 6px',
                      lineHeight: 1.2,
                      boxShadow: '0 0 6px rgba(230, 57, 70, 0.4)'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#CB4D22' }}>↗</span>
                </button>
              )}
            </>
          ) : (
            <>
              <NavLink tab="admin" label="Overview" tabs={['admin']} />
              <NavLink tab="admin-verifications" label="Verifications" />
              <NavLink tab="admin-escrow" label="Protected Vault" />
              <NavLink tab="admin-sustainability" label="E-Waste" />
              <NavLink tab="admin-users" label="Users" />
            </>
          )}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          
          {/* Global Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              height: 30,
              gap: 8, 
              padding: '0 10px', 
              background: '#FFFFFF', 
              border: '1px solid #EAE0D6',
              borderRadius: 2,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Search size={13} style={{ color: '#7A6458' }} />
            <span style={{ fontSize: 12, color: '#7A6458' }}>Search</span>
            <span style={{
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 600,
              color: '#CB4D22',
              background: '#F5EBE6',
              border: '1px solid rgba(203, 77, 34, 0.2)',
              borderRadius: 2,
              padding: '1px 5px',
              marginLeft: 2
            }}>
              Ctrl+K
            </span>
          </button>

          {/* Quick Chat Notification Button when Unread Messages Exist */}
          {currentUser && unreadCount > 0 && (
            <button
              onClick={() => onOpenRecentChat ? onOpenRecentChat() : setActiveTab(isRepairer ? 'workspace' : 'dashboard')}
              title={`${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 30,
                gap: 6,
                padding: '0 10px',
                background: '#FFEBE9',
                border: '1px solid #FFCDD2',
                borderRadius: 2,
                color: '#D32F2F',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <MessageSquare size={13} style={{ color: '#D32F2F' }} />
              <span>Chat</span>
              <span style={{
                background: '#E63946',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
                borderRadius: 10,
                padding: '1px 6px',
                lineHeight: 1.2
              }}>
                {unreadCount}
              </span>
            </button>
          )}

          {/* Role-Specific Action Toolbar */}
          {/* 1. CUSTOMER & GUEST: AI Diagnosis & Request a Repair */}
          {(!currentUser || isCustomer) && (
            <>
              <button
                onClick={() => onOpenCopilot ? onOpenCopilot() : setIsAiOpen?.(true)}
                title="AI Repair Copilot (Symptom & Schematics Diagnostics)"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 30,
                  padding: '0 10px', 
                  background: '#FDFBF9', 
                  border: '1px solid #EAE0D6',
                  color: '#2D1B11', 
                  borderRadius: 2,
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={13} style={{ color: '#CB4D22' }} />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => onOpenVision ? onOpenVision() : setIsAiOpen?.(true)}
                title="AI Vision Damage Assessment (Multimodal Camera Scan)"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 30,
                  padding: '0 10px', 
                  background: '#FDFBF9', 
                  border: '1px solid #EAE0D6',
                  color: '#2D1B11', 
                  borderRadius: 2,
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Camera size={13} style={{ color: '#CB4D22' }} />
                <span>Vision Scan</span>
              </button>

              <button
                onClick={() => setActiveTab('request')}
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 30,
                  gap: 5, 
                  padding: '0 12px', 
                  fontSize: 12,
                  fontWeight: 600,
                  background: '#CB4D22',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(203, 77, 34, 0.25)',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#B33F19'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#CB4D22'}
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Request a Repair</span>
              </button>
            </>
          )}

          {/* 2. TECHNICIAN: Fast QR Scanner (Workbench button removed as redundant) */}
          {isRepairer && onOpenScanner && (
            <button
              onClick={onOpenScanner}
              title="Scan Customer Handover QR"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 30,
                gap: 6,
                padding: '0 12px',
                background: '#FDFBF9',
                border: '1px solid #CB4D22',
                color: '#CB4D22',
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5EBE6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FDFBF9';
              }}
            >
              <QrCode size={13} />
              <span>Scan Handover QR</span>
            </button>
          )}

          {/* 3. ADMIN: Fast Control Center CTA */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 30,
                gap: 6,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 600,
                background: '#5856D6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <Shield size={13} />
              <span>Admin Console</span>
            </button>
          )}

          {/* Interactive Profile Dropdown (Logged In) vs Sign In Button (Logged Out) */}
          {currentUser ? (
            <div style={{ position: 'relative' }} ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 980,
                  border: '1px solid var(--apple-border)',
                  background: isProfileMenuOpen ? '#E8E8ED' : '#F5F5F7',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isAdmin ? 'var(--apple-purple)' : isRepairer ? (isFreelance ? '#FF9500' : '#34C759') : 'var(--apple-blue)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11.5,
                  fontWeight: 700,
                }}>
                  {currentUser.name?.charAt(0) || 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--apple-label)' }}>
                    {currentUser.name?.split(' ')[0]}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--apple-secondary)', fontWeight: 500 }}>
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown size={13} style={{ color: 'var(--apple-tertiary)', transform: isProfileMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {/* Apple HIG Profile Popover Dropdown */}
              {isProfileMenuOpen && (
                <div 
                  className="card-elevated"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 290,
                    padding: '14px 16px',
                    background: 'var(--apple-white)',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
                    borderRadius: 16,
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  {/* Profile Header */}
                  <div style={{ borderBottom: '1px solid var(--apple-border)', paddingBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isAdmin ? 'var(--apple-purple)' : isRepairer ? (isFreelance ? '#FF9500' : '#34C759') : 'var(--apple-blue)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                      }}>
                        {currentUser.name?.charAt(0) || 'U'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--apple-label)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--apple-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentUser.email}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span className={`badge ${roleInfo.color}`} style={{ fontSize: 10.5 }}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                      {currentUser.address && (
                        <span style={{ fontSize: 11, color: 'var(--apple-tertiary)', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          📍 {currentUser.address.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Role Specific Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {isCustomer && (
                      <>
                        <button
                          onClick={() => { setActiveTab('dashboard'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <Wrench size={14} style={{ color: 'var(--apple-blue)' }} /> My Active Repairs
                        </button>
                        <button
                          onClick={() => { setActiveTab('request'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <Plus size={14} style={{ color: 'var(--apple-blue)' }} /> Request New Repair
                        </button>
                        <button
                          onClick={() => { setActiveTab('explore'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <MapPin size={14} style={{ color: 'var(--apple-blue)' }} /> Explore Nearby Workshops
                        </button>
                      </>
                    )}

                    {isRepairer && (
                      <>
                        <button
                          onClick={() => { setActiveTab('workspace'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <Wrench size={14} style={{ color: '#34C759' }} /> Technician Workbench
                        </button>
                        <button
                          onClick={() => { setActiveTab('explore'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <MapPin size={14} style={{ color: '#34C759' }} /> View Workshop on Map
                        </button>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => { setActiveTab('admin'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <Shield size={14} style={{ color: 'var(--apple-purple)' }} /> Admin System Overview
                        </button>
                        <button
                          onClick={() => { setActiveTab('admin-escrow'); setIsProfileMenuOpen(false); }}
                          className="btn-ghost"
                          style={{ justifyContent: 'flex-start', padding: '6px 8px', fontSize: 13, gap: 8, borderRadius: 8 }}
                        >
                          <ShieldCheck size={14} style={{ color: 'var(--apple-purple)' }} /> Protected Vault Disputes
                        </button>
                      </>
                    )}
                    {/* Profile & Settings Trigger */}
                    {onOpenProfile && (
                      <button
                        onClick={() => { onOpenProfile(); setIsProfileMenuOpen(false); }}
                        className="btn-ghost"
                        style={{ 
                          justifyContent: 'flex-start', 
                          padding: '7px 8px', 
                          fontSize: 13, 
                          gap: 8, 
                          borderRadius: 8, 
                          fontWeight: 600,
                          color: 'var(--apple-blue)',
                          background: 'var(--apple-blue-light)',
                          marginTop: 2
                        }}
                      >
                        <Settings size={14} /> Edit Profile & Location Pin
                      </button>
                    )}
                  </div>

                  {/* Sign Out Button */}
                  <div style={{ borderTop: '1px solid var(--apple-border)', paddingTop: 8 }}>
                    <button
                      onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                      className="btn-ghost"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '6px',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--apple-red)',
                        background: '#FFEBE9',
                        borderRadius: 8,
                        gap: 6
                      }}
                    >
                      <LogOut size={13} /> Sign Out of repairhub
                    </button>
                  </div>

                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onOpenAuth} 
              className="btn-secondary" 
              style={{ padding: '7px 16px', fontSize: 13, gap: 6 }}
            >
              <LogIn size={13} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
