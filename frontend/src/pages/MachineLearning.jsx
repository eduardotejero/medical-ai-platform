import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts"

const BACKEND = "http://localhost:8000"

const COLORS = ["#00d4aa", "#4a9eff", "#aa44ff", "#ffaa00", "#ff4444", "#44ffaa", "#ff44aa"]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#0a0e1a", border: "1px solid #1a2535",
        padding: "10px 14px", fontFamily: "monospace", fontSize: "11px"
      }}>
        <div style={{ color: "#4a6a8a", marginBottom: "4px" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

export default function MachineLearning() {
  const [stats, setStats] = useState(null)
  const [models, setModels] = useState([])

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/analysis/statistics`)
      .then(r => setStats(r.data))
      .catch(() => {})
    axios.get(`${BACKEND}/api/v1/models/`)
      .then(r => setModels(r.data))
      .catch(() => {})
  }, [])

  const diagnosisData = stats?.diagnosis_distribution
    ? Object.entries(stats.diagnosis_distribution).map(([name, count]) => ({ name: name.slice(0, 12), count }))
    : []

  const modelData = models.map(m => ({
    name: m.model_type?.slice(0, 10) || "Model",
    accuracy: m.accuracy || 0,
    cv_mean: m.cv_mean_score || 0,
  }))

  return (
    <div style={{ flex: 1, background: "#060a14", minHeight: "100vh" }}>
      <Header title="ML Models & Analytics" subtitle="SCIKIT-LEARN · MLFLOW" />
      <div style={{ padding: "32px" }}>

        {/* Model comparison */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>
            MODEL PERFORMANCE
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
            {modelData.map((m, i) => (
              <div key={i} style={{
                background: "#0a0e1a",
                border: "1px solid #1a2535",
                borderTop: `2px solid ${COLORS[i]}`,
                padding: "20px",
                fontFamily: "monospace"
              }}>
                <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>{m.name.toUpperCase()}</div>
                <div style={{ color: "#e8f0fe", fontSize: "28px", fontWeight: "700" }}>
                  {(m.accuracy * 100).toFixed(2)}<span style={{ fontSize: "12px", color: "#4a6a8a" }}>%</span>
                </div>
                <div style={{ color: "#4a6a8a", fontSize: "10px", marginTop: "4px" }}>
                  CV MEAN: {(m.cv_mean * 100).toFixed(2)}%
                </div>
              </div>
            ))}
          </div>

          {modelData.length > 0 && (
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>ACCURACY COMPARISON</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modelData}>
                  <XAxis dataKey="name" tick={{ fill: "#4a6a8a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                  <YAxis domain={[0.8, 0.9]} tick={{ fill: "#4a6a8a", fontSize: 10, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" fill="#00d4aa" name="Accuracy" />
                  <Bar dataKey="cv_mean" fill="#4a9eff" name="CV Mean" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Diagnosis distribution */}
        {diagnosisData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>DIAGNOSIS DISTRIBUTION</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={diagnosisData} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count">
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>DISTRIBUTION PIE</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={diagnosisData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "#2a4a6a" }}
                  >
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!stats && (
          <div style={{ color: "#2a4a6a", fontFamily: "monospace", fontSize: "12px", letterSpacing: "2px", textAlign: "center", padding: "60px" }}>
            LOADING DATA...
          </div>
        )}
      </div>
    </div>
  )
}