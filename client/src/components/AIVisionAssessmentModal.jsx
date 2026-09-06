import React, { useState, useRef } from 'react';
import {
  Camera,
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
  Upload,
  Sparkles,
  Eye
} from 'lucide-react';
import axios from 'axios';

export default function AIVisionAssessmentModal({ isOpen, onClose, onRequestRepair }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [visionDeviceName, setVisionDeviceName] = useState(''); // Separate state, never filled from Copilot!
  const [visionCategory, setVisionCategory] = useState('Electronics');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('Image file is too large. Please select a photo under 12MB.');
      return;
    }
    setSelectedImage(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Scale to max 1200px for optimal Gemini Vision latency
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
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      processFile(dt.files[0]);
    }
  };

  const handleInspectDamage = async () => {
    if (!imagePreview) {
      setError('Please upload a photo of the damaged hardware first.');
      return;
    }

    setLoading(true);
    setReport(null);
    setError('');

    try {
      const res = await axios.post('/api/ai/visual-assessment', {
        itemTitle: visionDeviceName.trim() || undefined,
        category: visionCategory || undefined,
        imageData: imagePreview,
        geminiApiKey: apiKey ? apiKey.trim() : undefined
      });

      if (res.data?.success) {
        const v = res.data.data;
        setReport({
          itemAnalyzed: v.item_analyzed || visionDeviceName || 'Inspected Hardware',
          category: v.category || visionCategory,
          defectType: v.defect_type || 'Physical Component Integrity Inspection',
          severityScore: v.severity_score || 7,
          isRepairable: v.is_repairable !== false,
          estimatedRepairDays: v.estimated_repair_time_days || 2,
          estimatedCostBDT: v.estimated_price_range
            ? `${v.estimated_price_range.min} – ${v.estimated_price_range.max}`
            : '450 – 1200',
          recommendation: v.recommendation || 'Hardware component defect identified via multimodal visual inspection.',
          safetyWarning: v.safety_warning || 'Ensure device is disconnected from all electrical power before repair.',
          triageSteps: Array.isArray(v.triage_steps) ? v.triage_steps : [],
          cloudSource: v.cloud_source || 'Google Gemini Multimodal Computer Vision (Live Analysis)',
          photoData: imagePreview
        });
      } else {
        setError(res.data?.message || 'Visual damage analysis could not be completed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg || 'Visual assessment failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setReport(null);
    setError('');
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: 580,
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
              <Camera size={17} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#2D1B11', letterSpacing: '-0.02em' }}>
                AI Vision Damage Assessment
              </div>
              <div style={{ fontSize: 11.5, color: '#7A6458' }}>
                Multimodal Computer Vision Analysis · Powered by Gemini
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px 8px', borderRadius: 2 }}>
            <X size={17} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Photo Dropzone & Preview */}
          <div>
            <label className="label" style={{ fontWeight: 600, color: '#2D1B11', marginBottom: 6 }}>
              Hardware Photograph of Damage / Defect
            </label>

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
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: isDragging ? '2px dashed #CB4D22' : '2px dashed #D0C3B8',
                  borderRadius: 2,
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: isDragging ? '#F5EBE6' : '#FAF8F5',
                  cursor: 'pointer',
                  transform: isDragging ? 'scale(1.01)' : 'scale(1)',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = '#CB4D22';
                    e.currentTarget.style.background = '#F5EBE6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.borderColor = '#D0C3B8';
                    e.currentTarget.style.background = '#FAF8F5';
                  }
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: isDragging ? '#CB4D22' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: '0 2px 8px rgba(45, 27, 17, 0.08)',
                  color: isDragging ? '#FFFFFF' : '#CB4D22',
                  transition: 'all 0.18s ease'
                }}>
                  <Camera size={24} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#2D1B11', marginBottom: 4 }}>
                  {isDragging ? 'Drop hardware photo here' : 'Click or drag photo of damaged item'}
                </div>
                <div style={{ fontSize: 11.5, color: isDragging ? '#CB4D22' : '#7A6458', fontWeight: isDragging ? 600 : 400 }}>
                  {isDragging ? 'Release mouse to inspect damage' : 'Supports Max 12MB'}
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: isDragging ? '2px dashed #CB4D22' : '1px solid #EAE0D6',
                  background: '#2D1B11'
                }}
              >
                <img
                  src={imagePreview}
                  alt="Damage Preview"
                  style={{ width: '100%', maxHeight: 240, objectFit: 'contain', display: 'block', margin: '0 auto' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.7)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '50%',
                    width: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(203,77,34,0.92)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 2 }}>
                  {isDragging ? 'Drop to replace image' : 'Ready for Vision Analysis'}
                </div>
              </div>
            )}
          </div>

          {/* Optional Metadata Fields (Separated from Copilot) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label" style={{ fontSize: 11.5, fontWeight: 600, color: '#2D1B11' }}>
                Device Model Hint (Optional)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Samsung Microwave or iPhone"
                value={visionDeviceName}
                onChange={(e) => setVisionDeviceName(e.target.value)}
                style={{ fontSize: 12.5 }}
              />
            </div>
            <div>
              <label className="label" style={{ fontSize: 11.5, fontWeight: 600, color: '#2D1B11' }}>
                Category
              </label>
              <select
                className="input"
                value={visionCategory}
                onChange={(e) => setVisionCategory(e.target.value)}
                style={{ fontSize: 12.5 }}
              >
                <option value="Electronics">Electronics</option>
                <option value="Home Appliances">Home Appliances</option>
                <option value="Furniture">Furniture</option>
                <option value="Textiles & Clothing">Textiles & Clothing</option>
                <option value="Bicycles">Bicycles</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Optional Custom Gemini Key */}
          <div>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="btn-ghost"
              style={{ fontSize: 12, gap: 5, padding: '4px 0', color: '#7A6458' }}
            >
              <Key size={13} /> {showKey ? 'Hide Custom Gemini API Key' : 'Use custom Gemini API key (Optional)'}
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
                  style={{ fontSize: 12 }}
                />
              </div>
            )}
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={handleInspectDamage}
            disabled={loading || !imagePreview}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              padding: '11px 16px',
              fontSize: 13.5,
              borderRadius: 2,
              opacity: loading || !imagePreview ? 0.6 : 1,
              cursor: loading || !imagePreview ? 'not-allowed' : 'pointer',
              gap: 8
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Scanning Hardware Pixels with Gemini Vision...
              </>
            ) : (
              <>
                <Eye size={15} />
                Inspect Photo Damage
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

          {/* VISUAL ASSESSMENT REPORT CARD */}
          {report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Verdict Card */}
              <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #CB4D22' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <span className="badge" style={{ background: '#F5EBE6', color: '#CB4D22', fontSize: 11 }}>
                    <Sparkles size={11} /> {report.cloudSource}
                  </span>
                  <span className={`badge ${report.isRepairable ? 'badge-green' : 'badge-orange'}`} style={{ fontSize: 11 }}>
                    {report.isRepairable ? '✓ Economically Viable' : '⚠ Significant Damage'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  {report.photoData && (
                    <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 2, overflow: 'hidden', flexShrink: 0, border: '2px solid #CB4D22' }}>
                      <img src={report.photoData} alt="Analyzed Damage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(203,77,34,0.92)', color: '#fff', fontSize: 8.5, textAlign: 'center', fontWeight: 700, padding: '1px 0' }}>
                        SCANNED
                      </span>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: '#7A6458', fontWeight: 600 }}>
                      {report.itemAnalyzed} · {report.category}
                    </div>
                    <h3 style={{ fontSize: 15.5, fontWeight: 700, color: '#2D1B11', margin: '2px 0 4px 0' }}>
                      {report.defectType}
                    </h3>
                    <p style={{ fontSize: 13, color: '#2D1B11', margin: 0, lineHeight: 1.5 }}>
                      {report.recommendation}
                    </p>
                  </div>
                </div>

                {/* Severity Meter */}
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #EAE0D6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#7A6458' }}>Damage Severity Index:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: report.severityScore >= 8 ? '#C92A2A' : report.severityScore >= 5 ? '#CB4D22' : '#248A3D' }}>
                      {report.severityScore} / 10 · {report.severityScore >= 8 ? 'Critical Structural' : report.severityScore >= 5 ? 'Moderate Functional' : 'Minor Cosmetic'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#EAE0D6', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(report.severityScore / 10) * 100}%`,
                      height: '100%',
                      background: report.severityScore >= 8 ? '#C92A2A' : report.severityScore >= 5 ? '#CB4D22' : '#248A3D',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
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
                    Recommended Physical Triage Steps
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

              {/* Cost & Turnaround */}
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
                    Turnaround: ~{report.estimatedRepairDays} business day(s)
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
                  <RefreshCw size={13} /> Scan Another Photo
                </button>

                <button
                  onClick={() => {
                    onClose();
                    if (onRequestRepair) {
                      onRequestRepair({
                        deviceType: report.itemAnalyzed,
                        summary: `${report.defectType}. ${report.recommendation}`,
                        photoData: report.photoData,
                        estimatedCostBDT: report.estimatedCostBDT,
                        severityScore: report.severityScore
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
                  Book Workshop with this Scan <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
