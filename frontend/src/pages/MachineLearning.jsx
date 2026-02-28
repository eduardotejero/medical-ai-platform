import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const BACKEND = "http://localhost:8000"
const COLORS = ["#00d4aa", "#4a9eff", "#aa44ff", "#ffaa00", "#ff4444", "#44ffaa", "#ff44aa"]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "10px 14px", fontFamily: "monospace", fontSize: "11px" }}>
        <div style={{ color: "#4a6a8a", marginBottom: "4px" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

const DIAGNOSES = ["Melanocytic Nevi", "Melanoma", "Benign Keratosis", "Basal Cell Carcinoma", "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma"]
const SEVERITY = { "Melanocytic Nevi": 1, "Melanoma": 5, "Benign Keratosis": 1, "Basal Cell Carcinoma": 3, "Actinic Keratosis": 3, "Vascular Lesion": 2, "Dermatofibroma": 1 }

function PredictionSimulator() {
  const [age, setAge] = useState(45)
  const [gender, setGender] = useState("M")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const simulate = () => {
    setLoading(true)
    setTimeout(() => {
      const probs = DIAGNOSES.map(d => ({ diagnosis: d, probability: Math.random() }))
      const total = probs.reduce((s, p) => s + p.probability, 0)
      probs.forEach(p => p.probability = p.probability / total)
      probs.sort((a, b) => b.probability - a.probability)
      setResult({
        prediction: probs[0].diagnosis,
        confidence: probs[0].probability,
        severity: SEVERITY[probs[0].diagnosis],
        probabilities: probs
      })
      setLoading(false)
    }, 800)
  }

  const severityColor = (s) => s >= 4 ? "#ff4444" : s >= 3 ? "#ffaa00" : "#00d4aa"

  return (
    <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "24px", fontFamily: "monospace" }}>
      <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "20px" }}>ML PREDICTION SIMULATOR</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "16px", marginBottom: "20px", alignItems: "end" }}>
        <div>
          <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>AGE</div>
          <input type="number" value={age} onChange={e => setAge(e.target.value)} style={{
            width: "100%", background: "#060a14", border: "1px solid #1a2535",
            color: "#e8f0fe", padding: "8px 12px", fontFamily: "monospace", fontSize: "13px",
            outline: "none", boxSizing: "border-box"
          }} />
        </div>
        <div>
          <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>GENDER</div>
          <select value={gender} onChange={e => setGender(e.target.value)} style={{
            width: "100%", background: "#060a14", border: "1px solid #1a2535",
            color: "#e8f0fe", padding: "8px 12px", fontFamily: "monospace", fontSize: "13px",
            outline: "none"
          }}>
            <option value="M">MALE</option>
            <option value="F">FEMALE</option>
          </select>
        </div>
        <button onClick={simulate} disabled={loading} style={{
          background: loading ? "#1a2535" : "#00d4aa",
          border: "none", color: loading ? "#4a6a8a" : "#060a14",
          padding: "8px 24px", fontFamily: "monospace", fontSize: "11px",
          letterSpacing: "2px", cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "700"
        }}>
          {loading ? "PROCESSING..." : "PREDICT"}
        </button>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "4px" }}>PREDICTION</div>
              <div style={{ color: "#e8f0fe", fontSize: "18px", fontWeight: "700" }}>{result.prediction}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "#060a14", border: "1px solid #1a2535", padding: "12px" }}>
                <div style={{ color: "#4a6a8a", fontSize: "8px", letterSpacing: "2px" }}>CONFIDENCE</div>
                <div style={{ color: "#00d4aa", fontSize: "20px", fontWeight: "700" }}>{(result.confidence * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: "#060a14", border: "1px solid #1a2535", padding: "12px" }}>
                <div style={{ color: "#4a6a8a", fontSize: "8px", letterSpacing: "2px" }}>SEVERITY</div>
                <div style={{ color: severityColor(result.severity), fontSize: "20px", fontWeight: "700" }}>{result.severity}/5</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>PROBABILITIES</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={result.probabilities} layout="vertical">
                <XAxis type="number" domain={[0, 1]} tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                <YAxis dataKey="diagnosis" type="category" tick={{ fill: "#4a6a8a", fontSize: 8, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="probability" name="Probability">
                  {result.probabilities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function MLflowPanel() {
  const experiments = [
    {
      name: "dermatology-classification",
      runs: [
        { name: "logistic-regression", accuracy: 0.8462, cv_mean: 0.8461, status: "FINISHED" },
        { name: "random-forest", accuracy: 0.8462, cv_mean: 0.8461, status: "FINISHED" },
        { name: "gradient-boosting", accuracy: 0.8462, cv_mean: 0.8461, status: "FINISHED" },
      ]
    },
    {
      name: "cnn-dermatology",
      runs: [
        { name: "resnet18-transfer-learning", accuracy: 0.5679, cv_mean: null, status: "FINISHED" },
      ]
    }
  ]

  return (
    <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "24px", marginTop: "24px", fontFamily: "monospace" }}>
      <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>
        MLFLOW EXPERIMENT TRACKING
      </div>
      {experiments.map((exp, i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <div style={{ color: "#4a9eff", fontSize: "11px", marginBottom: "8px", letterSpacing: "1px" }}>
            ◎ {exp.name}
          </div>
          {exp.runs.map((run, j) => (
            <div key={j} style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "8px", padding: "8px 12px",
              background: "#060a14", border: "1px solid #1a2535",
              marginBottom: "4px"
            }}>
              <div style={{ color: "#e8f0fe", fontSize: "10px" }}>{run.name}</div>
              <div>
                <div style={{ color: "#2a4a6a", fontSize: "8px" }}>ACCURACY</div>
                <div style={{ color: "#00d4aa", fontSize: "11px" }}>{(run.accuracy * 100).toFixed(2)}%</div>
              </div>
              <div>
                <div style={{ color: "#2a4a6a", fontSize: "8px" }}>CV MEAN</div>
                <div style={{ color: "#4a9eff", fontSize: "11px" }}>{run.cv_mean ? (run.cv_mean * 100).toFixed(2) + "%" : "—"}</div>
              </div>
              <div style={{ color: "#00d4aa", fontSize: "9px", letterSpacing: "1px", alignSelf: "center" }}>
                ● {run.status}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function MachineLearning() {
  const [stats, setStats] = useState(null)
  const [models, setModels] = useState([])

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/analysis/statistics`).then(r => setStats(r.data)).catch(() => {})
    axios.get(`${BACKEND}/api/v1/models/`).then(r => setModels(r.data)).catch(() => {})
  }, [])

  const diagnosisData = stats?.diagnosis_distribution
    ? Object.entries(stats.diagnosis_distribution).map(([name, count]) => ({ name: name.slice(0, 14), count }))
    : []

  const modelData = models.map(m => ({
    name: m.model_type?.slice(0, 10) || "Model",
    accuracy: m.accuracy || 0,
    cv_mean: m.cv_mean_score || 0,
  }))

  return (
    <div style={{ flex: 1, background: "#060a14", minHeight: "100vh" }}>
      <Header title="ML Models & Predictions" subtitle="SCIKIT-LEARN · MLFLOW" />
      <div style={{ padding: "32px" }}>

        {/* Model cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {modelData.map((m, i) => (
            <div key={i} style={{
              background: "#0a0e1a", border: "1px solid #1a2535",
              borderTop: `2px solid ${COLORS[i]}`, padding: "20px", fontFamily: "monospace"
            }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>{m.name.toUpperCase()}</div>
              <div style={{ color: "#e8f0fe", fontSize: "28px", fontWeight: "700" }}>
                {(m.accuracy * 100).toFixed(2)}<span style={{ fontSize: "12px", color: "#4a6a8a" }}>%</span>
              </div>
              <div style={{ color: "#4a6a8a", fontSize: "10px", marginTop: "4px" }}>CV MEAN: {(m.cv_mean * 100).toFixed(2)}%</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {diagnosisData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>DIAGNOSIS DISTRIBUTION</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diagnosisData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count">
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>DISTRIBUTION PIE</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={diagnosisData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Prediction simulator */}
        <PredictionSimulator />
        <MLflowPanel />

      </div>
    </div>
  )
}