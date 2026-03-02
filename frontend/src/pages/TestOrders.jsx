import { useState, useEffect, useRef } from "react"
import Header from "../components/Header"
import axios from "axios"

const BACKEND = "http://localhost:8000"
const HL7_SVC = "http://localhost:8002"
const CV_SVC  = "http://localhost:8001"

const DIAGNOSIS_LIST = [
  "Melanocytic Nevi", "Melanoma", "Benign Keratosis", "Basal Cell Carcinoma",
  "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma",
]
const SEVERITY = {
  "Melanocytic Nevi": 1, "Melanoma": 5, "Benign Keratosis": 1,
  "Basal Cell Carcinoma": 3, "Actinic Keratosis": 3,
  "Vascular Lesion": 2, "Dermatofibroma": 1,
}
const STATUS_COLORS = {
  PENDING:   { bg: "#FEF3C7", color: "#D97706" },
  COMPLETED: { bg: "#D1FAE5", color: "#065F46" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
}
const FILTERS = ["ALL", "PENDING", "COMPLETED", "CANCELLED"]

function generateORU(order, diagnosis, confidence, severity, source) {
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)
  const oid = String(order.id).padStart(6, "0")
  const rid = `RES${oid}`
  const dob = order.patient_age
    ? `${new Date().getFullYear() - order.patient_age}0101` : ""
  const gender = (order.patient_gender || "U")[0].toUpperCase()
  const sev = severity || SEVERITY[diagnosis] || 1
  const confPct = (confidence * 100).toFixed(1)
  const abnFlag = sev >= 4 ? "H" : sev === 3 ? "L" : "N"
  const confFlag = parseFloat(confPct) >= 80 ? "N" : "L"
  const method = source === "cv"
    ? "Computer Vision (ResNet18 CNN)"
    : source === "ml"
      ? "Machine Learning (Clinical Data)"
      : "Manual Assessment"
  const interpretation = sev >= 4
    ? "HIGH RISK — URGENT CLINICAL REVIEW REQUIRED"
    : sev === 3
      ? "MODERATE RISK — FOLLOW-UP RECOMMENDED"
      : "LOW RISK — ROUTINE MONITORING"
  return [
    `MSH|^~\\&|MEDICALAI|HOSPITAL|LAB|HOSPITAL|${ts}||ORU^R01|${rid}|P|2.5`,
    `PID|1||${order.patient_code}^^^HOSPITAL^MR||Unknown^Patient||${dob}|${gender}`,
    `ORC|RE|ORD${oid}|${rid}||CM||||${ts}|||SYS^MEDICALAI^AI`,
    `OBR|1|ORD${oid}|${rid}|SKIN_ANALYSIS^Skin Lesion Analysis^L|||${ts}||||||||||||||||F`,
    `OBX|1|ST|79306-2^Skin lesion finding^LN||${diagnosis}||${abnFlag === "H" ? "MALIGNANT" : abnFlag === "L" ? "BORDERLINE" : "BENIGN"}|${abnFlag}|||F`,
    `OBX|2|NM|89243-0^Diagnostic confidence^LN||${confPct}|%|70-100|${confFlag}|||F`,
    `OBX|3|NM|70738-4^Severity score^LN||${sev}|{score}|1-5|${abnFlag}|||F`,
    `OBX|4|ST|48767-8^Analysis method^LN||${method}||||||F`,
    `OBX|5|ST|71480-3^Clinical interpretation^LN||${interpretation}||||||F`,
  ].join("\r")
}

// ── Order list (left column) ────────────────────────────────────────────────
function OrderList({ orders, selected, onSelect, filter, onFilterChange, counts }) {
  const visible = filter === "ALL" ? orders : orders.filter(o => o.status === filter)
  return (
    <div style={{
      width: "36%", borderRight: "1px solid #CBD5E0",
      display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      {/* Filter tabs */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #CBD5E0", display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => onFilterChange(f)} style={{
            background: filter === f ? "#0066CC" : "#F0F4F8",
            border: "1px solid #CBD5E0",
            color: filter === f ? "#FFFFFF" : "#4A5568",
            padding: "4px 10px", cursor: "pointer",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            fontSize: "11px", letterSpacing: "1px",
          }}>
            {f}{counts[f] > 0 ? ` (${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {/* Order rows */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {visible.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#CBD5E0", fontSize: "13px", fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "2px" }}>
            NO ORDERS
          </div>
        )}
        {visible.map(order => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
          const isSelected = selected?.id === order.id
          return (
            <div key={order.id} onClick={() => onSelect(order)} style={{
              padding: "12px 14px",
              borderBottom: "1px solid #CBD5E0",
              cursor: "pointer",
              background: isSelected ? "#E8EEF4" : "#FFFFFF",
              borderLeft: isSelected ? "3px solid #0066CC" : "3px solid transparent",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <span style={{ color: "#0066CC", fontSize: "13px", fontWeight: "700" }}>
                  #{String(order.id).padStart(4, "0")}
                </span>
                <span style={{ background: sc.bg, color: sc.color, padding: "2px 7px", fontSize: "10px", letterSpacing: "1px" }}>
                  {order.status}
                </span>
              </div>
              <div style={{ color: "#1A202C", fontSize: "13px" }}>{order.patient_code}</div>
              <div style={{ color: "#718096", fontSize: "11px", marginTop: "2px" }}>
                {order.patient_age ? `${order.patient_age}y` : "—"} · {order.patient_gender || "—"} · {order.test_type}
              </div>
              <div style={{ color: "#A0AEC0", fontSize: "10px", marginTop: "3px" }}>
                {order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Detail panel (right column) ─────────────────────────────────────────────
function DetailPanel({ order, onOrderUpdated }) {
  const fileRef = useRef(null)
  const [diameter, setDiameter]       = useState("")
  const [uvExp, setUvExp]             = useState("")
  const [abcde, setAbcde]             = useState("")
  const [mlResult, setMlResult]       = useState(null)
  const [mlLoading, setMlLoading]     = useState(false)
  const [cvResult, setCvResult]       = useState(null)
  const [cvLoading, setCvLoading]     = useState(false)
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [proposedDx, setProposedDx]   = useState("")
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [saveError, setSaveError]     = useState(null)
  const [oruPreview, setOruPreview]   = useState(null)

  // Reset on order change
  useEffect(() => {
    setDiameter(""); setUvExp(""); setAbcde("")
    setMlResult(null); setCvResult(null)
    setImageFile(null); setImagePreview(null)
    setProposedDx(""); setSaved(false); setSaveError(null)
    setOruPreview(null)
  }, [order?.id])

  // Auto-fill proposed diagnosis from CV (preferred) then ML
  useEffect(() => {
    if (cvResult?.diagnosis && !cvResult.error) setProposedDx(cvResult.diagnosis)
    else if (mlResult?.prediction && !mlResult.error) setProposedDx(mlResult.prediction)
  }, [cvResult, mlResult])

  const handleImage = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setCvResult(null)
  }

  const runML = async () => {
    setMlLoading(true)
    try {
      const r = await axios.post(`${BACKEND}/api/v1/ml/predict`, {
        age: order.patient_age || 45,
        gender: order.patient_gender || "F",
        fitzpatrick_type: 3,
        lesion_diameter: parseFloat(diameter) || 8.0,
        uv_exposure: parseFloat(uvExp) || 5.0,
        abcde_score: parseFloat(abcde) || 5.0,
      })
      setMlResult({ prediction: r.data.prediction, confidence: r.data.confidence })
    } catch (_) {
      setMlResult({ error: "Model not available. Train first in ML Models." })
    }
    setMlLoading(false)
  }

  const runCV = async () => {
    if (!imageFile) return
    setCvLoading(true)
    try {
      const fd = new FormData()
      fd.append("file", imageFile)
      const r = await axios.post(`${CV_SVC}/analyze`, fd)
      const cls = r.data.classification
      setCvResult({ diagnosis: cls.diagnosis, confidence: cls.confidence, probabilities: cls.probabilities })
    } catch (_) {
      setCvResult({ error: "CV service unavailable (port 8001)." })
    }
    setCvLoading(false)
  }

  const handleSave = async () => {
    if (!order || !diameter || !uvExp || !abcde || !proposedDx) return
    setSaving(true); setSaveError(null)
    try {
      // 1. Clinical record
      await axios.post(`${BACKEND}/api/v1/clinical/`, {
        patient_id: order.patient_id,
        lesion_diameter: parseFloat(diameter),
        uv_exposure: parseFloat(uvExp),
        abcde_score: parseFloat(abcde),
      })
      // 2. Diagnosis record
      const conf = cvResult?.confidence ?? mlResult?.confidence ?? 0.5
      await axios.post(`${BACKEND}/api/v1/clinical/diagnoses/`, {
        patient_id: order.patient_id,
        diagnosis: proposedDx,
        severity: SEVERITY[proposedDx] || 1,
        confidence: conf,
      })
      // 3. Save CV image if available
      if (cvResult?.diagnosis && !cvResult.error && imageFile) {
        try {
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsDataURL(imageFile)
          })
          await axios.post(`${BACKEND}/api/v1/clinical/cv-result/`, {
            patient_id: order.patient_id,
            image_data: base64,
            diagnosis: cvResult.diagnosis,
            confidence: cvResult.confidence,
          })
        } catch (_) {}
      }
      // 4. ORU^R01 → HL7 feed
      const sev = SEVERITY[proposedDx] || 1
      const src = cvResult?.confidence ? "cv" : mlResult?.confidence ? "ml" : "manual"
      const oruMsg = generateORU(order, proposedDx, conf, sev, src)
      setOruPreview(oruMsg)
      try { await axios.post(`${HL7_SVC}/messages`, { raw_message: oruMsg }) } catch (_) {}
      // 5. Mark COMPLETED
      await axios.patch(`${BACKEND}/api/v1/orders/${order.id}/status`, { status: "COMPLETED" })
      onOrderUpdated(order.id, "COMPLETED")
      setSaved(true)
    } catch (_) {
      setSaveError("Error saving results. Please try again.")
    }
    setSaving(false)
  }

  const inputStyle = {
    width: "100%", background: "#FFFFFF", border: "1px solid #CBD5E0",
    color: "#1A202C", padding: "7px 10px",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  }
  const labelStyle = {
    display: "block", color: "#4A5568", fontSize: "11px",
    letterSpacing: "2px", marginBottom: "4px",
  }
  const sectionHdr = (t) => (
    <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px", borderBottom: "1px solid #CBD5E0", paddingBottom: "6px" }}>
      {t}
    </div>
  )
  const resultBox = (res, label) => (
    <div style={{ marginTop: "8px", padding: "10px", background: res.error ? "#FEF2F2" : "#F0F4F8", border: `1px solid ${res.error ? "#FECACA" : "#CBD5E0"}` }}>
      {res.error
        ? <span style={{ color: "#EF4444", fontSize: "12px" }}>⚠ {res.error}</span>
        : <>
            <div style={{ color: "#718096", fontSize: "10px", letterSpacing: "1px" }}>{label}</div>
            <div style={{ color: "#1A202C", fontSize: "13px", fontWeight: "700", marginTop: "2px" }}>{res.prediction || res.diagnosis}</div>
            <div style={{ color: "#0066CC", fontSize: "12px" }}>{((res.confidence || 0) * 100).toFixed(1)}% confidence</div>
          </>
      }
    </div>
  )

  if (!order) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#718096", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "14px", letterSpacing: "2px" }}>
      SELECT AN ORDER
    </div>
  )

  const sc = STATUS_COLORS[order.status] || STATUS_COLORS.PENDING
  const canSave = !!(diameter && uvExp && abcde && proposedDx && order.status === "PENDING")

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>

      {/* A. Patient banner */}
      <div style={{ marginBottom: "20px", background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ color: "#0066CC", fontSize: "11px", letterSpacing: "2px", marginBottom: "2px" }}>
              ORDER #{String(order.id).padStart(4, "0")}
            </div>
            <div style={{ color: "#1A202C", fontSize: "18px", fontWeight: "700" }}>{order.patient_code}</div>
            <div style={{ color: "#718096", fontSize: "12px", marginTop: "4px" }}>
              {order.patient_age ? `${order.patient_age}y` : "—"} · {order.patient_gender || "—"} · {order.test_type}
            </div>
          </div>
          <span style={{ background: sc.bg, color: sc.color, padding: "4px 12px", fontSize: "11px", letterSpacing: "1px" }}>
            {order.status}
          </span>
        </div>
        {order.hl7_message && (
          <div style={{ marginTop: "10px" }}>
            <details>
              <summary style={{ color: "#0066CC", fontSize: "11px", letterSpacing: "1px", cursor: "pointer" }}>
                ORM^O01 REQUEST MESSAGE
              </summary>
              <pre style={{ background: "#1A202C", color: "#68D391", padding: "10px", fontSize: "11px", fontFamily: "'Courier New', monospace", marginTop: "8px", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: "8px 0 0" }}>
                {order.hl7_message}
              </pre>
            </details>
          </div>
        )}
      </div>

      {/* Already processed notice */}
      {order.status !== "PENDING" && (
        <div style={{ padding: "12px 16px", background: "#D1FAE5", border: "1px solid #6EE7B7", color: "#065F46", fontSize: "13px", marginBottom: "20px" }}>
          ✓ This order has been {order.status.toLowerCase()}. No further edits allowed.
        </div>
      )}

      {order.status === "PENDING" && (
        <>
          {/* B. Enter Results — 2 sub-columns */}
          <div style={{ marginBottom: "20px" }}>
            {sectionHdr("ENTER RESULTS")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* Left: Clinical inputs + ML Predict */}
              <div>
                <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", marginBottom: "10px" }}>CLINICAL DATA</div>
                <div style={{ marginBottom: "8px" }}>
                  <label style={labelStyle}>LESION DIAMETER (mm)</label>
                  <input type="number" step="0.1" min="0" value={diameter} onChange={e => setDiameter(e.target.value)} placeholder="e.g. 8.5" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <label style={labelStyle}>UV EXPOSURE (1–10)</label>
                  <input type="number" step="0.1" min="1" max="10" value={uvExp} onChange={e => setUvExp(e.target.value)} placeholder="e.g. 5" style={inputStyle} />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>ABCDE SCORE (1–10)</label>
                  <input type="number" step="0.1" min="1" max="10" value={abcde} onChange={e => setAbcde(e.target.value)} placeholder="e.g. 4" style={inputStyle} />
                </div>
                <button onClick={runML} disabled={mlLoading} style={{
                  background: mlLoading ? "#CBD5E0" : "#0066CC", border: "none",
                  color: mlLoading ? "#4A5568" : "#FFFFFF", padding: "8px 14px",
                  fontSize: "12px", letterSpacing: "1px", fontWeight: "700",
                  cursor: mlLoading ? "not-allowed" : "pointer", width: "100%",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                }}>
                  {mlLoading ? "PROCESSING..." : "ML PREDICT"}
                </button>
                {mlResult && resultBox(mlResult, "ML RESULT")}
              </div>

              {/* Right: CV image upload */}
              <div>
                <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", marginBottom: "10px" }}>COMPUTER VISION</div>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: "2px dashed #CBD5E0", height: "130px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: imagePreview ? "transparent" : "#F0F4F8",
                    marginBottom: "10px", overflow: "hidden",
                  }}
                >
                  {imagePreview
                    ? <img src={imagePreview} alt="skin lesion" style={{ maxHeight: "126px", maxWidth: "100%", objectFit: "contain" }} />
                    : <div style={{ textAlign: "center", color: "#A0AEC0", fontSize: "12px", letterSpacing: "1px" }}>
                        <div style={{ fontSize: "26px", marginBottom: "4px" }}>◫</div>
                        CLICK TO UPLOAD<br />JPG / PNG
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleImage} style={{ display: "none" }} />
                <button onClick={runCV} disabled={!imageFile || cvLoading} style={{
                  background: !imageFile || cvLoading ? "#CBD5E0" : "#0066CC", border: "none",
                  color: !imageFile || cvLoading ? "#4A5568" : "#FFFFFF", padding: "8px 14px",
                  fontSize: "12px", letterSpacing: "1px", fontWeight: "700",
                  cursor: !imageFile || cvLoading ? "not-allowed" : "pointer", width: "100%",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                }}>
                  {cvLoading ? "ANALYZING..." : "ANALYZE IMAGE"}
                </button>
                {cvResult && resultBox(cvResult, "CV RESULT")}
              </div>
            </div>
          </div>

          {/* C. Proposed Diagnosis */}
          <div style={{ marginBottom: "20px" }}>
            {sectionHdr("PROPOSED DIAGNOSIS")}
            <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", marginBottom: "6px" }}>
              {cvResult?.diagnosis && !cvResult.error
                ? "Pre-filled from Computer Vision"
                : mlResult?.prediction && !mlResult.error
                  ? "Pre-filled from ML Prediction"
                  : "Select or enter diagnosis manually"}
            </div>
            <select value={proposedDx} onChange={e => setProposedDx(e.target.value)} style={{ ...inputStyle }}>
              <option value="">— Select diagnosis —</option>
              {DIAGNOSIS_LIST.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* D. Save Results */}
          <div>
            {saveError && (
              <div style={{ padding: "10px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>
                ⚠ {saveError}
              </div>
            )}
            {saved ? (
              <div style={{ padding: "14px 16px", background: "#D1FAE5", border: "1px solid #6EE7B7", color: "#065F46", fontSize: "13px" }}>
                ✓ RESULTS SAVED — Clinical data and diagnosis recorded. ORU^R01 sent to HL7 feed. Order marked COMPLETED.
              </div>
            ) : (
              <>
                <button onClick={handleSave} disabled={!canSave || saving} style={{
                  width: "100%",
                  background: canSave && !saving ? "#0066CC" : "#CBD5E0",
                  border: "none",
                  color: canSave && !saving ? "#FFFFFF" : "#4A5568",
                  padding: "12px", fontSize: "14px", letterSpacing: "2px", fontWeight: "700",
                  cursor: canSave && !saving ? "pointer" : "not-allowed",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                }}>
                  {saving ? "SAVING..." : "SAVE RESULTS"}
                </button>
                {!canSave && (
                  <div style={{ color: "#A0AEC0", fontSize: "11px", marginTop: "6px", textAlign: "center" }}>
                    Enter clinical values and select a diagnosis to save
                  </div>
                )}
              </>
            )}
          </div>

          {/* ORU^R01 preview (shown after save) */}
          {oruPreview && (
            <div style={{ marginTop: "20px" }}>
              <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px", borderBottom: "1px solid #CBD5E0", paddingBottom: "6px" }}>
                ORU^R01 RESULT MESSAGE
              </div>
              <pre style={{ background: "#1A202C", color: "#68D391", padding: "12px", fontSize: "11px", fontFamily: "'Courier New', monospace", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 }}>
                {oruPreview}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function TestOrders() {
  const [orders, setOrders]   = useState([])
  const [filter, setFilter]   = useState("ALL")
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchOrders = () => {
    setLoading(true)
    axios.get(`${BACKEND}/api/v1/orders/`)
      .then(r => { setOrders(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { fetchOrders() }, [])

  const handleOrderUpdated = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setSelected(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev)
  }

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "ALL" ? orders.length : orders.filter(o => o.status === f).length
    return acc
  }, {})

  return (
    <div style={{ flex: 1, background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title="Test Orders" subtitle="HOSPITAL SIMULATION — HL7 WORKFLOW" />

      {/* Summary cards */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #CBD5E0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[
            { label: "TOTAL",     value: counts["ALL"],       color: "#0066CC" },
            { label: "PENDING",   value: counts["PENDING"],   color: "#D97706" },
            { label: "COMPLETED", value: counts["COMPLETED"], color: "#10B981" },
            { label: "CANCELLED", value: counts["CANCELLED"], color: "#EF4444" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "#F0F4F8", border: "1px solid #CBD5E0",
              borderTop: `2px solid ${color}`, padding: "12px 14px",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              <div style={{ color: "#4A5568", fontSize: "10px", letterSpacing: "2px", marginBottom: "2px" }}>{label}</div>
              <div style={{ color, fontSize: "24px", fontWeight: "700" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#718096", fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "2px" }}>
          LOADING...
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <OrderList
            orders={orders}
            selected={selected}
            onSelect={setSelected}
            filter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
          <DetailPanel
            order={selected}
            onOrderUpdated={handleOrderUpdated}
          />
        </div>
      )}
    </div>
  )
}
