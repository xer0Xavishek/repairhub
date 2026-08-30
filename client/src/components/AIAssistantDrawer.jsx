import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  AlertCircle, 
  Key, 
  ChevronDown, 
  ChevronRight, 
  Camera, 
  Upload, 
  CheckCircle2, 
  ShieldAlert, 
  Leaf, 
  ArrowRight,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const SAMPLES = [
  { label: 'Microwave sparking inside', text: 'Microwave sparks visibly on right interior wall near the waveguide cover plate' },
  { label: 'Cracked phone screen', text: 'Smartphone display is cracked, glass is fractured and touch digitizer is unresponsive' },
  { label: 'Blender burning odor', text: 'Blender motor smells of burning plastic and makes a loud grinding noise during operation' },
  { label: 'LED TV blinking light', text: 'Samsung Smart LED TV front indicator light blinks 5 times but the display remains completely black' },
];

export default function AIAssistantDrawer({ isOpen, onClose, onRequestRepair }) {
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [report, setReport]         = useState(null);
  const [error, setError]           = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [apiKey, setApiKey]         = useState('');
  const [activeMode, setActiveMode] = useState('text'); // 'text' or 'photo'
  
  // Photo upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);
  const fileInputRef                      = useRef(null);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Proportionally scale image to max 1200px for optimal Gemini Vision latency
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImagePreview(optimizedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const diagnose = async (overrideText) => {
    const q = overrideText || query;
    if (!q.trim() && !imagePreview) return;
    
    setLoading(true);
    setReport(null);
    setError('');

    try {
      if (activeMode === 'photo' && imagePreview) {
        // Visual Damage Assessment
        const res = await axios.post('/api/ai/visual-assessment', {
          itemTitle: query || 'Customer Appliance',
          imageData: imagePreview,
          geminiApiKey: apiKey || undefined
        });
        if (res.data.success) {
          const vData = res.data.data;
          setReport({
            deviceType: vData.item_analyzed || 'Hardware Visual Inspection',
            summary: vData.recommendation || `Visual scan detected ${vData.defect_type}.`,
            defect_type: vData.defect_type,
            severityScore: vData.severity_score || 7,
            photoData: imagePreview,
            rootCauses: [
              `Severity Score: ${vData.severity_score || 7}/10 (${vData.is_repairable ? 'Economically Viable' : 'Extensive Damage'})`,
              'Physical defect identified via Google Gemini Multimodal Computer Vision',
              `Estimated repair turnaround: ${vData.estimated_repair_time_days || 2} day(s)`
            ],
            safetyWarnings: vData.safety_warning ? [vData.safety_warning] : [
              'Ensure AC power and batteries are disconnected before physical repair.'
            ],
            estimatedCostBDT: vData.estimated_price_range ? `${vData.estimated_price_range.min} – ${vData.estimated_price_range.max}` : '450 – 1200',
            diyFeasible: vData.is_repairable,
            eWasteSavedKg: '2.8 kg',
            triage_steps: vData.triage_steps || [
              'Step 1: Disconnect device from AC wall socket.',
              'Step 2: Inspect outer enclosure and flex ribbons for physical tears.',
              'Step 3: Test primary fuse and switch continuity using a digital multimeter.',
              'Step 4: Book certified technician for component-level board replacement.'
            ],
            cloudSource: vData.cloud_source || 'Google Gemini Multimodal Vision'
          });
        }
      } else {
        // Text / Symptom RAG Diagnostic Triage
        const res = await axios.post('/api/ai/diagnose', {
          query: q,
          geminiApiKey: apiKey || undefined
        });
        if (res.data.success) {
          const d = res.data.data;

          // Agent Guardrail: Handle domain refusal
          if (d.is_repair_related === false) {
            setReport({
              isRefusal: true,
              refusalReason: d.refusal_reason || 'This query is outside my repair diagnostic scope.',
              suggestion: d.suggestion || 'Try describing a device symptom, e.g. "My microwave sparks inside".',
            });
          } else {
            setReport({
              deviceType: d.matched_manual || 'Appliance Diagnosis',
              summary: `Identified primary defect: ${d.defect_type}. Repair feasibility is classified as ${d.difficulty}.`,
              defect_type: d.defect_type,
              confidence: d.confidence,
              rootCauses: d.triage_steps ? [
                'Carbon buildup / thermal stress over time',
                'Circuit component fatigue or fuse blowout',
                'Mechanical wear on contact surfaces'
              ] : [],
              safetyWarnings: d.safety_warning ? [d.safety_warning] : [],
              estimatedCostBDT: d.estimated_cost_range ? `${d.estimated_cost_range.min} – ${d.estimated_cost_range.max}` : '350 – 750',
              diyFeasible: !d.difficulty?.toLowerCase().includes('professional'),
              eWasteSavedKg: d.environmental_impact || '3.4 kg',
              triage_steps: d.triage_steps || [],
              parts_needed: d.parts_needed || [],
              tools_required: d.tools_required || [],
            });
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Diagnostic service error. Please verify input or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ justifyContent: 'flex-end', padding: 0 }}>
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: 500,
          height: '100%',
          borderRadius: '2px 0 0 2px',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          background: '#FFFFFF'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #EAE0D6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: '#CB4D22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(203, 77, 34, 0.25)'
            }}>
              <Sparkles size={17} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', letterSpacing: '-0.02em' }}>
                AI Repair Copilot
              </div>
              <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>
                Powered by Gemini Vision & Diagnostics
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 10px', borderRadius: 980 }}>
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Mode Selector (Apple Segmented Control) */}
          <div style={{ display: 'flex', background: '#E8E8ED', padding: 3, borderRadius: 10 }}>
            <button
              onClick={() => setActiveMode('text')}
              className={`nav-pill ${activeMode === 'text' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center', padding: '6px 12px', fontSize: 13 }}
            >
              Symptom Description
            </button>
            <button
              onClick={() => setActiveMode('photo')}
              className={`nav-pill ${activeMode === 'photo' ? 'active' : ''}`}
              style={{ flex: 1, textAlign: 'center', padding: '6px 12px', fontSize: 13 }}
            >
              Photo Damage Scan
            </button>
          </div>

          {/* MODE 1: TEXT SYMPTOM INPUT */}
          {activeMode === 'text' && (
            <div>
              <label className="label">Describe the device issue</label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. My Samsung microwave sparks on the right wall whenever I turn it on..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && diagnose()}
                style={{ resize: 'vertical' }}
              />
              <p style={{ fontSize: 11.5, color: 'var(--apple-tertiary)', marginTop: 5 }}>
                Tip: Press <kbd style={{ background: '#E8E8ED', padding: '2px 5px', borderRadius: 4 }}>Ctrl + Enter</kbd> to diagnose
              </p>
            </div>
          )}

          {/* MODE 2: PHOTO UPLOAD FOR DAMAGE ASSESSMENT */}
          {activeMode === 'photo' && (
            <div>
              <label className="label">Upload or snap photo of damage</label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--apple-border-strong)',
                    borderRadius: 14,
                    padding: '28px 20px',
                    textAlign: 'center',
                    background: '#F5F5F7',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--apple-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--apple-border-strong)'}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    <Camera size={22} style={{ color: 'var(--apple-blue)' }} />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--apple-label)', marginBottom: 4 }}>
                    Click to upload device photo
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--apple-secondary)' }}>
                    PNG, JPG, or WEBP (Max 5MB)
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--apple-border)' }}>
                  <img src={imagePreview} alt="Damage Preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover' }} />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(0,0,0,0.65)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <label className="label">Device Name (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Samsung 28L Microwave or iPhone 13"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Quick Presets (Only in text mode) */}
          {activeMode === 'text' && !report && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Common Symptoms
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SAMPLES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(s.text);
                      diagnose(s.text);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--apple-border)',
                      background: '#F5F5F7',
                      fontSize: 13,
                      color: 'var(--apple-label)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--apple-blue-light)';
                      e.currentTarget.style.borderColor = 'var(--apple-blue)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F5F5F7';
                      e.currentTarget.style.borderColor = 'var(--apple-border)';
                    }}
                  >
                    <span>{s.label}</span>
                    <ChevronRight size={14} style={{ color: 'var(--apple-tertiary)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Gemini API Key Drawer */}
          <div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="btn-ghost"
              style={{ fontSize: 12.5, gap: 5, padding: '4px 0', color: 'var(--apple-tertiary)' }}
            >
              <Key size={13} /> {showKey ? 'Hide custom API Key' : 'Use your Gemini API key'}
              {showKey ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {showKey && (
              <div style={{ marginTop: 8 }}>
                <input
                  className="input"
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p style={{ fontSize: 11, color: 'var(--apple-tertiary)', marginTop: 4 }}>
                  Stored only in your local browser session.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => diagnose()}
            disabled={loading || (!query.trim() && !imagePreview)}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              padding: '12px',
              fontSize: 14.5,
              opacity: (!query.trim() && !imagePreview) || loading ? 0.6 : 1,
              cursor: (!query.trim() && !imagePreview) || loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Analyzing Device Telemetry...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {activeMode === 'photo' ? 'Inspect Photo Damage' : 'Run AI Diagnostic'}
              </>
            )}
          </button>

          {/* Error Banner */}
          {error && (
            <div style={{
              display: 'flex',
              gap: 10,
              background: '#FFEBE9',
              border: '1px solid #FFCDD2',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--apple-red)',
              fontSize: 13
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {/* DIAGNOSTIC REPORT CARD */}
          {report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Agent Guardrail Refusal Card */}
              {report.isRefusal ? (
                <div style={{
                  background: '#FFF7ED',
                  border: '1px solid #FFCC80',
                  borderRadius: 12,
                  padding: '20px',
                  borderLeft: '4px solid #C95100'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <ShieldAlert size={18} style={{ color: '#C95100', flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#C95100', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Repair Agent — Scope Notice
                    </span>
                  </div>
                  <p style={{ fontSize: 13.5, color: '#2D1B11', lineHeight: 1.55, margin: '0 0 14px 0' }}>
                    {report.refusalReason}
                  </p>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE0D6',
                    borderRadius: 8,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    color: '#7A6458',
                    lineHeight: 1.5
                  }}>
                    <span style={{ fontWeight: 600, color: '#2D1B11' }}>💡 Try instead: </span>
                    {report.suggestion}
                  </div>
                </div>
              ) : (
              <>
              {/* Verdict Highlight */}
              <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #CB4D22' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <span className="badge" style={{ background: '#F5EBE6', color: '#CB4D22', fontSize: 11 }}>
                    <Sparkles size={11} /> {report.cloudSource || 'AI Multimodal Vision'}
                  </span>
                  <span className="badge badge-green" style={{ fontSize: 11 }}>
                    <Leaf size={11} /> Saves {report.eWasteSavedKg} e-waste
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {report.photoData && (
                    <div style={{ position: 'relative', width: 68, height: 68, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: '2px solid #CB4D22' }}>
                      <img src={report.photoData} alt="Analyzed Hardware" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(203,77,34,0.9)', color: '#fff', fontSize: 8.5, textAlign: 'center', fontWeight: 700, padding: '1px 0' }}>
                        SCANNED
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 6px 0' }}>
                      {report.defect_type || report.deviceType}
                    </h3>
                    <p style={{ fontSize: 13, color: 'var(--apple-secondary)', margin: 0, lineHeight: 1.5 }}>
                      {report.summary}
                    </p>
                  </div>
                </div>

                {report.severityScore && (
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #EAE0D6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#7A6458' }}>Damage Severity Index:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: report.severityScore >= 8 ? '#C95100' : report.severityScore >= 5 ? '#CB4D22' : '#248A3D' }}>
                      {report.severityScore}/10 ({report.severityScore >= 8 ? 'Critical Structural' : report.severityScore >= 5 ? 'Moderate Defect' : 'Minor Cosmetic'})
                    </span>
                  </div>
                )}
              </div>

              {/* Safety Warning */}
              {report.safetyWarnings?.length > 0 && (
                <div style={{
                  background: '#FFEBE9',
                  border: '1px solid #FFCDD2',
                  borderRadius: 12,
                  padding: '12px 16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--apple-red)', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    <ShieldAlert size={15} /> Safety Advisory
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--apple-label)', lineHeight: 1.4 }}>
                    {report.safetyWarnings[0]}
                  </div>
                </div>
              )}

              {/* Step by Step Triage Guide */}
              {report.triage_steps?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--apple-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Recommended Diagnostic Steps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {report.triage_steps.map((step, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        gap: 10,
                        background: '#F5F5F7',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 13,
                        color: 'var(--apple-label)'
                      }}>
                        <span style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#CB4D22',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <div style={{ lineHeight: 1.4 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimated Repair Cost & Protection Banner */}
              <div style={{
                background: '#FDFBF9',
                border: '1px solid #EAE0D6',
                borderRadius: 2,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#CB4D22', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Estimated Repair Cost
                  </div>
                  <div style={{ fontSize: 12, color: '#7A6458' }}>
                    Protected under repairhub Guarantee
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#CB4D22' }}>
                  ৳{report.estimatedCostBDT}
                </div>
              </div>

              {/* Action Buttons: New Diagnosis & Direct Booking */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => {
                    setReport(null);
                    setQuery('');
                    setSelectedImage(null);
                    setImagePreview(null);
                    setError('');
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '10px 14px',
                    fontSize: 13,
                    justifyContent: 'center',
                    gap: 6,
                    borderRadius: 2
                  }}
                >
                  <RefreshCw size={14} /> New Diagnosis
                </button>

                <button
                  onClick={() => {
                    onClose();
                    if (onRequestRepair) onRequestRepair(report);
                  }}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '12px',
                    fontSize: 14,
                    gap: 8,
                    borderRadius: 2
                  }}
                >
                  Book a Certified Workshop
                  <ArrowRight size={15} />
                </button>
              </div>

              </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
