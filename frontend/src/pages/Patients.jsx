import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useNavigate } from "react-router-dom"

const BACKEND = "http://localhost:8000"
const COLORS = ["#0066CC", "#2196F3", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#EC4899"]
const DIAGNOSES = ["Melanocytic Nevi", "Melanoma", "Benign Keratosis", "Basal Cell Carcinoma", "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma"]
const SEVERITY = { "Melanocytic Nevi": 1, "Melanoma": 5, "Benign Keratosis": 1, "Basal Cell Carcinoma": 3, "Actinic Keratosis": 3, "Vascular Lesion": 2, "Dermatofibroma": 1 }

const PredTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "8px 12px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "13px" }}>
        <div style={{ color: "#4A5568", marginBottom: "2px" }}>{label}</div>
        <div style={{ color: payload[0].color }}>{(payload[0].value * 100).toFixed(1)}%</div>
      </div>
    )
  }
  return null
}

function PatientRow({ patient, onClick, selected }) {
  return (
    <div onClick={() => onClick(patient)} style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr 60px 80px 120px",
      padding: "12px 20px",
      borderBottom: "1px solid #CBD5E0",
      cursor: "pointer",
      background: selected ? "#E8EEF4" : "transparent",
      borderLeft: selected ? "2px solid #0066CC" : "2px solid transparent",
      transition: "all 0.15s",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ color: "#0066CC", fontSize: "14px" }}>#{patient.id}</div>
      <div style={{ color: "#1A202C", fontSize: "14px" }}>{patient.patient_code}</div>
      <div style={{ color: "#4A5568", fontSize: "14px" }}>{patient.age || "—"}</div>
      <div style={{ color: "#4A5568", fontSize: "14px" }}>{patient.gender || "—"}</div>
      <div style={{ color: "#718096", fontSize: "13px" }}>
        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "—"}
      </div>
    </div>
  )
}

function PatientDetail({ patient, onDelete }) {
  const navigate = useNavigate()
  const [clinical, setClinical] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [predLoading, setPredLoading] = useState(false)
  const [modelTrained, setModelTrained] = useState(false)
  const [selectedModel, setSelectedModel] = useState("")  // "" = best model
  const [orderStatus, setOrderStatus] = useState(null)   // null | "sending" | "ok" | "error"
  const [lastOrderId, setLastOrderId] = useState(null)
  const [diagnoses, setDiagnoses] = useState([])
  const [predSaved, setPredSaved] = useState(false)
  const [cvResult, setCvResult] = useState(null)

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/ml/status`)
      .then(r => setModelTrained(r.data.trained))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!patient) {
      setDeleting(false)
      setConfirmDelete(false)
      return
    }
    setClinical([])
    setConfirmDelete(false)
    setDeleting(false)
    setPrediction(null)
    setOrderStatus(null)
    setLastOrderId(null)
    setDiagnoses([])
    setPredSaved(false)
    setCvResult(null)
    axios.get(`${BACKEND}/api/v1/clinical/${patient.id}`)
      .then(r => setClinical(r.data.slice().sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))))
      .catch(() => setClinical([]))
    axios.get(`${BACKEND}/api/v1/clinical/diagnoses/${patient.id}`)
      .then(r => setDiagnoses(r.data))
      .catch(() => setDiagnoses([]))
    axios.get(`${BACKEND}/api/v1/clinical/cv-result/${patient.id}`)
      .then(r => r.data.exists ? setCvResult(r.data) : setCvResult(null))
      .catch(() => setCvResult(null))
  }, [patient])

  const savePrediction = async () => {
    if (!prediction) return
    try {
      await axios.post(`${BACKEND}/api/v1/clinical/diagnoses/`, {
        patient_id: patient.id,
        diagnosis: prediction.prediction,
        severity: prediction.severity,
        confidence: prediction.confidence,
      })
      setPredSaved(true)
      const r = await axios.get(`${BACKEND}/api/v1/clinical/diagnoses/${patient.id}`)
      setDiagnoses(r.data)
    } catch (e) {}
  }

  const runPrediction = async () => {
    setPredLoading(true)
    setPredSaved(false)
    const latest = clinical[0] || {}
    const age      = patient.age || 45
    const fitz     = patient.fitzpatrick_type || 3
    const diameter = latest.lesion_diameter ?? 8.0
    const uvExp    = latest.uv_exposure ?? 5.0
    const abcde    = latest.abcde_score ?? 5.0
    const inputs   = { age, fitz, diameter, uvExp, abcde, gender: patient.gender }

    if (modelTrained) {
      try {
        const r = await axios.post(`${BACKEND}/api/v1/ml/predict`, {
          age, gender: patient.gender || "F",
          fitzpatrick_type: fitz,
          lesion_diameter: diameter,
          uv_exposure: uvExp,
          abcde_score: abcde,
          model_name: selectedModel || null,
        })
        const probs = r.data.probabilities
        const modelLabel = selectedModel
          ? { "logistic-regression": "Logistic Regression", "random-forest": "Random Forest", "gradient-boosting": "Gradient Boosting" }[selectedModel]
          : "Best Model"
        setPrediction({
          prediction: r.data.prediction,
          confidence: r.data.confidence,
          severity: SEVERITY[r.data.prediction] || 1,
          probabilities: probs,
          inputs,
          source: "model",
          modelUsed: modelLabel,
        })
        setPredLoading(false)
        return
      } catch (e) {}
    }

    // Fallback: softmax simulator
    const isMale = patient.gender === "M"
    const scores = {
      "Melanocytic Nevi": 2.5, "Melanoma": 0.5, "Benign Keratosis": 0.5,
      "Basal Cell Carcinoma": -0.5, "Actinic Keratosis": -1.0,
      "Vascular Lesion": -2.0, "Dermatofibroma": -2.0,
    }
    const abcdeN = (abcde - 1) / 9
    scores["Melanoma"] += abcdeN * 3.0; scores["Basal Cell Carcinoma"] += abcdeN * 2.0
    scores["Actinic Keratosis"] += abcdeN * 1.5; scores["Melanocytic Nevi"] -= abcdeN * 2.0
    const uvN = (uvExp - 1) / 9
    scores["Melanoma"] += uvN * 2.0; scores["Actinic Keratosis"] += uvN * 2.5
    const dN = Math.min((diameter - 2) / 28, 1)
    scores["Melanoma"] += dN * 2.0; scores["Basal Cell Carcinoma"] += dN * 1.5; scores["Melanocytic Nevi"] -= dN * 1.0
    const fitzFair = Math.max(0, (3 - fitz) / 2)
    scores["Melanoma"] += fitzFair * 1.5; scores["Actinic Keratosis"] += fitzFair * 1.0
    const ageN = Math.min((age - 14) / 56, 1)
    scores["Basal Cell Carcinoma"] += ageN * 2.0; scores["Actinic Keratosis"] += ageN * 1.5; scores["Melanocytic Nevi"] -= ageN * 1.0
    if (isMale) scores["Melanoma"] += 0.3
    const maxS = Math.max(...Object.values(scores))
    const exps = {}; let total = 0
    for (const [d, s] of Object.entries(scores)) { exps[d] = Math.exp(s - maxS); total += exps[d] }
    const probs = DIAGNOSES.map(d => ({ diagnosis: d, probability: exps[d] / total }))
      .sort((a, b) => b.probability - a.probability)
    setPrediction({
      prediction: probs[0].diagnosis, confidence: probs[0].probability,
      severity: SEVERITY[probs[0].diagnosis], probabilities: probs,
      inputs, source: "simulator",
    })
    setPredLoading(false)
  }

  const severityColor = (s) => s >= 4 ? "#EF4444" : s >= 3 ? "#F59E0B" : "#0066CC"

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await axios.delete(`${BACKEND}/api/v1/patients/${patient.id}`)
      onDelete(patient.id)
    } catch (e) {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const requestTest = async () => {
    setOrderStatus("sending")
    try {
      const r = await axios.post(`${BACKEND}/api/v1/orders/`, {
        patient_id: patient.id,
        patient_code: patient.patient_code,
        patient_age: patient.age || null,
        patient_gender: patient.gender || null,
        test_type: "Skin Lesion Analysis",
      })
      setLastOrderId(r.data.id)
      setOrderStatus("ok")
    } catch (e) {
      setOrderStatus("error")
    }
  }

  if (!patient) return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#718096", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "14px", letterSpacing: "2px"
    }}>
      SELECT A PATIENT
    </div>
  )

  return (
    <div style={{ flex: 1, padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", overflowY: "auto" }}>
      <div style={{ color: "#0066CC", fontSize: "12px", letterSpacing: "3px", marginBottom: "4px" }}>
        PATIENT RECORD
      </div>
      <div style={{ color: "#1A202C", fontSize: "22px", fontWeight: "700", marginBottom: "24px" }}>
        {patient.patient_code}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "ID", value: patient.id },
          { label: "CODE", value: patient.patient_code },
          { label: "AGE", value: patient.age || "—" },
          { label: "GENDER", value: patient.gender || "—" },
          { label: "FITZPATRICK", value: patient.fitzpatrick_type ? `Type ${patient.fitzpatrick_type}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#F0F4F8",
            border: "1px solid #CBD5E0",
            padding: "12px",
          }}>
            <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>{label}</div>
            <div style={{ color: "#1A202C", fontSize: "16px" }}>{value}</div>
          </div>
        ))}
      </div>

      {clinical.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "12px" }}>
            CLINICAL DATA ({clinical.length} {clinical.length === 1 ? "record" : "records"})
          </div>
          {clinical.map((c, i) => (
            <div key={i} style={{
              background: "#F0F4F8",
              border: "1px solid #CBD5E0",
              padding: "12px",
              marginBottom: "8px",
            }}>
              <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "2px", marginBottom: "10px" }}>
                {c.recorded_at ? new Date(c.recorded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[
                  { label: "DIAMETER", value: c.lesion_diameter != null ? `${c.lesion_diameter} mm` : null },
                  { label: "UV INDEX", value: c.uv_exposure },
                  { label: "ABCDE", value: c.abcde_score != null ? `${c.abcde_score}/10` : null },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>{label}</div>
                    <div style={{ color: "#0066CC", fontSize: "16px" }}>{value ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Diagnoses */}
      {diagnoses.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "12px" }}>
            LAST DIAGNOSIS
          </div>
          {diagnoses.slice(0, 1).map((d, i) => (
            <div key={i} style={{
              background: "#F0F4F8",
              border: "1px solid #CBD5E0",
              padding: "10px 12px",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px" }}>
                  {d.diagnosed_at ? new Date(d.diagnosed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                </div>
                <div style={{ color: "#1A202C", fontSize: "14px", marginTop: "2px" }}>{d.diagnosis}</div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#0066CC", fontSize: "14px", fontWeight: "700" }}>{(d.confidence * 100).toFixed(0)}%</span>
                <span style={{
                  background: severityColor(d.severity),
                  color: "#FFFFFF",
                  padding: "2px 8px",
                  fontSize: "11px",
                  letterSpacing: "1px",
                }}>SEV {d.severity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last CV Analysis */}
      {cvResult && (
        <div style={{ marginBottom: "24px", background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "14px 16px" }}>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "12px" }}>
            LAST CV ANALYSIS
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
            <img
              src={cvResult.image_data}
              alt="skin lesion"
              style={{ width: "110px", height: "110px", objectFit: "cover", border: "1px solid #CBD5E0", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", marginBottom: "6px" }}>
                {cvResult.analyzed_at ? new Date(cvResult.analyzed_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
              </div>
              <div style={{ color: "#1A202C", fontSize: "15px", fontWeight: "700", marginBottom: "6px" }}>
                {cvResult.diagnosis}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ color: "#0066CC", fontSize: "18px", fontWeight: "700" }}>
                  {(cvResult.confidence * 100).toFixed(1)}%
                </span>
                <span style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px" }}>CONFIDENCE</span>
              </div>
              <div style={{ marginTop: "8px" }}>
                <span style={{
                  background: severityColor(SEVERITY[cvResult.diagnosis] || 1),
                  color: "#FFFFFF", padding: "2px 8px", fontSize: "11px", letterSpacing: "1px",
                }}>
                  SEV {SEVERITY[cvResult.diagnosis] || 1}
                </span>
                <span style={{ marginLeft: "8px", color: "#718096", fontSize: "11px" }}>
                  Computer Vision · ResNet18
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML Prediction */}
      <div style={{ marginBottom: "24px", background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "20px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ marginBottom: prediction ? "16px" : "0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px" }}>ML PREDICTION</div>
              <div style={{ fontSize: "11px", marginTop: "2px", color: prediction?.source === "model" ? "#10B981" : modelTrained ? "#10B981" : "#F59E0B" }}>
                {prediction?.source === "model" ? `● ${prediction.modelUsed}` : modelTrained ? "● REAL MODEL READY" : "○ SIMULATOR (train model in ML page)"}
              </div>
            </div>
            <button onClick={runPrediction} disabled={predLoading} style={{
              background: predLoading ? "#CBD5E0" : "#0066CC",
              border: "none", color: predLoading ? "#4A5568" : "#FFFFFF",
              padding: "6px 16px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontSize: "13px", letterSpacing: "1px", fontWeight: "700",
              cursor: predLoading ? "not-allowed" : "pointer",
            }}>
              {predLoading ? "PROCESSING..." : prediction ? "RE-RUN" : "RUN PREDICTION"}
            </button>
          </div>
          {modelTrained && (
            <div>
              <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", marginBottom: "4px" }}>MODEL</div>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{
                background: "#FFFFFF", border: "1px solid #CBD5E0", color: "#1A202C",
                padding: "5px 10px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: "12px", outline: "none", width: "100%",
              }}>
                <option value="">Best Model (auto)</option>
                <option value="logistic-regression">Logistic Regression</option>
                <option value="random-forest">Random Forest</option>
                <option value="gradient-boosting">Gradient Boosting</option>
              </select>
            </div>
          )}
        </div>

        {prediction && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "12px", gridColumn: "1 / -1" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>PREDICTION</div>
                <div style={{ color: "#1A202C", fontSize: "18px", fontWeight: "700" }}>{prediction.prediction}</div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "12px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>CONFIDENCE</div>
                <div style={{ color: "#0066CC", fontSize: "20px", fontWeight: "700" }}>{(prediction.confidence * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "12px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>SEVERITY</div>
                <div style={{ color: severityColor(prediction.severity), fontSize: "20px", fontWeight: "700" }}>{prediction.severity}/5</div>
              </div>
            </div>
            {prediction.inputs && (
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "10px 12px", marginBottom: "12px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "6px" }}>INPUTS USED</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[
                    { k: "Age", v: prediction.inputs.age },
                    { k: "Gender", v: prediction.inputs.gender || "—" },
                    { k: "Fitzpatrick", v: `Type ${prediction.inputs.fitz}` },
                    { k: "Diameter", v: `${prediction.inputs.diameter} mm` },
                    { k: "UV Index", v: prediction.inputs.uvExp },
                    { k: "ABCDE", v: `${prediction.inputs.abcde}/10` },
                  ].map(({ k, v }) => (
                    <span key={k} style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "3px 8px", fontSize: "12px", color: "#4A5568" }}>
                      <span style={{ color: "#718096" }}>{k}: </span>{v}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>PROBABILITIES</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={prediction.probabilities} layout="vertical">
                <XAxis type="number" domain={[0, 1]} tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} />
                <YAxis dataKey="diagnosis" type="category" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} width={130} />
                <Tooltip content={<PredTooltip />} />
                <Bar dataKey="probability" name="Probability">
                  {prediction.probabilities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button onClick={savePrediction} disabled={predSaved} style={{
                background: predSaved ? "#10B981" : "#0066CC",
                border: "none", color: "#FFFFFF",
                padding: "6px 16px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: "12px", letterSpacing: "1px", fontWeight: "700",
                cursor: predSaved ? "default" : "pointer",
              }}>
                {predSaved ? "✓ SAVED" : "SAVE PREDICTION"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test Order */}
      <div style={{ marginBottom: "24px", background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "16px 20px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px" }}>REQUEST TEST</div>
            <div style={{ color: "#718096", fontSize: "11px", marginTop: "2px" }}>Skin Lesion Analysis · ORM^O01 HL7</div>
          </div>
          <button onClick={requestTest} disabled={orderStatus === "sending"} style={{
            background: orderStatus === "sending" ? "#CBD5E0" : "#0066CC",
            border: "none", color: orderStatus === "sending" ? "#4A5568" : "#FFFFFF",
            padding: "8px 18px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            fontSize: "13px", letterSpacing: "2px", fontWeight: "700",
            cursor: orderStatus === "sending" ? "not-allowed" : "pointer",
          }}>
            {orderStatus === "sending" ? "SENDING..." : "REQUEST TEST"}
          </button>
        </div>
        {orderStatus === "ok" && (
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#10B981", fontSize: "12px" }}>
              ● Order #{String(lastOrderId).padStart(4, "0")} created successfully
            </span>
            <button onClick={() => navigate("/orders")} style={{
              background: "transparent", border: "1px solid #0066CC", color: "#0066CC",
              padding: "3px 10px", fontSize: "11px", cursor: "pointer",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", letterSpacing: "1px",
            }}>VIEW ORDERS →</button>
          </div>
        )}
        {orderStatus === "error" && (
          <div style={{ marginTop: "10px", color: "#EF4444", fontSize: "12px" }}>⚠ Error creating the order. Please try again.</div>
        )}
      </div>

      {/* Delete section */}
      <div style={{ borderTop: "1px solid #CBD5E0", paddingTop: "20px" }}>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} style={{
            background: "transparent", border: "1px solid #EF4444", color: "#EF4444",
            padding: "8px 16px", fontSize: "13px", cursor: "pointer",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", borderRadius: "4px",
          }}>
            DELETE PATIENT
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ color: "#EF4444", fontSize: "13px" }}>Delete this patient?</span>
            <button onClick={handleDelete} disabled={deleting} style={{
              background: "#EF4444", border: "none", color: "#FFFFFF",
              padding: "8px 16px", fontSize: "13px", fontWeight: "700",
              cursor: deleting ? "not-allowed" : "pointer",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", borderRadius: "4px",
            }}>
              {deleting ? "DELETING..." : "CONFIRM"}
            </button>
            <button onClick={() => setConfirmDelete(false)} disabled={deleting} style={{
              background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
              padding: "8px 16px", fontSize: "13px", cursor: "pointer",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", borderRadius: "4px",
            }}>
              CANCEL
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CreatePatientModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({ patient_code: "", age: "", gender: "", fitzpatrick_type: "" })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.patient_code.trim()) {
      setError("Patient code is required.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        patient_code: formData.patient_code.trim(),
        age: formData.age !== "" ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        fitzpatrick_type: formData.fitzpatrick_type !== "" ? parseInt(formData.fitzpatrick_type) : null,
      }
      const res = await axios.post(`${BACKEND}/api/v1/patients/`, payload)
      onCreated(res.data)
    } catch (e) {
      const detail = e.response?.data?.detail
      setError(typeof detail === "string" ? detail : "Error creating patient.")
    }
    setSaving(false)
  }

  const fieldStyle = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #CBD5E0",
    color: "#1A202C",
    padding: "10px 12px",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    borderRadius: "4px",
  }

  const labelStyle = {
    display: "block",
    color: "#4A5568",
    fontSize: "12px",
    letterSpacing: "2px",
    marginBottom: "6px",
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0, 0, 0, 0.35)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #CBD5E0",
        borderTop: "3px solid #0066CC",
        padding: "32px",
        width: "460px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        borderRadius: "4px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ color: "#0066CC", fontSize: "12px", letterSpacing: "3px", marginBottom: "4px" }}>
          NEW RECORD
        </div>
        <div style={{ color: "#1A202C", fontSize: "20px", fontWeight: "700", marginBottom: "24px" }}>
          New Patient
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>PATIENT CODE <span style={{ color: "#EF4444" }}>*</span></label>
            <input
              autoFocus
              value={formData.patient_code}
              onChange={e => setFormData(f => ({ ...f, patient_code: e.target.value }))}
              placeholder="e.g. PAT-001"
              maxLength={20}
              style={fieldStyle}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>AGE</label>
              <input
                type="number"
                min="0"
                max="150"
                value={formData.age}
                onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
                placeholder="—"
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>GENDER</label>
              <select
                value={formData.gender}
                onChange={e => setFormData(f => ({ ...f, gender: e.target.value }))}
                style={fieldStyle}
              >
                <option value="">—</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>FITZPATRICK SKIN TYPE</label>
            <select
              value={formData.fitzpatrick_type}
              onChange={e => setFormData(f => ({ ...f, fitzpatrick_type: e.target.value }))}
              style={fieldStyle}
            >
              <option value="">—</option>
              <option value="1">Type I — Always burns, never tans (very fair)</option>
              <option value="2">Type II — Usually burns, sometimes tans (fair)</option>
              <option value="3">Type III — Sometimes burns, always tans (medium)</option>
              <option value="4">Type IV — Rarely burns, always tans (olive)</option>
              <option value="5">Type V — Very rarely burns (brown)</option>
              <option value="6">Type VI — Never burns (dark brown/black)</option>
            </select>
          </div>

          {error && (
            <div style={{
              color: "#EF4444", fontSize: "13px", marginBottom: "16px",
              background: "#FEF2F2", border: "1px solid #FECACA",
              padding: "10px 12px", borderRadius: "4px"
            }}>
              ⚠ {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button type="button" onClick={onClose} style={{
              background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
              padding: "10px 20px", fontSize: "14px", cursor: "pointer",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", borderRadius: "4px",
            }}>
              CANCEL
            </button>
            <button type="submit" disabled={saving} style={{
              background: saving ? "#CBD5E0" : "#0066CC",
              border: "none", color: saving ? "#4A5568" : "#FFFFFF",
              padding: "10px 24px", fontSize: "14px", fontWeight: "700",
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", borderRadius: "4px",
            }}>
              {saving ? "SAVING..." : "SAVE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


export default function Patients() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const PAGE_SIZE = 50

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/patients/?limit=500`)
      .then(r => setPatients(r.data))
      .catch(() => {})
  }, [])

  const handleCreated = (newPatient) => {
    setShowForm(false)
    setPatients(prev => [newPatient, ...prev])
    setSelected(newPatient)
    setSearch("")
    setPage(0)
  }

  const handleDeleted = (patientId) => {
    setPatients(prev => prev.filter(p => p.id !== patientId))
    setSelected(null)
  }

  const filtered = patients.filter(p =>
    p.patient_code.toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ flex: 1, background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title="Patient Registry" subtitle="HAM10000 DATASET" />

      {showForm && (
        <CreatePatientModal
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}

<div style={{ display: "flex", flex: 1 }}>
        {/* List */}
        <div style={{ width: "55%", borderRight: "1px solid #CBD5E0", display: "flex", flexDirection: "column" }}>
          {/* Search + actions */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #CBD5E0", display: "flex", gap: "12px" }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="SEARCH BY CODE..."
              style={{
                flex: 1,
                background: "#F0F4F8",
                border: "1px solid #CBD5E0",
                color: "#1A202C",
                padding: "8px 12px",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: "14px",
                letterSpacing: "1px",
                outline: "none",
              }}
            />
            <button onClick={() => setShowForm(true)} style={{
              background: "#0066CC", border: "none", color: "#FFFFFF",
              padding: "8px 18px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
            }}>
              + NEW PATIENT
            </button>
          </div>

          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 60px 80px 120px",
            padding: "8px 20px",
            borderBottom: "1px solid #CBD5E0",
          }}>
            {["ID", "CODE", "AGE", "GENDER", "CREATED"].map(h => (
              <div key={h} style={{ color: "#718096", fontSize: "11px", letterSpacing: "2px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
            {paged.map(p => (
              <PatientRow key={p.id} patient={p} onClick={setSelected} selected={selected?.id === p.id} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid #CBD5E0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
          }}>
            <span style={{ color: "#4A5568", fontSize: "13px" }}>
              {filtered.length} RECORDS — PAGE {page + 1}/{Math.ceil(filtered.length / PAGE_SIZE) || 1}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
                padding: "4px 12px", cursor: "pointer", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "13px"
              }}>PREV</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= filtered.length} style={{
                background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
                padding: "4px 12px", cursor: "pointer", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "13px"
              }}>NEXT</button>
            </div>
          </div>
        </div>

        {/* Detail */}
        <PatientDetail patient={selected} onDelete={handleDeleted} />
      </div>
    </div>
  )
}
