import React, { useState } from 'react';
import {
  Sparkles,
  X,
  AlertCircle,
  Key,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Leaf,
  ArrowRight,
  RefreshCw,
  Wrench,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';

const COPILOT_PRESETS = [
  { label: 'Microwave sparking inside', text: 'Samsung microwave sparks visibly on right interior wall near the waveguide cover plate' },
  { label: 'Cracked phone screen', text: 'Smartphone display glass is cracked, fractured digitizer with unresponsive touch' },
  { label: 'Blender burning odor', text: 'Blender motor smells of burning plastic and makes a loud grinding noise during operation' },
  { label: 'LED TV blinking light', text: 'Smart LED TV front power indicator light blinks 5 times but screen stays black' },
];

export default function AIRepairCopilotDrawer({ isOpen, onClose, onRequestRepair }) {
  const [copilotQuery, setCopilotQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleDiagnose = async (overrideText) => {
    const q = overrideText || copilotQuery;
    if (!q || !q.trim()) return;

    setLoading(true);
    setReport(null);
    setError('');

    try {
      const token = sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post('/api/ai/diagnose', {
        query: q.trim(),
        geminiApiKey: apiKey ? apiKey.trim() : undefined
      }, { headers });

      if (res.data?.success) {
        const d = res.data.data;

        // Guardrail refusal
        if (d.is_repair_related === false) {
          setReport({
            reportId: d.reportId,
            isRefusal: true,
            refusalReason: d.refusal_reason || 'This query is outside my repair diagnostic scope.',
            suggestion: d.suggestion || 'Try describing a physical hardware fault (e.g., "My microwave sparks inside").'
          });
        } else {
          setReport({
            reportId: d.reportId,
            isRefusal: false,
            deviceType: d.matched_manual || 'Hardware Diagnostic Guide',
            matchedManual: d.matched_manual,
            defectType: d.defect_type || 'Hardware Component Fault',
            confidence: d.confidence ? Math.round(d.confidence * 100) : 94,
            difficulty: d.difficulty || 'Moderate (Basic Tools)',
            summary: d.defect_type
              ? `Identified primary defect: ${d.defect_type}. Repair feasibility is classified as ${d.difficulty || 'Moderate'}.`
              : 'Technical inspection schematic matched.',
            safetyWarning: d.safety_warning || null,
            triageSteps: Array.isArray(d.triage_steps) ? d.triage_steps : [],
            partsNeeded: Array.isArray(d.parts_needed) ? d.parts_needed : [],
            toolsRequired: Array.isArray(d.tools_required) ? d.tools_required : [],
            estimatedCostBDT: d.estimated_cost_range
              ? `${d.estimated_cost_range.min} – ${d.estimated_cost_range.max}`
              : '350 – 750',
            eWasteSavedKg: d.environmental_impact || '3.2 kg',
            cloudSource: d.cloud_source || 'Google Gemini Cloud (Grounded RAG Agent v2)'
          });
        }
      } else {
        setError(res.data?.message || 'Unable to retrieve diagnostic telemetry.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg || 'Diagnostic request failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setReport(null);
    setCopilotQuery('');
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#FFFFFF',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 20px 48px rgba(45, 27, 17, 0.22)',
          border: '1px solid #EAE0D6'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #EAE0D6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FAF8F5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2D1B11', letterSpacing: '-0.02em' }}>
                AI Repair Copilot
              </div>
              <div style={{ fontSize: 11.5, color: '#7A6458' }}>
                Diagnostics & Technical Schematics
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 2 }}>
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Query Input Section */}
          <div>
            <label className="label" style={{ fontWeight: 600, color: '#2D1B11', marginBottom: 6 }}>
              Describe the device issue or symptom
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="e.g. My Samsung microwave sparks on the right interior wall whenever I turn it on..."
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleDiagnose()}
              style={{ resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#7A6458' }}>
                Press <kbd style={{ background: '#E8E8ED', padding: '1px 4px', borderRadius: 3 }}>Ctrl + Enter</kbd> to diagnose
              </span>
              {copilotQuery && (
                <button
                  onClick={() => setCopilotQuery('')}
                  style={{ background: 'none', border: 'none', color: '#7A6458', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear text
                </button>
              )}
            </div>
          </div>

          {/* Common Presets (Shown when no report yet) */}
          {!report && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7A6458', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Quick Symptom Presets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {COPILOT_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCopilotQuery(p.text);
                      handleDiagnose(p.text);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 2,
                      border: '1px solid #EAE0D6',
                      background: '#FAF8F5',
                      fontSize: 12.5,
                      color: '#2D1B11',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#CB4D22';
                      e.currentTarget.style.background = '#F5EBE6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#EAE0D6';
                      e.currentTarget.style.background = '#FAF8F5';
                    }}
                  >
                    <span>{p.label}</span>
                    <ChevronRight size={13} style={{ color: '#CB4D22', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Optional Custom Gemini Key */}
          <div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="btn-ghost"
              style={{ fontSize: 12, gap: 5, padding: '4px 0', color: '#7A6458' }}
            >
              <Key size={13} /> {showKey ? 'Hide Custom Gemini API Key' : 'Use your own Gemini API key (Optional)'}
              {showKey ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {showKey && (
              <div style={{ marginTop: 6 }}>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter custom Gemini key (leave blank to use server default)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p style={{ fontSize: 11, color: '#7A6458', marginTop: 4 }}>
                  Stored only in your browser tab for private testing.
                </p>
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={() => handleDiagnose()}
            disabled={loading || !copilotQuery.trim()}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              padding: '11px 16px',
              fontSize: 13.5,
              borderRadius: 2,
              opacity: loading || !copilotQuery.trim() ? 0.6 : 1,
              cursor: loading || !copilotQuery.trim() ? 'not-allowed' : 'pointer',
              gap: 8
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Matching Schematics & Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Run AI Copilot Diagnosis
              </>
            )}
          </button>

          {/* Error Notice */}
          {error && (
            <div style={{
              display: 'flex',
              gap: 8,
              background: '#FFF5F4',
              border: '1px solid #FFCDD2',
              borderRadius: 2,
              padding: '10px 14px',
              color: '#C92A2A',
              fontSize: 12.5
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {/* DIAGNOSTIC REPORT CARD */}
          {report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Refusal Card (Domain Guardrail) */}
              {report.isRefusal ? (
                <div style={{
                  background: '#FFF7ED',
                  border: '1px solid #FFCC80',
                  borderRadius: 2,
                  padding: '16px 18px',
                  borderLeft: '4px solid #C95100'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <ShieldAlert size={16} style={{ color: '#C95100' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#C95100', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Diagnostic Scope Notice
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#2D1B11', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                    {report.refusalReason}
                  </p>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE0D6',
                    borderRadius: 2,
                    padding: '8px 12px',
                    fontSize: 12,
                    color: '#7A6458'
                  }}>
                    <strong style={{ color: '#2D1B11' }}>💡 Try instead: </strong>
                    {report.suggestion}
                  </div>
                </div>
              ) : (
                <>
                  {/* Verdict Header */}
                  <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #CB4D22' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span className="badge" style={{ background: '#F5EBE6', color: '#CB4D22', fontSize: 11 }}>
                          <Sparkles size={11} /> {report.cloudSource}
                        </span>
                        {report.reportId && (
                          <span className="badge" style={{ background: '#E8F5E9', color: '#2E7D32', fontSize: 10.5, border: '1px solid #A5D6A7' }}>
                            ✓ Atlas DB Synced
                          </span>
                        )}
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>
                        <Leaf size={11} /> Saves {report.eWasteSavedKg} e-waste
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                      <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#2D1B11', margin: '0 0 4px 0' }}>
                        {report.defectType}
                      </h3>
                      {report.confidence && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#248A3D' }}>
                          ● {report.confidence}% Match
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#7A6458', fontWeight: 600, marginBottom: 8 }}>
                      Manual: {report.matchedManual}
                    </div>

                    <p style={{ fontSize: 13, color: '#2D1B11', margin: 0, lineHeight: 1.5 }}>
                      {report.summary}
                    </p>
                  </div>

                  {/* Safety Warning */}
                  {report.safetyWarning && (
                    <div style={{
                      background: '#FFF5F4',
                      border: '1px solid #FFCDD2',
                      borderRadius: 2,
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C92A2A', fontWeight: 700, fontSize: 12.5, marginBottom: 4 }}>
                        <ShieldAlert size={14} /> Safety Advisory
                      </div>
                      <div style={{ fontSize: 12, color: '#2D1B11', lineHeight: 1.45 }}>
                        {report.safetyWarning}
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Triage */}
                  {report.triageSteps?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#7A6458', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                        Recommended Diagnostic Steps
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {report.triageSteps.map((step, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            gap: 8,
                            background: '#FAF8F5',
                            border: '1px solid #EAE0D6',
                            borderRadius: 2,
                            padding: '8px 12px',
                            fontSize: 12.5,
                            color: '#2D1B11'
                          }}>
                            <span style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#CB4D22',
                              color: '#FFFFFF',
                              fontSize: 10,
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

                  {/* Parts Needed & Tools Required */}
                  {((report.partsNeeded && report.partsNeeded.length > 0) || (report.toolsRequired && report.toolsRequired.length > 0)) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {report.partsNeeded?.length > 0 && (
                        <div style={{ background: '#FAF8F5', border: '1px solid #EAE0D6', padding: '10px 12px', borderRadius: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#7A6458', textTransform: 'uppercase', marginBottom: 6 }}>
                            Parts Needed
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11.5, color: '#2D1B11', lineHeight: 1.4 }}>
                            {report.partsNeeded.map((p, idx) => <li key={idx}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {report.toolsRequired?.length > 0 && (
                        <div style={{ background: '#FAF8F5', border: '1px solid #EAE0D6', padding: '10px 12px', borderRadius: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#7A6458', textTransform: 'uppercase', marginBottom: 6 }}>
                            Tools Required
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11.5, color: '#2D1B11', lineHeight: 1.4 }}>
                            {report.toolsRequired.map((t, idx) => <li key={idx}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estimated Cost Banner */}
                  <div style={{
                    background: '#FDFBF9',
                    border: '1px solid #EAE0D6',
                    borderRadius: 2,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#CB4D22', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Estimated Repair Cost
                      </div>
                      <div style={{ fontSize: 11.5, color: '#7A6458' }}>
                        Protected under repairhub Vault
                      </div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: '#CB4D22' }}>
                      ৳{report.estimatedCostBDT}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary"
                      style={{
                        padding: '10px 14px',
                        fontSize: 12.5,
                        justifyContent: 'center',
                        gap: 6,
                        borderRadius: 2
                      }}
                    >
                      <RefreshCw size={13} /> New Query
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        if (onRequestRepair) {
                          onRequestRepair({
                            deviceType: report.matchedManual || 'Appliance Diagnosis',
                            summary: `${report.defectType}. ${report.summary}`,
                            estimatedCostBDT: report.estimatedCostBDT
                          });
                        }
                      }}
                      className="btn-primary"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        padding: '11px',
                        fontSize: 13.5,
                        gap: 8,
                        borderRadius: 2
                      }}
                    >
                      Book a Certified Workshop <ArrowRight size={14} />
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
